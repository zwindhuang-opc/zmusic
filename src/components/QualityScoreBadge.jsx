import React, { useState, useEffect } from 'react';
import { Target, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { analyzeSong, getScoreColor, getScoreTextColor, getScoreLabel, analyzeSongSync } from '../services/qualityAnalyzer.service.js';
import { useTranslation } from '../i18n/useTranslation.js';

const METRIC_KEYS = [
  { key: 'structural', zh: '结构分', en: 'Structural' },
  { key: 'lyricsMatch', zh: '歌词匹配', en: 'Lyrics Match' },
  { key: 'durationAccuracy', zh: '时长精准', en: 'Duration' },
  { key: 'bpmConsistency', zh: 'BPM稳定', en: 'BPM Consistency' },
  { key: 'styleMatch', zh: '风格匹配', en: 'Style Match' },
  { key: 'clarity', zh: '清晰度', en: 'Clarity' },
];

export default function QualityScoreBadge({ song, compact = false, onClick }) {
  const { t, lang } = useTranslation();
  const isZh = lang === 'zh';
  const [expanded, setExpanded] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!song) { setAnalysis(null); setLoading(false); return; }
    setLoading(true);
    const sync = analyzeSongSync(song);
    setAnalysis(sync);
    setLoading(false);
    analyzeSong(song).then(full => {
      setAnalysis(full);
    }).catch(() => {});
  }, [song]);

  if (!analysis) {
    if (compact) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-700/50 text-gray-400 text-[10px]">
          <Target className="w-3 h-3" />
          <span>--</span>
        </div>
      );
    }
    return null;
  }

  const { overall, metrics, feedback } = analysis;
  const gradient = getScoreColor(overall);
  const textColor = getScoreTextColor(overall);

  if (compact) {
    return (
      <button
        type="button"
        onClick={(e) => { setExpanded(v => !v); onClick?.(e); }}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r ${gradient} text-white text-[11px] font-bold shadow-lg shadow-black/20 hover:scale-105 transition-transform`}
        title={isZh ? '点击查看详情' : 'Click for details'}
      >
        <Sparkles className="w-3 h-3" />
        <span>{overall}</span>
      </button>
    );
  }

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={(e) => { setExpanded(v => !v); onClick?.(e); }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${gradient} text-white text-sm font-bold shadow-xl shadow-black/30 hover:scale-[1.03] transition-transform`}
      >
        <Target className="w-4 h-4" />
        <span className="tabular-nums">{overall}</span>
        <span className="text-[10px] opacity-80 font-medium">{getScoreLabel(overall, lang)}</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="mt-2 p-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl w-72 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className={`text-xs font-bold ${textColor}`}>
              {isZh ? '6项质量指标' : '6 Quality Metrics'}
            </div>
            <div className="text-[10px] text-gray-500">0-100</div>
          </div>
          <div className="space-y-2">
            {METRIC_KEYS.map(({ key, zh, en }) => {
              const val = metrics[key] ?? 0;
              const label = isZh ? zh : en;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">{label}</span>
                    <span className={`font-bold tabular-nums ${getScoreTextColor(val)}`}>{val}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(val)} transition-all duration-500`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <div className="text-[11px] font-bold text-gray-400">
              {isZh ? '反馈建议' : 'Feedback'}
            </div>
            <ul className="space-y-1">
              {feedback.map((fb, idx) => (
                <li key={idx} className="text-[11px] text-gray-300 leading-relaxed">
                  · {isZh ? fb.zh : fb.en}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
