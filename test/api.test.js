const BASE_URL = 'http://127.0.0.1:5501';

async function test(name, fn) {
  try {
    const result = await fn();
    console.log(`  ✅ ${name}`);
    return { name, passed: true, result };
  } catch (error) {
    console.log(`  ❌ ${name}: ${error.message}`);
    return { name, passed: false, error: error.message };
  }
}

async function runTests() {
  console.log('\n=== ZMusic v5.5.0 Comprehensive API Test Suite ===\n');
  
  const results = [];
  
  console.log('📊 Health & Status Endpoints');
  results.push(await test('GET /api/health returns success', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    if (!data.success) throw new Error('success is false');
    if (!data.status) throw new Error('missing status');
    if (!data.version) throw new Error('missing version');
    return data;
  }));
  
  results.push(await test('GET /api/agent/status returns success', async () => {
    const res = await fetch(`${BASE_URL}/api/agent/status`);
    const data = await res.json();
    if (!data.success) throw new Error('success is false');
    return data;
  }));
  
  results.push(await test('GET /api/business/analytics returns success', async () => {
    const res = await fetch(`${BASE_URL}/api/business/analytics`);
    const data = await res.json();
    if (!data.success) throw new Error('success is false');
    return data;
  }));
  
  console.log('\n🎵 Lyrics Endpoints');
  results.push(await test('GET /api/lyrics/genres returns genres & themes', async () => {
    const res = await fetch(`${BASE_URL}/api/lyrics/genres`);
    const data = await res.json();
    if (!data.success) throw new Error('success is false');
    if (!data.data?.genres?.length) throw new Error('missing genres');
    if (!data.data?.themes?.length) throw new Error('missing themes');
    return data;
  }));
  
  const methods = ['fsm', 'network_layer', 'muse', 'suno'];
  for (const method of methods) {
    results.push(await test(`POST /api/lyrics/generate (method: ${method})`, async () => {
      const res = await fetch(`${BASE_URL}/api/lyrics/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: 'pop',
          theme: 'love',
          method,
          bpm: 120,
          duration: 200
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'success is false');
      if (!data.data?.fullText) throw new Error('missing fullText');
      if (!data.data?.sections?.length) throw new Error('missing sections');
      return data;
    }));
  }
  
  results.push(await test('POST /api/lyrics/generate-agent', async () => {
    const res = await fetch(`${BASE_URL}/api/lyrics/generate-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genre: 'rock',
        theme: 'success',
        method: 'fsm',
        bpm: 140
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'success is false');
    return data;
  }));
  
  console.log('\n🎶 Music Endpoints');
  results.push(await test('POST /api/music/generate', async () => {
    const res = await fetch(`${BASE_URL}/api/music/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'An upbeat pop song about summer love',
        style: 'pop',
        duration: 180
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'success is false');
    return data;
  }));
  
  console.log('\n🎬 MV Endpoints');
  results.push(await test('GET /api/mv/genres returns genres list', async () => {
    const res = await fetch(`${BASE_URL}/api/mv/genres`);
    const data = await res.json();
    if (!data.success) throw new Error('success is false');
    if (!Array.isArray(data.data)) throw new Error('data is not array');
    return data;
  }));
  
  results.push(await test('POST /api/mv/generate', async () => {
    const res = await fetch(`${BASE_URL}/api/mv/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genre: 'electronic',
        duration: 200,
        style: 'cinematic'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'success is false');
    if (!data.data?.timeline?.length) throw new Error('missing timeline');
    return data;
  }));
  
  results.push(await test('POST /api/mv/generate-agent', async () => {
    const res = await fetch(`${BASE_URL}/api/mv/generate-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genre: 'pop',
        duration: 180
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'success is false');
    return data;
  }));
  
  console.log('\n📜 History Endpoints');
  results.push(await test('GET /api/history returns list', async () => {
    const res = await fetch(`${BASE_URL}/api/history`);
    const data = await res.json();
    if (!data.success) throw new Error('success is false');
    if (!Array.isArray(data.data)) throw new Error('data is not array');
    return data;
  }));
  
  results.push(await test('GET /api/history/stats returns stats', async () => {
    const res = await fetch(`${BASE_URL}/api/history/stats`);
    const data = await res.json();
    if (!data.success) throw new Error('success is false');
    if (typeof data.data?.total !== 'number') throw new Error('missing total');
    return data;
  }));
  
  results.push(await test('GET /api/history?type=lyrics filters by type', async () => {
    const res = await fetch(`${BASE_URL}/api/history?type=lyrics`);
    const data = await res.json();
    if (!data.success) throw new Error('success is false');
    const allLyrics = data.data.every(item => item.type === 'lyrics');
    if (!allLyrics) throw new Error('not all items are lyrics type');
    return data;
  }));
  
  results.push(await test('GET /api/history/:id returns single item', async () => {
    const listRes = await fetch(`${BASE_URL}/api/history`);
    const listData = await listRes.json();
    if (!listData.data?.length) throw new Error('no history items to test with');
    const firstId = listData.data[0].id;
    const res = await fetch(`${BASE_URL}/api/history/${firstId}`);
    const data = await res.json();
    if (!data.success) throw new Error('success is false');
    if (data.data?.id !== firstId) throw new Error('wrong id returned');
    return data;
  }));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const failed = total - passed;
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passed}/${total} passed`);
  if (failed > 0) {
    console.log(`❌ ${failed} failed:`);
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  } else {
    console.log('🎉 All tests passed!');
  }
  console.log('='.repeat(50) + '\n');
  
  return { passed, total, failed, results };
}

runTests().catch(console.error);
