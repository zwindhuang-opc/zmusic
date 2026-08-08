import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Headphones, Sparkles, Loader, Play, Pause, Clock, Zap,
  Music2, User, CreditCard, AlertCircle, ChevronDown, Send,
  Disc3, Volume2, Copy, ExternalLink, Music, Download,
  Image, Wand2, Mic, BarChart3, RefreshCw, X, ChevronRight
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import MuseService from '../services/muse.service.js';

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

const MASTER_TEMPLATES = [
  { id: 'original', label: '原曲优化', desc: '基于你提供的歌词进行编曲优化' },
  { id: 'rap', label: '流行RAP', desc: '节奏感强的说唱风格' },
  { id: 'love', label: '情歌', desc: '温柔深情的爱情歌曲' },
  { id: 'epic', label: '史诗', desc: '大气磅礴的电影配乐风格' },
];

const STYLE_ICONS = {
  '流行音乐': '🎤', '摇滚': '🎸', '电子乐': '🎛️', '说唱': '🎙️',
  '爵士': '🎷', 'R&B': '🎵', '民谣': '🪕', '古风': '🏮',
};

function MusePage() {
  const { t } = useTranslation();

  const [mode, setMode] = useState('quick');
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [title, setTitle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedVocal, setSelectedVocal] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [instrumental, setInstrumental] = useState(false);

  const [styles, setStyles] = useState([]);
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

      if (stylesRes.status === 'fulfilled' && stylesRes.value?.success) {
        const list = stylesRes.value.data?.list || stylesRes.value.data || [];
        setStyles(list);
        if (!selectedStyle && list.length > 0 && list[0].styles?.length > 0) {
          setSelectedStyle(list[0].styles[0].style);
        }
      }

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
            const p = progress;
            if (p < 40) setActiveSteps({ submit: true, analyze: true, compose: false, master: false });
            else if (p < 70) setActiveSteps({ submit: true, analyze: true, compose: true, master: false });
            else setActiveSteps({ submit: true, analyze: true, compose: true, master: true });
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
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const copyLyrics = () => {
    if (lyrics) {
      navigator.clipboard?.writeText(lyrics);
    }
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
  const credit = memberInfo.credit ?? userInfo?.credit ?? userInfo?.credits ?? userInfo?.memberCredit ?? userInfo?.creditBalance ?? 0;
  const evaluationCreditPaid = memberInfo.evaluationCreditPaid ?? 0;
  const evaluationCreditNoPaid = memberInfo.evaluationCreditNoPaid ?? 0;
  const totalEvaluationCredit = evaluationCreditPaid + evaluationCreditNoPaid;
  const subscription = memberInfo.subscription || {};
  const isSubscriptionExpired = subscription.expired ?? false;
  const isMember = memberInfo.isMember || memberInfo.paidMember || userInfo?.isMember || false;
  const isMock = Boolean(userInfo?.mock) || museStatus?.mock;
  const totalCredits = credit + totalEvaluationCredit;

  const canGenerate = museStatus?.configured && !generating &&
    (isMock || (!isSubscriptionExpired && totalCredits > 0));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 via-fuchsia-600/20 to-pink-600/20 border border-white/10 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/0 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {t('muse.title')}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">{t('muse.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${museStatus?.configured
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-300 border border-red-500/30'
              }`}>
              <div className={`w-2 h-2 rounded-full ${museStatus?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {museStatus?.configured ? t('muse.connected') : t('muse.disconnected')}
              {loadingConfig && <Loader className="w-3 h-3 animate-spin" />}
            </div>

            {isMock && (
              <span className="px-2 py-1 text-[10px] rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                {t('muse.test_mode')}
              </span>
            )}

            {/* Credit Display */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <CreditCard className="w-4 h-4 text-fuchsia-400" />
              <span className="text-xs text-gray-400">{isMember ? t('muse.member') : t('muse.credits')}</span>
              <span className="text-base font-mono text-fuchsia-300 font-bold">{credit}</span>
              {totalEvaluationCredit > 0 && (
                <span className="text-[10px] text-amber-300">+{totalEvaluationCredit}</span>
              )}
              {isMember && (
                <span className="px-1.5 py-0.5 text-[9px] rounded bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/30 font-medium">
                  VIP
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error / Warning Banners */}
      {error && (
        <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${error.includes('登录') || error.includes('LOGIN') || error.includes('expired')
            ? 'bg-red-500/10 border-red-500/40 text-red-200'
            : error.includes('订阅') || error.includes('subscription')
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{error}</p>
            {(error.includes('登录') || error.includes('LOGIN') || error.includes('expired')) && (
              <p className="text-xs text-red-300/70 mt-1">请重新登录 muse.top 获取新的 API Key</p>
            )}
          </div>
          <button onClick={() => setError(null)} className="text-red-300/50 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isSubscriptionExpired && !isMock && !error && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Muse 订阅已过期</p>
            <p className="text-xs text-amber-300/70 mt-0.5">
              你的 Muse AI 订阅已过期，当前积分余额为 0。你还有 {totalEvaluationCredit} 体验积分可用。请前往 muse.top 续费后再使用 AI 生成功能。
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-3 space-y-5">
          {/* Mode Selector */}
          <div className="glass p-1.5 rounded-2xl flex gap-1 bg-white/5">
            <button
              onClick={() => { setMode('quick'); setGeneratedSong(null); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${mode === 'quick'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">{t('muse.quick_mode')}</span>
              <span className="sm:hidden">快速</span>
            </button>
            <button
              onClick={() => { setMode('master'); setGeneratedSong(null); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${mode === 'master'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Music2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('muse.master_mode')}</span>
              <span className="sm:hidden">大师</span>
            </button>
          </div>

          {/* Input Card */}
          <div className="glass p-6 rounded-2xl space-y-5">
            {mode === 'quick' ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Wand2 className="w-4 h-4 text-fuchsia-400" />
                    {t('muse.prompt_label')}
                  </label>
                  <span className="text-[10px] text-gray-500">{prompt.length}/200</span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('muse.prompt_placeholder')}
                  className="w-full h-28 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 resize-none transition-all"
                  maxLength={200}
                />
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {QUICK_INSPIRATIONS.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(chip)}
                      className="px-2.5 py-1 text-[11px] rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-fuchsia-500/20 hover:border-fuchsia-500/30 border border-white/10 transition-all"
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
                      {t('muse.lyrics_label')}
                    </label>
                    <span className="text-[10px] text-gray-500">{lyrics.length} 字符</span>
                  </div>
                  <textarea
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder={t('muse.lyrics_placeholder')}
                    className="w-full h-48 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 resize-y font-mono transition-all"
                  />
                  <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {t('muse.lyrics_hint')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">{t('muse.song_title')}</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('muse.song_title_placeholder')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">{t('muse.structure')}</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
                    >
                      <option value="" className="bg-gray-900">{t('muse.none')}</option>
                      {MASTER_TEMPLATES.map(tpl => (
                        <option key={tpl.id} value={tpl.id} className="bg-gray-900">{tpl.label}</option>
                      ))}
                      {templates.map(tpl => (
                        <option key={tpl.id} value={tpl.id} className="bg-gray-900">{tpl.title || tpl.label || tpl.id}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Style Selector */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Disc3 className="w-4 h-4 text-fuchsia-400" />
                {t('muse.style_label')}
              </label>
              <div className="space-y-3">
                {styles.length === 0 ? (
                  <div className="text-xs text-gray-500 px-4 py-6 bg-white/5 rounded-xl border border-white/10 text-center">
                    {loadingConfig ? t('muse.loading') : t('muse.no_styles')}
                  </div>
                ) : (
                  styles.map((group) => (
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
                            className={`px-3.5 py-2 text-xs rounded-lg border transition-all flex items-center gap-1.5 ${selectedStyle === s.style
                                ? 'bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 border-fuchsia-500/50 text-fuchsia-200 shadow-lg shadow-fuchsia-500/10'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/10'
                              }`}
                          >
                            <span className="text-sm">{STYLE_ICONS[s.style] || '🎵'}</span>
                            {s.style}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Advanced Options */}
            <details className="group" open>
              <summary className="flex items-center justify-between cursor-pointer text-sm text-gray-400 hover:text-white transition-colors list-none py-2">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-fuchsia-400" />
                  {t('muse.advanced')}
                </span>
                <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">{t('muse.vocal')}</label>
                  <select
                    value={selectedVocal}
                    onChange={(e) => setSelectedVocal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50 transition-all"
                  >
                    <option value="" className="bg-gray-900">{t('muse.random')}</option>
                    <option value="m" className="bg-gray-900">♂ {t('muse.male')}</option>
                    <option value="f" className="bg-gray-900">♀ {t('muse.female')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">{t('muse.language')}</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50 transition-all"
                  >
                    <option value="" className="bg-gray-900">{t('muse.auto')}</option>
                    <option value="1001" className="bg-gray-900">{t('muse.chinese')}</option>
                    <option value="1003" className="bg-gray-900">{t('muse.cantonese')}</option>
                    <option value="1004" className="bg-gray-900">{t('muse.english')}</option>
                    <option value="1002" className="bg-gray-900">{t('muse.japanese')}</option>
                    <option value="1005" className="bg-gray-900">{t('muse.korean')}</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all w-full">
                    <input
                      type="checkbox"
                      checked={instrumental}
                      onChange={(e) => setInstrumental(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-fuchsia-500 focus:ring-fuchsia-500/30"
                    />
                    <div>
                      <p className="text-sm text-white font-medium">{t('muse.instrumental')}</p>
                      <p className="text-[10px] text-gray-500">{t('muse.instrumental_desc')}</p>
                    </div>
                  </label>
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
                  {t('muse.generate_btn')}
                </>
              )}
            </button>

            {!museStatus?.configured && (
              <p className="text-xs text-center text-amber-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {t('muse.not_configured')}
              </p>
            )}
            {!isMock && isSubscriptionExpired && credit === 0 && totalEvaluationCredit === 0 && (
              <p className="text-xs text-center text-red-400">
                账户无可用积分，请前往 muse.top 充值或续费
              </p>
            )}
          </div>
        </div>

        {/* Right Panel - Result / Progress */}
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
                  <p className="text-[11px] text-gray-500">{t('muse.generating_hint')}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>

              {/* Steps */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'submit', label: t('muse.uploading'), icon: Send },
                  { key: 'analyze', label: t('muse.analyzing'), icon: BarChart3 },
                  { key: 'compose', label: t('muse.composing'), icon: Music2 },
                  { key: 'master', label: t('muse.mastering'), icon: Disc3 },
                ].map((step, idx) => (
                  <div
                    key={step.key}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${activeSteps[step.key]
                        ? 'bg-fuchsia-500/10 border border-fuchsia-500/20'
                        : 'bg-white/5 border border-white/5'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeSteps[step.key]
                        ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 shadow-lg shadow-fuchsia-500/20'
                        : 'bg-white/5'
                      }`}>
                      <step.icon className={`w-4 h-4 transition-colors ${activeSteps[step.key] ? 'text-white' : 'text-gray-500'
                        } ${activeSteps[step.key] && progress < (idx + 1) * 25 ? 'animate-pulse' : ''}`} />
                    </div>
                    <span className={`text-[9px] text-center leading-tight ${activeSteps[step.key] ? 'text-fuchsia-300' : 'text-gray-500'
                      }`}>
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
                  <h3 className="text-base font-bold text-white">{t('muse.result')}</h3>
                </div>
                <button
                  onClick={() => { setGeneratedSong(null); setError(null); }}
                  className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                >
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    {t('muse.new_song')}
                  </span>
                </button>
              </div>

              {/* Cover Art + Info */}
              <div className="flex gap-4">
                <div className="w-36 h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-fuchsia-500/30 to-purple-600/30 flex-shrink-0 shadow-xl shadow-fuchsia-500/10 relative group">
                  {generatedSong.imageUrl ? (
                    <img
                      src={generatedSong.imageUrl}
                      alt={generatedSong.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-fuchsia-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h4 className="text-lg font-bold text-white truncate">{generatedSong.title}</h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <User className="w-3 h-3" />
                      {generatedSong.userName}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(generatedSong.duration)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 text-[10px]">
                      {t('muse.muse_source')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadAudio}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-fuchsia-300 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载
                    </button>
                    <a
                      href={generatedSong.audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                    >
                      {t('muse.open_in_muse')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Full Audio Player */}
              {generatedSong.audioUrl && (
                <div className="space-y-2">
                  <audio
                    ref={audioRef}
                    src={generatedSong.audioUrl}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => setPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    className="hidden"
                  />

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={togglePlay}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center hover:from-fuchsia-400 hover:to-purple-500 transition-all shadow-lg shadow-fuchsia-500/30 hover:scale-105"
                      >
                        {playing ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div
                          onClick={handleSeek}
                          className="h-2 bg-white/10 rounded-full cursor-pointer group hover:h-2.5 transition-all relative"
                        >
                          <div
                            className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full relative"
                            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-gray-500 font-mono">{formatTime(currentTime)}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{formatTime(duration)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-gray-400" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 accent-fuchsia-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Lyrics Display */}
              {mode === 'master' && lyrics && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-300">{t('muse.lyrics_used')}</p>
                    <button
                      onClick={copyLyrics}
                      className="flex items-center gap-1 text-[11px] text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      {t('muse.copy')}
                    </button>
                  </div>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono max-h-40 overflow-auto leading-relaxed">{lyrics}</pre>
                </div>
              )}

              <div className="flex items-center justify-center pt-2 border-t border-white/5">
                <p className="text-[10px] text-gray-600 text-center">
                  {t('muse.not_stored_notice')}
                </p>
              </div>
            </div>
          )}

          {/* Default State - Tips */}
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
                  <span><strong className="text-gray-300">大师模式</strong>：提供完整歌词，精确控制风格和语言</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-fuchsia-400 flex-shrink-0" />
                  <span>确保已在 Edge 浏览器登录 muse.top 账户</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-fuchsia-400 flex-shrink-0" />
                  <span>生成的歌曲将使用你的 Muse 账户积分</span>
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