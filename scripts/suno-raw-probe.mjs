#!/usr/bin/env node
/**
 * suno-raw-probe.mjs — Hit mcp.suno.cn directly with the API key and
 * dump EVERY field from /mcp/api/user plus probe a few other credit-
 * related endpoints. Goal: find out if VIP 会员 really has 0 points
 * or if credits live under a different field/endpoint.
 */
import { config } from '../src/config/index.js';

const SUNO_BASE = 'https://mcp.suno.cn';
const KEY = config.sunoApiKey;

if (!KEY) {
  console.error('SUNO_CN_API_KEY not set in .env');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${KEY}`,
  'Content-Type': 'application/json; charset=utf-8',
};

async function probe(path, method = 'GET', body = null) {
  const url = `${SUNO_BASE}${path}`;
  console.log(`\n>>> ${method} ${path}`);
  try {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(url, opts);
    const text = await r.text();
    console.log(`    HTTP ${r.status}  (${text.length} bytes)`);
    try {
      const j = JSON.parse(text);
      console.log('    ', JSON.stringify(j, null, 2).substring(0, 2000));
      return j;
    } catch {
      console.log('    raw:', text.substring(0, 500));
      return null;
    }
  } catch (e) {
    console.log('    ERROR:', e.message);
    return null;
  }
}

console.log('=== Suno raw API probe ===');
console.log('API key length:', KEY.length);

// 1. /mcp/api/user — the one we already use
const user = await probe('/mcp/api/user');

// 2. Print EVERY field in the user response
if (user) {
  const u = user.data || user;
  console.log('\n=== ALL FIELDS in user response ===');
  for (const [k, v] of Object.entries(u)) {
    console.log(`  ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
  }
}

// 3. Probe other possible credit/balance endpoints
const endpoints = [
  ['/mcp/api/credits', 'GET'],
  ['/mcp/api/balance', 'GET'],
  ['/mcp/api/points', 'GET'],
  ['/mcp/api/quota', 'GET'],
  ['/mcp/api/account', 'GET'],
  ['/mcp/api/profile', 'GET'],
  ['/mcp/api/user/credits', 'GET'],
  ['/mcp/api/user/info', 'GET'],
  ['/mcp/api/v1/user', 'GET'],
  ['/mcp/api/member', 'GET'],
  ['/mcp/api/subscription', 'GET'],
  ['/mcp/api/vip', 'GET'],
];

for (const [path, method] of endpoints) {
  await probe(path, method);
}

// 4. Also try the music list to see if recent generations exist
await probe('/mcp/api/music?page=1&page_size=3');

process.exit(0);
