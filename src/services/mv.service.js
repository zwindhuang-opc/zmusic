/**
 * MVService - MV视频时间线生成服务
 * 
 * 本服务根据音乐风格生成MV视频时间线和场景模板。
 * 每种风格定义了独特的色调方案、场景列表和特效组合。
 * 生成的时间线包含每个场景的起止时间、持续时长、特效和转场方式。
 * 
 * @module services/mv.service
 * @version 1.0.0
 * @author ZMusic Team
 */

import Logger from '../utils/logger.js';

/**
 * 日志记录器实例
 * @type {Logger}
 */
const logger = new Logger('MVService');

/**
 * MV模板数据库
 * 
 * 包含多种音乐风格的MV模板配置：
 * - pop: 流行风格 - 紫粉渐变色调，录音棚/街头/特写/人群/日落场景
 * - rock: 摇滚风格 - 红黑对比色调，演唱会/舞台/人群/烟雾/灯光场景
 * - chinese_traditional: 中国风 - 金红玉色调，宫殿/花园/山/月/河场景
 * - electronic: 电子风格 - 霓虹赛博色调，夜店/城市夜景/霓虹街/VR世界/激光场景
 * - hip_hop: 嘻哈风格 - 都市金色调，街头/车/录音棚/钱/天台场景
 * - ballad: 民谣风格 - 柔和粉彩色调，钢琴/雨/窗/蜡烛/信场景
 * 
 * 每个模板包含：
 * - palette: 色调方案名称
 * - scenes: 场景列表
 * - effects: 特效列表
 * 
 * @constant {Object}
 */
const MV_TEMPLATES = {
  pop: {
    palette: 'purple_pink_gradient',
    scenes: ['studio', 'street', 'closeup', 'crowd', 'sunset'],
    effects: ['light_leak', 'lens_flare', 'color_shift']
  },
  rock: {
    palette: 'red_black_contrast',
    scenes: ['concert', 'stage', 'crowd', 'smoke', 'lights'],
    effects: ['glitch', 'shake', 'high_contrast']
  },
  chinese_traditional: {
    palette: 'gold_red_jade',
    scenes: ['palace', 'garden', 'mountain', 'moon', 'river'],
    effects: ['ink_wash', 'calligraphy', 'fade']
  },
  electronic: {
    palette: 'neon_cyber',
    scenes: ['club', 'city_night', 'neon_street', 'vr_world', 'laser'],
    effects: ['glitch', 'chromatic', 'digital_wave']
  },
  hip_hop: {
    palette: 'urban_gold',
    scenes: ['street', 'car', 'studio', 'money', 'rooftop'],
    effects: ['grain', 'vhs', 'shake']
  },
  ballad: {
    palette: 'soft_pastel',
    scenes: ['piano', 'rain', 'window', 'candle', 'letter'],
    effects: ['soft_focus', 'bokeh', 'slow_zoom']
  }
};

/**
 * MV视频生成服务类
 * 
 * 提供MV时间线生成功能，根据音乐风格自动规划场景、特效和转场。
 * 
 * @class MVService
 */
export class MVService {
  /**
   * 构造函数
   * 初始化MV生成服务
   */
  constructor() {
    logger.info('Initialized');
  }

  /**
   * 获取所有支持的音乐风格
   * 
   * @returns {string[]} 音乐风格数组，如 ['pop', 'rock', 'chinese_traditional', ...]
   */
  getGenres() {
    return Object.keys(MV_TEMPLATES);
  }

  /**
   * 生成MV时间线
   * 
   * 根据指定的音乐风格和时长生成完整的MV时间线。
   * 时间线包含多个场景，每个场景定义了起止时间、特效和转场方式。
   * 转场规则：第一个场景使用 fade_in，最后一个场景使用 fade_out，其余使用 cut。
   * 
   * @param {string} genre - 音乐风格，默认 'pop'
   * @param {number} duration - MV总时长（秒），默认 180
   * @param {Object} params - 额外参数（预留扩展）
   * 
   * @returns {Object} 生成的MV时间线对象
   * @returns {string} returns.genre - 使用的音乐风格
   * @returns {number} returns.duration - 总时长（秒）
   * @returns {string} returns.colorPalette - 色调方案名称
   * @returns {number} returns.totalScenes - 场景总数
   * @returns {Object[]} returns.timeline - 时间线数组
   * @returns {number} returns.timeline[].sceneId - 场景编号（从1开始）
   * @returns {string} returns.timeline[].scene - 场景名称
   * @returns {number} returns.timeline[].startTime - 起始时间（秒）
   * @returns {number} returns.timeline[].endTime - 结束时间（秒）
   * @returns {number} returns.timeline[].duration - 场景时长（秒）
   * @returns {string[]} returns.timeline[].effects - 特效列表
   * @returns {string} returns.timeline[].transition - 转场方式（fade_in/fade_out/cut）
   * @returns {string[]} returns.effects - 全局特效列表
   * @returns {string} returns.generatedAt - 生成时间（ISO格式）
   * 
   * @example
   * const mv = mvService.generate('electronic', 240);
   * console.log(`共 ${mv.totalScenes} 个场景`);
   * mv.timeline.forEach(scene => {
   *   console.log(`场景 ${scene.sceneId}: ${scene.scene} (${scene.startTime}s - ${scene.endTime}s)`);
   * });
   */
  generate(genre = 'pop', duration = 180, params = {}) {
    const template = MV_TEMPLATES[genre] || MV_TEMPLATES.pop;
    const sceneCount = template.scenes.length;
    const sceneDuration = Math.floor(duration / sceneCount);

    /**
     * 生成时间线场景数组
     * 根据模板场景列表，计算每个场景的时间分配和转场效果
     */
    const timeline = template.scenes.map((scene, index) => ({
      sceneId: index + 1,
      scene,
      startTime: index * sceneDuration,
      endTime: (index + 1) * sceneDuration,
      duration: sceneDuration,
      effects: template.effects,
      transition: index === 0 ? 'fade_in' : (index === sceneCount - 1 ? 'fade_out' : 'cut')
    }));

    return {
      genre,
      duration,
      colorPalette: template.palette,
      totalScenes: sceneCount,
      timeline,
      effects: template.effects,
      generatedAt: new Date().toISOString()
    };
  }
}

export default MVService;
