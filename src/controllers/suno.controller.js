/**
 * SunoController - Proxies Suno.cn API calls through the backend
 * Avoids CORS issues by keeping the API key server-side
 */

import { config } from '../config/index.js';
import Logger from '../utils/logger.js';

const logger = new Logger('SunoController');
const SUNO_BASE = 'https://mcp.suno.cn';

function getHeaders() {
  return {
    'Authorization': `Bearer ${config.sunoApiKey}`,
    'Content-Type': 'application/json; charset=utf-8'
  };
}

async function proxyFetch(path, options = {}) {
  const url = `${SUNO_BASE}${path}`;
  logger.info(`Suno proxy: ${options.method || 'GET'} ${path}`);
  
  const response = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...options.headers }
  });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  return { status: response.status, data };
}

export class SunoController {
  async getUser(req, res) {
    try {
      const { status, data } = await proxyFetch('/mcp/api/user');
      res.status(status).json(data);
    } catch (err) {
      res.status(502).json({ error: `Suno backend error: ${err.message}` });
    }
  }

  async generate(req, res) {
    try {
      const { prompt, style, duration, customMode, instrumental } = req.body || {};
      const body = {
        prompt,
        mv: 'chirp-fenix',
        tags: style || undefined,
        custom_mode: customMode || false,
        instrumental: instrumental || false
      };

      const { status, data } = await proxyFetch('/mcp/api/generate', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      res.status(status).json(data);
    } catch (err) {
      res.status(502).json({ error: `Suno backend error: ${err.message}` });
    }
  }

  async queryTask(req, res) {
    try {
      const serialNo = req.params?.serialNo || req.body?.serialNo;
      const wait = req.query?.wait || 0;
      const path = `/mcp/api/task/${serialNo}${wait ? '?wait=45' : ''}`;
      const { status, data } = await proxyFetch(path);
      res.status(status).json(data);
    } catch (err) {
      res.status(502).json({ error: `Suno backend error: ${err.message}` });
    }
  }

  async generateLyrics(req, res) {
    try {
      const { inspiration, style } = req.body || {};
      const { status, data } = await proxyFetch('/mcp/api/gen-lyrics', {
        method: 'POST',
        body: JSON.stringify({ inspiration, style })
      });
      res.status(status).json(data);
    } catch (err) {
      res.status(502).json({ error: `Suno backend error: ${err.message}` });
    }
  }

  async getMusicList(req, res) {
    try {
      const page = req.query?.page || 1;
      const pageSize = req.query?.page_size || 10;
      const { status, data } = await proxyFetch(`/mcp/api/music?page=${page}&page_size=${pageSize}`);
      res.status(status).json(data);
    } catch (err) {
      res.status(502).json({ error: `Suno backend error: ${err.message}` });
    }
  }
}

export default new SunoController();
