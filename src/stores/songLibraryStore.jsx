import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useGeneration } from './generationStore.jsx';

const SongLibraryContext = createContext(null);

function storageKey(userId) {
  return `zmusic_songs_${userId || 'guest'}`;
}

function readLibrary(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { songs: [], albums: [], migratedFromHistory: false };
    const parsed = JSON.parse(raw);
    return {
      songs: Array.isArray(parsed.songs) ? parsed.songs : [],
      albums: Array.isArray(parsed.albums) ? parsed.albums : [],
      migratedFromHistory: !!parsed.migratedFromHistory,
    };
  } catch (e) {
    return { songs: [], albums: [], migratedFromHistory: false };
  }
}

function writeLibrary(userId, data) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

function historyItemToSong(item, ownerId) {
  const proc = item.creativeProcess || {};
  const snap = proc.snapshot || {};
  const engine = (proc.engine || item.engine || 'unknown').toString();
  const engineLower = engine.toLowerCase();
  let engineKey = 'unknown';
  if (engineLower.includes('muse')) engineKey = 'muse';
  else if (engineLower.includes('suno')) engineKey = 'suno';
  else if (engineLower.includes('melo')) engineKey = 'melo';
  else if (item.type === 'mv') engineKey = 'mv';

  return {
    id: `song-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
    owner_id: ownerId,
    engine: engineKey,
    engine_task_id: proc.taskId || item.taskId || null,
    title: item.title || snap.title || 'Untitled',
    lyrics: item.lyrics || snap.lyrics || item.result?.lyricsText || '',
    style: item.style || snap.style || '',
    theme: snap.theme || '',
    bpm: snap.bpm || item.result?.bpm || null,
    duration: item.duration || snap.duration || (item.result?.duration ? Number(item.result.duration) : 0),
    language: snap.language || '',
    audio_url: item.audioUrl || item.result?.audioUrl || '',
    cover_data: item.imageUrl || item.result?.imageUrl || item.coverUrl || null,
    metadata: {
      key: snap.key || '',
      structure: snap.structure || '',
      command: snap.command || item.prompt || '',
      engine_original: engine,
      history_id: item.id,
      creative_process: proc,
      result_raw: item.result,
    },
    favorite: false,
    play_count: 0,
    created_at: item.createdAt || item.completedAt || new Date().toISOString(),
    publishing_status: 'none',
    publishing_result: {},
  };
}

export function SongLibraryProvider({ children, user: userProp, authLoading: authLoadingProp, generationHistory: historyProp, historyLoaded: loadedProp }) {
  let authUser = userProp;
  let loading = authLoadingProp;
  let genHistory = historyProp;
  let genLoaded = loadedProp;

  try {
    const auth = useAuth();
    if (!userProp) authUser = auth.user;
    if (!authLoadingProp) loading = auth.loading;
  } catch (_) {
    if (!loading) loading = false;
  }

  try {
    const gen = useGeneration();
    if (!historyProp) genHistory = gen.history;
  } catch (_) {
  }

  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [migrated, setMigrated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [toast, setToast] = useState(null);
  const prevUserIdRef = useRef(null);
  const migrationDoneRef = useRef(new Set());

  useEffect(() => {
    if (loading) return;
    const uid = authUser?.id || 'guest';
    setUserId(uid);
    if (prevUserIdRef.current !== uid) {
      const data = readLibrary(uid);
      setSongs(data.songs);
      setAlbums(data.albums);
      setMigrated(data.migratedFromHistory);
      prevUserIdRef.current = uid;
    }
  }, [authUser, loading]);

  useEffect(() => {
    if (!userId) return;
    writeLibrary(userId, { songs, albums, migratedFromHistory: migrated });
  }, [songs, albums, migrated, userId]);

  useEffect(() => {
    if (!userId || migrated || !genHistory || genHistory.length === 0) return;
    migrateFromHistory(genHistory);
  }, [userId, genHistory, migrated]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const saveSong = useCallback((song) => {
    const ownerId = userId || 'guest';
    const newSong = {
      ...song,
      id: song.id || `song-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
      owner_id: song.owner_id || ownerId,
      created_at: song.created_at || new Date().toISOString(),
      favorite: !!song.favorite,
      play_count: song.play_count || 0,
      publishing_status: song.publishing_status || 'none',
      publishing_result: song.publishing_result || {},
    };
    setSongs(prev => {
      const idx = prev.findIndex(s => s.id === newSong.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...prev[idx], ...newSong, updatedAt: new Date().toISOString() };
        return updated;
      }
      return [newSong, ...prev];
    });
    return newSong;
  }, [userId]);

  const updateSong = useCallback((id, partial) => {
    if (!id) return null;
    let updated = null;
    setSongs(prev => prev.map(s => {
      if (s.id !== id) return s;
      updated = { ...s, ...partial, updatedAt: new Date().toISOString() };
      return updated;
    }));
    return updated;
  }, []);

  const deleteSong = useCallback((id) => {
    setSongs(prev => prev.filter(s => s.id !== id));
    setAlbums(prev => prev.map(a => ({
      ...a,
      song_ids: (a.song_ids || []).filter(sid => sid !== id),
      updatedAt: new Date().toISOString(),
    })));
  }, []);

  const toggleFavorite = useCallback((id) => {
    setSongs(prev => prev.map(s => {
      if (s.id !== id) return s;
      return { ...s, favorite: !s.favorite, updatedAt: new Date().toISOString() };
    }));
  }, []);

  const incrementPlayCount = useCallback((id) => {
    setSongs(prev => prev.map(s => {
      if (s.id !== id) return s;
      return { ...s, play_count: (s.play_count || 0) + 1, updatedAt: new Date().toISOString() };
    }));
  }, []);

  const setPublishingStatus = useCallback((id, { platform, url }) => {
    setSongs(prev => prev.map(s => {
      if (s.id !== id) return s;
      const currentResult = s.publishing_result || {};
      const updatedResult = { ...currentResult };
      if (platform) updatedResult[platform] = { url, publishedAt: new Date().toISOString() };
      return {
        ...s,
        publishing_status: platform ? 'published' : s.publishing_status,
        publishing_result: updatedResult,
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const createAlbum = useCallback((album) => {
    const ownerId = userId || 'guest';
    const newAlbum = {
      ...album,
      id: album.id || `album-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
      owner_id: album.owner_id || ownerId,
      title: album.title || 'Untitled Album',
      description: album.description || '',
      cover_color: album.cover_color || 'from-violet-500 to-pink-500',
      cover_emoji: album.cover_emoji || '🎵',
      tags: album.tags || [],
      is_public: !!album.is_public,
      song_ids: album.song_ids || [],
      share_token: album.share_token || `share-${Math.random().toString(36).substr(2, 12)}`,
      created_at: album.created_at || new Date().toISOString(),
    };
    setAlbums(prev => [newAlbum, ...prev]);
    return newAlbum;
  }, [userId]);

  const updateAlbum = useCallback((id, partial) => {
    if (!id) return null;
    let updated = null;
    setAlbums(prev => prev.map(a => {
      if (a.id !== id) return a;
      updated = { ...a, ...partial, updatedAt: new Date().toISOString() };
      return updated;
    }));
    return updated;
  }, []);

  const deleteAlbum = useCallback((id) => {
    setAlbums(prev => prev.filter(a => a.id !== id));
  }, []);

  const addSongToAlbum = useCallback((albumId, songId) => {
    setAlbums(prev => prev.map(a => {
      if (a.id !== albumId) return a;
      const ids = a.song_ids || [];
      if (ids.includes(songId)) return a;
      return { ...a, song_ids: [...ids, songId], updatedAt: new Date().toISOString() };
    }));
  }, []);

  const removeSongFromAlbum = useCallback((albumId, songId) => {
    setAlbums(prev => prev.map(a => {
      if (a.id !== albumId) return a;
      return { ...a, song_ids: (a.song_ids || []).filter(sid => sid !== songId), updatedAt: new Date().toISOString() };
    }));
  }, []);

  const exportLibrary = useCallback((targetUserId) => {
    const uid = targetUserId || userId || 'guest';
    const data = readLibrary(uid);
    return JSON.stringify({
      ...data,
      exportedAt: new Date().toISOString(),
      version: 1,
    });
  }, [userId]);

  const importLibrary = useCallback((targetUserId, jsonStr) => {
    try {
      const uid = targetUserId || userId || 'guest';
      const parsed = JSON.parse(jsonStr);
      if (!parsed) throw new Error('Invalid JSON');
      const incoming = {
        songs: Array.isArray(parsed.songs) ? parsed.songs : [],
        albums: Array.isArray(parsed.albums) ? parsed.albums : [],
      };
      const current = readLibrary(uid);
      const existingSongIds = new Set(current.songs.map(s => s.id));
      const existingAlbumIds = new Set(current.albums.map(a => a.id));
      const mergedSongs = [...current.songs];
      for (const s of incoming.songs) {
        if (!existingSongIds.has(s.id)) mergedSongs.push(s);
      }
      const mergedAlbums = [...current.albums];
      for (const a of incoming.albums) {
        if (!existingAlbumIds.has(a.id)) mergedAlbums.push(a);
      }
      writeLibrary(uid, { songs: mergedSongs, albums: mergedAlbums, migratedFromHistory: current.migratedFromHistory });
      if (uid === (userId || 'guest')) {
        setSongs(mergedSongs);
        setAlbums(mergedAlbums);
      }
      return true;
    } catch (e) {
      return false;
    }
  }, [userId]);

  const migrateFromHistory = useCallback((historyArray) => {
    const uid = userId || 'guest';
    if (migrationDoneRef.current.has(uid)) return { migrated: 0, skipped: 0 };
    const current = readLibrary(uid);
    if (current.migratedFromHistory && current.songs.length > 0) {
      migrationDoneRef.current.add(uid);
      return { migrated: 0, skipped: 0, alreadyDone: true };
    }
    if (!Array.isArray(historyArray) || historyArray.length === 0) {
      writeLibrary(uid, { ...current, migratedFromHistory: true });
      setMigrated(true);
      migrationDoneRef.current.add(uid);
      return { migrated: 0, skipped: 0, empty: true };
    }
    const existingHistIds = new Set(current.songs.map(s => s.metadata?.history_id).filter(Boolean));
    const newSongs = [...current.songs];
    let count = 0;
    for (const item of historyArray) {
      if (!item) continue;
      if (item.type !== 'song' && item.type !== 'creation_attempt' && item.type !== 'mv') continue;
      if (!item.audioUrl && !(item.lyrics || (item.creativeProcess?.snapshot?.lyrics))) continue;
      if (item.id && existingHistIds.has(item.id)) continue;
      const song = historyItemToSong(item, uid);
      newSongs.push(song);
      count++;
      if (item.id) existingHistIds.add(item.id);
    }
    newSongs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    writeLibrary(uid, { songs: newSongs, albums: current.albums, migratedFromHistory: true });
    setSongs(newSongs);
    setMigrated(true);
    migrationDoneRef.current.add(uid);
    return { migrated: count };
  }, [userId]);

  const value = {
    songs,
    albums,
    userId,
    migrated,
    saveSong,
    updateSong,
    deleteSong,
    toggleFavorite,
    incrementPlayCount,
    setPublishingStatus,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    addSongToAlbum,
    removeSongFromAlbum,
    exportLibrary,
    importLibrary,
    migrateFromHistory,
    showToast,
  };

  return (
    <SongLibraryContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm ${toast.type === 'success'
            ? 'bg-emerald-500/90 text-white border border-emerald-400/50'
            : toast.type === 'error'
              ? 'bg-red-500/90 text-white border border-red-400/50'
              : 'bg-violet-500/90 text-white border border-violet-400/50'
            }`}
        >
          {toast.message}
        </div>
      )}
    </SongLibraryContext.Provider>
  );
}

export function useSongLibrary() {
  const context = useContext(SongLibraryContext);
  if (!context) {
    throw new Error('useSongLibrary must be used within SongLibraryProvider');
  }
  return context;
}

export default SongLibraryProvider;
