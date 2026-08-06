import React, { useState, useEffect } from 'react';
import { Music, Play, Sparkles, Loader, Download, Wand2, Cpu, Zap, History, Copy, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import api, { isMobileEnvironment } from '../services/api.client.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { generateMusic } from '../utils/musicEngine.js';
import HistoryPanel from '../components/HistoryPanel.jsx';
import { MUSIC_STYLES, MUSIC_GENRES, MUSIC_THEMES } from '../config/musicStyles.js';

const POPULAR_STYLES = ['pop', 'rock', 'electronic', 'folk', 'indie', 'rnb'];
const POPULAR_GENRES = ['pop', 'ballad', 'folk', 'indie', 'kpop', 'electronic'];

const MUSIC_LAYERS = [
  { id: 'foundation', name: 'layers.foundation', icon: Cpu },
  { id: 'melody', name: 'layers.melody', icon: Music },
  { id: 'expression', name: 'layers.expression', icon: Zap },
  { id: 'effects', name: 'layers.effects', icon: Wand2 }
];

const MUSIC_EFFECTS = [
  { id: 'rain_wind', name: 'effects.rain_wind' },
  { id: 'footsteps', name: 'effects.footsteps' },
  { id: 'reverb', name: 'effects.reverb' },
  { id: 'delay', name: 'effects.delay' },
  { id: 'di_da_delay', name: 'effects.di_da_delay' },
  { id: 'shimmer_reverb', name: 'effects.shimmer_reverb' },
  { id: 'vocals', name: 'effects.vocals' },
  { id: 'tropical_percussion', name: 'effects.tropical_percussion' },
  { id: 'bass_line', name: 'effects.bass_line' },
  { id: 'guitar_riffs', name: 'effects.guitar_riffs' },
  { id: 'ambient_pads', name: 'effects.ambient_pads' },
  { id: 'modulation', name: 'effects.modulation' }
];

function MusicPage() {
  const { t } = useTranslation();
  const { addToHistory, copyToClipboard, pendingLyrics } = useGeneration();
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (pendingLyrics) {
      setPrompt(pendingLyrics);
    }
  }, [pendingLyrics]);
  const [style, setStyle] = useState('pop');
  const [genre, setGenre] = useState('pop');
  const [duration, setDuration] = useState(60);
  const [bpm, setBpm] = useState(120);
  const [method, setMethod] = useState('fsm');
  const [theme, setTheme] = useState('love');
  const [provider, setProvider] = useState('suno_ai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [selectedLayers, setSelectedLayers] = useState(['foundation', 'melody', 'expression', 'effects']);
  const [selectedEffects, setSelectedEffects] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAllStyles, setShowAllStyles] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const AGENT_METHODS = [
    { id: 'fsm', name: t('music.fsm_programming'), desc: t('music.state_machine') },
    { id: 'network_layer', name: t('music.network_layers'), desc: t('music.layered_composition') },
    { id: 'muse', name: t('music.muse_style'), desc: t('music.natural_language') },
    { id: 'suno', name: t('music.suno_style'), desc: t('music.structured_params') }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(t('music.please_enter_prompt'));
      return;
    }
    setIsGenerating(true);
    setError('');
    setResult(null);
    try {
      const params = {
        prompt,
        style,
        genre,
        duration,
        bpm,
        method,
        theme,
        provider,
        autoGenerateLyrics: true
      };

      let data;
      if (isMobileEnvironment()) {
        data = generateMusic(params);
      } else {
        data = await api.generateMusicAgent(params);
      }

      if (data.success) {
        setResult(data);
        addToHistory({
          type: 'song',
          method,
          theme,
          style,
          genre,
          bpm,
          duration,
          provider,
          prompt,
          result: data
        });
      } else {
        setError(data.error || t('music.generation_failed'));
      }
    } catch (err) {
      setError(`${t('common.error')}: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentMethod = AGENT_METHODS.find(m => m.id === method);

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in pb-8">
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">{t('music.ai_music_generation')}</h1>
              <p className="text-[10px] md:text-xs text-gray-400">{t('music.powered_by')}</p>
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

      <div className="gradient-border p-4 md:p-5">
          <label className="text-xs font-medium text-gray-300 mb-2 block">{t('music.music_prompt')}</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('music.prompt_placeholder')}
            className="w-full h-16 md:h-20 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
          />

          <div className="mt-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">🎨 {t('music.music_style')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_STYLES.map(s => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${style === s
                    ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                    }`}
                >
                  {t(`styles.${s}`)}
                </button>
              ))}
              {showAllStyles && Object.keys(MUSIC_STYLES).filter(s => !POPULAR_STYLES.includes(s)).map(s => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${style === s
                    ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                    }`}
                >
                  {t(`styles.${s}`)}
                </button>
              ))}
              <button
                onClick={() => setShowAllStyles(!showAllStyles)}
                className="px-2.5 py-1 rounded-full text-[11px] text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
              >
                {showAllStyles ? '收起 ▲' : '更多 ▼'}
              </button>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">🎭 {t('lyrics.genre')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${genre === g
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                    }`}
                >
                  {t(`styles.${g}`) || g}
                </button>
              ))}
              {showAllGenres && Object.keys(MUSIC_GENRES).filter(g => !POPULAR_GENRES.includes(g)).map(g => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${genre === g
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                    }`}
                >
                  {t(`styles.${g}`) || g}
                </button>
              ))}
              <button
                onClick={() => setShowAllGenres(!showAllGenres)}
                className="px-2.5 py-1 rounded-full text-[11px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
              >
                {showAllGenres ? '收起 ▲' : '更多 ▼'}
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 mb-1 block">{t('music.duration_s')}</label>
              <input
                type="number" value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                min="10" max="300"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-1 block">{t('music.bpm')}</label>
              <input
                type="number" value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                min="60" max="200"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-1 block">{t('music.theme')}</label>
              <select
                value={theme} onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
              >
                {Object.entries(MUSIC_THEMES).map(([key, value]) => (
                  <option key={key} value={key}>{t(value.name) || key}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-transform"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {t('music.generating_music')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t('music.generate_music_with', { method: currentMethod?.name || '' })}
              </>
            )}
          </button>
        </div>

        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-medium text-gray-300"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            {showAdvanced ? t('common.collapse') : t('music.ai_agent_method')}
            {!showAdvanced && <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="gradient-border p-4 mt-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-300 mb-2 block">{t('music.ai_agent_method')}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {AGENT_METHODS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`p-2.5 rounded-lg text-left transition-all ${method === m.id
                        ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30'
                        : 'bg-white/5 border border-white/5 hover:border-white/10'
                        }`}
                    >
                      <div className="text-xs font-medium text-white">{m.name}</div>
                      <div className="text-[10px] text-gray-400">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 mb-2 block">{t('layers.foundation')}</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {MUSIC_LAYERS.map(layer => {
                    const Icon = layer.icon;
                    return (
                      <button
                        key={layer.id}
                        onClick={() => {
                          if (selectedLayers.includes(layer.id)) {
                            setSelectedLayers(selectedLayers.filter(l => l !== layer.id));
                          } else {
                            setSelectedLayers([...selectedLayers, layer.id]);
                          }
                        }}
                        className={`p-2.5 rounded-lg text-center transition-all ${selectedLayers.includes(layer.id)
                          ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30'
                          : 'bg-white/5 border border-white/5 hover:border-white/10'
                          }`}
                      >
                        <Icon className="w-4 h-4 mx-auto text-violet-400 mb-0.5" />
                        <div className="text-[10px] text-gray-300">{t(layer.name)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 mb-2 block">{t('layers.effects')}</label>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
                  {MUSIC_EFFECTS.map(effect => (
                    <button
                      key={effect.id}
                      onClick={() => {
                        if (selectedEffects.includes(effect.id)) {
                          setSelectedEffects(selectedEffects.filter(e => e !== effect.id));
                        } else {
                          setSelectedEffects([...selectedEffects, effect.id]);
                        }
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${selectedEffects.includes(effect.id)
                        ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                        }`}
                    >
                      {t(effect.name)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )}

        <div className="gradient-border p-4 md:p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Wand2 className="w-4 h-4 text-pink-400" />
            {t('music.result')}
          </h3>
          {!result && !isGenerating && (
            <div className="text-center py-8 md:py-12 text-gray-500">
              <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <div className="text-xs">{t('music.no_music_generated')}</div>
            </div>
          )}
          {isGenerating && (
            <div className="text-center py-8 md:py-12">
              <Loader className="w-8 h-8 mx-auto mb-3 text-violet-400 animate-spin" />
              <div className="text-xs text-gray-400">{t('music.creating_your_music')}</div>
            </div>
          )}
          {result && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">{t('music.task_id')}</div>
                  <button
                    onClick={() => copyToClipboard(result.taskId)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs text-gray-400 hover:bg-white/10 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {t('common.copy')}
                  </button>
                </div>
                <div className="text-xs font-mono text-violet-300">{result.taskId}</div>
              </div>
              {result.providers && Object.entries(result.providers).map(([name, data]) => (
                <div key={name} className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white uppercase">{name} AI</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${data.success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
                      }`}>
                      {data.success ? t('music.ok') : t('music.error')}
                    </span>
                  </div>
                  {data.error && <div className="text-[10px] text-rose-300">{data.error}</div>}
                  {data.taskId && (
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-gray-400 font-mono">{data.taskId}</div>
                      <button
                        onClick={() => copyToClipboard(data.taskId)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 text-xs text-gray-500 hover:bg-white/10 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        {t('common.copy')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        filterType="song"
      />
    </div >
  );
}

export default MusicPage;
