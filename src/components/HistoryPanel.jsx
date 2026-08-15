import React from 'react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { History, Copy, Music, Trash2, X, Sparkles, Zap, Piano, ExternalLink, Headphones, Cloud, Music2, FileText, AlertCircle, Loader2 } from 'lucide-react';

function HistoryPanel({ isOpen, onClose, onSelectItem, filterType }) {
  const { t, ts } = useTranslation();
  const { history, selectedId, setSelectedId, removeFromHistory, clearHistory, copyToClipboard, showToast, getHistoryByType } = useGeneration();

  const displayHistory = filterType ? getHistoryByType(filterType) : history;

  const getEngineName = (item) => {
    const engine = item.engine || item.method?.replace('_ai', '') || '';
    const names = {
      muse: 'Muse AI',
      suno: 'Suno AI',
      melo: 'Melo AI',
      muse_ai: 'Muse AI',
      suno_ai: 'Suno AI',
      melo_ai: 'Melo AI',
    };
    return names[engine] || engine || '';
  };

  const getTypeIcon = (type, method) => {
    if (type === 'creation_draft') return Loader2;
    if (type === 'creation_attempt') return AlertCircle;
    if (type === 'song') return Music;
    if (type === 'lyrics') return FileText;
    if (type === 'mv') return ExternalLink;
    if (type === 'generation_milestone') return Sparkles;
    const methodIcons = {
      fsm: Sparkles,
      network_layer: Zap,
      muse: Piano,
      suno: Cloud,
      melo: Headphones,
      muse_ai: Piano,
      suno_ai: Cloud,
      melo_ai: Headphones,
    };
    return methodIcons[method] || Sparkles;
  };

  const getTypeColor = (type, method) => {
    if (type === 'creation_draft') return 'from-amber-500 to-yellow-500';
    if (type === 'creation_attempt') return 'from-red-500 to-rose-500';
    if (type === 'song') return 'from-violet-500 to-purple-500';
    if (type === 'lyrics') return 'from-cyan-500 to-blue-500';
    if (type === 'mv') return 'from-blue-500 to-cyan-500';
    if (type === 'generation_milestone') return 'from-violet-500 to-fuchsia-500';

    const methodColors = {
      fsm: 'from-violet-500 to-purple-500',
      network_layer: 'from-blue-500 to-cyan-500',
      muse: 'from-blue-500 to-cyan-500',
      suno: 'from-green-500 to-emerald-500',
      melo: 'from-orange-500 to-amber-500',
      muse_ai: 'from-blue-500 to-cyan-500',
      suno_ai: 'from-green-500 to-emerald-500',
      melo_ai: 'from-orange-500 to-amber-500',
    };
    return methodColors[method] || 'from-gray-500 to-gray-600';
  };

  const getMethodName = (method) => {
    const names = {
      fsm: t('lyrics.fsm_name'),
      network_layer: t('lyrics.network_name'),
      muse: 'Muse AI',
      suno: 'Suno AI',
      melo: 'Melo AI',
      muse_ai: 'Muse AI',
      suno_ai: 'Suno AI',
      melo_ai: 'Melo AI',
    };
    return names[method] || method;
  };

  const getTypeName = (type) => {
    const names = {
      song: t('nav.music'),
      lyrics: t('nav.lyrics'),
      mv: t('nav.mv'),
      creation_draft: t('history.creation_draft'),
      creation_attempt: t('history.creation_attempt'),
      generation_milestone: t('history.generation_milestone'),
    };
    return names[type] || type;
  };

  const getStyleName = (style) => {
    return ts(`lyrics_styles.${style}`) || ts(`styles.${style}`) || ts(`styles_extra.${style}`) || style;
  };

  const getThemeName = (theme) => {
    return ts(`lyrics_themes.${theme}`) || ts(`themes.${theme}`) || ts(`themes_extra.${theme}`) || theme;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPreviewText = (item) => {
    const fullText = item.result?.result?.fullText || item.result?.fullText || item.lyrics || item.result?.lyricsText || '';
    if (!fullText) return '';
    const lines = fullText.split('\n').filter(line => line.trim() && !line.includes('[') && !line.includes('【'));
    return lines.slice(0, 3).join('\n') + (lines.length > 3 ? '...' : '');
  };

  const getLyricsText = (item) => {
    return item.result?.result?.lyricsText || item.result?.lyricsText || item.lyrics || item.result?.result?.fullText || item.result?.fullText || '';
  };

  const getCommandText = (item) => {
    return item.result?.result?.fullCommand || item.result?.fullCommand || item.prompt || item.result?.command || '';
  };

  const getFullText = (item) => {
    const r = item.result?.result || item.result;
    const lyrics = getLyricsText(item);
    const commands = getCommandText(item);
    const title = item.title || r?.title || '';
    const engine = getEngineName(item);
    const style = item.style || item.result?.style || r?.style || '';
    const theme = item.result?.theme || item.theme || r?.theme || '';
    const bpm = item.result?.bpm || item.bpm || r?.bpm || '';

    const sections = [];
    if (title) sections.push(`【标题】${title}`);
    if (engine) sections.push(`【引擎】${engine}`);
    if (theme) sections.push(`【主题】${getThemeName(theme)}`);
    if (style) sections.push(`【风格】${getStyleName(style)}`);
    if (bpm) sections.push(`【BPM】${bpm}`);
    if (commands) sections.push(`\n【命令/提示词】\n${commands}`);
    if (lyrics) sections.push(`\n【歌词】\n${lyrics}`);

    if (sections.length > 0) {
      return sections.join('\n');
    }

    return r?.fullText || '';
  };

  const handleCopy = async (item, mode = 'full') => {
    let text = '';
    if (mode === 'commands') {
      text = getCommandText(item);
    } else if (mode === 'lyrics') {
      text = getLyricsText(item);
    } else {
      text = getFullText(item);
    }
    if (!text) {
      text = getFullText(item);
    }
    const success = await copyToClipboard(text);
    if (success) {
      showToast(t('common.copy') + ' ' + t('common.success'), 'success');
    }
  };

  const handleSendToAI = (item, aiType) => {
    onSelectItem?.(item, aiType);
    onClose?.();
  };

  const handleSelect = (item) => {
    setSelectedId(item.id);
    onSelectItem?.(item);
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-96 bg-[#0a0a0f] border-l border-white/10 transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">{t('lyrics.history')}</h2>
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{displayHistory.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {displayHistory.length > 0 && !filterType && (
              <button
                onClick={clearHistory}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                title={t('common.clear')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {displayHistory.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-sm text-gray-500">{t('lyrics.no_history')}</p>
            </div>
          ) : (
            displayHistory.map(item => {
              const Icon = getTypeIcon(item.type, item.method);
              const itemTitle = item.title || getTypeName(item.type);
              const statusBadge = item.type === 'creation_draft'
                ? <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium">{t('history.thinking')}</span>
                : item.type === 'creation_attempt'
                  ? <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-medium">{t('history.recorded')}</span>
                  : null;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedId === item.id
                    ? 'bg-violet-500/10 border-violet-500/30'
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  onClick={() => handleSelect(item)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getTypeColor(item.type, item.method)} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 text-white ${item.type === 'creation_draft' ? 'animate-pulse' : ''}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-white truncate max-w-[140px]">{itemTitle}</span>
                          {statusBadge}
                        </div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                          {getEngineName(item) && (
                            <span className="text-gray-600">{getEngineName(item)}</span>
                          )}
                          <span>·</span>
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item.id);
                      }}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(item.style || item.result?.style) && (
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-medium">
                        {getStyleName(item.result?.style || item.style)}
                      </span>
                    )}
                    {(item.theme || item.result?.theme) && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-medium">
                        {getThemeName(item.result?.theme || item.theme)}
                      </span>
                    )}
                    {(item.result?.language || item.language) && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-medium">
                        {item.result?.language || item.language}
                      </span>
                    )}
                    {(item.result?.bpm || item.bpm) && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 text-[10px] font-medium">
                        {item.result?.bpm || item.bpm} BPM
                      </span>
                    )}
                    {item.creativeProcess?.phase && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-medium">
                        {item.creativeProcess.phase}
                      </span>
                    )}
                  </div>

                  {(item.result?.fullText || item.result?.result?.fullText || item.lyrics) && (
                    <div className="text-xs text-gray-400 mb-3 line-clamp-3">
                      {getPreviewText(item)}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Primary copy button - prominent for all types */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(item, 'full');
                      }}
                      className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 hover:from-violet-500/30 hover:to-purple-500/30 transition-colors text-xs font-medium border border-violet-500/20"
                      title={t('history.copy_concept')}
                    >
                      <Copy className="w-3 h-3" />
                      {t('history.copy_concept_short')}
                    </button>

                    {/* Copy commands only */}
                    {(item.prompt || item.result?.fullCommand) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item, 'commands');
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 transition-colors text-xs"
                        title={t('history.copy_commands')}
                      >
                        <Copy className="w-3 h-3" />
                        {t('history.commands')}
                      </button>
                    )}

                    {/* Copy lyrics only */}
                    {(item.lyrics || item.result?.lyricsText || item.result?.result?.lyricsText) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item, 'lyrics');
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors text-xs"
                        title={t('history.copy_lyrics')}
                      >
                        <Copy className="w-3 h-3" />
                        {t('history.lyrics')}
                      </button>
                    )}

                    {/* Send to engines - with text labels */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendToAI(item, 'muse');
                      }}
                      className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-[11px] font-medium"
                      title={t('history.send_to_muse')}
                    >
                      <Piano className="w-3 h-3" />
                      <span>{t('common.engine_muse')}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendToAI(item, 'suno');
                      }}
                      className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-[11px] font-medium"
                      title={t('history.send_to_suno')}
                    >
                      <Cloud className="w-3 h-3" />
                      <span>{t('common.engine_suno')}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendToAI(item, 'melo');
                      }}
                      className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-[11px] font-medium"
                      title={t('history.send_to_melo')}
                    >
                      <Headphones className="w-3 h-3" />
                      <span>{t('common.engine_melo')}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {displayHistory.length > 0 && !filterType && (
          <div className="p-4 border-t border-white/10">
            <button
              onClick={clearHistory}
              className="w-full py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
            >
              {t('lyrics.clear_history')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPanel;