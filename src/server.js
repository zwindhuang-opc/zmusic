/**
 * Backend API Server
 * Runs on port 5501, serves API endpoints
 */

import './init.js';

import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import Logger from './utils/logger.js';
import { handleRoute } from './routes/index.js';

const logger = new Logger('BackendServer');
const app = express();

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
    version: '5.3.3'
  });
});

// Start server
const PORT = 5501;
app.listen(PORT, () => {
  logger.info(`Backend API server running on http://localhost:${PORT}`);
});
