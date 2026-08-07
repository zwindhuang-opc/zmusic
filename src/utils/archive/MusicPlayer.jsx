import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Download, Volume2, VolumeX, Loader, Music, Sparkles, Cloud, Zap } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';

function MusicPlayer({ composition, audioUrl, isGenerating, generationStage, generationProgress, onPlay, onPause, onResume, onStop, onExport }) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [waveformBars] = useState(() =>
    Array.from({ length: 64 }, (_, i) => {
      const seed = Math.sin(i * 12.9898) * 43758.5453;
      return Math.abs(seed - Math.floor(seed)) * 0.8 + 0.2;
    })
  );

  const audioRef = useRef(null);
  const animationRef = useRef(null);
  const tonejsRef = useRef(null);
  const isToneJS = !audioUrl;

  useEffect(() => {
    if (audioRef.current && !isToneJS) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, isToneJS]);

  useEffect(() => {
    if (isToneJS) return;
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [isToneJS]);

  useEffect(() => {
    if (isToneJS && isPlaying) {
      const animate = () => {
        if (tonejsRef.current?.getPlaybackTime) {
          setCurrentTime(tonejsRef.current.getPlaybackTime());
        }
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [isPlaying, isToneJS]);

  const handlePlay = async () => {
    if (isToneJS) {
      const result = await onPlay?.();
      if (result) {
        tonejsRef.current = result;
        setIsPlaying(true);
      }
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (isToneJS) {
      onPause?.();
      setIsPlaying(false);
    } else {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const handleResume = () => {
    if (isToneJS) {
      onResume?.();
      setIsPlaying(true);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    if (isToneJS) return;
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  };

  const togglePlay = () => {
    if (isPlaying) handlePause();
    else {
      if (isToneJS) handlePlay();
      else handleResume();
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalDuration = composition?.duration || audioRef.current?.duration || 60;
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const stageLabels = {
    composing: t('music.composing_score') || 'Composing score...',
    rendering: t('music.rendering_audio') || 'Rendering audio...',
    finalizing: t('music.processing') || 'Finalizing...',
    complete: 'Ready!'
  };

  return (
    <div className="gradient-border p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            {isToneJS ? <Sparkles className="w-4 h-4 text-white" /> : <Cloud className="w-4 h-4 text-white" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              {composition?.title || 'Generated Music'}
              {isToneJS ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                  <Zap className="w-2 h-2 inline mr-0.5" /> {t('music.procedural_tag') || 'Procedural'}
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                  <Cloud className="w-2 h-2 inline mr-0.5" /> {t('music.ai_generated_tag') || 'AI-Generated'}
                </span>
              )}
            </h3>
            <p className="text-[10px] text-gray-400">
              {composition?.key || 'C'} {composition?.scale || 'major'} · {composition?.tempo || 120} BPM · {composition?.timeSignature || '4/4'}
            </p>
          </div>
        </div>
        {!isGenerating && audioUrl && audioBlob && (
          <button
            onClick={onExport}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-gray-300"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isGenerating ? (
        <div className="py-8 text-center space-y-3">
          <Loader className="w-8 h-8 mx-auto text-violet-400 animate-spin" />
          <div className="text-xs text-gray-300">
            {stageLabels[generationStage] || 'Processing...'}
          </div>
          {generationProgress > 0 && (
            <div className="w-full max-w-xs mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-300"
                style={{ width: `${generationProgress * 100}%` }}
              />
            </div>
          )}
          <div className="text-[10px] text-gray-500">
            {isToneJS ? (t('music.procedural_description') || 'Generating procedural audio...') : (t('music.hybrid_description') || 'Rendering with AI...')}
          </div>
        </div>
      ) : (
        <>
          <div
            className="relative h-20 bg-black/30 rounded-xl overflow-hidden cursor-pointer group"
            onClick={handleSeek}
          >
            <div className="absolute inset-0 flex items-center justify-center gap-[2px] px-2">
              {waveformBars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full transition-all duration-100"
                  style={{
                    height: `${h * 70}%`,
                    background: i / waveformBars.length < progress / 100
                      ? 'linear-gradient(to top, #8b5cf6, #ec4899)'
                      : 'rgba(255,255,255,0.15)',
                    minWidth: '2px'
                  }}
                />
              ))}
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/80 transition-all duration-100"
              style={{ left: `${progress}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-mono">{formatTime(currentTime)}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (isToneJS) onStop?.();
                  else if (audioRef.current) audioRef.current.currentTime = 0;
                  setCurrentTime(0);
                  setIsPlaying(false);
                }}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 active:scale-95 transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>

              <button
                onClick={() => {
                  if (isToneJS) onStop?.();
                  else if (audioRef.current) {
                    audioRef.current.currentTime = totalDuration;
                    audioRef.current.pause();
                  }
                  setCurrentTime(totalDuration);
                  setIsPlaying(false);
                }}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 transition-colors"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-14 h-1 accent-violet-500"
              />
            </div>
          </div>

          <audio ref={audioRef} src={audioUrl} className="hidden" preload="auto" />

          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-white/5">
            <span className="flex items-center gap-1">
              <Music className="w-3 h-3" />
              {composition?.sections?.length || 0} sections
            </span>
            <span className="flex items-center gap-1">
              {composition?.sections?.map(s => s.instruments).flat().filter((v, i, a) => a.indexOf(v) === i).length || 0} instruments
            </span>
            <span className="font-mono">{formatTime(totalDuration)}</span>
          </div>
        </>
      )}
    </div>
  );
}

export default MusicPlayer;
