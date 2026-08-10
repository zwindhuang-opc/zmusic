#!/usr/bin/env node
/**
 * muse-token-intercept.mjs — Find the AuthToken JWT that muse.top's frontend
 * sends to project-api.atmob.com. Three strategies:
 *   1. Dump ALL cookies (including HttpOnly) via CDP Network.getCookies
 *   2. Dump ALL localStorage + sessionStorage keys (not just known ones)
 *   3. Enable Network domain and intercept the NEXT API request to read
 *      the actual AuthToken header muse.top sends.
 */
import WebSocket from 'ws';
import http from 'node:http';

const CDP_HOST = 'localhost';
const CDP_PORT = 9222;
let ws = null;
let msgId = 0;
const pending = new Map();
const networkRequests = [];

async function getTargets() {
  return new Promise((resolve, reject) => {
    http.get(`http://${CDP_HOST}:${CDP_PORT}/json`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function connect() {
  const targets = await getTargets();
  let page = targets.find(t => t.type === 'page' && t.url && t.url.includes('muse.top'));
  if (!page) page = targets.find(t => t.type === 'page');
  if (!page) throw new Error('No muse.top page');
  console.log('[CDP] Attaching:', page.url);
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('WS timeout')), 5000);
    ws.addEventListener('open', () => { clearTimeout(t); resolve(); });
    ws.addEventListener('error', reject);
  });
  ws.addEventListener('message', (event) => {
    try {
      const d = JSON.parse(event.data || event.toString());
      if (d.id && pending.has(d.id)) {
        const { resolve, timeout } = pending.get(d.id);
        clearTimeout(timeout);
        pending.delete(d.id);
        resolve(d);
      } else if (d.method === 'Network.requestWillBeSent') {
        // Capture API requests to project-api.atmob.com
        const url = d.params?.request?.url || '';
        if (url.includes('atmob.com') || url.includes('project-api') || url.includes('user/info') || url.includes('song/generate')) {
          networkRequests.push({
            url,
            method: d.params.request.method,
            headers: d.params.request.headers,
            postData: d.params.request.postData?.substring(0, 500),
          });
        }
      }
    } catch {}
  });
  await cdp('Page.enable').catch(() => {});
  await cdp('Runtime.enable').catch(() => {});
  await cdp('Network.enable').catch(() => {});
}

function cdp(method, params = {}, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    const t = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs);
    pending.set(id, { resolve, timeout: t });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expr) {
  const res = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, 30000);
  return res.result?.result?.value;
}

async function main() {
  try { await connect(); } catch (e) { console.error('Connect FAIL:', e.message); process.exit(1); }

  // 1. Dump ALL cookies (including HttpOnly) for muse.top + atmob.com
  console.log('\n=== 1. ALL cookies (including HttpOnly) ===');
  try {
    const r = await cdp('Network.getCookies', { urls: ['https://muse.top/', 'https://muse.top/assets', 'https://project-api.atmob.com/'] });
    const cookies = r.result?.cookies || [];
    console.log(`  Found ${cookies.length} cookies:`);
    cookies.forEach(c => {
      const val = c.value.length > 80 ? c.value.substring(0, 80) + '...' : c.value;
      console.log(`  ${c.name} = ${val}  (domain=${c.domain} httpOnly=${c.httpOnly} secure=${c.secure} session=${c.session})`);
      // Flag any cookie that looks like a JWT (eyJ...)
      if (c.value.startsWith('eyJ') || c.value.length > 100) {
        console.log(`    ^^^ LOOKS LIKE JWT! (len=${c.value.length})`);
      }
    });
  } catch (e) { console.log('  Cookie dump error:', e.message); }

  // 2. Dump ALL localStorage + sessionStorage keys
  console.log('\n=== 2. ALL localStorage + sessionStorage keys ===');
  const storageExpr = `
    (function() {
      const ls = {}, ss = {};
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); const v = localStorage.getItem(k); ls[k] = v ? (v.length > 200 ? v.substring(0,200)+'...['+v.length+' chars]' : v) : null; } } catch(e) { ls.__error = e.message; }
      try { for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); const v = sessionStorage.getItem(k); ss[k] = v ? (v.length > 200 ? v.substring(0,200)+'...['+v.length+' chars]' : v) : null; } } catch(e) { ss.__error = e.message; }
      return JSON.stringify({ localStorage: ls, sessionStorage: ss, origin: location.origin, href: location.href });
    })()
  `;
  const storageRaw = await evaluate(storageExpr);
  const storage = JSON.parse(storageRaw || '{}');
  console.log('  origin:', storage.origin, 'href:', storage.href);
  console.log('\n  localStorage keys:');
  Object.entries(storage.localStorage || {}).forEach(([k, v]) => {
    console.log(`    ${k} = ${v}`);
    if (typeof v === 'string' && (v.startsWith('eyJ') || v.includes('eyJ'))) console.log(`      ^^^ CONTAINS JWT!`);
  });
  console.log('\n  sessionStorage keys:');
  Object.entries(storage.sessionStorage || {}).forEach(([k, v]) => {
    console.log(`    ${k} = ${v}`);
    if (typeof v === 'string' && (v.startsWith('eyJ') || v.includes('eyJ'))) console.log(`      ^^^ CONTAINS JWT!`);
  });

  // 3. Trigger an API call from the page and intercept the headers
  console.log('\n=== 3. Intercepting API request headers (triggering /user/info) ===');
  // Wait a moment for any in-flight requests, then trigger one
  await new Promise(r => setTimeout(r, 1000));

  // Trigger a fetch to the API the same way muse.top does — but we need to
  // see what headers muse.top's OWN JS sends. Let's reload the page to
  // capture the natural API calls muse.top makes on load.
  console.log('  (Waiting 5s to capture natural API requests from page...)');
  await new Promise(r => setTimeout(r, 5000));

  console.log(`\n  Captured ${networkRequests.length} API requests to atmob.com:`);
  networkRequests.forEach((req, i) => {
    console.log(`\n  Request ${i+1}: ${req.method} ${req.url}`);
    console.log('  Headers:');
    Object.entries(req.headers || {}).forEach(([k, v]) => {
      const val = v.length > 100 ? v.substring(0, 100) + '...' : v;
      console.log(`    ${k}: ${val}`);
      if (k.toLowerCase() === 'authtoken' || (k.toLowerCase() === 'authorization' && v.startsWith('Bearer'))) {
        console.log(`      ^^^ AUTH TOKEN FOUND! len=${v.length}`);
      }
    });
    if (req.postData) console.log('  body:', req.postData.substring(0, 200));
  });

  // 4. Also try to find the token in React internal state
  console.log('\n=== 4. React fiber state search for JWT ===');
  const reactExpr = `
    (function() {
      // Walk all DOM elements, find React fibers, search memoizedState/memoizedProps for JWT-like strings
      const found = [];
      const seen = new Set();
      function isJwt(s) { return typeof s === 'string' && s.startsWith('eyJ') && s.length > 100; }
      function searchObj(obj, depth, path) {
        if (depth > 5 || !obj || seen.has(obj)) return;
        seen.add(obj);
        try {
          for (const k of Object.keys(obj)) {
            const v = obj[k];
            if (isJwt(v)) { found.push({ path: path + '.' + k, len: v.length, preview: v.substring(0, 50) + '...' }); }
            else if (typeof v === 'object' && v !== null && depth < 4) searchObj(v, depth+1, path + '.' + k);
          }
        } catch(e) {}
      }
      // Find the root React container
      const root = document.getElementById('__next') || document.getElementById('root') || document.body.firstElementChild;
      if (root) {
        const fiberKey = Object.keys(root).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
        if (fiberKey) {
          let f = root[fiberKey];
          let count = 0;
          while (f && count < 200) {
            try {
              if (f.memoizedState) searchObj(f.memoizedState, 0, 'state');
              if (f.memoizedProps) searchObj(f.memoizedProps, 0, 'props');
              if (f.updateQueue?.memoizedState) searchObj(f.updateQueue.memoizedState, 0, 'queue');
            } catch(e) {}
            f = f.child || f.sibling || f.return;
            count++;
          }
        }
      }
      return JSON.stringify({ found: found.slice(0, 10), searched: seen.size });
    })()
  `;
  const reactRaw = await evaluate(reactExpr);
  const react = JSON.parse(reactRaw || '{}');
  console.log('  Searched', react.searched, 'objects in React fibers');
  if (react.found && react.found.length) {
    console.log('  JWT FOUND in React state:');
    react.found.forEach(f => console.log(`    at ${f.path}: len=${f.len} preview=${f.preview}`));
  } else {
    console.log('  No JWT found in React fiber state.');
  }

  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
