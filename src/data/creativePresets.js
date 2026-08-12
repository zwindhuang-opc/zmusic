/**
 * Creative Strategy Presets for Enhanced AUTO Mode
 * Each preset contains defaults that override AUTO generation parameters
 * to steer AI output toward a specific musical character.
 */

export const CREATIVE_STRATEGIES = [
  {
    id: 'experimental',
    name: { zh: '先锋实验', en: 'Experimental' },
    icon: '🧪',
    tag: '前卫',
    color: 'from-fuchsia-500 to-purple-700',
    description: {
      zh: '不寻常和弦、奇数拍、跨风格融合——突破常规，探索未知',
      en: 'Unusual chords, odd meters, genre fusions — break the mold',
    },
    bpmRange: [70, 160],
    defaultDuration: 240,
    structure: 'free_form',
    melodicComplexity: 9,
    lyricComplexity: 8,
    styleHint: 'Ambient, Post-Rock, Glitch, IDM, Progressive',
    instruments: ['Synth', 'Modular', 'Percussion', 'Spatial FX'],
    tags: ['experimental', 'avant-garde', 'cinematic'],
  },
  {
    id: 'radio_friendly',
    name: { zh: '流行金曲', en: 'Radio-Friendly' },
    icon: '📻',
    tag: '商业',
    color: 'from-pink-500 to-rose-600',
    description: {
      zh: '严格主歌-副歌-桥段结构，3-4分钟时长，钩子爆炸抓耳',
      en: 'Strict verse-chorus structure, 3-4 min, monster hooks — 1st listen hit',
    },
    bpmRange: [100, 130],
    defaultDuration: 210,
    structure: 'V-C-V-C-B-C-C',
    melodicComplexity: 5,
    lyricComplexity: 5,
    styleHint: 'Pop, K-Pop, Top40, Dance-Pop',
    instruments: ['Drums', 'Bass', 'Lead Synth', 'Vocal Harmonizer'],
    tags: ['pop', 'radio', 'hit', 'catchy'],
  },
  {
    id: 'film_score',
    name: { zh: '电影配乐', en: 'Film Score' },
    icon: '🎬',
    tag: '史诗',
    color: 'from-indigo-500 to-blue-800',
    description: {
      zh: '电影感、管弦乐主导、长线条推进、气氛渲染',
      en: 'Cinematic, orchestral focus, long builds, mood-forward',
    },
    bpmRange: [70, 110],
    defaultDuration: 300,
    structure: 'intro-build-climax-coda',
    melodicComplexity: 8,
    lyricComplexity: 3,
    styleHint: 'Orchestral, Cinematic, Symphonic, Trailer',
    instruments: ['Strings', 'Brass', 'Percussion Ensemble', 'Choir', 'Piano'],
    tags: ['cinematic', 'epic', 'trailer', 'orchestral'],
  },
  {
    id: 'lofi_hiphop',
    name: { zh: 'Lo-Fi 松弛', en: 'Lo-Fi Hip-Hop' },
    icon: '🌆',
    tag: '慵懒',
    color: 'from-amber-500 to-orange-700',
    description: {
      zh: '70-90 BPM 低保真鼓点、爵士采样、学习/工作背景伴听',
      en: '70-90 BPM chill beats, jazzy samples — study & focus BGM',
    },
    bpmRange: [70, 90],
    defaultDuration: 240,
    structure: 'loopable',
    melodicComplexity: 4,
    lyricComplexity: 2,
    styleHint: 'Lo-Fi, Chill-Hop, Jazzhop',
    instruments: ['Dusty Drums', 'Rhodes Piano', 'Upright Bass', 'Vinyl Crackle'],
    tags: ['lofi', 'chill', 'study', 'bgm'],
  },
  {
    id: 'pop_punk',
    name: { zh: '朋克青年', en: 'Pop Punk' },
    icon: '🎸',
    tag: '热血',
    color: 'from-rose-500 to-red-600',
    description: {
      zh: '140-180 高速律动, 强力和弦, 直接歌词 — 青春躁动',
      en: 'Fast 140-180 BPM, power chords, direct punchy lyrics',
    },
    bpmRange: [140, 180],
    defaultDuration: 180,
    structure: 'V-C-V-C-B-C',
    melodicComplexity: 5,
    lyricComplexity: 4,
    styleHint: 'Pop-Punk, Punk-Rock, Emo, Alt-Rock',
    instruments: ['Electric Guitar', 'Live Drums', 'Bass Guitar'],
    tags: ['punk', 'rock', 'upbeat', 'youth'],
  },
  {
    id: 'ballad_emotional',
    name: { zh: '情感叙事', en: 'Emotional Ballad' },
    icon: '💧',
    tag: '抒情',
    color: 'from-sky-500 to-blue-700',
    description: {
      zh: '慢 60-80 BPM, 钢琴/弦乐主导, 说故事歌词',
      en: 'Slow 60-80 BPM, piano/strings, storytelling lyrics',
    },
    bpmRange: [60, 80],
    defaultDuration: 240,
    structure: 'V-V-C-V-C-B-C',
    melodicComplexity: 6,
    lyricComplexity: 9,
    styleHint: 'Ballad, Piano, Emotional, Singer-Songwriter',
    instruments: ['Grand Piano', 'String Ensemble', 'Vocal Solo'],
    tags: ['ballad', 'emotional', 'sad', 'love'],
  },
  {
    id: 'chinese_style',
    name: { zh: '国风古韵', en: 'Chinese Style' },
    icon: '🏮',
    tag: '国风',
    color: 'from-red-600 to-amber-800',
    description: {
      zh: '五声音阶、古风配器、意象歌词 (明月/清风/长亭)',
      en: 'Pentatonic scale, ancient instruments, imagery lyrics',
    },
    bpmRange: [80, 110],
    defaultDuration: 220,
    structure: 'classical_ci',
    melodicComplexity: 7,
    lyricComplexity: 10,
    styleHint: 'Chinese Traditional, GuFeng, GuoFeng',
    instruments: ['GuZheng', 'PiPa', 'ErHu', 'DiZi', 'Bamboo Flute'],
    tags: ['gufeng', 'chinese', 'traditional', '国风'],
  },
  {
    id: 'edm_banger',
    name: { zh: '电音炸裂', en: 'EDM Banger' },
    icon: '🎛️',
    tag: '炸场',
    color: 'from-cyan-400 to-violet-700',
    description: {
      zh: 'Build-up + Drop 结构、重击 120-140 BPM、派对/电音节',
      en: 'Build-drop structure, 120-140 heavy beat — club / festival',
    },
    bpmRange: [120, 140],
    defaultDuration: 270,
    structure: 'intro-build-drop-break-drop',
    melodicComplexity: 6,
    lyricComplexity: 3,
    styleHint: 'EDM, House, Dubstep, Festival Trap, Future Bass',
    instruments: ['Kick', 'Snare', 'Sub-Bass', 'Leadsaw Synth'],
    tags: ['edm', 'club', 'festival', 'banger'],
  },
  {
    id: 'kids_song',
    name: { zh: '童真童谣', en: 'Kids Song' },
    icon: '🧸',
    tag: '童趣',
    color: 'from-yellow-400 to-pink-500',
    description: {
      zh: '简单旋律、易懂重复歌词、欢快节奏——适合儿童',
      en: 'Simple melody, easy repetitive lyrics, cheerful — for children',
    },
    bpmRange: [100, 130],
    defaultDuration: 150,
    structure: 'AABA-repeat',
    melodicComplexity: 2,
    lyricComplexity: 2,
    styleHint: 'Children, Nursery, Playful',
    instruments: ['Toy Piano', 'Xylophone', 'Glockenspiel', 'Flute'],
    tags: ['kids', 'nursery', 'child', 'fun'],
  },
  {
    id: 'viral_short',
    name: { zh: '短视频爆款', en: 'Viral Short' },
    icon: '📱',
    tag: '爆款',
    color: 'from-emerald-500 to-teal-600',
    description: {
      zh: '15-30秒版, 前3秒必出钩子 — 抖音/Reels/Shorts 取向',
      en: '15-30s version, hook in first 3 seconds — Douyin/Reels/TikTok',
    },
    bpmRange: [110, 140],
    defaultDuration: 120,
    structure: 'hook-first-short',
    melodicComplexity: 6,
    lyricComplexity: 5,
    styleHint: 'TikTok Sound, Viral, Trendy, Short Video BGM',
    instruments: ['808 Bass', 'Trap Hi-hats', 'Catchy Vocal Sample'],
    tags: ['viral', 'douyin', 'shortvideo', 'tiktok'],
  },
];

/**
 * Structure templates — human-readable section patterns
 */
export const STRUCTURE_TEMPLATES = {
  'V-C-V-C-B-C-C': '标准: Verse → Chorus → Verse → Chorus → Bridge → Chorus → Chorus',
  'intro-build-climax-coda': '电影: Intro → Build → Climax → Coda',
  'intro-build-drop-break-drop': '电音: Intro → Build → Drop → Break → Drop',
  'loopable': '循环: Intro → Loop → Loop → Loop → Outro',
  'V-V-C-V-C-B-C': '抒情: Verse×2 → Chorus → Verse → Chorus → Bridge → Chorus',
  'V-C-V-C-B-C': '朋克/流行: Verse → Chorus ×2 → Bridge → Chorus',
  'free_form': '自由: 不规则结构',
  'classical_ci': '古风: 起 → 承 → 转 → 合',
  'AABA-repeat': '童谣: A-A-B-A 重复式',
  'hook-first-short': '短视频: Hook → Verse → Hook (15-30秒)',
};

/**
 * Get a strategy by id (returns default if not found)
 */
export function getStrategy(id) {
  return CREATIVE_STRATEGIES.find(s => s.id === id) || CREATIVE_STRATEGIES[1];
}

/**
 * Extract numeric defaults from a strategy for passing into generation params
 */
export function applyStrategyPreset(strategy, existingParams = {}) {
  if (!strategy) return existingParams;
  return {
    ...existingParams,
    bpm: existingParams.bpm || Math.round((strategy.bpmRange[0] + strategy.bpmRange[1]) / 2),
    duration: existingParams.duration || strategy.defaultDuration,
    style: existingParams.style || strategy.styleHint,
    structure: existingParams.structure || strategy.structure,
    melodicComplexity: existingParams.melodicComplexity || strategy.melodicComplexity,
    lyricComplexity: existingParams.lyricComplexity || strategy.lyricComplexity,
  };
}