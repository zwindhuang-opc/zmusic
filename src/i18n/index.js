import zhTranslations from './locales/zh.json' with { type: 'json' };
import enTranslations from './locales/en.json' with { type: 'json' };

const translations = {
  zh: zhTranslations,
  en: enTranslations
};

let currentLang = typeof localStorage !== 'undefined' ? (localStorage.getItem('zmusic-lang') || 'zh') : 'zh';

function interpolate(str, vars) {
  if (!vars || typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

/**
 * Resolve a dot-notation key against a translations object tree.
 * Returns the leaf value (string), or undefined if any segment is missing.
 */
function resolveKey(root, parts) {
  let node = root;
  for (const p of parts) {
    if (node === null || node === undefined) return undefined;
    node = node[p];
  }
  return node;
}

/**
 * Produce a human-readable fallback label for a missing translation key.
 * The last segment of the dot-notation key is turned into Title Case
 * (underscores → spaces) so the UI stays usable instead of showing raw keys.
 */
function humanizeFallback(key) {
  if (!key) return '';
  const last = key.includes('.') ? key.slice(key.lastIndexOf('.') + 1) : key;
  return last
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Core translation function.
 *
 * IMPORTANT: The fallback chain respects the TARGET language to avoid
 * showing mixed Chinese/English text.
 *
 * Resolution order:
 *   1. translations[targetLang] → value
 *   2. If targetLang === 'en' → STOP: use humanizeFallback (English)
 *      If targetLang === 'zh' → translations.zh fallback (Chinese)
 *      If targetLang === other → translations.en → humanize
 *   3. humanized last-segment label (never returns raw dot/underscore keys)
 *
 * The previous behavior always fell back to zh.json for ANY missing key,
 * which caused "Chinese text in English mode" when a key existed in zh.json
 * but not in en.json.
 *
 * Check with `t(key) !== key` → it is always true now; use ts() for null-on-miss instead.
 */
export function t(key, vars, lang) {
  if (!key) return '';
  const targetLang = lang || currentLang;
  const parts = key.split('.');

  // Step 1: Try target language directly
  const value = resolveKey(translations[targetLang], parts);
  if (value !== undefined && value !== null) {
    return interpolate(value, vars);
  }

  // Step 2: Language-aware fallback
  //    English mode → NEVER fall back to Chinese; use humanizeFallback immediately
  //    Chinese mode → zh is already target; if missing, also humanize (keys should be in zh)
  //    Other modes → try en first, then humanize
  if (targetLang === 'en') {
    // Try en one more time (same as above — already tried, skip), then humanize
    return humanizeFallback(key);
  }

  if (targetLang !== 'zh') {
    const enFallback = resolveKey(translations.en, parts);
    if (enFallback !== undefined && enFallback !== null) {
      return interpolate(enFallback, vars);
    }
  }

  // For zh: only reach here if key not in zh.json → humanize
  return humanizeFallback(key);
}

/**
 * Safe translation: returns translated string ONLY if found.
 * Returns null when key is not found (instead of raw key).
 * Use this instead of `t(key) || fallback` to avoid truthy-key bugs.
 *
 * Same language-aware fallback as t() but returns null instead of humanizing.
 */
export function ts(key, vars, lang) {
  if (!key) return null;
  const targetLang = lang || currentLang;
  const parts = key.split('.');

  // Step 1: Try target language
  const value = resolveKey(translations[targetLang], parts);
  if (value !== undefined && value !== null) {
    return interpolate(value, vars);
  }

  // Step 2: Language-aware second chance (only for non-English/non-Chinese)
  if (targetLang !== 'en' && targetLang !== 'zh') {
    const enFallback = resolveKey(translations.en, parts);
    if (enFallback !== undefined && enFallback !== null) {
      return interpolate(enFallback, vars);
    }
    const zhFallback = resolveKey(translations.zh, parts);
    if (zhFallback !== undefined && zhFallback !== null) {
      return interpolate(zhFallback, vars);
    }
  }

  // Explicitly return null — no cross-language mixing
  return null;
}

/**
 * Translate a raw vision/analysis key by trying ALL known categories in order.
 * This is the single entry-point for translating vision-analysis output.
 *
 * @param {string} raw - The raw key from visionAnalyzer (e.g. 'tango', 'pet_love')
 * @param {string[]} preferredCategories - Optional priority categories
 * @param {string} lang - Override language (default: current)
 * @returns {string} Translated label, or raw string if no translation found
 */
const VISION_CATEGORIES = [
  'lyrics_styles',
  'lyrics_themes',
  'styles',
  'themes',
  'styles_extra',
  'themes_extra',
  'vision_scenes',
  'emotions',
  'subjects',
  'actions',
  'locations',
  'imagery',
];

export function tr(raw, preferredCategories = [], lang) {
  if (!raw || typeof raw !== 'string') return raw || '';
  const chain = [...preferredCategories, ...VISION_CATEGORIES];
  for (const cat of chain) {
    const key = `${cat}.${raw}`;
    const v = t(key, undefined, lang);
    if (v !== key) return v;
  }
  return raw;
}

export function changeLanguage(lng) {
  currentLang = lng;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('zmusic-lang', lng);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('languageChanged'));
  }
}

export function getCurrentLanguage() {
  return currentLang;
}

export default { t, ts, tr, changeLanguage, getCurrentLanguage, translations };
