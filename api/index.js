/**
 * Vercel Serverless Function - Express API Handler
 * Wraps the ZMusic backend Express app for Vercel serverless deployment
 */

import '../src/init.js';

import express from 'express';
import cors from 'cors';
import { handleRoute } from '../src/routes/index.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.all('/api*', async (req, res) => {
  try {
    const url = new URL(req.originalUrl, `https://${req.headers.host}`);
    await handleRoute(req, res, url, req.method, req.body);
  } catch (error) {
    console.error(`[Vercel API] Error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'vercel' });
});

export default app;
