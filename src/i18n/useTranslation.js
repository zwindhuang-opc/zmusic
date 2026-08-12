import React, { useState, useEffect } from 'react';
import { t, ts, tr, changeLanguage, getCurrentLanguage } from './index.js';

export function useTranslation() {
    const [lang, setLang] = useState(getCurrentLanguage());

    useEffect(() => {
        const handleLanguageChange = () => setLang(getCurrentLanguage());
        if (typeof window !== 'undefined') {
            window.addEventListener('languageChanged', handleLanguageChange);
            return () => window.removeEventListener('languageChanged', handleLanguageChange);
        }
    }, []);

    return {
        t: (key, vars) => t(key, vars, lang),
        ts: (key, vars) => ts(key, vars, lang),
        tr: (raw, preferredCategories) => tr(raw, preferredCategories, lang),
        i18n: { language: lang, changeLanguage },
        lang,
        currentLang: lang,
    };
}

export default { useTranslation };
