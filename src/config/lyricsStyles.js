export const LYRICS_STYLES = {
  heartbreaking: {
    name: 'lyrics_styles.heartbreaking',
    description: '虐心风格，悲伤心碎的情感表达',
    poeticFeatures: ['悲伤', '心碎', '离别', '痛苦', '回忆', '遗憾'],
    structure: ['verse_tearful', 'prechorus_building', 'chorus_crying', 'bridge_desperate', 'outro_fading'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['雨', '泪', '夜', '冷', '伤痕', '破碎']
  },
  healing: {
    name: 'lyrics_styles.healing',
    description: '治愈风格，温暖舒缓的歌词',
    poeticFeatures: ['温暖', '治愈', '希望', '重生', '光芒', '拥抱'],
    structure: ['verse_gentle', 'prechorus_warming', 'chorus_comforting', 'bridge_renewal', 'outro_peaceful'],
    rhymeScheme: 'AABB, ABBA',
    imagery: ['阳光', '花朵', '微风', '星空', '微笑', '拥抱']
  },
  time_travel: {
    name: 'lyrics_styles.time_travel',
    description: '穿越风格，时空交错的故事',
    poeticFeatures: ['穿越', '前世今生', '千年', '轮回', '宿命', '等待'],
    structure: ['verse_ancient', 'prechorus_transition', 'chorus_modern', 'bridge_convergence', 'outro_eternal'],
    rhymeScheme: 'ABAB, AABB',
    imagery: ['月光', '铜镜', '琴弦', '烽火', '时光', '轮回']
  },
  epic: {
    name: 'lyrics_styles.epic',
    description: '史诗风格，宏大壮丽的叙事',
    poeticFeatures: ['英雄', '征战', '豪情', '荣耀', '牺牲', '永恒'],
    structure: ['verse_prologue', 'prechorus_building', 'chorus_climax', 'bridge_battle', 'outro_triumphant'],
    rhymeScheme: 'ABAB, AABB',
    imagery: ['战鼓', '旌旗', '铠甲', '山河', '星辰', '王座']
  },
  dark: {
    name: 'lyrics_styles.dark',
    description: '暗黑风格，神秘压抑的氛围',
    poeticFeatures: ['黑暗', '恐惧', '孤独', '深渊', '诅咒', '救赎'],
    structure: ['verse_ominous', 'prechorus_tension', 'chorus_darkness', 'bridge_abyss', 'outro_redemption'],
    rhymeScheme: 'ABAB, ABCB',
    imagery: ['暗夜', '影子', '荆棘', '鲜血', '锁链', '蝙蝠']
  },
  romantic: {
    name: 'lyrics_styles.romantic',
    description: '浪漫风格，甜蜜柔情的爱情',
    poeticFeatures: ['浪漫', '爱情', '温柔', '甜蜜', '永恒', '誓言'],
    structure: ['verse_tender', 'prechorus_building', 'chorus_passionate', 'bridge_intimate', 'outro_forever'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['玫瑰', '月光', '心跳', '吻', '星空', '誓言']
  },
  nostalgic: {
    name: 'lyrics_styles.nostalgic',
    description: '怀旧风格，回忆往事的温馨',
    poeticFeatures: ['回忆', '童年', '青春', '岁月', '感伤', '怀念'],
    structure: ['verse_memory', 'prechorus_longing', 'chorus_sentimental', 'bridge_then_and_now', 'outro_fade'],
    rhymeScheme: 'ABAB, AABB',
    imagery: ['老照片', '蝉鸣', '校服', '单车', '夕阳', '旧时光']
  },
  energetic: {
    name: 'lyrics_styles.energetic',
    description: '活力风格，充满能量的歌词',
    poeticFeatures: ['活力', '激情', '梦想', '追逐', '热血', '自由'],
    structure: ['verse_intro', 'prechorus_build', 'chorus_drop', 'bridge_breakdown', 'outro_hype'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['火焰', '闪电', '翅膀', '奔跑', '呐喊', '舞台']
  },
  dreamy: {
    name: 'lyrics_styles.dreamy',
    description: '梦幻风格，空灵飘逸的意境',
    poeticFeatures: ['梦幻', '空灵', '仙境', '魔法', '精灵', '月光'],
    structure: ['verse_dream', 'prechorus_floating', 'chorus_magical', 'bridge_ethereal', 'outro_dissolve'],
    rhymeScheme: 'ABAB, AABB',
    imagery: ['云朵', '水晶', '萤火虫', '彩虹', '精灵', '幻境']
  },
  modern: {
    name: 'lyrics_styles.modern',
    description: '现代风格，时尚潮流的表达',
    poeticFeatures: ['都市', '潮流', '夜生活', '自由', '态度', '个性'],
    structure: ['verse_vibe', 'prechorus_build', 'chorus_hook', 'bridge_rap', 'outro_swagger'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['霓虹', '跑车', '耳机', '自拍', '舞台', '潮流']
  },
  ancient: {
    name: 'lyrics_styles.ancient',
    description: '古风风格，中国传统诗词韵味',
    poeticFeatures: ['古风', '诗词', '江湖', '红颜', '侠客', '山水'],
    structure: ['verse_poem', 'prechorus_elegant', 'chorus_classical', 'bridge_couplet', 'outro_haiku'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['墨香', '折扇', '古筝', '青衫', '江湖', '红颜']
  },
  indie: {
    name: 'lyrics_styles.indie',
    description: '独立风格，真实质朴的创作',
    poeticFeatures: ['真实', '自我', '孤独', '思考', '自由', '流浪'],
    structure: ['verse_story', 'prechorus_build', 'chorus_raw', 'bridge_introspective', 'outro_whisper'],
    rhymeScheme: 'ABAB, AABB',
    imagery: ['吉他', '咖啡', '路灯', '影子', '远方', '日记']
  },
  folk: {
    name: 'lyrics_styles.folk',
    description: '民谣风格，讲述故事的质朴',
    poeticFeatures: ['故事', '乡愁', '远方', '离别', '归来', '生活'],
    structure: ['verse_tale', 'prechorus_build', 'chorus_catchy', 'bridge_bridge', 'outro_home'],
    rhymeScheme: 'ABAB, AABB',
    imagery: ['炊烟', '麦田', '火车', '故乡', '老酒', '民谣']
  },
  kpop: {
    name: 'lyrics_styles.kpop',
    description: '韩流风格，精致流行的歌词',
    poeticFeatures: ['青春', '梦想', '友情', '爱情', '成长', '舞台'],
    structure: ['verse_verse', 'prechorus_pre', 'chorus_refrain', 'bridge_rap', 'outro_fade'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['星光', '舞台', '练习室', '应援', '梦想', '青春']
  },
  jazz: {
    name: 'lyrics_styles.jazz',
    description: '爵士风格，优雅慵懒的表达',
    poeticFeatures: ['优雅', '慵懒', '夜晚', '孤独', '酒吧', '香烟'],
    structure: ['verse_smooth', 'prechorus_build', 'chorus_swing', 'bridge_solo', 'outro_cool'],
    rhymeScheme: 'ABAB, AABB',
    imagery: ['萨克斯', '红酒', '夜灯', '烟雾', '高跟鞋', '雨夜']
  },
  classical: {
    name: 'lyrics_styles.classical',
    description: '古典风格，高雅精致的歌词',
    poeticFeatures: ['高雅', '优雅', '永恒', '爱情', '命运', '时光'],
    structure: ['verse_intro', 'prechorus_development', 'chorus_climax', 'bridge_recapitulation', 'outro_coda'],
    rhymeScheme: 'ABAB, AABB',
    imagery: ['钢琴', '小提琴', '玫瑰', '月光', '宫殿', '天鹅']
  },
  rnb: {
    name: 'lyrics_styles.rnb',
    description: 'R&B风格，性感流畅的表达',
    poeticFeatures: ['性感', '流畅', '夜晚', '诱惑', '亲密', '节奏'],
    structure: ['verse_smooth', 'prechorus_build', 'chorus_hook', 'bridge_adlib', 'outro_sexy'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['红酒', '烛光', '丝绸', '香水', '夜色', '心跳']
  },
  country: {
    name: 'lyrics_styles.country',
    description: '乡村风格，叙事性强的歌词',
    poeticFeatures: ['乡村', '生活', '爱情', '离别', '归来', '梦想'],
    structure: ['verse_story', 'prechorus_build', 'chorus_catchy', 'bridge_instrumental', 'outro_coda'],
    rhymeScheme: 'ABAB, AABB',
    imagery: ['牛仔', '公路', '农场', '吉他', '星星', '马车']
  },
  ambient: {
    name: 'lyrics_styles.ambient',
    description: '氛围风格，沉浸式的歌词',
    poeticFeatures: ['冥想', '自然', '宁静', '宇宙', '时间', '存在'],
    structure: ['verse_drone', 'prechorus_build', 'chorus_wave', 'bridge_ambient', 'outro_dissolve'],
    rhymeScheme: 'ABAB, ABCB',
    imagery: ['海洋', '森林', '星空', '云朵', '回声', '时间']
  },
  pop: {
    name: 'lyrics_styles.pop',
    description: '流行风格，朗朗上口的歌词',
    poeticFeatures: ['流行', '爱情', '快乐', '青春', '梦想', '友情'],
    structure: ['verse_verse', 'prechorus_pre', 'chorus_refrain', 'bridge_bridge', 'outro_outro'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['阳光', '笑容', '派对', '手机', '音乐', '青春']
  },
  rock: {
    name: 'lyrics_styles.rock',
    description: '摇滚风格，激情奔放的歌词',
    poeticFeatures: ['激情', '反叛', '自由', '梦想', '热血', '呐喊'],
    structure: ['verse_verse', 'prechorus_build', 'chorus_chorus', 'bridge_solo', 'outro_ending'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['吉他', '火焰', '舞台', '呐喊', '自由', '旗帜']
  },
  electronic: {
    name: 'lyrics_styles.electronic',
    description: '电子风格，迷幻动感的歌词',
    poeticFeatures: ['迷幻', '动感', '未来', '夜晚', '节奏', '释放'],
    structure: ['verse_build', 'prechorus_drop', 'chorus_bass', 'bridge_break', 'outro_fade'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['霓虹灯', 'DJ', '舞池', '电音', '未来', '光芒']
  },
  hip_hop: {
    name: 'lyrics_styles.hip_hop',
    description: '嘻哈风格，节奏感强的说唱',
    poeticFeatures: ['说唱', '街头', '态度', '梦想', '奋斗', '真实'],
    structure: ['verse_rap', 'prechorus_hook', 'chorus_catchy', 'bridge_verse', 'outro_flow'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['麦克风', '涂鸦', '球鞋', '街头', '梦想', '舞台']
  },
  ballad: {
    name: 'lyrics_styles.ballad',
    description: '抒情风格，旋律优美的歌词',
    poeticFeatures: ['深情', '温柔', '爱情', '离别', '思念', '永恒'],
    structure: ['verse_tender', 'prechorus_build', 'chorus_emotional', 'bridge_solo', 'outro_gentle'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['钢琴', '月光', '眼泪', '拥抱', '星星', '永恒']
  },
  chinese_traditional: {
    name: 'lyrics_styles.chinese_traditional',
    description: '中国传统风格，古典韵味',
    poeticFeatures: ['传统', '古典', '诗词', '山水', '意境', '雅致'],
    structure: ['verse_poem', 'prechorus_develop', 'chorus_climax', 'bridge_couplet', 'outro_elegant'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['古筝', '琵琶', '山水', '墨画', '诗词', '茶香']
  },
  chinese_classical: {
    name: 'lyrics_styles.chinese_classical',
    description: '中国古典风格，高雅精致',
    poeticFeatures: ['古典', '高雅', '宫廷', '诗词', '琴棋书画', '意境'],
    structure: ['verse_intro', 'prechorus_develop', 'chorus_climax', 'bridge_solo', 'outro_coda'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['古琴', '笛子', '宫殿', '牡丹', '诗词', '画卷']
  },
  love_song: {
    name: 'lyrics_styles.love_song',
    description: '情歌风格，真挚深情的爱情',
    poeticFeatures: ['爱情', '深情', '思念', '等待', '永恒', '承诺'],
    structure: ['verse_tender', 'prechorus_build', 'chorus_emotional', 'bridge_intimate', 'outro_forever'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['玫瑰', '戒指', '心跳', '吻', '星空', '誓言']
  },
  gothic_rock: {
    name: 'lyrics_styles.gothic_rock',
    description: '哥特摇滚风格，暗黑戏剧性',
    poeticFeatures: ['哥特', '暗黑', '神秘', '痛苦', '救赎', '永恒'],
    structure: ['verse_dark', 'prechorus_build', 'chorus_climax', 'bridge_dramatic', 'outro_ending'],
    rhymeScheme: 'ABAB, AABB',
    imagery: ['十字架', '蝙蝠', '古堡', '月光', '鲜血', '玫瑰']
  },
  ancient_modern: {
    name: 'lyrics_styles.ancient_modern',
    description: '古风现代融合，传统与现代',
    poeticFeatures: ['古今', '融合', '传承', '创新', '时空', '碰撞'],
    structure: ['verse_ancient', 'prechorus_transition', 'chorus_modern', 'bridge_fusion', 'outro_harmony'],
    rhymeScheme: 'ABAB, AABB',
    imagery: ['古筝', '电子', '汉服', '街头', '山水', '霓虹']
  },
  reggae: {
    name: 'lyrics_styles.reggae',
    description: '雷鬼风格，慵懒放松的歌词',
    poeticFeatures: ['放松', '自由', '爱', '和平', '自然', '快乐'],
    structure: ['verse_riff', 'prechorus_build', 'chorus_hook', 'bridge_solo', 'outro_chill'],
    rhymeScheme: 'AABB, ABAB',
    imagery: ['海滩', '椰树', '阳光', '雷鬼', '节奏', '自由']
  }
};

export const LYRICS_THEMES = {
  heartbreak: {
    name: 'lyrics_themes.heartbreak',
    description: '心碎主题，虐心悲伤的爱情故事',
    keywords: ['心碎', '离别', '痛苦', '背叛', '遗憾', '思念'],
    emotions: ['悲伤', '痛苦', '愤怒', '无奈', '思念', '释然']
  },
  healing: {
    name: 'lyrics_themes.healing',
    description: '治愈主题，温暖心灵的故事',
    keywords: ['治愈', '温暖', '希望', '重生', '拥抱', '光芒'],
    emotions: ['温暖', '平静', '希望', '感恩', '幸福', '安心']
  },
  time_travel: {
    name: 'lyrics_themes.time_travel',
    description: '穿越主题，时空交错的爱情',
    keywords: ['穿越', '前世今生', '千年', '轮回', '宿命', '等待'],
    emotions: ['惊奇', '感动', '宿命', '思念', '珍惜', '永恒']
  },
  epic_journey: {
    name: 'lyrics_themes.epic_journey',
    description: '史诗旅程，英雄征战的故事',
    keywords: ['英雄', '征战', '豪情', '荣耀', '牺牲', '使命'],
    emotions: ['热血', '激昂', '悲壮', '荣耀', '坚定', '感动']
  },
  dark_mystery: {
    name: 'lyrics_themes.dark_mystery',
    description: '暗黑神秘，悬疑惊悚的故事',
    keywords: ['黑暗', '神秘', '恐惧', '深渊', '诅咒', '救赎'],
    emotions: ['恐惧', '紧张', '神秘', '好奇', '救赎', '释然']
  },
  romantic_night: {
    name: 'lyrics_themes.romantic_night',
    description: '浪漫之夜，甜蜜柔情的爱情',
    keywords: ['浪漫', '夜晚', '爱情', '温柔', '亲密', '永恒'],
    emotions: ['甜蜜', '幸福', '心动', '温柔', '浪漫', '满足']
  },
  nostalgic_memory: {
    name: 'lyrics_themes.nostalgic_memory',
    description: '怀旧回忆，青春岁月的故事',
    keywords: ['回忆', '青春', '童年', '岁月', '感伤', '怀念'],
    emotions: ['感伤', '怀念', '温暖', '遗憾', '微笑', '释然']
  },
  energetic_party: {
    name: 'lyrics_themes.energetic_party',
    description: '活力派对，激情澎湃的夜晚',
    keywords: ['活力', '派对', '激情', '快乐', '自由', '释放'],
    emotions: ['兴奋', '快乐', '自由', '激情', '奔放', '满足']
  },
  dreamy_fantasy: {
    name: 'lyrics_themes.dreamy_fantasy',
    description: '梦幻幻想，魔法仙境的故事',
    keywords: ['梦幻', '魔法', '仙境', '精灵', '奇迹', '美好'],
    emotions: ['梦幻', '惊奇', '幸福', '美好', '陶醉', '向往']
  },
  modern_city: {
    name: 'lyrics_themes.modern_city',
    description: '现代都市，霓虹闪烁的生活',
    keywords: ['都市', '霓虹', '夜生活', '梦想', '自由', '孤独'],
    emotions: ['兴奋', '孤独', '迷茫', '向往', '自由', '坚定']
  },
  ancient_legend: {
    name: 'lyrics_themes.ancient_legend',
    description: '古老传说，神话故事的传承',
    keywords: ['传说', '神话', '英雄', '魔法', '传承', '永恒'],
    emotions: ['敬畏', '感动', '崇拜', '向往', '坚定', '传承']
  },
  indie_story: {
    name: 'lyrics_themes.indie_story',
    description: '独立故事，真实自我的表达',
    keywords: ['独立', '自我', '真实', '思考', '自由', '流浪'],
    emotions: ['孤独', '思考', '自由', '坚定', '释然', '成长']
  },
  folk_tale: {
    name: 'lyrics_themes.folk_tale',
    description: '民间故事，乡土风情的叙事',
    keywords: ['故事', '乡愁', '故乡', '传统', '生活', '温暖'],
    emotions: ['温暖', '怀念', '感动', '幸福', '踏实', '珍惜']
  },
  summer_vibes: {
    name: 'lyrics_themes.summer_vibes',
    description: '夏日氛围，阳光海滩的快乐',
    keywords: ['夏天', '阳光', '海滩', '快乐', '青春', '梦想'],
    emotions: ['快乐', '青春', '自由', '阳光', '热情', '美好']
  },
  winter_solitude: {
    name: 'lyrics_themes.winter_solitude',
    description: '冬日孤寂，寒冷中的思考',
    keywords: ['冬天', '寒冷', '孤独', '思考', '等待', '温暖'],
    emotions: ['孤独', '思考', '平静', '等待', '希望', '温暖']
  },
  spring_awakening: {
    name: 'lyrics_themes.spring_awakening',
    description: '春日觉醒，万物复苏的希望',
    keywords: ['春天', '觉醒', '希望', '新生', '成长', '美好'],
    emotions: ['希望', '新生', '美好', '感动', '活力', '憧憬']
  },
  autumn_melancholy: {
    name: 'lyrics_themes.autumn_melancholy',
    description: '秋日忧郁，季节变换的感伤',
    keywords: ['秋天', '落叶', '感伤', '离别', '回忆', '美好'],
    emotions: ['感伤', '回忆', '平静', '美好', '释然', '珍惜']
  },
  ocean_dreams: {
    name: 'lyrics_themes.ocean_dreams',
    description: '海洋之梦，广阔自由的向往',
    keywords: ['海洋', '自由', '梦想', '远方', '广阔', '宁静'],
    emotions: ['自由', '宁静', '向往', '平静', '广阔', '美好']
  },
  love: {
    name: 'lyrics_themes.love',
    description: '爱情主题，真挚深情的爱恋',
    keywords: ['爱情', '深情', '思念', '等待', '永恒', '承诺'],
    emotions: ['甜蜜', '思念', '幸福', '温柔', '感动', '坚定']
  },
  friendship: {
    name: 'lyrics_themes.friendship',
    description: '友情主题，真挚深厚的情谊',
    keywords: ['友情', '兄弟', '姐妹', '陪伴', '支持', '永恒'],
    emotions: ['温暖', '感动', '信任', '坚定', '幸福', '珍惜']
  },
  success: {
    name: 'lyrics_themes.success',
    description: '成功主题，奋斗后的荣耀',
    keywords: ['成功', '奋斗', '梦想', '荣耀', '坚持', '突破'],
    emotions: ['激动', '自豪', '喜悦', '坚定', '感恩', '满足']
  },
  dreams: {
    name: 'lyrics_themes.dreams',
    description: '梦想主题，追逐理想的故事',
    keywords: ['梦想', '追逐', '坚持', '勇气', '希望', '未来'],
    emotions: ['希望', '坚定', '勇气', '感动', '憧憬', '热血']
  },
  nature: {
    name: 'lyrics_themes.nature',
    description: '自然主题，大自然的美丽',
    keywords: ['自然', '山水', '花草', '天空', '宁静', '美好'],
    emotions: ['平静', '美好', '敬畏', '放松', '感动', '珍惜']
  },
  life: {
    name: 'lyrics_themes.life',
    description: '人生主题，生命的意义',
    keywords: ['人生', '生命', '意义', '成长', '感悟', '珍惜'],
    emotions: ['感悟', '珍惜', '平静', '感动', '坚定', '释然']
  },
  loneliness: {
    name: 'lyrics_themes.loneliness',
    description: '孤独主题，独自面对的坚强',
    keywords: ['孤独', '坚强', '独立', '思考', '成长', '释然'],
    emotions: ['孤独', '思考', '坚强', '释然', '平静', '成长']
  },
  sadness: {
    name: 'lyrics_themes.sadness',
    description: '悲伤主题，伤感的故事',
    keywords: ['悲伤', '痛苦', '离别', '遗憾', '思念', '释然'],
    emotions: ['悲伤', '痛苦', '思念', '无奈', '释然', '平静']
  },
  memory: {
    name: 'lyrics_themes.memory',
    description: '回忆主题，往事的追忆',
    keywords: ['回忆', '往事', '怀念', '感伤', '美好', '释然'],
    emotions: ['怀念', '感伤', '温暖', '遗憾', '微笑', '释然']
  },
  hope: {
    name: 'lyrics_themes.hope',
    description: '希望主题，困境中的光芒',
    keywords: ['希望', '光芒', '坚持', '勇气', '未来', '美好'],
    emotions: ['希望', '坚定', '勇气', '感动', '憧憬', '温暖']
  },
  lunatic: {
    name: 'lyrics_themes.lunatic',
    description: '疯狂主题，极致的情感表达',
    keywords: ['疯狂', '极致', '热情', '执着', '毁灭', '重生'],
    emotions: ['疯狂', '热情', '执着', '痛苦', '释放', '重生']
  },
  tango: {
    name: 'lyrics_themes.tango',
    description: '探戈主题，激情与优雅的结合',
    keywords: ['探戈', '激情', '优雅', '性感', '舞蹈', '节奏'],
    emotions: ['激情', '优雅', '性感', '陶醉', '热情', '浪漫']
  }
};

export function getLyricsStyleOptions() {
  return Object.entries(LYRICS_STYLES).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description,
    poeticFeatures: value.poeticFeatures
  }));
}

export function getLyricsThemeOptions() {
  return Object.entries(LYRICS_THEMES).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description,
    keywords: value.keywords
  }));
}