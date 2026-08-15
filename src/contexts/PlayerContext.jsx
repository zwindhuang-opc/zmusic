import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const PlayerContext = createContext(null);
let globalAudioRef = null;

export function PlayerProvider({ children }) {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) {
      if (globalAudioRef) {
        audioRef.current = globalAudioRef;
      } else {
        audioRef.current = typeof Audio !== 'undefined' ? new Audio() : null;
        globalAudioRef = audioRef.current;
      }
    }
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => handleEnded();

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const getAudio = useCallback(() => audioRef.current, []);

  const currentSong = currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null;

  const setMediaSession = useCallback((song, playing) => {
    if (typeof navigator === 'undefined' || !navigator.mediaSession || !song) return;
    try {
      const artwork = [];
      if (song.cover_data || song.coverUrl || song.imageUrl) {
        const src = song.cover_data || song.coverUrl || song.imageUrl;
        artwork.push({ src, sizes: '512x512', type: 'image/jpeg' });
      }
      navigator.mediaSession.metadata = new (window.MediaMetadata || function () {})({
        title: song.title || 'Untitled',
        artist: (song.engine || song.creativeProcess?.engine || 'ZMusic').toString(),
        album: 'ZMusic',
        artwork,
      });
      if (typeof navigator.mediaSession.setPositionState === 'function' && duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1,
            position: currentTime,
          });
        } catch (_) {}
      }
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    } catch (_) {}
  }, [duration, currentTime]);

  const play = useCallback((song) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (song) {
      const url = song.audioUrl || song.audio_url || song.result?.audioUrl || song.result?.audio_url;
      if (!url) return;
      let idx = playlist.findIndex(s =>
        (s.id && s.id === song.id) ||
        ((s.audioUrl || s.audio_url) === url)
      );
      if (idx === -1) {
        setPlaylist(prev => [...prev, song]);
        idx = playlist.length;
      }
      setCurrentIndex(idx);
      try {
        audio.pause();
        audio.src = url;
        audio.load();
        const p = audio.play();
        if (p && typeof p.then === 'function') {
          p.catch(() => {});
        }
        setIsPlaying(true);
        setMediaSession(song, true);
      } catch (_) {}
    } else if (currentSong) {
      try {
        const p = audio.play();
        if (p && typeof p.then === 'function') p.catch(() => {});
        setIsPlaying(true);
        setMediaSession(currentSong, true);
      } catch (_) {}
    }
  }, [playlist, currentSong, setMediaSession]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    try { audio.pause(); } catch (_) {}
    setIsPlaying(false);
    if (currentSong) setMediaSession(currentSong, false);
  }, [currentSong, setMediaSession]);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const seek = useCallback((t) => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = Math.max(0, Math.min(duration || audio.duration || 0, t));
      setCurrentTime(audio.currentTime);
    } catch (_) {}
  }, [duration]);

  const enqueue = useCallback((song) => {
    if (!song) return;
    setPlaylist(prev => [...prev, song]);
  }, []);

  const removeFromQueue = useCallback((index) => {
    setPlaylist(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (index === currentIndex) {
        const audio = audioRef.current;
        if (audio) try { audio.pause(); } catch (_) {}
        setCurrentIndex(next.length > 0 ? Math.min(index, next.length - 1) : -1);
        setIsPlaying(false);
      } else if (index < currentIndex) {
        setCurrentIndex(ci => ci - 1);
      }
      return next;
    });
  }, [currentIndex]);

  const clear = useCallback(() => {
    const audio = audioRef.current;
    if (audio) try { audio.pause(); } catch (_) {}
    setPlaylist([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const playNext = useCallback(() => {
    if (playlist.length === 0) return;
    let nextIdx;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * playlist.length);
    } else {
      nextIdx = (currentIndex + 1) % playlist.length;
    }
    const next = playlist[nextIdx];
    if (next) {
      setCurrentIndex(nextIdx);
      const audio = audioRef.current;
      const url = next.audioUrl || next.audio_url || next.result?.audioUrl;
      if (audio && url) {
        try {
          audio.pause();
          audio.src = url;
          audio.load();
          const p = audio.play();
          if (p && typeof p.then === 'function') p.catch(() => {});
          setIsPlaying(true);
          setMediaSession(next, true);
        } catch (_) {}
      }
    }
  }, [playlist, currentIndex, shuffle, setMediaSession]);

  const playPrev = useCallback(() => {
    if (playlist.length === 0) return;
    let prevIdx;
    if (shuffle) {
      prevIdx = Math.floor(Math.random() * playlist.length);
    } else {
      prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
    }
    const prev = playlist[prevIdx];
    if (prev) {
      setCurrentIndex(prevIdx);
      const audio = audioRef.current;
      const url = prev.audioUrl || prev.audio_url || prev.result?.audioUrl;
      if (audio && url) {
        try {
          audio.pause();
          audio.src = url;
          audio.load();
          const p = audio.play();
          if (p && typeof p.then === 'function') p.catch(() => {});
          setIsPlaying(true);
          setMediaSession(prev, true);
        } catch (_) {}
      }
    }
  }, [playlist, currentIndex, shuffle, setMediaSession]);

  const handleEnded = useCallback(() => {
    if (repeat && currentSong) {
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.currentTime = 0;
          const p = audio.play();
          if (p && typeof p.then === 'function') p.catch(() => {});
          return;
        } catch (_) {}
      }
    }
    playNext();
  }, [repeat, currentSong, playNext]);

  const toggleShuffle = useCallback(() => setShuffle(s => !s), []);
  const toggleRepeat = useCallback(() => setRepeat(r => !r), []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaSession) return;
    try {
      navigator.mediaSession.setActionHandler('play', () => play());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        seek(Math.max(0, currentTime - (details.seekOffset || 10)));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        seek(currentTime + (details.seekOffset || 10));
      });
    } catch (_) {}
  }, [play, pause, playNext, playPrev, seek, currentTime]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__zmusic_player = {
        enqueue,
        clear,
        playNext,
        playPrev,
        play,
        pause,
        getPlaylist: () => playlist,
        getCurrent: () => currentSong,
        isPlaying: () => isPlaying,
      };
    }
  }, [enqueue, clear, playNext, playPrev, play, pause, playlist, currentSong, isPlaying]);

  const value = {
    currentSong,
    currentIndex,
    playlist,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    play,
    pause,
    togglePlay,
    seek,
    enqueue,
    removeFromQueue,
    clear,
    playNext,
    playPrev,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    getAudio,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    return {
      currentSong: null, currentIndex: -1, playlist: [], isPlaying: false,
      currentTime: 0, duration: 0, volume: 0.8, shuffle: false, repeat: false,
      play: () => {}, pause: () => {}, togglePlay: () => {}, seek: () => {},
      enqueue: () => {}, removeFromQueue: () => {}, clear: () => {},
      playNext: () => {}, playPrev: () => {}, toggleShuffle: () => {},
      toggleRepeat: () => {}, setVolume: () => {}, getAudio: () => null,
    };
  }
  return ctx;
}

export default PlayerProvider;
