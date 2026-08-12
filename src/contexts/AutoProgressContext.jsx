import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

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

export function AutoProgressProvider({ children }) {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const startProgress = useCallback(({ engine, engineName, totalCountdown = 60 }) => {
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
      statusMessage: `${engineName} AUTO 启动 · 构思倒计时 ${totalCountdown}s`,
    });
  }, []);

  const updateCountdown = useCallback((sec) => {
    setState(prev => ({
      ...prev,
      countdownSec: sec,
      statusMessage: sec > 0
        ? `${prev.engineName} AUTO 构思中 · 剩余 ${sec}s`
        : `${prev.engineName} AUTO 倒计时结束 · 开始生成`,
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
    setState(prev => ({
      ...prev,
      phase: 'generating',
      lastTitle: title || prev.lastTitle,
      statusMessage: `${prev.engineName} AUTO 生成中 · ${title || '处理中...'}`,
    }));
  }, []);

  const incrementCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      autoCount: prev.autoCount + 1,
    }));
  }, []);

  const setComplete = useCallback(({ title, error }) => {
    setState(prev => ({
      ...prev,
      phase: error ? 'failed' : 'complete',
      lastTitle: title || prev.lastTitle,
      lastError: error || null,
      statusMessage: error
        ? `❌ ${prev.engineName} AUTO 失败 · ${error}`
        : `✅ ${prev.engineName} AUTO 完成 · ${title || ''}`,
    }));
  }, []);

  const stopProgress = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: 'stopped',
      statusMessage: `${prev.engineName} AUTO 已停止`,
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
