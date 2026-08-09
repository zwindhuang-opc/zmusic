/**
 * Muse JWT Debug Tool
 *
 * Connects to the user's already running Edge browser via CDP (port 9222),
 * scans muse.top tabs, extracts ALL tokens from localStorage/sessionStorage,
 * decodes the JWT payload to check exp (expiry), and compares against what
 * the .env file has configured as MUSE_API_KEY.
 *
 * This determines whether the JWT has truly expired or if we just need to
 * refresh the local copy from the browser.
 *
 * Usage: node scripts/muse-jwt-debug.mjs
 *
 * @module scripts/muse-jwt-debug
 * @version 1.0.0
 */

import WebSocket from 'ws';
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

const CDP_HOST = 'localhost';
const CDP_PORT = 9222;
const CDP_TIMEOUT = 5000;

const C = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m', gray: '\x1b[90m', bold: '\x1b[1m',
};

// Token key names to search in localStorage/sessionStorage
const TOKEN_KEYS = [
  'AuthToken', 'authToken', 'MUSE_AUTH', 'muse_token',
  'token', 'access_token', 'jwt', 'user', 'userInfo',
  '__MUSE_TOKEN__', 'project_token', 'x-auth-token',
];

function log(label, value, color = '') {
  console.log(`  ${color}${label}${C.reset}${value ? `: ${value}` : ''}`);
}

/**
 * Decode JWT payload (base64url) WITHOUT verifying signature.
 * Only for inspection — the signature will be verified by the muse.top API.
 * @param {string} jwt - The JWT string
 * @returns {object|null} Decoded payload or null on failure
 */
function decodeJwt(jwt) {
  try {
    if (!jwt || typeof jwt !== 'string' || !jwt.includes('.')) return null;
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    // base64url → base64 → Buffer → JSON
    let payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payloadB64.length % 4) payloadB64 += '=';
    const json = Buffer.from(payloadB64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Pretty-print JWT claims and check expiry.
 * @param {object} claims - Decoded JWT payload
 * @param {string} src - Where the token was found
 */
function printJwtClaims(claims, src) {
  console.log(`  ${C.cyan}━━━ JWT from ${src}${C.gray} (decoded payload)${C.reset}`);
  const nowSec = Math.floor(Date.now() / 1000);

  for (const [k, v] of Object.entries(claims)) {
    let disp = String(v);
    if (disp.length > 50) disp = disp.substring(0, 50) + '…';

    if (k === 'exp' || k === 'iat' || k === 'reg') {
      const ts = typeof v === 'number' ? v : parseInt(v, 10);
      const d = new Date(ts * 1000);
      const iso = d.toISOString();
      let tag = '';
      if (k === 'exp') {
        if (ts < nowSec) {
          const diffMin = Math.floor((nowSec - ts) / 60);
          tag = ` ${C.red}[EXPIRED ${diffMin} min ago]${C.reset}`;
        } else {
          const diffHr = Math.floor((ts - nowSec) / 3600);
          const diffMin = Math.floor(((ts - nowSec) % 3600) / 60);
          tag = ` ${C.green}[valid ${diffHr}h ${diffMin}m]${C.reset}`;
        }
      }
      log(`    ${k.padEnd(14)}`, `${iso}  (${disp})${tag}`);
    } else {
      log(`    ${k.padEnd(14)}`, disp);
    }
  }
  console.log('');
}

/**
 * Connect to Edge CDP and get page targets (tabs).
 */
function getPageTargets() {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('CDP connect timeout')), CDP_TIMEOUT);
    http.get(`http://${CDP_HOST}:${CDP_PORT}/json`, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => { clearTimeout(t); resolve(JSON.parse(d)); });
    }).on('error', (e) => { clearTimeout(t); reject(e); });
  });
}

function connectWS(url) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('WS timeout')), CDP_TIMEOUT);
    const ws = new WebSocket(url);
    ws.once('open', () => { clearTimeout(t); resolve(ws); });
    ws.once('error', (e) => { clearTimeout(t); reject(e); });
  });
}

async function evaluateOn(ws, expr) {
  return new Promise((resolve, reject) => {
    const id = Date.now() + Math.random();
    const t = setTimeout(() => reject(new Error('eval timeout')), CDP_TIMEOUT);
    const h = (ev) => {
      try {
        const d = JSON.parse(ev.data || ev.toString());
        if (d.id === id) {
          clearTimeout(t); ws.removeListener('message', h);
          if (d.error) reject(new Error(d.error.message));
          else resolve(d.result?.result?.value);
        }
      } catch { /* ignore */ }
    };
    ws.on('message', h);
    ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
  });
}

/**
 * Read the MUSE_API_KEY from .env file.
 */
function readEnvMuseJwt() {
  try {
    const envFile = join(PROJECT_ROOT, '.env');
    if (!existsSync(envFile)) return null;
    const raw = readFileSync(envFile, 'utf8');
    const m = raw.match(/^MUSE_API_KEY\s*=\s*(.+)$/m);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

async function main() {
  console.log(`\n${C.bold}╔══════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}║  Muse JWT Diagnostic Tool                            ║${C.reset}`);
  console.log(`${C.bold}║  CDP: http://${CDP_HOST}:${CDP_PORT}${' '.repeat(44 - 19)}║${C.reset}`);
  console.log(`${C.bold}╚══════════════════════════════════════════════════════╝${C.reset}\n`);

  // 1) Check what's in .env
  const envJwt = readEnvMuseJwt();
  if (envJwt) {
    log(`.env MUSE_API_KEY length`, `${envJwt.length} chars`, C.blue);
    const envClaims = decodeJwt(envJwt);
    if (envClaims) {
      printJwtClaims(envClaims, '.env MUSE_API_KEY');
      if (envClaims.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (envClaims.exp < now) {
          console.log(`  ${C.red}⚠ .env JWT is EXPIRED — needs to be replaced with fresh token from Edge browser${C.reset}\n`);
        } else {
          console.log(`  ${C.green}✓ .env JWT is still valid${C.reset}\n`);
        }
      }
    } else {
      log(`  `.concat('.env JWT decode failed'), 'not a valid JWT', C.red);
    }
  } else {
    log('.env MUSE_API_KEY', 'NOT FOUND', C.red);
  }

  // 2) Connect to Edge CDP
  let pages;
  try {
    pages = await getPageTargets();
    log('Connected to Edge CDP', `found ${pages.filter(p => p.type === 'page').length} pages`, C.green);
  } catch (e) {
    log('Edge CDP FAILED', e.message, C.red);
    console.log(`  ${C.yellow}→ Start Edge with: msedge.exe --remote-debugging-port=9222${C.reset}`);
    process.exit(1);
  }

  // 3) Find muse.top tabs
  const musePages = pages.filter(p => {
    if (p.type !== 'page') return false;
    const url = (p.url || '').toLowerCase();
    return url.includes('muse.top') || url.includes('project-api.atmob.com') ||
           url.includes('xinchat') || url.includes('muse');
  });

  console.log('');
  log(`Muse tabs found`, musePages.length, musePages.length ? C.green : C.yellow);
  if (musePages.length === 0) {
    console.log(`  ${C.yellow}→ Open https://muse.top in Edge and log in${C.reset}`);
    process.exit(0);
  }

  const foundTokens = [];

  for (const page of musePages) {
    console.log(`\n  ${C.bold}▶ Tab: ${page.title || '(no title)'}${C.reset}`);
    log(`    URL`, page.url?.substring(0, 80), C.gray);

    try {
      const ws = await connectWS(page.webSocketDebuggerUrl);

      // Build a script that extracts all possible tokens
      const expr = `
        (function() {
          var keys = ${JSON.stringify(TOKEN_KEYS)};
          var results = [];
          var storages = [{name:'localStorage',s:localStorage},{name:'sessionStorage',s:sessionStorage}];
          for (var i = 0; i < storages.length; i++) {
            var s = storages[i];
            for (var j = 0; j < s.s.length; j++) {
              var k = s.s.key(j);
              try {
                var v = s.s.getItem(k);
                if (!v) continue;
                // Check exact known keys
                if (keys.indexOf(k) !== -1) {
                  results.push({key:k, storage:s.name, value:v, length:v.length, match:'exact'});
                }
                // Also check nested userInfo JSON for token fields
                if (k.toLowerCase().includes('userinfo') || k.toLowerCase().includes('user')) {
                  try {
                    var u = JSON.parse(v);
                    for (var p in u) {
                      if (keys.indexOf(p) !== -1 && typeof u[p] === 'string' && u[p].length > 20) {
                        results.push({key:p, storage:s.name+'.'+k, value:u[p], length:u[p].length, match:'nested'});
                      }
                      // Check nested userInfo inside userInfo
                      if (typeof u[p] === 'object' && u[p]) {
                        for (var p2 in u[p]) {
                          if (keys.indexOf(p2) !== -1 && typeof u[p][p2] === 'string' && u[p][p2].length > 20) {
                            results.push({key:p2, storage:s.name+'.'+k+'.'+p, value:u[p][p2], length:u[p][p2].length, match:'deep'});
                          }
                        }
                      }
                    }
                  } catch(e) {}
                }
                // Heuristic: any key whose value looks like a JWT (3 base64url parts)
                if (typeof v === 'string' && /^[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$/.test(v)) {
                  // Avoid duplicates with exact-key matches
                  var isDup = results.some(function(r){return r.value === v;});
                  if (!isDup) {
                    results.push({key:k, storage:s.name, value:v, length:v.length, match:'heuristic'});
                  }
                }
              } catch(e) {}
            }
          }
          return JSON.stringify(results);
        })()
      `;

      let raw;
      try {
        raw = await evaluateOn(ws, expr);
      } catch (evalErr) {
        log(`    Evaluate failed`, evalErr.message, C.red);
        try { ws.close(); } catch { /* ignore */ }
        continue;
      }

      const results = JSON.parse(raw || '[]');
      log(`    Candidates found`, results.length, results.length ? C.cyan : C.gray);

      for (const r of results) {
        log(`      · [${r.match}]`, `${r.storage}.${r.key}  (len=${r.length})`);
        const claims = decodeJwt(r.value);
        if (claims) {
          printJwtClaims(claims, `${r.storage}.${r.key}`);
          foundTokens.push({
            key: r.key,
            storage: r.storage,
            match: r.match,
            jwt: r.value,
            claims,
            tab: page.title,
          });
        } else {
          log(`        `, 'Not a JWT (could be encrypted user JSON)', C.gray);
        }
      }

      try { ws.close(); } catch { /* ignore */ }
    } catch (e) {
      log(`    WS connect failed`, e.message, C.red);
    }
  }

  // 4) Summary & recommendation
  console.log(`\n${C.bold}╔══════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}║  Recommendation                                      ║${C.reset}`);
  console.log(`${C.bold}╚══════════════════════════════════════════════════════╝${C.reset}\n`);

  const nowSec = Math.floor(Date.now() / 1000);
  const validBrowserTokens = foundTokens.filter(t => t.claims.exp && t.claims.exp > nowSec);
  const expiredBrowserTokens = foundTokens.filter(t => t.claims.exp && t.claims.exp <= nowSec);

  log(`Total valid tokens in Edge`, `${validBrowserTokens.length}`, validBrowserTokens.length ? C.green : C.red);
  log(`Total expired tokens in Edge`, `${expiredBrowserTokens.length}`, expiredBrowserTokens.length ? C.yellow : C.gray);

  if (validBrowserTokens.length > 0) {
    const best = validBrowserTokens[0];
    console.log(`\n  ${C.green}✓ Found a VALID JWT in Edge!${C.reset}`);
    log(`    Token source`, `${best.storage}.${best.key}`, C.cyan);
    log(`    Tab`, `${best.tab}`, C.cyan);
    console.log(`\n  ${C.bold}Copy this into .env as MUSE_API_KEY:${C.reset}\n`);
    console.log(`    ${C.yellow}MUSE_API_KEY=${best.jwt}${C.reset}\n`);
    console.log(`  ${C.gray}Or click "Refresh JWT" on the Muse AI page in the app.${C.reset}`);
  } else if (expiredBrowserTokens.length > 0) {
    console.log(`\n  ${C.red}✗ All JWT tokens in Edge are EXPIRED.${C.reset}`);
    console.log(`  ${C.yellow}→ Action: Open https://muse.top in Edge, log in again (via SMS) — this${C.reset}`);
    console.log(`  ${C.yellow}   will issue a new JWT. Then re-run this tool to extract it.${C.reset}`);
  } else {
    console.log(`\n  ${C.red}✗ No JWT tokens found in any Edge muse.top tab.${C.reset}`);
    console.log(`  ${C.yellow}→ Action: Open https://muse.top in Edge, log in (create an account if needed).${C.reset}`);
    console.log(`  ${C.yellow}   Then re-run this tool.${C.reset}`);
  }

  process.exit(0);
}

main().catch(e => { console.error(`${C.red}Fatal:${C.reset}`, e.message); process.exit(1); });
