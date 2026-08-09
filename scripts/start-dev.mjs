/**
 * Dynamic Port Startup Script
 *
 * Picks a RANDOM available port from a safe range (4200-4999) each time,
 * writes it to a shared file, then starts both the backend and frontend.
 * This ensures:
 *   - NEVER uses 5500, 5501, 5502 (user explicitly forbids these)
 *   - NEVER uses 3XXX or 8XXX ranges (conflict with other projects)
 *   - Different port numbers each run (truly dynamic)
 *   - Frontend and backend always stay in sync via shared port file
 *
 * Usage: node scripts/start-dev.mjs
 *
 * @module scripts/start-dev
 * @version 1.0.0
 */

import net from 'node:net';
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const PORT_FILE = join(PROJECT_ROOT, '.dev-ports.json');

/** Ports that must NEVER be used. */
const FORBIDDEN_PORTS = new Set([
  5500, 5501, 5502,  // User explicitly forbids these
  5173,               // Vite default
  3000, 8000,         // Common dev server ports
  42001,              // Backend reserved
  42002,              // Flutter app reserved
  19000,              // Current server reserved
  42008,              // React web app reserved
]);

/** Safe port range: 4200-4999 (avoids 3XXX, 8XXX, and all reserved). */
const PORT_RANGE_MIN = 4200;
const PORT_RANGE_MAX = 4999;

/**
 * Check if a TCP port is available (nothing listening on it).
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} true if available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    if (!port || port < 1 || port > 65535) return resolve(false);
    if (FORBIDDEN_PORTS.has(port)) return resolve(false);
    const tester = net.createServer();
    tester.unref();
    tester.on('error', () => resolve(false));
    tester.listen(port, () => {
      tester.close(() => resolve(true));
    });
  });
}

/**
 * Pick a random port from the safe range and verify it's available.
 * If the random port is occupied, try the next few sequential ports.
 * @returns {Promise<number>} Available port
 */
async function pickRandomPort() {
  const range = PORT_RANGE_MAX - PORT_RANGE_MIN + 1;
  const start = PORT_RANGE_MIN + Math.floor(Math.random() * range);

  // Try the random port, then scan forward up to 50 ports
  for (let i = 0; i < 50; i++) {
    const port = start + i;
    if (port > PORT_RANGE_MAX) break;
    if (FORBIDDEN_PORTS.has(port)) continue;
    if (await isPortAvailable(port)) return port;
  }

  // If forward scan failed, scan the entire range
  for (let port = PORT_RANGE_MIN; port <= PORT_RANGE_MAX; port++) {
    if (FORBIDDEN_PORTS.has(port)) continue;
    if (await isPortAvailable(port)) return port;
  }

  throw new Error('No available port found in safe range 4200-4999');
}

/**
 * Write the port assignment to the shared file so both processes can read it.
 * @param {number} frontendPort - Frontend port
 * @param {number} backendPort - Backend port
 */
function writePortFile(frontendPort, backendPort) {
  const data = {
    frontendPort,
    backendPort,
    assignedAt: new Date().toISOString(),
    pid: process.pid,
  };
  writeFileSync(PORT_FILE, JSON.stringify(data, null, 2));
}

/**
 * Read the port assignment from the shared file.
 * @returns {{frontendPort:number, backendPort:number}|null}
 */
function readPortFile() {
  try {
    if (!existsSync(PORT_FILE)) return null;
    const raw = readFileSync(PORT_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clean up the port file on exit.
 */
function cleanup() {
  try {
    if (existsSync(PORT_FILE)) unlinkSync(PORT_FILE);
  } catch { /* ignore */ }
}

/**
 * Main entry point: pick ports, write file, start both servers.
 */
async function main() {
  console.log('\n  🚦 [CentralizedHub Dynamic Port Manager]');
  console.log('     Scanning for available ports in range 4200-4999...');
  console.log('     Forbidden ports: 5500-5502, 5173, 3000, 8000, 42XXX reserved\n');

  // Pick two consecutive available ports (frontend + backend)
  const frontendPort = await pickRandomPort();

  // Backend port: try frontend + 1, but skip forbidden ports
  let backendPort = frontendPort + 1;
  while (FORBIDDEN_PORTS.has(backendPort) || !(await isPortAvailable(backendPort))) {
    backendPort++;
    if (backendPort > 65535) {
      backendPort = await pickRandomPort();
      break;
    }
  }

  console.log(`  ✅ Frontend : ${frontendPort}`);
  console.log(`  ✅ Backend  : ${backendPort}`);
  console.log('');

  // Write to shared file so vite.config.js and server.js can read it
  writePortFile(frontendPort, backendPort);

  // Set env vars for child processes
  const env = {
    ...process.env,
    PORT: String(frontendPort),
    BACKEND_PORT: String(backendPort),
    RESOLVED_BACKEND_PORT: String(backendPort),
    VITE_PORT: String(frontendPort),
  };

  // Start backend server
  const backend = spawn('node', ['src/server.js'], {
    cwd: PROJECT_ROOT,
    env,
    stdio: 'inherit',
    shell: false,
  });

  // Start frontend (Vite) — give backend a 1-second head start
  await new Promise((r) => setTimeout(r, 1000));
  const frontend = spawn('npx', ['vite'], {
    cwd: PROJECT_ROOT,
    env,
    stdio: 'inherit',
    shell: true,
  });

  // Cleanup on exit
  const shutdown = (signal) => {
    console.log(`\n  🛑 Received ${signal}, shutting down...`);
    try { backend.kill(signal); } catch { /* ignore */ }
    try { frontend.kill(signal); } catch { /* ignore */ }
    cleanup();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('exit', cleanup);

  backend.on('exit', (code) => {
    console.log(`  Backend exited with code ${code}`);
    cleanup();
    process.exit(code || 0);
  });

  frontend.on('exit', (code) => {
    console.log(`  Frontend exited with code ${code}`);
    cleanup();
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error('  ❌ Failed to start:', err.message);
  cleanup();
  process.exit(1);
});
