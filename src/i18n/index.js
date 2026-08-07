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
 * Core translation function.
 * Always returns the translated value if found, or the raw key string if not.
 * Check with `t(key) !== key` to know if a translation was found.
 */
export function t(key, vars, lang) {
  const targetLang = lang || currentLang;
  const parts = key.split('.');
  let value = translations[targetLang] || translations.zh;
  for (const part of parts) {
    value = value?.[part];
  }
  if (value === undefined || value === null) {
    let fallbackValue = translations.zh;
    for (const part of parts) {
      fallbackValue = fallbackValue?.[part];
    }
    if (fallbackValue === undefined || fallbackValue === null) {
      return key;
    }
    return interpolate(fallbackValue, vars);
  }
  return interpolate(value, vars);
}

/**
 * Safe translation: returns translated string ONLY if found.
 * Returns null when key is not found (instead of raw key).
 * Use this instead of `t(key) || fallback` to avoid truthy-key bugs.
 */
export function ts(key, vars, lang) {
  const v = t(key, vars, lang);
  return v !== key ? v : null;
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
