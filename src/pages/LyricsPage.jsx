import React, { useState, useEffect, useMemo } from 'react';
import { Mic, Sparkles, Loader, FileText, Cpu, Network, BookOpen, Settings as SettingsIcon, Wand2, Clock, Music2, User, History, Copy, Music, Video, AlertCircle, Search, ChevronDown, ChevronRight, Sliders, Palette, Layers, Image as ImageIcon, Upload, X, Check } from 'lucide-react';
import { useTranslation } from '../i18n/index.js';
import api, { isMobileEnvironment } from '../services/api.client.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { generateLyrics } from '../utils/lyricsEngine.js';
import HistoryPanel from '../components/HistoryPanel.jsx';
import { LYRICS_STYLES, LYRICS_THEMES } from '../config/lyricsStyles.js';

/**
 * Style categories - groups 30 styles into 5 logical categories for cleaner UI.
 * Users can expand/collapse each category instead of seeing all 30 buttons at once.
 */
const STYLE_CATEGORIES = {
  emotional: ['heartbreaking', 'healing', 'romantic', 'love_song', 'ballad', 'nostalgic'],
  modern: ['pop', 'rock', 'electronic', 'hip_hop', 'modern', 'indie', 'kpop', 'reggae'],
  classical: ['ancient', 'chinese_traditional', 'chinese_classical', 'classical', 'folk'],
  atmospheric: ['dark', 'dreamy', 'ambient', 'jazz', 'rnb', 'country', 'gothic_rock'],
  special: ['time_travel', 'epic', 'energetic', 'tango', 'ancient_modern']
};

/**
 * Theme categories - groups 30 themes into 5 logical categories for cleaner UI.
 */
const THEME_CATEGORIES = {
  emotional: ['heartbreak', 'healing', 'love', 'sadness', 'loneliness', 'hope'],
  story: ['time_travel', 'epic_journey', 'dark_mystery', 'ancient_legend', 'indie_story', 'folk_tale'],
  mood: ['romantic_night', 'nostalgic_memory', 'energetic_party', 'dreamy_fantasy', 'modern_city'],
  nature: ['nature', 'summer_vibes', 'winter_solitude', 'spring_awakening', 'autumn_melancholy', 'ocean_dreams'],
  life: ['life', 'memory', 'friendship', 'success', 'dreams', 'lunatic', 'tango']
};

function LyricsPage({ onNavigate }) {
  const { t } = useTranslation();
  const { addToHistory, copyToClipboard, setPendingLyrics } = useGeneration();

  const FALLBACK_GENRES = Object.keys(LYRICS_STYLES);
  const FALLBACK_THEMES = Object.keys(LYRICS_THEMES);

  const METHODS = [
    { id: 'fsm', name: t('lyrics.fsm_name'), desc: t('lyrics.fsm_desc'), icon: Cpu },
    { id: 'network_layer', name: t('lyrics.network_name'), desc: t('lyrics.network_desc'), icon: Network },
    { id: 'muse', name: t('lyrics.muse_name'), desc: t('lyrics.muse_desc'), icon: BookOpen },
    { id: 'suno', name: t('lyrics.suno_name'), desc: t('lyrics.suno_desc'), icon: SettingsIcon }
  ];

  const LANGUAGES = [
    { id: 'zh', name: t('lyrics.language_zh'), desc: t('lyrics.language_zh_desc') },
    { id: 'en', name: t('lyrics.language_en'), desc: t('lyrics.language_en_desc') },
    { id: 'mix', name: t('lyrics.language_mix'), desc: t('lyrics.language_mix_desc') }
  ];

  const VARIATIONS = ['A', 'B', 'C'];

  /* --- Core generation state --- */
  const [genres] = useState(FALLBACK_GENRES);
  const [themes] = useState(FALLBACK_THEMES);
  const [genre, setGenre] = useState('pop');
  const [theme, setTheme] = useState('love');
  const [method, setMethod] = useState('fsm');
  const [bpm, setBpm] = useState(120);
  const [duration, setDuration] = useState(270);
  const [subject, setSubject] = useState('我');
  const [object, setObject] = useState('你');
  const [complexity, setComplexity] = useState(5);
  const [language, setLanguage] = useState('zh');
  const [variation, setVariation] = useState('A');
  const [reference, setReference] = useState('');
  const [referenceSong, setReferenceSong] = useState('');
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState('both'); // 'both' | 'commands' | 'lyrics'

  /* --- UI state for tabbed/categorized interface --- */
  const [activeTab, setActiveTab] = useState('style'); // 'style' | 'method' | 'advanced' | 'image'
  const [styleSearch, setStyleSearch] = useState('');
  const [themeSearch, setThemeSearch] = useState('');
  const [expandedStyleCats, setExpandedStyleCats] = useState({ emotional: true });
  const [expandedThemeCats, setExpandedThemeCats] = useState({ emotional: true });

  /* --- Image upload & analysis state --- */
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionResult, setVisionResult] = useState(null);
  const [visionError, setVisionError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState(false);

  const getComplexityLabel = (level) => {
    if (level <= 2) return t('lyrics.simple');
    if (level <= 5) return t('lyrics.medium');
    if (level <= 8) return t('lyrics.complex');
    return t('lyrics.very_complex');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    setError(null);
    try {
      const params = {
        genre, theme, method, bpm, duration, subject, object,
        complexity, language, variation, reference, referenceSong, script
      };

      let data;
      if (isMobileEnvironment()) {
        const methodMap = { 'fsm': 'basic', 'network_layer': 'network', 'muse': 'time', 'suno': 'variation' };
        const localMethod = methodMap[method] || 'basic';
        const lyricsResult = generateLyrics({ ...params, method: localMethod });
        data = { success: true, data: { taskId: `local-${Date.now()}`, method, result: lyricsResult } };
      } else {
        data = await api.agentLyrics(params);
      }

      if (data.success) {
        setResult(data.data);
        addToHistory({
          type: 'lyrics', method, theme, style: genre, bpm, language, variation, reference, script,
          result: data.data
        });
      } else {
        setError(data.error || t('common.error_unknown'));
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err.message || t('common.error_connection'));
    } finally {
      setIsGenerating(false);
    }
  };

  /* --- Filtered styles based on search --- */
  const filteredStyleCats = useMemo(() => {
    if (!styleSearch.trim()) return STYLE_CATEGORIES;
    const search = styleSearch.toLowerCase();
    const result = {};
    Object.entries(STYLE_CATEGORIES).forEach(([cat, styles]) => {
      const filtered = styles.filter(s => {
        const name = t(`lyrics_styles.${s}`) || t(`styles.${s}`) || s;
        return name.toLowerCase().includes(search) || s.toLowerCase().includes(search);
      });
      if (filtered.length > 0) result[cat] = filtered;
    });
    return result;
  }, [styleSearch, t]);

  /* --- Filtered themes based on search --- */
  const filteredThemeCats = useMemo(() => {
    if (!themeSearch.trim()) return THEME_CATEGORIES;
    const search = themeSearch.toLowerCase();
    const result = {};
    Object.entries(THEME_CATEGORIES).forEach(([cat, themes]) => {
      const filtered = themes.filter(tm => {
        const name = t(`lyrics_themes.${tm}`) || t(`themes.${tm}`) || tm;
        return name.toLowerCase().includes(search) || tm.toLowerCase().includes(search);
      });
      if (filtered.length > 0) result[cat] = filtered;
    });
    return result;
  }, [themeSearch, t]);

  const toggleStyleCat = (cat) => {
    setExpandedStyleCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleThemeCat = (cat) => {
    setExpandedThemeCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  /* --- Image upload handlers --- */
  const handleFileSelect = (file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setVisionError(t('lyrics.image_upload_supported'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setVisionError('Image too large. Max 10MB');
      return;
    }

    setVisionError(null);
    setImageFile(file);
    setAppliedSuggestions(false);
    setVisionResult(null);

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    analyzeImage(file);
  };

  const analyzeImage = async (file) => {
    setIsAnalyzing(true);
    setVisionError(null);
    try {
      const data = await api.analyzeImage(file, file.type);
      if (data.success) {
        setVisionResult(data.data);
      } else {
        setVisionError(data.error || t('common.error_unknown'));
      }
    } catch (err) {
      setVisionError(err.message || t('common.error_connection'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyVisionSuggestions = () => {
    if (!visionResult) return;

    if (visionResult.suggestions?.genre) {
      const validGenre = genres.includes(visionResult.suggestions.genre)
        ? visionResult.suggestions.genre
        : (visionResult.styles?.find(s => genres.includes(s)) || genre);
      setGenre(validGenre);
    }

    if (visionResult.suggestions?.theme) {
      const validTheme = themes.includes(visionResult.suggestions.theme)
        ? visionResult.suggestions.theme
        : (visionResult.themes?.find(th => themes.includes(th)) || theme);
      setTheme(validTheme);
    }

    if (visionResult.suggestions?.bpm) {
      setBpm(visionResult.suggestions.bpm);
    }

    if (visionResult.description) {
      const existingScript = script ? script + '\n\n' : '';
      setScript(existingScript + t('lyrics.image_description') + ': ' + visionResult.description);
    }

    setAppliedSuggestions(true);
    setTimeout(() => setAppliedSuggestions(false), 2000);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setVisionResult(null);
    setVisionError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  /* --- Tab configuration --- */
  const TABS = [
    { id: 'style', label: t('lyrics.tab_style_theme'), icon: Palette },
    { id: 'method', label: t('lyrics.tab_method'), icon: Layers },
    { id: 'image', label: t('lyrics.tab_image'), icon: ImageIcon },
    { id: 'advanced', label: t('lyrics.tab_advanced'), icon: Sliders }
  ];

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in pb-52 md:pb-8">
      {/* Header */}
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">{t('lyrics.title')}</h1>
              <p className="text-[10px] md:text-xs text-gray-400">{t('lyrics.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs md:text-sm text-gray-300"
          >
            <History className="w-3.5 h-3.5 md:w-4 md:h-4" />
            {t('lyrics.history')}
          </button>
        </div>
      </div>

      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
        {/* Left Panel - Tabbed Controls */}
        <div className="md:col-span-1 space-y-3 md:space-y-4">
          {/* Tab Bar */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-violet-500/30 to-pink-500/30 text-white border border-violet-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab: Style & Theme */}
          {activeTab === 'style' && (
            <>
              {/* Style Selection with Categories */}
              <div className="gradient-border p-4 md:p-5">
                <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.genre')}</label>
                {/* Search box */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    value={styleSearch}
                    onChange={(e) => setStyleSearch(e.target.value)}
                    placeholder={t('lyrics.search_style')}
                    className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                {/* Category accordion */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {Object.entries(filteredStyleCats).map(([cat, styles]) => {
                    const isExpanded = expandedStyleCats[cat] || !!styleSearch.trim();
                    return (
                      <div key={cat} className="rounded-lg border border-white/5 overflow-hidden">
                        <button
                          onClick={() => toggleStyleCat(cat)}
                          className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <span className="text-xs font-medium text-gray-300">
                            {t(`lyrics.cat_${cat}`)} <span className="text-gray-600">({styles.length})</span>
                          </span>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                        </button>
                        {isExpanded && (
                          <div className="p-2 grid grid-cols-2 gap-1.5">
                            {styles.map(s => (
                              <button
                                key={s}
                                onClick={() => setGenre(s)}
                                className={`px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all ${genre === s
                                  ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                  }`}
                              >
                                {t(`lyrics_styles.${s}`) || t(`styles.${s}`) || s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Theme Selection with Categories */}
              <div className="gradient-border p-4 md:p-5">
                <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.theme')}</label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    value={themeSearch}
                    onChange={(e) => setThemeSearch(e.target.value)}
                    placeholder={t('lyrics.search_theme')}
                    className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {Object.entries(filteredThemeCats).map(([cat, themeList]) => {
                    const isExpanded = expandedThemeCats[cat] || !!themeSearch.trim();
                    return (
                      <div key={cat} className="rounded-lg border border-white/5 overflow-hidden">
                        <button
                          onClick={() => toggleThemeCat(cat)}
                          className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <span className="text-xs font-medium text-gray-300">
                            {t(`lyrics.cat_${cat}`)} <span className="text-gray-600">({themeList.length})</span>
                          </span>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                        </button>
                        {isExpanded && (
                          <div className="p-2 grid grid-cols-2 gap-1.5">
                            {themeList.map(tm => (
                              <button
                                key={tm}
                                onClick={() => setTheme(tm)}
                                className={`px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all ${theme === tm
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                  }`}
                              >
                                {t(`lyrics_themes.${tm}`) || t(`themes.${tm}`) || tm}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Tab: Method & Settings */}
          {activeTab === 'method' && (
            <>
              <div className="gradient-border p-4 md:p-5">
                <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.method')}</label>
                <div className="space-y-2">
                  {METHODS.map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${method === m.id
                          ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30'
                          : 'bg-white/5 border border-white/5 hover:border-white/10'
                          }`}
                      >
                        <Icon className="w-5 h-5 md:w-4 md:h-4 text-violet-400" />
                        <div>
                          <div className="text-sm font-medium text-white">{m.name}</div>
                          <div className="text-[10px] md:text-xs text-gray-400">{m.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="gradient-border p-4 md:p-5">
                <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.language')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setLanguage(l.id)}
                      className={`p-2.5 rounded-lg text-center transition-all ${language === l.id
                        ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30'
                        : 'bg-white/5 border border-white/5 hover:border-white/10'
                        }`}
                    >
                      <div className="text-xs font-medium text-white">{l.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="gradient-border p-4 md:p-5">
                <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.variation')}</label>
                <div className="flex gap-2">
                  {VARIATIONS.map(v => (
                    <button
                      key={v}
                      onClick={() => setVariation(v)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${variation === v
                        ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 mt-2">{t('lyrics.variation_hint')}</p>
              </div>

              <div className="gradient-border p-4 md:p-5">
                <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.complexity')}</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{t('lyrics.complexity_level')}</span>
                    <span className="text-sm font-semibold text-violet-400">{complexity}</span>
                  </div>
                  <input
                    type="range" min="1" max="10" value={complexity}
                    onChange={(e) => setComplexity(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>1</span>
                    <span>{getComplexityLabel(complexity)}</span>
                    <span>10</span>
                  </div>
                  <p className="text-[10px] text-gray-600">{t('lyrics.complexity_hint')}</p>
                </div>
              </div>
            </>
          )}

          {/* Tab: Image Upload & Analysis */}
          {activeTab === 'image' && (
            <>
              <div className="gradient-border p-4 md:p-5">
                <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.image_upload_title')}</label>

                {!imagePreview ? (
                  <div
                    onClick={() => document.getElementById('image-file-input')?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative border-2 border-dashed rounded-xl p-6 md:p-8 text-center cursor-pointer transition-all ${isDragging
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-white/20 bg-white/5 hover:border-violet-500/50 hover:bg-white/10'
                      }`}
                  >
                    <input
                      id="image-file-input"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
                      {isAnalyzing ? (
                        <Loader className="w-7 h-7 text-violet-400 animate-spin" />
                      ) : (
                        <Upload className="w-7 h-7 text-violet-400" />
                      )}
                    </div>
                    <div className="text-sm font-medium text-white mb-1">
                      {isAnalyzing ? t('lyrics.image_analyzing') : t('lyrics.image_upload_hint')}
                    </div>
                    <div className="text-[10px] text-gray-500">{t('lyrics.image_upload_supported')}</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden bg-black/30 border border-white/10">
                      <img src={imagePreview} alt="Preview" className="w-full h-48 object-contain" />
                      <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {isAnalyzing && (
                      <div className="flex items-center justify-center gap-2 py-3 text-violet-400 text-xs">
                        <Loader className="w-4 h-4 animate-spin" />
                        {t('lyrics.image_analyzing')}
                      </div>
                    )}

                    {visionError && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                        {visionError}
                      </div>
                    )}

                    {visionResult && !isAnalyzing && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-white">{t('lyrics.image_analysis_result')}</span>
                          <button
                            onClick={applyVisionSuggestions}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${appliedSuggestions
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30'
                              }`}
                          >
                            {appliedSuggestions ? (
                              <><Check className="w-3.5 h-3.5" />{t('lyrics.image_applied')}</>
                            ) : (
                              <><Sparkles className="w-3.5 h-3.5" />{t('lyrics.image_apply')}</>
                            )}
                          </button>
                        </div>

                        {visionResult.dominantColor && (
                          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5">
                            <div
                              className="w-10 h-10 rounded-lg border border-white/20"
                              style={{ backgroundColor: visionResult.dominantColor.hex }}
                            />
                            <div>
                              <div className="text-[10px] text-gray-500 uppercase tracking-wider">{t('lyrics.image_dominant_color')}</div>
                              <div className="text-xs text-white font-medium">{visionResult.dominantColor.hex}</div>
                            </div>
                          </div>
                        )}

                        {visionResult.mood && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2.5 rounded-lg bg-pink-500/5 border border-pink-500/20">
                              <div className="text-[10px] text-pink-400 uppercase tracking-wider mb-0.5">{t('lyrics.image_mood')}</div>
                              <div className="text-xs text-white font-medium">{visionResult.mood}</div>
                            </div>
                            {visionResult.scene?.category && (
                              <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
                                <div className="text-[10px] text-blue-400 uppercase tracking-wider mb-0.5">{t('lyrics.image_scene')}</div>
                                <div className="text-xs text-white font-medium">{visionResult.scene.category}</div>
                              </div>
                            )}
                          </div>
                        )}

                        {visionResult.styles && visionResult.styles.length > 0 && (
                          <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{t('lyrics.image_styles')}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {visionResult.styles.map((s, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-300 text-[11px] border border-violet-500/20">
                                  {t(`lyrics_styles.${s}`) || t(`styles.${s}`) || s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {visionResult.themes && visionResult.themes.length > 0 && (
                          <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{t('lyrics.image_themes')}</div>
                            <div className="flex flex-wrap gap-1.5">
                              {visionResult.themes.map((th, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 text-[11px] border border-emerald-500/20">
                                  {t(`lyrics_themes.${th}`) || t(`themes.${th}`) || th}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {visionResult.suggestions?.bpm && (
                          <div className="p-2.5 rounded-lg bg-white/5">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{t('lyrics.image_bpm')}</div>
                            <div className="text-sm text-white font-semibold">{visionResult.suggestions.bpm}</div>
                          </div>
                        )}

                        {visionResult.colorPalette && visionResult.colorPalette.length > 0 && (
                          <div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{t('lyrics.image_color_palette')}</div>
                            <div className="flex gap-1.5">
                              {visionResult.colorPalette.map((c, i) => (
                                <div
                                  key={i}
                                  title={c.hex}
                                  className="w-8 h-8 rounded-md border border-white/20"
                                  style={{ backgroundColor: c.hex }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {visionResult.description && (
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t('lyrics.image_description')}</div>
                            <p className="text-xs text-gray-300 leading-relaxed">{visionResult.description}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tab: Advanced Parameters */}
          {activeTab === 'advanced' && (
            <>
              <div className="gradient-border p-4 md:p-5">
                <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.parameters')}</label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider">{t('lyrics.subject')}</label>
                      <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider">{t('lyrics.object')}</label>
                      <input type="text" value={object} onChange={(e) => setObject(e.target.value)}
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Music2 className="w-3 h-3" />{t('lyrics.bpm')}
                      </label>
                      <input type="number" min="60" max="200" value={bpm}
                        onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3" />{t('lyrics.duration')}
                      </label>
                      <input type="number" min="60" max="600" value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 270)}
                        className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3" />{t('lyrics.reference')}
                    </label>
                    <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
                      placeholder={t('lyrics.reference_placeholder')}
                      className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Music2 className="w-3 h-3" />{t('lyrics.reference_song')}
                    </label>
                    <input type="text" value={referenceSong} onChange={(e) => setReferenceSong(e.target.value)}
                      placeholder={t('lyrics.reference_song_placeholder')}
                      className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 placeholder-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div className="gradient-border p-4 md:p-5">
                <label className="text-xs font-medium text-gray-300 mb-3 block flex items-center gap-2">
                  <Wand2 className="w-3 h-3 text-pink-400" />
                  {t('lyrics.script')}
                </label>
                <textarea value={script} onChange={(e) => setScript(e.target.value)}
                  placeholder={t('lyrics.script_placeholder')} rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 placeholder-gray-600 resize-none"
                />
                <p className="text-[10px] text-gray-600 mt-2">{t('lyrics.script_hint')}</p>
              </div>
            </>
          )}
        </div>

        {/* Right Panel - Results */}
        <div className="md:col-span-2 gradient-border p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-pink-400" />
              {t('lyrics.generated_content')}
            </h3>
            {/* Selection summary */}
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-300">{t(`lyrics_styles.${genre}`) || t(`styles.${genre}`) || genre}</span>
              <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-300">{t(`lyrics_themes.${theme}`) || t(`themes.${theme}`) || theme}</span>
            </div>
          </div>

          {!result && !isGenerating && (
            <div className="text-center py-12 md:py-20 text-gray-500">
              <Mic className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-30" />
              <div className="text-xs md:text-sm">{t('lyrics.click_to_start')}</div>
            </div>
          )}
          {isGenerating && (
            <div className="text-center py-12 md:py-20">
              <Loader className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-3 md:mb-4 text-violet-400 animate-spin" />
              <div className="text-xs md:text-sm text-gray-400">{t('lyrics.creating_with', { method: METHODS.find(m => m.id === method)?.name })}</div>
            </div>
          )}
          {error && (
            <div className="text-center py-8 md:py-12">
              <AlertCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-red-400" />
              <div className="text-sm md:text-base text-red-300 mb-2">{error}</div>
              <button onClick={handleGenerate}
                className="px-4 py-2 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-all"
              >
                {t('common.retry')}
              </button>
            </div>
          )}
          {result && (
            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                  <div className="text-[10px] text-violet-300 uppercase tracking-wider mb-1">{t('lyrics.method')}</div>
                  <div className="text-sm text-white font-medium">
                    {METHODS.find(m => m.id === result.method)?.name || result.method?.toUpperCase()}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/20">
                  <div className="text-[10px] text-pink-300 uppercase tracking-wider mb-1">{t('lyrics.genre')}</div>
                  <div className="text-sm text-white font-medium">
                    {t(`lyrics_styles.${result.result?.style || result.result?.genre}`) || t(`styles.${result.result?.style || result.result?.genre}`) || result.result?.style || result.result?.genre || genre}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div className="text-[10px] text-blue-300 uppercase tracking-wider mb-1">{t('lyrics.theme')}</div>
                  <div className="text-sm text-white font-medium">
                    {t(`lyrics_themes.${result.result?.theme}`) || t(`themes.${result.result?.theme}`) || result.result?.theme || theme}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div className="text-[10px] text-green-300 uppercase tracking-wider mb-1">{t('lyrics.language')}</div>
                  <div className="text-sm text-white font-medium">
                    {t(`lyrics.language_${language}`) || language.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                  <button
                    onClick={() => setViewMode('both')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'both'
                      ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/20 text-emerald-200 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <Layers className="w-3.5 h-3.5" />{t('lyrics.view_both')}
                  </button>
                  <button
                    onClick={() => setViewMode('commands')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'commands'
                      ? 'bg-gradient-to-r from-pink-500/30 to-rose-500/20 text-pink-200 border border-pink-500/40 shadow-lg shadow-pink-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />{t('lyrics.view_commands')}
                  </button>
                  <button
                    onClick={() => setViewMode('lyrics')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'lyrics'
                      ? 'bg-gradient-to-r from-violet-500/30 to-purple-500/20 text-violet-200 border border-violet-500/40 shadow-lg shadow-violet-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <FileText className="w-3.5 h-3.5" />{t('lyrics.view_lyrics')}
                  </button>
                </div>
              </div>

              {result.result?.script && (
                <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <div className="text-[10px] text-yellow-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Wand2 className="w-3 h-3" />{t('lyrics.user_intent')}
                  </div>
                  <p className="text-sm text-white italic">{result.result.script}</p>
                </div>
              )}

              {/* Both Tab - Command + Lyrics */}
              {viewMode === 'both' && result.result?.fullText && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(result.result.fullText)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 hover:bg-emerald-500/25 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />{t('lyrics.copy_all')}
                    </button>
                    <button
                      onClick={() => { setPendingLyrics(result.result.lyricsText || result.result.fullText); onNavigate?.('music'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/15 border border-pink-500/30 text-xs text-pink-300 hover:bg-pink-500/25 transition-all"
                    >
                      <Music className="w-3.5 h-3.5" />{t('lyrics.send_to_music')}
                    </button>
                    <button
                      onClick={() => { setPendingLyrics(result.result.lyricsText || result.result.fullText); onNavigate?.('mv'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-xs text-blue-300 hover:bg-blue-500/25 transition-all"
                    >
                      <Video className="w-3.5 h-3.5" />{t('lyrics.send_to_mv')}
                    </button>
                  </div>
                  <div className="rounded-xl bg-black/30 border border-emerald-500/20 overflow-hidden">
                    <pre className="p-5 text-sm text-white whitespace-pre-wrap font-mono leading-relaxed max-h-[70vh] overflow-y-auto">{result.result.fullText}</pre>
                  </div>
                </div>
              )}

              {/* Commands Tab */}
              {viewMode === 'commands' && (result.result?.fullCommand || result.command) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{t('lyrics.commands_only')}</span>
                    <button
                      onClick={() => copyToClipboard(result.result?.fullCommand || result.command)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/15 border border-pink-500/30 text-xs text-pink-300 hover:bg-pink-500/25 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />{t('lyrics.copy_commands')}
                    </button>
                  </div>
                  <div className="rounded-xl bg-black/30 border border-pink-500/20 overflow-hidden">
                    <pre className="p-4 text-xs text-pink-200 font-mono whitespace-pre-wrap break-words max-h-[70vh] overflow-y-auto leading-relaxed">{result.result?.fullCommand || result.command}</pre>
                  </div>
                </div>
              )}

              {/* Lyrics Tab */}
              {viewMode === 'lyrics' && (result.result?.lyricsText || result.result?.fullText) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(result.result.lyricsText || result.result.fullText)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-xs text-violet-300 hover:bg-violet-500/25 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />{t('lyrics.copy_lyrics')}
                    </button>
                    <button
                      onClick={() => { setPendingLyrics(result.result.lyricsText || result.result.fullText); onNavigate?.('music'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/15 border border-pink-500/30 text-xs text-pink-300 hover:bg-pink-500/25 transition-all"
                    >
                      <Music className="w-3.5 h-3.5" />{t('lyrics.send_to_music')}
                    </button>
                    <button
                      onClick={() => { setPendingLyrics(result.result.lyricsText || result.result.fullText); onNavigate?.('mv'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-xs text-blue-300 hover:bg-blue-500/25 transition-all"
                    >
                      <Video className="w-3.5 h-3.5" />{t('lyrics.send_to_mv')}
                    </button>
                  </div>
                  <div className="rounded-xl bg-black/30 border border-violet-500/20 overflow-hidden">
                    <pre className="p-5 text-sm text-white whitespace-pre-wrap font-sans leading-loose max-h-[70vh] overflow-y-auto">{result.result.lyricsText || result.result.fullText}</pre>
                  </div>
                </div>
              )}

              {result.result?.meta && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(result.result.meta).map(([key, value]) => (
                    <div key={key} className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                        {t(`lyrics_meta.${key}`) || key}
                      </div>
                      <div className="text-sm text-white font-semibold mt-0.5">
                        {typeof value === 'object' ? Object.keys(value).length : value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div >

      {/* Sticky Generate Button */}
      < div className="fixed bottom-[72px] md:bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0f] via-[#0f0a1a]/95 to-transparent pt-6 md:pt-12 pb-3 md:pb-3 px-4 md:px-6 z-40 safe-area-bottom md:safe-area-bottom" >
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 md:py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-transform"
          >
            {isGenerating ? (
              <><Loader className="w-4 h-4 animate-spin" />{t('lyrics.generating')}</>
            ) : (
              <><Sparkles className="w-4 h-4" />{t('lyrics.generate')}</>
            )}
          </button>
        </div>
      </div >

      <HistoryPanel isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </div >
  );
}

export default LyricsPage;
