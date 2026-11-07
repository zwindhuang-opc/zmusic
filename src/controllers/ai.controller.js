/**
 * AIController - "AI 生词" 文案生成接口
 *
 * 提供 POST /api/ai/captions，为各页面的文本输入框生成候选文案。
 *
 * @module controllers/ai.controller
 * @version 1.0.0
 * @author ZMusic Team
 */

import captionService from '../services/caption.service.js';
import Logger from '../utils/logger.js';

const logger = new Logger('AIController');

export class AIController {
  /**
   * 生成候选文案。
   *
   * 请求体：{ kind, seed, title, style, lang, count }
   * 响应：  { success: true, captions: [...], source: 'llm'|'local' }
   *
   * @param {object} req
   * @param {object} res
   */
  async captions(req, res) {
    try {
      const { kind, seed, title, style, lang, count } = req.body || {};
      const result = await captionService.generateCaptions({
        kind, seed, title, style, lang, count,
      });
      res.status(200).json({ success: true, ...result });
    } catch (e) {
      logger.error(`[AI 生词] 生成失败：${e.message}`);
      res.status(500).json({ success: false, error: e.message });
    }
  }
}

export default new AIController();
