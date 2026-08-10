#!/usr/bin/env node
/**
 * muse-real-credit-dump.mjs — Dump ALL fields from the real
 * /project/song/v1/user/info API call via Edge CDP so we can see
 * exactly which credit field(s) carry the 20 pts visible in the
 * muse.top sidebar.
 *
 * Connects to Edge via CDP on port 9222 → extracts the AuthToken →
 * makes a real fetch() from the browser context → prints the full
 * response JSON.
 *
 * Usage: node scripts/muse-real-credit-dump.mjs
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
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function connect() {
  const targets = await getTargets();
  const page = targets.find((t) => t.type === 'page' && t.url && t.url.includes('muse.top'))
    || targets.find((t) => t.type === 'page');
  if (!page) throw new Error('No page target on CDP 9222');
  console.log(`[CDP] Attaching to: ${page.url}`);
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
    } catch { /* ignore */ }
  });
  await cdp('Page.enable').catch(() => {});
  await cdp('Runtime.enable').catch(() => {});
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
  const res = await cdp('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  }, 30000);
  return res.result?.result?.value;
}

async function main() {
  console.log('=== Muse real credit dump — live Edge CDP ===\n');

  try {
    await connect();
  } catch (e) {
    console.error('[CDP] Connect failed:', e.message);
    process.exit(1);
  }

  // 1. Extract token
  const tokenExpr = `
    (function() {
      var keys = ['AuthToken','authToken','token','muse_token','museToken','Authorization','access_token','accessToken','ssid','sid'];
      var found = null;
      var src = '';
      for (var i = 0; i < keys.length && !found; i++) {
        try {
          var v = localStorage.getItem(keys[i]) || sessionStorage.getItem(keys[i]);
          if (v && v.length > 10) { found = v; src = keys[i]; }
        } catch(e) {}
      }
      if (!found) {
        try {
          var raw = localStorage.getItem('userInfo') || localStorage.getItem('user') || sessionStorage.getItem('userInfo');
          if (raw) {
            var obj = JSON.parse(raw);
            var cand = obj.token || obj.authToken || obj.Authorization || obj.ssid || (obj.data && (obj.data.token || obj.data.ssid));
            if (cand && cand.length > 10) { found = cand; src = 'userInfo.token'; }
          }
        } catch(e) {}
      }
      return JSON.stringify({ token: found ? found.substring(0, 30) + '…' : null, src, origin: location.origin, href: location.href });
    })()
  `;
  const tokenStr = await evaluate(tokenExpr);
  const tokenInfo = JSON.parse(tokenStr || '{}');
  console.log('[TOKEN]', JSON.stringify(tokenInfo, null, 2));

  // 2. Run the user/info API call IN the browser context — the same way museCdpBridge does it
  const fetchExpr = `
    (async function() {
      // First extract the full auth token (truncated above only for log)
      var TOKEN = null;
      var keys = ['AuthToken','authToken','token','muse_token','museToken','Authorization','access_token','accessToken','ssid','sid'];
      for (var i = 0; i < keys.length && !TOKEN; i++) {
        try {
          var v = localStorage.getItem(keys[i]) || sessionStorage.getItem(keys[i]);
          if (v && v.length > 10) TOKEN = v;
        } catch(e) {}
      }
      if (!TOKEN) {
        try {
          var raw = localStorage.getItem('userInfo') || localStorage.getItem('user') || sessionStorage.getItem('userInfo');
          if (raw) {
            var obj = JSON.parse(raw);
            TOKEN = obj.token || obj.authToken || obj.Authorization || obj.ssid || (obj.data && (obj.data.token || obj.data.ssid)) || null;
          }
        } catch(e) {}
      }

      var body = {
        packageName: 'com.xingchat.web.muse',
        appPlatform: 4,
        channelName: 'web',
        machineId: 'zmusic-cdp-dump',
        timestamp: Math.floor(Date.now()/1000),
        nonce: 'dump' + Math.random().toString(36).substring(2, 10),
      };

      var headers = {
        'Content-Type': 'application/json',
        'App-Key': '8e33a5e60ef347df808d14026f27d227',
      };
      if (TOKEN) headers.AuthToken = TOKEN;

      try {
        var r = await fetch('https://project-api.atmob.com/project/song/v1/user/info', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(body),
        });
        var t = await r.text();
        return JSON.stringify({ status: r.status, authSent: !!TOKEN, body: JSON.parse(t) });
      } catch(e) {
        return JSON.stringify({ error: e.message });
      }
    })()
  `;

  console.log('\n[API] POST /project/song/v1/user/info (live from Edge) ...');
  const resStr = await evaluate(fetchExpr);
  const res = JSON.parse(resStr || '{}');
  console.log('[API] HTTP status:', res.status, 'authSent:', res.authSent, 'error:', res.error);
  if (res.body) {
    console.log('\n=== FULL API RESPONSE (all fields, raw) ===');
    console.log(JSON.stringify(res.body, null, 2));

    const d = res.body.data || {};
    const mi = d.memberInfo || {};
    console.log('\n=== KEY CREDIT FIELDS SUMMARY ===');
    console.log('  code              :', res.body.code, res.body.msg || '(OK)');
    console.log('  memberInfo.credit :', mi.credit);
    console.log('  memberInfo.evaluationCreditPaid   :', mi.evaluationCreditPaid);
    console.log('  memberInfo.evaluationCreditNoPaid :', mi.evaluationCreditNoPaid);
    console.log('  memberInfo.paidMember             :', mi.paidMember);
    console.log('  memberInfo.isMember               :', mi.isMember);
    console.log('  memberInfo.subscription           :', JSON.stringify(mi.subscription));
    console.log('  d.credit (top-level)              :', d.credit);
    console.log('  d.credits (top-level)             :', d.credits);
    console.log('');
    console.log('  total credit + evaluationPaid + evaluationNoPaid =',
      (mi.credit || 0) + (mi.evaluationCreditPaid || 0) + (mi.evaluationCreditNoPaid || 0));

    // Print any other numerical fields inside memberInfo that might be the displayed 20:
    console.log('\n=== All numerical keys in memberInfo ===');
    for (const [k, v] of Object.entries(mi)) {
      if (typeof v === 'number') console.log(`  memberInfo.${k}: ${v}`);
    }
    console.log('\n=== All numerical keys at data top level ===');
    for (const [k, v] of Object.entries(d)) {
      if (typeof v === 'number') console.log(`  data.${k}: ${v}`);
    }
  }

  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
