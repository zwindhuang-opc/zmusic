/**
 * referenceData.js
 *
 * Reference templates and examples for lyrics generation enhancement.
 * Contains song examples, structured command templates, and musical patterns
 * extracted from the reference folder.
 */

// Multi-language song examples for style reference
export const LYRIC_EXAMPLES = [
  {
    id: 'samba_dance',
    title: '虛情Samba舞',
    language: 'zh',
    style: 'samba',
    themes: ['love', 'illusion', 'dance'],
    structure: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 120,
    keywords: ['桑巴', '探戈', '舞池', '虚拟', '挂载', '卸载']
  },
  {
    id: 'attack_wood',
    title: '進擊的木頭',
    language: 'zh',
    style: 'rap',
    themes: ['revenge', 'satire', 'pride'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus'],
    bpm: 96,
    keywords: [' screen', 'ID', '嘴脸', '嘴脸', '格调']
  },
  {
    id: 'betrayal_letter',
    title: '背叛信',
    language: 'zh',
    style: 'ballad',
    themes: ['betrayal', 'heartbreak', 'revenge'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 72,
    keywords: ['墨迹', '信纸', '信任', '结痂', '夜莺', '恶鬼']
  },
  {
    id: 'genius_useless',
    title: '天才無用',
    language: 'zh',
    style: 'cantopop',
    themes: ['frustration', 'talent', 'alienation'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 88,
    keywords: ['前世', '记忆', '霜雪', '未竟', '转世', '频率']
  },
  {
    id: 'schrodingers_cat',
    title: "Schrodinger's Cat",
    language: 'kr',
    style: 'kpop',
    themes: ['quantum', 'fate', 'uncertainty'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 128,
    keywords: ['몬테카를로', '파도', '양자역학', '슈뢰딩거', '관측']
  },
  {
    id: 'sakura_death',
    title: 'Sakura之亡幽',
    language: 'ja',
    style: 'jpop',
    themes: ['death', 'cherry_blossom', 'farewell'],
    structure: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 68,
    keywords: ['桜', '散る', '愁い', '茶の煙', '毒茶']
  },
  {
    id: 'snowflake_life',
    title: '雪花人生',
    language: 'zh',
    style: 'pop',
    themes: ['life', 'philosophy', 'time'],
    structure: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 92,
    keywords: ['雪花', '人生', '风花雪月', '举杯', '泡沫']
  },
  {
    id: 'spa',
    title: 'S.P.A.',
    language: 'zh',
    style: 'dance',
    themes: ['confidence', 'personality', '进取'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 120,
    keywords: ['性感', '个性', '进取', '光芒', '夜晚']
  },
  {
    id: 'will_you_care',
    title: 'Will You Care For Me Again',
    language: 'en',
    style: 'ballad',
    themes: ['heartbreak', 'longing', 'hope'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 64,
    keywords: ['rain', 'silhouette', 'memories', 'heart', 'sign']
  },
  {
    id: 'loneliness_normal',
    title: '孤独常態',
    language: 'zh',
    style: 'indie',
    themes: ['loneliness', 'self_acceptance', 'peace'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 84,
    keywords: ['孤独', '耳机', '世界', '一个人', '常态']
  },
  {
    id: 'amoeba',
    title: 'Amoeba',
    language: 'zh',
    style: 'indie_folk',
    themes: ['love', 'adaptation', 'vulnerability'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 76,
    keywords: ['阿米巴', '伪足', '细胞膜', '培养液', '显微镜']
  },
  {
    id: 'pandora_secret',
    title: 'Pandora之秘',
    language: 'zh',
    style: 'classical_crossover',
    themes: ['curiosity', 'fate', 'hope'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 80,
    keywords: ['潘多拉', '陶土', '紫陶', 'Spes', 'Veritas']
  },
  {
    id: 'yamada',
    title: 'Yamada',
    language: 'en',
    style: 'folk',
    themes: ['peace', 'nature', 'devotion'],
    structure: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 70,
    keywords: ['mountain', 'flower', 'dream', 'peace', 'light']
  },
  {
    id: 'passing_breeze',
    title: '逝去的微風',
    language: 'zh',
    style: 'ballad',
    themes: ['loss', 'love', 'memory'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 72,
    keywords: ['浮生', '人间', '孤雁', '残雪', '誓言']
  },
  {
    id: 'rainy_memories',
    title: '回憶細雨夜',
    language: 'zh',
    style: 'ballad',
    themes: ['memory', 'rain', 'love'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 68,
    keywords: ['空荡', '旧照片', '未寄出', '细雨', '浮生']
  },
  {
    id: 'money_machine',
    title: '賺錢機器',
    language: 'zh',
    style: 'electropop',
    themes: ['success', 'love', 'emptiness'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 128,
    keywords: ['赚钱', '公式', '计算器', '答案', '温暖']
  },
  {
    id: 'anonymous_passenger',
    title: '匿名乘客',
    language: 'zh',
    style: 'electronic',
    themes: ['escape', 'identity', 'alienation'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 120,
    keywords: ['地铁', '密码', '指纹', '新名字', '面具']
  },
  {
    id: 'midnight_sigh',
    title: '夜半嘆聲',
    language: 'zh',
    style: 'blues',
    themes: ['sorrow', 'regret', 'night'],
    structure: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 72,
    keywords: ['冷清', '咖啡馆', '街灯', '绝望', '寒江']
  },
  {
    id: 'drunk_dream',
    title: '醉生夢死',
    language: 'zh',
    style: 'rnb',
    themes: ['drink', 'memory', 'love'],
    structure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 88,
    keywords: ['烈酒', '醉意', '晚霞', '星辰', '重逢']
  },
  {
    id: 'boombap_jazz',
    title: 'BoomBap × Jazz Rap',
    language: 'en',
    style: 'hiphop',
    themes: ['emotion', 'rap', 'night'],
    structure: ['intro', 'verse', 'verse', 'verse', 'outro'],
    bpm: 84,
    key: 'F Minor',
    keywords: ['BoomBap', 'Jazz Rap', 'Tight Flow', 'Dense Internal Rhymes', 'Male Rap Vocal', 'Vinyl Texture'],
    aiDirectives: {
      intro: 'Dusty BoomBap Drums, Rhodes Piano, Vinyl Noise, Warm Bass',
      verse1: 'BoomBap Groove, Tight Kick, Warm Bass - 克制情绪, Smooth Tight Flow, 连续双押/内部押',
      verse2: '压抑升级, Bounce Flow, 中强力度',
      verse3: '爆发情绪, Triplet + Bounce Flow, 强力度',
      outro: 'Spoken Rap, Free Time, 释然情绪'
    }
  },
  {
    id: 'shanliang_love',
    title: '北回歸線的愛情',
    language: 'zh',
    style: 'folk',
    themes: ['love', 'nature', 'destiny'],
    structure: ['intro', 'verse', 'pre_chorus', 'chorus', 'interlude', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 76,
    keywords: ['北回歸線', '夏至', '雙胞井', '哈尼', '山野', '日光'],
    aiDirectives: {
      intro: '巴乌主旋律+吉他分解, 山野风声铺垫 4小节',
      verse1: '男声，温润内敛，哈尼三弦打底',
      pre_chorus: '男女合唱，音量渐起，弦乐缓缓铺入',
      chorus: '初遇心动层次，编制饱满，和声分层铺垫',
      interlude: '哈尼三弦独奏主旋律，搭配溪水采样、微弱哈尼哼唱 8小节'
    }
  },
  {
    id: 'cyber_love',
    title: '數字時代的愛情',
    language: 'zh',
    style: 'electronic',
    themes: ['love', 'technology', 'virtual'],
    structure: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 128,
    keywords: ['代碼', '數據', '密碼', '系統', '虛擬', '重啟']
  },
  {
    id: 'warrior_song',
    title: '戰士之歌',
    language: 'zh',
    style: 'epic_rock',
    themes: ['war', 'courage', 'glory'],
    structure: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    bpm: 140,
    keywords: ['戰鼓', '鐵甲', '戰旗', '征途', '榮耀', '埋葬']
  }
];

// Structured command templates for each platform
export const COMMAND_TEMPLATES = {
  melo: {
    name: 'MELO',
    structure: [
      'title',
      'style',
      'bpm',
      'key',
      'keywords',
      'sections'
    ],
    sectionFormat: [
      '[Section Type | Emotion | Vocal | Dynamics | Flow]',
      '(AI执行指令: Instrument, Effect, Processing)',
      '(细节要求: specific requirements for this section)'
    ],
    layerStructure: {
      foundation: {
        label: '基础层',
        description: '底层节拍与律动',
        keywords: ['BPM', '节拍', '律动', '拍子', '节奏型']
      },
      melody: {
        label: '旋律层',
        description: '主旋律线条与乐器',
        keywords: ['主旋律', '线条', '乐器', '调性', '音阶']
      },
      expression: {
        label: '表达层',
        description: '人声与情感表达',
        keywords: ['人声', '情感', '演唱', '和声', '咬字']
      },
      effects: {
        label: '效果层',
        description: '音效与后期处理',
        keywords: ['混响', '延迟', '调制', '音效', '采样']
      }
    }
  },
  suno: {
    name: 'SUNO',
    structure: [
      'style_tags',
      'emotion',
      'rhythm',
      'timbre',
      'instrumentation',
      'sections'
    ],
    sectionFormat: [
      '[Section Type | Time Range]',
      '[乐器配置]',
      '[人声/演唱]',
      '[动态/力度]',
      '歌词内容'
    ],
    styleTags: [
      '风格标签',
      '情绪',
      '节奏',
      '音色',
      '乐器',
      '融合层'
    ]
  },
  muse: {
    name: 'MUSE',
    structure: [
      'description',
      'layers',
      'lyrics'
    ],
    layerStructure: {
      foundation: '底层节拍',
      melody: '旋律层',
      expression: '表现层',
      effects: '效果层'
    }
  },
  other: {
    name: 'OTHER',
    structure: [
      'intro',
      'verse',
      'pre_chorus',
      'chorus',
      'interlude',
      'verse2',
      'pre_chorus2',
      'chorus2',
      'bridge',
      'chorus3',
      'outro'
    ],
    sectionFormat: [
      '[Section Type]（乐器配置 + 描述）',
      '歌词内容',
      '[Section Type]（乐器配置 + 描述）',
      '歌词内容'
    ]
  }
};

// Musical patterns by genre for better generation
export const GENRE_PATTERNS = {
  pop: {
    bpmRange: [100, 130],
    key: 'C Major / G Major',
    timeSignature: '4/4',
    typicalStructure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    instruments: ['Acoustic Guitar', 'Piano', 'Drums', 'Bass', 'Strings'],
    vocal: { gender: 'mixed', emotionLevel: 5, tone: 'pop', dialect: '普通话' },
    effects: ['Reverb', 'Delay', 'Compression'],
    sfx: ['Breath', 'Ambient']
  },
  ballad: {
    bpmRange: [60, 85],
    key: 'D Major / E Major',
    timeSignature: '4/4',
    typicalStructure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    instruments: ['Piano', 'Cello', 'Acoustic Guitar', 'Strings'],
    vocal: { gender: 'female', emotionLevel: 7, tone: 'ballad', dialect: '普通话' },
    effects: ['Reverb', 'Chorus', 'Delay'],
    sfx: ['Ambient', 'Heartbeat']
  },
  rock: {
    bpmRange: [120, 160],
    key: 'E Minor / A Minor',
    timeSignature: '4/4',
    typicalStructure: ['verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'solo', 'bridge', 'chorus', 'outro'],
    instruments: ['Distorted Guitar', 'Drums', 'Bass', 'Rhythm Guitar'],
    vocal: { gender: 'male', emotionLevel: 8, tone: 'rock', dialect: '普通话' },
    effects: ['Distortion', 'Reverb', 'Delay', 'Flanger'],
    sfx: ['Feedback', 'Crowd']
  },
  electronic: {
    bpmRange: [120, 150],
    key: 'A Minor / F# Minor',
    timeSignature: '4/4',
    typicalStructure: ['intro', 'verse', 'pre_chorus', 'drop', 'verse', 'pre_chorus', 'drop', 'breakdown', 'drop', 'outro'],
    instruments: ['Synthesizer', 'Drum Machine', 'Sampler', 'Sub Bass'],
    vocal: { gender: 'female', emotionLevel: 6, tone: 'electronic', dialect: '普通话' },
    effects: ['Reverb', 'Delay', 'Filter', 'Sidechain'],
    sfx: ['Whoosh', 'Click', 'Digital']
  },
  hiphop: {
    bpmRange: [85, 100],
    key: 'Various',
    timeSignature: '4/4',
    typicalStructure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    instruments: ['Drum Machine', 'Sampler', 'Synth Bass', 'Turntables'],
    vocal: { gender: 'male', emotionLevel: 7, tone: 'rap', dialect: '普通话' },
    effects: ['Reverb', 'Delay', 'EQ', 'Compression'],
    sfx: ['Scratch', 'Beat', 'Voice Sample']
  },
  classical: {
    bpmRange: [60, 120],
    key: 'Various',
    timeSignature: '4/4 or 3/4',
    typicalStructure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    instruments: ['Violin', 'Cello', 'Piano', 'Orchestra', 'Flute'],
    vocal: { gender: 'mixed', emotionLevel: 8, tone: 'classical', dialect: '普通话' },
    effects: ['Hall Reverb', 'Chorus', 'No Delay'],
    sfx: ['Hall Ambience']
  },
  jazz: {
    bpmRange: [100, 140],
    key: 'Bb Major / F Major',
    timeSignature: '4/4',
    typicalStructure: ['intro', 'verse', 'chorus', 'solo', 'verse', 'chorus', 'outro'],
    instruments: ['Saxophone', 'Trumpet', 'Piano', 'Bass', 'Drums'],
    vocal: { gender: 'female', emotionLevel: 6, tone: 'jazz', dialect: '普通话' },
    effects: ['Club Reverb', 'Chorus', 'Slight Delay'],
    sfx: ['Crowd Murmur', 'Glass Clink']
  },
  folk: {
    bpmRange: [70, 110],
    key: 'C Major / G Major',
    timeSignature: '4/4 or 6/8',
    typicalStructure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    instruments: ['Acoustic Guitar', 'Harmonica', 'Violin', 'Banjo', 'Upright Bass'],
    vocal: { gender: 'male', emotionLevel: 7, tone: 'folk', dialect: '普通话' },
    effects: ['Plate Reverb', 'No Delay', 'Natural'],
    sfx: ['Crackle', 'Wind']
  },
  rnb: {
    bpmRange: [70, 95],
    key: 'D Minor / F Minor',
    timeSignature: '4/4',
    typicalStructure: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    instruments: ['Electric Piano', 'Drum Machine', 'Synth Bass', 'Guitar'],
    vocal: { gender: 'male', emotionLevel: 8, tone: 'rnb', dialect: '普通话' },
    effects: ['Reverb', 'Delay', 'Auto-Tune', 'Compression'],
    sfx: ['Snap', 'Fingertap']
  },
  gothic_rock: {
    bpmRange: [110, 140],
    key: 'D Minor / G Minor',
    timeSignature: '4/4',
    typicalStructure: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    instruments: ['Distorted Guitar', 'Heavy Bass', 'Drums', 'Orchestral Strings'],
    vocal: { gender: 'male', emotionLevel: 9, tone: 'gothic', dialect: '普通话' },
    effects: ['Reverb', 'Delay', 'Distortion', 'Chorus'],
    sfx: ['Thunder', 'Church Bell', 'Wind']
  },
  kpop: {
    bpmRange: [100, 130],
    key: 'Various',
    timeSignature: '4/4',
    typicalStructure: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    instruments: ['Synthesizer', 'Drum Machine', 'Synth Bass', 'Electric Guitar', 'Piano'],
    vocal: { gender: 'mixed', emotionLevel: 8, tone: 'pop', dialect: '韩语' },
    effects: ['Reverb', 'Auto-Tune', 'Sidechain', 'Delay'],
    sfx: ['Whoosh', 'Digital', 'Clap']
  },
  reggae: {
    bpmRange: [70, 90],
    key: 'Various',
    timeSignature: '4/4',
    typicalStructure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    instruments: ['Electric Guitar', 'Bass Guitar', 'Drums', 'Percussion', 'Organ'],
    vocal: { gender: 'male', emotionLevel: 7, tone: 'reggae', dialect: 'English' },
    effects: ['Reverb', 'Delay', 'Chorus', 'Echo'],
    sfx: ['Bird', 'Ocean', 'Fire']
  },
  blues: {
    bpmRange: [70, 120],
    key: 'E Minor / Bb Major',
    timeSignature: '4/4 or 12/8',
    typicalStructure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'solo', 'chorus', 'outro'],
    instruments: ['Electric Guitar', 'Piano', 'Bass Guitar', 'Drums', 'Harmonica'],
    vocal: { gender: 'male', emotionLevel: 9, tone: 'blues', dialect: 'English' },
    effects: ['Room Reverb', 'Slight Distortion', 'No Delay'],
    sfx: ['Crowd', 'Glass Clink']
  },
  cinematic: {
    bpmRange: [50, 100],
    key: 'Various',
    timeSignature: '4/4',
    typicalStructure: ['intro', 'build', 'climax', 'verse', 'build', 'climax', 'resolution', 'outro'],
    instruments: ['Orchestra', 'Piano', 'Synth Pad', 'Drums', 'Choir'],
    vocal: { gender: 'mixed', emotionLevel: 10, tone: 'cinematic', dialect: 'English' },
    effects: ['Hall Reverb', 'Sweeping Delay', 'Reverb Tail', 'Compression'],
    sfx: ['Extended Cinematic Foley', 'Whoosh', 'Impact']
  },
  cantopop: {
    bpmRange: [70, 130],
    key: 'Various',
    timeSignature: '4/4',
    typicalStructure: ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'],
    instruments: ['Acoustic Guitar', 'Piano', 'Strings', 'Drum Machine', 'Bass'],
    vocal: { gender: 'female', emotionLevel: 8, tone: 'cantopop', dialect: '粤语' },
    effects: ['Reverb', 'Delay', 'Compression'],
    sfx: ['City Ambience', 'Rain']
  },
  indierock: {
    bpmRange: [110, 140],
    key: 'Various',
    timeSignature: '4/4',
    typicalStructure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    instruments: ['Electric Guitar', 'Bass Guitar', 'Drums', 'Organ'],
    vocal: { gender: 'male', emotionLevel: 7, tone: 'raw', dialect: 'English' },
    effects: ['Reverb', 'Distortion', 'Fuzz', 'Delay'],
    sfx: ['Crowd', 'Feedback']
  },
  lofi: {
    bpmRange: [60, 85],
    key: 'Various',
    timeSignature: '4/4',
    typicalStructure: ['intro', 'verse', 'chorus', 'verse', 'chorus', 'outro'],
    instruments: ['Sampler', 'Drum Machine', 'Bass', 'Piano', 'Vinyl Crackle'],
    vocal: { gender: 'female', emotionLevel: 6, tone: 'chill', dialect: 'Japanese' },
    effects: ['Vinyl Crackle', 'Slight Distortion', 'Chorus', 'Reverb'],
    sfx: ['Rain', 'Coffee Shop', 'Vinyl']
  }
};

// Theme-specific imagery and emotion keywords
export const THEME_KEYWORDS = {
  love: {
    strong: ['心动', '眷恋', '温柔', '痴情', '缠绵'],
    visual: ['月光', '玫瑰', '春风', '繁星', '晚霞'],
    actions: ['相拥', '守候', '凝望', '牵手', '追寻'],
    metaphors: ['红豆', '鸳鸯', '红绳', '鹊桥', '月老']
  },
  sadness: {
    strong: ['悲伤', '心碎', '哀痛', '绝望', '苦涩'],
    visual: ['泪痕', '落花', '秋雨', '残阳', '孤坟'],
    actions: ['流泪', '哭泣', '叹息', '追忆', '哽咽'],
    metaphors: ['断肠人', '伤心客', '离人', '愁绪', '悲歌']
  },
  loneliness: {
    strong: ['孤寂', '落寞', '凄凉', '空荡', '萧索'],
    visual: ['寒星', '孤灯', '残月', '落叶', '冷雨'],
    actions: ['独坐', '徘徊', '独酌', '流浪', '守望'],
    metaphors: ['孤影', '夜风', '寒窗', '空房', '残灯']
  },
  dreams: {
    strong: ['渴望', '憧憬', '坚定', '昂扬', '勇敢'],
    visual: ['星光', '流星', '曙光', '翅膀', '灯塔'],
    actions: ['追逐', '飞翔', '攀登', '跨越', '启航'],
    metaphors: ['追梦人', '远航者', '星辰', '远方', '彼岸']
  },
  life: {
    strong: ['感悟', '释然', '通透', '沧桑', '从容'],
    visual: ['四季', '年轮', '落叶', '花开', '时光'],
    actions: ['走过', '经历', '沉淀', '成长', '领悟'],
    metaphors: ['旅程', '长河', '棋局', '舞台', '画卷']
  },
  friendship: {
    strong: ['真挚', '感动', '默契', '感恩', '义气'],
    visual: ['老酒', '篝火', '背影', '并肩', '吉他'],
    actions: ['举杯', '并肩', '同行', '倾听', '守护'],
    metaphors: ['伯牙', '子期', '兄弟', '知己', '挚友']
  },
  success: {
    strong: ['自豪', '振奋', '激昂', '荣耀', '骄傲'],
    visual: ['旭日', '勋章', '奖杯', '凯歌', '桂冠'],
    actions: ['攀登', '跨越', '征服', '凯旋', '斩获'],
    metaphors: ['英雄', '勇士', '冠军', '开拓者', '先锋']
  },
  memory: {
    strong: ['怀念', '怅然', '温馨', '感伤', '留恋'],
    visual: ['旧照片', '泛黄', '夕阳', '老歌', '余晖'],
    actions: ['回望', '翻阅', '追忆', '重温', '缅怀'],
    metaphors: ['往事', '旧时光', '回忆', '青春', '故人']
  },
  nature: {
    strong: ['宁静', '悠然', '舒畅', '平和', '释然'],
    visual: ['清风', '流水', '白云', '青山', '落霞'],
    actions: ['漫步', '聆听', '呼吸', '感受', '拥抱'],
    metaphors: ['山川', '清风', '溪水', '飞鸟', '明月']
  },
  hope: {
    strong: ['希望', '期待', '信心', '勇气', '乐观'],
    visual: ['朝阳', '曙光', '彩虹', '新芽', '黎明'],
    actions: ['期待', '相信', '坚持', '等待', '拥抱'],
    metaphors: ['种子', '星星', '灯塔', '方向', '明天']
  }
};

// Generate MELO structured command from parameters (ByteDance MELO 4-layer system)
export function generateMeloCommand(params) {
  const { genre = 'pop', theme = 'love', bpm = 120, key = 'C', duration = 270, language = 'zh', title = '' } = params;

  const patterns = GENRE_PATTERNS[genre] || GENRE_PATTERNS.pop;
  const themeKeywords = THEME_KEYWORDS[theme] || THEME_KEYWORDS.love;

  const langLabel = language === 'zh' ? '国语' : language === 'en' ? 'English' : language === 'ja' ? '日本語' : language === 'kr' ? '한국어' : '普通话';

  // Build the 4-layer MELO structure based on the command samples
  const foundationLayer = {
    label: '[LAYER: FOUNDATION]',
    content: `底层节拍: ${bpm}bpm基础律动, 围绕${theme}主题构建稳定的${patterns.timeSignature}节拍`
  };

  const melodyLayer = {
    label: '[LAYER: MELODY]',
    content: `旋律层: ${patterns.instruments[0]}为核心主旋律线条, 表达${themeKeywords.strong[0] || '深情'}情绪, 配合${patterns.instruments.slice(1, 3).join('、')}`
  };

  const expressionLayer = {
    label: '[LAYER: EXPRESSION]',
    content: `表现层: ${patterns.vocal.tone}人声与和声, 叠加${patterns.effects.slice(0, 2).join('、')}, 深度诠释${theme}主题的${themeKeywords.strong.slice(0, 3).join('、')}`
  };

  const effectsLayer = {
    label: '[LAYER: EFFECTS]',
    content: `效果层: 开场的7-8秒${patterns.sfx.slice(0, 2).join('、')}混响、4-5秒${patterns.effects.slice(0, 1).join('、')}延迟渐入人声独白、调制效果入情入境, 营造${theme}氛围`
  };

  // Build section-by-section command with inline MELO annotations
  const sections = [];
  const structure = patterns.typicalStructure;

  for (let i = 0; i < structure.length; i++) {
    const sectionType = structure[i];
    const normalizedType = sectionType.replace(/[0-9]/g, '');
    const sectionDuration = Math.floor(duration / structure.length);

    let emotion = '中';
    let dynamics = 'mf';
    let vocal = '';
    let flow = '';
    let sfx = '';
    let instrument = patterns.instruments.slice(0, 2).join(' + ');

    switch (normalizedType) {
      case 'intro':
        emotion = '期待';
        dynamics = 'p→mf';
        vocal = 'Instrumental';
        flow = 'Atmospheric, building suspense';
        sfx = `${patterns.sfx.slice(0, 2).join(', ')} SFX, Extended Cinematic Foley`;
        break;
      case 'verse':
        emotion = '叙事';
        dynamics = 'mp';
        vocal = 'Narrative, storytelling';
        flow = 'Smooth, conversational';
        break;
      case 'pre_chorus':
        emotion = '递进';
        dynamics = 'mp→f';
        vocal = 'Building tension';
        flow = 'Tension building';
        break;
      case 'chorus':
        emotion = '高潮';
        dynamics = 'f→ff';
        vocal = 'Powerful, layered';
        flow = 'Driving, anthemic';
        break;
      case 'interlude':
        emotion = '过渡';
        dynamics = 'mf';
        vocal = 'Instrumental';
        flow = 'Connecting sections';
        break;
      case 'bridge':
        emotion = '转折';
        dynamics = 'f→p→f';
        vocal = 'Emotional climax';
        flow = 'Unpredictable, transformative';
        break;
      case 'outro':
        emotion = '释然';
        dynamics = 'f→pp';
        vocal = 'Fading to silence';
        flow = 'Resolution, decrescendo';
        break;
      default:
        emotion = '中';
        dynamics = 'mf';
        vocal = '';
        flow = '';
    }

    sections.push({
      type: sectionType,
      duration: `${sectionDuration}s`,
      tag: `[${sectionType.toUpperCase()}: ${emotion} | ${instrument} | ${dynamics}]`,
      mood: `(Mood: ${flow})`,
      vocalDirection: vocal ? `(Vocal: ${vocal})` : '',
      aiDirectives: [
        `乐器: ${instrument}`,
        `效果: ${patterns.effects.slice(0, 2).join(', ')}`,
        `音效: ${sfx || patterns.sfx.slice(0, 2).join(', ')}`,
        `情感: ${themeKeywords.strong.slice(0, 2).join(', ')}`
      ]
    });
  }

  return {
    title: title || `${theme} - ${genre}`,
    style: [genre, patterns.timeSignature, `${bpm}BPM`, patterns.vocal.tone].join(', '),
    bpm: `${bpm} BPM`,
    key: `${key} ${patterns.key.split(' ')[0] || 'Major'}`,
    language: langLabel,
    overallKeywords: [
      genre,
      `BPM ${bpm}`,
      patterns.timeSignature,
      patterns.vocal.tone,
      langLabel,
      ...patterns.instruments.slice(0, 3),
      ...themeKeywords.strong.slice(0, 3)
    ].join(', '),
    layers: {
      foundation: foundationLayer,
      melody: melodyLayer,
      expression: expressionLayer,
      effects: effectsLayer
    },
    sections,
    style_tags: [
      genre,
      patterns.vocal.gender === 'female' ? 'Female Vocal' : patterns.vocal.gender === 'male' ? 'Male Vocal' : 'Mixed Vocal',
      patterns.timeSignature,
      patterns.key,
      ...patterns.instruments.slice(0, 3),
      ...patterns.effects.slice(0, 2),
      ...themeKeywords.strong.slice(0, 2)
    ].join(', ')
  };
}

// Generate SUNO-style structured command with detailed section annotations
export function generateSunoCommand(params) {
  const { genre = 'pop', theme = 'love', bpm = 120, duration = 270, language = 'zh' } = params;

  const patterns = GENRE_PATTERNS[genre] || GENRE_PATTERNS.pop;
  const themeKeywords = THEME_KEYWORDS[theme] || THEME_KEYWORDS.love;

  const emotionArc = ['清冷→温暖→孤独→升华→圆满'];

  const structure = patterns.typicalStructure;

  const sections = structure.map((section, i) => {
    const sectionStart = Math.floor((duration / structure.length) * i);
    const sectionEnd = Math.floor((duration / structure.length) * (i + 1));
    const normalizedType = section.replace(/[0-9]/g, '');

    let timeRange = `${sectionStart}s - ${sectionEnd}s`;
    let instrumentConfig = patterns.instruments.slice(0, 2).join(' + ');
    let vocalDirection = patterns.vocal.tone;
    let dynamic = 'mf→f';
    let sfx = '';

    switch (normalizedType) {
      case 'intro':
        timeRange = `0:00 - ${formatTime(sectionEnd)}`;
        instrumentConfig = `${patterns.instruments[0]} solo, 极简留白`;
        vocalDirection = 'Instrumental, pp';
        dynamic = 'pp 清冷';
        sfx = '环境音效铺垫';
        break;
      case 'verse':
        timeRange = `${formatTime(sectionStart)} - ${formatTime(sectionEnd)}`;
        instrumentConfig = `${patterns.instruments[0]} + ${patterns.instruments[1] || 'Pad'}`;
        vocalDirection = `${patterns.vocal.gender === 'female' ? '女声' : patterns.vocal.gender === 'male' ? '男声' : '男女声'} ${patterns.vocal.tone}, 情感5级`;
        dynamic = 'p→mp';
        break;
      case 'pre_chorus':
        timeRange = `${formatTime(sectionStart)} - ${formatTime(sectionEnd)}`;
        instrumentConfig = `${patterns.instruments.join(' + ')}`;
        vocalDirection = '合唱渐入, 音量渐起';
        dynamic = 'mp→f';
        break;
      case 'chorus':
        timeRange = `${formatTime(sectionStart)} - ${formatTime(sectionEnd)}`;
        instrumentConfig = `${patterns.instruments[0]} 散音轮奏 + 合成器大气弦乐Pad + 弦乐团全编制`;
        vocalDirection = `${patterns.vocal.gender === 'female' ? '女声' : patterns.vocal.gender === 'male' ? '男声' : '男女声'} ${patterns.vocal.tone} 叠唱`;
        dynamic = 'f→ff 全曲最高潮';
        break;
      case 'bridge':
        timeRange = `${formatTime(sectionStart)} - ${formatTime(sectionEnd)}`;
        instrumentConfig = `${patterns.instruments[0]} 泛音 + 风声采样`;
        vocalDirection = '童声吟诵 / 纯真无染';
        dynamic = 'pp→ppp';
        break;
      case 'outro':
        timeRange = `${formatTime(sectionStart)} - ${formatTime(duration)}`;
        instrumentConfig = `${patterns.instruments[0]} 单音 + 电子脉冲渐弱`;
        vocalDirection = `${patterns.vocal.gender === 'male' ? '男声' : '女声'} 叙事, 情绪4级, 自言自语般轻声`;
        dynamic = 'mp→pp';
        break;
    }

    return {
      type: section,
      timeRange,
      instrumentConfig,
      vocalDirection,
      dynamic,
      sfx,
      lyrics: `[${section.toUpperCase()} 歌词 - ${themeKeywords.strong[i % themeKeywords.strong.length]}]`,
      lyricsNote: `主题: ${themeKeywords.visual[i % themeKeywords.visual.length]}`
    };
  });

  return {
    styleTags: [genre, patterns.timeSignature, `${bpm}BPM`, patterns.vocal.tone].join(', '),
    emotion: emotionArc[0],
    rhythm: `中慢板（BPM ${bpm}），间奏BPM ${Math.floor(bpm * 1.15)}`,
    timbre: patterns.vocal.gender === 'female' ? '女声' : patterns.vocal.gender === 'male' ? '男声' : '男女声',
    instrumentation: patterns.instruments.join('、'),
    sections
  };
}

// Helper to format seconds to M:SS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Generate MUSE-style structured command with 4-layer system
export function generateMuseCommand(params) {
  const { genre = 'pop', theme = 'love', bpm = 120 } = params;

  const patterns = GENRE_PATTERNS[genre] || GENRE_PATTERNS.pop;
  const themeKeywords = THEME_KEYWORDS[theme] || THEME_KEYWORDS.love;

  return {
    description: `创作一首${genre}曲目，融入${theme}主题，BPM约${bpm}，${patterns.instruments.slice(0, 3).join('、')}`,
    layers: {
      foundation: `底层节拍: ${bpm}bpm基础律动, 围绕${theme}主题构建稳定的${patterns.timeSignature}节拍`,
      melody: `旋律层: 以${patterns.instruments[0]}为核心, 表达${themeKeywords.strong[0] || '深情'}情绪, 配合${patterns.instruments.slice(1, 3).join('、')}的${patterns.vocal.tone}`,
      expression: `表现层: ${patterns.vocal.tone}人声与和声, 叠加${patterns.effects.slice(0, 2).join('、')}, 深度诠释${theme}主题的${themeKeywords.strong.slice(0, 3).join('、')}, 体现${theme}特色`,
      effects: `效果层: 开场的7-8秒${patterns.sfx.slice(0, 2).join('、')}混响、4-5秒${patterns.effects.slice(0, 1).join('、')}延迟渐入人声独白、调制效果入情入境, 营造${theme}氛围, 整合${patterns.sfx.slice(0, 2).join('、')}的声音设计`
    },
    // MUSE-specific generation hints based on command samples
    generationHints: [
      '歌詞要男的唱粵語和女的唱普通話男女混唱',
      `要${Math.floor(bpm * 2.5)}秒長 (约${Math.floor(bpm * 2.5 / 60)}分鐘)`,
      `加入${themeKeywords.metaphors.slice(0, 2).join('、')}的意象`,
      `情感要从${themeKeywords.strong.slice(0, 3).join('→')}的弧線`
    ]
  };
}

// Find matching example by theme and style
export function findMatchingExample(theme, style, language = null) {
  return LYRIC_EXAMPLES.filter(ex => {
    const themeMatch = ex.themes.some(t => t === theme || t.includes(theme) || theme.includes(t));
    const styleMatch = style ? ex.style === style || ex.style.includes(style) : true;
    const langMatch = language ? ex.language === language : true;
    return themeMatch && styleMatch && langMatch;
  });
}

// Get random example for inspiration
export function getRandomExample(theme = null) {
  let pool = LYRIC_EXAMPLES;
  if (theme) {
    const filtered = LYRIC_EXAMPLES.filter(ex => ex.themes.some(t => t === theme || t.includes(theme)));
    if (filtered.length > 0) pool = filtered;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// FSM (Finite State Machine) based command generator
// Implements the "Programming as Music" pattern from design.md
// States: intro, verse, pre_chorus, chorus, bridge, interlude, outro
// Transitions triggered by time / chord / section detection
export const FSM_STATES = {
  idle: {
    description: 'Initial state, waiting for input',
    triggers: ['start signal received'],
    actions: ['Initialize DAW', 'Load project template']
  },
  intro: {
    description: 'Opening section, sets mood',
    triggers: ['Time 0:00', 'First beat'],
    actions: ['Load base instruments', 'Set initial BPM', 'Apply opening reverb']
  },
  verse: {
    description: 'Narrative section, develops story',
    triggers: ['Section transition', 'Chord progression change'],
    actions: ['Add vocal layer', 'Reduce reverb', 'Keep steady rhythm', 'Apply auto-filter']
  },
  pre_chorus: {
    description: 'Build-up to chorus, tension building',
    triggers: ['Tension threshold reached', 'Lead-in chord'],
    actions: ['Gradually increase volume', 'Add percussion layer', 'Raise filter cutoff', 'Increase delay time']
  },
  chorus: {
    description: 'Climax, full expression',
    triggers: ['Drop trigger', 'First downbeat of chorus'],
    actions: ['Drop bass', 'Add full drum kit', 'Maximize reverb', 'Layer vocals', 'Trigger sidechain compression', 'Increase master volume']
  },
  bridge: {
    description: 'Turning point, emotional shift',
    triggers: ['After 2nd chorus', 'Key change'],
    actions: ['Remove drums', 'Add ambient pad', 'Pitch shift by half step', 'Reduce to 1 vocal', 'Apply heavy delay']
  },
  breakdown: {
    description: 'Minimal section, tension reset',
    triggers: ['Post-chorus reset', 'Energy drop'],
    actions: ['Strip to kick + bass only', 'Apply noise gate', 'Reduce BPM by 10', 'Add vinyl crackle']
  },
  interlude: {
    description: 'Instrumental transition',
    triggers: ['Section marker', 'Mood shift'],
    actions: ['Switch to lead instrument', 'Apply 8-bar loop', 'Add crossfade from previous section']
  },
  outro: {
    description: 'Closing, resolution',
    triggers: ['Final chorus complete', 'Fade start'],
    actions: ['Gradually reduce volume', 'Remove high frequencies', 'Add reverb tail', 'Fade to silence']
  }
};

// Generate FSM command with triggers and constraints
export function generateFsmCommand(params) {
  const { genre = 'pop', theme = 'love', bpm = 120, duration = 270 } = params;
  const patterns = GENRE_PATTERNS[genre] || GENRE_PATTERNS.pop;
  const themeKeywords = THEME_KEYWORDS[theme] || THEME_KEYWORDS.love;

  const stateSequence = ['intro', 'verse', 'pre_chorus', 'chorus', 'verse', 'pre_chorus', 'chorus', 'bridge', 'chorus', 'outro'];
  const stateDuration = Math.floor(duration / stateSequence.length);

  const stateCommands = stateSequence.map((stateName, i) => {
    const state = FSM_STATES[stateName];
    const stateStart = i * stateDuration;
    const stateEnd = (i + 1) * stateDuration;

    // Generate trigger condition
    const triggerTypes = ['time', 'chord', 'energy', 'section'];
    const triggerType = triggerTypes[i % triggerTypes.length];
    let trigger = '';
    switch (triggerType) {
      case 'time':
        trigger = `WHEN time reaches ${formatTime(stateStart)} → transition to ${stateName}`;
        break;
      case 'chord':
        trigger = `WHEN chord changes to ${['C', 'Am', 'F', 'G', 'Em', 'Dm'][i % 6]} → trigger ${stateName}`;
        break;
      case 'energy':
        trigger = `WHEN energy level exceeds ${70 + (i % 3) * 10}% → activate ${stateName}`;
        break;
      case 'section':
        trigger = `WHEN previous section ends → enter ${stateName} with ${stateDuration}s duration`;
        break;
    }

    // Generate action sequence
    const actions = state ? state.actions.map(a => `  → ${a}`) : ['  → Apply default ' + patterns.style + ' processing'];

    // Generate constraints based on section
    const constraints = [];
    if (stateName === 'chorus') {
      constraints.push('FORBID: Remove heavy distortion during drop');
      constraints.push('REQUIRE: Sidechain compression active');
    } else if (stateName === 'verse') {
      constraints.push('FORBID: Overpowering lead instruments');
      constraints.push('REQUIRE: Clear vocal intelligibility');
    } else if (stateName === 'bridge') {
      constraints.push('FORBID: Full drum kit');
      constraints.push('REQUIRE: Emotional tension variation');
    }

    return {
      state: stateName.toUpperCase(),
      duration: `${stateDuration}s (${formatTime(stateStart)} - ${formatTime(stateEnd)})`,
      trigger,
      actions,
      constraints,
      instrumentConfig: patterns.instruments.slice(0, 2).join(' + '),
      emotion: themeKeywords.strong[i % themeKeywords.strong.length]
    };
  });

  // Generate assembly-level pseudo code
  const pseudoCode = stateSequence.map((stateName, i) => {
    const state = FSM_STATES[stateName];
    const stateStart = i * stateDuration;
    const nextState = stateSequence[i + 1] || 'END';
    return [
      `STATE_${stateName.toUpperCase()}:`,
      `  IF time >= ${stateStart}s THEN`,
      state ? state.actions.map(a => `    ${a.toUpperCase().replace(/ /g, '_')}`).join('\n') : '    APPLY_DEFAULT_PROCESSING',
      `  ENDIF`,
      `  GOTO STATE_${nextState.toUpperCase()}`,
      ''
    ].join('\n');
  }).join('\n');

  return {
    fsm_version: '1.0',
    title: `FSM ${genre} / ${theme}`,
    bpm: `${bpm} BPM`,
    totalDuration: `${duration}s`,
    genre,
    theme,
    stateSequence,
    stateCommands,
    pseudoCode,
    globalConstraints: {
      reference: `Reference: ${patterns.instruments.slice(0, 2).join(', ')}`,
      forbidden: ['No excessive reverb on vocal', 'No clipping'],
      required: ['Maintain BPM stability', 'Dynamic contrast between sections']
    }
  };
}

// Generate a complete command packet for any method
export function generateCommandPacket(params) {
  const { method = 'melo', genre = 'pop', theme = 'love', bpm = 120, key = 'C', duration = 270, language = 'zh', title = '' } = params;

  const packet = {
    meta: {
      generatedAt: new Date().toISOString(),
      method,
      title: title || `${theme} - ${genre}`,
      genre,
      theme,
      bpm,
      key,
      duration,
      language
    }
  };

  switch (method) {
    case 'melo':
      packet.melo = generateMeloCommand(params);
      packet.melo.layers = {
        ...packet.melo.layers,
        fsm: generateFsmCommand(params).stateCommands
      };
      break;
    case 'suno':
      packet.suno = generateSunoCommand(params);
      break;
    case 'muse':
      packet.muse = generateMuseCommand(params);
      break;
    case 'fsm':
    case 'network_layer':
    default:
      packet.fsm = generateFsmCommand(params);
      packet.melo = generateMeloCommand(params);
      break;
  }

  return packet;
}
