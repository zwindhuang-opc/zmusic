import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { getCurrentLanguage } from '../i18n/index.js';

const AutoProgressContext = createContext(null);

const initialState = {
  active: false,
  engine: null,        // 'muse' | 'suno' | 'melo'
  engineName: '',      // display name
  phase: 'idle',       // 'idle' | 'countdown' | 'generating' | 'complete' | 'failed' | 'stopped'
  countdownSec: 0,     // remaining seconds in countdown
  totalCountdown: 60,
  autoCount: 0,        // songs generated
  lastThought: null,   // latest creative thought
  lastTitle: '',       // latest song title
  lastError: null,     // latest error
  startedAt: null,
  statusMessage: '',   // human-readable status
};

/**
 * Bilingual message templates for AutoProgress.
 * AutoProgress is a context-level provider (not a React component under a hook),
 * so we resolve the language directly from i18n/currentLang at call time.
 */
const MSGS = {
  zh: {
    start: (en, sec) => `${en} AUTO 启动 · 构思倒计时 ${sec}s`,
    thinking: (en, sec) => `${en} AUTO 构思中 · 剩余 ${sec}s`,
    countdown_done: (en) => `${en} AUTO 倒计时结束 · 开始生成`,
    generating: (en, title) => `${en} AUTO 生成中 · ${title || '处理中...'}`,
    failed: (en, err) => `❌ ${en} AUTO 失败 · ${err}`,
    done: (en, title) => `✅ ${en} AUTO 完成 · ${title || ''}`,
    stopped: (en) => `${en} AUTO 已停止`,
  },
  en: {
    start: (en, sec) => `${en} AUTO starting · brainstorming ${sec}s`,
    thinking: (en, sec) => `${en} AUTO thinking · ${sec}s left`,
    countdown_done: (en) => `${en} AUTO ready · starting generation`,
    generating: (en, title) => `${en} AUTO generating · ${title || 'processing...'}`,
    failed: (en, err) => `❌ ${en} AUTO failed · ${err}`,
    done: (en, title) => `✅ ${en} AUTO done · ${title || ''}`,
    stopped: (en) => `${en} AUTO stopped`,
  },
};

function resolveMsgs() {
  const lang = getCurrentLanguage();
  return MSGS[lang] || MSGS.zh;
}

export function AutoProgressProvider({ children }) {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const startProgress = useCallback(({ engine, engineName, totalCountdown = 60 }) => {
    const m = resolveMsgs();
    setState({
      active: true,
      engine,
      engineName,
      phase: 'countdown',
      countdownSec: totalCountdown,
      totalCountdown,
      autoCount: 0,
      lastThought: null,
      lastTitle: '',
      lastError: null,
      startedAt: Date.now(),
      statusMessage: m.start(engineName, totalCountdown),
    });
  }, []);

  const updateCountdown = useCallback((sec) => {
    const m = resolveMsgs();
    setState(prev => ({
      ...prev,
      countdownSec: sec,
      statusMessage: sec > 0
        ? m.thinking(prev.engineName, sec)
        : m.countdown_done(prev.engineName),
    }));
  }, []);

  const addThought = useCallback((thought) => {
    setState(prev => ({
      ...prev,
      lastThought: thought,
      lastTitle: thought?.title || prev.lastTitle,
      statusMessage: thought?.title || prev.statusMessage,
    }));
  }, []);

  const setGenerating = useCallback(({ title }) => {
    const m = resolveMsgs();
    setState(prev => ({
      ...prev,
      phase: 'generating',
      lastTitle: title || prev.lastTitle,
      statusMessage: m.generating(prev.engineName, title),
    }));
  }, []);

  const incrementCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      autoCount: prev.autoCount + 1,
    }));
  }, []);

  const setComplete = useCallback(({ title, error }) => {
    const m = resolveMsgs();
    setState(prev => ({
      ...prev,
      phase: error ? 'failed' : 'complete',
      lastTitle: title || prev.lastTitle,
      lastError: error || null,
      statusMessage: error
        ? m.failed(prev.engineName, error)
        : m.done(prev.engineName, title),
    }));
  }, []);

  const stopProgress = useCallback(() => {
    const m = resolveMsgs();
    setState(prev => ({
      ...prev,
      phase: 'stopped',
      statusMessage: m.stopped(prev.engineName),
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setState(initialState);
  }, []);

  const value = {
    ...state,
    startProgress,
    updateCountdown,
    addThought,
    setGenerating,
    incrementCount,
    setComplete,
    stopProgress,
    resetProgress,
  };

  return (
    <AutoProgressContext.Provider value={value}>
      {children}
    </AutoProgressContext.Provider>
  );
}

export function useAutoProgress() {
  const ctx = useContext(AutoProgressContext);
  if (!ctx) throw new Error('useAutoProgress must be used inside AutoProgressProvider');
  return ctx;
}
