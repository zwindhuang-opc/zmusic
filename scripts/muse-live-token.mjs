#!/usr/bin/env node
/**
 * muse-live-token.mjs — The JWT in muse-user-store is expired (code=1006
 * on /song/generate). But muse.top's own frontend CAN generate songs.
 * Find the LIVE token by:
 *   1. Decoding + comparing JWTs from muse-user-store vs muse-ai-token cookie
 *   2. Navigating to muse.top homepage (which makes API calls on load)
 *   3. Intercepting Network.requestWillBeSent to read the actual AuthToken
 *      header muse.top sends to project-api.atmob.com
 */
import WebSocket from 'ws';
import http from 'node:http';

const CDP_HOST = 'localhost';
const CDP_PORT = 9222;
let ws = null;
let msgId = 0;
const pending = new Map();
const capturedHeaders = [];

async function getTargets() {
  return new Promise((resolve, reject) => {
    http.get(`http://${CDP_HOST}:${CDH_PORT}/json`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function connect() {
  const targets = await new Promise((resolve, reject) => {
    http.get(`http://${CDP_HOST}:${CDP_PORT}/json`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
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
        const url = d.params?.request?.url || '';
        const hdrs = d.params?.request?.headers || {};
        // Capture any request to atmob.com or that has an AuthToken header
        if (url.includes('atmob.com') || url.includes('project-api') || hdrs.AuthToken || hdrs.authtoken) {
          capturedHeaders.push({
            url,
            method: d.params.request.method,
            headers: hdrs,
            postData: d.params.request.postData?.substring(0, 300),
            timestamp: d.params.timestamp,
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

function decodeJwt(jwt) {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return { error: 'not 3 parts' };
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    const decoded = JSON.parse(payload);
    return decoded;
  } catch (e) { return { error: e.message }; }
}

async function main() {
  try { await connect(); } catch (e) { console.error('Connect FAIL:', e.message); process.exit(1); }

  // 1. Read BOTH tokens and decode them
  console.log('\n=== 1. Read + decode both JWTs ===');
  const tokenExpr = `
    (function() {
      var storeToken = null, cookieToken = null;
      try {
        var raw = localStorage.getItem('muse-user-store');
        if (raw) { var obj = JSON.parse(raw); storeToken = obj.state?.token || obj.token; }
      } catch(e) {}
      try {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
          var p = cookies[i].trim().split('=');
          if (p[0] === 'muse-ai-token') cookieToken = p.slice(1).join('=');
        }
      } catch(e) {}
      return JSON.stringify({ storeToken: storeToken, cookieToken: cookieToken, same: storeToken === cookieToken });
    })()
  `;
  const raw = await evaluate(tokenExpr);
  const tokens = JSON.parse(raw || '{}');
  console.log('  storeToken len:', tokens.storeToken?.length, 'preview:', tokens.storeToken?.substring(0, 50) + '...');
  console.log('  cookieToken len:', tokens.cookieToken?.length, 'preview:', tokens.cookieToken?.substring(0, 50) + '...');
  console.log('  same?', tokens.same);

  if (tokens.storeToken) {
    const d1 = decodeJwt(tokens.storeToken);
    console.log('\n  storeToken decoded:', JSON.stringify(d1).substring(0, 400));
    if (d1.exp) {
      const expDate = new Date(d1.exp * 1000);
      const now = new Date();
      console.log('  storeToken expiry:', expDate.toISOString(), '| expired?', now > expDate);
    }
  }
  if (tokens.cookieToken) {
    const d2 = decodeJwt(tokens.cookieToken);
    console.log('\n  cookieToken decoded:', JSON.stringify(d2).substring(0, 400));
    if (d2.exp) {
      const expDate = new Date(d2.exp * 1000);
      const now = new Date();
      console.log('  cookieToken expiry:', expDate.toISOString(), '| expired?', now > expDate);
    }
  }

  // 2. Navigate to muse.top homepage to trigger API calls
  console.log('\n=== 2. Navigating to muse.top/ to intercept live API requests ===');
  capturedHeaders.length = 0;
  try {
    await cdp('Page.navigate', { url: 'https://muse.top/' });
  } catch {}
  // Wait for page load + API calls
  await new Promise(r => setTimeout(r, 8000));

  console.log(`\n  Captured ${capturedHeaders.length} API requests with AuthToken headers:`);
  capturedHeaders.forEach((req, i) => {
    console.log(`\n  Request ${i+1}: ${req.method} ${req.url}`);
    const at = req.headers.AuthToken || req.headers.authtoken || req.headers.Authorization;
    if (at) {
      console.log(`    AuthToken: len=${at.length} preview=${at.substring(0, 60)}...`);
      const decoded = decodeJwt(at);
      console.log(`    decoded:`, JSON.stringify(decoded).substring(0, 300));
      if (decoded.exp) {
        const expDate = new Date(decoded.exp * 1000);
        console.log(`    expiry: ${expDate.toISOString()} | expired? ${new Date() > expDate}`);
      }
      // Compare with store token
      if (tokens.storeToken && at !== tokens.storeToken) {
        console.log(`    ^^^ DIFFERENT from storeToken! This is the LIVE token!`);
      }
    } else {
      console.log('    No AuthToken header found. All headers:', JSON.stringify(req.headers));
    }
  });

  // 3. Also try making a direct API call from the page context (like muse.top does)
  // and see if it succeeds — this tells us if the page's OWN token works.
  console.log('\n=== 3. Direct API call from page context (test if page token works) ===');
  const apiTestExpr = `
    (async function() {
      // Read the token the SAME way muse.top's JS would
      var TOKEN = null;
      try {
        var raw = localStorage.getItem('muse-user-store');
        if (raw) { var obj = JSON.parse(raw); TOKEN = obj.state?.token || obj.token; }
      } catch(e) {}
      // Also try cookie
      if (!TOKEN) {
        try {
          var cookies = document.cookie.split(';');
          for (var i = 0; i < cookies.length; i++) {
            var p = cookies[i].trim().split('=');
            if (p[0] === 'muse-ai-token') TOKEN = p.slice(1).join('=');
          }
        } catch(e) {}
      }
      if (!TOKEN) return JSON.stringify({error: 'no token found'});

      // Call /user/info WITH the token
      var hdrs = { 'Content-Type': 'application/json', 'App-Key': '8e33a5e60ef347df808d14026f27d227', 'AuthToken': TOKEN };
      var body = { packageName: 'com.xingchat.web.muse', appPlatform: 4, channelName: 'web', machineId: 'zmusic-live-test', timestamp: Math.floor(Date.now()/1000), nonce: 'live' + Math.random().toString(36).slice(2,8) };
      try {
        var r = await fetch('https://project-api.atmob.com/project/song/v1/user/info', { method: 'POST', headers: hdrs, credentials: 'include', body: JSON.stringify(body) });
        var d = JSON.parse(await r.text());
        return JSON.stringify({ code: d.code, msg: d.msg, tokenLen: TOKEN.length, tokenPreview: TOKEN.substring(0, 30) });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    })()
  `;
  const apiResult = await evaluate(apiTestExpr);
  console.log('  Result:', apiResult);

  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
