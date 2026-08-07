/**
 * Backend API Server
 * - Supports dynamic port allocation via centralizedhub-style port manager
 * - Priority: RESOLVED_BACKEND_PORT (from vite.config.js) → BACKEND_PORT/API_PORT (.env) → 5501 default → auto increment
 * - Never fails due to port conflicts: automatically tries the next 100 ports, then falls back to OS-assigned (0)
 */

import './init.js';

import express from 'express';
import cors from 'cors';
import net from 'net';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config/index.js';
import Logger from './utils/logger.js';
import { handleRoute } from './routes/index.js';

const logger = new Logger('BackendServer');
const app = express();

// Load version from VERSION.json (single source of truth for web + mobile + server)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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

/**
 * CentralizedHub-style dynamic port resolver.
 * Checks whether a TCP port is available (i.e. nothing is listening on it).
 *
 * @param {number} port - Candidate port number
 * @returns {Promise<boolean>} true if available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    if (!port || port < 1) resolve(false);
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
 *
 * @param {number} preferred    - Desired starting port
 * @param {number} maxAttempts  - Max sequential tries (default 100)
 * @returns {Promise<number>}   - Available port, or 0 for OS-assigned
 */
async function findAvailablePort(preferred, maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    const p = preferred + i;
    if (p > 65535) break;
    if (await isPortAvailable(p)) return p;
  }
  return 0;
}

/**
 * Resolve the backend port using the priority chain, with automatic fallback.
 * Priority:
 *   1. RESOLVED_BACKEND_PORT — set by vite.config.js when frontend+backend start together
 *   2. BACKEND_PORT / API_PORT — from .env
 *   3. PORT — generic env port + 1 offset (to avoid clash with Vite frontend on same PORT)
 *   4. 5501 — project convention default
 * Then auto-increments until finding a free port.
 */
async function resolveBackendPort() {
  const raw =
    process.env.RESOLVED_BACKEND_PORT ||
    process.env.BACKEND_PORT ||
    process.env.API_PORT ||
    (process.env.PORT ? String(parseInt(process.env.PORT, 10) + 1) : null) ||
    '5501';
  const preferred = parseInt(raw, 10) || 5501;
  const actual = await findAvailablePort(preferred);
  if (actual !== preferred) {
    logger.warn(`Preferred backend port ${preferred} occupied → auto-switched to ${actual}`);
  }
  return actual;
}

// Start server with dynamic port allocation
(async function start() {
  const PORT = await resolveBackendPort();
  const server = app.listen(PORT, () => {
    const realPort = server.address().port;
    logger.info(`Backend API server running on http://localhost:${realPort}`);
    logger.info(`  (version ${APP_VERSION} | env: ${config.env})`);
  });
})();
