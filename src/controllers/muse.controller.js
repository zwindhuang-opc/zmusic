/**
 * MuseController - Backend proxy for muse.top (atmob.com) AI song generation.
 *
 * WHY A BACKEND PROXY:
 *   - muse.top's API does NOT send CORS headers, so browser fetch() is blocked.
 *   - The user JWT (MUSE_API_KEY) must stay server-side, never exposed to the client.
 *   - Lets us add detailed step-by-step logging for failure排查 (per project convention).
 *
 * API CONTRACT (reverse-engineered from muse.top JS bundle):
 *   Host:           https://project-api.atmob.com
 *   Base paths:
 *     /central/open/v1   - public (event/push, user/code, user/login)
 *     /project/song/v1   - authenticated user + generation (user/info, song/generate, ...)
 *     /project/song/v30  - configs + polling (song/style, song/fast/config, work/tasks/query)
 *
 *   Auth:            HTTP header "AuthToken: <jwt>"  (NOT "Authorization: Bearer")
 *   App-Key header:  "App-Key: 8e33a5e60ef347df808d14026f27d227"  (public, from muse.top JS)
 *   POST body:       every POST body is merged with buildBaseRequest() fields:
 *                     { packageName, appPlatform, channelName, machineId, authToken }
 *
 *   Response shape:  { code, msg, data, traceId }
 *                     code===0 success; code===1006 login expired; code===2002 SMS code invalid
 *
 *   Generation:
 *     Quick Mode  -> POST /project/song/v1/song/deepseek/generate  (DeepSeek thinks lyrics first)
 *     Master Mode -> POST /project/song/v1/song/generate           (user provides lyrics)
 *     Upload Mode -> POST /project/song/v1/song/upload/generate    (from reference audio)
 *
 *   Polling:        POST /project/song/v30/work/tasks/query  (note: requires fresh login
 *                   session for some accounts; we fall back to song/info if it returns 1006)
 *
 * @module controllers/muse.controller
 * @version 1.0.0
 * @author ZMusic Team
 */

import { config } from '../config/index.js';
import Logger from '../utils/logger.js';

const logger = new Logger('MuseController');

/** muse.top API host (no trailing slash). */
const MUSE_HOST = (config.museBaseUrl || 'https://project-api.atmob.com').replace(/\/+$/, '');
/** Public app key (from muse.top JS bundle - not secret). */
const MUSE_APP_KEY = config.museAppKey || '8e33a5e60ef347df808d14026f27d227';
/** User auth JWT (per-user, must be supplied via .env MUSE_API_KEY). */
const MUSE_TOKEN = config.museApiKey || '';

/**
 * Decode the JWT payload (without verifying signature) to extract the
 * device id, tenant id, etc. — these go into every POST body.
 * Returns {} if the token is malformed or missing.
 */
function decodeJwt(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return {};
  try {
    const part = token.split('.')[1];
    const padded = part + '='.repeat(-part.length % 4);
    return JSON.parse(Buffer.from(padded, 'base64url').toString('utf-8'));
  } catch (e) {
    logger.warn(`JWT decode failed: ${e.message}`);
    return {};
  }
}

/**
 * Build the base request body fields that muse.top's axios interceptor
 * merges into EVERY POST request. Reverse-engineered from the `f(t)`
 * (buildBaseRequest) function in muse.top's JS bundle.
 *
 * @param {object} [extra] - Endpoint-specific fields to merge on top.
 * @returns {object} Body ready to JSON.stringify for POST.
 */
function buildBaseRequest(extra = {}) {
  const payload = decodeJwt(MUSE_TOKEN);
  return {
    packageName: 'com.xingchat.web.muse',
    appPlatform: 4,
    channelName: '',
    // machineId: prefer JWT's `did` (device bound to this account), fall back to a stable UUID
    machineId: payload.did || 'zmusic-proxy-device',
    authToken: MUSE_TOKEN,
    ...extra,
  };
}

/**
 * Headers sent on every muse.top API request.
 * The "AuthToken" header is the actual auth mechanism (NOT "Authorization: Bearer").
 */
function museHeaders() {
  return {
    AuthToken: MUSE_TOKEN,
    'App-Key': MUSE_APP_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Origin: 'https://muse.top',
    Referer: 'https://muse.top/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) zmusic-proxy/1.0',
  };
}

/**
 * Centralised fetch helper that logs every step (per project convention:
 * "Generation process must include detailed logging at each key step to
 * facilitate failure排查").
 *
 * @param {string} label - Human-readable label for log lines.
 * @param {string} path - Path under MUSE_HOST (e.g. "/project/song/v1/user/info").
 * @param {object} [opts] - { method, body } — body is an object, will be JSON.stringify'd.
 * @returns {Promise<{status:number, data:object}>} Parsed response.
 */
async function museFetch(label, path, opts = {}) {
  const url = `${MUSE_HOST}${path}`;
  const method = opts.method || 'POST';
  // muse.top REQUIRES the buildBaseRequest fields in EVERY POST body, even when
  // the endpoint takes no extra parameters (e.g. user/info). So we always
  // serialise a body for POST — never send undefined.
  const isPost = method.toUpperCase() === 'POST';
  const body = isPost ? JSON.stringify(buildBaseRequest(opts.body || {})) : undefined;

  logger.info(`[${label}] -> ${method} ${url}`);
  if (isPost) {
    // Log the endpoint-specific fields (NOT the authToken — redacted for safety)
    const safeBody = { ...(opts.body || {}) };
    delete safeBody.authToken;
    logger.info(`[${label}] body fields: ${JSON.stringify(safeBody)}`);
  }

  let response;
  try {
    response = await fetch(url, { method, headers: museHeaders(), body });
  } catch (e) {
    logger.error(`[${label}] network error: ${e.message}`);
    throw new Error(`Muse network error: ${e.message}`);
  }

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  // code:0 = success; 1006 = login expired; 2002 = SMS code invalid; -1 = server error
  const code = data?.code;
  const codeLabel = code === 0 ? 'OK'
    : code === 1006 ? 'LOGIN_EXPIRED'
      : code === 2002 ? 'SMS_CODE_INVALID'
        : code === -1 ? 'INTERNAL_ERROR'
          : `CODE_${code}`;
  logger.info(`[${label}] <- ${response.status} ${codeLabel} traceId=${data?.traceId || '-'}`);
  if (code !== 0 && code !== undefined) {
    logger.warn(`[${label}] muse msg: ${data?.msg || '(no msg)'}`);
  }

  return { status: response.status, data };
}

/**
 * Send a JSON response, normalising muse.top's {code,msg,data} envelope
 * into our {success, ...} convention. Non-zero muse code -> 502 + error.
 */
function sendMuseResult(res, label, { status, data }) {
  if (status >= 400 && status < 500 && data?.code === undefined) {
    // Pure HTTP error (e.g. 404) — pass through
    return res.status(status).json({ success: false, error: data?.error || `HTTP ${status}`, label });
  }
  if (data?.code !== 0 && data?.code !== undefined) {
    return res.status(502).json({
      success: false,
      error: data.msg || `Muse code ${data.code}`,
      code: data.code,
      traceId: data.traceId,
      label,
    });
  }
  return res.json({ success: true, data: data.data, traceId: data.traceId, label });
}

/**
 * MuseController - Express-style controller with one method per endpoint.
 *
 * Each method is async and writes (req, res) -> JSON. All muse.top calls
 * go through museFetch() which logs every step.
 */
export class MuseController {
  /**
   * GET /api/muse/status
   * Reports whether MUSE_APP_KEY and MUSE_API_KEY are configured.
   * Does NOT call muse.top (no network) — pure config check.
   */
  async status(req, res) {
    const payload = decodeJwt(MUSE_TOKEN);
    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = payload.exp || 0;
    const configured = Boolean(MUSE_TOKEN && MUSE_APP_KEY);
    return res.json({
      success: true,
      configured,
      host: MUSE_HOST,
      appKey: MUSE_APP_KEY ? `${MUSE_APP_KEY.slice(0, 8)}...` : null,
      tokenPresent: Boolean(MUSE_TOKEN),
      tokenExpiresAt: expSec ? new Date(expSec * 1000).toISOString() : null,
      tokenExpired: expSec ? nowSec > expSec : null,
      tokenDaysLeft: expSec ? Math.max(0, Math.floor((expSec - nowSec) / 86400)) : null,
      uid: payload.uid || null,
    });
  }

  /**
   * GET /api/muse/user
   * Fetch the logged-in user's profile + credit balance.
   * Endpoint: POST /project/song/v1/user/info
   */
  async getUser(req, res) {
    try {
      const result = await museFetch('user/info', '/project/song/v1/user/info');
      return sendMuseResult(res, 'user/info', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * GET /api/muse/styles
   * Fetch the full style catalog (grouped by genre/流派).
   * Endpoint: POST /project/song/v30/song/style
   */
  async getStyles(req, res) {
    try {
      const result = await museFetch('song/style', '/project/song/v30/song/style');
      return sendMuseResult(res, 'song/style', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * GET /api/muse/fast-config
   * Quick Mode configuration: costCredit, songModel, description limits.
   * Endpoint: POST /project/song/v30/song/fast/config
   */
  async getFastConfig(req, res) {
    try {
      const result = await museFetch('song/fast/config', '/project/song/v30/song/fast/config');
      return sendMuseResult(res, 'song/fast/config', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * GET /api/muse/master-config
   * Master Mode configuration: vocals, languages, audioWeight range.
   * Endpoint: POST /project/song/v30/song/master/config
   */
  async getMasterConfig(req, res) {
    try {
      const result = await museFetch('song/master/config', '/project/song/v30/song/master/config');
      return sendMuseResult(res, 'song/master/config', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * GET /api/muse/templates
   * Song structure templates (原曲优化, 流行RAP, etc.).
   * Endpoint: POST /project/song/v30/song/structure/template/list
   */
  async getTemplates(req, res) {
    try {
      const result = await museFetch('song/structure/template/list', '/project/song/v30/song/structure/template/list');
      return sendMuseResult(res, 'song/structure/template/list', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * GET /api/muse/explore?page=1&page_size=10
   * Public works gallery (does not strictly require credits).
   * Endpoint: POST /project/song/v30/explore/web/work/page
   */
  async getExplore(req, res) {
    try {
      const q = req.museQuery || req.query || {};
      const page = parseInt(q.page || '1', 10);
      const pageSize = parseInt(q.page_size || q.pageSize || '10', 10);
      const result = await museFetch('explore/web/work/page', '/project/song/v30/explore/web/work/page', {
        body: { page, page_size: pageSize },
      });
      return sendMuseResult(res, 'explore/web/work/page', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * POST /api/muse/generate
   * Generate a song. Body: { mode, prompt, lyrics, style, title, vocal, languageId,
   *                         audioWeight, instrumental, structureId, songModel }
   *
   * mode="quick"  -> song/deepseek/generate (DeepSeek thinks lyrics from prompt)
   * mode="master" -> song/generate          (user provides lyrics)
   *
   * Returns the generation taskId which the client polls via /api/muse/task/:id.
   */
  async generate(req, res) {
    const {
      mode = 'quick',
      prompt = '',
      lyrics = '',
      style = '',
      title = '',
      vocal = '',
      languageId,
      audioWeight,
      instrumental = false,
      structureId,
      songModel = 'general',
    } = req.body || {};

    // Validate inputs
    if (!MUSE_TOKEN) {
      return res.status(503).json({ success: false, error: 'MUSE_API_KEY not configured on server' });
    }
    if (mode === 'quick' && (!prompt || prompt.length < 5)) {
      return res.status(400).json({ success: false, error: 'Quick mode requires prompt (>=5 chars)' });
    }
    if (mode === 'master' && !lyrics) {
      return res.status(400).json({ success: false, error: 'Master mode requires lyrics' });
    }

    try {
      let endpoint;
      let body;
      if (mode === 'master') {
        // Master Mode: direct generation with user lyrics
        endpoint = '/project/song/v1/song/generate';
        body = {
          lyrics,
          style,
          title: title || prompt.slice(0, 20) || 'Untitled',
          vocal: vocal || '',         // ""=random, "m"=male, "f"=female
          instrumental: instrumental ? 1 : 0,
          ...(languageId !== undefined ? { languageId } : {}),
          ...(audioWeight !== undefined ? { audioWeight } : {}),
          ...(structureId !== undefined ? { structureId } : {}),
        };
      } else {
        // Quick Mode: DeepSeek thinks lyrics from prompt
        endpoint = '/project/song/v1/song/deepseek/generate';
        body = {
          description: prompt,        // muse.top field name for the inspiration
          songModel,
          instrumental: instrumental ? 1 : 0,
          ...(style ? { style } : {}),
        };
      }

      const result = await museFetch(`generate/${mode}`, endpoint, { body });
      // result.data should contain { taskId } or { workId, taskId }
      return sendMuseResult(res, `generate/${mode}`, result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * GET /api/muse/task/:id
   * Poll a generation task's status. Returns { status, audioUrl, imageUrl, title, ... }.
   *
   * Primary endpoint: POST /project/song/v30/work/tasks/query
   * Fallback (if login expired): POST /project/song/v1/song/info with { songId/workId }
   */
  async queryTask(req, res) {
    const taskId = req.params?.id || req.params?.taskId;
    if (!taskId) {
      return res.status(400).json({ success: false, error: 'Task id required' });
    }

    try {
      // Primary: muse.top's work/tasks/query endpoint
      const result = await museFetch('work/tasks/query', '/project/song/v30/work/tasks/query', {
        body: { taskId, page: 1, page_size: 5 },
      });

      // If login expired (1006), fall back to song/info
      if (result.data?.code === 1006) {
        logger.warn(`[work/tasks/query] login expired, falling back to song/info`);
        const fallback = await museFetch('song/info', '/project/song/v1/song/info', {
          body: { workId: taskId, taskId },
        });
        return sendMuseResult(res, 'song/info (fallback)', fallback);
      }

      return sendMuseResult(res, 'work/tasks/query', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }
}

export default new MuseController();
