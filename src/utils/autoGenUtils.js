/**
 * Auto Generation Utilities - 自动生成工具
 * 
 * Shared helpers for AUTO generation feature:
 * - Random lyric/theme generation using UnicornAgent's concept pools
 * - Auto-loop logic until credits exhausted
 * - Danger confirmation dialog texts
 * 
 * @module utils/autoGenUtils
 */

// === Theme & Style banks for random AUTO generation ===

const AUTO_THEMES = [
  'love', 'loneliness', 'sadness', 'dreams', 'hope', 'friendship',
  'success', 'nostalgia', 'freedom', 'healing', 'adventure', 'heartbreak',
  'ambition', 'nature', 'travel', 'urban_life', 'memory', 'romance',
  'triumph', 'companionship'
];

const AUTO_STYLES = [
  'pop', 'rock', 'electronic', 'jazz', 'classical', 'rnb',
  'tango', 'anime', 'chinese_classical', 'folk', 'country', 'reggae',
  'ambient', 'hip_hop', 'kpop', 'ballad'
];

const MUSE_STYLE_LIST = [
  '流行音乐', '流行舞曲', '流行说唱', 'R&B', '灵魂乐', '放克',
  '摇滚', '硬摇滚', '朋克', '金属', '哥特摇滚', '另类摇滚',
  '电子乐', 'EDM', '合成器流行', '深浩室', '科技舞曲', '梦幻电子',
  '说唱', '陷阱', 'Boom Bap', '西海岸说唱', '东岸说唱',
  '古典', '古典交响', '室内乐', '巴洛克', '浪漫主义', '爵士乐',
  '民谣', '古风', '中国风', '民歌', '乡村音乐', '蓝调',
  '拉丁', '雷鬼', '桑巴', '探戈', '弗拉门戈', 'K-Pop',
  '氛围音乐', '新世纪', '冥想', '环境音乐', 'Chillout'
];

const MELO_GENRE_LIST = [
  '流行', '摇滚', '电子', '民谣', '古风', 'R&B', '爵士', '古典',
  '嘻哈', '雷鬼', '蓝调', '乡村', '金属', '朋克', '灵魂',
  '放克', '迪斯科', '氛围', '新世纪', '凯尔特', '拉丁'
];

const MELO_MOOD_LIST = [
  '欢快', '忧伤', '浪漫', '激昂', '平静', '神秘', '紧张',
  '轻松', '深情', '豪迈', '治愈', '孤独', '狂欢', '思念',
  '励志', '怀旧', '梦幻', '力量', '温柔', '激情'
];

const AUTO_TITLE_PREFIXES = [
  '午夜', '星河', '雨后', '追风', '远方', '旧巷', '极光',
  '云端', '破晓', '落叶', '潮汐', '逆光', '微光', '晚风',
  '少年', '旅人', '候鸟', '旧梦', '山海', '烟火'
];

const AUTO_TITLE_SUFFIXES = [
  '之歌', '序曲', '独白', '叙事诗', '圆舞曲', '幻想曲', '随想曲',
  '练习曲', '夜曲', '协奏曲', '小夜曲', '赋格', '变奏曲', '安魂曲',
  '的回忆', '的告白', '的旅程', '的告别', '的约定', '的誓言'
];

// === Random helpers ===

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Pick a random combination of theme + style for auto generation
 */
export function pickRandomThemeStyle() {
  return {
    theme: rand(AUTO_THEMES),
    style: rand(AUTO_STYLES),
  };
}

/**
 * Generate a random title
 */
export function generateRandomTitle() {
  return rand(AUTO_TITLE_PREFIXES) + rand(AUTO_TITLE_SUFFIXES);
}

/**
 * Pick random Muse style
 */
export function pickRandomMuseStyle() {
  return rand(MUSE_STYLE_LIST);
}

/**
 * Pick random Melo tags (genres + moods + instruments + vocals)
 */
export function pickRandomMeloTags() {
  const numGenres = randInt(1, 3);
  const numMoods = randInt(1, 3);
  const genres = [];
  const moods = [];
  const genreCopy = [...MELO_GENRE_LIST];
  const moodCopy = [...MELO_MOOD_LIST];
  for (let i = 0; i < numGenres && genreCopy.length > 0; i++) {
    const idx = Math.floor(Math.random() * genreCopy.length);
    genres.push(genreCopy.splice(idx, 1)[0]);
  }
  for (let i = 0; i < numMoods && moodCopy.length > 0; i++) {
    const idx = Math.floor(Math.random() * moodCopy.length);
    moods.push(moodCopy.splice(idx, 1)[0]);
  }
  return { genres, moods };
}

/**
 * Pick random Suno style tags
 */
export function pickRandomSunoStyleTags() {
  const styleMap = {
    pop: 'pop, upbeat, catchy melody, modern production',
    rock: 'rock, electric guitar, heavy drums, powerful vocals',
    electronic: 'electronic, synthwave, arpeggiator, digital drums',
    hip_hop: 'hip hop, rap, beat, bassline, urban',
    ballad: 'ballad, piano, acoustic guitar, emotional vocals',
    jazz: 'jazz, saxophone, swing, smooth, improvisation',
    classical: 'classical, orchestra, violin, cello, dramatic',
    rnb: 'rnb, soul, piano, bass, smooth vocals',
    folk: 'folk, acoustic, storytelling, warm, earthy',
    ambient: 'ambient, atmospheric, drone, meditative, calming',
    epic: 'epic, cinematic, orchestra, choir, dramatic, heroic',
    ancient: 'ancient, chinese folk, guzheng, traditional, classical',
  };
  const styleKey = rand(Object.keys(styleMap));
  return {
    styleKey,
    tags: styleMap[styleKey],
    chips: styleMap[styleKey].split(',').map(s => s.trim()).filter(Boolean),
  };
}

// === Concept-pool-based lyric generation (fallback when UnicornAgent async is too heavy) ===

const SIMPLE_LYRIC_BANK = {
  love: [
    '[Verse 1]\n月光洒在你发梢\n像是我收藏的珍宝\n那一刻心跳的节拍\n连呼吸都变得美妙\n\n[Pre-Chorus]\n如果时光能停住一秒\n我希望是此刻的拥抱\n\n[Chorus]\n这就是爱 心跳的证据\n这就是你 命运的相遇\n不管明天会去向哪里\n有你在就是最好的结局',
    '[Verse 1]\n街角的咖啡店\n阳光洒落在窗边\n你抬头的那一瞬间\n世界仿佛按下暂停键\n\n[Pre-Chorus]\n我假装在看窗外的天\n余光却一直在你身边\n\n[Chorus]\\n喜欢你是我藏不住的秘密\n每一次心跳都在说愿意\n可不可以让我牵着你的手\n走过每一个春夏秋冬的温柔'
  ],
  dreams: [
    '[Verse 1]\n背着破旧的行囊\n走向未知的远方\n他们说这条路太长\n可我心里有方向\n\n[Pre-Chorus]\n就算跌倒也要笑着爬起\n每道伤疤都是勋章的印记\n\n[Chorus]\n我要追 追着光的方向\n我要飞 飞到云层之上\n梦想不会被现实埋葬\n汗水终会开出最耀眼的花',
    '[Verse 1]\n小时候写下的愿望\n藏在抽屉最底的地方\n长大后我终于敢回望\n那行字依然发着光\n\n[Pre-Chorus]\n他们说长大就会变现实\n可我偏要让现实变成诗\n\n[Chorus]\n梦想从来都不是奢侈\n是你敢不敢 迈出第一步的坚持\n就算全世界都说不可能\n我也要亲手写出 自己的传奇'
  ],
  loneliness: [
    '[Verse 1]\n凌晨三点的便利店\n只剩我和冷掉的咖啡\n城市安静得能听见\n路灯破碎的光影\n\n[Pre-Chorus]\n朋友说我最近有点沉默\n我说只是最近比较累而已\n\n[Chorus]\n孤独是一个人的狂欢\n狂欢是一群人的孤单\n我们在人潮里走散\n却谁都不敢先回头看',
    '[Verse 1]\n空荡的房间开着所有灯\n电视演着没在看的剧情\n手机开着静音等你的消息\n其实我知道 不会有回音\n\n[Pre-Chorus]\n热闹的聚会 我总是先走的那个\n因为我怕散场时的安静 更难过\n\n[Chorus]\n孤独是条漫长的走廊\n每扇门后都是另一段过往\n我学会了和自己对话\n却学不会 如何不想他'
  ],
  nostalgia: [
    '[Verse 1]\n翻开旧相册 阳光穿过尘埃\n那一年我们笑得 不知天高地厚\n校门口的老冰棍 五毛钱的快乐\n如今什么都有了 却少了点什么\n\n[Pre-Chorus]\n时间是个贪心的小偷\n偷走了岁月 却把回忆留给了我\n\n[Chorus]\n我怀念的不是旧时光\n是时光里的你 是那时的我们\n说好永远不分开的夏天\n如今只剩我一个人 还在原地等',
    '[Verse 1]\n老唱片机转动那首老歌\n音符里还是当年的温热\n窗外的蝉鸣 像没停过\n可窗边的少年 已经走了\n\n[Pre-Chorus]\n长大是一场无人送行的告别\n我们笑着挥手 转身却红了眼\n\n[Chorus]\n旧梦重游 我还是那个少年\n站在初遇的街口 等风也等你\n可风会来 你不会来\n只剩回忆的风 吹散我满怀'
  ],
  healing: [
    '[Verse 1]\n雨后的泥土芬芳\n阳光透过云层洒下\n一只蝴蝶停在窗台上\n它也知道 雨过了\n\n[Pre-Chorus]\n你看 花都在努力开着\n你也要 努力好起来啊\n\n[Chorus]\n一切都会好的 时间会给出答案\n那些流过的泪 会变成天上的星照亮你\n你值得被爱 值得所有温柔\n请你再等一等 春天正在路上',
    '[Verse 1]\n泡一杯热茶 放在手心\n窗外的世界 暂时别去关心\n深呼吸 听听心跳的声音\n它在说 一切都会过去\n\n[Pre-Chorus]\n别着急 你已经很努力了\n允许自己 偶尔也停下来喘口气\n\n[Chorus]\n治愈自己 是一生的课题\n允许难过 允许崩溃 允许不完美\n天黑之后一定会有天明\n你不是一个人 我们都陪着你'
  ],
  nature: [
    '[Verse 1]\n赤脚走在溪流边\n溪水凉过我的思念\n远山如黛 云雾如烟\n这一刻时间 都变得柔软\n\n[Pre-Chorus]\n风穿过竹林 奏着谁的歌\n我闭上眼 听懂了它在说什么\n\n[Chorus]\n山川河流 自有它的节奏\n人生一世 何必太匆匆\n你看那落花 从不问归期\n归于泥土 是另一种 永恒的延续',
    '[Verse 1]\n森林深处有一间木屋\n清晨被鸟儿的歌声唤醒\n推开窗 云海翻涌\n仿佛伸手就能触碰天空\n\n[Pre-Chorus]\n没有手机 没有消息\n只有风和树的对话 还有自己的呼吸\n\n[Chorus]\n自然是最温柔的治愈\n它不问你从哪里来 也不问你去哪里\n你只需静静地站在风里\n就让所有烦恼 都随云 飘散去'
  ]
};

/**
 * Generate lyrics for auto-mode using simple bank.
 * Falls back to a generic song when theme has no entry.
 */
export function generateAutoLyrics(theme) {
  const variants = SIMPLE_LYRIC_BANK[theme] || SIMPLE_LYRIC_BANK.dreams;
  return variants[Math.floor(Math.random() * variants.length)];
}

/**
 * Generate a Suno-style prompt for auto-mode (description mode)
 */
export function generateAutoSunoPrompt(theme, style) {
  const themeDescMap = {
    love: '一首深情款款的情歌，关于心动与告白的甜蜜瞬间',
    dreams: '一首热血励志的追梦之歌，充满希望与勇气的力量',
    loneliness: '一首孤独独白的都市夜曲，都市深夜的思考与感悟',
    sadness: '一首忧伤的抒情曲，关于离别与失去的痛苦回忆',
    hope: '一首充满希望的治愈之歌，雨后见彩虹的温暖力量',
    friendship: '一首友情岁月的暖心歌，共同成长的珍贵回忆',
    nostalgia: '一首怀旧的复古旋律，童年往事与旧时光的温柔想念',
    healing: '一首温柔治愈的心灵之歌，自我疗愈与接纳的温暖旅程',
    success: '一首胜利凯旋的辉煌乐章，拼搏成功后的荣耀与喜悦',
    freedom: '一首自由奔放的公路之歌，挣脱束缚奔向远方的冒险',
    heartbreak: '一首心碎的告别曲，爱而不得的伤感与释然',
    adventure: '一首冒险探索的史诗乐章，踏上未知旅程的勇气与激情',
    nature: '一首清新自然的田园风，山水之间的宁静与诗意',
    travel: '一首公路旅行的自由歌，沿途风景与人生感悟',
    urban_life: '一首都市生活的城市民谣，霓虹灯下的喜怒哀乐',
    memory: '一首回忆往事的怀旧歌，旧人旧事的温柔回望',
    romance: '一首浪漫缠绵的热恋曲，甜蜜相拥的幸福时光',
    triumph: '一首胜利归来的战歌，历尽艰辛后的凯旋与辉煌',
    companionship: '一首温馨陪伴的抒情曲，相依相伴的岁月静好',
    ambition: '一首雄心壮志的奋斗曲，少年意气风发追逐理想',
  };
  const desc = themeDescMap[theme] || themeDescMap.dreams;
  const styleDescMap = {
    pop: '现代流行风格，抓耳的旋律，精致的制作',
    rock: '摇滚风格，电吉他riff，强力鼓点，充满力量的主唱',
    electronic: '电子音乐风格，合成器音效，脉冲节奏，赛博未来感',
    jazz: '爵士风格，萨克斯独奏，摇摆节奏，慵懒午夜的氛围',
    classical: '古典风格，管弦乐团，小提琴与大提琴的交响，华丽大气',
    rnb: 'R&B节奏蓝调，灵魂唱腔，钢琴与贝斯，性感而温柔',
    tango: '探戈风格，三拍子节奏，优雅而激情，舞步回旋的韵律',
    anime: '二次元动漫风格，青春热血，夏日祭与校园的怀旧感',
    chinese_classical: '中国古风，古筝琵琶笛子，水墨意境，诗词韵律',
    folk: '民谣风格，木吉他，叙事性歌词，质朴温暖的质感',
    country: '乡村风格，木吉他，田园气息，质朴的生活感',
    reggae: '雷鬼风格，海岛节奏，慵懒阳光，自由放松的氛围',
    ambient: '氛围音乐，空灵飘渺，环境音景，冥想沉静的体验',
    hip_hop: '嘻哈说唱，街头律动，韵脚flow，真实有力的表达',
    kpop: 'K-Pop韩流风格，精致制作，副歌洗脑，舞台感十足',
    ballad: '抒情民谣，钢琴为主，情感真挚，催泪的旋律线条',
  };
  const sd = styleDescMap[style] || styleDescMap.pop;
  return `${desc}，${sd}。`;
}

/**
 * Generate a Muse-style prompt for auto-mode (quick mode)
 */
export function generateAutoMusePrompt(theme) {
  const prompts = [
    `一首关于${theme}的歌曲，旋律优美，情感真挚，结构完整，包含主歌副歌桥段`,
    `描绘${theme}的场景，用音乐讲一个动人的故事，配器丰富，层次分明`,
    `表达${theme}的情感，现代流行风格，副歌抓耳，让人一听就记住`,
    `${theme}主题的歌曲，有画面感的歌词，动听的旋律，治愈人心的力量`,
    `讲述一个关于${theme}的故事，叙事性强的歌词，感人的副歌，制作精良`,
  ];
  return rand(prompts);
}

/**
 * Estimate credits consumed per generation (rough upper bound)
 * Used for confirmation dialog warnings only — actual consumption is
 * determined by the real API/server.
 */
export function estimateCreditsPerGen(engine) {
  switch (engine) {
    case 'muse': return 14;
    case 'suno': return 10;
    case 'melo': return 14;
    default: return 10;
  }
}

// === Creative "thinking" process generator ===
// Produces a human-readable explanation of HOW the AI chose each song's
// theme, lyrics, style, and parameters — so the user can see the creative
// reasoning behind every AUTO iteration, not just the final output.

const THEME_INSPIRATION = {
  love: { feeling: '心动与告白的甜蜜瞬间', scene: '街角咖啡店的午后阳光', why: '想捕捉那种"世界按下暂停键"的心动时刻' },
  loneliness: { feeling: '都市深夜的疏离感', scene: '凌晨三点的便利店', why: '用最日常的场景承载最私密的孤独' },
  sadness: { feeling: '离别与失去的痛', scene: '雨天的车站月台', why: '悲伤需要被听见，音乐是最好的容器' },
  dreams: { feeling: '追梦的热血与坚持', scene: '清晨第一班地铁', why: '每个追梦人都值得一首属于自己的战歌' },
  hope: { feeling: '雨后见彩虹的温暖', scene: '暴风雨后的初晴', why: '在最暗的时刻点亮一束光' },
  friendship: { feeling: '共同成长的珍贵', scene: '毕业那年的操场', why: '友情是岁月给的最温柔的礼物' },
  nostalgia: { feeling: '旧时光的想念', scene: '翻开的旧相册', why: '时间偷走岁月，却把回忆留给我们' },
  healing: { feeling: '自我疗愈与接纳', scene: '雨后窗台的蝴蝶', why: '允许自己停下来，也是一种勇敢' },
  success: { feeling: '拼搏后的荣耀', scene: '领奖台的聚光灯', why: '每一滴汗水都值得被歌颂' },
  freedom: { feeling: '挣脱束缚的奔放', scene: '海岸公路的敞篷车', why: '自由是风，是远方，是不回头的勇气' },
  heartbreak: { feeling: '爱而不得的释然', scene: '搬家那天的空房间', why: '有些告别是为了更好的相遇' },
  adventure: { feeling: '未知的勇气', scene: '背包客的山径', why: '人生最美的风景都在未知里' },
  nature: { feeling: '山水之间的宁静', scene: '溪流边的赤脚', why: '自然是最温柔的治愈师' },
  travel: { feeling: '在路上的自由', scene: '车窗外的风景', why: '旅行的意义不在终点而在路上' },
  urban_life: { feeling: '霓虹灯下的喜怒哀乐', scene: '加班后的深夜地铁', why: '城市从不眠，故事在每盏灯下' },
  memory: { feeling: '旧人旧事的回望', scene: '老唱片的旋转', why: '回忆是时间留给我们的诗' },
  romance: { feeling: '热恋的甜蜜', scene: '夏夜的海边', why: '浪漫是两个人共享的宇宙' },
  triumph: { feeling: '凯旋的辉煌', scene: '战场的归途', why: '历经艰辛后的胜利最甘甜' },
  companionship: { feeling: '相依相伴的静好', scene: '阳台上的两杯茶', why: '最长情的告白是陪伴' },
  ambition: { feeling: '少年意气风发', scene: '天台上的远眺', why: '雄心是少年最闪亮的勋章' },
};

const STYLE_PHILOSOPHY = {
  pop: { instruments: '现代合成器 + 钢琴 + 流行鼓组', mood: '抓耳、易传唱、制作精致', color: '明亮温暖' },
  rock: { instruments: '电吉他 riff + 重型鼓点 + 贝斯', mood: '力量、爆发、不妥协', color: '炽热红橙' },
  electronic: { instruments: '合成器琶音 + 数字鼓机 + 低音', mood: '未来感、脉冲、赛博', color: '霓虹紫蓝' },
  jazz: { instruments: '萨克斯 + 钢琴 + 慢摇摆鼓', mood: '慵懒、即兴、午夜', color: '琥珀深棕' },
  classical: { instruments: '管弦乐团 + 小提琴 + 大提琴', mood: '华丽、戏剧性、史诗', color: '金色辉煌' },
  rnb: { instruments: '钢琴 + 灵魂贝斯 + 温柔鼓机', mood: '性感、温柔、深情', color: '酒红丝绒' },
  tango: { instruments: '手风琴 + 小提琴 + 三拍子鼓', mood: '优雅、激情、回旋', color: '深红玫瑰' },
  anime: { instruments: '合成器 + 电吉他 + 快速鼓', mood: '热血、青春、夏日祭', color: '天空蓝' },
  chinese_classical: { instruments: '古筝 + 琵琶 + 笛子', mood: '水墨、诗意、空灵', color: '青绿山水' },
  folk: { instruments: '木吉他 + 口琴 + 手鼓', mood: '质朴、叙事、温暖', color: '原木大地' },
  country: { instruments: '木吉他 + 班卓琴 + 小提琴', mood: '田园、质朴、生活', color: '麦田金黄' },
  reggae: { instruments: '雷鬼吉他 + 贝斯 + 海岛鼓', mood: '阳光、慵懒、自由', color: '加勒比绿' },
  ambient: { instruments: '环境音景 + 混响合成器 + 长音', mood: '空灵、冥想、沉静', color: '云雾白' },
  hip_hop: { instruments: '808 鼓机 + 贝斯 + 采样', mood: '街头、真实、有力', color: '街头灰' },
  kpop: { instruments: '合成器 + 电子鼓 + 副歌洗脑', mood: '舞台感、精致、活力', color: '粉紫霓虹' },
  ballad: { instruments: '钢琴 + 弦乐 + 真实鼓', mood: '催泪、真挚、情感', color: '月色银白' },
};

const BPM_LOGIC = [
  { bpm: 60, label: '慢板', reason: '适合深夜、冥想、忧伤情绪，让每个字都有重量' },
  { bpm: 75, label: '缓板', reason: '抒情叙事的黄金速度，给人喘息的空间' },
  { bpm: 85, label: '行板', reason: '爵士与灵魂乐的舒适区，慵懒而不拖沓' },
  { bpm: 95, label: '中板', reason: '民谣与R&B的甜蜜节奏，温柔而有律动' },
  { bpm: 110, label: '稍快', reason: '流行副歌的标准速度，抓耳又易传唱' },
  { bpm: 120, label: '标准', reason: '电子与舞曲的基础节拍，身体会不自觉跟着动' },
  { bpm: 128, label: '舞曲', reason: 'EDM 的经典 BPM，让心跳与节拍同步' },
  { bpm: 140, label: '快板', reason: '摇滚与朋克的血液，充满冲击力' },
  { bpm: 160, label: '急板', reason: '金属与硬核的极限，肾上腺素拉满' },
];

const KEY_LOGIC = {
  'C': '纯大调，明亮开阔，适合希望与胜利',
  'Cm': '自然小调，忧郁深邃，适合孤独与悲伤',
  'D': '明亮大调，温暖向上，适合梦想与治愈',
  'Dm': '忧伤小调，叙事性强，适合民谣与怀旧',
  'E': '明亮有力，吉他常用调，适合摇滚与热血',
  'Em': '忧郁小调，吉他开放弦，适合叙事与忧伤',
  'F': '庄严大调，管弦乐常用，适合史诗与古典',
  'Fm': '深沉小调，情感浓烈，适合激情与悲剧',
  'G': '明亮大调，民谣常用，适合温暖与自由',
  'Gm': '忧伤小调，爵士常用，适合午夜与沉思',
  'A': '明亮大调，乐队常用，适合青春与活力',
  'Am': '自然小调，最常用的小调，适合孤独与忧伤',
  'B': '明亮大调，金属常用，适合力量与冲击',
  'Bm': '忧郁小调，摇滚常用，适合挣扎与坚持',
};

/**
 * Generate a rich "creative thinking" entry explaining the AI's choices.
 * Returns a structured object the UI panel can render.
 *
 * @param {Object} opts - { iteration, theme, style, title, bpm, key, engine, lyricsSnippet, commandSent }
 * @returns {Object} thought entry with sections: meta, theme, style, lyrics, params, command, timestamp
 */
export function generateCreativeThought(opts) {
  const { iteration, theme, style, title, bpm, key, engine, lyricsSnippet, commandSent } = opts;
  const inspiration = THEME_INSPIRATION[theme] || THEME_INSPIRATION.dreams;
  const philosophy = STYLE_PHILOSOPHY[style] || STYLE_PHILOSOPHY.pop;
  const bpmInfo = BPM_LOGIC.find(b => b.bpm === bpm) || BPM_LOGIC[3];
  const keyReason = KEY_LOGIC[key] || KEY_LOGIC['Am'];

  return {
    timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    iteration,
    engine,
    title,
    sections: [
      {
        icon: '💭',
        label: '主题构思',
        title: `「${theme}」— ${inspiration.feeling}`,
        lines: [
          `灵感场景: ${inspiration.scene}`,
          `创作意图: ${inspiration.why}`,
        ],
      },
      {
        icon: '🎨',
        label: '风格定调',
        title: `「${style}」`,
        lines: [
          `配器思路: ${philosophy.instruments}`,
          `情绪走向: ${philosophy.mood}`,
          `声音色彩: ${philosophy.color}`,
        ],
      },
      {
        icon: '📝',
        label: '歌词片段',
        title: title,
        lines: [
          (lyricsSnippet || '').split('\n').slice(0, 4).join('\n'),
        ],
      },
      {
        icon: '🎚️',
        label: '音乐参数',
        title: `${bpm} BPM · ${key}`,
        lines: [
          `速度: ${bpmInfo.label} — ${bpmInfo.reason}`,
          `调性: ${key} — ${keyReason}`,
        ],
      },
      {
        icon: '📤',
        label: `发送给 ${engine} 的指令`,
        title: '实际请求内容',
        lines: [commandSent || '(见生成日志)'],
      },
    ],
  };
}

// === Confirmation dialog texts (DANGER zone!) ===

export const AUTO_CONFIRM = {
  title1: (engineName) => `⚠️ 危险：启动 ${engineName} AUTO 自动生成模式？`,
  title2: '⚠️ 二次确认：此操作将大量消耗积分',
  title3: '⚠️ 最后确认：您确定要"烧完"所有积分吗？',
  desc1: (engineName, credit) =>
    `AUTO 模式将持续调用 ${engineName} 生成歌曲，直到检测到积分 <= 0 才会停止。\n\n` +
    `当前可用积分：${credit}\n` +
    `预估每次消耗：约 10-14 积分\n` +
    `理论可生成：${Math.max(0, Math.floor(credit / 12))} ~ ${Math.max(0, Math.floor(credit / 10))} 首歌\n\n` +
    `请确认：一旦开始，除非手动刷新页面或点击"停止"，否则不会停止。\n` +
    `这将"烧掉"您账户里的全部积分，无法撤销！`,
  desc2: (engineName) =>
    `您正在启动一个高消耗操作，将持续使用 ${engineName} 生成歌曲。\n\n` +
    `此行为可能：\n` +
    `  • 在几十分钟内消耗全部剩余积分\n` +
    `  • 生成大量歌曲，需要手动前往官网整理收藏\n` +
    `  • 若为付费订阅，积分用尽后可能产生额外费用\n\n` +
    `请再次确认：您理解并愿意承担以上风险。`,
  desc3: (engineName, credit) =>
    `✅ 最后一次确认：\n\n` +
    `平台：${engineName}\n` +
    `当前积分：${credit}\n` +
    `操作：持续生成歌曲 → 直到积分归零\n\n` +
    `如果您现在点击"确认启动"，将立刻开始第一首歌的生成，\n` +
    `之后每首歌完成后会自动开始下一首，循环往复不会停止。\n\n` +
    `【请确认】：我已清楚以上后果，愿意为此操作负责。`,
  buttonConfirm: '我确认，启动 AUTO 模式',
  buttonCancel: '取消 (我再想想)',
};

export const GLOBAL_AUTO_CONFIRM = {
  title1: '⚠️ 超级危险：启动三平台 AUTO 同步生成？',
  title2: '⚠️ 二次确认：将同时消耗 Muse/Suno/Melo 三方积分',
  title3: '⚠️ 最终确认：三个平台的积分都会被用完',
  desc1: (credits) =>
    `GLOBAL AUTO 模式将同时启动三个平台（Muse AI / Suno AI / Melo AI）的自动生成，\n` +
    `每个平台都会独立循环，直到自己的积分归零为止。\n\n` +
    `当前各平台积分：\n` +
    `  • Muse  : ${credits.muse ?? '未知'}\n` +
    `  • Suno  : ${credits.suno ?? '未知'}\n` +
    `  • Melo  : ${credits.melo ?? '未知'}\n` +
    `合计约：${(credits.muse ?? 0) + (credits.suno ?? 0) + (credits.melo ?? 0)} 积分将全部消耗！\n\n` +
    `此操作极度危险，请确保您真的想"烧掉"三家全部积分。`,
  desc2: '您即将触发三平台并行自动生成，\n这意味着：\n\n' +
    '  • 可能在1-2小时内耗尽三个平台的全部剩余积分\n' +
    '  • 同时生成大量歌曲，官网历史记录会显著增长\n' +
    '  • 若有订阅到期提醒，积分用尽后可能触发充值提示\n' +
    '  • 页面 CPU / 内存占用会明显升高，请不要关闭页面\n\n' +
    '请再次确认：您愿意承担三平台积分同时耗尽的后果。',
  desc3: (credits, selected) =>
    `✅ 最终确认：\n\n` +
    `已选择平台：${selected.join(' + ')}\n` +
    `当前积分总计：${(credits.muse ?? 0) + (credits.suno ?? 0) + (credits.melo ?? 0)}\n` +
    `操作：多平台并行自动生成 → 各自循环直到归零\n\n` +
    `【请确认】我已完全理解后果，自愿启动此高消耗操作。`,
  platformSelectorTitle: '选择要并行生成的平台（可多选）',
  buttonConfirm: '启动 GLOBAL AUTO 三平台生成',
  buttonCancel: '取消操作',
};

export default {
  pickRandomThemeStyle,
  generateRandomTitle,
  pickRandomMuseStyle,
  pickRandomMeloTags,
  pickRandomSunoStyleTags,
  generateAutoLyrics,
  generateAutoSunoPrompt,
  generateAutoMusePrompt,
  estimateCreditsPerGen,
  AUTO_CONFIRM,
  GLOBAL_AUTO_CONFIRM,
};
