/**
 * Muse CDP Bridge v4 - Connect to EXISTING Edge browser (port 9222)
 * for authenticated Muse API calls.
 * 
 * This uses the user's ALREADY RUNNING Edge browser with CDP enabled.
 * No new browser is launched - we connect to what's already there.
 */

import WebSocket from 'ws';
import http from 'http';

const CDP_HOST = 'localhost';
const CDP_PORT = 9222;

let cdpWs = null;
let cdpMsgId = 0;
const pending = new Map();
let messageLogger = null;
/** URL of the browser tab CDP attached to (used for localStorage extraction). */
let attachedPageUrl = '';
/** Target id of the browser tab CDP attached to. */
let attachedPageId = '';

/**
 * Extract the muse.top AuthToken (JWT) from the attached page's localStorage.
 *
 * The muse.top web app stores its session JWT in localStorage under one of
 * several possible keys and sends it as the `AuthToken` HTTP header on every
 * API call to project-api.atmob.com. Cookies alone are NOT enough — the API
 * gateway validates the JWT header. We probe a list of known storage keys and
 * also fall back to cookie-style names so the bridge stays in sync with
 * upstream muse.top bundle renames.
 *
 * @returns {Promise<{token:string|null, source:string}>} The JWT (or null)
 */
async function extractAuthToken() {
  // If we are not on a muse.top origin, localStorage will belong to a
  // different origin and won't contain the muse token — navigate first.
  if (attachedPageUrl && !attachedPageUrl.includes('muse.top')) {
    try {
      await navigateTo('https://muse.top/', 2500);
      attachedPageUrl = 'https://muse.top/';
    } catch { /* ignore — best effort */ }
  }

  // Probe localStorage + sessionStorage for the JWT. The muse.top bundle has
  // used several key names across versions, so we try them in priority order.
  const expression = `
    (function() {
      var keys = ['AuthToken','authToken','token','muse_token','museToken','Authorization','access_token','accessToken','ssid','sid'];
      var found = null;
      var source = '';
      for (var i = 0; i < keys.length && !found; i++) {
        try {
          var v = localStorage.getItem(keys[i]) || sessionStorage.getItem(keys[i]);
          if (v && v.length > 10) { found = v; source = keys[i]; }
        } catch(e) {}
      }
      // Some muse.top builds store the JWT inside a JSON object under 'userInfo'/'user'
      if (!found) {
        try {
          var raw = localStorage.getItem('userInfo') || localStorage.getItem('user') || sessionStorage.getItem('userInfo');
          if (raw) {
            var obj = JSON.parse(raw);
            var cand = obj.token || obj.authToken || obj.Authorization || obj.ssid || (obj.data && (obj.data.token || obj.data.ssid));
            if (cand && cand.length > 10) { found = cand; source = 'userInfo.token'; }
          }
        } catch(e) {}
      }
      return JSON.stringify({ token: found, source: source, origin: location.origin, href: location.href });
    })()
  `;
  try {
    const val = await evaluate(expression);
    if (val) {
      const parsed = JSON.parse(val);
      return { token: parsed.token, source: parsed.source, origin: parsed.origin, href: parsed.href };
    }
  } catch { /* ignore */ }
  return { token: null, source: null };
}

/**
 * Connect to existing Edge CDP and find a muse.top page target.
 * @param {number} port - CDP port (default 9222)
 * @returns {Promise<WebSocket>} Connected WebSocket
 */
async function connectCDP(port = CDP_PORT) {
  if (cdpWs && cdpWs.readyState === 1) return cdpWs;

  // Get page targets
  const targets = await new Promise((resolve, reject) => {
    http.get(`http://${CDP_HOST}:${port}/json`, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Failed to parse targets: ' + data)); }
      });
    }).on('error', reject);
  });

  // Find a muse.top page, or any page
  const page = targets.find(t => t.type === 'page' && t.url && t.url.includes('muse.top'))
    || targets.find(t => t.type === 'page');

  if (!page) throw new Error('No page target found on CDP');

  // Remember which page we attached to so checkLogin can extract the JWT
  // from the correct origin's localStorage.
  attachedPageUrl = page.url || '';
  attachedPageId = page.id || '';

  cdpWs = new WebSocket(page.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('CDP WebSocket timeout')), 5000);
    cdpWs.addEventListener('open', () => {
      clearTimeout(t);

      // Set up message router
      cdpWs.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data || event.toString());

          // Log if logger is set
          if (messageLogger) {
            messageLogger(data);
          }

          // Route to pending handlers
          if (data.id && pending.has(data.id)) {
            const { resolve: r, timeout } = pending.get(data.id);
            clearTimeout(timeout);
            r(data);
            pending.delete(data.id);
          }
        } catch { }
      });

      resolve();
    });

    cdpWs.addEventListener('error', (e) => {
      clearTimeout(t);
      reject(e);
    });

    cdpWs.addEventListener('close', () => {
      cdpWs = null;
    });
  });

  // Enable Page and Runtime domains
  await sendCDPCommand('Page.enable').catch(() => { });
  await sendCDPCommand('Runtime.enable').catch(() => { });

  return cdpWs;
}

/**
 * Send a CDP command and wait for the response.
 * @param {string} method - CDP method name
 * @param {object} params - CDP method parameters
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<object>} CDP result
 */
async function sendCDPCommand(method, params = {}, timeoutMs = 10000) {
  const ws = await connectCDP();
  const id = ++cdpMsgId;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, timeoutMs);

    pending.set(id, { resolve, timeout });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

/**
 * Evaluate JavaScript in the browser page context.
 * @param {string} expression - JS expression to evaluate
 * @returns {Promise<*>} Result value
 */
async function evaluate(expression) {
  const result = await sendCDPCommand('Runtime.evaluate', {
    expression,
    returnByValue: true,
  });
  return result.result?.result?.value;
}

/**
 * Navigate to a URL and wait for load.
 * @param {string} url - Target URL
 * @param {number} waitMs - Wait after navigation
 */
async function navigateTo(url, waitMs = 2000) {
  try {
    await sendCDPCommand('Page.navigate', { url });
    await new Promise(r => setTimeout(r, waitMs));
  } catch (e) {
    // Navigation might not be needed if already on the page
  }
}

/**
 * Make an authenticated HTTP request from the browser context.
 * The request includes all cookies (including HttpOnly) via credentials:'include'.
 * 
 * @param {string} url - Full URL to fetch
 * @param {object} options - { method, headers, body, token }
 * @returns {Promise<{status:number, body:string, headers:object}>}
 */
async function fetchFromEdge(url, options = {}) {
  const {
    method = 'POST',
    headers = {},
    body = null,
    authToken = null,
  } = options;

  // Build headers. The muse.top API gateway requires an `AuthToken` JWT
  // header (in addition to App-Key) — cookies alone return code=1006.
  const headerObj = {
    'Content-Type': 'application/json',
    'App-Key': '8e33a5e60ef347df808d14026f27d227',
    ...(authToken ? { 'AuthToken': authToken } : {}),
    ...headers,
  };

  // Build the fetch expression
  const expression = `
    (async function() {
      try {
        const response = await fetch(${JSON.stringify(url)}, {
          method: ${JSON.stringify(method)},
          headers: ${JSON.stringify(headerObj)},
          credentials: 'include',
          ${body ? `body: JSON.stringify(${JSON.stringify(body)}),` : ''}
        });
        const text = await response.text();
        return JSON.stringify({
          status: response.status,
          body: text.substring(0, 50000),
          headers: Object.fromEntries(response.headers.entries()),
        });
      } catch(e) {
        return JSON.stringify({ error: e.message });
      }
    })()
  `;

  try {
    const result = await sendCDPCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    }, 15000);

    const val = result.result?.result?.value;
    if (!val) {
      return { status: 0, body: '', error: 'No result from browser' };
    }

    const parsed = JSON.parse(val);
    if (parsed.error) {
      return { status: 0, body: '', error: parsed.error };
    }

    return {
      status: parsed.status,
      body: parsed.body,
      headers: parsed.headers,
    };
  } catch (e) {
    return { status: 0, body: '', error: e.message };
  }
}

/**
 * Get cookies for a specific URL from the browser.
 * @param {string[]} urls - URLs to get cookies for
 * @returns {Promise<Array>} Array of cookie objects
 */
async function getCookies(urls = ['https://muse.top', 'https://project-api.atmob.com']) {
  try {
    const result = await sendCDPCommand('Network.getCookies', { urls });
    return result.result?.cookies || [];
  } catch {
    return [];
  }
}

/** Cached AuthToken JWT extracted from the browser's localStorage. */
let cachedAuthToken = null;
/** Where the cached token came from (localStorage key name). */
let cachedTokenSource = null;

/**
 * Check if the browser is logged into muse.top.
 *
 * Strategy:
 *   1. Extract the AuthToken JWT from the attached page's localStorage.
 *   2. POST /project/song/v1/user/info with App-Key + AuthToken headers.
 *   3. code===0  → logged in (return credits/deviceId/etc.)
 *      code===1006 → token missing/expired (return diagnostic info)
 *
 * @returns {Promise<{loggedIn:boolean, credits:number, deviceId:string, ssid:string}>}
 */
async function checkLogin() {
  // Step 1: extract the JWT from the browser. This is the crucial step that
  // was missing before — cookies alone don't authenticate against the
  // project-api.atmob.com gateway.
  const tokenInfo = await extractAuthToken();
  if (tokenInfo.token) {
    cachedAuthToken = tokenInfo.token;
    cachedTokenSource = tokenInfo.source;
  }

  const result = await fetchFromEdge('https://project-api.atmob.com/project/song/v1/user/info', {
    method: 'POST',
    headers: cachedAuthToken ? { AuthToken: cachedAuthToken } : {},
    authToken: cachedAuthToken,
    body: {
      packageName: 'com.xingchat.web.muse',
      appPlatform: 4,
      channelName: 'web',
      machineId: 'zmusic-cdp-check',
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'check' + Math.random().toString(36).substring(2, 10),
    },
  });

  if (result.error) {
    return {
      loggedIn: false,
      error: result.error,
      tokenFound: Boolean(cachedAuthToken),
      tokenSource: cachedTokenSource,
      pageOrigin: tokenInfo.origin,
      pageHref: tokenInfo.href,
    };
  }

  try {
    const data = JSON.parse(result.body);
    if (data.code === 0 && data.data) {
      const d = data.data;
      const mi = d.memberInfo || {};
      return {
        loggedIn: true,
        credits: mi.credit || d.credit || 0,
        deviceId: d.deviceId,
        ssid: d.ssid,
        loginStatus: d.loginStatus || 0,
        isMember: mi.isMember || mi.paidMember || false,
        membershipExpired: mi.subscription?.expired || false,
        evaluationCreditPaid: mi.evaluationCreditPaid || 0,
        evaluationCreditNoPaid: mi.evaluationCreditNoPaid || 0,
        totalCredits: (mi.evaluationCreditPaid || 0) + (mi.evaluationCreditNoPaid || 0) + (mi.credit || 0),
        tokenFound: true,
        tokenSource: cachedTokenSource,
        raw: d,
      };
    }
    // Not logged in — return rich diagnostics so the UI/log shows WHY.
    return {
      loggedIn: false,
      code: data.code,
      msg: data.msg,
      tokenFound: Boolean(cachedAuthToken),
      tokenSource: cachedTokenSource,
      pageOrigin: tokenInfo.origin,
      pageHref: tokenInfo.href,
      responseBody: (result.body || '').substring(0, 300),
    };
  } catch (e) {
    return {
      loggedIn: false,
      error: 'Failed to parse response',
      tokenFound: Boolean(cachedAuthToken),
      rawBody: (result.body || '').substring(0, 300),
    };
  }
}

/**
 * Make a song generation request via the browser context.
 * @param {object} params - Generation parameters
 * @returns {Promise<object>} Generation result
 */
async function generateSong(params) {
  const {
    mode = 'quick',
    prompt = '',
    lyrics = '',
    style = '',
    title = '',
    songModel = 'general',
    instrumental = 0,
  } = params;

  // First, check login and get deviceId
  const loginInfo = await checkLogin();
  if (!loginInfo.loggedIn) {
    return { success: false, error: `Not logged in: ${loginInfo.error || loginInfo.msg}` };
  }

  // Build the generation request body
  let endpoint, body;

  if (mode === 'master') {
    endpoint = '/project/song/v1/song/generate';
    body = {
      lyrics,
      style,
      title: title || prompt?.substring(0, 20) || 'Untitled',
      instrumental: instrumental ? 1 : 0,
    };
  } else {
    endpoint = '/project/song/v1/song/deepseek/generate';
    body = {
      description: prompt,
      songModel,
      instrumental: instrumental ? 1 : 0,
      ...(style ? { style } : {}),
    };
  }

  // Add base request fields
  const fullBody = {
    packageName: 'com.xingchat.web.muse',
    appPlatform: 4,
    channelName: 'web',
    machineId: loginInfo.deviceId || 'zmusic-cdp',
    deviceId: loginInfo.deviceId,
    timestamp: Math.floor(Date.now() / 1000),
    nonce: 'gen' + Math.random().toString(36).substring(2, 10),
    ...(loginInfo.ssid ? { sid: loginInfo.ssid } : {}),
    ...body,
  };

  const result = await fetchFromEdge(`https://project-api.atmob.com${endpoint}`, {
    method: 'POST',
    body: fullBody,
    authToken: cachedAuthToken,
  });

  if (result.error) {
    return { success: false, error: result.error };
  }

  try {
    const data = JSON.parse(result.body);
    if (data.code === 0) {
      return { success: true, data: data.data, label: `generate/${mode}/cdp` };
    }
    return { success: false, error: data.msg, code: data.code, traceId: data.traceId };
  } catch (e) {
    return { success: false, error: 'Failed to parse response' };
  }
}

/**
 * Poll a task status via the browser context.
 * @param {string} taskId - Task ID to poll
 * @returns {Promise<object>} Task status
 */
async function queryTask(taskId) {
  const result = await fetchFromEdge('https://project-api.atmob.com/project/song/v30/work/tasks/query', {
    method: 'POST',
    authToken: cachedAuthToken,
    body: {
      packageName: 'com.xingchat.web.muse',
      appPlatform: 4,
      channelName: 'web',
      machineId: 'zmusic-cdp',
      timestamp: Math.floor(Date.now() / 1000),
      nonce: 'poll' + Math.random().toString(36).substring(2, 10),
      taskId,
      page: 1,
      page_size: 5,
    },
  });

  if (result.error) {
    return { success: false, error: result.error };
  }

  try {
    const data = JSON.parse(result.body);
    return { success: data.code === 0, data: data.data, code: data.code };
  } catch (e) {
    return { success: false, error: 'Failed to parse response' };
  }
}

/**
 * Disconnect from CDP.
 */
async function disconnect() {
  if (cdpWs) {
    try { cdpWs.close(); } catch { }
    cdpWs = null;
  }
}

export {
  connectCDP,
  sendCDPCommand,
  evaluate,
  navigateTo,
  fetchFromEdge,
  getCookies,
  checkLogin,
  generateSong,
  queryTask,
  extractAuthToken,
  disconnect,
  CDP_HOST,
  CDP_PORT,
};