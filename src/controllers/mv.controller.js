/**
 * MVController - MV视频生成请求控制器
 * 
 * 本控制器处理所有MV视频时间线生成相关的API请求。
 * 支持多种音乐风格的MV模板，自动生成场景时间线和特效。
 * 作为MVC架构中的控制器层，协调MV服务完成视频生成任务。
 * 
 * @module controllers/mv.controller
 * @version 1.0.0
 * @author ZMusic Team
 */

import MVService from '../services/mv.service.js';
import Logger from '../utils/logger.js';
import generationHistory from '../services/generation.history.js';

/**
 * 日志记录器实例
 * @type {Logger}
 */
const logger = new Logger('MVController');

/**
 * MV服务实例
 * @type {MVService}
 */
const mvService = new MVService();

/**
 * MV视频生成控制器类
 * 
 * 提供MV时间线生成和风格查询API端点。
 * 
 * @class MVController
 */
export class MVController {
  /**
   * GET /api/mv/genres - 获取支持的MV风格
   * 
   * 返回系统支持的所有音乐风格列表，用于MV时间线生成。
   * 
   * @async
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @returns {Promise<Object>} 风格列表JSON响应
   * @returns {boolean} returns.success - 请求是否成功
   * @returns {string[]} returns.data - 支持的音乐风格列表
   * 
   * @example
   * GET /api/mv/genres
   * Response: {
   *   "success": true,
   *   "data": ["pop", "rock", "chinese_traditional", "electronic", "hip_hop", "ballad"]
   * }
   */
  async getGenres(req, res) {
    try {
      return res.json({
        success: true,
        data: mvService.getGenres()
      });
    } catch (error) {
      logger.error(`Get genres error: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/mv/generate - 生成MV时间线
   * 
   * 根据指定的音乐风格和时长生成MV视频时间线。
   * 时间线包含多个场景，每个场景定义了起止时间、特效和转场方式。
   * 
   * @async
   * @param {Object} req - HTTP请求对象
   * @param {Object} req.body - 请求体
   * @param {string} [req.body.genre='pop'] - 音乐风格
   * @param {number} [req.body.duration=180] - MV时长（秒）
   * @param {Object} res - HTTP响应对象
   * @returns {Promise<Object>} 生成的MV时间线JSON响应
   * @returns {boolean} returns.success - 请求是否成功
   * @returns {Object} returns.data - MV时间线数据
   * @returns {string} returns.data.genre - 使用的音乐风格
   * @returns {number} returns.data.duration - 总时长（秒）
   * @returns {string} returns.data.colorPalette - 色调方案
   * @returns {number} returns.data.totalScenes - 场景总数
   * @returns {Object[]} returns.data.timeline - 时间线数组
   * @returns {string[]} returns.data.effects - 全局特效列表
   * @returns {string} returns.data.generatedAt - 生成时间
   * 
   * @example
   * POST /api/mv/generate
   * {
   *   "genre": "electronic",
   *   "duration": 240
   * }
   */
  async generate(req, res) {
    try {
      const { genre = 'pop', duration = 180, ...params } = req.body || {};
      logger.info(`Generate MV: genre=${genre}, duration=${duration}`);
      const result = mvService.generate(genre, duration, params);
      try {
        generationHistory.add('mv', {
          genre,
          duration,
          style: genre,
          params,
          result
        });
      } catch (e) {
        logger.warn(`Save history failed: ${e.message}`);
      }
      return res.json({ success: true, data: result });
    } catch (error) {
      logger.error(`Generate error: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

/**
 * 默认导出 - MVController单例实例
 * @type {MVController}
 */
export default new MVController();
