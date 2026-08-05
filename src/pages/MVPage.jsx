import React, { useState, useEffect } from 'react';
import { Video, Sparkles, Loader, Film, Play, Clock, Palette, History, Copy, AlertCircle } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import api, { isMobileEnvironment } from '../services/api.client.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { generateMV } from '../utils/mvEngine.js';
import HistoryPanel from '../components/HistoryPanel.jsx';

function MVPage() {
  const { t } = useTranslation();
  const { addToHistory, copyToClipboard, pendingLyrics } = useGeneration();

  const FALLBACK_GENRES = ['pop', 'rock', 'electronic', 'hip_hop', 'ballad', 'chinese_traditional', 'jazz', 'classical', 'rnb', 'country', 'love_song', 'chinese_classical', 'concert', 'modern', 'cinematic', 'retro', 'anime', 'gothic_rock'];

  const MV_EFFECTS = [
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

  const [genres, setGenres] = useState(FALLBACK_GENRES);
  const [genre, setGenre] = useState('pop');
  const [duration, setDuration] = useState(180);
  const [style, setStyle] = useState('modern');
  const [colorPalette, setColorPalette] = useState('purple_gradient');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedEffects, setSelectedEffects] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!isMobileEnvironment()) {
      loadGenres();
    }
  }, []);

  const loadGenres = async () => {
    try {
      const data = await api.mvGenres();
      if (data.success && data.data?.length > 0) {
        setGenres(data.data);
      }
    } catch (error) {
      console.error('Genres load failed, using fallback:', error);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    setError(null);
    try {
      let data;
      if (isMobileEnvironment()) {
        data = { success: true, data: generateMV({ genre, duration, style, colorPalette, effects: selectedEffects }) };
      } else {
        data = await api.generateMV({ genre, duration, style, colorPalette, effects: selectedEffects });
      }
      if (data.success) {
        setResult(data.data);
        addToHistory({
          type: 'mv',
          genre,
          duration,
          style,
          colorPalette,
          effects: selectedEffects,
          result: data.data
        });
      } else {
        setError(data.error || t('common.error_unknown'));
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setError(error.message || t('common.error_connection'));
    } finally {
      setIsGenerating(false);
    }
  };

  const styleOptions = [
    { value: 'modern', label: t('mv.modern') },
    { value: 'cinematic', label: t('mv.cinematic') },
    { value: 'artistic', label: t('mv.artistic') },
    { value: 'minimalist', label: t('mv.minimalist') },
  ];

  const paletteOptions = [
    { value: 'purple_pink_gradient', label: t('mv.purple_pink_gradient') },
    { value: 'red_black_contrast', label: t('mv.red_black_contrast') },
    { value: 'gold_red_jade', label: t('mv.gold_red_jade') },
    { value: 'neon_cyber', label: t('mv.neon_cyber') },
    { value: 'urban_gold', label: t('mv.urban_gold') },
    { value: 'soft_pastel', label: t('mv.soft_pastel') },
  ];

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in pb-52 md:pb-8">
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">{t('mv.mv_video_generator')}</h1>
              <p className="text-[10px] md:text-xs text-gray-400">{t('mv.professional_mv')}</p>
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
        <div className="space-y-3 md:space-y-4">
          <div className="gradient-border p-4 md:p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">{t('mv.mv_genre')}</label>
            <div className="space-y-2">
              {genres.map(g => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${genre === g
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                  {t(`styles.${g}`) || g}
                </button>
              ))}
            </div>
          </div>

          <div className="gradient-border p-4 md:p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">{t('mv.duration_seconds')}</label>
            <input
              type="range"
              min="60"
              max="600"
              step="30"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
              <span>60s</span>
              <span className="text-violet-300 font-semibold">{duration}s</span>
              <span>600s</span>
            </div>
          </div>

          <div className="gradient-border p-4 md:p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">{t('mv.style')}</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
            >
              {styleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="gradient-border p-4 md:p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">{t('mv.color_palette_label')}</label>
            <select
              value={colorPalette}
              onChange={(e) => setColorPalette(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
            >
              {paletteOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="gradient-border p-4 md:p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">{t('layers.effects')}</label>
            <div className="grid grid-cols-3 md:grid-cols-3 gap-2">
              {MV_EFFECTS.map(effect => (
                <button
                  key={effect.id}
                  onClick={() => {
                    if (selectedEffects.includes(effect.id)) {
                      setSelectedEffects(selectedEffects.filter(e => e !== effect.id));
                    } else {
                      setSelectedEffects([...selectedEffects, effect.id]);
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedEffects.includes(effect.id)
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                    }`}
                >
                  {t(effect.name)}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="md:col-span-2 gradient-border p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-cyan-400" />
              {t('mv.mv_timeline')}
            </h3>
            {result && (
              <button
                onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-gray-300"
                title={t('common.copy')}
              >
                <Copy className="w-3 h-3" />
                {t('common.copy')}
              </button>
            )}
          </div>
          {!result && !isGenerating && (
            <div className="text-center py-12 md:py-20 text-gray-500">
              <Video className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-30" />
              <div className="text-xs md:text-sm">{t('mv.click_to_start')}</div>
            </div>
          )}
          {isGenerating && (
            <div className="text-center py-12 md:py-20">
              <Loader className="w-8 h-8 md:w-10 md:h-10 mx-auto mb-3 md:mb-4 text-cyan-400 animate-spin" />
              <div className="text-xs md:text-sm text-gray-400">{t('mv.creating_timeline')}</div>
            </div>
          )}
          {error && (
            <div className="text-center py-8 md:py-12">
              <AlertCircle className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-red-400" />
              <div className="text-sm md:text-base text-red-300 mb-2">{error}</div>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-all"
              >
                {t('common.retry')}
              </button>
            </div>
          )}
          {result && (
            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <Clock className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400 mb-1" />
                  <div className="text-[10px] text-gray-500 uppercase">{t('mv.duration')}</div>
                  <div className="text-sm font-semibold text-white">{result.duration}s</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <Palette className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400 mb-1" />
                  <div className="text-[10px] text-gray-500 uppercase">{t('mv.palette')}</div>
                  <div className="text-sm font-semibold text-white">{t(`mv.${result.colorPalette}`) || result.colorPalette}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <Film className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400 mb-1" />
                  <div className="text-[10px] text-gray-500 uppercase">{t('mv.scenes')}</div>
                  <div className="text-sm font-semibold text-white">{result.totalScenes}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <Sparkles className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400 mb-1" />
                  <div className="text-[10px] text-gray-500 uppercase">{t('mv.effects_label')}</div>
                  <div className="text-sm font-semibold text-white">{result.effects?.length || 0}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('mv.scene_timeline')}</h4>
                <div className="space-y-2">
                  {result.timeline?.map((scene, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
                      <div className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-sm md:text-xs font-bold text-white">
                        {scene.sceneId}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{t(`mv.scene_${scene.scene}`) || scene.scene}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {scene.startTime}s - {scene.endTime}s ({scene.duration}s)
                        </div>
                      </div>
                      <div className="text-[10px] px-2 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {scene.transition}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('mv.effects_label')}</h4>
                <div className="flex flex-wrap gap-2">
                  {result.effects?.map((effect, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      {t(`effects.${effect}`) || effect}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-[72px] md:bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0f] via-[#0f0a1a]/95 to-transparent pt-6 md:pt-12 pb-3 md:pb-3 px-4 md:px-6 z-40 safe-area-bottom md:safe-area-bottom">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 md:py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-transform"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {t('mv.generating_mv')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t('mv.generate_mv_timeline')}
              </>
            )}
          </button>
        </div>
      </div>

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        filterType="mv"
      />
    </div>
  );
}

export default MVPage;
