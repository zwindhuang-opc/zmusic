/**
 * End-to-end Melo song generation test.
 *
 * DISCOVERED ENDPOINTS (from .melo-chunk-pages-chat-chatdetail.CQAHOO8b.js):
 *   POST /agent/api/v1/music/generate   — submit generation, returns {success, task_id, message}
 *   GET  /agent/api/v1/session/{id}     — fetch session info (session_id is CLIENT-GENERATED UUID v4)
 *   WSS  /agent/api/v1/chat/ws          — streaming chat (alt path)
 *
 * REQUEST BODY for /agent/api/v1/music/generate:
 *   {
 *     session_id, title, lyrics, tags[], styles[], cover_type,
 *     make_instrumental, model_code:"MS55",
 *     client_type, os, version,
 *     [voice_id], [duration 10-360], [audio_url + reference params]
 *   }
 *
 * STATUS VALUES: queue → pending → processing → streaming → completed/failed
 *
 * USAGE:  node scripts/test-melo-generate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Load .env manually (no dotenv dep required)
const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const MELO_BASE_URL = env.MELO_BASE_URL || 'https://api.51melo.com';
const MELO_API_KEY = env.MELO_API_KEY;

if (!MELO_API_KEY) {
  console.error('MELO_API_KEY missing from .env');
  process.exit(1);
}

/** Generate UUID v4 (matches Melo's client-side session_id generation). */
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (crypto.randomBytes(1)[0] / 256) * 16 | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Build standard headers with JWT bearer token. */
function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${MELO_API_KEY}`,
  };
}

/** Sleep helper. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const sessionId = uuid();
  console.log('========== MELO SONG GENERATION TEST ==========');
  console.log(`Base URL : ${MELO_BASE_URL}`);
  console.log(`Session  : ${sessionId}`);
  console.log(`JWT      : ${MELO_API_KEY.slice(0, 30)}...`);
  console.log('');

  // Step 1: Verify auth via /serv/api/v1/auth/me
  console.log('[1/4] Verifying auth via /serv/api/v1/auth/me ...');
  const meRes = await fetch(`${MELO_BASE_URL}/serv/api/v1/auth/me`, { headers: headers() });
  const meData = await meRes.json();
  console.log(`  HTTP ${meRes.status} | status=${meData.status} | msg=${meData.msg || 'OK'}`);
  if (meData.data) {
    console.log(`  user_id=${meData.data.user_id} | phone=${meData.data.phone} | credit=${meData.data.credit}`);
  } else {
    console.error('  Auth failed — aborting.');
    console.error(JSON.stringify(meData, null, 2));
    process.exit(1);
  }

  // Step 2: Submit generation request to /agent/api/v1/music/generate
  console.log('\n[2/4] Submitting generation to /agent/api/v1/music/generate ...');
  const genBody = {
    session_id: sessionId,
    title: '夜空下的旋律',
    lyrics: '[intro]\n夜空中最亮的星\n照亮我前行的路\n\n[verse]\n独自走在城市的街头\n霓虹闪烁如梦如幻\n想起你温柔的眼眸\n心中泛起阵阵涟漪\n\n[chorus]\n夜空下的旋律\n是我对你的思念\n繁星点点如诗篇\n谱写我们的故事',
    tags: 'pop, chinese, melancholic',
    styles: '流行 抒情',
    cover_type: 'none',
    make_instrumental: false,
    model_code: 'MS55',
    client_type: 'web',
    os: 'web',
    version: '1.0.0',
  };
  console.log('  Request body:', JSON.stringify(genBody, null, 2));

  const genRes = await fetch(`${MELO_BASE_URL}/agent/api/v1/music/generate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(genBody),
  });
  const genData = await genRes.json();
  console.log(`\n  HTTP ${genRes.status} | status=${genData.status}`);
  console.log('  Response:', JSON.stringify(genData, null, 2));

  if (!genData.success || !genData.task_id) {
    console.error('\n  Generation submission failed.');
    process.exit(1);
  }

  const taskId = genData.task_id;
  console.log(`\n  Task ID: ${taskId}`);

  // Step 3: Poll for status — try multiple candidate endpoints
  console.log('\n[3/4] Polling for task status ...');
  const statusPaths = [
    `/agent/api/v1/music/status/${taskId}`,
    `/agent/api/v1/music/${taskId}`,
    `/agent/api/v1/music/task/${taskId}`,
    `/agent/api/v1/task/${taskId}`,
    `/agent/api/v1/queue/${taskId}`,
    `/agent/api/v1/songs/${taskId}`,
    `/agent/api/v1/session/${sessionId}`,
  ];

  let workingStatusPath = null;
  console.log('  Probing status endpoints:');
  for (const p of statusPaths) {
    try {
      const r = await fetch(`${MELO_BASE_URL}${p}`, { headers: headers() });
      const body = await r.text();
      let preview = body.slice(0, 200);
      try { preview = JSON.stringify(JSON.parse(body)).slice(0, 200); } catch { }
      const tag = r.status === 404 ? '404' : (r.status >= 200 && r.status < 300 ? 'OK' : `${r.status}`);
      console.log(`    [${tag}] ${p}`);
      if (tag !== '404' && r.status < 500) {
        console.log(`         ${preview}`);
        if (!workingStatusPath) workingStatusPath = p;
      }
    } catch (e) {
      console.log(`    [ERR] ${p} — ${e.message}`);
    }
  }

  if (!workingStatusPath) {
    console.error('\n  No working status endpoint found.');
    process.exit(1);
  }

  console.log(`\n  Using status path: ${workingStatusPath}`);

  // Step 4: Poll until completed or failed (max 5 minutes)
  console.log('\n[4/4] Polling every 5s (max 5 min) ...');
  let finalResult = null;
  for (let i = 0; i < 60; i++) {
    await sleep(5000);
    const r = await fetch(`${MELO_BASE_URL}${workingStatusPath}`, { headers: headers() });
    const data = await r.json();
    const status = data?.data?.status || data?.status || 'unknown';
    console.log(`  [${i + 1}/60] status=${status}`);

    if (data?.data) {
      const d = data.data;
      if (d.title) console.log(`           title=${d.title}`);
      if (d.songs && d.songs.length) {
        console.log(`           songs=${d.songs.length}`);
        for (const s of d.songs) {
          console.log(`             - id=${s.id || s.song_id} | title=${s.title} | url=${s.audio_url || s.url || '(none)'}`);
        }
      }
      if (d.error_message) console.log(`           error=${d.error_message}`);
    }

    if (status === 'completed' || status === 'failed') {
      finalResult = data;
      break;
    }
  }

  console.log('\n========== FINAL RESULT ==========');
  console.log(JSON.stringify(finalResult, null, 2));
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
