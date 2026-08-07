import React, { useState, useEffect, useRef } from 'react';
import { Music, Sparkles, Loader, History, Play, Pause, SkipBack, SkipForward, Zap, Wand2 } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import HistoryPanel from '../components/HistoryPanel.jsx';
import { MUSIC_STYLES, MUSIC_THEMES } from '../config/musicStyles.js';
import { composeMusic } from '../utils/musicComposer.js';
import { playComposition, pausePlayback, resumePlayback, stopAll, getPlaybackTime } from '../utils/audioEngine.js';

const INSPIRATION_CHIPS = [
  '追逐梦想，永不放弃',
  '夏日回忆，海边漫步',
  '都市夜晚，霓虹闪烁',
  '暗恋心事，心跳加速',
  '怀旧时光，童年记忆',
  '自由奔跑，青春飞扬',
  '安静夜晚，思绪万千',
  '远方的诗，故乡的云'
];

function MusicPage() {
  const { t, ts } = useTranslation();
  const { addToHistory, pendingLyrics, getHistoryByType } = useGeneration();

  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('quick');
  const [style, setStyle] = useState('pop');
  const [theme, setTheme] = useState('love');
  const [duration, setDuration] = useState(60);
  const [bpm, setBpm] = useState(120);

  const [composition, setComposition] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStage, setGenStage] = useState('');
  const [genProgress, setGenProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(0);

  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showWorksGallery, setShowWorksGallery] = useState(false);

  const tonejsRef = useRef(null);
  const progressTimerRef = useRef(null);

  const songHistory = getHistoryByType?.('song') || [];
  const displayedWorks = showWorksGallery ? songHistory.slice(0) : songHistory.slice(0, 2);

  useEffect(() => {
    if (pendingLyrics) setPrompt(pendingLyrics);
  }, [pendingLyrics]);

  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = setInterval(() => {
        setPlayTime(getPlaybackTime());
      }, 100);
    } else {
      clearInterval(progressTimerRef.current);
    }
    return () => clearInterval(progressTimerRef.current);
  }, [isPlaying]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(t('music.please_enter_prompt'));
      return;
    }

    setError('');
    setIsGenerating(true);
    setComposition(null);
    setGenStage('composing');
    setGenProgress(0.1);
    stopAll();

    try {
      const comp = composeMusic({ prompt, style, theme, duration, bpm });
      setComposition(comp);
      setGenProgress(0.3);
      setGenStage('generating');

      const result = await playComposition(
        comp,
        (progress) => setGenProgress(0.3 + progress * 0.6),
        () => {
          setIsPlaying(false);
          setGenStage('complete');
          setGenProgress(1);
        }
      );
      tonejsRef.current = result;
      setGenStage('complete');
      setGenProgress(1);
      setIsPlaying(true);

      addToHistory({
        type: 'song',
        method: 'tonejs_procedural',
        theme,
        style,
        genre: style,
        bpm,
        duration: comp.duration,
        provider: 'tonejs',
        prompt,
        result: { composition: comp }
      });
    } catch (err) {
      console.error('Generation failed:', err);
      setError(`${t('common.error')}: ${err.message}`);
      setIsGenerating(false);
    }
  };

  const handlePlay = async () => {
    if (!composition) return;
    const currentTime = getPlaybackTime();
    if (currentTime > 0 && !isPlaying) {
      resumePlayback();
      setIsPlaying(true);
    } else {
      await playComposition(composition, () => { }, () => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    pausePlayback();
    setIsPlaying(false);
  };

  const handleStop = () => {
    stopAll();
    setIsPlaying(false);
    setPlayTime(0);
  };

  const handleSkipBack = () => {
    stopAll();
    setIsPlaying(false);
    setPlayTime(0);
  };

  const togglePlay = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalDuration = composition?.duration || 60;
  const progressPercent = totalDuration > 0 ? (playTime / totalDuration) * 100 : 0;

  const generatePlaceholder = () => {
    const idx = Math.floor(Math.random() * INSPIRATION_CHIPS.length);
    setPrompt(INSPIRATION_CHIPS[idx]);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in pb-32">
      {/* Header */}
      <div className="gradient-border p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-white">{t('music.ai_music_generation')}</h1>
              <p className="text-[10px] text-gray-400">{t('music.powered_by')} · Tone.js</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-gray-300"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t('lyrics.history')}</span>
          </button>
        </div>
      </div>

      {/* Main Prompt Area */}
      <div className="gradient-border p-4 md:p-6 space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
            {t('music.tagline')}
          </h2>
        </div>

        {/* Prompt Input */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('music.prompt_placeholder')}
            className="w-full h-20 md:h-24 bg-white/5 border border-white/10 rounded-xl p-3.5 pr-24 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
          />
          <button
            onClick={generatePlaceholder}
            className="absolute bottom-2.5 right-2.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 transition-colors"
            title="Refresh inspiration"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Inspiration Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">💡 Inspiration</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {INSPIRATION_CHIPS.map((chip, i) => (
              <button
                key={i}
                onClick={() => setPrompt(chip)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${prompt === chip
                  ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md shadow-violet-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-violet-500/10 hover:text-violet-300 border border-white/5'
                  }`}
              >
                {chip.length > 8 ? chip.slice(0, 8) + '...' : chip}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('quick')}
            className={`p-3 rounded-xl text-left transition-all ${mode === 'quick'
              ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 border-2 border-violet-500/40'
              : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className={`w-3.5 h-3.5 ${mode === 'quick' ? 'text-violet-400' : 'text-gray-500'}`} />
              <span className={`text-xs font-semibold ${mode === 'quick' ? 'text-white' : 'text-gray-400'}`}>
                {t('music.quick_mode')}
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              {t('music.quick_mode_desc')}
            </p>
          </button>
          <button
            onClick={() => setMode('master')}
            className={`p-3 rounded-xl text-left transition-all ${mode === 'master'
              ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 border-2 border-violet-500/40'
              : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Wand2 className={`w-3.5 h-3.5 ${mode === 'master' ? 'text-violet-400' : 'text-gray-500'}`} />
              <span className={`text-xs font-semibold ${mode === 'master' ? 'text-white' : 'text-gray-400'}`}>
                {t('music.master_mode')}
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              {t('music.master_mode_desc')}
            </p>
          </button>
        </div>

        {/* Master Mode Controls */}
        {mode === 'master' && (
          <div className="space-y-3 p-3 rounded-xl bg-black/20 border border-white/5">
            <div>
              <label className="text-[10px] font-medium text-gray-400 mb-1.5 block">🎨 {t('music.music_style')}</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(MUSIC_STYLES).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${style === s
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                      }`}
                  >
                    {ts(`lyrics_styles.${s}`) || ts(`styles.${s}`) || s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-gray-400 mb-1.5 block">🎭 {t('music.theme')}</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(MUSIC_THEMES).map((th) => (
                  <button
                    key={th}
                    onClick={() => setTheme(th)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${theme === th
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                      }`}
                  >
                    {MUSIC_THEMES[th]?.name || th}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">{t('music.duration_s')}</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                  min="10" max="300"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">{t('music.bpm')}</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                  min="60" max="200"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-purple-500/30 active:scale-[0.98] transition-transform"
        >
          {isGenerating ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              {genStage === 'composing' ? t('music.composing_score') : genStage === 'generating' ? t('music.generating_audio') : t('music.processing')}
            </>
          ) : (
            <>
              <Music className="w-4 h-4" />
              {t('music.generate_song')}
            </>
          )}
        </button>

        {isGenerating && genProgress > 0 && (
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-300"
              style={{ width: `${genProgress * 100}%` }}
            />
          </div>
        )}

        <p className="text-[10px] text-gray-500 text-center">
          {t('music.instant_procedural')}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Works Gallery */}
      {songHistory.length > 0 && (
        <div className="gradient-border p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              📜 {t('music.works_gallery')}
            </h3>
            {songHistory.length > 2 && (
              <button
                onClick={() => setShowWorksGallery(!showWorksGallery)}
                className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
              >
                {showWorksGallery ? t('common.collapse') || '收起 ▲' : `+${songHistory.length - 2} ${t('common.more') || '更多 ▼'}`}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {displayedWorks.map((item, idx) => {
              const itemTitle = item.result?.composition?.title || item.prompt?.slice(0, 30) || 'Untitled';
              const itemStyle = item.style || item.genre || '';
              const itemDuration = item.duration ? `${item.duration}s` : '';
              return (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/30 cursor-pointer hover:border-violet-400/50 transition-colors"
                >
                  <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-violet-600/30 to-pink-600/30 mb-2 flex items-center justify-center">
                    <Music className="w-8 h-8 text-violet-400" />
                  </div>
                  <div className="text-xs font-semibold text-white truncate">{itemTitle}</div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {itemStyle && ts(`lyrics_styles.${itemStyle}`) || itemStyle} {itemDuration}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Player Bar (sticky) */}
      {(composition || isPlaying) && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="gradient-border bg-gray-900/80 backdrop-blur-md p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Music className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{composition?.title || 'Now Playing'}</div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400 font-mono">{formatTime(playTime)}</span>
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-pink-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">{formatTime(totalDuration)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={handleSkipBack}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <button
                    onClick={handleStop}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        filterType="song"
      />
    </div>
  );
}

export default MusicPage;
