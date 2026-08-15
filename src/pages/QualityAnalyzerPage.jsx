import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Target, ChevronDown, Music, RefreshCw, Settings, AlertTriangle, Wand2 } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import QualityScoreBadge from '../components/QualityScoreBadge.jsx';
import { useQualityGate } from '../hooks/useQualityGate.js';
import { analyzeSong, getScoreColor, getScoreTextColor, getScoreLabel } from '../services/qualityAnalyzer.service.js';

const METRIC_LABELS = [
  { key: 'structural', zhKey: '质量结构', enKey: 'Structural' },
  { key: 'lyricsMatch', zhKey: '歌词匹配', enKey: 'Lyrics Match' },
  { key: 'durationAccuracy', zhKey: '时长精准', enKey: 'Duration Accuracy' },
  { key: 'bpmConsistency', zhKey: 'BPM稳定', enKey: 'BPM Consistency' },
  { key: 'styleMatch', zhKey: '风格匹配', enKey: 'Style Match' },
  { key: 'clarity', zhKey: '清晰度', enKey: 'Clarity' },
];

export default function QualityAnalyzerPage({ onNavigate }) {
  const { t, lang } = useTranslation();
  const isZh = lang === 'zh';
  const { history, setPendingData, showToast } = useGeneration();

  const songList = useMemo(() => history.filter(h =>
    h.type === 'song' || h.type === 'creation_attempt' || h.audioUrl || h.creativeProcess
  ), [history]);

  const [selectedId, setSelectedId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedSong = useMemo(() =>
    songList.find(s => s.id === selectedId) || null,
    [songList, selectedId]
  );

  const { threshold, setThreshold, belowThreshold, autoRegenSuggestedParams } = useQualityGate(selectedSong);

  useEffect(() => {
    if (!selectedSong) { setAnalysis(null); return; }
    setLoading(true);
    analyzeSong(selectedSong).then(res => {
      setAnalysis(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedSong]);

  const handleRegen = () => {
    if (!autoRegenSuggestedParams || !onNavigate) return;
    setPendingData(autoRegenSuggestedParams);
    showToast?.(isZh ? '已载入参数，请在引擎页面点击生成' : 'Params loaded — generate on engine page', 'info');
    onNavigate(autoRegenSuggestedParams.engine || 'muse');
  };

  const thresholdLabels = {
    zh: {
      title: '歌曲质量分析',
      subtitle: '基于6项元数据指标，对生成歌曲进行1-100质量评分与双语反馈',
      select_hint: '从下拉列表选择一首歌曲，或拖拽历史记录卡片到此处',
      dropdown_label: '选择歌曲',
      dropdown_empty: '暂无可分析的歌曲，请先生成歌曲',
      settings_title: '自动重发阈值',
      settings_desc: '若歌曲质量分低于阈值，将建议一键重发优化',
      regen_btn: '一键重发 (相同参数)',
      below_warning: '当前分数低于阈值，建议重发优化',
      score_circle_title: '综合质量分',
      metrics_title: '分项指标',
      feedback_title: '分析反馈',
      overall_score: '综合分',
    },
    en: {
      title: 'Song Quality Analyzer',
      subtitle: '1-100 quality scoring across 6 metadata metrics with bilingual feedback',
      select_hint: 'Select a song from the dropdown or drop a history card here',
      dropdown_label: 'Select a Song',
      dropdown_empty: 'No songs to analyze yet — generate some first',
      settings_title: 'Regenerate Threshold',
      settings_desc: 'If a song falls below this score, suggest one-click regeneration',
      regen_btn: 'Regenerate (same params)',
      below_warning: 'Score is below threshold — regenerate recommended',
      score_circle_title: 'Overall Score',
      metrics_title: 'Breakdown Metrics',
      feedback_title: 'Feedback',
      overall_score: 'Overall',
    },
  };
  const L = thresholdLabels[isZh ? 'zh' : 'en'];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-28">
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {L.title}
                <Target className="w-5 h-5 text-emerald-400" />
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">{L.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400">{L.dropdown_label}</label>
            <div className="relative">
              <select
                value={selectedId || ''}
                onChange={e => setSelectedId(e.target.value || null)}
                className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">— {songList.length ? (isZh ? '选择...' : 'Select...') : L.dropdown_empty} —</option>
                {songList.slice(0, 100).map(s => {
                  const proc = s.creativeProcess || {};
                  const engine = (proc.engine || s.engine || 'song').toString().slice(0, 8);
                  const title = s.title || proc.snapshot?.title || (isZh ? '未命名歌曲' : 'Untitled');
                  const date = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '';
                  return (
                    <option key={s.id} value={s.id}>
                      [{engine}] {title} {date ? `(${date})` : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
            {songList.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
                <Music className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{L.dropdown_empty}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-bold text-gray-400">{L.settings_title}</label>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/10 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  {isZh ? `自动重发阈值 (30-80)` : `Regenerate threshold (30-80)`}
                </span>
                <span className={`font-bold text-lg tabular-nums ${getScoreTextColor(threshold)}`}>
                  {threshold}
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={80}
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                className="w-full accent-emerald-500"
              />
              <p className="text-[11px] text-gray-500 leading-relaxed">{L.settings_desc}</p>
            </div>
          </div>
        </div>
      </div>

      {!selectedSong && (
        <div className="gradient-border p-10 text-center border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Sparkles className="w-8 h-8 text-emerald-400 opacity-60" />
          </div>
          <p className="text-gray-400 text-sm">{L.select_hint}</p>
        </div>
      )}

      {selectedSong && (
        <div className="space-y-6">
          <div className="gradient-border p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative flex-shrink-0">
                <div className={`w-44 h-44 rounded-full bg-gradient-to-br ${getScoreColor(analysis?.overall || 0)} p-1 shadow-2xl`}>
                  <div className="w-full h-full rounded-full bg-[#0a0a14] flex flex-col items-center justify-center">
                    {loading ? (
                      <RefreshCw className="w-10 h-10 text-gray-500 animate-spin" />
                    ) : (
                      <>
                        <div className={`text-[11px] font-bold uppercase tracking-wider ${getScoreTextColor(analysis?.overall || 0)} opacity-70`}>
                          {L.score_circle_title}
                        </div>
                        <div className={`text-6xl font-black tabular-nums mt-1 bg-gradient-to-r ${getScoreColor(analysis?.overall || 0)} bg-clip-text text-transparent`}>
                          {analysis?.overall ?? '--'}
                        </div>
                        <div className={`text-sm font-bold mt-1 ${getScoreTextColor(analysis?.overall || 0)}`}>
                          {analysis ? getScoreLabel(analysis.overall, lang) : ''}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white truncate">
                    {selectedSong.title || selectedSong.creativeProcess?.snapshot?.title || (isZh ? '未命名歌曲' : 'Untitled')}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px]">
                      {(selectedSong.creativeProcess?.engine || selectedSong.engine || 'Song').toString()}
                    </span>
                    {selectedSong.createdAt && (
                      <span>{new Date(selectedSong.createdAt).toLocaleString()}</span>
                    )}
                    <QualityScoreBadge song={selectedSong} compact />
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {METRIC_LABELS.map(({ key, zhKey, enKey }) => {
                    const val = analysis?.metrics?.[key] ?? 0;
                    const label = isZh ? zhKey : enKey;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-400">{label}</span>
                          <span className={`font-bold tabular-nums ${getScoreTextColor(val)}`}>{val}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(val)} transition-all duration-700`}
                            style={{ width: loading ? '20%' : `${val}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {belowThreshold && analysis && (
                  <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-amber-300 font-medium">{L.below_warning}</p>
                      {autoRegenSuggestedParams && onNavigate && (
                        <button
                          onClick={handleRegen}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold hover:scale-[1.02] transition-transform"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          {L.regen_btn}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {analysis && analysis.feedback && analysis.feedback.length > 0 && (
            <div className="gradient-border p-4 md:p-6">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                {L.feedback_title}
              </h3>
              <ul className="grid md:grid-cols-2 gap-2">
                {analysis.feedback.map((fb, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-black/30 border border-white/5 text-sm space-y-0.5"
                  >
                    <div className="text-gray-200">{fb.zh}</div>
                    <div className="text-[11px] text-gray-500">{fb.en}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
