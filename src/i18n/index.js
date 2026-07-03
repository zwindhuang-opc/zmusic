/**
 * Simple translation helper without external i18next dependency
 * Falls back to direct string mapping
 */

const translations = {
  zh: {
    app: { title: 'ZMusic', subtitle: 'AI音乐生成平台' },
    nav: { dashboard: '仪表盘', music: '音乐生成', lyrics: '歌词生成', mv: 'MV视频', settings: '设置' },
    header: { status: '状态', connected: '已连接', disconnected: '未连接', language: '语言' },
    dashboard: {
      title: '系统概览', api_status: 'API状态', version: '版本', uptime: '运行时间',
      configured: '已配置', not_configured: '未配置', agent_status: '代理状态',
      unicorn_agent: '独角兽代理', fsm_states: 'FSM状态数', network_layers: '网络层数',
      start_creating: '开始创作',
      songs_generated: '已生成歌曲', lyrics_created: '已创建歌词', mv_productions: 'MV制作',
      active_users: '活跃用户', system_status: '系统状态', suno_ai: 'Suno AI',
      muse_ai: 'Muse AI', connected: '已连接', not_configured: '未配置',
      ai_agent_methods: 'AI代理方法', available_generation_techniques: '可用生成技术',
      fsm_programming: 'FSM编程', state_machine_transitions: '状态机转换',
      network_layers: '网络层', layered_composition: '分层组合',
      muse_style: 'Muse风格', natural_language_commands: '自然语言命令',
      suno_style: 'Suno风格', structured_parameters: '结构化参数',
      states: '状态', layers: '层', infinite: '无限'
    },
    music: {
      title: '音乐生成', prompt: '音乐描述', prompt_placeholder: '描述您想创作的音乐...',
      style: '风格', style_placeholder: '流行、摇滚、电子...', duration: '时长（秒）',
      method: '生成方式', generate: '生成音乐', generating: '正在生成...',
      result: '生成结果', task_id: '任务ID', status: '状态', audio_url: '音频链接', download: '下载',
      network_layers: '网络层', layered_composition: '分层组合',
      muse_style: 'Muse风格', natural_language: '自然语言',
      suno_style: 'Suno风格', structured_params: '结构化参数'
    },
    lyrics: {
      title: '歌词生成器', theme: '主题', theme_placeholder: '爱情、夏天、梦想...',
      genre: '类型', method: '方法', generate: '生成歌词', generating: '正在生成...',
      result: '生成的歌词', copy: '复制', bpm: '节拍',
      network_layers: '网络层', layered_composition: '分层组合',
      muse_style: 'Muse风格', natural_language_commands: '自然语言命令',
      suno_style: 'Suno风格', structured_parameters: '结构化参数',
      click_generate_to_start: '点击"生成歌词"开始'
    },
    mv: {
      title: 'MV时间线生成器', theme: '主题', style: '视觉风格',
      generate: '生成时间线', generating: '正在生成...', result: '时间线结果',
      scene: '场景', duration: '时长', effects: '特效', color_palette: '色调',
      click_generate_to_start: '点击"生成MV时间线"开始'
    },
    settings: {
      title: '系统设置', api_configuration: 'API配置', suno_api: 'Suno AI API',
      muse_api: 'Muse AI API', configured: '已配置', not_configured: '未配置',
      architecture: '架构', mvc_info: 'MVC模式与服务层', agents: 'AI代理', endpoints: '可用接口',
      connected: '已连接', not_configured: '未配置',
      api_key: 'API密钥', api_key_not_set: 'API密钥未设置',
      demo_mode: '演示模式', demo_mode_active: '演示模式已激活',
      demo_mode_description: '应用程序正在演示模式下运行。所有命令都已生成且模板正常工作，但实际音乐生成需要API密钥。独角兽代理的FSM和网络层功能完全可用。',
      configure_api_keys: '配置API密钥以启用真实音乐生成'
    },
    common: { loading: '加载中...', error: '错误', success: '成功', cancel: '取消', save: '保存' }
  },
  en: {
    app: { title: 'ZMusic', subtitle: 'AI Music Platform' },
    nav: { dashboard: 'Dashboard', music: 'Music Generation', lyrics: 'Lyrics Generator', mv: 'MV Video', settings: 'Settings' },
    header: { status: 'Status', connected: 'Connected', disconnected: 'Disconnected', language: 'Language' },
    dashboard: {
      title: 'System Overview', api_status: 'API Status', version: 'Version', uptime: 'Uptime',
      configured: 'Configured', not_configured: 'Not Configured', agent_status: 'Agent Status',
      unicorn_agent: 'Unicorn Agent', fsm_states: 'FSM States', network_layers: 'Network Layers',
      start_creating: 'Start Creating',
      songs_generated: 'Songs Generated', lyrics_created: 'Lyrics Created', mv_productions: 'MV Productions',
      active_users: 'Active Users', system_status: 'System Status', suno_ai: 'Suno AI',
      muse_ai: 'Muse AI', connected: 'Connected', not_configured: 'Not Configured',
      ai_agent_methods: 'AI Agent Methods', available_generation_techniques: 'Available generation techniques',
      fsm_programming: 'FSM Programming', state_machine_transitions: 'State machine transitions',
      network_layers: 'Network Layers', layered_composition: 'Layered composition',
      muse_style: 'Muse Style', natural_language_commands: 'Natural language commands',
      suno_style: 'Suno Style', structured_parameters: 'Structured parameters',
      states: 'states', layers: 'layers', infinite: 'INFINITE'
    },
    music: {
      title: 'Music Generation', prompt: 'Music Description', prompt_placeholder: 'Describe your music...',
      style: 'Style', style_placeholder: 'pop, rock, electronic...', duration: 'Duration (sec)',
      method: 'Method', generate: 'Generate Music', generating: 'Generating...',
      result: 'Result', task_id: 'Task ID', status: 'Status', audio_url: 'Audio URL', download: 'Download',
      network_layers: 'Network Layers', layered_composition: '4-layer composition',
      muse_style: 'Muse Style', natural_language: 'Natural language',
      suno_style: 'Suno Style', structured_params: 'Structured params'
    },
    lyrics: {
      title: 'Lyrics Generator', theme: 'Theme', theme_placeholder: 'love, summer, dreams...',
      genre: 'Genre', method: 'Method', generate: 'Generate Lyrics', generating: 'Generating...',
      result: 'Generated Lyrics', copy: 'Copy', bpm: 'BPM',
      network_layers: 'Network Layers', layered_composition: '4-layer composition',
      muse_style: 'Muse Style', natural_language_commands: 'Natural language commands',
      suno_style: 'Suno Style', structured_parameters: 'Structured parameters',
      click_generate_to_start: 'Click "Generate Lyrics" to start'
    },
    mv: {
      title: 'MV Timeline Generator', theme: 'Theme', style: 'Visual Style',
      generate: 'Generate Timeline', generating: 'Generating...', result: 'Timeline Result',
      scene: 'Scene', duration: 'Duration', effects: 'Effects', color_palette: 'Color Palette',
      click_generate_to_start: 'Click "Generate MV Timeline" to start'
    },
    settings: {
      title: 'Settings', api_configuration: 'API Configuration', suno_api: 'Suno AI API',
      muse_api: 'Muse AI API', configured: 'Configured', not_configured: 'Not Configured',
      architecture: 'Architecture', mvc_info: 'MVC Pattern + Service Layer', agents: 'AI Agents', endpoints: 'Endpoints',
      connected: 'Connected', not_configured: 'Not Configured',
      api_key: 'API Key', api_key_not_set: 'API Key not set',
      demo_mode: 'Demo Mode', demo_mode_active: 'Demo Mode Active',
      demo_mode_description: 'The application is running in demo mode. All commands are generated and templates are working, but actual music generation requires API keys. The Unicorn Agent with FSM and Network Layer is fully operational.',
      configure_api_keys: 'Configure API keys to enable real music generation'
    },
    common: { loading: 'Loading...', error: 'Error', success: 'Success', cancel: 'Cancel', save: 'Save' }
  }
};

let currentLang = localStorage.getItem('zmusic-lang') || 'zh';

export function t(key, lang = currentLang) {
  const parts = key.split('.');
  let value = translations[lang] || translations.zh;
  for (const part of parts) {
    value = value?.[part];
  }
  return value || key;
}

export function changeLanguage(lng) {
  currentLang = lng;
  localStorage.setItem('zmusic-lang', lng);
  window.dispatchEvent(new Event('languageChanged'));
}

export function getCurrentLanguage() {
  return currentLang;
}

// Simple hook-like interface for React
export function useTranslation() {
  return { t, i18n: { language: currentLang, changeLanguage } };
}

export default { t, changeLanguage, getCurrentLanguage, useTranslation, translations };
