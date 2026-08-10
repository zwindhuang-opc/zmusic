#!/usr/bin/env node
/**
 * muse-generate-jwt-fields.mjs — Try Muse /song/generate using the JWT's
 * own sid/did (not the API response's ssid/deviceId). Also try without
 * any sid at all, and try calling muse.top's own JS generate function.
 */
import WebSocket from 'ws';
import http from 'node:http';

const CDP_HOST = 'localhost';
const CDP_PORT = 9222;
let ws = null;
let msgId = 0;
const pending = new Map();

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
      }
    } catch {}
  });
  await cdp('Page.enable').catch(() => {});
  await cdp('Runtime.enable').catch(() => {});
}

function cdp(method, params = {}, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    const t = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs);
    pending.set(id, { resolve, timeout: t });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expr) {
  const res = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, 60000);
  return res.result?.result?.value;
}

async function main() {
  try { await connect(); } catch (e) { console.error('Connect FAIL:', e.message); process.exit(1); }

  // Decode the JWT to get sid/did
  const decodeExpr = `
    (function() {
      var raw = localStorage.getItem('muse-user-store');
      if (!raw) return JSON.stringify({error: 'no store'});
      var obj = JSON.parse(raw);
      var token = obj.state?.token || obj.token;
      if (!token) return JSON.stringify({error: 'no token'});
      var parts = token.split('.');
      var payload = JSON.parse(atob(parts[1]));
      return JSON.stringify({ token: token, sid: payload.sid, did: payload.did, uid: payload.uid, exp: payload.exp, iat: payload.iat, log: payload.log });
    })()
  `;
  const jwtRaw = await evaluate(decodeExpr);
  const jwt = JSON.parse(jwtRaw || '{}');
  console.log('JWT decoded: sid=' + jwt.sid + ' did=' + jwt.did + ' uid=' + jwt.uid + ' log=' + jwt.log);

  // Test A: Use JWT's sid + did in the generate body
  console.log('\n=== Test A: /song/generate with JWT sid + did ===');
  const testA = await evaluate(`
    (async function() {
      var raw = localStorage.getItem('muse-user-store');
      var obj = JSON.parse(raw);
      var TOKEN = obj.state?.token || obj.token;
      var parts = TOKEN.split('.');
      var payload = JSON.parse(atob(parts[1]));
      var hdrs = { 'Content-Type': 'application/json', 'App-Key': '8e33a5e60ef347df808d14026f27d227', 'AuthToken': TOKEN };
      var body = {
        packageName: 'com.xingchat.web.muse',
        appPlatform: 4,
        channelName: 'web',
        machineId: payload.did,
        deviceId: payload.did,
        timestamp: Math.floor(Date.now()/1000),
        nonce: 'jwt'+Math.random().toString(36).slice(2,8),
        sid: payload.sid,
        description: '夏日海边夕阳下的浪漫回忆',
        songModel: 'general',
        instrumental: 0
      };
      try {
        var r = await fetch('https://project-api.atmob.com/project/song/v1/song/deepseek/generate', { method: 'POST', headers: hdrs, credentials: 'include', body: JSON.stringify(body) });
        var d = JSON.parse(await r.text());
        return JSON.stringify({ code: d.code, msg: d.msg, data: d.data, traceId: d.traceId });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    })()
  `);
  console.log('  Result:', testA);

  // Test B: No sid, no deviceId — minimal body
  console.log('\n=== Test B: /song/generate minimal body (no sid/deviceId) ===');
  const testB = await evaluate(`
    (async function() {
      var raw = localStorage.getItem('muse-user-store');
      var obj = JSON.parse(raw);
      var TOKEN = obj.state?.token || obj.token;
      var hdrs = { 'Content-Type': 'application/json', 'App-Key': '8e33a5e60ef347df808d14026f27d227', 'AuthToken': TOKEN };
      var body = {
        packageName: 'com.xingchat.web.muse',
        appPlatform: 4,
        channelName: 'web',
        timestamp: Math.floor(Date.now()/1000),
        nonce: 'min'+Math.random().toString(36).slice(2,8),
        description: '夏日海边夕阳下的浪漫回忆',
        songModel: 'general',
        instrumental: 0
      };
      try {
        var r = await fetch('https://project-api.atmob.com/project/song/v1/song/deepseek/generate', { method: 'POST', headers: hdrs, credentials: 'include', body: JSON.stringify(body) });
        var d = JSON.parse(await r.text());
        return JSON.stringify({ code: d.code, msg: d.msg, data: d.data });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    })()
  `);
  console.log('  Result:', testB);

  // Test C: Try /song/v1/song/evaluation/generate (evaluation-specific endpoint?)
  console.log('\n=== Test C: Try evaluation-specific generate endpoint ===');
  const testC = await evaluate(`
    (async function() {
      var raw = localStorage.getItem('muse-user-store');
      var obj = JSON.parse(raw);
      var TOKEN = obj.state?.token || obj.token;
      var hdrs = { 'Content-Type': 'application/json', 'App-Key': '8e33a5e60ef347df808d14026f27d227', 'AuthToken': TOKEN };
      var body = { packageName: 'com.xingchat.web.muse', appPlatform: 4, channelName: 'web', machineId: 'eval-test', timestamp: Math.floor(Date.now()/1000), nonce: 'ev'+Math.random().toString(36).slice(2,8), description: '夏日海边', songModel: 'general', instrumental: 0 };
      var endpoints = [
        '/project/song/v1/song/evaluation/generate',
        '/project/song/v1/song/trial/generate',
        '/project/song/v1/song/free/generate',
        '/project/song/v1/evaluation/song/generate',
        '/project/song/v1/song/deepseek/evaluation'
      ];
      var results = {};
      for (var i = 0; i < endpoints.length; i++) {
        try {
          var r = await fetch('https://project-api.atmob.com' + endpoints[i], { method: 'POST', headers: hdrs, credentials: 'include', body: JSON.stringify(body) });
          var t = await r.text();
          results[endpoints[i]] = { status: r.status, body: t.substring(0, 200) };
        } catch(e) { results[endpoints[i]] = { error: e.message }; }
      }
      return JSON.stringify(results);
    })()
  `);
  console.log('  Result:', testC);

  // Test D: Try to find muse.top's own generate function in the JS bundle
  console.log('\n=== Test D: Search for generate function in muse.top JS ===');
  const testD = await evaluate(`
    (function() {
      // Look for any global function or store that might be the generate API
      var found = [];
      // Check for common framework patterns
      try {
        // Next.js: check __NEXT_DATA__ for API routes
        var nd = window.__NEXT_DATA__;
        if (nd) {
          found.push({ type: '__NEXT_DATA__', buildId: nd.buildId, page: nd.page });
        }
      } catch(e) {}
      // Look for any fetch wrapper or API client in window
      for (var k of Object.keys(window)) {
        try {
          var v = window[k];
          if (v && typeof v === 'object') {
            var s = JSON.stringify(v);
            if (s && s.includes('song/generate') || s && s.includes('deepseek/generate')) {
              found.push({ type: 'window.' + k, snippet: s.substring(0, 300) });
            }
          }
        } catch(e) {}
      }
      // Also search script tags for the generate endpoint
      var scripts = document.querySelectorAll('script[src]');
      var scriptSrcs = [];
      scripts.forEach(function(s) { scriptSrcs.push(s.src); });
      return JSON.stringify({ found: found, scriptCount: scripts.length, sampleScripts: scriptSrcs.slice(0, 10) });
    })()
  `);
  console.log('  Result:', testD);

  // Test E: Check if muse.top's page can tell us the loginStatus
  console.log('\n=== Test E: Check page-level login state ===');
  const testE = await evaluate(`
    (function() {
      // Check muse-user-store for full state
      var raw = localStorage.getItem('muse-user-store');
      if (!raw) return JSON.stringify({error: 'no store'});
      var obj = JSON.parse(raw);
      // Print the full state object (but redact the token)
      var state = obj.state || {};
      var safeState = {};
      for (var k of Object.keys(state)) {
        if (k === 'token') safeState[k] = '[REDACTED len=' + (state[k]?.length || 0) + ']';
        else safeState[k] = state[k];
      }
      return JSON.stringify({ stateKeys: Object.keys(state), safeState: safeState, version: obj.version });
    })()
  `);
  console.log('  Result:', testE);

  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
