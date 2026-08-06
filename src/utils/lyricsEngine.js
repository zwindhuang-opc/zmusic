import { generateDynamicLyrics, getThemeBank, blendBanks, getDynamicThemes, getDynamicStyles, LANGUAGE_OPTIONS } from './dynamicLyricsEngine.js';

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

/* =========================================================================
 * STYLE-SPECIFIC VOCABULARY POOLS
 * Different styles use entirely different language patterns and words.
 * ========================================================================= */

const STYLE_VOCAB = {
  pop: {
    foundationBeats: ['4/4拍流行律动', '流行电子鼓点', '轻快流行节拍', '都市流行律动'],
    foundationWords: ['青春气息', '都市感', '朗朗上口', '记忆点强烈', '抓耳副歌'],
    melodyWords: ['流畅上口', '甜美动听', '明亮悦耳', '轻快跳跃'],
    expressionWords: ['清新自然', '真挚直白', '流行唱腔', '少年感'],
    effectsWords: ['明亮混响', '清新延迟', '立体声场', '干净通透']
  },
  rock: {
    foundationBeats: ['重拍摇滚律动', '失真吉他驱动', '强力鼓点', '车库摇滚节拍'],
    foundationWords: ['爆发力', '冲击力', '硬核质感', '粗犷有力'],
    melodyWords: ['激昂高亢', '嘶吼式旋律', '吉他riff驱动', '叛逆张扬'],
    expressionWords: ['撕裂唱腔', '情感爆发', '嘶吼宣泄', '力量感十足'],
    effectsWords: ['过载失真', '强烈压缩', '大厅混响', '磁带饱和']
  },
  electronic: {
    foundationBeats: ['电子合成器律动', 'EDM四四拍', '合成器贝斯线', 'Future Bass节拍'],
    foundationWords: ['未来感', '科技感', '霓虹氛围', '赛博朋克'],
    melodyWords: ['合成器主音', '琶音旋律', '像素风旋律', '梦幻电子'],
    expressionWords: ['电音人声切片', '自动调谐', '机器人声', '电子吟唱'],
    effectsWords: ['Sidechain压缩', '滤波器扫频', '延迟反馈', '混响尾音']
  },
  hip_hop: {
    foundationBeats: ['嘻哈鼓点律动', 'Trap 808贝斯', 'Boom Bap节拍', '爵士嘻哈律动'],
    foundationWords: ['街头感', '地下氛围', '节奏感强烈', 'Flow驱动'],
    melodyWords: ['采样旋律', 'Loop循环', '爵士和弦', '灵魂乐采样'],
    expressionWords: ['说唱Flow', '押韵节奏', '即兴演唱', '人声叠录'],
    effectsWords: ['黑胶唱片噪声', '磁带抖晃', '空间混响', '滤波器效果']
  },
  ballad: {
    foundationBeats: ['抒情钢琴律动', '慢板三拍子', '弦乐铺垫', '轻柔吉他分解'],
    foundationWords: ['娓娓道来', '细腻动人', '温情脉脉', '如泣如诉'],
    melodyWords: ['婉转悠扬', '柔美抒情', '如歌如诉', '荡气回肠'],
    expressionWords: ['气声演唱', '情感细腻', '柔情万种', '深情款款'],
    effectsWords: ['大厅混响', '柔和延迟', '空气感', '温暖磁带感']
  },
  chinese_traditional: {
    foundationBeats: ['五声调式律动', '古筝琵琶节拍', '民族打击乐', '戏曲板眼'],
    foundationWords: ['古韵悠长', '典雅大气', '国风意境', '文人气息'],
    melodyWords: ['古筝悠扬', '琵琶婉转', '笛子清远', '古琴幽深'],
    expressionWords: ['戏曲唱腔', '民族唱法', '古韵吟唱', '诗词吟诵'],
    effectsWords: ['自然空间混响', '山水意境', '古宅回声', '竹林清风']
  },
  gothic_rock: {
    foundationBeats: ['哥特摇滚律动', '阴暗后朋节拍', '死亡摇滚鼓点', '厄运金属慢板'],
    foundationWords: ['暗黑压抑', '神秘诡谲', '末日氛围', '宗教感'],
    melodyWords: ['阴暗低沉', '圣咏式旋律', '管风琴肃穆', '死亡金属riff'],
    expressionWords: ['嘶吼低吟', '圣咏合唱', '恶魔低语', '哥特唱腔'],
    effectsWords: ['教堂混响', '失真墙', '延迟回响', '氛围铺垫']
  },
  ancient: {
    foundationBeats: ['古风云板节拍', '编钟雅乐', '古琴散板', '宫廷雅乐'],
    foundationWords: ['古韵流芳', '意境悠远', '禅意空灵', '山水写意'],
    melodyWords: ['古琴泛音', '箫声清远', '编钟叮咚', '琵琶如歌'],
    expressionWords: ['古风吟唱', '诗词吟诵', '戏曲念白', '文人雅唱'],
    effectsWords: ['山林空响', '溪水潺潺', '古寺钟声', '松风竹影']
  },
  jazz: {
    foundationBeats: ['爵士摇摆律动', ' Bebop 快拍', '冷爵士慢板', ' Modal Jazz'],
    foundationWords: ['即兴感', '蓝调色彩', '优雅慵懒', '夜店氛围'],
    melodyWords: ['爵士即兴', '蓝调音阶', '铜管嘹亮', '萨克斯风'],
    expressionWords: ['低吟浅唱', '爵士演唱', '即兴哼唱', '沙哑质感'],
    effectsWords: ['俱乐部混响', '温暖磁带', '真空管音色', '轻微过载']
  },
  rnb: {
    foundationBeats: ['R&B 律动', '新灵魂节拍', '90年代 R&B', '陷阱蓝调'],
    foundationWords: ['性感慵懒', '都市夜晚', '丝滑柔顺', '深夜氛围'],
    melodyWords: ['蓝调转音', '流畅婉转', '灵魂乐旋律', '柔滑如丝'],
    expressionWords: ['转音演唱', '气声演绎', '灵魂唱腔', '即兴装饰音'],
    effectsWords: ['温暖混响', '立体声加倍', '柔和延迟', '磁带温暖感']
  },
  kpop: {
    foundationBeats: ['K-Pop 律动', '电子流行节拍', '多元混合节奏', 'G-Funk 风格'],
    foundationWords: ['潮流前卫', '多元融合', '舞台感强烈', '视觉化音乐'],
    melodyWords: ['抓耳副歌', '多变旋律', '洗脑循环', '层次感强'],
    expressionWords: ['团体和声', '说唱段落', '主唱爆发', '偶像唱腔'],
    effectsWords: ['电子音效', '人声切片', '快速过渡', '冲击感强']
  },
  tango: {
    foundationBeats: ['探戈华尔兹', '班多钮手风琴律动', '3/4拍探戈', '布宜诺斯艾利斯节拍'],
    foundationWords: ['暧昧纠缠', '优雅冷峻', '热情与克制', '戏剧张力'],
    melodyWords: ['班多钮幽怨', '大提琴低吟', '探戈旋律线', '哀怨缠绵'],
    expressionWords: ['探戈唱腔', '情感张力', '低吟高唱', '戏剧化演绎'],
    effectsWords: ['老唱片质感', '舞厅混响', '手风琴共鸣', '怀旧磁带感']
  },
  indie: {
    foundationBeats: ['独立摇滚律动', '低保真节拍', '车库摇滚', '梦幻流行'],
    foundationWords: ['独立精神', '文艺气息', '疏离感', '城市边缘'],
    melodyWords: ['吉他旋律', '梦幻音墙', '低保真旋律', '漫不经心'],
    expressionWords: ['懒散演唱', '漫不经心', '神经质唱腔', '童稚感'],
    effectsWords: ['低保真噪声', '房间混响', '磁带抖动', '复古效果']
  },
  dreamy: {
    foundationBeats: ['梦幻律动', '漂浮节拍', '慢板氛围', '沉浸式铺垫'],
    foundationWords: ['如梦似幻', '云雾缭绕', '超脱现实', '意识流动'],
    melodyWords: ['漂浮旋律', '梦幻音墙', '空灵飘逸', '层层叠叠'],
    expressionWords: ['梦幻吟唱', '气声飘渺', '不食人间烟火', '如在云端'],
    effectsWords: ['长尾混响', '空间延迟', '反向音效', '立体声环绕']
  },
  dark: {
    foundationBeats: ['黑暗律动', '工业节拍', '死亡金属慢板', '阴暗氛围'],
    foundationWords: ['黑暗压抑', '末日审判', '深渊凝视', '虚无主义'],
    melodyWords: ['阴暗低沉', '不协和音', '死亡riff', '压迫感旋律'],
    expressionWords: ['死亡低吼', '黑金属嘶吼', '恶魔般吟唱', '绝望哀鸣'],
    effectsWords: ['失真过载', '洞穴混响', '工业噪声', '破碎音效']
  },
  epic: {
    foundationBeats: ['史诗交响律动', '军鼓行进', '宏大管弦乐', '电影配乐级节拍'],
    foundationWords: ['波澜壮阔', '史诗叙事', '英雄气概', '山河壮丽'],
    melodyWords: ['交响旋律', '铜管辉煌', '弦乐激昂', '英雄主题'],
    expressionWords: ['英雄高歌', '史诗合唱', '庄严吟唱', '气吞山河'],
    effectsWords: ['大厅混响', '交响声场', '铜管辉煌', '定音鼓震撼']
  },
  romantic: {
    foundationBeats: ['浪漫华尔兹', '柔情钢琴', '烛光晚餐节拍', '心随律动'],
    foundationWords: ['浪漫温馨', '甜蜜幸福', '花前月下', '柔情蜜意'],
    melodyWords: ['甜美悦耳', '浪漫钢琴', '小提琴如歌', '柔情旋律'],
    expressionWords: ['温柔低唱', '深情告白', '甜蜜对唱', '浪漫吟唱'],
    effectsWords: ['温暖混响', '柔和延迟', '烛光氛围', '心跳节奏']
  },
  healing: {
    foundationBeats: ['治愈系律动', '自然节拍', '冥想铺垫', '雨声白噪音'],
    foundationWords: ['温暖治愈', '抚慰心灵', '阳光普照', '宁静安详'],
    melodyWords: ['柔和悦耳', '钢琴轻弹', '八音盒旋律', '自然之音'],
    expressionWords: ['治愈吟唱', '温柔耳语', '安抚之声', '宁静哼唱'],
    effectsWords: ['自然白噪', '雨声风声', '温暖混响', '空气感十足']
  },
  heartbreaking: {
    foundationBeats: ['心碎律动', '慢板哀歌', '沉默节拍', '泪滴节奏'],
    foundationWords: ['痛彻心扉', '肝肠寸断', '无法呼吸', '心如刀绞'],
    melodyWords: ['哀怨旋律', '断弦之音', '泣不成声', '悲歌一曲'],
    expressionWords: ['泣声演唱', '哽咽低吟', '心碎独白', '以泪洗面'],
    effectsWords: ['空房间混响', '电话音效果', '心碎音效', '沉默留白']
  },
  energetic: {
    foundationBeats: ['活力律动', '高速节拍', '舞曲节奏', '肾上腺素飙升'],
    foundationWords: ['热血沸腾', '活力四射', '激情澎湃', '嗨翻全场'],
    melodyWords: ['昂扬向上', '爆发式旋律', '电音高潮', '燃爆全场'],
    expressionWords: ['高唱入云', '爆发演唱', '激情呐喊', '活力满满'],
    effectsWords: ['冲击感强', '快速延迟', '明亮混响', '节拍器效应']
  },
  nostalgic: {
    foundationBeats: ['怀旧律动', '老唱片节拍', '泛黄回忆', '岁月静好'],
    foundationWords: ['往昔岁月', '旧日时光', '泛黄照片', '流年似水'],
    melodyWords: ['怀旧旋律', '老歌风味', '温暖回忆', '旧日重现'],
    expressionWords: ['怀旧演唱', '岁月质感', '低回吟唱', '往事如歌'],
    effectsWords: ['黑胶唱片噪声', '磁带抖晃', '老旧混响', '收音机效果']
  },
  time_travel: {
    foundationBeats: ['时空穿越律动', '古今交汇节拍', '时光隧道', '维度转换'],
    foundationWords: ['千年一瞬', '古今交错', '时光倒流', '前世今生'],
    melodyWords: ['时空交错旋律', '古今对话', '时光倒流之音', '维度跳跃'],
    expressionWords: ['千年吟唱', '古今对唱', '时空旅行者', '穿越时空的声音'],
    effectsWords: ['时空扭曲效果', '反向混响', '收音机调台', '维度穿越声']
  }
};

const STYLE_KEYWORDS = Object.keys(STYLE_VOCAB);

function _getStyleVocab(style) {
  return STYLE_VOCAB[style] || STYLE_VOCAB.pop;
}

/* =========================================================================
 * MULTIPLE SENTENCE TEMPLATES per layer
 * Each layer has 5+ completely different sentence structures instead of 1.
 * ========================================================================= */

const FOUNDATION_TEMPLATES = [
  (bpm, beat, styleWord, themeDesc, imagery, vocab) =>
    `${vocab ? vocab.foundationWords[0] : '底层节拍'}: ${bpm}BPM${beat}, 以${styleWord}为底色，围绕${themeDesc}主题铺展，${imagery}意象贯穿始终`,
  (bpm, beat, styleWord, themeDesc, imagery, vocab) =>
    `基础层设定: ${bpm}拍${beat}，核心情绪锚定${themeDesc}，${vocab ? vocab.foundationWords[1] : '律动'}驱动，${styleWord}质感与${imagery}相交融`,
  (bpm, beat, styleWord, themeDesc, imagery, vocab) =>
    `节拍根基: ${bpm}BPM的${beat}，${vocab ? vocab.foundationWords[2] : '简洁有力'}的${styleWord}骨架，承载${themeDesc}的情感重量，${imagery}为其注入灵魂`,
  (bpm, beat, styleWord, themeDesc, imagery, vocab) =>
    `律动底座: ${bpm}拍${beat}铺底，${vocab ? vocab.foundationWords[0] : '稳定'}的${styleWord}根基，${themeDesc}主题层层递进，${imagery}意象在节拍中回响`,
  (bpm, beat, styleWord, themeDesc, imagery, vocab) =>
    `节奏架构: ${bpm}BPM，${beat}驱动，${vocab ? vocab.foundationWords[3] : '层次分明'}的${styleWord}设计，${themeDesc}为情感核心，${imagery}点缀其间`
];

const MELODY_TEMPLATES = [
  (melodyStyle, feeling, element, reference, action, vocab) =>
    `${vocab ? '旋律线条' : '旋律层'}: ${melodyStyle}，${vocab ? vocab.melodyWords[0] : '情感饱满'}的表达，${feeling}情绪在${element}中流淌，${reference}${action}的意象呼之欲出`,
  (melodyStyle, feeling, element, reference, action, vocab) =>
    `旋律设计: ${vocab ? vocab.melodyWords[1] : '如歌如诉'}的${melodyStyle}，${element}为其增色，${feeling}如潮水般涌动，${reference}${action}成为旋律的注脚`,
  (melodyStyle, feeling, element, reference, action, vocab) =>
    `主旋律走向: ${melodyStyle}贯穿全曲，${vocab ? vocab.melodyWords[2] : '张弛有度'}，${feeling}的起伏在${element}中得以呈现，${reference}${action}的画面感十足`,
  (melodyStyle, feeling, element, reference, action, vocab) =>
    `旋律架构: ${vocab ? vocab.melodyWords[3] : '层次丰富'}的${melodyStyle}，${element}铺陈，${feeling}层层递进，${reference}${action}成为旋律的情感锚点`,
  (melodyStyle, feeling, element, reference, action, vocab) =>
    `曲调走向: ${melodyStyle}为主线，${vocab ? vocab.melodyWords[0] : '优美动听'}，${element}与${feeling}交织，${reference}${action}在旋律中低吟浅唱`
];

const EXPRESSION_TEMPLATES = [
  (vocal, harmony, emotionTheme, feature, sfxItem, vocab) =>
    `${vocab ? '人声演绎' : '表现层'}: ${vocal}配合${harmony}，${vocab ? vocab.expressionWords[0] : '深情款款'}地诠释${emotionTheme}，${feature}是其最大亮点，${sfxItem}增添氛围感`,
  (vocal, harmony, emotionTheme, feature, sfxItem, vocab) =>
    `表现设计: ${vocab ? vocab.expressionWords[1] : '情感丰富'}的${vocal}，${harmony}层层包裹，${emotionTheme}的情绪在${feature}中爆发，${sfxItem}巧妙融入`,
  (vocal, harmony, emotionTheme, feature, sfxItem, vocab) =>
    `演唱风格: ${vocal}担当主角，${vocab ? vocab.expressionWords[2] : '张弛有度'}，${harmony}烘托，${emotionTheme}通过${feature}精准传达，${sfxItem}画龙点睛`,
  (vocal, harmony, emotionTheme, feature, sfxItem, vocab) =>
    `情感表达: ${vocab ? vocab.expressionWords[3] : '细腻入微'}的${vocal}演绎，${harmony}如影随形，${emotionTheme}是核心情感，${feature}令人印象深刻，${sfxItem}自然融入`,
  (vocal, harmony, emotionTheme, feature, sfxItem, vocab) =>
    `人声设计: ${vocal}与${harmony}交相辉映，${vocab ? vocab.expressionWords[0] : '真挚动人'}，${emotionTheme}的情感浓度通过${feature}层层递进，${sfxItem}为其增色`
];

const EFFECTS_TEMPLATES = [
  (introEffect, atmosphere, finalElement, effectsItem, vocab) =>
    `${vocab ? '声音设计' : '效果层'}: ${introEffect}开场，${vocab ? vocab.effectsWords[0] : '精心设计'}的${atmosphere}，${finalElement}贯穿全曲，${effectsItem}收束，整体听感完整`,
  (introEffect, atmosphere, finalElement, effectsItem, vocab) =>
    `效果处理: ${introEffect}奠定基调，${atmosphere}${vocab ? vocab.effectsWords[1] : '层次丰富'}，${finalElement}巧妙运用，${effectsItem}锦上添花`,
  (introEffect, atmosphere, finalElement, effectsItem, vocab) =>
    `音效架构: ${introEffect}构建空间感，${atmosphere}${vocab ? vocab.effectsWords[2] : '立体饱满'}，${finalElement}整合全局，${effectsItem}形成记忆点`,
  (introEffect, atmosphere, finalElement, effectsItem, vocab) =>
    `混音设计: ${introEffect}铺陈，${atmosphere}${vocab ? vocab.effectsWords[3] : '精致考究'}，${finalElement}贯穿始终，${effectsItem}作为收尾，余韵悠长`,
  (introEffect, atmosphere, finalElement, effectsItem, vocab) =>
    `声场塑造: ${introEffect}构建声音世界，${atmosphere}营造${vocab ? vocab.effectsWords[0] : '独特氛围'}，${finalElement}整体统筹，${effectsItem}留下余韵`
];

function _buildFoundationLayer(bpm, theme, params) {
  const bank = getThemeBank(theme);
  const styles = getDynamicStyles();
  const styleName = params.style || _pick(styles) || '流行';
  const vocab = _getStyleVocab(styleName);
  const themeDesc = _translateTheme(theme);

  const beats = vocab.foundationBeats;
  const beat = _pick(beats);
  const styleWord = _pick(vocab.foundationWords);
  const imagery = _pick(bank.imagery);

  const template = _pick(FOUNDATION_TEMPLATES);
  return template(bpm, beat, styleWord, themeDesc, imagery, vocab);
}

function _buildMelodyLayer(theme, params) {
  const bank = getThemeBank(theme);
  const styles = getDynamicStyles();
  const styleName = params.style || _pick(styles) || '流行';
  const vocab = _getStyleVocab(styleName);

  const melodyStyles = ['跳转的主旋律', '流畅的旋律线条', '戏剧性的旋律起伏', '空灵的旋律', '如歌的旋律线', '层叠的旋律走向'];
  const elements = ['classical elements', 'surrounding element的空灵和穿透感', '电子合成器铺底', '弦乐伴奏', '吉他分解', '钢琴琶音'];
  const melodyStyle = _pick(melodyStyles);
  const element = _pick(elements);
  const feeling = _pick(bank.emotions);
  const reference = _pick(bank.subjects);
  const action = _pick(bank.actions);

  const template = _pick(MELODY_TEMPLATES);
  return template(melodyStyle, feeling, element, reference, action, vocab);
}

function _buildExpressionLayer(theme, params) {
  const bank = getThemeBank(theme);
  const styles = getDynamicStyles();
  const styleName = params.style || _pick(styles) || '流行';
  const vocab = _getStyleVocab(styleName);

  const vocals = ['人声', '多重人声叠录', '气声呢喃', '戏剧化唱腔', '低吟浅唱', '真情独白'];
  const harmonies = ['和声层层叠叠递进', '合唱团烘托', '独唱与合唱交替', '男女混唱', '和声呼应', '和声包裹'];
  const sfx = ['环境音效与人声交织', '教堂混响', '电影级Foley音效', '空间混响', '自然白噪', '氛围铺陈'];
  const features = ['情感层次分明', '动态对比强烈', '细腻叙事', '爆发式释放', '张弛有度', '以情带声'];
  const emotionTheme = _pick(bank.emotions);
  const vocal = _pick(vocals);
  const harmony = _pick(harmonies);
  const sfxItem = _pick(sfx);
  const feature = _pick(features);

  const template = _pick(EXPRESSION_TEMPLATES);
  return template(vocal, harmony, emotionTheme, feature, sfxItem, vocab);
}

function _buildEffectsLayer(params) {
  const styles = getDynamicStyles();
  const styleName = params.style || _pick(styles) || '流行';
  const vocab = _getStyleVocab(styleName);

  const introEffects = ['混响、延迟、调制效果', 'Shimmer Reverb星光混响', 'Di-Da Delay滴答延迟', '空间混响渐入', '磁带饱和暖身', '白噪渐入'];
  const atmospheres = ['柔和氛围', '空灵氛围', '暗黑压抑氛围', '教堂空旷声场', '温暖空间', '赛博朋克感'];
  const finalElements = ['surrounding elements的声音设计', '电影级音效设计', '立体声场包裹', '层次化音效整合', '三维空间设计', '沉浸式声场'];
  const effectsList = ['Church Acoustics教堂声场', 'Shimmer Reverb星光混响', 'Di-Da Delay滴答延迟', 'Stereo Field立体声场', 'Tape Saturation磁带饱和', 'Spring Reverb弹簧混响'];
  const introEffect = _pick(introEffects);
  const atmosphere = _pick(atmospheres);
  const finalElement = _pick(finalElements);
  const effectsItem = _pick(effectsList);

  const template = _pick(EFFECTS_TEMPLATES);
  return template(introEffect, atmosphere, finalElement, effectsItem, vocab);
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
    complexity: params?.complexity || 5,
    language: params?.language || 'zh'
  });
}

export function generateLyrics(params) {
  // Delegate to dynamic engine - no hardcoded lyrics
  return generateDynamicLyrics(params);
}

export function getGenres() {
  return Object.keys(STRUCTURES);
}

export function getThemes(language = 'zh') {
  return getDynamicThemes(language);
}

export function getLanguageOptions() {
  return LANGUAGE_OPTIONS;
}
