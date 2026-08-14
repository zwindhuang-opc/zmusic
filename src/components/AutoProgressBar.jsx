import React from 'react';
import { Brain, X, Play, Pause, Music2, Clock, AlertTriangle, CheckCircle, Loader2, ChevronDown, ChevronUp, History } from 'lucide-react';
import { useAutoProgress } from '../contexts/AutoProgressContext.jsx';
import { useGeneration } from '../stores/generationStore.jsx';
import { useTranslation } from '../i18n/useTranslation.js';

const ENGINE_THEMES = {
  muse: {
    accent: 'blue',
    bg: 'from-blue-500/20 to-cyan-500/20',
    bar: 'bg-blue-400',
    text: 'text-blue-300',
    textSoft: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
    iconText: 'text-blue-300',
  },
  suno: {
    accent: 'green',
    bg: 'from-emerald-500/20 to-teal-500/20',
    bar: 'bg-emerald-400',
    text: 'text-emerald-300',
    textSoft: 'text-emerald-400',
    iconBg: 'bg-emerald-500/20',
    iconText: 'text-emerald-300',
  },
  melo: {
    accent: 'amber',
    bg: 'from-amber-500/20 to-orange-500/20',
    bar: 'bg-amber-400',
    text: 'text-amber-300',
    textSoft: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
    iconText: 'text-amber-300',
  },
};

export default function AutoProgressBar() {
  const ctx = useAutoProgress();
  const { history } = useGeneration();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = React.useState(false);

  if (!ctx.active) return null;

  const {
    engineName, phase, countdownSec, totalCountdown,
    autoCount, lastTitle, lastError, lastThought,
    statusMessage, startedAt, engine,
  } = ctx;

  const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;

  const engineTheme = ENGINE_THEMES[engine] || {
    accent: 'violet',
    bg: 'from-violet-500/20 to-purple-500/20',
    bar: 'bg-violet-400',
    text: 'text-violet-300',
    textSoft: 'text-violet-400',
    iconBg: 'bg-violet-500/20',
    iconText: 'text-violet-300',
  };

  const phaseConfig = {
    idle: { icon: Pause, color: 'text-gray-400', bg: 'from-gray-500/20 to-gray-600/20', bar: 'bg-gray-500', label: t('auto.phase_idle') },
    countdown: { icon: Clock, color: engineTheme.text, bg: engineTheme.bg, bar: engineTheme.bar, label: t('auto.phase_countdown') },
    generating: { icon: Loader2, color: 'text-amber-300', bg: 'from-amber-500/20 to-orange-500/20', bar: 'bg-amber-400 animate-pulse', label: t('auto.phase_generating') },
    complete: { icon: CheckCircle, color: 'text-emerald-300', bg: 'from-emerald-500/20 to-green-500/20', bar: 'bg-emerald-400', label: t('auto.phase_complete') },
    failed: { icon: AlertTriangle, color: 'text-red-300', bg: 'from-red-500/20 to-rose-500/20', bar: 'bg-red-400', label: t('auto.phase_failed') },
    stopped: { icon: Pause, color: 'text-gray-300', bg: 'from-gray-500/20 to-gray-600/20', bar: 'bg-gray-400', label: t('auto.phase_stopped') },
  };

  const cfg = phaseConfig[phase] || phaseConfig.idle;
  const Icon = cfg.icon;

  const progressPct = phase === 'countdown'
    ? ((totalCountdown - countdownSec) / totalCountdown) * 100
    : phase === 'generating'
      ? 80
      : phase === 'complete'
        ? 100
        : phase === 'failed'
          ? 100
          : 0;

  const latestHistory = history.slice(0, 3);

  return (
    <div className="fixed bottom-4 right-4 z-[200] w-[380px] max-w-[calc(100vw-2rem)] animate-slide-in">
      <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${cfg.bg} backdrop-blur-xl shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
          <div className={`w-8 h-8 rounded-lg ${engineTheme.iconBg} flex items-center justify-center ${cfg.color}`}>
            <Icon className={`w-4 h-4 ${phase === 'generating' ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white truncate">{engineName} AUTO</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 ${cfg.color}`}>
                {cfg.label}
              </span>
              {autoCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {t('auto.song_count_short', { count: autoCount })}
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-400 truncate">
              {statusMessage}
            </div>
          </div>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            {collapsed
              ? <ChevronDown className="w-4 h-4 text-gray-400" />
              : <ChevronUp className="w-4 h-4 text-gray-400" />
            }
          </button>
          <button
            onClick={() => { ctx.stopProgress(); setTimeout(() => ctx.resetProgress(), 3000); }}
            className="p-1 rounded-lg hover:bg-red-500/20 transition-colors"
            title={t('auto.close_indicator')}
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-2">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${cfg.bar} transition-all duration-500 rounded-full`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400">
            <span>
              {phase === 'countdown' && `⏱ ${countdownSec}s`}
              {phase === 'generating' && t('auto.status_generating')}
              {phase === 'complete' && t('auto.status_complete')}
              {phase === 'failed' && t('auto.status_failed')}
              {phase === 'stopped' && t('auto.status_stopped')}
            </span>
            <span>{elapsed}s</span>
          </div>
        </div>

        {/* Expanded details */}
        {!collapsed && (
          <>
            {/* Latest thought / title */}
            <div className="px-4 pb-2">
              {lastTitle && (
                <div className="flex items-center gap-2 text-xs text-white">
                  <Music2 className={`w-3.5 h-3.5 ${engineTheme.textSoft}`} />
                  <span className="font-medium truncate">{lastTitle}</span>
                </div>
              )}
              {lastThought && (
                <div className="mt-1 text-[10px] text-gray-400 line-clamp-2">
                  {lastThought.summary || lastThought.title || ''}
                </div>
              )}
              {lastError && (
                <div className="mt-1 text-[10px] text-red-300 bg-red-500/10 p-1.5 rounded">
                  ❌ {lastError}
                </div>
              )}
            </div>

            {/* Recent history */}
            {latestHistory.length > 0 && (
              <div className="px-4 pb-3 border-t border-white/10 pt-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <History className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] text-gray-500 font-medium">{t('auto.recent_history')}</span>
                </div>
                <div className="space-y-1">
                  {latestHistory.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 text-[10px]">
                      <span className={`w-1.5 h-1.5 rounded-full ${h.status === 'success' ? 'bg-emerald-400' :
                        h.status === 'failed' ? 'bg-red-400' : 'bg-gray-400'
                        }`} />
                      <span className={`truncate ${h.status === 'failed' ? 'text-red-300' : 'text-gray-300'}`}>
                        {h.title}
                      </span>
                      <span className="text-gray-500 ml-auto">
                        {new Date(h.createdAt).toLocaleTimeString('zh-CN', { hour12: false })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}