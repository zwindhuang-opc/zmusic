import React, { useState, useEffect } from 'react';
import { Settings, Key, Save, RefreshCw, Server, Bot, Cpu, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '../i18n/index.js';
import api from '../services/api.client.js';

function SettingsPage() {
  const { t } = useTranslation();
  const [config, setConfig] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const health = await api.health();
      if (health.success) {
        setConfig(health.data);
      }
      const agent = await api.agentStatus();
      if (agent.success) {
        setAgentStatus(agent.data);
      }
    } catch (error) {
      console.error('Load failed:', error);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in">
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center gap-2 md:gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white">{t('settings.system_settings')}</h1>
            <p className="text-[10px] md:text-xs text-gray-400">{t('settings.api_keys_status')}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
        <div className="gradient-border p-4 md:p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-emerald-400" />
            {t('settings.system_status')}
          </h3>
          {config && (
            <div className="space-y-2">
              <div className="flex justify-between p-3 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">{t('settings.version')}</span>
                <span className="text-xs text-white font-mono">{config.version}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">{t('settings.port')}</span>
                <span className="text-xs text-white font-mono">{config.port}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">{t('settings.uptime')}</span>
                <span className="text-xs text-white font-mono">{config.uptime}s</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">{t('settings.architecture')}</span>
                <span className="text-xs text-white">{config.architecture}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">{t('settings.suno_api')}</span>
                <span className={`text-xs flex items-center gap-1 ${config.apiConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {config.apiConfigured ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {config.apiConfigured ? t('settings.connected') : t('settings.not_configured')}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">{t('settings.muse_api')}</span>
                <span className={`text-xs flex items-center gap-1 ${config.museConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {config.museConfigured ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {config.museConfigured ? t('settings.connected') : t('settings.not_configured')}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="gradient-border p-4 md:p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-violet-400" />
            {t('settings.ai_agent_status')}
          </h3>
          {agentStatus?.unicorn && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">{agentStatus.unicorn.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{t('header.active')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-3 rounded bg-white/5">
                    <div className="text-[10px] text-gray-500">{t('settings.hermes')}</div>
                    <div className="text-sm text-emerald-300">{agentStatus.unicorn.hermes ? t('settings.enabled') : t('settings.disabled')}</div>
                  </div>
                  <div className="p-3 rounded bg-white/5">
                    <div className="text-[10px] text-gray-500">{t('settings.openclaw')}</div>
                    <div className="text-sm text-emerald-300">{agentStatus.unicorn.openclaw ? t('settings.enabled') : t('settings.disabled')}</div>
                  </div>
                  <div className="p-3 rounded bg-white/5">
                    <div className="text-[10px] text-gray-500">{t('settings.fsm_states')}</div>
                    <div className="text-sm text-white">{agentStatus.unicorn.fsmStates}</div>
                  </div>
                  <div className="p-3 rounded bg-white/5">
                    <div className="text-[10px] text-gray-500">{t('settings.network_layers')}</div>
                    <div className="text-sm text-white">{agentStatus.unicorn.networkLayers}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="gradient-border p-4 md:p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-pink-400" />
          {t('settings.api_configuration')}
        </h3>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="text-xs text-amber-300 font-medium mb-1">{t('settings.suno_cn_api_key')}</div>
            <div className="text-[10px] text-gray-400">
              {t('settings.set_env_hint', { key: 'SUNO_CN_API_KEY', provider: 'Suno AI' })}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="text-xs text-amber-300 font-medium mb-1">{t('settings.muse_ai_api_key')}</div>
            <div className="text-[10px] text-gray-400">
              {t('settings.set_env_hint', { key: 'MUSE_AI_API_KEY', provider: 'Muse AI' })}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="text-xs text-emerald-300 font-medium mb-1">{t('settings.agent_mode_active')}</div>
            <div className="text-[10px] text-gray-400">
              {t('settings.agent_mode_description')}
            </div>
          </div>
        </div>
      </div>

      <div className="gradient-border p-4 md:p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-cyan-400" />
          {t('settings.available_api_endpoints')}
        </h3>
        <div className="space-y-2">
          {config?.endpoints?.map((endpoint, i) => (
            <div key={i} className="p-3 rounded-lg bg-white/5 font-mono text-xs text-gray-400">
              {endpoint}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
