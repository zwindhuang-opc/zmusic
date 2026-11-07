/**
 * ZMusic API smoke test suite
 *
 * Exercises the live backend over HTTP. Run with the dev/prod server already
 * running (`npm start` or `npm run server`).
 *
 *   npm run test:api
 *
 * Base URL resolution order (no hardcoded ports — see issue I002):
 *   1. API_BASE_URL            (full URL, highest priority)
 *   2. BACKEND_PORT            (port number)
 *   3. .dev-ports.json         (pinned port written by scripts/start-dev.mjs)
 *   4. 4721                    (project default backend port)
 *
 * Exit code is 0 only when every assertion passes, so the suite can gate CI.
 *
 * @module test/api.test
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/**
 * Resolve the backend base URL without relying on a hardcoded port.
 * @returns {string} e.g. "http://127.0.0.1:4721"
 */
function resolveBaseUrl() {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL.replace(/\/$/, '');
  if (process.env.BACKEND_PORT) return `http://127.0.0.1:${process.env.BACKEND_PORT}`;

  try {
    const portsFile = path.join(ROOT, '.dev-ports.json');
    if (fs.existsSync(portsFile)) {
      const { backendPort } = JSON.parse(fs.readFileSync(portsFile, 'utf-8'));
      if (backendPort) return `http://127.0.0.1:${backendPort}`;
    }
  } catch {
    // Fall through to the project default.
  }

  return 'http://127.0.0.1:4721';
}

const BASE_URL = resolveBaseUrl();

/**
 * Run one assertion and record its result.
 *
 * A test body may return `{ __skip: 'reason' }` to report a skipped test — used
 * for assertions that depend on an external account condition (e.g. upstream
 * credit balance) rather than on our own code.
 *
 * @param {string} name - Human readable test name
 * @param {() => Promise<any>} fn - Test body; throw to fail
 * @returns {Promise<{name: string, passed: boolean, skipped?: boolean, error?: string}>}
 */
async function test(name, fn) {
  try {
    const result = await fn();
    if (result && result.__skip) {
      console.log(`  SKIP  ${name} — ${result.__skip}`);
      return { name, passed: true, skipped: true, result };
    }
    console.log(`  PASS  ${name}`);
    return { name, passed: true, result };
  } catch (error) {
    console.log(`  FAIL  ${name}: ${error.message}`);
    return { name, passed: false, error: error.message };
  }
}

/**
 * Detect an upstream "not enough credits" rejection.
 *
 * This is an account condition (see ISSUE_LOG I003), not a code defect, so the
 * generation tests report SKIP instead of FAIL when it happens. The Chinese
 * message comes from suno.cn: "用户积点不足，请前往购买".
 *
 * @param {any} data - Response body
 * @returns {boolean}
 */
function isInsufficientCredits(data) {
  const message = String(data?.error || data?.message || data?.msg || '');
  return /积点不足|积分不足|余额不足|insufficient|not enough|quota|credit/i.test(message);
}

/**
 * Perform a JSON request against the backend.
 * @param {string} url - Path relative to BASE_URL
 * @param {object} [options] - fetch options
 * @returns {Promise<any>} parsed JSON body
 */
async function request(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, options);
  return res.json();
}

async function runTests() {
  console.log('\n=== ZMusic API Test Suite ===');
  console.log(`Base URL: ${BASE_URL}\n`);

  const results = [];

  console.log('Health & Status Endpoints');
  results.push(await test('GET /api/health returns success', async () => {
    const data = await request('/api/health');
    if (!data.success) throw new Error('success is false');
    if (!data.status) throw new Error('missing status');
    if (!data.version) throw new Error('missing version');
    return data;
  }));

  results.push(await test('GET /api/agent/status returns success', async () => {
    const data = await request('/api/agent/status');
    if (!data.success) throw new Error('success is false');
    return data;
  }));

  results.push(await test('GET /api/business/analytics returns success', async () => {
    const data = await request('/api/business/analytics');
    if (!data.success) throw new Error('success is false');
    return data;
  }));

  console.log('\nError Reporting Endpoint');
  results.push(await test('POST /api/errors/report accepts a client report', async () => {
    const data = await request('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        source: 'test-suite',
        message: 'api.test.js smoke report',
        stack: 'at test (api.test.js:1:1)',
        context: 'page=test',
      }),
    });
    if (!data.success) throw new Error(data.error || 'success is false');
    return data;
  }));

  results.push(await test('POST /api/errors/report rejects a missing message', async () => {
    const res = await fetch(`${BASE_URL}/api/errors/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'error', source: 'test-suite' }),
    });
    if (res.status !== 400) throw new Error(`expected 400, got ${res.status}`);
    return await res.json();
  }));

  console.log('\nLyrics Endpoints');
  results.push(await test('GET /api/lyrics/genres returns genres & themes', async () => {
    const data = await request('/api/lyrics/genres');
    if (!data.success) throw new Error('success is false');
    if (!data.data?.genres?.length) throw new Error('missing genres');
    if (!data.data?.themes?.length) throw new Error('missing themes');
    return data;
  }));

  for (const method of ['fsm', 'network_layer', 'muse', 'suno']) {
    results.push(await test(`POST /api/lyrics/generate (method: ${method})`, async () => {
      const data = await request('/api/lyrics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre: 'pop', theme: 'love', method, bpm: 120, duration: 200 }),
      });
      if (!data.success) throw new Error(data.error || 'success is false');
      if (!data.data?.fullText) throw new Error('missing fullText');
      if (!data.data?.sections?.length) throw new Error('missing sections');
      return data;
    }));
  }

  results.push(await test('POST /api/lyrics/generate-agent', async () => {
    const data = await request('/api/lyrics/generate-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ genre: 'rock', theme: 'success', method: 'fsm', bpm: 140 }),
    });
    if (!data.success) throw new Error(data.error || 'success is false');
    return data;
  }));

  console.log('\nMusic Endpoints');
  results.push(await test('POST /api/music/generate', async () => {
    const data = await request('/api/music/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'An upbeat pop song about summer love',
        style: 'pop',
        duration: 180,
      }),
    });
    if (isInsufficientCredits(data)) return { __skip: 'upstream credits exhausted (ISSUE_LOG I003)' };
    if (!data.success) throw new Error(data.error || 'success is false');
    return data;
  }));

  results.push(await test('POST /api/music/generate-agent returns provider results', async () => {
    const data = await request('/api/music/generate-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A calm piano piece', style: 'classical', duration: 60 }),
    });
    if (!data.success) throw new Error(data.error || 'success is false');
    if (!data.taskId) throw new Error('missing taskId');
    if (!data.providers || typeof data.providers !== 'object') throw new Error('missing providers');
    // Each enabled provider must report its own outcome instead of throwing.
    for (const [name, provider] of Object.entries(data.providers)) {
      if (typeof provider?.success !== 'boolean') throw new Error(`provider ${name} has no success flag`);
    }
    return data;
  }));

  console.log('\nMV Endpoints');
  results.push(await test('GET /api/mv/genres returns genres list', async () => {
    const data = await request('/api/mv/genres');
    if (!data.success) throw new Error('success is false');
    if (!Array.isArray(data.data)) throw new Error('data is not array');
    return data;
  }));

  results.push(await test('POST /api/mv/generate', async () => {
    const data = await request('/api/mv/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ genre: 'electronic', duration: 200, style: 'cinematic' }),
    });
    if (!data.success) throw new Error(data.error || 'success is false');
    if (!data.data?.timeline?.length) throw new Error('missing timeline');
    return data;
  }));

  results.push(await test('POST /api/mv/generate-agent', async () => {
    const data = await request('/api/mv/generate-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ genre: 'pop', duration: 180 }),
    });
    if (!data.success) throw new Error(data.error || 'success is false');
    return data;
  }));

  console.log('\nHistory Endpoints');
  results.push(await test('GET /api/history returns list', async () => {
    const data = await request('/api/history');
    if (!data.success) throw new Error('success is false');
    if (!Array.isArray(data.data)) throw new Error('data is not array');
    return data;
  }));

  results.push(await test('GET /api/history/stats returns stats', async () => {
    const data = await request('/api/history/stats');
    if (!data.success) throw new Error('success is false');
    if (typeof data.data?.total !== 'number') throw new Error('missing total');
    return data;
  }));

  results.push(await test('GET /api/history?type=lyrics filters by type', async () => {
    const data = await request('/api/history?type=lyrics');
    if (!data.success) throw new Error('success is false');
    if (!data.data.every((item) => item.type === 'lyrics')) throw new Error('not all items are lyrics type');
    return data;
  }));

  results.push(await test('GET /api/history/:id returns single item', async () => {
    const list = await request('/api/history');
    if (!list.data?.length) throw new Error('no history items to test with');
    const firstId = list.data[0].id;
    const data = await request(`/api/history/${firstId}`);
    if (!data.success) throw new Error('success is false');
    if (data.data?.id !== firstId) throw new Error('wrong id returned');
    return data;
  }));

  console.log('\nAI Captions Endpoint (count 边界集成测试)');

  /** 便捷 POST，走与前端 AiCaptionButton 相同的路径。 */
  const postCaptions = (body) => request('/api/ai/captions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  results.push(await test('POST /api/ai/captions count 缺省 → 3 条', async () => {
    const data = await postCaptions({ kind: 'inspiration' });
    if (!data.success) throw new Error('success is false');
    if (data.captions?.length !== 3) throw new Error(`expected 3, got ${data.captions?.length}`);
    if (!data.captions.every((c) => typeof c === 'string' && c.length > 5)) throw new Error('empty caption');
    return data;
  }));

  results.push(await test('POST /api/ai/captions count=0 → 下界夹紧（≥1 条）', async () => {
    const data = await postCaptions({ kind: 'inspiration', count: 0 });
    if (!data.success) throw new Error('success is false');
    if (!Array.isArray(data.captions) || data.captions.length < 1) {
      throw new Error(`count=0 must clamp to ≥1, got ${data.captions?.length}`);
    }
    return data;
  }));

  results.push(await test('POST /api/ai/captions count=-5 → 下界夹紧（≥1 条）', async () => {
    const data = await postCaptions({ kind: 'lyrics', count: -5 });
    if (!data.success) throw new Error('success is false');
    if (!Array.isArray(data.captions) || data.captions.length < 1) {
      throw new Error(`negative count must clamp to ≥1, got ${data.captions?.length}`);
    }
    return data;
  }));

  results.push(await test('POST /api/ai/captions count=99 → 上界夹紧（≤5 条）', async () => {
    const data = await postCaptions({ kind: 'inspiration', count: 99 });
    if (!data.success) throw new Error('success is false');
    if (data.captions?.length > 5) throw new Error(`count=99 must clamp to ≤5, got ${data.captions?.length}`);
    return data;
  }));

  results.push(await test('POST /api/ai/captions count 为字符串 "2" → 数值转换后 2 条', async () => {
    const data = await postCaptions({ kind: 'title', count: '2' });
    if (!data.success) throw new Error('success is false');
    if (data.captions?.length !== 2) throw new Error(`string "2" should give 2, got ${data.captions?.length}`);
    return data;
  }));

  results.push(await test('POST /api/ai/captions count 为非法字符串 → 回退默认 3 条', async () => {
    const data = await postCaptions({ kind: 'share', title: '夏夜的海边', count: 'abc' });
    if (!data.success) throw new Error('success is false');
    if (data.captions?.length !== 3) throw new Error(`NaN count should fall back to 3, got ${data.captions?.length}`);
    return data;
  }));

  results.push(await test('POST /api/ai/captions 候选互不重复且非空', async () => {
    const data = await postCaptions({ kind: 'inspiration', count: 5 });
    if (!data.success) throw new Error('success is false');
    const unique = new Set(data.captions);
    if (unique.size !== data.captions.length) throw new Error('duplicate captions');
    if (data.captions.some((c) => !c || c.trim().length === 0)) throw new Error('empty caption');
    return data;
  }));

  results.push(await test('POST /api/ai/captions 无 LLM Key 时 source=local', async () => {
    const data = await postCaptions({ kind: 'inspiration' });
    if (!data.success) throw new Error('success is false');
    if (data.source !== 'local') throw new Error(`expected source=local, got ${data.source}`);
    return data;
  }));

  const passed = results.filter((r) => r.passed).length;
  const skipped = results.filter((r) => r.skipped).length;
  const total = results.length;
  const failed = total - passed;

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Test Results: ${passed}/${total} passed${skipped ? ` (${skipped} skipped)` : ''}`);
  if (failed > 0) {
    console.log(`${failed} failed:`);
    results.filter((r) => !r.passed).forEach((r) => console.log(`   - ${r.name}: ${r.error}`));
  } else {
    console.log('All tests passed.');
  }
  console.log('='.repeat(50) + '\n');

  return { passed, total, failed, skipped, results };
}

runTests()
  .then(({ failed }) => process.exit(failed > 0 ? 1 : 0))
  .catch((err) => {
    console.error(`\nTest suite crashed: ${err.message}`);
    console.error('Is the backend running?  npm start   (or  npm run server)');
    process.exit(1);
  });
