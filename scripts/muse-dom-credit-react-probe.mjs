#!/usr/bin/env node
/**
 * muse-dom-credit-react-probe.mjs — Attach to the muse.top/assets tab
 * and extract the EXACT displayed credit number from:
 *   1) The sidebar DOM element (visual = user's source of truth)
 *   2) React fiber/props on that element so we know the REAL data source
 *   3) Try multiple credit formulas against the API fields to match 20
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
  let page = targets.find(t => t.type === 'page' && t.url && t.url.includes('/assets'));
  if (!page) page = targets.find(t => t.type === 'page' && t.url && t.url.includes('muse.top'));
  if (!page) throw new Error('No muse.top page');
  console.log('[CDP] Attaching:', page.url, '\n');
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

  // === STEP 1: Find the sidebar credit element, get its text, check siblings for icon ===
  console.log('=== STEP 1: Sidebar DOM credit display extraction ===\n');
  const domExpr = `
    (function() {
      const out = {};
      // Find sidebar points element (class contains "sidebar__points")
      const pointsEl = document.querySelector('[class*="sidebar__points"]');
      if (pointsEl) {
        out.points = {
          textContent: pointsEl.textContent.trim(),
          innerHTML: pointsEl.innerHTML.substring(0, 500),
          className: pointsEl.className,
          rect: JSON.parse(JSON.stringify(pointsEl.getBoundingClientRect())),
        };
        // Walk up 1 level to see siblings (avatar/name/icon container)
        const parent = pointsEl.parentElement;
        if (parent) {
          out.parent = {
            innerHTML: parent.innerHTML.substring(0, 1500),
            className: parent.className,
            textContent: parent.textContent.trim().substring(0, 200),
          };
          // Check siblings: look for icon element with ♦ or svg/img
          const sibInfo = [];
          parent.childNodes.forEach(c => {
            if (c.nodeType === 1) sibInfo.push({
              tag: c.tagName,
              class: c.className?.substring?.(0,80) || '',
              text: c.textContent?.trim?.().substring(0,60) || '',
              html: c.outerHTML?.substring?.(0,400) || ''
            });
            else if (c.nodeType === 3) sibInfo.push({text:c.textContent?.trim?.()||''});
          });
          out.siblings = sibInfo;
        }
        // Walk up 2 levels for the whole user card
        const grand = parent?.parentElement;
        if (grand) {
          out.grandClassName = grand.className;
          out.grandHTML = grand.outerHTML.substring(0, 2000);
        }
        // === React inspection on the span ===
        const creditSpan = pointsEl.querySelector('span') || pointsEl;
        const fiberKey = Object.keys(creditSpan).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
        const propsKey = Object.keys(creditSpan).find(k => k.startsWith('__reactProps') || k.startsWith('__reactEventHandlers'));
        if (fiberKey) {
          try {
            let f = creditSpan[fiberKey];
            const walked = [];
            let depth = 0;
            while (f && depth < 20) {
              const memo = f.memoizedProps;
              const state = f.memoizedState;
              const typeName = typeof f.type === 'string' ? f.type : (f.type?.name || f.type?.displayName || '?');
              walked.push({ depth, type: typeName, props: memo ? JSON.stringify(memo).substring(0,300) : null, state: state ? JSON.stringify(state).substring(0,300) : null });
              f = f.return;
              depth++;
            }
            out.reactFiber = walked;
          } catch(e) { out.fiberError = e.message; }
        }
        if (propsKey) { try { out.reactProps = JSON.stringify(creditSpan[propsKey]).substring(0, 500); } catch(e){} }
      } else {
        out.points = { error: 'element not found' };
      }

      // Also look for user store in window
      const wKeys = [];
      for (const k of Object.keys(window)) {
        try {
          const v = window[k];
          if (v && typeof v === 'object' && (v.credit !== undefined || v.credits !== undefined || v.memberInfo !== undefined || v.evaluationCredit !== undefined)) {
            wKeys.push({ key: k, valueSubset: JSON.stringify(v).substring(0, 400) });
          }
        } catch {}
      }
      // Common store locations
      const storeChecks = {};
      try { storeChecks.__NEXT_DATA__ = window.__NEXT_DATA__ ? JSON.stringify(window.__NEXT_DATA__).substring(0,1000) : null; } catch {}
      try { storeChecks.__INITIAL_STATE__ = window.__INITIAL_STATE__ ? JSON.stringify(window.__INITIAL_STATE__).substring(0,1000) : null; } catch {}
      try { storeChecks.__REDUX_STATE__ = window.__REDUX_STATE__ ? JSON.stringify(window.__REDUX_STATE__).substring(0,1000) : null; } catch {}
      try { storeChecks.__STORE__ = window.__STORE__ ? JSON.stringify(window.__STORE__).substring(0,1000) : null; } catch {}
      try {
        // Check for Pinia or Vue reactive
        const possibleStores = ['userStore','memberStore','museStore','appStore','store','globalStore','useStore','useUserStore'];
        possibleStores.forEach(n => {
          try {
            if (window[n]) storeChecks['window.'+n] = JSON.stringify(window[n]).substring(0, 500);
          } catch {}
        });
      } catch {}
      out.windowGlobals = wKeys.slice(0, 20);
      out.storeChecks = storeChecks;

      return JSON.stringify(out);
    })()
  `;

  const raw = await evaluate(domExpr);
  const dom = JSON.parse(raw || '{}');
  console.log('  points textContent:', dom.points?.textContent);
  console.log('  points innerHTML snippet:', dom.points?.innerHTML?.substring(0, 200));
  console.log('  parent textContent:', dom.parent?.textContent);
  console.log('\n  -- Children/Siblings of user card container --');
  (dom.siblings || []).forEach((s, i) => {
    console.log(`    [child${i}] <${s.tag}> class="${s.class}" text="${s.text}"`);
    if (s.html && (s.html.includes('♦') || s.html.includes('svg') || s.html.includes('img'))) {
      console.log(`           html snippet: ${s.html.substring(0, 300)}`);
    }
  });
  if (dom.grandHTML) {
    console.log('\n  -- Grandparent full HTML (user card) --');
    console.log('    ', dom.grandHTML.split('\n').join('\n     '));
  }

  console.log('\n  -- React fiber trace from credit span (upwards) --');
  (dom.reactFiber || []).forEach(r => {
    console.log(`    depth=${r.depth} type=<${r.type}>`);
    if (r.props) console.log('       props:', r.props);
    if (r.state && r.state !== 'null') console.log('       state:', r.state);
  });
  if (dom.reactProps) console.log('\n  -- reactProps on span:', dom.reactProps);

  console.log('\n  -- Interesting window globals (with credit/memberInfo fields) --');
  (dom.windowGlobals || []).forEach(g => console.log('    window.' + g.key, '=>', g.valueSubset));

  console.log('\n  -- Store checks (__NEXT_DATA__ etc.) --');
  Object.entries(dom.storeChecks || {}).forEach(([k, v]) => {
    if (v) console.log('   ', k, '=', v.substring(0, 600));
  });

  // === STEP 2: Run API call and test EVERY possible formula to find which yields 20 ===
  console.log('\n\n=== STEP 2: API call + formula comparison (target: UI shows ' + dom.points?.textContent + ') ===\n');
  const target = parseInt(dom.points?.textContent || '0', 10);
  const apiExpr = `
    (async function() {
      var hdrs = { 'Content-Type':'application/json', 'App-Key':'8e33a5e60ef347df808d14026f27d227' };
      var TOKEN = null;
      var keys = ['AuthToken','authToken','token','muse_token','museToken','Authorization','access_token','accessToken','ssid','sid'];
      for (var i = 0; i < keys.length && !TOKEN; i++) {
        try {
          var v = localStorage.getItem(keys[i]) || sessionStorage.getItem(keys[i]);
          if (v && v.length > 10) TOKEN = v;
        } catch(e) {}
      }
      if (TOKEN) hdrs.AuthToken = TOKEN;
      var body = { packageName:'com.xingchat.web.muse', appPlatform:4, channelName:'web', machineId:'zmusic-debug2', timestamp:Math.floor(Date.now()/1000), nonce:'y'+Math.random().toString(36).slice(2,8) };
      var r = await fetch('https://project-api.atmob.com/project/song/v1/user/info', { method:'POST', headers:hdrs, credentials:'include', body:JSON.stringify(body) });
      var d = JSON.parse(await r.text());
      // Also try the "status/config" endpoint that the UI might use
      var d2 = null;
      try {
        var r2 = await fetch('https://project-api.atmob.com/project/song/v30/song/fast/config', { method:'POST', headers:hdrs, credentials:'include', body:JSON.stringify(body) });
        d2 = JSON.parse(await r2.text());
      } catch {}
      // Also look for any member status endpoint URL pattern
      var d3 = null;
      try {
        var r3 = await fetch('https://project-api.atmob.com/project/song/v1/member/status', { method:'POST', headers:hdrs, credentials:'include', body:JSON.stringify(body) });
        d3 = JSON.parse(await r3.text());
      } catch {}
      var d4 = null;
      try {
        var r4 = await fetch('https://project-api.atmob.com/project/song/v1/subscription/info', { method:'POST', headers:hdrs, credentials:'include', body:JSON.stringify(body) });
        d4 = JSON.parse(await r4.text());
      } catch {}
      return JSON.stringify({ userInfo: d.data, fastConfig: d2?.data, memberStatus: d3, subInfo: d4 });
    })()
  `;
  const apiRaw = await evaluate(apiExpr);
  const api = JSON.parse(apiRaw || '{}');
  const mi = (api.userInfo || {}).memberInfo || {};
  console.log('  API memberInfo fields:');
  Object.entries(mi).forEach(([k, v]) => console.log('   ', k, '=', typeof v === 'object' ? JSON.stringify(v) : v));

  console.log('\n  -- Formula search: which formula gives target=' + target + '? --');
  const c  = mi.credit || 0;
  const ep = mi.evaluationCreditPaid || 0;
  const en = mi.evaluationCreditNoPaid || 0;
  const dail = mi.subscription?.dailyCredit || 0;
  const dailyMax = mi.subscription?.dailyCreditMax || 0;
  const expired = mi.subscription?.expired ? 1 : 0;
  const allFormulas = [
    ['credit (=c)', c],
    ['evalPaid (=ep)', ep],
    ['evalNoPaid (=en)', en],
    ['c + ep', c+ep],
    ['c + en', c+en],
    ['ep + en', ep+en],
    ['c + ep + en', c+ep+en],
    ['ep - en', ep-en],
    ['c + ep - en', c+ep-en],
    ['en - ep', en-ep],
    ['c + en - ep', c+en-ep],
    ['ep - c', ep-c],
    ['en - c', en-c],
    ['(ep + en) - c', ep+en-c],
    ['(c + ep) - en*expired', c+ep-en*expired],
    ['ep * (1-expired) + en', ep*(1-expired)+en],
    ['c + ep * (1-expired)', c+ep*(1-expired)],
    ['c + en * expired', c+en*expired],
    ['dailyMax - dail', dailyMax-dail],
    ['dailyMax - ep', dailyMax-ep],
    ['(dailyMax - (ep + en))/2', (dailyMax-ep-en)/2],
    ['ep - dailyCredit', ep-dail],
    ['dailyCredit + en', dail+en],
    ['dailyMax - dail - ep', dailyMax-dail-ep],
    ['Math.min(ep, dailyMax)-en', Math.min(ep,dailyMax)-en],
    ['Math.max(0, ep - en)', Math.max(0,ep-en)],
    ['c + Math.max(0, ep - en)', c+Math.max(0,ep-en)],
    ['Math.max(0, en - ep)', Math.max(0,en-ep)],
    ['Math.floor(ep/10)*10 - en', Math.floor(ep/10)*10-en],
    ['c + ep - Math.max(en,0)', c+ep-Math.max(en,0)],
    ['(dailyCreditMax - (dailyCredit + ep)) + en', (dailyMax-(dail+ep))+en],
    ['(c + ep) - dailyCreditMax + en*0', c+ep-dailyMax+en*0],
  ];
  allFormulas.forEach(([name, val]) => {
    const mark = (val === target) ? '  <<< MATCH! >>>' : '';
    console.log(`    ${val.toString().padStart(5)} = ${name}${mark}`);
  });

  console.log('\n  -- Other endpoints probed (memberStatus/subscriptionInfo) --');
  if (api.memberStatus) console.log('    memberStatus:', JSON.stringify(api.memberStatus).substring(0, 600));
  if (api.subInfo) console.log('    subInfo:', JSON.stringify(api.subInfo).substring(0, 600));
  if (api.fastConfig) console.log('    fastConfig (credit-like fields):', JSON.stringify(
    Object.fromEntries(Object.entries(api.fastConfig).filter(([k,v])=>/credit|point|num|count|vip|member/i.test(k) || typeof v === 'number'))
  ).substring(0, 600));

  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
