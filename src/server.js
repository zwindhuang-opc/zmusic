/**
 * Backend API Server
 * Runs on port 5501, serves API endpoints
 */

import './init.js';

import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config/index.js';
import Logger from './utils/logger.js';
import { handleRoute } from './routes/index.js';

const logger = new Logger('BackendServer');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist folder
const distPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../dist');
app.use(express.static(distPath.replace(/^\/([A-Za-z]):/, '$1:')));

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
    version: '5.3.3'
  });
});

// Catch-all for SPA - serve index.html for any non-API route
app.get('*', (req, res) => {
  const indexPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../dist/index.html');
  res.sendFile(indexPath.replace(/^\/([A-Za-z]):/, '$1:'));
});

// Start server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  logger.info(`ZMusic server running on http://localhost:${PORT}`);
});
