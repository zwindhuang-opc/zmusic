import React, { useState, useEffect } from 'react';
import {
  Upload, Download, Send, Youtube, Music2, Lightbulb,
  CheckCircle, AlertCircle, RefreshCw, Link, FileAudio, FileVideo,
  Zap, Copy, Check, User, Clock, StepForward, XCircle, Eye,
  BookOpen, Tag, Video, Settings, X, ExternalLink, BookMarked,
  ChevronDown, ChevronUp, Package,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import DouyinService from '../services/douyin.service.js';
import SocialPublishService from '../services/socialPublish.service.js';

const PLATFORMS = [
  {
    id: 'douyin',
    name: { zh: '抖音', en: 'Douyin' },
    icon: <Video className="w-5 h-5" />,
    color: 'from-rose-500 to-pink-600',
    desc: {
      zh: '短视频平台，适合 15-60 秒配乐短视频 + 音乐人单曲上传',
      en: 'Short-video platform, ideal for 15-60s clips + musician uploads',
    },
  },
  {
    id: 'qishui',
    name: { zh: '汽水音乐', en: 'Qishui Music' },
    icon: <Music2 className="w-5 h-5" />,
    color: 'from-cyan-500 to-blue-600',
    desc: {
      zh: 'TME 旗下长音频流媒体 — 正式单曲发布，同步至抖音 BGM 曲库',
      en: 'Tencent Music long-audio — official single release, synced to Douyin BGM lib',
    },
  },
  {
    id: 'rednote',
    name: { zh: '小红书', en: 'RedNote' },
    icon: <BookOpen className="w-5 h-5" />,
    color: 'from-red-500 to-rose-600',
    desc: {
      zh: '图文 + 短视频种草社区，适合配乐 Vlog、生活记录、音乐分享笔记',
      en: 'Image + short-video lifestyle community, great for Vlogs and music sharing notes',
    },
  },
  {
    id: 'tiktok',
    name: { zh: 'TikTok', en: 'TikTok' },
    icon: <Zap className="w-5 h-5" />,
    color: 'from-slate-900 via-fuchsia-500 to-cyan-400',
    desc: {
      zh: '国际版抖音，连接 VPN 后可直传，面向全球用户的短视频创作平台',
      en: 'International TikTok, direct upload when VPN connected, global short-video platform',
    },
  },
  {
    id: 'youtube',
    name: { zh: 'YouTube', en: 'YouTube' },
    icon: <Youtube className="w-5 h-5" />,
    color: 'from-red-600 to-red-700',
    desc: {
      zh: 'Google 账号登录，YouTube Studio 发布长视频 / Shorts，全球最大视频平台',
      en: 'Google account login, YouTube Studio for long video / Shorts, world\'s largest video platform',
    },
  },
];

const STATUS_LABEL = {
  idle: { zh: '待开始', en: 'Idle' },
  preparing: { zh: '准备文件…', en: 'Preparing files…' },
  uploading: { zh: '上传中…', en: 'Uploading…' },
  submitting: { zh: '提交发布…', en: 'Submitting…' },
  success: { zh: '发布成功', en: 'Published' },
  failed: { zh: '发布失败', en: 'Failed' },
  manual: { zh: '请手动发布', en: 'Manual upload required' },
};

function loadAccounts() {
  try {
    const raw = localStorage.getItem('zmusic_publish_accounts');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export default function PublishStudio({ onNavigate }) {
  const { t, lang } = useTranslation();
  const isZh = lang === 'zh';
  const { history, copyToClipboard, showToast } = useGeneration();

  const [step, setStep] = useState(1);
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [platforms, setPlatforms] = useState({ douyin: false, qishui: false, rednote: false, tiktok: false, youtube: false });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [coverDataUrl, setCoverDataUrl] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [shareLinks, setShareLinks] = useState([]);
  const [copiedTag, setCopiedTag] = useState(null);
  const [accounts, setAccounts] = useState(loadAccounts());
  const [configurePlatform, setConfigurePlatform] = useState(null);
  const [cfgForm, setCfgForm] = useState({ id: '', name: '', password: '' });

  const [verticalVideo, setVerticalVideo] = useState(false);
  const [advOpen, setAdvOpen] = useState(false);
  const [bitrate, setBitrate] = useState('320');
  const [loadingZip, setLoadingZip] = useState(false);

  const pick = (n) => (isZh ? n?.zh : n?.en);

  const songList = history.filter(h => (h.type === 'song' || h.type === 'mv') && h.audioUrl).slice(0, 50);
  const selectedSong = songList.find(s => s.id === selectedSongId);

  useEffect(() => {
    if (selectedSong) {
      setTitle(selectedSong.title || '');
      if (!hashtags || hashtags.length === 0) {
        const style = selectedSong.style || '';
        const tags = DouyinService.suggestHashtags({
          style,
          theme: selectedSong.creativeProcess?.snapshot?.theme || '',
          engine: selectedSong.engine || '',
        });
        setHashtags(tags);
      }
    }
  }, [selectedSongId]);

  const addTag = () => {
    const v = customTag.trim();
    if (v && !hashtags.includes(v)) setHashtags([...hashtags, v]);
    setCustomTag('');
  };

  const removeTag = (t) => setHashtags(hashtags.filter(x => x !== t));

  const copyText = async (text, tag) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedTag(tag);
      setTimeout(() => setCopiedTag(null), 1500);
    }
  };

  const canProceedStep1 = !!selectedSongId;
  const canProceedStep2 = Object.values(platforms).some(Boolean);
  const canPublish = title.trim() && canProceedStep1 && canProceedStep2;

  const fullCaption = () => {
    const tags = hashtags.map(h => `#${h}`).join(' ');
    return [title, description, tags].filter(Boolean).join('\n');
  };

  const openConfigure = (p) => {
    const stored = accounts[p.id] || {};
    setCfgForm({
      id: stored.id || '',
      name: stored.name || '',
      password: stored.password || '',
    });
    setConfigurePlatform(p);
  };

  const saveConfigure = () => {
    if (!configurePlatform) return;
    const updated = { ...accounts };
    if (cfgForm.id || cfgForm.name || cfgForm.password) {
      updated[configurePlatform.id] = { ...cfgForm };
    } else {
      delete updated[configurePlatform.id];
    }
    localStorage.setItem('zmusic_publish_accounts', JSON.stringify(updated));
    setAccounts(updated);
    setConfigurePlatform(null);
    showToast?.(t('publish.account_saved'), 'success');
  };

  const clearConfigure = () => {
    if (!configurePlatform) return;
    const updated = { ...accounts };
    delete updated[configurePlatform.id];
    localStorage.setItem('zmusic_publish_accounts', JSON.stringify(updated));
    setAccounts(updated);
    setCfgForm({ id: '', name: '', password: '' });
    showToast?.(t('publish.account_cleared'), 'info');
  };

  const getPlatformAccount = (platId) => {
    return accounts[platId] || null;
  };

  const doPublish = async () => {
    if (!canPublish) return;
    setStatus('preparing');
    setProgress(0.02);
    setErrorMsg(null);
    setShareLinks([]);

    try {
      const song = selectedSong;
      showToast?.(t('publish.fetching_file'), 'info');

      let audioBlob = null;
      let videoBlob = null;
      let coverBlob = null;

      try {
        if (song.audioUrl) {
          audioBlob = await fetch(song.audioUrl).then(r => r.blob());
        }
      } catch (e) { console.warn('audio fetch failed:', e); }

      try {
        if (song.videoUrl) {
          videoBlob = await fetch(song.videoUrl).then(r => r.blob());
        }
      } catch (e) { console.warn('video fetch failed:', e); }

      try {
        if (song.imageUrl) {
          coverBlob = await fetch(song.imageUrl).then(r => r.blob());
        }
      } catch (e) { console.warn('cover fetch failed:', e); }

      setProgress(0.08);

      const tasks = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k);
      const results = [];

      for (let i = 0; i < tasks.length; i++) {
        const plat = tasks[i];
        const platMeta = PLATFORMS.find(p => p.id === plat);
        setStatus('uploading');
        const baseProgress = 0.1 + (0.85 * i) / tasks.length;
        setProgress(baseProgress);

        const uploadingMsg = t('publish.uploading_to_platform').replace('{platform}', pick(platMeta?.name) || plat);
        if (i === 0) showToast?.(uploadingMsg, 'info');

        try {
          const file = videoBlob || audioBlob;
          const fileSize = file?.size || 0;
          const mimeType = song.type === 'mv' ? (videoBlob?.type || 'video/mp4') : (audioBlob?.type || 'audio/mpeg');

          let res = null;
          let backendReached = false;

          try {
            const payload = {
              platform: plat,
              title,
              description,
              hashtags,
              audioUrl: song.audioUrl,
              videoUrl: song.videoUrl,
              coverUrl: song.imageUrl,
              fileSize,
              mimeType,
              account: getPlatformAccount(plat),
              orientation: verticalVideo ? 'vertical' : undefined,
            };
            const httpRes = await fetch('/api/publish/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (httpRes.ok) {
              res = await httpRes.json();
              backendReached = true;
            }
          } catch (e) {
            console.warn(`Backend /api/publish/submit unavailable for ${plat}, fallback to frontend helper`, e);
          }

          if (!backendReached || !res) {
            const onProgressLocal = (p) => {
              setProgress(baseProgress + 0.85 * p / tasks.length);
            };
            res = await SocialPublishService.publish(plat, {
              file,
              title,
              description,
              hashtags,
              coverFile: coverBlob,
              videoFile: videoBlob,
              style: song.style || '',
              theme: song.creativeProcess?.snapshot?.theme || '',
              engine: song.engine || '',
            }, onProgressLocal);
          }

          setProgress(baseProgress + 0.85 / tasks.length);
          results.push({ platform: plat, ...res });

        } catch (e) {
          const meta = SocialPublishService.PLATFORM_META?.[plat];
          results.push({
            platform: plat,
            success: false,
            fallback: true,
            error: e.message,
            manualSteps: meta?.manualSteps,
            creatorPortalUrl: meta?.creatorPortalUrl,
            account: getPlatformAccount(plat) || meta?.defaultAccount,
          });
        }
      }

      setProgress(0.95);
      const anySuccess = results.some(r => r.success && !r.fallback);
      const anyManual = results.some(r => r.fallback);

      setStatus(anySuccess ? 'success' : anyManual ? 'manual' : 'failed');
      setProgress(1.0);

      if (anySuccess) {
        showToast?.(t('publish.toast_success'), 'success');
      } else if (anyManual) {
        showToast?.(t('publish.toast_manual'), 'info');
      } else {
        const errs = results.map(r => r.error).filter(Boolean).join('; ');
        setErrorMsg(errs);
        showToast?.(t('publish.toast_failed_prefix') + errs, 'error');
      }

      setShareLinks(results);
    } catch (e) {
      setStatus('failed');
      setErrorMsg(e.message);
      showToast?.(t('publish.toast_exception_prefix') + e.message, 'error');
    }
  };

  const resetPublish = () => {
    setStatus('idle');
    setProgress(0);
    setErrorMsg(null);
    setShareLinks([]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 via-pink-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-pink-500/30">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {isZh ? '发布工坊' : 'Publish Studio'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {isZh
                  ? '一键分发您的 AI 作品到 5 大平台，支持生成发布内容、打包文件'
                  : 'One-click distribute your AI songs to 5 major platforms'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <User className="w-3.5 h-3.5" />
              <span className="font-medium">{accounts.douyin?.name || 'ZMUSIC'}</span>
            </div>
            <button
              onClick={resetPublish}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-gray-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {isZh ? '重置流程' : 'Reset'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-[11px] md:text-xs">
            {[
              { id: 1, label: isZh ? '选择作品' : 'Pick Work', icon: <FileAudio className="w-3.5 h-3.5" /> },
              { id: 2, label: isZh ? '选择平台' : 'Pick Platform', icon: <Video className="w-3.5 h-3.5" /> },
              { id: 3, label: isZh ? '填写内容' : 'Content', icon: <Tag className="w-3.5 h-3.5" /> },
              { id: 4, label: isZh ? '发布' : 'Publish', icon: <Send className="w-3.5 h-3.5" /> },
            ].map((s, i, arr) => (
              <React.Fragment key={s.id}>
                <div className={`flex items-center gap-1.5 ${step >= s.id ? 'text-white' : 'text-gray-500'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= s.id ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white' : 'bg-white/5 text-gray-500 border border-white/10'
                    }`}>
                    {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                  </div>
                  <span>{s.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${step > s.id ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-sm font-bold text-white">{isZh ? '① 选择要发布的歌曲或 MV' : '① Pick a song or MV to publish'}</div>
            {songList.length === 0 && (
              <div className="rounded-xl bg-white/5 border border-dashed border-white/10 p-8 text-center">
                <Music2 className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <div className="text-sm text-gray-400 mb-1">{isZh ? '暂无可发布的歌曲' : 'No published songs found yet'}</div>
                <div className="text-xs text-gray-600">{isZh ? '先去 Muse / Suno / Melo 页面生成歌曲，或启用 AUTO 模式批量创作' : 'Generate some songs first on any engine page'}</div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
              {songList.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSongId(s.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${selectedSongId === s.id
                    ? 'bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/50 ring-2 ring-rose-500/20'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${s.type === 'mv'
                      ? 'bg-gradient-to-br from-violet-500 to-fuchsia-700'
                      : s.engine === 'Melo AI'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-700'
                        : s.engine === 'Suno AI'
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-700'
                          : 'bg-gradient-to-br from-blue-500 to-cyan-700'
                      }`}>
                      {s.type === 'mv' ? <FileVideo className="w-5 h-5 text-white" /> : <FileAudio className="w-5 h-5 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">{s.title || t('common.untitled')}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{s.engine || s.type}</span>
                        {s.style && <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-300">{s.style}</span>}
                        {s.duration > 0 && <span className="font-mono">{Math.round(s.duration)}s</span>}
                      </div>
                      {s.audioUrl && (
                        <audio controls className="w-full h-6 mt-2" src={s.audioUrl} />
                      )}
                    </div>
                    {selectedSongId === s.id && (
                      <CheckCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t border-white/5 mt-4">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-500/30"
              >
                {isZh ? '下一步' : 'Next'} <StepForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-sm font-bold text-white">{isZh ? '② 选择发布平台' : '② Choose platforms'}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PLATFORMS.map(p => {
                const active = !!platforms[p.id];
                const account = getPlatformAccount(p.id);
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border-2 transition-all ${active
                      ? `bg-gradient-to-br ${p.color} bg-opacity-10 border-transparent shadow-lg`
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                      }`}
                  >
                    <button
                      onClick={() => setPlatforms(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      className="text-left w-full p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center text-white shadow-lg`}>
                          {p.icon}
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${active ? 'border-white bg-white/20' : 'border-white/20'}`}>
                          {active && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <div className={`text-base font-bold mb-1 ${active ? 'text-white' : 'text-white/90'}`}>
                        {pick(p.name)}
                      </div>
                      <div className={`text-[11px] leading-relaxed ${active ? 'text-white/80' : 'text-gray-500'}`}>
                        {pick(p.desc)}
                      </div>
                      {p.id === 'tiktok' && (
                        <div className={`mt-2 text-[10px] flex items-center gap-1 ${active ? 'text-amber-200/90' : 'text-amber-500/80'}`}>
                          <AlertCircle className="w-3 h-3" />
                          {t('publish.vpn_required_hint')}
                        </div>
                      )}
                    </button>
                    <div className="px-4 pb-3 pt-0 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="text-[10.5px] text-gray-500/90 bg-black/20 rounded-lg p-2 border border-white/5 flex-1 mr-2 min-w-0">
                          {account ? (
                            <>
                              <div className="flex items-center gap-1.5 mb-0.5"><User className="w-3 h-3 inline" /> <b className="truncate">{account.name || '(no name)'}</b></div>
                              {account.id && <div className="font-mono truncate">ID: {account.id}</div>}
                              {account.password && <div className="font-mono truncate">PW: {'•'.repeat(Math.min(account.password.length, 6))}</div>}
                            </>
                          ) : (
                            <div className="text-gray-500 italic">({isZh ? '设置中配置账号' : 'configure in settings'})</div>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); openConfigure(p); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10.5px] text-gray-300 transition-colors flex-shrink-0"
                        >
                          <Settings className="w-3 h-3" />
                          <span className="hidden sm:inline">{t('publish.configure_account')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {(platforms.tiktok || platforms.douyin || platforms.rednote) && (
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="verticalVid"
                  checked={verticalVideo}
                  onChange={(e) => setVerticalVideo(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-amber-500"
                />
                <label htmlFor="verticalVid" className="flex-1 cursor-pointer">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" />
                    {isZh ? '生成竖屏版本 1080×1920 (短视频平台专用)' : 'Vertical 1080x1920 for short video'}
                  </div>
                  <div className="text-[10.5px] text-amber-200/70 mt-0.5 leading-relaxed">
                    {isZh
                      ? '发布时启用竖屏比例，适配抖音/TikTok/小红书 Feed 流推荐。会将 orientation=vertical 传递到引擎端。'
                      : 'Portrait orientation for Douyin/TikTok/RedNote feeds. Passes orientation=vertical to engine submit.'}
                  </div>
                </label>
              </div>
            )}
            {!canProceedStep2 && (
              <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 flex items-center gap-2 text-[11px] text-amber-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {t('publish.no_platform_selected')}
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-white/5 mt-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10"
              >
                ← {isZh ? '上一步' : 'Back'}
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-500/30"
              >
                {isZh ? '下一步' : 'Next'} <StepForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-sm font-bold text-white">{isZh ? '③ 填写标题、描述、标签' : '③ Title, description & tags'}</div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
              <FileAudio className="w-6 h-6 text-rose-400 flex-shrink-0" />
              <div className="min-w-0 flex-1 text-xs text-gray-400 truncate">
                {t('publish.selected_prefix')}<span className="text-white font-medium">{selectedSong?.title || '?'}</span> · {t('publish.platforms_prefix')}{Object.entries(platforms).filter(([, v]) => v).map(([k]) => pick(PLATFORMS.find(p => p.id === k)?.name) || k).join(' / ')}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                {isZh ? '标题 *' : 'Title *'}
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={55}
                placeholder={isZh ? '吸引眼球的标题，前 3 秒决定播放完播率' : 'Catchy title (≤55 chars)'}
                className="w-full bg-black/30 border border-white/10 focus:border-rose-500/50 focus:bg-rose-500/5 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 transition-colors"
              />
              <div className="text-right text-[10px] text-gray-600 mt-1">{title.length}/55</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                {isZh ? '描述 / Caption' : 'Description'}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                maxLength={400}
                placeholder={isZh ? '讲述创作故事、情感、歌曲灵感……' : 'Share the story behind the song…'}
                className="w-full bg-black/30 border border-white/10 focus:border-rose-500/50 focus:bg-rose-500/5 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 transition-colors resize-none"
              />
              <div className="text-right text-[10px] text-gray-600 mt-1">{description.length}/400</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {isZh ? '话题标签' : 'Hashtags'}</span>
                <span className="text-[10px] text-gray-500 font-normal flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-amber-400" />
                  {isZh ? 'AI 已自动推荐 — 可自行增删' : 'AI suggested — edit as needed'}
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {hashtags.map(tag => (
                  <div key={tag} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-medium">
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-white text-rose-400/60 transition-colors">
                      <XCircle className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-1 flex-1 min-w-[180px] max-w-xs">
                  <input
                    value={customTag}
                    onChange={e => setCustomTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder={isZh ? '+ 自定义标签…' : '+ custom tag…'}
                    className="flex-1 min-w-0 bg-black/30 border border-dashed border-white/10 rounded-lg px-2 py-1 text-[11px] text-white placeholder-gray-600 focus:outline-none focus:border-rose-500/40"
                  />
                  <button onClick={addTag} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-gray-300 hover:bg-white/10">
                    {isZh ? '加' : 'Add'}
                  </button>
                </div>
              </div>
              <div className="rounded-xl bg-black/30 border border-white/5 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[11px] text-gray-400 font-bold flex items-center gap-1.5"><Eye className="w-3 h-3" /> {isZh ? '最终发布文案预览' : 'Caption preview'}</div>
                  <button
                    onClick={() => copyText(fullCaption(), 'caption')}
                    className="flex items-center gap-1 text-[10.5px] text-gray-300 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    {copiedTag === 'caption' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {isZh ? '复制全部文案' : 'Copy all'}
                  </button>
                </div>
                <pre className="text-[11px] text-gray-200 whitespace-pre-wrap leading-relaxed font-sans max-h-28 overflow-y-auto">
                  {fullCaption() || (isZh ? '(填写标题和标签后显示)' : '(complete fields above to see preview)')}
                </pre>
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t border-white/5 mt-4">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10"
              >
                ← {isZh ? '上一步' : 'Back'}
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!canPublish}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-rose-500/30"
              >
                {isZh ? '开始发布' : 'Publish now'} <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              {isZh ? '④ 发布进程' : '④ Publishing progress'}
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`text-sm font-bold flex items-center gap-2 ${status === 'success' ? 'text-emerald-400' : status === 'failed' ? 'text-rose-400' : status === 'manual' ? 'text-amber-400' : 'text-white'
                  }`}>
                  {status === 'preparing' && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {status === 'uploading' && <Upload className="w-4 h-4 animate-pulse" />}
                  {status === 'submitting' && <Send className="w-4 h-4 animate-pulse" />}
                  {status === 'success' && <CheckCircle className="w-4 h-4" />}
                  {status === 'manual' && <AlertCircle className="w-4 h-4" />}
                  {status === 'failed' && <XCircle className="w-4 h-4" />}
                  {status === 'idle' && <Clock className="w-4 h-4" />}
                  {(STATUS_LABEL[status]?.zh && isZh ? STATUS_LABEL[status].zh : STATUS_LABEL[status]?.en) || status}
                </div>
                <div className="font-mono text-xs text-gray-500">{Math.round(progress * 100)}%</div>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${status === 'success'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : status === 'failed'
                      ? 'bg-gradient-to-r from-rose-500 to-red-500'
                      : status === 'manual'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                        : 'bg-gradient-to-r from-rose-500 via-pink-500 to-cyan-400'
                    }`}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            {shareLinks.length > 0 && (
              <div className="space-y-2.5">
                {shareLinks.map((r, i) => {
                  const plat = PLATFORMS.find(p => p.id === r.platform);
                  const steps = isZh ? r.manualSteps?.zh : r.manualSteps?.en;
                  return (
                    <div key={i} className={`rounded-xl p-3.5 border ${r.success && !r.fallback
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : r.fallback
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : 'bg-rose-500/5 border-rose-500/30'
                      }`}>
                      <div className="flex items-start gap-3 mb-2">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${plat?.color || 'from-gray-500 to-gray-700'} flex items-center justify-center text-white flex-shrink-0`}>
                          {plat?.icon || <Upload className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-sm font-bold text-white">{pick(plat?.name) || r.platform}</span>
                            {r.success && !r.fallback ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">✓ {isZh ? '已提交' : 'Submitted'}</span>
                            ) : r.fallback ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">⚠ {isZh ? '手动发布模式' : 'Manual upload'}</span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/20">✕ {isZh ? '失败' : 'Failed'}</span>
                            )}
                            {r.creatorPortalUrl && (
                              <a href={r.creatorPortalUrl} target="_blank" rel="noreferrer" className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1">
                                <ExternalLink className="w-2.5 h-2.5" />
                                {t('publish.creator_portal')}
                              </a>
                            )}
                          </div>
                          {r.error && <div className="text-[11px] text-rose-400/90">{r.error}</div>}
                          {r.account?.name && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              <User className="w-2.5 h-2.5 inline mr-1" />
                              {r.account.name}
                              {r.account.id && <span className="font-mono ml-2">ID: {r.account.id}</span>}
                            </div>
                          )}
                          {r.shareUrl && (
                            <a href={r.shareUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-300 hover:text-blue-200 underline inline-flex items-center gap-1 mt-1">
                              <Link className="w-3 h-3" /> {isZh ? '查看作品链接' : 'Open share URL'}
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => copyText(r.shareUrl || r.preparedBundle?.caption || fullCaption(), i)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          title={isZh ? '复制链接/文案' : 'Copy link/caption'}
                        >
                          {copiedTag === i ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      {r.fallback && steps && steps.length > 0 && (
                        <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                          <div className="text-[10.5px] text-amber-300 font-semibold mb-1.5 flex items-center gap-1">
                            <BookMarked className="w-3 h-3" />
                            {t('publish.manual_step_prefix')}
                          </div>
                          <ol className="space-y-1.5 text-[11px] text-gray-300 list-decimal list-inside">
                            {steps.map((s, k) => (
                              <li key={k}>{s}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedSong?.audioUrl && (
                          <a
                            href={`/api/publish/download-url?audioUrl=${encodeURIComponent(selectedSong.audioUrl)}&songId=${selectedSong.id}&filename=${encodeURIComponent(title + (bitrate !== 'wav' && bitrate !== 'flac' ? `.bit${bitrate}.mp3` : bitrate === 'wav' ? '.wav' : '.flac'))}&bitrate=${bitrate}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 transition-colors text-[11px] font-medium"
                          >
                            <Download className="w-3.5 h-3.5" /> {isZh ? `下载 MP3 (${bitrate === 'wav' ? 'WAV' : bitrate === 'flac' ? 'FLAC' : bitrate + ' kbps'})` : `Download MP3 (${bitrate === 'wav' ? 'WAV' : bitrate === 'flac' ? 'FLAC' : bitrate + ' kbps'})`}
                          </a>
                        )}
                        {selectedSong?.videoUrl && (
                          <a
                            href={`/api/publish/download-url?videoUrl=${encodeURIComponent(selectedSong.videoUrl)}&songId=${selectedSong.id}&filename=${encodeURIComponent(title + '.mp4')}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 text-violet-300 border border-violet-500/30 hover:border-violet-400 transition-colors text-[11px] font-medium"
                          >
                            <Download className="w-3.5 h-3.5" /> {isZh ? '下载 MP4' : 'Download MP4'}
                          </a>
                        )}
                        {selectedSong?.imageUrl && (
                          <a
                            href={selectedSong.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500/15 to-rose-500/15 text-pink-300 border border-pink-500/30 hover:border-pink-400 transition-colors text-[11px] font-medium"
                          >
                            <Download className="w-3.5 h-3.5" /> {isZh ? '下载封面' : 'Download Cover'}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Advanced Export Options */}
            {selectedSong && (
              <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <button
                  onClick={() => setAdvOpen(!advOpen)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">
                      {isZh ? '高级导出选项' : 'Advanced Export Options'}
                    </span>
                  </div>
                  {advOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {advOpen && (
                  <div className="p-4 pt-0 space-y-4 border-t border-white/5">
                    {/* Bitrate selector */}
                    <div>
                      <div className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1.5">
                        <FileAudio className="w-3.5 h-3.5 text-emerald-400" />
                        {isZh ? '比特率选择 / Bitrate' : 'Bitrate'}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { v: '192', label: '192 kbps', desc: isZh ? '标准质量' : 'Standard' },
                          { v: '256', label: '256 kbps', desc: isZh ? '高质量' : 'High' },
                          { v: '320', label: '320 kbps', desc: isZh ? '极致 MP3' : 'Best MP3' },
                          { v: 'wav', label: 'Lossless WAV', desc: isZh ? '无损 PCM' : 'Uncompressed' },
                          { v: 'flac', label: 'Lossless FLAC', desc: isZh ? '无损压缩' : 'Lossless' },
                        ].map(b => {
                          const active = bitrate === b.v;
                          return (
                            <label
                              key={b.v}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${active
                                ? 'bg-emerald-500/10 border-emerald-500/40'
                                : 'bg-black/20 border-white/10 hover:bg-white/[0.05]'
                                }`}
                            >
                              <input
                                type="radio"
                                checked={active}
                                onChange={() => setBitrate(b.v)}
                                className="accent-emerald-500"
                              />
                              <div>
                                <div className={`text-[11.5px] font-semibold ${active ? 'text-emerald-300' : 'text-white/90'}`}>
                                  {b.label}
                                </div>
                                <div className="text-[9.5px] text-gray-500">{b.desc}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* ZIP bundle */}
                    <div>
                      <div className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-violet-400" />
                        {isZh ? '发布素材包 ZIP / Publish Bundle' : 'Publish Bundle ZIP'}
                      </div>
                      <button
                        onClick={async () => {
                          setLoadingZip(true);
                          try {
                            let JSZip;
                            try {
                              const mod = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
                              JSZip = mod.default;
                            } catch (e) {
                              throw new Error(isZh ? 'JSZip 加载失败，请检查网络或稍后重试' : 'JSZip failed to load, check network');
                            }
                            const zip = new JSZip();
                            const safeName = (title || 'zmusic').replace(/[^\w\u4e00-\u9fa5-]/g, '_');
                            const snap = selectedSong.creativeProcess?.snapshot || {};

                            if (selectedSong.audioUrl) {
                              try {
                                const ab = await fetch(selectedSong.audioUrl).then(r => r.arrayBuffer());
                                zip.file(`audio.${bitrate === 'wav' ? 'wav' : bitrate === 'flac' ? 'flac' : 'mp3'}`, ab);
                              } catch (e) { console.warn('audio zip fetch failed', e); }
                            }
                            if (selectedSong.imageUrl) {
                              try {
                                const ab = await fetch(selectedSong.imageUrl).then(r => r.arrayBuffer());
                                zip.file('cover.jpg', ab);
                              } catch (e) { console.warn('cover zip fetch failed', e); }
                            }
                            const metadata = {
                              title,
                              description,
                              hashtags,
                              engine: selectedSong.engine || '',
                              duration: selectedSong.duration || 0,
                              style: selectedSong.style || snap.style || '',
                              theme: snap.theme || '',
                              bpm: snap.bpm || selectedSong.result?.bpm || '',
                              structure: snap.structure || '',
                              generated_at: selectedSong.timestamp || '',
                              orientation: verticalVideo ? 'vertical' : 'landscape',
                              bitrate,
                            };
                            zip.file('metadata.json', JSON.stringify(metadata, null, 2));
                            const lyricsTxt = (selectedSong.lyrics || snap.lyrics || selectedSong.result?.lyricsText || '').toString();
                            zip.file('lyrics.txt', lyricsTxt);
                            zip.file('caption.txt', fullCaption());

                            const selPlats = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k);
                            const manualSteps = [];
                            manualSteps.push(isZh ? '# 手动上传步骤 · MANUAL_UPLOAD_STEPS' : '# Manual Upload Steps');
                            selPlats.forEach(pid => {
                              const pm = SocialPublishService.PLATFORM_META?.[pid];
                              const pname = PLATFORMS.find(p => p.id === pid);
                              manualSteps.push('', `## ${pick(pname?.name) || pid}`, '');
                              const st = isZh ? pm?.manualSteps?.zh : pm?.manualSteps?.en;
                              if (st && st.length) {
                                st.forEach((s, i) => manualSteps.push(`${i + 1}. ${s}`));
                              } else {
                                manualSteps.push(isZh ? '1. 访问创作者中心' : '1. Visit creator portal');
                                manualSteps.push(isZh ? '2. 点击「上传」按钮并选择 audio.mp3/cover.jpg' : '2. Click Upload and select audio file + cover');
                                manualSteps.push(isZh ? '3. 粘贴 caption.txt 中的标题/描述/标签' : '3. Paste title/description/hashtags from caption.txt');
                                manualSteps.push(isZh ? '4. 提交发布' : '4. Submit');
                              }
                              if (pm?.creatorPortalUrl) {
                                manualSteps.push('', `   🔗 ${pm.creatorPortalUrl}`);
                              }
                            });
                            manualSteps.push('');
                            zip.file('MANUAL_UPLOAD_STEPS.md', manualSteps.join('\n'));

                            const blob = await zip.generateAsync({ type: 'blob' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${safeName}_publish_bundle.zip`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            setTimeout(() => URL.revokeObjectURL(url), 5000);
                            showToast?.(isZh ? 'ZIP 发布包已生成并下载' : 'Publish bundle ZIP downloaded', 'success');
                          } catch (e) {
                            showToast?.(isZh ? 'ZIP 生成失败: ' + e.message : 'ZIP failed: ' + e.message, 'error');
                          } finally {
                            setLoadingZip(false);
                          }
                        }}
                        disabled={loadingZip}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-400 hover:via-fuchsia-400 hover:to-pink-400 disabled:opacity-50 shadow-lg shadow-fuchsia-500/20 transition-all"
                      >
                        {loadingZip ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Package className="w-4 h-4" />
                        )}
                        {loadingZip
                          ? (isZh ? '打包中…' : 'Packaging…')
                          : (isZh ? '📦 下载发布素材包 ZIP' : '📦 Download Publish Bundle ZIP')}
                      </button>
                      <div className="text-[10.5px] text-gray-500 mt-1.5 leading-relaxed">
                        {isZh
                          ? '包含：音频 + 封面 + metadata.json + 歌词 + 发布文案 + 各平台手动上传步骤'
                          : 'Includes: audio + cover + metadata.json + lyrics + caption + per-platform manual steps'}
                      </div>
                    </div>

                    {/* LRC lyrics export */}
                    <div>
                      <div className="text-xs font-bold text-gray-300 mb-2 flex items-center gap-1.5">
                        <BookMarked className="w-3.5 h-3.5 text-amber-400" />
                        {isZh ? 'LRC 歌词文件 / LRC Lyrics' : 'LRC Lyrics Export'}
                      </div>
                      <button
                        onClick={() => {
                          const lyricsRaw = (selectedSong.lyrics || selectedSong.creativeProcess?.snapshot?.lyrics || selectedSong.result?.lyricsText || '').toString();
                          const lines = lyricsRaw.split('\n').map(l => l.trim()).filter(Boolean);
                          if (lines.length === 0) {
                            showToast?.(isZh ? '此作品没有歌词' : 'No lyrics available for this work', 'error');
                            return;
                          }
                          const dur = selectedSong.duration && selectedSong.duration > 0 ? selectedSong.duration : lines.length * 6;
                          const secPerLine = dur / lines.length;
                          const fmt = (n) => {
                            const mm = Math.floor(n / 60);
                            const ss = Math.floor(n % 60);
                            const cc = Math.floor((n - Math.floor(n)) * 100);
                            return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(cc).padStart(2, '0')}`;
                          };
                          const lrcLines = [`[ti:${title || 'ZMusic Song'}]`, `[ar:ZMusic]`, `[al:ZMusic Publish]`, ''];
                          lines.forEach((ln, i) => {
                            lrcLines.push(`[${fmt(i * secPerLine)}]${ln}`);
                          });
                          const blob = new Blob([lrcLines.join('\n')], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          const safe = (title || 'zmusic_lyrics').replace(/[^\w\u4e00-\u9fa5-]/g, '_');
                          a.download = `${safe}.lrc`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          setTimeout(() => URL.revokeObjectURL(url), 3000);
                          showToast?.(isZh ? 'LRC 文件已下载' : 'LRC file downloaded', 'success');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500/80 to-orange-500/80 hover:from-amber-500 hover:to-orange-500 border border-amber-500/30 transition-all"
                      >
                        <BookMarked className="w-4 h-4" />
                        {isZh ? '🎵 下载 .lrc 歌词文件' : '🎵 Download .lrc lyrics'}
                      </button>
                      <div className="text-[10.5px] text-gray-500 mt-1.5 leading-relaxed">
                        {isZh
                          ? '按歌曲时长平均分配每行时间戳（若真实时间戳未知）'
                          : 'Evenly distributed per-line timestamps across duration when actual stamps unknown'}
                      </div>
                    </div>

                    {/* ID3 tag help */}
                    <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/20 p-3 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-cyan-300 mb-0.5">
                          {isZh ? 'ID3 标签 + 封面嵌入说明' : 'ID3 Tags & Cover Art Info'}
                        </div>
                        <div className="text-[10.5px] text-cyan-200/70 leading-relaxed">
                          {isZh
                            ? '标题/艺术家 ID3 标签与封面图的嵌入需要通过服务端 ffmpeg 在正式构建版本中完成；浏览器端打包提供独立的封面 JPG 文件供手动使用。若需要带 ID3 的 MP3，请使用后端构建或本地 ffmpeg 处理。'
                            : 'Title/Artist ID3 tags + Cover Art are embedded into MP3 via server-side ffmpeg only on production server builds. The browser bundle provides a separate cover JPG for manual use. For tagged MP3 use the server build or local ffmpeg.'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {status === 'idle' && (
              <button
                onClick={doPublish}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-cyan-500 hover:from-rose-400 hover:via-pink-400 hover:to-cyan-400 shadow-2xl shadow-rose-500/30 hover:scale-[1.005] active:scale-[0.995] transition-all"
              >
                <Zap className="w-5 h-5" />
                {isZh ? '🚀 立即发布到所有选中平台' : '🚀 Publish to all selected platforms'}
              </button>
            )}

            {status !== 'idle' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={resetPublish}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 inline mr-1.5" />
                  {isZh ? '再来一次' : 'Publish another'}
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500"
                >
                  <BookOpen className="w-4 h-4 inline mr-1.5" />
                  {isZh ? '返回步骤①' : 'Back to step ①'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {configurePlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl gradient-border p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${configurePlatform.color} flex items-center justify-center text-white`}>
                  {configurePlatform.icon}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {t('publish.configure_account')} · {pick(configurePlatform.name)}
                  </h3>
                  <p className="text-[11px] text-gray-500">{t('publish.creator_portal')}: {configurePlatform.id}</p>
                </div>
              </div>
              <button
                onClick={() => setConfigurePlatform(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  {isZh ? '账号 ID' : 'Account ID'}
                </label>
                <input
                  value={cfgForm.id}
                  onChange={e => setCfgForm({ ...cfgForm, id: e.target.value })}
                  placeholder={isZh ? '输入平台账号 ID / 手机号' : 'Enter platform account ID / phone'}
                  className="w-full bg-black/30 border border-white/10 focus:border-rose-500/50 focus:bg-rose-500/5 focus:outline-none rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  {isZh ? '账号名称 / 昵称' : 'Account Name'}
                </label>
                <input
                  value={cfgForm.name}
                  onChange={e => setCfgForm({ ...cfgForm, name: e.target.value })}
                  placeholder={isZh ? '输入账号显示名称' : 'Enter account display name'}
                  className="w-full bg-black/30 border border-white/10 focus:border-rose-500/50 focus:bg-rose-500/5 focus:outline-none rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  {isZh ? '密码 / API Token' : 'Password / API Token'}
                </label>
                <input
                  type="password"
                  value={cfgForm.password}
                  onChange={e => setCfgForm({ ...cfgForm, password: e.target.value })}
                  placeholder={isZh ? '登录密码或访问令牌' : 'Login password or access token'}
                  className="w-full bg-black/30 border border-white/10 focus:border-rose-500/50 focus:bg-rose-500/5 focus:outline-none rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 mt-5">
              <button
                onClick={clearConfigure}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-gray-300"
              >
                {t('common.clear')}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfigurePlatform(null)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-gray-300"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={saveConfigure}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 shadow-lg shadow-rose-500/30 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
