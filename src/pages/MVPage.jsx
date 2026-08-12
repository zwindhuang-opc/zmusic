import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Video, History, AlertCircle, Settings, ChevronDown, Loader, Sparkles, ExternalLink, Copy, Check, Clapperboard, Wand2, Brain, Palette, Music, Users, Sun, Moon, Cloud, Zap, Film, Camera, Clock, RotateCcw, AlertTriangle, ShieldCheck, X, CheckCircle, ListMusic, RefreshCw, Disc3 } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import api, { isMobileEnvironment } from '../services/api.client.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { generateMV } from '../utils/mvEngine.js';
import { composeMusic } from '../utils/musicComposer.js';
import { compositionToWavBlob } from '../utils/audioEngine.js';
import { generateMVVideo } from '../utils/mvComposer.js';
import MuseService from '../services/muse.service.js';
import SunoService from '../services/suno.service.js';
import MeloService from '../services/melo.service.js';
import HistoryPanel from '../components/HistoryPanel.jsx';
import { MVControls, MVVideoPlayer, MVTimelinePreview } from '../components/mv/index.js';
import AutoCreativePanel from '../components/AutoCreativePanel.jsx';
import { useAutoProgress } from '../contexts/AutoProgressContext.jsx';
import { getEngineSongCount } from '../utils/autoConfig.js';
import { AUTO_CONFIRM, openPlatformWebsite, generateCreativeThought, generateRandomTitle, pickRandomThemeStyle, generateAutoLyrics } from '../utils/autoGenUtils.js';

const ICON_MAP = {
  Users, Cloud, Sun, Moon, Sparkles, Film, Brain, Palette, Clapperboard, Camera, Zap, Wand2, Music, Video,
};

function resolveIcon(name) {
  if (!name) return Wand2;
  return ICON_MAP[name] || Wand2;
}

const FALLBACK_GENRES = ['pop', 'rock', 'electronic', 'hip_hop', 'ballad', 'chinese_traditional', 'jazz', 'classical', 'rnb', 'country', 'love_song', 'chinese_classical', 'concert', 'modern', 'cinematic', 'retro', 'anime', 'gothic_rock'];

// === Engine-specific theming ===
// Muse=blue, Suno=green, Melo=amber
const ENGINE_THEMES = {
  muse: {
    headerGradient: 'from-blue-600/20 via-sky-600/20 to-cyan-600/20',
    glow1: 'from-sky-500/20 to-blue-500/0',
    glow2: 'from-cyan-500/20 to-transparent',
    iconBg: 'from-sky-500 to-blue-600',
    iconShadow: 'shadow-sky-500/30',
    titleText: 'from-white via-sky-100 to-cyan-200',
    subtitleText: 'text-sky-200/70',
    accentText: 'text-sky-400',
    accentText2: 'text-sky-300',
    border: 'border-sky-500/20',
    progressFrom: 'from-sky-500',
    progressTo: 'to-cyan-500',
    chipBg: 'bg-sky-500/10',
    chipText: 'text-sky-300',
    chipBorder: 'border-sky-500/20',
    toolHoverBorder: 'hover:border-sky-500/30',
    toolShadow: 'hover:shadow-sky-500/10',
    toolIconBg: 'bg-sky-500/20',
    iconColor: 'text-sky-400',
  },
  suno: {
    headerGradient: 'from-emerald-600/20 via-green-600/20 to-teal-600/20',
    glow1: 'from-emerald-500/20 to-green-500/0',
    glow2: 'from-teal-500/20 to-transparent',
    iconBg: 'from-emerald-500 to-teal-600',
    iconShadow: 'shadow-emerald-500/30',
    titleText: 'from-white via-emerald-100 to-teal-200',
    subtitleText: 'text-emerald-200/70',
    accentText: 'text-emerald-400',
    accentText2: 'text-emerald-300',
    border: 'border-emerald-500/20',
    progressFrom: 'from-emerald-500',
    progressTo: 'to-teal-500',
    chipBg: 'bg-emerald-500/10',
    chipText: 'text-emerald-300',
    chipBorder: 'border-emerald-500/20',
    toolHoverBorder: 'hover:border-emerald-500/30',
    toolShadow: 'hover:shadow-emerald-500/10',
    toolIconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  melo: {
    headerGradient: 'from-amber-600/20 via-orange-600/20 to-yellow-600/20',
    glow1: 'from-amber-500/20 to-orange-500/0',
    glow2: 'from-yellow-500/20 to-transparent',
    iconBg: 'from-amber-500 to-orange-600',
    iconShadow: 'shadow-amber-500/30',
    titleText: 'from-white via-amber-100 to-orange-200',
    subtitleText: 'text-amber-200/70',
    accentText: 'text-amber-400',
    accentText2: 'text-amber-300',
    border: 'border-amber-500/20',
    progressFrom: 'from-amber-500',
    progressTo: 'to-orange-500',
    chipBg: 'bg-amber-500/10',
    chipText: 'text-amber-300',
    chipBorder: 'border-amber-500/20',
    toolHoverBorder: 'hover:border-amber-500/30',
    toolShadow: 'hover:shadow-amber-500/10',
    toolIconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
  },
};

function MVPage({ engine = 'muse', engineName = 'Muse AI' }) {
  const { t, ts, currentLang } = useTranslation();
  const { addToHistory, updateHistory, removeFromHistory, copyToClipboard, pendingLyrics, showToast, sessions } = useGeneration();
  const autoProgress = useAutoProgress();

  const theme = ENGINE_THEMES[engine] || ENGINE_THEMES.muse;
  const displayName = engineName || theme.name || 'AI';

  const [mode, setMode] = useState('basic');
  const [genres, setGenres] = useState(FALLBACK_GENRES);
  const [genre, setGenre] = useState('pop');
  const [duration, setDuration] = useState(30);
  const [style, setStyle] = useState('modern');
  const [colorPalette, setColorPalette] = useState('purple_pink_gradient');
  const [selectedEffects, setSelectedEffects] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [audioList, setAudioList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [museCredits, setMuseCredits] = useState(null);
  const [museTaskId, setMuseTaskId] = useState(null);
  const [museAvailable, setMuseAvailable] = useState(false);
  const [sunoAvailable, setSunoAvailable] = useState(false);
  const [meloAvailable, setMeloAvailable] = useState(false);

  const [contentData, setContentData] = useState({
    genres: [], sceneTemplates: [], aiVideoTools: [], effects: [], stylePalettes: [], musicStyles: []
  });
  const [contentLoaded, setContentLoaded] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStage, setGenStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [timelineResult, setTimelineResult] = useState(null);

  const resultRef = useRef(null);

  useEffect(() => { resultRef.current = result; }, [result]);

  // === AUTO generation mode state ===
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoStopRequested, setAutoStopRequested] = useState(false);
  const [autoCount, setAutoCount] = useState(0);
  const [showAutoConfirm, setShowAutoConfirm] = useState(false);
  const [autoConfirmStep, setAutoConfirmStep] = useState(1);
  const [autoThoughts, setAutoThoughts] = useState([]);
  const [showCreativePanel, setShowCreativePanel] = useState(true);
  const [autoCountdownSec, setAutoCountdownSec] = useState(0);
  const [autoCountdownActive, setAutoCountdownActive] = useState(false);
  const autoRunningRef = useRef(false);
  const autoStopRequestedRef = useRef(false);
  const autoConsecutiveErrorsRef = useRef(0);
  const autoCountRef = useRef(0);
  const autoCountdownIntervalRef = useRef(null);
  const autoDraftHistoryIdRef = useRef(null);
  const autoCreativeSnapshotRef = useRef(null);
  const handleGenerateRef = useRef(null);

  // Sync AUTO refs with React state (so async finally block sees latest values)
  useEffect(() => {
    autoRunningRef.current = autoRunning;
  }, [autoRunning]);
  useEffect(() => {
    autoStopRequestedRef.current = autoStopRequested;
  }, [autoStopRequested]);

  // Database-driven content loading
  useEffect(() => {
    let cancelled = false;
    async function loadContent() {
      console.log('[MVPage] Fetching content from /content/all...');
      try {
        const d = await api.request('/content/all');
        if (cancelled) return;
        console.log('[MVPage] Content API response:', { success: d.success, genres: d.data?.genres?.length, templates: d.data?.sceneTemplates?.length, tools: d.data?.aiVideoTools?.length });
        if (d.success && d.data) {
          setContentData(d.data);
          if (d.data.genres && d.data.genres.length > 0) {
            setGenres(d.data.genres.map(g => g.key));
          }
          setContentLoaded(true);
        } else {
          console.warn('[MVPage] Content API returned unexpected shape:', d);
          setContentLoaded(true);
        }
      } catch (e) {
        console.error('[MVPage] Content API failed, using fallback:', e.message);
        setContentLoaded(true);
      }
    }
    loadContent();
    return () => { cancelled = true; };
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const [muse, suno, melo] = await Promise.all([
        MuseService.checkConfigured(),
        SunoService.checkConfigured(),
        MeloService.checkConfigured(),
      ]);
      const museOk = typeof muse === 'boolean' ? muse : (muse?.configured ?? false);
      const sunoOk = typeof suno === 'boolean' ? suno : (suno?.configured ?? false);
      const meloOk = typeof melo === 'boolean' ? melo : (melo?.configured ?? false);
      setMuseAvailable(museOk);
      setSunoAvailable(sunoOk);
      setMeloAvailable(meloOk);

      if (engine === 'muse' && museOk) {
        try {
          const credits = await MuseService.getCredits();
          if (credits) setMuseCredits(credits);
        } catch { }
      }
      showToast?.(t('mv.history_refresh'), 'success');
    } catch (e) {
      console.error('[MVPage] loadConfig failed:', e);
      showToast?.(t('generation.failed'), 'error');
    }
  }, [engine, showToast, t]);

  const getGenreLabel = useCallback((key) => {
    const g = contentData.genres.find(x => x.key === key);
    if (!g) return key;
    const tKey = ts('mv_genres.' + key);
    return tKey || (currentLang === 'en' ? g.label_en : g.label_zh);
  }, [contentData.genres, currentLang]);

  const getGenreLabelEn = useCallback((key) => {
    const g = contentData.genres.find(x => x.key === key);
    if (!g) return key;
    return g.label_en;
  }, [contentData.genres]);

  const getSceneIcon = useCallback((key) => {
    const s = contentData.sceneTemplates.find(x => x.key === key);
    return resolveIcon(s ? s.icon : null);
  }, [contentData.sceneTemplates]);

  const getToolIcon = useCallback((key) => {
    const tool = contentData.aiVideoTools.find(x => x.key === key);
    return resolveIcon(tool ? tool.icon : null);
  }, [contentData.aiVideoTools]);

  const sceneTemplates = contentData.sceneTemplates.length > 0
    ? contentData.sceneTemplates.map(s => ({
      id: s.key,
      label: ts('scenes.' + s.key) || (currentLang === 'en' ? s.label_en : s.label_zh),
      icon: resolveIcon(s.icon),
      prompt: s.prompt,
    }))
    : [];

  const aiVideoTools = contentData.aiVideoTools.length > 0
    ? contentData.aiVideoTools.map(tool => ({
      id: tool.key,
      name: tool.name,
      icon: resolveIcon(tool.icon),
      url: tool.url,
      description: ts('tools.' + tool.key) || (currentLang === 'en' ? tool.description_en : tool.description_zh),
      description_zh: tool.description_zh,
      description_en: tool.description_en,
      features: tool.features || [],
      pricing: tool.pricing,
      bestFor: currentLang === 'en' ? tool.best_for_en : tool.best_for_zh,
    }))
    : [];

  const effectList = contentData.effects.length > 0
    ? contentData.effects.map(e => ({
      id: e.key,
      name: ts('effects.' + e.key) || (currentLang === 'en' ? e.label_en : e.label_zh),
      zh: e.label_zh,
      en: e.label_en,
    }))
    : [];

  const paletteList = contentData.stylePalettes.length > 0
    ? contentData.stylePalettes.map(p => ({
      id: p.key,
      zh: p.label_zh,
      en: p.label_en,
      label: currentLang === 'en' ? p.label_en : p.label_zh,
      colors: p.colors ? JSON.parse(p.colors) : [],
    }))
    : [];

  const genreLabels = useMemo(() => {
    const map = {};
    contentData.genres.forEach(g => {
      map[g.key] = currentLang === 'en' ? g.label_en : g.label_zh;
    });
    return map;
  }, [contentData.genres, currentLang]);

  const translateFeature = useCallback((feature) => {
    const key = 'tool_features.' + feature.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return ts(key) || feature;
  }, [ts]);

  // API status checks
  useEffect(() => {
    let cancelled = false;
    async function checkStatus() {
      try {
        const [muse, suno, melo] = await Promise.all([
          MuseService.checkConfigured(),
          SunoService.checkConfigured(),
          MeloService.checkConfigured(),
        ]);
        if (cancelled) return;
        const museOk = typeof muse === 'boolean' ? muse : (muse?.configured ?? false);
        const sunoOk = typeof suno === 'boolean' ? suno : (suno?.configured ?? false);
        const meloOk = typeof melo === 'boolean' ? melo : (melo?.configured ?? false);
        setMuseAvailable(museOk);
        setSunoAvailable(sunoOk);
        setMeloAvailable(meloOk);

        if (engine === 'muse' && museOk) {
          try {
            const credits = await MuseService.getCredits();
            if (!cancelled && credits) setMuseCredits(credits);
          } catch { }
        }
      } catch { }
    }
    checkStatus();
    return () => { cancelled = true; };
  }, [engine]);

  const handleCopyToClipboard = async (text) => {
    try {
      await copyToClipboard(text);
      showToast(t('clipboard.copied'));
    } catch { }
  };

  const handleCopyTimeline = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t('clipboard.timeline_copied'));
    } catch { }
  };

  const generateWithMuse = async (params) => {
    try {
      setGenStage(t('mv.gen_stage_initializing_muse'));
      const taskId = await MuseService.generateMusic(params);
      setMuseTaskId(taskId);

      setGenStage(t('mv.gen_stage_waiting_muse'));
      const result = await MuseService.waitForResult(taskId, (p, s) => {
        setGenProgress(p);
        setGenStage(s);
      });

      if (result.audio_url) {
        // Route through backend audio proxy to avoid CORS on muse.top CDN.
        const raw = result.audio_url;
        const audioSrc = (raw.startsWith('/api/') || raw.startsWith('blob:'))
          ? raw
          : `/api/proxy/audio?url=${encodeURIComponent(raw)}`;
        const audioResp = await fetch(audioSrc);
        const audioBlob = await audioResp.blob();
        return { blob: audioBlob, url: URL.createObjectURL(audioBlob), lyrics: result.lyrics || params.prompt };
      }
      throw new Error(t('mv.gen_error_muse_no_audio'));
    } catch (e) {
      throw e;
    }
  };

  const generateWithSuno = async (params) => {
    const prompt = params.prompt || '';
    const style = params.style || '';

    setGenStage(t('mv.gen_stage_initializing_suno'));
    const res = await SunoService.generateMusic({ prompt, style, title: params.title });
    const taskId = res?.serialNos?.[0];
    if (!taskId) throw new Error(t('mv.gen_error_suno_no_task'));

    setGenStage(t('mv.gen_stage_waiting_suno'));
    const finalResult = await SunoService.waitForResult(taskId, (p, s) => {
      setGenProgress(p);
      setGenStage(s);
    });

    if (finalResult && finalResult.audio_url) {
      return {
        blob: params.blob,
        url: finalResult.audio_url,
        lyrics: finalResult.lyrics || prompt,
        result: finalResult,
      };
    }
    throw new Error(t('mv.gen_error_failed'));
  };

  const generateWithMelo = async (params) => {
    setGenStage(t('mv.gen_stage_initializing_melo'));
    const taskId = await MeloService.generateMusic(params);
    setGenStage(t('mv.gen_stage_waiting_melo'));
    const finalResult = await MeloService.waitForResult(taskId, (p, s) => {
      setGenProgress(p);
      setGenStage(s);
    });
    if (finalResult && finalResult.audio_url) {
      return {
        blob: params.blob,
        url: finalResult.audio_url,
        lyrics: finalResult.lyrics || params.prompt,
        result: finalResult,
      };
    }
    throw new Error(t('mv.gen_error_melo_no_audio'));
  };

  const generateLocally = async (params) => {
    console.log('[MVPage] generateLocally start:', { genre: params.genre, duration: params.duration, style: params.style });
    setGenStage(t('mv.gen_stage_composing_local'));
    const composition = composeMusic({
      genre: params.genre,
      style: params.style,
      duration: params.duration,
      lyrics: params.lyrics,
      scene: params.scene,
    });

    setGenStage(t('mv.gen_stage_composing_audio'));
    const blob = await compositionToWavBlob(composition);
    const audioUrl = URL.createObjectURL(blob);
    console.log('[MVPage] Audio rendered:', { size: blob.size, url: audioUrl });

    setGenProgress(55);
    setGenStage(t('mv.gen_stage_composing_video'));

    const mvData = generateMV({ genre: params.genre, duration: params.duration });
    console.log('[MVPage] MV timeline generated:', { scenes: mvData.timeline.length, palette: mvData.colorPalette });
    setTimelineResult(mvData);

    const videoBlob = await generateMVVideo({
      audioUrl,
      timeline: mvData.timeline,
      colorPalette: params.colorPalette || mvData.colorPalette,
      effects: params.effects,
      lyrics: params.lyrics,
      duration: params.duration,
    });

    const videoUrl = URL.createObjectURL(videoBlob);
    console.log('[MVPage] Video composed:', { videoSize: videoBlob.size, duration: params.duration });

    return { blob, url: audioUrl, videoBlob, videoUrl, lyrics: params.lyrics };
  };

  // === AUTO: Randomize MV inputs (genre, style, duration, palette, effects) ===
  // Sets state AND writes a snapshot into autoCreativeSnapshotRef so handleGenerate
  // (called via setTimeout) reads fresh values instead of stale React state.
  const randomizeMVInputs = useCallback(() => {
    const { theme: pickedTheme, style: pickedStyleTheme } = pickRandomThemeStyle();

    const genreList = genres.length > 0 ? genres : FALLBACK_GENRES;
    const randGenre = genreList[Math.floor(Math.random() * genreList.length)];

    const styleOptions = ['modern', 'cinematic', 'retro', 'anime', 'minimalist', 'abstract', 'dreamy', 'neon'];
    const randStyle = styleOptions[Math.floor(Math.random() * styleOptions.length)];

    const durations = [15, 30, 45, 60];
    const randDuration = durations[Math.floor(Math.random() * durations.length)];

    const randPalette = paletteList.length > 0
      ? paletteList[Math.floor(Math.random() * paletteList.length)].id
      : 'purple_pink_gradient';

    // Pick 0-2 random effects
    const effSource = effectList.length > 0 ? effectList : [];
    const shuffled = [...effSource].sort(() => Math.random() - 0.5);
    const randEffects = shuffled.slice(0, Math.floor(Math.random() * 3)).map(e => e.id);

    setGenre(randGenre);
    setStyle(randStyle);
    setDuration(randDuration);
    setColorPalette(randPalette);
    setSelectedEffects(randEffects);

    const chosenTitle = generateRandomTitle();
    const lyricsText = generateAutoLyrics(pickedTheme);
    const bpm = 90 + Math.floor(Math.random() * 70); // 90–159
    const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'];
    const key = keys[Math.floor(Math.random() * keys.length)];
    const command = `引擎: ${displayName}\n流派: ${randGenre}\n视觉风格: ${randStyle}\n时长: ${randDuration}s\n调色板: ${randPalette}\n特效: ${randEffects.join(', ') || '无'}\nBPM: ${bpm} · 调性: ${key}\n标题: ${chosenTitle}`;

    // Write snapshot (merged with any partial milestone data) for handleGenerate
    autoCreativeSnapshotRef.current = {
      ...(autoCreativeSnapshotRef.current || {}),
      theme: pickedTheme,
      styleTheme: pickedStyleTheme,
      genre: randGenre,
      style: randStyle,
      duration: randDuration,
      colorPalette: randPalette,
      effects: randEffects,
      title: chosenTitle,
      prompt: lyricsText,
      lyrics: lyricsText,
      bpm,
      key,
      command,
      finalizedAt: Date.now(),
      engine: displayName,
    };

    return {
      theme: pickedTheme,
      style: pickedStyleTheme,
      title: chosenTitle,
      lyrics: lyricsText,
      bpm,
      key,
      command,
    };
  }, [genres, paletteList, effectList, displayName]);

  const handleGenerate = async (isAuto = false) => {
    // Normalize: when wired directly to onClick, the first arg is a DOM event.
    if (typeof isAuto !== 'boolean') isAuto = false;
    if (isGenerating) return;
    setError(null);
    setResult(null);
    setAudioUrl(null);
    setVideoUrl(null);
    setVideoBlob(null);

    // === AUTO path: read from snapshot ref (setState is async, would be stale) ===
    const snap = autoCreativeSnapshotRef.current;
    const useSnap = isAuto && snap && snap.genre;
    const effGenre = useSnap ? snap.genre : genre;
    const effStyle = useSnap ? snap.style : style;
    const effDuration = useSnap ? snap.duration : duration;
    const effColorPalette = useSnap ? snap.colorPalette : colorPalette;
    const effEffects = useSnap ? snap.effects : selectedEffects;

    const prompt = useSnap ? snap.prompt : (pendingLyrics?.text || '');
    const title = useSnap ? snap.title : (pendingLyrics?.title || `${effGenre} MV`);

    const styleMap = contentData.musicStyles.find(s => s.genre_key === effGenre);
    const sunoStyle = styleMap ? styleMap.style_suno : '';
    const museStyle = styleMap ? styleMap.style_muse : '';

    const params = {
      prompt,
      title,
      genre: effGenre,
      style: sunoStyle || museStyle || effStyle,
      museStyle,
      duration: effDuration,
      lyrics: prompt,
      scene: effStyle,
      colorPalette: effColorPalette,
      effects: effEffects,
    };

    setIsGenerating(true);
    setGenProgress(5);
    setGenStage(t('mv.gen_stage_starting'));

    try {
      // Engine availability checks (thrown so AUTO loop can count failures)
      if (engine === 'muse' && !museAvailable) throw new Error(t('muse.notConfigured'));
      if (engine === 'suno' && !sunoAvailable) throw new Error(t('suno.notConfigured'));
      if (engine === 'melo' && !meloAvailable) throw new Error(t('melo.notConfigured'));

      let musicResult;

      console.log('[MVPage] Starting generation:', { engine, genre: effGenre, duration: effDuration, hasPrompt: !!prompt, isAuto });

      if (engine === 'muse') {
        console.log('[MVPage] Calling Muse AI generateMusic...');
        musicResult = await generateWithMuse(params);
        console.log('[MVPage] Muse result:', { hasAudio: !!musicResult?.url });
      } else if (engine === 'suno') {
        console.log('[MVPage] Calling Suno AI generateMusic...');
        musicResult = await generateWithSuno(params);
        console.log('[MVPage] Suno result:', { hasAudio: !!musicResult?.url });
      } else if (engine === 'melo') {
        console.log('[MVPage] Calling Melo AI generateMusic...');
        musicResult = await generateWithMelo(params);
        console.log('[MVPage] Melo result:', { hasAudio: !!musicResult?.url });
      } else {
        console.log('[MVPage] Using local generation...');
        musicResult = await generateLocally(params);
      }

      setGenProgress(65);
      setGenStage(t('mv.gen_stage_composing_video'));

      let finalVideoBlob = musicResult.videoBlob;
      let finalVideoUrl = musicResult.videoUrl;

      if (!finalVideoBlob && engine !== 'local') {
        console.log('[MVPage] Composing video from AI audio:', { engine, audioUrl: musicResult.url });
        const mvData = generateMV({ genre: effGenre, duration: effDuration });
        setTimelineResult(mvData);
        const videoBlob = await generateMVVideo({
          audioUrl: musicResult.url,
          timeline: mvData.timeline,
          colorPalette: effColorPalette || mvData.colorPalette,
          effects: effEffects,
          lyrics: params.prompt,
          duration: effDuration,
        });
        finalVideoBlob = videoBlob;
        finalVideoUrl = URL.createObjectURL(videoBlob);
        console.log('[MVPage] AI video composed:', { videoSize: videoBlob.size });
      }

      const finalResult = {
        id: Date.now().toString(),
        title,
        prompt,
        audioUrl: musicResult.url,
        videoUrl: finalVideoUrl,
        videoBlob: finalVideoBlob,
        lyrics: musicResult.lyrics,
        engine,
        genre: effGenre,
        style: effStyle,
        timestamp: Date.now(),
      };

      setResult(finalResult);
      setAudioUrl(musicResult.url);
      setVideoUrl(finalVideoUrl);
      setVideoBlob(finalVideoBlob);

      // === History: AUTO path removes draft & records song; manual path records directly ===
      if (isAuto || autoRunningRef.current) {
        const draftId = autoDraftHistoryIdRef.current;
        if (draftId) {
          removeFromHistory(draftId);
          autoDraftHistoryIdRef.current = null;
        }
        try {
          await addToHistory({
            type: 'song',
            status: 'success',
            method: engine + '_ai',
            engine,
            title,
            text: prompt,
            translation: null,
            audioUrl: musicResult.url,
            videoUrl: finalVideoUrl,
            videoBlob: finalVideoBlob,
            lyrics: musicResult.lyrics,
            genre: effGenre,
            style: effStyle,
            timestamp: Date.now(),
            source: 'mv',
            creativeProcess: {
              thoughts: autoThoughts,
              snapshot: autoCreativeSnapshotRef.current,
              engine: displayName,
            },
          });
        } catch { }
        autoProgress.setComplete({ title, error: null });
        autoProgress.incrementCount();
        autoConsecutiveErrorsRef.current = 0;
      } else {
        try {
          await addToHistory({
            id: finalResult.id,
            title,
            text: prompt,
            translation: null,
            audioUrl: musicResult.url,
            videoUrl: finalVideoUrl,
            videoBlob: finalVideoBlob,
            lyrics: musicResult.lyrics,
            engine,
            genre: effGenre,
            style: effStyle,
            timestamp: Date.now(),
            source: 'mv',
          });
        } catch { }
      }

      setGenProgress(100);
      setGenStage(t('mv.gen_stage_complete'));
    } catch (e) {
      setError(e.message || t('generation.failed'));
      // === AUTO: record failure as creation_attempt, even when no song produced ===
      if (isAuto || autoRunningRef.current) {
        autoProgress.setComplete({ title, error: e.message });
        autoConsecutiveErrorsRef.current += 1;
        try {
          const cpSnap = autoCreativeSnapshotRef.current || {};
          const fallbackTitle = cpSnap.title || title || '未命名构思';
          const draftId = autoDraftHistoryIdRef.current;
          if (draftId) {
            removeFromHistory(draftId);
            autoDraftHistoryIdRef.current = null;
          }
          await addToHistory({
            type: 'creation_attempt',
            status: 'failed',
            method: engine + '_ai',
            engine,
            title: `❌ 构思失败 · ${fallbackTitle}`,
            text: prompt,
            translation: null,
            lyrics: prompt,
            prompt,
            audioUrl: '',
            videoUrl: '',
            videoBlob: null,
            genre: effGenre,
            style: effStyle,
            error: e.message,
            source: 'mv',
            creativeProcess: {
              thoughts: autoThoughts,
              snapshot: cpSnap,
              engine: displayName,
              error: e.message,
              failedAt: new Date().toISOString(),
            },
            result: { error: e.message, params, failed: true },
          });
        } catch (hErr) {
          console.warn('[AUTO] [MVPage] 失败记录写入 history 时出现异常（不影响主流程）:', hErr.message);
        }
      }
    } finally {
      setIsGenerating(false);

      // === AUTO mode: schedule next iteration ===
      if (isAuto || autoRunningRef.current) {
        setTimeout(() => {
          const maxSongs = getEngineSongCount(engine);
          const shouldStop =
            autoStopRequestedRef.current ||
            !autoRunningRef.current ||
            autoConsecutiveErrorsRef.current >= 8 ||
            autoCountRef.current >= maxSongs;

          if (shouldStop) {
            setAutoRunning(false);
            setAutoStopRequested(false);
            autoProgress.stopProgress();
            const draftId = autoDraftHistoryIdRef.current;
            if (draftId) {
              const snap = autoCreativeSnapshotRef.current || {};
              updateHistory(draftId, {
                status: autoConsecutiveErrorsRef.current >= 8 ? 'failed' : 'stopped',
                title: autoConsecutiveErrorsRef.current >= 8
                  ? `❌ ${snap.title || '未命名'} - 连续失败已停止`
                  : `⏹️ ${snap.title || '未命名'} - AUTO 已停止`,
                lyrics: snap.lyrics || snap.command || '',
                prompt: snap.command || '',
                style: snap.style || '',
                creativeProcess: {
                  snapshot: snap,
                  phase: autoConsecutiveErrorsRef.current >= 8 ? '失败停止' : '已停止',
                  stoppedAt: new Date().toISOString(),
                  engine: displayName,
                  error: autoConsecutiveErrorsRef.current >= 8 ? '连续生成失败（可能积分不足或 API 异常）' : undefined,
                },
              });
              autoDraftHistoryIdRef.current = null;
            }
            showToast?.(
              autoStopRequestedRef.current
                ? t('auto.stopped_by_request')
                : autoConsecutiveErrorsRef.current >= 8
                  ? t('auto.stopped_consecutive_failures')
                  : t('auto.finished'),
              autoStopRequestedRef.current ? 'info' : 'warning'
            );
            return;
          }

          const nextIteration = autoCountRef.current + 1;
          setAutoCount(nextIteration);
          autoCountRef.current = nextIteration;
          // Randomize inputs for NEXT generation + capture choices
          const choices = randomizeMVInputs();
          const thought = generateCreativeThought({
            iteration: nextIteration,
            theme: choices.theme,
            style: choices.style,
            title: choices.title,
            bpm: choices.bpm,
            key: choices.key,
            engine: displayName,
            lyricsSnippet: choices.lyrics,
            commandSent: choices.command,
          });
          setAutoThoughts(prev => [...prev.slice(-15), thought]);
          autoProgress.addThought(thought);
          // Schedule next song with a small delay so user sees the result briefly
          setTimeout(() => handleGenerateRef.current(true), 1800);
        }, 1500);
      }
    }
  };

  // Keep ref in sync so AUTO's setTimeout always calls the latest handleGenerate
  handleGenerateRef.current = handleGenerate;

  // === AUTO: 60s countdown + creative thoughts at 50s/40s/20s/5s milestones ===
  const startAutoGeneration = useCallback(() => {
    console.log('%c[AUTO] [MVPage] startAutoGeneration() 入口',
      'background:#16a085;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold;');
    // Report to global progress bar
    autoProgress.startProgress({ engine, engineName: displayName, totalCountdown: 60 });

    // 1. Open platform website tab (deduplicated by sessionStorage)
    const tabOpened = openPlatformWebsite(engine);
    console.log('[AUTO] [MVPage] openPlatformWebsite(' + engine + ') result:', tabOpened ? '✅ 新标签已打开' : '⏭ 已存在（去重跳过）');

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

    // Create initial draft history entry — updated at each milestone, replaced on completion
    try {
      const draft = addToHistory({
        type: 'creation_draft',
        status: 'in_progress',
        method: engine + '_ai',
        engine,
        title: `🎨 ${displayName} AUTO 创作中...`,
        text: '',
        translation: null,
        lyrics: '',
        prompt: '',
        audioUrl: '',
        videoUrl: '',
        videoBlob: null,
        duration: 0,
        style: '',
        source: 'mv',
        creativeProcess: {
          thoughts: [],
          snapshot: {},
          phase: '启动',
          startedAt: new Date().toISOString(),
          engine: displayName,
        },
      });
      autoDraftHistoryIdRef.current = draft.id;
    } catch (e) {
      console.warn('[AUTO] [MVPage] 创建草稿历史记录失败:', e.message);
    }

    // Clear previous countdown interval if any
    if (autoCountdownIntervalRef.current) {
      clearInterval(autoCountdownIntervalRef.current);
      autoCountdownIntervalRef.current = null;
    }

    // 3. Initial welcome thought
    const startThought = {
      phase: '启动阶段', time: new Date().toLocaleTimeString(),
      step: 'AUTO_INIT',
      title: `▶️ ${displayName} AUTO 模式启动`,
      summary: `打开 ${displayName} 官网标签页 → 60 秒构思倒计时 → 生成 MV`,
      detail: `此阶段：\n  • 已自动为你在新标签打开 ${displayName} 官网（无需登录，仅用于查看官网状态）\n  • 接下来 60 秒用于"深度构思"：\n     - 50s：确定主题与情感基调\n     - 40s：确定流派、视觉风格、调色板、标题\n     - 20s：确定 BPM、调性、歌词草稿\n     - 5s：最终检查 + 启动生成\n  • 即便积分不足导致生成失败，整个构思过程都会被记录到「创作构思记录簿」。`,
    };
    setAutoThoughts(prev => [...prev, startThought]);
    autoProgress.addThought(startThought);
    showToast?.(t('auto.starting', { engine: displayName }), 'info');

    // 4. Start 60s countdown — publish planning thoughts at milestones
    setAutoCountdownSec(60);
    setAutoCountdownActive(true);
    let sec = 60;
    autoCountdownIntervalRef.current = setInterval(() => {
      sec -= 1;
      setAutoCountdownSec(sec);
      autoProgress.updateCountdown(sec);

      if (sec === 50) {
        const thought = {
          phase: '构思阶段 1/4', time: new Date().toLocaleTimeString(), step: 'THEME_PICK',
          title: '🎯 确定主题与情感基调',
          summary: '正在主题词库中抽取灵感种子…',
          detail: '遍历主题词库（love, loneliness, dreams, nostalgia…）+ 风格词库，组合候选情感搭配。\n当前倒计时：50s → 40s 完成主题。',
        };
        setAutoThoughts(prev => [...prev, thought]);
        autoProgress.addThought(thought);
        const draftId = autoDraftHistoryIdRef.current;
        if (draftId) {
          updateHistory(draftId, {
            creativeProcess: { thoughts: [thought], snapshot: autoCreativeSnapshotRef.current, phase: '主题抽取', updatedAt: new Date().toISOString(), engine: displayName },
            title: `🎨 ${displayName} AUTO 创作中 - 主题确定中...`,
          });
        }
      } else if (sec === 40) {
        const themeStyle = pickRandomThemeStyle();
        const mvStyle = ['modern', 'cinematic', 'retro', 'anime', 'minimalist', 'abstract'][Math.floor(Math.random() * 6)];
        const mvGenre = (genres.length > 0 ? genres : FALLBACK_GENRES)[Math.floor(Math.random() * (genres.length > 0 ? genres.length : FALLBACK_GENRES.length))];
        const mvPalette = paletteList.length > 0
          ? paletteList[Math.floor(Math.random() * paletteList.length)].id
          : 'purple_pink_gradient';
        const ttl = generateRandomTitle(themeStyle.theme);
        autoCreativeSnapshotRef.current = {
          ...(autoCreativeSnapshotRef.current || {}),
          theme: themeStyle.theme, style: mvStyle, genre: mvGenre, colorPalette: mvPalette, title: ttl,
          plannedAt: Date.now(), engine: displayName,
        };
        const thought = {
          phase: '构思阶段 2/4', time: new Date().toLocaleTimeString(), step: 'STYLE_TITLE',
          title: '🎨 确定流派、视觉风格、调色板 & 标题',
          summary: `主题：${themeStyle.theme} ｜ 流派：${mvGenre} ｜ 视觉风格：${mvStyle} ｜ 标题：${ttl}`,
          detail: `主题种子：${themeStyle.theme} (情感方向: ${themeStyle.style})\nMV 流派：${mvGenre}\n视觉风格：${mvStyle}\n调色板：${mvPalette}\n标题：${ttl}\n下一步：20s 内完成 BPM 抽取 + 歌词创作。`,
        };
        setAutoThoughts(prev => [...prev, thought]);
        autoProgress.addThought(thought);
        const draftId2 = autoDraftHistoryIdRef.current;
        if (draftId2) {
          updateHistory(draftId2, {
            title: `🎨 ${ttl} - ${displayName} AUTO 创作中`,
            style: mvStyle,
            genre: mvGenre,
            creativeProcess: { snapshot: autoCreativeSnapshotRef.current, phase: '风格与标题', updatedAt: new Date().toISOString(), engine: displayName },
          });
        }
      } else if (sec === 20) {
        const snap = autoCreativeSnapshotRef.current || {};
        const bpm = 90 + Math.floor(Math.random() * 70);
        const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm'];
        const key = keys[Math.floor(Math.random() * keys.length)];
        const lyricsPreview = generateAutoLyrics(snap.theme || 'love');
        autoCreativeSnapshotRef.current = {
          ...snap, bpm, key, lyrics: lyricsPreview, command: lyricsPreview,
        };
        const thought = {
          phase: '构思阶段 3/4', time: new Date().toLocaleTimeString(), step: 'LYRICS_DRAFT',
          title: '✍️ 歌词草稿 + 生成命令',
          summary: `BPM=${bpm} ｜ Key=${key} ｜ 歌词共 ${lyricsPreview.length} 字`,
          detail: `BPM：${bpm}\n调性：${key}\n歌词预览：\n${lyricsPreview.substring(0, 240)}${lyricsPreview.length > 240 ? '…' : ''}`,
        };
        setAutoThoughts(prev => [...prev, thought]);
        autoProgress.addThought(thought);
        const draftId3 = autoDraftHistoryIdRef.current;
        if (draftId3) {
          updateHistory(draftId3, {
            lyrics: lyricsPreview,
            prompt: lyricsPreview,
            creativeProcess: { snapshot: autoCreativeSnapshotRef.current, phase: '歌词与命令', updatedAt: new Date().toISOString(), engine: displayName },
          });
        }
      } else if (sec === 5) {
        const thought = {
          phase: '构思阶段 4/4', time: new Date().toLocaleTimeString(), step: 'FINAL_CHECK',
          title: '✅ 最终检查 — 5 秒后提交生成',
          summary: '参数快照已锁定，5 秒后调用 API 开始生成',
          detail: `当前快照：${JSON.stringify(autoCreativeSnapshotRef.current || {}, null, 2).substring(0, 500)}\n即使积分不足导致 API 失败，以上完整构思记录也会一并写入「创作构思记录簿」与生成历史。`,
        };
        setAutoThoughts(prev => [...prev, thought]);
        autoProgress.addThought(thought);
        const draftId4 = autoDraftHistoryIdRef.current;
        if (draftId4) {
          const snap = autoCreativeSnapshotRef.current || {};
          updateHistory(draftId4, {
            title: `🎨 ${snap.title || '未命名'} - ${displayName} AUTO 准备生成`,
            lyrics: snap.lyrics || snap.command || '',
            prompt: snap.command || '',
            style: snap.style || '',
            creativeProcess: { snapshot: snap, phase: '最终检查', updatedAt: new Date().toISOString(), engine: displayName },
          });
        }
      } else if (sec <= 0) {
        // 5. T=0: stop countdown, randomize final inputs, trigger generation
        clearInterval(autoCountdownIntervalRef.current);
        autoCountdownIntervalRef.current = null;
        setAutoCountdownActive(false);
        setAutoCountdownSec(0);
        const triggerThought = {
          phase: '生成阶段', time: new Date().toLocaleTimeString(), step: 'TRIGGER',
          title: `🚀 倒计时结束 — 正式触发 ${displayName} 生成`,
          summary: '提交随机化参数 + 创作命令 → API',
          detail: '调用链：randomizeMVInputs() → generateCreativeThought() → handleGenerateRef.current(true)',
        };
        setAutoThoughts(prev => [...prev, triggerThought]);
        autoProgress.addThought(triggerThought);
        autoProgress.setGenerating({ title: '🚀 生成中...' });
        console.log('[AUTO] [MVPage] ⏱ 60s 倒计时归零 → 执行 randomizeMVInputs()');
        const choices = randomizeMVInputs();
        console.log('[AUTO] [MVPage] 🎲 随机参数: theme=' + choices.theme + ', genre=' + autoCreativeSnapshotRef.current?.genre
          + ', title=' + choices.title + ', BPM=' + choices.bpm + ', key=' + choices.key);
        console.log('[AUTO] [MVPage] 📋 生成命令:\n' + choices.command);
        const thought = generateCreativeThought({
          iteration: 1,
          theme: choices.theme, style: choices.style, title: choices.title,
          bpm: choices.bpm, key: choices.key, engine: displayName,
          lyricsSnippet: choices.lyrics, commandSent: choices.command,
        });
        setAutoThoughts(prev => [...prev, thought]);
        autoProgress.addThought(thought);
        setTimeout(() => {
          console.log('[AUTO] [MVPage] 触发 handleGenerateRef.current(true) — 类型:', typeof handleGenerateRef.current);
          handleGenerateRef.current(true);
        }, 300);
      }
    }, 1000);
  }, [engine, displayName, genres, paletteList, randomizeMVInputs]);

  // Click AUTO button → request stop if running; otherwise open 3-step confirm modal
  const handleAutoClick = () => {
    if (autoRunning) {
      setAutoStopRequested(true);
      setAutoRunning(false);
      autoRunningRef.current = false;
      autoProgress.stopProgress();
      if (autoCountdownIntervalRef.current) {
        clearInterval(autoCountdownIntervalRef.current);
        autoCountdownIntervalRef.current = null;
        setAutoCountdownActive(false);
      }
      const draftId = autoDraftHistoryIdRef.current;
      if (draftId) {
        const snap = autoCreativeSnapshotRef.current || {};
        updateHistory(draftId, {
          status: 'stopped',
          title: `⏹️ ${snap.title || '未命名'} - AUTO 已停止`,
          lyrics: snap.lyrics || snap.command || '',
          prompt: snap.command || '',
          style: snap.style || '',
          creativeProcess: { snapshot: snap, phase: '已停止', stoppedAt: new Date().toISOString(), engine: displayName },
        });
        autoDraftHistoryIdRef.current = null;
      }
      showToast?.(t('auto.stopping'), 'info');
      return;
    }
    setAutoConfirmStep(1);
    setShowAutoConfirm(true);
  };

  const proceedAutoConfirmStep = () => {
    if (autoConfirmStep < 3) {
      setAutoConfirmStep(prev => prev + 1);
      return;
    }
    setShowAutoConfirm(false);
    setAutoConfirmStep(1);
    startAutoGeneration();
  };

  const cancelAutoConfirm = () => {
    setShowAutoConfirm(false);
    setAutoConfirmStep(1);
  };

  const handleDownload = () => {
    if (!result) return;
    if (result.videoBlob) {
      const url = URL.createObjectURL(result.videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.title || 'mv'}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (result.videoUrl) {
      const a = document.createElement('a');
      a.href = result.videoUrl;
      a.download = `${result.title || 'mv'}.mp4`;
      a.target = '_blank';
      a.click();
    }
  };

  // Download just the audio track (used by MVVideoPlayer's audio button).
  const handleDownloadAudio = () => {
    if (!result) return;
    const url = result.audioUrl || result.url;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title || 'mv'}.mp3`;
    a.target = '_blank';
    a.click();
  };

  const formatTime = (s) => {
    if (!s || s <= 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const loadMoreHistory = () => {
    setLoadingList(true);
    try {
      const sessionList = sessions || [];
      const list = sessionList
        .filter(s => s.engine === engine && s.result)
        .map(s => ({
          id: s.id,
          title: s.params?.title || s.prompt?.substring(0, 30) || t('mv.history_no_title'),
          audioUrl: s.result?.audio_url || s.result?.url || s.result?.audioUrl || '',
          duration: s.params?.duration || 0,
          createdAt: s.createdAt,
        }));
      setAudioList(list);
    } catch (e) {
      console.error('Failed to load list:', e);
    } finally {
      setLoadingList(false);
    }
  };

  const shareUrl = result ? `${window.location.origin}/share/${result.id}` : '';

  // Best-effort credit for the confirm dialog (only Muse exposes credits here)
  const credit = museCredits ?? 0;
  const maxSongs = getEngineSongCount(engine);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hero Header — engine-specific gradient (Muse=blue, Suno=green, Melo=amber) */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.headerGradient} border border-white/10 p-6`}>
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${theme.glow1} rounded-full blur-3xl -translate-y-1/2 translate-x-1/4`} />
        <div className={`absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr ${theme.glow2} rounded-full blur-3xl translate-y-1/2 -translate-x-1/4`} />
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.iconBg} flex items-center justify-center shadow-lg ${theme.iconShadow}`}>
              <Video className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold text-white bg-gradient-to-r ${theme.titleText} bg-clip-text text-transparent`}>
                {t('mv.title')} · {displayName}
              </h1>
              <p className={`${theme.subtitleText} text-sm mt-0.5`}>{t('mv.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* AUTO Button */}
            <button
              onClick={handleAutoClick}
              disabled={autoRunning}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-lg
                ${autoRunning
                  ? 'bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 text-white shadow-red-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 hover:from-orange-400 hover:via-red-400 hover:to-rose-400 text-white shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                }`}
            >
              {autoRunning ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  {t('auto.status_running')} · {t('mv.auto_stop')}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {t('auto.btn_label')}
                </>
              )}
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <History className={`w-5 h-5 ${theme.iconColor}`} />
              <span className="text-sm">{t('mv.history')}</span>
            </button>
            <button
              onClick={loadConfig}
              className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title={t('mv.history_refresh')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AUTO status row */}
        {(autoRunning || autoCount > 0) && (
          <div className="relative mt-4 flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <span className={`inline-flex w-2 h-2 rounded-full ${autoRunning ? 'bg-red-400 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-xs text-gray-300 font-medium">
                {autoRunning ? t('auto.status_running') : t('auto.status_idle')}
              </span>
            </div>
            <span className="text-xs font-bold text-orange-300">
              {t('auto.song_count', { count: String(autoCount) })} / {maxSongs}
            </span>
          </div>
        )}
        {!autoRunning && autoCount === 0 && (
          <p className="relative mt-3 text-[11px] text-amber-400/80 flex items-center gap-1 px-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span>{t('mv.auto_warning', { max: String(maxSongs) })}</span>
          </p>
        )}
      </div>

      {/* AUTO countdown / status banner */}
      {(autoRunning || autoCountdownActive) && (
        <div className={`p-4 rounded-xl bg-white/5 border ${theme.border} backdrop-blur-sm`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.iconBg} flex items-center justify-center ${autoCountdownActive ? 'animate-pulse' : ''} ${theme.iconShadow}`}>
                {autoCountdownActive
                  ? <Clock className="w-5 h-5 text-white" />
                  : <Loader className="w-5 h-5 text-white animate-spin" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {autoCountdownActive
                    ? t('mv.auto_countdown', { engine: displayName, sec: String(autoCountdownSec) })
                    : t('mv.auto_generating', { engine: displayName, count: String(autoCount) })}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {autoThoughts.length > 0 ? autoThoughts[autoThoughts.length - 1].title : t('mv.auto_preparing')}
                </div>
              </div>
            </div>
            <button
              onClick={handleAutoClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('mv.auto_stop_btn')}
            </button>
          </div>
          {autoCountdownActive && (
            <div className="mt-3 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${theme.progressFrom} ${theme.progressTo} transition-all duration-1000`}
                style={{ width: `${((60 - autoCountdownSec) / 60) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className={`mb-6 p-4 rounded-xl bg-white/5 border ${theme.border} backdrop-blur-sm flex items-center gap-3`}>
        <Sparkles className={`w-5 h-5 ${theme.accentText} flex-shrink-0`} />
        <span className="text-sm text-gray-300">{t('mv.aide_text')}</span>
      </div>

      <MVControls
        mode={mode}
        onModeChange={setMode}
        genres={genres}
        genreLabels={genreLabels}
        genre={genre}
        onGenreChange={setGenre}
        genreLabel={getGenreLabel(genre)}
        style={style}
        onStyleChange={setStyle}
        duration={duration}
        onDurationChange={setDuration}
        colorPalette={colorPalette}
        onColorPaletteChange={setColorPalette}
        selectedEffects={selectedEffects}
        onEffectsChange={setSelectedEffects}
        sceneTemplates={sceneTemplates}
        stylePalettes={paletteList}
        effects={effectList}
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
        showAdvanced={showAdvanced}
        onShowAdvancedChange={setShowAdvanced}
        engine={engine}
        museCredits={museCredits}
        t={t}
      />

      {isGenerating && (
        <div className={`mt-6 p-6 glass rounded-xl border ${theme.border}`}>
          <div className="flex items-center gap-3 mb-4">
            <Loader className={`w-5 h-5 ${theme.accentText} animate-spin`} />
            <span className="font-semibold text-white">{genStage}</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${theme.progressFrom} ${theme.progressTo} transition-all duration-300`}
              style={{ width: `${genProgress}%` }}
            />
          </div>
          <p className="text-center text-gray-400 mt-2">{genProgress}%</p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <MVVideoPlayer
          result={result}
          videoUrl={videoUrl}
          videoBlob={videoBlob}
          audioUrl={audioUrl}
          duration={duration}
          colorPalette={colorPalette}
          onDownloadVideo={handleDownload}
          onDownloadAudio={handleDownloadAudio}
          onCopyText={handleCopyToClipboard}
          onShare={() => {
            if (shareUrl) {
              navigator.clipboard.writeText(shareUrl).then(() => {
                showToast(t('clipboard.copied'));
              });
            }
          }}
          t={t}
        />
      )}

      {timelineResult && (
        <MVTimelinePreview
          result={timelineResult}
          onCopy={handleCopyTimeline}
          t={t}
        />
      )}

      {aiVideoTools.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <Wand2 className={`w-5 h-5 ${theme.accentText}`} />
            {t('mv.ai_tools_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiVideoTools.map(tool => {
              const Icon = tool.icon;
              return (
                <a
                  key={tool.id}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`glass p-4 rounded-xl border border-white/10 ${theme.toolHoverBorder} ${theme.toolShadow} transition-all group`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${theme.toolIconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${theme.accentText}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate text-white">{tool.name}</h3>
                        <ExternalLink className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2">{tool.description}</p>
                      {tool.features?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tool.features.slice(0, 3).map((f, i) => (
                            <span key={i} className={`px-2 py-0.5 text-xs rounded ${theme.chipBg} ${theme.chipText} ${theme.chipBorder} border`}>
                              {translateFeature(f)}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">{tool.pricing} · {tool.bestFor}</p>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Music History */}
      <div className={`glass p-5 rounded-2xl border ${theme.border}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ListMusic className={`w-4 h-4 ${theme.accentText}`} />
            {t('mv.history_title')}
            {audioList.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full ${theme.chipBg} ${theme.chipText} text-[10px] font-medium`}>
                {audioList.length}
              </span>
            )}
          </h3>
          <button
            onClick={loadMoreHistory}
            disabled={loadingList}
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {loadingList ? (
              <Loader className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {t('mv.history_refresh')}
          </button>
        </div>

        {loadingList && audioList.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-500 text-xs">
            <Loader className="w-4 h-4 animate-spin mr-2" />
            {t('mv.history_loading')}
          </div>
        ) : audioList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-xs">
            <Music className={`w-10 h-10 mb-3 opacity-30 ${theme.iconColor}`} />
            <p>{t('mv.history_empty')}</p>
            <p className="mt-1 text-[10px]">{t('mv.history_empty_hint')}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {audioList.map((item, idx) => {
              const title = item.title || t('mv.history_no_title');
              return (
                <div
                  key={item.id || idx}
                  className={`flex items-center gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 ${theme.toolHoverBorder} transition-all group cursor-pointer`}
                  onClick={() => {
                    if (item.audioUrl) {
                      setAudioUrl(item.audioUrl);
                      setResult(prev => prev ? { ...prev, audioUrl: item.audioUrl, title } : { id: item.id, title, audioUrl: item.audioUrl });
                    }
                  }}
                >
                  <div className={`w-10 h-10 rounded-lg ${theme.chipBg} flex items-center justify-center flex-shrink-0`}>
                    <Disc3 className={`w-4 h-4 ${theme.accentText}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{title}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(item.duration)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <button
                      className={`p-1.5 rounded-lg ${theme.chipBg} ${theme.chipText} hover:bg-white/20 transition-colors`}
                      title={t('mv.history_play')}
                    >
                      <Video className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        filterType="mv"
        onSelectItem={(item) => {
          if (item.audioUrl) setAudioUrl(item.audioUrl);
          if (item.videoUrl) setVideoUrl(item.videoUrl);
          if (item.videoBlob) setVideoBlob(item.videoBlob);
          setResult(item);
        }}
      />

      {/* AUTO Danger Confirmation Modal (3-step) */}
      {showAutoConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={cancelAutoConfirm}>
          <div
            className="w-full max-w-md max-h-[90vh] flex flex-col bg-[#0f0f1a] border border-red-500/40 rounded-2xl shadow-2xl shadow-red-900/50 overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white">
                  {autoConfirmStep === 1 && AUTO_CONFIRM.title1(displayName)}
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

            {/* Step Indicators */}
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

            {/* Body */}
            <div className="p-5 space-y-3 flex-1 min-h-0 overflow-y-auto">
              {autoConfirmStep === 1 && (
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300 font-sans">
                  {AUTO_CONFIRM.desc1(displayName, credit)}
                </pre>
              )}
              {autoConfirmStep === 2 && (
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300 font-sans">
                  {AUTO_CONFIRM.desc2(displayName)}
                </pre>
              )}
              {autoConfirmStep === 3 && (
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300 font-sans">
                  {AUTO_CONFIRM.desc3(displayName, credit)}
                </pre>
              )}

              {autoConfirmStep === 3 && (
                <div className="mt-2 p-3 rounded-xl border border-red-500/40 bg-red-500/10 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-red-300" />
                    <p className="text-xs font-bold text-red-200">免责确认</p>
                  </div>
                  <p className="text-[11px] text-red-300/80">
                    我已知晓此操作将消耗 {displayName} 账户的积分，后果由本人自行承担。
                    zMusic 及相关开发者不对由此造成的积分损失、订阅费用或账号异常承担任何责任。
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
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
        engineName={displayName}
        onClose={() => setShowCreativePanel(false)}
      />
    </div>
  );
}

export default MVPage;
