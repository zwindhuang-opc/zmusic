import React, { useState } from 'react';
import {
  Sparkles, RefreshCcw, Shuffle, ArrowRight, Headphones, Cloud,
  Music2, Copy, Check, Play, Download, Wand2, Zap, History, ArrowLeftRight,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';

/**
 * Remix Studio — AI Style Transfer / Cross-Engine Remix
 *
 * Take any generated song and re-create it in a different engine:
 *   Muse ↔ Suno ↔ Melo
 *
 * Also supports style variation: same lyrics/BPM, change style or structure.
 */

const ENGINES = [
  {
    id: 'muse',
    name: 'Muse AI',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-600',
    accent: 'blue',
    desc: '自然语言命令驱动，擅长创意词与氛围感',
  },
  {
    id: 'suno',
    name: 'Suno AI',
    icon: <Cloud className="w-5 h-5" />,
    color: 'from-emerald-500 to-teal-600',
    accent: 'emerald',
    desc: '人声表现力强，合唱+乐器分离清晰',
  },
  {
    id: 'melo',
    name: 'Melo AI',
    icon: <Headphones className="w-5 h-5" />,
    color: 'from-amber-500 to-orange-600',
    accent: 'amber',
    desc: '字节旋律，多层编曲 + 中文人声表现好',
  },
];

export default function RemixStudio({ onNavigate }) {
  const { t, lang } = useTranslation();
  const isZh = lang === 'zh';
  const { history, setPendingLyrics, setPendingData, copyToClipboard, showToast } = useGeneration();

  // Song selection + source engine
  const [sourceSongId, setSourceSongId] = useState(null);
  // Target engines (multi-select — can remix to many)
  const [targetEngines, setTargetEngines] = useState([]);
  // Remix options
  const [variationMode, setVariationMode] = useState('engine'); // 'engine' | 'style' | 'both'
  const [newStyle, setNewStyle] = useState('');
  const [newBpm, setNewBpm] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  // Get song library
  const songList = history.filter(h => (h.type === 'song' || h.type === 'creation_attempt' || h.creativeProcess) && (h.audioUrl || h.lyrics || h.creativeProcess?.snapshot)).slice(0, 80);
  const source = songList.find(s => s.id === sourceSongId);

  const proc = source?.creativeProcess || {};
  const snap = proc.snapshot || {};
  const sourceEngine = (proc.engine || source?.engine || 'muse').toLowerCase().replace(' ai', '');
  const sourceLyrics = source?.lyrics || snap.lyrics || source?.result?.lyricsText || '';
  const sourceStyle = source?.style || snap.style || '';
  const sourceBpm = snap.bpm || source?.result?.bpm || '';
  const sourceTitle = source?.title || snap.title || '';

  const toggleTarget = (engineId) => {
    setTargetEngines(prev =>
      prev.includes(engineId) ? prev.filter(e => e !== engineId) : [...prev, engineId]
    );
  };

  const sourceEngineObj = ENGINES.find(e => e.id === sourceEngine);

  const canRemix = sourceSongId && targetEngines.length > 0;

  const sendToEngine = (engineId) => {
    const finalStyle = (variationMode === 'style' || variationMode === 'both') && newStyle ? newStyle : sourceStyle;
    const finalBpm = (variationMode === 'style' || variationMode === 'both') && newBpm ? Number(newBpm) : sourceBpm;
    const finalTitle = newTitle || sourceTitle || '';
    const finalLyrics = sourceLyrics;

    if (!finalLyrics) {
      showToast?.(isZh ? '原作品缺少歌词，无法 remx' : 'Source has no lyrics to remix', 'error');
      return;
    }

    setPendingLyrics(finalLyrics);
    setPendingData({
      lyrics: finalLyrics,
      title: finalTitle,
      style: finalStyle,
      theme: snap.theme || '',
      bpm: finalBpm ? Number(finalBpm) : undefined,
      structure: variationMode === 'both' ? undefined : snap.structure,
      prompt: source?.prompt || snap.prompt || '',
      engine: engineId,
      remix: { sourceEngine, sourceId: sourceSongId, variation: variationMode },
    });
    if (onNavigate) onNavigate(engineId);
  };

  const doSendAll = () => {
    targetEngines.forEach((eid, idx) => {
      setTimeout(() => sendToEngine(eid), idx * 600); // stagger navigation
    });
  };

  const copySourceParams = async () => {
    const lines = [];
    if (sourceTitle) lines.push(`Title: ${sourceTitle}`);
    if (sourceEngine) lines.push(`Source Engine: ${sourceEngineObj?.name || sourceEngine}`);
    if (sourceStyle) lines.push(`Style: ${sourceStyle}`);
    if (sourceBpm) lines.push(`BPM: ${sourceBpm}`);
    if (snap.key) lines.push(`Key: ${snap.key}`);
    if (sourceLyrics) lines.push('\nLyrics:\n' + sourceLyrics);
    const ok = await copyToClipboard(lines.join('\n'));
    if (ok) {
      setCopiedKey('params');
      setTimeout(() => setCopiedKey(null), 1500);
      showToast?.(isZh ? '参数已复制' : 'Parameters copied', 'success');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-xl shadow-fuchsia-500/30">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {isZh ? 'Remix Studio · 风格迁移工坊' : 'Remix Studio · Style Transfer'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {isZh
                  ? '把任意作品送到另一个引擎重唱，或换风格/变节奏 —— Muse ↔ Suno ↔ Melo 三引擎互转'
                  : 'Re-create any song in a different engine: Muse ↔ Suno ↔ Melo'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{isZh ? '共 3 引擎互转' : '3 engine cross-transfer'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ============== LEFT: Source Song ============== */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Music2 className="w-4 h-4 text-violet-400" />
              {isZh ? '① 选一首原作' : '① Choose source work'}
            </div>

            {/* Song picker — scrollable list */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 max-h-[55vh] overflow-y-auto space-y-2">
              {songList.length === 0 && (
                <div className="text-center p-8 text-gray-500 text-sm">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <div>{isZh ? '还没有可 Remix 的作品' : 'Nothing to remix yet'}</div>
                  <div className="text-xs mt-1 text-gray-600">
                    {isZh ? '先去任意引擎或 AUTO 模式创作几首吧' : 'Generate something on Muse/Suno/Melo first'}
                  </div>
                </div>
              )}
              {songList.map(s => {
                const active = s.id === sourceSongId;
                const sproc = s.creativeProcess || {};
                const ssnap = sproc.snapshot || {};
                const sEngine = (sproc.engine || s.engine || 'muse').toLowerCase().replace(' ai', '');
                const eObj = ENGINES.find(e => e.id === sEngine);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSourceSongId(s.id);
                      // pre-populate variation fields
                      setNewStyle(ssnap.style || s.style || '');
                      setNewBpm(String(ssnap.bpm || s.result?.bpm || ''));
                      setNewTitle(s.title || ssnap.title || '');
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-2.5 ${active
                      ? 'bg-violet-500/15 border-violet-500/40 ring-2 ring-violet-500/20'
                      : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/15'
                      }`}
                  >
                    <div className={`w-9 h-9 rounded-md bg-gradient-to-br ${eObj?.color || 'from-gray-500 to-gray-700'} flex items-center justify-center text-white flex-shrink-0`}>
                      {eObj?.icon || <Music2 className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">
                        {(s.title || ssnap.title || '未命名').replace(/❌.*·\s*/, '')}
                      </div>
                      <div className="text-[10.5px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-medium">{eObj?.name || sEngine}</span>
                        {(ssnap.style || s.style) && <span className="text-pink-300 truncate max-w-[120px]">🎨 {ssnap.style || s.style}</span>}
                        {(ssnap.bpm || s.result?.bpm) && <span className="font-mono">♩ {ssnap.bpm || s.result?.bpm}</span>}
                      </div>
                      {s.audioUrl && (
                        <audio controls className="w-full h-6 mt-1.5" src={s.audioUrl} />
                      )}
                    </div>
                    {active && <Shuffle className="w-4 h-4 text-violet-400 flex-shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============== RIGHT: Remix Parameters + Targets ============== */}
          <div className="space-y-4">
            {/* Remix Mode selector */}
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                {isZh ? '② Remix 模式' : '② Remix mode'}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'engine', label: isZh ? '跨引擎' : 'Engine Swap', sub: isZh ? '歌词·参数不变' : 'keep lyrics + params', icon: <ArrowLeftRight className="w-3.5 h-3.5" />, color: 'violet' },
                  { id: 'style', label: isZh ? '换风格' : 'Style Change', sub: isZh ? '同引擎换曲风' : 'same engine, new vibe', icon: <Wand2 className="w-3.5 h-3.5" />, color: 'pink' },
                  { id: 'both', label: isZh ? '全部重编' : 'Full Rewrite', sub: isZh ? '引擎+风格都变' : 'everything new', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'amber' },
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setVariationMode(m.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${variationMode === m.id
                      ? `bg-${m.color}-500/10 border-${m.color}-500/40 ring-2 ring-${m.color}-500/20`
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                      }`}
                  >
                    <div className={`inline-flex p-1 rounded-md mb-1 ${variationMode === m.id ? 'bg-white/10' : 'bg-white/5'}`}>
                      {m.icon}
                    </div>
                    <div className="text-[13px] font-bold text-white">{m.label}</div>
                    <div className="text-[10.5px] text-gray-500">{m.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Override parameters */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-gray-300">
                  {(variationMode === 'style' || variationMode === 'both') ? isZh ? '③ 新参数 (将覆盖原作)' : '③ New params (override source)' : isZh ? '③ 原作参数预览' : '③ Source params preview'}
                </span>
                <button
                  onClick={copySourceParams}
                  className="text-[10.5px] text-gray-300 hover:text-white px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 inline-flex items-center gap-1 transition-colors"
                >
                  {copiedKey === 'params' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {isZh ? '复制原作参数' : 'Copy source'}
                </button>
              </div>

              <div>
                <label className="text-[10.5px] text-gray-400 block mb-1">
                  {isZh ? '标题' : 'Title'}
                  {(variationMode !== 'style' && variationMode !== 'both') && <span className="text-gray-600"> ({isZh ? '不变' : 'unchanged'})</span>}
                </label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  disabled={variationMode === 'engine'}
                  placeholder={sourceTitle || isZh ? '新标题…' : 'New title…'}
                  className="w-full bg-black/30 border border-white/10 focus:border-violet-500/40 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[10.5px] text-gray-400 block mb-1">
                  {isZh ? '风格' : 'Style'}
                  {(variationMode !== 'style' && variationMode !== 'both') && <span className="text-gray-600"> ({isZh ? '不变' : 'unchanged'})</span>}
                </label>
                <input
                  value={newStyle}
                  onChange={e => setNewStyle(e.target.value)}
                  disabled={variationMode === 'engine'}
                  placeholder={sourceStyle || isZh ? '如：流行·爵士融合' : 'e.g. Pop-Jazz Fusion'}
                  className="w-full bg-black/30 border border-white/10 focus:border-violet-500/40 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[10.5px] text-gray-400 block mb-1">
                  BPM
                  {(variationMode !== 'style' && variationMode !== 'both') && <span className="text-gray-600"> ({isZh ? '不变' : 'unchanged'})</span>}
                </label>
                <input
                  type="number"
                  value={newBpm}
                  onChange={e => setNewBpm(e.target.value)}
                  disabled={variationMode === 'engine'}
                  placeholder={String(sourceBpm || '80-180')}
                  className="w-full bg-black/30 border border-white/10 focus:border-violet-500/40 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 disabled:opacity-50 font-mono"
                />
              </div>

              {/* Original lyrics preview */}
              <div className="mt-2 pt-2 border-t border-white/5">
                <label className="text-[10.5px] text-gray-400 block mb-1 flex items-center justify-between">
                  <span>{isZh ? '原作歌词' : 'Source lyrics'} ({sourceLyrics.split('\n').filter(l => l.trim()).length} {isZh ? '行' : 'lines'})</span>
                  <button
                    onClick={() => { setPendingLyrics(sourceLyrics); showToast?.(isZh ? '已复制到剪贴板（可到任意页面粘贴）' : 'Staged for transfer to engine', 'info'); }}
                    className="text-[10px] text-violet-300 hover:text-violet-200 px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/15 transition-colors"
                  >
                    {isZh ? '仅复制歌词' : 'Lyrics only'}
                  </button>
                </label>
                <pre className="text-[10.5px] text-gray-300/90 whitespace-pre-wrap leading-relaxed font-sans bg-black/30 rounded-lg p-2.5 border border-white/5 max-h-32 overflow-y-auto">
                  {sourceLyrics || isZh ? (sourceLyrics || '(此作品没有歌词，不可跨引擎保留人声)') : '(this work has no lyrics)'}
                </pre>
              </div>
            </div>

            {/* Target engine picker */}
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <ArrowRight className="w-4 h-4 text-pink-400" />
                {isZh ? '④ 发送到…' : '④ Send to…'}
              </div>
              <div className="space-y-2">
                {ENGINES.map(e => {
                  const disabled = (variationMode === 'style') && (e.id === sourceEngine); // if style-only, same engine still works actually
                  const selected = targetEngines.includes(e.id);
                  const isSource = e.id === sourceEngine;
                  return (
                    <button
                      key={e.id}
                      onClick={() => !disabled && toggleTarget(e.id)}
                      disabled={disabled}
                      className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl border-2 transition-all ${selected
                        ? `bg-gradient-to-r ${e.color} bg-opacity-10 border-transparent shadow-lg`
                        : disabled
                          ? 'bg-white/[0.02] border-white/5 opacity-40 cursor-not-allowed'
                          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${e.color} flex items-center justify-center text-white shadow-md`}>
                          {e.icon}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-bold ${selected ? 'text-white' : 'text-white/90'}`}>{e.name}</span>
                            {isSource && <span className="text-[9px] px-1 py-0.5 rounded bg-white/10 text-gray-300">{isZh ? '原作引擎' : 'SOURCE'}</span>}
                          </div>
                          <div className={`text-[10.5px] ${selected ? 'text-white/80' : 'text-gray-500'}`}>{e.desc}</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'border-white bg-white/20' : 'border-white/20'}`}>
                        {selected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setSourceSongId(null); setTargetEngines([]); setVariationMode('engine'); }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10"
              >
                <RefreshCcw className="w-4 h-4" />
                {isZh ? '清空' : 'Clear'}
              </button>
              <button
                onClick={doSendAll}
                disabled={!canRemix}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-400 hover:via-fuchsia-400 hover:to-pink-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/30 hover:scale-[1.005] active:scale-[0.995] transition-all"
              >
                <Play className="w-5 h-5" />
                {isZh ? `🎼 同时重混到 ${targetEngines.length} 个引擎` : `🎼 Remix to ${targetEngines.length} engine(s)`}
              </button>
            </div>
            <p className="text-[10.5px] text-gray-500 text-center pt-0.5">
              {isZh
                ? '点击后会依次跳转各引擎页面，并自动预填歌词/风格/BPM/标题，用户确认后点"生成"即可'
                : 'Target engine pages will open auto-filled with lyrics, style, BPM, title — just click Generate'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}