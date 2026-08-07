import React from 'react';
import { Headphones, Cloud, Zap } from 'lucide-react';

/**
 * MVEngineSelector — three-card engine picker (Muse / Suno / Preview).
 * All labels are driven by i18n through the `t` prop so both EN and ZH
 * surfaces render consistently without bilingual mixing.
 */
const MV_ENGINES = [
  {
    id: 'muse',
    labelKey: 'mv.engine_muse',
    icon: Headphones,
    descKey: 'mv.engine_real_desc',
    creditKey: 'mv.engine_muse_credits',
    color: 'from-fuchsia-500 to-purple-500',
  },
  {
    id: 'suno',
    labelKey: 'mv.engine_suno',
    icon: Cloud,
    descKey: 'mv.engine_real_desc',
    color: 'from-sky-500 to-violet-500',
  },
  {
    id: 'procedural',
    labelKey: 'mv.engine_preview',
    icon: Zap,
    descKey: 'mv.engine_preview_desc',
    color: 'from-gray-500 to-gray-600',
  },
];

function MVEngineSelector({ engine, museCredits, museAvailable, sunoAvailable, onEngineChange, t }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-300 mb-2 block">{t ? t('music.engine') || 'Music Engine' : 'Music Engine'}</label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {MV_ENGINES.map(e => {
          const isAvailable = e.id === 'muse' ? museAvailable : e.id === 'suno' ? sunoAvailable : true;
          const isInsufficient = e.id === 'muse' && museCredits !== null && museCredits < 14;
          const disabled = !isAvailable || isInsufficient;

          const label = t ? (t(e.labelKey) || e.id) : MV_ENGINES_LEGACY_LABEL(e.id);
          let desc = t ? (t(e.descKey) || '') : MV_ENGINES_LEGACY_DESC(e.id);
          if (e.id === 'muse' && t) {
            const creditSuffix = t('mv.engine_muse_credits') || '(14 credits)';
            desc = `${desc} ${creditSuffix}`;
          }

          return (
            <button
              key={e.id}
              onClick={() => onEngineChange(e.id)}
              disabled={disabled}
              className={`p-3 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${engine === e.id
                ? 'border-cyan-400/50 bg-gradient-to-br ' + e.color + ' text-white'
                : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <e.icon className="w-4 h-4" />
                <span className="text-sm font-semibold">{label}</span>
                {e.id === 'muse' && museCredits !== null && (
                  <span className="ml-auto text-[10px] opacity-70">{museCredits}cr</span>
                )}
              </div>
              <div className="text-[10px] opacity-80">{desc}</div>
              {!isAvailable && (
                <div className="text-[10px] text-red-300 mt-1">{t ? t('mv.engine_not_configured') || 'Not configured' : 'Not configured'}</div>
              )}
              {isInsufficient && (
                <div className="text-[10px] text-yellow-300 mt-1">
                  {t ? (t('mv.need_credits') || 'Need 14+ credits') : 'Need 14+ credits'}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Legacy fallbacks (used only when `t` is not injected). */
function MV_ENGINES_LEGACY_LABEL(id) {
  if (id === 'muse') return 'Muse AI';
  if (id === 'suno') return 'Suno AI';
  return 'Preview (Free)';
}
function MV_ENGINES_LEGACY_DESC(id) {
  if (id === 'muse') return 'Real song + vocals (14 credits)';
  if (id === 'suno') return 'Real song + vocals (credits)';
  return 'Synthetic preview music, no vocals';
}

export default MVEngineSelector;
