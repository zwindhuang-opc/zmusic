// Test just the advanced section
import { useState } from 'react';
import { Loader, Sparkles, SettingsIcon, ChevronUp, ChevronDown, FileText, Mic, AlertCircle, Check, Wand2, Upload, X, Music2, Copy, Video, Sliders } from 'lucide-react';

const METHODS = [
  { id: 'v1', name: 'Method 1', icon: Sparkles, desc: 'Test method' }
];

const LANGUAGES = [
  { id: 'en', name: 'English' }
];

const VARIATIONS = ['Low', 'Medium', 'High'];

function TestComponent() {
  const [method, setMethod] = useState('v1');
  const [language, setLanguage] = useState('en');
  const [variation, setVariation] = useState('Medium');
  const [complexity, setComplexity] = useState(5);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [visionError, setVisionError] = useState(null);
  const [visionResult, setVisionResult] = useState(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState(false);
  const [script, setScript] = useState('');

  const t = (key) => key;
  const handleGenerate = () => {};
  const handleDrop = () => {};
  const handleDragOver = () => {};
  const handleDragLeave = () => {};
  const handleFileSelect = () => {};
  const clearImage = () => {};
  const applyVisionSuggestions = () => {};
  const getVisualStyleRecommendations = () => [];
  const getComplexityLabel = (c) => 'Label';

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in pb-52 md:pb-8">
      <div className="gradient-border p-4 space-y-3">
        <button onClick={handleGenerate} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold text-base">
          Generate
        </button>
      </div>

      {/* MIDDLE: COLLAPSIBLE ADVANCED */}
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

            {/* Language */}
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

            {/* Variation */}
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
            </div>

            {/* Complexity */}
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
              </div>
            </div>

            {/* Image Upload */}
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
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-black/30 border border-white/10">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-contain" />
                  </div>
                </div>
              )}
            </div>

            {/* Script */}
            <div className="gradient-border p-4 md:p-5">
              <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.script')}</label>
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
        </div>
      </div>
    </div>
  );
}

export default TestComponent;