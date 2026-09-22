/**
 * ImageGenController - AI 图像生成请求控制器
 *
 * 处理封面图、场景图、缩略图等 AI 图像生成请求。
 * 作为 MVC 架构中的控制器层，协调 ImageGenService 完成图像生成任务。
 *
 * 端点设计：
 *   - POST /api/image/generate  - 生成图像（返回可直接使用的 URL）
 *   - GET  /api/image/sizes     - 获取支持的图像尺寸列表
 *   - GET  /api/image/proxy     - 代理外部图像 URL（绕过 CORS）
 *
 * @module controllers/imageGen.controller
 * @version 1.0.0
 * @author ZMusic Team
 */

import imageGenService from '../services/imageGen.service.js';
import Logger from '../utils/logger.js';

const logger = new Logger('ImageGenController');

/**
 * 图像生成控制器类
 */
export class ImageGenController {
  /**
   * POST /api/image/generate - 生成图像 URL
   *
   * 请求体：
   *   - title:         歌曲/MV 标题
   *   - genre:         音乐流派（pop/rock/...）
   *   - style:         视觉风格（cinematic/modern/...）
   *   - colorPalette:  调色板（purple_pink_gradient/...）
   *   - lyrics:        歌词文本（用于提取关键词）
   *   - customPrompt:  自定义提示词（最高优先级）
   *   - scene:         场景描述
   *   - imageSize:     图像尺寸（默认 'landscape_16_9'）
   *
   * 响应：
   *   - success: true
   *   - data: { imageUrl, prompt, imageSize }
   *     - imageUrl: 可直接作为 <img src> 的 URL
   *     - prompt:   实际使用的 SDXL 提示词
   *     - imageSize: 使用的图像尺寸
   *
   * @async
   * @param {Object} req - HTTP 请求对象
   * @param {Object} res - HTTP 响应对象
   * @returns {Promise<Object>}
   */
  async generate(req, res) {
    try {
      const params = req.body || {};
      logger.info(`Image generate request: genre=${params.genre}, style=${params.style}, palette=${params.colorPalette}, size=${params.imageSize}`);

      const result = imageGenService.buildImageUrl(params);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error(`Generate image error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/image/sizes - 获取支持的图像尺寸列表
   *
   * @async
   * @param {Object} req
   * @param {Object} res
   */
  async getSizes(req, res) {
    try {
      return res.json({
        success: true,
        data: imageGenService.getSupportedImageSizes(),
      });
    } catch (error) {
      logger.error(`Get sizes error: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/image/proxy - 代理外部图像 URL（绕过 CORS）
   *
   * 查询参数：
   *   - url: 要代理的图像 URL
   *
   * 直接返回图像二进制，Content-Type 设置为图像 MIME 类型
   *
   * @async
   * @param {Object} req
   * @param {Object} res
   */
  async proxy(req, res, url) {
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) {
      return res.status(400).json({ success: false, error: 'Missing url parameter' });
    }

    try {
      logger.info(`Proxying image: ${targetUrl.substring(0, 100)}...`);
      const response = await fetch(targetUrl, {
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'Mozilla/5.0 (compatible; ZMusicBot/1.0)',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `Upstream ${response.status}`,
        });
      }

      const contentType = response.headers.get('content-type') || 'image/png';
      const contentLength = response.headers.get('content-length');

      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch (e) {
      logger.error(`Image proxy error: ${e.message}`);
      return res.status(502).json({ success: false, error: e.message });
    }
  }
}

/**
 * 默认导出 - 单例实例
 */
export default new ImageGenController();
