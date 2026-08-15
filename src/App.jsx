import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from './i18n/useTranslation.js';
import {
  LayoutDashboard, Music, Mic, Video, Settings, Sparkles, TrendingUp,
  Activity, Cpu, Zap, BarChart3, Server, Bot, Globe, ArrowLeft, Wand2, Sliders, Image, Headphones, Cloud, Music2,
  ChevronDown, ChevronRight, BookOpen, Shuffle, Upload,
  Library, ListChecks, Target, LogIn, LogOut, User, FolderHeart
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
const CreativeNotebook = lazy(() => import('./pages/CreativeNotebook.jsx'));
const RemixStudio = lazy(() => import('./pages/RemixStudio.jsx'));
const PublishStudio = lazy(() => import('./pages/PublishStudio.jsx'));
import { MuseIcon, SunoIcon, MeloIcon } from './components/BrandIcons.jsx';
import FloatingChatBall from './components/FloatingChatBall.jsx';
import EasyMode from './components/EasyMode.jsx';
import { AutoProgressProvider } from './contexts/AutoProgressContext.jsx';
import { GenerationProvider } from './stores/generationStore.jsx';
import AutoProgressBar from './components/AutoProgressBar.jsx';

const UI_MODE_KEY = 'zmusic-ui-mode';
const BUILD_VERSION = (typeof __APP_VERSION__ !== 'undefined') ? __APP_VERSION__ : '7.3.0';

function App() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [apiStatus, setApiStatus] = useState({ configured: false, version: BUILD_VERSION, uptime: 0 });
  const [agentStatus, setAgentStatus] = useState(null);
  const [uiMode, setUiMode] = useState(() => localStorage.getItem(UI_MODE_KEY) || 'expert');

  useEffect(() => {
    // Always load status on app start (desktop and mobile)
    loadStatus();
    const interval = setInterval(() => {
      loadStatus();
    }, 60000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadStatus = async () => {
    try {
      const health = await api.health();
      if (health?.success) {
        setApiStatus({
          configured: health.apiConfigured || health.data?.apiConfigured,
          museConfigured: health.museConfigured || health.data?.museConfigured || false,
          meloConfigured: health.meloConfigured || health.data?.meloConfigured || false,
          version: health.version || health.data?.version || BUILD_VERSION,
          uptime: health.uptime || health.data?.uptime || 0,
          browserConnected: health.browser?.connected || health.data?.browser?.connected || false,
          browserPort: health.browser?.port || health.data?.browser?.port || 9222,
          browserServices: health.browser?.services || health.data?.browser?.services || null,
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

  const [musicGroupExpanded, setMusicGroupExpanded] = useState(true);
  const [mvGroupExpanded, setMvGroupExpanded] = useState(true);
  const [studioGroupExpanded, setStudioGroupExpanded] = useState(true);
  const [workbenchGroupExpanded, setWorkbenchGroupExpanded] = useState(true);

  const handleLogoutClick = () => {
    if (logout) logout();
    setCurrentPage('dashboard');
  };

  const navigationItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    {
      id: 'music-group',
      label: t('nav.music'),
      icon: Music,
      isGroup: true,
      children: [
        { id: 'music', label: t('nav.music_create'), icon: Music },
        { id: 'muse', label: t('nav.muse'), icon: MuseIcon, engine: 'muse' },
        { id: 'suno', label: t('nav.suno'), icon: SunoIcon, engine: 'suno' },
        { id: 'melo', label: t('nav.melo'), icon: MeloIcon, engine: 'melo' },
      ],
    },
    {
      id: 'mv-group',
      label: t('nav.mv'),
      icon: Video,
      isGroup: true,
      children: [
        { id: 'mv-muse', label: 'Muse MV', icon: MuseIcon, engine: 'muse' },
        { id: 'mv-suno', label: 'Suno MV', icon: SunoIcon, engine: 'suno' },
        { id: 'mv-melo', label: 'Melo MV', icon: MeloIcon, engine: 'melo' },
      ],
    },
    { id: 'lyrics', label: t('nav.lyrics'), icon: Mic },
    { id: 'notebook', label: t('nav.notebook'), icon: BookOpen },
    { id: 'image-lyrics', label: t('nav.image_lyrics'), icon: Image },
    {
      id: 'studio-group',
      label: t('nav.studio'),
      icon: Sparkles,
      isGroup: true,
      children: [
        { id: 'remix', label: t('nav.remix_studio'), icon: Shuffle },
        { id: 'publish', label: t('nav.publish_studio'), icon: Upload },
      ],
    },
    {
      id: 'workbench-group',
      label: t('nav.workbench'),
      icon: Library,
      isGroup: true,
      children: [
        { id: 'library', label: t('nav.library'), icon: FolderHeart },
        { id: 'quality', label: t('nav.quality'), icon: Target },
        { id: 'batch', label: t('nav.batch'), icon: ListChecks },
        { id: 'analytics', label: t('nav.analytics'), icon: BarChart3 },
      ],
    },
    user
      ? { id: 'auth-logout', label: `${t('nav.logout')} · ${user.username || user.email || t('nav.profile')}`, icon: LogOut, isAction: true, onClick: handleLogoutClick }
      : { id: 'login', label: t('nav.login'), icon: LogIn },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  const currentLabel = (() => {
    for (const item of navigationItems) {
      if (item.id === currentPage) return item.label;
      if (item.isGroup) {
        for (const child of item.children) {
          if (child.id === currentPage) return child.label;
        }
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

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar min-h-0">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            if (item.isGroup) {
              const groupActive = item.children.some(c => currentPage === c.id);
              const expanded =
                item.id === 'music-group' ? musicGroupExpanded
                  : item.id === 'mv-group' ? mvGroupExpanded
                    : item.id === 'studio-group' ? studioGroupExpanded
                      : workbenchGroupExpanded;
              const setExpanded =
                item.id === 'music-group' ? setMusicGroupExpanded
                  : item.id === 'mv-group' ? setMvGroupExpanded
                    : item.id === 'studio-group' ? setStudioGroupExpanded
                      : setWorkbenchGroupExpanded;
              return (
                <div key={item.id}>
                  <button
                    onClick={() => setExpanded(!expanded)}
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
            <span className="text-xs text-gray-400">Edge CDP</span>
            <div className={`flex items-center gap-1.5 ${apiStatus.browserConnected ? 'text-emerald-400' : 'text-gray-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${apiStatus.browserConnected ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              <span className="text-[10px] font-medium">{apiStatus.browserConnected ? t('header.connected') : t('header.offline')}</span>
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
            {currentPage === 'notebook' && <CreativeNotebook />}
            {currentPage === 'mv-muse' && <MVPage engine="muse" engineName="Muse AI" />}
            {currentPage === 'mv-suno' && <MVPage engine="suno" engineName="Suno AI" />}
            {currentPage === 'mv-melo' && <MVPage engine="melo" engineName="Melo AI" />}
            {currentPage === 'muse' && <MusePage onNavigate={setCurrentPage} />}
            {currentPage === 'suno' && <SunoPage onNavigate={setCurrentPage} />}
            {currentPage === 'melo' && <MeloPage onNavigate={setCurrentPage} />}
            {currentPage === 'remix' && <RemixStudio onNavigate={setCurrentPage} />}
            {currentPage === 'publish' && <PublishStudio onNavigate={setCurrentPage} />}
            {currentPage === 'settings' && <SettingsPage />}
          </Suspense>
        </div>

        <nav className="mobile-bottom-nav safe-area-bottom glass border-t border-purple-500/10 z-50 relative">
          {/* Group children row — shows sub-items when a group page is active */}
          {(() => {
            const activeGroup = navigationItems.find(i => {
              if (!i.isGroup) return false;
              if (i.children.some(c => c.id === currentPage)) return true;
              return false;
            });
            if (!activeGroup) return null;
            return (
              <div className="flex items-center justify-center gap-1 px-2 py-1.5 border-b border-purple-500/10 bg-violet-500/5">
                {activeGroup.children.map(child => {
                  const Icon = child.icon;
                  const isActive = currentPage === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => setCurrentPage(child.id)}
                      className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${isActive ? 'text-violet-400 bg-violet-500/10' : 'text-gray-500'}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[8px] font-medium">{child.label}</span>
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
                    onClick={() => {
                      if (childrenActive) {
                        setCurrentPage(currentPage);
                      } else {
                        setCurrentPage(primaryChild.id);
                      }
                    }}
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
      <AutoProgressBar />
      <PersistentAudioPlayer />
    </div>
  );
}

export default function AppWithProviders(props) {
  return (
    <AuthProvider>
      <SongLibraryProvider>
        <PlayerProvider>
          <GenerationProvider>
            <AutoProgressProvider>
              <App {...props} />
            </AutoProgressProvider>
          </GenerationProvider>
        </PlayerProvider>
      </SongLibraryProvider>
    </AuthProvider>
  );
}