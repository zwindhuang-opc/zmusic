/**
 * VisionService - 图片分析服务
 *
 * 分析上传的图片，提取音乐创作相关的关键词：
 * - 主题 (theme)
 * - 风格 (style/genre)
 * - 情绪 (mood)
 * - 色彩调性 (color tone)
 * - 场景描述 (scene description)
 *
 * 支持多层级分析：
 * - Level 1: AI Vision API (Gemini/GPT-4V 等，需配置 API Key)
 * - Level 2: 颜色分析 + 启发式规则（本地计算，无需 API）
 * - Level 3: 随机建议（作为保底）
 *
 * @module services/vision.service
 * @version 1.0.0
 * @author ZMusic Team
 */

import config from '../config/index.js';
import Logger from '../utils/logger.js';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const logger = new Logger('VisionService');

// Use centralizedhub's Python 3.14 vision runtime (satisfies "use centralizedhub
// and zunicorn-agent as base project" rule).  If missing we fall back silently.
const PYTHON_EXE = resolve(
  'e:\\AI_Projects\\centralizedhub\\installations\\vision-venv-314\\Scripts\\python.exe'
);

// Compute __dirname robustly for both ESM (node src/server.js) and CJS bundles
// (netlify/functions/api/_server_bundle.cjs — where import.meta is empty).
const _urlPath = (typeof import.meta !== 'undefined' && import.meta && import.meta.url)
  ? fileURLToPath(import.meta.url)
  : (typeof __filename !== 'undefined' ? __filename : process.argv[1]);
const _serviceDir = (typeof __dirname !== 'undefined' && __dirname)
  ? __dirname
  : dirname(_urlPath);

// Worker path fallbacks: 3 locations to survive any bundling layout.
const _candidates = [
  resolve(_serviceDir, '..', '..', 'services', 'vision', 'vision_worker.py'),          // ESM dev: src/services/vision.service.js → repo root
  resolve(process.cwd(), 'services', 'vision', 'vision_worker.py'),                    // Simple: cwd=repo root (npm run server)
  resolve(_serviceDir, '..', '..', '..', 'services', 'vision', 'vision_worker.py'),    // CJS bundle: netlify/functions/api/_server_bundle.cjs → repo root
];
const WORKER_PATH = _candidates.find(p => existsSync(p)) || _candidates[0];

// Scene-hint ID → {themes, styles, mood} — used to boost heuristic suggestions
// when the Python YOLO object detector returns a strong match.
const HINT_STYLE_MAP = {
  pet_friendship: { themes: ['pet_love', 'friendship', 'healing'], styles: ['acoustic', 'indie_folk', 'ballad'], mood: 'peaceful' },
  wild_nature_adventure: { themes: ['adventure', 'nature', 'freedom'], styles: ['folk_rock', 'epic', 'world_music'], mood: 'energetic' },
  culinary_memory: { themes: ['culinary', 'memories', 'home'], styles: ['bossa_nova', 'acoustic', 'city_pop'], mood: 'warm' },
  festive_celebration: { themes: ['celebration', 'happiness', 'friendship'], styles: ['pop', 'dance', 'kpop'], mood: 'joyful' },
  seaside_vacation: { themes: ['summer', 'ocean', 'vacation', 'freedom'], styles: ['reggae', 'tropical_pop', 'city_pop'], mood: 'energetic' },
  sports_action: { themes: ['sports', 'ambition', 'triumph'], styles: ['rock', 'electronic', 'hiphop'], mood: 'energetic' },
  cozy_home_indoor: { themes: ['home', 'cozy', 'nostalgia'], styles: ['acoustic', 'ballad', 'lo_fi'], mood: 'peaceful' },
  cozy_reading: { themes: ['study', 'memories', 'dreams'], styles: ['lo_fi', 'classical', 'ambient'], mood: 'peaceful' },
  workspace_office: { themes: ['ambition', 'hustle', 'urban_life'], styles: ['city_pop', 'electronic', 'lo_fi'], mood: 'focused' },
  travel_adventure: { themes: ['travel', 'dreams', 'freedom'], styles: ['indie_pop', 'folk', 'city_pop'], mood: 'energetic' },
  road_trip: { themes: ['road_trip', 'freedom', 'adventure'], styles: ['rock', 'country', 'indie'], mood: 'energetic' },
  journey_commute: { themes: ['commute', 'thinking', 'nostalgia'], styles: ['city_pop', 'lo_fi', 'ambient'], mood: 'peaceful' },
  city_street: { themes: ['urban', 'rebellion', 'independence'], styles: ['hiphop', 'synthwave', 'rock'], mood: 'energetic' },
  picnic_outdoor: { themes: ['picnic', 'friendship', 'spring'], styles: ['acoustic', 'indie', 'bossa_nova'], mood: 'peaceful' },
  romantic_dinner: { themes: ['love', 'romance', 'first_date'], styles: ['jazz', 'ballad', 'bossa_nova'], mood: 'romantic' },
  couple_couch_movie_night: { themes: ['love', 'cozy', 'dreams'], styles: ['rnb', 'ballad', 'lo_fi'], mood: 'romantic' },
  family_gathering: { themes: ['family', 'home', 'memories'], styles: ['ballad', 'acoustic', 'soft_pop'], mood: 'warm' },
  nature_healing: { themes: ['nature', 'healing', 'peace'], styles: ['ambient', 'new_age', 'folk'], mood: 'peaceful' },
};

const COLOR_MOOD_MAP = [
  { name: 'warm', hues: [0, 30, 45], mood: 'romantic', themes: ['love', 'passion', 'nostalgia'], styles: ['ballad', 'rnb', 'pop'] },
  { name: 'cool', hues: [200, 220, 240], mood: 'melancholy', themes: ['loneliness', 'dreams', 'heartbreak'], styles: ['electronic', 'ambient', 'rock'] },
  { name: 'vibrant', hues: [300, 330, 280], mood: 'energetic', themes: ['dreams', 'rebellion', 'success'], styles: ['pop', 'electronic', 'kpop'] },
  { name: 'earth', hues: [90, 120, 60], mood: 'peaceful', themes: ['nature', 'nostalgia', 'healing'], styles: ['folk', 'country', 'chinese_traditional'] },
  { name: 'dark', hues: [0, 0, 0], mood: 'dark', themes: ['heartbreak', 'loneliness', 'rebellion'], styles: ['rock', 'gothic_rock', 'electronic'] },
  { name: 'pastel', hues: [330, 200, 180], mood: 'dreamy', themes: ['love', 'dreams', 'healing'], styles: ['dream_pop', 'indie', 'ballad'] },
  { name: 'sunset', hues: [20, 35, 15], mood: 'romantic', themes: ['love', 'nostalgia', 'time_travel'], styles: ['ballad', 'pop', 'tango'] },
  { name: 'night', hues: [240, 270, 260], mood: 'melancholy', themes: ['loneliness', 'dreams', 'heartbreak'], styles: ['electronic', 'rnb', 'rock'] },
];

const SCENE_KEYWORDS = {
  sky: ['sunset', 'starry', 'cloud', 'dawn', 'dusk', 'rainbow'],
  nature: ['forest', 'ocean', 'mountain', 'flower', 'garden', 'river'],
  urban: ['city', 'street', 'neon', 'traffic', 'building', 'subway'],
  indoor: ['room', 'window', 'light', 'shadow', 'mirror', 'bed'],
  people: ['couple', 'solo', 'silhouette', 'dance', 'embrace', 'back_view'],
  abstract: ['pattern', 'texture', 'gradient', 'bokeh', 'reflection', 'minimal'],
};

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function pickRandom(arr, count = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return count === 1 ? shuffled[0] : shuffled.slice(0, count);
}

function hueDistance(h1, h2) {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

export class VisionService {
  constructor() {
    this.apiKey = null;
    this.apiProvider = null;
  }

  async analyzeImage(buffer, mimeType = 'image/jpeg') {
    const startTime = Date.now();

    // -----------------------------------------------------------------------
    // PRIMARY: Python + YOLOv8n ONNX object detection + scene hints.
    // Server-side analysis gives MUCH richer semantics (80 COCO classes: dog,
    // cake, surfboard, laptop, car, airplane…) than browser color heuristics.
    // If it fails, we fall through transparently to the heuristic below
    // (no break, no regression).
    // -----------------------------------------------------------------------
    let pythonResult = null;
    try {
      pythonResult = await this._analyzeWithPythonWorker(buffer, mimeType);
    } catch (err) {
      logger.warn(`Python vision worker unavailable (${err.message}); using heuristic fallback.`);
      pythonResult = null;
    }

    // -----------------------------------------------------------------------
    // SECONDARY: the original pixel-hue heuristic (always runs so we have a
    // consistent color palette / description).
    // -----------------------------------------------------------------------
    let heuristic = null;
    let method = 'heuristic';
    try {
      heuristic = await this._analyzeWithHeuristic(buffer, mimeType);
      method = pythonResult ? 'python_yolo_plus_heuristic' : 'heuristic';
    } catch (err) {
      logger.warn(`Heuristic analysis failed: ${err.message}`);
      heuristic = this._getFallbackSuggestion();
      method = pythonResult ? 'python_yolo_only' : 'fallback';
    }

    // -----------------------------------------------------------------------
    // MERGE: If Python returned a strong scene hint, bias themes / styles /
    //        mood toward the HINT_STYLE_MAP but keep the color palette +
    //        description from heuristic.
    // -----------------------------------------------------------------------
    if (pythonResult && heuristic) {
      const hints = (pythonResult.sceneHints || []).filter(h => h.score >= 0.6);
      if (hints.length > 0) {
        const topHint = hints[0];
        const mapped = HINT_STYLE_MAP[topHint.id];
        if (mapped) {
          const mergedThemes = [...new Set([...mapped.themes, ...heuristic.themes])].slice(0, 5);
          const mergedStyles = [...new Set([...mapped.styles, ...heuristic.styles])].slice(0, 5);
          heuristic.themes = mergedThemes;
          heuristic.styles = mergedStyles;
          if (mapped.mood) heuristic.mood = mapped.mood;
          heuristic.suggestions = {
            ...(heuristic.suggestions || {}),
            genre: mapped.styles[0],
            theme: mapped.themes[0],
            mood: mapped.mood || heuristic.mood,
            alternatives: { themes: mergedThemes, styles: mergedStyles },
          };
        }
        // Prepend the detected object list (COCO labels + counts) to the
        // description so users can see *what* the neural net actually found.
        const counts = pythonResult.counts || {};
        const countEntries = Object.entries(counts);
        const objectList = countEntries.length
          ? countEntries.map(([k, v]) => v > 1 ? `${k}×${v}` : k).join('、')
          : '';
        const hintList = hints.slice(0, 3).map(h => `${h.id}(${Math.round(h.score * 100)}%)`).join('、');
        const addendum = `[YOLO物体识别：${objectList || '(未识别到80类内物体)'} | 场景提示：${hintList || '无'}]`;
        heuristic.description = addendum + ' ' + (heuristic.description || '');
      }
      // Attach raw Python result for downstream consumers (visionAnalyzer.js,
      // ImageLyricsPage UI tags, etc.)
      heuristic.pythonVision = pythonResult;
    }

    heuristic.analysisTime = Date.now() - startTime;
    heuristic.method = method;
    return heuristic;
  }

  /**
   * Spawn the centralizedhub Python 3.14 vision worker to run YOLOv8n ONNX.
   *
   * Uses a temp file to avoid base64 / stdin encoding issues.  Exceptions are
   * treated as "worker unavailable" so the caller can fall back gracefully to
   * JS-only heuristics (useful for devs without the venv installed).
   */
  async _analyzeWithPythonWorker(buffer, mimeType) {
    // Quick accessibility check before we bother writing a temp file:
    const fs = await import('fs');
    if (!fs.existsSync(PYTHON_EXE) || !fs.existsSync(WORKER_PATH)) {
      throw new Error(`missing exe or worker (exe=${fs.existsSync(PYTHON_EXE)}, worker=${fs.existsSync(WORKER_PATH)})`);
    }

    // Write buffer to a temporary image file with correct extension so the
    // PIL decoder picks the right codec.
    const ext = (mimeType || 'jpeg').split('/').pop().replace('jpg', 'jpeg').replace('jpeg', 'jpg');
    const safeExt = ['png', 'jpg', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
    const tmp = join(tmpdir(), `zmusic_vision_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${safeExt}`);
    await writeFile(tmp, buffer);
    try {
      return await new Promise((resolve, reject) => {
        const child = spawn(PYTHON_EXE, [WORKER_PATH, tmp], {
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: process.env,
          timeout: 120_000, // generous: first run downloads the 6MB ONNX model
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', d => (stdout += d.toString('utf8')));
        child.stderr.on('data', d => (stderr += d.toString('utf8')));
        child.on('error', e => reject(new Error(`spawn failed: ${e.message}`)));
        child.on('close', code => {
          if (code !== 0) {
            reject(new Error(`worker exit ${code}: ${(stderr || stdout).slice(0, 500)}`));
            return;
          }
          try {
            const parsed = JSON.parse(stdout.trim());
            if (parsed.error) reject(new Error(`worker error: ${parsed.error}`));
            else resolve(parsed);
          } catch (e) {
            reject(new Error(`bad JSON from worker: ${stdout.slice(0, 200)}`));
          }
        });
      });
    } finally {
      // Best-effort cleanup; ignore failure.
      unlink(tmp).catch(() => { });
    }
  }

  async _analyzeWithHeuristic(buffer, mimeType) {
    let pixels = [];
    try {
      pixels = await this._extractPixels(buffer, mimeType);
    } catch (err) {
      logger.warn(`Pixel extraction failed: ${err.message}, using fallback`);
      return this._getFallbackSuggestion();
    }

    if (pixels.length === 0) {
      return this._getFallbackSuggestion();
    }

    let totalR = 0, totalG = 0, totalB = 0;
    const hueBuckets = new Array(12).fill(0);
    let brightCount = 0, darkCount = 0, satCount = 0;

    for (const [r, g, b] of pixels) {
      totalR += r; totalG += g; totalB += b;
      const [h, s, l] = rgbToHsl(r, g, b);
      if (l > 70) brightCount++;
      if (l < 30) darkCount++;
      if (s > 50) satCount++;
      const bucket = Math.floor(h / 30) % 12;
      hueBuckets[bucket]++;
    }

    const n = pixels.length;
    const avgR = Math.round(totalR / n);
    const avgG = Math.round(totalG / n);
    const avgB = Math.round(totalB / n);
    const [avgH, avgS, avgL] = rgbToHsl(avgR, avgG, avgB);

    const dominantBucket = hueBuckets.indexOf(Math.max(...hueBuckets));
    const dominantHue = dominantBucket * 30 + 15;

    const brightness = brightCount / n;
    const darkness = darkCount / n;
    const saturation = satCount / n;

    let matchedColors = [];
    for (const cm of COLOR_MOOD_MAP) {
      if (cm.name === 'dark' && darkness > 0.4) {
        matchedColors.push({ ...cm, score: 0.9 });
        continue;
      }
      for (const hue of cm.hues) {
        const dist = hueDistance(dominantHue, hue);
        if (dist < 40) {
          const score = 1 - (dist / 40);
          matchedColors.push({ ...cm, score: Math.max(score, matchedColors.find(m => m.name === cm.name)?.score || 0) });
        }
      }
    }

    matchedColors = matchedColors
      .filter((v, i, a) => a.findIndex(t => t.name === v.name) === i)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (matchedColors.length === 0) {
      return this._getFallbackSuggestion();
    }

    const topMatch = matchedColors[0];

    const sceneTags = [];
    if (brightness > 0.5) sceneTags.push('bright', 'daytime');
    if (darkness > 0.4) sceneTags.push('dark', 'night');
    if (saturation > 0.5) sceneTags.push('vibrant', 'colorful');
    if (saturation < 0.2) sceneTags.push('muted', 'minimal');

    const sceneCategory = this._inferSceneCategory(dominantHue, avgL, saturation);

    const suggestedThemes = pickRandom([...new Set(matchedColors.flatMap(m => m.themes))], 3);
    const suggestedStyles = pickRandom([...new Set(matchedColors.flatMap(m => m.styles))], 3);
    const suggestedMood = topMatch.mood;

    const description = this._generateDescription(
      dominantHue, avgL, saturation, brightness, darkness,
      topMatch.name, sceneCategory, suggestedMood
    );

    return {
      success: true,
      dominantColor: {
        rgb: `rgb(${avgR}, ${avgG}, ${avgB})`,
        hex: `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`,
        hsl: `hsl(${Math.round(avgH)}, ${Math.round(avgS)}%, ${Math.round(avgL)}%)`,
        hue: dominantHue,
        category: topMatch.name,
      },
      mood: suggestedMood,
      themes: suggestedThemes,
      styles: suggestedStyles,
      scene: {
        tags: sceneTags,
        category: sceneCategory,
        timeOfDay: darkness > 0.4 ? 'night' : brightness > 0.5 ? 'day' : 'dusk',
      },
      description,
      suggestions: {
        genre: suggestedStyles[0],
        theme: suggestedThemes[0],
        mood: suggestedMood,
        bpm: this._suggestBpm(dominantHue, saturation),
        alternatives: {
          themes: suggestedThemes,
          styles: suggestedStyles,
        }
      },
      colorPalette: this._extractPalette(pixels, 5),
    };
  }

  async _extractPixels(buffer, mimeType) {
    const pixels = [];
    const step = Math.max(1, Math.floor(Math.sqrt(buffer.length / 3) / 50));

    if (mimeType === 'image/png' || mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/webp') {
      const totalBytes = buffer.length;
      for (let i = 0; i < totalBytes; i += step * 3) {
        if (i + 2 < totalBytes) {
          pixels.push([buffer[i], buffer[i + 1], buffer[i + 2]]);
        }
      }
    }

    if (pixels.length < 100) {
      for (let i = 0; i < buffer.length - 2; i += 3) {
        pixels.push([buffer[i], buffer[i + 1], buffer[i + 2]]);
        if (pixels.length > 2000) break;
      }
    }

    return pixels.slice(0, 5000);
  }

  _inferSceneCategory(hue, lightness, saturation) {
    if (lightness < 25) return 'night';
    if (saturation > 60 && hue > 280) return 'fantasy';
    if (saturation > 60 && hue < 50) return 'sunset';
    if (hue >= 80 && hue <= 160) return 'nature';
    if (hue >= 200 && hue <= 240) return 'urban';
    if (lightness > 75) return 'bright';
    if (saturation < 20) return 'minimal';
    return 'ambient';
  }

  _suggestBpm(hue, saturation) {
    if (saturation > 70) return 128;
    if (hue >= 200 && hue <= 260) return 100;
    if (hue < 50) return 110;
    if (saturation < 20) return 80;
    return 120;
  }

  _generateDescription(hue, light, sat, bright, dark, colorName, scene, mood) {
    const parts = [];
    parts.push(`主色调为${this._colorNameZh(colorName)}系`);
    if (dark > 0.4) parts.push('整体偏暗');
    else if (bright > 0.5) parts.push('整体明亮');
    else parts.push('明暗适中');
    if (sat > 60) parts.push('色彩鲜艳');
    else if (sat < 25) parts.push('色彩柔和低饱和');
    parts.push(`场景偏向${this._sceneZh(scene)}`);
    parts.push(`情绪基调为${this._moodZh(mood)}`);
    return parts.join('，') + '。';
  }

  _extractPalette(pixels, count = 5) {
    const bucketSize = 32;
    const buckets = {};
    for (const [r, g, b] of pixels) {
      const key = `${Math.floor(r / bucketSize)}-${Math.floor(g / bucketSize)}-${Math.floor(b / bucketSize)}`;
      if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, count: 0 };
      buckets[key].r += r; buckets[key].g += g; buckets[key].b += b;
      buckets[key].count++;
    }
    return Object.values(buckets)
      .sort((a, b) => b.count - a.count)
      .slice(0, count)
      .map(b => ({
        rgb: `rgb(${Math.round(b.r / b.count)}, ${Math.round(b.g / b.count)}, ${Math.round(b.b / b.count)})`,
        hex: `#${Math.round(b.r / b.count).toString(16).padStart(2, '0')}${Math.round(b.g / b.count).toString(16).padStart(2, '0')}${Math.round(b.b / b.count).toString(16).padStart(2, '0')}`,
      }));
  }

  _getFallbackSuggestion() {
    const themes = ['love', 'dreams', 'nostalgia', 'loneliness', 'freedom', 'healing'];
    const styles = ['pop', 'ballad', 'rock', 'electronic', 'rnb', 'indie'];
    const moods = ['romantic', 'melancholy', 'energetic', 'dreamy', 'peaceful'];
    return {
      success: true,
      dominantColor: { hex: '#8b5cf6', category: 'pastel' },
      mood: pickRandom(moods),
      themes: pickRandom(themes, 3),
      styles: pickRandom(styles, 3),
      scene: { category: 'ambient', tags: ['colorful'] },
      description: '根据图片的视觉特征进行音乐创作建议。',
      suggestions: {
        genre: pickRandom(styles),
        theme: pickRandom(themes),
        mood: pickRandom(moods),
        bpm: 120,
        alternatives: { themes: pickRandom(themes, 3), styles: pickRandom(styles, 3) }
      },
      colorPalette: [{ hex: '#8b5cf6' }, { hex: '#ec4899' }, { hex: '#06b6d4' }],
    };
  }

  _colorNameZh(name) {
    const map = { warm: '暖色', cool: '冷色', vibrant: '鲜艳', earth: '大地', dark: '暗黑', pastel: '柔和', sunset: '日落', night: '夜色' };
    return map[name] || name;
  }
  _sceneZh(s) {
    const map = { night: '夜晚', fantasy: '奇幻', sunset: '日落', nature: '自然', urban: '都市', bright: '明亮', minimal: '极简', ambient: '氛围' };
    return map[s] || s;
  }
  _moodZh(m) {
    const map = { romantic: '浪漫', melancholy: '忧郁', energetic: '活力', dreamy: '梦幻', peaceful: '宁静', dark: '深沉' };
    return map[m] || m;
  }
}

export default new VisionService();
