/**
 * EasyMode.jsx - Elderly-friendly 3-step wizard (fully bilingual)
 *
 * Designed for non-technical users and elderly users.
 * Large fonts, big touch targets, icon-guided.
 * All technical parameters are auto-selected with sensible defaults.
 *
 * Steps:
 * 1. Choose: Lyrics / BGM / Image-to-Song
 * 2. Mood: Pick an emotion with emoji, or upload a picture
 * 3. Generate: One big button → results with copy/share
 */

import React, { useState, useRef } from 'react';
import {
  Sparkles, Music2, Image as ImageIcon, Upload, Play, Copy, Check,
  ArrowRight, ArrowLeft, RefreshCw, Share2, Heart, Smile, Frown,
  Sun, Moon, Cloud, Zap, Coffee, Music, Palette, Camera, X, Settings
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { generateLyrics } from '../utils/lyricsEngine.js';
import { fullImageAnalysis } from '../utils/visionAnalyzer.js';
import { MUSIC_STYLES } from '../config/musicStyles.js';

/* --- Mood options with emoji for elderly-friendly selection --- */
const MOOD_OPTIONS = [
  { id: 'happy',     emoji: '😊', zh: '开心',   en: 'Happy',    style: 'pop',              theme: 'happy',       bpm: 120 },
  { id: 'sad',       emoji: '😢', zh: '伤心',   en: 'Sad',      style: 'ballad',           theme: 'sadness',     bpm: 70  },
  { id: 'love',      emoji: '💕', zh: '爱情',   en: 'Love',     style: 'love_song',        theme: 'love',        bpm: 80  },
  { id: 'healing',   emoji: '🌿', zh: '治愈',   en: 'Healing',  style: 'healing',          theme: 'healing',     bpm: 75  },
  { id: 'excited',   emoji: '🎉', zh: '兴奋',   en: 'Excited',  style: 'energetic',        theme: 'excitement',  bpm: 130 },
  { id: 'nostalgia', emoji: '📷', zh: '怀旧',   en: 'Nostalgia',style: 'folk',             theme: 'nostalgia',   bpm: 85  },
  { id: 'dreamy',    emoji: '✨', zh: '梦幻',   en: 'Dreamy',   style: 'dreamy',           theme: 'dream',       bpm: 90  },
  { id: 'nature',    emoji: '🌳', zh: '自然',   en: 'Nature',   style: 'ambient',          theme: 'nature',      bpm: 70  },
  { id: 'food',      emoji: '🍜', zh: '美食',   en: 'Food',     style: 'food_vlog',        theme: 'life',        bpm: 90  },
  { id: 'travel',    emoji: '✈️', zh: '旅行',   en: 'Travel',   style: 'pop',              theme: 'adventure',   bpm: 110 },
  { id: 'dance',     emoji: '💃', zh: '跳舞',   en: 'Dance',    style: 'dance_party',      theme: 'party',       bpm: 128 },
  { id: 'story',     emoji: '📖', zh: '故事',   en: 'Story',    style: 'emotional_story',  theme: 'story',       bpm: 75  },
];

/* --- BGM style presets (simplified) --- */
const BGM_PRESETS = [
  { id: 'xiaohongshu_vlog',    emoji: '📕', zh: '小红书Vlog', en: 'XHS Vlog',        zhDesc: '温暖舒适',   enDesc: 'Warm & cozy'       },
  { id: 'food_vlog',           emoji: '🍜', zh: '美食视频',   en: 'Food Video',      zhDesc: '愉快俏皮',   enDesc: 'Playful & fun'     },
  { id: 'commercial_ad',       emoji: '📢', zh: '商业广告',   en: 'Commercial Ad',   zhDesc: '积极活力',   enDesc: 'Energetic'         },
  { id: 'dance_party',         emoji: '🎉', zh: '派对舞曲',   en: 'Party Music',     zhDesc: '动感节奏',   enDesc: 'Beat-driven'       },
  { id: 'nature_documentary',  emoji: '🌿', zh: '自然记录',   en: 'Nature Doc',      zhDesc: '宁静深远',   enDesc: 'Calm & profound'   },
  { id: 'podcast_intro',       emoji: '🎙️', zh: '播客开场',   en: 'Podcast Intro',   zhDesc: '专业大气',   enDesc: 'Pro & polished'    },
];

/* --- Simple type cards --- */
const TYPE_CARDS = [
  {
    id: 'lyrics',
    icon: Music2,
    emoji: '🎵',
    color: 'from-violet-500 to-purple-600',
    zh: '写歌词',
    en: 'Write Lyrics',
    zhDesc: '输入主题，自动生成歌词',
    enDesc: 'Pick a theme → AI writes lyrics',
  },
  {
    id: 'bgm',
    icon: Sparkles,
    emoji: '🎶',
    color: 'from-pink-500 to-rose-600',
    zh: '做BGM',
    en: 'Make BGM',
    zhDesc: '选择场景，生成背景音乐',
    enDesc: 'Pick scene → background music',
  },
  {
    id: 'image',
    icon: ImageIcon,
    emoji: '🖼️',
    color: 'from-teal-500 to-emerald-600',
    zh: '看图写歌',
    en: 'Photo → Song',
    zhDesc: '上传图片，AI自动生成歌词',
    enDesc: 'Upload photo → AI writes lyrics',
  },
];

/* --- UI labels (all bilingual) --- */
const UI_LABELS = {
  zh: {
    // Step 1
    s1_title: '你想做什么？',
    s1_subtitle: '选择一种类型，我来帮你完成',
    // Step 2 - Lyrics
    s2_lyrics_title: '现在心情如何？',
    s2_lyrics_subtitle: '选择一种心情，我来写歌词',
    // Step 2 - BGM
    s2_bgm_title: '选择背景音乐类型',
    s2_bgm_subtitle: '不同场景需要不同的音乐',
    // Step 2 - Image
    s2_img_title: '上传一张图片',
    s2_img_subtitle: 'AI会根据图片内容自动生成歌词',
    img_click_to_pick: '点击选择图片',
    img_uploaded: '✓ 图片已上传',
    // Navigation
    back: '返回',
    next: '下一步',
    // Step 3 - Summary
    chosen_prefix: '已选择：',
    img_chip: '🖼️ 图片已上传',
    // Step 3 - Generate button
    one_click_gen: '✨ 一键生成',
    ai_is_analyzing_img: 'AI正在分析图片并创作...',
    ai_is_creating: 'AI根据你的选择创作...',
    ai_creating_title: 'AI正在创作中',
    pls_wait: '请稍等片刻',
    // Step 3 - Errors
    gen_failed_title: '生成失败',
    retry: '返回重试',
    // Step 3 - Tabs
    tab_all: '全部',
    tab_lyrics: '歌词',
    tab_command: '提示词',
    // Step 3 - Actions
    copy: '复制',
    regenerate: '重新生成',
    copy_tip: '💡 提示：复制后可粘贴到其他应用中使用',
    back_edit: '返回修改',
    // Header
    easy_mode: '简单模式',
    three_steps: '三步轻松创作',
    expert_mode: '专业模式',
    // Footer
    footer_tip: '适合所有人使用 · 无需音乐或电脑经验',
    // Toast / error messages
    toast_upload_image: '请上传图片文件',
    toast_image_analyzing: '图片已上传，正在分析...',
    toast_img_load_failed: '图片加载失败',
    toast_pick_mood: '请先选择一种类型和心情',
    toast_success: '生成成功！',
    toast_failed: '生成失败，请重试',
    gen_failed_retry: '生成失败，请重试',
    img_tag_uploaded: '图片已上传',
  },
  en: {
    // Step 1
    s1_title: 'What do you want to do?',
    s1_subtitle: 'Pick a type and I\'ll help you do it',
    // Step 2 - Lyrics
    s2_lyrics_title: 'How are you feeling now?',
    s2_lyrics_subtitle: 'Pick a mood, I\'ll write the lyrics',
    // Step 2 - BGM
    s2_bgm_title: 'Pick a background music style',
    s2_bgm_subtitle: 'Different scenes need different music',
    // Step 2 - Image
    s2_img_title: 'Upload an image',
    s2_img_subtitle: 'AI writes lyrics from the image content',
    img_click_to_pick: 'Click to pick an image',
    img_uploaded: '✓ Image uploaded',
    // Navigation
    back: 'Back',
    next: 'Next',
    // Step 3 - Summary
    chosen_prefix: 'Selected:',
    img_chip: '🖼️ Image uploaded',
    // Step 3 - Generate button
    one_click_gen: '✨ Generate Now',
    ai_is_analyzing_img: 'AI analyzing the image and creating...',
    ai_is_creating: 'AI creating based on your choices...',
    ai_creating_title: 'AI is creating',
    pls_wait: 'Please wait a moment',
    // Step 3 - Errors
    gen_failed_title: 'Generation failed',
    retry: 'Back and retry',
    // Step 3 - Tabs
    tab_all: 'All',
    tab_lyrics: 'Lyrics',
    tab_command: 'Prompt',
    // Step 3 - Actions
    copy: 'Copy',
    regenerate: 'Regenerate',
    copy_tip: '💡 Tip: Paste into any music generation app after copying',
    back_edit: 'Back to edit',
    // Header
    easy_mode: 'Easy Mode',
    three_steps: '3 steps to create',
    expert_mode: 'Expert Mode',
    // Footer
    footer_tip: 'For everyone · No music or computer experience needed',
    // Toast / error messages
    toast_upload_image: 'Please upload an image file',
    toast_image_analyzing: 'Image uploaded, analyzing...',
    toast_img_load_failed: 'Failed to load image',
    toast_pick_mood: 'Please pick a type and mood first',
    toast_success: 'Generated successfully!',
    toast_failed: 'Generation failed, please try again',
    gen_failed_retry: 'Generation failed, please try again',
    img_tag_uploaded: 'Image uploaded',
  },
};

export default function EasyMode({ onSwitchToExpert }) {
  const { t, lang } = useTranslation();
  const isZh = lang === 'zh';
  const L = UI_LABELS[isZh ? 'zh' : 'en'];

  const pick = (o) => isZh ? (o.zh || o.label) : (o.en || o.label);
  const pickDesc = (o) => isZh ? (o.zhDesc || o.desc) : (o.enDesc || o.desc);

  const { addToHistory, copyToClipboard, showToast } = useGeneration();

  /* --- Wizard state --- */
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedBgm, setSelectedBgm] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('all');
  const fileInputRef = useRef(null);

  /**
   * Handle image upload for "Photo → Song" type
   * Reads file, previews it, and runs AI analysis
   */
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(L.toast_upload_image, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      setUploadedImage(ev.target.result);
      showToast(L.toast_image_analyzing, 'success');
    };
    reader.readAsDataURL(file);
  };

  /**
   * Generate content based on selections
   * All technical parameters are auto-set with sensible defaults
   */
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      let params = {
        method: 'fsm',           // FSM is most reliable for local generation
        language: 'zh',          // Chinese by default
        duration: 'standard',
        complexity: 'moderate',
        variation: 'medium',
      };

      if (selectedType === 'lyrics' && selectedMood) {
        params.genre = selectedMood.style;
        params.theme = selectedMood.theme;
        params.bpm = selectedMood.bpm;
        params.subject = isZh ? '生活' : 'life';
      } else if (selectedType === 'bgm' && selectedBgm) {
        const styleInfo = MUSIC_STYLES[selectedBgm.id];
        params.genre = selectedBgm.id;
        params.theme = 'life';
        params.bpm = styleInfo?.bpmRange
          ? Math.round((styleInfo.bpmRange[0] + styleInfo.bpmRange[1]) / 2)
          : 90;
        params.script = styleInfo?.promptTemplate || '';
      } else if (selectedType === 'image' && uploadedImage) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error(L.toast_img_load_failed));
          img.src = uploadedImage;
        });
        const analysis = await fullImageAnalysis(img);
        params.genre = analysis?.scene?.genre?.[0] || analysis?.recommendedStyles?.[0] || 'pop';
        params.theme = analysis?.scene?.themes?.[0] || analysis?.themes?.[0] || 'nature';
        params.bpm = analysis?.scene?.tempos?.[1] || 90;
        params.visualContext = analysis;
        if (analysis?.visualContext) {
          params.visualContext.imagery = analysis.visualContext.imagery || analysis.scene?.imagery || [];
          params.visualContext.emotions = analysis.visualContext.emotions || analysis.scene?.emotions || [];
          params.visualContext.subjects = analysis.visualContext.subjects || analysis.scene?.subjects || [];
          params.visualContext.actions = analysis.visualContext.actions || analysis.scene?.actions || [];
          params.visualContext.locations = analysis.visualContext.locations || analysis.scene?.locations || [];
          params.visualContext.sceneId = analysis.scene?.profileId || '';
        }
      } else {
        showToast(L.toast_pick_mood, 'error');
        setIsGenerating(false);
        return;
      }

      const lyricsResult = generateLyrics(params);

      setResult({
        taskId: `easy-${Date.now()}`,
        method: params.method,
        result: lyricsResult,
        params
      });

      addToHistory({
        type: 'lyrics',
        method: params.method,
        theme: params.theme,
        style: params.genre,
        bpm: params.bpm,
        language: params.language,
        result: lyricsResult,
        source: 'easy_mode',
      });

      showToast(L.toast_success, 'success');
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err.message || L.gen_failed_retry);
      showToast(L.toast_failed, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedType(null);
    setSelectedMood(null);
    setSelectedBgm(null);
    setUploadedImage(null);
    setResult(null);
    setError(null);
  };

  const handleCopy = async (text) => {
    await copyToClipboard(text);
  };

  /* --- Helper: get result text --- */
  const getResultText = () => {
    if (!result?.result) return '';
    const r = result.result;
    return r.fullText || r.lyricsText || r.fullCommand || '';
  };

  const getLyricsText = () => {
    if (!result?.result) return '';
    return result.result.lyricsText || '';
  };

  const getCommandText = () => {
    if (!result?.result) return '';
    return result.result.fullCommand || '';
  };

  /* ============ RENDER ============ */

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-xl font-bold transition-all ${step >= s
              ? 'bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/30'
              : 'bg-white/10 text-gray-500'
              }`}
          >
            {step > s ? <Check className="w-5 h-5" /> : s}
          </div>
          {s < 3 && (
            <div className={`w-6 md:w-12 h-1 mx-1 md:mx-2 rounded-full ${step > s ? 'bg-violet-500' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );

  /* STEP 1: Choose what you want to do */
  const renderStep1 = () => (
    <div className="animate-fade-in">
      <StepIndicator />
      <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
        {L.s1_title}
      </h2>
      <p className="text-sm text-gray-400 text-center mb-8">
        {L.s1_subtitle}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
        {TYPE_CARDS.map((card) => {
          const Icon = card.icon;
          const isActive = selectedType === card.id;
          return (
            <button
              key={card.id}
              onClick={() => { setSelectedType(card.id); setTimeout(() => setStep(2), 300); }}
              className={`group relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 ${isActive
                ? 'border-violet-400 bg-violet-500/10 scale-105'
                : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }`}
              style={{ minHeight: '200px' }}
            >
              <div className={`w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-4xl md:text-5xl shadow-lg`}>
                <span>{card.emoji}</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-1">{pick(card)}</h3>
              <p className="text-sm text-gray-400">{pickDesc(card)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* STEP 2: Choose mood / BGM preset / upload img */
  const renderStep2 = () => (
    <div className="animate-fade-in">
      <StepIndicator />

      {selectedType === 'lyrics' && (
        <>
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            {L.s2_lyrics_title}
          </h2>
          <p className="text-sm text-gray-400 text-center mb-8">
            {L.s2_lyrics_subtitle}
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 max-w-3xl mx-auto">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood)}
                className={`p-4 md:p-5 rounded-2xl border-2 transition-all ${selectedMood?.id === mood.id
                  ? 'border-violet-400 bg-violet-500/20 scale-110 shadow-lg shadow-violet-500/30'
                  : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  }`}
                style={{ minHeight: '90px' }}
              >
                <div className="text-3xl md:text-4xl mb-1">{mood.emoji}</div>
                <div className="text-sm md:text-base font-semibold text-white">{pick(mood)}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedType === 'bgm' && (
        <>
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            {L.s2_bgm_title}
          </h2>
          <p className="text-sm text-gray-400 text-center mb-8">
            {L.s2_bgm_subtitle}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto">
            {BGM_PRESETS.map((bgm) => (
              <button
                key={bgm.id}
                onClick={() => setSelectedBgm(bgm)}
                className={`p-5 rounded-2xl border-2 transition-all text-left ${selectedBgm?.id === bgm.id
                  ? 'border-pink-400 bg-pink-500/20 scale-105 shadow-lg shadow-pink-500/30'
                  : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  }`}
              >
                <div className="text-3xl mb-2">{bgm.emoji}</div>
                <div className="text-base md:text-lg font-bold text-white mb-0.5">{pick(bgm)}</div>
                <div className="text-xs text-gray-400">{pickDesc(bgm)}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedType === 'image' && (
        <>
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            {L.s2_img_title}
          </h2>
          <p className="text-sm text-gray-400 text-center mb-8">
            {L.s2_img_subtitle}
          </p>

          <div className="max-w-md mx-auto">
            {!uploadedImage ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 md:p-12 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 hover:border-violet-400 hover:bg-violet-500/10 transition-all group"
                style={{ minHeight: '220px' }}
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <div className="text-lg md:text-xl font-bold text-white mb-1">{L.img_click_to_pick}</div>
                <div className="text-sm text-gray-400">{t('common.support_jpg_png')}</div>
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border-2 border-violet-400/50">
                <img src={uploadedImage} alt="Uploaded" className="w-full max-h-80 object-contain bg-black/30" />
                <button
                  onClick={() => setUploadedImage(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="p-3 bg-gradient-to-r from-violet-500/20 to-pink-500/20 text-center">
                  <div className="text-sm font-semibold text-white">{L.img_uploaded}</div>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 max-w-3xl mx-auto">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-3 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base">{L.back}</span>
        </button>

        <button
          onClick={() => setStep(3)}
          disabled={(selectedType === 'lyrics' && !selectedMood) || (selectedType === 'bgm' && !selectedBgm) || (selectedType === 'image' && !uploadedImage)}
          className="px-8 py-3 md:px-10 md:py-4 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-base md:text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/30 transition-all flex items-center gap-2"
        >
          <span>{L.next}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  /* STEP 3: Generate & show results */
  const renderStep3 = () => (
    <div className="animate-fade-in">
      <StepIndicator />

      {/* Summary bar */}
      <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-gray-400">{L.chosen_prefix}</span>
          <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-200">
            {pick(TYPE_CARDS.find(c => c.id === selectedType))}
          </span>
          {selectedMood && (
            <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-200">
              {selectedMood.emoji} {pick(selectedMood)}
            </span>
          )}
          {selectedBgm && (
            <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-200">
              {selectedBgm.emoji} {pick(selectedBgm)}
            </span>
          )}
          {uploadedImage && (
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-200">
              {L.img_chip}
            </span>
          )}
        </div>
      </div>

      {/* Generate button or results */}
      {!result && !isGenerating && !error && (
        <div className="text-center">
          <button
            onClick={handleGenerate}
            className="relative px-12 py-8 md:px-16 md:py-10 rounded-2xl bg-gradient-to-r from-violet-500 via-pink-500 to-rose-500 text-white font-bold text-xl md:text-2xl shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/40 transition-all hover:scale-105 flex items-center gap-3 mx-auto"
          >
            <Sparkles className="w-7 h-7" />
            <span>{L.one_click_gen}</span>
          </button>
          <p className="mt-4 text-sm text-gray-400">
            {selectedType === 'image' ? L.ai_is_analyzing_img : L.ai_is_creating}
          </p>
        </div>
      )}

      {isGenerating && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Sparkles className="w-10 h-10 text-white animate-spin" />
          </div>
          <div className="text-xl font-bold text-white mb-2">{L.ai_creating_title}</div>
          <div className="text-sm text-gray-400">{L.pls_wait}</div>
        </div>
      )}

      {error && (
        <div className="max-w-2xl mx-auto text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-lg font-bold text-red-400 mb-2">{L.gen_failed_title}</div>
          <div className="text-sm text-gray-400 mb-6">{error}</div>
          <button
            onClick={() => { setError(null); setStep(2); }}
            className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            {L.retry}
          </button>
        </div>
      )}

      {result && !isGenerating && (
        <div className="max-w-3xl mx-auto">
          {/* Result tabs */}
          <div className="flex gap-2 mb-4 rounded-xl bg-white/5 p-1">
            {[
              { id: 'all', label: L.tab_all },
              { id: 'lyrics', label: L.tab_lyrics },
              { id: 'command', label: L.tab_command }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveResultTab(tab.id)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeResultTab === tab.id
                  ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Result content */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
            <div className="min-h-[200px] max-h-[400px] overflow-y-auto whitespace-pre-wrap text-base md:text-lg text-gray-100 allow-select leading-relaxed">
              {activeResultTab === 'all' && getResultText()}
              {activeResultTab === 'lyrics' && (getLyricsText() || getResultText())}
              {activeResultTab === 'command' && (getCommandText() || getResultText())}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => handleCopy(
                activeResultTab === 'lyrics' ? getLyricsText() :
                  activeResultTab === 'command' ? getCommandText() :
                    getResultText()
              )}
              className="flex-1 min-w-[140px] py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/30 transition-all"
            >
              <Copy className="w-5 h-5" />
              <span className="text-base">{L.copy}</span>
            </button>
            <button
              onClick={handleReset}
              className="flex-1 min-w-[140px] py-3 rounded-xl bg-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="text-base">{L.regenerate}</span>
            </button>
          </div>

          {/* Share tip */}
          <div className="mt-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-sm text-violet-200 text-center">
            {L.copy_tip}
          </div>
        </div>
      )}

      {/* Back button */}
      {!isGenerating && !result && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setStep(2)}
            className="px-6 py-3 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-base">{L.back_edit}</span>
          </button>
        </div>
      )}
    </div>
  );

  /* Main layout */
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">{L.easy_mode}</h1>
            <p className="text-xs text-gray-400">{L.three_steps}</p>
          </div>
        </div>
        <button
          onClick={onSwitchToExpert}
          className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5"
        >
          <Settings className="w-4 h-4" />
          <span>{L.expert_mode}</span>
        </button>
      </div>

      {/* Steps */}
      <div className="min-h-[400px]">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      {/* Footer tips */}
      <div className="mt-10 text-center text-xs text-gray-500">
        <p>{L.footer_tip}</p>
      </div>
    </div>
  );
}
