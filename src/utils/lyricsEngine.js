import { generateDynamicLyrics, getThemeBank, blendBanks, getDynamicThemes, getDynamicStyles } from './dynamicLyricsEngine.js';

/* =========================================================================
 * STRUCTURAL CONFIGS (not lyrics)
 * These define song structure, musical dynamics, time formatting and
 * instrument lists. They contain NO pre-written lyric lines.
 * ========================================================================= */

const STRUCTURES = {
  pop: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus'],
  rock: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
  chinese_traditional: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro'],
  electronic: ['intro', 'build', 'drop', 'verse', 'drop', 'verse', 'drop', 'outro'],
  hip_hop: ['intro', 'verse', 'hook', 'verse', 'hook', 'bridge', 'hook'],
  ballad: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  love_song: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  chinese_classical: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'outro'],
  tango: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
  ancient_modern: ['intro_ancient', 'verse1_ancient', 'interlude_modern', 'verse2_modern', 'chorus_fusion', 'bridge_ancient', 'finale_modern', 'ending_fusion'],
  heartbreaking: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  healing: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  time_travel: ['intro_ancient', 'verse1_ancient', 'interlude_modern', 'verse2_modern', 'chorus_fusion', 'bridge_ancient', 'finale_modern', 'ending_fusion'],
  epic: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  dark: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  romantic: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  nostalgic: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'outro'],
  energetic: ['intro', 'build', 'drop', 'verse', 'drop', 'verse', 'drop', 'bridge', 'drop', 'outro'],
  dreamy: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  modern: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  indie: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
  folk: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'outro'],
  kpop: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  reggae: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
  ambient: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro'],
  ancient: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'outro'],
  jazz: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
  classical: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  rnb: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  country: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
  gothic_rock: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  friendship: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'outro'],
  nature: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'outro']
};

const DYNAMIC_LEVELS = {
  ppp: { name: '极弱', intensity: 0.1, description: '几乎无声，极度空灵' },
  pp: { name: '很弱', intensity: 0.2, description: '清冷，极简留白' },
  p: { name: '弱', intensity: 0.3, description: '柔和，内敛' },
  mp: { name: '中弱', intensity: 0.4, description: '轻微叙事，渐入' },
  mf: { name: '中强', intensity: 0.5, description: '平稳推进，张力渐起' },
  f: { name: '强', intensity: 0.7, description: '情感释放，高潮推进' },
  ff: { name: '很强', intensity: 0.85, description: '全曲最高潮，爆发' },
  fff: { name: '极强', intensity: 1.0, description: '终极毁灭感，撕裂' }
};

const TIME_SECTION_CONFIG = {
  intro: {
    durationRange: [0, 30],
    format: '[前奏·古 ({start}:{end})]',
    defaultDynamic: 'pp',
    defaultInstruments: ['古琴泛音独奏', '极简留白', 'Rain SFX', 'Wind SFX']
  },
  verse1: {
    durationRange: [30, 70],
    format: '[主歌一·古 ({start}:{end})]',
    defaultDynamic: 'p→mp',
    defaultInstruments: ['古琴按音散音', '箫长音点缀', 'Cello backing']
  },
  interlude: {
    durationRange: [70, 95],
    format: '[间奏·今 ({start}:{end})]',
    defaultDynamic: 'p→mf',
    defaultInstruments: ['电子脉冲渐入', 'Synth Pad低沉嗡鸣', 'Bandoneon enters']
  },
  verse2: {
    durationRange: [95, 130],
    format: '[主歌二·今 ({start}:{end})]',
    defaultDynamic: 'mp',
    defaultInstruments: ['钢琴高音单音', 'Synth Pad', 'Heavy Bass']
  },
  chorus: {
    durationRange: [130, 180],
    format: '[副歌·古今叠★ ({start}:{end})]',
    defaultDynamic: 'f→ff',
    defaultInstruments: ['Full Classical Tango ensemble', 'String Orchestra', 'Layered Vocals']
  },
  bridge: {
    durationRange: [180, 205],
    format: '[桥段·古 ({start}:{end})]',
    defaultDynamic: 'pp→ppp',
    defaultInstruments: ['古琴泛音', '风声采样', 'Cello Solo']
  },
  finale: {
    durationRange: [205, 255],
    format: '[尾声·今 ({start}:{end})]',
    defaultDynamic: 'p→mf→pp',
    defaultInstruments: ['钢琴单音', '电子脉冲渐弱', '古琴最后一个按音']
  },
  ending: {
    durationRange: [255, 270],
    format: '[终章·合 ({start}:{end})]',
    defaultDynamic: 'p→mf→pp',
    defaultInstruments: ['古琴单音三声', '弦乐团最后一个和弦', 'Choir极弱长音']
  }
};

const INSTRUMENT_TIME_SPACE = {
  ancient: {
    name: '古时空·乐器',
    instruments: ['古琴（核心）', '箫', '中国大鼓（极轻）', '二胡', '琵琶', '笛子', '古筝'],
    description: '古典民族乐器，营造悠远空灵意境'
  },
  modern: {
    name: '今时空·乐器',
    instruments: ['合成器Pad', '电子脉冲', '钢琴', '弦乐团', '电吉他', 'Synth Bass', '电子鼓'],
    description: '现代电子乐器，营造都市迷茫感'
  },
  fusion: {
    name: '融合层·副歌',
    instruments: ['古琴+合成器交织', '弦乐团全编制', '合唱团', '中国大鼓+电子鼓叠层'],
    description: '古今融合，情感高潮爆发'
  }
};

/* =========================================================================
 * UTILITY FUNCTIONS (structural / formatting / analysis - no lyrics)
 * ========================================================================= */

function _normalizeSectionType(type) {
  if (type.includes('intro')) return 'intro';
  if (type.includes('verse')) return 'verse';
  if (type.includes('pre_chorus') || type.includes('prechorus')) return 'pre_chorus';
  if (type.includes('chorus')) return 'chorus';
  if (type.includes('bridge')) return 'bridge';
  if (type.includes('outro') || type.includes('finale') || type.includes('ending')) return 'outro';
  if (type.includes('interlude')) return 'verse';
  if (type.includes('build') || type.includes('drop') || type.includes('hook')) return 'chorus';
  return 'verse';
}

function _formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function _getDynamicForSection(sectionType, index, totalSections) {
  const progress = index / totalSections;

  if (sectionType.includes('intro')) return 'pp';
  if (sectionType.includes('verse')) return progress < 0.3 ? 'p' : 'mp';
  if (sectionType.includes('pre_chorus')) return 'mf';
  if (sectionType.includes('chorus')) return progress < 0.7 ? 'f' : 'ff';
  if (sectionType.includes('bridge')) return 'pp→ppp';
  if (sectionType.includes('finale') || sectionType.includes('final') || sectionType.includes('ending')) return 'p→mf→pp';
  if (sectionType.includes('outro')) return 'pp';

  return 'mp';
}

function _getInstrumentsForSection(sectionType, params) {
  if (sectionType.includes('ancient')) {
    return INSTRUMENT_TIME_SPACE.ancient.instruments.slice(0, 4);
  }
  if (sectionType.includes('modern')) {
    return INSTRUMENT_TIME_SPACE.modern.instruments.slice(0, 4);
  }
  if (sectionType.includes('fusion') || sectionType.includes('chorus')) {
    return INSTRUMENT_TIME_SPACE.fusion.instruments;
  }

  const configKey = sectionType.replace(/[0-9]/g, '');
  return TIME_SECTION_CONFIG[configKey]?.defaultInstruments || ['Piano', 'Strings'];
}

function _getTimeSpaceForSection(sectionType) {
  if (sectionType.includes('ancient')) return INSTRUMENT_TIME_SPACE.ancient;
  if (sectionType.includes('modern')) return INSTRUMENT_TIME_SPACE.modern;
  return INSTRUMENT_TIME_SPACE.fusion;
}

function _translateTheme(theme) {
  const translations = {
    love: '爱情',
    loneliness: '孤独',
    sadness: '悲伤',
    dreams: '梦想',
    memory: '回忆',
    nature: '自然',
    friendship: '友情',
    success: '成功',
    hope: '希望',
    life: '人生',
    lunatic: '疯癫',
    tango: '探戈',
    heartbreak: '心碎',
    healing: '治愈',
    time_travel: '穿越',
    epic_journey: '史诗旅程',
    dark_mystery: '暗黑神秘',
    romantic_night: '浪漫之夜',
    nostalgic_memory: '怀旧回忆',
    energetic_party: '活力派对',
    dreamy_fantasy: '梦幻幻想',
    modern_city: '现代都市',
    ancient_legend: '古老传说',
    indie_story: '独立故事',
    folk_tale: '民间故事',
    summer_vibes: '夏日氛围',
    winter_solitude: '冬日孤寂',
    spring_awakening: '春日觉醒',
    autumn_melancholy: '秋日忧郁',
    ocean_dreams: '海洋之梦',
    dark: '暗黑',
    epic: '史诗',
    romantic: '浪漫',
    nostalgic: '怀旧',
    energetic: '活力',
    dreamy: '梦幻',
    modern: '现代',
    ghost_love: '人鬼情未了',
    supernatural: '灵异超自然'
  };
  return translations[theme] || theme;
}

function _formatNetworkLayerOutput(baseResult, foundation, melody, expression, effects) {
  return `[LAYER: FOUNDATION]\n${foundation}\n\n[LAYER: MELODY]\n${melody}\n\n[LAYER: EXPRESSION]\n${expression}\n\n[LAYER: EFFECTS]\n${effects}\n\n${baseResult.fullText}`;
}

function _formatTimeSectionOutput(sections) {
  return sections.map(s => {
    const dynamicDesc = s.dynamicLevel ? ` [动态: ${s.dynamicLevel.name}]` : '';
    const instrumentsStr = s.instruments ? `\n[乐器: ${s.instruments.join(', ')}]` : '';
    const timeSpaceStr = s.timeSpace ? `\n[${s.timeSpace.name}]` : '';

    return `${s.timeSection}${dynamicDesc}${instrumentsStr}${timeSpaceStr}\n${s.content}`;
  }).join('\n\n');
}

function _buildInstrumentTimeline(sections) {
  return sections.map(s => ({
    time: _formatTime(s.startTime),
    instruments: s.instruments,
    timeSpace: s.timeSpace?.name || 'fusion'
  }));
}

function _analyzeLiteraryDevices(sections) {
  const devices = { metaphor: 0, personification: 0, imagery: 0, repetition: 0 };

  sections.forEach(section => {
    const lines = section.content.split('\n');
    lines.forEach(line => {
      if (line.includes('如') || line.includes('似') || line.includes('若') || line.includes('像')) devices.metaphor++;
      if (line.includes('听') || line.includes('看') || line.includes('说') || line.includes('低语') || line.includes('诉')) devices.personification++;
      if (line.match(/(雨|风|月|星|光|影|声|水|花|云|山|川|草|木|夜|寒|冷)/)) devices.imagery++;
    });
  });

  return devices;
}

function _analyzeEmotionalArc(sections) {
  const arc = [];
  let intensity = 0.3;

  sections.forEach((section, index) => {
    const type = section.type;

    if (type.includes('intro')) intensity = 0.3;
    else if (type.includes('verse')) intensity = 0.4;
    else if (type.includes('pre_chorus')) intensity = 0.5;
    else if (type.includes('chorus')) intensity = 0.7;
    else if (type.includes('bridge')) intensity = 0.5;
    else if (type.includes('final')) intensity = 0.8;
    else if (type.includes('outro') || type.includes('finale') || type.includes('ending')) intensity = 0.3;
    else intensity = Math.min(intensity + 0.1, 0.6);

    const prevIntensity = arc[index - 1]?.intensity || intensity;

    arc.push({
      section: type,
      intensity,
      progression: intensity > prevIntensity ? 'rising' :
        intensity < prevIntensity ? 'falling' : 'stable'
    });
  });

  return arc;
}

function _analyzeRhymeScheme(sections) {
  return sections.map(section => {
    const lines = section.content.split('\n').filter(l => l.trim());
    const endings = lines.map(line => line.slice(-1));
    const uniqueEndings = [...new Set(endings)];
    const mapping = {};
    let currentLetter = 'A';

    const scheme = endings.map(end => {
      if (!mapping[end]) mapping[end] = currentLetter++;
      return mapping[end];
    });

    return { section: section.type, lines: lines.length, rhymeScheme: scheme.join('') };
  });
}

/* =========================================================================
 * NETWORK LAYER BUILDERS (dynamic - no hardcoded NETWORK_LAYER_CONFIG)
 * Each builder fills template strings with random selections drawn from the
 * dynamic theme bank / style list. No pre-written command phrases.
 * ========================================================================= */

function _pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function _buildFoundationLayer(bpm, theme, params) {
  const bank = getThemeBank(theme);
  const beats = ['4/4拍子基础节拍', 'waltz三拍子探戈节拍', '电子碎拍', '古典华尔兹3/4拍'];
  const rhythms = ['稳定律动', '跳转节奏', '摇摆节奏', '断奏节奏'];
  const styles = getDynamicStyles();
  const beat = _pick(beats);
  const rhythm = _pick(rhythms);
  const styleName = params.style || _pick(styles) || '流行';
  const themeDesc = _translateTheme(theme);
  const imagery = _pick(bank.imagery);
  return `底层节拍: ${bpm}bpm基础律动, 围绕${themeDesc}主题构建稳定的${beat}, ${rhythm}搭配${styleName}风格, 以${imagery}意象铺底`;
}

function _buildMelodyLayer(theme, params) {
  const bank = getThemeBank(theme);
  const melodyStyles = ['跳转的主旋律', '流畅的旋律线条', '戏剧性的旋律起伏', '空灵的旋律'];
  const elements = ['classical elements', 'surrounding element的空灵和穿透感', '电子合成器铺底', '弦乐伴奏'];
  const melodyStyle = _pick(melodyStyles);
  const element = _pick(elements);
  const feeling = _pick(bank.emotions);
  const reference = _pick(bank.subjects);
  const action = _pick(bank.actions);
  return `旋律层: ${melodyStyle}, 表达${feeling}情绪, 配合${element}, 呼应${reference}${action}的意象`;
}

function _buildExpressionLayer(theme, params) {
  const bank = getThemeBank(theme);
  const vocals = ['人声', '多重人声叠录', '气声呢喃', '戏剧化唱腔'];
  const harmonies = ['和声层层叠叠递进', '合唱团烘托', '独唱与合唱交替', '男女混唱'];
  const sfx = ['环境音效与人声交织', '教堂混响', '电影级Foley音效', '空间混响'];
  const features = ['情感层次分明', '动态对比强烈', '细腻叙事', '爆发式释放'];
  const emotionTheme = _pick(bank.emotions);
  const vocal = _pick(vocals);
  const harmony = _pick(harmonies);
  const sfxItem = _pick(sfx);
  const feature = _pick(features);
  return `表现层: ${vocal}与${harmony}, 深度诠释${emotionTheme}情绪, 体现${feature}, ${sfxItem}点缀`;
}

function _buildEffectsLayer(params) {
  const introEffects = ['混响、延迟、调制效果', 'Shimmer Reverb星光混响', 'Di-Da Delay滴答延迟', '空间混响渐入'];
  const atmospheres = ['柔和氛围', '空灵氛围', '暗黑压抑氛围', '教堂空旷声场'];
  const finalElements = ['surrounding elements的声音设计', '电影级音效设计', '立体声场包裹', '层次化音效整合'];
  const effectsList = ['Church Acoustics教堂声场', 'Shimmer Reverb星光混响', 'Di-Da Delay滴答延迟', 'Stereo Field立体声场'];
  const introEffect = _pick(introEffects);
  const atmosphere = _pick(atmospheres);
  const finalElement = _pick(finalElements);
  const effectsItem = _pick(effectsList);
  return `效果层: ${introEffect}, 营造${atmosphere}, 整合${finalElement}, ${effectsItem}收尾`;
}

/* =========================================================================
 * VARIATION OUTPUT (dynamic - no hardcoded STYLE_VARIATIONS)
 * Generates variation descriptions from the dynamic style config.
 * ========================================================================= */

function _formatVariationOutput(baseResult, variationKey, genre, theme) {
  const variationLabels = { A: '原味复刻', B: '情绪放大', C: '风格变奏' };
  const label = variationLabels[variationKey] || '变奏';
  const styles = getDynamicStyles();
  const styleName = genre || _pick(styles) || '流行';
  const bpm = 90 + Math.floor(Math.random() * 60);
  const instruments = INSTRUMENT_TIME_SPACE.fusion.instruments.slice(0, 3);
  const themeDesc = _translateTheme(theme);
  const header = `[变奏：${label} (${variationKey})]\n\n风格：${styleName}变奏, ${bpm}BPM, 围绕${themeDesc}主题\n乐器：${instruments.join(', ')}\n\n`;
  return header + baseResult.fullText;
}

/* =========================================================================
 * GENERATION ENTRY POINTS
 * All lyric generation is delegated to the dynamic engine. No hardcoded
 * lyric pools remain in this file.
 * ========================================================================= */

function generateBasic(genre, theme, params) {
  // Delegate to dynamic engine - no hardcoded lyrics
  return generateDynamicLyrics({
    genre,
    theme,
    method: 'basic',
    complexity: params?.complexity || 5
  });
}

export function generateLyrics(params) {
  // Delegate to dynamic engine - no hardcoded lyrics
  return generateDynamicLyrics(params);
}

export function getGenres() {
  return Object.keys(STRUCTURES);
}

export function getThemes() {
  return getDynamicThemes();
}
