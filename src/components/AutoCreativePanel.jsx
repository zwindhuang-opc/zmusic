/**
 * AutoCreativePanel — Real-time display of the AI's creative thinking process
 *
 * Shows during AUTO mode: for each song iteration, displays
 *   • theme & inspiration (why this theme was chosen)
 *   • style philosophy (instruments, mood, color)
 *   • lyrics snippet
 *   • musical parameters (BPM, key) with reasoning
 *   • the exact command sent to the platform API
 *
 * This makes the AI's "creative process" transparent to the user,
 * not just a black box that spits out songs.
 *
 * Engine color schemes:
 *   - Muse AI:   Blue/cyan (ocean/creativity)
 *   - Suno AI:   Green/teal (nature/growth)
 *   - Melo AI:   Amber/orange (sunset/warmth)
 */
import React, { useEffect, useRef, useState } from 'react';
import { Brain, X, Sparkles, Music2, Copy, Check, Target } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import StrategySelector from './StrategySelector.jsx';
import { getAutoConfig, setAutoConfig } from '../utils/autoConfig.js';
import { getStrategy } from '../data/creativePresets.js';

const ENGINE_THEMES = {
  'Muse AI': {
    key: 'muse',
    accent: 'blue',
    border: 'border-blue-500/30',
    borderActive: 'border-blue-500/60',
    bg: 'bg-blue-500/5',
    bgActive: 'bg-blue-500/10',
    bgHeader: 'from-blue-500/10 to-cyan-500/10',
    text: 'text-blue-300',
    textSoft: 'text-blue-400/70',
    shadow: 'shadow-blue-900/40',
    dot: 'bg-blue-400',
    iconBg: 'from-blue-500 to-cyan-500',
    iconShadow: 'shadow-blue-500/40',
    thoughtText: 'text-blue-400',
    pulse: 'bg-blue-400',
  },
  'Suno AI': {
    key: 'suno',
    accent: 'green',
    border: 'border-emerald-500/30',
    borderActive: 'border-emerald-500/60',
    bg: 'bg-emerald-500/5',
    bgActive: 'bg-emerald-500/10',
    bgHeader: 'from-emerald-500/10 to-teal-500/10',
    text: 'text-emerald-300',
    textSoft: 'text-emerald-400/70',
    shadow: 'shadow-emerald-900/40',
    dot: 'bg-emerald-400',
    iconBg: 'from-emerald-500 to-teal-500',
    iconShadow: 'shadow-emerald-500/40',
    thoughtText: 'text-emerald-400',
    pulse: 'bg-emerald-400',
  },
  'Melo AI': {
    key: 'melo',
    accent: 'amber',
    border: 'border-amber-500/30',
    borderActive: 'border-amber-500/60',
    bg: 'bg-amber-500/5',
    bgActive: 'bg-amber-500/10',
    bgHeader: 'from-amber-500/10 to-orange-500/10',
    text: 'text-amber-300',
    textSoft: 'text-amber-400/70',
    shadow: 'shadow-amber-900/40',
    dot: 'bg-amber-400',
    iconBg: 'from-amber-500 to-orange-500',
    iconShadow: 'shadow-amber-500/40',
    thoughtText: 'text-amber-400',
    pulse: 'bg-amber-400',
  },
};

const DEFAULT_THEME = {
  key: 'default',
  accent: 'violet',
  border: 'border-violet-500/30',
  borderActive: 'border-violet-500/60',
  bg: 'bg-violet-500/5',
  bgActive: 'bg-violet-500/10',
  bgHeader: 'from-violet-500/10 to-fuchsia-500/10',
  text: 'text-violet-300',
  textSoft: 'text-violet-400/70',
  shadow: 'shadow-violet-900/40',
  dot: 'bg-violet-400',
  iconBg: 'from-violet-500 to-fuchsia-500',
  iconShadow: 'shadow-violet-500/40',
  thoughtText: 'text-violet-400',
  pulse: 'bg-violet-400',
};

export default function AutoCreativePanel({
  open,
  thoughts = [],
  autoRunning = false,
  autoCount = 0,
  engineName = 'AI',
  onClose,
}) {
  const scrollRef = useRef(null);
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const [selectedStrategyId, setSelectedStrategyId] = useState(() => {
    try { return getAutoConfig()?.selectedStrategyId || null; } catch { return null; }
  });
  const [strategyOpen, setStrategyOpen] = useState(false);
  const theme = ENGINE_THEMES[engineName] || DEFAULT_THEME;
  const { t, lang } = useTranslation();
  const isZh = lang === 'zh';

  const handleSelectStrategy = (id) => {
    setSelectedStrategyId(id || null);
    try { setAutoConfig({ selectedStrategyId: id || null }); } catch { }
  };

  const extractThoughtText = (thought) => {
    let text = '';
    if (thought.title) text += `${t('auto.clipboard_title')}${thought.title}\n`;
    if (thought.iteration) text += t('auto.clipboard_iteration', { n: thought.iteration });
    if (thought.summary) text += `${thought.summary}\n`;
    if (thought.detail) text += `${thought.detail}\n`;
    if (thought.sections) {
      thought.sections.forEach(section => {
        if (section.label) text += `\n${section.label}: `;
        if (section.title) text += `${section.title} `;
        if (section.lines) text += `\n${section.lines.join('\n')}`;
      });
    }
    return text.trim();
  };

  const handleCopyThought = async (thought, idx) => {
    const text = extractThoughtText(thought);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(-1), 1500);
    } catch { }
  };

  // Auto-scroll to bottom when new thoughts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts.length]);

  if (!open) return null;

  const latest = thoughts[thoughts.length - 1];

  return (
    <div className={`fixed left-6 top-20 bottom-24 w-[420px] max-w-[calc(100vw-3rem)] z-40 flex flex-col bg-[#0a0a14]/95 backdrop-blur-md border ${theme.border} rounded-2xl shadow-2xl ${theme.shadow} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${theme.border} bg-gradient-to-r ${theme.bgHeader}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.iconBg} flex items-center justify-center ${autoRunning ? 'animate-pulse' : ''} ${theme.iconShadow} shadow-lg`}>
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              {t('auto.creative_thinking_title', { engine: engineName })}
              {autoRunning && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ● LIVE
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-400">
              {t('auto.creative_panel_subtitle', { count: autoCount, thoughts: thoughts.length })}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title={t('auto.collapse_panel')}
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Strategy preset + settings bar */}
      <div className={`px-3 pt-3 pb-2 border-b ${theme.border} bg-gradient-to-r ${theme.bgHeader}`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 mb-0.5 px-1">
            <Target className={`w-3.5 h-3.5 ${theme.thoughtText}`} />
            <span className="text-[10.5px] font-bold text-gray-300">
              {isZh ? '创作策略预设 · 应用到 AUTO 模式' : 'Strategy Preset · Applied to AUTO Mode'}
            </span>
            {selectedStrategyId && (() => {
              const s = getStrategy(selectedStrategyId);
              return s ? (
                <span className="ml-auto inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                  <Check className="w-2.5 h-2.5" />
                  {isZh ? '已应用' : 'Applied'} · {isZh ? s.name?.zh : s.name?.en || s.id}
                </span>
              ) : null;
            })()}
          </div>
          <StrategySelector
            selectedId={selectedStrategyId}
            onSelect={handleSelectStrategy}
            collapsed={!strategyOpen}
            onToggleCollapsed={() => setStrategyOpen(v => !v)}
            compact
          />
        </div>
      </div>

      {/* Thought stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {thoughts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Sparkles className={`w-8 h-8 ${theme.thoughtText}/50 mb-2`} />
            <p className="text-xs text-gray-500">
              {autoRunning
                ? t('auto.thinking_first_song')
                : t('auto.panel_idle_hint')}
            </p>
          </div>
        )}

        {thoughts.map((thought, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-3 transition-all ${idx === thoughts.length - 1
              ? `${theme.borderActive} ${theme.bgActive} shadow-lg ${theme.iconShadow}`
              : 'border-white/5 bg-white/[0.02]'
              }`}
          >
            {/* Iteration header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Music2 className={`w-3.5 h-3.5 ${theme.thoughtText} flex-shrink-0`} />
                <span className={`text-xs font-bold ${theme.text} truncate`}>
                  {thought.iteration ? `${t('auto.iteration_label', { n: thought.iteration })} · ${thought.title}` : thought.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[10px] text-gray-500 font-mono">{thought.timestamp || thought.time}</span>
                <button
                  onClick={() => handleCopyThought(thought, idx)}
                  className={`p-1 rounded transition-colors ${copiedIdx === idx
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-gray-500 hover:text-white hover:bg-white/10'
                    }`}
                  title={t('auto.copy_thought')}
                >
                  {copiedIdx === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Thought sections - handle both formats */}
            <div className="space-y-2">
              {thought.sections && thought.sections.map((section, sIdx) => (
                <div key={sIdx} className="text-[11px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{section.icon}</span>
                    <span className="font-semibold text-gray-300">{section.label}</span>
                    {section.title && (
                      <span className="text-gray-400">· {section.title}</span>
                    )}
                  </div>
                  {section.lines && section.lines.map((line, lIdx) => (
                    <div
                      key={lIdx}
                      className="ml-5 text-gray-400 leading-relaxed whitespace-pre-wrap"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              ))}
              {!thought.sections && thought.summary && (
                <div className="text-[11px] text-gray-300">
                  {thought.summary}
                </div>
              )}
              {!thought.sections && thought.detail && (
                <div className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap mt-1">
                  {thought.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      {autoRunning && latest && (
        <div className={`px-4 py-2 border-t ${theme.border} ${theme.bg}`}>
          <div className={`flex items-center gap-2 text-[10px] ${theme.textSoft}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${theme.pulse} animate-pulse`} />
            {t('auto.sending_to_engine', { title: latest.title, engine: engineName })}
          </div>
        </div>
      )}
    </div>
  );
}