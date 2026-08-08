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
import { connectCDP, fetchFromEdge, checkLogin as cdpCheckLogin, disconnect as cdpDisconnect } from '../services/museCdpBridge.js';

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

    // Cache login info
    cachedLoginInfo = await cdpCheckLogin();
    logger.info(`[CDP] Login status: loggedIn=${cachedLoginInfo.loggedIn} credits=${cachedLoginInfo.credits}`);
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
  });

  if (result.error) {
    logger.error(`[CDP] <- Error: ${result.error}`);
    return { status: 0, data: null, error: result.error };
  }

  try {
    const data = JSON.parse(result.body);
    const codeLabel = data.code === 0 ? 'OK' : data.code === 1006 ? 'LOGIN_EXPIRED' : `CODE_${data.code}`;
    logger.info(`[CDP] <- ${result.status} ${codeLabel}`);
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
// MOCK MODE — simulate muse.top generation without spending credits
// ===========================================================================

/** Whether mock mode is active (env MUSE_MOCK=1). */
const MUSE_MOCK = Boolean(config.museMock);

/** In-memory state for each mock task: how many times it has been polled. */
const mockTaskState = new Map();

/** Fake "completed" songs used by the mock. */
const MOCK_SONGS = [
  { title: '一夢浮生', audioUrl: 'https://www.w3schools.com/html/horse.mp3', imageUrl: 'https://picsum.photos/seed/muse1/400/400', duration: 372, userName: 'ZMusic' },
  { title: '星河漫步', audioUrl: 'https://www.w3schools.com/html/horse.mp3', imageUrl: 'https://picsum.photos/seed/muse2/400/400', duration: 425, userName: 'ZMusic' },
  { title: '晨光序曲', audioUrl: 'https://www.w3schools.com/html/horse.mp3', imageUrl: 'https://picsum.photos/seed/muse3/400/400', duration: 346, userName: 'ZMusic' },
];

const MOCK_POLL_THRESHOLD = 3;

function mockGenerate(params) {
  const taskId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const songIdx = Math.floor(Math.random() * MOCK_SONGS.length);
  mockTaskState.set(taskId, { polls: 0, createdAt: Date.now(), songIdx, params });
  logger.info(`[MOCK] generate → taskId=${taskId}`);
  return { taskId, status: 'pending', mock: true };
}

function mockQueryTask(taskId) {
  let state = mockTaskState.get(taskId);
  if (!state) {
    const song = MOCK_SONGS[0];
    return { status: 'success', ...song, taskId, mock: true };
  }
  state.polls += 1;
  const song = MOCK_SONGS[state.songIdx] || MOCK_SONGS[0];
  if (state.polls < MOCK_POLL_THRESHOLD) {
    return { status: 'processing', progress: Math.round((state.polls / MOCK_POLL_THRESHOLD) * 100), taskId, mock: true };
  }
  mockTaskState.delete(taskId);
  return { status: 'success', title: state.params?.title || song.title, audioUrl: song.audioUrl, imageUrl: song.imageUrl, duration: song.duration, taskId, mock: true };
}

// ===========================================================================
// MuseController class
// ===========================================================================

export class MuseController {
  /**
   * GET /api/muse/status
   * Reports configuration status.
   */
  async status(req, res) {
    const cdpConnected = await ensureCDP();

    // Try to get fresh login info
    let loginInfo = cachedLoginInfo;
    if (cdpConnected) {
      try {
        loginInfo = await cdpCheckLogin();
        cachedLoginInfo = loginInfo;
      } catch { }
    }

    return res.json({
      success: true,
      configured: Boolean(MUSE_APP_KEY),
      host: MUSE_HOST,
      cdp: {
        connected: cdpConnected,
        port: 9222,
        browserType: 'Edge (existing)',
      },
      login: loginInfo ? {
        loggedIn: loginInfo.loggedIn,
        loginStatus: loginInfo.loginStatus || 0,
        credits: loginInfo.credits || 0,
        evaluationCreditPaid: loginInfo.evaluationCreditPaid || 0,
        evaluationCreditNoPaid: loginInfo.evaluationCreditNoPaid || 0,
        totalCredits: (loginInfo.evaluationCreditPaid || 0) + (loginInfo.evaluationCreditNoPaid || 0),
        isMember: loginInfo.isMember || false,
        membershipExpired: loginInfo.membershipExpired || false,
      } : null,
      mock: MUSE_MOCK,
    });
  }

  /**
   * GET /api/muse/user
   * Fetch logged-in user's profile + credit balance via CDP.
   */
  async getUser(req, res) {
    if (MUSE_MOCK) {
      return res.json({
        success: true,
        data: {
          ssid: 'mock-session',
          loginStatus: 0,
          deviceId: 'mock-device',
          memberInfo: { credit: 100, paidMember: true, isMember: true, evaluationCreditPaid: 0, evaluationCreditNoPaid: 0, subscription: { dailyCredit: 100, dailyCreditMax: 500, expired: false } },
        },
        mock: true,
      });
    }

    const cdpOk = await ensureCDP();
    if (!cdpOk) {
      return res.status(503).json({ success: false, error: 'Cannot connect to Edge browser. Please ensure Edge is running.' });
    }

    try {
      const result = await museCallViaCDP('/project/song/v1/user/info');
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
    if (MUSE_MOCK) return res.json({ success: true, data: [], mock: true });
    const cdpOk = await ensureCDP();
    if (!cdpOk) return res.status(503).json({ success: false, error: 'CDP not available' });
    try {
      const result = await museCallViaCDP('/project/song/v30/song/style');
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
    if (MUSE_MOCK) return res.json({ success: true, data: {}, mock: true });
    const cdpOk = await ensureCDP();
    if (!cdpOk) return res.status(503).json({ success: false, error: 'CDP not available' });
    try {
      const result = await museCallViaCDP('/project/song/v30/song/fast/config');
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
    if (MUSE_MOCK) return res.json({ success: true, data: {}, mock: true });
    const cdpOk = await ensureCDP();
    if (!cdpOk) return res.status(503).json({ success: false, error: 'CDP not available' });
    try {
      const result = await museCallViaCDP('/project/song/v30/song/master/config');
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
    if (MUSE_MOCK) return res.json({ success: true, data: [], mock: true });
    const cdpOk = await ensureCDP();
    if (!cdpOk) return res.status(503).json({ success: false, error: 'CDP not available' });
    try {
      const result = await museCallViaCDP('/project/song/v30/song/structure/template/list');
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
    if (MUSE_MOCK) return res.json({ success: true, data: { list: [] }, mock: true });
    const cdpOk = await ensureCDP();
    if (!cdpOk) return res.status(503).json({ success: false, error: 'CDP not available' });
    try {
      const q = req.museQuery || req.query || {};
      const page = parseInt(q.page || '1', 10);
      const pageSize = parseInt(q.page_size || q.pageSize || '10', 10);
      const result = await museCallViaCDP('/project/song/v30/explore/web/work/page', { page, page_size: pageSize });
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

    // Mock mode
    if (MUSE_MOCK) {
      const mockResult = mockGenerate({ mode, prompt, lyrics, style, title });
      return res.json({ success: true, data: mockResult, mock: true });
    }

    // CDP mode - use existing Edge browser
    const cdpOk = await ensureCDP();
    if (!cdpOk) {
      logger.error('[generate] CDP not available');
      return res.status(503).json({ success: false, error: 'Cannot connect to Edge browser. Please ensure Edge is running with muse.top open.' });
    }

    try {
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
      const result = await museCallViaCDP(endpoint, body);

      if (result.error) {
        logger.error(`[generate/${mode}] Error: ${result.error}`);
        return res.status(502).json({ success: false, error: result.error });
      }

      if (result.data?.code === 0) {
        logger.info(`[generate/${mode}] Success: ${JSON.stringify(result.data.data).substring(0, 200)}`);
        return res.json({ success: true, data: result.data.data, label: `generate/${mode}/cdp`, generationMethod: 'cdp' });
      }

      if (result.data?.code === 1006) {
        logger.warn(`[generate/${mode}] LOGIN_EXPIRED - refreshing...`);
        cachedLoginInfo = null;
        const refreshed = await cdpCheckLogin();
        cachedLoginInfo = refreshed;
        if (refreshed.loggedIn) {
          logger.info(`[generate/${mode}] Re-connected, retrying...`);
          const retryResult = await museCallViaCDP(endpoint, body);
          if (retryResult.data?.code === 0) {
            return res.json({ success: true, data: retryResult.data.data, label: `generate/${mode}/cdp/retry` });
          }
        }
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

    if (MUSE_MOCK) {
      return res.json({ success: true, data: mockQueryTask(taskId), mock: true });
    }

    const cdpOk = await ensureCDP();
    if (!cdpOk) {
      return res.status(503).json({ success: false, error: 'CDP not available' });
    }

    try {
      const result = await museCallViaCDP('/project/song/v30/work/tasks/query', { taskId, page: 1, page_size: 5 });

      if (result.data?.code === 1006) {
        logger.warn('[task/query] LOGIN_EXPIRED');
        cachedLoginInfo = null;
        const fallback = await museCallViaCDP('/project/song/v1/song/info', { workId: taskId, taskId });
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