/**
 * FreeMusicController - 100% FREE music generation
 * 
 * Combines:
 * 1. Edge TTS (Microsoft's free TTS, NO API KEY) → vocals from lyrics
 * 2. Tone.js (browser) or HuggingFace MusicGen (free) → instrumental backing
 * 3. ffmpeg-static → mix vocals + instrumental into final song
 * 
 * No paid APIs. No tokens required. Completely free.
 * 
 * Reuses edge-tts pattern from zinteligencevideoagent project.
 */

import { spawn } from 'child_process';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ffmpegPath from 'ffmpeg-static';
import { config } from '../config/index.js';
import Logger from '../utils/logger.js';

const logger = new Logger('FreeMusicController');
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMP_DIR = join(__dirname, '..', '..', 'temp', 'freemusic');
const OUTPUT_DIR = join(__dirname, '..', '..', 'public', 'generated');

// Voice presets for different moods/styles (all free Edge TTS voices)
const VOICE_PRESETS = {
  // Chinese voices
  'zh-female-soft': 'zh-CN-XiaoxiaoNeural',
  'zh-female-warm': 'zh-CN-XiayiNeural',
  'zh-male-calm': 'zh-CN-YunxiNeural',
  'zh-male-strong': 'zh-CN-YunyangNeural',
  // English voices
  'en-female-soft': 'en-US-JennyNeural',
  'en-female-bright': 'en-US-AriaNeural',
  'en-male-calm': 'en-US-GuyNeural',
  'en-male-deep': 'en-US-DavisNeural',
  // Japanese
  'ja-female': 'ja-JP-NanamiNeural',
  'ja-male': 'ja-JP-KeitaNeural',
};

/**
 * Generate vocals using Edge TTS via Python subprocess
 * Completely free, no API key needed.
 * Uses a helper script to avoid Windows CLI encoding issues with Chinese text.
 */
async function generateVocalsWithEdgeTTS(text, voice, rate = '+0%', pitch = '+0Hz') {
  const timestamp = Date.now();
  const outputFile = join(TEMP_DIR, `vocals_${timestamp}.mp3`);
  const textFile = join(TEMP_DIR, `text_${timestamp}.txt`);
  const helperScript = join(__dirname, '..', '..', 'scripts', 'edge_tts_helper.py');
  const selectedVoice = VOICE_PRESETS[voice] || voice || 'zh-CN-XiaoxiaoNeural';

  // Write text to file to avoid Windows CLI encoding issues
  await writeFile(textFile, text, 'utf-8');

  return new Promise((resolve, reject) => {
    const args = [helperScript, textFile, selectedVoice, outputFile];

    logger.info(`Edge TTS: voice=${selectedVoice}, text="${text.slice(0, 50)}..."`);
    const proc = spawn('python', args);

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', async (code) => {
      if (code !== 0) {
        logger.error(`Edge TTS failed (code ${code}): ${stderr}`);
        reject(new Error(`Edge TTS failed: ${stderr.slice(0, 300)}`));
        return;
      }
      try {
        if (!existsSync(outputFile)) {
          reject(new Error('Edge TTS produced no output file'));
          return;
        }
        const audioBuffer = await readFile(outputFile);
        if (audioBuffer.length === 0) {
          reject(new Error('Edge TTS produced empty audio'));
          return;
        }
        logger.info(`Edge TTS success: ${audioBuffer.length} bytes`);
        resolve({ buffer: audioBuffer, path: outputFile });
      } catch (err) {
        reject(new Error(`Failed to read TTS output: ${err.message}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn edge_tts: ${err.message}`));
    });
  });
}

/**
 * Generate instrumental music via HuggingFace Inference API (MusicGen)
 * Free tier - requires HF_TOKEN (free to obtain at huggingface.co)
 */
async function generateInstrumentalWithMusicGen(prompt, duration = 30) {
  const hfToken = config.hfToken || process.env.HF_TOKEN || process.env.VITE_HF_TOKEN;
  if (!hfToken) {
    throw new Error('HF_TOKEN not configured. Get a free token at huggingface.co/settings/tokens');
  }

  const model = 'facebook/musicgen-small';
  const url = `https://api-inference.huggingface.co/models/${model}`;

  logger.info(`MusicGen: prompt="${prompt}", duration=${duration}s`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hfToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        duration: Math.min(duration, 30), // MusicGen small max ~30s
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MusicGen API error ${response.status}: ${text}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const outputFile = join(TEMP_DIR, `instrumental_${Date.now()}.wav`);
  await writeFile(outputFile, buffer);
  logger.info(`MusicGen success: ${buffer.length} bytes`);
  return { buffer, path: outputFile };
}

/**
 * Generate singing voice using Bark (Suno's open-source model!)
 * Free via HuggingFace Inference API.
 * Bark can interpret ♪ notes ♪ for singing.
 */
async function generateSingingWithBark(lyrics) {
  const hfToken = config.hfToken || process.env.HF_TOKEN || process.env.VITE_HF_TOKEN;
  if (!hfToken) {
    throw new Error('HF_TOKEN not configured. Get a free token at huggingface.co/settings/tokens');
  }

  const model = 'suno/bark';
  const url = `https://api-inference.huggingface.co/models/${model}`;

  // Bark sings when text is wrapped in ♪
  const singingText = lyrics.includes('♪') ? lyrics : `♪ ${lyrics} ♪`;

  logger.info(`Bark: generating singing for "${singingText.slice(0, 50)}..."`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hfToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: singingText }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bark API error ${response.status}: ${text}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const outputFile = join(TEMP_DIR, `bark_${Date.now()}.wav`);
  await writeFile(outputFile, buffer);
  logger.info(`Bark success: ${buffer.length} bytes`);
  return { buffer, path: outputFile };
}

/**
 * Mix vocals + instrumental using ffmpeg
 * Adjusts vocal volume and applies reverb for a polished sound.
 */
async function mixAudio(vocalPath, instrumentalPath, outputPath, options = {}) {
  const vocalVolume = options.vocalVolume || 1.5;
  const instrumentalVolume = options.instrumentalVolume || 0.6;

  return new Promise((resolve, reject) => {
    const args = [
      '-y',
      '-i', instrumentalPath,
      '-i', vocalPath,
      '-filter_complex',
      `[0:a]volume=${instrumentalVolume}[inst];[1:a]volume=${vocalVolume},aecho=0.8:0.9:1000:0.3[voc];[inst][voc]amix=inputs=2:duration=longest[a]`,
      '-map', '[a]',
      '-b:a', '192k',
      outputPath,
    ];

    logger.info(`ffmpeg mixing: ${args.join(' ')}`);
    const proc = spawn(ffmpegPath, args);

    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        logger.error(`ffmpeg failed (code ${code}): ${stderr.slice(-500)}`);
        reject(new Error(`ffmpeg mixing failed`));
        return;
      }
      logger.info(`Mix complete: ${outputPath}`);
      resolve(outputPath);
    });

    proc.on('error', (err) => {
      reject(new Error(`ffmpeg spawn error: ${err.message}`));
    });
  });
}

/**
 * Convert an audio file to a web-playable format and return base64 data URL
 */
async function audioToDataUrl(filePath) {
  const buffer = await readFile(filePath);
  const base64 = buffer.toString('base64');
  const ext = filePath.split('.').pop().toLowerCase();
  const mime = ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : 'audio/mpeg';
  return `data:${mime};base64,${base64}`;
}

export class FreeMusicController {
  /**
   * POST /api/freemusic/generate
   * Generate a song 100% free using Edge TTS vocals + instrumental
   * 
   * Body: { prompt, lyrics, voice, style, duration, instrumental }
   */
  async generate(req, res) {
    const { prompt = '', lyrics = '', voice = 'zh-female-soft', style = 'pop', duration = 30, instrumental = false, engine = 'edge-tts' } = req.body || {};

    try {
      // Ensure temp/output dirs exist
      await mkdir(TEMP_DIR, { recursive: true });
      await mkdir(OUTPUT_DIR, { recursive: true });

      logger.info(`FreeMusic generate: engine=${engine}, style=${style}, duration=${duration}, instrumental=${instrumental}`);

      let resultAudioPath = null;
      let resultType = 'edge-tts';

      if (engine === 'bark' && lyrics) {
        // === BARK ENGINE: Suno's open-source model, generates singing directly ===
        try {
          const barkResult = await generateSingingWithBark(lyrics);
          resultAudioPath = barkResult.path;
          resultType = 'bark-singing';
        } catch (err) {
          logger.warn(`Bark failed, falling back to edge-tts: ${err.message}`);
          // Fall through to edge-tts
        }
      }

      if (!resultAudioPath && !instrumental && lyrics) {
        // === EDGE TTS ENGINE: Free vocals from lyrics ===
        const vocalResult = await generateVocalsWithEdgeTTS(lyrics, voice);
        resultAudioPath = vocalResult.path;
        resultType = 'edge-tts-vocals';
      }

      if (instrumental) {
        // Try MusicGen for instrumental
        try {
          const instResult = await generateInstrumentalWithMusicGen(prompt || `${style} instrumental music`, duration);
          resultAudioPath = instResult.path;
          resultType = 'musicgen-instrumental';
        } catch (err) {
          logger.warn(`MusicGen failed, returning vocal-only: ${err.message}`);
          // If no instrumental and no vocals, error
          if (!resultAudioPath) {
            return res.status(503).json({
              success: false,
              error: 'No free engine available. Set HF_TOKEN for MusicGen, or provide lyrics for Edge TTS.',
              hint: 'Get a free HF token at https://huggingface.co/settings/tokens'
            });
          }
        }
      }

      // If we have both vocals and want instrumental mixing, try it
      if (resultType === 'edge-tts-vocals' && !instrumental) {
        // Try to get MusicGen instrumental and mix
        try {
          const instResult = await generateInstrumentalWithMusicGen(prompt || `${style} background music`, Math.min(duration, 30));
          const mixedPath = join(OUTPUT_DIR, `song_${Date.now()}.mp3`);
          await mixAudio(resultAudioPath, instResult.path, mixedPath, {
            vocalVolume: 1.5,
            instrumentalVolume: 0.5,
          });
          resultAudioPath = mixedPath;
          resultType = 'edge-tts-musicgen-mixed';
        } catch (err) {
          logger.warn(`MusicGen instrumental mixing failed, using vocals only: ${err.message}`);
          // Keep vocal-only result
        }
      }

      if (!resultAudioPath) {
        return res.status(400).json({
          success: false,
          error: 'Could not generate audio. Provide lyrics for vocals, or set HF_TOKEN for instrumental.'
        });
      }

      // Convert to data URL for browser playback
      const dataUrl = await audioToDataUrl(resultAudioPath);

      return res.json({
        success: true,
        engine: resultType,
        audioUrl: dataUrl,
        prompt,
        lyrics: lyrics.slice(0, 200),
        voice,
        style,
        duration,
        instrumental,
        free: true,
        message: 'Generated 100% free using Edge TTS + MusicGen'
      });

    } catch (error) {
      logger.error(`FreeMusic generate error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: error.message,
        hint: 'Edge TTS requires Python with edge-tts package. MusicGen requires HF_TOKEN.'
      });
    }
  }

  /**
   * GET /api/freemusic/voices
   * List available free Edge TTS voices
   */
  async listVoices(req, res) {
    return res.json({
      success: true,
      voices: VOICE_PRESETS,
      engine: 'edge-tts',
      free: true,
      note: 'All voices are 100% free via Microsoft Edge TTS'
    });
  }

  /**
   * GET /api/freemusic/status
   * Check which free engines are available
   */
  async status(req, res) {
    const hfToken = config.hfToken || process.env.HF_TOKEN || process.env.VITE_HF_TOKEN;

    return res.json({
      success: true,
      engines: {
        'edge-tts': {
          available: true,
          free: true,
          needsKey: false,
          desc: 'Free vocals via Microsoft Edge TTS'
        },
        'musicgen': {
          available: !!hfToken,
          free: true,
          needsKey: true,
          keyUrl: 'https://huggingface.co/settings/tokens',
          desc: 'Free instrumental music via Meta MusicGen'
        },
        'bark': {
          available: !!hfToken,
          free: true,
          needsKey: true,
          keyUrl: 'https://huggingface.co/settings/tokens',
          desc: 'Free singing via Suno Bark (open-source)'
        },
        'tonejs': {
          available: true,
          free: true,
          needsKey: false,
          desc: 'Instant procedural music (browser-side)'
        }
      }
    });
  }
}

export default new FreeMusicController();
