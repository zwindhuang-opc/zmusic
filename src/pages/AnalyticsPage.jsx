import React, { useMemo } from 'react';
import {
  BarChart3, PieChart, TrendingUp, Clock, Target, Download,
  Music, Zap, Award, Flame, CheckCircle, XCircle
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { CREATIVE_STRATEGIES } from '../data/creativePresets.js';

function formatHMS(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
}

function formatSec(sec) {
  const s = Math.max(0, Math.round(sec || 0));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${(s / 3600).toFixed(1)}h`;
}

const ENGINE_COLORS = {
  muse: 'from-blue-500 to-cyan-500',
  suno: 'from-emerald-500 to-teal-500',
  melo: 'from-amber-500 to-orange-500',
  mv: 'from-purple-500 to-pink-500',
  unknown: 'from-gray-500 to-gray-600',
};

const STYLE_PALETTE = [
  '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#6366f1', '#14b8a6', '#84cc16', '#f97316',
  '#a855f7', '#0ea5e9', '#eab308', '#22c55e', '#e11d48',
];

function getEngineOf(item) {
  const e = (item.engine || item.creativeProcess?.engine || (item.type === 'mv' ? 'mv' : 'unknown')).toString().toLowerCase();
  if (e.includes('muse')) return 'muse';
  if (e.includes('suno')) return 'suno';
  if (e.includes('melo') || e.includes('byte')) return 'melo';
  if (e.includes('mv')) return 'mv';
  return 'unknown';
}

function getDurationOf(item) {
  return Number(item.duration || item.audioDuration || item.result?.duration || item.creativeProcess?.snapshot?.duration || 180) || 0;
}

function getCreatedAt(item) {
  const s = item.createdAt || item.completedAt || item.creativeProcess?.completedAt;
  if (s) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function downloadCSV(filename, rows) {
  const csv = rows.map(row =>
    row.map(cell => {
      const s = String(cell ?? '');
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    }).join(',')
  ).join('\r\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export default function AnalyticsPage() {
  const { t, lang } = useTranslation();
  const isZh = lang === 'zh';

  const history = useMemo(() => {
    try {
      const raw = localStorage.getItem('zmusic_history') || localStorage.getItem('zmusic_generation_history') || '[]';
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }, []);

  const songs = useMemo(() => history.filter(h =>
    h.type === 'song' || h.type === 'creation_attempt' || h.audioUrl ||
    (h.creativeProcess && (h.creativeProcess.engine || h.creativeProcess.snapshot))
  ), [history]);

  const totalSongs = songs.length;

  const totalDurationSec = useMemo(() => {
    return songs.reduce((sum, s) => sum + getDurationOf(s), 0);
  }, [songs]);

  const successCount = useMemo(() =>
    songs.filter(s =>
      s.status === 'success' || s.result?.status === 'success' ||
      s.audioUrl || s.result?.audioUrl || s.creativeProcess?.result?.audioUrl ||
      s.type === 'song'
    ).length,
    [songs]
  );
  const successRate = totalSongs > 0 ? Math.round((successCount / totalSongs) * 100) : 0;

  const avgGenTimeOverall = useMemo(() => {
    const times = [];
    songs.forEach(s => {
      if (s.creativeProcess?.startedAt && s.creativeProcess?.completedAt) {
        const d = (new Date(s.creativeProcess.completedAt) - new Date(s.creativeProcess.startedAt)) / 1000;
        if (d > 0 && d < 3600) times.push(d);
      }
      if (s.startedAt && s.completedAt) {
        const d = (new Date(s.completedAt) - new Date(s.startedAt)) / 1000;
        if (d > 0 && d < 3600) times.push(d);
      }
    });
    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }, [songs]);

  const engineStats = useMemo(() => {
    const map = {};
    songs.forEach(s => {
      const e = getEngineOf(s);
      if (!map[e]) map[e] = { count: 0, ok: 0, durations: [], times: [] };
      map[e].count++;
      const ok = !!(s.audioUrl || s.result?.audioUrl || s.status === 'success' || s.type === 'song');
      if (ok) map[e].ok++;
      map[e].durations.push(getDurationOf(s));
      if (s.creativeProcess?.startedAt && s.creativeProcess?.completedAt) {
        const d = (new Date(s.creativeProcess.completedAt) - new Date(s.creativeProcess.startedAt)) / 1000;
        if (d > 0 && d < 3600) map[e].times.push(d);
      }
    });
    Object.keys(map).forEach(k => {
      const m = map[k];
      const durs = m.durations.filter(Boolean);
      m.avgDuration = durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : 0;
      m.avgTime = m.times.length ? m.times.reduce((a, b) => a + b, 0) / m.times.length : 0;
      m.successRate = m.count ? Math.round((m.ok / m.count) * 100) : 0;
    });
    return map;
  }, [songs]);

  const credits = Math.max(1, totalSongs);

  const enginesList = useMemo(() => {
    const entries = Object.entries(engineStats).filter(([k]) => k !== 'unknown');
    if (entries.length === 0) return [['muse', { count: 0, ok: 0, successRate: 0, avgTime: 0 }]];
    return entries;
  }, [engineStats]);
  const maxEngineCount = Math.max(1, ...enginesList.map(([, v]) => v.count));

  const styleDistribution = useMemo(() => {
    const map = {};
    songs.forEach(s => {
      const style = (s.style || s.creativeProcess?.snapshot?.style || s.result?.style || '').toString().trim();
      if (!style) return;
      const key = style.length > 18 ? style.slice(0, 18) + '…' : style;
      map[key] = (map[key] || 0) + 1;
    });
    const allTags = new Map();
    CREATIVE_STRATEGIES.forEach(str => str.tags.forEach(t => { allTags.set(t, (allTags.get(t) || 0) + 0); }));
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
    return entries.map(([k, v], i) => ({
      name: k,
      count: v,
      percent: (v / total) * 100,
      color: STYLE_PALETTE[i % STYLE_PALETTE.length],
    }));
  }, [songs]);

  const heatmap = useMemo(() => {
    const grid = Array.from({ length: 24 }, () => Array(7).fill(0));
    songs.forEach(s => {
      const d = getCreatedAt(s);
      if (!d) return;
      const hour = d.getHours();
      const day = (d.getDay() + 6) % 7;
      grid[hour][day] = (grid[hour][day] || 0) + 1;
    });
    const max = Math.max(1, ...grid.flat());
    return { grid, max };
  }, [songs]);

  const lineChart = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const counts = days.map(d => {
      const start = d.getTime();
      const end = start + 86400000;
      return songs.filter(s => {
        const cd = getCreatedAt(s);
        return cd && cd.getTime() >= start && cd.getTime() < end;
      }).length;
    });
    return { days, counts, max: Math.max(1, ...counts) };
  }, [songs]);

  const topStyles = useMemo(() => {
    const m = {};
    songs.forEach(s => {
      const st = (s.style || s.creativeProcess?.snapshot?.style || '').toString().trim();
      if (st) m[st] = (m[st] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [songs]);

  const topBpmRanges = useMemo(() => {
    const ranges = [
      { k: '低 <90', lo: 0, hi: 90 },
      { k: '中 90-120', lo: 90, hi: 120 },
      { k: '中高 120-140', lo: 120, hi: 140 },
      { k: '高 140-170', lo: 140, hi: 170 },
      { k: '极高 ≥170', lo: 170, hi: 999 },
    ];
    ranges.forEach(r => { r.count = 0; });
    songs.forEach(s => {
      const bpm = Number(s.bpm || s.creativeProcess?.snapshot?.bpm || s.result?.bpm || 0);
      if (!bpm) return;
      const r = ranges.find(rr => bpm >= rr.lo && bpm < rr.hi);
      if (r) r.count++;
    });
    return ranges.sort((a, b) => b.count - a.count).slice(0, 5).filter(r => r.count > 0);
  }, [songs]);

  const publishing = useMemo(() => {
    const byPlatform = {};
    let published = 0;
    songs.forEach(s => {
      const ps = s.publishing_status || s.publishingResult || s.result?.publishing_status;
      if (!ps) return;
      published++;
      ['douyin', 'qishui', 'tiktok', 'youtube', 'rednote'].forEach(p => {
        const url = ps[`${p}_url`] || ps[p];
        if (url) byPlatform[p] = (byPlatform[p] || 0) + 1;
      });
    });
    return { byPlatform, published };
  }, [songs]);

  const exportReport = () => {
    const rows = [];
    rows.push([isZh ? '指标' : 'Metric', isZh ? '值' : 'Value']);
    rows.push([isZh ? '总歌曲数' : 'Total Songs', totalSongs]);
    rows.push([isZh ? '总时长' : 'Total Duration', formatHMS(totalDurationSec)]);
    rows.push([isZh ? '成功数' : 'Successful', successCount]);
    rows.push([isZh ? '成功率' : 'Success Rate', successRate + '%']);
    rows.push([isZh ? '平均生成时间' : 'Avg Gen Time (s)', avgGenTimeOverall.toFixed(1)]);
    rows.push([isZh ? '估算积分消耗' : 'Est Credits', credits]);
    rows.push([]);
    rows.push([isZh ? '引擎统计' : '=== Engine Breakdown ===']);
    rows.push(['Engine', 'Count', 'Success Rate %', 'Avg Duration (s)', 'Avg Gen Time (s)']);
    enginesList.forEach(([k, v]) => {
      rows.push([k, v.count, v.successRate, v.avgDuration.toFixed(0), v.avgTime.toFixed(1)]);
    });
    rows.push([]);
    rows.push([isZh ? '风格分布 Top 10' : '=== Style Distribution Top 10 ===']);
    rows.push(['Style', 'Count', '%']);
    styleDistribution.forEach(s => rows.push([s.name, s.count, s.percent.toFixed(1) + '%']));
    rows.push([]);
    rows.push([isZh ? '歌曲明细' : '=== Song Details ===']);
    rows.push(['Date', 'Engine', 'Title', 'Style', 'BPM', 'Duration', 'Status']);
    songs.forEach(s => {
      rows.push([
        (getCreatedAt(s) || new Date(0)).toISOString().slice(0, 16),
        getEngineOf(s),
        s.title || s.creativeProcess?.snapshot?.title || '',
        s.style || s.creativeProcess?.snapshot?.style || '',
        s.bpm || s.creativeProcess?.snapshot?.bpm || '',
        getDurationOf(s),
        (s.audioUrl || s.result?.audioUrl) ? 'success' : 'pending',
      ]);
    });
    downloadCSV(`zmusic_analytics_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const L = {
    zh: {
      title: '数据分析',
      subtitle: '基于本地生成历史，统计引擎表现、创作习惯与积分消耗',
      total_songs: '总歌曲数',
      total_duration: '总时长',
      success_rate: '成功率',
      avg_gen_time: '平均生成时长',
      credits_est: '估算积分消耗',
      credits_note: '估算值仅供参考',
      engine_comparison: '引擎对比 (数量 + 成功率覆盖)',
      style_distribution: '风格分布',
      productive_hours: '最具生产力时段热力图 (周 × 小时)',
      credit_burn_rate: '近7日生成趋势',
      publishing: '发布统计',
      platforms: '各平台发布数',
      habits: '创作习惯',
      top_styles: '最常用风格 (Top 5)',
      top_engines: '最常用引擎',
      top_bpms: '最常用BPM区间',
      export_report: '导出CSV报告',
      day_labels: ['一', '二', '三', '四', '五', '六', '日'],
      total: '总计',
      success_label: '成功',
      failed_label: '失败',
      no_data: '暂无数据，先生成一些歌曲吧',
      published_total: '已发布歌曲',
      most_shared: '发布最多的平台',
    },
    en: {
      title: 'Analytics Dashboard',
      subtitle: 'Local history-based engine performance, habit & credit metrics',
      total_songs: 'Total Songs',
      total_duration: 'Total Duration',
      success_rate: 'Success Rate',
      avg_gen_time: 'Avg Gen Time',
      credits_est: 'Est. Credits Used',
      credits_note: 'Estimates only',
      engine_comparison: 'Engine Comparison (count + success-rate overlay)',
      style_distribution: 'Style Distribution',
      productive_hours: 'Most Productive Hours (Week × Hour heatmap)',
      credit_burn_rate: 'Last 7-Day Generation Trend',
      publishing: 'Publishing',
      platforms: 'Posts per platform',
      habits: 'Creation Habits',
      top_styles: 'Most Used Styles (Top 5)',
      top_engines: 'Most Used Engines',
      top_bpms: 'Most Common BPM Ranges',
      export_report: 'Export CSV Report',
      day_labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      total: 'Total',
      success_label: 'Success',
      failed_label: 'Failed',
      no_data: 'No data yet — generate some songs',
      published_total: 'Published songs',
      most_shared: 'Most shared platform',
    },
  }[isZh ? 'zh' : 'en'];

  const donutGradient = styleDistribution.length > 0
    ? `conic-gradient(${styleDistribution.map((s, i) => {
      const start = styleDistribution.slice(0, i).reduce((a, b) => a + b.percent, 0);
      const end = start + s.percent;
      return `${s.color} ${start}% ${end}%`;
    }).join(', ')})`
    : 'conic-gradient(#374151 0% 100%)';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-28">
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-500 flex items-center justify-center shadow-xl shadow-sky-500/30">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {L.title}
                <TrendingUp className="w-5 h-5 text-sky-400" />
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">{L.subtitle}</p>
            </div>
          </div>
          <button
            onClick={exportReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-bold shadow-lg shadow-sky-500/25 hover:scale-[1.02] transition-transform"
          >
            <Download className="w-4 h-4" />
            {L.export_report}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={<Music className="w-5 h-5" />}
            label={L.total_songs}
            value={totalSongs}
            subValue={formatHMS(totalDurationSec)}
            subLabel={L.total_duration}
            gradient="from-sky-500 to-cyan-500"
          />
          <KpiCard
            icon={<CheckCircle className="w-5 h-5" />}
            label={L.success_rate}
            value={`${successRate}%`}
            subValue={`${successCount}/${totalSongs || 0}`}
            subLabel={`${L.success_label} / ${L.total}`}
            gradient={successRate >= 70 ? 'from-emerald-500 to-teal-500' : successRate >= 40 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-500'}
          />
          <KpiCard
            icon={<Clock className="w-5 h-5" />}
            label={L.avg_gen_time}
            value={avgGenTimeOverall ? formatSec(avgGenTimeOverall) : '--'}
            subValue={
              Object.entries(engineStats).filter(([k]) => k !== 'unknown').map(([k, v]) => `${k.toUpperCase().slice(0, 4)} ${v.avgTime ? formatSec(v.avgTime) : '-'}`).join(' · ') || '--'
            }
            subLabel={isZh ? '各引擎平均值' : 'Per-engine breakdown'}
            gradient="from-violet-500 to-purple-500"
          />
          <KpiCard
            icon={<Zap className="w-5 h-5" />}
            label={L.credits_est}
            value={credits}
            subValue={L.credits_note}
            subLabel=""
            gradient="from-fuchsia-500 to-pink-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="gradient-border p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">{L.engine_comparison}</h3>
          </div>
          {enginesList.length === 0 ? (
            <EmptyHint text={L.no_data} />
          ) : (
            <div className="space-y-3">
              {enginesList.map(([k, v]) => {
                const color = ENGINE_COLORS[k] || ENGINE_COLORS.unknown;
                const w = (v.count / maxEngineCount) * 100;
                return (
                  <div key={k}>
                    <div className="flex justify-between items-baseline mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${color}`} />
                        <span className="text-xs font-bold text-white uppercase tracking-wide">{k}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black text-white tabular-nums">{v.count}</span>
                        <span className={`text-[10px] font-bold tabular-nums ${v.successRate >= 70 ? 'text-emerald-400' : v.successRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                          {v.successRate}%
                        </span>
                      </div>
                    </div>
                    <div className="relative h-6 rounded-lg bg-white/5 overflow-hidden">
                      <div className={`absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r ${color} transition-all duration-700`} style={{ width: `${w}%` }} />
                      <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-white/10 to-transparent" style={{ width: `${100 - v.successRate}%` }} />
                      <div className="absolute inset-0 flex items-center justify-end px-2 text-[10px] font-bold text-white/80 uppercase">
                        {isZh ? `成功 ${v.successRate}%` : `${v.successRate}% OK`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="gradient-border p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-fuchsia-400" />
            <h3 className="text-sm font-bold text-white">{L.style_distribution}</h3>
          </div>
          {styleDistribution.length === 0 ? (
            <EmptyHint text={L.no_data} />
          ) : (
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <div
                  className="w-36 h-36 rounded-full shadow-xl"
                  style={{ background: donutGradient }}
                />
                <div className="absolute inset-5 rounded-full bg-[#0a0a14] flex flex-col items-center justify-center">
                  <div className="text-xs text-gray-500 font-semibold uppercase">{L.total}</div>
                  <div className="text-2xl font-black text-white tabular-nums">{styleDistribution.reduce((s, x) => s + x.count, 0)}</div>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {styleDistribution.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-[11px]">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <div className="flex-1 truncate text-gray-300">{s.name}</div>
                    <div className="flex-shrink-0 tabular-nums text-gray-400 font-bold">{s.count}</div>
                    <div className="w-10 text-right tabular-nums text-white/70 font-bold">{s.percent.toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="gradient-border p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">{L.productive_hours}</h3>
          </div>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-1 min-w-[520px]" style={{ gridTemplateColumns: '32px repeat(7, 1fr)' }}>
              <div />
              {L.day_labels.map((d, i) => (
                <div key={i} className="text-center text-[10px] text-gray-500 font-bold pb-1">{d}</div>
              ))}
              {Array.from({ length: 24 }).map((_, hour) => (
                <React.Fragment key={hour}>
                  <div className="text-[10px] text-gray-600 tabular-nums pr-1 text-right h-5 leading-5">
                    {hour % 3 === 0 ? `${hour}h` : ''}
                  </div>
                  {Array.from({ length: 7 }).map((__, day) => {
                    const val = heatmap.grid[hour]?.[day] || 0;
                    const opacity = heatmap.max > 1 ? 0.1 + (val / heatmap.max) * 0.9 : val ? 0.8 : 0.08;
                    return (
                      <div
                        key={day}
                        title={`${L.day_labels[day]} ${hour}:00 - ${val} ${isZh ? '首' : 'songs'}`}
                        className="h-5 rounded-sm transition-transform hover:scale-110 cursor-pointer"
                        style={{
                          backgroundColor: '#10b981',
                          opacity,
                          boxShadow: val > 0 ? 'inset 0 0 0 1px rgba(255,255,255,0.08)' : 'none',
                        }}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-gray-500">
            <span>0</span>
            {[0.25, 0.5, 0.75, 1].map(op => (
              <div key={op} className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#10b981', opacity: 0.1 + op * 0.9 }} />
            ))}
            <span>{heatmap.max}</span>
          </div>
        </div>

        <div className="gradient-border p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">{L.credit_burn_rate}</h3>
          </div>
          <div className="relative h-48">
            <svg className="w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                <line key={i} x1="20" x2="290" y1={10 + t * 130} y2={10 + t * 130} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              ))}
              {(() => {
                const n = lineChart.counts.length;
                const padL = 30, padR = 10, padT = 10, padB = 25;
                const W = 300, H = 160;
                const innerW = W - padL - padR;
                const innerH = H - padT - padB;
                const pts = lineChart.counts.map((c, i) => {
                  const x = padL + (i / Math.max(1, n - 1)) * innerW;
                  const y = padT + innerH - (c / lineChart.max) * innerH;
                  return [x, y];
                });
                const polyline = pts.map(p => p.join(',')).join(' ');
                const area = `${padL},${padT + innerH} ${polyline} ${padL + innerW},${padT + innerH}`;
                return (
                  <>
                    <polygon points={area} fill="url(#lineGrad)" />
                    <polyline
                      points={polyline}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {pts.map(([x, y], i) => (
                      <g key={i}>
                        <circle cx={x} cy={y} r="3" fill="#0a0a14" stroke="#f59e0b" strokeWidth="2" />
                        <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fill="#fde68a" fontWeight="bold">
                          {lineChart.counts[i]}
                        </text>
                        <text
                          x={x}
                          y={H - 8}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#6b7280"
                        >
                          {isZh
                            ? `${lineChart.days[i].getMonth() + 1}/${lineChart.days[i].getDate()}`
                            : lineChart.days[i].toLocaleDateString('en', { month: 'short', day: 'numeric' })
                          }
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="gradient-border p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">{L.top_styles}</h3>
          </div>
          {topStyles.length === 0 ? (
            <EmptyHint text={L.no_data} small />
          ) : (
            <ul className="space-y-2">
              {topStyles.map(([name, count], i) => (
                <li key={name} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white shadow-md ${
                    i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                    i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                    i === 2 ? 'bg-gradient-to-br from-orange-500 to-red-700' :
                    'bg-gradient-to-br from-gray-500 to-gray-700'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 truncate text-sm text-gray-200">{name}</div>
                  <Badge count={count} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="gradient-border p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">{L.top_bpms}</h3>
          </div>
          {topBpmRanges.length === 0 ? (
            <EmptyHint text={L.no_data} small />
          ) : (
            <ul className="space-y-2">
              {topBpmRanges.map((r, i) => (
                <li key={r.k} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white shadow-md ${
                    i === 0 ? 'bg-gradient-to-br from-violet-500 to-purple-600' :
                    i === 1 ? 'bg-gradient-to-br from-indigo-500 to-blue-600' :
                    i === 2 ? 'bg-gradient-to-br from-sky-500 to-cyan-600' :
                    'bg-gradient-to-br from-gray-500 to-gray-700'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 text-sm text-gray-200">{r.k}</div>
                  <Badge count={r.count} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="gradient-border p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white">{L.publishing}</h3>
            <span className="ml-auto text-[10px] text-gray-500">{L.published_total}: {publishing.published}</span>
          </div>
          {Object.keys(publishing.byPlatform).length === 0 ? (
            <EmptyHint text={isZh ? '暂无发布记录' : 'No publishing records'} small />
          ) : (
            <ul className="space-y-2">
              {Object.entries(publishing.byPlatform)
                .sort((a, b) => b[1] - a[1])
                .map(([p, c], i) => (
                  <li key={p} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white shadow-md ${
                      i === 0 ? 'bg-gradient-to-br from-rose-500 to-pink-600' :
                      'bg-gradient-to-br from-gray-500 to-gray-700'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 text-sm text-gray-200 capitalize">{p}</div>
                    <Badge count={c} />
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, subValue, subLabel, gradient }) {
  return (
    <div className="relative rounded-2xl bg-black/40 border border-white/10 p-4 overflow-hidden group hover:border-white/20 transition-colors">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`} />
      <div className="relative space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
            {icon}
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</div>
        </div>
        <div className={`text-3xl font-black tabular-nums bg-gradient-to-br ${gradient} bg-clip-text text-transparent leading-none`}>
          {value}
        </div>
        {(subValue !== undefined && subValue !== '') && (
          <div className="flex items-baseline gap-1.5 pt-1">
            <div className="text-xs font-bold text-white/80 tabular-nums">{subValue}</div>
            {subLabel && <div className="text-[10px] text-gray-500">{subLabel}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ count }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[28px] px-2 h-6 rounded-full bg-white/10 text-[11px] font-bold text-white tabular-nums border border-white/10">
      {count}
    </span>
  );
}

function EmptyHint({ text, small }) {
  return (
    <div className={`rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center ${small ? 'py-8' : 'py-14'}`}>
      <BarChart3 className={`${small ? 'w-7 h-7' : 'w-10 h-10'} text-gray-600 opacity-50 mb-2`} />
      <p className={`${small ? 'text-xs' : 'text-sm'} text-gray-500`}>{text}</p>
    </div>
  );
}
