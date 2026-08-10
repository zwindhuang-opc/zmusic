#!/usr/bin/env node
/**
 * muse-ui-credit-dump.mjs — Dump what the muse.top UI actually RENDERS
 * (text in the DOM, sidebar, badges, etc.) so we can see exactly what
 * number the user sees next to the diamond symbol.
 *
 * Two methods:
 *  1. Walk all element text matching a digit + symbol pattern (♦ ✨ 💎 pt pts 分 积分).
 *  2. Also print the visible avatar badge / sidebar widget's textContent.
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
  // attach to the muse.top/assets page we used earlier — the user's screenshot
  // shows their assets tab. Fall back to any muse.top page.
  let page = targets.find((t) => t.type === 'page' && t.url && t.url.includes('/assets'));
  if (!page) page = targets.find((t) => t.type === 'page' && t.url && t.url.includes('muse.top'));
  if (!page) page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('No page');
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
  }, 20000);
  return res.result?.result?.value;
}

async function main() {
  console.log('=== Muse UI visible credit dump — live DOM from Edge ===\n');
  try { await connect(); }
  catch (e) { console.error('[CDP] Connect FAIL:', e.message); process.exit(1); }

  // 1. All text nodes that look like a point/credit display
  const expr = `
    (function() {
      // Collect interesting visible text: any element containing credit-like
      // symbols (♦ ✨ 💎) or Chinese/Japanese credit words.
      const symbols = ['♦','✨','💎','积分','点数','点','credit','pts','pt','Credits','Points'];
      const results = [];
      function walk(el) {
        if (!el) return;
        try {
          // Skip hidden/empty
          const style = el.style || {};
          if (style.display === 'none' || style.visibility === 'hidden') return;
          const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : {width:0,height:0};
          const visible = (rect.width > 0 || rect.height > 0) || (el.offsetParent !== null);
          const txt = (el.textContent || '').trim();
          if (!txt) return;
          if (txt.length < 80 && symbols.some(s => txt.includes(s)) &&
              (/\d/.test(txt) || visible)) {
            results.push({
              selector: (el.tagName ? el.tagName.toLowerCase() : '?') +
                        (el.id ? '#' + el.id : '') +
                        (el.className && el.className.baseVal ? '.' + el.className.baseVal.split(/\s+/)[0] :
                         el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/).filter(Boolean)[0] : ''),
              text: txt.substring(0, 120),
              visible,
              x: Math.round(rect.x || 0),
              y: Math.round(rect.y || 0),
            });
          }
          // Also scan sidebar nav — often just <number> with an icon sibling.
          if (el.children && el.children.length) {
            for (const c of el.children) walk(c);
          }
        } catch(e) {}
      }
      walk(document.body);

      // 2. Elements whose pure numeric content sits inside a sidebar nav item.
      //    Common in Muse: <nav-item> <icon/> <span>20</span> </nav-item>
      const navCandidates = [];
      try {
        document.querySelectorAll('aside,nav,.sidebar,.side,[class*="side"],[class*="menu"],[class*="nav"]').forEach((nav) => {
          nav.querySelectorAll('span,div,a,button,li').forEach((el) => {
            const txt = (el.textContent || '').trim();
            if (txt && /^\d{1,5}$/.test(txt) && !isNaN(parseInt(txt,10))) {
              const rect = el.getBoundingClientRect();
              const siblings = Array.from(el.parentNode ? el.parentNode.children : []).map(c => (c.className || c.tagName || '').toString().substring(0,40));
              navCandidates.push({
                number: parseInt(txt,10),
                selector: (el.tagName ? el.tagName.toLowerCase() : '?') +
                          (el.id ? '#' + el.id : '') +
                          (typeof el.className === 'string' ? '.' + el.className.split(/\s+/)[0] : ''),
                parentText: (el.parentNode ? el.parentNode.textContent : '').trim().substring(0, 60),
                siblings: siblings.slice(0, 3),
                x: Math.round(rect.x||0),
                y: Math.round(rect.y||0),
              });
            }
          });
        });
      } catch(e) { navCandidates.push({error: e.message}); }

      // 3. The page screenshot shows a user avatar in the BOTTOM-LEFT. Look for
      //    any nearby element with numeric credit.
      const nearAvatar = [];
      try {
        const avatars = document.querySelectorAll('img[src*="avatar"],img[alt*="头像"],[class*="avatar"]');
        avatars.forEach((a, i) => {
          const r = a.getBoundingClientRect();
          // Walk siblings/parent text within 200px of avatar.
          const scan = document.querySelectorAll('*');
          scan.forEach((el) => {
            const txt = (el.textContent || '').trim();
            if (!txt || txt.length > 40 || !/\d/.test(txt)) return;
            const rr = el.getBoundingClientRect();
            const dist = Math.hypot((rr.x || 0) - (r.x || 0), (rr.y || 0) - (r.y || 0));
            if (dist < 220) {
              nearAvatar.push({
                distance: Math.round(dist),
                text: txt.substring(0, 60),
                avatar: i,
                selector: (el.tagName ? el.tagName.toLowerCase() : '?') +
                          (typeof el.className === 'string' ? '.' + el.className.split(/\s+/)[0] : ''),
              });
            }
          });
        });
      } catch(e) { nearAvatar.push({error: e.message}); }

      return JSON.stringify({
        creditLikeSymbols: results.slice(0, 50),
        sidebarNumbers: navCandidates.sort((a,b) => (a.y-b.y)).slice(0, 30),
        nearAvatar: nearAvatar.sort((a,b) => a.distance-b.distance).slice(0, 20),
      });
    })()
  `;

  console.log('Walking DOM ...');
  const start = Date.now();
  const raw = await evaluate(expr);
  console.log('  done in', Date.now() - start, 'ms');
  const data = JSON.parse(raw || '{}');

  console.log('\n=== A) Text nodes containing credit-like symbols (♦/✨/积分/pt) ===');
  (data.creditLikeSymbols || []).forEach((r, i) => {
    console.log(`  A${i+1}. vis=${r.visible ? 'Y' : '-'} (${r.x},${r.y}) <${r.selector}> ${JSON.stringify(r.text)}`);
  });
  if (!data.creditLikeSymbols || !data.creditLikeSymbols.length) console.log('  (none found)');

  console.log('\n=== B) Numeric elements inside sidebar/nav containers ===');
  (data.sidebarNumbers || []).forEach((n, i) => {
    console.log(`  B${i+1}. num=${n.number} (${n.x},${n.y}) <${n.selector}> parent="${n.parentText}" sib=${JSON.stringify(n.siblings)}`);
  });
  if (!data.sidebarNumbers || !data.sidebarNumbers.length) console.log('  (none found)');

  console.log('\n=== C) Numbers within 220px of any avatar element (bottom-left user card) ===');
  (data.nearAvatar || []).forEach((a, i) => {
    console.log(`  C${i+1}. d=${a.distance}px <${a.selector}> text=${JSON.stringify(a.text)}`);
  });
  if (!data.nearAvatar || !data.nearAvatar.length) console.log('  (none found)');

  process.exit(0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
