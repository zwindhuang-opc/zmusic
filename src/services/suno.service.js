/**
 * SunoService - Real Suno.cn API Integration
 * 
 * Routes API calls through the backend server to avoid CORS issues.
 * The backend server (port 5501) has the SUNO_CN_API_KEY and forwards requests.
 * 
 * API Documentation: https://mcp.suno.cn
 * 
 * @module services/suno.service
 * @version 2.0.0
 */

const API_BASE = '/api/suno';

/**
 * Check if Suno is available (configured on the backend)
 */
export function isConfigured() {
  const key = import.meta.env?.VITE_SUNO_CN_API_KEY || '';
  return key.startsWith('sk-') && key.length > 20;
}

/**
 * Get user account information
 */
export async function getUserInfo() {
  return fetch(`${API_BASE}/user`).then(r => {
    if (!r.ok) throw new Error(`Suno API error: ${r.status}`);
    return r.json();
  });
}

/**
 * Generate music via Suno.cn
 * @param {string} prompt - Music description or lyrics
 * @param {string} [style=''] - Style tags (e.g., 'pop,electronic')
 * @param {number} [duration=60] - Target duration in seconds
 * @param {boolean} [customMode=false] - Use custom lyrics mode
 * @param {boolean} [instrumental=false] - Generate instrumental only
 * @returns {Promise<Object>} Generation result
 */
export async function generateMusic(prompt, style = '', duration = 60, customMode = false, instrumental = false) {
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
 * Query task status
 * @param {string} serialNo - Task serial number
 * @param {boolean} [wait=false] - Wait for completion (adds wait=45)
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
 * Generate lyrics via Suno AI
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
 * Get music list
 */
export async function getMusicList(page = 1, pageSize = 10) {
  const response = await fetch(`${API_BASE}/music?page=${page}&page_size=${pageSize}`);
  if (!response.ok) throw new Error(`List error: ${response.status}`);
  return response.json();
}

export default {
  isConfigured,
  getUserInfo,
  generateMusic,
  queryTaskStatus,
  generateLyrics,
  getMusicList
};
