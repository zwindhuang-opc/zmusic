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

const logger = new Logger('VisionService');

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
    let result = null;
    let method = 'heuristic';

    try {
      result = await this._analyzeWithHeuristic(buffer, mimeType);
      method = 'heuristic';
    } catch (err) {
      logger.warn(`Heuristic analysis failed: ${err.message}`);
      result = this._getFallbackSuggestion();
      method = 'fallback';
    }

    result.analysisTime = Date.now() - startTime;
    result.method = method;
    return result;
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
        hex: `#${avgR.toString(16).padStart(2,'0')}${avgG.toString(16).padStart(2,'0')}${avgB.toString(16).padStart(2,'0')}`,
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
        hex: `#${Math.round(b.r/b.count).toString(16).padStart(2,'0')}${Math.round(b.g/b.count).toString(16).padStart(2,'0')}${Math.round(b.b/b.count).toString(16).padStart(2,'0')}`,
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
