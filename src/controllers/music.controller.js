/**
 * MusicController - 音乐生成请求控制器
 * 
 * 本控制器处理所有音乐生成相关的API请求。
 * 支持Suno AI和Muse AI双提供商，以及基于代理的智能生成模式。
 * 作为MVC架构中的控制器层，协调服务层完成音乐生成任务。
 * 
 * @module controllers/music.controller
 * @version 1.0.0
 * @author ZMusic Team
 */

import sunoService from '../services/suno.service.js';
import museService from '../services/muse.service.js';
import generationHistory from '../services/generation.history.js';
import Logger from '../utils/logger.js';
import { buildSunoPrompt, MUSIC_STYLES, MUSIC_GENRES, MUSIC_THEMES } from '../config/musicStyles.js';

/**
 * 日志记录器实例
 * @type {Logger}
 */
const logger = new Logger('MusicController');

/**
 * 音乐生成控制器类
 * 
 * 提供音乐生成API端点，支持单提供商和双提供商模式。
 * 
 * @class MusicController
 */
export class MusicController {
  /**
   * POST /api/music/generate - 生成音乐（Suno AI）
   * 
   * 使用Suno AI生成音乐。需要配置Suno API密钥。
   * 
   * @async
   * @param {Object} req - HTTP请求对象
   * @param {Object} req.body - 请求体
   * @param {string} [req.body.prompt='A happy song'] - 音乐描述提示
   * @param {string} [req.body.style='pop'] - 音乐风格
   * @param {number} [req.body.duration=60] - 时长（秒）
   * @param {Object} res - HTTP响应对象
   * @returns {Promise<Object>} 生成结果JSON响应
   * @returns {boolean} returns.success - 请求是否成功
   * @returns {Object} returns.data - 生成结果数据
   * 
   * @example
   * POST /api/music/generate
   * {
   *   "prompt": "一首关于夏天的快乐歌曲",
   *   "style": "pop",
   *   "duration": 120
   * }
   */
  async generate(req, res) {
    try {
      const { prompt = 'A happy song', style = 'pop', duration = 60 } = req.body || {};
      logger.info(`Generate request: prompt="${prompt}", style=${style}, duration=${duration}`);

      if (!sunoService.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: 'Suno API key not configured. Please set SUNO_CN_API_KEY in .env file.'
        });
      }

      const result = await sunoService.generateMusic(prompt, style, duration);
      generationHistory.add('music', { params: { prompt, style, duration }, result });
      return res.json({ success: true, data: result });
    } catch (error) {
      logger.error(`Generate error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * POST /api/music/generate-agent
   * Agent-based dual-provider (Suno + Muse) with auto-lyrics
   */
  async generateAgent(req, res) {
    try {
      const params = req.body || {};
      const sunoEnabled = params.sunoEnabled !== false;
      const museEnabled = params.museEnabled === true;
      const autoGenerateLyrics = params.autoGenerateLyrics !== false;

      logger.info(`Agent generate: Suno=${sunoEnabled}, Muse=${museEnabled}, autoLyrics=${autoGenerateLyrics}`);

      const result = {
        success: true,
        taskId: `music_agent_${Date.now()}`,
        providers: {}
      };

      // Suno AI
      if (sunoEnabled) {
        if (!sunoService.isConfigured()) {
          return res.status(400).json({
            success: false,
            error: 'Suno API not configured. Set SUNO_CN_API_KEY in .env file.'
          });
        }
        try {
          const styleInfo = MUSIC_STYLES[params.style] || MUSIC_STYLES.pop;
          const sunoPrompt = buildSunoPrompt({
            prompt: params.lyrics || params.prompt || 'A beautiful song',
            style: params.style || 'pop',
            genre: params.genre || 'pop',
            theme: params.theme || 'love',
            bpm: params.bpm || 120,
            duration: params.duration || 60
          });
          const combinedTags = `${styleInfo.sunoTags}, ${params.genre || ''}`;
          result.providers.suno = await sunoService.generateMusic(
            sunoPrompt,
            combinedTags,
            params.duration || 60
          );
        } catch (error) {
          result.providers.suno = { success: false, error: error.message };
        }
      }

      // Muse AI
      if (museEnabled) {
        if (!museService.isConfigured()) {
          return res.status(400).json({
            success: false,
            error: 'Muse API not configured. Set MUSE_API_KEY in .env file.'
          });
        }
        try {
          const museCommand = museService.generateMuseCommand({
            genre: params.genre || '流行',
            style: params.style || '现代',
            bpm: params.bpm || 122,
            theme: params.theme || '爱情',
            mood: params.mood || '温暖',
            elements: params.elements || '热带打击乐',
            subStyle: params.subStyle || '浩室'
          });
          result.providers.muse = await museService.generateMusic(museCommand, {
            duration: params.duration || 60,
            style: params.style || 'auto',
            quality: params.quality || 'high'
          });
        } catch (error) {
          result.providers.muse = { success: false, error: error.message };
        }
      }

      generationHistory.add('music', { params, result });
      return res.json(result);
    } catch (error) {
      logger.error(`Agent generate error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new MusicController();
