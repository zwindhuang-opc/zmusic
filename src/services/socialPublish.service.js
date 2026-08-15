import DouyinService from './douyin.service.js';

const STORAGE_KEY = 'zmusic_publish_accounts';
let _memoryStore = {};

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function configStore(platformId) {
  return {
    get() {
      try {
        if (isBrowser()) {
          const raw = localStorage.getItem(STORAGE_KEY);
          const all = raw ? JSON.parse(raw) : {};
          return all[platformId] || {};
        }
        return _memoryStore[platformId] || {};
      } catch (e) {
        return _memoryStore[platformId] || {};
      }
    },
    set(obj) {
      try {
        if (isBrowser()) {
          const raw = localStorage.getItem(STORAGE_KEY);
          const all = raw ? JSON.parse(raw) : {};
          all[platformId] = { ...all[platformId], ...obj };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        }
        _memoryStore[platformId] = { ...(_memoryStore[platformId] || {}), ...obj };
      } catch (e) {
        _memoryStore[platformId] = { ...(_memoryStore[platformId] || {}), ...obj };
      }
    }
  };
}

function getCredentials(platformId) {
  return configStore(platformId).get();
}

function saveCredentials(platformId, obj) {
  configStore(platformId).set(obj);
}

function deleteCredentials(platformId) {
  try {
    if (isBrowser()) {
      const raw = localStorage.getItem(STORAGE_KEY);
      const all = raw ? JSON.parse(raw) : {};
      delete all[platformId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
    delete _memoryStore[platformId];
  } catch (e) {
    delete _memoryStore[platformId];
  }
}

function suggestHashtags(platform, { style = '', theme = '', engine = '' }) {
  const base = DouyinService.suggestHashtags({ style, theme, engine });
  const platformTags = {
    douyin: ['抖音热门', '抖音音乐'],
    qishui: ['汽水音乐', '汽水音乐人'],
    rednote: ['小红书', '小红书音乐', '种草音乐'],
    tiktok: ['TikTok', 'TikTokMusic', 'ViralMusic'],
    youtube: ['YouTubeMusic', 'MusicVideo', 'NewMusic'],
  };
  return [...base, ...(platformTags[platform] || [])].filter(Boolean);
}

const PLATFORM_META = {
  douyin: {
    id: 'douyin',
    name: { zh: '抖音', en: 'Douyin' },
    color: 'from-rose-500 to-pink-600',
    iconHint: 'Video',
    defaultAccount: { id: 'z.music.z', name: 'ZMUSIC', password: 'vgbzg92x' },
    creatorPortalUrl: 'https://creator.douyin.com',
    manualSteps: {
      zh: [
        '下载下方的音频/视频文件和封面图',
        '打开抖音创作者服务平台 https://creator.douyin.com',
        '使用账号登录（账号 ID / 密码可在设置页面配置）',
        '选择"视频发布"或"音乐上传"入口',
        '上传文件，粘贴已准备好的标题、描述、标签',
        '选择合适的封面，点击"发布"',
      ],
      en: [
        'Download the audio/video file and cover image below',
        'Open Douyin Creator Portal at https://creator.douyin.com',
        'Sign in with your account (configure ID/password in Settings)',
        'Choose "Video Publish" or "Music Upload"',
        'Upload the file, paste prepared title, description and hashtags',
        'Select appropriate cover and click "Publish"',
      ],
    },
    credentialFields: ['id', 'name', 'password'],
  },
  qishui: {
    id: 'qishui',
    name: { zh: '汽水音乐', en: 'Qishui Music' },
    color: 'from-cyan-500 to-blue-600',
    iconHint: 'Music2',
    defaultAccount: { id: 'z.music.z', name: 'ZMUSIC' },
    creatorPortalUrl: 'https://musician.douyin.com',
    manualSteps: {
      zh: [
        '下载 MP3 文件和封面图',
        '访问汽水音乐创作者后台 https://musician.douyin.com',
        '使用配置好的账号登录（同抖音账号）',
        '选择"上传单曲"入口',
        '填写词曲作者、风格标签、歌词、版权信息',
        '上传 MP3 和封面，提交审核（通常 24-72 小时）',
      ],
      en: [
        'Download the MP3 file and cover image',
        'Go to Qishui Musician Portal at https://musician.douyin.com',
        'Sign in with configured account (same as Douyin)',
        'Choose "Upload Single"',
        'Fill in songwriter, style tags, lyrics, copyright info',
        'Upload MP3 and cover, submit for review (usually 24-72h)',
      ],
    },
    credentialFields: ['id', 'name'],
  },
  rednote: {
    id: 'rednote',
    name: { zh: '小红书', en: 'RedNote' },
    color: 'from-red-500 to-rose-600',
    iconHint: 'BookOpen',
    defaultAccount: { id: '', name: '', password: '' },
    creatorPortalUrl: 'https://creator.xiaohongshu.com',
    manualSteps: {
      zh: [
        '下载视频文件（推荐竖版 9:16）、MP3 和封面图',
        '打开小红书创作者平台 https://creator.xiaohongshu.com',
        '登录配置的小红书账号',
        '选择"图文笔记"或"视频笔记"入口',
        '上传视频或图片+音频，填写标题和正文',
        '添加话题标签（AI已为你准备推荐标签）',
        '点击"发布"完成小红书笔记发布',
      ],
      en: [
        'Download video (portrait 9:16 recommended), MP3 and cover',
        'Open RedNote Creator Portal at https://creator.xiaohongshu.com',
        'Sign in with your configured RedNote account',
        'Choose "Image Note" or "Video Note" to create',
        'Upload video or images + audio, fill in title and body',
        'Add hashtag topics (AI has prepared recommended tags for you)',
        'Click "Publish" to finish posting to RedNote',
      ],
    },
    credentialFields: ['id', 'name', 'password'],
  },
  tiktok: {
    id: 'tiktok',
    name: { zh: 'TikTok', en: 'TikTok' },
    color: 'from-slate-900 via-fuchsia-500 to-cyan-400',
    iconHint: 'Zap',
    defaultAccount: { id: '', name: '', password: '' },
    creatorPortalUrl: 'https://www.tiktok.com/creator',
    manualSteps: {
      zh: [
        '⚠️ 请确保已连接可访问 TikTok 的 VPN/代理网络',
        '下载视频文件（推荐 9:16 竖版）和 MP3 音频',
        '打开 TikTok 创作者平台 https://www.tiktok.com/creator',
        '登录配置的 TikTok 账号',
        '点击"Upload"上传视频，或使用 TikTok Web 发布工具',
        '填写英文标题、Caption，粘贴推荐的英文 Hashtags',
        '设置封面缩略图，点击"Post"发布',
      ],
      en: [
        '⚠️ Make sure you are connected to a VPN/proxy that can access TikTok',
        'Download video (9:16 portrait recommended) and MP3 audio',
        'Open TikTok Creator Portal at https://www.tiktok.com/creator',
        'Sign in with your configured TikTok account',
        'Click "Upload" to upload video, or use TikTok Web publishing tools',
        'Fill in English title and caption, paste recommended English hashtags',
        'Set cover thumbnail and click "Post" to publish',
      ],
    },
    credentialFields: ['id', 'name', 'password'],
  },
  youtube: {
    id: 'youtube',
    name: { zh: 'YouTube', en: 'YouTube' },
    color: 'from-red-600 to-red-700',
    iconHint: 'Youtube',
    defaultAccount: { id: '', name: '', password: '' },
    creatorPortalUrl: 'https://studio.youtube.com',
    manualSteps: {
      zh: [
        '下载视频文件（推荐 16:9 横版）或 MP3 音频',
        '打开 YouTube Studio https://studio.youtube.com',
        '使用配置的 Google 账号登录',
        '点击右上角"创建"按钮 → "上传视频"',
        '拖拽或选择视频文件上传',
        '填写标题、描述、标签（支持中英双语）',
        '设置自定义封面、分类、播放列表',
        '对于纯音频可上传为音频视频或使用 YouTube Music',
        '选择"公开/不公开/私享"可见性，点击"发布"',
      ],
      en: [
        'Download video (16:9 landscape recommended) or MP3 audio',
        'Open YouTube Studio at https://studio.youtube.com',
        'Sign in with your configured Google account',
        'Click "Create" button in top-right → "Upload videos"',
        'Drag or select video file to upload',
        'Fill in title, description and tags (supports bilingual)',
        'Set custom thumbnail, category and playlists',
        'For audio-only, upload as audio video or use YouTube Music',
        'Choose visibility (Public/Unlisted/Private) and click "Publish"',
      ],
    },
    credentialFields: ['id', 'name', 'password'],
  },
};

async function publishDouyin(platform, payload, onProgress) {
  const { file, title, description, hashtags, coverFile, videoFile } = payload;
  onProgress?.(0.05);
  try {
    const account = getCredentials('douyin');
    const hasApiCreds = !!(DouyinService.DEFAULTS.clientKey && DouyinService.DEFAULTS.clientSecret);
    const workingFile = videoFile || file;

    if (hasApiCreds && workingFile && typeof process !== 'undefined' && process.versions && process.versions.node) {
      onProgress?.(0.1);
      const res = await DouyinService.publishToPlatform({
        file: workingFile,
        title,
        description,
        hashtags,
        platform: 'douyin',
        onProgress,
      });
      if (res?.success) {
        return {
          platform,
          success: true,
          fallback: false,
          shareUrl: res.shareUrl,
          error: null,
          preparedBundle: { title, caption: [title, description, hashtags.map(h => `#${h}`).join(' ')].filter(Boolean).join('\n'), hashtags, file: workingFile },
        };
      }
    }

    onProgress?.(0.95);
    return {
      platform,
      success: false,
      fallback: true,
      error: hasApiCreds ? 'douyin.direct_upload_failed' : 'douyin.requires_manual_upload',
      shareUrl: null,
      manualSteps: PLATFORM_META.douyin.manualSteps,
      creatorPortalUrl: PLATFORM_META.douyin.creatorPortalUrl,
      account: account || PLATFORM_META.douyin.defaultAccount,
      preparedBundle: { title, caption: [title, description, hashtags.map(h => `#${h}`).join(' ')].filter(Boolean).join('\n'), hashtags, file: workingFile },
    };
  } catch (e) {
    return {
      platform,
      success: false,
      fallback: true,
      error: e.message || 'Unknown error',
      manualSteps: PLATFORM_META.douyin.manualSteps,
      creatorPortalUrl: PLATFORM_META.douyin.creatorPortalUrl,
      account: getCredentials('douyin') || PLATFORM_META.douyin.defaultAccount,
      preparedBundle: { title, caption: [title, description, hashtags.map(h => `#${h}`).join(' ')].filter(Boolean).join('\n'), hashtags, file },
    };
  }
}

async function publishQishui(platform, payload, onProgress) {
  const { file, title, description, hashtags } = payload;
  onProgress?.(0.05);
  try {
    onProgress?.(0.2);
    const account = getCredentials('qishui');
    const qishui = await DouyinService.publishToQishui({
      file,
      title,
      author: account?.name || 'ZMUSIC',
      coverBlob: payload.coverFile,
      onProgress,
    });
    onProgress?.(0.95);
    return {
      platform,
      success: !!qishui?.success,
      fallback: true,
      error: qishui?.error || null,
      shareUrl: null,
      manualSteps: PLATFORM_META.qishui.manualSteps,
      creatorPortalUrl: PLATFORM_META.qishui.creatorPortalUrl,
      account: account || PLATFORM_META.qishui.defaultAccount,
      preparedBundle: { title, caption: [title, description, hashtags.map(h => `#${h}`).join(' ')].filter(Boolean).join('\n'), hashtags, file },
    };
  } catch (e) {
    return {
      platform,
      success: false,
      fallback: true,
      error: e.message || 'Unknown error',
      manualSteps: PLATFORM_META.qishui.manualSteps,
      creatorPortalUrl: PLATFORM_META.qishui.creatorPortalUrl,
      account: getCredentials('qishui') || PLATFORM_META.qishui.defaultAccount,
      preparedBundle: { title, caption: [title, description, hashtags.map(h => `#${h}`).join(' ')].filter(Boolean).join('\n'), hashtags, file },
    };
  }
}

async function publishGeneric(platformId, payload, onProgress) {
  const { file, title, description, hashtags, coverFile, videoFile } = payload;
  const meta = PLATFORM_META[platformId];
  const account = getCredentials(platformId);
  onProgress?.(0.05);

  try {
    const hasAccount = account && (account.id || account.name);
    const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    const workingFile = videoFile || file;

    onProgress?.(0.2);

    if (hasAccount && isNode) {
      onProgress?.(0.5);
    }

    onProgress?.(0.95);
    return {
      platform: platformId,
      success: false,
      fallback: true,
      error: hasAccount ? `${platformId}.manual_upload_recommended` : `${platformId}.no_account_configured`,
      shareUrl: null,
      manualSteps: meta.manualSteps,
      creatorPortalUrl: meta.creatorPortalUrl,
      account: account || meta.defaultAccount,
      preparedBundle: { title, caption: [title, description, hashtags.map(h => `#${h}`).join(' ')].filter(Boolean).join('\n'), hashtags, file: workingFile },
    };
  } catch (e) {
    return {
      platform: platformId,
      success: false,
      fallback: true,
      error: e.message || 'Unknown error',
      manualSteps: meta.manualSteps,
      creatorPortalUrl: meta.creatorPortalUrl,
      account: account || meta.defaultAccount,
      preparedBundle: { title, caption: [title, description, hashtags.map(h => `#${h}`).join(' ')].filter(Boolean).join('\n'), hashtags, file },
    };
  }
}

async function publish(platform, payload, onProgress) {
  const { hashtags = [] } = payload;
  const enrichedHashtags = suggestHashtags(platform, {
    style: payload.style || '',
    theme: payload.theme || '',
    engine: payload.engine || '',
  });
  const mergedPayload = {
    ...payload,
    hashtags: [...new Set([...hashtags, ...enrichedHashtags])],
  };

  switch (platform) {
    case 'douyin':
      return publishDouyin(platform, mergedPayload, onProgress);
    case 'qishui':
      return publishQishui(platform, mergedPayload, onProgress);
    case 'rednote':
    case 'tiktok':
    case 'youtube':
      return publishGeneric(platform, mergedPayload, onProgress);
    default:
      return {
        platform,
        success: false,
        fallback: true,
        error: `Unknown platform: ${platform}`,
        manualSteps: { zh: [], en: [] },
        creatorPortalUrl: '',
        account: {},
      };
  }
}

const SocialPublishService = {
  PLATFORM_META,
  configStore,
  saveCredentials,
  getCredentials,
  deleteCredentials,
  suggestHashtags,
  publish,
};

export default SocialPublishService;
export {
  PLATFORM_META,
  configStore,
  saveCredentials,
  getCredentials,
  deleteCredentials,
  suggestHashtags,
  publish,
};
