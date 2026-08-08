import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };
import net from 'node:net';

/**
 * CentralizedHub-style Dynamic Port Manager
 * Checks if a port is available; if not, increments until finding a free port.
 * Ports are allocated from a configurable base range to avoid cross-project conflicts.
 *
 * @param {number} preferredPort - User's preferred starting port
 * @param {number} maxAttempts  - How many consecutive ports to try before failing
 * @returns {Promise<number>}   - First available port in the range
 */
async function findAvailablePort(preferredPort, maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = preferredPort + i;
    // Port numbers max out at 65535 per TCP/IP spec
    if (port > 65535) break;
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
 * Vite configuration with dynamic port allocation + centralizedhub integration.
 * - Loads .env via Vite's built-in loader
 * - Auto-increments frontend port if 5500 is occupied
 * - Proxies /api to the backend port (reads BACKEND_PORT from env or defaults)
 * - strictPort is disabled so Vite also uses its built-in fallback
 */
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Frontend port: read env VITE_PORT / PORT, default 5500, then auto-find available
  const preferredFePort = parseInt(env.VITE_PORT || env.PORT || '5500', 10);
  const fePort = await findAvailablePort(preferredFePort);

  // Backend proxy port: read BACKEND_PORT / API_PORT explicitly from env.
  // DO NOT auto-discover this — if BACKEND_PORT is unset we follow the project
  // convention: frontend PORT + 1 (e.g. 5500 → 5501). The backend server.js uses
  // the identical convention so they always line up even if ports drift.
  const bePortRaw = env.BACKEND_PORT || env.API_PORT ||
    (env.PORT ? String(parseInt(env.PORT, 10) + 1) : null) ||
    '5501';
  const bePort = parseInt(bePortRaw, 10) || 5501;

  console.log(`\n  🚦 [CentralizedHub Port Manager]`);
  console.log(`     Frontend : ${preferredFePort === fePort ? fePort : `${preferredFePort} ➜ ${fePort}`} (available)`);
  console.log(`     Backend→  : ${bePort} (proxy target, matches server.js convention)\n`);

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
      proxy: {
        '/api': {
          target: `http://localhost:${bePort}`,
          changeOrigin: true,
          secure: false,
          ws: false,
        },
      },
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