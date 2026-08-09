import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const ICON_MAP = {
  Users, Cloud, Sun, Moon, Sparkles, Film, Brain, Palette, Clapperboard, Camera, Zap, Wand2, Music, Video,
};

function resolveIcon(name) {
  if (!name) return Wand2;
  return ICON_MAP[name] || Wand2;
}

const FALLBACK_GENRES = ['pop', 'rock', 'electronic', 'hip_hop', 'ballad', 'chinese_traditional', 'jazz', 'classical', 'rnb', 'country', 'love_song', 'chinese_classical', 'concert', 'modern', 'cinematic', 'retro', 'anime', 'gothic_rock'];

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

  const getGenreLabel = useCallback((key) => {
    const g = contentData.genres.find(x => x.key === key);
    return g ? g.label_zh : key;
  }, [contentData.genres]);

  const getGenreLabelEn = useCallback((key) => {
    const g = contentData.genres.find(x => x.key === key);
    return g ? g.label_en : key;
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
      label: t('scenes.' + s.key) || s.label_zh,
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
      description: t('tools.' + tool.key) || tool.description_en,
      description_zh: tool.description_zh,
      features: tool.features || [],
      pricing: tool.pricing,
      bestFor: tool.best_for_en,
    }))
    : [];

  const effectList = contentData.effects.length > 0
    ? contentData.effects.map(e => ({
      id: e.key,
      name: t('effects.' + e.key) || e.label_zh,
    }))
    : [];

  const paletteList = contentData.stylePalettes.length > 0
    ? contentData.stylePalettes.map(p => ({
      id: p.key,
      zh: p.label_zh,
      en: p.label_en,
      colors: p.colors ? JSON.parse(p.colors) : [],
    }))
    : [];

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
      showToast('Timeline copied to clipboard');
    } catch { }
  };

  const generateWithMuse = async (params) => {
    try {
      setGenStage('Initializing Muse AI...');
      const taskId = await MuseService.generateMusic(params);
      setMuseTaskId(taskId);

      setGenStage('Waiting for Muse AI...');
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
      throw new Error('Muse AI returned no audio');
    } catch (e) {
      throw e;
    }
  };

  const generateWithSuno = async (params) => {
    const prompt = params.prompt || '';
    const style = params.style || '';

    setGenStage('Initializing Suno AI...');
    // SunoService.generateMusic returns the full response {success, serialNos};
    // extract the first serial number as the task id for polling.
    const res = await SunoService.generateMusic({ prompt, style, title: params.title });
    const taskId = res?.serialNos?.[0];
    if (!taskId) throw new Error('Suno AI returned no task id');

    setGenStage('Waiting for Suno AI...');
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
    throw new Error('Failed to generate music');
  };

  const generateWithMelo = async (params) => {
    setGenStage('Initializing Melo AI...');
    const taskId = await MeloService.generateMusic(params);
    setGenStage('Waiting for Melo AI...');
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
    throw new Error('Melo AI returned no audio');
  };

  const generateLocally = async (params) => {
    console.log('[MVPage] generateLocally start:', { genre: params.genre, duration: params.duration, style: params.style });
    setGenStage('Composing music locally...');
    const composition = composeMusic({
      genre: params.genre,
      style: params.style,
      duration: params.duration,
      lyrics: params.lyrics,
      scene: params.scene,
    });

    setGenStage('Rendering audio...');
    const blob = await compositionToWavBlob(composition);
    const audioUrl = URL.createObjectURL(blob);
    console.log('[MVPage] Audio rendered:', { size: blob.size, url: audioUrl });

    setGenProgress(55);
    setGenStage('Composing video...');

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

  const handleGenerate = async () => {
    if (isGenerating) return;
    setError(null);
    setResult(null);
    setAudioUrl(null);
    setVideoUrl(null);
    setVideoBlob(null);

    const prompt = pendingLyrics?.text || '';
    const title = pendingLyrics?.title || `${genre} MV`;

    const styleMap = contentData.musicStyles.find(s => s.genre_key === genre);
    const sunoStyle = styleMap ? styleMap.style_suno : '';
    const museStyle = styleMap ? styleMap.style_muse : '';

    const params = {
      prompt,
      title,
      genre,
      style: sunoStyle || museStyle || style,
      museStyle,
      duration,
      lyrics: prompt,
      scene: style,
      colorPalette,
      effects: selectedEffects,
    };

    if (engine === 'muse' && !museAvailable) {
      setError(t('muse.notConfigured'));
      return;
    }
    if (engine === 'suno' && !sunoAvailable) {
      setError(t('suno.notConfigured'));
      return;
    }
    if (engine === 'melo' && !meloAvailable) {
      setError(t('melo.notConfigured'));
      return;
    }

    setIsGenerating(true);
    setGenProgress(5);
    setGenStage('Starting...');

    try {
      let musicResult;

      console.log('[MVPage] Starting generation:', { engine, genre, duration, hasPrompt: !!prompt });

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
      setGenStage('Composing video...');

      let finalVideoBlob = musicResult.videoBlob;
      let finalVideoUrl = musicResult.videoUrl;

      if (!finalVideoBlob && engine !== 'local') {
        console.log('[MVPage] Composing video from AI audio:', { engine, audioUrl: musicResult.url });
        const mvData = generateMV({ genre, duration });
        setTimelineResult(mvData);
        const videoBlob = await generateMVVideo({
          audioUrl: musicResult.url,
          timeline: mvData.timeline,
          colorPalette: colorPalette || mvData.colorPalette,
          effects: selectedEffects,
          lyrics: params.prompt,
          duration,
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
        genre,
        style,
        timestamp: Date.now(),
      };

      setResult(finalResult);
      setAudioUrl(musicResult.url);
      setVideoUrl(finalVideoUrl);
      setVideoBlob(finalVideoBlob);

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
          genre,
          style,
          timestamp: Date.now(),
          source: 'mv',
        });
      } catch { }

      setGenProgress(100);
      setGenStage('Complete!');
    } catch (e) {
      setError(e.message || t('generation.failed'));
    } finally {
      setIsGenerating(false);
    }
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

  const shareUrl = result ? `${window.location.origin}/share/${result.id}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 text-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{t('mv.title')}</h1>
              <p className="text-slate-500 text-sm">{t('mv.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="btn-ghost flex items-center gap-2"
          >
            <History className="w-5 h-5" />
            <span>{t('mv.history')}</span>
          </button>
        </div>

        <div className="mb-6 p-4 bg-white/70 rounded-xl border border-blue-200/60 backdrop-blur-sm flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <span className="text-sm text-slate-600">{t('mv.aide_text')}</span>
        </div>

        <MVEngineSelector
          engine={engine}
          onEngineChange={setEngine}
          museAvailable={museAvailable}
          sunoAvailable={sunoAvailable}
          meloAvailable={meloAvailable}
          museCredits={museCredits}
          t={t}
        />

        <MVControls
          mode={mode}
          onModeChange={setMode}
          genres={genres}
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
          <div className="mt-6 p-6 bg-white/70 rounded-xl border border-blue-200/60 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <Loader className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="font-semibold text-slate-700">{genStage}</span>
            </div>
            <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                style={{ width: `${genProgress}%` }}
              />
            </div>
            <p className="text-center text-slate-500 mt-2">{genProgress}%</p>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
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
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
              <Wand2 className="w-5 h-5 text-blue-500" />
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
                    className="p-4 bg-white/70 border border-blue-200/60 rounded-xl hover:bg-white hover:border-blue-400/60 hover:shadow-md transition-all group backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate text-slate-800">{tool.name}</h3>
                          <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2">{tool.description}</p>
                        {tool.features?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tool.features.slice(0, 3).map((f, i) => (
                              <span key={i} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded">
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-slate-400 mt-2">{tool.pricing} · {tool.bestFor}</p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <HistoryPanel
          show={showHistory}
          onClose={() => setShowHistory(false)}
          source="mv"
          onSelect={(item) => {
            if (item.audioUrl) setAudioUrl(item.audioUrl);
            if (item.videoUrl) setVideoUrl(item.videoUrl);
            if (item.videoBlob) setVideoBlob(item.videoBlob);
            setResult(item);
          }}
        />
      </div>
    </div>
  );
}

export default MVPage;