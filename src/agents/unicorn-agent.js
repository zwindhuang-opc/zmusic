/**
 * Unicorn Agent - 独角兽智能创作代理
 * 
 * 融合 Muse AI 风格生成、Suno AI 格式输出、Melosample 网络层架构，
 * 实现歌词的自动生成与优化，支持动态控制、时间分段、风格变体等高级特性。
 * 
 * @module agents/unicorn-agent
 * @version 7.0.0
 * @author ZMusic Team
 */

import Logger from '../utils/logger.js';

const logger = new Logger('UnicornAgent');

const POETIC_WORDS = {
  nature: ['月光', '星辰', '微风', '细雨', '落花', '流水', '孤雁', '残雪', '霜叶', '寒江'],
  emotion: ['心碎', '泪痕', '痴狂', '寂寥', '惆怅', '迷茫', '眷恋', '思念', '叹息', '沉醉'],
  time: ['流年', '往事', '回忆', '瞬间', '永恒', '刹那', '岁月', '时光', '昨日', '今朝'],
  abstract: ['梦', '影', '空', '幻', '真', '假', '缘', '劫', '道', '禅'],
  love: ['温柔', '缠绵', '誓言', '缘分', '相思', '情深', '眷恋', '挚爱', '永恒', '瞬间']
};

const TANGO_LYRICS_TEMPLATES = {
  intro: [
    ['夜雨轻敲长街冷', '踏碎水中明月影'],
    ['寒风吹过孤巷深', '残灯摇曳映泪痕'],
    ['暮色渐沉天际远', '独步街头无人伴']
  ],
  verse: [
    ['风透薄衣侵骨冷', '指尖触得琉璃寒', '我言此身犹未冷', '却抱双肩'],
    ['雨丝缠绵绕心头', '往事如烟难回首', '笑说此恨已尘封', '泪湿衣袖'],
    ['霓虹闪烁映孤影', '繁华落尽人独行', '举杯消愁愁更愁', '醉眼朦胧']
  ],
  pre_chorus: [
    ['举头望 孤月悬九天', '它静默 只将清辉洒遍', '无处遁形是伪装', '如审判的眼'],
    ['抬头看 繁星缀满空', '它不语 只把心事藏', '所有伪装都剥落', '如镜中模样'],
    ['回首望 往事如云烟', '它消散 不留一丝痕迹', '唯有孤独常相伴', '如影随形']
  ],
  chorus: [
    ['雨中共跳一支探戈', '影随我 一步一退相牵扯', '言不痛 泪却悄然落', '笑泪痴狂 明月都记得'],
    ['风中共舞一曲华尔兹', '身随乐 一进一退相纠缠', '说不在乎 心却在滴血', '爱恨交织 繁星都看见'],
    ['夜中共唱一首悲歌', '声随泪 一起一落相呼应', '道离别 情却难割舍', '生死相依 天地都作证']
  ],
  bridge: [
    ['风在听 雨在看', '步步踩在 理智边缘', '明月它 什么都知道', '却不肯 一语道穿'],
    ['星在闪 云在飘', '句句唱在 心碎边缘', '时光它 什么都看透', '却不愿 回头留恋'],
    ['灯在灭 人在散', '声声叹在 绝望边缘', '命运它 什么都安排', '却不让 真心如愿']
  ],
  outro: [
    ['足音渐远去', '风雨未曾歇', '明月还悬在天际', '静静照彻'],
    ['身影渐消失', '灯火已熄灭', '繁星还缀满夜空', '默默注视'],
    ['歌声渐沉寂', '故事已落幕', '时光还在流转', '永不停止']
  ]
};

const ANCIENT_MODERN_LYRICS_TEMPLATES = {
  intro_ancient: [
    ['峨峨兮，泰山云外客', '洋洋兮，江河掌中波'],
    ['巍巍兮，昆仑雪皑皑', '浩浩兮，东海浪滔滔'],
    ['萧萧兮，易水寒风起', '凄凄兮，古道马蹄疾']
  ],
  verse_ancient: [
    ['伯牙指下风雷过', '子期担柴，笑说山河', '樵夫不识宫商谱', '却把心弦，轻轻拨'],
    ['屈原江畔行吟苦', '渔父泛舟，笑问归途', '世人皆醉我独醒', '却把清白，付与江湖'],
    ['李白月下独酌酒', '举杯邀月，醉卧花间', '天子呼来不上船', '却把豪情，洒向人间']
  ],
  interlude_modern: [
    ['地铁穿城，耳机隔座', '万人擦肩，谁懂沉默？'],
    ['城市喧嚣，霓虹闪烁', '人海茫茫，谁是知音？'],
    ['网络纵横，信息交错', '千万点赞，谁懂真心？']
  ],
  verse_modern: [
    ['Muse圈里千条歌', '点赞如潮，心事成锁', '算法推来相似调', '却无一人，问我为何落泪'],
    ['直播间里万人看', '礼物刷屏，真情难见', '滤镜美颜遮住脸', '却无一人，看见我的疲惫'],
    ['社交软件满屏笑', '点赞评论，真心寥寥', '虚拟世界太喧嚣', '却无一人，听见我心在跳']
  ],
  chorus_fusion: [
    ['摔琴那刻，不是绝响', '是怕余生，再无人听懂回响', '如今我唱，不是表演', '是等一个，敢在喧嚣中静听的人啊'],
    ['举杯那刻，不是贪醉', '是怕清醒，再无人与我同醉', '如今我舞，不是炫耀', '是等一个，敢在孤独中相伴的人啊'],
    ['落笔那刻，不是矫情', '是怕沉默，再无人读懂心声', '如今我说，不是抱怨', '是等一个，敢在迷茫中同行的人啊']
  ],
  bridge_ancient: [
    ['"善哉……峨峨兮……"'],
    ['"妙哉……洋洋兮……"'],
    ['"悲哉……萧萧兮……"']
  ],
  finale_modern: [
    ['若你听见，不必回音', '只需记得：这世间最贵的礼物', '不是被万人追捧', '而是有一个人，愿意为你，按下暂停'],
    ['若你看见，不必回应', '只需明白：这世间最美的相遇', '不是众星捧月', '而是有一个人，愿意陪你，看尽风景'],
    ['若你懂得，不必言语', '只需珍惜：这世间最真的情谊', '不是山盟海誓', '而是有一个人，愿意与你，共度朝夕']
  ],
  ending_fusion: [
    ['知音难觅，故不敢轻弹', '若遇一人，便以命相还', '古今同此月，同此憾', '同此一念：懂我者，不必在千年前'],
    ['知己难求，故不敢轻言', '若得一人，便以诚相见', '天地同此心，同此愿', '同此一念：知我者，不必在天涯远'],
    ['真心难得，故不敢轻许', '若惜一人，便以情相许', '日月同此光，同此曲', '同此一念：爱我者，不必在来生缘']
  ]
};

const FSM_TEMPLATES = {
  standard: [
    { state: 'IDLE', description: '空闲状态：等待触发' },
    { state: 'INTRO', description: '前奏：极简留白，氛围营造' },
    { state: 'VERSE_1', description: '主歌一：叙事展开，情感铺垫' },
    { state: 'PRE_CHORUS', description: '预副歌：张力积累，情绪上升' },
    { state: 'CHORUS_1', description: '副歌一：情感爆发，主题呈现' },
    { state: 'VERSE_2', description: '主歌二：深化叙事，情感递进' },
    { state: 'PRE_CHORUS', description: '预副歌：再次积累，推向高潮' },
    { state: 'CHORUS_2', description: '副歌二：情感升华，主题强化' },
    { state: 'BRIDGE', description: '桥段：转折变化，情绪释放' },
    { state: 'FINAL_CHORUS', description: '终曲副歌：终极爆发，全曲高潮' },
    { state: 'OUTRO', description: '尾声：渐弱收束，余韵悠长' },
    { state: 'END', description: '结束状态：音乐终止' }
  ],
  tango: [
    { state: 'IDLE', description: '空闲状态' },
    { state: 'INTRO_FOLEY', description: '前奏音效：7-8秒风雨声+5-6秒脚步声' },
    { state: 'VERSE_1', description: '主歌一：120BPM Waltz 3/4拍，大提琴伴奏' },
    { state: 'PRE_CHORUS', description: '预副歌：班多纽手风琴进入，张力积累' },
    { state: 'CHORUS_1', description: '副歌一：完整探戈合奏，Shimmer Reverb' },
    { state: 'VERSE_2', description: '主歌二：精简编曲，脚步声短暂回归' },
    { state: 'PRE_CHORUS', description: '预副歌：弦乐渐强，Di-Da Delay' },
    { state: 'CHORUS_2', description: '副歌二：完整合奏，人声层叠' },
    { state: 'BRIDGE_LUNATIC', description: '桥段疯癫：大提琴独奏与人声交织' },
    { state: 'FINAL_CHORUS', description: '终曲副歌：爆发高潮，最大混响' },
    { state: 'OUTRO_FOLEY', description: '尾声音效：雨声持续，脚步渐远' },
    { state: 'END', description: '结束状态' }
  ],
  ancient_modern: [
    { state: 'IDLE', description: '空闲状态' },
    { state: 'INTRO_ANCIENT', description: '古时空前奏：古琴泛音独奏，极简留白' },
    { state: 'VERSE_1_ANCIENT', description: '古时空主歌：古琴按音+箫点缀' },
    { state: 'INTERLUDE_TRANSITION', description: '时空转换间奏：电子脉冲渐入' },
    { state: 'VERSE_2_MODERN', description: '今时空主歌：钢琴+合成器+弦乐' },
    { state: 'CHORUS_FUSION', description: '融合副歌：古琴+合成器交织' },
    { state: 'BRIDGE_ANCIENT', description: '古时空桥段：古琴泛音+童声吟诵' },
    { state: 'FINALE_MODERN', description: '今时空终章：钢琴+电子脉冲' },
    { state: 'ENDING_FUSION', description: '融合尾声：古琴三声+弦乐和弦' },
    { state: 'END', description: '结束状态' }
  ]
};

const TRANSITION_TRIGGERS = {
  time: '时间到达',
  chord: '和弦变化',
  emotion: '情绪阈值',
  section: '段落结束',
  manual: '手动触发',
  random: '随机触发'
};

const TRANSITION_ACTIONS = {
  keyChange: '转调',
  drumSwitch: '切换鼓组',
  reverbIncrease: '增加混响',
  tempoChange: '改变速度',
  instrumentAdd: '加入乐器',
  instrumentRemove: '移除乐器',
  dynamicShift: '动态转换',
  effectToggle: '效果器开关'
};

const NETWORK_LAYER_TEMPLATES = {
  foundation: {
    tango: '底层节拍: 120bpm基础律动, 围绕{theme}主题构建稳定的waltz三拍子探戈节拍',
    ancient_modern: '底层节拍: {bpm}bpm基础律动, 围绕{theme}主题构建稳定的{beatType}节拍',
    pop: '底层节拍: {bpm}bpm基础律动, 围绕{theme}主题构建稳定的4/4拍子流行节拍',
    rock: '底层节拍: {bpm}bpm基础律动, 围绕{theme}主题构建强力摇滚节拍',
    chinese_classical: '底层节拍: {bpm}bpm基础律动, 围绕{theme}主题构建古典韵律节拍'
  },
  melody: {
    tango: '旋律层: 以像Eason Chan孤独探戈、黑择明的主旋律线条, 表达{emotion}情绪, 配合classical elements',
    ancient_modern: '旋律层: {melodyStyle}主旋律线条, 表达{emotion}情绪, 配合{elements}',
    pop: '旋律层: {melodyStyle}主旋律线条, 表达{emotion}情绪, 配合现代流行元素',
    rock: '旋律层: 强烈的吉他主导旋律线条, 表达{emotion}情绪, 配合失真效果',
    chinese_classical: '旋律层: {melodyStyle}主旋律线条, 表达{emotion}情绪, 配合古典乐器'
  },
  expression: {
    tango: '表现层: {vocals}, 深度诠释{emotionTheme}, 体现{styleFeature}',
    ancient_modern: '表现层: {vocals}, 深度诠释{emotionTheme}, 体现{styleFeature}',
    pop: '表现层: 深情人声与和声, 深度诠释{emotionTheme}, 体现流行音乐特色',
    rock: '表现层: 爆发力人声与和声, 深度诠释{emotionTheme}, 体现摇滚力量感',
    chinese_classical: '表现层: {vocals}, 深度诠释{emotionTheme}, 体现中国古典韵味'
  },
  effects: {
    tango: '效果层: 开场的7-8秒雨水风声5-6秒脚步声混响、4-5延迟渐入人声独白、调制效果入情入境, 营造{atmosphere}, 整合{finalElements}',
    ancient_modern: '效果层: {effectsList}, 营造{atmosphere}, 整合{finalElements}',
    pop: '效果层: 混响、延迟、调制效果, 营造{atmosphere}, 整合现代音效设计',
    rock: '效果层: 失真、延迟、混响效果, 营造{atmosphere}, 整合摇滚音效设计',
    chinese_classical: '效果层: 混响、延迟、调制效果, 营造{atmosphere}, 整合古典音效设计'
  }
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

const THEME_CONFIG = {
  love: { emotion: '悲伤与深情交织', emotionTheme: '笑着流泪的癫狂', atmosphere: '柔和孤独氛围', beatType: '4/4拍子' },
  loneliness: { emotion: '夜來獨行的lonely但not solitude', emotionTheme: '黑夜的"靜"與人心中的"動"', atmosphere: '暗黑孤独氛围', beatType: 'waltz三拍子' },
  sadness: { emotion: '彻骨的悲伤', emotionTheme: '人生壯志未酬之慨嘆', atmosphere: '压抑悲伤氛围', beatType: '4/4拍子' },
  dreams: { emotion: '希望与迷茫并存', emotionTheme: '追逐梦想的执着', atmosphere: '希望之光氛围', beatType: '4/4拍子' },
  memory: { emotion: '怀旧与感慨', emotionTheme: '时光流逝的无奈', atmosphere: '温馨回忆氛围', beatType: '4/4拍子' },
  nature: { emotion: '宁静与悠远', emotionTheme: '人与自然的和谐', atmosphere: '自然空灵氛围', beatType: '古典韵律' },
  friendship: { emotion: '知音难觅的感慨', emotionTheme: '古今对话的共鸣', atmosphere: '空灵悠远氛围', beatType: '4/4拍子' },
  lunatic: { emotion: '疯癫与理智的边缘', emotionTheme: '笑着流泪的癫狂', atmosphere: '暗黑癫狂氛围', beatType: 'waltz三拍子探戈' },
  tango: { emotion: '孤独探戈的凄美', emotionTheme: '独宿人渐冷，夜来风雨凄', atmosphere: '探戈孤独氛围', beatType: 'waltz三拍子探戈' }
};

export class UnicornAgent {
  constructor(config = {}) {
    this.config = {
      enableHermes: true,
      enableOpenClaw: true,
      enableNetworkLayer: true,
      enableTimeSections: true,
      enableDynamicControl: true,
      defaultBpm: 120,
      defaultComplexity: 7,
      ...config
    };
    logger.info(`Unicorn Agent v7.0.0 initialized`);
  }

  getStatus() {
    return {
      name: 'Unicorn Agent',
      version: '7.0.0',
      features: ['FSM编程', '网络层架构', 'Muse命令', 'Suno命令', '时间分段', '风格变体'],
      fsmStructures: Object.keys(FSM_TEMPLATES).length,
      networkLayers: 4
    };
  }

  async generateLyrics(params = {}) {
    const method = params.method || 'fsm';
    const theme = params.theme || 'love';
    const style = params.style || 'tango';

    logger.info(`Generating lyrics with method: ${method}, theme: ${theme}, style: ${style}`);

    switch (method) {
      case 'fsm':
        return { taskId: `fsm-${Date.now()}`, method: 'fsm', result: this.generateFSMLyrics(theme, style, params) };
      case 'network_layer':
        return { taskId: `network-${Date.now()}`, method: 'network_layer', result: this.generateNetworkLayerCommand(theme, style, params) };
      case 'muse':
        return { taskId: `muse-${Date.now()}`, method: 'muse', result: this.generateMuseCommand(theme, style, params) };
      case 'suno':
        return { taskId: `suno-${Date.now()}`, method: 'suno', result: this.generateSunoCommand(theme, style, params) };
      case 'time_section':
        return { taskId: `time-${Date.now()}`, method: 'time_section', result: this.generateTimeSectionLyrics(theme, style, params) };
      case 'style_variation':
        return { taskId: `variation-${Date.now()}`, method: 'style_variation', result: this.generateStyleVariation(theme, style, params) };
      default:
        return { taskId: `fsm-${Date.now()}`, method: 'fsm', result: this.generateFSMLyrics(theme, style, params) };
    }
  }

  async generateMV(params = {}) {
    const duration = params.duration || 180;
    const style = params.style || 'cinematic';

    const scenes = [];
    const sceneCount = Math.ceil(duration / 30);

    for (let i = 0; i < sceneCount; i++) {
      const startTime = i * 30;
      const endTime = Math.min(startTime + 30, duration);
      scenes.push({
        index: i + 1,
        startTime: this._formatTime(startTime),
        endTime: this._formatTime(endTime),
        duration: endTime - startTime,
        style: i < sceneCount / 3 ? 'intro' : i < sceneCount * 2 / 3 ? 'main' : 'finale',
        description: `Scene ${i + 1}`
      });
    }

    return { taskId: `mv-${Date.now()}`, duration, style, scenes };
  }

  generateFSMLyrics(theme, style, params = {}) {
    const fsmName = style === 'ancient_modern' ? 'ancient_modern' : style === 'tango' ? 'tango' : 'standard';
    const states = FSM_TEMPLATES[fsmName];
    const bpm = params.bpm || this.config.defaultBpm;
    const themeConfig = THEME_CONFIG[theme] || THEME_CONFIG.love;
    const script = params.script || '';
    const language = params.language || 'zh';

    const transitions = [];
    for (let i = 0; i < states.length - 1; i++) {
      const trigger = this._pickRandom(Object.values(TRANSITION_TRIGGERS));
      const condition = this._generateTransitionCondition(states[i].state, states[i + 1].state, i, bpm);
      const action = this._pickRandom(Object.values(TRANSITION_ACTIONS));

      transitions.push({
        from: states[i].state,
        to: states[i + 1].state,
        trigger: trigger,
        condition: condition,
        action: action,
        description: `${states[i].description} → ${states[i + 1].description}`
      });
    }

    const lyrics = this._generateDynamicLyrics(theme, style, states, language);
    const fsmCommand = this._buildFSMCommand(states, transitions, lyrics, theme, style, bpm, themeConfig, script, language);

    return {
      theme,
      style,
      bpm,
      language,
      structure: fsmName,
      states: states.length,
      transitions: transitions.length,
      script: script,
      fsmDefinition: { states, transitions },
      fullText: fsmCommand,
      generatedAt: new Date().toISOString(),
      meta: {
        literaryAnalysis: this._analyzeLiteraryDevices(lyrics, theme),
        emotionalArc: this._analyzeEmotionalArc(states)
      }
    };
  }

  _generateTransitionCondition(fromState, toState, index, bpm) {
    const secondsPerBeat = 60 / bpm;
    const avgBeatsPerSection = 32;
    const secondsPerSection = secondsPerBeat * avgBeatsPerSection;
    const timeInSeconds = Math.round(index * secondsPerSection);
    const formattedTime = this._formatTime(timeInSeconds);

    const conditions = {
      INTRO: `时间到达${formattedTime}`,
      INTRO_FOLEY: `时间到达${formattedTime}`,
      INTRO_ANCIENT: `时间到达${formattedTime}`,
      VERSE_1: `时间到达${formattedTime}`,
      VERSE_1_ANCIENT: `时间到达${formattedTime}`,
      PRE_CHORUS: `情绪张力达到阈值，时间到达${formattedTime}`,
      CHORUS_1: `预副歌结束，时间到达${formattedTime}`,
      VERSE_2: `副歌一结束，时间到达${formattedTime}`,
      VERSE_2_MODERN: `间奏结束，时间到达${formattedTime}`,
      CHORUS_2: `预副歌结束，时间到达${formattedTime}`,
      CHORUS_FUSION: `今时空主歌结束，时间到达${formattedTime}`,
      BRIDGE: `副歌二结束，时间到达${formattedTime}`,
      BRIDGE_LUNATIC: `副歌二结束，时间到达${formattedTime}`,
      BRIDGE_ANCIENT: `融合副歌结束，时间到达${formattedTime}`,
      FINAL_CHORUS: `桥段结束，时间到达${formattedTime}`,
      FINALE_MODERN: `古时空桥段结束，时间到达${formattedTime}`,
      OUTRO: `终曲副歌结束，时间到达${formattedTime}`,
      OUTRO_FOLEY: `终曲副歌结束，时间到达${formattedTime}`,
      ENDING_FUSION: `今时空终章结束，时间到达${formattedTime}`,
      END: '音乐自然收束'
    };
    return conditions[toState] || conditions[fromState] || `状态${index + 1}完成`;
  }

  _generateDynamicLyrics(theme, style, states, language = 'zh') {
    const lyrics = {};

    if (style === 'tango') {
      states.forEach(state => {
        if (state.state.includes('INTRO')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(2, theme) : this._pickRandom(TANGO_LYRICS_TEMPLATES.intro);
        } else if (state.state.includes('VERSE')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(4, theme) : this._pickRandom(TANGO_LYRICS_TEMPLATES.verse);
        } else if (state.state.includes('PRE_CHORUS')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(4, theme) : this._pickRandom(TANGO_LYRICS_TEMPLATES.pre_chorus);
        } else if (state.state.includes('CHORUS')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(4, theme) : this._pickRandom(TANGO_LYRICS_TEMPLATES.chorus);
        } else if (state.state.includes('BRIDGE')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(4, theme) : this._pickRandom(TANGO_LYRICS_TEMPLATES.bridge);
        } else if (state.state.includes('OUTRO')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(2, theme) : this._pickRandom(TANGO_LYRICS_TEMPLATES.outro);
        }
      });
    } else if (style === 'ancient_modern') {
      states.forEach(state => {
        if (state.state.includes('INTRO_ANCIENT')) {
          lyrics[state.state] = this._pickRandom(ANCIENT_MODERN_LYRICS_TEMPLATES.intro_ancient);
        } else if (state.state.includes('VERSE_1_ANCIENT')) {
          lyrics[state.state] = this._pickRandom(ANCIENT_MODERN_LYRICS_TEMPLATES.verse_ancient);
        } else if (state.state.includes('INTERLUDE')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(2, theme) : this._pickRandom(ANCIENT_MODERN_LYRICS_TEMPLATES.interlude_modern);
        } else if (state.state.includes('VERSE_2_MODERN')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(4, theme) : this._pickRandom(ANCIENT_MODERN_LYRICS_TEMPLATES.verse_modern);
        } else if (state.state.includes('CHORUS_FUSION')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(4, theme) : this._pickRandom(ANCIENT_MODERN_LYRICS_TEMPLATES.chorus_fusion);
        } else if (state.state.includes('BRIDGE_ANCIENT')) {
          lyrics[state.state] = this._pickRandom(ANCIENT_MODERN_LYRICS_TEMPLATES.bridge_ancient);
        } else if (state.state.includes('FINALE_MODERN')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(4, theme) : this._pickRandom(ANCIENT_MODERN_LYRICS_TEMPLATES.finale_modern);
        } else if (state.state.includes('ENDING_FUSION')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(4, theme) : this._pickRandom(ANCIENT_MODERN_LYRICS_TEMPLATES.ending_fusion);
        }
      });
    } else {
      states.forEach(state => {
        if (state.state.includes('INTRO')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(2, theme) : this._generateRandomVerse(2, theme);
        } else if (state.state.includes('VERSE')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(4, theme) : this._generateRandomVerse(4, theme);
        } else if (state.state.includes('PRE_CHORUS')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(4, theme) : this._generateRandomVerse(4, theme);
        } else if (state.state.includes('CHORUS')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(4, theme) : this._generateRandomVerse(4, theme);
        } else if (state.state.includes('BRIDGE')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(4, theme) : this._generateRandomVerse(4, theme);
        } else if (state.state.includes('OUTRO')) {
          lyrics[state.state] = language === 'en' ? this._generateEnglishVerse(4, theme) : this._generateRandomVerse(4, theme);
        }
      });
    }

    return lyrics;
  }

  _generateRandomVerse(lineCount, theme) {
    const words = POETIC_WORDS[theme] || POETIC_WORDS.emotion;
    const natureWords = POETIC_WORDS.nature;
    const abstractWords = POETIC_WORDS.abstract;
    const lines = [];

    for (let i = 0; i < lineCount; i++) {
      const word1 = this._pickRandom(natureWords);
      const word2 = this._pickRandom(words);
      const word3 = this._pickRandom(abstractWords);
      const templates = [
        `${word1}${word2}${word3}`,
        `${word1}随风${word2}`,
        `${word2}如${word1}`,
        `${word3}深处${word2}`,
        `${word1}映${word3}`,
        `${word2}似${word1}`
      ];
      lines.push(this._pickRandom(templates));
    }

    return lines;
  }

  _generateEnglishVerse(lineCount, theme) {
    const englishThemes = {
      love: ['moonlight', 'stars', 'whispers', 'heart', 'soul', 'kiss', 'dream', 'passion', 'longing', 'eternal'],
      loneliness: ['shadow', 'night', 'silence', 'empty', 'alone', 'cold', 'dark', 'solitude', 'void', 'still'],
      friendship: ['journey', 'hand', 'light', 'hope', 'path', 'bond', 'trust', 'true', 'faith', 'walk'],
      dreams: ['light', 'fly', 'reach', 'star', 'sky', 'dream', 'hope', 'future', 'shine', 'rise'],
      sadness: ['tears', 'rain', 'pain', 'broken', 'lost', 'grief', 'cry', 'wound', 'fade', 'cold'],
      nature: ['wind', 'rain', 'sun', 'tree', 'river', 'bird', 'flower', 'mountain', 'ocean', 'cloud']
    };

    const words = englishThemes[theme] || englishThemes.love;
    const lines = [];

    const templates = [
      `${this._pickRandom(words)} in the ${this._pickRandom(['night', 'day', 'wind', 'rain'])}`,
      `${this._pickRandom(['I', 'You', 'We'])} ${this._pickRandom(['feel', 'see', 'dream', 'long for'])} ${this._pickRandom(words)}`,
      `${this._pickRandom(words)} ${this._pickRandom(['whispers', 'calls', 'dreams', 'lingers'])} like ${this._pickRandom(words)}`,
      `${this._pickRandom(['In', 'Under', 'Through'])} ${this._pickRandom(['moonlight', 'starlight', 'rain', 'darkness'])}`,
      `${this._pickRandom(['My', 'Your', 'Our'])} ${this._pickRandom(['heart', 'soul', 'mind'])} ${this._pickRandom(['aches', 'shines', 'whispers'])}`,
      `${this._pickRandom(words)} is ${this._pickRandom(['eternal', 'fading', 'burning', 'gentle'])}`,
      `${this._pickRandom(['Walk', 'Dance', 'Sing'])} with ${this._pickRandom(['me', 'you', 'hope'])}`,
      `${this._pickRandom(words)} flows ${this._pickRandom(['softly', 'wildly', 'silently'])}`,
      `${this._pickRandom(['Every', 'This', 'That'])} ${this._pickRandom(['moment', 'night', 'day'])}`,
      `${this._pickRandom(words)} never ${this._pickRandom(['dies', 'fades', 'ends'])}`
    ];

    for (let i = 0; i < lineCount; i++) {
      lines.push(this._pickRandom(templates));
    }

    return lines;
  }

  _buildFSMCommand(states, transitions, lyrics, theme, style, bpm, themeConfig, script = '', language = 'zh') {
    let command = `[FSM状态机定义]\n\n`;
    command += `主题：${this._translateTheme(theme, language)}\n`;
    command += `风格：${style}\n`;
    command += `BPM：${bpm}\n`;
    command += `语言：${language === 'zh' ? '中文' : language === 'en' ? 'English' : '中英混合'}\n`;
    command += `情绪：${themeConfig.emotion}\n\n`;

    if (script) {
      command += `【用户创作意图】\n${script}\n\n`;
    }

    command += `【状态定义】\n`;
    states.forEach((state, i) => {
      command += `${i}. ${state.state}: ${state.description}\n`;
    });

    command += `\n【状态转换规则】\n`;
    transitions.forEach((trans, i) => {
      command += `${i + 1}. IF (${trans.condition}) THEN ${trans.from} → ${trans.to}\n`;
      command += `   TRIGGER: ${trans.trigger}\n`;
      command += `   ACTION: ${trans.action}\n`;
      command += `   DESC: ${trans.description}\n\n`;
    });

    command += `【歌词内容】\n`;
    Object.entries(lyrics).forEach(([state, lines]) => {
      command += `${state}:\n`;
      lines.forEach(line => {
        command += `  ${line}\n`;
      });
      command += '\n';
    });

    command += `【FSM执行逻辑】\n`;
    command += `BEGIN\n`;
    command += `  SET_STATE(IDLE)\n`;
    command += `  WHILE NOT END:\n`;
    command += `    CHECK_TRIGGER()\n`;
    command += `    IF CONDITION_MET() THEN\n`;
    command += `      EXECUTE_ACTION()\n`;
    command += `      TRANSITION_TO_NEXT_STATE()\n`;
    command += `    END IF\n`;
    command += `  END WHILE\n`;
    command += `END\n`;

    return command;
  }

  generateNetworkLayerCommand(theme, style, params = {}) {
    const bpm = params.bpm || this.config.defaultBpm;
    const themeConfig = THEME_CONFIG[theme] || THEME_CONFIG.love;
    const script = params.script || '';
    const language = params.language || 'zh';
    const layerStyle = style === 'ancient_modern' ? 'ancient_modern' :
      style === 'tango' ? 'tango' :
        style === 'chinese_classical' ? 'chinese_classical' :
          style === 'rock' ? 'rock' : 'pop';

    const foundation = NETWORK_LAYER_TEMPLATES.foundation[layerStyle]
      .replace('{bpm}', bpm)
      .replace('{theme}', this._translateTheme(theme, language))
      .replace('{beatType}', themeConfig.beatType);

    const melody = NETWORK_LAYER_TEMPLATES.melody[layerStyle]
      .replace('{emotion}', themeConfig.emotion)
      .replace('{melodyStyle}', this._pickRandom(['跳转的主旋律', '流畅的旋律线条', '戏剧性的旋律起伏', '空灵的旋律']))
      .replace('{elements}', this._pickRandom(['classical elements', 'surrounding element的空灵和穿透感', '电子合成器铺底', '弦乐伴奏']));

    const expression = NETWORK_LAYER_TEMPLATES.expression[layerStyle]
      .replace('{emotionTheme}', themeConfig.emotionTheme)
      .replace('{styleFeature}', this._pickRandom(['古风侠剑豪情特色', '独宿人渐冷，夜来风雨凄特色', '暗黑浪漫', '精神分裂感']))
      .replace('{vocals}', this._pickRandom(['人声与和声层层叠叠递进', '风声与雨水声脚步声', '多重人声叠录', '笑声与哭腔交织']));

    const effects = NETWORK_LAYER_TEMPLATES.effects[layerStyle]
      .replace('{atmosphere}', themeConfig.atmosphere)
      .replace('{finalElements}', this._pickRandom(['一个像极月圆弯刀中的红月照天上的黑夜感入歌', 'surrounding elements的声音设计', '电影级音效设计', '精神分裂的听觉错觉']))
      .replace('{effectsList}', this._pickRandom(['Church Acoustics教堂声场', 'Shimmer Reverb星光混响', 'Di-Da Delay滴答延迟', 'Rain SFX, Wind SFX, Footsteps SFX']));

    const fsmTemplate = FSM_TEMPLATES[layerStyle === 'tango' ? 'tango' : layerStyle === 'ancient_modern' ? 'ancient_modern' : 'standard'];
    const lyrics = this._generateDynamicLyrics(theme, style, fsmTemplate, language);
    const lyricsText = Object.values(lyrics).flat().join('\n');

    let fullCommand = `[LAYER: FOUNDATION]\n${foundation}\n\n[LAYER: MELODY]\n${melody}\n\n[LAYER: EXPRESSION]\n${expression}\n\n[LAYER: EFFECTS]\n${effects}\n\n`;

    if (script) {
      fullCommand += `【用户创作意图】\n${script}\n\n`;
    }

    fullCommand += `【歌词内容】\n${lyricsText}`;

    return {
      theme,
      style,
      bpm,
      language,
      script,
      layers: { foundation, melody, expression, effects },
      fullText: fullCommand,
      generatedAt: new Date().toISOString()
    };
  }

  generateMuseCommand(theme, style, params = {}) {
    const bpm = params.bpm || this.config.defaultBpm;
    const themeConfig = THEME_CONFIG[theme] || THEME_CONFIG.love;
    const script = params.script || '';
    const language = params.language || 'zh';
    const reference = params.reference || '';

    const baseCommands = {
      tango: `创作一首探戈风格歌曲，BPM ${bpm}，主题为${this._translateTheme(theme, language)}，情绪为${themeConfig.emotion}。编曲采用120BPM Waltz三拍子探戈节拍，核心乐器采用班多纽手风琴与大提琴交织。人声采用中低音男声，前段像是在空荡教堂里的绝望低语，随着情绪推进加入癫狂的笑音和哭腔。效果使用强烈的空间混响，植入雨水、风声和脚步声，并在副歌加入Shimmer Reverb制造重影的听觉错觉。`,
      chinese_classical: `创作一首中国古典风格歌曲，BPM ${bpm}，主题为${this._translateTheme(theme, language)}，情绪为${themeConfig.emotion}。编曲采用唐清诗词古风式，叠字和弦推进，融合古典乐器与现代编曲。人声采用女声清冷叙事，情感层次分明。效果使用古琴泛音独奏，极简留白，大型超空旷混响声场。`,
      pop: `创作一首流行风格歌曲，BPM ${bpm}，主题为${this._translateTheme(theme, language)}，情绪为${themeConfig.emotion}。编曲采用现代流行制作手法，融合电子合成器与传统乐器。人声深情演绎，情感真挚。效果使用现代混音技术，平衡的声场，清晰的人声，富有层次感。`,
      rock: `创作一首摇滚风格歌曲，BPM ${bpm}，主题为${this._translateTheme(theme, language)}，情绪为${themeConfig.emotion}。编曲采用重型吉他连复段，强力鼓点，贝斯驱动。人声富有爆发力，情感充沛。效果使用失真效果，强烈的动态，现场感十足。`,
      ancient_modern: `创作一首古今融合风格歌曲，BPM ${bpm}，主题为${this._translateTheme(theme, language)}，情绪为${themeConfig.emotion}。古时空采用古琴、箫、中国大鼓等古典乐器；今时空采用合成器Pad、电子脉冲、钢琴、弦乐团等现代乐器；副歌部分古琴与合成器交织，弦乐团全编制，合唱团烘托。人声采用女声（古）与男声（今）叠唱。`
    };

    let command = baseCommands[style] || baseCommands.pop;

    if (reference) {
      command += ` 参考艺术家风格：${reference}。`;
    }

    if (script) {
      command += ` 用户创作意图：${script}。`;
    }

    const fsmTemplate = FSM_TEMPLATES[style === 'tango' ? 'tango' : style === 'ancient_modern' ? 'ancient_modern' : 'standard'];
    const lyrics = this._generateDynamicLyrics(theme, style, fsmTemplate, language);
    const lyricsText = Object.values(lyrics).flat().join('\n');

    return {
      theme,
      style,
      bpm,
      language,
      script,
      reference,
      fullText: `[MUSE-COMMAND] ${command}\n\n【歌词内容】\n${lyricsText}`,
      generatedAt: new Date().toISOString()
    };
  }

  generateSunoCommand(theme, style, params = {}) {
    const duration = params.duration || 270;
    const bpm = params.bpm || this.config.defaultBpm;
    const themeConfig = THEME_CONFIG[theme] || THEME_CONFIG.love;
    const script = params.script || '';
    const language = params.language || 'zh';

    let time = 0;
    const sections = [];
    const structure = style === 'ancient_modern' ?
      ['intro', 'verse1', 'interlude', 'verse2', 'chorus', 'bridge', 'finale', 'outro'] :
      ['intro', 'verse1', 'pre_chorus', 'chorus1', 'verse2', 'pre_chorus', 'chorus2', 'bridge', 'final_chorus', 'outro'];

    const sectionDurations = {
      intro: 30, verse1: 40, pre_chorus: 25, chorus1: 50,
      verse2: 40, chorus2: 50, bridge: 25, final_chorus: 60, outro: 30,
      interlude: 25, finale: 40
    };

    structure.forEach((sectionType, index) => {
      const sectionDuration = sectionDurations[sectionType] || 30;
      const startTime = this._formatTime(time);
      const endTime = this._formatTime(time + sectionDuration);

      const dynamic = this._getDynamicForSection(sectionType, index, structure.length);
      const instruments = this._getInstrumentsForSection(sectionType, style);
      const vocals = this._getVocalsForSection(sectionType, style);

      sections.push({
        type: sectionType,
        timeSection: this._formatSunoSection(sectionType, startTime, endTime),
        startTime: time,
        endTime: time + sectionDuration,
        dynamic,
        instruments,
        vocals,
        content: this._generateSectionContent(sectionType, theme, style, language)
      });

      time += sectionDuration;
    });

    const fullCommand = this._buildSunoCommand(sections, theme, style, bpm, themeConfig, script, language);

    return {
      theme,
      style,
      bpm,
      language,
      script,
      totalDuration: duration,
      sections,
      fullText: fullCommand,
      generatedAt: new Date().toISOString()
    };
  }

  _formatSunoSection(type, start, end) {
    const formatMap = {
      intro: `[前奏 (${start}~${end})]`,
      verse1: `[主歌一 (${start}~${end})]`,
      verse2: `[主歌二 (${start}~${end})]`,
      pre_chorus: `[预副歌 (${start}~${end})]`,
      chorus1: `[副歌一 (${start}~${end})]`,
      chorus2: `[副歌二 (${start}~${end})]`,
      bridge: `[桥段 (${start}~${end})]`,
      final_chorus: `[终曲副歌 (${start}~${end})]`,
      outro: `[尾声 (${start}~${end})]`,
      interlude: `[间奏 (${start}~${end})]`,
      finale: `[终章 (${start}~${end})]`
    };
    return formatMap[type] || `[段落 (${start}~${end})]`;
  }

  _getDynamicForSection(sectionType, index, total) {
    const progress = index / total;
    if (sectionType.includes('intro')) return 'pp';
    if (sectionType.includes('verse')) return progress < 0.3 ? 'p' : 'mp';
    if (sectionType.includes('pre_chorus')) return 'mf';
    if (sectionType.includes('chorus')) return progress < 0.7 ? 'f' : 'ff';
    if (sectionType.includes('bridge')) return 'pp→ppp';
    if (sectionType.includes('final')) return 'f→ff';
    if (sectionType.includes('outro')) return 'mp→pp';
    return 'mp';
  }

  _getInstrumentsForSection(sectionType, style) {
    const instrumentMap = {
      tango: {
        intro: ['古琴泛音独奏', 'Rain SFX', 'Wind SFX'],
        verse: ['Cello backing', 'Bandoneon'],
        pre_chorus: ['Bandoneon enters', 'Strings swelling'],
        chorus: ['Full Classical Tango ensemble', 'Shimmer Reverb'],
        bridge: ['Cello Solo', 'Vocals'],
        outro: ['Rain continuing', 'Footsteps fading']
      },
      ancient_modern: {
        intro: ['古琴泛音独奏'],
        verse1: ['古琴按音散音', '箫长音点缀'],
        interlude: ['电子脉冲渐入', 'Synth Pad低沉嗡鸣'],
        verse2: ['钢琴高音单音', 'Synth Pad', '弦乐团极弱铺底'],
        chorus: ['古琴散音轮奏', '合成器大气弦乐Pad', '弦乐团全编制', '合唱团'],
        bridge: ['古琴泛音', '风声采样'],
        finale: ['钢琴单音', '电子脉冲渐弱', '古琴最后一个按音'],
        outro: ['古琴单音三声', '弦乐团最后一个和弦']
      },
      pop: {
        intro: ['钢琴前奏', '合成器Pad'],
        verse: ['钢琴伴奏', '轻柔鼓点'],
        pre_chorus: ['合成器升调', '鼓点加强'],
        chorus: ['完整乐队', '和声'],
        bridge: ['钢琴独奏', '人声'],
        outro: ['渐弱收束']
      },
      rock: {
        intro: ['吉他Riff', '鼓点'],
        verse: ['节奏吉他', '贝斯', '鼓'],
        pre_chorus: ['吉他失真', '鼓点密集'],
        chorus: ['重型吉他', '强力鼓点', '人声爆发'],
        bridge: ['吉他独奏', '贝斯'],
        outro: ['渐弱收束']
      }
    };
    return instrumentMap[style]?.[sectionType] || ['Piano', 'Strings'];
  }

  _getVocalsForSection(sectionType, style) {
    const vocalMap = {
      tango: {
        intro: '无',
        verse: '中低音男声，教堂声场',
        pre_chorus: '轻微颤抖，压抑悲伤',
        chorus: '爆发式演唱，哭腔',
        bridge: '笑泪交织，失控',
        outro: '疲惫叹息，渐弱'
      },
      ancient_modern: {
        intro: '无',
        verse1: '女声清冷叙事',
        interlude: '无',
        verse2: '男声叙事，略带疲惫',
        chorus: '女声+男声叠唱',
        bridge: '童声吟诵',
        finale: '男声低语',
        outro: '女声低吟+男声低语交替'
      },
      pop: {
        intro: '无',
        verse: '深情演唱',
        pre_chorus: '情绪上升',
        chorus: '爆发力演唱',
        bridge: '细腻表达',
        outro: '轻柔收尾'
      },
      rock: {
        intro: '无',
        verse: '压抑低语',
        pre_chorus: '情绪积累',
        chorus: '嘶吼爆发',
        bridge: '深情演唱',
        outro: '渐弱收尾'
      }
    };
    return vocalMap[style]?.[sectionType] || '深情演唱';
  }

  _generateSectionContent(sectionType, theme, style, language = 'zh') {
    const fsmTemplate = FSM_TEMPLATES[style === 'tango' ? 'tango' : style === 'ancient_modern' ? 'ancient_modern' : 'standard'];
    const lyrics = this._generateDynamicLyrics(theme, style, fsmTemplate, language);

    const stateMap = {
      intro: ['INTRO', 'INTRO_FOLEY', 'INTRO_ANCIENT'],
      verse1: ['VERSE_1', 'VERSE_1_ANCIENT'],
      verse2: ['VERSE_2', 'VERSE_2_MODERN'],
      pre_chorus: ['PRE_CHORUS'],
      chorus1: ['CHORUS_1', 'CHORUS_FUSION'],
      chorus2: ['CHORUS_2', 'CHORUS_FUSION'],
      bridge: ['BRIDGE', 'BRIDGE_LUNATIC', 'BRIDGE_ANCIENT'],
      final_chorus: ['FINAL_CHORUS'],
      finale: ['FINALE_MODERN'],
      outro: ['OUTRO', 'OUTRO_FOLEY', 'ENDING_FUSION'],
      interlude: ['INTERLUDE_TRANSITION']
    };

    for (const state of stateMap[sectionType] || []) {
      if (lyrics[state]) {
        return lyrics[state];
      }
    }

    return language === 'en' ? this._generateEnglishVerse(4, theme) : this._generateRandomVerse(4, theme);
  }

  _buildSunoCommand(sections, theme, style, bpm, themeConfig, script = '', language = 'zh') {
    let command = `[风格标签：${style === 'ancient_modern' ? '古今对话,古风电音,诗意叙事' :
      style === 'tango' ? '探戈华尔兹,暗黑浪漫,古典交融' :
        style === 'pop' ? '流行音乐,现代制作,情感真挚' : '摇滚音乐,力量感,爆发力'}]\n`;
    command += `[情绪：${themeConfig.emotion}]\n`;
    command += `[节奏：${bpm} BPM]\n`;
    command += `[语言：${language === 'zh' ? '中文' : language === 'en' ? 'English' : '中英混合'}]\n\n`;

    if (script) {
      command += `【用户创作意图】\n${script}\n\n`;
    }

    sections.forEach(section => {
      command += `${section.timeSection}\n`;
      command += `[动态：${DYNAMIC_LEVELS[section.dynamic]?.name || section.dynamic}]\n`;
      command += `[乐器：${section.instruments.join('、')}]\n`;
      command += `[人声：${section.vocals}]\n`;
      if (section.content && section.content.length > 0) {
        command += `${section.content.join('\n')}\n`;
      }
      command += '\n';
    });

    return command;
  }

  generateTimeSectionLyrics(theme, style, params = {}) {
    const duration = params.duration || 270;
    const bpm = params.bpm || this.config.defaultBpm;
    const themeConfig = THEME_CONFIG[theme] || THEME_CONFIG.love;

    const sections = [];
    let time = 0;

    const structure = [
      { type: 'intro', duration: 30, label: '[Intro]' },
      { type: 'verse1', duration: 40, label: '[Verse 1]' },
      { type: 'pre_chorus', duration: 25, label: '[Pre-Chorus]' },
      { type: 'chorus1', duration: 50, label: '[Chorus 1]' },
      { type: 'verse2', duration: 40, label: '[Verse 2]' },
      { type: 'pre_chorus', duration: 25, label: '[Pre-Chorus]' },
      { type: 'chorus2', duration: 50, label: '[Chorus 2]' },
      { type: 'bridge', duration: 25, label: '[Bridge]' },
      { type: 'final_chorus', duration: 60, label: '[Final Chorus]' },
      { type: 'outro', duration: 30, label: '[Outro]' }
    ];

    structure.forEach((config, index) => {
      const startTime = this._formatTime(time);
      const endTime = this._formatTime(time + config.duration);
      const dynamic = this._getDynamicForSection(config.type, index, structure.length);

      sections.push({
        type: config.type,
        label: config.label,
        startTime,
        endTime,
        duration: config.duration,
        dynamic,
        content: this._generateSectionContent(config.type, theme, style)
      });

      time += config.duration;
    });

    const fullText = sections.map(s => {
      return `${s.label} (${s.startTime}-${s.endTime}) [动态: ${DYNAMIC_LEVELS[s.dynamic]?.name || s.dynamic}]\n${s.content.join('\n')}`;
    }).join('\n\n');

    return {
      theme,
      style,
      bpm,
      totalDuration: duration,
      sections,
      fullText,
      generatedAt: new Date().toISOString()
    };
  }

  generateStyleVariation(theme, style, params = {}) {
    const variationKey = params.variation || 'A';
    const variations = {
      tango: {
        A: { name: '孤月探戈 (Lunar Waltz)', language: '粤语', bpm: 120 },
        B: { name: '红月重影 (Crimson Echoes)', language: '普通话', bpm: 120 },
        C: { name: '冷雨长街 (Cold Street Illusions)', language: '普通话', bpm: 120 }
      },
      chinese_classical: {
        A: { name: '古时空·穿越', language: '粤语/普通话混唱', bpm: 68 },
        B: { name: '今时空·都市', language: '普通话', bpm: 72 },
        C: { name: '古今叠·融合', language: '男女混唱', bpm: 70 }
      }
    };
    const styleVariations = variations[style] || variations.tango;
    const variation = styleVariations[variationKey] || styleVariations.A;

    const baseResult = this.generateFSMLyrics(theme, style, { bpm: variation.bpm, ...params });

    return {
      ...baseResult,
      variation: {
        key: variationKey,
        name: variation.name,
        language: variation.language,
        bpm: variation.bpm
      },
      fullText: `[标题：${variation.name}]\n[语言：${variation.language}]\n[BPM：${variation.bpm}]\n\n${baseResult.fullText}`,
      generatedAt: new Date().toISOString()
    };
  }

  _formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  _pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)] || '';
  }

  _translateTheme(theme, lang = 'zh') {
    const translations = {
      zh: { love: '爱情', loneliness: '孤独', sadness: '悲伤', dreams: '梦想', memory: '回忆', nature: '自然', friendship: '友情', success: '成功', hope: '希望', life: '人生', lunatic: '疯癫', tango: '探戈' },
      en: { love: 'love', loneliness: 'loneliness', sadness: 'sadness', dreams: 'dreams', memory: 'memory', nature: 'nature', friendship: 'friendship', success: 'success', hope: 'hope', life: 'life', lunatic: 'lunatic', tango: 'tango' }
    };
    return translations[lang][theme] || theme;
  }

  _analyzeLiteraryDevices(lyrics, theme) {
    const themeWords = {
      love: ['雨', '月', '风', '影', '泪', '笑', '探戈'],
      loneliness: ['寒', '孤', '独', '夜', '空', '寂'],
      friendship: ['山', '水', '知音', '弦', '琴'],
      dreams: ['星', '光', '梦', '远', '航']
    };
    const words = themeWords[theme] || ['情', '爱', '梦'];
    const totalLines = Object.values(lyrics).flat().length;

    return {
      metaphor: Math.floor(Math.random() * 5) + 2,
      personification: Math.floor(Math.random() * 3) + 1,
      imagery: words.length * 4,
      repetition: Math.floor(Math.random() * 3),
      totalLines: totalLines
    };
  }

  _analyzeEmotionalArc(states) {
    const arc = [];
    let intensity = 0.2;

    states.forEach((state, index) => {
      if (state.state.includes('CHORUS') || state.state.includes('FINAL')) intensity = Math.min(intensity + 0.3, 0.9);
      else if (state.state.includes('PRE')) intensity = 0.5;
      else if (state.state.includes('BRIDGE')) intensity = Math.max(0.2, intensity - 0.2);
      else if (state.state.includes('OUTRO')) intensity = Math.max(0.1, intensity - 0.3);
      else intensity = Math.min(intensity + 0.1, 0.4);

      arc.push({
        section: state.state,
        intensity: Math.round(intensity * 10) / 10,
        progression: index > 0 && intensity > arc[index - 1].intensity ? 'rising' :
          index > 0 && intensity < arc[index - 1].intensity ? 'falling' : 'stable'
      });
    });

    return arc;
  }
}

export default UnicornAgent;