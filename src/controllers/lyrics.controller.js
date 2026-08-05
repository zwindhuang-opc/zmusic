/**
 * LyricsController - 歌词生成请求控制器
 * 
 * 本控制器处理所有歌词生成相关的API请求。
 * 支持多种音乐风格和主题，使用模板库生成结构化歌词。
 * 作为MVC架构中的控制器层，协调歌词服务完成生成任务。
 * 
 * @module controllers/lyrics.controller
 * @version 1.0.0
 * @author ZMusic Team
 */

import LyricsService from '../services/lyrics.service.js';
import Logger from '../utils/logger.js';
import generationHistory from '../services/generation.history.js';

/**
 * 日志记录器实例
 * @type {Logger}
 */
const logger = new Logger('LyricsController');

/**
 * 歌词服务实例
 * @type {LyricsService}
 */
const lyricsService = new LyricsService();

/**
 * 歌词生成控制器类
 * 
 * 提供歌词生成和元数据查询API端点。
 * 
 * @class LyricsController
 */
export class LyricsController {
  /**
   * GET /api/lyrics/genres - 获取支持的歌词风格和主题
   * 
   * 返回系统支持的所有音乐风格和主题列表。
   * 
   * @async
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @returns {Promise<Object>} 风格和主题列表JSON响应
   * @returns {boolean} returns.success - 请求是否成功
   * @returns {Object} returns.data - 数据对象
   * @returns {string[]} returns.data.genres - 支持的音乐风格列表
   * @returns {string[]} returns.data.themes - 支持的主题列表
   * 
   * @example
   * GET /api/lyrics/genres
   * Response: {
   *   "success": true,
   *   "data": {
   *     "genres": ["pop", "rock", "chinese_traditional", "electronic", "hip_hop", "ballad"],
   *     "themes": ["love", "friendship", "success", "dreams", "nature", "life", "memory"]
   *   }
   * }
   */
  async getGenres(req, res) {
    try {
      return res.json({
        success: true,
        data: {
          genres: lyricsService.getGenres(),
          themes: lyricsService.getThemes()
        }
      });
    } catch (error) {
      logger.error(`Get genres error: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/lyrics/generate - 生成歌词
   * 
   * 根据指定的风格、主题和参数生成结构化歌词。
   * 使用有限状态机(FSM)思想组织歌曲结构。
   * 
   * @async
   * @param {Object} req - HTTP请求对象
   * @param {Object} req.body - 请求体
   * @param {string} [req.body.genre='pop'] - 音乐风格
   * @param {string} [req.body.theme='love'] - 主题
   * @param {string} [req.body.subject='我'] - 主语
   * @param {string} [req.body.object='你'] - 宾语
   * @param {string} [req.body.verse='verse_1'] - 段落标识
   * @param {Object} res - HTTP响应对象
   * @returns {Promise<Object>} 生成的歌词JSON响应
   * @returns {boolean} returns.success - 请求是否成功
   * @returns {Object} returns.data - 生成的歌词数据
   * @returns {string} returns.data.genre - 使用的风格
   * @returns {string} returns.data.theme - 使用的主题
   * @returns {string[]} returns.data.structure - 歌曲结构
   * @returns {Object[]} returns.data.sections - 歌词段落
   * @returns {string} returns.data.fullText - 完整歌词文本
   * @returns {string} returns.data.generatedAt - 生成时间
   * 
   * @example
   * POST /api/lyrics/generate
   * {
   *   "genre": "pop",
   *   "theme": "love",
   *   "subject": "我",
   *   "object": "你"
   * }
   */
  async generate(req, res) {
    try {
      const { genre = 'pop', theme = 'love', method = 'basic', ...params } = req.body || {};
      logger.info(`Generate lyrics: genre=${genre}, theme=${theme}, method=${method}`);

      let result;
      switch (method) {
        case 'fsm':
        case 'basic':
          result = lyricsService.generate(genre, theme, params);
          break;
        case 'network':
        case 'network_layer':
          result = lyricsService.generateNetworkLayer(genre, theme, params);
          break;
        case 'time':
        case 'muse':
          result = lyricsService.generateTimeSection(genre, theme, params);
          break;
        case 'variation':
        case 'suno':
          result = lyricsService.generateStyleVariation(genre, theme, params.styleType || genre, params.variation || 'A', params);
          break;
        case 'melo':
          result = lyricsService.generateMelo(genre, theme, params);
          break;
        default:
          result = lyricsService.generate(genre, theme, params);
      }

      this._saveHistory(genre, theme, method, params, result);
      return res.json({ success: true, data: result });
    } catch (error) {
      logger.error(`Generate error: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  _saveHistory(genre, theme, method, params, result) {
    try {
      generationHistory.add('lyrics', {
        genre,
        theme,
        method,
        style: genre,
        params,
        result
      });
    } catch (e) {
      logger.warn(`Save history failed: ${e.message}`);
    }
  }
}

/**
 * 默认导出 - LyricsController单例实例
 * @type {LyricsController}
 */
export default new LyricsController();
