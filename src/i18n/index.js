import zhTranslations from './locales/zh.json';
import enTranslations from './locales/en.json';

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
 * Resolution order:
 *   1. translations[targetLang] → value
 *   2. translations.zh (fallback) → value
 *   3. humanized last-segment label (never returns raw dot/underscore keys)
 * Check with `t(key) !== key` → it is always true now; use ts() for null-on-miss instead.
 */
export function t(key, vars, lang) {
  if (!key) return '';
  const targetLang = lang || currentLang;
  const parts = key.split('.');
  const value = resolveKey(translations[targetLang] || translations.zh, parts);
  if (value !== undefined && value !== null) {
    return interpolate(value, vars);
  }
  const fallbackValue = resolveKey(translations.zh, parts);
  if (fallbackValue !== undefined && fallbackValue !== null) {
    return interpolate(fallbackValue, vars);
  }
  return humanizeFallback(key);
}

/**
 * Safe translation: returns translated string ONLY if found.
 * Returns null when key is not found (instead of raw key).
 * Use this instead of `t(key) || fallback` to avoid truthy-key bugs.
 */
export function ts(key, vars, lang) {
  if (!key) return null;
  const targetLang = lang || currentLang;
  const parts = key.split('.');
  const value = resolveKey(translations[targetLang] || translations.zh, parts);
  if (value !== undefined && value !== null) {
    return interpolate(value, vars);
  }
  const fallbackValue = resolveKey(translations.zh, parts);
  if (fallbackValue !== undefined && fallbackValue !== null) {
    return interpolate(fallbackValue, vars);
  }
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
