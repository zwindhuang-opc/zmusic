/**
 * MusicController - 音乐生成请求控制器（双引擎便捷入口）
 *
 * 本控制器处理音乐生成相关的 API 请求，支持 Suno AI / Muse AI 双提供商，
 * 以及基于代理的智能生成模式。作为 MVC 架构中的控制器层，
 * 通过组合各引擎控制器（suno.controller / muse.controller）完成生成任务。
 *
 * 实现说明（重要）：
 *   早期的实现直接 import 了 `services/suno.service.js` 与
 *   `services/muse.service.js`，但这两个模块是**前端客户端**——它们用相对
 *   路径（`/api/suno/...`、`/api/muse/...`）去 fetch 自己的后端代理。
 *   在 Node 环境下 fetch 无法解析相对 URL，因此 `/api/music/*` 必然报
 *   "Failed to parse URL from /api/suno/generate"（见 ISSUE_LOG I019）。
 *
 *   现在改为服务端组合：直接调用各引擎控制器暴露的 (req, res) 处理器，
 *   通过 `invokeController()` 捕获其 JSON 响应，无需额外的 HTTP 往返，
 *   也保证 `/api/music/*` 与 `/api/suno/*`、`/api/muse/*` 行为一致。
 *
 * @module controllers/music.controller
 * @version 2.0.0
 * @author ZMusic Team
 */

import sunoController from './suno.controller.js';
import museController from './muse.controller.js';
import generationHistory from '../services/generation.history.js';
import { config } from '../config/index.js';
import { buildSunoPrompt, MUSIC_STYLES } from '../config/musicStyles.js';
import Logger from '../utils/logger.js';

/**
 * 日志记录器实例
 * @type {Logger}
 */
const logger = new Logger('MusicController');

/**
 * 以 (req, res) 形式调用另一个控制器，并捕获其写出的状态码与 JSON 响应体。
 *
 * 说明：被调用的控制器内部可能使用 `this`（例如 muse.controller 的
 * `sendMuseResult`），因此必须保持实例绑定调用，不能把方法单独取出。
 *
 * @param {Object} controller - 控制器实例（sunoController / museController）
 * @param {string} method - 控制器上的方法名
 * @param {Object} body - 传给控制器的请求体
 * @returns {Promise<{statusCode: number, payload: any}>} 捕获到的响应
 */
async function invokeController(controller, method, body) {
  let statusCode = 200;
  let payload = null;

  // 最小可用的响应替身：只实现控制器实际使用到的方法。
  const res = {
    status(code) { statusCode = code; return this; },
    json(data) { payload = data; return this; },
    send(data) { payload = data; return this; },
    setHeader() { return this; },
    end(data) { if (data !== undefined) payload = data; return this; },
  };

  const req = { body: body || {}, params: {}, query: {} };
  await controller[method](req, res);

  return { statusCode, payload };
}

/**
 * 从被捕获的响应中提取错误信息。
 * @param {any} payload
 * @returns {string|null} 错误信息，无错误时为 null
 */
function extractError(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const msg = payload.error || payload.message || payload.msg || payload.data?.error;
  return msg ? String(msg) : null;
}

/**
 * 音乐生成控制器类
 *
 * 提供音乐生成 API 端点，支持单提供商和双提供商模式。
 *
 * @class MusicController
 */
export class MusicController {
  /**
   * POST /api/music/generate - 生成音乐（Suno AI）
   *
   * @async
   * @param {Object} req - HTTP 请求对象
   * @param {string} [req.body.prompt='A happy song'] - 音乐描述提示
   * @param {string} [req.body.style='pop'] - 音乐风格
   * @param {number} [req.body.duration=60] - 时长（秒）
   * @param {string} [req.body.model] - Suno 模型版本（v6 / v6-wild / v6-mini）
   * @param {Object} res - HTTP 响应对象
   * @returns {Promise<Object>} 生成结果 JSON 响应
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
      const { prompt = 'A happy song', style = 'pop', duration = 60, model } = req.body || {};
      logger.info(`Generate request: prompt="${prompt}", style=${style}, duration=${duration}`);

      if (!config.sunoApiKey) {
        return res.status(400).json({
          success: false,
          error: 'Suno API key not configured. Please set SUNO_CN_API_KEY in .env file.'
        });
      }

      const { statusCode, payload } = await invokeController(sunoController, 'generate', {
        prompt, style, duration, model,
      });

      const error = extractError(payload);
      if (error || statusCode >= 400) {
        const status = statusCode >= 400 ? statusCode : 502;
        logger.error(`Generate error: ${error || `HTTP ${status}`}`);
        return res.status(status).json({ success: false, error: error || `Suno API error: ${status}` });
      }

      generationHistory.add('music', { params: { prompt, style, duration, model }, result: payload });
      return res.json({ success: true, data: payload });
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
   *
   * @async
   * @param {Object} req - HTTP 请求对象
   * @param {boolean} [req.body.sunoEnabled=true] - 是否启用 Suno
   * @param {boolean} [req.body.museEnabled=false] - 是否启用 Muse
   * @param {Object} res - HTTP 响应对象
   * @returns {Promise<Object>} { success, taskId, providers }
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

      // Suno AI — 复用 suno.controller 的上游（https://mcp.suno.cn）调用逻辑
      if (sunoEnabled) {
        if (!config.sunoApiKey) {
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

          const { statusCode, payload } = await invokeController(sunoController, 'generate', {
            prompt: sunoPrompt,
            style: combinedTags,
            duration: params.duration || 60,
            model: params.model,
            title: params.title,
          });

          const error = extractError(payload);
          result.providers.suno = (error || statusCode >= 400)
            ? { success: false, error: error || `HTTP ${statusCode}` }
            : { success: true, data: payload };
        } catch (error) {
          result.providers.suno = { success: false, error: error.message };
        }
      }

      // Muse AI — 复用 muse.controller 的生成逻辑（需 CDP 浏览器会话）
      if (museEnabled) {
        if (!config.museApiKey) {
          return res.status(400).json({
            success: false,
            error: 'Muse API not configured. Set MUSE_API_KEY in .env file.'
          });
        }
        try {
          const { statusCode, payload } = await invokeController(museController, 'generate', {
            mode: 'quick',
            prompt: params.lyrics || params.prompt || 'A beautiful song',
            style: params.style || '',
            instrumental: params.instrumental === true,
            duration: params.duration || 60,
            songModel: params.songModel || 'general',
          });

          const error = extractError(payload);
          result.providers.muse = (error || statusCode >= 400)
            ? { success: false, error: error || `HTTP ${statusCode}` }
            : { success: true, data: payload?.data ?? payload };
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
