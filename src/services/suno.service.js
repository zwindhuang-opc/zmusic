/**
 * SunoService - Real Suno.cn API Integration
 *
 * Routes API calls through the backend server (port 5501) to avoid CORS issues.
 * The backend holds the SUNO_CN_API_KEY and forwards requests to the Suno.cn API.
 * The frontend only sees the VITE_SUNO_ENABLED boolean flag — never the API key.
 *
 * API Documentation: https://mcp.suno.cn
 *
 * @module services/suno.service
 * @version 2.0.0
 */

import { config } from '../config/index.js';

const API_BASE = '/api/suno';

/**
 * Check if Suno is available (configured on the backend).
 * Works in both Node.js (backend) and browser (frontend) environments.
 * @returns {boolean}
 */
let _configuredCache = null;
let _configuredPromise = null;

export function isConfigured() {
  if (_configuredCache !== null) return _configuredCache;
  if (config.sunoApiKey) return true;
  return !!(import.meta.env?.VITE_SUNO_ENABLED === 'true');
}

export async function checkConfigured() {
  if (_configuredPromise) return _configuredPromise;
  _configuredPromise = (async () => {
    try {
      const info = await getUserInfo();
      _configuredCache = !!(info?.success !== false && info?.data);
    } catch {
      _configuredCache = import.meta.env?.VITE_SUNO_ENABLED === 'true';
    }
    _configuredPromise = null;
    return _configuredCache;
  })();
  return _configuredPromise;
}

/**
 * Get the authenticated Suno user's account information, including
 * credit balance, subscription status, and user ID.
 *
 * @returns {Promise<Object>} User info object with credits, membership, etc.
 * @throws {Error} If the backend request fails (e.g., 401 Unauthorized)
 */
export async function getUserInfo() {
  return fetch(`${API_BASE}/user`).then(r => {
    if (!r.ok) throw new Error(`Suno API error: ${r.status}`);
    return r.json();
  });
}

/**
 * Generate music via Suno.cn
 *
 * Accepts EITHER positional args (legacy, used by SunoPage/MusicPage) OR a
 * single params object (MV-facing contract used by MVPage). When an object is
 * passed the full response {success, serialNos} is still returned so callers
 * can extract serialNos[0] as the task id.
 *
 * @param {string|object} promptOrParams - Prompt string, OR params object
 *   {prompt, style, duration, customMode, instrumental, title}
 * @param {string} [style=''] - Style tags (e.g., 'pop,electronic')
 * @param {number} [duration=60] - Target duration in seconds
 * @param {boolean} [customMode=false] - Use custom lyrics mode
 * @param {boolean} [instrumental=false] - Generate instrumental only
 * @returns {Promise<Object>} Generation result {success, serialNos, ...}
 */
export async function generateMusic(promptOrParams, style = '', duration = 60, customMode = false, instrumental = false) {
  let prompt;
  if (promptOrParams && typeof promptOrParams === 'object' && !Array.isArray(promptOrParams)) {
    const p = promptOrParams;
    prompt = p.prompt || '';
    style = p.style || '';
    duration = p.duration || 60;
    customMode = p.customMode || false;
    instrumental = p.instrumental || false;
  } else {
    prompt = promptOrParams;
  }

  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, style, duration, customMode, instrumental })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Suno API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Poll a Suno task until completion, reporting progress to MVPage.
 * MV-facing wrapper: normalizes the Suno response into {audio_url, lyrics,
 * title} so MVPage can treat Suno identically to Muse/Melo.
 *
 * @param {string} serialNo - Task serial number returned by generateMusic()
 * @param {(progress:number, stage:string)=>void} [onProgress] - Progress callback
 * @returns {Promise<{audio_url:string, lyrics:string, title:string}>}
 */
export async function waitForResult(serialNo, onProgress) {
  const interval = 3000;
  const timeout = 180000;
  const start = Date.now();
  let attempts = 0;

  while (Date.now() - start < timeout) {
    const task = await queryTaskStatus(serialNo, false);
    attempts += 1;
    const status = String(task?.status || '').toLowerCase();
    const progress = task?.progress ?? Math.min(95, attempts * 8);
    if (onProgress) onProgress(progress, status || 'processing');

    if (status === 'success') {
      return {
        audio_url: task.audioUrl || task.url || null,
        lyrics: task.lyrics || '',
        title: task.title || '',
      };
    }
    if (status === 'failed') {
      throw new Error(task?.error || 'Suno generation failed');
    }
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error('Suno generation timed out');
}

/**
 * Query the status of a previously submitted generation task.
 *
 * @param {string} serialNo - The unique task serial number returned by generateMusic()
 * @param {boolean} [wait=false] - If true, waits up to 45 seconds for completion
 * @returns {Promise<Object>} Task status with results (audio URLs, metadata, etc.)
 * @throws {Error} If the task is not found or the request fails
 */
export async function queryTaskStatus(serialNo, wait = false) {
  const waitParam = wait ? '?wait=45' : '';
  const response = await fetch(`${API_BASE}/task/${serialNo}${waitParam}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Query error: ${response.status}`);
  }

  return response.json();
}

/**
 * Generate song lyrics via Suno AI based on an inspiration prompt and optional style.
 *
 * @param {string} inspiration - Creative prompt or theme description for the lyrics
 * @param {string} [style=''] - Optional style tags to guide lyrics generation
 * @returns {Promise<Object>} Generated lyrics with metadata
 * @throws {Error} If the lyrics generation request fails
 */
export async function generateLyrics(inspiration, style = '') {
  const response = await fetch(`${API_BASE}/gen-lyrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspiration, style })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Lyrics error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch the paginated list of previously generated music tracks.
 *
 * @param {number} [page=1] - Page number (1-based)
 * @param {number} [pageSize=10] - Number of items per page
 * @returns {Promise<Object>} Paginated music list with track metadata and audio URLs
 * @throws {Error} If the list request fails
 */
export async function getMusicList(page = 1, pageSize = 10) {
  const response = await fetch(`${API_BASE}/music?page=${page}&page_size=${pageSize}`);
  if (!response.ok) throw new Error(`List error: ${response.status}`);
  return response.json();
}

export default {
  isConfigured,
  checkConfigured,
  getUserInfo,
  generateMusic,
  waitForResult,
  queryTaskStatus,
  generateLyrics,
  getMusicList
};
