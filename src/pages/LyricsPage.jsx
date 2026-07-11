import React, { useState, useEffect } from 'react';
import { Mic, Sparkles, Loader, FileText, Cpu, Network, BookOpen, Settings as SettingsIcon, Wand2, Clock, Music2, User, History, ArrowRight, Copy, Music, Video } from 'lucide-react';
import { useTranslation } from '../i18n/index.js';
import api from '../services/api.client.js';
import { useGeneration } from '../stores/generationStore.jsx';
import HistoryPanel from '../components/HistoryPanel.jsx';

function LyricsPage({ onNavigate }) {
  const { t } = useTranslation();
  const { addToHistory, copyToClipboard, setPendingLyrics } = useGeneration();

  const FALLBACK_GENRES = ['pop', 'rock', 'electronic', 'hip_hop', 'ballad', 'chinese_traditional', 'jazz', 'classical', 'rnb', 'country', 'love_song', 'chinese_classical', 'tango', 'ancient_modern'];
  const FALLBACK_THEMES = ['love', 'friendship', 'success', 'dreams', 'nature', 'life', 'loneliness', 'sadness', 'memory', 'hope', 'lunatic', 'tango'];

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

  const [genres, setGenres] = useState(FALLBACK_GENRES);
  const [themes, setThemes] = useState(FALLBACK_THEMES);
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
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const getComplexityLabel = (level) => {
    if (level <= 2) return t('lyrics.simple');
    if (level <= 5) return t('lyrics.medium');
    if (level <= 8) return t('lyrics.complex');
    return t('lyrics.very_complex');
  };

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const data = await api.lyricsGenres();
      if (data.success && data.data?.genres?.length > 0) {
        setGenres(data.data.genres);
        setThemes(data.data.themes || FALLBACK_THEMES);
      }
    } catch (error) {
      console.error('Genres load failed, using fallback:', error);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    try {
      const params = {
        genre,
        theme,
        method,
        bpm,
        duration,
        subject,
        object,
        complexity,
        language,
        variation,
        reference,
        script
      };
      const data = await api.agentLyrics(params);
      if (data.success) {
        setResult(data.data);
        addToHistory({
          type: 'lyrics',
          method,
          theme,
          style: genre,
          bpm,
          language,
          variation,
          reference,
          script,
          result: data.data.result
        });
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in pb-28 md:pb-6">
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
        <div className="md:col-span-1 space-y-3 md:space-y-4">
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
            <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.genre')}</label>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
              {genres.map(g => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${genre === g
                    ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                  {t(`styles.${g}`) || g}
                </button>
              ))}
            </div>
          </div>

          <div className="gradient-border p-4 md:p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.theme')}</label>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
              {themes.map(tm => (
                <button
                  key={tm}
                  onClick={() => setTheme(tm)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${theme === tm
                    ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                  {t(`themes.${tm}`) || tm}
                </button>
              ))}
            </div>
          </div>

          <div className="gradient-border p-4 md:p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.language')}</label>
            <div className="space-y-2">
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  onClick={() => setLanguage(l.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-2 ${language === l.id
                    ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30'
                    : 'bg-white/5 border border-white/5 hover:border-white/10'
                    }`}
                >
                  <div>
                    <div className="text-sm font-medium text-white">{l.name}</div>
                    <div className="text-[10px] md:text-xs text-gray-400">{l.desc}</div>
                  </div>
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
                type="range"
                min="1"
                max="10"
                value={complexity}
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

          <div className="gradient-border p-4 md:p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">{t('lyrics.parameters')}</label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">{t('lyrics.subject')}</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider">{t('lyrics.object')}</label>
                  <input
                    type="text"
                    value={object}
                    onChange={(e) => setObject(e.target.value)}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Music2 className="w-3 h-3" />
                    {t('lyrics.bpm')}
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="200"
                    value={bpm}
                    onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t('lyrics.duration')}
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="600"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 270)}
                    className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {t('lyrics.reference')}
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={t('lyrics.reference_placeholder')}
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
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder={t('lyrics.script_placeholder')}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 placeholder-gray-600 resize-none"
            />
            <p className="text-[10px] text-gray-600 mt-2">{t('lyrics.script_hint')}</p>
          </div>

        </div>

        <div className="md:col-span-2 gradient-border p-4 md:p-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-pink-400" />
            {t('lyrics.generated_content')}
          </h3>
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
                    {t(`styles.${result.result?.style}`) || result.result?.style || genre}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div className="text-[10px] text-blue-300 uppercase tracking-wider mb-1">{t('lyrics.theme')}</div>
                  <div className="text-sm text-white font-medium">
                    {t(`themes.${result.result?.theme}`) || result.result?.theme || theme}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div className="text-[10px] text-green-300 uppercase tracking-wider mb-1">{t('lyrics.language')}</div>
                  <div className="text-sm text-white font-medium">
                    {t(`lyrics.language_${language}`) || language.toUpperCase()}
                  </div>
                </div>
              </div>

              {result.result?.script && (
                <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <div className="text-[10px] text-yellow-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Wand2 className="w-3 h-3" />
                    {t('lyrics.user_intent')}
                  </div>
                  <p className="text-sm text-white italic">{result.result.script}</p>
                </div>
              )}

              {result.command && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{t('lyrics.generated_command')}</div>
                    <button
                      onClick={() => copyToClipboard(result.command)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs text-gray-400 hover:bg-white/10 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      {t('common.copy')}
                    </button>
                  </div>
                  <pre className="text-xs text-pink-300 font-mono whitespace-pre-wrap break-words">{result.command}</pre>
                </div>
              )}

              {result.result?.fullText && (
                <div className="p-3 md:p-4 rounded-lg bg-white/5 border border-white/5 max-h-[50vh] overflow-y-auto">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{t('lyrics.lyrics_output')}</div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          copyToClipboard(result.result.fullText);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-gray-300"
                        title={t('common.copy')}
                      >
                        <Copy className="w-3 h-3" />
                        {t('common.copy')}
                      </button>
                      <button
                        onClick={() => {
                          setPendingLyrics(result.result.fullText);
                          onNavigate?.('music');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/20 transition-colors text-xs text-violet-300"
                        title={t('lyrics.send_to_music')}
                      >
                        <Music className="w-3 h-3" />
                        {t('lyrics.send_to_music')}
                      </button>
                      <button
                        onClick={() => {
                          setPendingLyrics(result.result.fullText);
                          onNavigate?.('mv');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors text-xs text-blue-300"
                        title={t('lyrics.send_to_mv')}
                      >
                        <Video className="w-3 h-3" />
                        {t('lyrics.send_to_mv')}
                      </button>
                    </div>
                  </div>
                  <pre className="text-sm text-white whitespace-pre-wrap font-sans leading-relaxed">{result.result.fullText}</pre>
                </div>
              )}

              {result.result?.fullCommand && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 max-h-96 overflow-y-auto">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">{t('lyrics.generated_command')}</div>
                  <pre className="text-xs text-pink-300 font-mono whitespace-pre-wrap break-words">{result.result.fullCommand}</pre>
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
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0f] via-[#0f0a1a] to-transparent pt-12 md:pt-16 pb-6 md:pb-4 px-4 md:px-6 z-40">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3.5 md:py-4 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-purple-500/20"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {t('lyrics.generating')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t('lyrics.generate')}
              </>
            )}
          </button>
        </div>
      </div>

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}

export default LyricsPage;