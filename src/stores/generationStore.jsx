/**
 * Generation Store - React Context for Generation History Management
 *
 * This module provides a centralized state management solution for tracking
 * all AI-generated content (songs, lyrics, MVs) across the application.
 * It uses React Context API with localStorage persistence to maintain
 * generation history across page reloads and browser sessions.
 *
 * Features:
 * - Type-based history filtering (song, lyrics, mv)
 * - Real-time statistics calculation from actual generated content
 * - Clipboard copy utility for sharing generated content
 * - Cross-page lyrics transfer via pendingLyrics state
 * - localStorage persistence with automatic sync
 *
 * @module stores/generationStore
 * @version 1.1.0
 * @author ZMusic Team
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { isMobileEnvironment } from '../services/api.client.js';

/**
 * localStorage key for persisting generation history
 * @constant {string}
 */
const STORAGE_KEY = 'zmusic_generation_history';

/**
 * localStorage key for persisting unique session ID
 * Used to track unique users without authentication
 * @constant {string}
 */
const SESSION_KEY = 'zmusic_session_id';

/**
 * Maximum number of history items to retain
 * Prevents unlimited localStorage growth
 * @constant {number}
 */
const MAX_HISTORY_ITEMS = 100;

/**
 * React Context for sharing generation state across components
 * @type {React.Context}
 */
const GenerationContext = createContext(null);

/**
 * Generate a unique session ID for user tracking
 * Creates a persistent ID stored in localStorage to identify unique browser sessions
 * @returns {string} Unique session identifier
 * @private
 */
function getOrCreateSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * GenerationProvider Component
 *
 * Wraps the application to provide generation history state management.
 * All child components can access generation data via the useGeneration hook.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} Provider component
 *
 * @example
 * <GenerationProvider>
 *   <App />
 * </GenerationProvider>
 */
export function GenerationProvider({ children }) {
  /**
   * Array of generation history items
   * Each item contains: id, type, result, prompt, createdAt
   * @type {Array<Object>}
   */
  const [history, setHistory] = useState([]);

  /**
   * ID of the currently selected history item
   * Used for highlighting and detail display
   * @type {string|null}
   */
  const [selectedId, setSelectedId] = useState(null);

  /**
   * Lyrics text pending transfer to another page
   * Used when user clicks "Send to Music" or "Send to MV" from Lyrics page
   * @type {string}
   */
  const [pendingLyrics, setPendingLyrics] = useState('');

  /**
   * Unique session ID for this browser
   * Used for active user counting without authentication
   * @type {string}
   */
  const [sessionId] = useState(getOrCreateSessionId);
  const [toast, setToast] = useState(null);

  /**
   * Load history from localStorage on mount
   * Restores previously saved generation history
   */
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

  /**
   * Persist history to localStorage whenever it changes
   * Ensures data survives page reloads
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  /**
   * Add a new item to generation history
   *
   * @param {Object} item - The generation result to add
   * @param {string} item.type - Type of generation ('song', 'lyrics', 'mv')
   * @param {Object} item.result - The generation result data
   * @param {string} item.prompt - The prompt/command used
   * @returns {Object} The newly created history item with id and createdAt
   *
   * @example
   * addToHistory({ type: 'song', result: songData, prompt: 'A happy song' });
   */
  const addToHistory = useCallback((item) => {
    const newItem = {
      ...item,
      id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    setHistory(prev => [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS));
    setSelectedId(newItem.id);
    return newItem;
  }, []);

  /**
   * Remove a specific item from history by ID
   * @param {string} id - The ID of the item to remove
   */
  const removeFromHistory = useCallback((id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  /**
   * Clear all history items and remove from localStorage
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setSelectedId(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * Get the currently selected history item
   * @returns {Object|undefined} The selected history item or undefined
   */
  const getSelected = useCallback(() => {
    return history.find(item => item.id === selectedId);
  }, [history, selectedId]);

  /**
   * Show a toast notification for user feedback
   * @param {string} message - The toast message
   * @param {'success'|'error'|'info'} type - Toast type
   */
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 2500);
  }, []);

  /**
   * Shows a dialog with text that user can long-press to select and copy manually
   * This is the last resort for environments where all other copy methods fail
   * @param {string} text
   */
  const showManualCopyDialog = useCallback((text) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';

    const dialog = document.createElement('div');
    dialog.style.cssText = 'background:#1a1a2e;border-radius:16px;padding:24px;max-width:90vw;max-height:80vh;display:flex;flex-direction:column;gap:16px;border:1px solid rgba(236,72,153,0.3);';

    const title = document.createElement('div');
    title.style.cssText = 'color:#ec4899;font-size:14px;font-weight:600;text-align:center;';
    title.textContent = '长按选择复制 / Long press to copy';

    const textContainer = document.createElement('div');
    textContainer.style.cssText = 'background:rgba(0,0,0,0.4);border:1px solid rgba(236,72,153,0.2);border-radius:12px;padding:16px;overflow-y:auto;max-height:50vh;-webkit-user-select:text;user-select:text;-webkit-touch-callout:default;font-family:monospace;font-size:12px;color:#fce7f3;line-height:1.6;white-space:pre-wrap;word-break:break-all;';
    textContainer.textContent = text;

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'background:linear-gradient(135deg,#ec4899,#a855f7);color:white;border:none;border-radius:12px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;';
    closeBtn.textContent = '关闭 / Close';
    closeBtn.onclick = () => document.body.removeChild(overlay);

    dialog.appendChild(title);
    dialog.appendChild(textContainer);
    dialog.appendChild(closeBtn);
    overlay.appendChild(dialog);

    overlay.onclick = (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    };

    document.body.appendChild(overlay);
  }, []);

  /**
   * Copy text to clipboard using the best available strategy
   * Supports: Capacitor Clipboard Plugin → Clipboard API → execCommand('copy') → Manual
   *
   * @param {string} text - The text to copy
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const copyToClipboard = useCallback(async (text) => {
    if (!text) {
      showToast('No text to copy', 'error');
      return false;
    }

    const isMobile = isMobileEnvironment();

    // Strategy 1: Capacitor Clipboard plugin (mobile native)
    if (isMobile) {
      try {
        const { Clipboard } = await import('@capacitor/clipboard');
        await Clipboard.write({ string: text });
        showToast('Copied!', 'success');
        return true;
      } catch (capError) {
        console.warn('Capacitor clipboard failed:', capError);
      }
    }

    // Strategy 2: Clipboard API (works on HTTPS, localhost, and capacitor://)
    try {
      if (navigator.clipboard) {
        if (isMobile || window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          showToast('Copied!', 'success');
          return true;
        }
      }
    } catch (clipError) {
      console.warn('Clipboard API failed:', clipError);
    }

    // Strategy 3: execCommand('copy') with focused textarea
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:0;opacity:0;pointer-events:none;-webkit-user-select:text;user-select:text;';
      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (success) {
        showToast('Copied!', 'success');
        return true;
      }
    } catch (fallbackError) {
      console.warn('Fallback copy failed:', fallbackError);
    }

    // Strategy 4: Show copy dialog for manual long-press selection
    try {
      showManualCopyDialog(text);
      return true;
    } catch (e) {
      showToast('Copy failed', 'error');
      return false;
    }
  }, [showToast, showManualCopyDialog]);

  /**
   * Computed statistics from actual history data
   * Calculates real-time counts of generated content by type
   * No hardcoded values - all derived from actual user data
   *
   * @type {Object}
   * @property {number} songsGenerated - Count of generated songs
   * @property {number} lyricsGenerated - Count of generated lyrics
   * @property {number} mvGenerated - Count of generated MVs
   * @property {number} activeUsers - Active user count (1 for local app, would be API-driven in cloud)
   * @property {number} total - Total items in history
   */
  const stats = useMemo(() => {
    const songs = history.filter(item => item.type === 'song').length;
    const lyrics = history.filter(item => item.type === 'lyrics').length;
    const mvs = history.filter(item => item.type === 'mv').length;
    return {
      songsGenerated: songs,
      lyricsGenerated: lyrics,
      mvGenerated: mvs,
      activeUsers: 1, // Local app - single user. In cloud deployment, this would fetch from API
      total: history.length
    };
  }, [history]);

  /**
   * Filter history by content type
   * @param {string} type - Content type ('song', 'lyrics', 'mv') or null for all
   * @returns {Array<Object>} Filtered history items
   *
   * @example
   * const songs = getHistoryByType('song');
   * const allItems = getHistoryByType(null);
   */
  const getHistoryByType = useCallback((type) => {
    if (!type) return history;
    return history.filter(item => item.type === type);
  }, [history]);

  /**
   * Context value object containing all state and methods
   * Exposed to all child components via useGeneration hook
   * @type {Object}
   */
  const value = {
    history,
    selectedId,
    setSelectedId,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getSelected,
    copyToClipboard,
    showToast,
    stats,
    getHistoryByType,
    pendingLyrics,
    setPendingLyrics
  };

  return (
    <GenerationContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm animate-slide-in ${toast.type === 'success'
            ? 'bg-emerald-500/90 text-white border border-emerald-400/50'
            : toast.type === 'error'
              ? 'bg-red-500/90 text-white border border-red-400/50'
              : 'bg-violet-500/90 text-white border border-violet-400/50'
            }`}
        >
          {toast.message}
        </div>
      )}
    </GenerationContext.Provider>
  );
}

/**
 * useGeneration Hook
 *
 * Custom hook to access the generation context.
 * Must be used within a GenerationProvider wrapper.
 *
 * @returns {Object} Generation context value with history, stats, and methods
 * @throws {Error} If used outside of GenerationProvider
 *
 * @example
 * function MyComponent() {
 *   const { history, stats, addToHistory } = useGeneration();
 *   return <div>{stats.total} items generated</div>;
 * }
 */
export function useGeneration() {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error('useGeneration must be used within GenerationProvider');
  }
  return context;
}

export default GenerationProvider;
