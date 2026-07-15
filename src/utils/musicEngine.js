import { MUSIC_STYLES, MUSIC_THEMES } from '../config/musicStyles.js';

const NETWORK_LAYER_CONFIG = {
  foundation: {
    templates: [
      '底层节拍: {bpm}bpm基础律动, 围绕{theme}主题构建稳定的{beat}节拍',
      '底层律动: {bpm}bpm三拍子节拍, {rhythm}节奏型, {style}基础风格'
    ],
    beats: ['4/4拍子基础节拍', 'waltz三拍子节拍', '电子碎拍', '古典华尔兹3/4拍'],
    rhythms: ['稳定律动', '跳转节奏', '摇摆节奏', '断奏节奏']
  },
  melody: {
    templates: [
      '旋律层: {melody_style}主旋律线条, 表达{emotion}情绪, 配合{elements}',
      '旋律层: 以像{reference}的主旋律线条, 表达{feeling}情绪, 配合{classical_elements}'
    ],
    melodyStyles: ['跳转的主旋律', '流畅的旋律线条', '戏剧性的旋律起伏', '空灵的旋律'],
    elements: ['classical elements', 'surrounding element的空灵和穿透感', '电子合成器铺底', '弦乐伴奏'],
    references: ['流行音乐风格', '古典交响乐', '现代电子音乐', '中国古典民乐'],
    feelings: ['浪漫的爱情', '人到中年的不安情绪', '彻骨的悲伤', '快乐的希望']
  },
  expression: {
    templates: [
      '表现层: {vocals}与{harmony}, 深度诠释{emotion_theme}, 体现{style_feature}',
      '表现层: {sfx}深度诠释{expression_theme}, 体现{feature}'
    ],
    vocals: ['人声', '多重人声叠录', '和声层层叠叠'],
    harmonies: ['和声层层叠叠递进', '合唱团烘托', '独唱与合唱交替'],
    emotionThemes: ['人生壯志未酬之慨嘆', '黑夜的"靜"與人心中的"動"的互双影響', '浪漫的爱情'],
    styleFeatures: ['流行音乐特色', '古典音乐特色', '电子音乐特色'],
    sfx: ['風聲与雨水声腳步聲', '环境音效与人声交织', '电影级Foley音效'],
    expressionThemes: ['情感层次分明', '情感爆发', '压抑与释放']
  },
  effects: {
    templates: [
      '效果层: {intro_effects}, 营造{atmosphere}, 整合{final_elements}',
      '效果层: {effects_list}, {mood_description}'
    ],
    introEffects: ['开場的7-8秒雨水風聲5-6秒腳步聲混响', '混响、延迟、调制效果', 'Shimmer Reverb星光混响'],
    atmospheres: ['柔和氛围', '古風氛围', '都市氛围'],
    finalElements: ['电影级音效设计', 'surrounding elements的声音设计'],
    effectsList: ['混响效果', 'Shimmer Reverb星光混响', 'Di-Da Delay滴答延迟']
  }
};

function _buildFoundationLayer(bpm, theme, style) {
  const template = NETWORK_LAYER_CONFIG.foundation.templates[Math.floor(Math.random() * 2)];
  const beat = NETWORK_LAYER_CONFIG.foundation.beats[Math.floor(Math.random() * 4)];
  const rhythm = NETWORK_LAYER_CONFIG.foundation.rhythms[Math.floor(Math.random() * 4)];
  return template
    .replace('{bpm}', bpm)
    .replace('{theme}', theme)
    .replace('{beat}', beat)
    .replace('{rhythm}', rhythm)
    .replace('{style}', style);
}

function _buildMelodyLayer(theme) {
  const template = NETWORK_LAYER_CONFIG.melody.templates[Math.floor(Math.random() * 2)];
  const melodyStyle = NETWORK_LAYER_CONFIG.melody.melodyStyles[Math.floor(Math.random() * 4)];
  const element = NETWORK_LAYER_CONFIG.melody.elements[Math.floor(Math.random() * 4)];
  const reference = NETWORK_LAYER_CONFIG.melody.references[Math.floor(Math.random() * 4)];
  const feeling = NETWORK_LAYER_CONFIG.melody.feelings[Math.floor(Math.random() * 4)];
  return template
    .replace('{melody_style}', melodyStyle)
    .replace('{emotion}', theme)
    .replace('{elements}', element)
    .replace('{reference}', reference)
    .replace('{feeling}', feeling)
    .replace('{classical_elements}', element);
}

function _buildExpressionLayer(theme, style) {
  const template = NETWORK_LAYER_CONFIG.expression.templates[Math.floor(Math.random() * 2)];
  const vocal = NETWORK_LAYER_CONFIG.expression.vocals[Math.floor(Math.random() * 3)];
  const harmony = NETWORK_LAYER_CONFIG.expression.harmonies[Math.floor(Math.random() * 3)];
  const emotionTheme = NETWORK_LAYER_CONFIG.expression.emotionThemes[Math.floor(Math.random() * 3)];
  const styleFeature = NETWORK_LAYER_CONFIG.expression.styleFeatures[Math.floor(Math.random() * 3)];
  return template
    .replace('{vocals}', vocal)
    .replace('{harmony}', harmony)
    .replace('{emotion_theme}', emotionTheme)
    .replace('{style_feature}', styleFeature)
    .replace('{sfx}', vocal)
    .replace('{expression_theme}', theme)
    .replace('{feature}', styleFeature);
}

function _buildEffectsLayer() {
  const template = NETWORK_LAYER_CONFIG.effects.templates[Math.floor(Math.random() * 2)];
  const introEffect = NETWORK_LAYER_CONFIG.effects.introEffects[Math.floor(Math.random() * 3)];
  const atmosphere = NETWORK_LAYER_CONFIG.effects.atmospheres[Math.floor(Math.random() * 3)];
  const finalElement = NETWORK_LAYER_CONFIG.effects.finalElements[Math.floor(Math.random() * 2)];
  return template
    .replace('{intro_effects}', introEffect)
    .replace('{atmosphere}', atmosphere)
    .replace('{final_elements}', finalElement)
    .replace('{effects_list}', introEffect)
    .replace('{mood_description}', atmosphere);
}

export function generateMusic(params) {
  const {
    prompt,
    style = 'pop',
    genre = 'pop',
    duration = 60,
    bpm = 120,
    method = 'fsm',
    theme = 'love',
    provider = 'suno_ai'
  } = params;

  const styleInfo = MUSIC_STYLES[style] || MUSIC_STYLES.pop;
  const themeInfo = MUSIC_THEMES[theme] || MUSIC_THEMES.love;
  const themeDesc = styleInfo.mood || '爱情主题';
  const styleName = styleInfo.description || '流行音乐';

  const foundation = _buildFoundationLayer(bpm, themeDesc, styleName);
  const melody = _buildMelodyLayer(themeDesc);
  const expression = _buildExpressionLayer(themeDesc, styleName);
  const effects = _buildEffectsLayer();

  const fullCommand = `[STYLE]: ${styleName}\n[GENRE]: ${genre}\n[THEME]: ${themeDesc}\n[INSTRUMENTS]: ${styleInfo.instruments?.join(', ') || ''}\n[BPM]: ${bpm}\n[DURATION]: ${duration} seconds\n[MOOD]: ${styleInfo.mood || ''}\n\n[LAYER: FOUNDATION]\n${foundation}\n\n[LAYER: MELODY]\n${melody}\n\n[LAYER: EXPRESSION]\n${expression}\n\n[LAYER: EFFECTS]\n${effects}\n\n[PROMPT]\n${prompt}`;

  return {
    success: true,
    taskId: `music_${Date.now()}`,
    providers: {
      [provider]: {
        success: true,
        message: '音乐生成计划已创建（移动端离线模式）',
        taskId: `local_${Date.now()}`,
        command: fullCommand
      }
    }
  };
}

export function getMusicStyles() {
  return Object.keys(MUSIC_STYLES);
}
