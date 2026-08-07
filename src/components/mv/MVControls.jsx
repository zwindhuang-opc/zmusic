import React from 'react';
import { Sparkles, Loader } from 'lucide-react';

function MVControls({
  lyricsInput,
  onLyricsChange,
  genre,
  genres,
  onGenreChange,
  style,
  styles,
  onStyleChange,
  isGenerating,
  genProgress,
  genStage,
  onGenerate,
  t,
  ts,
  engine,
  museCredits = null,
}) {
  const museInsufficient = engine === 'muse' && museCredits !== null && museCredits < 14;

  const getStageLabel = () => {
    switch (genStage) {
      case 'credits': return 'Checking Muse credits...';
      case 'generating': return 'Generating real song with AI...';
      case 'composing': return 'Composing preview music...';
      case 'timeline': return 'Building MV timeline...';
      case 'audio': return 'Rendering audio...';
      case 'video': return 'Recording MV video...';
      case 'complete': return 'Complete!';
      default: return '';
    }
  };

  return (
    <>
      {engine !== 'procedural' && (
        <div>
          <label className="text-xs font-medium text-gray-300 mb-2 block">
            Song Lyrics / Prompt {engine === 'muse' && '(optional — Muse AI can generate lyrics from prompt)'}
          </label>
          <textarea
            value={lyricsInput}
            onChange={(e) => onLyricsChange(e.target.value)}
            placeholder={engine === 'muse'
              ? 'Leave blank to auto-generate lyrics from style, or write your own full lyrics...'
              : 'Enter lyrics or describe the song you want...'}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
          />
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-gray-300 mb-2 block">{t('mv.mv_genre')}</label>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {genres.map(g => (
            <button
              key={g}
              onClick={() => onGenreChange(g)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${genre === g
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
            >
              {ts(`lyrics_styles.${g}`) || ts(`styles.${g}`) || ts(`styles_extra.${g}`) || g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-300 mb-2 block">{t('mv.style')}</label>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {styles.map(opt => (
            <button
              key={opt.value}
              onClick={() => onStyleChange(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${style === opt.value
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating || museInsufficient}
        className="w-full py-3.5 md:py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-transform"
      >
        {isGenerating ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            {getStageLabel() || t('mv.generating_mv')}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate MV Video {engine !== 'procedural' ? '(Real Song + Video)' : '(Preview)'}
          </>
        )}
      </button>

      {isGenerating && genProgress > 0 && (
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${genProgress * 100}%` }}
          />
        </div>
      )}
    </>
  );
}

export default MVControls;
