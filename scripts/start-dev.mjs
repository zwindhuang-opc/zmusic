/**
 * Dynamic Port Startup Script
 *
 * PORT PINNING (FIXED — 2026-08-10):
 *   Reads FRONTEND_PORT and BACKEND_PORT from .env. If set, uses exactly
 *   those ports, KILLING any existing process on them first. This ensures
 *   the user's browser always points at the same URL, eliminating the
 *   "blank page / not connected" problem caused by dynamic port changes.
 *
 *   If FRONTEND_PORT is NOT set, falls back to the ORIGINAL dynamic
 *   assignment from the safe range 4200-4999.
 *
 * Usage: node scripts/start-dev.mjs
 *
 * @module scripts/start-dev
 * @version 2.0.0
 */

import net from 'node:net';
import { spawn, execSync } from 'node:child_process';
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
 * Kill any existing process listening on a given port (Windows).
 * Uses netstat + taskkill — safe, non-destructive (kills node processes only).
 * @param {number} port - Port to clear
 */
function killPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
      encoding: 'utf8',
      timeout: 5000,
    });
    const pids = new Set();
    output.split('\n').forEach(line => {
      const match = line.trim().match(/\s(\d+)\s*$/);
      if (match) {
        const pid = parseInt(match[1], 10);
        const proc = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf8', timeout: 3000 });
        if (proc.includes('node.exe') || proc.includes('node ')) {
          pids.add(pid);
        }
      }
    });
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf8', timeout: 3000 });
        console.log(`  🔧 Killed node on port ${port} (PID ${pid})`);
      } catch { /* already gone */ }
    }
  } catch { /* port was free — nothing to kill */ }
}

/**
 * Pick a random port from the safe range and verify it's available.
 * @returns {Promise<number>} Available port
 */
async function pickRandomPort() {
  const range = PORT_RANGE_MAX - PORT_RANGE_MIN + 1;
  const start = PORT_RANGE_MIN + Math.floor(Math.random() * range);
  for (let i = 0; i < 50; i++) {
    const port = start + i;
    if (port > PORT_RANGE_MAX) break;
    if (FORBIDDEN_PORTS.has(port)) continue;
    if (await isPortAvailable(port)) return port;
  }
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
    pinned: true,
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

/** Clean up the port file on exit. */
function cleanup() {
  try { if (existsSync(PORT_FILE)) unlinkSync(PORT_FILE); } catch { /* ignore */ }
}

/**
 * Main entry point.
 *   If FRONTEND_PORT is set in .env → use those exact ports (pinning).
 *   Otherwise → dynamic assignment from safe range.
 */
async function main() {
  // Load .env (dotenv-style without extra dep)
  const envPath = join(PROJECT_ROOT, '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const m = line.match(/^\s*([A-Z_][A-Z_0-9]*)\s*=\s*['"]?([^'"\r\n]+)['"]?/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2];
      }
    });
  }

  const pinnedFrontend = process.env.FRONTEND_PORT ? parseInt(process.env.FRONTEND_PORT, 10) : null;
  const pinnedBackend = process.env.BACKEND_PORT ? parseInt(process.env.BACKEND_PORT, 10) : null;

  let frontendPort, backendPort;

  if (pinnedFrontend) {
    console.log('\n  🔒 [Pinned Port Mode]');
    console.log(`     FRONTEND_PORT=${pinnedFrontend} (from .env)`);
    if (pinnedBackend) console.log(`     BACKEND_PORT=${pinnedBackend} (from .env)`);

    // Kill existing processes on pinned ports
    killPort(pinnedFrontend);
    if (pinnedBackend && pinnedBackend !== pinnedFrontend) killPort(pinnedBackend);
    await new Promise(r => setTimeout(r, 1500));

    if (FORBIDDEN_PORTS.has(pinnedFrontend)) {
      console.error(`  ❌ Port ${pinnedFrontend} is in the forbidden list (5500-5502, etc.)`);
      process.exit(1);
    }

    if (!(await isPortAvailable(pinnedFrontend))) {
      console.error(`  ❌ Port ${pinnedFrontend} is still occupied after kill attempt`);
      console.error('     Please close the process manually or choose a different port in .env');
      process.exit(1);
    }

    frontendPort = pinnedFrontend;
    backendPort = pinnedBackend || (pinnedFrontend + 1);
    if (FORBIDDEN_PORTS.has(backendPort) || !(await isPortAvailable(backendPort))) {
      // Find next available port
      for (let p = backendPort + 1; p < backendPort + 20; p++) {
        if (!FORBIDDEN_PORTS.has(p) && await isPortAvailable(p)) {
          backendPort = p;
          break;
        }
      }
    }
  } else {
    console.log('\n  🚦 [CentralizedHub Dynamic Port Manager]');
    console.log('     Scanning for available ports in range 4200-4999...');
    console.log('     Forbidden ports: 5500-5502, 5173, 3000, 8000, 42XXX reserved');
    console.log('     💡 TIP: Set FRONTEND_PORT=4720 in .env to PIN ports permanently\n');

    frontendPort = await pickRandomPort();
    let bp = frontendPort + 1;
    while (FORBIDDEN_PORTS.has(bp) || !(await isPortAvailable(bp))) bp++;
    backendPort = bp;
  }

  console.log(`\n  ✅ Frontend : ${frontendPort}`);
  console.log(`  ✅ Backend  : ${backendPort}`);
  if (pinnedFrontend) console.log('  🔒 Ports are PINNED — URL will NOT change on restart\n');

  writePortFile(frontendPort, backendPort);

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

  // Give backend a 1-second head start
  await new Promise((r) => setTimeout(r, 1000));

  // Start frontend
  const frontend = spawn('npx', ['vite'], {
    cwd: PROJECT_ROOT,
    env,
    stdio: 'inherit',
    shell: true,
  });

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
