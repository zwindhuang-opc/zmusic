import React, { useState, useEffect } from 'react';
import { Settings, Key, Save, RefreshCw, Server, Bot, Cpu, CheckCircle, AlertCircle, Sparkles, Wand2, Sliders, Music, RotateCcw, Gauge, Clock, Video, BookOpen, Youtube, Trash2, Bell, ShieldCheck, Link2, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import api, { isMobileEnvironment } from '../services/api.client.js';
import { getAutoConfig, setAutoConfig, AUTO_DEFAULTS } from '../utils/autoConfig.js';
import NotificationService from '../services/notification.service.js';

const PLATFORM_AUTH_PLATFORMS = [
  { id: 'muse', name: { zh: 'Muse AI', en: 'Muse AI' }, color: 'from-violet-500 to-purple-600', icon: 'Sparkles', portal: 'https://muse.top' },
  { id: 'melo', name: { zh: 'Melo AI', en: 'Melo AI' }, color: 'from-cyan-500 to-blue-600', icon: 'Music', portal: 'https://h.51melo.com' },
];

const UI_MODE_KEY = 'zmusic-ui-mode';
const PUBLISH_ACCOUNTS_KEY = 'zmusic_publish_accounts';

const PUBLISH_PLATFORMS = [
  {
    id: 'douyin',
    name: { zh: '抖音', en: 'Douyin' },
    color: 'from-rose-500 to-pink-600',
    icon: <Video className="w-4 h-4 text-white" />,
    portal: 'https://creator.douyin.com',
  },
  {
    id: 'qishui',
    name: { zh: '汽水音乐', en: 'Qishui' },
    color: 'from-cyan-500 to-blue-600',
    icon: <Music className="w-4 h-4 text-white" />,
    portal: 'https://musician.douyin.com',
  },
  {
    id: 'rednote',
    name: { zh: '小红书', en: 'RedNote' },
    color: 'from-red-500 to-rose-600',
    icon: <BookOpen className="w-4 h-4 text-white" />,
    portal: 'https://creator.xiaohongshu.com',
  },
  {
    id: 'tiktok',
    name: { zh: 'TikTok', en: 'TikTok' },
    color: 'from-slate-700 to-black',
    icon: <Video className="w-4 h-4 text-white" />,
    portal: 'https://www.tiktok.com/creator',
  },
  {
    id: 'youtube',
    name: { zh: 'YouTube', en: 'YouTube' },
    color: 'from-red-600 to-red-700',
    icon: <Youtube className="w-4 h-4 text-white" />,
    portal: 'https://studio.youtube.com',
  },
];

function loadPublishAccounts() {
  try {
    const raw = localStorage.getItem(PUBLISH_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePublishAccounts(accounts) {
  localStorage.setItem(PUBLISH_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const [config, setConfig] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null);
  const [saved, setSaved] = useState(false);
  const [autoConfig, setAutoConfigState] = useState(getAutoConfig());
  const [publishAccounts, setPublishAccounts] = useState(loadPublishAccounts());
  const [publishFormState, setPublishFormState] = useState({});
  const [publishSavedStates, setPublishSavedStates] = useState({});
  const [notifPermission, setNotifPermission] = useState('default');
  const [notifEnabled, setNotifEnabled] = useState(() => localStorage.getItem('zmusic_notifications_enabled') === 'true');
  const [notifAuto, setNotifAuto] = useState(() => localStorage.getItem('zmusic_notifications_auto') !== 'false');
  const [notifPublish, setNotifPublish] = useState(() => localStorage.getItem('zmusic_notifications_publish') !== 'false');
  const [notifBatch, setNotifBatch] = useState(() => localStorage.getItem('zmusic_notifications_batch') !== 'false');
  const [platformAuthData, setPlatformAuthData] = useState({});
  const [tokenInputs, setTokenInputs] = useState({});
  const [tokenShowState, setTokenShowState] = useState({});
  const [tokenSaving, setTokenSaving] = useState({});

  useEffect(() => {
    if (NotificationService.isNotificationSupported()) {
      try {
        setNotifPermission(Notification.permission || 'default');
      } catch { /* ignore */ }
    } else {
      setNotifPermission('denied');
    }
  }, []);

  const updateAutoConfig = (partial) => {
    const updated = setAutoConfig(partial);
    setAutoConfigState(updated);
  };

  const resetAutoConfig = () => {
    setAutoConfigState(AUTO_DEFAULTS);
    localStorage.removeItem('zmusic_auto_config');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    if (!isMobileEnvironment()) {
      loadStatus();
      loadPlatformAuth();
    }
  }, []);

  const loadStatus = async () => {
    try {
      const health = await api.health();
      if (health.success) {
        setConfig(health.data || health);
      }
      const agent = await api.agentStatus();
      if (agent.success) {
        setAgentStatus(agent.data || agent);
      }
    } catch (error) {
      console.error('Load failed:', error);
    }
  };

  // Platform Auth: load status for all platforms
  const loadPlatformAuth = async () => {
    try {
      const res = await fetch('/api/platform');
      const data = await res.json();
      if (data.success) {
        const map = {};
        (data.data || []).forEach(p => { map[p.id] = p; });
        setPlatformAuthData(map);
      }
    } catch (e) {
      console.error('Platform auth load failed:', e);
    }
  };

  // Platform Auth: store a token
  const handleStoreToken = async (platformId) => {
    const token = (tokenInputs[platformId] || '').trim();
    if (!token || token.length < 20) return;
    setTokenSaving(prev => ({ ...prev, [platformId]: true }));
    try {
      const res = await fetch(`/api/platform/${platformId}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setTokenInputs(prev => ({ ...prev, [platformId]: '' }));
        await loadPlatformAuth();
      } else {
        alert(data.error || 'Failed to save token');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setTokenSaving(prev => ({ ...prev, [platformId]: false }));
    }
  };

  // Platform Auth: clear a token
  const handleClearToken = async (platformId) => {
    if (!confirm(isZh ? '确定要清除已保存的令牌吗？' : 'Clear stored token?')) return;
    try {
      await fetch(`/api/platform/${platformId}/token`, { method: 'DELETE' });
      await loadPlatformAuth();
    } catch (e) {
      console.error('Clear token failed:', e);
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
              <div className="flex justify-between p-3 rounded-lg bg-white/5">
                <span className="text-xs text-gray-400">{t('settings.melo_api')}</span>
                <span className={`text-xs flex items-center gap-1 ${config.meloConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {config.meloConfigured ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {config.meloConfigured ? t('settings.connected') : t('settings.not_configured')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* UI Mode Selection */}
        <div className="gradient-border p-4 md:p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Sliders className="w-4 h-4 text-amber-400" />
            {t('settings.ui_mode')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                localStorage.setItem(UI_MODE_KEY, 'easy');
                window.dispatchEvent(new CustomEvent('zmusic-ui-mode', { detail: 'easy' }));
                window.location.reload();
              }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${localStorage.getItem(UI_MODE_KEY) === 'easy'
                ? 'border-violet-400 bg-violet-500/20'
                : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}
            >
              <div className="text-3xl mb-2">😊</div>
              <div className="text-sm font-bold text-white mb-1">{t('settings.easy_mode')}</div>
              <div className="text-[10px] text-gray-400">{t('settings.easy_mode_desc')}</div>
            </button>
            <button
              onClick={() => {
                localStorage.setItem(UI_MODE_KEY, 'expert');
                window.dispatchEvent(new CustomEvent('zmusic-ui-mode', { detail: 'expert' }));
                window.location.reload();
              }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${localStorage.getItem(UI_MODE_KEY) !== 'easy'
                ? 'border-violet-400 bg-violet-500/20'
                : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}
            >
              <div className="flex items-center gap-1 mb-2">
                <Wand2 className="w-5 h-5 text-pink-400" />
                <Cpu className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-sm font-bold text-white mb-1">{t('settings.expert_mode')}</div>
              <div className="text-[10px] text-gray-400">{t('settings.expert_mode_desc')}</div>
            </button>
          </div>
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
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="text-xs text-amber-300 font-medium mb-1">{t('settings.melo_ai_api_key')}</div>
            <div className="text-[10px] text-gray-400">
              {t('settings.set_env_hint', { key: 'MELO_API_KEY', provider: 'Melo AI' })}
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

      {/* AUTO Settings */}
      <div className="gradient-border p-4 md:p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Music className="w-4 h-4 text-violet-400" />
          AUTO 自动生成设置
          {saved && <span className="text-[10px] text-emerald-400 ml-2">✓ 已保存</span>}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Song count */}
          <div className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" />
                每次 AUTO 生成歌曲数量
              </span>
              <span className="text-sm font-bold text-violet-300">{autoConfig.songsPerAuto}</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={autoConfig.songsPerAuto}
              onChange={(e) => updateAutoConfig({ songsPerAuto: parseInt(e.target.value) })}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                每首构思倒计时（秒）
              </span>
              <span className="text-sm font-bold text-violet-300">{autoConfig.countdownSeconds}s</span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={autoConfig.countdownSeconds}
              onChange={(e) => updateAutoConfig({ countdownSeconds: parseInt(e.target.value) })}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>10s</span>
              <span>30s</span>
              <span>60s</span>
              <span>120s</span>
            </div>
          </div>

          {/* Song Duration */}
          <div className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                每首歌曲时长（秒）
              </span>
              <span className="text-sm font-bold text-violet-300">{autoConfig.songDuration}s</span>
            </div>
            <input
              type="range"
              min="30"
              max="300"
              step="30"
              value={autoConfig.songDuration}
              onChange={(e) => updateAutoConfig({ songDuration: parseInt(e.target.value) })}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>30s</span>
              <span>90s</span>
              <span>180s</span>
              <span>300s</span>
            </div>
          </div>

          {/* Max errors */}
          <div className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                最大连续失败次数
              </span>
              <span className="text-sm font-bold text-violet-300">{autoConfig.maxErrors}</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={autoConfig.maxErrors}
              onChange={(e) => updateAutoConfig({ maxErrors: parseInt(e.target.value) })}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>

          {/* Auto chaining */}
          <div className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">自动跨平台链式生成</span>
              <button
                onClick={() => updateAutoConfig({ autoChaining: !autoConfig.autoChaining })}
                className={`relative w-10 h-5 rounded-full transition-colors ${autoConfig.autoChaining ? 'bg-emerald-500' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoConfig.autoChaining ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <p className="text-[10px] text-gray-500">Muse → Suno → Melo 自动链式执行</p>
          </div>

          {/* Stop on error */}
          <div className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">出错时自动停止</span>
              <button
                onClick={() => updateAutoConfig({ stopOnError: !autoConfig.stopOnError })}
                className={`relative w-10 h-5 rounded-full transition-colors ${autoConfig.stopOnError ? 'bg-emerald-500' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoConfig.stopOnError ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <p className="text-[10px] text-gray-500">达到最大失败次数后自动停止 (使用上方滑块配置)</p>
          </div>

          {/* Auto close on stop */}
          <div className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">停止时自动关闭面板</span>
              <button
                onClick={() => updateAutoConfig({ autoCloseOnStop: !autoConfig.autoCloseOnStop })}
                className={`relative w-10 h-5 rounded-full transition-colors ${autoConfig.autoCloseOnStop ? 'bg-emerald-500' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoConfig.autoCloseOnStop ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <p className="text-[10px] text-gray-500">手动停止 AUTO 时自动收起创作面板</p>
          </div>

          {/* Auto close on done */}
          <div className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">完成后自动关闭面板</span>
              <button
                onClick={() => updateAutoConfig({ autoCloseOnDone: !autoConfig.autoCloseOnDone })}
                className={`relative w-10 h-5 rounded-full transition-colors ${autoConfig.autoCloseOnDone ? 'bg-emerald-500' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoConfig.autoCloseOnDone ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <p className="text-[10px] text-gray-500">AUTO 正常完成后自动收起创作面板</p>
          </div>

          {/* Auto close delay */}
          <div className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">自动关闭延迟</span>
              <span className="text-sm font-bold text-violet-300">{autoConfig.autoCloseDelay / 1000}s</span>
            </div>
            <input
              type="range"
              min="500"
              max="10000"
              step="500"
              value={autoConfig.autoCloseDelay}
              onChange={(e) => updateAutoConfig({ autoCloseDelay: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>
        </div>

        {/* Engine overrides */}
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 border border-violet-500/20">
          <div className="text-xs text-violet-300 font-semibold mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            各平台单独配置（可选覆盖默认值）
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'muse', label: 'Muse AI', color: 'blue' },
              { key: 'suno', label: 'Suno AI', color: 'emerald' },
              { key: 'melo', label: 'Melo AI', color: 'amber' },
            ].map(({ key, label, color }) => (
              <div key={key} className="p-2 rounded bg-white/5">
                <div className={`text-[10px] font-medium text-${color}-300 mb-1`}>{label}</div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    placeholder={autoConfig.songsPerAuto}
                    value={autoConfig.perEngineOverrides?.[key] ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? null : parseInt(e.target.value);
                      updateAutoConfig({
                        perEngineOverrides: {
                          ...autoConfig.perEngineOverrides,
                          [key]: v,
                        }
                      });
                    }}
                    className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white"
                  />
                </div>
                <div className="text-[9px] text-gray-500 mt-0.5">留空使用默认</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={resetAutoConfig}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors text-xs"
          >
            <RotateCcw className="w-3 h-3" />
            恢复默认
          </button>
          <div className="text-[10px] text-gray-500">
            配置自动保存到本地存储
          </div>
        </div>
      </div>

      <div className="gradient-border p-4 md:p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          {isZh ? '平台认证 (浏览器无关)' : 'Platform Authentication (Browser-Agnostic)'}
        </h3>
        <p className="text-[10px] md:text-xs text-gray-500 mb-4">
          {isZh
            ? '在任何浏览器（Chrome、Firefox、Safari、手机）上登录平台后，复制令牌粘贴到这里。后端将自动管理认证，无需 Edge CDP。'
            : 'Log in to each platform on ANY browser (Chrome, Firefox, Safari, mobile), then paste the token here. The backend manages auth — no Edge CDP required.'}
        </p>
        <div className="space-y-4">
          {PLATFORM_AUTH_PLATFORMS.map((p) => {
            const authData = platformAuthData[p.id];
            const status = authData?.status || {};
            const tokenValue = tokenInputs[p.id] || '';
            const showToken = tokenShowState[p.id] || false;
            const saving = tokenSaving[p.id] || false;
            const IconComp = p.icon === 'Music' ? Music : Sparkles;
            return (
              <div key={p.id} className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                      <IconComp className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white">{isZh ? p.name.zh : p.name.en}</span>
                      <a href={p.portal} target="_blank" rel="noopener noreferrer" className="ml-2 text-[10px] text-cyan-400 hover:underline inline-flex items-center gap-0.5">
                        <Link2 className="w-3 h-3" />
                        {isZh ? '打开平台' : 'Open'}
                      </a>
                    </div>
                  </div>
                  {status.hasToken ? (
                    <div className="flex items-center gap-1.5">
                      {status.expired ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-300 border border-red-500/30">
                          {isZh ? '已过期' : 'Expired'}
                        </span>
                      ) : status.credits !== undefined ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {isZh ? `${status.credits} 积分` : `${status.credits} credits`}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {isZh ? '已存储' : 'Stored'}
                        </span>
                      )}
                      <button
                        onClick={() => handleClearToken(p.id)}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                        title={isZh ? '清除令牌' : 'Clear token'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-500/20 text-gray-400 border border-gray-500/30">
                      {isZh ? '未配置' : 'Not configured'}
                    </span>
                  )}
                </div>

                {status.hasToken && !status.expired && status.daysLeft !== null && status.daysLeft !== undefined && (
                  <div className="text-[10px] text-gray-500 mb-2">
                    {isZh ? `令牌将在 ${status.daysLeft} 天后过期` : `Token expires in ${status.daysLeft} days`}
                  </div>
                )}

                {status.hasToken && status.expired && (
                  <div className="text-[10px] text-red-400 mb-2">
                    {isZh ? '令牌已过期，请重新获取并粘贴。' : 'Token expired. Please re-obtain and paste.'}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={tokenValue}
                      onChange={(e) => setTokenInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder={isZh ? '粘贴平台令牌 (JWT)...' : 'Paste platform token (JWT)...'}
                      className="w-full px-3 py-2 pr-8 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                    />
                    <button
                      onClick={() => setTokenShowState(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleStoreToken(p.id)}
                    disabled={!tokenValue || tokenValue.length < 20 || saving}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    {isZh ? '保存' : 'Save'}
                  </button>
                </div>

                {status.instructions && (
                  <details className="mt-2">
                    <summary className="text-[10px] text-cyan-400 cursor-pointer hover:underline">
                      {isZh ? '如何获取令牌？' : 'How to get the token?'}
                    </summary>
                    <pre className="mt-1.5 p-2 rounded bg-black/30 text-[10px] text-gray-400 whitespace-pre-wrap font-mono">
                      {isZh ? status.instructions.zh : status.instructions.en}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="gradient-border p-4 md:p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-pink-400" />
          {isZh ? '发布平台账号管理' : 'Publish Platform Accounts'}
        </h3>
        <div className="space-y-4">
          {PUBLISH_PLATFORMS.map((p) => {
            const existing = publishAccounts[p.id] || {};
            const formData = publishFormState[p.id] || {
              id: existing.id || '',
              name: existing.name || '',
              password: existing.password || '',
              token: existing.token || '',
            };
            const isSaved = publishSavedStates[p.id] || (!!existing.name || !!existing.id);

            const updateField = (field, value) => {
              setPublishFormState({
                ...publishFormState,
                [p.id]: { ...formData, [field]: value },
              });
            };

            const handleSave = () => {
              const merged = {
                id: formData.id?.trim() || '',
                name: formData.name?.trim() || '',
                password: formData.password || '',
                token: formData.token || '',
              };
              const next = { ...publishAccounts, [p.id]: merged };
              setPublishAccounts(next);
              savePublishAccounts(next);
              setPublishSavedStates({ ...publishSavedStates, [p.id]: true });
              setTimeout(() => {
                setPublishSavedStates((s) => ({ ...s, [p.id]: false }));
              }, 2000);
            };

            const handleClear = () => {
              const next = { ...publishAccounts };
              delete next[p.id];
              setPublishAccounts(next);
              savePublishAccounts(next);
              setPublishFormState({
                ...publishFormState,
                [p.id]: { id: '', name: '', password: '', token: '' },
              });
            };

            return (
              <div key={p.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg`}>
                      {p.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {isZh ? p.name.zh : p.name.en}
                      </div>
                      <a
                        href={p.portal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                      >
                        {isZh ? '创作者平台' : 'Creator Portal'} →
                      </a>
                    </div>
                  </div>
                  {isSaved && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" />
                      {isZh ? '已保存' : t('publish.account_saved')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                  <div>
                    <div className="text-[10px] text-gray-500 mb-1">
                      {isZh ? '账号 ID' : 'Account ID'}
                    </div>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => updateField('id', e.target.value)}
                      placeholder={isZh ? '如：抖音号 / 用户ID' : 'e.g. User ID'}
                      className="w-full bg-black/30 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:border-pink-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 mb-1">
                      {isZh ? '账号名称' : 'Account Name'}
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder={isZh ? '昵称 / 用户名' : 'Nickname / Username'}
                      className="w-full bg-black/30 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:border-pink-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 mb-1">
                      {isZh ? '密码' : 'Password'}
                    </div>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder={isZh ? '登录密码' : 'Login password'}
                      className="w-full bg-black/30 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:border-pink-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 mb-1">
                      {isZh ? '令牌 / Token' : 'Token / API Key'}
                    </div>
                    <input
                      type="password"
                      value={formData.token}
                      onChange={(e) => updateField('token', e.target.value)}
                      placeholder={isZh ? 'API Token / Cookie / RefreshToken' : 'API Token / Cookie / RefreshToken'}
                      className="w-full bg-black/30 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:border-pink-500/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-medium hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/20"
                  >
                    <Save className="w-3 h-3" />
                    {t('common.save')}
                  </button>
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 text-gray-300 text-xs hover:bg-white/10 transition-all border border-white/10"
                  >
                    <Trash2 className="w-3 h-3" />
                    {t('common.clear')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="gradient-border p-4 md:p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-amber-400" />
          {isZh ? t('settings.notifications_title') : t('settings.notifications_title')}
        </h3>
        <p className="text-[10.5px] text-gray-400 mb-3 leading-relaxed">
          {isZh ? t('settings.notifications_desc') : t('settings.notifications_desc')}
        </p>
        <div className="space-y-3">
          {/* Permission status + request */}
          <div className="p-3 rounded-lg bg-white/5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-300 font-medium">
                {isZh ? '浏览器通知权限' : 'Browser Notification Permission'}
              </div>
              <div className={`text-[10.5px] mt-0.5 flex items-center gap-1 ${notifPermission === 'granted' ? 'text-emerald-400' : notifPermission === 'denied' ? 'text-rose-400' : 'text-amber-400'}`}>
                {notifPermission === 'granted' && <CheckCircle className="w-3 h-3" />}
                {notifPermission === 'denied' && <AlertCircle className="w-3 h-3" />}
                {notifPermission === 'granted'
                  ? t('settings.notifications_permission_granted')
                  : notifPermission === 'denied'
                    ? t('settings.notifications_permission_denied')
                    : t('settings.notifications_permission_default')}
              </div>
            </div>
            <button
              onClick={async () => {
                const result = await NotificationService.requestPermission();
                setNotifPermission(result);
                if (result === 'granted') {
                  setNotifEnabled(true);
                  localStorage.setItem('zmusic_notifications_enabled', 'true');
                }
              }}
              disabled={notifPermission === 'granted' || notifPermission === 'denied' || !NotificationService.isNotificationSupported()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Bell className="w-3 h-3" />
              {t('settings.notifications_permission_request')}
            </button>
          </div>

          {/* Enable notifications toggle */}
          <div className="p-3 rounded-lg bg-white/5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-300 font-medium">{t('settings.notifications_enable')}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {isZh ? '开启后，下方各事件通知才会生效' : 'Master switch for all event notifications below'}
              </div>
            </div>
            <button
              onClick={() => {
                const next = !notifEnabled;
                setNotifEnabled(next);
                localStorage.setItem('zmusic_notifications_enabled', String(next));
              }}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${notifEnabled ? 'bg-emerald-500' : 'bg-gray-600'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${notifEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Per-event toggles */}
          {[
            { key: 'auto', label: t('settings.notifications_auto'), state: notifAuto, set: setNotifAuto, lsKey: 'zmusic_notifications_auto' },
            { key: 'publish', label: t('settings.notifications_publish'), state: notifPublish, set: setNotifPublish, lsKey: 'zmusic_notifications_publish' },
            { key: 'batch', label: t('settings.notifications_batch'), state: notifBatch, set: setNotifBatch, lsKey: 'zmusic_notifications_batch' },
          ].map(({ key, label, state, set, lsKey }) => (
            <div key={key} className="p-3 rounded-lg bg-white/5 flex items-center justify-between gap-3">
              <div className="text-xs text-gray-300">{label}</div>
              <button
                onClick={() => {
                  const next = !state;
                  set(next);
                  localStorage.setItem(lsKey, String(next));
                }}
                disabled={!notifEnabled}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 disabled:opacity-40 ${state ? 'bg-emerald-500' : 'bg-gray-600'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${state ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
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
