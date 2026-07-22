/**
 * Netlify Serverless Function - ZMusic API Handler
 * Wraps the Express backend for Netlify Functions (zero extra dependencies)
 */

import '../../../src/init.js';

import express from 'express';
import cors from 'cors';
import { handleRoute } from '../../../src/routes/index.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.all('/api*', async (req, res) => {
  try {
    const url = new URL(req.originalUrl, `https://${req.headers.host}`);
    await handleRoute(req, res, url, req.method, req.body);
  } catch (error) {
    console.error(`[Netlify API] Error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'netlify' });
});

function createHandler(expressApp) {
  return async function handler(event, context) {
    const req = {
      method: event.httpMethod,
      path: event.path,
      originalUrl: event.path + (event.queryStringParameters ? '?' + new URLSearchParams(event.queryStringParameters).toString() : ''),
      headers: event.headers || {},
      body: event.body ? JSON.parse(event.body) : {},
      query: event.queryStringParameters || {},
      params: {}
    };

    const responsePromise = new Promise((resolve) => {
      const res = {
        _statusCode: 200,
        _headers: {},
        _body: '',
        status(code) { this._statusCode = code; return this; },
        setHeader(name, value) { this._headers[name.toLowerCase()] = String(value); return this; },
        getHeader(name) { return this._headers[name.toLowerCase()]; },
        json(data) {
          this._headers['content-type'] = 'application/json';
          this._body = JSON.stringify(data);
          resolve({ statusCode: this._statusCode, headers: this._headers, body: this._body });
        },
        send(data) {
          if (typeof data === 'object') {
            this._headers['content-type'] = 'application/json';
            this._body = JSON.stringify(data);
          } else {
            this._headers['content-type'] = 'text/plain';
            this._body = String(data);
          }
          resolve({ statusCode: this._statusCode, headers: this._headers, body: this._body });
        },
        end(data) {
          if (data) this._body = String(data);
          resolve({ statusCode: this._statusCode, headers: this._headers, body: this._body });
        }
      };
      expressApp(req, res, (err) => {
        if (err) {
          res.status(500).json({ success: false, error: err.message });
        } else {
          res.status(404).json({ success: false, error: 'Not found' });
        }
      });
    });

    return responsePromise;
  };
}

export const handler = createHandler(app);
