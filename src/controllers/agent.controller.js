/**
 * AgentController - AI代理生成请求控制器
 * 
 * 本控制器处理所有基于AI代理的生成请求。
 * 支持Unicorn Agent的多种生成方法（FSM、网络层、Muse风格、Suno风格）。
 * 作为MVC架构中的控制器层，协调AI代理完成智能生成任务。
 * 
 * @module controllers/agent.controller
 * @version 1.0.0
 * @author ZMusic Team
 */

import { UnicornAgent } from '../agents/unicorn-agent.js';
import Logger from '../utils/logger.js';

/**
 * 日志记录器实例
 * @type {Logger}
 */
const logger = new Logger('AgentController');

/**
 * Unicorn Agent实例
 * @type {UnicornAgent}
 */
const unicornAgent = new UnicornAgent();

/**
 * AI代理控制器类
 * 
 * 提供AI代理状态查询和智能生成API端点。
 * 支持多种生成方法：FSM编程、网络层组合、Muse风格、Suno风格。
 * 
 * @class AgentController
 */
export class AgentController {
  /**
   * GET /api/agent/status - 获取AI代理状态
   * 
   * 返回Unicorn Agent的配置状态和能力信息。
   * 
   * @async
   * @param {Object} req - HTTP请求对象
   * @param {Object} res - HTTP响应对象
   * @returns {Promise<Object>} 代理状态JSON响应
   * @returns {boolean} returns.success - 请求是否成功
   * @returns {Object} returns.data - 状态数据对象
   * @returns {Object} returns.data.unicorn - Unicorn Agent状态
   * @returns {string} returns.data.unicorn.name - 代理名称
   * @returns {boolean} returns.data.unicorn.hermes - Hermes子代理是否启用
   * @returns {boolean} returns.data.unicorn.openclaw - OpenClaw子代理是否启用
   * @returns {number} returns.data.unicorn.fsmStates - FSM状态数量
   * @returns {number} returns.data.unicorn.networkLayers - 网络层数量
   * 
   * @example
   * GET /api/agent/status
   * Response: {
   *   "success": true,
   *   "data": {
   *     "unicorn": {
   *       "name": "Unicorn Agent",
   *       "hermes": true,
   *       "openclaw": true,
   *       "fsmStates": 8,
   *       "networkLayers": 4
   *     }
   *   }
   * }
   */
  async getStatus(req, res) {
    try {
      return res.json({
        success: true,
        data: {
          unicorn: unicornAgent.getStatus()
        }
      });
    } catch (error) {
      logger.error(`Status error: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/agent/lyrics - 使用AI代理生成歌词
   * 
   * 使用Unicorn Agent的智能生成方法创建歌词。
   * 支持多种生成方法：FSM编程、网络层组合、Muse风格、Suno风格。
   * 
   * @async
   * @param {Object} req - HTTP请求对象
   * @param {Object} req.body - 请求体
   * @param {string} [req.body.method='muse'] - 生成方法 ('fsm', 'network_layer', 'muse', 'suno')
   * @param {string} [req.body.genre='pop'] - 音乐风格
   * @param {string} [req.body.theme='love'] - 主题
   * @param {string} [req.body.style='modern'] - 编曲风格
   * @param {string} [req.body.mood='happy'] - 情绪
   * @param {number} [req.body.bpm=120] - 节拍速度
   * @param {Object} res - HTTP响应对象
   * @returns {Promise<Object>} 生成的歌词JSON响应
   * @returns {boolean} returns.success - 请求是否成功
   * @returns {Object} returns.data - 生成的歌词数据
   * @returns {string} returns.data.taskId - 任务ID
   * @returns {string} returns.data.method - 使用的生成方法
   * @returns {string} returns.data.command - 生成的命令字符串
   * @returns {Object} returns.data.execution - 执行数据
   * @returns {Object} returns.data.stats - 统计信息
   * 
   * @example
   * POST /api/agent/lyrics
   * {
   *   "method": "fsm",
   *   "genre": "pop",
   *   "theme": "love",
   *   "bpm": 128
   * }
   */
  async generateLyrics(req, res) {
    try {
      const params = req.body || {};
      const mappedParams = {
        method: params.method || 'muse',
        theme: params.theme || 'love',
        style: params.genre || params.style || 'pop',
        bpm: params.bpm || 120,
        duration: params.duration || 270,
        complexity: params.complexity || 5,
        subject: params.subject,
        object: params.object,
        language: params.language || 'zh',
        variation: params.variation || 'A',
        reference: params.reference || '',
        referenceSong: params.referenceSong || '',
        script: params.script || ''
      };
      logger.info(`Agent lyrics: method=${mappedParams.method}, style=${mappedParams.style}, theme=${mappedParams.theme}, language=${mappedParams.language}`);
      const result = await unicornAgent.generateLyrics(mappedParams);
      return res.json({ success: true, data: result });
    } catch (error) {
      logger.error(`Lyrics error: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/agent/mv - 使用AI代理生成MV时间线
   * 
   * 使用Unicorn Agent生成MV视频时间线和场景规划。
   * 
   * @async
   * @param {Object} req - HTTP请求对象
   * @param {Object} req.body - 请求体
   * @param {number} [req.body.duration=180] - MV时长（秒）
   * @param {string} [req.body.style='modern'] - MV风格
   * @param {string} [req.body.colorPalette='purple_gradient'] - 色调方案
   * @param {Object} res - HTTP响应对象
   * @returns {Promise<Object>} 生成的MV时间线JSON响应
   * @returns {boolean} returns.success - 请求是否成功
   * @returns {Object} returns.data - MV时间线数据
   * @returns {string} returns.data.taskId - 任务ID
   * @returns {Object[]} returns.data.timeline - 时间线场景数组
   * @returns {Object} returns.data.stats - 统计信息
   * 
   * @example
   * POST /api/agent/mv
   * {
   *   "duration": 240,
   *   "style": "cinematic",
   *   "colorPalette": "warm_tones"
   * }
   */
  async generateMV(req, res) {
    try {
      const params = req.body || {};
      logger.info(`Agent MV: duration=${params.duration || 180}`);
      const result = await unicornAgent.generateMV(params);
      return res.json({ success: true, data: result });
    } catch (error) {
      logger.error(`MV error: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new AgentController();
