import React, { useState } from 'react';
import { Image as ImageIcon, Upload, Sparkles, Loader, X, Check, Wand2, History, Copy, Mic, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { fullImageAnalysis } from '../utils/visionAnalyzer.js';
import { generateLyrics } from '../utils/lyricsEngine.js';
import HistoryPanel from '../components/HistoryPanel.jsx';
import { LYRICS_STYLES, LYRICS_THEMES } from '../config/lyricsStyles.js';

/**
 * Dedicated page: Image → Lyrics
 * Upload a picture, AI analyzes it, recommends style/theme, generates lyrics.
 * Clean, single-purpose UI — no tabs, no clutter.
 */
export default function ImageLyricsPage({ onNavigate }) {
  const { t } = useTranslation();
  const { addToHistory, copyToClipboard } = useGeneration();

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionResult, setVisionResult] = useState(null);
  const [visionError, setVisionError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [genre, setGenre] = useState('pop');
  const [theme, setTheme] = useState('love');
  const [language, setLanguage] = useState('zh');
  const [script, setScript] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const FALLBACK_GENRES = Object.keys(LYRICS_STYLES);
  const FALLBACK_THEMES = Object.keys(LYRICS_THEMES);

  const SUGGESTED_STYLES = visionResult?.styles?.slice(0, 6) || [
    { id: 'pop', label: '流行' },
    { id: 'ballad', label: '民谣' },
    { id: 'electronic', label: '电子' },
    { id: 'folk', label: '民谣' },
    { id: 'ambient', label: '氛围' },
    { id: 'romantic', label: '浪漫' },
  ];

  const handleFileSelect = async (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setVisionError('仅支持 JPG/PNG/WebP/GIF 格式');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setVisionError('图片过大，最大 10MB');
      return;
    }
    setVisionError(null);
    setImageFile(file);
    setVisionResult(null);
    setResult(null);

    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
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
        img.onerror = () => reject(new Error('图片加载失败'));
      });
      const result = await fullImageAnalysis(img);
      setVisionResult(result);
      if (result.suggestions?.genre && FALLBACK_GENRES.includes(result.suggestions.genre)) {
        setGenre(result.suggestions.genre);
      }
      if (result.suggestions?.theme && FALLBACK_THEMES.includes(result.suggestions.theme)) {
        setTheme(result.suggestions.theme);
      }
      if (result.description) {
        setScript(`[图片灵感] ${result.description}`);
      }
    } catch (err) {
      setVisionError(err.message || '图片分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!visionResult) return;
    setIsGenerating(true);
    setResult(null);
    setError(null);
    try {
      const params = {
        genre, theme, language,
        method: 'basic',
        bpm: 120, duration: 180,
        script,
        visualContext: visionResult.visualContext,
      };
      const lyricsResult = generateLyrics(params);
      const data = { success: true, data: { taskId: `img-${Date.now()}`, method: 'basic', result: lyricsResult } };
      if (data.success) {
        setResult(data.data);
        addToHistory({
          type: 'lyrics', method: 'basic', theme, style: genre,
          language, result: data.data,
          visualContext: visionResult.visualContext?.sceneId || 'image',
        });
      }
    } catch (err) {
      setError(err.message || t('common.error_connection'));
    } finally {
      setIsGenerating(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setVisionResult(null);
    setVisionError(null);
    setResult(null);
    setScript('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in pb-52 md:pb-8">
      {/* Header */}
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">图片灵感作词</h1>
              <p className="text-[10px] md:text-xs text-gray-400">上传一张图，AI 根据色彩和氛围生成歌词</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-gray-300"
          >
            <History className="w-3.5 h-3.5" /> 历史
          </button>
        </div>
      </div>

      {/* Main content: 2 columns on desktop, stacked on mobile */}
      <div className="md:grid md:grid-cols-2 md:gap-4 space-y-4 md:space-y-0">
        {/* Left: Upload + Analysis */}
        <div className="space-y-4">
          {/* Upload zone */}
          <div className="gradient-border p-4">
            <label className="text-xs font-medium text-gray-300 mb-2 block">1. 上传图片</label>
            {!imagePreview ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => document.getElementById('img-file').click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all ${isDragging ? 'border-violet-400 bg-violet-500/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                  } p-8 text-center`}
              >
                <input id="img-file" type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])} />
                <Upload className="w-8 h-8 mx-auto mb-3 text-gray-500" />
                <p className="text-sm text-gray-300">拖拽图片到此处，或点击浏览</p>
                <p className="text-[10px] text-gray-500 mt-1">支持 JPG、PNG、WebP、GIF（最大 10MB）</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-white/10">
                <img src={imagePreview} alt="preview" className="w-full max-h-64 object-contain bg-black/20" />
                <button onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center hover:bg-black/80 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <Loader className="w-4 h-4 animate-spin" /> AI 分析中...
                    </div>
                  </div>
                )}
              </div>
            )}
            {visionError && (
              <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                <X className="w-3 h-3" /> {visionError}
              </p>
            )}
            <p className="mt-2 text-[10px] text-gray-500">💡 提示：风景、人物、情绪强烈的图片分析效果最佳</p>
          </div>

          {/* Analysis results */}
          {visionResult && !isAnalyzing && (
            <div className="gradient-border p-4 space-y-3">
              <label className="text-xs font-medium text-gray-300 block">2. AI 分析结果</label>

              {/* Scene & mood tags */}
              <div className="flex flex-wrap gap-1.5">
                {visionResult.scene?.category && (
                  <span className="px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 text-[10px] border border-violet-500/30">
                    🎬 {visionResult.scene.category}
                  </span>
                )}
                {visionResult.moods?.slice(0, 4).map((m, i) => (
                  <span key={i} className="px-2 py-1 rounded-full bg-pink-500/20 text-pink-300 text-[10px] border border-pink-500/30">
                    {m}
                  </span>
                ))}
                {visionResult.colorTone && (
                  <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30">
                    🎨 {visionResult.colorTone === 'dark' ? '暗色调' : visionResult.colorTone === 'bright' ? '亮色调' : visionResult.colorTone}
                  </span>
                )}
              </div>

              {/* Description */}
              {visionResult.description && (
                <p className="text-xs text-gray-400 leading-relaxed bg-white/5 rounded-lg p-2.5">
                  {visionResult.description}
                </p>
              )}

              {/* Recommended style chips */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1.5">🎵 推荐风格</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_STYLES.map((s) => (
                    <button key={typeof s === 'string' ? s : s.id}
                      onClick={() => setGenre(typeof s === 'string' ? s : s.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${genre === (typeof s === 'string' ? s : s.id)
                        ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      {typeof s === 'string' ? (t(`lyrics_styles.${s}`) || t(`styles.${s}`) || s) : s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommended theme */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1.5">🎯 推荐主题</p>
                <div className="flex flex-wrap gap-1.5">
                  {['love', 'heartbreak', 'nostalgic', 'hope', 'dreams'].map((tm) => (
                    <button key={tm}
                      onClick={() => setTheme(tm)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${theme === tm
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      {t(`lyrics_themes.${tm}`) || t(`themes.${tm}`) || tm}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Generate */}
        <div className="space-y-4">
          {/* Generate Bar (top) */}
          <div className="gradient-border p-4">
            <label className="text-xs font-medium text-gray-300 mb-2 block">确认参数并生成</label>

            {/* Selected summary + language inline */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-300 text-[11px]">{t(`lyrics_themes.${theme}`) || theme}</span>
              <span className="px-2 py-1 rounded bg-pink-500/10 text-pink-300 text-[11px]">{t(`lyrics_styles.${genre}`) || genre}</span>
              <div className="flex gap-1">
                {[
                  { id: 'zh', label: '中文' },
                  { id: 'en', label: 'EN' },
                  { id: 'mix', label: '混合' },
                ].map((l) => (
                  <button key={l.id}
                    onClick={() => setLanguage(l.id)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-all ${language === l.id
                      ? 'bg-violet-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button - prominent, top */}
            <button
              onClick={handleGenerate}
              disabled={!visionResult || isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
            >
              {isGenerating ? (
                <><Loader className="w-4 h-4 animate-spin" /> AI 生成中...</>
              ) : (
                <><Wand2 className="w-4 h-4" /> ✨ 根据图片生成歌词</>
              )}
            </button>
            {!visionResult && (
              <p className="mt-2 text-[10px] text-gray-500 text-center">请先上传一张图片</p>
            )}
          </div>

          {/* AI Analysis / Script (collapsible, below generate) */}
          {visionResult && (
            <div className="gradient-border p-4">
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className="w-full flex items-center justify-between text-xs font-medium text-gray-300"
              >
                <span>🤖 AI 分析结果</span>
                {showAnalysis ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showAnalysis && (
                <div className="mt-3 space-y-2">
                  {(visionResult.visualContext?.emotions?.length > 0) && (
                    <div>
                      <span className="text-[10px] text-gray-500 block mb-1">情绪</span>
                      <div className="flex flex-wrap gap-1">
                        {(visionResult.visualContext.emotions || []).map(e => (
                          <span key={e} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-300">{e}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(visionResult.colorPalette?.length > 0) && (
                    <div>
                      <span className="text-[10px] text-gray-500 block mb-1">色彩</span>
                      <div className="flex flex-wrap gap-1">
                        {(visionResult.colorPalette || []).map(c => (
                          <span key={c.hex} className="px-2 py-0.5 rounded text-[10px] text-white" style={{ background: c.hex }}>{Math.round((c.percentage || 0) * 100)}%</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {(visionResult.suggestions?.alternatives?.themes?.length > 0) && (
                      <div>
                        <span className="text-[10px] text-gray-500 block mb-1">推荐主题</span>
                        <div className="flex flex-wrap gap-1">
                          {(visionResult.suggestions.alternatives.themes || []).map(th => (
                            <button key={th} onClick={() => setTheme(th)}
                              className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${theme === th ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                              {th}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {(visionResult.suggestions?.alternatives?.styles?.length > 0) && (
                      <div>
                        <span className="text-[10px] text-gray-500 block mb-1">推荐风格</span>
                        <div className="flex flex-wrap gap-1">
                          {(visionResult.suggestions.alternatives.styles || []).map(st => (
                            <button key={st} onClick={() => setGenre(st)}
                              className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${genre === st ? 'bg-violet-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {visionResult.description && (
                    <div>
                      <span className="text-[10px] text-gray-500 block mb-1">灵感描述</span>
                      <textarea
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
                        placeholder="AI 根据图片自动生成的灵感描述..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="gradient-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" /> 生成完成
                </h3>
                <button
                  onClick={() => {
                    const text = result.result?.fullText || '';
                    copyToClipboard(text);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-gray-300 transition-all flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> 复制
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {result.result?.lyricsText?.split('\n').map((line, i) => (
                  <p key={i} className="text-sm text-gray-300 leading-relaxed">{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History modal */}
      {showHistory && (
        <HistoryPanel
          onClose={() => setShowHistory(false)}
          onSelect={(item) => {
            setGenre(item.style || 'pop');
            setTheme(item.theme || 'love');
            setResult(item.result);
            setShowHistory(false);
          }}
        />
      )}
    </div>
  );
}
