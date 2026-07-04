const translations = {
  zh: {
    app: { title: 'ZMusic', subtitle: 'AI音乐生成平台' },
    nav: { dashboard: '仪表盘', music: '音乐生成', lyrics: '歌词生成', mv: 'MV视频', settings: '设置' },
    header: { status: '状态', connected: '已连接', disconnected: '未连接', language: '语言', live: '运行中', offline: '离线', active: '活跃', api: 'API', hermes_openclaw: 'Hermes + OpenClaw' },
    dashboard: {
      title: '系统概览', api_status: 'API状态', version: '版本', uptime: '运行时间',
      configured: '已配置', not_configured: '未配置', agent_status: '代理状态',
      unicorn_agent: '独角兽代理', fsm_states: 'FSM状态数', network_layers: '网络层数',
      start_creating: '开始创作',
      songs_generated: '已生成歌曲', lyrics_created: '已创建歌词', mv_productions: 'MV制作',
      active_users: '活跃用户', system_status: '系统状态', suno_ai: 'Suno AI',
      muse_ai: 'Muse AI', connected: '已连接', demo_mode: '演示模式',
      ai_agent_methods: 'AI代理方法', available_generation_techniques: '可用生成技术',
      fsm_programming: 'FSM编程', state_machine_transitions: '状态机转换',
      network_layers_text: '网络层', layered_composition: '分层组合',
      muse_style: 'Muse风格', natural_language_commands: '自然语言命令',
      suno_style: 'Suno风格', structured_parameters: '结构化参数',
      states: '状态', layers: '层', infinite: '无限',
      architecture_layers: '架构层级',
      config: '配置', utils: '工具', services: '服务', agents: '代理', controllers: '控制器',
      routes: '路由', http_server: 'HTTP服务器',
      unicorn_agent_v: '独角兽代理 v1.0',
      mvc_architecture: 'MVC架构', operational: '运行中',
      layer: '层'
    },
    music: {
      title: '音乐生成', prompt: '音乐描述', prompt_placeholder: '描述您想创作的音乐...',
      style: '风格', style_placeholder: '流行、摇滚、电子...', duration: '时长（秒）',
      method: '生成方式', generate: '生成音乐', generating: '正在生成...',
      result: '生成结果', task_id: '任务ID', status: '状态', audio_url: '音频链接', download: '下载',
      network_layers: '网络层', layered_composition: '四层组合',
      muse_style: 'Muse风格', natural_language: '自然语言',
      suno_style: 'Suno风格', structured_params: '结构化参数',
      ai_music_generation: 'AI音乐生成',
      powered_by: '由Suno AI + Muse AI与独角兽代理提供支持',
      music_prompt: '音乐描述',
      music_style: '音乐风格',
      duration_s: '时长（秒）',
      theme: '主题',
      ai_agent_method: 'AI代理方法',
      fsm_programming: 'FSM编程', state_machine: '状态机',
      no_music_generated: '尚未生成音乐',
      creating_your_music: '正在创建您的音乐...',
      ok: '成功', error: '错误',
      generate_music_with: '使用{method}生成音乐',
      generating_music: '正在生成音乐...',
      bpm: '节拍',
      please_enter_prompt: '请输入音乐描述',
      generation_failed: '生成失败'
    },
    lyrics: {
      title: 'AI歌词生成器', subtitle: '独角兽代理 - FSM、网络层和Muse命令',
      theme: '主题', theme_placeholder: '爱情、夏天、梦想...',
      genre: '类型', method: '生成方法', generate: '生成歌词', generating: '正在生成...',
      result: '生成的歌词', copy: '复制', bpm: '节拍',
      fsm_name: 'FSM编程', fsm_desc: '状态机转换',
      network_name: '网络层', network_desc: '四层组合',
      muse_name: 'Muse风格', muse_desc: '自然语言命令',
      suno_name: 'Suno风格', suno_desc: '结构化参数',
      click_to_start: '点击"生成歌词"开始',
      creating_with: '正在使用{method}创建歌词...',
      generated_command: '生成的命令',
      lyrics_output: '歌词输出',
      complexity: '复杂程度',
      complexity_hint: '1=简单, 10=最复杂',
      complexity_level: '复杂度等级',
      simple: '简单', medium: '中等', complex: '复杂', very_complex: '非常复杂',
      parameters: '参数', subject: '主语', object: '宾语',
      generated_content: '生成内容',
      language: '语言',
      language_zh: '中文', language_zh_desc: '中文歌词',
      language_en: '英文', language_en_desc: '英文歌词',
      language_mix: '中英混合', language_mix_desc: '中英文混合',
      variation: '变体', variation_hint: '不同变体产生不同风格的歌词',
      duration: '时长（秒）',
      reference: '参考艺术家', reference_placeholder: '如：周杰伦、Taylor Swift',
      script: '创作脚本', script_placeholder: '描述您想要的歌词内容、场景、情绪...',
      script_hint: '输入创作脚本将影响所有生成算法的输出',
      user_intent: '用户创作意图'
    },
    mv: {
      title: 'MV时间线生成器',
      theme: '主题', theme_placeholder: '夏天、夜晚、爱情...',
      style: '视觉风格', style_placeholder: '电影感、动漫、复古...',
      generate: '生成时间线', generating: '正在生成...',
      result: '时间线结果', scene: '场景', duration: '时长',
      effects: '特效', color_palette: '色调',
      mv_video_generator: 'MV视频生成器',
      professional_mv: '专业音乐视频模板和时间线',
      mv_genre: 'MV类型',
      duration_seconds: '时长（秒）',
      color_palette_label: '色调',
      generate_mv_timeline: '生成MV时间线',
      generating_mv: '正在生成MV...',
      mv_timeline: 'MV时间线',
      click_to_start: '点击"生成MV时间线"开始',
      creating_timeline: '正在创建MV时间线...',
      palette: '色调',
      scenes: '场景数',
      scene_timeline: '场景时间线',
      effects_label: '特效',
      modern: '现代', cinematic: '电影感', artistic: '艺术感', minimalist: '极简',
      purple_pink_gradient: '紫粉渐变',
      red_black_contrast: '红黑对比',
      gold_red_jade: '金红碧玉',
      neon_cyber: '霓虹赛博',
      urban_gold: '都市金色',
      soft_pastel: '柔和粉彩',
      scene_intro: '开场',
      scene_verse_scene: '主歌场景',
      scene_chorus_scene: '副歌场景',
      scene_bridge_scene: '桥段场景',
      scene_outro: '尾声'
    },
    settings: {
      title: '系统设置', api_configuration: 'API配置', suno_api: 'Suno AI API',
      muse_api: 'Muse AI API', configured: '已配置', not_configured: '未配置',
      architecture: '架构', mvc_info: 'MVC模式与服务层', agents: 'AI代理', endpoints: '可用接口',
      connected: '已连接',
      api_key: 'API密钥',
      demo_mode: '演示模式', demo_mode_active: '演示模式已激活',
      demo_mode_description: '应用程序正在演示模式下运行。所有命令都已生成且模板正常工作，但实际音乐生成需要API密钥。独角兽代理的FSM和网络层功能完全可用。',
      configure_api_keys: '配置API密钥以启用真实音乐生成',
      system_settings: '系统设置',
      api_keys_status: 'API密钥、系统状态和配置',
      system_status: '系统状态',
      version: '版本', port: '端口', uptime: '运行时间',
      ai_agent_status: 'AI代理状态',
      hermes: 'Hermes', openclaw: 'OpenClaw',
      enabled: '已启用', disabled: '已禁用',
      fsm_states: 'FSM状态', network_layers: '网络层',
      suno_cn_api_key: 'Suno.cn API密钥',
      set_env_hint: '在您的.env文件中设置{key}以启用真实的{provider}音乐生成。',
      muse_ai_api_key: 'Muse AI API密钥',
      agent_mode_active: '代理模式已激活',
      agent_mode_description: '独角兽代理的FSM和网络层功能完全可用。配置API密钥以启用Suno AI和Muse AI的真实音乐生成。',
      available_api_endpoints: '可用API接口'
    },
    common: {
      loading: '加载中...', error: '错误', success: '成功',
      cancel: '取消', save: '保存', reset: '重置', close: '关闭',
      copy: '复制', download: '下载'
    },
    styles: {
      pop: '流行', rock: '摇滚', electronic: '电子',
      hip_hop: '嘻哈', ballad: '民谣', chinese_traditional: '中国传统',
      jazz: '爵士', classical: '古典', rnb: '节奏布鲁斯', country: '乡村',
      chinese_classical: '中国古典', love_song: '情歌',
      tango: '探戈', ancient: '古风', modern: '现代',
      ancient_modern: '古风现代', gothic_rock: '哥特摇滚'
    },
    themes: {
      love: '爱情', friendship: '友情', success: '成功',
      dreams: '梦想', nature: '自然', life: '人生', memory: '回忆',
      loneliness: '孤独', sadness: '悲伤', hope: '希望',
      lunatic: '疯癫', tango: '探戈'
    },
    layers: {
      foundation: '底层节拍',
      melody: '旋律层',
      expression: '表现层',
      effects: '效果层'
    },
    effects: {
      rain_wind: '雨水风声',
      footsteps: '脚步声',
      reverb: '混响',
      delay: '延迟',
      di_da_delay: '滴答延迟',
      shimmer_reverb: '星光混响',
      vocals: '人声',
      tropical_percussion: '热带打击乐',
      bass_line: '贝斯线',
      guitar_riffs: '吉他连复段',
      ambient_pads: '氛围铺底',
      modulation: '调制效果'
    },
    music_elements: {
      waltz: '华尔兹三拍子',
      tango: '探戈',
      classical: '古典元素',
      mabg_style: 'MABG风格',
      deep_house: '深度浩室'
    },
    lyrics_meta: {
      literaryAnalysis: '文学分析',
      emotionalArc: '情感弧线',
      totalLines: '总行数',
      transitions: '转换次数',
      states: '状态数'
    },
    literary_terms: {
      metaphor: '隐喻',
      personification: '拟人',
      imagery: '意象',
      repetition: '重复'
    },
    emotional_arc: {
      intro: '引子',
      verse: '主歌',
      pre_chorus: '预副歌',
      chorus: '副歌',
      bridge: '桥段',
      final_chorus: '终曲副歌',
      outro: '尾声',
      stable: '稳定',
      rising: '上升',
      falling: '下降'
    }
  },
  en: {
    app: { title: 'ZMusic', subtitle: 'AI Music Generation Platform' },
    nav: { dashboard: 'Dashboard', music: 'Music Generation', lyrics: 'Lyrics Generator', mv: 'MV Video', settings: 'Settings' },
    header: { status: 'Status', connected: 'Connected', disconnected: 'Disconnected', language: 'Language', live: 'LIVE', offline: 'OFFLINE', active: 'ACTIVE', api: 'API', hermes_openclaw: 'Hermes + OpenClaw' },
    dashboard: {
      title: 'System Overview', api_status: 'API Status', version: 'Version', uptime: 'Uptime',
      configured: 'Configured', not_configured: 'Not Configured', agent_status: 'Agent Status',
      unicorn_agent: 'Unicorn Agent', fsm_states: 'FSM States', network_layers: 'Network Layers',
      start_creating: 'Start Creating',
      songs_generated: 'Songs Generated', lyrics_created: 'Lyrics Created', mv_productions: 'MV Productions',
      active_users: 'Active Users', system_status: 'System Status', suno_ai: 'Suno AI',
      muse_ai: 'Muse AI', connected: 'Connected', demo_mode: 'Demo Mode',
      ai_agent_methods: 'AI Agent Methods', available_generation_techniques: 'Available generation techniques',
      fsm_programming: 'FSM Programming', state_machine_transitions: 'State machine transitions',
      network_layers_text: 'Network Layers', layered_composition: 'Layered composition',
      muse_style: 'Muse Style', natural_language_commands: 'Natural language commands',
      suno_style: 'Suno Style', structured_parameters: 'Structured parameters',
      states: 'states', layers: 'layers', infinite: 'INFINITE',
      architecture_layers: 'Architecture Layers',
      config: 'Config', utils: 'Utils', services: 'Services', agents: 'Agents', controllers: 'Controllers',
      routes: 'Routes', http_server: 'HTTP Server',
      unicorn_agent_v: 'Unicorn Agent v1.0',
      mvc_architecture: 'MVC Architecture', operational: 'Operational',
      layer: 'Layer'
    },
    music: {
      title: 'Music Generation', prompt: 'Music Description', prompt_placeholder: 'Describe your music...',
      style: 'Style', style_placeholder: 'pop, rock, electronic...', duration: 'Duration (sec)',
      method: 'Method', generate: 'Generate Music', generating: 'Generating...',
      result: 'Result', task_id: 'Task ID', status: 'Status', audio_url: 'Audio URL', download: 'Download',
      network_layers: 'Network Layers', layered_composition: '4-layer composition',
      muse_style: 'Muse Style', natural_language: 'Natural language',
      suno_style: 'Suno Style', structured_params: 'Structured params',
      ai_music_generation: 'AI Music Generation',
      powered_by: 'Powered by Suno AI + Muse AI with Unicorn Agent',
      music_prompt: 'Music Prompt',
      music_style: 'Music Style',
      duration_s: 'Duration (s)',
      theme: 'Theme',
      ai_agent_method: 'AI Agent Method',
      fsm_programming: 'FSM Programming', state_machine: 'State machine',
      no_music_generated: 'No music generated yet',
      creating_your_music: 'Creating your music...',
      ok: 'OK', error: 'ERROR',
      generate_music_with: 'Generate Music with {method}',
      generating_music: 'Generating Music...',
      bpm: 'BPM',
      please_enter_prompt: 'Please enter a music prompt',
      generation_failed: 'Generation failed'
    },
    lyrics: {
      title: 'AI Lyrics Generator', subtitle: 'Unicorn Agent with FSM, Network Layers, and Muse commands',
      theme: 'Theme', theme_placeholder: 'love, summer, dreams...',
      genre: 'Genre', method: 'Method', generate: 'Generate Lyrics', generating: 'Generating...',
      result: 'Generated Lyrics', copy: 'Copy', bpm: 'BPM',
      fsm_name: 'FSM Programming', fsm_desc: 'State machine transitions',
      network_name: 'Network Layers', network_desc: '4-layer composition',
      muse_name: 'Muse Style', muse_desc: 'Natural language commands',
      suno_name: 'Suno Style', suno_desc: 'Structured parameters',
      click_to_start: 'Click "Generate Lyrics" to start',
      creating_with: 'Creating lyrics with {method}...',
      generated_command: 'Generated Command',
      lyrics_output: 'Lyrics Output',
      complexity: 'Complexity',
      complexity_hint: '1=Simple, 10=Most Complex',
      complexity_level: 'Complexity Level',
      simple: 'Simple', medium: 'Medium', complex: 'Complex', very_complex: 'Very Complex',
      parameters: 'Parameters', subject: 'Subject', object: 'Object',
      generated_content: 'Generated Content'
    },
    mv: {
      title: 'MV Timeline Generator',
      theme: 'Theme', theme_placeholder: 'summer, night, love...',
      style: 'Visual Style', style_placeholder: 'cinematic, anime, retro...',
      generate: 'Generate Timeline', generating: 'Generating...',
      result: 'Timeline Result', scene: 'Scene', duration: 'Duration',
      effects: 'Effects', color_palette: 'Color Palette',
      mv_video_generator: 'MV Video Generator',
      professional_mv: 'Professional music video templates and timeline',
      mv_genre: 'MV Genre',
      duration_seconds: 'Duration (seconds)',
      color_palette_label: 'Color Palette',
      generate_mv_timeline: 'Generate MV Timeline',
      generating_mv: 'Generating MV...',
      mv_timeline: 'MV Timeline',
      click_to_start: 'Click "Generate MV Timeline" to start',
      creating_timeline: 'Creating MV timeline...',
      palette: 'Palette',
      scenes: 'Scenes',
      scene_timeline: 'Scene Timeline',
      effects_label: 'Effects',
      modern: 'Modern', cinematic: 'Cinematic', artistic: 'Artistic', minimalist: 'Minimalist',
      purple_pink_gradient: 'Purple Pink Gradient',
      red_black_contrast: 'Red Black Contrast',
      gold_red_jade: 'Gold Red Jade',
      neon_cyber: 'Neon Cyber',
      urban_gold: 'Urban Gold',
      soft_pastel: 'Soft Pastel',
      scene_intro: 'Intro',
      scene_verse_scene: 'Verse Scene',
      scene_chorus_scene: 'Chorus Scene',
      scene_bridge_scene: 'Bridge Scene',
      scene_outro: 'Outro'
    },
    settings: {
      title: 'System Settings', api_configuration: 'API Configuration', suno_api: 'Suno AI API',
      muse_api: 'Muse AI API', configured: 'Configured', not_configured: 'Not Configured',
      architecture: 'Architecture', mvc_info: 'MVC Pattern + Service Layer', agents: 'AI Agents', endpoints: 'Endpoints',
      connected: 'Connected',
      api_key: 'API Key',
      demo_mode: 'Demo Mode', demo_mode_active: 'Demo Mode Active',
      demo_mode_description: 'The application is running in demo mode. All commands are generated and templates are working, but actual music generation requires API keys. The Unicorn Agent with FSM and Network Layer is fully operational.',
      configure_api_keys: 'Configure API keys to enable real music generation',
      system_settings: 'System Settings',
      api_keys_status: 'API keys, system status, and configuration',
      system_status: 'System Status',
      version: 'Version', port: 'Port', uptime: 'Uptime',
      ai_agent_status: 'AI Agent Status',
      hermes: 'Hermes', openclaw: 'OpenClaw',
      enabled: 'Enabled', disabled: 'Disabled',
      fsm_states: 'FSM States', network_layers: 'Network Layers',
      suno_cn_api_key: 'Suno.cn API Key',
      set_env_hint: 'Set {key} in your .env file to enable real {provider} music generation.',
      muse_ai_api_key: 'Muse AI API Key',
      agent_mode_active: 'Agent Mode Active',
      agent_mode_description: 'The Unicorn Agent with FSM and Network Layer is fully operational. Configure API keys to enable real music generation with Suno AI and Muse AI.',
      available_api_endpoints: 'Available API Endpoints'
    },
    common: {
      loading: 'Loading...', error: 'Error', success: 'Success',
      cancel: 'Cancel', save: 'Save', reset: 'Reset', close: 'Close',
      copy: 'Copy', download: 'Download'
    },
    styles: {
      pop: 'Pop', rock: 'Rock', electronic: 'Electronic',
      hip_hop: 'Hip Hop', ballad: 'Ballad', chinese_traditional: 'Chinese Traditional',
      jazz: 'Jazz', classical: 'Classical', rnb: 'R&B', country: 'Country',
      chinese_classical: 'Chinese Classical', love_song: 'Love Song',
      tango: 'Tango', ancient: 'Ancient', modern: 'Modern',
      ancient_modern: 'Ancient Modern', gothic_rock: 'Gothic Rock'
    },
    themes: {
      love: 'Love', friendship: 'Friendship', success: 'Success',
      dreams: 'Dreams', nature: 'Nature', life: 'Life', memory: 'Memory',
      loneliness: 'Loneliness', sadness: 'Sadness', hope: 'Hope',
      lunatic: 'Lunatic', tango: 'Tango'
    },
    layers: {
      foundation: 'Foundation',
      melody: 'Melody',
      expression: 'Expression',
      effects: 'Effects'
    },
    effects: {
      rain_wind: 'Rain & Wind',
      footsteps: 'Footsteps',
      reverb: 'Reverb',
      delay: 'Delay',
      di_da_delay: 'Di-Da Delay',
      shimmer_reverb: 'Shimmer Reverb',
      vocals: 'Vocals',
      tropical_percussion: 'Tropical Percussion',
      bass_line: 'Bass Line',
      guitar_riffs: 'Guitar Riffs',
      ambient_pads: 'Ambient Pads',
      modulation: 'Modulation'
    },
    music_elements: {
      waltz: 'Waltz',
      tango: 'Tango',
      classical: 'Classical Elements',
      mabg_style: 'MABG Style',
      deep_house: 'Deep House'
    },
    lyrics_meta: {
      literaryAnalysis: 'Literary Analysis',
      emotionalArc: 'Emotional Arc',
      totalLines: 'Total Lines',
      transitions: 'Transitions',
      states: 'States'
    },
    literary_terms: {
      metaphor: 'Metaphor',
      personification: 'Personification',
      imagery: 'Imagery',
      repetition: 'Repetition'
    },
    emotional_arc: {
      intro: 'Intro',
      verse: 'Verse',
      pre_chorus: 'Pre-Chorus',
      chorus: 'Chorus',
      bridge: 'Bridge',
      final_chorus: 'Final Chorus',
      outro: 'Outro',
      stable: 'Stable',
      rising: 'Rising',
      falling: 'Falling'
    }
  }
};

let currentLang = typeof localStorage !== 'undefined' ? (localStorage.getItem('zmusic-lang') || 'zh') : 'zh';

function interpolate(str, vars) {
  if (!vars || typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match;
  });
}

export function t(key, vars, lang) {
  const targetLang = lang || currentLang;
  const parts = key.split('.');
  let value = translations[targetLang] || translations.zh;
  for (const part of parts) {
    value = value?.[part];
  }
  if (value === undefined || value === null) {
    let fallbackValue = translations.zh;
    for (const part of parts) {
      fallbackValue = fallbackValue?.[part];
    }
    if (fallbackValue === undefined || fallbackValue === null) {
      return key;
    }
    return interpolate(fallbackValue, vars);
  }
  return interpolate(value, vars);
}

export function changeLanguage(lng) {
  currentLang = lng;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('zmusic-lang', lng);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('languageChanged'));
  }
}

export function getCurrentLanguage() {
  return currentLang;
}

import { useState, useEffect } from 'react';

export function useTranslation() {
  const [lang, setLang] = useState(currentLang);

  useEffect(() => {
    const handleLanguageChange = () => setLang(currentLang);
    if (typeof window !== 'undefined') {
      window.addEventListener('languageChanged', handleLanguageChange);
      return () => window.removeEventListener('languageChanged', handleLanguageChange);
    }
  }, []);

  return {
    t: (key, vars) => t(key, vars, lang),
    i18n: { language: lang, changeLanguage }
  };
}

export default { t, changeLanguage, getCurrentLanguage, useTranslation, translations };
