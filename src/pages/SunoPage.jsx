import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cloud, Sparkles, Loader, Play, Pause, Clock, Users, CreditCard,
  AlertCircle, ChevronDown, Send, Disc3, Volume2, Download, Music,
  User, RefreshCw, X, ChevronRight, Mic, Wand2, Sliders, Tag,
  ListMusic, Trash2, History, CheckCircle2, Loader2,
  CheckCircle, XCircle, AlertTriangle, Copy, Zap, ShieldCheck, RotateCcw
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import SunoService from '../services/suno.service.js';
import { useGeneration } from '../stores/generationStore.jsx';
import {
  pickRandomThemeStyle,
  pickRandomSunoStyleTags,
  generateAutoSunoPrompt,
  generateAutoLyrics,
  generateRandomTitle,
  generateCreativeThought,
  AUTO_CONFIRM,
  openPlatformWebsite,
} from '../utils/autoGenUtils.js';
import AutoCreativePanel from '../components/AutoCreativePanel.jsx';
import { useAutoProgress } from '../contexts/AutoProgressContext.jsx';
import { getEngineSongCount } from '../utils/autoConfig.js';

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

function SunoPage({ onNavigate }) {
  const { t } = useTranslation();
  const { pendingLyrics, clearPendingLyrics, startSession, updateSession, completeSession, addToHistory, updateHistory, removeFromHistory, sessions, copyToClipboard, showToast } = useGeneration();
  const autoProgress = useAutoProgress();

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

  const handleGenerateRef = useRef(() => { });

  // Sync AUTO refs with React state
  useEffect(() => { autoRunningRef.current = autoRunning; }, [autoRunning]);
  useEffect(() => { autoStopRequestedRef.current = autoStopRequested; }, [autoStopRequested]);

  // Periodically refresh credits during AUTO
  useEffect(() => {
    if (!autoRunning) return;
    const iv = setInterval(async () => {
      try {
        const r = await fetch('/api/suno/user');
        if (r.ok) {
          const d = await r.json();
          if (d) setUserInfo(d.data || d);
        }
      } catch (_e) { /* ignore */ }
    }, 8000);
    return () => clearInterval(iv);
  }, [autoRunning]);

  // Auto-close creative panel: after 8 tries OR 15s idle when stopped
  const autoCloseTimerRef = useRef(null);
  useEffect(() => {
    if (autoCount >= 8 && !autoRunning) {
      setShowCreativePanel(false);
      return;
    }
    if (!autoRunning && autoCount > 0 && autoThoughts.length > 0) {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = setTimeout(() => {
        setShowCreativePanel(false);
      }, 15000);
    }
  }, [autoRunning, autoCount, autoThoughts.length]);

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
          if (handshakeData?.platforms?.includes('suno')) hasHandshake = true;
        }
      } catch (e) { /* ignore */ }

      console.log('%c[GLOBAL AUTO] [SunoPage] 握手检测',
        'background:#2ecc71;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold;',
        { hasQueryParam, hasHandshake, handshakeData });

      if (hasQueryParam || hasHandshake) {
        console.log('[GLOBAL AUTO] [SunoPage] ✅ 握手成功，400ms 后启动 AUTO，65400ms 后链式导航/清理（60s 构思倒计时 + 5.4s 观察期）');
        // Step 1: 启动 AUTO (400ms)
        setTimeout(() => {
          console.log('[GLOBAL AUTO] [SunoPage] ⏱ 400ms 触发 startAutoGeneration()');
          startAutoGeneration();
        }, 400);
        // Step 2: 链式导航或清理 (65400ms = 60s 倒计时 + 5.4s 观察期) — 与 AUTO 成败完全解耦
        setTimeout(() => {
          console.log('[GLOBAL AUTO] [SunoPage] ⏱ 65400ms 链式导航定时器触发（60s 倒计时结束）');
          try {
            const raw = localStorage.getItem('zmusic_globalauto');
            if (!raw) {
              console.warn('[GLOBAL AUTO] [SunoPage] localStorage 无 zmusic_globalauto，跳过链式导航');
              return;
            }
            const parsed = JSON.parse(raw);
            console.log('[GLOBAL AUTO] [SunoPage] 读取 localStorage:', JSON.stringify(parsed));
            if (!parsed?.platforms || !parsed.platforms.includes('suno')) {
              console.warn('[GLOBAL AUTO] [SunoPage] platforms 不含 suno，跳过（可能已被其他逻辑移除）');
              return;
            }
            const remaining = parsed.platforms.filter(p => p !== 'suno');
            console.log('[GLOBAL AUTO] [SunoPage] 从队列中移除 suno，剩余平台:', remaining);
            if (remaining.length > 0) {
              parsed.platforms = remaining;
              parsed.currentIndex = (parsed.currentIndex || 0) + 1;
              parsed.history = (parsed.history || []).concat([{
                platform: 'suno',
                at: Date.now(),
                status: (autoRunningRef.current ? 'running' : 'stopped'),
                note: (autoRunningRef.current ? 'AUTO仍在运行中' : 'AUTO已停止（可能积分不足）')
              }]);
              localStorage.setItem('zmusic_globalauto', JSON.stringify(parsed));
              const next = remaining[0];
              console.log('[GLOBAL AUTO] [SunoPage] 🚀 即将导航到下一平台:', next, '   onNavigate 存在:', Boolean(onNavigate));
              if (onNavigate) {
                onNavigate(next);
              } else {
                const routes = { suno: '/suno', muse: '/muse', melo: '/melo' };
                window.location.href = routes[next] + '?globalauto=1';
              }
            } else {
              console.log('[GLOBAL AUTO] [SunoPage] ✅ 最后一个平台，清理 localStorage');
              localStorage.removeItem('zmusic_globalauto');
            }
          } catch (e) {
            console.error('[GLOBAL AUTO] [SunoPage] 链式导航异常:', e);
          }
        }, 65400);
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('globalauto');
          window.history.replaceState({}, '', url.toString());
        } catch (e) { /* ignore */ }
      } else {
        console.log('[GLOBAL AUTO] [SunoPage] ❌ 未检测到握手（非 GLOBAL AUTO 模式），正常页面加载');
      }
    } catch (e) {
      console.error('[GLOBAL AUTO] [SunoPage] 握手阶段异常:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const randomizeSunoInputs = useCallback(() => {
    const { theme, style } = pickRandomThemeStyle();
    const randMode = Math.random() < 0.55 ? 'prompt' : 'lyrics';
    setMode(randMode);
    let promptText = '';
    let lyricsText = '';
    if (randMode === 'prompt') {
      promptText = generateAutoSunoPrompt(theme, style);
      setPrompt(promptText);
      setLyrics('');
    } else {
      lyricsText = generateAutoLyrics(theme);
      setLyrics(lyricsText);
      setPrompt('');
    }
    const tagRes = pickRandomSunoStyleTags();
    const chosenChips = [...tagRes.chips];
    const chosenTags = tagRes.tags;
    setStyleChips(chosenChips);
    setStyleInput(chosenTags);
    const chosenDuration = Math.random() < 0.7 ? 60 : (Math.random() < 0.5 ? 90 : 120);
    setDuration(chosenDuration);
    const chosenInstrumental = Math.random() < 0.18;
    setInstrumental(chosenInstrumental);
    const chosenCustomMode = Math.random() < 0.25;
    setCustomMode(chosenCustomMode);
    const chosenTitle = generateRandomTitle();
    void generateRandomTitle;

    // === 同步写入 AUTO 输入快照 ===
    autoInputSnapshotRef.current = {
      mode: randMode,
      prompt: promptText,
      lyrics: lyricsText,
      styleTags: chosenTags,
      styleChips: chosenChips,
      duration: chosenDuration,
      instrumental: chosenInstrumental,
      customMode: chosenCustomMode,
      title: chosenTitle,
    };

    return {
      theme,
      style,
      title: chosenTitle,
      lyrics: lyricsText || promptText,
      bpm: 120,
      key: 'C',
      command: `模式: ${randMode === 'prompt' ? '描述模式' : '歌词模式'}\n风格标签: ${chosenTags}\n时长: ${chosenDuration}s\n纯音乐: ${chosenInstrumental ? '是' : '否'}\n${randMode === 'prompt' ? `描述: ${promptText.substring(0, 80)}` : `歌词预览: ${lyricsText.substring(0, 80)}`}`,
    };
  }, []);

  // === Direct AUTO start — no confirmation modal, just go ===
  const startAutoGeneration = useCallback(() => {
    console.log('%c[AUTO] [SunoPage] startAutoGeneration() 入口',
      'background:#16a085;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold;');
    autoProgress.startProgress({ engine: 'suno', engineName: 'Suno AI', totalCountdown: 60 });
    // 1. Open Suno AI website tab (deduplicated by sessionStorage)
    const tabOpened = openPlatformWebsite('suno');
    console.log('[AUTO] [SunoPage] openPlatformWebsite(suno) result:', tabOpened ? '✅ 新标签已打开' : '⏭ 已存在（去重跳过）');

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
        method: 'suno',
        engine: 'suno',
        title: '🎵 Suno AI AUTO 创作中...',
        lyrics: '',
        prompt: '',
        audioUrl: '',
        imageUrl: '',
        duration: 0,
        style: '',
        creativeProcess: { thoughts: [], snapshot: {}, phase: '启动', startedAt: new Date().toISOString(), engine: 'Suno AI' },
      });
      autoDraftHistoryIdRef.current = draft.id;
    } catch (e) {
      console.warn('[AUTO] [SunoPage] 创建草稿历史记录失败:', e.message);
    }
    if (autoCountdownIntervalRef.current) {
      clearInterval(autoCountdownIntervalRef.current);
      autoCountdownIntervalRef.current = null;
    }

    // 3. Initial welcome + phase thinking
    const startThought = {
      phase: '启动阶段', time: new Date().toLocaleTimeString(),
      step: 'AUTO_INIT',
      title: '▶️ Suno AI AUTO 模式启动',
      summary: '打开 Suno AI 官网标签页 → 60 秒构思倒计时 → 生成歌曲',
      detail: '此阶段：\n  • 已自动为你在新标签打开 https://suno.cn（无需登录，仅用于查看官网状态）\n  • 接下来 60 秒用于"深度构思"：\n     - 0–10s：确定主题与情感基调\n     - 10–30s：确定曲风标签、BPM、调性、标题\n     - 30–55s：歌词/Prompt 创作 + 发送命令准备\n     - 55–60s：最终检查 + 启动生成\n  • 即便积分不足导致生成失败，整个构思过程都会被记录到「创作构思记录簿」。',
    };
    setAutoThoughts(prev => [...prev, startThought]);
    showToast?.('AUTO 启动 — Suno AI 构思中（60 秒倒计时，期间会打开官网标签查看状态）', 'info');

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
          summary: '正在 UnicornAgent 主题词库中抽取灵感种子…',
          detail: '遍历主题词库（love, dreams, nostalgia…）+ 风格组合。\n倒计时 50→40s 完成主题。',
        }]);
        const d1 = autoDraftHistoryIdRef.current;
        if (d1) updateHistory(d1, { creativeProcess: { snapshot: autoCreativeSnapshotRef.current, phase: '主题抽取', updatedAt: new Date().toISOString(), engine: 'Suno AI' } });
      } else if (sec === 40) {
        const themeStyle = pickRandomThemeStyle();
        // pickRandomSunoStyleTags() 返回 { styleKey, tags, chips } 对象，不能直接 .join()
        const sunoStyle = pickRandomSunoStyleTags();
        const style = sunoStyle.tags; // 完整风格描述字符串
        const title = generateRandomTitle(themeStyle.theme);
        autoCreativeSnapshotRef.current = {
          theme: themeStyle.theme, style, title,
          styleKey: sunoStyle.styleKey,
          styleChips: sunoStyle.chips,
          plannedAt: Date.now(), engine: 'Suno AI',
        };
        setAutoThoughts(prev => [...prev, {
          phase: '构思阶段 2/4', time: new Date().toLocaleTimeString(), step: 'STYLE_TITLE',
          title: '🎨 确定风格、标题、BPM & 调性',
          summary: `主题：${themeStyle.theme} ｜ 风格：${style} ｜ 标题：${title}`,
          detail: `主题种子：${themeStyle.theme} (情感方向: ${themeStyle.style})\n风格标签：${style}\n标题：${title}\n下一步：20s 内完成 BPM/调性 抽取 + 歌词创作。`,
        }]);
        const d2 = autoDraftHistoryIdRef.current;
        if (d2) updateHistory(d2, { title: `🎵 ${title} - Suno AI AUTO 创作中`, style, creativeProcess: { snapshot: autoCreativeSnapshotRef.current, phase: '风格与标题', updatedAt: new Date().toISOString(), engine: 'Suno AI' } });
      } else if (sec === 20) {
        const snap = autoCreativeSnapshotRef.current || {};
        const bpm = 90 + Math.floor(Math.random() * 70);
        const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'];
        const key = keys[Math.floor(Math.random() * keys.length)];
        // 50/50: lyrics mode OR prompt mode preview
        const useLyrics = Math.random() > 0.5;
        let snippet;
        if (useLyrics) {
          snippet = generateAutoLyrics(snap.theme || 'love', snap.title || '无题', 2);
          autoCreativeSnapshotRef.current = { ...snap, bpm, key, mode: 'lyrics', lyrics: snippet, command: snippet };
        } else {
          snippet = generateAutoSunoPrompt(snap.theme || 'love', snap.style || 'pop');
          autoCreativeSnapshotRef.current = { ...snap, bpm, key, mode: 'prompt', lyrics: '', command: snippet };
        }
        setAutoThoughts(prev => [...prev, {
          phase: '构思阶段 3/4', time: new Date().toLocaleTimeString(), step: 'LYRICS_DRAFT',
          title: useLyrics ? '✍️ 歌词创作（Lyrics 模式）' : '✍️ Prompt 创作（描述模式）',
          summary: `BPM=${bpm} ｜ Key=${key} ｜ 内容共 ${snippet.length} 字`,
          detail: `模式：${useLyrics ? '歌词模式' : 'Prompt模式'}\nBPM：${bpm}\n调性：${key}\n内容预览：\n${snippet.substring(0, 240)}${snippet.length > 240 ? '…' : ''}`,
        }]);
        const d3 = autoDraftHistoryIdRef.current;
        if (d3) updateHistory(d3, { lyrics: snippet, prompt: snippet, creativeProcess: { snapshot: autoCreativeSnapshotRef.current, phase: '歌词与命令', updatedAt: new Date().toISOString(), engine: 'Suno AI' } });
      } else if (sec === 5) {
        setAutoThoughts(prev => [...prev, {
          phase: '构思阶段 4/4', time: new Date().toLocaleTimeString(), step: 'FINAL_CHECK',
          title: '✅ 最终检查 — 5 秒后提交生成',
          summary: '参数快照已锁定，5 秒后调用 Suno API',
          detail: `快照：${JSON.stringify(autoCreativeSnapshotRef.current || {}, null, 2).substring(0, 500)}\n即便 API 失败（如积分不足），以上完整构思记录仍会写入「创作构思记录簿」。`,
        }]);
        const d4 = autoDraftHistoryIdRef.current;
        if (d4) {
          const snap = autoCreativeSnapshotRef.current || {};
          updateHistory(d4, { title: `🎵 ${snap.title || '未命名'} - Suno AI AUTO 准备生成`, lyrics: snap.lyrics || snap.command || '', prompt: snap.command || '', style: snap.style || '', creativeProcess: { snapshot: snap, phase: '最终检查', updatedAt: new Date().toISOString(), engine: 'Suno AI' } });
        }
      } else if (sec <= 0) {
        clearInterval(autoCountdownIntervalRef.current);
        autoCountdownIntervalRef.current = null;
        setAutoCountdownActive(false);
        setAutoCountdownSec(0);
        setAutoThoughts(prev => [...prev, {
          phase: '生成阶段', time: new Date().toLocaleTimeString(), step: 'TRIGGER',
          title: '🚀 倒计时结束 — 正式触发 Suno AI 生成',
          summary: '提交随机化参数 + 创作命令 → Suno API',
          detail: '调用链：randomizeSunoInputs() → generateCreativeThought() → handleGenerateRef.current(true)',
        }]);
        autoProgress.setGenerating({ title: '🚀 生成中...' });
        console.log('[AUTO] [SunoPage] ⏱ 60s 倒计时归零 → randomizeSunoInputs()');
        const choices = randomizeSunoInputs();
        autoCreativeSnapshotRef.current = {
          ...(autoCreativeSnapshotRef.current || {}), ...choices,
          finalizedAt: Date.now(),
        };
        console.log('[AUTO] [SunoPage] 🎲 随机参数: theme=' + choices.theme + ', style=' + choices.style
          + ', title=' + choices.title + ', BPM=' + choices.bpm + ', key=' + choices.key
          + ', lyrics/prompt前60字=' + (choices.lyrics || '').substring(0, 60));
        console.log('[AUTO] [SunoPage] 📋 生成命令:\n' + choices.command);
        const thought = generateCreativeThought({
          iteration: 1, theme: choices.theme, style: choices.style, title: choices.title,
          bpm: choices.bpm, key: choices.key, engine: 'Suno AI',
          lyricsSnippet: choices.lyrics, commandSent: choices.command,
        });
        setAutoThoughts(prev => [...prev, thought]);
        setTimeout(() => {
          console.log('[AUTO] [SunoPage] 触发 handleGenerateRef.current(true) — 当前值类型:', typeof handleGenerateRef.current);
          handleGenerateRef.current(true);
        }, 300);
      }
    }, 1000);
  }, [randomizeSunoInputs, pickRandomThemeStyle, pickRandomSunoStyleTags, generateRandomTitle, generateAutoLyrics, generateAutoSunoPrompt]);

  // 点击 AUTO 按钮 → 若正在运行则请求停止；否则打开 3 步危险确认弹窗
  const handleAutoClick = () => {
    if (autoRunning) {
      setAutoStopRequested(true);
      setAutoRunning(false);
      autoProgress.stopProgress();
      const draftId = autoDraftHistoryIdRef.current;
      if (draftId) {
        const snap = autoCreativeSnapshotRef.current || {};
        updateHistory(draftId, { status: 'stopped', title: `⏹️ ${snap.title || '未命名'} - AUTO 已停止`, lyrics: snap.lyrics || snap.command || '', prompt: snap.command || '', style: snap.style || '', creativeProcess: { snapshot: snap, phase: '已停止', stoppedAt: new Date().toISOString(), engine: 'Suno AI' } });
        autoDraftHistoryIdRef.current = null;
      }
      showToast?.('AUTO 停止中 — 完成当前歌曲后将不再生成下一首', 'info');
      return;
    }
    // eslint-disable-next-line no-console
    console.log('%c[AUTO] [SunoPage] 打开 3 步确认弹窗',
      'background:#27ae60;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold;');
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
    loadConfig();
    loadAudioList();
  }, []);

  useEffect(() => {
    if (pendingLyrics) {
      setMode('lyrics');
      setLyrics(pendingLyrics);
      clearPendingLyrics();
    }
  }, [pendingLyrics]);

  const loadConfig = async () => {
    setLoadingUser(true);
    try {
      // Trust the BACKEND /api/suno/status, NOT a client-side env check.
      // The backend actually calls suno.cn /mcp/api/user with the real API
      // key (stored server-side in .env), so configured=true only when the
      // real API accepts our credentials.
      const statusRes = await fetch('/api/suno/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        // configured from backend = real API returned a valid user profile
        setConfigured(Boolean(statusData?.configured));
        // Debug log: show the raw response so we can verify what credit
        // field Suno actually sent (0 pts is a valid answer — display it).
        // eslint-disable-next-line no-console
        console.log('[SunoPage] Raw /api/suno/status response:', JSON.stringify(statusData, null, 2));

        // If status endpoint returned rawUser, prefer that as userInfo
        // (avoids a duplicate GET /api/suno/user call).
        if (statusData?.rawUser) {
          setUserInfo(statusData.rawUser);
        } else if (statusData?.configured) {
          const user = await SunoService.getUserInfo();
          // eslint-disable-next-line no-console
          console.log('[SunoPage] Raw /api/suno/user response:', JSON.stringify(user, null, 2));
          setUserInfo(user);
        }
      } else {
        // Fallback: try client-side cache flag only if backend is unreachable.
        setConfigured(SunoService.isConfigured());
        if (SunoService.isConfigured()) {
          const user = await SunoService.getUserInfo();
          console.log('[SunoPage] Raw /api/suno/user response:', JSON.stringify(user, null, 2));
          setUserInfo(user);
        }
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

  // Match ALL possible credit field names from the real Suno API — no guessing,
  // use whatever field is actually populated in the response.
  const credit =
    userInfo?.points ??
    userInfo?.credit ??
    userInfo?.credits ??
    userInfo?.memberCredit ??
    userInfo?.member_credit ??
    userInfo?.balance ??
    userInfo?.remaining ??
    userInfo?.quota ??
    userInfo?.data?.points ??
    userInfo?.data?.credit ??
    userInfo?.data?.credits ??
    userInfo?.user?.points ??
    userInfo?.user?.credit ??
    0;
  const nickname = userInfo?.nickname || userInfo?.name || '';
  const isVip = !!(userInfo?.vip_status || userInfo?.memberInfo?.isMember || userInfo?.isVip);
  const isSubscribed = userInfo?.memberInfo?.subscription?.expired !== true;
  // Allow attempting generation even with 0 credits — the backend will return
  // a clear error message ("用户积点不足") that proves the API is connected.
  const canGenerate = configured && !generating;

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

  const handleGenerate = async (isAuto = false) => {
    setError(null);
    setSuccessMsg(null);
    setGeneratedSong(null);

    // === AUTO 路径下，使用同步快照 ref 而不是 state（setState 异步，会读到空） ===
    const snap = autoInputSnapshotRef.current;
    const useSnap = isAuto && snap && Object.keys(snap).length > 0;
    const effectiveMode = useSnap ? snap.mode : mode;
    const effectivePrompt = useSnap ? snap.prompt : prompt;
    const effectiveLyrics = useSnap ? snap.lyrics : lyrics;
    const effectiveChips = useSnap ? (snap.styleChips || []) : styleChips;
    const effectiveStyleTags = useSnap ? (snap.styleTags || '') : styleInput;
    const effectiveDuration = useSnap ? snap.duration : duration;
    const effectiveInstrumental = useSnap ? snap.instrumental : instrumental;
    const effectiveCustomMode = useSnap ? snap.customMode : customMode;
    const effectiveTitle = useSnap ? snap.title : '';

    if (useSnap) {
      console.log('[SunoPage] handleGenerate AUTO → 使用 autoInputSnapshotRef:', {
        mode: effectiveMode,
        promptLen: (effectivePrompt || '').length,
        lyricsLen: (effectiveLyrics || '').length,
      });
    }

    const finalStyle = effectiveChips.length > 0 ? effectiveChips.join(', ') : effectiveStyleTags;

    if (effectiveMode === 'prompt' && !(effectivePrompt || '').trim()) {
      setError('请输入音乐描述词');
      return;
    }
    if (effectiveMode === 'lyrics' && !(effectiveLyrics || '').trim()) {
      setError('请输入歌词内容');
      return;
    }

    const inputPrompt = effectiveMode === 'prompt' ? effectivePrompt : effectiveLyrics;
    const params = {
      mode: effectiveMode,
      inputPrompt,
      finalStyle,
      duration: effectiveDuration,
      customMode: effectiveCustomMode,
      instrumental: effectiveInstrumental,
    };

    // === DETAILED LOGGING for verification ===
    // eslint-disable-next-line no-console
    console.log('[SunoPage] handleGenerate clicked:', {
      timestamp: new Date().toISOString(),
      mode: effectiveMode,
      inputPrompt,
      finalStyle,
      duration: effectiveDuration,
      customMode: effectiveCustomMode,
      instrumental: effectiveInstrumental,
      styleChips: effectiveChips,
      fullParams: params,
    });

    const session = startSession({
      type: 'song',
      engine: 'suno',
      title: effectiveMode === 'prompt' ? (effectiveTitle || effectivePrompt?.slice(0, 40)) : (effectiveTitle || 'Suno Song'),
      lyrics: inputPrompt,
      params,
    });

    setGenerating(true);
    setGenProgress(5);
    setGenStage('submitting');
    setActiveSteps({ submit: true, analyze: false, compose: false, complete: false });

    try {
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

        updateSession(session.id, {
          status: 'processing',
          taskId: serialNo,
          progress: 10,
          logEntry: `Task created: ${serialNo}`,
        });

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
            title: taskResult.title || (effectiveMode === 'prompt' ? (effectiveTitle || (effectivePrompt || '').slice(0, 30)) : (effectiveTitle || 'Suno Song')),
            audioUrl,
            duration: taskResult.duration || effectiveDuration,
            coverUrl: taskResult.imageUrl || taskResult.coverUrl,
            taskId: serialNo,
            style: finalStyle,
            customMode: effectiveCustomMode,
            instrumental: effectiveInstrumental,
          };
          setGeneratedSong(songData);
          setGenProgress(100);
          setGenStage('complete');
          setSuccessMsg('歌曲生成成功！');

          completeSession(session.id, {
            audioUrl,
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
            method: 'suno',
            engine: 'suno',
            title: songData.title,
            lyrics: effectiveMode === 'lyrics' ? inputPrompt : '',
            prompt: effectiveMode === 'prompt' ? inputPrompt : '',
            audioUrl,
            imageUrl: songData.coverUrl,
            duration: songData.duration,
            taskId: songData.taskId,
            style: finalStyle,
            result: songData,
            creativeProcess: {
              thoughts: autoThoughts,
              snapshot: autoCreativeSnapshotRef.current,
              sessionId: session.id,
              engine: 'Suno AI',
            },
          });

          // Reset consecutive error counter on success
          autoConsecutiveErrorsRef.current = 0;

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
      completeSession(session.id, { error: e.message });
      autoProgress.setComplete({ title: '未命名构思', error: e.message });
      // === Even when NO song is generated, record the creative process to history ===
      try {
        const cpSnap = autoCreativeSnapshotRef.current || {};
        const fallbackTitle = cpSnap.title || (effectiveMode === 'prompt' ? (effectivePrompt || '').slice(0, 20) : (effectiveLyrics || '').slice(0, 20)) || '未命名构思';
        // Remove draft and create proper failure entry
        const draftId = autoDraftHistoryIdRef.current;
        if (draftId) {
          removeFromHistory(draftId);
          autoDraftHistoryIdRef.current = null;
        }
        addToHistory({
          type: 'creation_attempt',
          status: 'failed',
          method: 'suno',
          engine: 'suno',
          title: `❌ 构思失败 · ${fallbackTitle}`,
          lyrics: effectiveMode === 'lyrics' ? inputPrompt : '',
          prompt: effectiveMode === 'prompt' ? inputPrompt : '',
          audioUrl: '',
          imageUrl: '',
          duration: 0,
          style: finalStyle,
          error: e.message,
          creativeProcess: {
            thoughts: autoThoughts,
            snapshot: cpSnap,
            sessionId: session.id,
            engine: 'Suno AI',
            error: e.message,
            failedAt: new Date().toISOString(),
          },
          result: { error: e.message, params, failed: true },
        });
      } catch (hErr) {
        console.warn('[AUTO] [SunoPage] 失败记录写入 history 时异常（不影响主流程）:', hErr.message);
      }
      try {
        updateSession(session.id, {
          creativeProcess: {
            thoughts: autoThoughts,
            snapshot: autoCreativeSnapshotRef.current,
            error: e.message,
            engine: 'Suno AI',
          },
        });
      } catch (_u) { /* ignore */ }
      // Increment consecutive error counter (safety: stop after 8 failures)
      if (isAuto || autoRunningRef.current) {
        autoConsecutiveErrorsRef.current += 1;
      }
    } finally {
      setGenerating(false);

      // === AUTO mode: schedule next iteration ===
      if (isAuto || autoRunningRef.current) {
        try {
          const r = await fetch('/api/suno/user');
          if (r.ok) {
            const d = await r.json();
            if (d) setUserInfo(d.data || d);
          }
        } catch (_e) { /* ignore */ }

        setTimeout(() => {
          const maxSongs = getEngineSongCount('suno');
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
          const choices = randomizeSunoInputs();
          const thought = generateCreativeThought({
            iteration: nextIteration,
            theme: choices.theme,
            style: choices.style,
            title: choices.title,
            bpm: choices.bpm,
            key: choices.key,
            engine: 'Suno AI',
            lyricsSnippet: choices.lyrics,
            commandSent: choices.command,
          });
          setAutoThoughts(prev => [...prev.slice(-15), thought]);
          setTimeout(() => handleGenerateRef.current(true), 1800);
        }, 1500);
      }
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

  const copySessionItem = async (session) => {
    const { params: p, lyrics: l } = session;
    const text = [
      `【Suno AI 生成记录】`,
      `时间: ${new Date(session.startedAt).toLocaleString()}`,
      p?.mode === 'prompt' ? `模式: 描述生成` : `模式: 歌词生成`,
      p?.mode === 'prompt' ? `描述词: ${p?.inputPrompt || ''}` : '',
      p?.mode === 'lyrics' ? `歌词: ${p?.inputPrompt || ''}` : '',
      p?.finalStyle ? `风格: ${p.finalStyle}` : '',
      p?.duration ? `时长: ${p.duration}秒` : '',
      p?.instrumental ? `纯乐器: 是` : '',
      p?.customMode ? `自定义模式: 是` : '',
      '',
      `【完整参数】`,
      JSON.stringify(p, null, 2),
    ].filter(Boolean).join('\n');
    const ok = await copyToClipboard(text);
    if (ok) showToast('已复制到剪贴板', 'success');
  };

  const loadMoreHistory = () => {
    loadAudioList();
  };

  // Keep ref in sync so AUTO's useCallback always calls the latest handleGenerate
  handleGenerateRef.current = handleGenerate;

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
                {nickname ? `${nickname} · ` : ''}由 Suno.cn 提供强力 AI 音乐生成服务
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
              {isVip && (
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

            {/* AUTO Button + Status */}
            <div className="space-y-2.5 mt-1">
              <div className="flex gap-2">
                <button
                  onClick={handleAutoClick}
                  disabled={autoRunning}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg
                    ${autoRunning
                      ? 'bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 hover:from-red-400 hover:via-rose-400 hover:to-orange-400 text-white shadow-red-500/30 animate-pulse'
                      : 'bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 hover:from-orange-400 hover:via-red-400 hover:to-rose-400 text-white shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
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

            {!configured && (
              <p className="text-xs text-center text-amber-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Suno AI 未配置
              </p>
            )}
            {configured && credit <= 0 && (
              <p className="text-xs text-center text-amber-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                积分为 0 — 可点击生成测试 API 连接，将返回"积点不足"提示
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

          {/* Generation History (Session-based) */}
          {sessions && sessions.filter(s => s.engine === 'suno' && (s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled')).length > 0 && (
            <div className="glass p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-fuchsia-400" />
                  <h3 className="text-sm font-semibold text-white">生成历史</h3>
                  <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {sessions.filter(s => s.engine === 'suno' && (s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled')).length} 条记录
                  </span>
                </div>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {sessions
                  .filter(s => s.engine === 'suno' && (s.status === 'completed' || s.status === 'failed' || s.status === 'cancelled'))
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
                            {session.lyrics?.slice(0, 100) || '(无输入内容)'}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-500 flex-wrap">
                            <span>{new Date(session.startedAt).toLocaleString()}</span>
                            {session.params?.mode && <span>· {session.params.mode === 'prompt' ? '描述' : '歌词'}</span>}
                            {session.params?.finalStyle && <span>· 风格: {session.params.finalStyle}</span>}
                            {session.params?.duration && <span>· {session.params.duration}秒</span>}
                            {session.params?.instrumental && <span>· 纯乐器</span>}
                            {session.status === 'failed' && session.error && (
                              <span className="text-red-400">· 错误: {session.error}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => copySessionItem(session)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-fuchsia-500/20 text-gray-400 hover:text-fuchsia-300 transition-all"
                            title="复制完整记录（输入+风格+参数）"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {session.status === 'completed' && session.audioUrl && (
                            <button
                              onClick={() => {
                                setGeneratedSong({
                                  title: session.result?.title || session.title,
                                  audioUrl: session.audioUrl,
                                  duration: session.result?.duration || 0,
                                  coverUrl: session.result?.coverUrl,
                                  taskId: session.taskId,
                                  style: session.result?.style,
                                });
                              }}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-fuchsia-400 transition-all"
                              title="恢复此歌曲"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
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
                  {autoConfirmStep === 1 && AUTO_CONFIRM.title1('Suno AI')}
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
                  {AUTO_CONFIRM.desc1('Suno AI', credit)}
                </pre>
              )}
              {autoConfirmStep === 2 && (
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300 font-sans">
                  {AUTO_CONFIRM.desc2('Suno AI')}
                </pre>
              )}
              {autoConfirmStep === 3 && (
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300 font-sans">
                  {AUTO_CONFIRM.desc3('Suno AI', credit)}
                </pre>
              )}
              {autoConfirmStep === 3 && (
                <div className="mt-2 p-3 rounded-xl border border-red-500/40 bg-red-500/10 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-300" />
                    <p className="text-xs font-bold text-red-200">免责确认</p>
                  </div>
                  <p className="text-[11px] text-red-300/80">
                    我已知晓此操作将消耗 Suno AI 账户的全部积分，后果由本人自行承担。
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
        engineName="Suno AI"
        onClose={() => setShowCreativePanel(false)}
      />
    </div>
  );
}

export default SunoPage;