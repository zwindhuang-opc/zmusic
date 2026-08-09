import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music, Sparkles, Loader, Play, Pause, Clock, Settings,
  Headphones, User, AlertCircle, ChevronDown, Send,
  Disc3, Volume2, Copy, Download, Upload,
  Music2, Zap, BarChart3, RefreshCw, X, ChevronRight,
  Layers, Gauge, KeyRound, Star, Tag, FileText, Wand2,
  XCircle, CheckCircle, Info, AlertTriangle, ChevronUp,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';

const API_BASE = '/api';

function proxyAudioUrl(url) {
  if (!url) return url;
  if (url.startsWith('/api/proxy')) return url;
  const corsFriendly = ['w3schools.com', 'soundhelix.com', 'archive.org', 'cdn.jsdelivr.net'];
  if (corsFriendly.some(domain => url.includes(domain))) return url;
  return `${API_BASE}/proxy/audio?url=${encodeURIComponent(url)}`;
}

const MELO_STYLE_TAGS = {
  genres: [
    '流行', '摇滚', '电子', '民谣', '古风', 'R&B', '爵士', '古典',
    '嘻哈', '雷鬼', '蓝调', '乡村', '金属', '朋克', '灵魂',
    '放克', '迪斯科', '氛围', '新世纪', '凯尔特', '拉丁',
  ],
  instruments: [
    '钢琴', '吉他', '贝斯', '鼓', '小提琴', '大提琴', '萨克斯',
    '长笛', '口琴', '手风琴', '尤克里里', '合成器', '电钢',
    '班卓琴', '曼陀林', '竖琴', '管风琴', '特雷门琴',
  ],
  moods: [
    '欢快', '忧伤', '浪漫', '激昂', '平静', '神秘', '紧张',
    '轻松', '深情', '豪迈', '治愈', '孤独', '狂欢', '思念',
    '励志', '怀旧', '梦幻', '力量', '温柔', '激情',
  ],
  vocal: [
    '男声', '女声', '童声', '合唱', '和声', '说唱',
    '气声', '嘶吼', '吟唱', '嘟哝', '假声',
  ],
  effects: [
    '混响', '延迟', '合唱', '失真', '压缩', '均衡',
    '门限', '相位', '颤音', '回响', '回声', '哇音',
    '重低音', '高频提升', '立体声扩展',
  ],
};

const STRUCTURE_TEMPLATES = [
  { id: 'verse-chorus', label: '主歌-副歌', desc: '经典流行结构', icon: '🎵' },
  { id: 'verse-pre-chorus', label: '主歌-预副歌-副歌', desc: '带预副歌的情感递进', icon: '🎶' },
  { id: 'aaba', label: 'AABA 爵士曲式', desc: '爵士标准曲式', icon: '🎷' },
  { id: 'through-composed', label: '通奏结构', desc: '无重复段落，叙事性强', icon: '📖' },
  { id: 'loop', label: '循环/BGM', desc: '适合背景音乐循环', icon: '🔁' },
  { id: 'intro-drop', label: 'Intro-Drop 电子', desc: '电子舞曲结构', icon: '⚡' },
];

const BPM_PRESETS = [60, 80, 100, 120, 140, 160, 180];
const KEY_OPTIONS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];
const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '5/4', '6/8', '7/8'];

const LAYER_TEMPLATES = {
  foundation: '[LAYER: FOUNDATION]\n底层节拍: 120bpm基础律动, 构建稳定的waltz三拍子探戈节拍',
  melody: '[LAYER: MELODY]\n旋律层: 以Eason Chan孤獨探戈的主旋律线条, 表达夜来独行的lonely情绪, 配合classical elements',
  expression: '[LAYER: EXPRESSION]\n表现层: 风声与雨声脚步声, 深度诠释黑夜的"静"与人心中的"动"的互动情感',
  effects: '[LAYER: EFFECTS]\n效果层: 开场的7-8秒雨水风声5-6秒脚步声混响、4-5延迟渐入人声独白、调制效果入情入境',
};

const QUICK_LYRICS_TEMPLATES = [
  '夜雨轻敲长街冷，踏碎水中明月影',
  '夏日海边的晚风，吹拂着你的长发',
  '都市霓虹闪烁，独行的身影在雨中',
  '童年的纸飞机，飞不过那片天空',
  '心跳加速的瞬间，是你微笑的样子',
  '月光洒满长街，孤影伴我同行',
];

function MeloPage() {
  const { t } = useTranslation();
  const { pendingLyrics, clearPendingLyrics, startSession, updateSession, appendLog, cancelSession, completeSession, activeSession, sessions } = useGeneration();
  const cancelRef = useRef(false);

  const [lyrics, setLyrics] = useState('');
  const [title, setTitle] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [selectedVocals, setSelectedVocals] = useState([]);
  const [selectedEffects, setSelectedEffects] = useState([]);
  const [selectedStructure, setSelectedStructure] = useState('');

  const [bpm, setBpm] = useState(120);
  const [audioKey, setAudioKey] = useState('C');
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [audioWeight, setAudioWeight] = useState(0.5);

  const [layers, setLayers] = useState({
    foundation: '',
    melody: '',
    expression: '',
    effects: '',
  });

  const [meloStatus, setMeloStatus] = useState({ configured: false, mock: false });
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
    submit: false, analyze: false, compose: false, master: false,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  useEffect(() => {
    loadMeloConfig();
  }, []);

  useEffect(() => {
    if (pendingLyrics) {
      setLyrics(pendingLyrics);
      clearPendingLyrics();
    }
  }, [pendingLyrics]);

  const loadMeloConfig = async () => {
    setLoadingConfig(true);
    try {
      const statusRes = await fetch('/api/melo/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setMeloStatus(statusData?.data || statusData);
      }

      const userRes = await fetch('/api/melo/user');
      if (userRes.ok) {
        const userData = await userRes.json();
        // Surface the raw payload so we can see which credit field the API
        // actually sends — never hardcode or guess the field name.
        // eslint-disable-next-line no-console
        console.log('[MeloPage] Raw /api/melo/user response:', JSON.stringify(userData, null, 2));
        setUserInfo(userData.data || userData);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingConfig(false);
    }
  };

  const toggleTag = (tag, selected, setter) => {
    if (selected.includes(tag)) {
      setter(selected.filter(t => t !== tag));
    } else {
      setter([...selected, tag]);
    }
  };

  const buildFullLyrics = () => {
    let result = lyrics.trim();
    if (layers.foundation.trim()) {
      result += '\n\n' + layers.foundation;
    }
    if (layers.melody.trim()) {
      result += '\n\n' + layers.melody;
    }
    if (layers.expression.trim()) {
      result += '\n\n' + layers.expression;
    }
    if (layers.effects.trim()) {
      result += '\n\n' + layers.effects;
    }
    return result;
  };

  const handleCancelGeneration = useCallback(() => {
    cancelRef.current = true;
    if (taskId) {
      cancelSession(activeSession?.id);
    }
    setPollMessage('已取消生成');
  }, [cancelSession, activeSession, taskId]);

  const handleGenerate = async () => {
    cancelRef.current = false;
    setError(null);
    setGeneratedSong(null);
    setGenerating(true);
    setPollStatus('submitting');
    setPollMessage('正在提交到 Melo AI...');
    setProgress(5);
    setActiveSteps({ submit: true, analyze: false, compose: false, master: false });

    const fullLyrics = buildFullLyrics();
    const styleTags = [
      ...selectedGenres,
      ...selectedInstruments,
      ...selectedMoods,
      ...selectedVocals,
      ...selectedEffects,
    ];

    const params = {
      lyrics: fullLyrics,
      title: title || undefined,
      styleTags,
      bpm,
      key: audioKey,
      timeSignature,
      structure: selectedStructure,
      audioWeight,
      layers,
    };

    const session = startSession({
      type: 'song',
      engine: 'melo',
      title: title || 'Untitled',
      lyrics: fullLyrics,
      params,
    });

    try {
      appendLog(session.id, 'info', `Submitting to Melo AI with ${styleTags.length} style tags...`);

      const response = await fetch('/api/melo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '生成失败');
      }

      const tid = result?.data?.taskId;
      setTaskId(tid);
      setPollStatus('processing');
      setPollMessage('Melo AI 正在创作...');
      setProgress(20);
      setActiveSteps({ submit: true, analyze: true, compose: false, master: false });

      updateSession(session.id, {
        status: 'processing',
        taskId: tid,
        progress: 10,
        logEntry: `Task created: ${tid}`,
      });

      const finalSong = await pollUntilDone(tid, session.id);

      setPollStatus('success');
      setProgress(100);
      setActiveSteps({ submit: true, analyze: true, compose: true, master: true });

      const songData = {
        title: finalSong?.title || title || '未命名',
        audioUrl: proxyAudioUrl(finalSong?.audioUrl),
        imageUrl: finalSong?.imageUrl,
        duration: finalSong?.duration || 0,
        userName: finalSong?.userName || 'Melo AI',
        taskId: tid,
        bpm: finalSong?.bpm || bpm,
        key: finalSong?.key || audioKey,
        timeSignature: finalSong?.timeSignature || timeSignature,
      };
      setGeneratedSong(songData);
      setPollMessage('生成完成！');

      completeSession(session.id, {
        audioUrl: songData.audioUrl,
        imageUrl: songData.imageUrl,
        result: songData,
      });

      if (songData.audioUrl) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
          }
        }, 300);
      }
    } catch (e) {
      if (cancelRef.current) {
        setPollStatus('cancelled');
        setPollMessage('已取消生成');
        completeSession(session.id, { error: 'Cancelled by user' });
      } else {
        setError(e.message);
        setPollStatus('failed');
        setPollMessage('生成失败');
        setActiveSteps({ submit: false, analyze: false, compose: false, master: false });
        completeSession(session.id, { error: e.message });
      }
    } finally {
      setGenerating(false);
    }
  };

  const pollUntilDone = async (tid, sessionId) => {
    const interval = 3000;
    const timeout = 120000;
    const start = Date.now();
    let pollCount = 0;

    while (Date.now() - start < timeout) {
      if (cancelRef.current) {
        throw new Error('Cancelled by user');
      }

      pollCount++;
      try {
        const res = await fetch(`/api/melo/task/${encodeURIComponent(tid)}`);
        const data = await res.json();
        const task = data.data || data;

        const status = String(task?.status || '').toLowerCase();
        let newProgress;
        if (task?.progress) {
          newProgress = task.progress;
          setProgress(task.progress);
        } else {
          newProgress = Math.min(85, 20 + pollCount * 10);
          setProgress(prev => Math.min(85, prev + 10));
        }

        let stageMessage = '';
        let newSteps = { submit: true, analyze: false, compose: false, master: false };

        if (pollCount <= 1) {
          stageMessage = 'AI 正在分析指令...';
          newSteps = { submit: true, analyze: true, compose: false, master: false };
        } else if (pollCount <= 2) {
          stageMessage = 'AI 正在编排旋律...';
          newSteps = { submit: true, analyze: true, compose: false, master: false };
        } else if (pollCount <= 3) {
          stageMessage = 'AI 正在合成人声...';
          newSteps = { submit: true, analyze: true, compose: true, master: false };
        } else {
          stageMessage = 'AI 正在母带处理...';
          newSteps = { submit: true, analyze: true, compose: true, master: true };
        }

        setPollMessage(stageMessage);
        setActiveSteps(newSteps);

        if (sessionId) {
          updateSession(sessionId, {
            status: 'processing',
            progress: newProgress,
            logEntry: `[Poll ${pollCount}] ${stageMessage} (progress: ${newProgress}%)`,
          });
        }

        if (status.includes('success') || status.includes('complete') || task?.audioUrl) {
          if (sessionId) {
            appendLog(sessionId, 'success', `Generation complete! Task: ${tid}`);
          }
          return task;
        }
        if (status.includes('fail') || status.includes('error')) {
          throw new Error(`生成失败: ${task?.msg || task?.failReason || status}`);
        }
      } catch (e) {
        if (e.message.includes('生成失败') || e.message.includes('Cancelled')) {
          throw e;
        }
        if (sessionId) {
          appendLog(sessionId, 'warn', `Poll retry ${pollCount}: ${e.message}`);
        }
      }
      await new Promise(r => setTimeout(r, interval));
    }
    throw new Error('生成超时，请重试');
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
    const fullLyrics = buildFullLyrics();
    if (fullLyrics) {
      navigator.clipboard?.writeText(fullLyrics);
    }
  };

  const downloadAudio = () => {
    if (generatedSong?.audioUrl) {
      const a = document.createElement('a');
      a.href = generatedSong.audioUrl;
      a.download = `${generatedSong.title || 'melo-song'}.mp3`;
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

  const toggleLayerTemplate = (layerKey) => {
    const template = LAYER_TEMPLATES[layerKey];
    if (layers[layerKey]) {
      setLayers(prev => ({ ...prev, [layerKey]: '' }));
    } else {
      setLayers(prev => ({ ...prev, [layerKey]: template }));
    }
  };

  const loadQuickTemplate = (text) => {
    setLyrics(text);
    setLayers({ foundation: '', melody: '', expression: '', effects: '' });
  };

  // Match ALL possible credit field names returned by Melo API — no guessing,
  // pick whichever field the actual API sends back. If none match, fall back
  // to the credits reported by /api/melo/status (which already resolved the
  // real number from Melo's /api/v1/user/info), then 0.
  const userCredits =
    userInfo?.credits ??
    userInfo?.credit ??
    userInfo?.points ??
    userInfo?.point ??
    userInfo?.balance ??
    userInfo?.remaining ??
    userInfo?.memberCredit ??
    userInfo?.member_credit ??
    userInfo?.quota ??
    userInfo?.data?.credits ??
    userInfo?.data?.credit ??
    userInfo?.data?.points ??
    userInfo?.userInfo?.credits ??
    userInfo?.userInfo?.credit ??
    null;
  const credits = userCredits ?? meloStatus?.credits ?? 0;
  const canGenerate = meloStatus?.configured && !generating && credits > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/15 to-yellow-500/15 border border-amber-500/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-orange-500/0 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-yellow-500/15 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent">
                Melo AI 音乐生成
              </h1>
              <p className="text-sm text-amber-200/70 mt-0.5">
                字节旋律 · 多层面AI作曲 · 精确控制每一个音乐细节
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${meloStatus?.configured
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              }`}>
              <div className={`w-2 h-2 rounded-full ${meloStatus?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {meloStatus?.configured ? '已连接' : '未连接'}
              {loadingConfig && <Loader className="w-3 h-3 animate-spin" />}
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-xs text-gray-400">积分</span>
              <span className="text-base font-mono text-amber-300 font-bold">{credits}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error / Warning Banners */}
      {error && (
        <div className="p-4 rounded-xl border text-sm flex items-start gap-3 bg-red-500/10 border-red-500/40 text-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-300/50 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-3 space-y-5">
          {/* Lyrics Input Card */}
          <div className="glass p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <FileText className="w-4 h-4 text-amber-400" />
                歌词输入
              </label>
              <span className="text-[10px] text-gray-500">{lyrics.length} 字符</span>
            </div>

            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="输入歌词... 支持 [LAYER: FOUNDATION]、[LAYER: MELODY]、[LAYER: EXPRESSION]、[LAYER: EFFECTS] 多层指令格式"
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 resize-y font-mono transition-all"
            />

            {/* Quick Templates */}
            <div className="flex gap-1.5 flex-wrap">
              {QUICK_LYRICS_TEMPLATES.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => loadQuickTemplate(chip)}
                  className="px-2.5 py-1 text-[11px] rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-amber-500/20 hover:border-amber-500/30 border border-white/10 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Multi-Layer System */}
            <div className="border-t border-white/10 pt-4">
              <button
                onClick={() => setShowLayers(!showLayers)}
                className="w-full flex items-center justify-between py-2 text-sm text-gray-300 hover:text-amber-300 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  多层指令系统 (Foundation / Melody / Expression / Effects)
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showLayers ? 'rotate-180' : ''}`} />
              </button>

              {showLayers && (
                <div className="mt-3 space-y-3">
                  {Object.entries(LAYER_TEMPLATES).map(([key, template], idx) => {
                    const labels = {
                      foundation: '基础层 (节拍/BPM/节奏)',
                      melody: '旋律层 (人声风格/乐器)',
                      expression: '表现层 (动态/情感)',
                      effects: '效果层 (混响/延迟/SFX)',
                    };
                    const colors = {
                      foundation: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
                      melody: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
                      expression: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
                      effects: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
                    };
                    const icons = {
                      foundation: '🥁', melody: '🎵', expression: '💫', effects: '✨',
                    };
                    return (
                      <div key={key} className={`p-3 rounded-xl bg-gradient-to-r ${colors[key]} border transition-all`}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center gap-2 text-xs font-medium text-gray-300">
                            <span className="text-sm">{icons[key]}</span>
                            {labels[key]}
                          </label>
                          <button
                            onClick={() => toggleLayerTemplate(key)}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 hover:bg-amber-500/30 hover:text-amber-200 transition-all"
                          >
                            {layers[key] ? '清空' : '加载模板'}
                          </button>
                        </div>
                        <textarea
                          value={layers[key]}
                          onChange={(e) => setLayers(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={template.split('\n')[1] || `描述${labels[key]}...`}
                          className="w-full h-16 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 resize-y font-mono transition-all"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Style Tags Card */}
          <div className="glass p-6 rounded-2xl space-y-5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Tag className="w-4 h-4 text-amber-400" />
              风格标签
            </label>

            {[
              { key: 'genres', label: '流派', icon: '🎸', selected: selectedGenres, setter: setSelectedGenres },
              { key: 'instruments', label: '乐器', icon: '🎹', selected: selectedInstruments, setter: setSelectedInstruments },
              { key: 'moods', label: '情绪', icon: '💭', selected: selectedMoods, setter: setSelectedMoods },
              { key: 'vocal', label: '人声', icon: '🎤', selected: selectedVocals, setter: setSelectedVocals },
              { key: 'effects', label: '效果', icon: '🌀', selected: selectedEffects, setter: setSelectedEffects },
            ].map((group) => (
              <div key={group.key}>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3" />
                  {group.icon} {group.label}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {MELO_STYLE_TAGS[group.key].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag, group.selected, group.setter)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${group.selected.includes(tag)
                        ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-amber-500/50 text-amber-100 shadow-lg shadow-amber-500/10'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/10'
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Structure & Advanced Card */}
          <div className="glass p-6 rounded-2xl space-y-5">
            {/* Title Input */}
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">歌曲标题</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="为你的歌曲取一个名字"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>

            {/* Structure Templates */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                <Music2 className="w-3.5 h-3.5 text-amber-400" />
                结构模板
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {STRUCTURE_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedStructure(selectedStructure === tpl.id ? '' : tpl.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${selectedStructure === tpl.id
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{tpl.icon}</span>
                      <span className="text-xs font-medium text-white">{tpl.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">{tpl.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            <details className="group" open={showAdvanced}>
              <summary
                onClick={(e) => { e.preventDefault(); setShowAdvanced(!showAdvanced); }}
                className="flex items-center justify-between cursor-pointer text-sm text-gray-400 hover:text-amber-300 transition-colors list-none py-2"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  高级控制
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </summary>
              {showAdvanced && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* BPM */}
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-1.5">
                      <Gauge className="w-3 h-3 text-amber-400" />
                      BPM
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="40"
                        max="200"
                        value={bpm}
                        onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                        className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-amber-500/50 transition-all"
                      />
                      <div className="flex gap-0.5">
                        {BPM_PRESETS.map((b) => (
                          <button
                            key={b}
                            onClick={() => setBpm(b)}
                            className={`w-6 h-6 text-[10px] rounded transition-all ${bpm === b
                              ? 'bg-amber-500/30 text-amber-200'
                              : 'bg-white/5 text-gray-500 hover:text-white'
                              }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Key */}
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-1.5">
                      <KeyRound className="w-3 h-3 text-amber-400" />
                      调性
                    </label>
                    <select
                      value={audioKey}
                      onChange={(e) => setAudioKey(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all"
                    >
                      {KEY_OPTIONS.map((k) => (
                        <option key={k} value={k} className="bg-gray-900">{k}</option>
                      ))}
                    </select>
                  </div>

                  {/* Time Signature */}
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">拍号</label>
                    <select
                      value={timeSignature}
                      onChange={(e) => setTimeSignature(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all"
                    >
                      {TIME_SIGNATURES.map((t) => (
                        <option key={t} value={t} className="bg-gray-900">{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Audio Weight */}
                  <div>
                    <label className="flex items-center justify-between text-xs font-medium text-gray-400 mb-1.5">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400" />
                        创意权重
                      </span>
                      <span className="text-amber-300 font-mono">{audioWeight.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={audioWeight}
                      onChange={(e) => setAudioWeight(parseFloat(e.target.value))}
                      className="w-full h-1.5 accent-amber-500 cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">低=严格遵循指令 · 高=AI自由发挥</p>
                  </div>
                </div>
              )}
            </details>
          </div>

          {/* Generate Button & Cancel */}
          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="flex-1 w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:via-orange-400 hover:to-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.01] active:scale-[0.99]"
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
            {generating && (
              <button
                onClick={handleCancelGeneration}
                className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-sm font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all"
              >
                <XCircle className="w-5 h-5" />
                取消
              </button>
            )}
          </div>

          {!meloStatus?.configured && (
            <p className="text-xs text-center text-amber-400 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Melo AI 未配置，请联系管理员
            </p>
          )}
        </div>

        {/* Right Panel - Result / Progress */}
        <div className="lg:col-span-2 space-y-5">
          {/* Generation Progress with Logs */}
          {(generating || activeSession) && pollStatus !== 'success' && (
            <div className="glass p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  {pollStatus === 'cancelled' ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <Loader className="w-5 h-5 text-white animate-spin" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{pollMessage}</p>
                  <p className="text-[11px] text-gray-500">
                    {pollStatus === 'cancelled' ? 'Generation cancelled' : 'AI analyzing your instructions, arranging music, synthesizing vocals...'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-out relative ${pollStatus === 'cancelled'
                    ? 'bg-gradient-to-r from-red-500 to-red-400'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500'
                    }`}
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>

              {/* Steps */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'submit', label: '上传中', icon: Send },
                  { key: 'analyze', label: '分析中', icon: BarChart3 },
                  { key: 'compose', label: '编曲中', icon: Music2 },
                  { key: 'master', label: '母带处理', icon: Disc3 },
                ].map((step, idx) => (
                  <div
                    key={step.key}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${activeSteps[step.key]
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : 'bg-white/5 border border-white/5'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeSteps[step.key]
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20'
                      : 'bg-white/5'
                      }`}>
                      <step.icon className={`w-4 h-4 transition-colors ${activeSteps[step.key] ? 'text-white' : 'text-gray-500'
                        } ${activeSteps[step.key] && progress < (idx + 1) * 25 ? 'animate-pulse' : ''}`} />
                    </div>
                    <span className={`text-[9px] text-center leading-tight ${activeSteps[step.key] ? 'text-amber-300' : 'text-gray-500'
                      }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Log Panel */}
              {activeSession?.logs?.length > 0 && (
                <div className="bg-black/30 rounded-xl border border-white/5 p-3 max-h-40 overflow-y-auto">
                  <p className="text-[10px] font-semibold text-gray-400 mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    生成日志
                  </p>
                  <div className="space-y-1">
                    {activeSession.logs.slice(-8).map((log) => (
                      <div key={log.id} className="flex items-start gap-2 text-[10px] font-mono">
                        <span className={`mt-0.5 ${log.level === 'success' ? 'text-emerald-400'
                          : log.level === 'warn' ? 'text-amber-400'
                            : log.level === 'error' ? 'text-red-400'
                              : 'text-sky-400'
                          }`}>
                          {log.level === 'success' ? '✓' : log.level === 'warn' ? '⚠' : log.level === 'error' ? '✗' : '›'}
                        </span>
                        <span className="text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-gray-300 flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generation History */}
          {!generating && activeSession && activeSession.status === 'cancelled' && (
            <div className="glass p-4 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-red-300">生成已取消</p>
                <p className="text-[11px] text-gray-400">你可以修改歌词或参数后重新生成</p>
              </div>
            </div>
          )}

          {/* Generated Song Result */}
          {generatedSong && (
            <div className="glass p-5 rounded-2xl space-y-4 border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Disc3 className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">生成结果</h3>
                </div>
                <button
                  onClick={() => { setGeneratedSong(null); setError(null); }}
                  className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                >
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    再生成一首
                  </span>
                </button>
              </div>

              {/* Cover Art + Info */}
              <div className="flex gap-4">
                <div className="w-36 h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500/30 to-orange-600/30 flex-shrink-0 shadow-xl shadow-amber-500/10 relative group">
                  {generatedSong.imageUrl ? (
                    <img
                      src={generatedSong.imageUrl}
                      alt={generatedSong.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-12 h-12 text-amber-400" />
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

                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(generatedSong.duration)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                      {generatedSong.bpm} BPM
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px]">
                      {generatedSong.key} · {generatedSong.timeSignature}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadAudio}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-amber-300 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载
                    </button>
                    <button
                      onClick={copyLyrics}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-amber-300 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      复制歌词
                    </button>
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
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/30 hover:scale-105"
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
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full relative"
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
                          className="w-16 h-1 accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generation History */}
          {sessions && sessions.filter(s => s.engine === 'melo' && (s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled')).length > 0 && (
            <div className="glass p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-white">生成历史</h3>
                  <span className="text-[10px] text-gray-500">
                    {sessions.filter(s => s.engine === 'melo' && (s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled')).length} 条记录
                  </span>
                </div>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sessions
                  .filter(s => s.engine === 'melo' && (s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled'))
                  .slice(0, 10)
                  .map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-xl border transition-all ${session.status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20' :
                        session.status === 'failed' ? 'bg-red-500/5 border-red-500/20' :
                          'bg-gray-500/5 border-gray-500/20'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {session.status === 'completed' ? (
                              <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            ) : session.status === 'failed' ? (
                              <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="text-xs font-medium text-white truncate">{session.title}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 line-clamp-2 font-mono">
                            {session.lyrics?.slice(0, 80)}{session.lyrics?.length > 80 ? '...' : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500">
                            <span>{new Date(session.startedAt).toLocaleTimeString()}</span>
                            {session.duration && (
                              <span>· {session.duration}s</span>
                            )}
                            <span>· {session.params?.styleTags?.length || 0} tags</span>
                          </div>
                        </div>
                        {session.status === 'completed' && session.audioUrl && (
                          <button
                            onClick={() => {
                              setGeneratedSong({
                                title: session.result?.title || session.title,
                                audioUrl: session.audioUrl,
                                imageUrl: session.imageUrl,
                                duration: session.result?.duration || 0,
                                taskId: session.taskId,
                              });
                            }}
                            className="flex-shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                            title="Restore this song"
                          >
                            <Play className="w-4 h-4 text-amber-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Feature Cards / Default State */}
          {!generatedSong && !generating && (
            <div className="glass p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Melo AI 特性</h3>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-white">多层指令系统</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    通过 Foundation / Melody / Expression / Effects 四层指令，精确控制节拍、旋律、情感和音效
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-medium text-white">丰富风格标签</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    20+ 流派、18+ 乐器、20+ 情绪、12+ 人声、15+ 效果器自由组合
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-medium text-white">精细控制</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    BPM、调性、拍号、创意权重全可调，打造你的专属声音
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-400/10 to-orange-400/10 border border-amber-400/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Music2 className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-medium text-white">多种结构模板</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    经典流行、爵士AABA、电子Drop等6种结构模板可选
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  💡 提示：在歌词中使用 [LAYER: FOUNDATION]、[LAYER: MELODY] 等标签可以精确控制生成结果
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MeloPage;