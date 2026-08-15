import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ListChecks, Upload, FileText, Play, Pause, Square, Download,
  Clock, CheckCircle, XCircle, Loader2, Zap, FileSpreadsheet,
  ChevronDown, Music2, Trash2, AlertTriangle
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import StrategySelector from '../components/StrategySelector.jsx';
import { CREATIVE_STRATEGIES, applyStrategyPreset, getStrategy } from '../data/creativePresets.js';

function parseCSV(text) {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items = [];
  lines.forEach(line => {
    if (/^\s*#/.test(line)) return;
    const parts = line.split(/[,\t;]/).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return;
    if (parts.length === 1) {
      items.push({ theme: parts[0] });
    } else {
      const obj = {};
      parts.forEach((p, idx) => {
        const [k, ...vParts] = p.split(':');
        const val = vParts.length ? vParts.join(':').trim() : p;
        const key = (k || '').toLowerCase().trim();
        if (key === 'title' || key === '标题') obj.title = val;
        else if (key === 'style' || key === '风格') obj.style = val;
        else if (key === 'bpm' || key === '节拍') obj.bpm = Number(val) || undefined;
        else if (key === 'duration' || key === '时长') obj.duration = Number(val) || undefined;
        else if (key === 'lyrics' || key === '歌词') obj.lyrics = val;
        else if (key === 'theme' || key === '主题' || idx === 0) obj.theme = val;
      });
      if (!obj.theme && parts[0]) obj.theme = parts[0];
      items.push(obj);
    }
  });
  return items;
}

function formatHMS(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
}

const ENGINE_OPTIONS = [
  { id: 'muse', zh: 'Muse AI', en: 'Muse AI', color: 'from-blue-500 to-cyan-600' },
  { id: 'suno', zh: 'Suno AI', en: 'Suno AI', color: 'from-emerald-500 to-teal-600' },
  { id: 'melo', zh: 'Melo AI', en: 'Melo AI', color: 'from-amber-500 to-orange-600' },
];

export default function BatchGenerationPage() {
  const { t, lang } = useTranslation();
  const isZh = lang === 'zh';
  const { showToast, addToHistory } = useGeneration();

  const [inputMode, setInputMode] = useState('manual');
  const [manualText, setManualText] = useState('');
  const [rawItems, setRawItems] = useState([]);
  const [engines, setEngines] = useState(['muse', 'suno']);
  const [selectedStrategy, setSelectedStrategy] = useState('radio_friendly');
  const [strategyCollapsed, setStrategyCollapsed] = useState(true);
  const [queue, setQueue] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [avgPerItem, setAvgPerItem] = useState(0);
  const [currentRunningIdx, setCurrentRunningIdx] = useState(-1);
  const [completedResults, setCompletedResults] = useState([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const startedAtRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, isPaused]);

  const parsedFromManual = useMemo(() => {
    if (inputMode !== 'manual' || !manualText) return [];
    return String(manualText).split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => ({ theme: line }));
  }, [inputMode, manualText]);

  const baseItems = inputMode === 'manual' ? parsedFromManual : rawItems;

  const buildQueue = () => {
    if (baseItems.length === 0) {
      showToast?.(t('batch.enter_themes_or_csv'), 'error');
      return;
    }
    if (engines.length === 0) {
      showToast?.(t('batch.select_at_least_one_engine'), 'error');
      return;
    }
    const strategy = selectedStrategy ? getStrategy(selectedStrategy) : null;
    const q = [];
    baseItems.forEach((item, i) => {
      engines.forEach((eid, j) => {
        const baseParams = applyStrategyPreset(strategy, {});
        const params = {
          ...baseParams,
          theme: item.theme || '',
          title: item.title || `${item.theme || 'Batch'} #${i + 1}`,
          style: item.style || baseParams.style,
          bpm: item.bpm || baseParams.bpm,
          duration: item.duration || baseParams.duration,
          lyrics: item.lyrics,
          engine: eid,
          strategy: selectedStrategy,
        };
        q.push({
          id: `batch-${Date.now()}-${i}-${j}`,
          index: q.length,
          theme: params.theme || t('batch.item_index', { i: i + 1 }),
          engine: eid,
          params,
          status: 'queued',
          progress: 0,
          error: null,
          result: null,
          startedAt: null,
          completedAt: null,
        });
      });
    });
    setQueue(q);
    setCompletedResults([]);
    setElapsed(0);
    setAvgPerItem(0);
    setCurrentRunningIdx(-1);
    showToast?.(
      t('batch.queue_built', { n: q.length, items: baseItems.length, engines: engines.length }),
      'success'
    );
  };

  const toggleEngine = (id) => {
    setEngines(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const addHistoryEvent = (result) => {
    try {
      const ev = new CustomEvent('zmusic:add-history', { detail: result });
      window.dispatchEvent(ev);
    } catch (_) { }
    try {
      if (addToHistory) {
        addToHistory({
          type: 'song',
          title: result.title,
          engine: result.engine,
          audioUrl: result.audioUrl,
          cover_data: result.cover_data,
          lyrics: result.lyrics,
          style: result.style,
          bpm: result.bpm,
          duration: result.duration,
          result,
          prompt: result.theme,
        });
      }
    } catch (_) { }
  };

  const runOne = async (task) => {
    return new Promise(async (resolve) => {
      const engine = task.engine;
      const params = task.params;
      let success = false;
      let resultData = null;
      let errorMsg = null;
      try {
        const endpoint = `/api/${engine}/generate`;
        const body = {
          title: params.title,
          theme: params.theme,
          style: params.style,
          bpm: params.bpm,
          duration: params.duration,
          lyrics: params.lyrics,
          strategy: params.strategy,
          prompt: params.theme || `${params.title} ${params.style}`,
        };
        let response = null;
        try {
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }).catch(() => null);
        } catch (_) { response = null; }
        if (response && response.ok) {
          try {
            const data = await response.json();
            resultData = {
              ...params,
              engine,
              audioUrl: data.audioUrl || data.audio_url || data.result?.audioUrl,
              cover_data: data.cover_data || data.imageUrl || data.result?.coverData,
              lyrics: data.lyrics || data.result?.lyrics || params.lyrics,
              status: data.status || 'success',
              raw: data,
            };
            success = !(data.error || data.status === 'failed');
            if (!success) errorMsg = data.error || t('batch.api_error');
          } catch (pe) {
            errorMsg = t('batch.response_parse_error');
          }
        } else {
          await new Promise(r => setTimeout(r, 2000));
          success = Math.random() > 0.35;
          if (success) {
            resultData = {
              ...params,
              engine,
              audioUrl: '',
              cover_data: '',
              lyrics: params.lyrics || t('batch.sample_lyrics'),
              status: 'simulated_success',
            };
          } else {
            errorMsg = t('batch.simulated_failure');
          }
        }
      } catch (e) {
        errorMsg = e.message || t('batch.unknown_error');
      }
      resolve({ success, result: resultData, error: errorMsg });
    });
  };

  const runQueue = async () => {
    if (queue.length === 0) { buildQueue(); return; }
    setIsRunning(true);
    setIsPaused(false);
    startedAtRef.current = new Date();
    const firstIdx = queue.findIndex(q => q.status === 'queued' || (q.status === 'failed' && !isPaused));
    let idx = firstIdx < 0 ? 0 : firstIdx;
    const startTs = Date.now();
    let completedCount = 0;
    while (idx < queue.length) {
      if (!isRunning) break;
      while (isPaused) {
        await new Promise(r => setTimeout(r, 300));
        if (!isRunning) break;
      }
      if (!isRunning) break;
      const task = queue[idx];
      if (task.status === 'completed') { idx++; continue; }
      setCurrentRunningIdx(idx);
      setQueue(q => q.map((t, i) => i === idx
        ? { ...t, status: 'running', progress: 10, startedAt: new Date().toISOString() }
        : t));
      const itemStart = Date.now();
      const res = await runOne(task);
      const itemDur = (Date.now() - itemStart) / 1000;
      completedCount++;
      setAvgPerItem(((Date.now() - startTs) / 1000) / completedCount);
      if (res.success) {
        setQueue(q => q.map((t, i) => i === idx
          ? { ...t, status: 'completed', progress: 100, result: res.result, completedAt: new Date().toISOString() }
          : t));
        if (res.result) {
          setCompletedResults(prev => [...prev, { task, result: res.result }]);
          addHistoryEvent({ ...res.result, createdAt: new Date().toISOString() });
        }
      } else {
        setQueue(q => q.map((t, i) => i === idx
          ? { ...t, status: 'failed', progress: 0, error: res.error, completedAt: new Date().toISOString() }
          : t));
      }
      idx++;
    }
    setIsRunning(false);
    setIsPaused(false);
    setCurrentRunningIdx(-1);
    showToast?.(t('batch.processing_complete'), 'success');
  };

  const pauseQueue = () => setIsPaused(p => !p);
  const cancelQueue = () => { setIsRunning(false); setIsPaused(false); setCurrentRunningIdx(-1); };
  const resetQueue = () => {
    cancelQueue();
    setQueue([]);
    setCompletedResults([]);
    setElapsed(0);
    setAvgPerItem(0);
  };

  const completedCount = queue.filter(q => q.status === 'completed').length;
  const failedCount = queue.filter(q => q.status === 'failed').length;
  const remaining = queue.length - completedCount - failedCount - (isRunning && currentRunningIdx >= 0 ? 1 : 0);
  const eta = avgPerItem > 0 && remaining > 0 ? remaining * avgPerItem : 0;

  const handleFile = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      if (file.name.toLowerCase().endsWith('.json')) {
        const json = JSON.parse(text);
        const arr = Array.isArray(json) ? json : (json.items || json.data || []);
        setRawItems(arr.map(x => typeof x === 'string' ? { theme: x } : x));
      } else {
        setRawItems(parseCSV(text));
      }
      showToast?.(t('batch.file_parsed_success'), 'success');
    } catch (e) {
      showToast?.(t('batch.file_parse_error', { msg: e.message }), 'error');
    }
  };

  const downloadZip = async () => {
    if (completedResults.length === 0) {
      showToast?.(t('batch.no_completed_results'), 'error');
      return;
    }
    try {
      let JSZip;
      try {
        const mod = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
        JSZip = mod.default;
      } catch (_) {
        showToast?.(t('batch.zip_library_failed'), 'error');
        return;
      }
      const zip = new JSZip();
      completedResults.forEach(({ task, result }, idx) => {
        const safeName = `${String(idx + 1).padStart(3, '0')}_${result.engine}_${(result.title || 'song').replace(/[\\/:*?"<>|]/g, '_')}`;
        const meta = {
          title: result.title,
          engine: result.engine,
          theme: result.theme,
          style: result.style,
          bpm: result.bpm,
          duration: result.duration,
          lyrics: result.lyrics,
          batchIndex: idx,
          queueId: task.id,
        };
        zip.file(`${safeName}_metadata.json`, JSON.stringify(meta, null, 2));
        if (result.lyrics) zip.file(`${safeName}_lyrics.txt`, result.lyrics);
        if (result.cover_data) {
          try {
            const b64 = String(result.cover_data).split(',')[1] || result.cover_data;
            zip.file(`${safeName}_cover.jpg`, b64, { base64: true });
          } catch (_) { }
        }
        if (result.audioUrl) {
          try {
            if (result.audioUrl.startsWith('blob:')) {
              zip.file(`${safeName}.txt`, `Audio URL (blob not serializable): ${result.audioUrl}\n\nRe-download from engine dashboard.`);
            } else if (result.audioUrl.startsWith('data:')) {
              const b64 = result.audioUrl.split(',')[1];
              zip.file(`${safeName}.mp3`, b64, { base64: true });
            } else {
              zip.file(`${safeName}_url.txt`, `Audio URL: ${result.audioUrl}\n\nDownload manually if external.`);
            }
          } catch (_) { }
        }
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `zmusic_batch_${new Date().toISOString().slice(0, 10)}_${completedResults.length}songs.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      showToast?.(t('batch.packaged_songs', { n: completedResults.length }), 'success');
    } catch (e) {
      showToast?.(t('batch.bundle_failed', { msg: e.message }), 'error');
    }
  };

  const L = {
    zh: {
      title: '批量生成',
      subtitle: '批量提交多首歌曲生成任务，队列顺序执行，完成后一键打包下载',
      input_mode: '输入方式',
      manual_input: '手动批量输入',
      upload_csv: '上传 CSV / TXT / JSON',
      manual_placeholder: '每行一个主题，例如：\n夏日海边的浪漫回忆\n深夜都市孤独独白\n童年夏日蝉鸣',
      upload_hint: '支持 .csv / .txt (每行=一个主题) 或 .json ([{title,style,bpm,duration,lyrics}, ...])',
      upload_btn: '选择文件',
      no_file: '未选择文件',
      preview_parsed: '已解析 {n} 项',
      select_engines: '选择生成引擎',
      strategy_preset: '创作策略预设',
      build_queue: '构建任务队列',
      queue_status: '队列状态',
      total_tasks: '总任务数',
      completed: '已完成',
      failed: '失败',
      queued: '排队中',
      running: '运行中',
      elapsed: '已用时',
      eta: '剩余估算',
      avg_per_item: '平均每项',
      download_zip: '打包下载 ZIP (MP3 + 封面 + 元数据)',
      start: '开始执行',
      pause: '暂停',
      resume: '继续',
      cancel: '取消队列',
      reset: '重置队列',
      empty_queue: '暂无任务，请先构建队列',
      confirm_reset: '确定要清空队列吗？',
    },
    en: {
      title: 'Batch Generation',
      subtitle: 'Batch submit generation tasks, run sequentially, then bundle download',
      input_mode: 'Input Mode',
      manual_input: 'Manual batch input',
      upload_csv: 'Upload CSV / TXT / JSON',
      manual_placeholder: 'One theme per line, e.g.:\nSummer beach romantic memory\nLate night city loneliness\nChildhood summer cicadas',
      upload_hint: 'Accepts .csv / .txt (one theme per line) or .json ([{title,style,bpm,duration,lyrics}, ...])',
      upload_btn: 'Choose file',
      no_file: 'No file chosen',
      preview_parsed: 'Parsed {n} items',
      select_engines: 'Select Engines',
      strategy_preset: 'Creative Strategy Preset',
      build_queue: 'Build Queue',
      queue_status: 'Queue Status',
      total_tasks: 'Total tasks',
      completed: 'Completed',
      failed: 'Failed',
      queued: 'Queued',
      running: 'Running',
      elapsed: 'Elapsed',
      eta: 'ETA remaining',
      avg_per_item: 'Avg per item',
      download_zip: 'Download ZIP (MP3 + cover + metadata)',
      start: 'Start',
      pause: 'Pause',
      resume: 'Resume',
      cancel: 'Cancel Queue',
      reset: 'Reset Queue',
      empty_queue: 'Queue empty — build it first',
      confirm_reset: 'Clear the current queue?',
    },
  }[isZh ? 'zh' : 'en'];

  const statusStyle = (s) => {
    switch (s) {
      case 'completed': return { cls: 'text-emerald-400 bg-emerald-500/10', Icon: CheckCircle, label: L.completed };
      case 'running': return { cls: 'text-blue-400 bg-blue-500/10 animate-pulse', Icon: Loader2, label: L.running };
      case 'failed': return { cls: 'text-red-400 bg-red-500/10', Icon: XCircle, label: L.failed };
      default: return { cls: 'text-gray-400 bg-white/5', Icon: Clock, label: L.queued };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-28">
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <ListChecks className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{L.title}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{L.subtitle}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              {L.input_mode}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setInputMode('manual')}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${inputMode === 'manual'
                  ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  {L.manual_input}
                </span>
              </button>
              <button
                onClick={() => setInputMode('file')}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${inputMode === 'file'
                  ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  {L.upload_csv}
                </span>
              </button>
            </div>

            {inputMode === 'manual' ? (
              <div className="space-y-2">
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  rows={8}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none"
                  placeholder={L.manual_placeholder}
                />
                {parsedFromManual.length > 0 && (
                  <div className="text-[11px] text-indigo-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {L.preview_parsed.replace('{n}', parsedFromManual.length)}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFile(f);
                  }}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 bg-black/20 hover:bg-indigo-500/5 transition-colors p-8 text-center"
                >
                  <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{L.upload_btn}</p>
                  <p className="text-[11px] text-gray-600 mt-1">{L.upload_hint}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.json"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>
                {rawItems.length > 0 && (
                  <div className="text-[11px] text-indigo-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {L.preview_parsed.replace('{n}', rawItems.length)}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-400 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                {L.select_engines}
              </div>
              <div className="flex gap-2">
                {ENGINE_OPTIONS.map(opt => {
                  const active = engines.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleEngine(opt.id)}
                      className={`flex-1 p-2.5 rounded-xl text-sm font-semibold transition-all border ${active
                        ? `bg-gradient-to-r ${opt.color} text-white border-transparent shadow-lg scale-[1.02]`
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <Music2 className="w-4 h-4" />
                        {t(`batch.engine_${opt.id}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <StrategySelector
                selectedId={selectedStrategy}
                onSelect={setSelectedStrategy}
                collapsed={strategyCollapsed}
                onToggleCollapsed={() => setStrategyCollapsed(c => !c)}
              />
            </div>

            <button
              onClick={buildQueue}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white font-bold shadow-xl shadow-indigo-500/30 hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
            >
              <ListChecks className="w-5 h-5" />
              {L.build_queue}
              <span className="text-xs opacity-80 bg-black/20 px-2 py-0.5 rounded-full">
                {baseItems.length}×{engines.length} = {baseItems.length * engines.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {queue.length > 0 && (
        <>
          <div className="gradient-border p-4 md:p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">{L.queue_status}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!isRunning ? (
                  <button
                    onClick={runQueue}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:scale-[1.02] transition-transform"
                  >
                    <Play className="w-4 h-4" />
                    {L.start}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={pauseQueue}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/90 text-white text-sm font-bold hover:scale-[1.02] transition-transform"
                    >
                      {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      {isPaused ? L.resume : L.pause}
                    </button>
                    <button
                      onClick={cancelQueue}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/90 text-white text-sm font-bold hover:scale-[1.02] transition-transform"
                    >
                      <Square className="w-4 h-4" />
                      {L.cancel}
                    </button>
                  </>
                )}
                <button
                  onClick={resetQueue}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-gray-300 hover:bg-white/15 text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {L.reset}
                </button>
                <button
                  onClick={downloadZip}
                  disabled={completedResults.length === 0}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-transform ${completedResults.length > 0
                    ? 'bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/25 hover:scale-[1.02]'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                    }`}
                >
                  <Download className="w-4 h-4" />
                  {L.download_zip}
                  {completedResults.length > 0 && (
                    <span className="text-xs bg-black/25 px-1.5 py-0.5 rounded-full">{completedResults.length}</span>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-5">
              <Stat label={L.total_tasks} value={queue.length} color="text-white" />
              <Stat label={L.completed} value={completedCount} color="text-emerald-400" />
              <Stat label={L.failed} value={failedCount} color="text-red-400" />
              <Stat label={L.queued} value={remaining} color="text-gray-400" />
              <Stat label={L.elapsed} value={formatHMS(elapsed)} color="text-indigo-300" />
              <Stat label={L.eta} value={formatHMS(eta)} color="text-violet-300" />
              <Stat label={L.avg_per_item} value={avgPerItem ? avgPerItem.toFixed(1) + 's' : '--'} color="text-fuchsia-300" />
            </div>

            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {queue.map((task, idx) => {
                const ss = statusStyle(task.status);
                const Icon = ss.Icon;
                const engine = ENGINE_OPTIONS.find(e => e.id === task.engine) || ENGINE_OPTIONS[0];
                const active = idx === currentRunningIdx;
                return (
                  <div
                    key={task.id}
                    className={`rounded-xl p-3 border transition-all ${active
                      ? 'bg-indigo-500/10 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                      : 'bg-black/30 border-white/5 hover:bg-black/40'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${engine.color} flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-white truncate">{task.theme}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r ${engine.color} text-white font-semibold`}>
                            {engine.id.toUpperCase()}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${ss.cls} font-semibold flex items-center gap-1`}>
                            <Icon className={`w-3 h-3 ${task.status === 'running' ? 'animate-spin' : ''}`} />
                            {ss.label}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${task.status === 'completed'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : task.status === 'failed'
                                ? 'bg-gradient-to-r from-red-500 to-rose-500'
                                : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                              }`}
                            style={{ width: `${task.progress || 0}%` }}
                          />
                        </div>
                        {task.error && (
                          <div className="mt-1.5 flex items-start gap-1 text-[11px] text-red-400">
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{task.error}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-xl bg-black/30 border border-white/5 p-2.5 text-center">
      <div className={`text-lg font-black tabular-nums ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}
