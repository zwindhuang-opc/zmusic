import React, { useState, useEffect } from 'react';
import {
  Upload, Download, Send, Youtube, Music2, Lightbulb,
  CheckCircle, AlertCircle, RefreshCw, Link, FileAudio, FileVideo,
  Zap, Copy, Check, User, Clock, StepForward, XCircle, Eye,
  BookOpen, Tag, Video,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import DouyinService from '../services/douyin.service.js';

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
    account: { id: 'z.music.z', name: 'ZMUSIC', password: 'vgbzg92x' },
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
    account: { id: 'z.music.z', name: 'ZMUSIC' },
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

export default function PublishStudio({ onNavigate }) {
  const { t, lang } = useTranslation();
  const isZh = lang === 'zh';
  const { history, copyToClipboard, showToast } = useGeneration();

  // Step state (wizard)
  const [step, setStep] = useState(1);
  // Publish config
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [platforms, setPlatforms] = useState({ douyin: true, qishui: false });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [coverDataUrl, setCoverDataUrl] = useState(null);
  // Job status
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [shareLinks, setShareLinks] = useState([]);
  const [copiedTag, setCopiedTag] = useState(null);

  const pick = (n) => (isZh ? n?.zh : n?.en);

  // Song library - songs with audio
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
  const canProceedStep2 = platforms.douyin || platforms.qishui;
  const canPublish = title.trim() && canProceedStep1 && canProceedStep2;

  const fullCaption = () => {
    const tags = hashtags.map(h => `#${h}`).join(' ');
    return [title, description, tags].filter(Boolean).join('\n');
  };

  const doPublish = async () => {
    if (!canPublish) return;
    setStatus('preparing');
    setProgress(0.02);
    setErrorMsg(null);
    setShareLinks([]);

    try {
      const song = selectedSong;
      const fileSize = song.duration ? Math.floor(song.duration * 256 * 128) : 0; // rough estimate

      const tasks = [];
      if (platforms.douyin) tasks.push('douyin');
      if (platforms.qishui) tasks.push('qishui');

      const results = [];

      for (let i = 0; i < tasks.length; i++) {
        const plat = tasks[i];
        setStatus(plat === 'douyin' ? 'uploading' : 'submitting');
        setProgress(0.1 + (0.8 * (i + 0.5) / tasks.length));

        try {
          if (plat === 'douyin') {
            const res = await fetch('/api/publish/douyin/video', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title,
                description,
                hashtags,
                audioUrl: song.audioUrl,
                videoUrl: song.videoUrl,
                fileSize,
                mimeType: song.type === 'mv' ? 'video/mp4' : 'audio/mpeg',
              }),
            }).then(r => r.json());
            results.push({ platform: plat, ...res });
          } else {
            const res = await fetch('/api/publish/qishui/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title, author: 'ZMUSIC', style: song.style || '' }),
            }).then(r => r.json());
            results.push({ platform: plat, ...res });
          }
        } catch (e) {
          results.push({ platform: plat, success: false, error: e.message, fallback: true });
        }
      }

      setProgress(0.95);
      const anySuccess = results.some(r => r.success && !r.fallback);
      const anyManual = results.some(r => r.fallback);

      setStatus(anySuccess ? 'success' : anyManual ? 'manual' : 'failed');
      setProgress(1.0);

      if (anySuccess) {
        showToast?.('发布成功！作品已提交平台审核', 'success');
      } else if (anyManual) {
        showToast?.('平台直传未配置，请按下方步骤手动上传', 'info');
      } else {
        const errs = results.map(r => r.error).filter(Boolean).join('; ');
        setErrorMsg(errs);
        showToast?.('发布失败：' + errs, 'error');
      }

      setShareLinks(results);
    } catch (e) {
      setStatus('failed');
      setErrorMsg(e.message);
      showToast?.('发布异常：' + e.message, 'error');
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
      {/* Header */}
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
                  ? '一键分发您的 AI 作品到 抖音 / 汽水音乐，支持生成发布内容、打包文件'
                  : 'One-click distribute your AI songs to Douyin and Qishui Music'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <User className="w-3.5 h-3.5" />
              <span className="font-medium">ZMUSIC (z.music.z)</span>
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

        {/* Step progress bar */}
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

        {/* STEP 1: Song picker */}
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
                      <div className="text-sm font-semibold text-white truncate">{s.title || '未命名'}</div>
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

        {/* STEP 2: Platforms */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-sm font-bold text-white">{isZh ? '② 选择发布平台' : '② Choose platforms'}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PLATFORMS.map(p => {
                const active = !!platforms[p.id];
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatforms(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${active
                      ? `bg-gradient-to-br ${p.color} bg-opacity-10 border-transparent shadow-lg`
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                      }`}
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
                    {p.account && (
                      <div className="mt-3 text-[10.5px] text-gray-500/90 bg-black/20 rounded-lg p-2 border border-white/5">
                        <div className="flex items-center gap-1.5 mb-0.5"><User className="w-3 h-3 inline" /> <b>{p.account.name}</b></div>
                        <div className="font-mono">ID: {p.account.id}</div>
                        {p.account.password && <div className="font-mono">PW: {p.account.password}</div>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
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

        {/* STEP 3: Content */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-sm font-bold text-white">{isZh ? '③ 填写标题、描述、标签' : '③ Title, description & tags'}</div>

            {/* Selected song preview */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
              <FileAudio className="w-6 h-6 text-rose-400 flex-shrink-0" />
              <div className="min-w-0 flex-1 text-xs text-gray-400 truncate">
                已选：<span className="text-white font-medium">{selectedSong?.title || '?'}</span> · 平台：{Object.entries(platforms).filter(([, v]) => v).map(([k]) => PLATFORMS.find(p => p.id === k)?.name?.zh || k).join(' / ')}
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
              {/* Copy-all-caption preview */}
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

        {/* STEP 4: Publish Progress + Result */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              {isZh ? '④ 发布进程' : '④ Publishing progress'}
            </div>

            {/* Progress bar */}
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

            {/* Results per platform */}
            {shareLinks.length > 0 && (
              <div className="space-y-2.5">
                {shareLinks.map((r, i) => {
                  const plat = PLATFORMS.find(p => p.id === r.platform);
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
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-white">{pick(plat?.name) || r.platform}</span>
                            {r.success && !r.fallback ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">✓ {isZh ? '已提交' : 'Submitted'}</span>
                            ) : r.fallback ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">⚠ {isZh ? '手动发布模式' : 'Manual upload'}</span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/20">✕ {isZh ? '失败' : 'Failed'}</span>
                            )}
                          </div>
                          {r.error && <div className="text-[11px] text-rose-400/90">{r.error}</div>}
                          {r.shareUrl && (
                            <a href={r.shareUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-300 hover:text-blue-200 underline inline-flex items-center gap-1 mt-1">
                              <Link className="w-3 h-3" /> {isZh ? '查看作品链接' : 'Open share URL'}
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => copyText(r.shareUrl || fullCaption(), i)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          title={isZh ? '复制链接/文案' : 'Copy link/caption'}
                        >
                          {copiedTag === i ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Manual upload steps */}
                      {r.fallback && r.manualSteps && (
                        <ol className="space-y-1.5 text-[11px] text-gray-300 bg-black/20 rounded-lg p-3 border border-white/5 list-decimal list-inside">
                          {r.manualSteps.map((s, k) => (
                            <li key={k}>{s}</li>
                          ))}
                        </ol>
                      )}

                      {/* Download buttons */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedSong?.audioUrl && (
                          <a
                            href={`/api/publish/download-url?audioUrl=${encodeURIComponent(selectedSong.audioUrl)}&songId=${selectedSong.id}&filename=${encodeURIComponent(title + '.mp3')}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 transition-colors text-[11px] font-medium"
                          >
                            <Download className="w-3.5 h-3.5" /> {isZh ? '下载 MP3' : 'Download MP3'}
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

            {/* Initiate publish if not started */}
            {status === 'idle' && (
              <button
                onClick={doPublish}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-cyan-500 hover:from-rose-400 hover:via-pink-400 hover:to-cyan-400 shadow-2xl shadow-rose-500/30 hover:scale-[1.005] active:scale-[0.995] transition-all"
              >
                <Zap className="w-5 h-5" />
                {isZh ? '🚀 立即发布到所有选中平台' : '🚀 Publish to all selected platforms'}
              </button>
            )}

            {/* Post-publish actions */}
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
    </div>
  );
}