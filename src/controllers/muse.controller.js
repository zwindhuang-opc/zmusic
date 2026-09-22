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
import { execFileSync } from 'child_process';
import { connectCDP, fetchFromEdge, checkLogin as cdpCheckLogin, extractAuthToken, disconnect as cdpDisconnect, startKeepalive, recoverSession, updateKeepaliveToken, readDisplayedCredit, fillInputOnPage } from '../services/museCdpBridge.js';
import platformAuth from '../services/platformAuth.service.js';

const require = createRequire(import.meta.url);
const logger = new Logger('MuseController');

/** muse.top API host (no trailing slash). */
const MUSE_HOST = (config.museBaseUrl || 'https://project-api.atmob.com').replace(/\/+$/, '');
/** Public app key (from muse.top JS bundle - not secret). */
const MUSE_APP_KEY = config.museAppKey || '8e33a5e60ef347df808d14026f27d227';
/** User auth JWT (fallback when CDP is unavailable). */
let MUSE_TOKEN = config.museApiKey || '';
// Sync token to keepalive for DIRECT-based keepalive pings
if (MUSE_TOKEN && MUSE_TOKEN.length > 20) {
  updateKeepaliveToken(MUSE_TOKEN);
}
/** Whether CDP bridge is available and connected. */
let cdpReady = false;
/** Cached login info from CDP. */
let cachedLoginInfo = null;

// ===========================================================================
// CDP Bridge - Primary method for all Muse API calls
// ===========================================================================

/**
 * Launch Edge with CDP enabled on port 9222.
 * Called automatically by ensureCDP() when no Edge CDP is detected.
 * Uses a dedicated user-data-dir at D:\EdgeCDP to avoid profile lock conflicts.
 */
function launchEdgeCDP() {
  const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  const edgePath = edgePaths.find(p => {
    try { return require('fs').existsSync(p); } catch { return false; }
  });
  if (!edgePath) {
    logger.warn('[CDP] Microsoft Edge not found on this system');
    return false;
  }

  const userDataDir = 'D:\\EdgeCDP';
  const args = [
    `--remote-debugging-port=9222`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-features=msEdgeStartupBoost,msEdgeSleepingTabs,msEfficiencyMode',
    'https://muse.top/',
  ];

  try {
    const { spawn } = require('child_process');
    const child = spawn(edgePath, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });
    child.unref();
    logger.info(`[CDP] Edge launched with CDP (PID=${child.pid}, user-data-dir=${userDataDir})`);
    return true;
  } catch (e) {
    logger.warn(`[CDP] Failed to launch Edge: ${e.message}`);
    return false;
  }
}

/**
 * Ensure the CDP bridge is connected to the user's existing Edge browser.
 * If no Edge CDP is running, automatically launches one.
 * @returns {Promise<boolean>}
 */
async function ensureCDP() {
  if (cdpReady) return true;

  // First attempt: try connecting to existing Edge CDP
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

    // Start session keepalive — pings every 5 minutes to prevent expiry.
    // Also auto-recovers sessions when loginStatus=0 is detected.
    try {
      startKeepalive(300000); // 5 minutes
      logger.info('[CDP] Session keepalive started (5-min interval)');
    } catch { /* best-effort */ }

    return true;
  } catch (e) {
    logger.warn(`[CDP] Failed to connect: ${e.message}`);

    // Auto-launch Edge CDP if not running, then retry once
    const launched = launchEdgeCDP();
    if (launched) {
      logger.info('[CDP] Waiting 8s for Edge to initialize...');
      await new Promise(r => setTimeout(r, 8000));
      try {
        await connectCDP(9222);
        cdpReady = true;
        logger.info('[CDP] Connected to auto-launched Edge on port 9222');

        cachedLoginInfo = await cdpCheckLogin();
        const li = cachedLoginInfo || {};
        logger.info(
          `[CDP] Login status: loggedIn=${li.loggedIn} credits=${li.credits}` +
          ` tokenFound=${li.tokenFound} tokenSource=${li.tokenSource || 'none'}`
        );

        try {
          startKeepalive(300000);
          logger.info('[CDP] Session keepalive started (5-min interval)');
        } catch { /* best-effort */ }

        return true;
      } catch (e2) {
        logger.warn(`[CDP] Retry after auto-launch also failed: ${e2.message}`);
      }
    }

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
async function museCallViaCDP(path, body = {}, timeoutMs = 60000) {
  const url = `${MUSE_HOST}${path}`;
  logger.info(`[CDP] -> POST ${path} (timeout=${timeoutMs}ms)`);

  const loginInfo = cachedLoginInfo || await cdpCheckLogin();

  // Extract the AuthToken JWT from the browser's localStorage. The muse.top
  // API gateway requires this header — cookies alone yield code=1006.
  const tokenInfo = await extractAuthToken();
  const authToken = tokenInfo.token || loginInfo.authToken;

  // Build full request body with base fields.
  // IMPORTANT: muse.top's web app includes `authToken` in the REQUEST BODY
  // as well as in the AuthToken header. We replicate this behavior to match
  // the web app's request format exactly.
  const fullBody = {
    packageName: 'com.xingchat.web.muse',
    appPlatform: 4,
    channelName: 'web',
    machineId: loginInfo.deviceId || 'zmusic-cdp',
    timestamp: Math.floor(Date.now() / 1000),
    nonce: 'zmusic' + Math.random().toString(36).substring(2, 10),
    ...(authToken ? { authToken } : {}),
    ...(loginInfo.ssid ? { sid: loginInfo.ssid } : {}),
    ...body,
  };

  const result = await fetchFromEdge(url, {
    method: 'POST',
    body: fullBody,
    authToken,
    timeoutMs,
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
  // TOKEN PRIORITY (browser-agnostic):
  //   1. User-provided token via Settings → Platform Auth (platformAuth)
  //   2. CDP-extracted token from browser (if Edge CDP is running)
  //   3. .env MUSE_API_KEY (static fallback)
  let activeToken = MUSE_TOKEN;
  let tokenSource = 'env';

  // 1. Try platformAuth store first (works on ANY browser/device)
  const storedToken = platformAuth.getToken('muse');
  if (storedToken && storedToken.length > 50) {
    activeToken = storedToken;
    tokenSource = 'platformAuth';
  } else {
    // 2. Try CDP extraction (only works if Edge CDP is running)
    try {
      const freshToken = await extractAuthToken();
      if (freshToken?.token && freshToken.token.length > 100 && freshToken.token !== MUSE_TOKEN) {
        logger.info(`[DIRECT] Refreshed token from browser CDP (source=${freshToken.source}, len=${freshToken.token.length})`);
        activeToken = freshToken.token;
        MUSE_TOKEN = freshToken.token;
        tokenSource = 'cdp';
        updateKeepaliveToken(MUSE_TOKEN);
      }
    } catch { /* extraction failure is non-fatal — fall through to .env token */ }
  }

  const url = `${MUSE_HOST}${path}`;
  logger.info(`[DIRECT] -> POST ${path} (auth=${tokenSource} len=${activeToken.length})`);

  // Build full request body. Like the CDP path, include authToken in the
  // body to match muse.top's web app request format.
  const fullBody = {
    packageName: 'com.xingchat.web.muse',
    appPlatform: 4,
    channelName: 'web',
    machineId: 'zmusic-direct',
    timestamp: Math.floor(Date.now() / 1000),
    nonce: 'zmusic' + Math.random().toString(36).substring(2, 10),
    ...(activeToken ? { authToken: activeToken } : {}),
    ...body,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'App-Key': MUSE_APP_KEY,
        ...(activeToken ? { 'AuthToken': activeToken } : {}),
      },
      body: JSON.stringify(fullBody),
      signal: AbortSignal.timeout(20000),
    });

    const raw = await response.text();
    const status = response.status;

    try {
      const data = JSON.parse(raw);
      const codeLabel = data.code === 0 ? 'OK' : data.code === 1006 ? 'LOGIN_EXPIRED' : `CODE_${data.code}`;
      logger.info(`[DIRECT] <- ${status} ${codeLabel} (source=${tokenSource})`);
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
 * Unified Muse API call with smart routing.
 *
 * TOKEN PRIORITY for ALL calls (including generation):
 *   1. DIRECT via platformAuth token (browser-agnostic, server-side stored)
 *   2. DIRECT via .env MUSE_API_KEY
 *   3. CDP bridge (Edge browser port 9222, legacy fallback)
 *
 * Previously generation was forced to CDP-only because the stale .env token
 * always returned code=1006. But with platformAuth tokens (user-pasted fresh
 * from ANY browser), DIRECT works perfectly for generation too.
 *
 * @param {string} path - API path
 * @param {object} [body] - POST body
 * @param {object} [options] - { isGeneration?: boolean, timeoutMs?: number }
 * @returns {Promise<{status:number, data:object|null, error?:string, via:string}>}
 */
async function museCall(path, body = {}, options = {}) {
  const { isGeneration = false, timeoutMs = 60000 } = options;

  // --- STEP 1: Try DIRECT first (works for generation too with platformAuth) ---
  // Check for DIRECT token: platformAuth store → cache → .env
  refreshEnvToken();
  const haveDirectKey = Boolean(MUSE_TOKEN && MUSE_TOKEN.length > 100) ||
    Boolean(platformAuth.getToken('muse'));

  let via = 'direct';
  let result = { status: 0, data: null, error: null };
  let directSucceeded = false;

  if (haveDirectKey) {
    result = await museCallDirect(path, body);
    if (result.data?.code === 0) {
      return { ...result, via };
    }
    // code=1006 on DIRECT: token is expired
    if (result.data?.code === 1006) {
      logger.warn(`[MUSE] DIRECT code=1006 (token expired) — will try CDP fallback`);
    }
    // Other non-zero codes: keep trying
    logger.info(`[MUSE] DIRECT returned code=${result.data?.code}, trying CDP fallback`);
  }

  // --- STEP 2: Try CDP bridge (legacy Edge-only fallback) ---
  try {
    const cdpOk = await ensureCDP();
    if (cdpOk) {
      logger.info(`[MUSE] Trying CDP fallback for ${path}`);
      const cdpTimeout = isGeneration ? timeoutMs : 15000;
      const cdpResult = await museCallViaCDP(path, body, cdpTimeout);
      if (cdpResult.data?.code === 0) {
        return { ...cdpResult, via: 'cdp' };
      }
      // CDP code=1006 → try recovery once
      if (cdpResult.data?.code === 1006) {
        logger.warn(`[MUSE] CDP code=1006 — attempting auto-recovery...`);
        try {
          const recovered = await recoverSession();
          if (recovered) {
            logger.info(`[MUSE] CDP session recovered! Retrying...`);
            const retry = await museCallViaCDP(path, body, cdpTimeout);
            if (retry.data?.code === 0) {
              return { ...retry, via: 'cdp-recovered' };
            }
            return { ...retry, via: 'cdp-recovered-failed' };
          }
        } catch (recoveryErr) {
          logger.warn(`[MUSE] CDP recovery error: ${recoveryErr.message}`);
        }
      }
      return { ...cdpResult, via: 'cdp' };
    }
  } catch (e) {
    logger.warn(`[MUSE] CDP fallback error: ${e.message}`);
  }

  // --- Both failed: return best available error ---
  if (haveDirectKey && result.data) {
    return { ...result, via };
  }
  return {
    status: 0,
    data: null,
    error: 'No authentication available. Go to Settings → Platform Auth and paste your Muse token (works on any browser).',
    via: 'none'
  };
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
      updateKeepaliveToken(MUSE_TOKEN);
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

    // --- PRIMARY: Direct API (more reliable than CDP bridge) ----------------
    // The CDP bridge (Runtime.evaluate with awaitPromise) frequently times out
    // on the user's Edge browser, causing spurious "Not connected" errors.
    // The DIRECT path using MUSE_API_KEY from .env is faster and more reliable.
    // We use CDP only as a secondary source and for session recovery.
    let login = null;
    let userFromDirect = null;

    if (haveDirectKey) {
      try {
        const r = await museCallDirect('/project/song/v1/user/info');
        if (r.data?.code === 0 && r.data?.data) {
          userFromDirect = r.data.data;
          const d = userFromDirect;
          const mi = d.memberInfo || d.member_info || {};

          // --- LOG ALL RAW FIELDS (no more guessing!) ---
          logger.info(`[status] RAW API FIELDS: credit=${d.credit} mi.credit=${mi.credit} ep=${mi.evaluationCreditPaid} en=${mi.evaluationCreditNoPaid} liveCredit=${mi.liveCredit} loginStatus=${d.loginStatus}`);

          // Robust credit detection: Muse uses multiple credit buckets depending on
          // the user's subscription tier. The "displayed" credit the user sees on
          // the website uses a priority chain that we must replicate exactly:
          //   1. liveCredit (instant-generate credits for paid members)
          //   2. evaluationCreditPaid (evaluation tokens bought with real money)
          //   3. evaluationCreditNoPaid (trial/free credits)
          //   4. memberInfo.credit / data.credit (generic credit field)
          //   5. CDP DOM read (what the website actually renders in the sidebar)
          const fallbackLive = mi.liveCredit ?? mi.live_credit ?? 0;
          const fallbackPaid = mi.evaluationCreditPaid ?? mi.evaluation_credit_paid ?? 0;
          const fallbackFree = mi.evaluationCreditNoPaid ?? mi.evaluation_credit_no_paid ?? 0;
          const fallbackGeneric = mi.credit ?? d.credit ?? d.credits ?? mi.credits ?? 0;

          // Priority: paid buckets first (they don't expire easily), then free.
          // Sum if generic credit is 0 (meaning platform uses split buckets).
          let displayedCredit;
          let creditSource;
          if (fallbackGeneric > 0) {
            displayedCredit = fallbackGeneric;
            creditSource = 'api:memberInfo.credit';
          } else if (fallbackLive > 0 || fallbackPaid > 0 || fallbackFree > 0) {
            displayedCredit = fallbackLive + fallbackPaid + fallbackFree;
            creditSource = `api:split(live=${fallbackLive}+paid=${fallbackPaid}+free=${fallbackFree})`;
          } else {
            displayedCredit = 0;
            creditSource = 'api:none';
          }

          if (cdpConnected) {
            try {
              const readResult = await readDisplayedCredit();
              if (readResult.credit > 0) {
                displayedCredit = readResult.credit;
                creditSource = readResult.source;
                logger.info(`[status] CDP DOM credit=${displayedCredit} (source: ${creditSource})`);
              }
            } catch { /* DOM read failed — use API raw */ }
          }

          login = {
            loggedIn: true,
            loginStatus: d.loginStatus ?? 1,
            credits: displayedCredit,
            liveCredit: mi.credit ?? d.credit ?? 0,
            evaluationCreditPaid: mi.evaluationCreditPaid ?? 0,
            evaluationCreditNoPaid: mi.evaluationCreditNoPaid ?? 0,
            isMember: mi.isMember || mi.paidMember || d.isMember || false,
            membershipExpired: mi.subscription?.expired ?? false,
            sessionExpired: (d.loginStatus || 0) === 0,
            source: creditSource,
          };
          cachedLoginInfo = { ...cachedLoginInfo, ...d, credits: displayedCredit };
          logger.info(`[status] Final credit: ${displayedCredit} (source: ${creditSource})`);
        }
      } catch (e) {
        logger.warn(`[status] Direct API failed: ${e.message}`);
      }
    }

    // --- SECONDARY: If DIRECT failed, try CDP -------------------------------
    if (!login && cdpConnected) {
      try {
        const loginInfo = await cdpCheckLogin();
        if (loginInfo?.loggedIn) {
          // Same robust credit detection as the DIRECT API path above
          const mi = loginInfo.memberInfo || loginInfo.member_info || {};
          const fallbackLive = mi.liveCredit ?? mi.live_credit ?? loginInfo.liveCredit ?? 0;
          const fallbackPaid = mi.evaluationCreditPaid ?? mi.evaluation_credit_paid ?? loginInfo.evaluationCreditPaid ?? 0;
          const fallbackFree = mi.evaluationCreditNoPaid ?? mi.evaluation_credit_no_paid ?? loginInfo.evaluationCreditNoPaid ?? 0;
          const fallbackGeneric = mi.credit ?? loginInfo.credits ?? loginInfo.credit ?? mi.credits ?? 0;

          let cachedCredit;
          if (fallbackGeneric > 0) {
            cachedCredit = fallbackGeneric;
          } else if (fallbackLive > 0 || fallbackPaid > 0 || fallbackFree > 0) {
            cachedCredit = fallbackLive + fallbackPaid + fallbackFree;
          } else {
            cachedCredit = 0;
          }

          login = {
            loggedIn: true,
            loginStatus: loginInfo.loginStatus || 1,
            credits: cachedCredit,
            liveCredit: fallbackLive || cachedCredit,
            evaluationCreditPaid: fallbackPaid,
            evaluationCreditNoPaid: fallbackFree,
            isMember: loginInfo.isMember || false,
            membershipExpired: loginInfo.membershipExpired || false,
            sessionExpired: (loginInfo.loginStatus || 0) === 0,
            source: 'cdp_profile',
          };
          cachedLoginInfo = loginInfo;
          logger.info(`[status] CDP credit: ${cachedCredit} (from browser profile)`);
        }
      } catch (e) {
        logger.warn(`[status] CDP fallback also failed: ${e.message}`);
      }
    }

    // --- AUTO-RECOVERY: If session expired, try to recover -----------------
    if (login && (login.loginStatus || 0) === 0) {
      logger.warn('[status] Session expired (loginStatus=0) — attempting auto-recovery...');
      try {
        const recovered = await recoverSession();
        if (recovered) {
          logger.info('[status] Session recovered successfully');
          // Re-fetch via the primary path
          if (haveDirectKey) {
            const r = await museCallDirect('/project/song/v1/user/info');
            if (r.data?.code === 0 && r.data?.data) {
              const d = r.data.data;
              login = {
                ...login,
                loginStatus: d.loginStatus ?? 1,
                sessionExpired: (d.loginStatus || 0) === 0,
              };
              // Re-read displayed credit from browser after recovery
              if (cdpConnected) {
                try {
                  const readResult = await readDisplayedCredit();
                  if (readResult.credit > 0) {
                    login.credits = readResult.credit;
                    login.source = readResult.source;
                  }
                } catch { /* keep existing */ }
              }
            }
          }
        } else {
          logger.warn('[status] Auto-recovery failed — user may need to re-login on muse.top');
        }
      } catch (e) {
        logger.warn(`[status] Auto-recovery error: ${e.message}`);
      }
    }

    // --- COMPUTE canGenerate flag ------------------------------------------
    if (login) {
      const sessionExpired = (login.loginStatus || 0) === 0;
      login.sessionExpired = sessionExpired;
      login.canGenerate = !sessionExpired;
    }

    // "configured" = we have real credentials that produced a valid credit
    const configured = !!login && login.loggedIn;

    // Check platformAuth status (browser-agnostic token store)
    let platformAuthStatus = null;
    try {
      platformAuthStatus = await platformAuth.getStatus('muse');
    } catch { /* best-effort */ }

    // Build a helpful note for the UI
    let note = null;
    if (!configured) {
      if (platformAuthStatus?.hasToken) {
        note = platformAuthStatus.expired
          ? 'Your stored token has expired. Go to Settings → Platform Auth to update it.'
          : 'Token stored but validation failed. Check Settings → Platform Auth.';
      } else if (!cdpConnected && !haveDirectKey) {
        note = 'No authentication configured. Go to Settings → Platform Auth to paste your Muse token (works on any browser).';
      } else if (!cdpConnected) {
        note = 'CDP not connected. For browser-agnostic auth, go to Settings → Platform Auth.';
      }
    }

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
      platformAuth: platformAuthStatus,
      login,
      note,
    });
  }

  /**
   * GET /api/muse/user
   * Fetch logged-in user's profile + credit balance.
   */
  async getUser(req, res) {
    try {
      const result = await museCall('/project/song/v1/user/info');
      if (result.data?.code === 0) {
        const d = result.data.data || {};
        const mi = d.memberInfo || {};
        cachedLoginInfo = {
          ...cachedLoginInfo,
          ...d,
          credits: mi.credit ?? d.credit ?? d.credits ?? 0,
          isMember: mi.isMember || mi.paidMember || d.isMember || false,
          membershipExpired: mi.subscription?.expired ?? false,
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
   * POST /api/muse/fill-input
   * Visual bridge: type the user-selected prompt/lyrics into the muse.top
   * input field so the user can SEE the exact inputs being passed — even
   * when generation cannot complete due to insufficient credits.
   *
   * Body: { mode, prompt, lyrics }
   *   - quick mode  → fills muse.top with the inspiration `prompt`
   *   - master mode → fills muse.top with the full `lyrics`
   *
   * Response: { success, data: { filled, matchedSelector, value, pageFound } }
   */
  async fillInput(req, res) {
    const { mode = 'quick', prompt = '', lyrics = '' } = req.body || {};

    // Decide what text to push into the muse.top input field.
    const text = mode === 'master' ? lyrics : prompt;
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: mode === 'master' ? 'Lyrics required to fill muse.top input' : 'Prompt required to fill muse.top input',
      });
    }

    try {
      // muse.top's main input placeholder varies by browser locale:
      //   English: "Enter your inspiration or lyrics, e.g.: ..."
      //   Chinese: "输入你的灵感或歌词，如：一首关于青春回忆的歌曲"
      // We match on multiple substrings so the bridge works regardless of
      // the user's Edge language setting.
      // fallbackUrl: if the only open muse.top tab is on a sub-route (e.g.
      // /assets) that doesn't render the input, navigate it to the creation
      // page so the user can see the inputs appear.
      const result = await fillInputOnPage(
        'muse.top',
        ['inspiration', '灵感', '歌词'],
        text,
        'https://muse.top/'
      );

      if (!result.pageFound) {
        logger.warn('[fill-input] muse.top tab not open in Edge browser');
        return res.status(409).json({
          success: false,
          error: 'muse.top is not open in the Edge browser. Please open https://muse.top/ in a tab first.',
          data: { pageFound: false },
        });
      }

      if (!result.success) {
        logger.warn(`[fill-input] Failed to fill muse.top input: ${result.error}`);
        return res.status(502).json({
          success: false,
          error: `Could not fill muse.top input field: ${result.error}`,
          data: result,
        });
      }

      logger.info(`[fill-input] Filled muse.top input (${String(result.value).length} chars) via ${result.matchedSelector}`);
      return res.json({
        success: true,
        data: {
          filled: true,
          matchedSelector: result.matchedSelector,
          value: result.value,
          pageFound: true,
          mode,
        },
      });
    } catch (e) {
      logger.error(`[fill-input] Exception: ${e.message}`);
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /**
   * POST /api/muse/generate
   * Generate a song via the user's Edge browser context.
   * Body: { mode, prompt, lyrics, style, title, vocal, languageId, audioWeight, instrumental, structureId, songModel, duration }
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
      duration = null,
    } = req.body || {};

    if (mode === 'quick' && (!prompt || prompt.length < 5)) {
      return res.status(400).json({ success: false, error: 'Quick mode requires prompt (>=5 chars)' });
    }
    if (mode === 'master' && !lyrics) {
      return res.status(400).json({ success: false, error: 'Master mode requires lyrics' });
    }

    // GENERATION: MUST use CDP (browser session required by Muse server)
    // DIRECT HTTP always fails for generation with code=1006.
    try {
      refreshEnvToken(); // Pick up any .env updates

      // Build generate body — include duration if provided, clamp to 10-360s
      const dur = Number(duration);
      const durationVal = (dur && dur >= 10 && dur <= 360) ? Math.round(dur) : undefined;
      const durationFragment = durationVal !== undefined ? { duration: durationVal } : {};

      let endpoint, body;
      if (mode === 'master') {
        endpoint = '/project/song/v1/song/generate';
        body = {
          lyrics, style, title: title || prompt?.substring(0, 20) || 'Untitled',
          instrumental: instrumental ? 1 : 0,
          ...durationFragment,
        };
      } else {
        endpoint = '/project/song/v1/song/deepseek/generate';
        body = {
          description: prompt, songModel,
          instrumental: instrumental ? 1 : 0,
          ...(style ? { style } : {}),
          ...durationFragment,
        };
      }

      logger.info(`[generate/${mode}] Calling ${endpoint} via CDP (duration=${durationVal ?? 'default'})...`);
      const result = await museCall(endpoint, body, { isGeneration: true, timeoutMs: 60000 });

      if (result.error) {
        logger.error(`[generate/${mode}] Error: ${result.error} (via=${result.via})`);
        return res.status(502).json({ success: false, error: result.error });
      }

      if (result.data?.code === 0) {
        logger.info(`[generate/${mode}] Success via ${result.via}: ${JSON.stringify(result.data.data).substring(0, 200)}`);
        return res.json({ success: true, data: result.data.data, label: `generate/${mode}/${result.via}`, generationMethod: result.via });
      }

      if (result.data?.code === 1006) {
        logger.warn(`[generate/${mode}] Session expired — attempting auto-recovery...`);
        try {
          const recovered = await recoverSession();
          if (recovered) {
            logger.info(`[generate/${mode}] Session recovered! Retrying CDP generation...`);
            const retryResult = await museCall(endpoint, body, { isGeneration: true, timeoutMs: 60000 });
            if (retryResult.data?.code === 0) {
              logger.info(`[generate/${mode}] Retry succeeded via ${retryResult.via}`);
              return res.json({ success: true, data: retryResult.data.data, label: `generate/${mode}/${retryResult.via}/recovered`, generationMethod: retryResult.via });
            }
            logger.warn(`[generate/${mode}] Retry also failed: code=${retryResult.data?.code}`);
            return this.sendMuseResult(res, `generate/${mode}/retry`, retryResult);
          }
        } catch (recoveryErr) {
          logger.warn(`[generate/${mode}] Auto-recovery error: ${recoveryErr.message}`);
        }
        return this.sendMuseResult(res, `generate/${mode}`, result);
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
   * Also provides bilingual error messages so EN users don't see raw Chinese.
   */
  sendMuseResult(res, label, result) {
    // --- Bilingual error map for Muse API codes ---
    const MUSE_ERRORS = {
      1006: {
        zh: '登录已过期（code=1006）。请前往Settings → Platform Auth，从muse.top复制粘贴新的token（适用于任意浏览器）。',
        en: 'Login expired (code=1006). Go to Settings → Platform Auth and paste a fresh token from muse.top (works in any browser).',
      },
      1001: {
        zh: '参数错误（code=1001）：请检查歌词或提示词是否为空。',
        en: 'Parameter error (code=1001). Check that lyrics/prompt is not empty.',
      },
      1002: {
        zh: '积分不足（code=1002）：请在muse.top账号内充值或完成任务获取积分。',
        en: 'Insufficient credits (code=1002). Top up your muse.top account or earn credits via tasks.',
      },
      1004: {
        zh: '未授权（code=1004）：请检查token是否仍有效，或在Platform Auth重新粘贴新token。',
        en: 'Unauthorized (code=1004). Re-paste a fresh token in Platform Auth.',
      },
      1500: {
        zh: '服务暂时不可用（code=1500），请稍后重试。',
        en: 'Service temporarily unavailable (code=1500). Please try again later.',
      },
    };

    if (result.status >= 400 && result.data?.code === undefined) {
      return res.status(result.status).json({
        success: false,
        error: result.data?.error || `HTTP ${result.status}`,
        label,
      });
    }
    if (result.data?.code !== 0 && result.data?.code !== undefined) {
      const code = result.data.code;
      const mapped = MUSE_ERRORS[code];
      const rawMsg = result.data.msg || `Muse code ${code}`;
      return res.status(502).json({
        success: false,
        error: mapped ? mapped.zh : rawMsg,
        error_en: mapped ? mapped.en : null,
        code,
        errorKey: code === 1006 ? 'LOGIN_EXPIRED' : (code === 1002 ? 'INSUFFICIENT_CREDIT' : (code === 1004 ? 'UNAUTHORIZED' : `CODE_${code}`)),
        traceId: result.data.traceId,
        label,
      });
    }
    return res.json({ success: true, data: result.data?.data, traceId: result.data?.traceId, label });
  }
}

export default new MuseController();