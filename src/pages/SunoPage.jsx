import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cloud, Sparkles, Loader, Play, Pause, Clock, Users, CreditCard,
  AlertCircle, ChevronDown, Send, Disc3, Volume2, Download, Music,
  User, RefreshCw, X, ChevronRight, Mic, Wand2, Sliders, Tag,
  ListMusic, Trash2, History, CheckCircle2, Loader2
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import SunoService from '../services/suno.service.js';

const PROMPT_INSPIRATIONS = [
  '追逐梦想的励志之歌，充满力量与希望',
  '夏日海边的浪漫回忆，温暖的情歌',
  '都市深夜的孤独独白，忧伤的旋律',
  '童年时光的怀旧音乐，温馨治愈',
  '自由奔跑的青春呐喊，活力四射',
  '暗恋心跳的甜蜜心事，羞涩表达',
  '远方故乡的思念，民谣风格',
  '史诗般的电影配乐，宏大壮丽',
];

const STYLE_PRESETS = [
  { id: 'pop', label: '流行', tags: 'pop, upbeat, catchy melody, modern production' },
  { id: 'rock', label: '摇滚', tags: 'rock, electric guitar, heavy drums, powerful vocals' },
  { id: 'electronic', label: '电子', tags: 'electronic, synthwave, arpeggiator, digital drums' },
  { id: 'hip_hop', label: '嘻哈', tags: 'hip hop, rap, beat, bassline, urban' },
  { id: 'ballad', label: '抒情', tags: 'ballad, piano, acoustic guitar, emotional vocals' },
  { id: 'jazz', label: '爵士', tags: 'jazz, saxophone, swing, smooth, improvisation' },
  { id: 'classical', label: '古典', tags: 'classical, orchestra, violin, cello, dramatic' },
  { id: 'rnb', label: 'R&B', tags: 'rnb, soul, piano, bass, smooth vocals' },
  { id: 'folk', label: '民谣', tags: 'folk, acoustic, storytelling, warm, earthy' },
  { id: 'ambient', label: '氛围', tags: 'ambient, atmospheric, drone, meditative, calming' },
  { id: 'epic', label: '史诗', tags: 'epic, cinematic, orchestra, choir, dramatic, heroic' },
  { id: 'ancient', label: '古风', tags: 'ancient, chinese folk, guzheng, traditional, classical' },
];

const LYRICS_TEMPLATES = [
  '[Verse]\n晨光洒进窗台\n梦想在心中澎湃\n告别昨日的迷茫\n迎接崭新的未来\n\n[Pre-Chorus]\n每一步都是成长\n每一秒都是希望\n\n[Chorus]\n追逐梦想永不放弃\n星光闪耀在心底\n跨过山河大海\n未来由我主宰\n',
  '[Verse]\n夏日海边的微风\n轻轻吹过我的梦\n夕阳染红了天空\n你笑容比糖更浓\n\n[Pre-Chorus]\n时间慢下来\n心跳加快\n\n[Chorus]\n这是我们的夏天\n浪漫的海边誓言\n海浪为我们伴奏\n永远不说再见\n',
  '[Verse]\n霓虹闪烁的街头\n孤独的人在游走\n城市太喧嚣\n心却太安静\n\n[Pre-Chorus]\n谁能听见我的歌\n谁能懂我的寂寞\n\n[Chorus]\n深夜的独白\n写给远方的你\n如果思念有声音\n那是风在唱歌\n',
];

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function proxyAudioUrl(url) {
  if (!url) return url;
  if (url.startsWith('/api/proxy')) return url;
  return url;
}

function SunoPage() {
  const { t } = useTranslation();

  const [mode, setMode] = useState('prompt');
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [styleInput, setStyleInput] = useState('');
  const [styleChips, setStyleChips] = useState([]);
  const [duration, setDuration] = useState(60);
  const [instrumental, setInstrumental] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [inspiration, setInspiration] = useState('');
  const [generatedLyrics, setGeneratedLyrics] = useState('');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);

  const [configured, setConfigured] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStage, setGenStage] = useState('idle');
  const [activeSteps, setActiveSteps] = useState({
    submit: false, analyze: false, compose: false, complete: false,
  });

  const [taskId, setTaskId] = useState(null);
  const [generatedSong, setGeneratedSong] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [audioList, setAudioList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(null);

  const [styleInputValue, setStyleInputValue] = useState('');

  useEffect(() => {
    loadConfig();
    loadAudioList();
  }, []);

  const loadConfig = async () => {
    setLoadingUser(true);
    try {
      const isOk = SunoService.isConfigured();
      setConfigured(isOk);
      if (isOk) {
        const user = await SunoService.getUserInfo();
        setUserInfo(user);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadAudioList = async () => {
    setLoadingList(true);
    try {
      const result = await SunoService.getMusicList(1, 20);
      const list = result?.list || result?.data?.list || result?.data || [];
      setAudioList(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load music list:', e);
    } finally {
      setLoadingList(false);
    }
  };

  const credit = userInfo?.credit ?? userInfo?.credits ?? userInfo?.memberCredit ?? 0;
  const isSubscribed = userInfo?.memberInfo?.subscription?.expired !== true;
  const canGenerate = configured && !generating && isSubscribed && credit > 0;

  const addStyleChip = () => {
    const val = styleInputValue.trim();
    if (val && !styleChips.includes(val)) {
      setStyleChips([...styleChips, val]);
      setStyleInputValue('');
    }
  };

  const removeStyleChip = (chip) => {
    setStyleChips(styleChips.filter((c) => c !== chip));
  };

  const handleStyleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addStyleChip();
    }
  };

  const applyStylePreset = (tags) => {
    const presets = tags.split(',').map((t) => t.trim()).filter(Boolean);
    const newChips = [...new Set([...styleChips, ...presets])];
    setStyleChips(newChips);
  };

  const handleGenerate = async () => {
    setError(null);
    setSuccessMsg(null);
    setGeneratedSong(null);

    const finalStyle = styleChips.length > 0 ? styleChips.join(', ') : styleInput;

    if (mode === 'prompt' && !prompt.trim()) {
      setError('请输入音乐描述词');
      return;
    }
    if (mode === 'lyrics' && !lyrics.trim()) {
      setError('请输入歌词内容');
      return;
    }
    if (credit <= 0) {
      setError('积分不足，请充值后再使用');
      return;
    }

    setGenerating(true);
    setGenProgress(5);
    setGenStage('submitting');
    setActiveSteps({ submit: true, analyze: false, compose: false, complete: false });

    try {
      const inputPrompt = mode === 'prompt' ? prompt : lyrics;
      const result = await SunoService.generateMusic(
        inputPrompt,
        finalStyle,
        duration,
        customMode,
        instrumental,
      );

      if (result.success && result.serialNos?.length > 0) {
        const serialNo = result.serialNos[0];
        setTaskId(serialNo);
        setGenProgress(25);
        setGenStage('analyzing');
        setActiveSteps({ submit: true, analyze: true, compose: false, complete: false });

        let taskResult = null;
        for (let attempt = 0; attempt < 20; attempt++) {
          await new Promise((r) => setTimeout(r, 3000));
          taskResult = await SunoService.queryTaskStatus(serialNo, false);

          if (taskResult.status === 'success') break;
          if (taskResult.status === 'failed') throw new Error(taskResult.error || '生成失败');

          setGenProgress(25 + Math.min(40, attempt * 3));
          setGenStage('composing');
          setActiveSteps({ submit: true, analyze: true, compose: true, complete: false });
        }

        setGenProgress(85);
        setGenStage('completing');
        setActiveSteps({ submit: true, analyze: true, compose: true, complete: true });

        if (taskResult?.status === 'success') {
          const audioUrl = proxyAudioUrl(taskResult.audioUrl || taskResult.url);
          const songData = {
            title: taskResult.title || (mode === 'prompt' ? prompt.slice(0, 30) : 'Suno Song'),
            audioUrl,
            duration: taskResult.duration || duration,
            coverUrl: taskResult.imageUrl || taskResult.coverUrl,
            taskId: serialNo,
            style: finalStyle,
            customMode,
            instrumental,
          };
          setGeneratedSong(songData);
          setGenProgress(100);
          setGenStage('complete');
          setSuccessMsg('歌曲生成成功！');

          loadAudioList();

          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.load();
            }
          }, 300);
        } else {
          throw new Error('生成超时，请重试');
        }
      } else {
        throw new Error(result.error || '提交失败');
      }
    } catch (e) {
      setError(e.message || '生成失败');
      setGenStage('failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateLyrics = async () => {
    if (!inspiration.trim()) {
      setError('请输入灵感描述');
      return;
    }
    setError(null);
    setIsGeneratingLyrics(true);
    try {
      const result = await SunoService.generateLyrics(inspiration, styleChips.join(', '));
      const text = result?.lyrics || result?.data?.lyrics || result?.data || '';
      setGeneratedLyrics(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
      setLyrics(typeof text === 'string' ? text : '');
      setSuccessMsg('歌词生成成功！');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setError(e.message || '歌词生成失败');
    } finally {
      setIsGeneratingLyrics(false);
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
    if (!audioRef.current || !audioDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioDuration;
    setCurrentTime(pct * audioDuration);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const downloadAudio = (url, title) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'suno-song'}.mp3`;
    a.target = '_blank';
    a.click();
  };

  const loadMoreHistory = () => {
    loadAudioList();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-600/20 via-purple-600/20 to-pink-600/20 border border-white/10 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/0 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/30">
              <Cloud className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Suno AI 音乐生成
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                由 Suno.cn 提供强力 AI 音乐生成服务
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${configured
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/10 text-red-300 border border-red-500/30'
              }`}>
              <div className={`w-2 h-2 rounded-full ${configured ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {configured ? '已连接' : '未连接'}
              {loadingUser && <Loader className="w-3 h-3 animate-spin" />}
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <CreditCard className="w-4 h-4 text-fuchsia-400" />
              <span className="text-xs text-gray-400">积分</span>
              <span className="text-base font-mono text-fuchsia-300 font-bold">{credit}</span>
              {userInfo?.memberInfo?.isMember && (
                <span className="px-1.5 py-0.5 text-[9px] rounded bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/30 font-medium">
                  VIP
                </span>
              )}
            </div>

            <button
              onClick={loadConfig}
              className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="刷新"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error / Success Banners */}
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

      {successMsg && !error && (
        <div className="p-4 rounded-xl border text-sm flex items-start gap-3 bg-emerald-500/10 border-emerald-500/40 text-emerald-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-300/50 hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!configured && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Suno AI 未配置</p>
            <p className="text-xs text-amber-300/70 mt-0.5">
              请在后端服务器配置 SUNO_CN_API_KEY 环境变量以启用 Suno AI 生成服务。
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
              onClick={() => { setMode('prompt'); setGeneratedSong(null); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${mode === 'prompt'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">描述生成</span>
              <span className="sm:hidden">描述</span>
            </button>
            <button
              onClick={() => { setMode('lyrics'); setGeneratedSong(null); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${mode === 'lyrics'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">歌词生成</span>
              <span className="sm:hidden">歌词</span>
            </button>
          </div>

          {/* Input Card */}
          <div className="glass p-6 rounded-2xl space-y-5">
            {mode === 'prompt' ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Wand2 className="w-4 h-4 text-fuchsia-400" />
                    音乐描述
                  </label>
                  <span className="text-[10px] text-gray-500">{prompt.length}/500</span>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="描述你想要的音乐风格、情感、场景...例如：一首欢快的夏日流行歌曲，充满阳光和海滩的氛围"
                  className="w-full h-28 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 resize-none transition-all"
                  maxLength={500}
                />
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {PROMPT_INSPIRATIONS.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(chip)}
                      className="px-2.5 py-1 text-[11px] rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-fuchsia-500/20 hover:border-fuchsia-500/30 border border-white/10 transition-all"
                    >
                      {chip.length > 12 ? chip.slice(0, 12) + '...' : chip}
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
                      自定义歌词
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGenerateLyrics}
                        disabled={isGeneratingLyrics || !inspiration.trim()}
                        className="flex items-center gap-1 text-[11px] text-fuchsia-400 hover:text-fuchsia-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isGeneratingLyrics ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        AI 生成歌词
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <input
                      value={inspiration}
                      onChange={(e) => setInspiration(e.target.value)}
                      placeholder="输入灵感描述，AI 将为你创作歌词..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500/50 transition-all"
                    />
                  </div>

                  <textarea
                    value={lyrics}
                    onChange={(e) => { setLyrics(e.target.value); setGeneratedLyrics(e.target.value); }}
                    placeholder="输入歌词内容...&#10;&#10;支持 [Verse], [Chorus], [Bridge] 等段落标记"
                    className="w-full h-48 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 resize-y font-mono transition-all"
                  />

                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {LYRICS_TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        onClick={() => { setLyrics(tpl); setGeneratedLyrics(tpl); }}
                        className="px-2.5 py-1 text-[11px] rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-fuchsia-500/20 hover:border-fuchsia-500/30 border border-white/10 transition-all"
                      >
                        模板 {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Style Tags */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Tag className="w-4 h-4 text-fuchsia-400" />
                音乐风格标签
              </label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyStylePreset(preset.tags)}
                      className="px-3 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-1.5 bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-fuchsia-500/30 hover:bg-fuchsia-500/10"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {styleChips.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-white/5 border border-white/10 min-h-[40px]">
                    {styleChips.map((chip, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/30 text-fuchsia-200 text-[11px] font-medium"
                      >
                        {chip}
                        <button
                          onClick={() => removeStyleChip(chip)}
                          className="w-3 h-3 rounded-full bg-fuchsia-500/30 hover:bg-red-500/50 flex items-center justify-center transition-colors"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    value={styleInputValue}
                    onChange={(e) => setStyleInputValue(e.target.value)}
                    onKeyDown={handleStyleInputKeyDown}
                    placeholder="输入自定义标签，按回车添加..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-fuchsia-500/50 transition-all"
                  />
                  <button
                    onClick={addStyleChip}
                    className="px-3 py-2 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/30 transition-colors"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-sm text-gray-400 hover:text-white transition-colors list-none py-2">
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-fuchsia-400" />
                  高级选项
                </span>
                <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                    时长: {duration}秒
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>10秒</span>
                    <span>60秒</span>
                    <span>300秒</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">或直接输入</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={duration}
                    onChange={(e) => setDuration(Math.min(300, Math.max(10, parseInt(e.target.value) || 60)))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500/50 transition-all"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all md:col-span-2">
                  <input
                    type="checkbox"
                    checked={instrumental}
                    onChange={(e) => setInstrumental(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-fuchsia-500 focus:ring-fuchsia-500/30"
                  />
                  <div>
                    <p className="text-sm text-white font-medium">纯乐器 (无人声)</p>
                    <p className="text-[10px] text-gray-500">生成纯音乐作品，不含人声演唱</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all md:col-span-2">
                  <input
                    type="checkbox"
                    checked={customMode}
                    onChange={(e) => setCustomMode(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-fuchsia-500 focus:ring-fuchsia-500/30"
                  />
                  <div>
                    <p className="text-sm text-white font-medium">自定义模式</p>
                    <p className="text-[10px] text-gray-500">使用自定义歌词模式生成</p>
                  </div>
                </label>
              </div>
            </details>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || (mode === 'prompt' && !prompt.trim()) || (mode === 'lyrics' && !lyrics.trim())}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 hover:from-fuchsia-400 hover:via-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 hover:scale-[1.01] active:scale-[0.99]"
            >
              {generating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  正在生成... {genProgress}%
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  生成 Suno 歌曲
                </>
              )}
            </button>

            {!configured && (
              <p className="text-xs text-center text-amber-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Suno AI 未配置
              </p>
            )}
            {configured && credit <= 0 && (
              <p className="text-xs text-center text-red-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                积分不足，请前往 Suno.cn 充值
              </p>
            )}
          </div>

          {/* Music History */}
          <div className="glass p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-fuchsia-400" />
                历史音乐
                {audioList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 text-[10px] font-medium">
                    {audioList.length}
                  </span>
                )}
              </h3>
              <button
                onClick={loadMoreHistory}
                disabled={loadingList}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-fuchsia-300 transition-colors disabled:opacity-50"
              >
                {loadingList ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                刷新
              </button>
            </div>

            {loadingList && audioList.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-500 text-xs">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                加载中...
              </div>
            ) : audioList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-xs">
                <Music className="w-10 h-10 mb-3 opacity-30" />
                <p>暂无历史音乐</p>
                <p className="mt-1 text-[10px]">生成的歌曲将在此处显示</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {audioList.map((item, idx) => {
                  const title = item.title || item.name || item.filename || `歌曲 ${idx + 1}`;
                  const audioUrl = proxyAudioUrl(item.audioUrl || item.url || item.audio_url);
                  const duration = item.duration || item.length || 0;
                  return (
                    <div
                      key={item.id || item._id || idx}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-fuchsia-500/20 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                        <Disc3 className="w-4 h-4 text-fuchsia-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{title}</p>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTime(duration)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            if (audioUrl) {
                              setGeneratedSong({
                                title,
                                audioUrl,
                                duration,
                                taskId: item.id,
                              });
                              setTimeout(() => {
                                if (audioRef.current) audioRef.current.load();
                              }, 100);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30 transition-colors"
                          title="播放"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => downloadAudio(audioUrl, title)}
                          className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="下载"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Progress / Result */}
        <div className="lg:col-span-2 space-y-5">
          {/* Generation Progress */}
          {generating && genStage !== 'complete' && (
            <div className="glass p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 flex items-center justify-center">
                  <Loader className="w-5 h-5 text-white animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {genStage === 'submitting' && '正在提交任务...'}
                    {genStage === 'analyzing' && 'AI 分析中...'}
                    {genStage === 'composing' && 'AI 作曲中...'}
                    {genStage === 'completing' && '即将完成...'}
                  </p>
                  <p className="text-[11px] text-gray-500">通常需要 30-90 秒</p>
                </div>
              </div>

              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out relative"
                  style={{ width: `${genProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'submit', label: '提交', icon: Send },
                  { key: 'analyze', label: '分析', icon: Sparkles },
                  { key: 'compose', label: '作曲', icon: Music },
                  { key: 'complete', label: '完成', icon: CheckCircle2 },
                ].map((step) => (
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
                        } ${activeSteps[step.key] && genProgress < 100 ? 'animate-pulse' : ''}`} />
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
                  <h3 className="text-base font-bold text-white">生成结果</h3>
                </div>
                <button
                  onClick={() => { setGeneratedSong(null); setError(null); }}
                  className="text-xs text-gray-500 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                >
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    新建
                  </span>
                </button>
              </div>

              <div className="flex gap-4">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-fuchsia-500/30 to-purple-600/30 flex-shrink-0 shadow-xl shadow-fuchsia-500/10 relative group">
                  {generatedSong.coverUrl ? (
                    <img
                      src={generatedSong.coverUrl}
                      alt={generatedSong.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-10 h-10 text-fuchsia-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h4 className="text-lg font-bold text-white truncate">{generatedSong.title}</h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <Cloud className="w-3 h-3" />
                      Suno AI
                      {generatedSong.customMode && (
                        <span className="px-1.5 py-0.5 text-[9px] rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium ml-1">
                          自定义
                        </span>
                      )}
                      {generatedSong.instrumental && (
                        <span className="px-1.5 py-0.5 text-[9px] rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium ml-1">
                          纯乐器
                        </span>
                      )}
                    </p>
                  </div>

                  {generatedSong.style && (
                    <div className="flex flex-wrap gap-1">
                      {generatedSong.style.split(',').slice(0, 3).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 text-[10px]">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadAudio(generatedSong.audioUrl, generatedSong.title)}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-fuchsia-300 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载音频
                    </button>
                    <a
                      href={generatedSong.audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                    >
                      在新窗口打开
                      <ChevronRight className="w-3 h-3" />
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
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center hover:from-fuchsia-400 hover:to-purple-500 transition-all shadow-lg shadow-fuchsia-500/30 hover:scale-105 active:scale-95"
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
                            style={{ width: audioDuration ? `${(currentTime / audioDuration) * 100}%` : '0%' }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-gray-500 font-mono">{formatTime(currentTime)}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{formatTime(audioDuration)}</span>
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
            </div>
          )}

          {/* Default State - Tips */}
          {!generatedSong && !generating && (
            <div className="glass p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-fuchsia-400" />
                <h3 className="text-sm font-semibold text-white">使用提示</h3>
              </div>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-fuchsia-400 flex-shrink-0" />
                  <span><strong className="text-gray-300">描述模式</strong>：用自然语言描述你想要的音乐，AI 会自动创作</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-fuchsia-400 flex-shrink-0" />
                  <span><strong className="text-gray-300">歌词模式</strong>：提供完整歌词，AI 为你谱曲并生成歌曲</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-fuchsia-400 flex-shrink-0" />
                  <span>使用标签精确控制音乐风格，支持添加多个标签</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-fuchsia-400 flex-shrink-0" />
                  <span>合理设置时长，Suno AI 支持 10-300 秒的音频生成</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 mt-0.5 text-fuchsia-400 flex-shrink-0" />
                  <span>每次生成消耗积分，请合理使用</span>
                </li>
              </ul>
            </div>
          )}

          {/* Feature Cards */}
          {!generating && !generatedSong && (
            <div className="grid grid-cols-2 gap-3">
              <div className="glass p-3 rounded-2xl space-y-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-purple-500/30 flex items-center justify-center">
                  <Music className="w-4 h-4 text-fuchsia-300" />
                </div>
                <h4 className="text-xs font-semibold text-white">高质量音频</h4>
                <p className="text-[10px] text-gray-500">专业级 AI 音乐生成，音质出色</p>
              </div>
              <div className="glass p-3 rounded-2xl space-y-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-purple-300" />
                </div>
                <h4 className="text-xs font-semibold text-white">真人级演唱</h4>
                <p className="text-[10px] text-gray-500">AI 合成人声，媲美真实歌手</p>
              </div>
              <div className="glass p-3 rounded-2xl space-y-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex items-center justify-center">
                  <ListMusic className="w-4 h-4 text-pink-300" />
                </div>
                <h4 className="text-xs font-semibold text-white">多风格支持</h4>
                <p className="text-[10px] text-gray-500">流行、摇滚、古典、电子等</p>
              </div>
              <div className="glass p-3 rounded-2xl space-y-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/30 to-fuchsia-500/30 flex items-center justify-center">
                  <Download className="w-4 h-4 text-rose-300" />
                </div>
                <h4 className="text-xs font-semibold text-white">免费下载</h4>
                <p className="text-[10px] text-gray-500">生成后可下载 MP3 音频</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SunoPage;