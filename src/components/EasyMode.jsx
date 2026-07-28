/**
 * EasyMode.jsx - Elderly-friendly 3-step wizard
 * 
 * Designed for non-technical users and elderly users.
 * Large fonts, big touch targets, Chinese-first, icon-guided.
 * All technical parameters are auto-selected with sensible defaults.
 *
 * Steps:
 * 1. Choose: 写歌词 (Generate Lyrics) / 做BGM (Make BGM) / 看图写歌 (Image-to-Song)
 * 2. Mood: Pick an emotion with emoji, or upload a picture
 * 3. Generate: One big button → results with copy/share
 */

import React, { useState, useRef } from 'react';
import {
  Sparkles, Music2, Image as ImageIcon, Upload, Play, Copy, Check,
  ArrowRight, ArrowLeft, RefreshCw, Share2, Heart, Smile, Frown,
  Sun, Moon, Cloud, Zap, Coffee, Music, Palette, Camera, X
} from 'lucide-react';
import { useTranslation } from '../i18n/index.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { generateLyrics } from '../utils/lyricsEngine.js';
import { fullImageAnalysis } from '../utils/visionAnalyzer.js';
import { MUSIC_STYLES } from '../config/musicStyles.js';

/* --- Mood options with emoji for elderly-friendly selection --- */
const MOOD_OPTIONS = [
  { id: 'happy', emoji: '😊', label: '开心', style: 'pop', theme: 'happy', bpm: 120 },
  { id: 'sad', emoji: '😢', label: '伤心', style: 'ballad', theme: 'sadness', bpm: 70 },
  { id: 'love', emoji: '💕', label: '爱情', style: 'love_song', theme: 'love', bpm: 80 },
  { id: 'healing', emoji: '🌿', label: '治愈', style: 'healing', theme: 'healing', bpm: 75 },
  { id: 'excited', emoji: '🎉', label: '兴奋', style: 'energetic', theme: 'excitement', bpm: 130 },
  { id: 'nostalgia', emoji: '📷', label: '怀旧', style: 'folk', theme: 'nostalgia', bpm: 85 },
  { id: 'dreamy', emoji: '✨', label: '梦幻', style: 'dreamy', theme: 'dream', bpm: 90 },
  { id: 'nature', emoji: '🌳', label: '自然', style: 'ambient', theme: 'nature', bpm: 70 },
  { id: 'food', emoji: '🍜', label: '美食', style: 'food_vlog', theme: 'life', bpm: 90 },
  { id: 'travel', emoji: '✈️', label: '旅行', style: 'pop', theme: 'adventure', bpm: 110 },
  { id: 'dance', emoji: '💃', label: '跳舞', style: 'dance_party', theme: 'party', bpm: 128 },
  { id: 'story', emoji: '📖', label: '故事', style: 'emotional_story', theme: 'story', bpm: 75 },
];

/* --- BGM style presets (simplified) --- */
const BGM_PRESETS = [
  { id: 'xiaohongshu_vlog', emoji: '📕', label: '小红书Vlog', desc: '温暖舒适' },
  { id: 'food_vlog', emoji: '🍜', label: '美食视频', desc: '愉快俏皮' },
  { id: 'commercial_ad', emoji: '📢', label: '商业广告', desc: '积极活力' },
  { id: 'dance_party', emoji: '🎉', label: '派对舞曲', desc: '动感节奏' },
  { id: 'nature_documentary', emoji: '🌿', label: '自然记录', desc: '宁静深远' },
  { id: 'podcast_intro', emoji: '🎙️', label: '播客开场', desc: '专业大气' },
];

/* --- Simple type cards --- */
const TYPE_CARDS = [
  {
    id: 'lyrics',
    icon: Music2,
    emoji: '🎵',
    color: 'from-violet-500 to-purple-600',
    label: '写歌词',
    desc: '输入主题，自动生成歌词',
    descEn: 'Write lyrics from a theme'
  },
  {
    id: 'bgm',
    icon: Sparkles,
    emoji: '🎶',
    color: 'from-pink-500 to-rose-600',
    label: '做BGM',
    desc: '选择场景，生成背景音乐',
    descEn: 'Make background music'
  },
  {
    id: 'image',
    icon: ImageIcon,
    emoji: '🖼️',
    color: 'from-teal-500 to-emerald-600',
    label: '看图写歌',
    desc: '上传图片，AI自动生成歌词',
    descEn: 'Upload photo → AI writes lyrics'
  },
];

export default function EasyMode({ onSwitchToExpert }) {
  const { t } = useTranslation();
  const { addToHistory, copyToClipboard, showToast } = useGeneration();

  /* --- Wizard state --- */
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null); // 'lyrics' | 'bgm' | 'image'
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedBgm, setSelectedBgm] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('all');
  const fileInputRef = useRef(null);

  /**
   * Handle image upload for "看图写歌" type
   * Reads file, previews it, and runs AI analysis
   */
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('请上传图片文件', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      setUploadedImage(ev.target.result);
      showToast('图片已上传，正在分析...', 'success');
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
        params.subject = '生活';
      } else if (selectedType === 'bgm' && selectedBgm) {
        const styleInfo = MUSIC_STYLES[selectedBgm.id];
        params.genre = selectedBgm.id;
        params.theme = 'life';
        params.bpm = styleInfo?.bpmRange
          ? Math.round((styleInfo.bpmRange[0] + styleInfo.bpmRange[1]) / 2)
          : 90;
        params.script = styleInfo?.promptTemplate || '';
      } else if (selectedType === 'image' && uploadedImage) {
        const analysis = await fullImageAnalysis(uploadedImage);
        params.genre = analysis?.recommendedStyles?.[0] || 'pop';
        params.theme = analysis?.themes?.[0] || 'nature';
        params.bpm = 90;
        params.visualContext = analysis;
      } else {
        showToast('请先选择一种类型和心情', 'error');
        setIsGenerating(false);
        return;
      }

      // Use local generation (works offline, no server needed)
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

      showToast('生成成功！', 'success');
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err.message || '生成失败，请重试');
      showToast('生成失败，请重试', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Reset wizard to step 1
   */
  const handleReset = () => {
    setStep(1);
    setSelectedType(null);
    setSelectedMood(null);
    setSelectedBgm(null);
    setUploadedImage(null);
    setResult(null);
    setError(null);
  };

  /**
   * Handle copy to clipboard with feedback
   */
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

  /* -- Step indicator -- */
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

  /* ============================================= */
  /* STEP 1: Choose what you want to do            */
  /* ============================================= */
  const renderStep1 = () => (
    <div className="animate-fade-in">
      <StepIndicator />
      <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
        你想做什么？
      </h2>
      <p className="text-sm text-gray-400 text-center mb-8">
        选择一种类型，我来帮你完成
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
              <h3 className="text-lg md:text-xl font-bold text-white mb-1">{card.label}</h3>
              <p className="text-sm text-gray-400">{card.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ============================================= */
  /* STEP 2: Choose mood / BGM preset / upload img  */
  /* ============================================= */
  const renderStep2 = () => (
    <div className="animate-fade-in">
      <StepIndicator />

      {selectedType === 'lyrics' && (
        <>
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            现在心情如何？
          </h2>
          <p className="text-sm text-gray-400 text-center mb-8">
            选择一种心情，我来写歌词
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
                <div className="text-sm md:text-base font-semibold text-white">{mood.label}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedType === 'bgm' && (
        <>
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            选择背景音乐类型
          </h2>
          <p className="text-sm text-gray-400 text-center mb-8">
            不同场景需要不同的音乐
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
                <div className="text-base md:text-lg font-bold text-white mb-0.5">{bgm.label}</div>
                <div className="text-xs text-gray-400">{bgm.desc}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedType === 'image' && (
        <>
          <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2">
            上传一张图片
          </h2>
          <p className="text-sm text-gray-400 text-center mb-8">
            AI会根据图片内容自动生成歌词
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
                <div className="text-lg md:text-xl font-bold text-white mb-1">点击选择图片</div>
                <div className="text-sm text-gray-400">支持 JPG, PNG 格式</div>
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
                  <div className="text-sm font-semibold text-white">✓ 图片已上传</div>
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
          <span className="text-base">返回</span>
        </button>

        <button
          onClick={() => setStep(3)}
          disabled={(selectedType === 'lyrics' && !selectedMood) || (selectedType === 'bgm' && !selectedBgm) || (selectedType === 'image' && !uploadedImage)}
          className="px-8 py-3 md:px-10 md:py-4 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-base md:text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/30 transition-all flex items-center gap-2"
        >
          <span>下一步</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  /* ============================================= */
  /* STEP 3: Generate & show results                */
  /* ============================================= */
  const renderStep3 = () => (
    <div className="animate-fade-in">
      <StepIndicator />

      {/* Summary bar */}
      <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-gray-400">已选择：</span>
          <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-200">
            {TYPE_CARDS.find(c => c.id === selectedType)?.label}
          </span>
          {selectedMood && (
            <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-200">
              {selectedMood.emoji} {selectedMood.label}
            </span>
          )}
          {selectedBgm && (
            <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-200">
              {selectedBgm.emoji} {selectedBgm.label}
            </span>
          )}
          {uploadedImage && (
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-200">
              🖼️ 图片已上传
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
            <span>✨ 一键生成</span>
          </button>
          <p className="mt-4 text-sm text-gray-400">
            {selectedType === 'image' ? 'AI正在分析图片并创作...' : 'AI根据你的选择创作...'}
          </p>
        </div>
      )}

      {isGenerating && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Sparkles className="w-10 h-10 text-white animate-spin" />
          </div>
          <div className="text-xl font-bold text-white mb-2">AI创作中...</div>
          <div className="text-sm text-gray-400">请稍等片刻</div>
        </div>
      )}

      {error && (
        <div className="max-w-2xl mx-auto text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-lg font-bold text-red-400 mb-2">生成失败</div>
          <div className="text-sm text-gray-400 mb-6">{error}</div>
          <button
            onClick={() => { setError(null); setStep(2); }}
            className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            返回重试
          </button>
        </div>
      )}

      {result && !isGenerating && (
        <div className="max-w-3xl mx-auto">
          {/* Result tabs */}
          <div className="flex gap-2 mb-4 rounded-xl bg-white/5 p-1">
            {[
              { id: 'all', label: '全部' },
              { id: 'lyrics', label: '歌词' },
              { id: 'command', label: '提示词' }
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
              <span className="text-base">复制</span>
            </button>
            <button
              onClick={handleReset}
              className="flex-1 min-w-[140px] py-3 rounded-xl bg-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="text-base">重新生成</span>
            </button>
          </div>

          {/* Share tip */}
          <div className="mt-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-sm text-violet-200 text-center">
            💡 提示：复制后可粘贴到其他应用中使用
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
            <span className="text-base">返回修改</span>
          </button>
        </div>
      )}
    </div>
  );

  /* ============================================= */
  /* Main layout                                    */
  /* ============================================= */
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">简单模式</h1>
            <p className="text-xs text-gray-400">三步轻松创作</p>
          </div>
        </div>
        <button
          onClick={onSwitchToExpert}
          className="px-4 py-2 rounded-lg bg-white/5 text-gray-300 text-sm hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5"
        >
          <Settings className="w-4 h-4" />
          <span>专业模式</span>
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
        <p>适合所有人使用 · 无需音乐或电脑经验</p>
      </div>
    </div>
  );
}