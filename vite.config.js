import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };
import net from 'node:net';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __viteFilename = fileURLToPath(import.meta.url);
const __viteDirname = dirname(__viteFilename);
const PORT_FILE = join(__viteDirname, '.dev-ports.json');

/** Ports that must NEVER be used (user constraint). */
const FORBIDDEN_PORTS = new Set([5500, 5501, 5502, 5173, 3000, 8000]);

/**
 * CentralizedHub-style Dynamic Port Manager
 * Checks if a port is available; if not, increments until finding a free port.
 * Ports are allocated from a configurable base range to avoid cross-project conflicts.
 * NEVER uses 5500, 5501, 5502 — these are explicitly forbidden by the user.
 *
 * @param {number} preferredPort - User's preferred starting port
 * @param {number} maxAttempts  - How many consecutive ports to try before failing
 * @returns {Promise<number>}   - First available port in the range
 */
async function findAvailablePort(preferredPort, maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    let port = preferredPort + i;
    // Port numbers max out at 65535 per TCP/IP spec
    if (port > 65535) break;
    // Skip forbidden ports
    if (FORBIDDEN_PORTS.has(port)) continue;
    const available = await new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => resolve(false));
      server.listen(port, () => {
        server.close(() => resolve(true));
      });
    });
    if (available) return port;
  }
  // Final fallback: let OS assign any free port (0)
  return 0;
}

/**
 * Read the shared port file written by scripts/start-dev.mjs.
 * This allows the frontend and backend to agree on ports when started together.
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
 * Vite configuration with dynamic port allocation + centralizedhub integration.
 * - Loads .env via Vite's built-in loader
 * - Reads shared port file (written by scripts/start-dev.mjs) for dynamic ports
 * - Falls back to env VITE_PORT/PORT, then auto-finds available port
 * - NEVER uses 5500, 5501, 5502 (forbidden by user)
 * - Proxies /api to the backend port
 * - strictPort is disabled so Vite also uses its built-in fallback
 */
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Try shared port file first (set by scripts/start-dev.mjs)
  const sharedPorts = readSharedPortFile();

  // Frontend port: shared file → env VITE_PORT/PORT → default 4200 → auto-find
  const preferredFePort = sharedPorts?.frontendPort
    || parseInt(env.VITE_PORT || env.PORT || '4200', 10);
  const fePort = await findAvailablePort(preferredFePort);

  // Backend proxy port: shared file → env BACKEND_PORT/API_PORT → fePort+1
  const bePort = sharedPorts?.backendPort
    || parseInt(env.BACKEND_PORT || env.API_PORT || '0', 10)
    || (fePort + 1);

  console.log(`\n  🚦 [CentralizedHub Port Manager]`);
  console.log(`     Frontend : ${preferredFePort === fePort ? fePort : `${preferredFePort} ➜ ${fePort}`} (available)`);
  console.log(`     Backend→  : ${bePort} (proxy target)`);
  console.log(`     Source    : ${sharedPorts ? 'shared port file' : 'env/default'}\n`);

  return {
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BACKEND_PORT__: JSON.stringify(bePort),
    },
    base: './',
    server: {
      port: fePort,
      host: '0.0.0.0',
      strictPort: false,
      watch: {
        ignored: ['**/edge_profile/**', '**/android/**', '**/ios/**'],
      },
      // Block serving files from the Edge browser profile (debug leftover) so
      // neither the dev server nor its dependency scanner ever touches them.
      fs: {
        deny: ['**/edge_profile/**', '**/.git/**', '**/.history/**'],
      },
      proxy: {
        '/api': {
          target: `http://localhost:${bePort}`,
          changeOrigin: true,
          secure: false,
          ws: false,
        },
      },
    },
    // Restrict the esbuild dependency scanner to the HTML entry only. Vite then
    // follows the import graph from index.html → src/main.jsx → browser modules,
    // so it never crawls edge_profile/ (browser-extension JS with unresolvable
    // dynamic imports) nor backend-only files like src/controllers/* (which import
    // native Node deps such as ffmpeg-static / better-sqlite3).
    optimizeDeps: {
      entries: ['index.html'],
      exclude: ['ffmpeg-static', 'better-sqlite3'],
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      target: 'es2019',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            lucide: ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 2000,
    },
  };
});