/**
 * PublishController — /api/publish/* endpoints
 *
 * Handles:
 *   - Douyin (抖音) video/music publishing via open-platform API
 *   - 汽水音乐 (Qishui) audio publishing fallback
 *   - File export helpers (ZIP, cover+metadata+audio bundles)
 *
 * V7.2.0 feature
 */

import DouyinService from '../services/douyin.service.js';
import Logger from '../utils/logger.js';

const logger = new Logger('Publish');

class PublishController {
  /**
   * GET /api/publish/status
   * Check Douyin configuration status + account info
   */
  async status(req, res) {
    try {
      const token = await DouyinService.getAppAccessToken();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        configured: !!token,
        account: {
          id: DouyinService.DEFAULTS.accountId,
          name: DouyinService.DEFAULTS.accountName,
          hasSecret: !!(DouyinService.DEFAULTS.clientKey && DouyinService.DEFAULTS.clientSecret),
        },
      }));
    } catch (e) {
      logger.error(`status failed: ${e.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  /**
   * POST /api/publish/suggest-hashtags
   * Suggest hashtags for a song given its metadata
   */
  async suggestHashtags(req, res) {
    try {
      const { style = '', theme = '', engine = '' } = req.body || {};
      const tags = DouyinService.suggestHashtags({ style, theme, engine });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, hashtags: tags }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  /**
   * POST /api/publish/douyin/video
   * Initiate Douyin video publishing
   * Body: { title, description, hashtags, videoUrl (fetchable from storage), audioUrl (optional) }
   *
   * Since real video bytes may be large, we:
   *   1. Return a publish task + temp URL
   *   2. Frontend can fallback: prepare downloadable bundle with step-by-step upload manual
   */
  async publishVideo(req, res) {
    try {
      const {
        title = 'ZMusic_' + Date.now(),
        description = '',
        hashtags = [],
        audioUrl = null,
        videoUrl = null,
        fileSize = 0,
        mimeType = '',
      } = req.body || {};

      // Attempt real Douyin API if configured
      let publishResult = null;
      const hasConfig = !!(DouyinService.DEFAULTS.clientKey && DouyinService.DEFAULTS.clientSecret);

      if (hasConfig && fileSize > 0) {
        publishResult = await DouyinService.initVideoUpload({
          title, size_bytes: fileSize, mime_type: mimeType,
        });
      } else {
        publishResult = {
          success: false,
          fallback: true,
          error: 'douyin.requires_manual_upload',
        };
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: !!publishResult.success,
        uploadId: publishResult.uploadId || null,
        fallback: publishResult.fallback || false,
        error: publishResult.error || null,
        recommendedTags: DouyinService.suggestHashtags({ style: hashtags?.[0] || '', theme: hashtags?.[1] || '', engine: 'ZMusic' }),
        manualSteps: [
          '1. 下载下方的音频/视频文件 + 封面图',
          '2. 打开抖音创作者服务平台 https://creator.douyin.com',
          '3. 登录账号：ZMUSIC（抖音号 z.music.z，密码 vgbzg92x）',
          '4. 选择"视频发布"或"音乐上传"',
          '5. 上传文件，粘贴标题、描述、标签',
          '6. 点击"发布"',
        ],
      }));
    } catch (e) {
      logger.error(`publishVideo failed: ${e.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  /**
   * POST /api/publish/qishui/track
   * Qishui publishing — currently returns manual upload bundle instructions
   * Qishui uses TME Musician backend
   */
  async publishQishui(req, res) {
    try {
      const { title = '', author = 'ZMUSIC', style = '' } = req.body || {};
      const qishui = await DouyinService.publishToQishui({
        title, author, onProgress: () => {},
      });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: !!qishui.success,
        fallback: qishui.fallback,
        error: qishui.error || null,
        metadata: { title, author, style },
        manualSteps: [
          '1. 下载 MP3 文件和封面图',
          '2. 访问汽水音乐创作者后台 https://musician.douyin.com',
          '3. 使用 ZMUSIC 账号登录（同抖音账号 ZMUSIC / z.music.z）',
          '4. 选择"上传单曲"',
          '5. 填写词曲作者、风格、歌词、版权信息',
          '6. 提交审核（通常 24-72 小时）',
        ],
      }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  /**
   * GET /api/publish/download-url?songId=xxx
   * Returns a signed / temporary URL for downloading a generated song file
   * (Proxies through Netlify to bypass CORS and inject headers for MP3/MP4 downloads)
   */
  async getDownloadUrl(req, res, url) {
    try {
      const songId = url.searchParams.get('songId');
      const audioUrl = url.searchParams.get('audioUrl');
      const videoUrl = url.searchParams.get('videoUrl');
      const filename = url.searchParams.get('filename') || `ZMusic-${songId || Date.now()}`;

      const targetUrl = videoUrl || audioUrl || '';
      if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, error: 'missing_url' }));
      }

      // Stream the remote file to client with proper download headers
      const fetch = await import('node-fetch').then(m => m.default || m);
      const remote = await fetch(targetUrl);
      const ct = remote.headers.get('content-type') || 'application/octet-stream';
      const disposition = `attachment; filename="${encodeURIComponent(filename)}"`;

      res.writeHead(200, {
        'Content-Type': ct,
        'Content-Disposition': disposition,
        'Access-Control-Allow-Origin': '*',
      });
      remote.body.pipe(res);
    } catch (e) {
      logger.error(`getDownloadUrl failed: ${e.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }
}

export default new PublishController();