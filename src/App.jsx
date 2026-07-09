import React, { useState, useEffect } from 'react';
import { useTranslation } from './i18n/index.js';
import {
  LayoutDashboard, Music, Mic, Video, Settings, Sparkles, TrendingUp,
  Activity, Cpu, Zap, BarChart3, Server, Bot, Globe
} from 'lucide-react';
import api from './services/api.client.js';
import Dashboard from './pages/Dashboard.jsx';
import MusicPage from './pages/MusicPage.jsx';
import LyricsPage from './pages/LyricsPage.jsx';
import MVPage from './pages/MVPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import FloatingChatBall from './components/FloatingChatBall.jsx';

function App() {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [apiStatus, setApiStatus] = useState({ configured: false, version: '1.0.0', uptime: 0 });
  const [agentStatus, setAgentStatus] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    loadStatus(controller.signal);
    const interval = setInterval(() => {
      loadStatus(controller.signal);
    }, 60000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const loadStatus = async (signal) => {
    try {
      const health = await api.health(signal);
      if (health?.success) {
        setApiStatus({
          configured: health.apiConfigured || health.data?.apiConfigured,
          museConfigured: health.museConfigured || health.data?.museConfigured || false,
          version: health.version || health.data?.version || '1.0.0',
          uptime: health.uptime || health.data?.uptime || 0
        });
      }
      const agent = await api.agentStatus(signal);
      if (agent?.success) {
        setAgentStatus(agent.data || agent);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        // Silent fail - status will retry on next interval
      }
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('zmusic-lang', lng);
    window.location.reload();
  };

  const navigationItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'music', label: t('nav.music'), icon: Music },
    { id: 'lyrics', label: t('nav.lyrics'), icon: Mic },
    { id: 'mv', label: t('nav.mv'), icon: Video },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      <aside className="w-64 glass flex flex-col border-r border-purple-500/10">
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
        <header className="h-14 glass border-b border-purple-500/10 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold">
              {navigationItems.find(item => item.id === currentPage)?.label}
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
              v{apiStatus.version}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-gray-300">{t('dashboard.unicorn_agent')}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Zap className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-xs text-gray-300">{t('header.hermes_openclaw')}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-[#0a0a0f] via-[#0f0a1a] to-[#0a0a0f]">
          {currentPage === 'dashboard' && <Dashboard apiStatus={apiStatus} agentStatus={agentStatus} onNavigate={setCurrentPage} />}
          {currentPage === 'music' && <MusicPage />}
          {currentPage === 'lyrics' && <LyricsPage onNavigate={setCurrentPage} />}
          {currentPage === 'mv' && <MVPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </div>
      </main>

      <FloatingChatBall />
    </div>
  );
}

export default App;