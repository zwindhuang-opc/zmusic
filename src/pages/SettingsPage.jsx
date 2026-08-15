import React, { useState, useEffect } from 'react';
import { Settings, Key, Save, RefreshCw, Server, Bot, Cpu, CheckCircle, AlertCircle, Sparkles, Wand2, Sliders, Music, RotateCcw, Gauge, Clock, Video, BookOpen, Youtube, Trash2 } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import api, { isMobileEnvironment } from '../services/api.client.js';
import { getAutoConfig, setAutoConfig, AUTO_DEFAULTS } from '../utils/autoConfig.js';

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
            <p className="text-[10px] text-gray-500">连续 {autoConfig.maxErrors} 次失败后自动停止</p>
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
