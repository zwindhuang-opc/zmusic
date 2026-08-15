import React, { useState, useEffect } from 'react';
import {
  Music, Mic, Video, Activity, TrendingUp, Cpu, Bot, Sparkles,
  BarChart3, Server, Zap, ChevronRight, AlertTriangle, X,
  CheckCircle, ShieldCheck, RotateCcw, Headphones, Globe2,
  Lightbulb, Clock, BookOpen, ChevronDown, ChevronUp,
  Library, Target, ListChecks, FolderHeart, LogIn
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { GLOBAL_AUTO_CONFIRM, openAllPlatformWebsites } from '../utils/autoGenUtils.js';

function Dashboard({ apiStatus, agentStatus, onNavigate }) {
  const { t, i18n } = useTranslation();
  const { stats, history } = useGeneration();

  // === GLOBAL AUTO state ===
  const [showGlobalAuto, setShowGlobalAuto] = useState(false);
  const [globalAutoStep, setGlobalAutoStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['muse', 'suno', 'melo']);
  const [liveCredits, setLiveCredits] = useState({ suno: 0, muse: 0, melo: 0 });
  const [loadingCredits, setLoadingCredits] = useState(false);
  // Creation notebook: expanded item state
  const [openNotebookIds, setOpenNotebookIds] = useState({});
  const toggleNotebookItem = (id) => setOpenNotebookIds(prev => ({ ...prev, [id]: !prev[id] }));

  const statsCards = [
    { title: t('dashboard.songs_generated'), value: stats.songsGenerated, icon: Music, color: 'from-violet-500 to-purple-500', page: 'music' },
    { title: t('dashboard.lyrics_created'), value: stats.lyricsGenerated, icon: Mic, color: 'from-pink-500 to-rose-500', page: 'lyrics' },
    { title: t('dashboard.mv_productions'), value: stats.mvGenerated, icon: Video, color: 'from-blue-500 to-cyan-500', page: 'mv' },
    { title: t('dashboard.active_users'), value: stats.activeUsers, icon: Activity, color: 'from-emerald-500 to-teal-500', page: null },
    // 5th card: 创作构思记录簿（包含成功 + 失败的全部构思过程）
    { title: '创作构思记录簿', value: stats.creationAttempts + stats.songsGenerated, icon: Lightbulb, color: 'from-amber-500 via-orange-500 to-rose-500', page: null, extraHint: '成功+失败的全部创作思考' },
  ];

  const workbenchCards = [
    { title: t('nav.library'), subtitle: 'Songs · Albums · Favorites', icon: FolderHeart, color: 'from-fuchsia-500 via-purple-500 to-indigo-500', page: 'library' },
    { title: t('nav.quality'), subtitle: 'Score · Metrics · Regen Gate', icon: Target, color: 'from-rose-500 via-red-500 to-orange-500', page: 'quality' },
    { title: t('nav.batch'), subtitle: 'CSV upload · Queue ETA · ZIP', icon: ListChecks, color: 'from-cyan-500 via-sky-500 to-blue-500', page: 'batch' },
    { title: t('nav.analytics'), subtitle: 'Engines · Habits · Credit', icon: BarChart3, color: 'from-emerald-500 via-teal-500 to-cyan-500', page: 'analytics' },
  ];

  const agentMethods = [
    { name: t('dashboard.fsm_programming'), desc: t('dashboard.state_machine_transitions'), color: 'text-violet-400', count: 8, countLabel: t('dashboard.states') },
    { name: t('dashboard.network_layers_text'), desc: t('dashboard.layered_composition'), color: 'text-pink-400', count: 4, countLabel: t('dashboard.layers') },
    { name: t('dashboard.muse_style'), desc: t('dashboard.natural_language_commands'), color: 'text-blue-400', count: t('dashboard.infinite'), countLabel: '' },
    { name: t('dashboard.suno_style'), desc: t('dashboard.structured_parameters'), color: 'text-emerald-400', count: t('dashboard.infinite'), countLabel: '' },
    { name: t('dashboard.melo_style'), desc: t('dashboard.multi_layer_composition'), color: 'text-amber-400', count: t('dashboard.infinite'), countLabel: '' },
  ];

  const architectureLayers = [
    { name: t('dashboard.config'), layer: 1 },
    { name: t('dashboard.utils'), layer: 2 },
    { name: t('dashboard.services'), layer: 3 },
    { name: t('dashboard.agents'), layer: 4 },
    { name: t('dashboard.controllers'), layer: 5 },
  ];

  const architectureLayers2 = [
    { name: t('dashboard.routes'), layer: 6 },
    { name: t('dashboard.http_server'), layer: 7 },
  ];

  // Fetch live credits from all 3 APIs when the GLOBAL AUTO modal opens
  useEffect(() => {
    if (!showGlobalAuto) return;
    setLoadingCredits(true);
    const controller = new AbortController();

    async function loadAll() {
      try {
        const [sunoR, museR, meloR] = await Promise.allSettled([
          fetch('/api/suno/user', { signal: controller.signal }).then(r => r.ok ? r.json() : null),
          fetch('/api/muse/status', { signal: controller.signal }).then(r => r.ok ? r.json() : null),
          fetch('/api/melo/user', { signal: controller.signal }).then(r => r.ok ? r.json() : null),
        ]);

        const extractChain = (obj, fallback = 0) => {
          if (!obj) return fallback;
          const d = obj.data || obj;
          return d?.credits ?? d?.credit ?? d?.points ?? d?.point ??
            d?.balance ?? d?.remaining ?? d?.memberCredit ??
            d?.member_credit ?? d?.quota ??
            d?.data?.credits ?? d?.data?.credit ?? d?.data?.points ??
            d?.login?.credits ??
            d?.userInfo?.credits ?? d?.userInfo?.credit ??
            d?.user?.points ?? d?.user?.credit ?? fallback;
        };

        setLiveCredits({
          suno: sunoR.status === 'fulfilled' ? extractChain(sunoR.value) : null,
          muse: museR.status === 'fulfilled' ? extractChain(museR.value) : null,
          melo: meloR.status === 'fulfilled' ? extractChain(meloR.value) : null,
        });
      } finally {
        setLoadingCredits(false);
      }
    }
    loadAll();
    return () => controller.abort();
  }, [showGlobalAuto]);

  const togglePlatform = (p) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const cancelGlobalAuto = () => {
    setShowGlobalAuto(false);
    setGlobalAutoStep(1);
  };

  const proceedGlobalAutoStep = () => {
    if (globalAutoStep < 3) {
      setGlobalAutoStep(prev => prev + 1);
      return;
    }
    // === Final confirm (step 3): launch GLOBAL AUTO ===
    const platforms = selectedPlatforms.length > 0 ? selectedPlatforms : ['muse', 'suno', 'melo'];
    const payload = {
      at: Date.now(),
      platforms,
      totalCount: platforms.length,
      currentIndex: 0,
    };
    // eslint-disable-next-line no-console
    console.log('%c[GLOBAL AUTO] [Dashboard] 触发 GLOBAL AUTO 启动',
      'background:#ff4757;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold;');
    console.log('[GLOBAL AUTO] [Dashboard] 平台顺序:', platforms, ' 总数:', platforms.length, '  payload:', payload);

    // Step 0: 打开所有选中平台的官网标签（sessionStorage 自动去重），用户无需登录，仅作后台展示
    try {
      const tabRes = openAllPlatformWebsites(platforms);
      console.log('[GLOBAL AUTO] [Dashboard] 平台官网标签打开: opened=', tabRes.opened, '  skipped(已打开)=', tabRes.skipped);
    } catch (tErr) {
      console.warn('[GLOBAL AUTO] [Dashboard] 自动打开官网标签失败（不影响主流程）：', tErr.message);
    }

    // Step 1: 写入 localStorage 握手数据（跨页面/跨标签共享）
    try {
      localStorage.setItem('zmusic_globalauto', JSON.stringify(payload));
      console.log('[GLOBAL AUTO] [Dashboard] localStorage 写入成功: zmusic_globalauto =', JSON.stringify(payload).substring(0, 120) + '...');
    } catch (e) {
      console.error('[GLOBAL AUTO] [Dashboard] localStorage 写入失败:', e);
    }

    // Step 2: 关闭弹窗 + 重置 step
    cancelGlobalAuto();

    // Step 3: 导航到第一个平台 — 该平台的 useEffect 会读取 localStorage 握手
    // 数据并自动启动 AUTO（含 60s 构思倒计时），完成后再链式导航到下一个平台
    const first = platforms[0];
    console.log('[GLOBAL AUTO] [Dashboard] 即将导航到第一个平台:', first, '   onNavigate 存在:', Boolean(onNavigate));
    if (first && onNavigate) {
      onNavigate(first);
      console.log('[GLOBAL AUTO] [Dashboard] onNavigate(' + first + ') 已触发');
    } else {
      console.warn('[GLOBAL AUTO] [Dashboard] 无法导航：first=' + first + ', onNavigate=' + onNavigate);
    }
  };

  // 点击 GLOBAL AUTO 按钮 → 打开 3 步危险确认弹窗（不直接启动）
  const handleLaunchGlobalAuto = () => {
    // eslint-disable-next-line no-console
    console.log('%c[GLOBAL AUTO] [Dashboard] 打开 3 步确认弹窗',
      'background:#ff4757;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold;');
    setGlobalAutoStep(1);
    setShowGlobalAuto(true);
  };

  const platformInfo = {
    suno: { name: 'Suno AI', color: 'from-emerald-500 to-teal-500', flag: '🎵' },
    muse: { name: 'Muse AI', color: 'from-blue-500 to-cyan-500', flag: '🎨' },
    melo: { name: 'Melo AI', color: 'from-amber-500 to-orange-500', flag: '🎧' },
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in">
      {/* 4 cards on md, 2 on mobile — the 5th card (创作构思记录簿) is shown as a dedicated section below */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statsCards.slice(0, 4).map((stat, i) => {
          const Icon = stat.icon;
          const isClickable = stat.page && onNavigate;
          return (
            <div
              key={i}
              className={`gradient-border p-4 md:p-5 ${isClickable ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
              onClick={() => isClickable && onNavigate(stat.page)}
            >
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <div className={`w-10 h-10 md:w-9 md:h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 md:w-4 md:h-4 text-white" />
                </div>
                {isClickable ? (
                  <ChevronRight className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400" />
                ) : (
                  <TrendingUp className="w-4 h-4 md:w-3.5 md:h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="text-2xl md:text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.title}</div>
            </div>
          );
        })}
      </div>

      {/* Workbench: Library / Quality / Batch / Analytics quick access cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {workbenchCards.map((card, i) => {
          const Icon = card.icon;
          const isClickable = card.page && onNavigate;
          return (
            <div
              key={i}
              className={`gradient-border p-4 md:p-5 ${isClickable ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
              onClick={() => isClickable && onNavigate(card.page)}
            >
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <div className={`w-10 h-10 md:w-9 md:h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg shadow-white/5`}>
                  <Icon className="w-5 h-5 md:w-4 md:h-4 text-white" />
                </div>
                {isClickable && <ChevronRight className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400" />}
              </div>
              <div className="text-sm md:text-base font-bold text-white mb-0.5">{card.title}</div>
              <div className="text-[10px] md:text-xs text-gray-500 leading-relaxed">{card.subtitle}</div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
        <div className="md:col-span-2 gradient-border p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div>
              <h3 className="text-sm md:text-base font-semibold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-400" />
                {t('dashboard.ai_agent_methods')}
              </h3>
              <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">{t('dashboard.available_generation_techniques')}</p>
            </div>
            <span className="text-[10px] px-2 py-1 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {t('dashboard.unicorn_agent_v')}
            </span>
          </div>
          <div className="space-y-2.5 md:space-y-3">
            {agentMethods.map((method, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div>
                  <div className={`text-sm font-medium ${method.color}`}>{method.name}</div>
                  <div className="text-[10px] md:text-xs text-gray-500">{method.desc}</div>
                </div>
                <div className="text-xs font-mono text-gray-400">{method.count} {method.countLabel}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="gradient-border p-4 md:p-6">
          <h3 className="text-sm md:text-base font-semibold text-white flex items-center gap-2 mb-4 md:mb-5">
            <Server className="w-4 h-4 text-pink-400" />
            {t('dashboard.system_status')}
          </h3>
          <div className="space-y-3 md:space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">{t('dashboard.suno_ai')}</span>
                <span className={apiStatus.configured ? 'text-emerald-400' : 'text-amber-400'}>
                  {apiStatus.configured ? t('header.connected') : t('dashboard.demo_mode')}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${apiStatus.configured ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: apiStatus.configured ? '100%' : '30%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">{t('dashboard.muse_ai')}</span>
                <span className={apiStatus.museConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                  {apiStatus.museConfigured ? t('header.connected') : t('dashboard.not_configured')}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${apiStatus.museConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: apiStatus.museConfigured ? '100%' : '30%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">{t('dashboard.melo_ai')}</span>
                <span className={apiStatus.meloConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                  {apiStatus.meloConfigured ? t('header.connected') : t('dashboard.not_configured')}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${apiStatus.meloConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: apiStatus.meloConfigured ? '100%' : '30%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">{t('dashboard.unicorn_agent')}</span>
                <span className="text-violet-400">{t('header.active')}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500" style={{ width: '95%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">{t('dashboard.mvc_architecture')}</span>
                <span className="text-emerald-400">{t('dashboard.operational')}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
              </div>
            </div>

            {/* === GLOBAL AUTO Launch Button === */}
            <div className="pt-1">
              <button
                onClick={handleLaunchGlobalAuto}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-500 hover:via-rose-500 hover:to-orange-500 transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Globe2 className="w-5 h-5" />
                {t('auto.global_btn')}
              </button>
              <p className="text-[10px] text-center text-amber-400/80 mt-2 flex items-start justify-center gap-1 px-1 leading-relaxed">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{t('auto.global_desc')}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="gradient-border p-4 md:p-6">
        <h3 className="text-sm md:text-base font-semibold text-white flex items-center gap-2 mb-3 md:mb-4">
          <Sparkles className="w-4 h-4 text-pink-400" />
          {t('dashboard.architecture_layers')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-3">
          {architectureLayers.map((layer, i) => (
            <div key={i} className="p-3 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 text-center">
              <Cpu className="w-5 h-5 md:w-4 md:h-4 text-violet-400 mx-auto mb-1.5" />
              <div className="text-xs font-medium text-white">{layer.name}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{t('dashboard.layer')} {layer.layer}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5 md:gap-3 mt-3">
          {architectureLayers2.map((layer, i) => (
            <div key={i} className="p-3 rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 text-center">
              <Zap className="w-5 h-5 md:w-4 md:h-4 text-pink-400 mx-auto mb-1.5" />
              <div className="text-xs font-medium text-white">{layer.name}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{t('dashboard.layer')} {layer.layer}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* === 创作构思记录簿 Creation Notebook — 专门记录"每一次思考过程"  */}
      {/* 无论是否成功生成歌曲，所有 AUTO 构思、灵感、失败构思都会保存在此  */}
      {/* ============================================================== */}
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                创作构思记录簿
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                  💡 记录每一次创意，无论成败
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                AUTO 模式 60 秒构思全过程 → 即便积分不足未生成歌曲，所有构思细节、创作参数、命令均完整保存于此
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>共 <span className="font-bold text-amber-300 font-mono">{stats.creationAttempts + stats.songsGenerated}</span> 份构思记录</span>
            <span className="text-gray-600">·</span>
            <span className="text-emerald-400 font-medium">✅ 成功 {stats.songsGenerated}</span>
            <span className="text-gray-600">·</span>
            <span className="text-rose-400 font-medium">❌ 构思未生成 {stats.creationAttempts}</span>
          </div>
        </div>

        {/* List: only items that contain creativeProcess or are creation_attempt */}
        {(() => {
          const notebookItems = history
            .filter(h => h.creativeProcess || h.type === 'creation_attempt')
            .slice(0, 50);
          if (notebookItems.length === 0) {
            return (
              <div className="rounded-xl bg-white/5 border border-dashed border-white/10 p-8 md:p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 flex items-center justify-center border border-amber-500/20">
                  <Lightbulb className="w-8 h-8 text-amber-400/70" />
                </div>
                <div className="text-sm font-medium text-white mb-1">还没有创作构思记录</div>
                <div className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  点击 <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 mx-1 font-mono">🚀 GLOBAL AUTO</span>
                  或任一平台页面的 <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 mx-1 font-mono">AUTO</span> 按钮，
                  系统会进入 60 秒构思倒计时 —— 整个灵感思考过程（主题、风格、标题、歌词草稿、生成命令）都会完整记录在此，即使 API 因积分不足失败也不会丢失。
                </div>
              </div>
            );
          }
          return (
            <div className="space-y-2.5 md:space-y-3 max-h-[80vh] overflow-y-auto pr-1">
              {notebookItems.map(item => {
                const isOpen = !!openNotebookIds[item.id];
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
                    {/* Header */}
                    <button
                      onClick={() => toggleNotebookItem(item.id)}
                      className="w-full text-left p-3 md:p-3.5 flex items-start justify-between gap-3 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`w-9 h-9 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${failed
                          ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow shadow-rose-900/50'
                          : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow shadow-emerald-900/50'
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
                              {failed ? '构思失败·未产出音频' : '生成成功'}
                            </span>
                            {snap.theme && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                                🎯 主题：{snap.theme}
                              </span>
                            )}
                            {snap.bpm && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
                                {snap.bpm} BPM · {snap.key || '?'}调
                              </span>
                            )}
                            {item.duration > 0 && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                                {Math.round(item.duration)} 秒音频
                              </span>
                            )}
                          </div>
                          <div className="text-sm md:text-sm font-bold text-white mt-1.5 truncate">
                            {item.title?.replace('❌ 构思失败 · ', '') || item.title || '未命名构思'}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <Clock className="w-3 h-3 inline" />
                            <span>{new Date(item.createdAt || Date.now()).toLocaleString()}</span>
                            {item.style && (
                              <>
                                <span className="text-gray-700">·</span>
                                <span>风格：{item.style}</span>
                              </>
                            )}
                            {thoughts.length > 0 && (
                              <>
                                <span className="text-gray-700">·</span>
                                <span className="text-amber-400/80">💭 {thoughts.length} 个思考步骤</span>
                              </>
                            )}
                            {failed && item.error && (
                              <>
                                <span className="text-gray-700">·</span>
                                <span className="text-rose-400/90 truncate max-w-[220px]">原因：{item.error}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 pt-1">
                        {isOpen
                          ? <ChevronUp className="w-4 h-4 text-gray-400" />
                          : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="px-3 md:px-3.5 pb-3.5 space-y-3 border-t border-white/5 pt-3">
                        {/* 创作构思时间线 */}
                        {thoughts.length > 0 && (
                          <div>
                            <div className="text-[11px] font-bold text-amber-300/90 mb-2 flex items-center gap-1.5">
                              <Lightbulb className="w-3 h-3" />
                              AUTO 60 秒构思时间线（共 {thoughts.length} 条思考）
                            </div>
                            <div className="space-y-2 rounded-lg bg-black/30 p-2.5 max-h-[38vh] overflow-y-auto border border-white/5">
                              {thoughts.map((th, idx) => (
                                <div key={idx} className="text-[11px] md:text-xs flex gap-2">
                                  <div className="flex-shrink-0 w-16 md:w-20 text-right text-gray-500 font-mono">
                                    {th.time || ''}
                                    <div className="text-[10px] text-violet-400/80">{th.phase || ''}</div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-white font-semibold text-xs">{th.title || th.step || `Step ${idx + 1}`}</div>
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
                        {/* 参数快照 */}
                        {Object.keys(snap).length > 0 && (
                          <div>
                            <div className="text-[11px] font-bold text-violet-300/90 mb-2 flex items-center gap-1.5">
                              <Cpu className="w-3 h-3" />
                              最终参数快照（提交给 API 的创意配置）
                            </div>
                            <pre className="text-[10.5px] md:text-[11px] text-gray-300 whitespace-pre-wrap rounded-lg bg-black/30 p-2.5 border border-white/5 font-mono max-h-[30vh] overflow-y-auto">
                              {JSON.stringify(snap, null, 2)}
                            </pre>
                          </div>
                        )}
                        {/* 歌词/命令 */}
                        {(item.lyrics || item.prompt) && (
                          <div>
                            <div className="text-[11px] font-bold text-emerald-300/90 mb-2 flex items-center gap-1.5">
                              <Mic className="w-3 h-3" />
                              歌词 / 生成命令（完整文本）
                            </div>
                            <pre className="text-[11px] md:text-xs text-gray-200 whitespace-pre-wrap rounded-lg bg-emerald-500/5 p-3 border border-emerald-500/15 leading-relaxed font-sans">
                              {item.lyrics || item.prompt}
                            </pre>
                          </div>
                        )}
                        {/* 成功：音频播放器链接 */}
                        {!failed && item.audioUrl && (
                          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                            <div className="text-xs font-bold text-emerald-300 mb-1.5 flex items-center gap-1.5">
                              <Headphones className="w-3.5 h-3.5" />
                              音频 / 封面
                            </div>
                            <audio controls className="w-full h-8" src={item.audioUrl} />
                            {item.imageUrl && (
                              <a href={item.imageUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[11px] text-blue-300 hover:text-blue-200 underline mt-2 inline-block">
                                🖼 查看封面图
                              </a>
                            )}
                          </div>
                        )}
                        {/* 失败：错误详情 */}
                        {failed && item.error && (
                          <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 p-3">
                            <div className="text-xs font-bold text-rose-300 mb-1">⚠️ 生成失败 / 未产出音频的原因</div>
                            <div className="text-[11px] text-rose-200/90 font-mono break-all leading-relaxed">
                              {item.error}
                            </div>
                            <div className="text-[10px] text-rose-300/60 mt-1.5">
                              💡 小提示：构思过程已完整保存，可直接到对应平台页面手动重试。
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* === GLOBAL AUTO Danger Confirmation Modal (3-step + Platform Selector) === */}
      {showGlobalAuto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={cancelGlobalAuto}>
          <div
            className="w-full max-w-lg max-h-[90vh] flex flex-col bg-[#0f0f1a] border-2 border-red-500/50 rounded-2xl shadow-2xl shadow-red-900/60 overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-700 via-rose-600 to-orange-600 p-5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                <Globe2 className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-extrabold text-white tracking-tight">
                  {globalAutoStep === 1 && GLOBAL_AUTO_CONFIRM.title1}
                  {globalAutoStep === 2 && GLOBAL_AUTO_CONFIRM.title2}
                  {globalAutoStep === 3 && GLOBAL_AUTO_CONFIRM.title3}
                </h2>
                <p className="text-[11px] text-white/80">
                  {t('auto.step').replace('{curr}', String(globalAutoStep))} · 三平台同步 AUTO 生成超级模式
                </p>
              </div>
              <button
                onClick={cancelGlobalAuto}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="px-5 py-2.5 bg-white/5 flex items-center gap-2">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex-1 flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${globalAutoStep >= step
                      ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/40'
                      : 'bg-white/10 text-gray-500'}`}>
                    {globalAutoStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`flex-1 h-1 rounded-full transition-colors
                      ${globalAutoStep > step ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 flex-1 min-h-0 overflow-y-auto">
              {/* Always show live credit summary */}
              <div className="grid grid-cols-3 gap-2">
                {['suno', 'muse', 'melo'].map(p => {
                  const info = platformInfo[p];
                  return (
                    <div key={p} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                      <div className={`w-8 h-8 mx-auto rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center mb-1`}>
                        <span className="text-sm">{info.flag}</span>
                      </div>
                      <div className="text-[11px] text-gray-400">{info.name}</div>
                      <div className="text-sm font-bold text-white font-mono mt-0.5">
                        {loadingCredits ? '—' : (liveCredits[p] == null ? 'N/A' : liveCredits[p])}
                      </div>
                    </div>
                  );
                })}
              </div>

              {globalAutoStep === 1 && (
                <>
                  {/* Platform Selector */}
                  <div>
                    <p className="text-xs font-bold text-gray-200 mb-2 flex items-center gap-1.5">
                      <span>⚙️</span> {GLOBAL_AUTO_CONFIRM.platformSelectorTitle}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {['suno', 'muse', 'melo'].map(p => {
                        const info = platformInfo[p];
                        const checked = selectedPlatforms.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => togglePlatform(p)}
                            className={`p-3 rounded-xl border-2 text-left transition-all
                              ${checked
                                ? `bg-gradient-to-br ${info.color} border-white/40 shadow-lg`
                                : 'bg-white/5 border-white/10 opacity-60 hover:opacity-90 hover:bg-white/10'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-lg ${checked ? 'text-white' : ''}`}>{info.flag}</span>
                              {checked ? (
                                <CheckCircle className="w-4 h-4 text-white" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-500" />
                              )}
                            </div>
                            <div className={`text-xs font-bold ${checked ? 'text-white' : 'text-gray-300'}`}>
                              {info.name}
                            </div>
                            <div className={`text-[10px] mt-0.5 ${checked ? 'text-white/80' : 'text-gray-500'}`}>
                              积分: {loadingCredits ? '...' : (liveCredits[p] == null ? '未知' : liveCredits[p])}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300 font-sans bg-white/5 p-3 rounded-xl">
                    {GLOBAL_AUTO_CONFIRM.desc1(liveCredits)}
                  </pre>
                </>
              )}

              {globalAutoStep === 2 && (
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300 font-sans bg-white/5 p-3 rounded-xl">
                  {GLOBAL_AUTO_CONFIRM.desc2}
                </pre>
              )}

              {globalAutoStep === 3 && (
                <>
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-300 font-sans bg-white/5 p-3 rounded-xl">
                    {GLOBAL_AUTO_CONFIRM.desc3(liveCredits, selectedPlatforms.map(p => platformInfo[p].name))}
                  </pre>
                  <div className="p-3.5 rounded-xl border border-red-500/40 bg-gradient-to-br from-red-500/15 via-rose-500/10 to-orange-500/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-red-300" />
                      <p className="text-xs font-bold text-red-200">最终免责 & 超危险操作确认</p>
                    </div>
                    <p className="text-[11px] text-red-300/90 leading-relaxed">
                      我已知晓此操作将同时在 <strong>{selectedPlatforms.map(p => platformInfo[p].name).join('、')}</strong> 平台启动 AUTO 自动生成，
                      <strong>可能在 1~2 小时内耗尽所有账户的全部积分</strong>。
                      我自愿承担由此造成的一切后果，包括但不限于积分损失、订阅扣费、账号限流等。
                      zMusic 及相关开发者对此不承担任何责任。
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="p-2 rounded-lg bg-black/20">
                        <div className="text-[10px] text-red-300/70">操作方式</div>
                        <div className="text-xs text-white font-medium">新标签页并行启动</div>
                      </div>
                      <div className="p-2 rounded-lg bg-black/20">
                        <div className="text-[10px] text-red-300/70">总计积分风险</div>
                        <div className="text-xs text-white font-bold font-mono">
                          {(liveCredits.suno ?? 0) + (liveCredits.muse ?? 0) + (liveCredits.melo ?? 0)} 分
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-white/5 border-t border-white/5 flex items-center gap-3">
              <button
                onClick={cancelGlobalAuto}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                {t('auto.cancel_btn')}
              </button>
              <button
                onClick={proceedGlobalAutoStep}
                disabled={globalAutoStep === 1 && selectedPlatforms.length === 0}
                className={`flex-[1.4] px-4 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                  ${globalAutoStep === 3
                    ? 'bg-gradient-to-r from-red-700 via-rose-600 to-orange-600 hover:from-red-600 hover:via-rose-500 hover:to-orange-500 shadow-red-500/50 hover:shadow-red-500/70 hover:scale-[1.02] active:scale-[0.99] animate-pulse'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 shadow-orange-500/30'
                  }`}
              >
                {globalAutoStep < 3 ? '下一步，我已了解全部风险 →' : '🚀 启动 GLOBAL AUTO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
