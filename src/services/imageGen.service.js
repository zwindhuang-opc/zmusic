/**
 * ImageGenService - AI 封面图与场景图生成服务
 *
 * 使用 trae-api-cn.mchost.guru 的 text_to_image 接口（GPT-IMAGE 风格，
 * 同 anna_ai 项目的图像生成方案）为 MV/歌曲生成封面图和场景图。
 *
 * 设计目标：
 *   - 不依赖任何外部 API Key（端点为 IDE 内部端点，公开可用）
 *   - 支持中英文提示词，自动按 SDXL 最佳实践拼接
 *   - 输出可直接作为 <img src> 使用的 URL（端点返回 image binary）
 *   - 为 MV/歌曲封面、场景卡片、缩略图等场景统一服务
 *
 * @module services/imageGen.service
 * @version 1.0.0
 * @author ZMusic Team
 */

import Logger from '../utils/logger.js';

const logger = new Logger('ImageGenService');

/**
 * 图像生成 API 基础 URL（同 anna_ai 项目所使用的 GPT-IMAGE 端点）
 * 该端点直接返回 image binary，可作为 <img src> 使用。
 */
const TEXT_TO_IMAGE_BASE = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';

/**
 * 支持的图像尺寸枚举（与端点 image_size 参数对齐）
 * - square_hd: 1024x1024 高清方形（适合封面）
 * - square: 512x512 方形（适合缩略图）
 * - portrait_4_3: 768x1024 竖屏（适合 MV 竖屏封面）
 * - portrait_16_9: 1080x1920 竖屏全屏（适合手机 MV）
 * - landscape_4_3: 1024x768 横屏（适合 MV 横屏封面）
 * - landscape_16_9: 1920x1080 横屏全屏（适合 MV 视频封面）
 */
const SUPPORTED_IMAGE_SIZES = [
  'square_hd',
  'square',
  'portrait_4_3',
  'portrait_16_9',
  'landscape_4_3',
  'landscape_16_9',
];

/**
 * 默认尺寸（MV 视频封面推荐 16:9 横屏）
 */
const DEFAULT_IMAGE_SIZE = 'landscape_16_9';

/**
 * 风格映射表 - 将 zmusic 的内部风格/调色板关键词翻译为 SDXL 提示词片段
 * 这样无论用户选什么 palette/style，都能生成视觉协调的封面
 */
const STYLE_PROMPT_MAP = {
  // 调色板
  purple_pink_gradient: 'purple and pink gradient color palette',
  red_black_contrast: 'high contrast red and black color palette',
  gold_red_jade: 'gold, red and jade green color palette',
  neon_cyber: 'neon cyberpunk color palette with electric blue and magenta',
  urban_gold: 'urban gold and dark color palette',
  soft_pastel: 'soft pastel color palette',
  warm_brown_gold: 'warm brown and gold color palette',
  dark_blue_gold: 'dark blue and gold color palette',
  deep_purple_blue: 'deep purple and blue color palette',
  warm_yellow: 'warm yellow color palette',
  pink_rose: 'pink rose color palette',
  green_landscape: 'green landscape color palette',
  black_red_purple: 'black, red and purple gothic color palette',
  blue_gray_cool: 'cool blue and gray color palette',
  blue_orange_contrast: 'blue and orange contrast color palette',
  brown_yellow_vintage: 'brown and yellow vintage color palette',
  pink_blue_dream: 'pink and blue dreamy color palette',
  // 视觉风格
  modern: 'modern cinematic style',
  cinematic: 'cinematic film still style',
  retro: 'retro vintage style',
  anime: 'anime art style',
  minimalist: 'minimalist style',
  abstract: 'abstract art style',
  dreamy: 'dreamy ethereal style',
  neon: 'neon glow style',
};

/**
 * 流派到场景描述的映射 - 用于丰富提示词
 */
const GENRE_SCENE_MAP = {
  pop: 'pop music concert stage with colorful lights',
  rock: 'rock concert with stage lights and crowd',
  chinese_traditional: 'Chinese traditional palace and garden scene',
  electronic: 'electronic music nightclub with neon lights',
  hip_hop: 'hip hop urban street scene',
  ballad: 'ballad music with piano in soft lighting',
  jazz: 'jazz bar with saxophone and warm lighting',
  classical: 'classical music concert hall with orchestra',
  rnb: 'R&B studio with neon lights',
  country: 'country road with guitar at sunset',
  love_song: 'romantic couple scene with flowers and sunset',
  chinese_classical: 'Chinese classical landscape with bamboo and mountains',
  concert: 'live concert with crowd and stage lights',
  modern: 'modern city skyline at night',
  cinematic: 'cinematic movie scene with dramatic lighting',
  retro: 'retro scene with vinyl records and vintage TV',
  anime: 'anime style scene with cherry blossoms',
  gothic_rock: 'gothic castle with bats and moonlight',
};

/**
 * 将内部风格/调色板关键词解析为 SDXL 提示词片段
 * @param {string} key - 内部风格键（如 'purple_pink_gradient' / 'cinematic'）
 * @returns {string} SDXL 提示词片段
 */
function resolveStylePrompt(key) {
  if (!key) return '';
  return STYLE_PROMPT_MAP[key] || '';
}

/**
 * 将流派键解析为场景描述
 * @param {string} genre - 流派键
 * @returns {string} 场景描述
 */
function resolveGenreScene(genre) {
  if (!genre) return '';
  return GENRE_SCENE_MAP[genre] || '';
}

/**
 * 从歌词中提取关键词用于图像提示词
 * 简单实现：取前 N 个非空行，每行提取前几个字
 * @param {string} lyrics - 歌词文本
 * @param {number} maxLines - 最大提取行数
 * @returns {string} 关键词描述
 */
function extractKeywordsFromLyrics(lyrics, maxLines = 3) {
  if (!lyrics || typeof lyrics !== 'string') return '';
  const lines = lyrics
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('[') && !l.startsWith('('))
    .slice(0, maxLines);
  return lines.join(', ');
}

/**
 * 构造 SDXL 风格的图像生成提示词
 * @param {Object} options - 提示词参数
 * @param {string} options.title - 歌曲/MV 标题
 * @param {string} options.genre - 音乐流派
 * @param {string} options.style - 视觉风格
 * @param {string} options.colorPalette - 调色板
 * @param {string} options.lyrics - 歌词文本（用于提取关键词）
 * @param {string} options.customPrompt - 用户自定义提示词（最高优先级）
 * @param {string} options.scene - 场景描述
 * @returns {string} 拼接好的 SDXL 提示词
 */
function buildImagePrompt({
  title,
  genre,
  style,
  colorPalette,
  lyrics,
  customPrompt,
  scene,
}) {
  // 如果用户提供了自定义提示词，直接使用（最高优先级）
  if (customPrompt && customPrompt.trim().length > 0) {
    return customPrompt.trim();
  }

  const parts = [];

  // 主体描述
  const genreScene = resolveGenreScene(genre);
  if (genreScene) parts.push(genreScene);

  // 标题
  if (title && title.trim()) {
    parts.push(`inspired by the song "${title.trim()}"`);
  }

  // 场景描述
  if (scene) parts.push(scene);

  // 歌词关键词
  const lyricsKeywords = extractKeywordsFromLyrics(lyrics);
  if (lyricsKeywords) parts.push(`mood from lyrics: ${lyricsKeywords}`);

  // 视觉风格
  const stylePrompt = resolveStylePrompt(style);
  if (stylePrompt) parts.push(stylePrompt);

  // 调色板
  const palettePrompt = resolveStylePrompt(colorPalette);
  if (palettePrompt) parts.push(palettePrompt);

  // SDXL 通用质量增强
  parts.push('professional photography, high detail, 4k, cinematic lighting, sharp focus');

  return parts.join(', ');
}

/**
 * 验证并规范化 image_size 参数
 * @param {string} size - 用户传入的尺寸
 * @returns {string} 合法尺寸
 */
function normalizeImageSize(size) {
  if (!size || !SUPPORTED_IMAGE_SIZES.includes(size)) {
    return DEFAULT_IMAGE_SIZE;
  }
  return size;
}

/**
 * ImageGenService 类 - 提供图像生成 URL 构造与（可选）二进制代理
 */
export class ImageGenService {
  /**
   * 构造图像生成 URL（不调用 API，仅返回可直接使用的 <img src> URL）
   *
   * 由于 trae-api-cn.mchost.guru 的 text_to_image 端点直接返回 image binary，
   * 前端可直接将本方法返回的 URL 用作 <img src>，无需后端代理。
   *
   * @param {Object} options
   * @param {string} options.title - 歌曲/MV 标题
   * @param {string} options.genre - 音乐流派
   * @param {string} options.style - 视觉风格
   * @param {string} options.colorPalette - 调色板
   * @param {string} options.lyrics - 歌词文本
   * @param {string} options.customPrompt - 自定义提示词
   * @param {string} options.scene - 场景描述
   * @param {string} [options.imageSize='landscape_16_9'] - 图像尺寸枚举
   * @returns {{imageUrl: string, prompt: string, imageSize: string}}
   */
  buildImageUrl({
    title,
    genre,
    style,
    colorPalette,
    lyrics,
    customPrompt,
    scene,
    imageSize,
  }) {
    const prompt = buildImagePrompt({
      title, genre, style, colorPalette, lyrics, customPrompt, scene,
    });
    const size = normalizeImageSize(imageSize);

    // URL-encode the prompt for safe inclusion in query string
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `${TEXT_TO_IMAGE_BASE}?prompt=${encodedPrompt}&image_size=${size}`;

    logger.info(`Built image URL: size=${size}, promptLen=${prompt.length}`);

    return { imageUrl, prompt, imageSize: size };
  }

  /**
   * 通过后端代理获取图像二进制（用于前端无法直接访问端点的场景，如 CORS）
   * 注意：默认情况下前端可直接使用 buildImageUrl 返回的 URL，无需调用此方法。
   *
   * @param {Object} options - 同 buildImageUrl
   * @returns {Promise<{buffer: Buffer, contentType: string, imageUrl: string, prompt: string}>}
   */
  async fetchImageBuffer(options) {
    const { imageUrl, prompt, imageSize } = this.buildImageUrl(options);

    logger.info(`Fetching image buffer from text_to_image endpoint...`);
    const response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0 (compatible; ZMusicBot/1.0)',
      },
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Image API returned ${response.status}: ${errText.substring(0, 200)}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    logger.info(`Image fetched: ${buffer.length} bytes, ${contentType}`);

    return { buffer, contentType, imageUrl, prompt, imageSize };
  }

  /**
   * 获取支持的图像尺寸列表（供前端 UI 展示）
   * @returns {string[]}
   */
  getSupportedImageSizes() {
    return [...SUPPORTED_IMAGE_SIZES];
  }
}

/**
 * 默认导出 - 单例实例
 */
export default new ImageGenService();
