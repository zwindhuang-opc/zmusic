/**
 * Backend API Server
 * - Supports dynamic port allocation via centralizedhub-style port manager
 * - NEVER uses 5500, 5501, 5502 (forbidden by user)
 * - Reads shared port file (written by scripts/start-dev.mjs) for dynamic ports
 * - Priority: shared port file → RESOLVED_BACKEND_PORT → BACKEND_PORT/API_PORT → auto-find
 * - Never fails due to port conflicts: automatically tries the next 100 ports, then falls back to OS-assigned (0)
 */

import './init.js';

import express from 'express';
import cors from 'cors';
import net from 'net';
import fs from 'fs';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config/index.js';
import Logger, { FileAppender } from './utils/logger.js';
import { handleRoute } from './routes/index.js';
import { initAuthDB } from './services/authdb.service.js';

const logger = new Logger('BackendServer');

// Wire up file appender so all server logs are persisted to logs/server.log
// (log4j-style: console appender + rolling file appender). 5MB rotation.
// Registered GLOBALLY so every Logger instance (controllers, services,
// FrontendError reporter, etc.) writes to the file — not just this one.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOG_DIR = join(__dirname, '..', 'logs');
try { mkdirSync(LOG_DIR, { recursive: true }); } catch { /* already exists */ }
Logger.addGlobalAppender(new FileAppender(join(LOG_DIR, 'server.log'), { maxSize: 5 * 1024 * 1024, fs }));

const app = express();

// Load version from VERSION.json (single source of truth for web + mobile + server)
let APP_VERSION = '0.0.0';
try {
  const versionFile = JSON.parse(readFileSync(join(__dirname, '..', 'VERSION.json'), 'utf8'));
  APP_VERSION = versionFile.version || '0.0.0';
} catch (e) {
  logger.warn('Could not read VERSION.json, using fallback version');
}

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API routes - use middleware pattern for Express 5
app.use('/api', async (req, res) => {
  try {
    const url = new URL(req.originalUrl, `http://${req.headers.host}`);
    await handleRoute(req, res, url, req.method, req.body);
  } catch (error) {
    logger.error(`Server error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiConfigured: true,
    version: APP_VERSION
  });
});

/** Ports that must NEVER be used (user constraint). */
const FORBIDDEN_PORTS = new Set([5500, 5501, 5502, 5173, 3000, 8000]);

/** Path to shared port file written by scripts/start-dev.mjs */
const PORT_FILE = join(__dirname, '..', '.dev-ports.json');

/**
 * CentralizedHub-style dynamic port resolver.
 * Checks whether a TCP port is available (i.e. nothing is listening on it).
 * Also rejects forbidden ports (5500, 5501, 5502).
 *
 * @param {number} port - Candidate port number
 * @returns {Promise<boolean>} true if available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    if (!port || port < 1) resolve(false);
    if (FORBIDDEN_PORTS.has(port)) { resolve(false); return; }
    const tester = net.createServer();
    tester.unref();
    tester.on('error', () => resolve(false));
    tester.listen(port, () => {
      tester.close(() => resolve(true));
    });
  });
}

/**
 * Find first available port starting from preferred, trying next maxAttempts ports.
 * Mimics the @centralizedhub/port-manager quickRegister behaviour locally.
 * Skips forbidden ports (5500, 5501, 5502).
 *
 * @param {number} preferred    - Desired starting port
 * @param {number} maxAttempts  - Max sequential tries (default 100)
 * @returns {Promise<number>}   - Available port, or 0 for OS-assigned
 */
async function findAvailablePort(preferred, maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    const p = preferred + i;
    if (p > 65535) break;
    if (FORBIDDEN_PORTS.has(p)) continue;
    if (await isPortAvailable(p)) return p;
  }
  return 0;
}

/**
 * Read the shared port file written by scripts/start-dev.mjs.
 * @returns {{frontendPort:number, backendPort:number}|null}
 */
function readSharedPortFile() {
  try {
    if (!existsSync(PORT_FILE)) return null;
    const raw = readFileSync(PORT_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Resolve the backend port using the priority chain.
 * Priority:
 *   1. Shared port file (written by scripts/start-dev.mjs) — backendPort field
 *   2. RESOLVED_BACKEND_PORT — set by vite.config.js when frontend+backend start together
 *   3. BACKEND_PORT / API_PORT — from .env
 *   4. PORT + 1 — generic env port + 1 offset
 *   5. 4201 — safe default (NOT 5501, which is forbidden)
 *
 * IMPORTANT: an explicitly configured port (1–3) is treated as PINNED. If it is
 * already occupied we fail fast instead of silently switching to the next free
 * port. Silently switching is worse than crashing: the previous backend keeps
 * answering on the pinned port (the one vite/`.dev-ports.json` point at) while
 * the new process serves on an unseen port — so the app happily runs STALE code
 * with no visible error. Only the generic fallback path (4–5) auto-increments.
 *
 * @returns {Promise<number>} Port to listen on
 */
async function resolveBackendPort() {
  const shared = readSharedPortFile();
  const explicitlyConfigured =
    (shared?.backendPort ? String(shared.backendPort) : null) ||
    process.env.RESOLVED_BACKEND_PORT ||
    process.env.BACKEND_PORT ||
    process.env.API_PORT ||
    null;

  const raw =
    explicitlyConfigured ||
    (process.env.PORT ? String(parseInt(process.env.PORT, 10) + 1) : null) ||
    '4201';
  const preferred = parseInt(raw, 10) || 4201;

  if (await isPortAvailable(preferred)) return preferred;

  if (explicitlyConfigured) {
    logger.error(`Backend port ${preferred} is already in use — refusing to auto-switch ports.`);
    logger.error('A previous backend is most likely still running on it and would keep serving STALE code.');
    logger.error(`Fix:  netstat -ano | findstr :${preferred}   then   taskkill /PID <PID> /F`);
    logger.error('Or change BACKEND_PORT in .env, then restart with: npm start');
    process.exit(1);
  }

  const actual = await findAvailablePort(preferred);
  if (actual !== preferred) {
    logger.warn(`Preferred backend port ${preferred} occupied or forbidden → auto-switched to ${actual}`);
  }
  return actual;
}

// Start server with dynamic port allocation
(async function start() {
  // Ensure auth DB (users / sessions / SMS codes) is initialized BEFORE
  // accepting any requests — guarantees tables exist on cold start.
  try { initAuthDB(); logger.info('AuthDB ready (users / sessions / SMS codes)'); }
  catch (e) { logger.error(`AuthDB init failed: ${e.message}`); }

  const PORT = await resolveBackendPort();
  const server = app.listen(PORT, () => {
    const realPort = server.address().port;
    // Expose the REAL listening port so /api/health reports where the backend
    // actually lives (config.port is the frontend port in the dev setup).
    app.set('backendPort', realPort);
    logger.info(`Backend API server running on http://localhost:${realPort}`);
    logger.info(`  (version ${APP_VERSION} | env: ${config.env})`);
  });
})();
