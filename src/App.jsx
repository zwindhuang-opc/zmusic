import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from './i18n/useTranslation.js';
import {
  LayoutDashboard, Music, Mic, Video, Settings, Sparkles, TrendingUp,
  Activity, Cpu, Zap, BarChart3, Server, Bot, Globe, ArrowLeft, Wand2, Sliders, Image, Headphones, Cloud, Music2,
  ChevronDown, ChevronRight
} from 'lucide-react';
import api, { isMobileEnvironment } from './services/api.client.js';
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const MusicPage = lazy(() => import('./pages/MusicPage.jsx'));
const LyricsPage = lazy(() => import('./pages/LyricsPage.jsx'));
const ImageLyricsPage = lazy(() => import('./pages/ImageLyricsPage.jsx'));
const MVPage = lazy(() => import('./pages/MVPage.jsx'));
const MusePage = lazy(() => import('./pages/MusePage.jsx'));
const SunoPage = lazy(() => import('./pages/SunoPage.jsx'));
const MeloPage = lazy(() => import('./pages/MeloPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
import FloatingChatBall from './components/FloatingChatBall.jsx';
import EasyMode from './components/EasyMode.jsx';

const UI_MODE_KEY = 'zmusic-ui-mode';
const BUILD_VERSION = (typeof __APP_VERSION__ !== 'undefined') ? __APP_VERSION__ : '1.0.0';

function App() {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [apiStatus, setApiStatus] = useState({ configured: false, version: BUILD_VERSION, uptime: 0 });
  const [agentStatus, setAgentStatus] = useState(null);
  const [uiMode, setUiMode] = useState(() => localStorage.getItem(UI_MODE_KEY) || 'expert');
  const [musicGroupExpanded, setMusicGroupExpanded] = useState(true);

  useEffect(() => {
    if (!isMobileEnvironment()) {
      loadStatus();
      const interval = setInterval(() => {
        loadStatus();
      }, 60000);
      return () => {
        clearInterval(interval);
      };
    }
  }, []);

  const loadStatus = async () => {
    try {
      const health = await api.health();
      if (health?.success) {
        setApiStatus({
          configured: health.apiConfigured || health.data?.apiConfigured,
          museConfigured: health.museConfigured || health.data?.museConfigured || false,
          version: health.version || health.data?.version || BUILD_VERSION,
          uptime: health.uptime || health.data?.uptime || 0
        });
      }
      const agent = await api.agentStatus();
      if (agent?.success) {
        setAgentStatus(agent.data || agent);
      }
    } catch (error) {
      // Silent fail - status will retry on next interval
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('zmusic-lang', lng);
    window.location.reload();
  };

  const toggleUiMode = () => {
    const newMode = uiMode === 'easy' ? 'expert' : 'easy';
    setUiMode(newMode);
    localStorage.setItem(UI_MODE_KEY, newMode);
    setCurrentPage('lyrics');
  };

  const navigationItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    {
      id: 'music-group',
      label: t('nav.music'),
      icon: Music,
      isGroup: true,
      children: [
        { id: 'music', label: t('nav.music'), icon: Music },
        { id: 'muse', label: t('nav.muse'), icon: Headphones },
        { id: 'suno', label: t('nav.suno'), icon: Cloud },
        { id: 'melo', label: t('nav.melo'), icon: Music2 },
      ],
    },
    { id: 'lyrics', label: t('nav.lyrics'), icon: Mic },
    { id: 'image-lyrics', label: t('nav.image_lyrics'), icon: Image },
    { id: 'mv', label: t('nav.mv'), icon: Video },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  const currentLabel = (() => {
    for (const item of navigationItems) {
      if (item.id === currentPage) return item.label;
      if (item.isGroup) {
        const found = item.children.find(c => c.id === currentPage);
        if (found) return found.label;
      }
    }
    return '';
  })();

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <aside className="desktop-sidebar w-64 glass flex flex-col border-r border-purple-500/10">
        <div className="p-5 border-b border-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold gradient-text">{t('app.title')}</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t('app.subtitle')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            if (item.isGroup) {
              const groupActive = item.children.some(c => currentPage === c.id);
              const expanded = musicGroupExpanded;
              return (
                <div key={item.id}>
                  <button
                    onClick={() => setMusicGroupExpanded(!expanded)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${groupActive
                      ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 text-white border border-violet-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  {expanded && (
                    <div className="mt-1 ml-4 pl-3 border-l border-violet-500/20 space-y-0.5">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isActive = currentPage === child.id;
                        return (
                          <button
                            key={child.id}
                            onClick={() => setCurrentPage(child.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${isActive
                              ? 'bg-gradient-to-r from-violet-500/30 to-pink-500/30 text-white border border-violet-500/40'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                              }`}
                          >
                            <ChildIcon className="w-3.5 h-3.5" />
                            <span className="text-[13px]">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive
                  ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 text-white border border-violet-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-purple-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              {t('header.language')}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => changeLanguage('zh')}
              className={`px-2 py-1 text-xs rounded ${i18n.language === 'zh' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-white/5 text-gray-400'}`}
            >
              CN
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`px-2 py-1 text-xs rounded ${i18n.language === 'en' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-white/5 text-gray-400'}`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-purple-500/10 space-y-3">
          {/* UI Mode Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              {uiMode === 'easy' ? <Sparkles className="w-3 h-3 text-violet-400" /> : <Wand2 className="w-3 h-3 text-pink-400" />}
              {uiMode === 'easy' ? t('header.easy_mode') : t('header.expert_mode')}
            </span>
            <button
              onClick={toggleUiMode}
              title={uiMode === 'easy' ? t('header.switch_to_expert') : t('header.switch_to_easy')}
              className={`w-10 h-5 rounded-full p-0.5 transition-all ${uiMode === 'easy' ? 'bg-gradient-to-r from-violet-500 to-pink-500' : 'bg-white/10'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${uiMode === 'easy' ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <p className="text-[10px] text-gray-600 leading-tight">
            {uiMode === 'easy'
              ? `${t('header.easy_mode')}：${t('header.easy_mode_desc')}`
              : `${t('header.expert_mode')}：${t('header.expert_mode_desc')}`}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{t('header.api')}</span>
            <div className={`flex items-center gap-1.5 ${apiStatus.configured ? 'text-emerald-400' : 'text-amber-400'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${apiStatus.configured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-[10px] font-medium">{apiStatus.configured ? t('header.live') : t('header.offline')}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{t('dashboard.agent_status')}</span>
            <div className="flex items-center gap-1.5 text-violet-400">
              <Bot className="w-3 h-3" />
              <span className="text-[10px] font-medium">{t('header.active')}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{t('dashboard.uptime')}</span>
            <span className="text-[10px] font-mono text-gray-300">{apiStatus.uptime}s</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="safe-area-top h-16 md:h-14 glass border-b border-purple-500/10 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              aria-label={t('header.back')}
            >
              <ArrowLeft className="w-5 h-5 text-gray-300" />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-base md:text-sm font-semibold">
              {currentLabel}
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
              v{apiStatus.version}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-gray-300">{t('dashboard.unicorn_agent')}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Zap className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-xs text-gray-300">{t('header.hermes_openclaw')}</span>
            </div>
          </div>
          <div className="md:hidden flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${apiStatus.configured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-[#0a0a0f] via-[#0f0a1a] to-[#0a0a0f]">
          <Suspense fallback={
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            {currentPage === 'dashboard' && <Dashboard apiStatus={apiStatus} agentStatus={agentStatus} onNavigate={setCurrentPage} />}
            {currentPage === 'music' && (uiMode === 'easy'
              ? <EasyMode onSwitchToExpert={toggleUiMode} />
              : <MusicPage />)}
            {currentPage === 'lyrics' && (
              <LyricsPage key={uiMode} onNavigate={setCurrentPage} defaultMode={uiMode === 'easy' ? 'guided' : 'expert'} />
            )}
            {currentPage === 'image-lyrics' && <ImageLyricsPage onNavigate={setCurrentPage} />}
            {currentPage === 'mv' && <MVPage />}
            {currentPage === 'muse' && <MusePage />}
            {currentPage === 'suno' && <SunoPage />}
            {currentPage === 'melo' && <MeloPage />}
            {currentPage === 'settings' && <SettingsPage />}
          </Suspense>
        </div>

        <nav className="mobile-bottom-nav safe-area-bottom glass border-t border-purple-500/10 z-50 relative">
          {/* Secondary row: group children when a music group page is active */}
          {(() => {
            const musicGroup = navigationItems.find(i => i.isGroup);
            const isMusicPage = musicGroup?.children.some(c => c.id === currentPage);
            if (!isMusicPage) return null;
            return (
              <div className="flex items-center justify-center gap-1 px-2 py-2 border-b border-purple-500/10">
                {musicGroup.children.map(child => {
                  const Icon = child.icon;
                  const isActive = currentPage === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => setCurrentPage(child.id)}
                      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${isActive ? 'text-violet-400 bg-violet-500/10' : 'text-gray-500'}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-[9px] font-medium">{child.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Primary bottom nav */}
          <div className="flex items-center justify-around px-2 py-2">
            {navigationItems.map((item) => {
              if (item.isGroup) {
                const Icon = item.icon;
                const childrenActive = item.children.some(c => c.id === currentPage);
                const primaryChild = item.children[0];
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(childrenActive ? currentPage : primaryChild.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${childrenActive ? 'text-violet-400' : 'text-gray-500'}`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                );
              }
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${isActive ? 'text-violet-400' : 'text-gray-500'}`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </main>

      <FloatingChatBall />
    </div>
  );
}

export default App;