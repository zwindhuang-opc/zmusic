/**
 * Muse Session Refresh & Diagnostic Script
 *
 * This script:
 *   1. Connects to the user's existing Edge browser via CDP (port 9222)
 *   2. Extracts the current JWT from localStorage['muse-user-store']
 *   3. Decodes the JWT to check the `exp` (expiry) claim
 *   4. Reloads muse.top to trigger potential token refresh
 *   5. Re-extracts the JWT and compares
 *   6. Tests /user/info AND /generate with the (potentially refreshed) token
 *   7. Reports exactly what works and what doesn't
 *
 * Usage: node scripts/muse-session-refresh.mjs
 */

import WebSocket from 'ws';
import http from 'http';

const CDP_HOST = 'localhost';
const CDP_PORT = 9222;
const MUSE_API = 'https://project-api.atmob.com';
const APP_KEY = '8e33a5e60ef347df808d14026f27d227';

let cdpWs = null;
let cdpMsgId = 0;
const pending = new Map();

// ---------------------------------------------------------------------------
// CDP helpers
// ---------------------------------------------------------------------------

async function connectCDP() {
  const targets = await new Promise((resolve, reject) => {
    http.get(`http://${CDP_HOST}:${CDP_PORT}/json`, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('Parse error')); } });
    }).on('error', reject);
  });

  const page = targets.find(t => t.type === 'page' && t.url && t.url.includes('muse.top'))
    || targets.find(t => t.type === 'page');

  if (!page) throw new Error('No page target found');
  console.log(`[CDP] Attaching to: ${page.url}`);

  cdpWs = new WebSocket(page.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('WS timeout')), 5000);
    cdpWs.addEventListener('open', () => {
      clearTimeout(t);
      cdpWs.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data || event.toString());
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
  });

  await sendCDP('Page.enable').catch(() => { });
  await sendCDP('Runtime.enable').catch(() => { });
  return page;
}

async function sendCDP(method, params = {}, timeoutMs = 10000) {
  const id = ++cdpMsgId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, timeoutMs);
    pending.set(id, { resolve, timeout });
    cdpWs.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expr) {
  const result = await sendCDP('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, 20000);
  return result.result?.result?.value;
}

async function navigate(url, waitMs = 3000) {
  await sendCDP('Page.navigate', { url });
  await new Promise(r => setTimeout(r, waitMs));
}

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch (e) {
    return { error: e.message };
  }
}

// ---------------------------------------------------------------------------
// Token extraction (same logic as museCdpBridge.js)
// ---------------------------------------------------------------------------

async function extractToken() {
  const expr = `
    (function() {
      var found = null, source = '';
      var keys = ['AuthToken','authToken','token','muse_token','museToken','Authorization','access_token','accessToken','ssid','sid'];
      for (var i = 0; i < keys.length && !found; i++) {
        try { var v = localStorage.getItem(keys[i]) || sessionStorage.getItem(keys[i]); if (v && v.length > 10) { found = v; source = keys[i]; } } catch(e) {}
      }
      if (!found) {
        var nestedKeys = ['muse-user-store','museUserStore','userInfo','user','muse-user-info','userStore','auth'];
        for (var j = 0; j < nestedKeys.length && !found; j++) {
          try {
            var raw = localStorage.getItem(nestedKeys[j]) || sessionStorage.getItem(nestedKeys[j]);
            if (!raw) continue;
            var obj = JSON.parse(raw);
            var cand = obj.token || obj.authToken || obj.Authorization || obj.ssid
              || (obj.state && (obj.state.token || obj.state.authToken || obj.state.ssid))
              || (obj.data && (obj.data.token || obj.data.ssid || obj.data.authToken))
              || (obj.user && (obj.user.token || obj.user.ssid));
            if (cand && cand.length > 10) { found = cand; source = nestedKeys[j] + '.token'; }
          } catch(e) {}
        }
      }
      if (!found) {
        try {
          var cookies = document.cookie.split(';');
          for (var k = 0; k < cookies.length && !found; k++) {
            var parts = cookies[k].trim().split('=');
            var cname = parts[0]; var cval = parts.slice(1).join('=');
            if ((cname === 'muse-ai-token' || cname === 'AuthToken' || cname === 'token' || cname === 'ssid') && cval && cval.length > 50) { found = cval; source = 'cookie:' + cname; }
          }
        } catch(e) {}
      }
      return JSON.stringify({ token: found, source: source, origin: location.origin, href: location.href });
    })()
  `;
  const val = await evaluate(expr);
  if (val) return JSON.parse(val);
  return { token: null, source: null };
}

// ---------------------------------------------------------------------------
// API test helpers — call Muse API directly from the browser context
// ---------------------------------------------------------------------------

async function testApiCall(path, body, authToken) {
  const url = `${MUSE_API}${path}`;
  const fullBody = {
    packageName: 'com.xingchat.web.muse',
    appPlatform: 4,
    channelName: 'web',
    machineId: 'zmusic-diag',
    timestamp: Math.floor(Date.now() / 1000),
    nonce: 'diag' + Math.random().toString(36).substring(2, 10),
    ...body,
  };

  const headers = {
    'Content-Type': 'application/json',
    'App-Key': APP_KEY,
    ...(authToken ? { 'AuthToken': authToken } : {}),
  };

  const expr = `
    (async function() {
      try {
        const response = await fetch(${JSON.stringify(url)}, {
          method: 'POST',
          headers: ${JSON.stringify(headers)},
          credentials: 'include',
          body: JSON.stringify(${JSON.stringify(fullBody)}),
        });
        const text = await response.text();
        return JSON.stringify({ status: response.status, body: text.substring(0, 5000) });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    })()
  `;

  const result = await evaluate(expr);
  if (!result) return { error: 'No result' };
  return JSON.parse(result);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Muse Session Refresh & Diagnostic ===\n');

  // Step 1: Connect
  await connectCDP();
  console.log('[1] CDP connected\n');

  // Step 2: Extract current token
  const tokenInfo1 = await extractToken();
  const token1 = tokenInfo1.token;
  console.log(`[2] Current token: source=${tokenInfo1.source} origin=${tokenInfo1.origin}`);
  console.log(`    Token length: ${token1 ? token1.length : 0}`);
  console.log(`    Token preview: ${token1 ? token1.substring(0, 40) + '...' : '(none)'}\n`);

  // Step 3: Decode JWT
  if (token1) {
    const payload = decodeJWT(token1);
    if (payload && !payload.error) {
      const exp = payload.exp;
      const iat = payload.iat;
      const now = Math.floor(Date.now() / 1000);
      const expired = exp && now > exp;
      console.log(`[3] JWT payload:`);
      console.log(`    iat: ${iat} (${new Date(iat * 1000).toISOString()})`);
      console.log(`    exp: ${exp} (${new Date(exp * 1000).toISOString()})`);
      console.log(`    now: ${now} (${new Date(now * 1000).toISOString()})`);
      console.log(`    EXPIRED: ${expired}`);
      console.log(`    user_id: ${payload.user_id || payload.userId || payload.sub || 'n/a'}`);
      console.log(`    session_id: ${payload.session_id || payload.sessionId || 'n/a'}`);
      console.log(`    All keys: ${Object.keys(payload).join(', ')}\n`);
    } else {
      console.log(`[3] JWT decode failed: ${payload?.error}\n`);
    }
  }

  // Step 4: Test /user/info with current token
  console.log('[4] Testing /user/info with current token...');
  const userResult1 = await testApiCall('/project/song/v1/user/info', {}, token1);
  if (userResult1.body) {
    try {
      const d = JSON.parse(userResult1.body);
      console.log(`    code=${d.code} msg=${d.msg}`);
      if (d.code === 0 && d.data) {
        const mi = d.data.memberInfo || {};
        console.log(`    memberInfo.credit=${mi.credit} evaluationCreditPaid=${mi.evaluationCreditPaid} evaluationCreditNoPaid=${mi.evaluationCreditNoPaid}`);
        console.log(`    isMember=${mi.isMember} paidMember=${mi.paidMember}`);
        console.log(`    subscription=${JSON.stringify(mi.subscription)}`);
        console.log(`    loginStatus=${d.data.loginStatus}`);
      }
    } catch { console.log(`    raw: ${userResult1.body.substring(0, 200)}`); }
  } else {
    console.log(`    error: ${userResult1.error}`);
  }
  console.log('');

  // Step 5: Test /generate with current token
  console.log('[5] Testing /generate with current token...');
  const genResult1 = await testApiCall('/project/song/v1/song/deepseek/generate', {
    description: '一首关于春天的流行歌曲，轻快愉悦',
    songModel: 'general',
    instrumental: 0,
  }, token1);
  if (genResult1.body) {
    try {
      const d = JSON.parse(genResult1.body);
      console.log(`    code=${d.code} msg=${d.msg}`);
      if (d.code === 0 && d.data) {
        console.log(`    SUCCESS! data=${JSON.stringify(d.data).substring(0, 300)}`);
      }
    } catch { console.log(`    raw: ${genResult1.body.substring(0, 200)}`); }
  } else {
    console.log(`    error: ${genResult1.error}`);
  }
  console.log('');

  // Step 6: Reload muse.top to try to refresh the token
  console.log('[6] Reloading muse.top to trigger token refresh...');
  await navigate('https://muse.top/', 5000);
  console.log('    Page reloaded.\n');

  // Step 7: Re-extract token
  const tokenInfo2 = await extractToken();
  const token2 = tokenInfo2.token;
  console.log(`[7] New token: source=${tokenInfo2.source}`);
  console.log(`    Token length: ${token2 ? token2.length : 0}`);
  console.log(`    Same as before? ${token1 === token2}`);
  if (token2 && token1 !== token2) {
    console.log(`    NEW TOKEN DETECTED! preview: ${token2.substring(0, 40)}...`);
    const payload2 = decodeJWT(token2);
    if (payload2 && !payload2.error) {
      console.log(`    New exp: ${payload2.exp} (${new Date(payload2.exp * 1000).toISOString()})`);
    }
  }
  console.log('');

  // Step 8: Test /generate with new token (if different)
  const testToken = token2 || token1;
  console.log('[8] Testing /generate with final token...');
  const genResult2 = await testApiCall('/project/song/v1/song/deepseek/generate', {
    description: '一首关于春天的流行歌曲，轻快愉悦',
    songModel: 'general',
    instrumental: 0,
  }, testToken);
  if (genResult2.body) {
    try {
      const d = JSON.parse(genResult2.body);
      console.log(`    code=${d.code} msg=${d.msg}`);
      if (d.code === 0 && d.data) {
        console.log(`    SUCCESS! data=${JSON.stringify(d.data).substring(0, 300)}`);
      } else if (d.code === 1006) {
        console.log('    LOGIN_EXPIRED — session is genuinely expired server-side.');
        console.log('    The user needs to actively log in to muse.top in the Edge browser.');
      }
    } catch { console.log(`    raw: ${genResult2.body.substring(0, 200)}`); }
  } else {
    console.log(`    error: ${genResult2.error}`);
  }

  // Step 9: Also dump the full localStorage muse-user-store for analysis
  console.log('\n[9] Dumping muse-user-store from localStorage...');
  const storeDump = await evaluate(`
    (function() {
      try {
        var raw = localStorage.getItem('muse-user-store');
        if (!raw) return 'null';
        var obj = JSON.parse(raw);
        var state = obj.state || {};
        var profile = state.profile || {};
        var mi = profile.memberInfo || {};
        return JSON.stringify({
          hasToken: !!state.token,
          tokenPreview: state.token ? state.token.substring(0, 30) + '...' : null,
          isLoggedIn: state.isLoggedIn,
          loginStatus: profile.loginStatus,
          memberInfo: {
            credit: mi.credit,
            isMember: mi.isMember,
            paidMember: mi.paidMember,
            evaluationCreditPaid: mi.evaluationCreditPaid,
            evaluationCreditNoPaid: mi.evaluationCreditNoPaid,
            subscription: mi.subscription,
          },
          keys: Object.keys(obj),
          stateKeys: Object.keys(state),
          profileKeys: Object.keys(profile),
        }, null, 2);
      } catch(e) { return 'Error: ' + e.message; }
    })()
  `);
  console.log(storeDump);

  console.log('\n=== Diagnostic Complete ===');
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
