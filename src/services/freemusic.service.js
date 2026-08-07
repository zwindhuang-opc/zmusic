/**
 * FreeMusicService - 100% FREE music generation client
 * 
 * Calls backend /api/freemusic/* which uses:
 * - Edge TTS (free, no key) for vocals
 * - MusicGen / Bark via HuggingFace (free token) for music/singing
 * - ffmpeg to mix vocals + instrumental
 * 
 * No paid APIs. No Suno.cn credits needed.
 */

const API_BASE = '/api/freemusic';

/**
 * Check which free engines are available
 */
export async function getStatus() {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error(`Status error: ${res.status}`);
  return res.json();
}

/**
 * List available free voices (Edge TTS)
 */
export async function getVoices() {
  const res = await fetch(`${API_BASE}/voices`);
  if (!res.ok) throw new Error(`Voices error: ${res.status}`);
  return res.json();
}

/**
 * Generate a song 100% FREE
 * @param {Object} params
 * @param {string} params.prompt - Music description (for instrumental)
 * @param {string} params.lyrics - Lyrics text (for vocals)
 * @param {string} [params.voice='zh-female-soft'] - Voice preset
 * @param {string} [params.style='pop'] - Music style
 * @param {number} [params.duration=30] - Duration in seconds
 * @param {boolean} [params.instrumental=false] - Instrumental only (no vocals)
 * @param {string} [params.engine='edge-tts'] - Engine: 'edge-tts' | 'bark'
 * @returns {Promise<Object>} { success, audioUrl, engine, free }
 */
export async function generateSong({ prompt, lyrics, voice, style, duration, instrumental, engine }) {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt || '',
      lyrics: lyrics || '',
      voice: voice || 'zh-female-soft',
      style: style || 'pop',
      duration: duration || 30,
      instrumental: instrumental || false,
      engine: engine || 'edge-tts',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Generate error: ${res.status}`);
  }

  return res.json();
}

export default {
  getStatus,
  getVoices,
  generateSong,
};
