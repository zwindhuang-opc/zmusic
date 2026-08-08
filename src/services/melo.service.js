const API_BASE = '/api/melo';

export function isConfigured() {
  return import.meta.env?.VITE_MELO_ENABLED === 'true';
}

export async function getStatus() {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error(`Melo status error: ${res.status}`);
  return res.json();
}

export async function getUser() {
  const res = await fetch(`${API_BASE}/user`);
  if (!res.ok) throw new Error(`Melo user error: ${res.status}`);
  return res.json();
}

export async function generateSong(params) {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Melo generate error: ${res.status}`);
  }
  return res.json();
}

export async function queryTask(taskId) {
  const res = await fetch(`${API_BASE}/task/${taskId}`);
  if (!res.ok) throw new Error(`Melo task error: ${res.status}`);
  return res.json();
}

export async function pollUntilDone(taskId, options = {}) {
  const { intervalMs = 3000, timeoutMs = 180000, onPoll } = options;
  const startTime = Date.now();
  let lastResult = null;

  while (Date.now() - startTime < timeoutMs) {
    const result = await queryTask(taskId);
    lastResult = result;

    if (onPoll) onPoll(result.data || result);

    const s = String(result.data?.status || result.status || '').toLowerCase();
    if (s === 'success' || s === 'completed' || s === 'done') {
      return result.data || result;
    }
    if (s === 'failed' || s === 'error') {
      throw new Error(result.error || 'Melo generation failed');
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  throw new Error('Melo generation timed out');
}

export default {
  isConfigured,
  getStatus,
  getUser,
  generateSong,
  queryTask,
  pollUntilDone,
};