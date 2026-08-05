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

export default { t, changeLanguage, getCurrentLanguage, translations };
