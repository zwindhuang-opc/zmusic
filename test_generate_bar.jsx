// Minimal test for the new generate bar
import { useState } from 'react';
import { Loader, Sparkles, SettingsIcon, ChevronUp, ChevronDown, FileText, Mic, AlertCircle, Check, Wand2, Upload, X, Music2, Copy, Video, Sliders } from 'lucide-react';

const METHODS = [
  { id: 'v1', name: 'Method 1', icon: Sparkles, desc: 'Test method' }
];

const POPULAR_STYLES = [
  { id: 'pop', label: 'Pop' }
];

const POPULAR_THEMES = [
  { id: 'love', label: 'Love' }
];

function TestComponent() {
  const [genre, setGenre] = useState('pop');
  const [theme, setTheme] = useState('love');
  const [method, setMethod] = useState('v1');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showExploreStyles, setShowExploreStyles] = useState(false);
  const [showExploreThemes, setShowExploreThemes] = useState(false);

  const t = (key) => key;
  const handleGenerate = () => {};

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in pb-52 md:pb-8">
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">Test</h1>
            </div>
          </div>
        </div>
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
              <label className="text-xs font-medium text-gray-300 mb-3 block">Method</label>
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
            <div className="rounded-xl bg-black/30 border border-violet-500/20 overflow-hidden">
              <pre className="p-4 text-xs text-pink-200 font-mono whitespace-pre-wrap break-words max-h-[70vh] overflow-y-auto leading-relaxed">{result.command}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestComponent;