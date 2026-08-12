/**
 * BrandIcons - Inline SVG brand icons for Muse, Suno, Melo
 * These are simplified representations of each platform's brand identity
 */

export function MuseIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Muse AI">
      <defs>
        <linearGradient id="museGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2196F3" />
          <stop offset="100%" stopColor="#00BCD4" />
        </linearGradient>
      </defs>
      {/* Headphones band */}
      <path d="M28 72 C28 44 44 28 64 28 C84 28 100 44 100 72" stroke="url(#museGradIcon)" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* Left ear cup */}
      <rect x="20" y="68" width="16" height="28" rx="8" fill="url(#museGradIcon)" />
      {/* Right ear cup */}
      <rect x="92" y="68" width="16" height="28" rx="8" fill="url(#museGradIcon)" />
      {/* Music note */}
      <circle cx="56" cy="88" r="9" fill="url(#museGradIcon)" />
      <path d="M65 88 L65 52 L80 48 L80 56 L65 60" stroke="url(#museGradIcon)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function SunoIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Suno AI">
      <defs>
        <linearGradient id="sunoGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="100%" stopColor="#F7931E" />
        </linearGradient>
      </defs>
      {/* Sun rays */}
      <g stroke="url(#sunoGradIcon)" strokeWidth="6" strokeLinecap="round">
        <line x1="64" y1="12" x2="64" y2="26" />
        <line x1="36" y1="24" x2="42" y2="36" />
        <line x1="92" y1="24" x2="86" y2="36" />
        <line x1="20" y1="48" x2="32" y2="52" />
        <line x1="108" y1="48" x2="96" y2="52" />
      </g>
      {/* Sun body */}
      <circle cx="64" cy="52" r="20" fill="url(#sunoGradIcon)" />
      {/* Sound waves */}
      <g fill="url(#sunoGradIcon)">
        <rect x="34" y="88" width="8" height="20" rx="4" />
        <rect x="50" y="82" width="8" height="32" rx="4" />
        <rect x="66" y="76" width="8" height="44" rx="4" />
        <rect x="82" y="84" width="8" height="28" rx="4" />
      </g>
    </svg>
  );
}

export function MeloIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Melo AI">
      <defs>
        <linearGradient id="meloGradIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      {/* Music note */}
      <circle cx="40" cy="92" r="12" fill="url(#meloGradIcon)" />
      <path d="M52 92 L52 36 L88 28 L88 40 L52 48" stroke="url(#meloGradIcon)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Waveform bars */}
      <g fill="url(#meloGradIcon)">
        <rect x="66" y="72" width="6" height="20" rx="3" />
        <rect x="78" y="64" width="6" height="36" rx="3" />
        <rect x="90" y="76" width="6" height="24" rx="3" />
        <rect x="102" y="68" width="6" height="40" rx="3" />
      </g>
    </svg>
  );
}
