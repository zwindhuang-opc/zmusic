import { useState, useEffect, useMemo } from 'react';
import { analyzeSong, analyzeSongSync, getThreshold, setThreshold, REGISTER_THRESHOLDS } from '../services/qualityAnalyzer.service.js';

export function useQualityGate(song) {
  const [threshold, setThresholdState] = useState(() => getThreshold());
  const [analysis, setAnalysis] = useState(() => song ? analyzeSongSync(song) : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = getThreshold();
    if (saved !== threshold) setThresholdState(saved);
  }, []);

  useEffect(() => {
    if (!song) { setAnalysis(null); return; }
    setLoading(true);
    const sync = analyzeSongSync(song);
    setAnalysis(sync);
    setLoading(false);
    analyzeSong(song).then(full => {
      setAnalysis(full);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [song]);

  const score = analysis?.overall ?? null;
  const belowThreshold = useMemo(() => {
    if (score === null || score === undefined) return false;
    return score < threshold;
  }, [score, threshold]);

  const reason = useMemo(() => {
    if (!belowThreshold || score === null) return null;
    return `Score ${score} is below threshold ${threshold}`;
  }, [belowThreshold, score, threshold]);

  const autoRegenSuggestedParams = useMemo(() => {
    if (!song || !belowThreshold) return null;
    const params = {};
    if (song?.creativeProcess?.snapshot) {
      const snap = song.creativeProcess.snapshot;
      params.title = snap.title || song.title;
      params.style = snap.style || song.style;
      params.bpm = snap.bpm || song.bpm;
      params.duration = snap.duration || song.duration;
      params.structure = snap.structure || song.structure;
      params.lyrics = song.lyrics || snap.lyrics;
      params.theme = snap.theme || song.theme;
      params.engine = (song.creativeProcess?.engine || song.engine || 'muse').toLowerCase();
      params.strategy = snap.strategy || song.strategy;
      params.prompt = song.prompt || snap.prompt;
    } else {
      params.title = song.title;
      params.style = song.style;
      params.bpm = song.bpm;
      params.duration = song.duration;
      params.structure = song.structure;
      params.lyrics = song.lyrics;
      params.theme = song.theme;
      params.engine = (song.engine || 'muse').toLowerCase();
      params.strategy = song.strategy;
      params.prompt = song.prompt;
    }
    return params;
  }, [song, belowThreshold]);

  const updateThreshold = (value) => {
    const n = setThreshold(value);
    setThresholdState(n);
    return n;
  };

  return {
    belowThreshold,
    threshold,
    setThreshold: updateThreshold,
    score,
    scoreData: analysis,
    loading,
    reason,
    autoRegenSuggestedParams,
    REGISTER_THRESHOLDS,
  };
}

export default useQualityGate;
