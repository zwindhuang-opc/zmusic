import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Headphones, Sparkles, Loader, Play, Pause, Clock, Zap,
  Music2, User, CreditCard, AlertCircle, ChevronDown, Send,
  Disc3, Volume2, Copy, ExternalLink, Music, Download,
  Image, Wand2, Mic, BarChart3, RefreshCw, X, ChevronRight,
  Globe, Type, Sliders, Languages
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import MuseService from '../services/muse.service.js';
import { useGeneration } from '../stores/generationStore.jsx';

const API_BASE = '/api';

function proxyAudioUrl(url) {
  if (!url) return url;
  if (url.startsWith('/api/proxy')) return url;
  const corsFriendly = ['w3schools.com', 'soundhelix.com', 'archive.org', 'cdn.jsdelivr.net'];
  if (corsFriendly.some(domain => url.includes(domain))) return url;
  return `${API_BASE}/proxy/audio?url=${encodeURIComponent(url)}`;
}

const QUICK_INSPIRATIONS = [
  '追逐梦想，永不放弃的旅程',
  '夏日海边，夕阳西下的浪漫',
  '都市霓虹，深夜独行的思绪',
  '童年回忆，温暖的旧时光',
  '自由奔跑，青春的呐喊',
  '暗恋心事，心跳加速的瞬间',
];

// Hardcoded fallback styles from deep research of muse.top
const FALLBACK_STYLES = [
  {
    name: '流行流派',
    styles: [
      { style: '流行音乐' }, { style: '流行舞曲' }, { style: '流行说唱' },
      { style: 'R&B' }, { style: '灵魂乐' }, { style: '放克' },
    ]
  },
  {
    name: '摇滚流派',
    styles: [
      { style: '摇滚' }, { style: '硬摇滚' }, { style: '朋克' },
      { style: '金属' }, { style: '哥特摇滚' }, { style: '另类摇滚' },
    ]
  },
  {
    name: '电子流派',
    styles: [
      { style: '电子乐' }, { style: 'EDM' }, { style: '合成器流行' },
      { style: '深浩室' }, { style: '科技舞曲' }, { style: '梦幻电子' },
    ]
  },
  {
    name: '说唱流派',
    styles: [
      { style: '说唱' }, { style: '陷阱' }, { style: 'Boom Bap' },
      { style: '西海岸说唱' }, { style: '东岸说唱' },
    ]
  },
  {
    name: '古典流派',
    styles: [
      { style: '古典' }, { style: '古典交响' }, { style: '室内乐' },
      { style: '巴洛克' }, { style: '浪漫主义' }, { style: '爵士乐' },
    ]
  },
  {
    name: '民族流派',
    styles: [
      { style: '民谣' }, { style: '古风' }, { style: '中国风' },
      { style: '民歌' }, { style: '乡村音乐' }, { style: '蓝调' },
    ]
  },
  {
    name: '世界流派',
    styles: [
      { style: '拉丁' }, { style: '雷鬼' }, { style: '桑巴' },
      { style: '探戈' }, { style: '弗拉门戈' }, { style: 'K-Pop' },
    ]
  },
  {
    name: '氛围流派',
    styles: [
      { style: '氛围音乐' }, { style: '新世纪' }, { style: '冥想' },
      { style: '环境音乐' }, { style: ' Chillout' },
    ]
  },
];

const STYLE_ICONS = {
  '流行音乐': '🎤', '流行舞曲': '💃', '流行说唱': '🎙️',
  '摇滚': '🎸', '硬摇滚': '🤘', '朋克': '🎛️', '金属': '⚡', '哥特摇滚': '🦇', '另类摇滚': '🎤',
  '电子乐': '🎛️', 'EDM': '🎧', '合成器流行': '🎹',
  '说唱': '🎙️', '陷阱': '🔊',
  '古典': '🎻', '古典交响': '🎼', '爵士乐': '🎷',
  '民谣': '🪕', '古风': '🏮', '中国风': '🐉',
  'R&B': '🎵', '灵魂乐': '❤️',
  '拉丁': '🌴', 'K-Pop': '🇰🇷',
  '氛围音乐': '🌌', '新世纪': '✨',
};

const LANGUAGES = [
  { id: '', label: '自动', flag: '🌐' },
  { id: '1001', label: '中文', flag: '🇨🇳' },
  { id: '1003', label: '粤语', flag: '🇭🇰' },
  { id: '1004', label: '英语', flag: '🇺🇸' },
  { id: '1002', label: '日语', flag: '🇯🇵' },
  { id: '1005', label: '韩语', flag: '🇰🇷' },
  { id: '1006', label: '法语', flag: '🇫🇷' },
  { id: '1007', label: '西班牙语', flag: '🇪🇸' },
  { id: '1008', label: '泰语', flag: '🇹🇭' },
  { id: '1009', label: '越南语', flag: '🇻🇳' },
];

const VOCAL_TYPES = [
  { id: '', label: '随机', icon: '🎲' },
  { id: 'm', label: '男声', icon: '♂' },
  { id: 'f', label: '女声', icon: '♀' },
];

const MASTER_TEMPLATES = [
  { id: '', label: '无', icon: '➖' },
  { id: 'original', label: '原曲优化', icon: '🎼' },
  { id: 'rap', label: '流行RAP', icon: '🎙️' },
  { id: 'love', label: '情歌', icon: '💕' },
  { id: 'epic', label: '史诗', icon: '🎬' },
];

// Custom styled select component
function StyledSelect({ value, onChange, options, placeholder, icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:border-fuchsia-500/50 hover:bg-white/10 transition-all"
      >
        <span className="flex items-center gap-2 truncate">
          {icon && <span>{icon}</span>}
          {selected ? (
            <span className="truncate">{selected.label}</span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-all ${value === opt.value
                  ? 'bg-fuchsia-500/20 text-fuchsia-200'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
              >
                {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                <span className="truncate">{opt.label}</span>
                {value === opt.value && <span className="ml-auto text-fuchsia-400">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MusePage() {
  const { t } = useTranslation();
  const { pendingLyrics, clearPendingLyrics } = useGeneration();

  const [mode, setMode] = useState('quick');
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [title, setTitle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('流行音乐');
  const [selectedVocal, setSelectedVocal] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [instrumental, setInstrumental] = useState(false);

  const [styles, setStyles] = useState(FALLBACK_STYLES);
  const [masterConfig, setMasterConfig] = useState(null);
  const [fastConfig, setFastConfig] = useState(null);
  const [templates, setTemplates] = useState([]);

  const [museStatus, setMuseStatus] = useState({ configured: false, mock: false });
  const [userInfo, setUserInfo] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [pollStatus, setPollStatus] = useState('idle');
  const [pollMessage, setPollMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [generatedSong, setGeneratedSong] = useState(null);
  const [error, setError] = useState(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(null);

  const [activeSteps, setActiveSteps] = useState({
    submit: false, analyze: false, compose: false, master: false
  });

  useEffect(() => {
    loadMuseConfig();
  }, []);

  useEffect(() => {
    if (pendingLyrics) {
      setLyrics(pendingLyrics);
      clearPendingLyrics();
    }
  }, [pendingLyrics]);

  const loadMuseConfig = async () => {
    setLoadingConfig(true);
    try {
      const [statusRes, userRes, stylesRes, masterRes, fastRes, templatesRes] = await Promise.allSettled([
        MuseService.getStatus(),
        MuseService.getUser(),
        MuseService.getStyles(),
        MuseService.getMasterConfig(),
        MuseService.getFastConfig(),
        MuseService.getTemplates(),
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value?.success) {
        setMuseStatus(statusRes.value.data || statusRes.value);
      }

      if (userRes.status === 'fulfilled' && userRes.value) {
        setUserInfo(userRes.value?.data || userRes.value);
      }

      // Load styles - use fallback if API fails
      if (stylesRes.status === 'fulfilled' && stylesRes.value?.success) {
        const list = stylesRes.value.data?.list || stylesRes.value.data || [];
        if (list.length > 0) {
          setStyles(list);
          if (!selectedStyle && list[0].styles?.length > 0) {
            setSelectedStyle(list[0].styles[0].style);
          }
        }
      }
      // If API styles failed or returned empty, we keep FALLBACK_STYLES

      if (masterRes.status === 'fulfilled' && masterRes.value?.success) {
        setMasterConfig(masterRes.value.data || masterRes.value);
      }

      if (fastRes.status === 'fulfilled' && fastRes.value?.success) {
        setFastConfig(fastRes.value.data || fastRes.value);
      }

      if (templatesRes.status === 'fulfilled' && templatesRes.value?.success) {
        const list = templatesRes.value.data?.list || templatesRes.value.data || [];
        setTemplates(list);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleGenerate = async () => {
    setError(null);
    setGeneratedSong(null);
    setGenerating(true);
    setPollStatus('submitting');
    setPollMessage(t('muse.submitting'));
    setProgress(5);
    setActiveSteps({ submit: true, analyze: false, compose: false, master: false });

    try {
      const params = {
        mode,
        prompt: mode === 'quick' ? prompt : undefined,
        lyrics: mode === 'master' ? lyrics : undefined,
        style: selectedStyle,
        title: title || undefined,
        vocal: selectedVocal || undefined,
        languageId: selectedLanguage || undefined,
        structureId: selectedTemplate || undefined,
        instrumental,
        songModel: fastConfig?.songModel || 'general',
      };

      const result = await MuseService.generateSong(params);
      const tid = result?.taskId || result?.workId;
      setTaskId(tid);
      setPollStatus('processing');
      setPollMessage(t('muse.processing'));
      setProgress(20);
      setActiveSteps({ submit: true, analyze: true, compose: false, master: false });

      const final = await MuseService.pollUntilDone(tid, {
        intervalMs: 4000,
        timeoutMs: 300000,
        onPoll: (task) => {
          const s = String(task?.status || '').toLowerCase();
          if (s === 'processing' || s === 'pending') {
            setPollMessage(t('muse.processing'));
            if (task?.progress) {
              setProgress(task.progress);
            } else {
              setProgress(prev => Math.min(85, prev + 8));
            }
          }
        },
      });

      setPollStatus('success');
      setProgress(100);
      setActiveSteps({ submit: true, analyze: true, compose: true, master: true });

      const songData = {
        title: final?.title || title || 'Untitled',
        audioUrl: proxyAudioUrl(final?.audioUrl || final?.url),
        imageUrl: final?.imageUrl || final?.coverUrl,
        duration: final?.duration || 0,
        userName: final?.userName || 'Muse AI',
        taskId: tid,
      };
      setGeneratedSong(songData);
      setPollMessage(t('muse.complete'));

      if (songData.audioUrl) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
          }
        }, 300);
      }
    } catch (e) {
      setError(e.message);
      setPollStatus('failed');
      setPollMessage(t('muse.failed'));
      setActiveSteps({ submit: false, analyze: false, compose: false, master: false });
    } finally {
      setGenerating(false);
    }
  };

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [playing]);

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
    setCurrentTime(pct * duration);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const copyLyrics = () => {
    if (lyrics) navigator.clipboard?.writeText(lyrics);
  };

  const downloadAudio = () => {
    if (generatedSong?.audioUrl) {
      const a = document.createElement('a');
      a.href = generatedSong.audioUrl;
      a.download = `${generatedSong.title || 'muse-song'}.mp3`;
      a.target = '_blank';
      a.click();
    }
  };

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const memberInfo = userInfo?.memberInfo || userInfo?.member_info || {};
  // Use ONLY the actual credit balance reported by the API (no guessing/combining fields).
  // The API returns the real usable credit in memberInfo.credit — do NOT add evaluation
  // credits, since those are tracked separately on muse.top and may not be spendable.
  const credit = memberInfo.credit ?? userInfo?.credit ?? userInfo?.credits ?? 0;
  const subscription = memberInfo.subscription || {};
  const isSubscriptionExpired = subscription.expired ?? false;
  const isMember = memberInfo.isMember || memberInfo.paidMember || userInfo?.isMember || false;
  const canGenerate = museStatus?.configured && !generating && credit > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 via-fuchsia-600/20 to-pink-600/20 border border-white/10 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/0 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Muse AI 音乐生成</h1>
              <p className="text-sm text-gray-400 mt-0.5">连接 muse.top 账户，用你的积分创作歌曲</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${museStatus?.configured
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-300 border border-red-500/30'
              }`}>
              <div className={`w-2 h-2 rounded-full ${museStatus?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {museStatus?.configured ? '已连接' : '未连接'}
              {loadingConfig && <Loader className="w-3 h-3 animate-spin" />}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <CreditCard className="w-4 h-4 text-fuchsia-400" />
              <span className="text-xs text-gray-400">{isMember ? '会员' : '积分'}</span>
              <span className="text-base font-mono text-fuchsia-300 font-bold">{credit}</span>
              {isMember && (
                <span className="px-1.5 py-0.5 text-[9px] rounded bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/30 font-medium">VIP</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${error.includes('登录') || error.includes('LOGIN') || error.includes('expired')
          ? 'bg-red-500/10 border-red-500/40 text-red-200'
          : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{error}</p>
            {(error.includes('登录') || error.includes('LOGIN') || error.includes('expired')) && (
              <p className="text-xs text-red-300/70 mt-1">请在 Edge 浏览器重新登录 muse.top</p>
            )}
          </div>
          <button onClick={() => setError(null)} className="text-red-300/50 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isSubscriptionExpired && !error && credit > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Muse 订阅已过期</p>
            <p className="text-xs text-amber-300/70 mt-0.5">会员权益已到期。你还有 {credit} 积分可用。</p>
          </div>
        </div>
      )}

      {isSubscriptionExpired && !error && credit <= 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Muse 订阅已过期</p>
            <p className="text-xs text-red-300/70 mt-0.5">账户无可用积分，请前往 muse.top 充值</p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-3 space-y-5">
          {/* Mode Selector */}
          <div className="glass p-1.5 rounded-2xl flex gap-1 bg-white/5">
            <button
              onClick={() => { setMode('quick'); setGeneratedSong(null); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${mode === 'quick'
                ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>快速模式</span>
            </button>
            <button
              onClick={() => { setMode('master'); setGeneratedSong(null); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${mode === 'master'
                ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Music2 className="w-4 h-4" />
              <span>大师模式</span>
            </button>
          </div>

          {/* Input Card */}
          <div className="glass p-6 rounded-2xl space-y-5">
            {mode === 'quick' ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Wand2 className="w-4 h-4 text-fuchsia-400" />
                    灵感描述
                  </label>
                  <span className="text-[10px] text-gray-500">{prompt.length}/200</span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="用一句话描述你想要的歌曲... 例如：夏日海边，夕阳西下的浪漫回忆"
                  className="w-full h-28 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 resize-none transition-all"
                  maxLength={200}
                />
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {QUICK_INSPIRATIONS.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(chip)}
                      className="px-2.5 py-1 text-[11px] rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-fuchsia-500/20 border border-white/10 transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                      <Mic className="w-4 h-4 text-fuchsia-400" />
                      歌词
                    </label>
                    <span className="text-[10px] text-gray-500">{lyrics.length} 字符</span>
                  </div>
                  <textarea
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder="输入完整歌词... Muse AI 将根据歌词生成歌曲"
                    className="w-full h-48 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 resize-y font-mono transition-all"
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    大师模式下，你提供的歌词将直接用于生成歌曲
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                      <Type className="w-3.5 h-3.5 inline mr-1" />
                      歌曲标题
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="为你的歌曲取一个名字"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                      结构模板
                    </label>
                    <StyledSelect
                      value={selectedTemplate}
                      onChange={setSelectedTemplate}
                      options={MASTER_TEMPLATES.map(t => ({ value: t.id, label: t.label, icon: t.icon }))}
                      placeholder="选择结构"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Style Selector */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Disc3 className="w-4 h-4 text-fuchsia-400" />
                音乐风格
              </label>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {styles.map((group) => (
                  <div key={group.name}>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BarChart3 className="w-3 h-3" />
                      {group.name}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {group.styles?.map((s) => (
                        <button
                          key={s.style}
                          onClick={() => setSelectedStyle(s.style)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-1.5 ${selectedStyle === s.style
                            ? 'bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 border-fuchsia-500/50 text-fuchsia-200 shadow-lg shadow-fuchsia-500/10'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                            }`}
                        >
                          <span>{STYLE_ICONS[s.style] || '🎵'}</span>
                          {s.style}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            <details className="group" open>
              <summary className="flex items-center justify-between cursor-pointer text-sm text-gray-400 hover:text-white transition-colors list-none py-2">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-fuchsia-400" />
                  高级选项
                </span>
                <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                    <Mic className="w-3 h-3" /> 声线
                  </label>
                  <StyledSelect
                    value={selectedVocal}
                    onChange={setSelectedVocal}
                    options={VOCAL_TYPES.map(v => ({ value: v.id, label: v.label, icon: v.icon }))}
                    placeholder="选择声线"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                    <Languages className="w-3 h-3" /> 语言
                  </label>
                  <StyledSelect
                    value={selectedLanguage}
                    onChange={setSelectedLanguage}
                    options={LANGUAGES.map(l => ({ value: l.id, label: l.label, icon: l.flag }))}
                    placeholder="选择语言"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> 纯音乐
                  </label>
                  <button
                    onClick={() => setInstrumental(!instrumental)}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${instrumental
                      ? 'bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-200'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                      }`}
                  >
                    {instrumental ? '✓ 开启' : '关闭'}
                  </button>
                </div>
              </div>
            </details>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 hover:from-fuchsia-400 hover:via-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 hover:scale-[1.01] active:scale-[0.99]"
            >
              {generating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {pollMessage}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  生成歌曲
                </>
              )}
            </button>

            {!museStatus?.configured && (
              <p className="text-xs text-center text-amber-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Muse AI 未连接
              </p>
            )}
            {isSubscriptionExpired && credit <= 0 && (
              <p className="text-xs text-center text-red-400">账户无可用积分，请前往 muse.top 充值</p>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Generation Progress */}
          {generating && pollStatus !== 'success' && (
            <div className="glass p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 flex items-center justify-center">
                  <Loader className="w-5 h-5 text-white animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{pollMessage}</p>
                  <p className="text-[11px] text-gray-500">AI 正在分析指令、创作音乐、合成人声...</p>
                </div>
              </div>

              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 transition-all duration-700 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'submit', label: '提交', icon: Send },
                  { key: 'analyze', label: '分析', icon: BarChart3 },
                  { key: 'compose', label: '创作', icon: Music2 },
                  { key: 'master', label: '母带', icon: Disc3 },
                ].map((step) => (
                  <div key={step.key} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${activeSteps[step.key]
                    ? 'bg-fuchsia-500/10 border border-fuchsia-500/20'
                    : 'bg-white/5 border border-white/5'
                    }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeSteps[step.key]
                      ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500'
                      : 'bg-white/5'
                      }`}>
                      <step.icon className={`w-4 h-4 ${activeSteps[step.key] ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <span className={`text-[9px] text-center ${activeSteps[step.key] ? 'text-fuchsia-300' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Song Result */}
          {generatedSong && (
            <div className="glass p-5 rounded-2xl space-y-4 border border-fuchsia-500/20 bg-gradient-to-b from-fuchsia-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Disc3 className="w-5 h-5 text-fuchsia-400" />
                  <h3 className="text-base font-bold text-white">生成结果</h3>
                </div>
                <button
                  onClick={() => { setGeneratedSong(null); setError(null); }}
                  className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                >
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    再生成
                  </span>
                </button>
              </div>

              <div className="flex gap-4">
                <div className="w-36 h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-fuchsia-500/30 to-purple-600/30 flex-shrink-0 shadow-xl">
                  {generatedSong.imageUrl ? (
                    <img src={generatedSong.imageUrl} alt={generatedSong.title} className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-fuchsia-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="text-lg font-bold text-white truncate">{generatedSong.title}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> {generatedSong.userName}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(generatedSong.duration)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 text-[10px]">
                      Muse AI 原创
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={downloadAudio} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-fuchsia-300 transition-colors">
                      <Download className="w-3.5 h-3.5" /> 下载
                    </button>
                    <a href={generatedSong.audioUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
                      前往 Muse.top <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Audio Player */}
              {generatedSong.audioUrl && (
                <div className="space-y-2">
                  <audio ref={audioRef} src={generatedSong.audioUrl}
                    onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
                    onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata}
                    className="hidden" />
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlay}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center hover:from-fuchsia-400 hover:to-purple-500 transition-all shadow-lg shadow-fuchsia-500/30 hover:scale-105">
                        {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div onClick={handleSeek} className="h-2 bg-white/10 rounded-full cursor-pointer hover:h-2.5 transition-all relative group">
                          <div className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full relative"
                            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100" />
                          </div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-gray-500 font-mono">{formatTime(currentTime)}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{formatTime(duration)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-gray-400" />
                        <input type="range" min="0" max="1" step="0.05" value={volume}
                          onChange={handleVolumeChange} className="w-16 h-1 accent-fuchsia-500 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'master' && lyrics && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-300">使用的歌词</p>
                    <button onClick={copyLyrics} className="flex items-center gap-1 text-[11px] text-fuchsia-400 hover:text-fuchsia-300">
                      <Copy className="w-3 h-3" /> 复制
                    </button>
                  </div>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono max-h-40 overflow-auto leading-relaxed">{lyrics}</pre>
                </div>
              )}

              <div className="flex items-center justify-center pt-2 border-t border-white/5">
                <p className="text-[10px] text-gray-600 text-center">
                  ⚠ 此歌曲由 Muse AI 生成，仅临时展示。如需保存请前往 muse.top
                </p>
              </div>
            </div>
          )}

          {/* Default Tips */}
          {!generatedSong && !generating && (
            <div className="glass p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-fuchsia-400" />
                <h3 className="text-sm font-semibold text-white">使用提示</h3>
              </div>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-fuchsia-400 flex-shrink-0" />
                  <span><strong className="text-gray-300">快速模式</strong>：用一句话描述灵感，AI 自动生成歌词和歌曲</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-fuchsia-400 flex-shrink-0" />
                  <span><strong className="text-gray-300">大师模式</strong>：提供完整歌词，精确控制风格、语言和结构</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-fuchsia-400 flex-shrink-0" />
                  <span>确保已在 Edge 浏览器登录 muse.top 账户</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-fuchsia-400 flex-shrink-0" />
                  <span>支持 10+ 种语言、40+ 种音乐风格</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MusePage;