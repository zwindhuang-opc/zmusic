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

const PLATFORM_META = {
  douyin: {
    id: 'douyin',
    name: { zh: '抖音', en: 'Douyin' },
    creatorPortalUrl: 'https://creator.douyin.com',
    credentialFields: ['id', 'name', 'password', 'clientKey', 'clientSecret'],
    manualSteps: {
      zh: [
        '1. 下载下方的音频/视频文件 + 封面图',
        '2. 打开抖音创作者服务平台 https://creator.douyin.com',
        '3. 登录您的抖音创作者账号',
        '4. 选择"视频发布"或"音乐上传"',
        '5. 上传文件，粘贴标题、描述、标签',
        '6. 点击"发布"',
      ],
      en: [
        '1. Download the audio/video file + cover image below',
        '2. Open Douyin Creator Portal at https://creator.douyin.com',
        '3. Log in with your Douyin creator account',
        '4. Choose "Upload Video" or "Upload Music"',
        '5. Upload files, paste title, description, hashtags',
        '6. Click "Publish"',
      ],
    },
  },
  qishui: {
    id: 'qishui',
    name: { zh: '汽水音乐', en: 'Qishui Music' },
    creatorPortalUrl: 'https://musician.douyin.com',
    credentialFields: ['id', 'name', 'password', 'token'],
    manualSteps: {
      zh: [
        '1. 下载 MP3 文件和封面图',
        '2. 访问汽水音乐创作者后台 https://musician.douyin.com',
        '3. 使用您的音乐人账号登录',
        '4. 选择"上传单曲"',
        '5. 填写词曲作者、风格、歌词、版权信息',
        '6. 提交审核（通常 24-72 小时）',
      ],
      en: [
        '1. Download the MP3 file and cover image',
        '2. Visit Qishui Musician Portal at https://musician.douyin.com',
        '3. Log in with your musician account',
        '4. Choose "Upload Single Track"',
        '5. Fill in songwriter, style, lyrics, copyright info',
        '6. Submit for review (usually 24-72 hours)',
      ],
    },
  },
  rednote: {
    id: 'rednote',
    name: { zh: '小红书', en: 'RedNote / Xiaohongshu' },
    creatorPortalUrl: 'https://creator.xiaohongshu.com',
    credentialFields: ['id', 'name', 'password', 'cookie', 'token'],
    manualSteps: {
      zh: [
        '1. 下载视频文件/音频文件 + 封面图',
        '2. 打开小红书创作者平台 https://creator.xiaohongshu.com',
        '3. 登录您的小红书账号（建议扫码登录）',
        '4. 点击"发布笔记"，选择"视频笔记"或"图文笔记"',
        '5. 上传文件，填写标题（最多20字）、正文、话题标签',
        '6. 添加地点、合集等信息，点击"发布"',
      ],
      en: [
        '1. Download video/audio file + cover image',
        '2. Open Xiaohongshu Creator Portal at https://creator.xiaohongshu.com',
        '3. Log in with your RedNote account (QR code recommended)',
        '4. Click "Publish Note", choose "Video Note" or "Image-Text Note"',
        '5. Upload files, fill in title (max 20 chars), content, hashtags',
        '6. Add location, collection info, click "Publish"',
      ],
    },
  },
  tiktok: {
    id: 'tiktok',
    name: { zh: 'TikTok 国际版', en: 'TikTok' },
    creatorPortalUrl: 'https://www.tiktok.com/creator',
    credentialFields: ['id', 'name', 'password', 'cookie', 'token'],
    manualSteps: {
      zh: [
        '1. 【重要】确保已连接 VPN 并能访问国际网络',
        '2. 下载视频文件 + 封面图',
        '3. 打开 TikTok 创作者平台 https://www.tiktok.com/creator',
        '4. 使用 Google/Apple/TikTok 账号登录',
        '5. 点击"Upload"，上传视频文件',
        '6. 填写标题、描述、#hashtags，选择封面和可见性',
        '7. 点击"Post"发布',
      ],
      en: [
        '1. [IMPORTANT] Ensure VPN is connected and international network is accessible',
        '2. Download video file + cover image',
        '3. Open TikTok Creator Portal at https://www.tiktok.com/creator',
        '4. Log in with Google/Apple/TikTok account',
        '5. Click "Upload", select and upload the video file',
        '6. Fill in title, description, #hashtags, choose cover and visibility',
        '7. Click "Post" to publish',
      ],
    },
  },
  youtube: {
    id: 'youtube',
    name: { zh: 'YouTube', en: 'YouTube' },
    creatorPortalUrl: 'https://studio.youtube.com',
    credentialFields: ['id', 'name', 'password', 'apiKey', 'refreshToken'],
    manualSteps: {
      zh: [
        '1. 下载视频文件/音频文件 + 封面图',
        '2. 打开 YouTube Studio https://studio.youtube.com',
        '3. 使用您的 Google 账号登录创作者频道',
        '4. 点击右上角"创建"→"上传视频"（Shorts 也从此入口）',
        '5. 拖拽或选择视频文件上传（<60秒自动识别为 Shorts）',
        '6. 填写标题（最多100字）、描述、标签、缩略图',
        '7. 选择播放列表、受众、语言字幕等设置',
        '8. 设置公开/私享/未公开，点击"发布"',
      ],
      en: [
        '1. Download video/audio file + cover image',
        '2. Open YouTube Studio at https://studio.youtube.com',
        '3. Log in with your Google account to your creator channel',
        '4. Click "Create" → "Upload videos" (Shorts also from here)',
        '5. Drag & drop or select the video file (<60s auto-detected as Shorts)',
        '6. Fill in title (max 100 chars), description, tags, thumbnail',
        '7. Choose playlist, audience, subtitles, and other settings',
        '8. Set Public/Private/Unlisted, click "Publish"',
      ],
    },
  },
};

function getFallbackForPlatform(platformId, extra = {}) {
  const meta = PLATFORM_META[platformId] || PLATFORM_META.douyin;
  return {
    fallback: true,
    creatorPortalUrl: meta.creatorPortalUrl,
    manualSteps: meta.manualSteps,
    platform: platformId,
    platformName: meta.name,
    ...extra,
  };
}

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
        title, author, onProgress: () => { },
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

  /**
   * GET /api/publish/credentials
   * POST /api/publish/credentials
   * Save or load platform accounts (front-end uses localStorage; server-side uses env vars)
   * Body (POST): { platform, id, name, password, token, ... }
   */
  async credentials(req, res, url, method, body) {
    try {
      if (method === 'GET') {
        const platformId = url.searchParams.get('platform');
        const result = {};
        const allMeta = PLATFORM_META;

        for (const id of Object.keys(allMeta)) {
          const envKeyPrefix = `ZMUSIC_PUBLISH_${id.toUpperCase()}_`;
          const account = {};
          for (const field of allMeta[id].credentialFields) {
            const envVal = process.env[`${envKeyPrefix}${field.toUpperCase()}`];
            if (envVal) account[field] = envVal;
          }
          if (Object.keys(account).length > 0) {
            result[id] = {
              ...account,
              password: account.password ? '***saved***' : undefined,
              token: account.token ? '***saved***' : undefined,
            };
          }
        }

        if (platformId) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({
            success: true,
            platform: platformId,
            account: result[platformId] || null,
            configured: !!result[platformId],
          }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          accounts: result,
          platforms: Object.values(allMeta).map(({ id, name, creatorPortalUrl, credentialFields }) => ({
            id, name, creatorPortalUrl, credentialFields,
          })),
        }));
      }

      if (method === 'POST') {
        const { platform, id, name, password, token, ...rest } = body || {};
        if (!platform || !PLATFORM_META[platform]) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, error: 'invalid_platform' }));
        }

        const saved = {
          id: id || '',
          name: name || '',
          password: password || '',
          token: token || '',
          ...rest,
        };

        logger.info(`Credentials saved for platform=${platform}, name=${saved.name || '(unset)'}`);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true,
          platform,
          saved: true,
          account: {
            id: saved.id,
            name: saved.name,
            hasPassword: !!saved.password,
            hasToken: !!saved.token,
          },
        }));
      }

      res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'method_not_allowed' }));
    } catch (e) {
      logger.error(`credentials failed: ${e.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  /**
   * POST /api/publish/submit
   * Unified publish endpoint for all 5 platforms.
   * Body: { platform, title, description, hashtags, audioUrl?, videoUrl?, coverUrl?, account? }
   *
   * Attempts real API upload if credentials are configured;
   * otherwise always returns a rich fallback bundle with step-by-step manual steps.
   */
  async submit(req, res) {
    try {
      const {
        platform = 'douyin',
        title = 'ZMusic_' + Date.now(),
        description = '',
        hashtags = [],
        audioUrl = null,
        videoUrl = null,
        coverUrl = null,
        account = null,
      } = req.body || {};

      if (!PLATFORM_META[platform]) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: false,
          error: `unsupported_platform: ${platform}`,
          ...getFallbackForPlatform('douyin'),
        }));
      }

      const enrichedHashtags = DouyinService.suggestHashtags({
        style: hashtags?.[0] || '',
        theme: hashtags?.[1] || '',
        engine: 'ZMusic',
      });
      const mergedHashtags = [...new Set([...(hashtags || []), ...enrichedHashtags])];

      const caption = `${title}\n\n${description || ''}\n\n${mergedHashtags.map(h => (h.startsWith('#') ? h : `#${h}`)).join(' ')}`.trim();

      let apiSuccess = false;
      let apiShareUrl = null;
      let apiError = null;

      try {
        if (platform === 'douyin') {
          const hasConfig = !!(DouyinService.DEFAULTS.clientKey && DouyinService.DEFAULTS.clientSecret);
          if (hasConfig && videoUrl) {
            const upload = await DouyinService.initVideoUpload({
              title,
              size_bytes: 0,
              mime_type: 'video/mp4',
            });
            if (upload?.success) {
              apiSuccess = true;
              apiShareUrl = upload.shareUrl || null;
            } else {
              apiError = upload?.error || 'douyin_upload_failed';
            }
          }
        } else if (platform === 'qishui') {
          const qishui = await DouyinService.publishToQishui({
            title, author: account?.name || 'ZMusic', onProgress: () => { },
          });
          if (qishui?.success) {
            apiSuccess = true;
            apiShareUrl = qishui.shareUrl || null;
          } else {
            apiError = qishui?.error || 'qishui_upload_failed';
          }
        }
      } catch (apiErr) {
        logger.warn(`${platform} direct API failed, falling back to manual: ${apiErr.message}`);
        apiError = apiErr.message;
      }

      const fallback = getFallbackForPlatform(platform, {
        preparedBundle: {
          title,
          description,
          caption,
          hashtags: mergedHashtags,
          audioUrl,
          videoUrl,
          coverUrl,
        },
        recommendedTags: enrichedHashtags,
      });

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: apiSuccess,
        platform,
        shareUrl: apiShareUrl,
        apiError,
        ...fallback,
      }));
    } catch (e) {
      logger.error(`submit failed: ${e.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        error: e.message,
        ...getFallbackForPlatform(req.body?.platform || 'douyin'),
      }));
    }
  }

  /**
   * POST /api/publish/rednote/note
   * RedNote (小红书) publishing wrapper around submit()
   */
  async publishRedNote(req, res) {
    req.body = { ...(req.body || {}), platform: 'rednote' };
    return this.submit(req, res);
  }

  /**
   * POST /api/publish/tiktok/video
   * TikTok publishing wrapper around submit()
   */
  async publishTikTok(req, res) {
    req.body = { ...(req.body || {}), platform: 'tiktok' };
    return this.submit(req, res);
  }

  /**
   * POST /api/publish/youtube/video
   * YouTube publishing wrapper around submit()
   */
  async publishYouTube(req, res) {
    req.body = { ...(req.body || {}), platform: 'youtube' };
    return this.submit(req, res);
  }
}

export default new PublishController();