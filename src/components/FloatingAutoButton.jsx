import { useState, useRef, useEffect } from 'react';
import { Zap, ChevronDown, X } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';

/**
 * FloatingAutoButton — global floating "AUTO" launcher.
 *
 * Visible on every page. Clicking opens a compact menu of all AUTO-capable
 * engines (music: muse/suno/melo; MV: mv-muse/mv-suno/mv-melo). Picking one:
 *   1. writes a pending-auto flag to sessionStorage (for pages not yet mounted)
 *   2. dispatches a `zmusic:auto-start` window event (for already-mounted pages)
 *   3. navigates to the target page
 * Each AUTO page listens for the event / checks the pending flag on mount and
 * calls its own startAutoGeneration() — no confirmation modal, one-click start.
 */

const AUTO_TARGETS = [
  { pageId: 'muse', platform: 'muse', labelKey: 'nav.muse', group: 'music' },
  { pageId: 'suno', platform: 'suno', labelKey: 'nav.suno', group: 'music' },
  { pageId: 'melo', platform: 'melo', labelKey: 'nav.melo', group: 'music' },
  { pageId: 'mv-muse', platform: 'mv-muse', labelKey: 'nav.mv_muse', group: 'mv' },
  { pageId: 'mv-suno', platform: 'mv-suno', labelKey: 'nav.mv_suno', group: 'mv' },
  { pageId: 'mv-melo', platform: 'mv-melo', labelKey: 'nav.mv_melo', group: 'mv' },
];

export default function FloatingAutoButton({ onNavigate, currentPage }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the menu when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const launchAuto = (target) => {
    setOpen(false);
    // Skip if already on the target page — the event alone is enough
    const alreadyThere = currentPage === target.pageId;
    if (!alreadyThere) {
      // Pending flag: consumed by the page itself right after mount
      try {
        sessionStorage.setItem('zmusic-pending-auto', target.platform);
      } catch { /* sessionStorage unavailable — event fallback still works */ }
      onNavigate(target.pageId);
    }
    // Notify any already-mounted page immediately
    window.dispatchEvent(new CustomEvent('zmusic:auto-start', {
      detail: { platform: target.platform },
    }));
  };

  const musicTargets = AUTO_TARGETS.filter((x) => x.group === 'music');
  const mvTargets = AUTO_TARGETS.filter((x) => x.group === 'mv');

  return (
    <div className="fixed right-6 bottom-44 md:bottom-28 z-50" ref={menuRef}>
      {open && (
        <div className="absolute bottom-16 right-0 w-48 glass rounded-2xl border border-purple-500/20 shadow-2xl overflow-hidden animate-slide-up">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/10">
            <span className="text-xs font-semibold text-violet-300">{t('floatingAuto.title')}</span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-white transition-colors"
              aria-label="close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="py-1.5">
            <p className="px-4 pt-1 pb-0.5 text-[10px] uppercase tracking-wider text-gray-500">{t('floatingAuto.music')}</p>
            {musicTargets.map((x) => (
              <button
                key={x.pageId}
                onClick={() => launchAuto(x)}
                className="w-full px-4 py-2 flex items-center gap-2.5 text-sm text-gray-200 hover:bg-violet-500/15 hover:text-white transition-colors text-left"
              >
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                {t(x.labelKey)}
              </button>
            ))}
            <p className="px-4 pt-2 pb-0.5 text-[10px] uppercase tracking-wider text-gray-500">{t('floatingAuto.mv')}</p>
            {mvTargets.map((x) => (
              <button
                key={x.pageId}
                onClick={() => launchAuto(x)}
                className="w-full px-4 py-2 flex items-center gap-2.5 text-sm text-gray-200 hover:bg-violet-500/15 hover:text-white transition-colors text-left"
              >
                <Zap className="w-3.5 h-3.5 text-pink-400" />
                {t(x.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        title={t('floatingAuto.title')}
        aria-label={t('floatingAuto.title')}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 z-50 ${
          open
            ? 'bg-gradient-to-r from-pink-500 to-violet-500 shadow-pink-500/30 rotate-6'
            : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30'
        }`}
      >
        {open ? <ChevronDown className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
      </button>
    </div>
  );
}
