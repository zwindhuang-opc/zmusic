import React, { useState, useEffect, useRef } from 'react';
import { Video, History, AlertCircle, Settings, ChevronDown, Loader, Sparkles, ExternalLink, Copy, Check, Clapperboard, Wand2, Brain, Palette, Music, Users, Sun, Moon, Cloud, Zap, Film, Camera } from 'lucide-react';
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
import { MVEngineSelector, MVControls, MVVideoPlayer, MVTimelinePreview } from '../components/mv/index.js';

const MUSE_STYLE_MAP = {
  pop: '流行音乐', rock: '摇滚', electronic: '电子音乐', hip_hop: '嘻哈/说唱',
  ballad: '民谣', chinese_traditional: '中国风', jazz: '爵士', classical: '古典',
  rnb: 'R&B', country: '乡村', love_song: '情歌', chinese_classical: '古风',
  concert: '演唱会', modern: '现代', cinematic: '电影配乐', retro: '复古',
  anime: '动漫', gothic_rock: '哥特摇滚'
};

const MUSIC_STYLES = {
  pop: { sunoTags: 'pop', museStyle: '流行音乐' },
  rock: { sunoTags: 'rock', museStyle: '摇滚' },
  electronic: { sunoTags: 'electronic', museStyle: '电子音乐' },
  hip_hop: { sunoTags: 'hip-hop', museStyle: '嘻哈/说唱' },
  ballad: { sunoTags: 'ballad', museStyle: '民谣' },
};

const FALLBACK_GENRES = ['pop', 'rock', 'electronic', 'hip_hop', 'ballad', 'chinese_traditional', 'jazz', 'classical', 'rnb', 'country', 'love_song', 'chinese_classical', 'concert', 'modern', 'cinematic', 'retro', 'anime', 'gothic_rock'];

const MV_EFFECTS = [
  { id: 'rain_wind', name: 'effects.rain_wind' },
  { id: 'footsteps', name: 'effects.footsteps' },
  { id: 'reverb', name: 'effects.reverb' },
  { id: 'delay', name: 'effects.delay' },
  { id: 'di_da_delay', name: 'effects.di_da_delay' },
  { id: 'shimmer_reverb', name: 'effects.shimmer_reverb' },
  { id: 'vocals', name: 'effects.vocals' },
  { id: 'tropical_percussion', name: 'effects.tropical_percussion' },
  { id: 'bass_line', name: 'effects.bass_line' },
  { id: 'guitar_riffs', name: 'effects.guitar_riffs' },
  { id: 'ambient_pads', name: 'effects.ambient_pads' },
  { id: 'modulation', name: 'effects.modulation' }
];

const AI_VIDEO_TOOLS = [
  {
    id: 'freebeat',
    name: 'Freebeat',
    icon: Film,
    url: 'https://freebeat.ai',
    description: 'AI music video agent — beat-synced, full-song output',
    features: ['Full-song video', 'Beat sync', 'Suno import', 'Lip sync'],
    pricing: 'Free tier + $4.99/week',
    bestFor: 'Complete song-to-video'
  },
  {
    id: 'neuralframes',
    name: 'Neural Frames',
    icon: Brain,
    url: 'https://play.neuralframes.com',
    description: '8-stem audio analysis, AI video generation',
    features: ['8-stem analysis', 'Autopilot mode', 'Kling/Seedance/Runway'],
    pricing: '$26/mo',
    bestFor: 'Audio-reactive visuals'
  },
  {
    id: 'kaiber',
    name: 'Kaiber',
    icon: Palette,
    url: 'https://kaiber.ai',
    description: 'Stylized artistic music videos with beat sync',
    features: ['Beat Sync', 'Flipbook/Motion modes', 'Stylized visuals'],
    pricing: '$10/mo',
    bestFor: 'Artistic/Stylized videos'
  },
  {
    id: 'fal',
    name: 'fal.ai (Hunyuan)',
    icon: Zap,
    url: 'https://fal.ai/models/fal-ai/hunyuan-video',
    description: 'Tencent Hunyuan Video — open source, high quality',
    features: ['720p', '5s clips', '$0.4/video', 'Commercial OK'],
    pricing: 'Pay-per-use',
    bestFor: 'API integration'
  },
  {
    id: 'runway',
    name: 'Runway Gen-4',
    icon: Clapperboard,
    url: 'https://runwayml.com',
    description: 'Cinematic AI clips with director control',
    features: ['Motion Brush', 'Camera control', '4K quality'],
    pricing: 'From $12/mo',
    bestFor: 'Cinematic clips'
  },
  {
    id: 'kling',
    name: 'Kling AI',
    icon: Camera,
    url: 'https://klingai.com',
    description: 'Affordable, longer videos, strong human motion',
    features: ['~3min clips', 'Lip sync', 'Multi-shot'],
    pricing: 'From $6.99/mo',
    bestFor: 'Character performance'
  },
];

const SCENE_TEMPLATES = [
  { id: 'cinematic_concert', label: '电影演唱会', icon: Users, prompt: 'Cinematic concert stage with dramatic lighting, crowd silhouettes, sweeping camera moves' },
  { id: 'neon_city', label: '霓虹都市', icon: Cloud, prompt: 'Cyberpunk neon city at night, rain reflections, dynamic camera angles' },
  { id: 'dreamy_pastel', label: '梦幻粉彩', icon: Sun, prompt: 'Dreamy pastel aesthetic, soft lighting, ethereal atmosphere, floating particles' },
  { id: 'epic_fantasy', label: '史诗奇幻', icon: Sparkles, prompt: 'Epic fantasy landscape, magical effects, golden hour, dramatic scale' },
  { id: 'dark_moody', label: '暗黑氛围', icon: Moon, prompt: 'Dark moody atmosphere, low lighting, shadow play, intense emotions' },
  { id: 'summer_vibes', label: '夏日氛围', icon: Sun, prompt: 'Summer beach vibes, golden sunlight, waves, carefree atmosphere' },
];

function MVPage() {
  const { t, ts } = useTranslation();
  const { addToHistory, copyToClipboard, pendingLyrics, showToast } = useGeneration();

  const [mode, setMode] = useState('basic');
  const [genres, setGenres] = useState(FALLBACK_GENRES);
  const [genre, setGenre] = useState('pop');
  const [duration, setDuration] = useState(30);
  const [style, setStyle] = useState('modern');
  const [colorPalette, setColorPalette] = useState('purple_pink_gradient');
  const [selectedEffects, setSelectedEffects] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [engine, setEngine] = useState('muse');
  const [museCredits, setMuseCredits] = useState(null);
  const [museTaskId, setMuseTaskId] = useState(null);
  const [museAvailable, setMuseAvailable] = useState(false);
  const [sunoAvailable, setSunoAvailable] = useState(false);
  const [meloAvailable, setMeloAvailable] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStage, setGenStage] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [composition, setComposition] = useState(null);

  const [lyricsInput, setLyricsInput] = useState('');

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState('');

  const videoRef = useRef(null);

  useEffect(() => {
    if (!isMobileEnvironment()) {
      loadGenres();
    }
    checkServiceAvailability();
  }, []);

  useEffect(() => {
    if (engine === 'muse' && MuseService.isConfigured() && museCredits === null) {
      loadMuseCredits();
    }
  }, [engine, museCredits]);

  const checkServiceAvailability = async () => {
    try {
      const [museOk, sunoOk, meloOk] = await Promise.all([
        MuseService.checkConfigured(),
        SunoService.checkConfigured(),
        MeloService.checkConfigured(),
      ]);
      setMuseAvailable(museOk);
      setSunoAvailable(sunoOk);
      setMeloAvailable(meloOk);
      if (!museOk && sunoOk) {
        setEngine('suno');
      } else if (!museOk && !sunoOk && meloOk) {
        setEngine('melo');
      } else if (!museOk && !sunoOk && !meloOk) {
        setEngine('procedural');
      }
    } catch {
      setMuseAvailable(MuseService.isConfigured());
      setSunoAvailable(SunoService.isConfigured());
      setMeloAvailable(MeloService.isConfigured());
    }
  };

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (audioUrl) {
        try { new URL(audioUrl); URL.revokeObjectURL(audioUrl); } catch { /* not a blob URL */ }
      }
    };
  }, [videoUrl, audioUrl]);

  const loadGenres = async () => {
    try {
      const data = await api.mvGenres();
      if (data.success && data.data?.length > 0) {
        setGenres(data.data);
      }
    } catch { /* use fallback */ }
  };

  const loadMuseCredits = async () => {
    try {
      const user = await MuseService.getUser();
      const credit = user?.memberInfo?.credit ?? user?.credit ?? 0;
      setMuseCredits(credit);
    } catch {
      setMuseCredits(0);
    }
  };

  const getPrompt = () => {
    if (lyricsInput.trim()) {
      return lyricsInput.trim();
    }
    const genreLabel = ts(`lyrics_styles.${genre}`) || ts(`styles.${genre}`) || genre;
    return `${genreLabel} song with ${style} style`;
  };

  const generateAIPrompt = () => {
    const parts = [];
    const genreLabel = ts(`lyrics_styles.${genre}`) || genre;
    parts.push(`${genreLabel} music video`);
    parts.push(`${style} style`);

    if (selectedTemplate) {
      const template = SCENE_TEMPLATES.find(s => s.id === selectedTemplate);
      if (template) parts.push(template.prompt);
    }

    if (lyricsInput.trim()) {
      const firstLine = lyricsInput.trim().split('\n')[0].slice(0, 100);
      parts.push(`lyrics: "${firstLine}"`);
    }

    parts.push(`${duration} seconds`);
    parts.push('professional quality, 4K, cinematic');
    return parts.join(', ');
  };

  const handleCopyPrompt = async (promptKey) => {
    const prompt = generateAIPrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(promptKey);
      showToast('Prompt copied to clipboard!', 'success');
      setTimeout(() => setCopiedPrompt(''), 2000);
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    setError(null);
    setVideoBlob(null);
    setVideoUrl(null);
    setComposition(null);
    setGenProgress(0);

    if (videoUrl) { URL.revokeObjectURL(videoUrl); setVideoUrl(null); }
    if (audioUrl) {
      try { new URL(audioUrl); URL.revokeObjectURL(audioUrl); } catch { /* not blob */ }
      setAudioUrl(null);
    }

    try {
      const prompt = getPrompt();

      let realAudioUrl = null;

      if (engine === 'muse' && MuseService.isConfigured()) {
        setGenStage('credits');
        setGenProgress(0.05);

        let currentCredits = museCredits;
        if (currentCredits === null) {
          try {
            const user = await MuseService.getUser();
            currentCredits = user?.memberInfo?.credit ?? user?.credit ?? 0;
            setMuseCredits(currentCredits);
          } catch {
            currentCredits = 0;
          }
        }
        if (currentCredits < 14) {
          throw new Error(`Muse credits insufficient: ${currentCredits} available, 14 required. Please use Preview mode or add credits.`);
        }

        setGenStage('generating');
        setGenProgress(0.1);
        const museStyle = MUSE_STYLE_MAP[genre] || '';
        const museParams = {
          mode: lyricsInput.trim() ? 'master' : 'quick',
          prompt: lyricsInput.trim() ? undefined : prompt,
          ...(lyricsInput.trim() ? { lyrics: lyricsInput.trim() } : {}),
          ...(museStyle ? { style: museStyle } : {}),
          title: prompt.slice(0, 30) || `${genre} MV Song`,
          vocal: '',
          instrumental: 0,
          languageId: 1001,
        };

        const genResult = await MuseService.generateSong(museParams);
        const taskId = genResult?.taskId || genResult?.workId;
        if (!taskId) throw new Error('Muse did not return a taskId');
        setMuseTaskId(taskId);
        setGenProgress(0.25);

        const finalTask = await MuseService.pollUntilDone(taskId, {
          intervalMs: 6000,
          timeoutMs: 300000,
          onPoll: () => { },
        });

        realAudioUrl = finalTask?.audioUrl || finalTask?.data?.audioUrl;
        if (!realAudioUrl) {
          throw new Error(finalTask?.msg || 'Muse generation produced no audio');
        }
        setGenProgress(0.45);

      } else if (engine === 'suno' && SunoService.isConfigured()) {
        setGenStage('generating');
        setGenProgress(0.1);

        const styleTag = MUSIC_STYLES[genre]?.sunoTags || genre;
        const result = await SunoService.generateMusic(prompt, styleTag, duration, false, false);

        if (!result.success || !result.serialNos?.length) {
          throw new Error('Suno generation failed');
        }

        let taskResult;
        for (let attempt = 0; attempt < 10; attempt++) {
          taskResult = await SunoService.queryTaskStatus(result.serialNos[0], false);
          if (taskResult.status === 'success' || taskResult.status === 'failed') break;
          setGenProgress(0.1 + (attempt / 10) * 0.3);
          await new Promise(r => setTimeout(r, 3000));
        }

        if (taskResult.status === 'success' && taskResult.audioUrl) {
          realAudioUrl = taskResult.audioUrl;
        } else {
          throw new Error('Suno generation failed or timed out');
        }
        setGenProgress(0.45);

      } else if (engine === 'melo' && MeloService.isConfigured()) {
        setGenStage('generating');
        setGenProgress(0.1);

        const meloParams = {
          prompt,
          ...(lyricsInput.trim() ? { lyrics: lyricsInput.trim() } : {}),
          genre,
          style,
          duration,
        };

        const genResult = await MeloService.generateSong(meloParams);
        const taskId = genResult?.taskId || genResult?.id;
        if (!taskId) throw new Error('Melo did not return a taskId');

        setGenProgress(0.25);
        const finalTask = await MeloService.pollUntilDone(taskId, {
          intervalMs: 5000,
          timeoutMs: 300000,
        });

        realAudioUrl = finalTask?.audioUrl || finalTask?.data?.audioUrl || finalTask?.data?.url;
        if (!realAudioUrl) {
          throw new Error(finalTask?.error || finalTask?.msg || 'Melo generation produced no audio');
        }
        setGenProgress(0.45);

      } else {
        setGenStage('composing');
        setGenProgress(0.1);
        const comp = composeMusic({
          prompt,
          style: genre,
          theme: style || 'love',
          duration: Math.min(duration, 120),
          bpm: 120,
        });
        setComposition(comp);
        setGenProgress(0.3);

        setGenStage('audio');
        setGenProgress(0.4);
        const wavBlob = await compositionToWavBlob(comp);
        const audUrl = URL.createObjectURL(wavBlob);
        setAudioUrl(audUrl);
        realAudioUrl = audUrl;
        setGenProgress(0.55);
      }

      setGenStage('timeline');
      if (genProgress < 0.55) setGenProgress(0.55);
      else setGenProgress(Math.max(genProgress, 0.5));

      let mvData;
      if (isMobileEnvironment()) {
        mvData = generateMV({ genre, duration, style, colorPalette, effects: selectedEffects });
      } else {
        try {
          const data = await api.generateMV({ genre, duration, style, colorPalette, effects: selectedEffects });
          if (data?.success) {
            mvData = data.data;
          } else {
            mvData = generateMV({ genre, duration, style, colorPalette, effects: selectedEffects });
          }
        } catch {
          mvData = generateMV({ genre, duration, style, colorPalette, effects: selectedEffects });
        }
      }
      setResult(mvData);
      setGenProgress(0.6);

      setGenStage('video');
      setGenProgress(0.65);

      const videoDuration = mvData.timeline.length > 0
        ? mvData.timeline[mvData.timeline.length - 1].endTime
        : Math.min(duration, 60);

      const videoBlobResult = await generateMVVideo({
        audioUrl: realAudioUrl,
        timeline: mvData.timeline,
        colorPalette: mvData.colorPalette || colorPalette,
        effects: mvData.effects || selectedEffects,
        lyrics: lyricsInput.trim() || pendingLyrics || '',
        duration: videoDuration,
        width: 1280,
        height: 720,
        fps: 30,
        onProgress: (p) => {
          setGenProgress(0.65 + p * 0.3);
        },
      });

      setVideoBlob(videoBlobResult);
      const vidUrl = URL.createObjectURL(videoBlobResult);
      setVideoUrl(vidUrl);
      if (!audioUrl) setAudioUrl(realAudioUrl);
      setGenProgress(1);
      setGenStage('complete');

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => { });
        }
      }, 300);

      addToHistory({
        type: 'mv',
        genre,
        duration: videoDuration,
        style,
        colorPalette: mvData.colorPalette || colorPalette,
        effects: selectedEffects,
        result: mvData,
        videoUrl: vidUrl,
        audioUrl: realAudioUrl,
        composition,
        engine,
        provider: engine === 'muse' ? 'muse' : engine === 'suno' ? 'suno' : engine === 'melo' ? 'melo' : 'tonejs',
      });

      showToast('MV generated successfully!', 'success');
    } catch (err) {
      console.error('MV generation failed:', err);
      setError(err.message || 'MV generation failed');
      setGenStage('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!videoBlob) return;
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${genre}_mv_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleDownloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${genre}_audio_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const styleOptions = [
    { value: 'modern', label: t('mv.modern') },
    { value: 'cinematic', label: t('mv.cinematic') },
    { value: 'artistic', label: t('mv.artistic') },
    { value: 'minimalist', label: t('mv.minimalist') },
  ];

  const paletteOptions = [
    { value: 'purple_pink_gradient', label: t('mv.purple_pink_gradient') },
    { value: 'red_black_contrast', label: t('mv.red_black_contrast') },
    { value: 'gold_red_jade', label: t('mv.gold_red_jade') },
    { value: 'neon_cyber', label: t('mv.neon_cyber') },
    { value: 'urban_gold', label: t('mv.urban_gold') },
    { value: 'soft_pastel', label: t('mv.soft_pastel') },
  ];

  const getStageLabel = () => {
    switch (genStage) {
      case 'credits': return t('mv.credits_stage');
      case 'generating': return t('mv.generating_stage');
      case 'composing': return t('mv.composing_stage');
      case 'timeline': return t('mv.timeline_stage');
      case 'audio': return t('mv.audio_stage');
      case 'video': return t('mv.record_stage');
      case 'complete': return t('mv.complete_stage');
      default: return '';
    }
  };

  const museInsufficient = engine === 'muse' && museCredits !== null && museCredits < 14;

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in pb-8">
      {/* Header */}
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">{t('mv.mv_video_generator')}</h1>
              <p className="text-[10px] md:text-xs text-gray-400">{t('mv.description')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs md:text-sm text-gray-300"
          >
            <History className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {t('mv.history')}
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mt-3 p-1 bg-white/5 rounded-lg">
          <button
            onClick={() => setMode('basic')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${mode === 'basic'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <Music className="w-3.5 h-3.5" />
            {t('mv.mode_basic')}
          </button>
          <button
            onClick={() => setMode('pro')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${mode === 'pro'
              ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
              : 'text-gray-400 hover:text-white'
              }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            {t('mv.mode_pro')}
          </button>
        </div>
      </div>

      {mode === 'basic' && (
        <>
          <div className="gradient-border p-4 md:p-5 space-y-4">
            <MVEngineSelector
              engine={engine}
              museCredits={museCredits}
              museAvailable={museAvailable}
              sunoAvailable={sunoAvailable}
              meloAvailable={meloAvailable}
              onEngineChange={setEngine}
              t={t}
            />

            <MVControls
              lyricsInput={lyricsInput}
              onLyricsChange={setLyricsInput}
              genre={genre}
              genres={genres}
              onGenreChange={setGenre}
              style={style}
              styles={styleOptions}
              onStyleChange={setStyle}
              isGenerating={isGenerating}
              genProgress={genProgress}
              genStage={genStage}
              onGenerate={handleGenerate}
              t={t}
              ts={ts}
              engine={engine}
              museCredits={museCredits}
            />
          </div>

          <div className="gradient-border p-4 md:p-5">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs font-medium text-gray-300 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {t('mv.advanced_settings')}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-300 mb-2 block">{t('mv.duration_seconds')}</label>
                  <input
                    type="range"
                    min="30"
                    max="180"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                    <span>30s</span>
                    <span className="text-violet-300 font-semibold">{duration}s</span>
                    <span>180s</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300 mb-2 block">{t('mv.color_palette_label')}</label>
                  <select
                    value={colorPalette}
                    onChange={(e) => setColorPalette(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  >
                    {paletteOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300 mb-2 block">{t('layers.effects')}</label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {MV_EFFECTS.map(effect => (
                      <button
                        key={effect.id}
                        onClick={() => {
                          if (selectedEffects.includes(effect.id)) {
                            setSelectedEffects(selectedEffects.filter(e => e !== effect.id));
                          } else {
                            setSelectedEffects([...selectedEffects, effect.id]);
                          }
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedEffects.includes(effect.id)
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                          }`}
                      >
                        {t(effect.name)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="gradient-border p-4 md:p-6">
              <div className="text-center py-8 md:py-12">
                <AlertCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-red-400" />
                <div className="text-sm md:text-base text-red-300 mb-2">{error}</div>
                <button
                  onClick={handleGenerate}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-all"
                >
                  {t('common.retry')}
                </button>
              </div>
            </div>
          )}

          {videoUrl && (
            <MVVideoPlayer
              videoUrl={videoUrl}
              videoBlob={videoBlob}
              audioUrl={audioUrl}
              result={result}
              duration={duration}
              videoRef={videoRef}
              onDownloadVideo={handleDownloadVideo}
              onDownloadAudio={handleDownloadAudio}
              t={t}
              colorPalette={colorPalette}
            />
          )}

          {result && (
            <MVTimelinePreview
              result={result}
              onCopy={copyToClipboard}
              t={t}
            />
          )}

          {!result && !isGenerating && !error && (
            <div className="gradient-border p-4 md:p-6">
              <div className="text-center py-12 md:py-20 text-gray-500">
                <Video className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-30" />
                <div className="text-xs md:text-sm">Configure your MV settings and click Generate</div>
                <div className="text-[10px] text-gray-600 mt-2">Creates real music video with actual songs + animated visuals</div>
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="gradient-border p-4 md:p-6">
              <div className="text-center py-8 md:py-12">
                <Loader className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-3 md:mb-4 text-cyan-400 animate-spin" />
                <div className="text-sm font-medium text-white mb-2">{getStageLabel()}</div>
                <div className="w-full max-w-xs mx-auto h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${genProgress * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-500 mt-2">{Math.round(genProgress * 100)}%</div>
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'pro' && (
        <>
          {/* Scene Templates */}
          <div className="gradient-border p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">{t('mv.scene_templates')}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SCENE_TEMPLATES.map(template => {
                const IconComp = template.icon;
                const isSelected = selectedTemplate === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(isSelected ? null : template.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium transition-all text-left ${isSelected
                      ? 'bg-gradient-to-r from-violet-500/30 to-pink-500/30 text-white border border-violet-500/50'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                      }`}
                  >
                    <IconComp className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-violet-300' : ''}`} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{template.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Prompt Builder */}
          <div className="gradient-border p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">{t('mv.ai_prompt_builder')}</h3>
              </div>
              <button
                onClick={() => handleCopyPrompt('all')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-medium hover:opacity-90 transition-all"
              >
                {copiedPrompt === 'all' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {t('mv.copy_prompt')}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-300 mb-1.5 block">{t('mv.genre_label')}</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                >
                  {genres.map(g => (
                    <option key={g} value={g}>{ts(`lyrics_styles.${g}`) || ts(`styles.${g}`) || g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 mb-1.5 block">{t('mv.style_label')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {styleOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setStyle(opt.value)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${style === opt.value
                        ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 mb-1.5 block">{t('mv.lyrics_label')}</label>
                <textarea
                  value={lyricsInput}
                  onChange={(e) => setLyricsInput(e.target.value)}
                  placeholder={t('mv.lyrics_placeholder')}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 mb-1.5 block">{t('mv.custom_prompt')}</label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={t('mv.custom_prompt_placeholder')}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>

              {/* Generated Prompt Preview */}
              <div className="bg-black/30 rounded-lg p-3 border border-violet-500/20">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-violet-300 font-medium">{t('mv.generated_prompt')}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-mono break-words">
                  {customPrompt.trim() || generateAIPrompt()}
                </p>
              </div>
            </div>
          </div>

          {/* Professional AI Video Tools */}
          <div className="gradient-border p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Film className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-semibold text-white">{t('mv.pro_tools_title')}</h3>
            </div>
            <p className="text-[11px] text-gray-500 mb-4">{t('mv.pro_tools_desc')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AI_VIDEO_TOOLS.map(tool => {
                const IconComp = tool.icon;
                return (
                  <div key={tool.id} className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                          <IconComp className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">{tool.name}</h4>
                          <p className="text-[10px] text-gray-500">{tool.pricing}</p>
                        </div>
                      </div>
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-[11px] text-gray-400 mb-2">{tool.description}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {tool.features.map(f => (
                        <span key={f} className="px-1.5 py-0.5 rounded bg-violet-500/10 text-[9px] text-violet-300 border border-violet-500/20">
                          {f}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      <span className="text-gray-400">{t('mv.best_for')}:</span> {tool.bestFor}
                    </p>
                    <button
                      onClick={() => handleCopyPrompt(tool.id)}
                      className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 text-[11px] font-medium text-violet-300 hover:from-violet-500/30 hover:to-pink-500/30 transition-all"
                    >
                      {copiedPrompt === tool.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {t('mv.copy_prompt_for')} {tool.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow Guide */}
          <div className="gradient-border p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">{t('mv.workflow_title')}</h3>
            </div>
            <div className="space-y-3">
              {[
                { step: 1, title: t('mv.workflow_1_title'), desc: t('mv.workflow_1_desc') },
                { step: 2, title: t('mv.workflow_2_title'), desc: t('mv.workflow_2_desc') },
                { step: 3, title: t('mv.workflow_3_title'), desc: t('mv.workflow_3_desc') },
                { step: 4, title: t('mv.workflow_4_title'), desc: t('mv.workflow_4_desc') },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-white">{item.title}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        filterType="mv"
      />
    </div>
  );
}

export default MVPage;