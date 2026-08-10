/**
 * Muse Generate Test - With Body AuthToken
 *
 * The muse.top web app sends the JWT BOTH as the AuthToken header AND
 * as an `authToken` field in the request body. Our CDP bridge only sends
 * it as a header. This script tests whether adding it to the body fixes
 * the code=1006 (login expired) error on /generate.
 *
 * It also extracts the correct machineId from the page's localStorage.
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
  await sendCDP('Page.enable').catch(() => {});
  await sendCDP('Runtime.enable').catch(() => {});
  return page;
}

async function sendCDP(method, params = {}, timeoutMs = 15000) {
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

async function main() {
  console.log('=== Muse Generate Test (Body AuthToken) ===\n');
  await connectCDP();

  // Extract token, machineId, ssid from localStorage
  const storeData = await evaluate(`
    (function() {
      try {
        var raw = localStorage.getItem('muse-user-store');
        if (!raw) return 'null';
        var obj = JSON.parse(raw);
        var state = obj.state || {};
        var profile = state.profile || {};
        return JSON.stringify({
          token: state.token,
          machineId: profile.deviceId,
          ssid: profile.ssid,
          userId: profile.userId,
          uid: profile.uid,
        });
      } catch(e) { return 'Error: ' + e.message; }
    })()
  `);
  const parsed = JSON.parse(storeData);
  const token = parsed.token;
  const machineId = parsed.machineId;
  const ssid = parsed.ssid;
  console.log(`Token: ${token?.substring(0, 40)}... (len=${token?.length})`);
  console.log(`machineId: ${machineId}`);
  console.log(`ssid: ${ssid}`);
  console.log(`userId: ${parsed.userId}`);
  console.log('');

  // Also check for a client-generated machineId in localStorage
  const clientMachineId = await evaluate(`
    (function() {
      // The muse.top app might store a client-generated UUID in localStorage
      var keys = ['machineId','deviceId','client_id','clientId','uuid','machine_id'];
      for (var i = 0; i < keys.length; i++) {
        var v = localStorage.getItem(keys[i]);
        if (v) return JSON.stringify({ key: keys[i], value: v });
      }
      // Also check muse-user-store for a machineId at the state level
      try {
        var raw = localStorage.getItem('muse-user-store');
        var obj = JSON.parse(raw);
        if (obj.state?.machineId) return JSON.stringify({ key: 'state.machineId', value: obj.state.machineId });
      } catch(e) {}
      return 'null';
    })()
  `);
  console.log(`Client machineId: ${clientMachineId}`);
  console.log('');

  // The muse.top web app sends machineId as a UUID like "117063c2-49f7-45b8-ba20-18431aca5ebd"
  // This is NOT the deviceId from the API response. It's likely generated client-side
  // and stored in localStorage or a cookie. Let's check cookies too.
  const cookieMachineId = await evaluate(`
    (function() {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var parts = cookies[i].trim().split('=');
        if (parts[0] === 'machineId' || parts[0] === 'deviceId' || parts[0] === 'uuid') {
          return JSON.stringify({ key: parts[0], value: parts.slice(1).join('=') });
        }
      }
      return 'null';
    })()
  `);
  console.log(`Cookie machineId: ${cookieMachineId}`);
  console.log('');

  // Now test /generate WITH the authToken in the body (like muse.top does)
  console.log('=== Test 1: /generate WITH body authToken (like muse.top) ===');
  const genBody1 = {
    packageName: 'com.xingchat.web.muse',
    appPlatform: 4,
    channelName: 'web',
    machineId: machineId || 'zmusic-cdp',
    timestamp: Math.floor(Date.now() / 1000),
    nonce: 'test' + Math.random().toString(36).substring(2, 10),
    authToken: token,  // <-- KEY: include authToken in body like muse.top does
    ...(ssid ? { sid: ssid } : {}),
    description: '一首关于春天的流行歌曲，轻快愉悦',
    songModel: 'general',
    instrumental: 0,
  };

  const headers1 = {
    'Content-Type': 'application/json',
    'App-Key': APP_KEY,
    'AuthToken': token,
  };

  const expr1 = `
    (async function() {
      try {
        const response = await fetch(${JSON.stringify(MUSE_API + '/project/song/v1/song/deepseek/generate')}, {
          method: 'POST',
          headers: ${JSON.stringify(headers1)},
          credentials: 'include',
          body: JSON.stringify(${JSON.stringify(genBody1)}),
        });
        const text = await response.text();
        return JSON.stringify({ status: response.status, body: text.substring(0, 3000) });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    })()
  `;
  const result1 = await evaluate(expr1);
  if (result1) {
    const r = JSON.parse(result1);
    console.log(`HTTP ${r.status}`);
    try {
      const d = JSON.parse(r.body);
      console.log(`code=${d.code} msg=${d.msg}`);
      if (d.code === 0) {
        console.log(`SUCCESS! data=${JSON.stringify(d.data).substring(0, 500)}`);
      } else if (d.code === 1006) {
        console.log('LOGIN_EXPIRED - body authToken did not help');
      }
    } catch { console.log(`raw: ${r.body?.substring(0, 300)}`); }
  }
  console.log('');

  // Test 2: Try /song/generate (master mode) with lyrics + body authToken
  console.log('=== Test 2: /song/generate (master mode) WITH body authToken ===');
  const lyrics = '春风吹过山岗 花儿开放\n鸟儿在歌唱 春天来了\n阳光温暖大地 万物复苏\n我们一起走过 这美好的时光\n春天啊春天 你如此美丽\n让我心中充满 希望和力量';
  const genBody2 = {
    packageName: 'com.xingchat.web.muse',
    appPlatform: 4,
    channelName: 'web',
    machineId: machineId || 'zmusic-cdp',
    timestamp: Math.floor(Date.now() / 1000),
    nonce: 'test' + Math.random().toString(36).substring(2, 10),
    authToken: token,
    ...(ssid ? { sid: ssid } : {}),
    lyrics,
    style: '流行',
    title: '春天之歌',
    instrumental: 0,
  };

  const expr2 = `
    (async function() {
      try {
        const response = await fetch(${JSON.stringify(MUSE_API + '/project/song/v1/song/generate')}, {
          method: 'POST',
          headers: ${JSON.stringify(headers1)},
          credentials: 'include',
          body: JSON.stringify(${JSON.stringify(genBody2)}),
        });
        const text = await response.text();
        return JSON.stringify({ status: response.status, body: text.substring(0, 3000) });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    })()
  `;
  const result2 = await evaluate(expr2);
  if (result2) {
    const r = JSON.parse(result2);
    console.log(`HTTP ${r.status}`);
    try {
      const d = JSON.parse(r.body);
      console.log(`code=${d.code} msg=${d.msg}`);
      if (d.code === 0) {
        console.log(`SUCCESS! data=${JSON.stringify(d.data).substring(0, 500)}`);
      } else if (d.code === 1006) {
        console.log('LOGIN_EXPIRED');
      }
    } catch { console.log(`raw: ${r.body?.substring(0, 300)}`); }
  }
  console.log('');

  // Test 3: Check what the muse.top page's OWN /user/info call returns
  // (to see if the page gets a different response than our API call)
  console.log('=== Test 3: Intercept muse.top page response to /user/info ===');
  console.log('Checking if the page\'s own API call shows loginStatus...');

  // Read the live response by making the same call the page makes
  const userBody = {
    packageName: 'com.xingchat.web.muse',
    appPlatform: 4,
    channelName: 'web',
    machineId: machineId || 'zmusic-cdp',
    timestamp: Math.floor(Date.now() / 1000),
    nonce: 'test' + Math.random().toString(36).substring(2, 10),
    authToken: token,
    ...(ssid ? { sid: ssid } : {}),
  };

  const expr3 = `
    (async function() {
      try {
        const response = await fetch(${JSON.stringify(MUSE_API + '/project/song/v1/user/info')}, {
          method: 'POST',
          headers: ${JSON.stringify(headers1)},
          credentials: 'include',
          body: JSON.stringify(${JSON.stringify(userBody)}),
        });
        const text = await response.text();
        return JSON.stringify({ status: response.status, body: text.substring(0, 3000) });
      } catch(e) { return JSON.stringify({ error: e.message }); }
    })()
  `;
  const result3 = await evaluate(expr3);
  if (result3) {
    const r = JSON.parse(result3);
    try {
      const d = JSON.parse(r.body);
      console.log(`code=${d.code} loginStatus=${d.data?.loginStatus} credit=${d.data?.memberInfo?.credit}`);
      console.log(`subscription.expired=${d.data?.memberInfo?.subscription?.expired}`);
      if (d.data?.loginStatus === 0) {
        console.log('\n*** CONFIRMED: Server-side session is expired (loginStatus=0) ***');
        console.log('*** The authToken in body does NOT refresh the session ***');
        console.log('*** User must actively re-login to muse.top ***');
      }
    } catch { console.log(`raw: ${r.body?.substring(0, 300)}`); }
  }

  console.log('\n=== Test Complete ===');
  process.exit(0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
