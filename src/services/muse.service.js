/**
 * MuseService - Frontend client for muse.top AI song generation.
 *
 * All requests go through our OWN backend proxy at /api/muse/* for two reasons:
 *   1. CORS — muse.top (project-api.atmob.com) does NOT send CORS headers, so
 *      browser fetch() is blocked. The backend proxy (Node, no CORS limit)
 *      forwards each request.
 *   2. Secret keep — the user JWT (MUSE_API_KEY) stays server-side. The
 *      browser only ever sees VITE_MUSE_API_KEY (a flag used to detect
 *      "is Muse configured"), never the actual token.
 *
 * API contract (handled by muse.controller.js on the backend):
 *   GET  /api/muse/status          — config check (token present? expired?)
 *   GET  /api/muse/user            — user profile + credit balance
 *   GET  /api/muse/styles          — full style catalog (grouped by genre)
 *   GET  /api/muse/fast-config     — Quick Mode config (costCredit, songModel)
 *   GET  /api/muse/master-config   — Master Mode config (vocals, languages)
 *   GET  /api/muse/templates       — song structure templates
 *   GET  /api/muse/explore         — public works gallery (real songs!)
 *   POST /api/muse/generate        — start generation (Quick or Master mode)
 *   GET  /api/muse/task/:id        — poll a generation task's status
 *
 * @module services/muse.service
 * @version 2.0.0
 * @author ZMusic Team
 */

import Logger from '../utils/logger.js';

const logger = new Logger('MuseService');

/** Base path of our backend proxy. Vite dev server proxies /api to port 5501. */
const API_BASE = '/api/muse';

/**
 * Check if Muse is configured on the backend.
 * Reads the VITE_MUSE_API_KEY flag (presence only — the real token is server-side).
 * @returns {boolean}
 */
export function isConfigured() {
  const flag = import.meta.env?.VITE_MUSE_API_KEY || '';
  // The flag is set to a non-empty value when the backend has a real JWT.
  // It's never used as a real token from the browser.
  return Boolean(flag) && flag.length > 20 && !flag.includes('your-muse');
}

/**
 * Thin fetch wrapper that throws on non-OK responses with the server's error message.
 * @param {string} path - Path under /api/muse (e.g. "user", "generate")
 * @param {object} [opts] - fetch options
 * @returns {Promise<object>} Parsed JSON response
 */
async function museFetch(path, opts = {}) {
  const url = `${API_BASE}/${path}`;
  logger.info(`Muse → ${opts.method || 'GET'} ${url}`);
  const response = await fetch(url, {
    method: opts.method || 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  let data;
  try { data = await response.json(); } catch { data = { raw: await response.text() }; }

  if (!response.ok || data?.success === false) {
    const msg = data?.error || `Muse API error: ${response.status}`;
    logger.error(`Muse ← ${response.status} ${msg}`);
    throw new Error(msg);
  }
  logger.info(`Muse ← ${response.status} OK`);
  return data;
}

/**
 * Get backend Muse configuration status (token present? expired? days left?).
 * @returns {Promise<object>} { configured, tokenExpiresAt, tokenDaysLeft, uid, ... }
 */
export async function getStatus() {
  return museFetch('status');
}

/**
 * Get the logged-in user's profile + credit balance.
 * @returns {Promise<object>} { ssid, memberInfo: { credit, isMember, ... }, ... }
 */
export async function getUser() {
  const r = await museFetch('user');
  return r.data;
}

/**
 * Get the full style catalog (grouped by genre/流派).
 * @returns {Promise<Array>} Array of { name, styles: [{ style, audioUrl }] }
 */
export async function getStyles() {
  const r = await museFetch('styles');
  return r.data?.list || [];
}

/**
 * Get Quick Mode configuration (costCredit, songModel, description limits).
 * @returns {Promise<object>} { costCredit, songModel, descriptionMin, descriptionMax, ... }
 */
export async function getFastConfig() {
  const r = await museFetch('fast-config');
  return r.data;
}

/**
 * Get Master Mode configuration (vocals, languages, audioWeight range).
 * @returns {Promise<object>} { vocals, languages, audioWeight, ... }
 */
export async function getMasterConfig() {
  const r = await museFetch('master-config');
  return r.data;
}

/**
 * Get song structure templates (原曲优化, 流行RAP, etc.).
 * @returns {Promise<Array>} Array of { id, title, imageUrl }
 */
export async function getTemplates() {
  const r = await museFetch('templates');
  return r.data?.list || [];
}

/**
 * Get the public works gallery (real songs with audio URLs - free to play!).
 * @param {number} [page=1]
 * @param {number} [pageSize=10]
 * @returns {Promise<{count:number, list:Array}>}
 */
export async function getExplore(page = 1, pageSize = 10) {
  const r = await museFetch(`explore?page=${page}&page_size=${pageSize}`);
  return r.data || { count: 0, list: [] };
}

/**
 * Generate a song using muse.top AI.
 *
 * Quick Mode  (mode="quick"):  muse.top's DeepSeek thinks lyrics from a prompt,
 *                              then generates a full song with vocals. Costs 14 credits.
 * Master Mode (mode="master"): User provides lyrics; muse.top generates the song
 *                              with the specified style, vocal, language.
 *
 * @param {object} params
 * @param {'quick'|'master'} [params.mode='quick'] - Generation mode
 * @param {string} [params.prompt] - Inspiration (Quick Mode, 5-200 chars)
 * @param {string} [params.lyrics] - Full lyrics (Master Mode)
 * @param {string} [params.style] - Style/genre name (e.g. "流行音乐", "古风")
 * @param {string} [params.title] - Song title
 * @param {string} [params.vocal] - Vocal type: ""=random, "m"=male, "f"=female
 * @param {number} [params.languageId] - Language ID (1001=中文, 1003=粤语, 1004=英语, ...)
 * @param {number} [params.audioWeight] - Reference weight 0.15-0.85
 * @param {boolean} [params.instrumental=false] - Instrumental only (no vocals)
 * @param {number} [params.structureId] - Structure template ID
 * @param {string} [params.songModel='general'] - Song model (from fast-config)
 * @returns {Promise<object>} Generation result with taskId
 */
export async function generateSong(params) {
  const r = await museFetch('generate', {
    method: 'POST',
    body: params,
  });
  return r.data;
}

/**
 * Poll a generation task's status.
 * @param {string} taskId - Task ID returned by generateSong()
 * @returns {Promise<object>} { status, audioUrl, imageUrl, title, ... }
 *
 * Status values (from muse.top):
 *   - "pending" / "processing" — still generating
 *   - "success" / "completed"  — done, audioUrl available
 *   - "failed"                 — generation failed
 */
export async function queryTask(taskId) {
  const r = await museFetch(`task/${encodeURIComponent(taskId)}`);
  return r.data;
}

/**
 * Poll a task until it completes (or fails / times out).
 * Convenience wrapper around queryTask() for the frontend.
 *
 * @param {string} taskId
 * @param {object} [opts]
 * @param {number} [opts.intervalMs=5000] - Poll interval
 * @param {number} [opts.timeoutMs=300000] - Max wait (5 min default)
 * @param {(status:object)=>void} [opts.onPoll] - Progress callback
 * @returns {Promise<object>} Final task data with audioUrl
 */
export async function pollUntilDone(taskId, opts = {}) {
  const interval = opts.intervalMs || 5000;
  const timeout = opts.timeoutMs || 300000;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const task = await queryTask(taskId);
    if (opts.onPoll) opts.onPoll(task);

    const status = String(task?.status || task?.state || '').toLowerCase();
    if (status.includes('success') || status.includes('complete') || task?.audioUrl) {
      return task;
    }
    if (status.includes('fail') || status.includes('error')) {
      throw new Error(`Generation failed: ${task?.msg || task?.failReason || status}`);
    }
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`Generation timed out after ${timeout / 1000}s`);
}

export default {
  isConfigured,
  getStatus,
  getUser,
  getStyles,
  getFastConfig,
  getMasterConfig,
  getTemplates,
  getExplore,
  generateSong,
  queryTask,
  pollUntilDone,
};
