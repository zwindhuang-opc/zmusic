/**
 * ZMusic Standalone Backend Server
 * Used for production build (serves built React app + API)
 * In dev, vite.config.js mounts the API via middleware
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import Logger from './utils/logger.js';
import handleRoute from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logger = new Logger('Server');

const distDir = path.join(__dirname, '..', 'dist');

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  return types[ext] || 'application/octet-stream';
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${config.host}:${config.port}`);
  const method = req.method;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API routes
  if (url.pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    try {
      const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await parseBody(req) : {};
      await handleRoute(req, res, url, method, body);
    } catch (error) {
      logger.error(`Server error: ${error.message}`);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    }
    return;
  }

  // Static files from dist
  if (fs.existsSync(distDir)) {
    let filePath = path.join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);
    if (filePath.endsWith('.html') || !path.extname(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath);
      res.setHeader('Content-Type', getContentType(filePath));
      res.writeHead(200);
      res.end(content);
      return;
    }
  }

  // Fallback to index.html (SPA)
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath);
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(content);
  } else {
    res.writeHead(404);
    res.end('Not Found - Run npm run build first');
  }
});

server.listen(config.port, config.host, () => {
  console.log('\n' + '='.repeat(60));
  console.log('  ZMusic AI Platform v1.0.0');
  console.log('  Architecture: MVC (Model-View-Controller)');
  console.log(`  Server: http://${config.host}:${config.port}`);
  console.log('='.repeat(60) + '\n');
  logger.info(`Server started on http://${config.host}:${config.port}`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close(() => process.exit(0));
});
