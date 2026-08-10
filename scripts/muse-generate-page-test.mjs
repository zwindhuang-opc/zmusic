#!/usr/bin/env node
/**
 * muse-generate-page-test.mjs — Make the /song/generate call DIRECTLY
 * from the muse.top page context (same origin, same cookies, same
 * headers as muse.top's own frontend) to see if it succeeds there.
 * If it does, the issue is in how our backend constructs the request.
 * If it doesn't, the token/account itself can't generate.
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

  // Test 1: Make /user/info call WITH token from page context (should work)
  console.log('=== Test 1: /user/info WITH AuthToken from page ===');
  const test1 = await evaluate(`
    (async function() {
      var TOKEN = null;
      try { var raw = localStorage.getItem('muse-user-store'); if (raw) { var obj = JSON.parse(raw); TOKEN = obj.state?.token || obj.token; } } catch(e) {}
      var hdrs = { 'Content-Type': 'application/json', 'App-Key': '8e33a5e60ef347df808d14026f27d227', 'AuthToken': TOKEN };
      var body = { packageName: 'com.xingchat.web.muse', appPlatform: 4, channelName: 'web', machineId: 'page-test', timestamp: Math.floor(Date.now()/1000), nonce: 't1'+Math.random().toString(36).slice(2,8) };
      var r = await fetch('https://project-api.atmob.com/project/song/v1/user/info', { method: 'POST', headers: hdrs, credentials: 'include', body: JSON.stringify(body) });
      var d = JSON.parse(await r.text());
      return JSON.stringify({ code: d.code, msg: d.msg, credit: d.data?.memberInfo?.credit, evalPaid: d.data?.memberInfo?.evaluationCreditPaid, evalNoPaid: d.data?.memberInfo?.evaluationCreditNoPaid, deviceId: d.data?.deviceId, ssid: d.data?.ssid, loginStatus: d.data?.loginStatus });
    })()
  `);
  console.log('  Result:', test1);

  // Test 2: Make /song/deepseek/generate call WITH token from page context
  console.log('\n=== Test 2: /song/deepseek/generate WITH AuthToken from page ===');
  const test2 = await evaluate(`
    (async function() {
      var TOKEN = null;
      try { var raw = localStorage.getItem('muse-user-store'); if (raw) { var obj = JSON.parse(raw); TOKEN = obj.state?.token || obj.token; } } catch(e) {}
      var hdrs = { 'Content-Type': 'application/json', 'App-Key': '8e33a5e60ef347df808d14026f27d227', 'AuthToken': TOKEN };
      var body = {
        packageName: 'com.xingchat.web.muse',
        appPlatform: 4,
        channelName: 'web',
        machineId: 'page-test',
        timestamp: Math.floor(Date.now()/1000),
        nonce: 'gen'+Math.random().toString(36).slice(2,8),
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
  console.log('  Result:', test2);

  // Test 3: Also try /song/generate (master mode) with lyrics
  console.log('\n=== Test 3: /song/generate (master) WITH AuthToken from page ===');
  const test3 = await evaluate(`
    (async function() {
      var TOKEN = null;
      try { var raw = localStorage.getItem('muse-user-store'); if (raw) { var obj = JSON.parse(raw); TOKEN = obj.state?.token || obj.token; } } catch(e) {}
      var hdrs = { 'Content-Type': 'application/json', 'App-Key': '8e33a5e60ef347df808d14026f27d227', 'AuthToken': TOKEN };
      var body = {
        packageName: 'com.xingchat.web.muse',
        appPlatform: 4,
        channelName: 'web',
        machineId: 'page-test',
        timestamp: Math.floor(Date.now()/1000),
        nonce: 'master'+Math.random().toString(36).slice(2,8),
        lyrics: '夏日夕阳照海面\\n微风轻拂脸庞\\n回忆在心中荡漾\\n你是我的光',
        style: '流行音乐',
        title: '海边夕阳',
        instrumental: 0
      };
      try {
        var r = await fetch('https://project-api.atmob.com/project/song/v1/song/generate', { method: 'POST', headers: hdrs, credentials: 'include', body: JSON.stringify(body) });
        var d = JSON.parse(await r.text());
        return JSON.stringify({ code: d.code, msg: d.msg, data: d.data, traceId: d.traceId });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    })()
  `);
  console.log('  Result:', test3);

  // Test 4: Try with deviceId + sid from the user/info response
  console.log('\n=== Test 4: /song/generate with deviceId + sid from API ===');
  const test4 = await evaluate(`
    (async function() {
      var TOKEN = null;
      try { var raw = localStorage.getItem('muse-user-store'); if (raw) { var obj = JSON.parse(raw); TOKEN = obj.state?.token || obj.token; } } catch(e) {}
      var hdrs = { 'Content-Type': 'application/json', 'App-Key': '8e33a5e60ef347df808d14026f27d227', 'AuthToken': TOKEN };
      // First get user info to extract deviceId + ssid
      var infoBody = { packageName: 'com.xingchat.web.muse', appPlatform: 4, channelName: 'web', machineId: 'page-test', timestamp: Math.floor(Date.now()/1000), nonce: 'i'+Math.random().toString(36).slice(2,8) };
      var r1 = await fetch('https://project-api.atmob.com/project/song/v1/user/info', { method: 'POST', headers: hdrs, credentials: 'include', body: JSON.stringify(infoBody) });
      var d1 = JSON.parse(await r1.text());
      var deviceId = d1.data?.deviceId || '';
      var ssid = d1.data?.ssid || '';

      // Now make generate call WITH deviceId + sid
      var genBody = {
        packageName: 'com.xingchat.web.muse',
        appPlatform: 4,
        channelName: 'web',
        machineId: deviceId,
        deviceId: deviceId,
        timestamp: Math.floor(Date.now()/1000),
        nonce: 'gen2'+Math.random().toString(36).slice(2,8),
        sid: ssid,
        description: '夏日海边夕阳下的浪漫回忆',
        songModel: 'general',
        instrumental: 0
      };
      try {
        var r2 = await fetch('https://project-api.atmob.com/project/song/v1/song/deepseek/generate', { method: 'POST', headers: hdrs, credentials: 'include', body: JSON.stringify(genBody) });
        var d2 = JSON.parse(await r2.text());
        return JSON.stringify({ code: d2.code, msg: d2.msg, data: d2.data, traceId: d2.traceId, deviceId: deviceId, ssid: ssid });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    })()
  `);
  console.log('  Result:', test4);

  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
