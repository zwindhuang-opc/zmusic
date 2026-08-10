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
  // If we are not on a muse.top origin, switch CDP attachment to the
  // existing muse.top tab instead of navigating the current page.
  // navigateTo() on a non-muse tab would irreversibly redirect that
  // tab (e.g. the user's h.51melo.com tab) to muse.top, destroying
  // the logged-in Melo session. switchToPage() finds the real
  // muse.top tab and keeps the Melo tab untouched.
  if (attachedPageUrl && !attachedPageUrl.includes('muse.top')) {
    try {
      const switched = await switchToPage('muse.top');
      if (!switched) {
        // No muse.top tab exists at all — fall back to navigating the
        // current page (it's the only page we have).
        await navigateTo('https://muse.top/', 2500);
        attachedPageUrl = 'https://muse.top/';
      }
    } catch { /* ignore — best effort */ }
  }

  // Probe localStorage + sessionStorage for the JWT. The muse.top bundle has
  // used several key names across versions, so we try them in priority order.
  // VERIFIED 2026-08-10 via CDP DOM dump: the current muse.top stores the JWT
  // inside localStorage['muse-user-store'] = {"state":{"token":"eyJhbGc..."}}
  // and also in the cookie 'muse-ai-token' (readable, not HttpOnly).
  const expression = `
    (function() {
      var found = null;
      var source = '';

      // 1. Direct key probes (legacy + current flat keys)
      var keys = ['AuthToken','authToken','token','muse_token','museToken','Authorization','access_token','accessToken','ssid','sid'];
      for (var i = 0; i < keys.length && !found; i++) {
        try {
          var v = localStorage.getItem(keys[i]) || sessionStorage.getItem(keys[i]);
          if (v && v.length > 10) { found = v; source = keys[i]; }
        } catch(e) {}
      }

      // 2. Nested JSON objects in localStorage (muse-user-store is the
      //    CURRENT verified location: {state:{token:"..."}})
      if (!found) {
        var nestedKeys = ['muse-user-store','museUserStore','userInfo','user','muse-user-info','userStore','auth'];
        for (var j = 0; j < nestedKeys.length && !found; j++) {
          try {
            var raw = localStorage.getItem(nestedKeys[j]) || sessionStorage.getItem(nestedKeys[j]);
            if (!raw) continue;
            var obj = JSON.parse(raw);
            // Try obj.token, obj.state.token, obj.data.token, etc.
            var cand = obj.token || obj.authToken || obj.Authorization || obj.ssid
              || (obj.state && (obj.state.token || obj.state.authToken || obj.state.ssid))
              || (obj.data && (obj.data.token || obj.data.ssid || obj.data.authToken))
              || (obj.user && (obj.user.token || obj.user.ssid));
            if (cand && cand.length > 10) { found = cand; source = nestedKeys[j] + '.token'; }
          } catch(e) {}
        }
      }

      // 3. Cookie fallback — muse.top also sets 'muse-ai-token' cookie
      //    (httpOnly=false, so document.cookie can read it).
      if (!found) {
        try {
          var cookies = document.cookie.split(';');
          for (var k = 0; k < cookies.length && !found; k++) {
            var parts = cookies[k].trim().split('=');
            var cname = parts[0];
            var cval = parts.slice(1).join('=');
            if ((cname === 'muse-ai-token' || cname === 'AuthToken' || cname === 'token' || cname === 'ssid') && cval && cval.length > 50) {
              found = cval;
              source = 'cookie:' + cname;
            }
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
    timeoutMs = 60000,
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
    }, timeoutMs);

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

      // Also read the CACHED profile from muse-user-store localStorage.
      // VERIFIED 2026-08-10 via CDP: muse.top's sidebar displays the
      // credit from the CACHED localStorage profile, NOT from the live
      // API. When the server-side session expires (loginStatus=0), the
      // live API returns credit=0 but the UI still shows the cached
      // credit=20 from localStorage['muse-user-store'].state.profile.
      // To match muse.top's display exactly, we prefer the cached
      // profile's memberInfo.credit over the live API's value.
      const cachedProfileExpr = `
        (function() {
          try {
            var raw = localStorage.getItem('muse-user-store');
            if (!raw) return null;
            var obj = JSON.parse(raw);
            var p = obj.state?.profile || obj.profile;
            if (!p) return null;
            return JSON.stringify({
              credit: p.memberInfo?.credit ?? p.credit,
              loginStatus: p.loginStatus,
              isMember: p.memberInfo?.isMember,
              paidMember: p.memberInfo?.paidMember,
              evaluationCreditPaid: p.memberInfo?.evaluationCreditPaid,
              evaluationCreditNoPaid: p.memberInfo?.evaluationCreditNoPaid,
              subscription: p.memberInfo?.subscription,
              isLoggedIn: obj.state?.isLoggedIn,
              deviceId: p.deviceId,
              userId: p.userId,
              ssid: p.ssid,
              uid: p.uid,
              phone: p.phone,
              userName: p.userName
            });
          } catch(e) { return null; }
        })()
      `;
      let cachedProfile = null;
      try {
        const cpRaw = await evaluate(cachedProfileExpr);
        if (cpRaw) cachedProfile = JSON.parse(cpRaw);
      } catch { /* ignore */ }

      // Use cached profile's credit if available (matches muse.top UI),
      // otherwise fall back to the live API's credit field.
      const liveCredit = mi.credit ?? d.credit ?? 0;
      const displayCredit = (cachedProfile && typeof cachedProfile.credit === 'number')
        ? cachedProfile.credit
        : liveCredit;

      return {
        loggedIn: true,
        credits: displayCredit,
        // Use the cached profile's deviceId if available — muse.top's web app
        // sends this as the `machineId` in every API request body. Using the
        // correct machineId helps the server correlate the request with the
        // user's device session.
        deviceId: cachedProfile?.deviceId || d.deviceId,
        ssid: cachedProfile?.ssid || d.ssid,
        userId: cachedProfile?.userId || d.userId,
        uid: cachedProfile?.uid || d.uid,
        loginStatus: d.loginStatus || 0,
        cachedLoginStatus: cachedProfile?.loginStatus ?? null,
        isMember: mi.isMember || mi.paidMember || cachedProfile?.isMember || cachedProfile?.paidMember || false,
        membershipExpired: mi.subscription?.expired || cachedProfile?.subscription?.expired || false,
        evaluationCreditPaid: mi.evaluationCreditPaid || cachedProfile?.evaluationCreditPaid || 0,
        evaluationCreditNoPaid: mi.evaluationCreditNoPaid || cachedProfile?.evaluationCreditNoPaid || 0,
        liveCredit: liveCredit,
        cachedProfileFound: !!cachedProfile,
        tokenFound: true,
        tokenSource: cachedTokenSource,
        authToken: cachedAuthToken,
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
    timeoutMs: 60000,
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
    timeoutMs: 60000,
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

// ===========================================================================
// Multi-engine helpers (Melo, Suno, etc.) — switch between different tabs
// and read localStorage/cookies from any page origin.
// ===========================================================================

/**
 * List all CDP page targets (open tabs in the user's Edge browser).
 * @returns {Promise<Array<{id:string,url:string,title:string,type:string,wsUrl:string}>>}
 */
async function listPages() {
  const targets = await new Promise((resolve, reject) => {
    http.get(`http://${CDP_HOST}:${CDP_PORT}/json`, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Failed to parse targets: ' + data)); }
      });
    }).on('error', reject);
  });
  return targets
    .filter(t => t.type === 'page')
    .map(t => ({
      id: t.id,
      url: t.url,
      title: t.title,
      type: t.type,
      wsUrl: t.webSocketDebuggerUrl,
    }));
}

/**
 * Reconnect CDP bridge to a different page whose URL matches a pattern.
 * Example: switchToPage('51melo') attaches to the h.51melo.com tab.
 *
 * This enables the same CDP bridge to read localStorage / evaluate JS
 * across multiple origins (Muse, Melo, Suno) as long as all tabs are
 * open in the same Edge browser window — which is the user's stated
 * configuration.
 *
 * @param {string|RegExp} urlPattern - Substring or regex to match page URL
 * @returns {Promise<boolean>} True if successfully switched
 */
async function switchToPage(urlPattern) {
  const pages = await listPages();
  const isRegex = urlPattern instanceof RegExp;
  const match = isRegex
    ? (u) => urlPattern.test(u)
    : (u) => u.includes(urlPattern);
  const page = pages.find(p => match(p.url));

  if (!page) return false;

  // Force reconnect: close the existing CDP socket (if any), open a new
  // one to the target page's debug URL.
  if (cdpWs) {
    try { cdpWs.removeAllListeners(); cdpWs.close(); } catch { }
    cdpWs = null;
  }

  attachedPageUrl = page.url || '';
  attachedPageId = page.id || '';

  cdpWs = new WebSocket(page.wsUrl);
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('CDP switch timeout')), 5000);
    cdpWs.addEventListener('open', () => {
      clearTimeout(t);
      cdpWs.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data || event.toString());
          if (messageLogger) messageLogger(data);
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
    cdpWs.addEventListener('error', (e) => { clearTimeout(t); reject(e); });
    cdpWs.addEventListener('close', () => { cdpWs = null; });
  });

  await sendCDPCommand('Page.enable').catch(() => { });
  await sendCDPCommand('Runtime.enable').catch(() => { });
  return true;
}

/**
 * Read localStorage values from the currently attached page.
 *
 * @param {string[]|null} keys - Specific keys to read, or null for all
 * @returns {Promise<Record<string, string>>} Map of key → value
 */
async function readLocalStorage(keys = null) {
  const expr = keys && keys.length
    ? `
      (function(){
        var o = {};
        var ks = ${JSON.stringify(keys)};
        ks.forEach(function(k){ try { o[k] = localStorage.getItem(k); } catch(e){} });
        return JSON.stringify(o);
      })()
    `
    : `
      (function(){
        try {
          var o = {};
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            o[k] = localStorage.getItem(k);
          }
          return JSON.stringify(o);
        } catch(e) { return JSON.stringify({__err: e.message}); }
      })()
    `;
  const raw = await evaluate(expr);
  try { return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}

/**
 * High-level helper: switch to a page matching urlPattern, then evaluate
 * an expression (or read specific localStorage keys).
 *
 * Usage:
 *   const { auth_token } = await extractFromPage(
 *     '51melo',
 *     ['auth_token', 'MELO_ACCESS_TOKEN']
 *   );
 *
 * @param {string|RegExp} urlPattern - Which page to attach to
 * @param {string[]|string} extractor - Array of localStorage keys OR raw JS expression
 * @returns {Promise<any>} Parsed localStorage object OR expression result
 */
async function extractFromPage(urlPattern, extractor) {
  const ok = await switchToPage(urlPattern);
  if (!ok) return null;

  if (Array.isArray(extractor)) {
    return readLocalStorage(extractor);
  }
  // string → raw JS expression
  return evaluate(extractor);
}

// ===========================================================================
// Melo-specific extraction (h.51melo.com tab → auth_token JWT + user id)
// ===========================================================================

/**
 * Read Melo's auth_token from the user's open h.51melo.com tab via CDP.
 *
 * VERIFIED 2026-08-10 on real Edge h.51melo.com tab:
 *   localStorage['auth_token'] = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...."
 *   → Decoded payload: { user_id: 100000082971, phone: "13472486894", exp: 1812177398 }
 *
 * @returns {Promise<{token:string|null, userId:number|null, user:any|null, error?:string}>}
 */
async function extractMeloAuthFromPage() {
  try {
    const data = await extractFromPage('51melo', ['auth_token', 'log_user_id', 'melo_playlist_state']);
    if (!data) return { token: null, userId: null, user: null, error: 'h.51melo.com tab not found in Edge' };

    const token = data.auth_token;
    if (!token || token.length < 20) {
      return { token: null, userId: null, user: null, error: 'h.51melo.com localStorage has no auth_token — user may not be logged in' };
    }

    // Decode JWT to get user_id and check expiry
    let userId = null;
    let user = null;
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.user_id || payload.sub || null;
      user = { ...payload };
    } catch { /* ignore */ }

    return { token, userId, user, error: null };
  } catch (e) {
    return { token: null, userId: null, user: null, error: e.message };
  }
}

// ===========================================================================
// STATELESS CDP CALL PATTERN (FIXED 2026-08-10)
//
// The persistent cdpWs + switchToPage approach was RACE-PRONE: when two
// concurrent API calls needed different tabs (e.g. Melo status + Muse status),
// switching the single WebSocket caused one call to read from the wrong tab.
//
// callOnPage() opens a FRESH WebSocket per call, does the work, closes it.
// This is 100% stateless, concurrent-safe, and eliminates all race conditions.
// ===========================================================================

/**
 * Execute a CDP command against a specific browser tab, then close the WS.
 * This is the STATELSS alternative to the persistent cdpWs + switchToPage.
 *
 * @param {string|RegExp} urlPattern - Which tab to target (URL substring/regex)
 * @param {string} method - CDP method name (e.g. 'Runtime.evaluate')
 * @param {object} params - CDP method parameters
 * @param {number} [timeoutMs=8000] - Timeout
 * @returns {Promise<any>} CDP result, or null if tab not found
 */
async function callOnPage(urlPattern, method, params = {}, timeoutMs = 8000) {
  const pages = await listPages();
  const isRegex = urlPattern instanceof RegExp;
  const match = isRegex ? (u) => urlPattern.test(u) : (u) => u.includes(urlPattern);
  const page = pages.find(p => match(p.url));

  if (!page) return null;

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(page.wsUrl);
    const id = Math.floor(Math.random() * 1e9);
    const timeout = setTimeout(() => {
      try { ws.close(); } catch { /* ignore */ }
      reject(new Error(`CDP callOnPage timeout: ${method}`));
    }, timeoutMs);

    ws.on('open', () => {
      ws.send(JSON.stringify({ id, method, params }));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          clearTimeout(timeout);
          try { ws.close(); } catch { /* ignore */ }
          resolve(msg.result ?? msg.error ?? msg);
        }
      } catch (e) {
        clearTimeout(timeout);
        try { ws.close(); } catch { /* ignore */ }
        reject(e);
      }
    });

    ws.on('error', (e) => {
      clearTimeout(timeout);
      reject(e);
    });

    ws.on('close', () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

/**
 * Evaluate JavaScript on a specific page (stateless).
 * @param {string|RegExp} urlPattern - Tab URL pattern
 * @param {string} expression - JS expression to evaluate
 * @returns {Promise<any>} Result value
 */
async function evalOnPage(urlPattern, expression) {
  // First enable Runtime domain (required for evaluate)
  await callOnPage(urlPattern, 'Runtime.enable').catch(() => { });
  const result = await callOnPage(urlPattern, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
  });
  return result?.result?.value;
}

/**
 * Read localStorage from a specific page (stateless).
 * @param {string|RegExp} urlPattern - Tab URL pattern
 * @param {string[]|null} keys - Keys to read, or null for all
 * @returns {Promise<Record<string,string>>} localStorage map
 */
async function readStorageFromPage(urlPattern, keys = null) {
  const expr = keys && keys.length
    ? `(function(){var o={};var ks=${JSON.stringify(keys)};ks.forEach(function(k){try{o[k]=localStorage.getItem(k)}catch(e){}});return JSON.stringify(o)})()`
    : `(function(){try{var o={};for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);o[k]=localStorage.getItem(k)}return JSON.stringify(o)}catch(e){return JSON.stringify({__err:e.message})}})()`;
  const raw = await evalOnPage(urlPattern, expr);
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

/**
 * Fill an input/textarea on a target browser tab with the given value.
 *
 * This is the "visual bridge": it types the lyrics/prompt the user selected
 * in ZMusic directly into the external site's input field so the user can
 * SEE the exact inputs being passed to muse.top / h.51melo.com — even when
 * generation cannot complete due to insufficient credits.
 *
 * Handles React/Vue controlled inputs by using the native value setter
 * (bypassing the framework's value descriptor guard) and dispatching
 * 'input' + 'change' events so the framework's onChange fires.
 *
 * @param {string|RegExp} urlPattern - Tab URL pattern (e.g. 'muse.top' or '51melo.com/pages/chat')
 * @param {string|string[]} placeholderSubstr - Substring(s) of the input's placeholder to locate it (case-insensitive).
 *   An array matches if ANY element is found in the placeholder — use this to
 *   cover multiple languages (e.g. ['inspiration', '灵感', '歌词']).
 * @param {string} value - The text to type into the input
 * @param {string} [fallbackUrl=null] - If no input is found on any matching tab,
 *   navigate the first matching tab to this URL (e.g. 'https://muse.top/') and
 *   retry. Useful when the only open tab is on a sub-route (e.g. /assets) that
 *   doesn't render the main input.
 * @returns {Promise<{success:boolean, matchedSelector:string, value:string, error?:string, pageFound:boolean}>}
 */
async function fillInputOnPage(urlPattern, placeholderSubstr, value, fallbackUrl = null) {
  // Build a robust DOM expression that:
  //   1. Tries textarea, then input, then contenteditable
  //   2. Matches by placeholder substring (case-insensitive) for resilience
  //      against upstream class-name changes
  //   3. Uses the native value setter to bypass React's synthetic guard
  //   4. Dispatches 'input' + 'change' events so framework state updates
  const safeValue = JSON.stringify(String(value || ''));
  // Normalize placeholder substring(s) to a lowercased array so we can match
  // across languages (e.g. English "inspiration" + Chinese "灵感"/"歌词").
  const phList = Array.isArray(placeholderSubstr)
    ? placeholderSubstr.map(s => String(s || '').toLowerCase()).filter(Boolean)
    : [String(placeholderSubstr || '').toLowerCase()].filter(Boolean);
  const safePhArr = JSON.stringify(phList);
  const expr = `
    (function() {
      var result = { success: false, matchedSelector: '', value: '', error: '' };
      try {
        var target = null;
        var selectorUsed = '';
        var phs = ${safePhArr};
        // Returns true if the given placeholder text contains ANY of the
        // candidate substrings (case-insensitive, already lowercased).
        function matchesPh(p) {
          if (!p) return false;
          var lp = p.toLowerCase();
          for (var i = 0; i < phs.length; i++) {
            if (lp.indexOf(phs[i]) !== -1) return phs[i];
          }
          return false;
        }

        // 1. textarea by placeholder substring
        var tas = document.querySelectorAll('textarea');
        for (var i = 0; i < tas.length && !target; i++) {
          var hit = matchesPh(tas[i].getAttribute('placeholder'));
          if (hit) {
            target = tas[i];
            selectorUsed = 'textarea[placeholder*="' + hit + '"]';
          }
        }
        // 2. input (text-like) by placeholder substring
        if (!target) {
          var ins = document.querySelectorAll('input[type="text"], input:not([type]), input[type="search"]');
          for (var j = 0; j < ins.length && !target; j++) {
            var hit2 = matchesPh(ins[j].getAttribute('placeholder'));
            if (hit2) {
              target = ins[j];
              selectorUsed = 'input[placeholder*="' + hit2 + '"]';
            }
          }
        }
        // 3. contenteditable by aria-placeholder
        if (!target) {
          var ces = document.querySelectorAll('[contenteditable="true"]');
          for (var k = 0; k < ces.length && !target; k++) {
            var hit3 = matchesPh(ces[k].getAttribute('aria-placeholder'));
            if (hit3) {
              target = ces[k];
              selectorUsed = '[contenteditable][aria-placeholder*="' + hit3 + '"]';
            }
          }
        }

        // 4. Framework-rendered placeholder fallback (e.g. uni-app, some Vue
        //    components): the placeholder text is in a SEPARATE sibling <div>,
        //    NOT in the textarea/input's own placeholder attribute.
        //    Strategy: find a leaf element whose textContent matches, then walk
        //    up the DOM to find the nearest textarea/input in an ancestor.
        if (!target) {
          var leafEls = document.querySelectorAll('div, span, label, uni-textarea, uni-view');
          for (var m = 0; m < leafEls.length && !target; m++) {
            var leafEl = leafEls[m];
            // Only check elements with no element children (leaf text nodes)
            if (leafEl.children.length > 0) continue;
            var leafText = (leafEl.textContent || '').trim();
            if (leafText.length === 0 || leafText.length > 80) continue;
            var hit4 = matchesPh(leafText);
            if (!hit4) continue;
            // Found a placeholder-like leaf element. Walk up to find a
            // textarea/input within an ancestor container.
            var ancestor = leafEl.parentElement;
            for (var depth = 0; ancestor && depth < 6 && !target; depth++) {
              var nearby = ancestor.querySelectorAll('textarea, input[type="text"], input:not([type]), input[type="search"]');
              if (nearby.length > 0) {
                target = nearby[0];
                selectorUsed = 'textarea/input near [text*="' + hit4 + '"] (framework placeholder)';
              }
              ancestor = ancestor.parentElement;
            }
          }
        }

        if (!target) {
          result.error = 'No input found with placeholder containing any of: ' + phs.join(', ');
          return JSON.stringify(result);
        }

        // Focus first — some apps only react to changes when focused
        try { target.focus(); } catch (e) {}

        if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
          // Native setter bypasses React/Vue controlled-input guard
          var proto = target.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
          var nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value');
          if (nativeSetter && nativeSetter.set) {
            nativeSetter.set.call(target, ${safeValue});
          } else {
            target.value = ${safeValue};
          }
          target.dispatchEvent(new Event('input', { bubbles: true }));
          target.dispatchEvent(new Event('change', { bubbles: true }));
        } else if (target.getAttribute('contenteditable') === 'true') {
          target.textContent = ${safeValue};
          target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${safeValue} }));
        }

        result.success = true;
        result.matchedSelector = selectorUsed;
        result.value = target.value || target.textContent || '';
        return JSON.stringify(result);
      } catch (e) {
        result.error = e.message;
        return JSON.stringify(result);
      }
    })()
  `;

  try {
    // Iterate over ALL tabs matching the urlPattern (e.g. the user may have
    // multiple muse.top tabs open, only one of which has the input rendered).
    // We try each in order and return the first successful fill.
    const pages = await listPages();
    const isRe = urlPattern instanceof RegExp;
    const matches = isRe
      ? pages.filter(p => urlPattern.test(p.url))
      : pages.filter(p => p.url.includes(urlPattern));

    if (matches.length === 0) {
      return { success: false, pageFound: false, error: 'Target tab not open in Edge browser' };
    }

    /**
     * Evaluate the fill expression on one specific page (by wsUrl).
     * Modeled on callOnPage but accepts a page's wsUrl directly so we can
     * iterate multiple tabs.
     */
    const evalOnWs = (wsUrl, expression) => new Promise((resolve) => {
      const ws = new WebSocket(wsUrl);
      const id = Math.floor(Math.random() * 1e9);
      const timeout = setTimeout(() => {
        try { ws.close(); } catch { /* ignore */ }
        resolve(null);
      }, 8000);

      ws.on('open', () => {
        ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
      });
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.id === id) {
            clearTimeout(timeout);
            try { ws.close(); } catch { /* ignore */ }
            resolve(msg.result?.result?.value ?? null);
          }
        } catch { /* ignore */ }
      });
      ws.on('error', () => { clearTimeout(timeout); resolve(null); });
      ws.on('close', () => { clearTimeout(timeout); resolve(null); });
    });

    /** Navigate a specific tab (by wsUrl) to a URL. Best-effort, non-fatal. */
    const navigateWs = (wsUrl, navUrl) => new Promise((resolve) => {
      const ws = new WebSocket(wsUrl);
      const id = Math.floor(Math.random() * 1e9);
      const timeout = setTimeout(() => {
        try { ws.close(); } catch { /* ignore */ }
        resolve(false);
      }, 8000);
      ws.on('open', async () => {
        try {
          // Enable Page domain, then navigate
          ws.send(JSON.stringify({ id: id + 1, method: 'Page.enable' }));
          ws.send(JSON.stringify({ id, method: 'Page.navigate', params: { url: navUrl } }));
        } catch { /* ignore */ }
      });
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.id === id) {
            clearTimeout(timeout);
            try { ws.close(); } catch { /* ignore */ }
            resolve(true);
          }
        } catch { /* ignore */ }
      });
      ws.on('error', () => { clearTimeout(timeout); resolve(false); });
      ws.on('close', () => { clearTimeout(timeout); resolve(false); });
    });

    let lastError = 'No input found on any matching tab';
    for (const page of matches) {
      const raw = await evalOnWs(page.wsUrl, expr);
      if (!raw) continue; // tab didn't respond — try the next one
      try {
        const parsed = JSON.parse(raw);
        parsed.pageFound = true;
        if (parsed.success) {
          return parsed; // filled successfully on this tab
        }
        lastError = parsed.error || lastError;
      } catch {
        lastError = 'Failed to parse fill result';
      }
    }

    // No tab had the input rendered. If a fallbackUrl was provided, navigate
    // the first matching tab there (e.g. muse.top/assets → muse.top/) so the
    // creation page with the input loads, then retry the fill.
    if (fallbackUrl && matches.length > 0) {
      const target = matches[0];
      const navOk = await navigateWs(target.wsUrl, fallbackUrl);
      if (navOk) {
        // Wait for the SPA to render the input field
        await new Promise(r => setTimeout(r, 4000));
        const raw = await evalOnWs(target.wsUrl, expr);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            parsed.pageFound = true;
            if (parsed.success) {
              parsed.navigated = true;
              return parsed; // filled after navigation
            }
            lastError = parsed.error || lastError;
          } catch {
            lastError = 'Failed to parse fill result after navigation';
          }
        }
      }
    }

    // All matching tabs were tried but none had a fillable input
    return { success: false, pageFound: true, error: lastError };
  } catch (e) {
    return { success: false, pageFound: false, error: e.message };
  }
}

/**
 * Read the ACTUAL displayed credit from the muse.top sidebar DOM.
 * This is what the user sees on screen — not a calculation.
 * Falls back to localStorage if DOM read fails.
 * @returns {Promise<{credit:number, source:string, raw:object}>}
 */
async function readDisplayedCredit() {
  try {
    // Method 1: Read from DOM — look for the sidebar credit element
    const domCredit = await evalOnPage('muse.top', `
      (function() {
        try {
          // Try multiple selectors that might contain the credit value
          const selectors = [
            // Sidebar credit display
            '.credit-count', '.user-credit', '.credits',
            '[class*="credit"]', '[class*="point"]', '[class*="integral"]',
            // Sparkle/integral badge in sidebar
            '.sidebar .badge', '.user-info .badge',
          ];
          let results = [];
          for (const sel of selectors) {
            const els = document.querySelectorAll(sel);
            els.forEach(el => {
              const text = el.textContent.trim();
              const num = parseInt(text.replace(/[^0-9]/g, ''));
              if (!isNaN(num) && num > 0 && num < 9999) {
                results.push({ selector: sel, text: text, value: num });
              }
            });
          }
          if (results.length > 0) {
            // Return the most likely credit value
            return JSON.stringify({ source: 'dom', value: results[0].value, all: results });
          }

          // Method 2: Read from muse-user-store localStorage
          const raw = localStorage.getItem('muse-user-store');
          if (raw) {
            const obj = JSON.parse(raw);
            const profile = obj.state?.profile || obj.profile;
            if (profile) {
              const credit = profile.memberInfo?.credit ?? profile.credit ?? 0;
              return JSON.stringify({ source: 'localStorage_profile', value: credit, profileKeys: Object.keys(profile) });
            }
            if (obj.state?.token) {
              return JSON.stringify({ source: 'localStorage_state', value: 0, hasToken: true, stateKeys: Object.keys(obj.state) });
            }
          }

          return JSON.stringify({ source: 'none', value: 0 });
        } catch(e) {
          return JSON.stringify({ source: 'error', error: e.message, value: 0 });
        }
      })()
    `);

    if (domCredit) {
      const parsed = JSON.parse(domCredit);
      console.log(`[CREDIT READ] source=${parsed.source} value=${parsed.value}`);
      return { credit: parsed.value || 0, source: parsed.source, raw: parsed };
    }
  } catch (e) {
    console.log(`[CREDIT READ] Error: ${e.message}`);
  }

  return { credit: 0, source: 'error', raw: {} };
}

// ===========================================================================
// SESSION KEEPALIVE + AUTO-RECOVERY (FIXED 2026-08-10)
//
// muse.top server-side sessions expire after ~30 minutes of inactivity,
// even though the JWT itself is valid for months. This causes code=1006
// "登录状态失效" on /generate calls.
//
// Solution:
//   1. startKeepalive() — pings the user/info endpoint every 5 minutes to
//      keep the server-side session alive. This prevents the expiry entirely
//      when the user has muse.top open in their Edge browser.
//   2. recoverSession() — when checkLogin detects loginStatus=0, it
//      automatically navigates the muse.top tab to refresh the session,
//      then re-checks the login state. This fixes session expiry without
//      requiring the user to manually re-login.
// ===========================================================================

let keepaliveTimer = null;
let keepaliveRunning = false;
/** Cached JWT for keepalive (avoids CDP timeout issues). */
let keepaliveToken = null;

/**
 * Ping the muse.top API to keep the server-side session alive.
 * MUST use CDP (browser context) because only browser-context requests
 * carry cookies that refresh the Muse server-side session.
 * DIRECT HTTP does NOT refresh the session.
 */
async function keepalivePing() {
  try {
    // First, try to extract fresh token from browser
    if (!keepaliveToken) {
      try {
        const result = await callOnPage('muse.top', 'Runtime.evaluate', {
          expression: `(function(){try{var raw=localStorage.getItem('muse-user-store');if(!raw)return null;var obj=JSON.parse(raw);return obj.state?.token||null}catch(e){return null}})()`,
          returnByValue: true,
        }, 8000);
        keepaliveToken = result?.result?.value || null;
        if (keepaliveToken) {
          console.log(`[KEEPALIVE] Got token from browser: len=${keepaliveToken.length}`);
        }
      } catch { /* token extraction not critical */ }
    }

    const token = keepaliveToken || process.env.MUSE_API_KEY;
    if (!token || token.length < 20) return;

    // Use fetchFromEdge (CDP) — browser context sends cookies + refreshes session
    const result = await fetchFromEdge(
      'https://project-api.atmob.com/project/song/v1/user/info',
      {
        method: 'POST',
        authToken: token,
        timeoutMs: 15000,
        body: {
          packageName: 'com.xingchat.web.muse',
          appPlatform: 4,
          channelName: 'web',
          machineId: 'zmusic-keepalive',
          timestamp: Math.floor(Date.now() / 1000),
          nonce: 'keepalive' + Math.random().toString(36).substring(2, 10),
        },
      }
    );

    if (result.error) {
      console.log(`[KEEPALIVE] CDP fetch error: ${result.error}`);
      return;
    }

    try {
      const data = JSON.parse(result.body);
      if (data.code === 0) {
        const d = data.data || {};
        const ls = d.loginStatus || 0;
        const mi = d.memberInfo || {};
        const baseCredit = mi.credit ?? 0;
        const ep = mi.evaluationCreditPaid ?? 0;
        const en = mi.evaluationCreditNoPaid ?? 0;
        const displayedCredit = baseCredit + Math.max(0, ep - en);

        if (ls === 0) {
          console.log(`[KEEPALIVE] Session expired (loginStatus=0) — credit=${displayedCredit}`);
        } else {
          console.log(`[KEEPALIVE] OK (loginStatus=${ls}, credits=${displayedCredit}) — session refreshed`);
        }
      } else if (data.code === 1006) {
        console.log(`[KEEPALIVE] Session expired (code=1006)`);
      } else {
        console.log(`[KEEPALIVE] Code ${data.code}: ${data.msg}`);
      }
    } catch {
      console.log(`[KEEPALIVE] Non-JSON response`);
    }
  } catch (e) {
    console.log(`[KEEPALIVE] Exception: ${e.message}`);
  }
}

/**
 * Recover an expired Muse session by:
 *   1. Navigating the muse.top tab to force a session refresh
 *   2. Waiting for the page to load (including API calls that refresh cookies)
 *   3. Extracting cookies + JWT from the browser
 *   4. Making a DIRECT API call with cookies to verify session is alive
 *
 * This is the stateless recovery: we use callOnPage to navigate and then
 * re-extract the token and verify login — all without a persistent WS.
 */
async function recoverSession() {
  console.log('[RECOVER] Attempting session recovery on muse.top...');
  try {
    // Strategy 1: Navigate the muse.top homepage to trigger API calls
    const navResult = await callOnPage('muse.top', 'Page.navigate', {
      url: 'https://muse.top/',
    }, 10000);

    if (navResult) {
      console.log('[RECOVER] Navigated to muse.top — waiting for API calls...');
      await new Promise(r => setTimeout(r, 3000));

      // Strategy 2: Try navigating to assets page (user/credit area)
      const nav2 = await callOnPage('muse.top', 'Page.navigate', {
        url: 'https://muse.top/assets',
      }, 10000);
      if (nav2) {
        console.log('[RECOVER] Navigated to muse.top/assets — waiting...');
        await new Promise(r => setTimeout(r, 4000));
      }
    } else {
      console.log('[RECOVER] muse.top tab not found — cannot auto-recover');
      return false;
    }

    // Strategy 3: Try clicking the user profile button to trigger a refresh
    try {
      // Click the user avatar/profile button in the sidebar
      await callOnPage('muse.top', 'Input.dispatchMouseEvent', {
        type: 'mousePressed',
        button: 'left',
        clickCount: 1,
        x: 100,
        y: 300,
      }, 3000);
      await new Promise(r => setTimeout(r, 1000));
      console.log('[RECOVER] Clicked on page to trigger potential refresh');
    } catch { /* click not critical */ }

    // Extract cookies from the browser for DIRECT API calls
    let cookieString = '';
    try {
      // Try getting cookies for both the API domain and muse.top
      const cookiesResult = await callOnPage('muse.top', 'Network.getCookies', {
        urls: ['https://project-api.atmob.com', 'https://muse.top'],
      }, 5000);
      if (cookiesResult && cookiesResult.cookies && cookiesResult.cookies.length > 0) {
        cookieString = cookiesResult.cookies
          .map(c => `${c.name}=${c.value}`)
          .join('; ');
        console.log(`[RECOVER] Got ${cookiesResult.cookies.length} cookies from browser`);
      } else {
        // Try getting ALL cookies
        const allCookies = await callOnPage('muse.top', 'Network.getCookies', {}, 5000);
        if (allCookies && allCookies.cookies) {
          const relevant = allCookies.cookies.filter(c =>
            c.domain?.includes('muse') || c.domain?.includes('atmob')
          );
          if (relevant.length > 0) {
            cookieString = relevant.map(c => `${c.name}=${c.value}`).join('; ');
            console.log(`[RECOVER] Got ${relevant.length} relevant cookies (from ${allCookies.cookies.length} total)`);
          } else {
            console.log(`[RECOVER] ${allCookies.cookies.length} total cookies, none relevant`);
          }
        }
      }
    } catch (e) {
      console.log(`[RECOVER] Cookie extraction: ${e.message}`);
    }

    // Re-extract the token (page may have refreshed it)
    const tokenInfo = await extractAuthToken();
    if (tokenInfo.token) {
      console.log(`[RECOVER] Token re-extracted: source=${tokenInfo.source}`);
      cachedAuthToken = tokenInfo.token;
      cachedTokenSource = tokenInfo.source;
    }

    // Try DIRECT API call with cookies
    const token = tokenInfo.token || cachedAuthToken;
    if (token && token.length > 20) {
      try {
        const body = {
          packageName: 'com.xingchat.web.muse',
          appPlatform: 4,
          channelName: 'web',
          machineId: 'zmusic-recovery-' + Date.now(),
          timestamp: Math.floor(Date.now() / 1000),
          nonce: 'recover' + Math.random().toString(36).substring(2, 10),
        };

        const headers = {
          'Content-Type': 'application/json',
          'App-Key': '8e33a5e60ef347df808d14026f27d227',
          'AuthToken': token,
        };
        if (cookieString) {
          headers['Cookie'] = cookieString;
        }

        const response = await fetch('https://project-api.atmob.com/project/song/v1/user/info', {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        });

        const raw = await response.text();
        const data = JSON.parse(raw);
        if (data.code === 0) {
          const d = data.data || {};
          const ls = d.loginStatus || 0;
          const mi = d.memberInfo || {};
          const credit = mi.credit ?? 0;
          const ep = mi.evaluationCreditPaid ?? 0;
          const en = mi.evaluationCreditNoPaid ?? 0;
          const displayed = credit + Math.max(0, ep - en);

          if (ls === 1) {
            console.log(`[RECOVER] SUCCESS! loginStatus=1, credits=${displayed}`);
            return true;
          } else {
            console.log(`[RECOVER] Still expired (loginStatus=${ls}), credits=${displayed}`);
          }
        } else {
          console.log(`[RECOVER] API returned code=${data.code}: ${data.msg}`);
        }
      } catch (e) {
        console.log(`[RECOVER] Direct verification failed: ${e.message}`);
      }
    }

    // Fall back to CDP check
    const loginInfo = await checkLogin();
    console.log(`[RECOVER] CDP check: loginStatus=${loginInfo.loginStatus}, loggedIn=${loginInfo.loggedIn}`);
    return loginInfo.loggedIn && (loginInfo.loginStatus || 0) === 1;
  } catch (e) {
    console.log(`[RECOVER] Exception: ${e.message}`);
    return false;
  }
}

/**
 * Start the keepalive timer. Runs every 5 minutes.
 * Safe to call multiple times — won't start duplicate timers.
 */
function startKeepalive(intervalMs = 300000) {
  if (keepaliveRunning) return;
  keepaliveRunning = true;

  // Run immediately on startup
  keepalivePing();

  // Then every interval
  keepaliveTimer = setInterval(keepalivePing, intervalMs);
  console.log(`[KEEPALIVE] Started — pinging every ${intervalMs / 60000} minutes`);
}

/**
 * Stop the keepalive timer.
 */
function stopKeepalive() {
  if (keepaliveTimer) {
    clearInterval(keepaliveTimer);
    keepaliveTimer = null;
  }
  keepaliveRunning = false;
  console.log('[KEEPALIVE] Stopped');
}

/**
 * Update the keepalive token from the controller.
 * Called when the controller refreshes its MUSE_TOKEN.
 */
function updateKeepaliveToken(token) {
  if (token && token.length > 20) {
    keepaliveToken = token;
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
  listPages,
  switchToPage,
  readLocalStorage,
  extractFromPage,
  extractMeloAuthFromPage,
  callOnPage,
  evalOnPage,
  readStorageFromPage,
  fillInputOnPage,
  readDisplayedCredit,
  startKeepalive,
  stopKeepalive,
  recoverSession,
  keepalivePing,
  updateKeepaliveToken,
  CDP_HOST,
  CDP_PORT,
};