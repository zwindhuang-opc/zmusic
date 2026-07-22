/**
 * VisionController - 图片分析控制器
 *
 * 处理图片上传和分析请求，提取音乐创作相关的关键词。
 *
 * @module controllers/vision.controller
 * @version 1.0.0
 * @author ZMusic Team
 */

import visionService from '../services/vision.service.js';
import Logger from '../utils/logger.js';

const logger = new Logger('VisionController');

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

export class VisionController {
  async analyze(req, res) {
    try {
      let rawBody = req.body;
      let mimeType = 'image/jpeg';

      if (req.headers) {
        mimeType = req.headers['content-type'] || req.headers['Content-Type'] || 'image/jpeg';
      }

      if (typeof rawBody === 'string') {
        if (rawBody.startsWith('data:image')) {
          const match = rawBody.match(/^data:(image\/[^;]+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            rawBody = Buffer.from(match[2], 'base64');
          } else {
            return res.status(400).json({ success: false, error: 'Invalid base64 image format' });
          }
        } else {
          rawBody = Buffer.from(rawBody, 'base64');
        }
      }

      if (rawBody && rawBody.type === 'Buffer' && Array.isArray(rawBody.data)) {
        rawBody = Buffer.from(rawBody.data);
      }

      if (!Buffer.isBuffer(rawBody)) {
        if (typeof rawBody === 'object' && rawBody.image) {
          if (typeof rawBody.image === 'string' && rawBody.image.startsWith('data:image')) {
            const match = rawBody.image.match(/^data:(image\/[^;]+);base64,(.+)$/);
            if (match) {
              mimeType = match[1];
              rawBody = Buffer.from(match[2], 'base64');
            }
          } else if (typeof rawBody.image === 'string') {
            rawBody = Buffer.from(rawBody.image, 'base64');
          }
        }
      }

      if (!Buffer.isBuffer(rawBody)) {
        return res.status(400).json({ success: false, error: 'Invalid image data. Send as binary, base64, or JSON with image field.' });
      }

      if (rawBody.length > MAX_IMAGE_SIZE) {
        return res.status(400).json({
          success: false,
          error: `Image too large. Max ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
        });
      }

      if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: `Unsupported image type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
        });
      }

      logger.info(`Analyzing image: ${rawBody.length} bytes, ${mimeType}`);
      const result = await visionService.analyzeImage(rawBody, mimeType);

      return res.json({ success: true, data: result });
    } catch (error) {
      logger.error(`Analyze error: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new VisionController();
