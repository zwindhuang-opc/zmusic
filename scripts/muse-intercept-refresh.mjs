/**
 * Muse Session Refresh Interceptor
 *
 * Connects to muse.top via CDP, enables Network domain to capture ALL
 * API requests, then reloads the page. Captures any auth/refresh/login
 * endpoints the page calls automatically.
 *
 * Also probes common refresh endpoint paths to find one that works.
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
const capturedRequests = [];

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
  if (!page) throw new Error('No page target');

  cdpWs = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('WS timeout')), 5000);
    cdpWs.addEventListener('open', () => {
      clearTimeout(t);
      cdpWs.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data || event.toString());
          // Capture network events
          if (data.method === 'Network.requestWillBeSent') {
            const req = data.params?.request;
            const url = data.params?.request?.url;
            if (url && url.includes('atmob.com')) {
              capturedRequests.push({
                url,
                method: req?.method,
                headers: req?.headers,
                postData: req?.postData?.substring(0, 500),
              });
            }
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
    cdpWs.addEventListener('error', (e) => { clearTimeout(t); reject(e); });
  });

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

// Extract current token
async function extractToken() {
  const expr = `
    (function() {
      try {
        var raw = localStorage.getItem('muse-user-store');
        if (!raw) return null;
        var obj = JSON.parse(raw);
        return obj.state?.token || obj.token || null;
      } catch(e) { return null; }
    })()
  `;
  return await evaluate(expr);
}

// Test a specific API endpoint
async function testEndpoint(path, body, authToken) {
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
        return JSON.stringify({ status: response.status, body: text.substring(0, 2000) });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    })()
  `;
  const result = await evaluate(expr);
  if (!result) return { error: 'No result' };
  return JSON.parse(result);
}

async function main() {
  console.log('=== Muse Session Refresh Interceptor ===\n');

  await connectCDP();
  console.log('[1] CDP connected\n');

  // Enable Network domain to capture requests
  await sendCDP('Network.enable').catch(() => {});
  console.log('[2] Network domain enabled\n');

  // Get current token
  const token = await extractToken();
  console.log(`[3] Token: ${token ? token.substring(0, 40) + '... (len=' + token.length + ')' : '(none)'}\n`);

  // Reload page and capture requests
  console.log('[4] Reloading muse.top and capturing network requests...');
  capturedRequests.length = 0;
  await sendCDP('Page.navigate', { url: 'https://muse.top/' }).catch(() => {});
  await new Promise(r => setTimeout(r, 8000)); // Wait 8 seconds for page to load and make API calls

  console.log(`\n[5] Captured ${capturedRequests.length} API requests to atmob.com:`);
  capturedRequests.forEach((req, i) => {
    console.log(`  ${i + 1}. ${req.method} ${req.url}`);
    if (req.headers?.['AuthToken']) {
      console.log(`     AuthToken: ${req.headers['AuthToken'].substring(0, 40)}...`);
    }
    if (req.headers?.['App-Key']) {
      console.log(`     App-Key: ${req.headers['App-Key']}`);
    }
    if (req.postData) {
      console.log(`     Body: ${req.postData.substring(0, 200)}`);
    }
  });
  console.log('');

  // Also search the page's JavaScript for API paths
  console.log('[6] Searching page source for auth/refresh endpoints...');
  const apiPaths = await evaluate(`
    (function() {
      try {
        // Get all script tags and search for API paths
        var scripts = document.querySelectorAll('script[src]');
        var srcs = Array.from(scripts).map(s => s.src).filter(s => s.includes('.js'));

        // Also check for any global config objects
        var results = [];
        if (window.__APP_CONFIG__) results.push('window.__APP_CONFIG__: ' + JSON.stringify(window.__APP_CONFIG__).substring(0, 500));
        if (window.__NUXT__) results.push('window.__NUXT__ found');
        if (window.__INITIAL_STATE__) results.push('window.__INITIAL_STATE__ found');

        // Check for Vue/React app instance
        var app = document.querySelector('#app');
        if (app && app.__vue_app__) results.push('Vue 3 app found');
        if (app && app.__vue__) results.push('Vue 2 app found');

        // Check for Pinia/Vuex stores
        try {
          var stores = Object.keys(window).filter(k =>
            k.toLowerCase().includes('store') ||
            k.toLowerCase().includes('pinia') ||
            k.toLowerCase().includes('vuex')
          );
          if (stores.length) results.push('Store globals: ' + stores.join(', '));
        } catch(e) {}

        return results.join('\\n');
      } catch(e) { return 'Error: ' + e.message; }
    })()
  `);
  console.log(apiPaths || '(none found)');
  console.log('');

  // Try potential refresh endpoints
  console.log('[7] Probing potential refresh/relogin endpoints...');
  const refreshPaths = [
    '/project/song/v1/user/refresh',
    '/project/song/v1/user/relogin',
    '/project/song/v1/auth/refresh',
    '/project/song/v1/session/refresh',
    '/project/song/v1/user/reauth',
    '/project/song/v1/token/refresh',
    '/project/song/v1/user/info',
  ];

  for (const path of refreshPaths) {
    const result = await testEndpoint(path, {}, token);
    if (result.body) {
      try {
        const d = JSON.parse(result.body);
        const codeStr = d.code !== undefined ? `code=${d.code}` : 'no-code';
        const msgStr = d.msg ? ` msg=${d.msg}` : '';
        console.log(`  ${path}: ${codeStr}${msgStr}`);
        if (d.code === 0) {
          console.log(`    SUCCESS! Full response: ${result.body.substring(0, 500)}`);
        }
      } catch {
        console.log(`  ${path}: raw=${result.body.substring(0, 100)}`);
      }
    } else {
      console.log(`  ${path}: error=${result.error}`);
    }
  }

  // Check cookies
  console.log('\n[8] Checking cookies...');
  const cookies = await sendCDP('Network.getCookies', { urls: ['https://muse.top', 'https://project-api.atmob.com'] }).catch(() => {});
  const cookieList = cookies?.result?.cookies || [];
  console.log(`  Found ${cookieList.length} cookies:`);
  cookieList.forEach(c => {
    console.log(`  ${c.name}=${c.value.substring(0, 50)}${c.value.length > 50 ? '...' : ''} (domain=${c.domain} httpOnly=${c.httpOnly} expires=${c.expires ? new Date(c.expires * 1000).toISOString() : 'session'})`);
  });

  console.log('\n=== Interceptor Complete ===');
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
