#!/usr/bin/env node
/**
 * muse-all-tabs-dump.mjs — Enumerate ALL Edge tabs via CDP,
 * attach to each muse.top tab, dump DOM text near the avatar
 * area and extract any credit-like number near the user card.
 */
import WebSocket from 'ws';
import http from 'node:http';

const CDP_HOST = 'localhost';
const CDP_PORT = 9222;

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

function makeConn(wsUrl) {
  let ws = null;
  let msgId = 0;
  const pending = new Map();

  return {
    async connect() {
      ws = new WebSocket(wsUrl);
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
      await this.cdp('Page.enable').catch(() => {});
      await this.cdp('Runtime.enable').catch(() => {});
    },
    cdp(method, params = {}, timeoutMs = 15000) {
      return new Promise((resolve, reject) => {
        const id = ++msgId;
        const t = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, timeoutMs);
        pending.set(id, { resolve, timeout: t });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    async evaluate(expr) {
      const res = await this.cdp('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true,
      }, 25000);
      return res.result?.result?.value;
    },
    close() { try { ws.close(); } catch {} },
  };
}

async function main() {
  console.log('=== ALL Edge tabs via CDP /json ===\n');
  const targets = await getTargets();
  const pages = targets.filter(t => t.type === 'page');
  console.log(`Total page tabs: ${pages.length}\n`);
  pages.forEach((p, i) => {
    console.log(`  [${i}] ${p.url}`);
    console.log(`       id=${p.id} title=${p.title?.substring(0, 80)}`);
  });

  const musePages = pages.filter(p => p.url && p.url.includes('muse.top'));
  console.log(`\n=== Muse.top tabs: ${musePages.length} ===\n`);

  for (const page of musePages) {
    console.log('\n-----------------------------------------------------------');
    console.log(`>>> TAB: ${page.url}`);
    console.log(`    title: ${page.title}`);
    console.log('-----------------------------------------------------------');

    const conn = makeConn(page.webSocketDebuggerUrl);
    try {
      await conn.connect();
    } catch (e) {
      console.log('  (connect failed:', e.message, ')');
      continue;
    }

    // 1. Print the bottom-left 25% of the page — that's where the avatar + credit are.
    try {
      const cornerExpr = `
        (function() {
          const W = window.innerWidth, H = window.innerHeight;
          // BOTTOM-LEFT: x in [0, W/2], y in [H/2, H]  (avatar area)
          // TOP-RIGHT:  x in [W/2, W], y in [0, H/3]   (header badge area)
          const hits = [];
          function walk(el) {
            if (!el) return;
            try {
              const style = window.getComputedStyle ? window.getComputedStyle(el) : el.style || {};
              if (style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')) return;
              const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : {x:0,y:0,width:0,height:0};
              const cx = rect.x + rect.width/2, cy = rect.y + rect.height/2;
              const inBL = cx < W/2 && cy > H/2;
              const inTR = cx > W/2 && cy < H/3;
              const txt = (el.textContent || '').trim();
              if (txt && txt.length < 60 && txt.length > 0 && /\\d/.test(txt) && (inBL || inTR)) {
                hits.push({
                  area: inBL ? 'BOTTOM-LEFT(avatar-area)' : 'TOP-RIGHT(header-area)',
                  pos: '('+Math.round(rect.x)+','+Math.round(rect.y)+')-('+Math.round(rect.x+rect.width)+','+Math.round(rect.y+rect.height)+')',
                  selector: (el.tagName||'?').toLowerCase() +
                            (el.id ? '#'+el.id : '') +
                            (typeof el.className === 'string' && el.className ? '.'+el.className.split(/\\s+/).slice(0,2).join('.') : ''),
                  text: txt,
                });
              }
              if (el.children) { for (const c of el.children) walk(c); }
            } catch(e) {}
          }
          walk(document.body);
          // Also dump every visible element that contains a diamond/coin icon
          const iconHits = [];
          try {
            const all = document.querySelectorAll('*');
            all.forEach((el) => {
              const txt = (el.textContent || '').trim();
              if (!txt || txt.length > 40) return;
              const rect = el.getBoundingClientRect();
              if (rect.width === 0 && rect.height === 0) return;
              // Look for text that starts/ends with number + any of: ♦ 钻石 积分 point credit gem coin icon (or any Unicode block)
              if (/\\d/.test(txt) && (/[♦💎✨🎴🎟️🪙]/.test(txt) || /积分|钻石|点数|point|credit|coin|gem/i.test(txt))) {
                iconHits.push({
                  text: txt,
                  pos: '('+Math.round(rect.x)+','+Math.round(rect.y)+')',
                  sel: (el.tagName||'?').toLowerCase() + (typeof el.className==='string'? '.'+el.className.split(/\\s+/)[0] : '')
                });
              }
            });
          } catch(e) {}
          // Also: scan EVERY element with pure numeric content that's visible anywhere
          const pureNum = [];
          try {
            const all = document.querySelectorAll('*');
            all.forEach((el) => {
              if (el.children && el.children.length > 0) return; // only leaf
              const txt = (el.textContent || '').trim();
              if (!txt) return;
              const rect = el.getBoundingClientRect();
              if (rect.width === 0 && rect.height === 0) return;
              if (/^\\d{1,4}$/.test(txt)) {
                pureNum.push({
                  n: parseInt(txt,10),
                  pos: '('+Math.round(rect.x)+','+Math.round(rect.y)+')',
                  sel: (el.tagName||'?').toLowerCase() + (typeof el.className==='string'? '.'+el.className.split(/\\s+/)[0] : ''),
                  parent: (el.parentElement?.textContent || '').trim().substring(0,50),
                });
              }
            });
          } catch(e) {}
          return JSON.stringify({ cornerHits: hits, iconHits, pureNum: pureNum.sort((a,b)=>a.n-b.n).slice(0,50) });
        })()
      `;
      const raw = await conn.evaluate(cornerExpr);
      const data = JSON.parse(raw || '{}');

      console.log('\n  -- Visible numeric text in BOTTOM-LEFT (avatar) or TOP-RIGHT (header) corners --');
      (data.cornerHits || []).forEach(h => console.log(`    [${h.area}] ${h.pos} ${h.selector} => ${JSON.stringify(h.text)}`));
      if (!data.cornerHits?.length) console.log('    (none)');

      console.log('\n  -- Elements containing digits + credit/gem/♦ icons --');
      (data.iconHits || []).forEach(h => console.log(`    ${h.pos} <${h.sel}>  ${JSON.stringify(h.text)}`));
      if (!data.iconHits?.length) console.log('    (none)');

      console.log('\n  -- All leaf elements with PURE numeric content (1-4 digits), sorted --');
      (data.pureNum || []).forEach(h => console.log(`    n=${h.n}  ${h.pos} <${h.sel}>  parent="${h.parent}"`));
      if (!data.pureNum?.length) console.log('    (none)');

    } catch (e) {
      console.log('  DOM scan error:', e.message);
    }

    // 2. Also run the API call from this tab context (cookies matter!)
    try {
      const apiExpr = `
        (async function() {
          var TOKEN = null;
          var keys = ['AuthToken','authToken','token','muse_token','museToken','Authorization','access_token','accessToken','ssid','sid'];
          for (var i = 0; i < keys.length && !TOKEN; i++) {
            try {
              var v = localStorage.getItem(keys[i]) || sessionStorage.getItem(keys[i]);
              if (v && v.length > 10) TOKEN = v;
            } catch(e) {}
          }
          var hdrs = { 'Content-Type':'application/json', 'App-Key':'8e33a5e60ef347df808d14026f27d227' };
          if (TOKEN) hdrs.AuthToken = TOKEN;
          var body = { packageName:'com.xingchat.web.muse', appPlatform:4, channelName:'web', machineId:'zmusic-debug', timestamp:Math.floor(Date.now()/1000), nonce:'x'+Math.random().toString(36).slice(2,8) };
          try {
            var r = await fetch('https://project-api.atmob.com/project/song/v1/user/info', { method:'POST', headers:hdrs, credentials:'include', body:JSON.stringify(body) });
            var t = await r.text();
            var d = JSON.parse(t);
            var mi = (d.data||{}).memberInfo || {};
            return JSON.stringify({
              code: d.code,
              credit: mi.credit,
              evalPaid: mi.evaluationCreditPaid,
              evalNoPaid: mi.evaluationCreditNoPaid,
              isMember: mi.isMember,
              paidMember: mi.paidMember,
              subExpired: mi.subscription?.expired,
              // Print every key in memberInfo so we don't miss anything!
              allMemberInfo: mi,
            });
          } catch(e) { return JSON.stringify({error:e.message}); }
        })()
      `;
      const res = JSON.parse(await conn.evaluate(apiExpr) || '{}');
      console.log('\n  -- API user/info from this tab cookies --');
      console.log('    code:', res.code);
      console.log('    memberInfo.credit:', res.credit);
      console.log('    memberInfo.evaluationCreditPaid:', res.evalPaid);
      console.log('    memberInfo.evaluationCreditNoPaid:', res.evalNoPaid);
      console.log('    all memberInfo keys:', JSON.stringify(res.allMemberInfo));
    } catch (e) {
      console.log('  API error:', e.message);
    }

    conn.close();
  }

  console.log('\n=== Done ===');
  process.exit(0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
