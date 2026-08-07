import React, { useState, useEffect, useRef } from 'react';
import { Video, History, AlertCircle, Settings, ChevronDown, Loader } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import api, { isMobileEnvironment } from '../services/api.client.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { generateMV } from '../utils/mvEngine.js';
import { composeMusic } from '../utils/musicComposer.js';
import { compositionToWavBlob } from '../utils/audioEngine.js';
import { generateMVVideo } from '../utils/mvComposer.js';
import MuseService from '../services/muse.service.js';
import SunoService from '../services/suno.service.js';
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

function MVPage() {
  const { t, ts } = useTranslation();
  const { addToHistory, copyToClipboard, pendingLyrics, showToast } = useGeneration();

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

  const videoRef = useRef(null);

  useEffect(() => {
    if (!isMobileEnvironment()) {
      loadGenres();
    }
    if (engine === 'muse' && MuseService.isConfigured() && museCredits === null) {
      loadMuseCredits();
    }
  }, [engine]);

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
        provider: engine === 'muse' ? 'muse' : engine === 'suno' ? 'suno' : 'tonejs',
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
      case 'credits': return 'Checking Muse credits...';
      case 'generating': return 'Generating real song with AI...';
      case 'composing': return 'Composing preview music...';
      case 'timeline': return 'Building MV timeline...';
      case 'audio': return 'Rendering audio...';
      case 'video': return 'Recording MV video...';
      case 'complete': return 'Complete!';
      default: return '';
    }
  };

  const museAvailable = MuseService.isConfigured();
  const sunoAvailable = SunoService.isConfigured();
  const museInsufficient = engine === 'muse' && museCredits !== null && museCredits < 14;

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in pb-8">
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">{t('mv.mv_video_generator')}</h1>
              <p className="text-[10px] md:text-xs text-gray-400">Generate real music videos with actual songs + animated visuals</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs md:text-sm text-gray-300"
          >
            <History className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {t('lyrics.history')}
          </button>
        </div>
      </div>

      <div className="gradient-border p-4 md:p-5 space-y-4">
        <MVEngineSelector
          engine={engine}
          museCredits={museCredits}
          museAvailable={museAvailable}
          sunoAvailable={sunoAvailable}
          onEngineChange={setEngine}
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

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        filterType="mv"
      />
    </div>
  );
}

export default MVPage;
