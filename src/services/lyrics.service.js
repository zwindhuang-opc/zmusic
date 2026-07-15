/**
 * LyricsService - 歌词生成服务
 * 
 * 本服务使用高级诗歌生成引擎和有限状态机(FSM)生成高质量歌词。
 * 支持多种音乐风格和主题，具备网络层架构、时间分段、动态控制、
 * 风格变体、古时空/今时空乐器分离等高级特性。
 * 
 * @module services/lyrics.service
 * @version 5.0.0
 * @author ZMusic Team
 */

import Logger from '../utils/logger.js';

const logger = new Logger('LyricsService');

// ============================================
// 高质量诗意行库（Poetic Lines）- 与unicorn-agent.js同步
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

// ============================================
// 押韵分组配置
// ============================================
const RHYME_GROUPS = {
  A: ['冷', '影', '境', '静', '径', '醒', '性', '兴', '幸', '晴', '清', '青', '轻', '情', '卿'],
  B: ['泪', '累', '类', '媚', '美', '眉', '梅', '月', '越', '跃', '夜', '也', '叶', '雪', '血', '绝', '决'],
  C: ['声', '生', '升', '胜', '城', '诚', '成', '程', '盛', '圣'],
  D: ['言', '颜', '烟', '缘', '圆', '原', '渊']
};

// ============================================
// 主题映射配置
// ============================================
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

// ============================================
// 歌曲结构配置
// ============================================
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
  ancient_modern: ['intro_ancient', 'verse1_ancient', 'interlude_modern', 'verse2_modern', 'chorus_fusion', 'bridge_ancient', 'finale_modern', 'ending_fusion']
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
    rhythms: ['稳定律动', '跳转节奏', '摇摆节奏', '断奏节奏'],
    styles: ['古典', '流行', '电子', '摇滚', '爵士', '民谣']
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

export class LyricsService {
  constructor() {
    logger.info('Initialized with advanced poetic engine v5 (Network Layer + Time Sections + Dynamic Control)');
  }

  getGenres() {
    return Object.keys(STRUCTURES);
  }

  getThemes() {
    return Object.keys(THEME_LINE_MAP);
  }

  /**
   * 基础歌词生成
   */
  generate(genre, theme, params = {}) {
    const themeKey = THEME_LINE_MAP[theme.toLowerCase()] || 'love';
    const linesData = POETIC_LINES[themeKey];
    const structure = STRUCTURES[genre] || STRUCTURES.pop;

    const sections = structure.map((sectionType) => {
      const normalizedType = this._normalizeSectionType(sectionType);
      const linesPool = linesData[normalizedType] || linesData.verse;

      const selectedLines = this._selectLines(linesPool, params.complexity || 5);

      return { type: sectionType, content: selectedLines.join('\n') };
    });

    return {
      genre,
      theme,
      structure,
      sections,
      fullText: sections.map(s => `[${s.type.toUpperCase()}]\n${s.content}`).join('\n\n'),
      generatedAt: new Date().toISOString(),
      meta: {
        sectionCount: sections.length,
        totalLines: sections.reduce((sum, s) => sum + s.content.split('\n').filter(l => l.trim()).length, 0),
        literaryAnalysis: this._analyzeLiteraryDevices(sections)
      }
    };
  }

  /**
   * 复杂歌词生成（带情感弧线）
   */
  generateComplex(genre, theme, params = {}) {
    const result = this.generate(genre, theme, { ...params, complexity: 8 });

    result.emotionalArc = this._analyzeEmotionalArc(result.sections);
    result.rhymeAnalysis = this._analyzeRhymeScheme(result.sections);

    return result;
  }

  /**
   * 网络层架构歌词生成（Network Layer Architecture）
   */
  generateNetworkLayer(genre, theme, params = {}) {
    const baseResult = this.generate(genre, theme, params);
    const bpm = params.bpm || 120;

    const foundation = this._buildFoundationLayer(bpm, theme, params);
    const melody = this._buildMelodyLayer(theme, params);
    const expression = this._buildExpressionLayer(theme, params);
    const effects = this._buildEffectsLayer(params);

    return {
      ...baseResult,
      networkLayer: {
        foundation,
        melody,
        expression,
        effects
      },
      fullCommand: this._formatNetworkLayerOutput(baseResult, foundation, melody, expression, effects),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 时间分段歌词生成（Suno-style）
   */
  generateTimeSection(genre, theme, params = {}) {
    const themeKey = THEME_LINE_MAP[theme.toLowerCase()] || 'love';
    const linesData = POETIC_LINES[themeKey];
    const totalDuration = params.duration || 270;
    const structure = STRUCTURES[genre] || STRUCTURES.pop;

    const sections = [];
    let currentTime = 0;

    structure.forEach((sectionType, index) => {
      const timeConfig = TIME_SECTION_CONFIG[sectionType.replace(/[0-9]/g, '')] || TIME_SECTION_CONFIG.verse1;
      const baseDuration = timeConfig.durationRange[1] - timeConfig.durationRange[0];
      const duration = Math.floor(baseDuration * totalDuration / 270);

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
        dynamicLevel: DYNAMIC_LEVELS[dynamic.split('→')[0]] || DYNAMIC_LEVELS.mp,
        instruments,
        timeSpace,
        content: selectedLines.join('\n')
      });

      currentTime += duration;
    });

    return {
      genre,
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
   * 风格变体歌词生成（Style Variations）
   */
  generateStyleVariation(genre, theme, styleType, variationKey, params = {}) {
    const variations = STYLE_VARIATIONS[styleType] || STYLE_VARIATIONS.tango;
    const variation = variations[variationKey] || variations.A;

    const baseResult = this.generate(genre, theme, params);

    return {
      ...baseResult,
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
      fullText: this._formatVariationOutput(baseResult, variation),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 诗歌生成
   */
  generatePoem(theme, params = {}) {
    const themeKey = THEME_LINE_MAP[theme.toLowerCase()] || 'love';
    const linesData = POETIC_LINES[themeKey];
    const coupletCount = params.couplets || 4;

    const couplets = [];
    const usedIndices = [];

    const allLines = [
      ...linesData.intro,
      ...linesData.verse,
      ...linesData.chorus,
      ...linesData.bridge,
      ...linesData.outro
    ];

    for (let i = 0; i < coupletCount; i++) {
      const available = allLines.filter((_, idx) => !usedIndices.includes(idx));
      if (available.length === 0) break;

      const pair = available[Math.floor(Math.random() * available.length)];
      const idx = allLines.indexOf(pair);
      usedIndices.push(idx);

      if (Array.isArray(pair)) {
        couplets.push(pair);
      } else {
        couplets.push([pair]);
      }
    }

    return {
      theme,
      couplets,
      fullText: couplets.map((c, i) => `第${i + 1}节\n${c.join('\n')}`).join('\n\n'),
      generatedAt: new Date().toISOString()
    };
  }

  // ============================================
  // 私有辅助方法
  // ============================================

  _normalizeSectionType(type) {
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

  _buildFoundationLayer(bpm, theme, params) {
    const template = params.foundationTemplate || NETWORK_LAYER_CONFIG.foundation.templates[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.foundation.templates.length)];
    const beat = params.beat || NETWORK_LAYER_CONFIG.foundation.beats[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.foundation.beats.length)];
    const rhythm = params.rhythm || NETWORK_LAYER_CONFIG.foundation.rhythms[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.foundation.rhythms.length)];

    return template
      .replace('{bpm}', bpm)
      .replace('{theme}', this._translateTheme(theme))
      .replace('{beat}', beat)
      .replace('{rhythm}', rhythm)
      .replace('{style}', params.style || NETWORK_LAYER_CONFIG.foundation.styles[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.foundation.styles.length)]);
  }

  _buildMelodyLayer(theme, params) {
    const template = params.melodyTemplate || NETWORK_LAYER_CONFIG.melody.templates[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.melody.templates.length)];
    const reference = params.reference || NETWORK_LAYER_CONFIG.melody.references[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.melody.references.length)];
    const feeling = params.feeling || NETWORK_LAYER_CONFIG.melody.feelings[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.melody.feelings.length)];
    const classicalElements = params.classicalElements || NETWORK_LAYER_CONFIG.melody.elements[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.melody.elements.length)];

    return template
      .replace('{reference}', reference)
      .replace('{feeling}', feeling)
      .replace('{classical_elements}', classicalElements);
  }

  _buildExpressionLayer(theme, params) {
    const template = params.expressionTemplate || NETWORK_LAYER_CONFIG.expression.templates[Math.floor(Math.random() * 2)];
    const sfx = params.sfx || NETWORK_LAYER_CONFIG.expression.sfx[Math.floor(Math.random() * 4)];
    const expressionTheme = params.expressionTheme || NETWORK_LAYER_CONFIG.expression.expressionThemes[Math.floor(Math.random() * 4)];
    const feature = params.feature || NETWORK_LAYER_CONFIG.expression.styleFeatures[Math.floor(Math.random() * 4)];

    return template
      .replace('{sfx}', sfx)
      .replace('{expression_theme}', expressionTheme)
      .replace('{feature}', feature);
  }

  _buildEffectsLayer(params) {
    const template = params.effectsTemplate || NETWORK_LAYER_CONFIG.effects.templates[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.effects.templates.length)];
    const introEffects = params.introEffects || NETWORK_LAYER_CONFIG.effects.introEffects[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.effects.introEffects.length)];
    const atmosphere = params.atmosphere || NETWORK_LAYER_CONFIG.effects.atmospheres[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.effects.atmospheres.length)];
    const finalElements = params.finalElements || NETWORK_LAYER_CONFIG.effects.finalElements[Math.floor(Math.random() * NETWORK_LAYER_CONFIG.effects.finalElements.length)];

    return template
      .replace('{intro_effects}', introEffects)
      .replace('{atmosphere}', atmosphere)
      .replace('{final_elements}', finalElements);
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
    if (sectionType.includes('bridge')) return 'pp→ppp';
    if (sectionType.includes('finale') || sectionType.includes('final') || sectionType.includes('ending')) return 'p→mf→pp';
    if (sectionType.includes('outro')) return 'pp';

    return 'mp';
  }

  _getInstrumentsForSection(sectionType, params) {
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

  _getTimeSpaceForSection(sectionType) {
    if (sectionType.includes('ancient')) return INSTRUMENT_TIME_SPACE.ancient;
    if (sectionType.includes('modern')) return INSTRUMENT_TIME_SPACE.modern;
    return INSTRUMENT_TIME_SPACE.fusion;
  }

  _translateTheme(theme) {
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
      tango: '探戈'
    };
    return translations[theme] || theme;
  }

  _formatNetworkLayerOutput(baseResult, foundation, melody, expression, effects) {
    return `[LAYER: FOUNDATION]\n${foundation}\n\n[LAYER: MELODY]\n${melody}\n\n[LAYER: EXPRESSION]\n${expression}\n\n[LAYER: EFFECTS]\n${effects}\n\n${baseResult.fullText}`;
  }

  _formatTimeSectionOutput(sections) {
    return sections.map(s => {
      const dynamicDesc = s.dynamicLevel ? ` [动态: ${s.dynamicLevel.name}]` : '';
      const instrumentsStr = s.instruments ? `\n[乐器: ${s.instruments.join(', ')}]` : '';
      const timeSpaceStr = s.timeSpace ? `\n[${s.timeSpace.name}]` : '';

      return `${s.timeSection}${dynamicDesc}${instrumentsStr}${timeSpaceStr}\n${s.content}`;
    }).join('\n\n');
  }

  _formatVariationOutput(baseResult, variation) {
    const header = `[标题：${variation.name}]\n\n${variation.description}\n\n核心设计：${variation.design}\n人声表现：${variation.vocals}\n效果重点：${variation.effects}\n乐器：${variation.instruments.join(', ')}\n语言：${variation.language}\n\n`;

    return header + baseResult.fullText;
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
      const lines = section.content.split('\n');
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

  _analyzeRhymeScheme(sections) {
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
}

export default LyricsService;