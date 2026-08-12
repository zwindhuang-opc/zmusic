import React from 'react';
import { CREATIVE_STRATEGIES } from '../data/creativePresets.js';
import { Lightbulb, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';

/**
 * Strategy Selector for Enhanced AUTO Mode
 * Displays 10 creative strategy cards; clicking selects (or unselects) one.
 * The selected strategy is applied during AUTO generation to steer the AI output.
 */
export default function StrategySelector({
  selectedId = null,
  onSelect,
  collapsed = true,
  onToggleCollapsed,
}) {
  const { lang } = useTranslation();
  const isZh = lang === 'zh';

  const pickName = (n) => (isZh ? n?.zh : n?.en);
  const pickDesc = (d) => (isZh ? d?.zh : d?.en);

  const strategyLabels = {
    zh: {
      title: '创作策略预设',
      subtitle: '选择一种音乐人格，AUTO 模式会按此偏好生成',
      default_hint: '未选择 — 使用随机平衡模式',
      bpm_label: 'BPM',
      duration_label: '时长',
      complexity_melody: '旋律',
      complexity_lyrics: '歌词',
    },
    en: {
      title: 'Creative Strategy Presets',
      subtitle: 'Pick a musical personality — AUTO mode will follow it',
      default_hint: 'None — balanced random defaults',
      bpm_label: 'BPM',
      duration_label: 'Dur',
      complexity_melody: 'Mel',
      complexity_lyrics: 'Lyr',
    },
  };
  const L = strategyLabels[isZh ? 'zh' : 'en'];

  return (
    <div className="rounded-xl bg-gradient-to-br from-violet-500/8 via-fuchsia-500/5 to-pink-500/8 border border-violet-500/20 overflow-hidden">
      {/* Header bar */}
      <div
        className="flex items-center justify-between gap-2 p-3 cursor-pointer"
        onClick={onToggleCollapsed}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-fuchsia-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] md:text-sm font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              {L.title}
              {selectedId && (
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gradient-to-r ${CREATIVE_STRATEGIES.find(s => s.id === selectedId)?.color || 'from-gray-500 to-gray-700'} text-white`}>
                  {pickName(CREATIVE_STRATEGIES.find(s => s.id === selectedId)?.name)}
                </span>
              )}
            </div>
            <div className="text-[10px] md:text-[11px] text-gray-500 truncate">
              {selectedId ? pickDesc(CREATIVE_STRATEGIES.find(s => s.id === selectedId)?.description) : L.subtitle}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 text-gray-400">
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-3 pb-3 pt-1 space-y-2">
          {/* Quick reset */}
          {selectedId && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect?.(null); }}
              className="w-full text-[11px] text-gray-400 hover:text-white bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg py-1.5 transition-colors"
            >
              × {L.default_hint}（清除预设）
            </button>
          )}

          {/* Grid of strategy cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {CREATIVE_STRATEGIES.map(s => {
              const active = selectedId === s.id;
              const avgBpm = Math.round((s.bpmRange[0] + s.bpmRange[1]) / 2);
              return (
                <button
                  key={s.id}
                  onClick={(e) => { e.stopPropagation(); onSelect?.(active ? null : s.id); }}
                  className={`group relative text-left p-2 md:p-2.5 rounded-xl border transition-all overflow-hidden ${active
                    ? 'border-transparent shadow-xl scale-[1.02]'
                    : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/15'
                    }`}
                >
                  {/* Gradient background when active */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.color} transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-[0.06]'}`} />
                  <div className="relative">
                    {/* Top row: icon + name */}
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-xl md:text-2xl leading-none">{s.icon}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                        {s.tag}
                      </span>
                    </div>

                    {/* Name */}
                    <div className={`text-[12px] md:text-[13px] font-bold mb-0.5 ${active ? 'text-white' : 'text-gray-100'}`}>
                      {pickName(s.name)}
                    </div>

                    {/* Quick meta */}
                    <div className={`text-[9.5px] md:text-[10px] space-y-0.5 ${active ? 'text-white/90' : 'text-gray-500'}`}>
                      <div className="flex items-center gap-2 font-mono">
                        <span>{L.bpm_label} {avgBpm}</span>
                        <span>·</span>
                        <span>{L.duration_label} {Math.round(s.defaultDuration / 60)}m</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{L.complexity_melody} {'■'.repeat(Math.min(5, Math.ceil(s.melodicComplexity / 2)))}{'·'.repeat(5 - Math.min(5, Math.ceil(s.melodicComplexity / 2)))}</span>
                        <span>·</span>
                        <span>{L.complexity_lyrics} {'■'.repeat(Math.min(5, Math.ceil(s.lyricComplexity / 2)))}{'·'.repeat(5 - Math.min(5, Math.ceil(s.lyricComplexity / 2)))}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}