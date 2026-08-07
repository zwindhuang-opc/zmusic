/**
 * muse.top API probe v4 — correct POST body fields (from buildBaseRequest f()).
 */
import 'dotenv/config';

const TOKEN = process.env.MUSE_API_KEY || '';
const APP_KEY = process.env.MUSE_APP_KEY || '8e33a5e60ef347df808d14026f27d227';
const HOST = 'https://project-api.atmob.com';

if (!TOKEN) { console.error('MUSE_API_KEY missing'); process.exit(1); }

const payloadB64 = TOKEN.split('.')[1];
const payload = JSON.parse(Buffer.from(payloadB64 + '='.repeat(-payloadB64.length % 4), 'base64url').toString());

// buildBaseRequest fields — exactly what muse.top's f(t) returns.
function baseReq(extra = {}) {
  return {
    packageName: 'com.xingchat.web.muse',
    appPlatform: 4,
    channelName: '',
    machineId: payload.did,   // use device id from JWT
    authToken: TOKEN,
    ...extra,
  };
}

const headers = {
  AuthToken: TOKEN,
  'App-Key': APP_KEY,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Origin: 'https://muse.top',
  Referer: 'https://muse.top/',
};

const probes = [
  { label: 'user/info (POST)',           method: 'POST', url: '/project/song/v1/user/info', body: baseReq() },
  { label: 'confs (POST)',               method: 'POST', url: '/project/song/v1/confs',     body: baseReq() },
  { label: 'song/style (POST)',          method: 'POST', url: '/project/song/v30/song/style', body: baseReq() },
  { label: 'song/fast/config (POST)',    method: 'POST', url: '/project/song/v30/song/fast/config', body: baseReq() },
  { label: 'song/master/config (POST)',  method: 'POST', url: '/project/song/v30/song/master/config', body: baseReq() },
  { label: 'work/page (POST)',           method: 'POST', url: '/project/song/v30/work/page', body: baseReq({ page: 1, page_size: 3 }) },
  { label: 'work/tasks/query (POST)',    method: 'POST', url: '/project/song/v30/work/tasks/query', body: baseReq({ page: 1, page_size: 3 }) },
  { label: 'song/structure/template/list (POST)', method: 'POST', url: '/project/song/v30/song/structure/template/list', body: baseReq() },
  { label: 'explore/web/work/page (POST)', method: 'POST', url: '/project/song/v30/explore/web/work/page', body: baseReq({ page: 1, page_size: 3 }) },
];

console.log('Probing with correct buildBaseRequest body\n' + '='.repeat(80));

for (const p of probes) {
  const url = `${HOST}${p.url}`;
  try {
    const r = await fetch(url, {
      method: p.method,
      headers,
      body: JSON.stringify(p.body),
    });
    const t = await r.text();
    console.log(`\n[${r.status}] ${p.label}`);
    console.log(`  ${t.slice(0, 1000).replace(/\s+/g, ' ')}`);
  } catch (e) {
    console.log(`\nERR ${p.label}: ${e.message}`);
  }
}

console.log('\nDone.');
