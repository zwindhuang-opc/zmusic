/**
 * LyricsService - 歌词生成服务
 *
 * 本服务委托给动态程序化歌词引擎，使用动态词库 + 模板生成 + 押韵引擎
 * 生成高质量歌词，支持多种音乐风格和主题。
 *
 * @module services/lyrics.service
 * @version 6.0.0
 * @author ZMusic Team
 */

import Logger from '../utils/logger.js';
import {
  generateDynamicLyrics,
  getDynamicThemes,
  getDynamicStyles,
  getDynamicGenres,
  getThemeBank,
  blendBanks
} from '../utils/dynamicLyricsEngine.js';
import { generateLyrics, getGenres, getThemes } from '../utils/lyricsEngine.js';

const logger = new Logger('LyricsService');

export class LyricsService {
  constructor() {
    logger.info('Initialized with dynamic procedural engine v6 (Dynamic Word Banks + Template Generation + Rhyme Engine)');
  }

  getGenres() {
    return getDynamicGenres();
  }

  getThemes() {
    return getDynamicThemes();
  }

  generate(genre, theme, params = {}) {
    return generateDynamicLyrics({
      genre,
      theme,
      method: 'basic',
      complexity: params.complexity || 5,
      ...params
    });
  }

  generateComplex(genre, theme, params = {}) {
    return generateDynamicLyrics({
      genre,
      theme,
      method: 'basic',
      complexity: params.complexity || 8,
      ...params
    });
  }

  generateNetworkLayer(genre, theme, params = {}) {
    return generateDynamicLyrics({
      genre,
      theme,
      method: 'network',
      bpm: params.bpm || 120,
      complexity: params.complexity || 5,
      ...params
    });
  }

  generateTimeSection(genre, theme, params = {}) {
    return generateDynamicLyrics({
      genre,
      theme,
      method: 'time',
      duration: params.duration || 270,
      complexity: params.complexity || 7,
      ...params
    });
  }

  generateStyleVariation(genre, theme, styleType, variationKey, params = {}) {
    return generateDynamicLyrics({
      genre,
      theme,
      method: 'variation',
      variation: variationKey || 'A',
      styleType,
      complexity: params.complexity || 5,
      ...params
    });
  }

  generatePoem(theme, params = {}) {
    const result = generateDynamicLyrics({
      genre: 'ballad',
      theme,
      method: 'basic',
      complexity: params.complexity || 5
    });
    // Return in poem format
    return {
      theme,
      couplets: result.sections.map(s => s.content.split('\n').filter(l => l.trim())),
      fullText: result.fullText,
      generatedAt: result.generatedAt
    };
  }

  // Support mix mode
  generateMix(params = {}) {
    return generateDynamicLyrics({
      ...params,
      method: params.method || 'basic'
    });
  }
}

export default LyricsService;
