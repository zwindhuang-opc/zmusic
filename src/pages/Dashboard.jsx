import React, { useState, useEffect } from 'react';
import {
  Music, Mic, Video, Activity, TrendingUp, Cpu, Bot, Sparkles,
  BarChart3, Server, Zap, ChevronRight, AlertTriangle, X,
  CheckCircle, ShieldCheck, RotateCcw, Headphones, Globe2
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { GLOBAL_AUTO_CONFIRM } from '../utils/autoGenUtils.js';

function Dashboard({ apiStatus, agentStatus, onNavigate }) {
  const { t, i18n } = useTranslation();
  const { stats } = useGeneration();

  // === GLOBAL AUTO state ===
  const [showGlobalAuto, setShowGlobalAuto] = useState(false);
  const [globalAutoStep, setGlobalAutoStep] = useState(1);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['suno', 'muse', 'melo']);
  const [liveCredits, setLiveCredits] = useState({ suno: 0, muse: 0, melo: 0 });
  const [loadingCredits, setLoadingCredits] = useState(false);

  const statsCards = [
    { title: t('dashboard.songs_generated'), value: stats.songsGenerated, icon: Music, color: 'from-violet-500 to-purple-500', page: 'music' },
    { title: t('dashboard.lyrics_created'), value: stats.lyricsGenerated, icon: Mic, color: 'from-pink-500 to-rose-500', page: 'lyrics' },
    { title: t('dashboard.mv_productions'), value: stats.mvGenerated, icon: Video, color: 'from-blue-500 to-cyan-500', page: 'mv' },
    { title: t('dashboard.active_users'), value: stats.activeUsers, icon: Activity, color: 'from-emerald-500 to-teal-500', page: null },
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
    } else {
      // Final confirm: store GLOBAL AUTO state in localStorage (persists across tabs)
      // and navigate to each platform sequentially. Each page reads localStorage
      // + ?globalauto=1 to auto-open its own 3-step AUTO confirmation.
      cancelGlobalAuto();
      const routes = { suno: '/suno', muse: '/muse', melo: '/melo' };

      // Store handshake in localStorage (works across tabs/sessions in all browsers)
      try {
        localStorage.setItem('zmusic_globalauto', JSON.stringify({
          at: Date.now(),
          platforms: selectedPlatforms,
          totalCount: selectedPlatforms.length,
          currentIndex: 0,
        }));
      } catch (_e) { /* ignore */ }

      // Navigate to first platform with ?globalauto=1
      // Each platform page will auto-open its AUTO modal, and when confirmed,
      // it will proceed to the next platform via the same localStorage chain
      const first = selectedPlatforms[0];
      if (first && onNavigate) {
        onNavigate(first);
      }
    }
  };

  const handleLaunchGlobalAuto = () => {
    // Require at least one platform selected
    if (selectedPlatforms.length === 0) {
      setSelectedPlatforms(['suno', 'muse', 'melo']);
    }
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statsCards.map((stat, i) => {
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

      {/* === GLOBAL AUTO Danger Confirmation Modal (3-step + Platform Selector) === */}
      {showGlobalAuto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={cancelGlobalAuto}>
          <div
            className="w-full max-w-lg bg-[#0f0f1a] border-2 border-red-500/50 rounded-2xl shadow-2xl shadow-red-900/60 overflow-hidden animate-scale-in"
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
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
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
