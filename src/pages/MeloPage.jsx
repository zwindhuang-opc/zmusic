import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music, Sparkles, Loader, Play, Pause, Clock, Settings,
  Headphones, User, AlertCircle, ChevronDown, Send,
  Disc3, Volume2, Copy, Download, Upload,
  Music2, Zap, BarChart3, RefreshCw, X, ChevronRight,
  Layers, Gauge, KeyRound, Star, Tag, FileText, Wand2,
  XCircle, CheckCircle, Info, AlertTriangle, ChevronUp,
  ShieldCheck, RotateCcw
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import {
  pickRandomThemeStyle,
  pickRandomMeloTags,
  generateAutoLyrics,
  generateRandomTitle,
  generateCreativeThought,
  AUTO_CONFIRM,
  openPlatformWebsite,
} from '../utils/autoGenUtils.js';
import AutoCreativePanel from '../components/AutoCreativePanel.jsx';
import { useAutoProgress } from '../contexts/AutoProgressContext.jsx';
import { getEngineSongCount } from '../utils/autoConfig.js';

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

function MeloPage({ onNavigate }) {
  const { t } = useTranslation();
  const { pendingLyrics, clearPendingLyrics, startSession, updateSession, appendLog, cancelSession, completeSession, addToHistory, updateHistory, removeFromHistory, activeSession, sessions, copyToClipboard, showToast } = useGeneration();
  const autoProgress = useAutoProgress();
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
  const handleGenerateRef = useRef(() => { });

  const [activeSteps, setActiveSteps] = useState({
    submit: false, analyze: false, compose: false, master: false,
  });

  // === AUTO generation mode state ===
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoStopRequested, setAutoStopRequested] = useState(false);
  const [autoCount, setAutoCount] = useState(0);
  const [showAutoConfirm, setShowAutoConfirm] = useState(false);
  const [autoConfirmStep, setAutoConfirmStep] = useState(1);
  const autoRunningRef = useRef(false);
  const autoStopRequestedRef = useRef(false);
  const autoConsecutiveErrorsRef = useRef(0);
  const autoCountRef = useRef(0);
  // 同步输入快照（setState 异步，AUTO 路径下必须用 ref 避免闭包读到空值）
  const autoInputSnapshotRef = useRef(null);
  const [autoThoughts, setAutoThoughts] = useState([]);
  const [showCreativePanel, setShowCreativePanel] = useState(true);
  // 60s countdown wait before real generation
  const [autoCountdownSec, setAutoCountdownSec] = useState(0);
  const [autoCountdownActive, setAutoCountdownActive] = useState(false);
  const autoCountdownIntervalRef = useRef(null);
  const autoCreativeSnapshotRef = useRef(null);
  const autoDraftHistoryIdRef = useRef(null);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  // Sync AUTO refs
  useEffect(() => { autoRunningRef.current = autoRunning; }, [autoRunning]);
  useEffect(() => { autoStopRequestedRef.current = autoStopRequested; }, [autoStopRequested]);

  // Periodic credit refresh during AUTO mode
  useEffect(() => {
    if (!autoRunning) return;
    const iv = setInterval(async () => {
      try {
        const r = await fetch('/api/melo/status');
        if (r.ok) {
          const d = await r.json();
          setMeloStatus(d?.data || d);
        }
        const u = await fetch('/api/melo/user');
        if (u.ok) {
          const ud = await u.json();
          setUserInfo(ud.data || ud);
        }
      } catch (_e) { /* ignore */ }
    }, 8000);
    return () => clearInterval(iv);
  }, [autoRunning]);

  // === GLOBAL AUTO handshake: trigger AUTO when arriving from Dashboard ===
  // Chain navigation is scheduled HERE (at handshake time) with a fixed 5s delay,
  // decoupled from autoRunning state — this ensures we NEVER skip the next
  // platform even if AUTO fails immediately (e.g. credit=0, session expired).
  const globalAutoHandledRef = useRef(false);
  useEffect(() => {
    if (globalAutoHandledRef.current) return;
    globalAutoHandledRef.current = true;
    try {
      const hasQueryParam = new URLSearchParams(window.location.search).get('globalauto') === '1';
      let hasHandshake = false;
      let handshakeData = null;
      try {
        const raw = localStorage.getItem('zmusic_globalauto');
        if (raw) {
          handshakeData = JSON.parse(raw);
          if (handshakeData?.platforms?.includes('melo')) hasHandshake = true;
        }
      } catch (e) { /* ignore */ }

      console.log('%c[GLOBAL AUTO] [MeloPage] 握手检测',
        'background:#9b59b6;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold;',
        { hasQueryParam, hasHandshake, handshakeData });

      if (hasQueryParam || hasHandshake) {
        console.log('[GLOBAL AUTO] [MeloPage] ✅ 握手成功，400ms 后启动 AUTO，65400ms 后链式导航/清理（60s 构思倒计时 + 5.4s 观察期）');
        // Step 1: 启动 AUTO (400ms)
        setTimeout(() => {
          console.log('[GLOBAL AUTO] [MeloPage] ⏱ 400ms 触发 startAutoGeneration()');
          startAutoGeneration();
        }, 400);
        // Step 2: 链式导航或清理 (65400ms = 60s 倒计时 + 5.4s 观察期) — 与 AUTO 成败完全解耦
        setTimeout(() => {
          console.log('[GLOBAL AUTO] [MeloPage] ⏱ 65400ms 链式导航定时器触发（60s 倒计时结束）');
          try {
            const raw = localStorage.getItem('zmusic_globalauto');
            if (!raw) {
              console.warn('[GLOBAL AUTO] [MeloPage] localStorage 无 zmusic_globalauto，跳过链式导航/清理');
              return;
            }
            const parsed = JSON.parse(raw);
            console.log('[GLOBAL AUTO] [MeloPage] 读取 localStorage:', JSON.stringify(parsed));
            if (!parsed?.platforms || !parsed.platforms.includes('melo')) {
              console.warn('[GLOBAL AUTO] [MeloPage] platforms 不含 melo，跳过（可能已被其他逻辑移除）');
              return;
            }
            // Record this platform's result in history (even if last)
            parsed.history = (parsed.history || []).concat([{
              platform: 'melo',
              at: Date.now(),
              status: (autoRunningRef.current ? 'running' : 'stopped'),
              note: (autoRunningRef.current ? 'AUTO仍在运行中' : 'AUTO已停止（可能积分不足）')
            }]);
            // Remove 'melo' from queue
            const remaining = parsed.platforms.filter(p => p !== 'melo');
            console.log('[GLOBAL AUTO] [MeloPage] 从队列中移除 melo，剩余平台:', remaining);
            if (remaining.length > 0) {
              parsed.platforms = remaining;
              parsed.currentIndex = (parsed.currentIndex || 0) + 1;
              localStorage.setItem('zmusic_globalauto', JSON.stringify(parsed));
              const next = remaining[0];
              console.log('[GLOBAL AUTO] [MeloPage] 🚀 即将导航到下一平台:', next, '   onNavigate 存在:', Boolean(onNavigate));
              if (onNavigate) {
                onNavigate(next);
              } else {
                const routes = { suno: '/suno', muse: '/muse', melo: '/melo' };
                window.location.href = routes[next] + '?globalauto=1';
              }
            } else {
              console.log('[GLOBAL AUTO] [MeloPage] ✅ 所有平台已处理完毕，最终 history:', JSON.stringify(parsed.history), ' 清理 localStorage');
              localStorage.removeItem('zmusic_globalauto');
              console.log('%c[GLOBAL AUTO] [MeloPage] 🏁 全部流程结束！',
                'background:#f39c12;color:#fff;padding:4px 10px;border-radius:3px;font-weight:bold;font-size:14px;');
            }
          } catch (e) {
            console.error('[GLOBAL AUTO] [MeloPage] 链式导航/清理异常:', e);
          }
        }, 65400);
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('globalauto');
          window.history.replaceState({}, '', url.toString());
        } catch (e) { /* ignore */ }
      } else {
        console.log('[GLOBAL AUTO] [MeloPage] ❌ 未检测到握手（非 GLOBAL AUTO 模式），正常页面加载');
      }
    } catch (e) {
      console.error('[GLOBAL AUTO] [MeloPage] 握手阶段异常:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const randomizeMeloInputs = useCallback(() => {
    const { theme, style } = pickRandomThemeStyle();
    // Lyrics
    const lyricsText = generateAutoLyrics(theme);
    setLyrics(lyricsText);
    // Title
    const titleText = generateRandomTitle();
    setTitle(titleText);
    // Genre + Mood tags
    const tagRes = pickRandomMeloTags();
    const chosenGenres = [...tagRes.genres];
    const chosenMoods = [...tagRes.moods];
    setSelectedGenres(chosenGenres);
    setSelectedMoods(chosenMoods);
    // Pick random instrument tags
    const instrumentOptions = ['钢琴', '吉他', '鼓组', '贝斯', '弦乐', '合成器', '小提琴', '大提琴', '笛子', '古筝', '萨克斯', '口琴', '电子鼓', '琵琶', '二胡'];
    const numInst = Math.floor(Math.random() * 3) + 1;
    const shuffledInstruments = [...instrumentOptions].sort(() => Math.random() - 0.5);
    const chosenInstruments = shuffledInstruments.slice(0, numInst);
    setSelectedInstruments(chosenInstruments);
    // Pick random vocal
    const vocalOptions = ['男歌手', '女歌手', '男女合唱', '童声', '说唱', '和声'];
    const numVocal = Math.random() < 0.7 ? 1 : 2;
    const shuffledVocals = [...vocalOptions].sort(() => Math.random() - 0.5);
    const chosenVocals = shuffledVocals.slice(0, numVocal);
    setSelectedVocals(chosenVocals);
    // Effects (sometimes)
    const effectOptions = ['混响', '延迟', '合唱', '失真', '压缩', 'EQ均衡', 'Lo-Fi复古', '立体声加宽'];
    let chosenEffects = [];
    if (Math.random() < 0.4) {
      const numFx = Math.floor(Math.random() * 2) + 1;
      const shuffledFx = [...effectOptions].sort(() => Math.random() - 0.5);
      chosenEffects = shuffledFx.slice(0, numFx);
      setSelectedEffects(chosenEffects);
    } else {
      setSelectedEffects([]);
    }
    // Structure: sometimes Verse-Chorus-Verse-Chorus-Bridge-Chorus
    const structures = ['', 'Verse-Chorus-Verse-Chorus-Bridge-Chorus', 'Intro-Verse-Chorus-Verse-Chorus-Outro', 'Verse-PreChorus-Chorus-Verse-Chorus-Bridge-Chorus'];
    const chosenStructure = structures[Math.floor(Math.random() * structures.length)];
    setSelectedStructure(chosenStructure);
    // BPM weighted
    const bpmRoll = Math.random();
    let chosenBpm;
    if (bpmRoll < 0.25) chosenBpm = 70 + Math.floor(Math.random() * 20);
    else if (bpmRoll < 0.6) chosenBpm = 90 + Math.floor(Math.random() * 25);
    else if (bpmRoll < 0.85) chosenBpm = 115 + Math.floor(Math.random() * 20);
    else chosenBpm = 135 + Math.floor(Math.random() * 40);
    setBpm(chosenBpm);
    // Key: common keys weighted
    const keys = ['C', 'G', 'D', 'A', 'F', 'Am', 'Em', 'Dm', 'Bb', 'E'];
    const chosenKey = keys[Math.floor(Math.random() * keys.length)];
    setAudioKey(chosenKey);
    // Time signature: almost always 4/4, occasionally 3/4 or 6/8
    const tsRoll = Math.random();
    const chosenTimeSig = tsRoll < 0.82 ? '4/4' : tsRoll < 0.92 ? '3/4' : '6/8';
    setTimeSignature(chosenTimeSig);
    // Layer commands: occasionally fill with theme-specific ones
    let layerSummary = '';
    let chosenLayers = { foundation: '', melody: '', expression: '', effects: '' };
    if (Math.random() < 0.5) {
      layerSummary =
        `[LAYER: FOUNDATION] 流派=${tagRes.genres.join('+')}, 情绪=${tagRes.moods.join('&')}\n` +
        `[LAYER: MELODY] 抒情流畅, 钩子旋律, 末段升key\n` +
        `[LAYER: EXPRESSION] 从内敛到释放, 气声副歌\n` +
        `[LAYER: EFFECTS] 音乐厅混响, 偶尔留白`;
      chosenLayers = {
        foundation: `[LAYER: FOUNDATION]\n流派融合: ${tagRes.genres.join('+')}; 情绪基调: ${tagRes.moods.join(' & ')}; 动态起伏: 渐进渐强`,
        melody: `[LAYER: MELODY]\n主旋律气质: 抒情流畅; 副歌记忆点: 钩子旋律明显; 转调处理: 末段升半key`,
        expression: `[LAYER: EXPRESSION]\n情感层次: 从内敛到释放; 咬字处理: 自然真诚; 气声点缀: 副歌入`,
        effects: `[LAYER: EFFECTS]\n空间感: 音乐厅混响; 特殊效果: 偶尔留白`,
      };
      setLayers(chosenLayers);
    } else {
      setLayers({ foundation: '', melody: '', expression: '', effects: '' });
    }
    const chosenWeight = 0.4 + Math.random() * 0.4;
    setAudioWeight(chosenWeight);

    // === 同步写入 AUTO 输入快照 ===
    autoInputSnapshotRef.current = {
      lyrics: lyricsText,
      title: titleText,
      genres: chosenGenres,
      moods: chosenMoods,
      instruments: chosenInstruments,
      vocals: chosenVocals,
      effects: chosenEffects,
      structure: chosenStructure,
      bpm: chosenBpm,
      audioKey: chosenKey,
      timeSignature: chosenTimeSig,
      layers: chosenLayers,
      audioWeight: chosenWeight,
    };

    // Return chosen values for creative thought logging
    return {
      theme,
      style,
      title: titleText,
      lyrics: lyricsText,
      bpm: chosenBpm,
      key: chosenKey,
      command: layerSummary || `流派: ${tagRes.genres.join('+')} | 情绪: ${tagRes.moods.join('&')} | ${chosenBpm}BPM | ${chosenKey}`,
    };
  }, []);

  // === Direct AUTO start — no confirmation modal, just go ===
  const startAutoGeneration = useCallback(() => {
    console.log('%c[AUTO] [MeloPage] startAutoGeneration() 入口',
      'background:#16a085;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold;');
    autoProgress.startProgress({ engine: 'melo', engineName: 'Melo AI', totalCountdown: 60 });
    // 1. Open Melo AI website tab (deduplicated by sessionStorage)
    const tabOpened = openPlatformWebsite('melo');
    console.log('[AUTO] [MeloPage] openPlatformWebsite(melo) result:', tabOpened ? '✅ 新标签已打开' : '⏭ 已存在（去重跳过）');

    // 2. Reset state
    setAutoCount(0);
    autoCountRef.current = 0;
    setAutoStopRequested(false);
    setAutoRunning(true);
    autoRunningRef.current = true;
    setAutoThoughts([]);
    autoConsecutiveErrorsRef.current = 0;
    autoCreativeSnapshotRef.current = null;
    autoDraftHistoryIdRef.current = null;
    setShowCreativePanel(true);
    // Create initial draft history entry
    try {
      const draft = addToHistory({
        type: 'creation_draft',
        status: 'in_progress',
        method: 'melo_ai',
        engine: 'melo',
        title: '🎧 Melo AI AUTO 创作中...',
        lyrics: '',
        prompt: '',
        audioUrl: '',
        imageUrl: '',
        duration: 0,
        style: '',
        creativeProcess: { thoughts: [], snapshot: {}, phase: '启动', startedAt: new Date().toISOString(), engine: 'Melo AI' },
      });
      autoDraftHistoryIdRef.current = draft.id;
    } catch (e) {
      console.warn('[AUTO] [MeloPage] 创建草稿历史记录失败:', e.message);
    }
    if (autoCountdownIntervalRef.current) {
      clearInterval(autoCountdownIntervalRef.current);
      autoCountdownIntervalRef.current = null;
    }

    // 3. Initial welcome + phase thinking
    const startThought = {
      phase: '启动阶段', time: new Date().toLocaleTimeString(),
      step: 'AUTO_INIT',
      title: '▶️ Melo AI AUTO 模式启动',
      summary: '打开 Melo AI 官网标签页 → 60 秒构思倒计时 → 生成歌曲',
      detail: '此阶段：\n  • 已自动为你在新标签打开 https://h.51melo.com/pages/mine/index（无需登录）\n  • 接下来 60 秒用于"深度构思"：\n     - 0–10s：确定主题与情感基调\n     - 10–30s：确定风格分类、BPM、调性、标题\n     - 30–55s：全曲歌词（主歌+副歌+桥段）+ 生成命令\n     - 55–60s：最终检查 + 启动生成\n  • 即便积分不足导致生成失败，整个构思过程都会被记录到「创作构思记录簿」。',
    };
    setAutoThoughts(prev => [...prev, startThought]);
    showToast?.('AUTO 启动 — Melo AI 构思中（60 秒倒计时，期间会打开官网标签查看状态）', 'info');

    // 4. Start 60s countdown
    setAutoCountdownSec(60);
    setAutoCountdownActive(true);
    let sec = 60;
    autoCountdownIntervalRef.current = setInterval(() => {
      sec -= 1;
      setAutoCountdownSec(sec);
      autoProgress.updateCountdown(sec);

      if (sec === 50) {
        setAutoThoughts(prev => [...prev, {
          phase: '构思阶段 1/4', time: new Date().toLocaleTimeString(), step: 'THEME_PICK',
          title: '🎯 确定主题与情感基调',
          summary: '从 UnicornAgent 20 个主题种子里抽取灵感…',
          detail: '主题候选池：love, loneliness, dreams, freedom, healing, nostalgia, adventure…\n倒计时 50→40s 确定主题。',
        }]);
        const d1 = autoDraftHistoryIdRef.current;
        if (d1) updateHistory(d1, { creativeProcess: { snapshot: autoCreativeSnapshotRef.current, phase: '主题抽取', updatedAt: new Date().toISOString(), engine: 'Melo AI' } });
      } else if (sec === 40) {
        const themeStyle = pickRandomThemeStyle();
        // pickRandomMeloTags() 返回 { genres: [], moods: [] } 对象，不能直接当数组用
        const meloTags = pickRandomMeloTags();
        const genreList = meloTags.genres || [];
        const moodList = meloTags.moods || [];
        const styleStr = [...genreList, ...moodList].join(',');
        const title = generateRandomTitle(themeStyle.theme);
        autoCreativeSnapshotRef.current = {
          theme: themeStyle.theme,
          style: styleStr,
          genres: genreList,
          moods: moodList,
          title,
          plannedAt: Date.now(),
          engine: 'Melo AI',
        };
        setAutoThoughts(prev => [...prev, {
          phase: '构思阶段 2/4', time: new Date().toLocaleTimeString(), step: 'STYLE_TITLE',
          title: '🎨 确定曲风、标题、BPM & 调性',
          summary: `主题：${themeStyle.theme} ｜ 曲风：${genreList.join(' / ')} ｜ 情绪：${moodList.join(' / ')} ｜ 标题：${title}`,
          detail: `主题种子：${themeStyle.theme} (情感方向: ${themeStyle.style})\n曲风标签：${genreList.join(' , ')}\n情绪标签：${moodList.join(' , ')}\n标题：${title}\n下一步：20s 内完成 BPM/调性 + 全曲歌词创作。`,
        }]);
        const d2 = autoDraftHistoryIdRef.current;
        if (d2) updateHistory(d2, { title: `🎧 ${title} - Melo AI AUTO 创作中`, style: styleStr, creativeProcess: { snapshot: autoCreativeSnapshotRef.current, phase: '风格与标题', updatedAt: new Date().toISOString(), engine: 'Melo AI' } });
      } else if (sec === 20) {
        const snap = autoCreativeSnapshotRef.current || {};
        const bpm = 90 + Math.floor(Math.random() * 70);
        const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'];
        const key = keys[Math.floor(Math.random() * keys.length)];
        const lyrics = generateAutoLyrics(snap.theme || 'love', snap.title || '无题', 3);
        autoCreativeSnapshotRef.current = {
          ...snap, bpm, key, lyrics, command: lyrics,
        };
        setAutoThoughts(prev => [...prev, {
          phase: '构思阶段 3/4', time: new Date().toLocaleTimeString(), step: 'LYRICS_DRAFT',
          title: '✍️ 全曲歌词创作（主歌 + 副歌 + 桥段）',
          summary: `BPM=${bpm} ｜ Key=${key} ｜ 歌词共 ${lyrics.length} 字`,
          detail: `BPM：${bpm}\n调性：${key}\n歌词预览（开头 240 字）：\n${lyrics.substring(0, 240)}…`,
        }]);
        const d3 = autoDraftHistoryIdRef.current;
        if (d3) updateHistory(d3, { lyrics, prompt: lyrics, creativeProcess: { snapshot: autoCreativeSnapshotRef.current, phase: '歌词与命令', updatedAt: new Date().toISOString(), engine: 'Melo AI' } });
      } else if (sec === 5) {
        setAutoThoughts(prev => [...prev, {
          phase: '构思阶段 4/4', time: new Date().toLocaleTimeString(), step: 'FINAL_CHECK',
          title: '✅ 最终检查 — 5 秒后提交生成',
          summary: '参数快照已锁定，5 秒后调用 Melo API',
          detail: `快照：${JSON.stringify(autoCreativeSnapshotRef.current || {}, null, 2).substring(0, 500)}\n即便 API 失败（如积分不足），以上完整构思仍会写入「创作构思记录簿」。`,
        }]);
        const d4 = autoDraftHistoryIdRef.current;
        if (d4) {
          const snap = autoCreativeSnapshotRef.current || {};
          updateHistory(d4, { title: `🎧 ${snap.title || '未命名'} - Melo AI AUTO 准备生成`, lyrics: snap.lyrics || '', prompt: snap.command || '', style: snap.style || '', creativeProcess: { snapshot: snap, phase: '最终检查', updatedAt: new Date().toISOString(), engine: 'Melo AI' } });
        }
      } else if (sec <= 0) {
        clearInterval(autoCountdownIntervalRef.current);
        autoCountdownIntervalRef.current = null;
        setAutoCountdownActive(false);
        setAutoCountdownSec(0);
        setAutoThoughts(prev => [...prev, {
          phase: '生成阶段', time: new Date().toLocaleTimeString(), step: 'TRIGGER',
          title: '🚀 倒计时结束 — 正式触发 Melo AI 生成',
          summary: '提交随机化参数 + 歌词 → Melo API',
          detail: '调用链：randomizeMeloInputs() → generateCreativeThought() → handleGenerateRef.current(true)',
        }]);
        autoProgress.setGenerating({ title: '🚀 生成中...' });
        console.log('[AUTO] [MeloPage] ⏱ 60s 倒计时归零 → 执行 randomizeMeloInputs()');
        const choices = randomizeMeloInputs();
        autoCreativeSnapshotRef.current = {
          ...(autoCreativeSnapshotRef.current || {}), ...choices,
          finalizedAt: Date.now(),
        };
        console.log('[AUTO] [MeloPage] 🎲 随机参数: theme=' + choices.theme + ', style=' + choices.style
          + ', title=' + choices.title + ', BPM=' + choices.bpm + ', key=' + choices.key
          + ', lyrics前60字=' + (choices.lyrics || '').substring(0, 60));
        console.log('[AUTO] [MeloPage] 📋 生成命令:\n' + choices.command);
        const thought = generateCreativeThought({
          iteration: 1, theme: choices.theme, style: choices.style, title: choices.title,
          bpm: choices.bpm, key: choices.key, engine: 'Melo AI',
          lyricsSnippet: choices.lyrics, commandSent: choices.command,
        });
        setAutoThoughts(prev => [...prev, thought]);
        setTimeout(() => {
          console.log('[AUTO] [MeloPage] 触发 handleGenerateRef.current(true) — 当前值类型:', typeof handleGenerateRef.current);
          handleGenerateRef.current(true);
        }, 300);
      }
    }, 1000);
  }, [randomizeMeloInputs, pickRandomThemeStyle, pickRandomMeloTags, generateRandomTitle, generateAutoLyrics]);

  // 点击 AUTO 按钮 → 若正在运行则请求停止；否则打开 3 步危险确认弹窗
  const handleAutoClick = () => {
    if (autoRunning) {
      setAutoStopRequested(true);
      setAutoRunning(false);
      autoProgress.stopProgress();
      const draftId = autoDraftHistoryIdRef.current;
      if (draftId) {
        const snap = autoCreativeSnapshotRef.current || {};
        updateHistory(draftId, { status: 'stopped', title: `⏹️ ${snap.title || '未命名'} - AUTO 已停止`, lyrics: snap.lyrics || '', prompt: snap.command || '', style: snap.style || '', creativeProcess: { snapshot: snap, phase: '已停止', stoppedAt: new Date().toISOString(), engine: 'Melo AI' } });
        autoDraftHistoryIdRef.current = null;
      }
      showToast?.('AUTO 停止中 — 完成当前歌曲后将不再生成下一首', 'info');
      return;
    }
    // eslint-disable-next-line no-console
    console.log('%c[AUTO] [MeloPage] 打开 3 步确认弹窗',
      'background:#f39c12;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold;');
    setAutoConfirmStep(1);
    setShowAutoConfirm(true);
  };

  // 3 步确认弹窗的"下一步/确认启动"按钮
  const proceedAutoConfirmStep = () => {
    if (autoConfirmStep < 3) {
      setAutoConfirmStep(prev => prev + 1);
      return;
    }
    // Step 3 确认 → 关闭弹窗并启动 AUTO
    setShowAutoConfirm(false);
    setAutoConfirmStep(1);
    startAutoGeneration();
  };

  const cancelAutoConfirm = () => {
    setShowAutoConfirm(false);
    setAutoConfirmStep(1);
  };

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

  const copySessionItem = async (session) => {
    const { params: p, lyrics: l } = session;
    const text = [
      `【Melo AI 生成记录】`,
      `时间: ${new Date(session.startedAt).toLocaleString()}`,
      p?.title ? `标题: ${p.title}` : '',
      p?.structure ? `结构: ${p.structure}` : '',
      p?.bpm ? `BPM: ${p.bpm}` : '',
      p?.key ? `调性: ${p.key}` : '',
      p?.timeSignature ? `拍号: ${p.timeSignature}` : '',
      p?.styleTags?.length ? `风格标签 (${p.styleTags.length}个): ${p.styleTags.join(', ')}` : '',
      '',
      `【歌词内容】`,
      l || '(空)',
      '',
      `【完整参数】`,
      JSON.stringify(p, null, 2),
    ].filter(Boolean).join('\n');
    const ok = await copyToClipboard(text);
    if (ok) showToast('已复制到剪贴板', 'success');
  };

  const handleCancelGeneration = useCallback(() => {
    cancelRef.current = true;
    if (taskId) {
      cancelSession(activeSession?.id);
    }
    setPollMessage('已取消生成');
  }, [cancelSession, activeSession, taskId]);

  const handleGenerate = async (isAuto = false) => {
    cancelRef.current = false;
    setError(null);
    setGeneratedSong(null);
    setGenerating(true);
    setPollStatus('submitting');
    setPollMessage('正在提交到 Melo AI...');
    setProgress(5);
    setActiveSteps({ submit: true, analyze: false, compose: false, master: false });

    // === AUTO 路径下，使用同步快照 ref 而不是 state（setState 异步，会读到空） ===
    const snap = autoInputSnapshotRef.current;
    const useSnap = isAuto && snap && Object.keys(snap).length > 0;
    const effectiveLyrics = useSnap ? snap.lyrics : lyrics;
    const effectiveTitle = useSnap ? snap.title : title;
    const effectiveGenres = useSnap ? (snap.genres || []) : selectedGenres;
    const effectiveInstruments = useSnap ? (snap.instruments || []) : selectedInstruments;
    const effectiveMoods = useSnap ? (snap.moods || []) : selectedMoods;
    const effectiveVocals = useSnap ? (snap.vocals || []) : selectedVocals;
    const effectiveEffects = useSnap ? (snap.effects || []) : selectedEffects;
    const effectiveBpm = useSnap ? snap.bpm : bpm;
    const effectiveAudioKey = useSnap ? snap.audioKey : audioKey;
    const effectiveTimeSignature = useSnap ? snap.timeSignature : timeSignature;
    const effectiveStructure = useSnap ? snap.structure : selectedStructure;
    const effectiveAudioWeight = useSnap ? snap.audioWeight : audioWeight;
    const effectiveLayers = useSnap ? (snap.layers || { foundation: '', melody: '', expression: '', effects: '' }) : layers;

    if (useSnap) {
      console.log('[MeloPage] handleGenerate AUTO → 使用 autoInputSnapshotRef:', {
        lyricsLen: (effectiveLyrics || '').length,
        title: effectiveTitle,
        tagsCount: effectiveGenres.length + effectiveInstruments.length + effectiveMoods.length + effectiveVocals.length + effectiveEffects.length,
      });
    }

    // Build full lyrics with layer commands using effective values
    const buildFullLyricsEffective = () => {
      let result = (effectiveLyrics || '').trim();
      if ((effectiveLayers.foundation || '').trim()) result += '\n\n' + effectiveLayers.foundation.trim();
      if ((effectiveLayers.melody || '').trim()) result += '\n\n' + effectiveLayers.melody.trim();
      if ((effectiveLayers.expression || '').trim()) result += '\n\n' + effectiveLayers.expression.trim();
      if ((effectiveLayers.effects || '').trim()) result += '\n\n' + effectiveLayers.effects.trim();
      return result;
    };
    const fullLyrics = buildFullLyricsEffective();
    const styleTags = [
      ...effectiveGenres,
      ...effectiveInstruments,
      ...effectiveMoods,
      ...effectiveVocals,
      ...effectiveEffects,
    ];

    const params = {
      lyrics: fullLyrics,
      title: effectiveTitle || undefined,
      styleTags,
      bpm: effectiveBpm,
      key: effectiveAudioKey,
      timeSignature: effectiveTimeSignature,
      structure: effectiveStructure,
      audioWeight: effectiveAudioWeight,
      layers: effectiveLayers,
    };

    // === DETAILED LOGGING for verification ===
    // eslint-disable-next-line no-console
    console.log('[MeloPage] handleGenerate clicked:', {
      timestamp: new Date().toISOString(),
      lyrics: fullLyrics,
      title: params.title,
      styleTags: params.styleTags,
      bpm: params.bpm,
      key: params.key,
      timeSignature: params.timeSignature,
      structure: params.structure,
      audioWeight: params.audioWeight,
      layers: params.layers,
      styleTagsCount: styleTags.length,
      fullParams: params,
    });

    const session = startSession({
      type: 'song',
      engine: 'melo',
      title: effectiveTitle || 'Untitled',
      lyrics: fullLyrics,
      params,
    });

    try {
      appendLog(session.id, 'info', `Submitting to Melo AI with ${styleTags.length} style tags...`);

      // VISUAL BRIDGE: type the selected lyrics/lyrics-command into the
      // h.51melo.com chat input field so the user can SEE the exact inputs on
      // the h.51melo.com website — even when generation cannot complete due
      // to insufficient credits. Best-effort: a failure here must NOT block
      // the actual generation attempt.
      setPollMessage('正在将歌词同步到 h.51melo.com...');
      try {
        const fillRes = await fetch('/api/melo/fill-input', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        const fillData = await fillRes.json();
        if (fillData?.success) {
          appendLog(session.id, 'info', `歌词已同步到 h.51melo.com 聊天输入框（${String(fillData.data?.value || '').length} 字符）`);
        } else {
          appendLog(session.id, 'warn', `歌词同步到 h.51melo.com 失败：${fillData?.error || '未知原因'}（不影响生成）`);
        }
      } catch (fillErr) {
        appendLog(session.id, 'warn', `歌词同步到 h.51melo.com 异常：${fillErr.message}（不影响生成）`);
      }

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
        title: finalSong?.title || effectiveTitle || '未命名',
        audioUrl: proxyAudioUrl(finalSong?.audioUrl),
        imageUrl: finalSong?.imageUrl,
        duration: finalSong?.duration || 0,
        userName: finalSong?.userName || 'Melo AI',
        taskId: tid,
        bpm: finalSong?.bpm || effectiveBpm,
        key: finalSong?.key || effectiveAudioKey,
        timeSignature: finalSong?.timeSignature || effectiveTimeSignature,
      };
      setGeneratedSong(songData);
      setPollMessage('生成完成！');

      completeSession(session.id, {
        audioUrl: songData.audioUrl,
        imageUrl: songData.imageUrl,
        result: songData,
      });
      autoProgress.setComplete({ title: songData.title, error: null });
      autoProgress.incrementCount();

      // Remove draft and create proper success entry
      const draftId = autoDraftHistoryIdRef.current;
      if (draftId) {
        removeFromHistory(draftId);
        autoDraftHistoryIdRef.current = null;
      }

      addToHistory({
        type: 'song',
        status: 'success',
        method: 'melo_ai',
        engine: 'melo',
        title: songData.title,
        lyrics: fullLyrics,
        prompt: fullLyrics,
        audioUrl: songData.audioUrl,
        imageUrl: songData.imageUrl,
        duration: songData.duration,
        taskId: tid,
        bpm: songData.bpm,
        key: songData.key,
        style: effectiveGenres?.join(','),
        result: songData,
        creativeProcess: {
          thoughts: autoThoughts,
          snapshot: autoCreativeSnapshotRef.current,
          sessionId: session.id,
          engine: 'Melo AI',
        },
      });

      // Reset consecutive error counter on success
      autoConsecutiveErrorsRef.current = 0;

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
        autoProgress.setComplete({ title: '未命名构思', error: e.message });
        // === Even when NO song is generated, record the creative process to history ===
        try {
          const cpSnap = autoCreativeSnapshotRef.current || {};
          const fallbackTitle = cpSnap.title || effectiveTitle || (fullLyrics || '').substring(0, 20) || '未命名构思';
          // Remove draft and create proper failure entry
          const draftId = autoDraftHistoryIdRef.current;
          if (draftId) {
            removeFromHistory(draftId);
            autoDraftHistoryIdRef.current = null;
          }
          addToHistory({
            type: 'creation_attempt',
            status: 'failed',
            method: 'melo_ai',
            engine: 'melo',
            title: `❌ 构思失败 · ${fallbackTitle}`,
            lyrics: fullLyrics,
            prompt: fullLyrics,
            audioUrl: '',
            imageUrl: '',
            duration: 0,
            style: effectiveGenres?.join(','),
            error: e.message,
            creativeProcess: {
              thoughts: autoThoughts,
              snapshot: cpSnap,
              sessionId: session.id,
              engine: 'Melo AI',
              error: e.message,
              failedAt: new Date().toISOString(),
            },
            result: { error: e.message, params, failed: true },
          });
        } catch (hErr) {
          console.warn('[AUTO] [MeloPage] 失败记录写入 history 时异常（不影响主流程）:', hErr.message);
        }
        try {
          updateSession(session.id, {
            creativeProcess: {
              thoughts: autoThoughts,
              snapshot: autoCreativeSnapshotRef.current,
              error: e.message,
              engine: 'Melo AI',
            },
          });
        } catch (_u) { /* ignore */ }
        // Increment consecutive error counter (safety: stop after 8 failures)
        if (isAuto || autoRunningRef.current) {
          autoConsecutiveErrorsRef.current += 1;
        }
      }
    } finally {
      setGenerating(false);

      // === AUTO mode: schedule next iteration ===
      if (isAuto || autoRunningRef.current) {
        try {
          const r = await fetch('/api/melo/status');
          if (r.ok) {
            const d = await r.json();
            setMeloStatus(d?.data || d);
          }
          const u = await fetch('/api/melo/user');
          if (u.ok) {
            const ud = await u.json();
            setUserInfo(ud.data || ud);
          }
        } catch (_e) { /* ignore */ }

        setTimeout(() => {
          const maxSongs = getEngineSongCount('melo');
          const shouldStop =
            autoStopRequestedRef.current ||
            !autoRunningRef.current ||
            autoConsecutiveErrorsRef.current >= 8 ||
            autoCountRef.current >= maxSongs;

          if (shouldStop) {
            setAutoRunning(false);
            setAutoStopRequested(false);
            showToast?.(
              autoStopRequestedRef.current
                ? 'AUTO 已停止 — 已按您的请求停止自动生成。'
                : autoConsecutiveErrorsRef.current >= 8
                  ? 'AUTO 已停止 — 连续 8 次生成失败，可能是积分不足或 API 异常。'
                  : 'AUTO 模式结束。',
              autoStopRequestedRef.current ? 'info' : 'warning'
            );
            return;
          }

          const nextIteration = autoCount + 1;
          setAutoCount(c => c + 1);
          autoCountRef.current = nextIteration;

          // Randomize inputs + capture choices for creative thought
          const choices = randomizeMeloInputs();

          // Log creative thinking process
          const thought = generateCreativeThought({
            iteration: nextIteration,
            theme: choices.theme,
            style: choices.style,
            title: choices.title,
            bpm: choices.bpm,
            key: choices.key,
            engine: 'Melo AI',
            lyricsSnippet: choices.lyrics,
            commandSent: choices.command,
          });
          setAutoThoughts(prev => [...prev.slice(-15), thought]);

          setTimeout(() => handleGenerateRef.current(true), 1800);
        }, 1500);
      }
    }
  };

  // Keep ref in sync so AUTO's useCallback always calls the latest handleGenerate
  handleGenerateRef.current = handleGenerate;

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
  const canGenerate = meloStatus?.configured && !generating;

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

          {/* AUTO Button + Status */}
          <div className="space-y-2.5 mt-1">
            <div className="flex gap-2">
              <button
                onClick={handleAutoClick}
                disabled={autoRunning}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg
                  ${autoRunning
                    ? 'bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 hover:from-red-400 hover:via-rose-400 hover:to-orange-400 text-white shadow-red-500/30 animate-pulse'
                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-500 hover:via-rose-500 hover:to-orange-500 text-white shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                  }`}
              >
                {autoRunning ? (
                  <>
                    <RotateCcw className="w-5 h-5 animate-spin" />
                    {t('auto.status_running')} · 停止
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    {t('auto.btn_label')}
                  </>
                )}
              </button>
            </div>
            {(autoRunning || autoCount > 0) && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex w-2 h-2 rounded-full ${autoRunning ? 'bg-red-400 animate-pulse' : 'bg-gray-500'}`} />
                  <span className="text-xs text-gray-300 font-medium">
                    {autoRunning ? t('auto.status_running') : t('auto.status_idle')}
                  </span>
                </div>
                <span className="text-xs font-bold text-orange-300">
                  {t('auto.song_count').replace('{count}', String(autoCount))}
                </span>
              </div>
            )}
            {!autoRunning && autoCount === 0 && (
              <p className="text-[11px] text-center text-amber-400/80 flex items-center justify-center gap-1 px-2">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>AUTO 将持续生成直到积分耗尽，极消耗。请谨慎使用。</span>
              </p>
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
                  <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {sessions.filter(s => s.engine === 'melo' && (s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled')).length} 条记录
                  </span>
                </div>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {sessions
                  .filter(s => s.engine === 'melo' && (s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled'))
                  .slice(0, 15)
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
                            {session.lyrics?.slice(0, 100)}{session.lyrics?.length > 100 ? '...' : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500 flex-wrap">
                            <span>{new Date(session.startedAt).toLocaleString()}</span>
                            {session.duration && (
                              <span>· {session.duration}s</span>
                            )}
                            <span>· {session.params?.styleTags?.length || 0} tags</span>
                            {session.params?.bpm && <span>· {session.params.bpm} BPM</span>}
                            {session.params?.key && <span>· {session.params.key}</span>}
                            {session.params?.structure && <span>· {session.params.structure}</span>}
                            {session.status === 'failed' && session.error && (
                              <span className="text-red-400">· 错误: {session.error}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => copySessionItem(session)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-300 transition-all"
                            title="复制完整记录（歌词+风格+参数）"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
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
                              title="恢复此歌曲"
                            >
                              <Play className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          )}
                        </div>
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

      {/* AUTO Danger Confirmation Modal (3-step) */}
      {showAutoConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={cancelAutoConfirm}>
          <div
            className="w-full max-w-md max-h-[90vh] flex flex-col bg-[#0f0f1a] border border-red-500/40 rounded-2xl shadow-2xl shadow-red-900/50 overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white">
                  {autoConfirmStep === 1 && AUTO_CONFIRM.title1('Melo AI')}
                  {autoConfirmStep === 2 && AUTO_CONFIRM.title2}
                  {autoConfirmStep === 3 && AUTO_CONFIRM.title3}
                </h2>
                <p className="text-[11px] text-white/80">
                  {t('auto.step').replace('{curr}', String(autoConfirmStep))}
                </p>
              </div>
              <button
                onClick={cancelAutoConfirm}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="px-4 py-2 bg-white/5 flex items-center gap-2">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex-1 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${autoConfirmStep >= step
                      ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white'
                      : 'bg-white/10 text-gray-500'}`}>
                    {autoConfirmStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`flex-1 h-1 rounded-full transition-colors
                      ${autoConfirmStep > step ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="p-5 space-y-3 flex-1 min-h-0 overflow-y-auto">
              {autoConfirmStep === 1 && (
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300 font-sans">
                  {AUTO_CONFIRM.desc1('Melo AI', credits)}
                </pre>
              )}
              {autoConfirmStep === 2 && (
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300 font-sans">
                  {AUTO_CONFIRM.desc2('Melo AI')}
                </pre>
              )}
              {autoConfirmStep === 3 && (
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300 font-sans">
                  {AUTO_CONFIRM.desc3('Melo AI', credits)}
                </pre>
              )}
              {autoConfirmStep === 3 && (
                <div className="mt-2 p-3 rounded-xl border border-red-500/40 bg-red-500/10 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-300" />
                    <p className="text-xs font-bold text-red-200">免责确认</p>
                  </div>
                  <p className="text-[11px] text-red-300/80">
                    我已知晓此操作将消耗 Melo AI 账户的全部积分，后果由本人自行承担。
                    zMusic 及相关开发者不对由此造成的积分损失、订阅费用或账号异常承担任何责任。
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 py-4 bg-white/5 border-t border-white/5 flex items-center gap-3">
              <button
                onClick={cancelAutoConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                {t('auto.cancel_btn')}
              </button>
              <button
                onClick={proceedAutoConfirmStep}
                className={`flex-[1.4] px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg
                  ${autoConfirmStep === 3
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-500 hover:via-rose-500 hover:to-orange-500 shadow-red-500/40 hover:shadow-red-500/60 hover:scale-[1.02] active:scale-[0.99]'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 shadow-orange-500/30'
                  }`}
              >
                {autoConfirmStep < 3 ? '下一步，我已了解风险 →' : t('auto.confirm_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creative Thinking Panel — shows AI's reasoning for each AUTO song */}
      <AutoCreativePanel
        open={autoRunning || (autoThoughts.length > 0 && showCreativePanel)}
        thoughts={autoThoughts}
        autoRunning={autoRunning}
        autoCount={autoCount}
        engineName="Melo AI"
        onClose={() => setShowCreativePanel(false)}
      />
    </div>
  );
}

export default MeloPage;