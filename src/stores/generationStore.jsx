import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'zmusic_generation_history';

const GenerationContext = createContext(null);

export function GenerationProvider({ children }) {
  const [history, setHistory] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [pendingLyrics, setPendingLyrics] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse generation history:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addToHistory = useCallback((item) => {
    const newItem = {
      ...item,
      id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    setHistory(prev => [newItem, ...prev].slice(0, 100));
    setSelectedId(newItem.id);
    return newItem;
  }, []);

  const removeFromHistory = useCallback((id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setSelectedId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getSelected = useCallback(() => {
    return history.find(item => item.id === selectedId);
  }, [history, selectedId]);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.error('Failed to copy:', e);
      return false;
    }
  }, []);

  const stats = useMemo(() => {
    const songs = history.filter(item => item.type === 'song').length;
    const lyrics = history.filter(item => item.type === 'lyrics').length;
    const mvs = history.filter(item => item.type === 'mv').length;
    return {
      songsGenerated: songs,
      lyricsGenerated: lyrics,
      mvGenerated: mvs,
      activeUsers: 1,
      total: history.length
    };
  }, [history]);

  const getHistoryByType = useCallback((type) => {
    if (!type) return history;
    return history.filter(item => item.type === type);
  }, [history]);

  const value = {
    history,
    selectedId,
    setSelectedId,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getSelected,
    copyToClipboard,
    stats,
    getHistoryByType,
    pendingLyrics,
    setPendingLyrics
  };

  return (
    <GenerationContext.Provider value={value}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error('useGeneration must be used within GenerationProvider');
  }
  return context;
}

export default GenerationProvider;