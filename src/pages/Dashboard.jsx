import React, { useState, useEffect } from 'react';
import { Music, Mic, Video, Activity, TrendingUp, Cpu, Bot, Sparkles, BarChart3, Server, Zap } from 'lucide-react';
import { useTranslation } from '../i18n/index.js';
import api from '../services/api.client.js';

function Dashboard({ apiStatus, agentStatus }) {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(null);
  const [recentCommands, setRecentCommands] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await api.analytics();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Analytics load failed:', error);
    }
  };

  const statsCards = [
    { title: t('dashboard.songs_generated'), value: analytics?.songsGenerated || 0, icon: Music, color: 'from-violet-500 to-purple-500' },
    { title: t('dashboard.lyrics_created'), value: analytics?.lyricsGenerated || 0, icon: Mic, color: 'from-pink-500 to-rose-500' },
    { title: t('dashboard.mv_productions'), value: analytics?.mvGenerated || 0, icon: Video, color: 'from-blue-500 to-cyan-500' },
    { title: t('dashboard.active_users'), value: analytics?.activeUsers || 1, icon: Activity, color: 'from-emerald-500 to-teal-500' },
  ];

  const agentMethods = [
    { name: t('dashboard.fsm_programming'), desc: t('dashboard.state_machine_transitions'), color: 'text-violet-400', count: 8, countLabel: t('dashboard.states') },
    { name: t('dashboard.network_layers_text'), desc: t('dashboard.layered_composition'), color: 'text-pink-400', count: 4, countLabel: t('dashboard.layers') },
    { name: t('dashboard.muse_style'), desc: t('dashboard.natural_language_commands'), color: 'text-blue-400', count: t('dashboard.infinite'), countLabel: '' },
    { name: t('dashboard.suno_style'), desc: t('dashboard.structured_parameters'), color: 'text-emerald-400', count: t('dashboard.infinite'), countLabel: '' },
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

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="grid grid-cols-4 gap-4">
        {statsCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="gradient-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.title}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 gradient-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-400" />
                {t('dashboard.ai_agent_methods')}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{t('dashboard.available_generation_techniques')}</p>
            </div>
            <span className="text-[10px] px-2 py-1 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {t('dashboard.unicorn_agent_v')}
            </span>
          </div>
          <div className="space-y-3">
            {agentMethods.map((method, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div>
                  <div className={`text-sm font-medium ${method.color}`}>{method.name}</div>
                  <div className="text-xs text-gray-500">{method.desc}</div>
                </div>
                <div className="text-xs font-mono text-gray-400">{method.count} {method.countLabel}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="gradient-border p-6">
          <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
            <Server className="w-4 h-4 text-pink-400" />
            {t('dashboard.system_status')}
          </h3>
          <div className="space-y-4">
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
                <span className="text-amber-400">{t('dashboard.not_configured')}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: '30%' }} />
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
          </div>
        </div>
      </div>

      <div className="gradient-border p-6">
        <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-pink-400" />
          {t('dashboard.architecture_layers')}
        </h3>
        <div className="grid grid-cols-5 gap-3">
          {architectureLayers.map((layer, i) => (
            <div key={i} className="p-3 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20 text-center">
              <Cpu className="w-4 h-4 text-violet-400 mx-auto mb-1.5" />
              <div className="text-xs font-medium text-white">{layer.name}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{t('dashboard.layer')} {layer.layer}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {architectureLayers2.map((layer, i) => (
            <div key={i} className="p-3 rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 text-center">
              <Zap className="w-4 h-4 text-pink-400 mx-auto mb-1.5" />
              <div className="text-xs font-medium text-white">{layer.name}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{t('dashboard.layer')} {layer.layer}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
