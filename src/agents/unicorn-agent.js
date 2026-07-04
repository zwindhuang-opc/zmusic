/**
 * Unicorn Agent - 独角兽智能创作代理
 * 
 * 融合 Muse AI 风格生成、Suno AI 格式输出、Melosample 网络层架构，
 * 实现歌词的自动生成与优化，支持动态控制、时间分段、风格变体等高级特性。
 * 
 * @module agents/unicorn-agent
 * @version 5.0.0
 * @author ZMusic Team
 */

import Logger from '../utils/logger.js';

const logger = new Logger('UnicornAgent');

// ============================================
// Muse AI 风格命令配置
// ============================================
const MUSE_STYLE_COMMANDS = {
  pop: {
    template: '创作一首{complexity}的{style}风格的歌曲, BPM {bpm}, 主题为{theme}, 情绪为{emotion}, {instruments}, 子风格为{subgenre}, {vocals}, {production}, {mixing}',
    styles: ['流行', '现代流行', '电子流行', '独立流行'],
    emotions: ['温暖', '欢快', '动感', '浪漫', '抒情'],
    instruments: ['包含钢琴和吉他', '融合电子合成器', '使用弦乐四重奏', '加入打击乐'],
    subgenres: ['浩室', '迪斯科', '放克', 'R&B'],
    vocals: ['极其精心地演唱', '深情地演绎', '富有感染力地表达', '细腻地诠释'],
    production: ['融合现代编曲手法', '采用复古合成器音色', '运用先进的声音设计'],
    mixing: ['极其精心地混音', '平衡的声场', '清晰的人声', '富有层次感']
  },
  rock: {
    template: '创作一首{complexity}的摇滚歌曲, BPM {bpm}, 主题为{theme}, 情绪为{emotion}, {instruments}, {production}',
    styles: ['经典摇滚', '另类摇滚', '独立摇滚', '朋克摇滚'],
    emotions: ['激情', '反叛', '力量', '愤怒', '热血'],
    instruments: ['重型吉他连复段', '强力鼓点', '贝斯驱动', '失真效果'],
    production: ['粗犷的音色', '强烈的动态', '现场感十足']
  },
  chinese_classical: {
    template: '创作一首{complexity}的中国古典风格歌曲, BPM {bpm}, 主题为{theme}, 情绪为{emotion}, {instruments}, {production}',
    styles: ['古风', '中国风', '古典', '民乐'],
    emotions: ['悠远', '空灵', '婉约', '豪迈', '深情'],
    instruments: ['古筝', '琵琶', '二胡', '笛子', '古琴'],
    production: ['古典韵味', '民族乐器融合', '古韵悠长']
  },
  ballad: {
    template: '创作一首{complexity}的抒情歌曲, BPM {bpm}, 主题为{theme}, 情绪为{emotion}, {instruments}, {production}',
    styles: ['抒情民谣', '钢琴抒情', '吉他抒情', '管弦乐抒情'],
    emotions: ['悲伤', '思念', '温柔', '深情', '怀旧'],
    instruments: ['钢琴独奏', '吉他伴奏', '弦乐伴奏', '钢琴与弦乐'],
    production: ['细腻的编曲', '柔和的音色', '情感真挚']
  },
  electronic: {
    template: '创作一首{complexity}的电子音乐, BPM {bpm}, 主题为{theme}, {instruments}, {production}, {effects}',
    styles: ['深度浩室', '电子舞曲', '氛围电子', '实验电子'],
    instruments: ['合成器', '采样', '电子鼓', '琶音'],
    production: ['现代电子制作', '复杂的声音设计', '多层次编曲'],
    effects: ['混响与回响', '延迟效果', '调制效果', '滤波器']
  },
  love_song: {
    template: '创作一首{complexity}的{style}风格情歌, BPM {bpm}, 主题为{theme}, 情绪为{emotion}, {instruments}, {vocals}, {production}',
    styles: ['浪漫', '甜蜜', '深情', '悲伤'],
    emotions: ['甜蜜', '思念', '心碎', '幸福', '深情'],
    instruments: ['钢琴', '吉他', '小提琴', '萨克斯'],
    vocals: ['深情演唱', '温柔表达', '细腻诠释', '情感丰富'],
    production: ['浪漫编曲', '温馨氛围', '情感真挚']
  },
  tango: {
    template: '创作一首{complexity}的探戈风格歌曲, BPM {bpm}, 主题为{theme}, 情绪为{emotion}, {instruments}, {vocals}, {production}',
    styles: ['古典探戈', '现代探戈', '探戈华尔兹', '暗黑探戈'],
    emotions: ['孤独', '悲伤', '癫狂', '深情', '压抑'],
    instruments: ['班多纽手风琴', '大提琴', '小提琴', '钢琴', '低音贝斯'],
    vocals: ['中低音男声', '教堂混响人声', '低语式演唱', '癫狂哭腔'],
    production: ['120 BPM Waltz 3/4拍', '教堂声场', 'Shimmer Reverb星光混响', 'Di-Da Delay滴答延迟']
  },
  gothic_rock: {
    template: '创作一首{complexity}的哥特摇滚歌曲, BPM {bpm}, 主题为{theme}, 情绪为{emotion}, {instruments}, {vocals}, {production}',
    styles: ['哥特摇滚', '暗黑交响', '哥特金属', '暗潮'],
    emotions: ['压抑', '疯狂', '毁灭', '绝望', '癫狂'],
    instruments: ['重型管弦乐团', '失真电吉他', '重型底鼓', '压迫感弦乐'],
    vocals: ['多重人声叠录', '精神分裂式演唱', '压抑低语', '爆发悲鸣'],
    production: ['Oppressive Strings压迫弦乐', 'Electric Guitar Harmonics电吉他泛音', 'Layered Vocals人声层叠']
  }
};

// ============================================
// Suno AI 风格命令配置（时间分段式）
// ============================================
const SUNO_STYLE_COMMANDS = {
  pop: {
    template: '{style}风格，{complexity}，{theme}主题，BPM {bpm}，{emotion}情绪，{vocals}',
    styles: ['Pop', 'Modern Pop', 'Electronic Pop', 'Indie Pop'],
    emotions: ['warm', 'happy', 'energetic', 'romantic', 'sentimental'],
    vocals: ['male vocal', 'female vocal', 'mixed vocals', 'solo vocal']
  },
  rock: {
    template: '{style}风格，{complexity}，{theme}主题，BPM {bpm}，{emotion}情绪，{vocals}',
    styles: ['Classic Rock', 'Alternative Rock', 'Indie Rock', 'Punk Rock'],
    emotions: ['passionate', 'rebellious', 'powerful', 'angry'],
    vocals: ['male rock vocal', 'female rock vocal', 'raw vocal']
  },
  chinese_classical: {
    template: '{style}风格，{complexity}，{theme}主题，BPM {bpm}，{emotion}情绪，{vocals}',
    styles: ['Chinese Classical', 'Traditional Chinese', 'Gufeng', 'Chinese Folk'],
    emotions: ['serene', 'melancholic', 'majestic', 'tender'],
    vocals: ['traditional Chinese vocal', 'operatic vocal', 'pure vocal']
  },
  ballad: {
    template: '{style}风格，{complexity}，{theme}主题，BPM {bpm}，{emotion}情绪，{vocals}',
    styles: ['Ballad', 'Piano Ballad', 'Guitar Ballad', 'Orchestral Ballad'],
    emotions: ['sad', 'nostalgic', 'gentle', 'heartfelt'],
    vocals: ['emotional vocal', 'soft vocal', 'expressive vocal']
  },
  electronic: {
    template: '{style}风格，{complexity}，{theme}主题，BPM {bpm}，{production}',
    styles: ['Deep House', 'EDM', 'Ambient', 'Experimental Electronic'],
    production: ['complex sound design', 'layered production', 'modern electronic']
  },
  love_song: {
    template: '{style}风格，{complexity}，{theme}主题，BPM {bpm}，{emotion}情绪，{vocals}',
    styles: ['Love Song', 'Romantic Ballad', 'Sentimental Pop', 'Wedding Song'],
    emotions: ['romantic', 'sweet', 'heartbroken', 'happy'],
    vocals: ['romantic vocal', 'tender vocal', 'passionate vocal']
  },
  tango: {
    template: '{style}风格，{complexity}，{theme}主题，BPM {bpm}，{emotion}情绪，{instruments}',
    styles: ['Classical Tango', 'Tango Waltz', 'Dark Tango', 'Modern Tango'],
    emotions: ['lonely', 'melancholic', 'lunatic', 'passionate'],
    instruments: ['Bandoneon', 'Cello', 'Violin', 'Piano', 'Acoustic Bass']
  },
  gothic_rock: {
    template: '{style}风格，{complexity}，{theme}主题，BPM {bpm}，{emotion}情绪，{instruments}',
    styles: ['Gothic Rock', 'Dark Symphonic', 'Gothic Metal', 'Darkwave'],
    emotions: ['oppressive', 'manic', 'destructive', 'desperate'],
    instruments: ['Heavy Strings', 'Distorted Guitar', 'Heavy Kick', 'Oppressive Strings']
  }
};

// ============================================
// 网络层架构配置（Network Layer Architecture）
// ============================================
const NETWORK_LAYER_CONFIG = {
  foundation: {
    templates: [
      '底层节拍: {bpm}bpm基础律动, 围绕{theme}主题构建稳定的{beat}节拍',
      '底层律动: {bpm}bpm三拍子节拍, {rhythm}节奏型, {style}基础风格'
    ],
    beats: ['4/4拍子基础节拍', 'waltz三拍子探戈节拍', '电子碎拍', '古典华尔兹3/4拍'],
    rhythms: ['稳定律动', '跳转节奏', '摇摆节奏', '断奏节奏']
  },
  melody: {
    templates: [
      '旋律层: {melody_style}主旋律线条, 表达{emotion}情绪, 配合{elements}',
      '旋律层: 以像{reference}的主旋律线条, 表达{feeling}情绪, 配合{classical_elements}'
    ],
    melodyStyles: ['跳转的主旋律', '流畅的旋律线条', '戏剧性的旋律起伏', '空灵的旋律'],
    elements: ['classical elements', 'surrounding element的空灵和穿透感', '电子合成器铺底', '弦乐伴奏'],
    references: ['Eason Chan孤獨探戈、黑擇明', '古典交响乐', '现代电子音乐', '中国古典民乐'],
    feelings: ['夜來獨行的lonely但not solitude', '人到中年的不安情绪', '彻骨的悲伤', '癫狂的笑泪']
  },
  expression: {
    templates: [
      '表现层: {vocals}与{harmony}, 深度诠释{emotion_theme}, 体现{style_feature}',
      '表现层: {sfx}深度诠释{expression_theme}, 体现{feature}'
    ],
    vocals: ['人声', '风声与雨水声脚步声', '多重人声叠录', '笑声与哭腔交织'],
    harmonies: ['和声层层叠叠递进', '合唱团烘托', '独唱与合唱交替', '男女混唱'],
    emotionThemes: ['人生壯志未酬之慨嘆', '黑夜的"靜"與人心中的"動"的互双影響', '彻骨的悲伤', '笑着流泪的癫狂'],
    styleFeatures: ['古風俠劍豪情特色', '獨宿人漸冷，夜來風雨淒特色', '暗黑浪漫', '精神分裂感'],
    sfx: ['風聲与雨水声腳步聲', '环境音效与人声交织', '教堂混响', '电影级Foley音效'],
    expressionThemes: ['黑夜的"靜"與人心中的"動"的互双影響的情感', '情感层次分明', '情感爆发', '压抑与释放']
  },
  effects: {
    templates: [
      '效果层: {intro_effects}, 营造{atmosphere}, 整合{final_elements}',
      '效果层: {effects_list}, {mood_description}'
    ],
    introEffects: ['开場的7-8秒雨水風聲5-6秒腳步聲混响、4-5延迟漸入人聲獨白', '混响、延迟、调制效果', 'Shimmer Reverb星光混响', 'Di-Da Delay滴答延迟'],
    atmospheres: ['柔和孤獨氛围', '古風氛围', '暗黑压抑氛围', '教堂空旷声场'],
    finalElements: ['一个像極月圆彎刀中的紅月照天上的黑夜感入歌', 'surrounding elements的声音设计', '电影级音效设计', '精神分裂的听觉错觉'],
    effectsList: ['Church Acoustics教堂声场', 'Shimmer Reverb星光混响', 'Di-Da Delay滴答延迟', 'Rain SFX, Wind SFX, Footsteps SFX']
  }
};

// ============================================
// 动态控制配置（Dynamic Control）
// ============================================
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

// ============================================
// 风格变体配置（Style Variations）
// ============================================
const STYLE_VARIATIONS = {
  tango: {
    A: {
      name: '孤月探戈 (Lunar Waltz)',
      description: '【原味复刻：午夜剧院的低吟】',
      design: '以120BPM的传统探戈华尔兹（3/4拍）为底色，核心乐器采用班多纽手风琴（Bandoneon）与凄冷的大提琴（Cello）交织',
      vocals: '贴近Eason式的中低音男声，前段像是在空荡教堂里的绝望低语（Church Acoustics），随着"千万个我同起舞"，唱腔逐渐加入癫狂的笑音和哭腔',
      effects: '强烈的空间混响，精准植入雨水、风声和脚步声（Foley SFX），并在副歌加入Shimmer Reverb（星光混响），制造"重影"的听觉错觉',
      instruments: ['Bandoneon', 'Cello', 'Acoustic Bass', 'Piano'],
      sfx: ['Rain SFX', 'Wind SFX', 'Footsteps SFX'],
      language: '粤语'
    },
    B: {
      name: '红月重影 (Crimson Echoes)',
      description: '【情绪放大：疯癫的月下狂欢】',
      design: '把"Lunatic（疯癫）"这个特质推向极致。在探戈的骨架上，注入哥特摇滚的血液。保留三拍子律动，但底鼓更重，弦乐更加宏大、压抑',
      vocals: '从压抑的呢喃，直接撕裂成极具爆发力的悲鸣。副歌部分会运用大量的多重人声叠录（Layered Vocals），表现"千万个我同起舞"的精神分裂感',
      effects: '环境音效与尖锐的电吉他泛音交织，Di-Da Delay（滴答延迟）被设定在一种让人心慌的频率上，营造一种华丽的毁灭感',
      instruments: ['Oppressive Strings', 'Electric Guitar Harmonics', 'Heavy Kick Drum', 'Distorted Guitar'],
      sfx: ['Heavy Rain SFX', 'Wind SFX', 'Footsteps SFX', 'Bell tolling'],
      language: '普通话'
    },
    C: {
      name: '冷雨长街 (Cold Street Illusions)',
      description: '【风格变奏：迷幻的冰冷都市】',
      design: '抽离部分古典乐器，换上冰冷、下沉的合成器贝斯（Synth Bass）和Trip-Hop式的碎拍鼓点，但依然保持着探戈的摇曳感',
      vocals: '极其贴耳（Close-Mic）的演绎，仿佛歌手就在你耳边喘息。副歌部分几乎是在用气声诉说，那种"彻骨的悲伤"不在于声嘶力竭，而在于死寂',
      effects: '将Shimmer Reverb开到最大，脚步声和雨声不再是背景，而是被处理成编曲律动的一部分。一首极具现代独立艺术电影质感的都市怪谈',
      instruments: ['Synth Bass', 'Trip-Hop Drums', 'Ambient Synth', 'Minimal Piano'],
      sfx: ['Rain SFX', 'Urban Footsteps', 'City Ambience'],
      language: '普通话'
    }
  },
  chinese_classical: {
    A: {
      name: '古时空·穿越',
      description: '【古典韵味：唐宋诗词古风】',
      design: '采用唐清诗词古风式，叠字和弦推进，融合古典乐器与现代编曲',
      vocals: '女声清冷叙事，情感层次分明，从少年癫狂到中年迷茫再到顿悟看破',
      effects: '古琴泛音独奏，极简留白，大型超空旷混响声场',
      instruments: ['古琴（核心）', '箫', '中国大鼓', '二胡', '琵琶'],
      sfx: ['Wind SFX', 'Nature Ambience'],
      language: '粤语/普通话混唱'
    },
    B: {
      name: '今时空·都市',
      description: '【现代变奏：都市迷惘】',
      design: '合成器Pad、电子脉冲、钢琴、弦乐团，营造都市迷茫感',
      vocals: '男声叙事，情感6级，略带疲惫，贴近现代都市人的心境',
      effects: '电子脉冲渐入，心跳节奏，Sub Bass深沉',
      instruments: ['Synth Pad', 'Electronic Pulse', 'Piano', 'String Orchestra'],
      sfx: ['Urban Ambience', 'Electronic Noise'],
      language: '普通话'
    },
    C: {
      name: '古今叠·融合',
      description: '【时空交响：古今对话】',
      design: '古琴散音轮奏+合成器大气弦乐Pad+弦乐团全编制',
      vocals: '女声（古）+男声（今）叠唱，合唱团烘托',
      effects: '中国大鼓沉稳+电子鼓叠层，Shimmer Reverb',
      instruments: ['古琴', 'Synth Strings', 'Chinese Drums', 'Electronic Drums', 'String Orchestra', 'Choir'],
      sfx: ['Wind SFX', 'Electronic Ambience'],
      language: '男女混唱'
    }
  }
};

// ============================================
// 时间分段配置（Suno-style Time Sections）
// ============================================
const TIME_SECTION_CONFIG = {
  intro: {
    durationRange: [0, 30],
    format: '[前奏 ({start}:{end})]',
    defaultDynamic: 'pp',
    defaultInstruments: ['古琴泛音独奏', '极简留白', 'Rain SFX', 'Wind SFX']
  },
  verse1: {
    durationRange: [30, 70],
    format: '[主歌一 ({start}:{end})]',
    defaultDynamic: 'p→mp',
    defaultInstruments: ['古琴按音散音', '箫长音点缀', 'Cello backing']
  },
  interlude: {
    durationRange: [70, 95],
    format: '[间奏 ({start}:{end})]',
    defaultDynamic: 'p→mf',
    defaultInstruments: ['电子脉冲渐入', 'Synth Pad低沉嗡鸣', 'Bandoneon enters']
  },
  verse2: {
    durationRange: [95, 130],
    format: '[主歌二 ({start}:{end})]',
    defaultDynamic: 'mp',
    defaultInstruments: ['钢琴高音单音', 'Synth Pad', 'Heavy Bass']
  },
  chorus: {
    durationRange: [130, 180],
    format: '[副歌 ({start}:{end})]',
    defaultDynamic: 'f→ff',
    defaultInstruments: ['Full Classical Tango ensemble', 'String Orchestra', 'Layered Vocals']
  },
  bridge: {
    durationRange: [180, 205],
    format: '[桥段 ({start}:{end})]',
    defaultDynamic: 'pp→ppp',
    defaultInstruments: ['古琴泛音', '风声采样', 'Cello Solo']
  },
  finale: {
    durationRange: [205, 270],
    format: '[终章 ({start}:{end})]',
    defaultDynamic: 'p→mf→pp',
    defaultInstruments: ['古琴单音三声', '弦乐团最后一个和弦', 'Choir极弱长音']
  }
};

// ============================================
// 乐器时空分离配置（Instrument Time-Space Separation）
// ============================================
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

// ============================================
// 高质量诗意行库（Poetic Lines）
// ============================================
const POETIC_LINES = {
  love: {
    intro: [
      ['夜雨轻敲长街冷', '踏碎水中明月影'],
      ['孤灯映壁人影瘦', '相思一曲无人听'],
      ['夜风低语诉心事', '月光洒落满地情'],
      ['繁星点缀银河静', '思念如潮暗涌生'],
      ['几许心跳独自转', '无人察觉'],
      ['风透薄衣侵骨冷', '指尖触得琉璃寒']
    ],
    verse: [
      ['风透薄衣侵骨冷', '指尖触得琉璃寒'],
      ['我言此身犹未冷', '却抱双肩'],
      ['回眸望见旧痕迹', '泪落无声湿衣衫'],
      ['往事如烟随风散', '唯有真心永不换'],
      ['花开彼岸无人赏', '叶落深秋独自伤'],
      ['望断天涯路漫漫', '何时与君再相逢'],
      ['雨丝顺着青丝落', '喉间哽咽藏何事'],
      ['空街寂寂足音回荡', '似追问']
    ],
    pre_chorus: [
      ['举头望 孤月悬九天', '它静默 只将清辉洒遍'],
      ['无处遁形是伪装', '如审判的眼'],
      ['举头望 孤月还悬九天', '它不审判 只将清辉冷照'],
      ['所有逞强 都被看穿', '如镜反光照']
    ],
    chorus: [
      ['雨中共跳一支探戈', '影随我 一步一退相牵扯'],
      ['言不痛 泪却悄然落', '笑泪痴狂 明月都记得'],
      ['风中共跳一支探戈', '孤影为伴 它从来不语'],
      ['身虽颤抖 却说我不惧', '满月照夜 谁人非痴侣'],
      ['今生愿为你守候', '哪怕青丝变白头'],
      ['海枯石烂情依旧', '天长地久永不休'],
      ['月华将孤影拖长', '化作千万我 同起舞'],
      ['半喜半悲的重影', '在如殿夜里 游荡']
    ],
    bridge: [
      ['风在听 雨在看', '步步踩在 理智边缘'],
      ['明月它 什么都知道', '却不肯 一语道穿'],
      ['月华将孤影拖长', '化作千万我同起舞'],
      ['半喜半悲的重影', '在如殿夜里游荡'],
      ['举头望孤月悬九天', '它不审判只将清辉冷照'],
      ['所有逞强都被看穿', '如镜反光照']
    ],
    outro: [
      ['足音渐远去', '风雨未曾歇'],
      ['明月还悬在天际', '静静照彻'],
      ['相思无尽期', '此情永不移'],
      ['待到花开时', '再续前缘痴']
    ]
  },
  loneliness: {
    intro: [
      ['寒星点点映寒窗', '孤影孑立夜漫长'],
      ['风吹落叶飘零去', '唯有寂寞伴身旁'],
      ['深巷无人灯影瘦', '细雨敲窗声断肠'],
      ['冷月无声照孤影', '夜色苍茫心彷徨']
    ],
    verse: [
      ['独在异乡为异客', '每逢佳节倍思亲'],
      ['举杯邀月空对影', '醉里挑灯看剑吟'],
      ['夜深人静难入眠', '往事历历在眼前'],
      ['孤身漫步长街冷', '无人知晓我心怜'],
      ['落叶归根情难寄', '浮萍漂泊无踪迹'],
      ['红尘滚滚身似客', '何处是我安身地']
    ],
    chorus: [
      ['一人独舞在深夜', '影子相随永不灭'],
      ['笑看世间繁华歇', '独自品味离别'],
      ['月下独酌愁难解', '琴声悠悠心欲裂'],
      ['繁华落尽梦已绝', '只剩孤独伴长夜'],
      ['孤雁南飞无归期', '寒江独钓雪'],
      ['天地苍茫我独行', '何处觅知音']
    ],
    bridge: [
      ['风在听雨在看', '步步踩在理智边缘'],
      ['明月它什么都知道', '却不肯一语道穿'],
      ['红尘喧嚣皆过客', '唯有孤独是真'],
      ['繁华落尽见真淳', '独善其身'],
      ['千山万水独自闯', '风雨兼程'],
      ['待到山花烂漫时', '独自赏春']
    ],
    outro: [
      ['寒星渐隐东方白', '长夜漫漫终释怀'],
      ['孤身一人踏征程', '风雨过后见彩虹'],
      ['独影随风去', '天涯任我行'],
      ['心静自然明', '何处不风景']
    ]
  },
  sadness: {
    intro: [
      ['细雨绵绵泪潸潸', '往事如烟梦难圆'],
      ['落花流水春去也', '空留残红惹人怜'],
      ['秋风萧瑟起寒烟', '落叶飘零舞翩翩'],
      ['伤心人在伤心处', '泪洒相思满人间']
    ],
    verse: [
      ['泪如雨下落无声', '往事浮现心难平'],
      ['物是人非事事休', '欲语泪先流'],
      ['孤灯残影夜深沉', '辗转反侧到天明'],
      ['梦里寻她千百度', '醒来依旧是孤身'],
      ['声声叹息声声泪', '句句相思句句悲'],
      ['此情可待成追忆', '只是当时已惘然']
    ],
    chorus: [
      ['心碎无痕泪自流', '爱到深处方知愁'],
      ['情丝万缕剪不断', '相思成灾何时休'],
      ['痛彻心扉无人懂', '泪洒江河向东流'],
      ['爱恨交织难回首', '往事如烟付水流'],
      ['一曲悲歌诉断肠', '泪湿衣襟话凄凉'],
      ['缘来缘去终是空', '徒留伤悲在心中']
    ],
    bridge: [
      ['雨丝顺着青丝落', '喉间哽咽藏何事'],
      ['空街寂寂足音回荡', '似追问'],
      ['泪已干涸心已碎', '情已逝去爱已灭'],
      ['只剩悲伤难释怀', '独自承受'],
      ['岁月冲淡不了痛', '时间抚平不了伤'],
      ['唯有学会放下', '才能重新出发']
    ],
    outro: [
      ['雨过天晴见彩虹', '擦干眼泪向前行'],
      ['往事随风皆散去', '重新开始新旅程'],
      ['泪尽梦觉醒', '昂首向天行'],
      ['阳光总在风雨后', '明日更光明']
    ]
  },
  dreams: {
    intro: [
      ['星光璀璨照夜空', '梦想在心中涌动'],
      ['仰望银河无边际', '追逐希望向远方'],
      ['流星划过天际线', '许下心愿盼实现'],
      ['星辰大海任遨游', '梦想起航永不休']
    ],
    verse: [
      ['追逐梦想不停歇', '哪怕前路多艰险'],
      ['星光指引我前行', '风雨无阻向远方'],
      ['心中有梦天地宽', '乘风破浪勇向前'],
      ['哪怕跌倒再爬起', '永不放弃心中愿'],
      ['青春年少志高远', '不畏艰难勇攀登'],
      ['梦想花开终有时', '坚持到底定成功']
    ],
    chorus: [
      ['星光照亮人生路', '梦想引领我前行'],
      ['哪怕风雨再猛烈', '也要追逐光明'],
      ['心中有梦永不灭', '奋斗拼搏不停歇'],
      ['待到花开灿烂时', '梦想成真笑开颜'],
      ['仰望星空追梦想', '脚踏实地创辉煌'],
      ['青春无悔奋斗路', '梦想花开香满堂']
    ],
    bridge: [
      ['遥不可及又怎样', '我有勇气去闯荡'],
      ['前路迷茫又何妨', '坚持信念就有光'],
      ['现实残酷不可怕', '梦想力量最伟大'],
      ['只要心中有希望', '就能到达彼岸'],
      ['梦想是帆我是船', '乘风破浪向远方'],
      ['哪怕惊涛与骇浪', '也要到达梦的岸']
    ],
    outro: [
      ['星光引路永不息', '梦想花开终有时'],
      ['坚持到底不放弃', '成功就在眼前'],
      ['梦想成真笑开颜', '青春无悔乐无边'],
      ['星光璀璨照前程', '梦想起航向远方']
    ]
  },
  memory: {
    intro: [
      ['时光流转忆往昔', '岁月如歌永不息'],
      ['往事历历在心头', '点点滴滴难忘记'],
      ['流年似水匆匆过', '留下多少悲欢离合'],
      ['追忆往昔情依旧', '只是青春已不再']
    ],
    verse: [
      ['翻开旧相册', '往事一幕幕'],
      ['青春年少时', '梦想在追逐'],
      ['岁月不饶人', '青丝变白发'],
      ['唯有回忆里', '青春永常驻'],
      ['走过人生路', '经历风和雨'],
      ['蓦然回首时', '感慨万千缕']
    ],
    chorus: [
      ['往事如烟随风散', '回忆依旧在心间'],
      ['岁月如歌永不老', '珍惜当下每一天'],
      ['人生如梦匆匆过', '留下真情永不磨'],
      ['追忆往昔情未了', '珍惜眼前人更好'],
      ['光阴似箭催人老', '唯有真情永不老'],
      ['岁月如歌情依旧', '珍惜当下乐无忧']
    ],
    bridge: [
      ['岁月无法倒流', '往事只能回味'],
      ['珍惜眼前拥有', '才是最珍贵'],
      ['人生短暂如梦', '何必太执着'],
      ['放下过去烦恼', '快乐生活'],
      ['往事已成追忆', '未来更可期'],
      ['珍惜每分每秒', '创造新奇迹']
    ],
    outro: [
      ['往事如烟去', '岁月不停留'],
      ['珍惜眼前人', '快乐度春秋'],
      ['时光荏苒岁月流', '往事如烟不可求'],
      ['珍惜当下每一天', '幸福快乐到永远']
    ]
  },
  nature: {
    intro: [
      ['清风拂面心悠然', '流水潺潺意绵绵'],
      ['落花飘零随风舞', '浮云飘逸在天边'],
      ['山川壮丽入眼帘', '草木葱茏映心间'],
      ['天地万物皆有情', '自然美景醉人心']
    ],
    verse: [
      ['山清水秀风景美', '鸟语花香惹人醉'],
      ['漫步林间听风声', '心旷神怡不思归'],
      ['溪水潺潺映明月', '青山绿水映朝霞'],
      ['自然美景不胜收', '人间仙境乐无涯'],
      ['花开四季各芬芳', '叶落归根情意长'],
      ['自然规律不可违', '顺应天意心自安']
    ],
    chorus: [
      ['清风流水伴我行', '自然美景醉人心'],
      ['抛开烦恼与忧愁', '回归自然享安宁'],
      ['山川草木皆有情', '天地万物共生息'],
      ['人与自然和谐处', '美好生活永不息'],
      ['青山绿水是我家', '蓝天白云伴我花'],
      ['自然美景常相伴', '幸福生活乐无涯']
    ],
    bridge: [
      ['世事纷扰皆忘却', '内心浮躁已平息'],
      ['欲望纠缠皆放下', '回归自然心自怡'],
      ['心静如水映明月', '超然物外品茶香'],
      ['与自然融为一体', '感悟人生真谛'],
      ['人生苦短莫强求', '顺其自然乐无忧'],
      ['心静自然凉', '无欲则刚强']
    ],
    outro: [
      ['回归自然享安宁', '心如止水意从容'],
      ['超然物外品人生', '顺其自然乐无穷'],
      ['清风明月常相伴', '自然美景乐无边'],
      ['人生如梦亦如幻', '顺其自然心自安']
    ]
  },
  friendship: {
    intro: [
      ['峨峨兮，泰山云外客', '洋洋兮，江河掌中波'],
      ['七弦一振千山应', '唯君侧耳，识我曲中意'],
      ['伯牙指下风雷过', '子期担柴，笑说山河'],
      ['樵夫不识宫商谱', '却把心弦，轻轻拨']
    ],
    verse: [
      ['一曲未终人已默', '天地之间，只剩你我'],
      ['地铁穿城，耳机隔座', '万人擦肩，谁懂沉默？'],
      ['Muse圈里千条歌', '点赞如潮，心事成锁'],
      ['算法推来相似调', '却无一人，问我为何落泪'],
      ['屏幕亮着，夜却更黑', '满城灯火，照不亮一个"懂得"'],
      ['摔琴那刻，不是绝响', '是怕余生，再无人听懂回响']
    ],
    chorus: [
      ['如今我唱，不是表演', '是等一个，敢在喧嚣中静听的人啊'],
      ['高山还在，流水未央', '只是知音，换了模样'],
      ['不在千年，不在远方', '在你抬头，恰好接住我目光'],
      ['知音难觅，故不敢轻弹', '若遇一人，便以命相还'],
      ['古今同此月，同此憾', '同此一念：懂我者，不必在千年前'],
      ['此刻，你在', '便是高山与流水']
    ],
    bridge: [
      ['若你听见，不必回音', '只需记得：这世间最贵的礼物'],
      ['不是被万人追捧', '而是有一个人，愿意为你，按下暂停'],
      ['善哉……峨峨兮……', '童声吟诵，纯真无染']
    ],
    outro: [
      ['最后一音古琴泛音消散', '余韵10秒'],
      ['知音难觅，故不敢轻弹', '若遇一人，便以命相还'],
      ['古今同此月，同此憾', '同此一念'],
      ['懂我者，不必在千年前', '此刻，你在，便是高山与流水']
    ]
  }
};

const THEME_LINE_MAP = {
  love: 'love',
  loneliness: 'loneliness',
  sadness: 'sadness',
  dreams: 'dreams',
  memory: 'memory',
  nature: 'nature',
  friendship: 'friendship',
  success: 'dreams',
  hope: 'dreams',
  life: 'memory',
  lunatic: 'love',
  tango: 'love'
};

const FSM_STRUCTURES = {
  standard: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'final_chorus', 'outro'],
  short: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro'],
  epic: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'verse', 'chorus', 'final_chorus', 'outro'],
  tango: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
  ancient_modern: ['intro_ancient', 'verse1_ancient', 'interlude_modern', 'verse2_modern', 'chorus_fusion', 'bridge_ancient', 'finale_modern', 'ending_fusion']
};

const COMPLEXITY_LEVELS = {
  simple: '简单',
  moderate: '中等复杂度',
  complex: '复杂',
  advanced: '极其复杂',
  expert: '大师级'
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

    logger.info(`Unicorn Agent initialized (Hermes + OpenClaw + NetworkLayer + TimeSections enabled)`);
  }

  /**
   * 生成 Muse AI 风格命令
   */
  generateMuseCommand(style, theme, params = {}) {
    const commandConfig = MUSE_STYLE_COMMANDS[style] || MUSE_STYLE_COMMANDS.pop;

    const complexity = COMPLEXITY_LEVELS[params.complexity] || COMPLEXITY_LEVELS.complex;
    const bpm = params.bpm || this.config.defaultBpm;
    const emotion = this._pickRandom(commandConfig.emotions);
    const selectedStyle = this._pickRandom(commandConfig.styles);

    const command = commandConfig.template
      .replace('{complexity}', complexity)
      .replace('{style}', selectedStyle)
      .replace('{bpm}', bpm)
      .replace('{theme}', this._translateTheme(theme))
      .replace('{emotion}', emotion)
      .replace('{instruments}', commandConfig.instruments ? this._pickRandom(commandConfig.instruments) : '')
      .replace('{subgenre}', commandConfig.subgenres ? this._pickRandom(commandConfig.subgenres) : '')
      .replace('{vocals}', commandConfig.vocals ? this._pickRandom(commandConfig.vocals) : '')
      .replace('{production}', commandConfig.production ? this._pickRandom(commandConfig.production) : '')
      .replace('{mixing}', commandConfig.mixing ? this._pickRandom(commandConfig.mixing) : '')
      .replace('{effects}', commandConfig.effects ? this._pickRandom(commandConfig.effects) : '')
      .replace(/,\s+/g, ', ')
      .replace(/,\s*$/, '');

    const lyricCommand = this._generateLyricRequirements(theme, params.complexity || 'complex');

    return `[MUSE-COMMAND] ${command}。${lyricCommand}`;
  }

  /**
   * 生成 Suno AI 风格命令（带时间分段）
   */
  generateSunoCommand(style, theme, params = {}) {
    const commandConfig = SUNO_STYLE_COMMANDS[style] || SUNO_STYLE_COMMANDS.pop;

    const complexity = COMPLEXITY_LEVELS[params.complexity] || COMPLEXITY_LEVELS.complex;
    const bpm = params.bpm || this.config.defaultBpm;
    const emotion = this._pickRandom(commandConfig.emotions);
    const selectedStyle = this._pickRandom(commandConfig.styles);

    const command = commandConfig.template
      .replace('{complexity}', complexity)
      .replace('{style}', selectedStyle)
      .replace('{bpm}', bpm)
      .replace('{theme}', this._translateTheme(theme, 'en'))
      .replace('{emotion}', emotion)
      .replace('{vocals}', commandConfig.vocals ? this._pickRandom(commandConfig.vocals) : '')
      .replace('{production}', commandConfig.production ? this._pickRandom(commandConfig.production) : '')
      .replace('{instruments}', commandConfig.instruments ? this._pickRandom(commandConfig.instruments) : '')
      .replace(/,\s+/g, ', ')
      .replace(/,\s*$/, '');

    return `[SUNO-COMMAND] ${command}`;
  }

  /**
   * 生成网络层架构命令（Network Layer Architecture）
   */
  generateNetworkLayerCommand(theme, params = {}) {
    const bpm = params.bpm || 120;
    const style = params.style || 'tango';

    const foundation = this._buildFoundationLayer(bpm, theme, params);
    const melody = this._buildMelodyLayer(theme, params);
    const expression = this._buildExpressionLayer(theme, params);
    const effects = this._buildEffectsLayer(params);

    return {
      foundation,
      melody,
      expression,
      effects,
      fullCommand: `[LAYER: FOUNDATION]\n${foundation}\n\n[LAYER: MELODY]\n${melody}\n\n[LAYER: EXPRESSION]\n${expression}\n\n[LAYER: EFFECTS]\n${effects}`,
      generatedAt: new Date().toISOString()
    };
  }

  _buildFoundationLayer(bpm, theme, params) {
    const template = this._pickRandom(NETWORK_LAYER_CONFIG.foundation.templates);
    const beat = params.beat || this._pickRandom(NETWORK_LAYER_CONFIG.foundation.beats);
    const rhythm = params.rhythm || this._pickRandom(NETWORK_LAYER_CONFIG.foundation.rhythms);

    return template
      .replace('{bpm}', bpm)
      .replace('{theme}', this._translateTheme(theme))
      .replace('{beat}', beat)
      .replace('{rhythm}', rhythm)
      .replace('{style}', params.style || '古典');
  }

  _buildMelodyLayer(theme, params) {
    const template = this._pickRandom(NETWORK_LAYER_CONFIG.melody.templates);
    const melodyStyle = params.melodyStyle || this._pickRandom(NETWORK_LAYER_CONFIG.melody.melodyStyles);
    const emotion = params.emotion || '夜來獨行的lonely但not solitude';
    const elements = params.elements || this._pickRandom(NETWORK_LAYER_CONFIG.melody.elements);
    const reference = params.reference || 'Eason Chan孤獨探戈、黑擇明';
    const feeling = params.feeling || this._pickRandom(NETWORK_LAYER_CONFIG.melody.feelings);
    const classicalElements = params.classicalElements || 'classical elements';

    return template
      .replace('{melody_style}', melodyStyle)
      .replace('{emotion}', emotion)
      .replace('{elements}', elements)
      .replace('{reference}', reference)
      .replace('{feeling}', feeling)
      .replace('{classical_elements}', classicalElements);
  }

  _buildExpressionLayer(theme, params) {
    const template = this._pickRandom(NETWORK_LAYER_CONFIG.expression.templates);
    const vocals = params.vocals || this._pickRandom(NETWORK_LAYER_CONFIG.expression.vocals);
    const harmony = params.harmony || this._pickRandom(NETWORK_LAYER_CONFIG.expression.harmonies);
    const emotionTheme = params.emotionTheme || this._pickRandom(NETWORK_LAYER_CONFIG.expression.emotionThemes);
    const styleFeature = params.styleFeature || this._pickRandom(NETWORK_LAYER_CONFIG.expression.styleFeatures);
    const sfx = params.sfx || this._pickRandom(NETWORK_LAYER_CONFIG.expression.sfx);
    const expressionTheme = params.expressionTheme || this._pickRandom(NETWORK_LAYER_CONFIG.expression.expressionThemes);
    const feature = params.feature || styleFeature;

    return template
      .replace('{vocals}', vocals)
      .replace('{harmony}', harmony)
      .replace('{emotion_theme}', emotionTheme)
      .replace('{style_feature}', styleFeature)
      .replace('{sfx}', sfx)
      .replace('{expression_theme}', expressionTheme)
      .replace('{feature}', feature);
  }

  _buildEffectsLayer(params) {
    const template = this._pickRandom(NETWORK_LAYER_CONFIG.effects.templates);
    const introEffects = params.introEffects || this._pickRandom(NETWORK_LAYER_CONFIG.effects.introEffects);
    const atmosphere = params.atmosphere || this._pickRandom(NETWORK_LAYER_CONFIG.effects.atmospheres);
    const finalElements = params.finalElements || this._pickRandom(NETWORK_LAYER_CONFIG.effects.finalElements);
    const effectsList = params.effectsList || this._pickRandom(NETWORK_LAYER_CONFIG.effects.effectsList);
    const moodDescription = params.moodDescription || '营造柔和孤獨氛围';

    return template
      .replace('{intro_effects}', introEffects)
      .replace('{atmosphere}', atmosphere)
      .replace('{final_elements}', finalElements)
      .replace('{effects_list}', effectsList)
      .replace('{mood_description}', moodDescription);
  }

  /**
   * 生成带时间分段的歌词（Suno-style）
   */
  generateTimeSectionLyrics(theme, params = {}) {
    const themeKey = THEME_LINE_MAP[theme.toLowerCase()] || 'love';
    const linesData = POETIC_LINES[themeKey];
    const totalDuration = params.duration || 270; // 默认4.5分钟
    const structure = FSM_STRUCTURES[params.structure] || FSM_STRUCTURES.standard;

    const sections = [];
    let currentTime = 0;

    structure.forEach((sectionType, index) => {
      const timeConfig = TIME_SECTION_CONFIG[sectionType.replace(/[0-9]/g, '')] || TIME_SECTION_CONFIG.verse;
      const duration = Math.floor((timeConfig.durationRange[1] - timeConfig.durationRange[0]) * totalDuration / 270);

      const startTime = this._formatTime(currentTime);
      const endTime = this._formatTime(currentTime + duration);

      const normalizedType = this._normalizeSectionType(sectionType);
      const linesPool = linesData[normalizedType] || linesData.verse;
      const selectedLines = this._selectLines(linesPool, params.complexity || 7);

      const dynamic = this._getDynamicForSection(sectionType, index, structure.length);
      const instruments = this._getInstrumentsForSection(sectionType, params);
      const timeSpace = this._getTimeSpaceForSection(sectionType);

      sections.push({
        type: sectionType,
        timeSection: timeConfig.format.replace('{start}', startTime).replace('{end}', endTime),
        startTime: currentTime,
        endTime: currentTime + duration,
        duration,
        dynamic,
        dynamicLevel: DYNAMIC_LEVELS[dynamic],
        instruments,
        timeSpace,
        content: selectedLines
      });

      currentTime += duration;
    });

    return {
      theme,
      totalDuration,
      structure,
      sections,
      fullText: this._formatTimeSectionOutput(sections),
      generatedAt: new Date().toISOString(),
      meta: {
        literaryAnalysis: this._analyzeLiteraryDevices(sections),
        emotionalArc: this._analyzeEmotionalArc(sections),
        instrumentTimeline: this._buildInstrumentTimeline(sections)
      }
    };
  }

  /**
   * 生成风格变体歌词（Style Variations）
   */
  generateStyleVariation(theme, styleType, variationKey, params = {}) {
    const variations = STYLE_VARIATIONS[styleType] || STYLE_VARIATIONS.tango;
    const variation = variations[variationKey] || variations.A;

    const baseLyrics = this.generateFSMLyrics(theme, params);

    return {
      ...baseLyrics,
      variation: {
        key: variationKey,
        name: variation.name,
        description: variation.description,
        design: variation.design,
        vocals: variation.vocals,
        effects: variation.effects,
        instruments: variation.instruments,
        sfx: variation.sfx,
        language: variation.language
      },
      fullText: this._formatVariationOutput(baseLyrics, variation),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 生成 FSM 歌词
   */
  generateFSMLyrics(theme, params = {}) {
    const themeKey = THEME_LINE_MAP[theme.toLowerCase()] || 'love';
    const linesData = POETIC_LINES[themeKey];
    const complexity = params.complexity || this.config.defaultComplexity;
    const bpm = params.bpm || this.config.defaultBpm;
    const structure = FSM_STRUCTURES[params.structure] || FSM_STRUCTURES.standard;

    const sections = structure.map((sectionType) => {
      const sectionKey = this._normalizeSectionType(sectionType);
      const linesPool = linesData[sectionKey] || linesData.verse;

      const selectedLines = this._selectLines(linesPool, complexity);

      return { type: sectionType, content: selectedLines };
    });

    return {
      theme,
      structure,
      bpm,
      complexity,
      sections,
      totalLines: sections.reduce((sum, s) => sum + s.content.length, 0),
      transitions: sections.length - 1,
      states: sections.length,
      fullText: sections.map(s => `[${s.type.toUpperCase()}]\n${s.content.join('\n')}`).join('\n\n'),
      generatedAt: new Date().toISOString(),
      meta: {
        literaryAnalysis: this._analyzeLiteraryDevices(sections),
        emotionalArc: this._analyzeEmotionalArc(sections)
      }
    };
  }

  _normalizeSectionType(type) {
    if (type.includes('intro')) return 'intro';
    if (type.includes('verse')) return 'verse';
    if (type.includes('pre_chorus') || type.includes('prechorus')) return 'pre_chorus';
    if (type.includes('chorus')) return 'chorus';
    if (type.includes('bridge')) return 'bridge';
    if (type.includes('outro') || type.includes('finale') || type.includes('ending')) return 'outro';
    if (type.includes('interlude')) return 'verse';
    return 'verse';
  }

  _selectLines(pool, complexity) {
    const lineCount = complexity >= 7 ? 4 : 4;
    const result = [];
    const usedIndices = [];

    for (let i = 0; i < lineCount; i++) {
      const available = pool.filter((_, idx) => !usedIndices.includes(idx));
      if (available.length === 0) break;

      const pair = available[Math.floor(Math.random() * available.length)];
      const idx = pool.indexOf(pair);
      usedIndices.push(idx);

      if (Array.isArray(pair)) {
        result.push(...pair);
      } else {
        result.push(pair);
      }
    }

    return result.slice(0, lineCount);
  }

  _pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)] || '';
  }

  _translateTheme(theme, lang = 'zh') {
    const translations = {
      zh: {
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
        tango: '探戈'
      },
      en: {
        love: 'love',
        loneliness: 'loneliness',
        sadness: 'sadness',
        dreams: 'dreams',
        memory: 'memory',
        nature: 'nature',
        friendship: 'friendship',
        success: 'success',
        hope: 'hope',
        life: 'life',
        lunatic: 'lunatic',
        tango: 'tango'
      }
    };

    return translations[lang][theme] || theme;
  }

  _generateLyricRequirements(theme, complexity) {
    const lyricRequirements = {
      simple: '歌词简单易懂，朗朗上口',
      moderate: '歌词富有诗意，情感真挚',
      complex: '歌词极其精心地运用诗意语言和丰富意象, 采用AABB/ABAB混合押韵, 每句7字, 严格押韵押韵方案, 大量运用比喻、拟人、通感等修辞手法, 意象丰富深刻, 情感层次分明, 从铺垫到高潮再到升华, 层层递进',
      advanced: '歌词极其精心地运用诗意语言和丰富意象, 采用AABB/ABAB混合押韵, 每句7字, 严格押韵押韵方案, 大量运用比喻、拟人、通感等修辞手法, 意象丰富深刻, 情感层次分明, 从铺垫到高潮再到升华, 层层递进, 故事性强, 意境深远',
      expert: '歌词极其精心地运用诗意语言和丰富意象, 采用AABB/ABAB混合押韵, 每句7字, 严格押韵押韵方案, 大量运用比喻、拟人、通感等修辞手法, 意象丰富深刻, 情感层次分明, 从铺垫到高潮再到升华, 层层递进, 故事性强, 意境深远, 具有文学价值'
    };

    return lyricRequirements[complexity] || lyricRequirements.complex;
  }

  _formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  _getDynamicForSection(sectionType, index, totalSections) {
    const progress = index / totalSections;

    if (sectionType.includes('intro')) return 'pp';
    if (sectionType.includes('verse')) return progress < 0.3 ? 'p' : 'mp';
    if (sectionType.includes('pre_chorus')) return 'mf';
    if (sectionType.includes('chorus')) return progress < 0.7 ? 'f' : 'ff';
    if (sectionType.includes('bridge')) return 'pp';
    if (sectionType.includes('finale') || sectionType.includes('final')) return 'p→mf→pp';
    if (sectionType.includes('outro')) return 'pp';

    return 'mp';
  }

  _getInstrumentsForSection(sectionType, params) {
    const timeSpace = params.timeSpace || 'fusion';

    if (sectionType.includes('ancient')) {
      return INSTRUMENT_TIME_SPACE.ancient.instruments.slice(0, 4);
    }
    if (sectionType.includes('modern')) {
      return INSTRUMENT_TIME_SPACE.modern.instruments.slice(0, 4);
    }
    if (sectionType.includes('fusion') || sectionType.includes('chorus')) {
      return INSTRUMENT_TIME_SPACE.fusion.instruments;
    }

    return TIME_SECTION_CONFIG[sectionType.replace(/[0-9]/g, '')]?.defaultInstruments || ['Piano', 'Strings'];
  }

  _getTimeSpaceForSection(sectionType) {
    if (sectionType.includes('ancient')) return INSTRUMENT_TIME_SPACE.ancient;
    if (sectionType.includes('modern')) return INSTRUMENT_TIME_SPACE.modern;
    return INSTRUMENT_TIME_SPACE.fusion;
  }

  _formatTimeSectionOutput(sections) {
    return sections.map(s => {
      const dynamicDesc = s.dynamicLevel ? ` [动态: ${s.dynamicLevel.name}]` : '';
      const instrumentsStr = s.instruments ? `\n[乐器: ${s.instruments.join(', ')}]` : '';
      const timeSpaceStr = s.timeSpace ? `\n[${s.timeSpace.name}]` : '';

      return `${s.timeSection}${dynamicDesc}${instrumentsStr}${timeSpaceStr}\n${s.content.join('\n')}`;
    }).join('\n\n');
  }

  _formatVariationOutput(baseLyrics, variation) {
    const header = `[标题：${variation.name}]\n\n${variation.description}\n\n核心设计：${variation.design}\n人声表现：${variation.vocals}\n效果重点：${variation.effects}\n乐器：${variation.instruments.join(', ')}\n语言：${variation.language}\n\n`;

    return header + baseLyrics.sections.map(s => `[${s.type.toUpperCase()}]\n${s.content.join('\n')}`).join('\n\n');
  }

  _buildInstrumentTimeline(sections) {
    return sections.map(s => ({
      time: this._formatTime(s.startTime),
      instruments: s.instruments,
      timeSpace: s.timeSpace?.name || 'fusion'
    }));
  }

  _analyzeLiteraryDevices(sections) {
    const devices = { metaphor: 0, personification: 0, imagery: 0, repetition: 0 };

    sections.forEach(section => {
      const lines = Array.isArray(section.content) ? section.content : section.content.split('\n');
      lines.forEach(line => {
        if (line.includes('如') || line.includes('似') || line.includes('若') || line.includes('像')) devices.metaphor++;
        if (line.includes('听') || line.includes('看') || line.includes('说') || line.includes('低语') || line.includes('诉')) devices.personification++;
        if (line.match(/(雨|风|月|星|光|影|声|水|花|云|山|川|草|木|夜|寒|冷)/)) devices.imagery++;
      });
    });

    return devices;
  }

  _analyzeEmotionalArc(sections) {
    const arc = [];
    let intensity = 0.2;

    sections.forEach((section, index) => {
      const dynamic = section.dynamic || section.type;

      if (dynamic.includes('ff') || section.type.includes('final')) intensity = 0.85;
      else if (dynamic.includes('f') || section.type.includes('chorus')) intensity = Math.min(intensity + 0.2, 0.7);
      else if (dynamic.includes('mf') || section.type.includes('pre')) intensity = 0.5;
      else if (dynamic.includes('pp') || section.type.includes('bridge') || section.type.includes('outro')) intensity = Math.max(0.2, intensity - 0.3);
      else intensity = Math.min(intensity + 0.1, 0.4);

      const prevIntensity = arc[index - 1]?.intensity || intensity;

      arc.push({
        section: section.type,
        dynamic: dynamic,
        intensity: Math.round(intensity * 10) / 10,
        progression: intensity > prevIntensity ? 'rising' :
          intensity < prevIntensity ? 'falling' : 'stable'
      });
    });

    return arc;
  }
}

export default UnicornAgent;