import React from 'react';
import { Sparkles, Loader, Wand2, Palette, Zap, Film } from 'lucide-react';

function MVControls({
  mode,
  onModeChange,
  genres,
  genre,
  onGenreChange,
  style,
  onStyleChange,
  duration,
  onDurationChange,
  colorPalette,
  onColorPaletteChange,
  selectedEffects,
  onEffectsChange,
  sceneTemplates,
  stylePalettes,
  effects,
  isGenerating,
  onGenerate,
  engine,
  museCredits,
  t,
}) {
  const toggleEffect = (effectId) => {
    if (selectedEffects.includes(effectId)) {
      onEffectsChange(selectedEffects.filter(e => e !== effectId));
    } else {
      onEffectsChange([...selectedEffects, effectId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector — dark theme + pale blue accent */}
      <div className="p-1.5 rounded-2xl flex gap-1 bg-white/5 border border-white/10 backdrop-blur-sm">
        <button
          onClick={() => onModeChange('basic')}
          className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${mode === 'basic'
            ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-sm shadow-sky-500/30'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
        >
          {t('mv.mode_basic_label')}
        </button>
        <button
          onClick={() => onModeChange('advanced')}
          className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${mode === 'advanced'
            ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-sm shadow-sky-500/30'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
        >
          {t('mv.mode_advanced_label')}
        </button>
      </div>

      {mode === 'basic' && (
        <>
          {/* Genre Selector */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">{t('mv.genre_section')}</label>
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => onGenreChange(g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${genre === g
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-sm shadow-sky-500/30'
                    : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Scene Templates (from DB) */}
          {sceneTemplates.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-400 mb-2 block flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-sky-400" />
                {t('mv.scene_templates_label')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sceneTemplates.map((s) => {
                  const Icon = s.icon || Wand2;
                  const isSelected = style === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onStyleChange(s.id)}
                      className={`p-3 rounded-xl border transition-all text-left ${isSelected
                        ? 'border-sky-500/60 bg-sky-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-400' : 'text-gray-500'}`} />
                        <span className="text-xs font-medium text-white">{s.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">
              {t('mv.duration_section')}: {duration}s
            </label>
            <input
              type="range"
              min="15"
              max="120"
              step="15"
              value={duration}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>15s</span>
              <span>60s</span>
              <span>120s</span>
            </div>
          </div>
        </>
      )}

      {mode === 'advanced' && (
        <>
          {/* Duration */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">
              {t('mv.duration_section')}: {duration}s
            </label>
            <input
              type="range"
              min="15"
              max="120"
              step="15"
              value={duration}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg cursor-pointer accent-sky-500"
            />
          </div>

          {/* Color Palettes (from DB) */}
          {stylePalettes.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-400 mb-2 block flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-sky-400" />
                {t('mv.color_palette_section')}
              </label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {stylePalettes.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onColorPaletteChange(p.id)}
                    className={`p-2 rounded-lg border transition-all ${colorPalette === p.id
                      ? 'border-sky-500/60 bg-sky-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex gap-0.5 mb-1">
                      {(p.colors || []).map((c, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 truncate block">{p.en}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Effects (from DB) */}
          {effects.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-400 mb-2 block flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                {t('mv.visual_effects')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {effects.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => toggleEffect(e.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedEffects.includes(e.id)
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {e.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full py-3.5 md:py-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-transform"
      >
        {isGenerating ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            {t('mv.generating_label')}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {t('mv.generate_mv_button')}
          </>
        )}
      </button>
    </div>
  );
}

export default MVControls;
