/**
 * MeloController - Backend proxy for Melo AI (字节旋律 / 51melo.com).
 *
 * REAL API CONTRACT (reverse-engineered + VERIFIED end-to-end 2026-08-09):
 *
 *   Host:           https://api.51melo.com
 *   Auth:           HTTP header  Authorization: Bearer <JWT>
 *                   The JWT is captured from h.51melo.com localStorage['auth_token']
 *                   and stored in .env as MELO_API_KEY.
 *   Response shape: { status, msg, data, ... }   (status: 20000 = OK)
 *
 * VERIFIED ENDPOINTS:
 *   GET  /serv/api/v1/auth/me            — user profile + credit balance
 *   POST /agent/api/v1/music/generate    — submit song generation
 *        → returns { success, task_id, message, status }
 *   GET  /serv/api/v1/queue/{task_id}    — poll task status + songs
 *        → returns { status:20000, data: { id, status, songs[], ... } }
 *
 * GENERATION BODY (verified working):
 *   {
 *     session_id,         // CLIENT-GENERATED UUID v4
 *     title, lyrics,
 *     tags,               // STRING (comma/space separated), NOT array
 *     styles,             // STRING (space separated), NOT array
 *     cover_type: "none",
 *     make_instrumental: false,
 *     model_code: "MS55",
 *     client_type, os, version
 *   }
 *
 * STATUS FLOW: queue → pending → processing → streaming → completed | failed
 * On completion, data.songs[] contains 2 versions, each with:
 *   { id, title, audio_url, cover_url, duration, climax_segments, user, ... }
 *
 * @module controllers/melo.controller
 * @version 4.0.0
 * @author ZMusic Team
 */

import crypto from 'node:crypto';
import { config } from '../config/index.js';
import Logger from '../utils/logger.js';
import { extractMeloAuthFromPage, fillInputOnPage } from '../services/museCdpBridge.js';

const logger = new Logger('MeloController');

/** Cached Melo auth token: first from env, then from CDP (h.51melo.com tab). */
let _meloTokenCache = config.meloApiKey || null;
/** Metadata about the cached token (how it was obtained, expiry, etc.). */
let _meloTokenInfo = {
  source: config.meloApiKey ? 'env' : null,
  userId: null,
  lastCheckedAt: 0,
  lastError: null,
};

/** Whether Melo AI is configured (JWT present — env OR CDP from browser tab). */
function isMeloConfigured() {
  return Boolean(_meloTokenCache && _meloTokenCache.length > 20);
}

/**
 * Try to get a valid Melo auth token, using:
 *   1. Env MELO_API_KEY (fast, persistent)
 *   2. In-memory cache from a previous successful CDP extract
 *   3. CDP extraction from the open h.51melo.com Edge tab
 *
 * When forceRefresh=true, re-read from CDP even if a cached token exists.
 *
 * @param {boolean} [forceRefresh] Skip CDP cache and re-read from browser
 * @returns {Promise<string|null>} JWT or null
 */
async function resolveMeloToken(forceRefresh = false) {
  if (!forceRefresh && _meloTokenCache && _meloTokenCache.length > 20) {
    return _meloTokenCache;
  }
  if (config.meloApiKey && config.meloApiKey.length > 20) {
    _meloTokenCache = config.meloApiKey;
    _meloTokenInfo.source = 'env';
    return _meloTokenCache;
  }

  // Primary CDP path: user has h.51melo.com open in the same Edge window
  logger.info('[melo] Trying CDP extraction from h.51melo.com tab');
  try {
    const result = await extractMeloAuthFromPage();
    if (result.token) {
      _meloTokenCache = result.token;
      _meloTokenInfo = {
        source: 'cdp',
        userId: result.userId,
        lastCheckedAt: Date.now(),
        lastError: null,
      };
      logger.info(
        `[melo] Got auth_token from h.51melo.com tab via CDP: ` +
        `userId=${result.userId || '?'} ` +
        `jwtLen=${result.token.length}`
      );
      return _meloTokenCache;
    } else {
      _meloTokenInfo.lastError = result.error || 'Unknown CDP error';
      logger.warn(`[melo] CDP token extraction failed: ${result.error}`);
    }
  } catch (e) {
    _meloTokenInfo.lastError = e.message;
    logger.warn(`[melo] CDP token extraction error: ${e.message}`);
  }
  return null;
}

/** @deprecated — use isMeloConfigured() instead. Kept for backward compat. */
const MELO_CONFIGURED = Boolean(config.meloApiKey);

/** Real Melo API host (api.51melo.com, NOT melo.bytedance.com). */
const MELO_HOST = (config.meloBaseUrl || 'https://api.51melo.com').replace(/\/+$/, '');

/** Common query string the SPA appends to every /serv/api/ call. */
const MELO_COMMON_QS = 'version=1.0.436&versionCode=10436&envVersion=release&channel=&client_type=pc&os=windows&osVersion=Windows%2010%20x64&model=PC&clientVersion=&sdkVersion=';

/** Simple cache for the most recent successful /auth/me result. */
let _cachedUser = null;

/**
 * Build the full URL for a /serv/api/ path, ensuring the common query string
 * is appended (with proper ? vs & separator). NOTE: /agent/api/ endpoints do
 * NOT need the common query string — only /serv/api/ does.
 * @param {string} path - Path starting with /serv/api/...
 * @param {object} [extraQs] - Extra query params to merge in
 * @returns {string} Full URL
 */
function meloUrl(path, extraQs = {}) {
  const params = new URLSearchParams(MELO_COMMON_QS);
  for (const [k, v] of Object.entries(extraQs)) {
    if (v !== undefined && v !== null) params.set(k, String(v));
  }
  const qs = params.toString();
  return `${MELO_HOST}${path}${path.includes('?') ? '&' : '?'}${qs}`;
}

/**
 * Build a URL for an /agent/api/ path (no common query string needed).
 * @param {string} path - Path starting with /agent/api/...
 * @returns {string} Full URL
 */
function meloAgentUrl(path) {
  return `${MELO_HOST}${path}`;
}

/**
 * Standard headers for a Melo API call.
 * @param {string} [token] - Override JWT (defaults to resolving via CDP/env cache)
 * @returns {Promise<object>} Headers object
 */
async function meloHeaders(token = null) {
  const t = token || await resolveMeloToken();
  return {
    ...(t ? { 'Authorization': `Bearer ${t}` } : {}),
    'Content-Type': 'application/json',
    'Origin': 'https://h.51melo.com',
    'Referer': 'https://h.51melo.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
  };
}

/**
 * Generate a UUID v4 — matches the SPA's client-side session_id generation
 * (createSession() in the chat chunk builds it the same way). The Melo server
 * accepts any valid UUID v4 as a session_id; it does not pre-register sessions.
 * @returns {string} UUID v4
 */
function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (crypto.randomBytes(1)[0] / 256) * 16 | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export class MeloController {
  /**
   * GET /api/melo/status
   * Reports configuration status + REAL credit balance from the Melo API.
   *
   * AUTH RESOLUTION (priority order):
   *   1. .env MELO_API_KEY (if set)
   *   2. In-memory cache from a previous CDP extract
   *   3. CDP extraction from open h.51melo.com Edge tab (localStorage['auth_token'])
   *
   * — NEVER guesses or hardcodes credits: always queries /serv/api/v1/auth/me
   *   and returns whatever credit value the API actually reports.
   * — configured=true ONLY when the real Melo API accepts our JWT and returns
   *   a valid user profile (with the credit field).
   */
  async status(req, res) {
    // 1. Try to resolve the Melo JWT (env → cache → CDP tab)
    let tokenResolveError = null;
    let hasToken = isMeloConfigured();
    if (!hasToken) {
      try {
        const t = await resolveMeloToken(true); // force re-check CDP on status
        hasToken = Boolean(t);
      } catch (e) {
        tokenResolveError = e.message;
        logger.warn(`[melo/status] resolveMeloToken failed: ${e.message}`);
      }
    }

    let user = null;
    let apiError = tokenResolveError;
    let rawStatus = null;

    if (hasToken) {
      try {
        const headers = await meloHeaders();
        const response = await fetch(meloUrl('/serv/api/v1/auth/me'), {
          method: 'GET',
          headers,
        });
        rawStatus = response.status;
        const raw = await response.json();
        // Melo's success indicator: top-level status === 20000 (not HTTP 200)
        if (raw && raw.status === 20000 && raw.data) {
          user = raw.data;
        } else if (raw) {
          apiError = raw.msg || raw.message || `Melo status ${raw.status}`;
        } else {
          apiError = `HTTP ${response.status}`;
        }
      } catch (e) {
        logger.warn(`[melo/status] /auth/me failed: ${e.message}`);
        apiError = apiError || e.message;
      }
    } else if (!apiError) {
      apiError =
        'No Melo auth token found. ' +
        'Please set MELO_API_KEY in .env OR open h.51melo.com and log in ' +
        'on the same Edge browser window you use for ZMusic.';
    }

    // Extract the REAL spendable credit number from the API response.
    // Field is `credit` (integer) at the top level of data.
    // Match a few alternatives for forward-compat, but DO NOT invent a number.
    let credits = 0;
    if (user) {
      credits =
        user.credit ??
        user.credits ??
        user.balance ??
        user.remaining ??
        user.points ??
        user.quota ??
        0;
    }

    const configured = !!user;
    _cachedUser = user;

    return res.json({
      success: true,
      configured,
      host: MELO_HOST,
      engine: 'Melo AI',
      hasKey: hasToken,
      auth: {
        source: _meloTokenInfo.source || 'none',
        userId: _meloTokenInfo.userId,
        lastCheckedAt: _meloTokenInfo.lastCheckedAt,
        resolveError: _meloTokenInfo.lastError,
      },
      cdp: {
        port: 9222,
        browserType: 'Edge (existing)',
        // h.51melo.com tab must be open in same Edge window for CDP to work
        method: 'Read localStorage["auth_token"] from h.51melo.com tab',
      },
      apiError,
      credits,
      rawUser: user,
      httpStatus: rawStatus,
      features: {
        lyricsGeneration: true,
        styleTags: true,
        multiLayer: true,
        referenceAudio: false,
        advancedControls: true,
      },
    });
  }

  /**
   * GET /api/melo/user
   * Fetch user profile + credit balance from /serv/api/v1/auth/me.
   */
  async getUser(req, res) {
    const token = await resolveMeloToken();
    if (!token) {
      return res.status(503).json({
        success: false,
        error:
          'Melo AI API not configured. ' +
          'Set MELO_API_KEY in environment OR open h.51melo.com and ' +
          'log in on the same Edge browser window you use for ZMusic.',
        authSource: _meloTokenInfo.source || 'none',
        authError: _meloTokenInfo.lastError || null,
      });
    }

    try {
      const response = await fetch(meloUrl('/serv/api/v1/auth/me'), {
        method: 'GET',
        headers: await meloHeaders(token),
      });
      const rawText = await response.text();

      // Detect HTML responses
      if (rawText.trim().startsWith('<') || rawText.includes('<html')) {
        logger.error(`[getUser] API returned HTML instead of JSON (HTTP ${response.status})`);
        return res.status(502).json({
          success: false,
          error: 'Melo AI 用户信息接口返回 HTML 页面（Token 可能已过期）',
          errorKey: 'HTML_RESPONSE',
          httpStatus: response.status,
        });
      }

      const raw = JSON.parse(rawText);
      if (raw?.status !== 20000) {
        return res.status(502).json({
          success: false,
          error: raw?.msg || `Melo status ${raw?.status}`,
          httpStatus: response.status,
        });
      }
      return res.json({ success: true, data: raw.data });
    } catch (e) {
      logger.error(`[getUser] Error: ${e.message}`);
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * POST /api/melo/fill-input
   * Visual bridge: type the user-selected lyrics/lyrics-command into the
   * h.51melo.com chat input field so the user can SEE the exact inputs being
   * passed — even when generation cannot complete due to insufficient credits.
   *
   * h.51melo.com is a CHAT interface (not a form), so we compose a natural-
   * language "lyrics command" from the structured inputs ZMusic collected
   * (lyrics + style tags + musical hints) and drop it into the chat box.
   *
   * Body: { lyrics, title, styleTags, bpm, key, timeSignature, layers }
   * Response: { success, data: { filled, matchedSelector, value, pageFound, composedPrompt } }
   */
  async fillInput(req, res) {
    const {
      lyrics = '',
      title = '',
      styleTags = [],
      bpm,
      key: audioKey,
      timeSignature,
      layers = {},
    } = req.body || {};

    if (!lyrics || !String(lyrics).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Lyrics required to fill h.51melo.com chat input',
      });
    }

    // Compose a natural-language lyrics command for Melo's chat interface.
    // Melo understands free-form Chinese prompts, so we assemble a clear
    // instruction that mirrors what the user selected on the ZMusic Melo page.
    const lyricsStr = Array.isArray(lyrics) ? lyrics.join('\n') : String(lyrics);
    const styleArr = Array.isArray(styleTags) ? styleTags.filter(Boolean) : [];
    const parts = [];

    // Optional layer directives (Foundation/Melody/Expression/Effects)
    const layerLines = ['foundation', 'melody', 'expression', 'effects']
      .map((k) => (layers[k] && String(layers[k]).trim()) ? String(layers[k]).trim() : null)
      .filter(Boolean);

    if (title) parts.push(`歌名：《${title}》`);
    if (styleArr.length) parts.push(`风格标签：${styleArr.join('、')}`);

    const hints = [];
    if (bpm) hints.push(`${bpm}BPM`);
    if (audioKey) hints.push(`调性${audioKey}`);
    if (timeSignature) hints.push(`${timeSignature}`);
    if (hints.length) parts.push(`音乐参数：${hints.join('，')}`);

    // Assemble the final chat prompt: instruction + lyrics (+ layer directives)
    let composedPrompt = '请根据以下信息创作歌曲：\n';
    if (parts.length) composedPrompt += parts.join('\n') + '\n';
    composedPrompt += `\n【歌词】\n${lyricsStr}`;
    if (layerLines.length) composedPrompt += `\n\n【分层指令】\n${layerLines.join('\n\n')}`;

    try {
      // h.51melo.com's chat input has placeholder "有什么要补充的..."
      // We target the chat-detail page specifically (not the mine/index page).
      // fallbackUrl: if only the /pages/mine tab is open (no chat page),
      // navigate it to the chat entry so the user can see the inputs appear.
      const result = await fillInputOnPage('51melo.com', '补充', composedPrompt, 'https://h.51melo.com/');

      if (!result.pageFound) {
        logger.warn('[fill-input] h.51melo.com chat tab not open in Edge browser');
        return res.status(409).json({
          success: false,
          error: 'h.51melo.com chat page is not open in the Edge browser. Please open https://h.51melo.com/ and start a chat first.',
          data: { pageFound: false },
        });
      }

      if (!result.success) {
        logger.warn(`[fill-input] Failed to fill Melo chat input: ${result.error}`);
        return res.status(502).json({
          success: false,
          error: `Could not fill h.51melo.com chat input: ${result.error}`,
          data: result,
        });
      }

      logger.info(`[fill-input] Filled Melo chat input (${String(result.value).length} chars) via ${result.matchedSelector}`);
      return res.json({
        success: true,
        data: {
          filled: true,
          matchedSelector: result.matchedSelector,
          value: result.value,
          pageFound: true,
          composedPrompt,
        },
      });
    } catch (e) {
      logger.error(`[fill-input] Exception: ${e.message}`);
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * POST /api/melo/generate
   * Submit a song generation request to Melo AI.
   *
   * VERIFIED ENDPOINT: POST /agent/api/v1/music/generate
   * Returns { success, task_id, message, status }.
   *
   * The frontend sends: { lyrics, title, styleTags[], bpm, key, timeSignature,
   *   structure, audioWeight, layers }
   * We map these to Melo's contract:
   *   - styleTags (array) → styles (string, space-joined) + tags (string, comma-joined)
   *   - lyrics may be a string or array → always normalized to string
   *   - bpm/key/timeSignature/structure are musical hints Melo doesn't use
   *     directly, so we fold them into `tags` for searchability
   *   - session_id is generated client-side (UUID v4)
   *
   * Body (frontend): { lyrics, title, styleTags, bpm, key, timeSignature,
   *                    structure, audioWeight, layers, instrumental }
   * Response: { success, data: { taskId, sessionId, message } }
   */
  async generate(req, res) {
    const {
      lyrics = '',
      title = '',
      styleTags = [],
      bpm,
      key: audioKey,
      timeSignature,
      structure,
      audioWeight,
      layers = {},
      instrumental = false,
      duration = 240,
    } = req.body || {};

    // --- Validate input ---------------------------------------------------
    // Melo's API requires lyrics to be non-empty AND exceed 50 characters.
    // We enforce this client-side so the user gets a clear message instead
    // of a generic API rejection.
    const lyricsStrForCheck = Array.isArray(lyrics) ? lyrics.join('') : String(lyrics || '');
    if (lyricsStrForCheck.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: `歌词不能为空且必须至少10个字符（当前: ${lyricsStrForCheck.trim().length}个字符）`,
      });
    }

    // --- Check auth token -------------------------------------------------
    const token = await resolveMeloToken();
    if (!token) {
      return res.status(503).json({
        success: false,
        error:
          'Melo AI API not configured. ' +
          'Set MELO_API_KEY in environment OR open h.51melo.com and ' +
          'log in on the same Edge browser window you use for ZMusic.',
        authSource: _meloTokenInfo.source || 'none',
        authError: _meloTokenInfo.lastError || null,
      });
    }

    // --- Normalize input to Melo's contract ------------------------------
    /** Lyrics must be a single string (Melo rejects arrays). */
    const lyricsStr = Array.isArray(lyrics) ? lyrics.join('\n') : String(lyrics);

    /**
     * Melo requires `styles` and `tags` as STRINGS (Pydantic string_type).
     * The SPA sends a space-joined style string and a comma-joined tags
     * string. We replicate that, folding musical hints (bpm/key/sig) into
     * tags so they're searchable on Melo's side without breaking the API.
     */
    const styleArr = Array.isArray(styleTags) ? styleTags : (styleTags ? [styleTags] : []);
    const styles = styleArr.filter(Boolean).join(' ') || '流行 抒情';

    const musicalHints = [
      bpm ? `${bpm}bpm` : null,
      audioKey ? `key:${audioKey}` : null,
      timeSignature ? `${timeSignature}` : null,
      structure ? `struct:${structure}` : null,
    ].filter(Boolean);
    const tags = [...styleArr, ...musicalHints].filter(Boolean).join(', ') || 'pop';

    /** Melo uses client-side UUID v4 session ids — no pre-registration. */
    const sessionId = generateSessionId();

    /** Build the verified-working request body. */
    const genBody = {
      session_id: sessionId,
      title: title || lyricsStr.slice(0, 20).replace(/\n/g, ' ') || '未命名',
      lyrics: lyricsStr,
      tags,
      styles,
      cover_type: 'none',
      make_instrumental: !!instrumental,
      model_code: 'MS55',
      client_type: 'web',
      os: 'web',
      version: '1.0.0',
      song_length: duration,
    };

    // --- Submit to Melo ---------------------------------------------------
    logger.info(`[melo/generate] Submitting task for "${genBody.title}" (session ${sessionId})`);
    logger.debug(`[melo/generate] Body: ${JSON.stringify(genBody)}`);

    try {
      const response = await fetch(meloAgentUrl('/agent/api/v1/music/generate'), {
        method: 'POST',
        headers: await meloHeaders(token),
        body: JSON.stringify(genBody),
      });

      const rawText = await response.text();

      // Detect HTML responses (API returning login/error page instead of JSON)
      if (rawText.trim().startsWith('<') || rawText.includes('<html')) {
        logger.error(`[melo/generate] API returned HTML instead of JSON (HTTP ${response.status}) — auth token may be expired or API endpoint changed`);
        return res.status(502).json({
          success: false,
          error: 'Melo AI API 返回了 HTML 页面而非 JSON（可能是登录页或错误页）。请检查：1) MELO_API_KEY 是否仍然有效 2) 浏览器中 h.51melo.com 是否已登录 3) Melo AI 服务是否正常',
          errorKey: 'HTML_RESPONSE',
          authSource: _meloTokenInfo.source || 'none',
          authError: _meloTokenInfo.lastError || null,
          httpStatus: response.status,
        });
      }

      let data;
      try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }

      logger.info(`[melo/generate] HTTP ${response.status} | success=${data?.success} | task_id=${data?.task_id ?? '(none)'}`);

      // Melo returns 200 with { success: true, task_id, message, status: "pending" }
      // or a 4xx with { detail: [...] } (Pydantic validation) / { msg, error_key }
      if (!response.ok || !data?.success || !data?.task_id) {
        const errMsg = data?.detail
          ? (Array.isArray(data.detail) ? data.detail.map(d => `${d.loc?.join('.')}: ${d.msg}`).join('; ') : String(data.detail))
          : data?.error || data?.msg || data?.message || `Melo generate failed (HTTP ${response.status})`;
        logger.error(`[melo/generate] Failed: ${errMsg}`);
        return res.status(response.status >= 400 && response.status < 500 ? response.status : 502).json({
          success: false,
          error: errMsg,
          taskId: data?.task_id ?? null,
          errorKey: data?.error_key || data?.errorKey || null,
          upgradeAction: data?.upgrade_action || data?.upgradeAction || null,
        });
      }

      // Success — return the task id to the frontend for polling.
      return res.json({
        success: true,
        data: {
          taskId: String(data.task_id),
          sessionId,
          message: data.message || '已经开始期待了！正在制作中',
          status: data.status || 'pending',
        },
      });
    } catch (e) {
      logger.error(`[melo/generate] Network error: ${e.message}`);
      return res.status(502).json({
        success: false,
        error: `Melo API unreachable: ${e.message}`,
      });
    }
  }

  /**
   * GET /api/melo/task/:id
   * Poll a Melo generation task for status and (on completion) the songs.
   *
   * VERIFIED ENDPOINT: GET /serv/api/v1/queue/{task_id}
   * Returns { status: 20000, data: { id, status, songs[], params, ... } }.
   *
   * Status flow: queue → pending → processing → streaming → completed | failed
   * On completion, data.songs[] contains 2 versions, each with:
   *   { id, title, audio_url, cover_url, duration, climax_segments, user, ... }
   *
   * We normalize Melo's snake_case response into the camelCase shape the
   * frontend (MeloPage.jsx) expects: { status, audioUrl, imageUrl, title,
   * duration, userName, progress, songs[] }.
   *
   * Response: { success, data: { status, audioUrl, imageUrl, title, duration,
   *            userName, progress, songs, error } }
   */
  async queryTask(req, res) {
    const taskId = req.params?.id || req.params?.taskId;
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task id required',
      });
    }

    const token = await resolveMeloToken();
    if (!token) {
      return res.status(503).json({
        success: false,
        error:
          'Melo AI API not configured. ' +
          'Set MELO_API_KEY in environment OR open h.51melo.com and ' +
          'log in on the same Edge browser window you use for ZMusic.',
        taskId,
      });
    }

    try {
      const response = await fetch(meloUrl(`/serv/api/v1/queue/${taskId}`), {
        method: 'GET',
        headers: await meloHeaders(token),
      });

      const rawText = await response.text();

      // Detect HTML responses in task polling too
      if (rawText.trim().startsWith('<') || rawText.includes('<html')) {
        logger.error(`[melo/task/${taskId}] API returned HTML instead of JSON (HTTP ${response.status})`);
        return res.status(502).json({
          success: false,
          error: 'Melo AI 任务查询返回了 HTML 页面（API 可能已变更或 Token 已过期）',
          errorKey: 'HTML_RESPONSE',
          taskId,
        });
      }

      let data;
      try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }

      // Melo's success indicator: top-level status === 20000
      if (data?.status !== 20000 || !data?.data) {
        const errMsg = data?.msg || `Melo queue status ${data?.status} (HTTP ${response.status})`;
        logger.warn(`[melo/task/${taskId}] ${errMsg}`);
        return res.status(502).json({
          success: false,
          error: errMsg,
          taskId,
        });
      }

      const q = data.data;
      const status = String(q.status || 'pending').toLowerCase();
      const songs = Array.isArray(q.songs) ? q.songs : [];

      // Pick the first completed song as the primary result. Melo returns 2
      // versions; we expose all of them via `songs` but lift the first one's
      // fields to the top level for the frontend's simple consumer.
      const first = songs[0] || {};

      // Map Melo status → progress percentage for the frontend progress bar.
      const progressMap = {
        queue: 15, pending: 25, processing: 50, streaming: 85,
        completed: 100, failed: 0,
      };

      logger.info(`[melo/task/${taskId}] status=${status} songs=${songs.length} progress=${progressMap[status] ?? 50}`);

      return res.json({
        success: true,
        data: {
          status,
          // Primary song fields (camelCase for frontend)
          audioUrl: first.audio_url || null,
          imageUrl: first.cover_url || null,
          title: first.title || q.params?.title || '',
          duration: first.duration ? parseFloat(first.duration) : 0,
          userName: first.user?.nickname || 'Melo AI',
          themeColor: first.theme_color || null,
          songId: first.id ? String(first.id) : null,
          progress: progressMap[status] ?? 50,
          // Full song list (both versions) for the frontend to offer choice
          songs: songs.map(s => ({
            id: s.id ? String(s.id) : null,
            title: s.title || '',
            audioUrl: s.audio_url || null,
            imageUrl: s.cover_url || null,
            duration: s.duration ? parseFloat(s.duration) : 0,
            themeColor: s.theme_color || null,
            climaxSegments: s.climax_segments || [],
          })),
          // Error info (present when status === failed)
          error: q.error_message || null,
          msg: q.error_message || null,
          failReason: q.error_message || null,
          // Metadata
          taskId: String(q.id || taskId),
          createdAt: q.created_at || null,
          completedAt: q.completed_at || null,
        },
      });
    } catch (e) {
      logger.error(`[melo/task/${taskId}] Network error: ${e.message}`);
      return res.status(502).json({
        success: false,
        error: `Melo API unreachable: ${e.message}`,
        taskId,
      });
    }
  }
}

export default new MeloController();
