import React from 'react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { History, Copy, Music, Trash2, X, ChevronRight, Sparkles, Zap, Piano, ExternalLink } from 'lucide-react';

function HistoryPanel({ isOpen, onClose, onSelectItem, filterType }) {
  const { t, ts } = useTranslation();
  const { history, selectedId, setSelectedId, removeFromHistory, clearHistory, copyToClipboard, showToast, getHistoryByType } = useGeneration();

  const displayHistory = filterType ? getHistoryByType(filterType) : history;

  const getTypeIcon = (type, method) => {
    const typeIcons = {
      song: Music,
      lyrics: null,
      mv: ExternalLink
    };
    if (type === 'song') return Music;
    if (type === 'mv') return ExternalLink;
    const methodIcons = {
      fsm: Sparkles,
      network_layer: Zap,
      muse: Piano,
      suno: Music,
      melo: Music
    };
    return methodIcons[method] || Sparkles;
  };

  const getTypeColor = (type, method) => {
    const typeColors = {
      song: 'from-violet-500 to-purple-500',
      mv: 'from-blue-500 to-cyan-500'
    };
    if (typeColors[type]) return typeColors[type];
    const methodColors = {
      fsm: 'from-violet-500 to-purple-500',
      network_layer: 'from-blue-500 to-cyan-500',
      muse: 'from-pink-500 to-rose-500',
      suno: 'from-green-500 to-emerald-500',
      melo: 'from-orange-500 to-amber-500'
    };
    return methodColors[method] || 'from-gray-500 to-gray-600';
  };

  const getMethodColor = (method) => {
    const colors = {
      fsm: 'from-violet-500 to-purple-500',
      network_layer: 'from-blue-500 to-cyan-500',
      muse: 'from-pink-500 to-rose-500',
      suno: 'from-green-500 to-emerald-500',
      melo: 'from-orange-500 to-amber-500'
    };
    return colors[method] || 'from-gray-500 to-gray-600';
  };

  const getMethodName = (method) => {
    const names = {
      fsm: t('lyrics.fsm_name'),
      network_layer: t('lyrics.network_name'),
      muse: t('lyrics.muse_name'),
      suno: t('lyrics.suno_name'),
      melo: t('lyrics.melo_name')
    };
    return names[method] || method;
  };

  const getStyleName = (style) => {
    return ts(`lyrics_styles.${style}`) || ts(`styles.${style}`) || ts(`styles_extra.${style}`) || style;
  };

  const getThemeName = (theme) => {
    return ts(`lyrics_themes.${theme}`) || ts(`themes.${theme}`) || ts(`themes_extra.${theme}`) || theme;
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPreviewText = (item) => {
    const fullText = item.result?.result?.fullText || item.result?.fullText || '';
    if (!fullText) return '';
    const lines = fullText.split('\n').filter(line => line.trim() && !line.includes('[') && !line.includes('【'));
    return lines.slice(0, 3).join('\n') + (lines.length > 3 ? '...' : '');
  };

  const getLyricsText = (item) => {
    return item.result?.result?.lyricsText || item.result?.lyricsText || item.result?.result?.fullText || item.result?.fullText || '';
  };

  const getCommandText = (item) => {
    return item.result?.result?.fullCommand || item.result?.fullCommand || item.result?.command || '';
  };

  const getFullText = (item) => {
    const r = item.result?.result || item.result;
    if (r?.fullCommand && r?.lyricsText) {
      return `${r.fullCommand}\n\n【歌词内容】\n\n${r.lyricsText}`;
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
      text = getLyricsText(item);
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
              const itemTitle = item.type === 'song'
                ? t('nav.music')
                : item.type === 'mv'
                  ? t('nav.mv')
                  : getMethodName(item.method);
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
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white">{itemTitle}</div>
                        <div className="text-[10px] text-gray-500">{formatDate(item.createdAt)}</div>
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
                    <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 text-[10px] font-medium">
                      {getStyleName(item.result?.style || item.style)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-medium">
                      {getThemeName(item.result?.theme || item.theme)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-medium">
                      {item.result?.language || 'zh'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400 text-[10px] font-medium">
                      {item.result?.bpm || 120} BPM
                    </span>
                  </div>

                  {item.result?.fullText || item.result?.result?.fullText ? (
                    <div className="text-xs text-gray-400 mb-3 line-clamp-3">
                      {getPreviewText(item)}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 flex-wrap">
                    {item.type === 'lyrics' ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(item, 'full');
                          }}
                          className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors text-xs"
                          title={t('lyrics.copy_all')}
                        >
                          <Copy className="w-3 h-3" />
                          {t('lyrics.copy_all')}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(item, 'commands');
                          }}
                          className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2 rounded-lg bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 transition-colors text-xs"
                          title={t('lyrics.copy_commands')}
                        >
                          <Copy className="w-3 h-3" />
                          {t('lyrics.commands_only')}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(item, 'lyrics');
                          }}
                          className="flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-colors text-xs"
                          title={t('lyrics.copy_lyrics')}
                        >
                          <Copy className="w-3 h-3" />
                          {t('lyrics.view_lyrics_only')}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item, 'full');
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors text-xs"
                      >
                        <Copy className="w-3 h-3" />
                        {t('common.copy')}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendToAI(item, 'muse');
                      }}
                      className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-colors text-xs"
                      title={t('common.send_to_muse')}
                    >
                      <Piano className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendToAI(item, 'suno');
                      }}
                      className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-xs"
                      title={t('common.send_to_suno')}
                    >
                      <Music className="w-3 h-3" />
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