import { config } from '../config/index.js';

const API_BASE = '/api/melo';

let _configuredCache = null;
let _configuredPromise = null;

/**
 * Check if Melo is available.
 * Melo is considered configured if ANY of:
 *   - MELO_API_KEY is set (real API)
 *   - VITE_MELO_ENABLED=true (frontend flag)
 *   - MELO_MOCK is not disabled (mock mode is on by default)
 * @returns {boolean}
 */
export function isConfigured() {
  if (_configuredCache !== null) return _configuredCache;
  if (config.meloApiKey) return true;
  if (import.meta.env?.VITE_MELO_ENABLED === 'true') return true;
  // Mock mode is on by default (config.meloMock !== false)
  // In Node.js, import.meta.env may be undefined; check config.meloMock directly
  if (config.meloMock !== false) return true;
  return false;
}

export async function checkConfigured() {
  if (_configuredPromise) return _configuredPromise;
  _configuredPromise = (async () => {
    try {
      const status = await getStatus();
      _configuredCache = !!(status?.data?.configured ?? status?.configured ?? status?.success);
    } catch {
      _configuredCache = import.meta.env?.VITE_MELO_ENABLED === 'true';
    }
    _configuredPromise = null;
    return _configuredCache;
  })();
  return _configuredPromise;
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

/**
 * Visual bridge: type the user-selected lyrics/lyrics-command into the
 * h.51melo.com chat input field so the user can SEE the exact inputs on the
 * h.51melo.com website — even when generation cannot complete due to
 * insufficient credits.
 *
 * This does NOT generate a song; it only fills the chat input for visual
 * verification. Call this BEFORE generateSong().
 *
 * @param {object} params - { lyrics, title, styleTags, bpm, key, timeSignature, layers }
 * @returns {Promise<object>} { filled, matchedSelector, value, pageFound, composedPrompt }
 */
export async function fillInput(params) {
  const res = await fetch(`${API_BASE}/fill-input`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Melo fill-input error: ${res.status}`);
  }
  return data.data;
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

    const data = result.data || result;
    if (onPoll) onPoll(data);

    const s = String(data?.status || result.status || '').toLowerCase();
    // Melo status flow: queue → pending → processing → streaming → completed | failed
    if (s === 'success' || s === 'completed' || s === 'done' || s === 'streaming') {
      // On streaming/completed, songs[] is populated — return the normalized payload.
      return data;
    }
    if (s === 'failed' || s === 'error') {
      throw new Error(data?.error || data?.failReason || result.error || 'Melo generation failed');
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  throw new Error('Melo generation timed out');
}

// ===========================================================================
// MV-facing convenience interface
// MVPage.jsx calls a uniform contract across Muse/Suno/Melo:
//   generateMusic(p)  -> taskId (string)
//   waitForResult(id, onProgress) -> { audio_url, lyrics, title }
// ===========================================================================

/**
 * Start a Melo generation and return only the task id (MV-facing wrapper).
 * @param {object} params - Generation params
 * @returns {Promise<string>} taskId
 */
export async function generateMusic(params) {
  const r = await generateSong(params);
  return r?.data?.taskId || r?.taskId || r?.id || null;
}

/**
 * Poll a Melo task until completion, reporting progress to MVPage.
 * Normalizes the Melo response (audioUrl camelCase) into the MV-facing
 * shape (audio_url snake_case) used by all engines.
 *
 * @param {string} taskId - Task id returned by generateMusic()
 * @param {(progress:number, stage:string)=>void} [onProgress] - Progress callback
 * @returns {Promise<{audio_url:string, image_url:string, lyrics:string,
 *            title:string, duration:number, songs:Array}>}
 */
export async function waitForResult(taskId, onProgress) {
  const result = await pollUntilDone(taskId, {
    intervalMs: 3000,
    timeoutMs: 180000,
    onPoll: (data) => {
      const status = String(data?.status || '').toLowerCase();
      const progress = data?.progress ?? 30;
      if (onProgress) onProgress(progress, status || 'processing');
    },
  });
  return {
    audio_url: result.audioUrl || result.audio_url || null,
    image_url: result.imageUrl || result.image_url || null,
    lyrics: result.lyrics || '',
    title: result.title || '',
    duration: result.duration || 0,
    songs: result.songs || [],
  };
}

export default {
  isConfigured,
  checkConfigured,
  getStatus,
  getUser,
  generateSong,
  fillInput,
  generateMusic,
  waitForResult,
  queryTask,
  pollUntilDone,
};