import React, { useState, useEffect } from 'react';
import {
  BookOpen, Lightbulb, Clock, ChevronDown, ChevronUp,
  Headphones, Mic, Copy, Check, Cpu, Piano, Cloud, Music2,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';

export default function CreativeNotebook() {
  const { t } = useTranslation();
  const { stats, history, setPendingLyrics, setPendingData } = useGeneration();
  const [openIds, setOpenIds] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const toggleItem = (id) => setOpenIds(prev => ({ ...prev, [id]: !prev[id] }));

  const extractNotebookText = (item) => {
    let text = '';
    const proc = item.creativeProcess || {};
    const snap = proc.snapshot || {};
    const thoughts = Array.isArray(proc.thoughts) ? proc.thoughts : [];

    if (item.title) text += `Title: ${item.title}\n`;
    if (item.engine) text += `Engine: ${item.engine}\n`;
    if (item.status) text += `Status: ${item.status}\n`;
    if (item.createdAt) text += `Time: ${new Date(item.createdAt).toLocaleString()}\n`;
    if (item.style) text += `Style: ${item.style}\n`;
    if (item.duration > 0) text += `Duration: ${Math.round(item.duration)}s\n`;
    if (item.error) text += `Error: ${item.error}\n`;

    if (thoughts.length > 0) {
      text += '\n=== Creative Timeline ===\n';
      thoughts.forEach((th, idx) => {
        text += `\n[${idx + 1}] ${th.time || ''} ${th.title || th.step || ''}\n`;
        if (th.summary) text += `  Summary: ${th.summary}\n`;
        if (th.detail) text += `  Detail: ${th.detail}\n`;
      });
    }

    if (Object.keys(snap).length > 0) {
      text += '\n=== Parameter Snapshot ===\n';
      text += JSON.stringify(snap, null, 2) + '\n';
    }

    if (item.lyrics) text += `\n=== Lyrics ===\n${item.lyrics}\n`;
    if (item.prompt) text += `\n=== Commands ===\n${item.prompt}\n`;

    return text.trim();
  };

  const handleCopyItem = async (item) => {
    const text = extractNotebookText(item);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch { }
  };

  const handleSendToAI = (item, engine, onNavigate) => {
    const proc = item.creativeProcess || {};
    const snap = proc.snapshot || {};
    const thoughts = Array.isArray(proc.thoughts) ? proc.thoughts : [];
    const lyricsText = item.lyrics || snap.lyrics || '';

    setPendingLyrics(lyricsText);
    setPendingData({
      lyrics: lyricsText,
      title: item.title || snap.title || '',
      style: snap.style || item.style || '',
      theme: snap.theme || '',
      bpm: snap.bpm ? Number(snap.bpm) : undefined,
      structure: snap.structure || '',
      prompt: item.prompt || snap.prompt || '',
      engine,
    });

    if (onNavigate) onNavigate(engine);
  };

  const notebookItems = history
    .filter(h => h.creativeProcess || h.type === 'creation_attempt')
    .slice(0, 100);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{t('notebook.title')}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{t('notebook.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{t('notebook.total_records', { count: notebookItems.length })}</span>
            </div>
            <span className="text-emerald-400 font-medium">{t('notebook.success_count', { count: stats.songsGenerated })}</span>
            <span className="text-rose-400 font-medium">{t('notebook.failure_count', { count: stats.creationAttempts })}</span>
          </div>
        </div>

        {notebookItems.length === 0 && (
          <div className="rounded-xl bg-white/5 border border-dashed border-white/10 p-8 md:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 flex items-center justify-center border border-amber-500/20">
              <Lightbulb className="w-8 h-8 text-amber-400/70" />
            </div>
            <div className="text-sm font-medium text-white mb-1">{t('notebook.no_data')}</div>
            <div className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              {t('notebook.no_data_desc')}
            </div>
          </div>
        )}

        {notebookItems.length > 0 && (
          <div className="space-y-2.5 md:space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {notebookItems.map(item => {
              const isOpen = !!openIds[item.id];
              const failed = item.status === 'failed' || item.type === 'creation_attempt';
              const proc = item.creativeProcess || {};
              const thoughts = Array.isArray(proc.thoughts) ? proc.thoughts : [];
              const snap = proc.snapshot || {};
              const engine = proc.engine || item.engine || '';
              const engineFlag = { muse: '🎨', suno: '🎵', melo: '🎧' }[engine.toLowerCase()] || '⚙️';

              return (
                <div key={item.id}
                  className={`rounded-xl overflow-hidden border transition-all ${failed
                    ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40'
                    : 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                    }`}>
                  <div
                    className="flex items-start justify-between gap-3 p-3 md:p-3.5 cursor-pointer"
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${failed
                        ? 'bg-gradient-to-br from-rose-500 to-red-600'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        }`}>
                        <span className="text-sm">{failed ? '❌' : '✅'}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-medium">
                            {engineFlag} {engine}
                          </span>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${failed ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                            }`}>
                            {failed ? t('notebook.status_failed') : t('notebook.status_success')}
                          </span>
                          {snap.theme && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                              🎯 {snap.theme}
                            </span>
                          )}
                          {snap.bpm && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                              {snap.bpm} BPM · {t('notebook.key_label', { key: snap.key || '?' })}
                            </span>
                          )}
                          {item.duration > 0 && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                              {t('notebook.seconds', { count: Math.round(item.duration) })}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-white mt-1.5 truncate">
                          {item.title?.replace('❌ 构思失败 · ', '') || t('notebook.untitled')}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <Clock className="w-3 h-3 inline" />
                          <span>{new Date(item.createdAt || Date.now()).toLocaleString()}</span>
                          {thoughts.length > 0 && (
                            <>
                              <span className="text-gray-700">·</span>
                              <span className="text-amber-400/80">💭 {t('notebook.thinking_steps', { count: thoughts.length })}</span>
                            </>
                          )}
                          {failed && item.error && (
                            <>
                              <span className="text-gray-700">·</span>
                              <span className="text-rose-400/90 truncate max-w-[220px]">{item.error}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 pt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyItem(item); }}
                        className={`p-1.5 rounded-lg transition-colors ${copiedId === item.id
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        title={t('notebook.copy_all')}
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-3 md:px-3.5 pb-3.5 space-y-3 border-t border-white/5 pt-3">
                      {thoughts.length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold text-amber-300/90 mb-2 flex items-center gap-1.5">
                            <Lightbulb className="w-3 h-3" />
                            {t('notebook.timeline_desc', { count: thoughts.length })}
                          </div>
                          <div className="space-y-2 rounded-lg bg-black/30 p-2.5 max-h-[38vh] overflow-y-auto border border-white/5">
                            {thoughts.map((th, idx) => (
                              <div key={idx} className="text-[11px] md:text-xs flex gap-2">
                                <div className="flex-shrink-0 w-16 md:w-20 text-right text-gray-500 font-mono">
                                  {th.time || ''}
                                  <div className="text-[10px] text-violet-400/80">{th.phase || ''}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-white font-semibold text-xs">{th.title || th.step || t('notebook.step_label', { n: idx + 1 })}</div>
                                  {th.summary && <div className="text-gray-300 mt-0.5">{th.summary}</div>}
                                  {th.detail && (
                                    <pre className="text-[10.5px] md:text-[11px] text-gray-400 mt-1 whitespace-pre-wrap font-sans leading-relaxed bg-black/30 rounded p-2 border border-white/5">
                                      {th.detail}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {Object.keys(snap).length > 0 && (
                        <div>
                          <div className="text-[11px] font-bold text-violet-300/90 mb-2 flex items-center gap-1.5">
                            <Cpu className="w-3 h-3" />
                            {t('notebook.param_snapshot')}
                          </div>
                          <pre className="text-[10.5px] md:text-[11px] text-gray-300 whitespace-pre-wrap rounded-lg bg-black/30 p-2.5 border border-white/5 font-mono max-h-[30vh] overflow-y-auto">
                            {JSON.stringify(snap, null, 2)}
                          </pre>
                        </div>
                      )}

                      {(item.lyrics || item.prompt) && (
                        <div>
                          <div className="text-[11px] font-bold text-emerald-300/90 mb-2 flex items-center gap-1.5">
                            <Mic className="w-3 h-3" />
                            {t('notebook.lyrics_and_commands')}
                          </div>
                          <pre className="text-[11px] md:text-xs text-gray-200 whitespace-pre-wrap rounded-lg bg-emerald-500/5 p-3 border border-emerald-500/15 leading-relaxed font-sans">
                            {item.lyrics || item.prompt}
                          </pre>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-gray-400 mr-1">→</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSendToAI(item, 'muse'); }}
                          className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-[11px] font-medium"
                          title="Send to Muse AI"
                        >
                          <Piano className="w-3 h-3" /> Muse
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSendToAI(item, 'suno'); }}
                          className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-[11px] font-medium"
                          title="Send to Suno AI"
                        >
                          <Cloud className="w-3 h-3" /> Suno
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSendToAI(item, 'melo'); }}
                          className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-[11px] font-medium"
                          title="Send to Melo AI"
                        >
                          <Headphones className="w-3 h-3" /> Melo
                        </button>
                      </div>

                      {!failed && item.audioUrl && (
                        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                          <div className="text-xs font-bold text-emerald-300 mb-1.5 flex items-center gap-1.5">
                            <Headphones className="w-3.5 h-3.5" />
                            {t('notebook.audio_cover')}
                          </div>
                          <audio controls className="w-full h-8" src={item.audioUrl} />
                          {item.imageUrl && (
                            <a href={item.imageUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[11px] text-blue-300 hover:text-blue-200 underline mt-2 inline-block">
                              {t('notebook.view_cover')}
                            </a>
                          )}
                        </div>
                      )}

                      {failed && item.error && (
                        <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 p-3">
                          <div className="text-xs font-bold text-rose-300 mb-1">{t('notebook.failure_reason')}</div>
                          <div className="text-[11px] text-rose-200/90 font-mono break-all leading-relaxed">
                            {item.error}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}