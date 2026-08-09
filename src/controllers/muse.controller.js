/**
 * MuseController - Backend proxy for muse.top (atmob.com) AI song generation.
 *
 * ARCHITECTURE:
 *   - PRIMARY: CDP bridge to user's EXISTING Edge browser (port 9222)
 *     Makes authenticated API calls via browser context with all cookies.
 *     No new browser is launched - connects to what's already running.
 *   - FALLBACK: Direct API calls with extracted token + cookies
 *   - MOCK: Simulated responses for frontend testing
 *
 * API CONTRACT (reverse-engineered from muse.top JS bundle):
 *   Host:           https://project-api.atmob.com
 *   Base paths:
 *     /project/song/v1   - authenticated user + generation
 *     /project/song/v30  - configs + polling
 *
 *   Auth:            HTTP header "AuthToken: <jwt>"
 *   App-Key header:  "App-Key: 8e33a5e60ef347df808d14026f27d227"
 *   Response shape:  { code, msg, data, traceId }
 *                     code===0 success; code===1006 login expired
 *
 * @module controllers/muse.controller
 * @version 2.0.0
 * @author ZMusic Team
 */

import { config } from '../config/index.js';
import Logger from '../utils/logger.js';
import { createRequire } from 'module';
import { connectCDP, fetchFromEdge, checkLogin as cdpCheckLogin, extractAuthToken, disconnect as cdpDisconnect } from '../services/museCdpBridge.js';

const require = createRequire(import.meta.url);
const logger = new Logger('MuseController');

/** muse.top API host (no trailing slash). */
const MUSE_HOST = (config.museBaseUrl || 'https://project-api.atmob.com').replace(/\/+$/, '');
/** Public app key (from muse.top JS bundle - not secret). */
const MUSE_APP_KEY = config.museAppKey || '8e33a5e60ef347df808d14026f27d227';
/** User auth JWT (fallback when CDP is unavailable). */
let MUSE_TOKEN = config.museApiKey || '';
/** Whether CDP bridge is available and connected. */
let cdpReady = false;
/** Cached login info from CDP. */
let cachedLoginInfo = null;

// ===========================================================================
// CDP Bridge - Primary method for all Muse API calls
// ===========================================================================

/**
 * Ensure the CDP bridge is connected to the user's existing Edge browser.
 * Connects to port 9222 which is the user's ALREADY RUNNING Edge.
 * Does NOT launch any new browser window.
 * @returns {Promise<boolean>}
 */
async function ensureCDP() {
  if (cdpReady) return true;
  try {
    await connectCDP(9222);
    cdpReady = true;
    logger.info('[CDP] Connected to existing Edge on port 9222');

    // Cache login info. checkLogin now extracts the AuthToken JWT from the
    // page's localStorage and sends it as the AuthToken header — without it
    // the muse.top gateway returns code=1006 (login expired) even though the
    // user is fully logged in via cookies.
    cachedLoginInfo = await cdpCheckLogin();
    const li = cachedLoginInfo || {};
    logger.info(
      `[CDP] Login status: loggedIn=${li.loggedIn} credits=${li.credits}` +
      ` tokenFound=${li.tokenFound} tokenSource=${li.tokenSource || 'none'}` +
      ` pageOrigin=${li.pageOrigin || 'n/a'}`
    );
    if (!li.loggedIn) {
      // Surface the raw muse.top response so we can see exactly why auth
      // failed (e.g. code 1006 vs network error vs missing token).
      logger.warn(
        `[CDP] Not logged in — code=${li.code} msg=${li.msg}` +
        ` error=${li.error || 'n/a'} responseBody=${li.responseBody || li.rawBody || 'n/a'}`
      );
    }
    return true;
  } catch (e) {
    logger.warn(`[CDP] Failed to connect: ${e.message}`);
    cdpReady = false;
    return false;
  }
}

/**
 * Make an authenticated Muse API call via CDP bridge (browser context).
 * Includes all cookies automatically (including HttpOnly session cookies).
 * 
 * @param {string} path - API path (e.g. /project/song/v1/user/info)
 * @param {object} [body] - POST body
 * @returns {Promise<{status:number, data:object|null, error?:string}>}
 */
async function museCallViaCDP(path, body = {}) {
  const url = `${MUSE_HOST}${path}`;
  logger.info(`[CDP] -> POST ${path}`);

  const loginInfo = cachedLoginInfo || await cdpCheckLogin();

  // Extract the AuthToken JWT from the browser's localStorage. The muse.top
  // API gateway requires this header — cookies alone yield code=1006.
  const tokenInfo = await extractAuthToken();
  const authToken = tokenInfo.token;

  // Build full request body with base fields
  const fullBody = {
    packageName: 'com.xingchat.web.muse',
    appPlatform: 4,
    channelName: 'web',
    machineId: loginInfo.deviceId || 'zmusic-cdp',
    timestamp: Math.floor(Date.now() / 1000),
    nonce: 'zmusic' + Math.random().toString(36).substring(2, 10),
    ...(loginInfo.ssid ? { sid: loginInfo.ssid } : {}),
    ...body,
  };

  const result = await fetchFromEdge(url, {
    method: 'POST',
    body: fullBody,
    authToken,
  });

  if (result.error) {
    logger.error(`[CDP] <- Error: ${result.error}`);
    return { status: 0, data: null, error: result.error };
  }

  try {
    const data = JSON.parse(result.body);
    const codeLabel = data.code === 0 ? 'OK' : data.code === 1006 ? 'LOGIN_EXPIRED' : `CODE_${data.code}`;
    logger.info(`[CDP] <- ${result.status} ${codeLabel} (tokenSource=${tokenInfo.source || 'none'})`);
    if (data.code !== 0 && data.code !== undefined) {
      logger.warn(`[CDP] msg: ${data.msg}`);
    }
    return { status: result.status, data, error: null };
  } catch (e) {
    logger.error(`[CDP] <- Parse error: ${e.message}`);
    return { status: result.status, data: null, error: 'Failed to parse response' };
  }
}

// ===========================================================================
// DIRECT API FALLBACK — when CDP bridge fails, use env MUSE_API_KEY directly
// ===========================================================================

/**
 * Make an authenticated Muse API call directly using env MUSE_API_KEY.
 * This is the FALLBACK path used when CDP bridge can't extract a valid
 * AuthToken from the browser (extractAuthToken fails, times out, returns
 * code=1006, etc.). The .env MUSE_API_KEY was validated as non-expired by
 * the JWT debug tool, so this will always work when the key is valid.
 *
 * @param {string} path - API path (e.g. /project/song/v1/user/info)
 * @param {object} [body] - POST body
 * @returns {Promise<{status:number, data:object|null, error?:string}>}
 */
async function museCallDirect(path, body = {}) {
  const url = `${MUSE_HOST}${path}`;
  logger.info(`[DIRECT] -> POST ${path} (auth=MUSE_API_KEY len=${MUSE_TOKEN.length})`);

  const fullBody = {
    packageName: 'com.xingchat.web.muse',
    appPlatform: 4,
    channelName: 'web',
    machineId: 'zmusic-direct',
    timestamp: Math.floor(Date.now() / 1000),
    nonce: 'zmusic' + Math.random().toString(36).substring(2, 10),
    ...body,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'App-Key': MUSE_APP_KEY,
        ...(MUSE_TOKEN ? { 'AuthToken': MUSE_TOKEN } : {}),
      },
      body: JSON.stringify(fullBody),
      signal: AbortSignal.timeout(20000),
    });

    const raw = await response.text();
    const status = response.status;

    try {
      const data = JSON.parse(raw);
      const codeLabel = data.code === 0 ? 'OK' : data.code === 1006 ? 'LOGIN_EXPIRED' : `CODE_${data.code}`;
      logger.info(`[DIRECT] <- ${status} ${codeLabel}`);
      return { status, data, error: null };
    } catch (parseErr) {
      logger.error(`[DIRECT] <- Parse error: ${parseErr.message} (${raw.substring(0, 200)})`);
      return { status, data: null, error: 'Failed to parse response' };
    }
  } catch (e) {
    logger.error(`[DIRECT] <- Error: ${e.message}`);
    return { status: 0, data: null, error: e.message };
  }
}

/**
 * Unified Muse API call — tries CDP first, then falls back to DIRECT.
 * This is the function all endpoints should use going forward, so neither
 * the user nor the system ever sees a spurious "login expired" error
 * just because the CDP bridge can't extract the AuthToken from the DOM.
 *
 * @param {string} path - API path
 * @param {object} [body] - POST body
 * @returns {Promise<{status:number, data:object|null, error?:string, via:string}>}
 */
async function museCall(path, body = {}) {
  // 1) Try CDP first (browser context, auto-refreshes cookies)
  let via = 'cdp';
  let result = { status: 0, data: null, error: 'cdp not available' };
  try {
    const cdpOk = await ensureCDP();
    if (cdpOk) {
      result = await museCallViaCDP(path, body);
    }
  } catch (e) {
    logger.warn(`[MUSE] CDP call failed: ${e.message} — trying DIRECT fallback`);
  }

  // 2) If CDP gave a code=1006 or failed AND we have a MUSE_API_KEY, fall back
  const cdpFailed = !result.data || result.data?.code === 1006 || result.error;
  const haveDirectKey = Boolean(MUSE_TOKEN && MUSE_TOKEN.length > 100);

  if (cdpFailed && haveDirectKey) {
    via = 'direct';
    logger.info('[MUSE] Switching to DIRECT fallback (MUSE_API_KEY from .env)');
    result = await museCallDirect(path, body);
  }

  return { ...result, via };
}

/**
 * Refresh the MUSE_TOKEN from the environment in case .env was updated.
 * Also allows runtime refresh if the user updates .env without restarting.
 */
function refreshEnvToken() {
  try {
    // Force a re-read of config — or just accept the config.museApiKey
    if (config.museApiKey && config.museApiKey !== MUSE_TOKEN) {
      MUSE_TOKEN = config.museApiKey;
      logger.info(`[MUSE] MUSE_API_KEY refreshed from config (len=${MUSE_TOKEN.length})`);
    }
  } catch { /* ignore */ }
}

// ===========================================================================
// MuseController class
// ===========================================================================

export class MuseController {
  /**
   * GET /api/muse/status
   * Reports configuration status.
   *
   * — ALWAYS returns real credits from the actual Muse API (never guesses / never hardcodes).
   *   Priority:
   *     1. CDP bridge (Edge browser on port 9222 with live session)
   *     2. DIRECT API via JWT from .env MUSE_API_KEY
   *   If both fail we report what we know and configured=false so the UI shows
   *   the real situation instead of inventing a number.
   */
  async status(req, res) {
    refreshEnvToken();
    const cdpConnected = await ensureCDP();
    const haveDirectKey = Boolean(MUSE_TOKEN && MUSE_TOKEN.length > 100);

    // --- Step 1: primary credit source — CDP --------------------------------
    let loginInfo = cachedLoginInfo;
    if (cdpConnected) {
      try {
        loginInfo = await cdpCheckLogin();
        cachedLoginInfo = loginInfo;
      } catch { /* swallow — fall through to direct API */ }
    }

    // --- Step 2: if CDP didn't yield valid credits, DIRECT fallback ---------
    let userFromDirect = null;
    const cdpCreditsOk = loginInfo && loginInfo.loggedIn && typeof loginInfo.credits === 'number' && loginInfo.credits >= 0;
    if (!cdpCreditsOk && haveDirectKey) {
      try {
        const r = await museCallDirect('/project/song/v1/user/info');
        if (r.data?.code === 0 && r.data?.data) {
          userFromDirect = r.data.data;
        }
      } catch { /* swallow — configured=false below */ }
    }

    // Build the final login object from whichever source actually worked.
    // CRITICAL: the single source of truth for spendable credit is
    // `memberInfo.credit` (as reported by muse.top). We explicitly DO NOT
    // add evaluation credits to this number — they are tracked separately.
    let login = null;
    if (cdpCreditsOk) {
      login = {
        loggedIn: true,
        loginStatus: loginInfo.loginStatus || 1,
        credits: loginInfo.credits ?? 0,
        evaluationCreditPaid: loginInfo.evaluationCreditPaid || 0,
        evaluationCreditNoPaid: loginInfo.evaluationCreditNoPaid || 0,
        isMember: loginInfo.isMember || false,
        membershipExpired: loginInfo.membershipExpired || false,
        source: 'cdp',
      };
    } else if (userFromDirect) {
      const mi = userFromDirect.memberInfo || userFromDirect.member_info || {};
      login = {
        loggedIn: true,
        loginStatus: 1,
        credits: mi.credit ?? userFromDirect.credit ?? userFromDirect.credits ?? 0,
        evaluationCreditPaid: mi.evaluationCreditPaid || 0,
        evaluationCreditNoPaid: mi.evaluationCreditNoPaid || 0,
        isMember: mi.isMember || mi.paidMember || userFromDirect.isMember || false,
        membershipExpired: mi.subscription?.expired ?? false,
        source: 'direct',
      };
      // Update cache so subsequent calls skip the work.
      cachedLoginInfo = {
        ...cachedLoginInfo, ...userFromDirect,
        credits: login.credits,
        evaluationCreditPaid: login.evaluationCreditPaid,
        evaluationCreditNoPaid: login.evaluationCreditNoPaid,
        isMember: login.isMember,
        membershipExpired: login.membershipExpired,
      };
    }

    // "configured" = we have real credentials that produced a valid credit
    // number. A public app key alone does NOT count as configured.
    const configured = !!login && login.loggedIn;

    return res.json({
      success: true,
      configured,
      host: MUSE_HOST,
      cdp: {
        connected: cdpConnected,
        port: 9222,
        browserType: 'Edge (existing)',
      },
      direct: {
        hasKey: haveDirectKey,
      },
      login,
    });
  }

  /**
   * GET /api/muse/user
   * Fetch logged-in user's profile + credit balance via CDP.
   */
  async getUser(req, res) {
    const cdpOk = true;
    try {
      // Use unified museCall — tries CDP first, falls back to DIRECT
      const result = await museCall('/project/song/v1/user/info');
      if (result.data?.code === 0) {
        cachedLoginInfo = {
          ...cachedLoginInfo,
          ...result.data.data,
          credits: result.data.data.memberInfo?.credit || result.data.data.credit || 0,
          evaluationCreditPaid: result.data.data.memberInfo?.evaluationCreditPaid || 0,
          evaluationCreditNoPaid: result.data.data.memberInfo?.evaluationCreditNoPaid || 0,
          isMember: result.data.data.memberInfo?.isMember || false,
          membershipExpired: result.data.data.memberInfo?.subscription?.expired || false,
        };
      }
      return this.sendMuseResult(res, 'user/info', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * GET /api/muse/styles
   * Fetch style catalog.
   */
  async getStyles(req, res) {
    try {
      const result = await museCall('/project/song/v30/song/style');
      return this.sendMuseResult(res, 'song/style', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * GET /api/muse/fast-config
   * Quick Mode configuration.
   */
  async getFastConfig(req, res) {
    try {
      const result = await museCall('/project/song/v30/song/fast/config');
      return this.sendMuseResult(res, 'song/fast/config', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * GET /api/muse/master-config
   * Master Mode configuration.
   */
  async getMasterConfig(req, res) {
    try {
      const result = await museCall('/project/song/v30/song/master/config');
      return this.sendMuseResult(res, 'song/master/config', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * GET /api/muse/templates
   * Song structure templates.
   */
  async getTemplates(req, res) {
    try {
      const result = await museCall('/project/song/v30/song/structure/template/list');
      return this.sendMuseResult(res, 'song/structure/template/list', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * GET /api/muse/explore
   * Public works gallery.
   */
  async getExplore(req, res) {
    try {
      const q = req.museQuery || req.query || {};
      const page = parseInt(q.page || '1', 10);
      const pageSize = parseInt(q.page_size || q.pageSize || '10', 10);
      const result = await museCall('/project/song/v30/explore/web/work/page', { page, page_size: pageSize });
      return this.sendMuseResult(res, 'explore/web/work/page', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * POST /api/muse/generate
   * Generate a song via the user's Edge browser context.
   * Body: { mode, prompt, lyrics, style, title, vocal, languageId, audioWeight, instrumental, structureId, songModel }
   */
  async generate(req, res) {
    const {
      mode = 'quick',
      prompt = '',
      lyrics = '',
      style = '',
      title = '',
      songModel = 'general',
      instrumental = false,
    } = req.body || {};

    if (mode === 'quick' && (!prompt || prompt.length < 5)) {
      return res.status(400).json({ success: false, error: 'Quick mode requires prompt (>=5 chars)' });
    }
    if (mode === 'master' && !lyrics) {
      return res.status(400).json({ success: false, error: 'Master mode requires lyrics' });
    }

    // CDP + DIRECT FALLBACK: unified museCall handles both methods.
    // When CDP returns code=1006 (login expired), it automatically falls back
    // to .env MUSE_API_KEY — which the JWT debugger confirmed is valid until 2027.
    try {
      refreshEnvToken(); // Pick up any .env updates

      // Build generate body
      let endpoint, body;
      if (mode === 'master') {
        endpoint = '/project/song/v1/song/generate';
        body = { lyrics, style, title: title || prompt?.substring(0, 20) || 'Untitled', instrumental: instrumental ? 1 : 0 };
      } else {
        endpoint = '/project/song/v1/song/deepseek/generate';
        body = { description: prompt, songModel, instrumental: instrumental ? 1 : 0, ...(style ? { style } : {}) };
      }

      logger.info(`[generate/${mode}] Calling ${endpoint}...`);
      const result = await museCall(endpoint, body);

      if (result.error) {
        logger.error(`[generate/${mode}] Error: ${result.error} (via=${result.via})`);
        return res.status(502).json({ success: false, error: result.error });
      }

      if (result.data?.code === 0) {
        logger.info(`[generate/${mode}] Success via ${result.via}: ${JSON.stringify(result.data.data).substring(0, 200)}`);
        return res.json({ success: true, data: result.data.data, label: `generate/${mode}/${result.via}`, generationMethod: result.via });
      }

      if (result.data?.code === 1006) {
        logger.warn(`[generate/${mode}] LOGIN_EXPIRED even after CDP+DIRECT chain — token needs manual refresh in muse.top`);
      }

      return this.sendMuseResult(res, `generate/${mode}`, result);
    } catch (e) {
      logger.error(`[generate/${mode}] Exception: ${e.message}`);
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * GET /api/muse/task/:id
   * Poll generation task status.
   */
  async queryTask(req, res) {
    const taskId = req.params?.id || req.params?.taskId;
    if (!taskId) {
      return res.status(400).json({ success: false, error: 'Task id required' });
    }

    try {
      refreshEnvToken();
      const result = await museCall('/project/song/v30/work/tasks/query', { taskId, page: 1, page_size: 5 });

      if (result.data?.code === 1006) {
        logger.warn('[task/query] LOGIN_EXPIRED');
        cachedLoginInfo = null;
        const fallback = await museCall('/project/song/v1/song/info', { workId: taskId, taskId });
        return this.sendMuseResult(res, 'song/info (fallback)', fallback);
      }

      return this.sendMuseResult(res, 'work/tasks/query', result);
    } catch (e) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * Helper: Normalize muse API response into HTTP response.
   */
  sendMuseResult(res, label, result) {
    if (result.status >= 400 && result.data?.code === undefined) {
      return res.status(result.status).json({ success: false, error: result.data?.error || `HTTP ${result.status}`, label });
    }
    if (result.data?.code !== 0 && result.data?.code !== undefined) {
      return res.status(502).json({
        success: false,
        error: result.data.msg || `Muse code ${result.data.code}`,
        code: result.data.code,
        traceId: result.data.traceId,
        label,
      });
    }
    return res.json({ success: true, data: result.data?.data, traceId: result.data?.traceId, label });
  }
}

export default new MuseController();