import React, { useState, useEffect } from 'react';
import { Settings, Key, Save, RefreshCw, Server, Bot, Cpu, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api.client.js';

function SettingsPage() {
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
    <div className="space-y-6 animate-slide-in">
      <div className="gradient-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">System Settings</h1>
            <p className="text-xs text-gray-400">API keys, system status, and configuration</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="gradient-border p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-emerald-400" />
            System Status
          </h3>
          {config && (
            <div className="space-y-2">
              <div className="flex justify-between p-2.5 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">Version</span>
                <span className="text-xs text-white font-mono">{config.version}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">Port</span>
                <span className="text-xs text-white font-mono">{config.port}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">Uptime</span>
                <span className="text-xs text-white font-mono">{config.uptime}s</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">Architecture</span>
                <span className="text-xs text-white">{config.architecture}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">Suno AI</span>
                <span className={`text-xs flex items-center gap-1 ${config.apiConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {config.apiConfigured ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {config.apiConfigured ? 'Connected' : 'Not Configured'}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">Muse AI</span>
                <span className={`text-xs flex items-center gap-1 ${config.museConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {config.museConfigured ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {config.museConfigured ? 'Connected' : 'Not Configured'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="gradient-border p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-violet-400" />
            AI Agent Status
          </h3>
          {agentStatus?.unicorn && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">{agentStatus.unicorn.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">ACTIVE</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-[10px] text-gray-500">Hermes</div>
                    <div className="text-xs text-emerald-300">{agentStatus.unicorn.hermes ? 'Enabled' : 'Disabled'}</div>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-[10px] text-gray-500">OpenClaw</div>
                    <div className="text-xs text-emerald-300">{agentStatus.unicorn.openclaw ? 'Enabled' : 'Disabled'}</div>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-[10px] text-gray-500">FSM States</div>
                    <div className="text-xs text-white">{agentStatus.unicorn.fsmStates}</div>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <div className="text-[10px] text-gray-500">Network Layers</div>
                    <div className="text-xs text-white">{agentStatus.unicorn.networkLayers}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="gradient-border p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-pink-400" />
          API Configuration
        </h3>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="text-xs text-amber-300 font-medium mb-1">Suno.cn API Key</div>
            <div className="text-[10px] text-gray-400">
              Set <code className="px-1 py-0.5 rounded bg-white/5 text-amber-300">SUNO_CN_API_KEY</code> in your <code className="px-1 py-0.5 rounded bg-white/5 text-amber-300">.env</code> file to enable real Suno AI music generation.
            </div>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="text-xs text-amber-300 font-medium mb-1">Muse AI API Key</div>
            <div className="text-[10px] text-gray-400">
              Set <code className="px-1 py-0.5 rounded bg-white/5 text-amber-300">MUSE_AI_API_KEY</code> in your <code className="px-1 py-0.5 rounded bg-white/5 text-amber-300">.env</code> file to enable real Muse AI music generation.
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div className="text-xs text-emerald-300 font-medium mb-1">Agent Mode Active</div>
            <div className="text-[10px] text-gray-400">
              The Unicorn Agent with FSM and Network Layer is fully operational. Configure API keys to enable real music generation with Suno AI and Muse AI.
            </div>
          </div>
        </div>
      </div>

      <div className="gradient-border p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Available API Endpoints
        </h3>
        <div className="space-y-1.5">
          {config?.endpoints?.map((endpoint, i) => (
            <div key={i} className="p-2 rounded-lg bg-white/5 font-mono text-[10px] text-gray-400">
              {endpoint}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
