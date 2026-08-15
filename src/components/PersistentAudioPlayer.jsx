import React, { useState, useMemo, useEffect } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, ChevronUp, ChevronDown, Music, X,
  ListMusic, GripVertical
} from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext.jsx';
import { useGeneration } from '../stores/generationStore.jsx';
import { useTranslation } from '../i18n/useTranslation.js';

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function PersistentAudioPlayer() {
  const {
    currentSong, playlist, isPlaying, currentTime, duration, volume,
    shuffle, repeat,
    play, pause, togglePlay, seek, enqueue, playNext, playPrev,
    toggleShuffle, toggleRepeat, setVolume, removeFromQueue,
  } = usePlayer();
  const { history } = useGeneration();
  const { t, lang } = useTranslation();
  const isZh = lang === 'zh';

  const [expanded, setExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [visualBars] = useState(() =>
    Array.from({ length: 24 }, () => 20 + Math.random() * 80)
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const songsWithAudio = useMemo(() => {
    if (!mounted) return [];
    const audios = [];
    const seen = new Set();
    const push = (h) => {
      const url = h?.audioUrl || h?.audio_url || h?.result?.audioUrl;
      if (url && !seen.has(url)) {
        seen.add(url);
        audios.push(h);
      }
    };
    playlist.forEach(push);
    history.forEach(push);
    return audios;
  }, [history, playlist, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (playlist.length === 0 && songsWithAudio.length > 0) {
      songsWithAudio.slice(0, 20).forEach(s => enqueue(s));
    }
  }, [songsWithAudio, playlist.length, enqueue, mounted]);

  if (songsWithAudio.length === 0) return null;

  const url = currentSong?.audioUrl || currentSong?.audio_url || currentSong?.result?.audioUrl || '';
  const title = currentSong?.title || currentSong?.creativeProcess?.snapshot?.title ||
    (isZh ? '未命名歌曲' : 'Untitled Song');
  const engine = (currentSong?.engine || currentSong?.creativeProcess?.engine || 'ZMusic').toString();
  const cover = currentSong?.cover_data || currentSong?.coverUrl || currentSong?.imageUrl ||
    currentSong?.creativeProcess?.imageUrl || '';

  const toggleMute = () => setVolume(volume > 0 ? 0 : 0.8);

  const labels = {
    zh: {
      now_playing: '正在播放',
      queue: '播放队列',
      playlist: '播放列表',
      next: '下一首',
      prev: '上一首',
      volume: '音量',
      shuffle: '随机',
      repeat: '循环',
      expand: '展开播放器',
      collapse: '收起',
      no_song_loaded: '未加载歌曲',
      clear_queue: '清空队列',
    },
    en: {
      now_playing: 'Now Playing',
      queue: 'Queue',
      playlist: 'Playlist',
      next: 'Next',
      prev: 'Previous',
      volume: 'Volume',
      shuffle: 'Shuffle',
      repeat: 'Repeat',
      expand: 'Expand Player',
      collapse: 'Collapse',
      no_song_loaded: 'No song loaded',
      clear_queue: 'Clear Queue',
    },
  };
  const L = labels[isZh ? 'zh' : 'en'];

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-[9998] bg-black/40 backdrop-blur-xl border-t border-white/10"
        style={{ boxShadow: '0 -4px 30px rgba(236,72,153,0.15)' }}
      >
        <div className="h-0.5 w-full bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div
          className="relative max-w-7xl mx-auto"
          onClick={(e) => {
            if (e.target.closest('button') || e.target.closest('input')) return;
            if (!expanded) setExpanded(true);
          }}
        >
          <div className="h-14 md:h-16 flex items-center gap-2 md:gap-4 px-2 md:px-4">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                {cover ? (
                  <img
                    src={cover}
                    alt=""
                    className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border border-white/10 shadow-lg"
                  />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center border border-white/10 shadow-lg">
                    <Music className="w-5 h-5 text-white/80" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] md:text-xs text-fuchsia-400 font-semibold uppercase tracking-wide truncate">
                  {L.now_playing} · {engine}
                </div>
                <div className="text-sm md:text-[15px] font-bold text-white truncate leading-tight">
                  {title}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); playPrev(); }}
                className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                title={L.prev}
              >
                <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="p-2 md:p-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-lg shadow-fuchsia-500/30 hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5" /> : <Play className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); playNext(); }}
                className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                title={L.next}
              >
                <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <div className="hidden md:flex items-center gap-3 w-64">
              <span className="text-[10px] text-gray-500 tabular-nums w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => seek(Number(e.target.value))}
                className="flex-1 accent-fuchsia-500 h-1"
              />
              <span className="text-[10px] text-gray-500 tabular-nums w-10">
                {formatTime(duration)}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 w-36">
              <button
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 accent-violet-500 h-1"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
                className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                  shuffle ? 'text-fuchsia-400 bg-fuchsia-500/15' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title={L.shuffle}
              >
                <Shuffle className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleRepeat(); }}
                className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                  repeat ? 'text-violet-400 bg-violet-500/15' : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title={L.repeat}
              >
                <Repeat className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowQueue(s => !s); }}
                className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title={L.queue}
              >
                <ListMusic className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
                className="p-1.5 md:p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                {expanded
                  ? <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  : <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4" />}
              </button>
            </div>
          </div>

          {expanded && (
            <div
              className="px-3 md:px-6 pb-5 pt-3 border-t border-white/10 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid md:grid-cols-[220px,1fr,260px] gap-4 md:gap-6 items-start">
                <div className="flex md:flex-col items-center md:items-start gap-3">
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      className="w-20 h-20 md:w-44 md:h-44 rounded-xl object-cover border border-white/10 shadow-2xl"
                    />
                  ) : (
                    <div className="w-20 h-20 md:w-44 md:h-44 rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-violet-600 flex items-center justify-center border border-white/10 shadow-2xl">
                      <Music className="w-8 h-8 md:w-16 md:h-16 text-white/80" />
                    </div>
                  )}
                  <div className="md:mt-3 min-w-0">
                    <div className="text-xs text-fuchsia-400 font-semibold">{engine}</div>
                    <div className="text-base md:text-lg font-bold text-white leading-snug line-clamp-2">{title}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-end justify-center h-16 gap-1 px-2 py-3 rounded-xl bg-black/30 border border-white/5 overflow-hidden">
                    {visualBars.map((h, i) => (
                      <div
                        key={i}
                        className={`w-1.5 rounded-t-sm bg-gradient-to-t from-fuchsia-600 via-pink-500 to-violet-400 ${isPlaying ? 'animate-pulse' : ''}`}
                        style={{
                          height: `${isPlaying ? 30 + Math.random() * 70 : h * 0.4}%`,
                          animationDelay: `${i * 40}ms`,
                          transition: 'height 0.4s ease',
                        }}
                      />
                    ))}
                  </div>

                  <div className="space-y-1">
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => seek(Number(e.target.value))}
                      className="w-full accent-fuchsia-500"
                    />
                    <div className="flex justify-between text-[11px] text-gray-500 tabular-nums px-0.5">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex justify-center md:hidden items-center gap-2 mt-3">
                    <button
                      onClick={() => playPrev()}
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => togglePlay()}
                      className="p-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-lg shadow-fuchsia-500/30"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </button>
                    <button
                      onClick={() => playNext()}
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>

                  {currentSong?.lyrics || currentSong?.result?.lyricsText || currentSong?.creativeProcess?.snapshot?.lyrics ? (
                    <div className="h-24 overflow-y-auto rounded-xl bg-black/40 border border-white/5 p-3 text-[11px] md:text-xs text-gray-400 leading-relaxed space-y-1">
                      {(currentSong.lyrics || currentSong.result?.lyricsText || currentSong.creativeProcess?.snapshot?.lyrics)
                        .split(/\r?\n/)
                        .filter(l => l.trim())
                        .map((line, i) => (
                          <div key={i} className="py-0.5 hover:text-gray-200">{line}</div>
                        ))}
                    </div>
                  ) : null}
                </div>

                <div className="hidden md:flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                    <span>{L.queue}</span>
                    <span className="text-gray-600">{playlist.length} {isZh ? '首' : 'songs'}</span>
                  </div>
                  <div className="h-52 overflow-y-auto rounded-xl bg-black/30 border border-white/5 divide-y divide-white/5">
                    {playlist.length === 0 && (
                      <div className="p-4 text-center text-[11px] text-gray-500">{L.no_song_loaded}</div>
                    )}
                    {playlist.map((s, idx) => {
                      const t = s.title || s.creativeProcess?.snapshot?.title || (isZh ? '未命名' : 'Untitled');
                      const e = (s.engine || s.creativeProcess?.engine || '').toString().slice(0, 6);
                      const active = idx === currentIndex;
                      return (
                        <div
                          key={s.id || idx}
                          className={`flex items-center gap-2 p-2 cursor-pointer transition-colors ${active ? 'bg-fuchsia-500/10' : 'hover:bg-white/5'}`}
                          onClick={() => play(s)}
                        >
                          <GripVertical className="w-3 h-3 text-gray-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className={`text-[11px] font-medium truncate ${active ? 'text-fuchsia-300' : 'text-gray-300'}`}>
                              {t}
                            </div>
                            <div className="text-[9px] text-gray-500 truncate">{e}</div>
                          </div>
                          {active && isPlaying && (
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-3 bg-fuchsia-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                              <div className="w-0.5 h-3 bg-pink-400 animate-pulse" style={{ animationDelay: '120ms' }} />
                              <div className="w-0.5 h-3 bg-violet-400 animate-pulse" style={{ animationDelay: '240ms' }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showQueue && (
        <div
          className="fixed bottom-16 md:bottom-20 right-2 md:right-4 z-[9999] w-72 max-h-[60vh] rounded-2xl bg-black/80 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden animate-slide-in"
        >
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-fuchsia-400" />
              <span className="text-sm font-bold text-white">{L.playlist}</span>
              <span className="text-[11px] text-gray-500">({playlist.length})</span>
            </div>
            <button
              onClick={() => setShowQueue(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-[50vh] overflow-y-auto divide-y divide-white/5">
            {playlist.length === 0 && (
              <div className="p-6 text-center text-xs text-gray-500">{L.no_song_loaded}</div>
            )}
            {playlist.map((s, idx) => {
              const t = s.title || s.creativeProcess?.snapshot?.title || (isZh ? '未命名' : 'Untitled');
              const e = (s.engine || s.creativeProcess?.engine || 'ZMusic').toString();
              const active = idx === currentIndex;
              return (
                <div
                  key={s.id || idx}
                  className={`flex items-center gap-2 p-2.5 cursor-pointer ${active ? 'bg-fuchsia-500/10' : 'hover:bg-white/5'}`}
                  onClick={() => play(s)}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold tabular-nums ${
                    active ? 'bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white' : 'bg-white/5 text-gray-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${active ? 'text-fuchsia-300' : 'text-gray-200'}`}>{t}</div>
                    <div className="text-[10px] text-gray-500 truncate">{e}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFromQueue(idx); }}
                    className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                    style={{ opacity: 1 }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
