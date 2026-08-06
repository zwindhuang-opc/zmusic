import React, { useState, useEffect, useMemo } from 'react';
import { Mic, Sparkles, Loader, FileText, Cpu, Network, BookOpen, Settings as SettingsIcon, Wand2, Clock, Music2, User, History, Copy, Video, AlertCircle, Search, ChevronDown, ChevronUp, ChevronRight, Sliders, Palette, Layers, Image as ImageIcon, Upload, X, Check, Share2, Layout, Music4 } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import api, { isMobileEnvironment } from '../services/api.client.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { generateLyrics } from '../utils/lyricsEngine.js';
import { fullImageAnalysis } from '../utils/visionAnalyzer.js';
import HistoryPanel from '../components/HistoryPanel.jsx';
import { LYRICS_STYLES, LYRICS_THEMES } from '../config/lyricsStyles.js';
import { getStyleRecommendation, buildSunoPrompt, MUSIC_STYLES, SECTION_PRESETS } from '../config/musicStyles.js';

/**
 * Visual metadata for each style category — provides unique emoji + color accent
 * so the 7 main groups feel equally weighted and visually distinct.
 */
const STYLE_CAT_META = {
  mainstream: { emoji: '🌟', gradient: 'from-pink-500/30 to-rose-500/30', border: 'border-pink-500/40', ring: 'ring-pink-500/60' },
  rock: { emoji: '🎸', gradient: 'from-red-500/30 to-orange-500/30', border: 'border-red-500/40', ring: 'ring-red-500/60' },
  electronic: { emoji: '🎹', gradient: 'from-violet-500/30 to-indigo-500/30', border: 'border-violet-500/40', ring: 'ring-violet-500/60' },
  emotional: { emoji: '💖', gradient: 'from-rose-500/30 to-fuchsia-500/30', border: 'border-rose-500/40', ring: 'ring-rose-500/60' },
  classical: { emoji: '🏯', gradient: 'from-amber-500/30 to-yellow-500/30', border: 'border-amber-500/40', ring: 'ring-amber-500/60' },
  rhythm: { emoji: '🎶', gradient: 'from-emerald-500/30 to-teal-500/30', border: 'border-emerald-500/40', ring: 'ring-emerald-500/60' },
  specialty: { emoji: '✨', gradient: 'from-sky-500/30 to-cyan-500/30', border: 'border-sky-500/40', ring: 'ring-sky-500/60' }
};

/**
 * Visual metadata for each theme category.
 */
const THEME_CAT_META = {
  emotional: { emoji: '💭', gradient: 'from-rose-500/30 to-pink-500/30', border: 'border-rose-500/40' },
  story: { emoji: '📖', gradient: 'from-indigo-500/30 to-violet-500/30', border: 'border-indigo-500/40' },
  mood: { emoji: '🌙', gradient: 'from-purple-500/30 to-fuchsia-500/30', border: 'border-purple-500/40' },
  nature: { emoji: '🌿', gradient: 'from-emerald-500/30 to-green-500/30', border: 'border-emerald-500/40' },
  life: { emoji: '🎯', gradient: 'from-amber-500/30 to-orange-500/30', border: 'border-amber-500/40' }
};

/**
 * Style categories - groups all 35+ styles into 7 logical categories for cleaner UI.
 * Each card shows 3–8 inner styles directly — no expand/collapse needed.
 */
const STYLE_CATEGORIES = {
  mainstream: ['pop', 'modern', 'kpop', 'jpop', 'cantopop'],
  rock: ['rock', 'indierock', 'gothic_rock', 'indie'],
  electronic: ['electronic', 'ambient', 'lofi', 'dreamy', 'reggae'],
  emotional: ['heartbreaking', 'healing', 'romantic', 'love_song', 'ballad', 'nostalgic', 'blues', 'rnb'],
  classical: ['ancient', 'chinese_traditional', 'chinese_classical', 'classical', 'folk', 'ancient_modern', 'country'],
  rhythm: ['hip_hop', 'jazz', 'tango'],
  specialty: ['dark', 'time_travel', 'epic', 'energetic', 'cinematic']
};

/**
 * Theme categories - groups all themes into 5 logical categories for cleaner UI.
 */
const THEME_CATEGORIES = {
  emotional: ['heartbreak', 'healing', 'love', 'sadness', 'loneliness', 'hope'],
  story: ['time_travel', 'epic_journey', 'dark_mystery', 'ancient_legend', 'indie_story', 'folk_tale'],
  mood: ['romantic_night', 'nostalgic_memory', 'energetic_party', 'dreamy_fantasy', 'modern_city'],
  nature: ['nature', 'summer_vibes', 'winter_solitude', 'spring_awakening', 'autumn_melancholy', 'ocean_dreams'],
  life: ['life', 'memory', 'friendship', 'success', 'dreams', 'lunatic', 'tango']
};

function LyricsPage({ onNavigate, defaultMode }) {
  const { t } = useTranslation();
  const { addToHistory, copyToClipboard, setPendingLyrics } = useGeneration();

  const FALLBACK_GENRES = Object.keys(LYRICS_STYLES);
  const FALLBACK_THEMES = Object.keys(LYRICS_THEMES);

  const METHODS = [
    { id: 'fsm', name: t('lyrics.fsm_name'), desc: t('lyrics.fsm_desc'), icon: Cpu },
    { id: 'network_layer', name: t('lyrics.network_name'), desc: t('lyrics.network_desc'), icon: Network },
    { id: 'muse', name: t('lyrics.muse_name'), desc: t('lyrics.muse_desc'), icon: BookOpen },
    { id: 'suno', name: t('lyrics.suno_name'), desc: t('lyrics.suno_desc'), icon: SettingsIcon },
    { id: 'melo', name: t('lyrics.melo_name'), desc: t('lyrics.melo_desc'), icon: Music2 }
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
  const [activeTab, setActiveTab] = useState('style'); // 'style' | 'theme'
  const [styleSearch, setStyleSearch] = useState('');
  const [themeSearch, setThemeSearch] = useState('');
  const [expandedStyleCats, setExpandedStyleCats] = useState({});
  const [expandedThemeCats, setExpandedThemeCats] = useState({});

  /* --- Guided mode wizard state --- */
  const [guidedStep, setGuidedStep] = useState(0); // 0: select emotion, 1: upload image or pick style, 2: generate
  const [showExpertMode, setShowExpertMode] = useState(defaultMode === 'expert');
  const QUICK_EMOTIONS = [
    { id: 'love', label: '💖 甜蜜爱情', style: 'pop' },
    { id: 'heartbreak', label: '💔 心碎离别', style: 'ballad' },
    { id: 'healing', label: '🌱 治愈成长', style: 'folk' },
    { id: 'dreams', label: '✨ 梦想远方', style: 'energetic' },
    { id: 'nostalgic_memory', label: '🌅 怀旧时光', style: 'nostalgic' },
    { id: 'hope', label: '🌈 希望之光', style: 'pop' }
  ];

  const POPULAR_STYLES = [
    { id: 'pop', label: '流行' },
    { id: 'indie', label: '独立' },
    { id: 'ballad', label: '民谣' },
    { id: 'rnb', label: 'R&B' },
    { id: 'electronic', label: '电子' },
    { id: 'kpop', label: '韩流' },
    { id: 'jpop', label: '日流' }
  ];

  const POPULAR_THEMES = [
    { id: 'love', label: '爱情' },
    { id: 'heartbreak', label: '心碎' },
    { id: 'hope', label: '希望' },
    { id: 'dreams', label: '梦想' },
    { id: 'memory', label: '回忆' },
    { id: 'friendship', label: '友情' }
  ];

  /* --- Image upload & analysis state --- */
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionResult, setVisionResult] = useState(null);
  const [visionError, setVisionError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState(false);
  const [visualContext, setVisualContext] = useState(null);

  /* --- Social Media BGM & Prompt Engineering state --- */
  const [platform, setPlatform] = useState('xiaohongshu'); // xiaohongshu | douyin | bilibili | youtube | generic
  const [durationPreset, setDurationPreset] = useState('standard'); // 15s | 30s | 60s | standard
  const [usePromptTemplate, setUsePromptTemplate] = useState(false);
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [sectionPreset, setSectionPreset] = useState('standard_song');
  const [bgmPlatforms] = useState([
    { id: 'xiaohongshu', name: '小红书', icon: Share2, styles: ['xiaohongshu_vlog', 'food_vlog', 'commercial_ad', 'emotional_story'] },
    { id: 'douyin', name: '抖音/TikTok', icon: Music4, styles: ['dance_party', 'energetic', 'pop', 'kpop'] },
    { id: 'bilibili', name: 'Bilibili', icon: Video, styles: ['tech_explainer', 'podcast_intro', 'nature_documentary', 'indie'] },
    { id: 'youtube', name: 'YouTube', icon: Music2, styles: ['commercial_ad', 'podcast_intro', 'tech_explainer', 'nature_documentary'] },
    { id: 'generic', name: '通用', icon: Layout, styles: ['pop', 'ballad', 'electronic', 'folk', 'ambient'] }
  ]);
  const [durationPresets] = useState([
    { id: '15s', label: '15s', desc: '超短BGM' },
    { id: '30s', label: '30s', desc: '短视频' },
    { id: '60s', label: '60s', desc: '标准Vlog' },
    { id: 'standard', label: '标准', desc: '完整歌曲' }
  ]);

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
        complexity, language, variation, reference, referenceSong, script,
        ...(visualContext ? { visualContext } : {}),
        ...(usePromptTemplate ? { usePromptTemplate } : {}),
        ...(platform ? { platform } : {}),
        ...(selectedInstruments.length > 0 ? { selectedInstruments } : {}),
        ...(sectionPreset ? { sectionPreset } : {}),
      };

      const methodMap = { 'fsm': 'basic', 'network_layer': 'network', 'muse': 'time', 'suno': 'variation', 'melo': 'melo' };
      const localMethod = methodMap[method] || 'basic';
      let data;

      if (isMobileEnvironment()) {
        const lyricsResult = generateLyrics({ ...params, method: localMethod });
        data = { success: true, data: { taskId: `local-${Date.now()}`, method, result: lyricsResult } };
      } else {
        data = await api.agentLyrics(params);
        if (!data?.success) {
          const lyricsResult = generateLyrics({ ...params, method: localMethod });
          data = { success: true, data: { taskId: `local-${Date.now()}`, method, result: lyricsResult, local: true } };
        }
      }

      if (data.success) {
        setResult(data.data);
        addToHistory({
          type: 'lyrics', method, theme, style: genre, bpm, language, variation, reference, script,
          result: data.data,
          ...(visualContext ? { visualContext: visualContext.sceneId || 'image' } : {}),
          ...(platform ? { platform } : {}),
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

  /* --- Social Media & Prompt Engineering helpers --- */

  /** Get recommended styles for the selected platform */
  const getPlatformStyles = () => {
    const platformConfig = bgmPlatforms.find(p => p.id === platform);
    return platformConfig?.styles || [];
  };

  /** Toggle instrument selection */
  const toggleInstrument = (instrument) => {
    setSelectedInstruments(prev =>
      prev.includes(instrument)
        ? prev.filter(i => i !== instrument)
        : [...prev, instrument]
    );
  };

  /** Apply a social media style template (sets genre, bpm, duration, script) */
  const applySocialMediaStyle = (styleKey) => {
    const styleInfo = MUSIC_STYLES[styleKey];
    if (!styleInfo) return;

    setGenre(styleKey);
    if (styleInfo.bpmRange) {
      setBpm(Math.round((styleInfo.bpmRange[0] + styleInfo.bpmRange[1]) / 2));
    }
    if (styleInfo.promptTemplate) {
      setScript(prev => {
        const prefix = usePromptTemplate ? '' : '[模板提示]\n';
        return prev ? `${prefix}${styleInfo.promptTemplate}\n\n${prev}` : `${prefix}${styleInfo.promptTemplate}`;
      });
    }
    if (styleInfo.instruments) {
      setSelectedInstruments(styleInfo.instruments.slice(0, 3));
    }
    setUsePromptTemplate(true);
  };

  /** Generate a structured command from prompt template */
  const generateStructuredCommand = () => {
    const params = {
      prompt: script || '',
      style: genre,
      theme,
      bpm,
      duration,
      usePromptTemplate,
    };
    return buildSunoPrompt(params);
  };

  /** Get visual style recommendations based on current vision result */
  const getVisualStyleRecommendations = () => {
    if (!visionResult?.visualContext) return [];
    const features = {
      colorTone: visionResult.colorTone || (visionResult.dominantColor?.hex && isDarkColor(visionResult.dominantColor.hex) ? 'dark' : 'bright'),
      saturation: visionResult.saturation || 'medium',
      subject: visionResult.scene?.category || '',
    };
    return getStyleRecommendation(features);
  };

  /** Simple dark/light color detection */
  const isDarkColor = (hex) => {
    if (!hex || hex.length < 7) return false;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  /** Get all available instruments for the current style */
  const getAvailableInstruments = () => {
    const styleInfo = MUSIC_STYLES[genre];
    if (styleInfo?.instruments) return styleInfo.instruments;
    // Default set of instruments
    return ['Acoustic Guitar', 'Electric Guitar', 'Piano', 'Synthesizer', 'Drums', 'Drum Machine', 'Bass', 'Strings', 'Vocals', 'Soft Vocals', 'Saxophone', 'Brass Section', 'Harmonica', 'Banjo', 'Mandolin'];
  };

  /** Get all social media style options for the current platform */
  const getSocialStyleOptions = () => {
    const platformStyles = getPlatformStyles();
    return platformStyles.map(key => ({
      key,
      ...MUSIC_STYLES[key],
      name: MUSIC_STYLES[key]?.name || key
    }));
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
  const handleFileSelect = async (file) => {
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

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    setImagePreview(dataUrl);
    await analyzeImage(dataUrl);
  };

  const analyzeImage = async (dataUrl) => {
    setIsAnalyzing(true);
    setVisionError(null);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
      });

      const result = await fullImageAnalysis(img);

      setVisionResult(result);
      setVisualContext(result.visualContext);

      // Auto-apply suggestions
      if (result.suggestions?.genre) {
        const validGenre = genres.includes(result.suggestions.genre)
          ? result.suggestions.genre
          : (result.styles?.find(s => genres.includes(s)) || genre);
        setGenre(validGenre);
      }
      if (result.suggestions?.theme) {
        const validTheme = themes.includes(result.suggestions.theme)
          ? result.suggestions.theme
          : (result.themes?.find(th => themes.includes(th)) || theme);
        setTheme(validTheme);
      }
      if (result.suggestions?.bpm) {
        setBpm(result.suggestions.bpm);
      }
      if (result.description) {
        setScript(prev => {
          const prefix = '[图片灵感]';
          return prev ? `${prefix} ${result.description}\n\n${prev}` : `${prefix} ${result.description}`;
        });
      }

      setAppliedSuggestions(true);
      setTimeout(() => setAppliedSuggestions(false), 2000);
    } catch (err) {
      console.error('Image analysis failed:', err);
      setVisionError(err.message || 'Image analysis failed');
      setVisualContext(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyVisionSuggestions = () => {
    if (!visionResult) return;

    setVisualContext(visionResult.visualContext);

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
      setScript(existingScript + '[图片灵感]: ' + visionResult.description);
    }

    setAppliedSuggestions(true);
    setTimeout(() => setAppliedSuggestions(false), 2000);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setVisionResult(null);
    setVisionError(null);
    setVisualContext(null);
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

  /* --- Tab configuration (simplified: 2 main tabs + advanced accordion) --- */
  const TABS = [
    { id: 'style', label: '风格', icon: Palette },
    { id: 'theme', label: '主题', icon: Sparkles }
  ];
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExploreStyles, setShowExploreStyles] = useState(false);
  const [showExploreThemes, setShowExploreThemes] = useState(false);

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

      {/* ====== Guided Mode Wizard (Default) ====== */}
      {!showExpertMode && (
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-pink-400" />
              <span className="text-sm font-medium text-gray-300">向导模式</span>
              <span className="text-xs text-gray-500">三步生成，零门槛</span>
            </div>
            <button
              onClick={() => setShowExpertMode(true)}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              切换到专家模式 →
            </button>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((stepIdx) => (
              <div key={stepIdx} className="flex-1 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${guidedStep >= stepIdx
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                  : 'bg-white/10 text-gray-500'
                  }`}>
                  {guidedStep > stepIdx ? <Check className="w-4 h-4" /> : stepIdx + 1}
                </div>
                {stepIdx < 2 && (
                  <div className={`flex-1 h-0.5 rounded ${guidedStep > stepIdx ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-white/10'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="gradient-border p-5 space-y-4">
            {/* Generate card — ALWAYS SHOWN FIRST */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" /> 确认并生成
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-white/5">
                  <span className="text-gray-500 text-xs">主题</span>
                  <p className="text-white font-medium">{theme}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <span className="text-gray-500 text-xs">风格</span>
                  <p className="text-white font-medium">{genre}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <span className="text-gray-500 text-xs">方法</span>
                  <p className="text-white font-medium">{method === 'fsm' ? 'FSM状态机' : method}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <span className="text-gray-500 text-xs">语言</span>
                  <p className="text-white font-medium">{language === 'zh' ? '普通话' : language}</p>
                </div>
              </div>
              {visionResult?.vocalRecommendation && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                  <span className="text-xs text-pink-400">🎤 AI人声推荐</span>
                  <p className="text-sm text-white">
                    根据上传图片分析，建议使用 <strong className="text-pink-400">{visionResult.vocalRecommendation.gender}</strong>
                    {' '}（置信度 {Math.round((visionResult.vocalRecommendation.confidence || 0) * 100)}%）
                  </p>
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (<><Loader className="w-4 h-4 animate-spin" /> 生成中...</>) : (<><Sparkles className="w-4 h-4" /> 开始生成歌词</>)}
              </button>
            </div>

            {/* Step content — below */}
            {guidedStep === 0 && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h3 className="text-base font-semibold text-white">选择你的情感</h3>
                <p className="text-xs text-gray-400">点击一个最符合你心情的选项</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {QUICK_EMOTIONS.map((emotion) => (
                    <button
                      key={emotion.id}
                      onClick={() => {
                        setTheme(emotion.id);
                        setGenre(emotion.style);
                        setGuidedStep(1);
                      }}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-gradient-to-br hover:from-pink-500/20 hover:to-purple-500/20 hover:border-pink-500/30 transition-all text-left group"
                    >
                      <span className="text-xs font-medium text-gray-200 group-hover:text-white">{emotion.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {guidedStep === 1 && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h3 className="text-base font-semibold text-white">上传一张图片（可选）</h3>
                <p className="text-xs text-gray-400">上传照片可让AI根据图片色彩和氛围推荐歌曲风格和人声</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setGuidedStep(2)}
                    className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-center"
                  >
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-300">上传图片，AI自动分析</span>
                  </button>
                  <button
                    onClick={() => setGuidedStep(2)}
                    className="flex-1 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-center"
                  >
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-300">直接选择风格</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-500 mb-2">当前选择: <span className="text-pink-400">{theme}</span> · <span className="text-purple-400">{genre}</span></p>
                  <div className="flex gap-2 flex-wrap">
                    {POPULAR_STYLES.slice(0, 6).map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGenre(g.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all ${genre === g.id
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Result preview (simplified) */}
          {result && (
            <div className="gradient-border p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" /> 生成完成
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {result.result?.lyricsText?.split('\n').map((line, i) => (
                  <p key={i} className="text-sm text-gray-300 leading-relaxed">{line}</p>
                ))}
                {result.result?.data?.result?.lyricsText?.split('\n').map((line, i) => (
                  <p key={`d${i}`} className="text-sm text-gray-300 leading-relaxed">{line}</p>
                ))}
              </div>
              <button
                onClick={() => {
                  const text = result.result?.fullText || result.result?.data?.result?.fullText || '';
                  copyToClipboard(text);
                }}
                className="mt-3 w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-all"
              >
                <Copy className="w-3 h-3 inline mr-1" /> 复制全部
              </button>
            </div>
          )}

          {/* History quick access */}
          <div className="text-center">
            <button
              onClick={() => setShowHistory(true)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <History className="w-3 h-3 inline mr-1" /> 查看历史记录
            </button>
          </div>
        </div>
      )}

      {/* ====== Expert Mode (Full controls) ====== */}
      {showExpertMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-300">专家模式</span>
              <span className="text-xs text-gray-500">精细调控所有参数</span>
            </div>
            <button
              onClick={() => setShowExpertMode(false)}
              className="text-xs text-pink-400 hover:text-pink-300 transition-colors"
            >
              ← 返回向导模式
            </button>
          </div>

          {/* TOP COMPACT GENERATE BAR */}
          <div className="gradient-border p-4 space-y-3">
            {/* Selected pills + method */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-500/30 to-pink-500/30 border border-violet-500/30 text-xs text-white font-medium">
                🎨 {t(`lyrics_styles.${genre}`) || t(`styles.${genre}`) || genre}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-emerald-500/30 text-xs text-white font-medium">
                ✨ {t(`lyrics_themes.${theme}`) || t(`themes.${theme}`) || theme}
              </span>
              <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-gray-400">
                {METHODS.find(m => m.id === method)?.name || method}
              </span>
            </div>

            {/* Big gradient generate button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-transform"
            >
              {isGenerating ? (
                <><Loader className="w-5 h-5 animate-spin" />{t('lyrics.generating')}</>
              ) : (
                <><Sparkles className="w-5 h-5" />{t('lyrics.generate')}</>
              )}
            </button>

            {/* Compact style pills row */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">风格</span>
                <button
                  onClick={() => setShowExploreStyles(true)}
                  className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                >
                  探索全部 →
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setGenre(s.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${genre === s.id
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md shadow-violet-500/20'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact theme pills row */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">主题</span>
                <button
                  onClick={() => setShowExploreThemes(true)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  探索全部 →
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_THEMES.map(th => (
                  <button
                    key={th.id}
                    onClick={() => setTheme(th.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${theme === th.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MIDDLE: COLLAPSIBLE ADVANCED (collapsed by default) */}
          <div>
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium text-gray-300">
              <SettingsIcon className="w-4 h-4" />
              高级设置
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="space-y-3 mt-3">
                {/* Method */}
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

                {/* Image Upload & Analysis */}
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

                          {/* AI 风格推荐 (基于VISUAL_STYLE_MAP) */}
                          {getVisualStyleRecommendations().length > 0 && (
                            <div className="p-2.5 rounded-lg bg-pink-500/5 border border-pink-500/20">
                              <div className="text-[10px] text-pink-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />{t('lyrics.image_style_reco') || 'AI风格推荐'}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {getVisualStyleRecommendations().map((s, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setGenre(s)}
                                    className="px-2 py-1 rounded-md bg-pink-500/10 text-pink-300 text-[11px] border border-pink-500/20 hover:bg-pink-500/20 transition-all"
                                  >
                                    {t(`lyrics_styles.${s}`) || t(`styles.${s}`) || s}
                                  </button>
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

                          {visionResult.visualContext && (
                            <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                              <div className="text-[10px] text-violet-400 uppercase tracking-wider mb-2 font-semibold">
                                🎨 {t('lyrics.image_visual_context') || 'Visual Context (used for lyrics)'}
                              </div>
                              {visionResult.visualContext.sceneId && (
                                <div className="text-[10px] text-violet-300 mb-2">
                                  Scene: {visionResult.visualContext.sceneId}
                                </div>
                              )}
                              {visionResult.visualContext.imagery?.length > 0 && (
                                <div className="mb-1.5">
                                  <span className="text-[10px] text-gray-500">Imagery:</span>
                                  <span className="text-[11px] text-violet-200 ml-1">{visionResult.visualContext.imagery.slice(0, 8).join('、')}</span>
                                </div>
                              )}
                              {visionResult.visualContext.emotions?.length > 0 && (
                                <div className="mb-1.5">
                                  <span className="text-[10px] text-gray-500">Emotions:</span>
                                  <span className="text-[11px] text-pink-200 ml-1">{visionResult.visualContext.emotions.slice(0, 6).join('、')}</span>
                                </div>
                              )}
                              {visionResult.visualContext.subjects?.length > 0 && (
                                <div className="mb-1.5">
                                  <span className="text-[10px] text-gray-500">Subjects:</span>
                                  <span className="text-[11px] text-blue-200 ml-1">{visionResult.visualContext.subjects.slice(0, 6).join('、')}</span>
                                </div>
                              )}
                              {visionResult.visualContext.locations?.length > 0 && (
                                <div>
                                  <span className="text-[10px] text-gray-500">Locations:</span>
                                  <span className="text-[11px] text-emerald-200 ml-1">{visionResult.visualContext.locations.slice(0, 6).join('、')}</span>
                                </div>
                              )}
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

                {/* Social Media BGM & Prompt Engineering */}
                {/* Platform Selector */}
                <div className="gradient-border p-4 md:p-5">
                  <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.bgm_platform') || 'BGM平台'}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {bgmPlatforms.map(p => {
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPlatform(p.id)}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg text-xs font-medium transition-all ${platform === p.id
                            ? 'bg-gradient-to-r from-violet-500/30 to-pink-500/30 text-white border border-violet-500/40'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration Presets */}
                <div className="gradient-border p-4 md:p-5">
                  <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.bgm_duration') || '时长预设'}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {durationPresets.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setDurationPreset(d.id)}
                        className={`flex flex-col items-center p-2.5 rounded-lg text-xs transition-all ${durationPreset === d.id
                          ? 'bg-gradient-to-r from-violet-500/30 to-pink-500/30 text-white border border-violet-500/40'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
                          }`}
                      >
                        <span className="font-semibold">{d.label}</span>
                        <span className="text-[10px] opacity-70">{d.desc}</span>
                      </button>
                    ))}
                  </div>
                  {durationPreset !== 'standard' && (
                    <div className="mt-3 p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                      <div className="text-[10px] text-yellow-400 mb-1">自动调整</div>
                      <div className="text-xs text-yellow-200">
                        时长: {durationPreset === '15s' ? 15 : durationPreset === '30s' ? 30 : 60}秒
                        {bpm > 0 && <> · BPM建议: {bpm}</>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Platform Style Templates */}
                <div className="gradient-border p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-medium text-gray-300 block">
                      {t('lyrics.bgm_templates') || '风格模板'}
                    </label>
                    <span className="text-[10px] text-gray-500">{getPlatformStyles().length} 个模板</span>
                  </div>
                  <div className="space-y-2">
                    {getSocialStyleOptions().map(style => (
                      <button
                        key={style.key}
                        onClick={() => applySocialMediaStyle(style.key)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${genre === style.key
                          ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30'
                          : 'bg-white/5 border border-white/5 hover:bg-white/10'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">
                            {t(`lyrics_styles.${style.key}`) || t(`styles.${style.key}`) || style.description}
                          </span>
                          {genre === style.key && <Check className="w-4 h-4 text-violet-400" />}
                        </div>
                        <p className="text-[10px] text-gray-400 mb-1">{style.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span className="px-1.5 py-0.5 rounded bg-white/5">{style.bpmRange?.[0]}-{style.bpmRange?.[1]} BPM</span>
                          {style.instruments?.slice(0, 2).map((inst, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-white/5">{inst}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Template Generator */}
                <div className="gradient-border p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-medium text-gray-300 block flex items-center gap-2">
                      <Wand2 className="w-3.5 h-3.5 text-pink-400" />
                      {t('lyrics.prompt_template') || '专业提示词生成'}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usePromptTemplate}
                        onChange={(e) => setUsePromptTemplate(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50"
                      />
                      <span className="text-[10px] text-gray-400">启用</span>
                    </label>
                  </div>

                  {usePromptTemplate && (
                    <>
                      {/* Section Presets */}
                      <div className="mb-3">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                          {t('lyrics.section_structure') || '段落结构'}
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {Object.entries(SECTION_PRESETS).map(([key, sections]) => (
                            <button
                              key={key}
                              onClick={() => setSectionPreset(key)}
                              className={`p-2 rounded-lg text-[11px] transition-all ${sectionPreset === key
                                ? 'bg-violet-500/20 text-violet-200 border border-violet-500/30'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
                                }`}
                            >
                              {key.replace(/_/g, ' ')}
                              <div className="text-[9px] opacity-70">{sections.length}段</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Instrument Selection */}
                      <div className="mb-3">
                        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                          {t('lyrics.instruments') || '乐器选择'}
                          {selectedInstruments.length > 0 && (
                            <span className="ml-1.5 text-violet-400">({selectedInstruments.length})</span>
                          )}
                        </label>
                        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                          {getAvailableInstruments().map(inst => (
                            <button
                              key={inst}
                              onClick={() => toggleInstrument(inst)}
                              className={`px-2 py-1 rounded text-[10px] transition-all ${selectedInstruments.includes(inst)
                                ? 'bg-violet-500/20 text-violet-200 border border-violet-500/30'
                                : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                }`}
                            >
                              {inst}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Generated Command Preview */}
                      <div className="p-3 rounded-lg bg-black/30 border border-violet-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-violet-400 uppercase tracking-wider">
                            {t('lyrics.generated_command') || '生成的提示词'}
                          </span>
                          <button
                            onClick={() => copyToClipboard(generateStructuredCommand())}
                            className="text-[10px] text-violet-300 hover:text-violet-200 flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            {t('lyrics.copy') || '复制'}
                          </button>
                        </div>
                        <pre className="text-[11px] text-violet-200 font-mono whitespace-pre-wrap max-h-[100px] overflow-y-auto">
                          {generateStructuredCommand()}
                        </pre>
                      </div>
                    </>
                  )}
                </div>

                {/* Visual Style Recommendations */}
                {visionResult && (
                  <div className="gradient-border p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Palette className="w-3.5 h-3.5 text-pink-400" />
                      <label className="text-xs font-medium text-gray-300 block">
                        {t('lyrics.visual_recommendations') || '视觉风格推荐'}
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-3">
                      {t('lyrics.visual_reco_desc') || '基于上传图片分析，推荐以下音乐风格'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {getVisualStyleRecommendations().map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setGenre(s)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] transition-all ${genre === s
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                            : 'bg-pink-500/10 text-pink-300 border border-pink-500/20 hover:bg-pink-500/20'
                            }`}
                        >
                          {t(`lyrics_styles.${s}`) || t(`styles.${s}`) || s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advanced Parameters */}
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
              </div>
            )}
          </div>

          {/* BOTTOM: RESULTS AREA */}
          <div className="gradient-border p-4 md:p-6">
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
                        <Music2 className="w-3.5 h-3.5" />{t('lyrics.send_to_music')}
                      </button>
                      <button
                        onClick={() => { setPendingLyrics(result.result.lyricsText || result.result.fullText); onNavigate?.('mv'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-xs text-blue-300 hover:bg-blue-500/25 transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />{t('lyrics.send_to_mv')}
                      </button>
                    </div>
                    <div className="rounded-xl bg-black/30 border border-emerald-500/20 overflow-hidden allow-select">
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
                    <div className="rounded-xl bg-black/30 border border-pink-500/20 overflow-hidden allow-select">
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
                        <Music2 className="w-3.5 h-3.5" />{t('lyrics.send_to_music')}
                      </button>
                      <button
                        onClick={() => { setPendingLyrics(result.result.lyricsText || result.result.fullText); onNavigate?.('mv'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-xs text-blue-300 hover:bg-blue-500/25 transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />{t('lyrics.send_to_mv')}
                      </button>
                    </div>
                    <div className="rounded-xl bg-black/30 border border-violet-500/20 overflow-hidden allow-select">
                      <pre className="p-5 text-sm text-white whitespace-pre-wrap font-sans leading-loose max-h-[70vh] overflow-y-auto">{result.result.lyricsText || result.result.fullText}</pre>
                    </div>
                  </div>
                )}

                {result.result?.meta && viewMode !== 'commands' && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(result.result.meta)
                      .filter(([key]) => !['productionMetadata', 'mixed', 'mixThemes', 'mixStyles'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                            {t(`lyrics_meta.${key}`) || key}
                          </div>
                          <div className="text-sm text-white font-semibold mt-0.5">
                            {typeof value === 'object' && value !== null ? Object.keys(value).length : String(value)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

{/* History Panel - accessible in both modes */ }
<HistoryPanel isOpen={showHistory} onClose={() => setShowHistory(false)} />

{/* Style Explore Modal */ }
{
  showExploreStyles && (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-violet-400" /> 探索全部风格
        </h2>
        <button onClick={() => setShowExploreStyles(false)}
          className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={styleSearch}
            onChange={(e) => setStyleSearch(e.target.value)}
            placeholder={t('lyrics.search_style')}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(filteredStyleCats).map(([cat, styles]) => {
          if (styles.length === 0) return null;
          const meta = STYLE_CAT_META[cat] || { emoji: '🎵', gradient: 'from-gray-500/20 to-gray-500/20', border: 'border-gray-500/30' };
          return (
            <div key={cat} className={`rounded-xl border ${meta.border} bg-gradient-to-br ${meta.gradient} overflow-hidden backdrop-blur-sm`}>
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="text-sm font-semibold text-gray-200">{t(`lyrics.cat_${cat}`)}</span>
                </div>
                <span className="text-[10px] text-gray-500 bg-black/20 px-2 py-0.5 rounded-full">{styles.length}</span>
              </div>
              <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                {styles.map(s => (
                  <button key={s} onClick={() => { setGenre(s); setShowExploreStyles(false); }}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all truncate ${genre === s
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-sm'
                      : 'bg-black/20 text-gray-300 hover:bg-black/30 hover:text-white'}`}>
                    {t(`lyrics_styles.${s}`) || t(`styles.${s}`) || s}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}

{/* Theme Explore Modal */ }
{
  showExploreThemes && (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" /> 探索全部主题
        </h2>
        <button onClick={() => setShowExploreThemes(false)}
          className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={themeSearch}
            onChange={(e) => setThemeSearch(e.target.value)}
            placeholder={t('lyrics.search_theme')}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(filteredThemeCats).map(([cat, themeList]) => {
          if (themeList.length === 0) return null;
          const meta = THEME_CAT_META[cat] || { emoji: '🎵', gradient: 'from-gray-500/20 to-gray-500/20', border: 'border-gray-500/30' };
          return (
            <div key={cat} className={`rounded-xl border ${meta.border} bg-gradient-to-br ${meta.gradient} overflow-hidden backdrop-blur-sm`}>
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.emoji}</span>
                  <span className="text-sm font-semibold text-gray-200">{t(`lyrics.cat_${cat}`)}</span>
                </div>
                <span className="text-[10px] text-gray-500 bg-black/20 px-2 py-0.5 rounded-full">{themeList.length}</span>
              </div>
              <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                {themeList.map(tm => (
                  <button key={tm} onClick={() => { setTheme(tm); setShowExploreThemes(false); }}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all truncate ${theme === tm
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
                      : 'bg-black/20 text-gray-300 hover:bg-black/30 hover:text-white'}`}>
                    {t(`lyrics_themes.${tm}`) || t(`themes.${tm}`) || tm}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}
    </div >
  );
}

export default LyricsPage;
