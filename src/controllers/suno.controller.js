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
  /**
   * GET /api/suno/status
   * Reports configuration status + REAL credit balance from Suno.cn API.
   *
   * — NEVER guesses or hardcodes credits: always hits /mcp/api/user and
   *   returns whatever credit field the API actually uses.
   * — configured=true ONLY when the real Suno API accepts the key and
   *   returns a user profile.
   */
  async status(req, res) {
    const hasKey = Boolean(config.sunoApiKey);
    let user = null;
    let apiError = null;

    if (hasKey) {
      try {
        const { status, data } = await proxyFetch('/mcp/api/user');
        if (status < 400 && data && typeof data === 'object' && !data.error) {
          user = data?.data || data;
        } else if (data?.error || data?.message || data?.msg) {
          apiError = data.error || data.message || data.msg || `HTTP ${status}`;
        } else if (status >= 400) {
          apiError = `HTTP ${status}`;
        }
      } catch (e) {
        logger.warn(`[suno/status] user failed: ${e.message}`);
        apiError = e.message;
      }
    }

    // Extract the actual credits from the real API response. Match ALL
    // possible field names; DO NOT invent a number. 0 pts from the API is
    // a perfectly valid answer and must be shown, not "improved".
    let credits = 0;
    if (user) {
      credits =
        user.points ??
        user.credit ??
        user.credits ??
        user.memberCredit ??
        user.member_credit ??
        user.balance ??
        user.remaining ??
        user.quota ??
        user.data?.points ??
        user.data?.credit ??
        user.data?.credits ??
        user.user?.points ??
        user.user?.credit ??
        0;
    }

    // "configured" = real API accepted our credentials and gave back profile
    const configured = !!user;

    return res.json({
      success: true,
      configured,
      host: SUNO_BASE,
      hasKey,
      apiError,
      credits,
      rawUser: user,
    });
  }

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
      const { prompt, style, duration, customMode, instrumental, title } = req.body || {};

      // Build the Suno generate body. Include title and duration when provided
      // so the generated song has the correct name and length.
      const body = {
        prompt,
        mv: 'chirp-fenix',
        tags: style || undefined,
        custom_mode: customMode || false,
        instrumental: instrumental || false,
        ...(title ? { title } : {}),
        ...(duration ? { duration: Number(duration) } : {}),
      };

      logger.info(`[suno/generate] prompt="${(prompt || '').substring(0, 50)}..." style="${style || ''}" title="${title || ''}" duration=${duration || 'n/a'}`);
      logger.debug(`[suno/generate] Body: ${JSON.stringify(body)}`);

      const { status, data } = await proxyFetch('/mcp/api/generate', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      // Log the full response so we can see exactly why generation fails
      // (insufficient credits, invalid prompt, rate limit, etc.)
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      if (status >= 400 || (data && data.error)) {
        logger.error(`[suno/generate] HTTP ${status} | error=${data?.error || data?.message || data?.msg || dataStr?.substring(0, 200)}`);
      } else {
        logger.info(`[suno/generate] HTTP ${status} | response=${dataStr?.substring(0, 300)}`);
      }

      res.status(status).json(data);
    } catch (err) {
      logger.error(`[suno/generate] Exception: ${err.message}`);
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
