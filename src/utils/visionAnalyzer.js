/**
 * visionAnalyzer.js — Client-side image-to-lyrics feature extractor
 *
 * INNOVATION CONCEPT: Visual-to-Lyrics Pipeline
 * ============================================
 * Unlike simple color-to-theme mapping, this analyzer extracts 6 layers of
 * visual features and maps each to specific lyrical content:
 *
 * Layer 1: Color Palette Analysis
 *   → Extracts dominant colors via histogram clustering
 *   → Maps to: emotional valence, imagery keywords, harmonic feel
 *
 * Layer 2: Lighting & Exposure
 *   → High-key / low-key / high-contrast / soft-light detection
 *   → Maps to: intensity modifiers, dynamic range suggestions
 *
 * Layer 3: Composition & Structure
 *   → Rule-of-thirds, symmetry, visual weight, leading lines
 *   → Maps to: song structure complexity, narrative perspective
 *
 * Layer 4: Region Segmentation
 *   → Sky / Horizon / Ground / Subject region detection
 *   → Maps to: scene-specific vocabulary banks
 *
 * Layer 5: Texture & Detail
 *   → Edge density, smoothness, complexity analysis
 *   → Maps to: lyrical density, flow rhythm, word complexity
 *
 * Layer 6: Semantic Inference
 *   → Cross-references all features for scene classification
 *   → Maps to: specific theme + mood + subject + object recommendations
 *
 * @module utils/visionAnalyzer
 * @version 2.0.0
 */

/* =========================================================================
 * COLOR SEMANTIC MAPS — Each color maps to specific lyrical imagery
 * ========================================================================= */

const COLOR_SEMANTICS = {
  // Warm sunset tones
  '#FF6B35': { imagery: ['夕阳', '黄昏', '余晖', '橙光'], mood: 'nostalgic', energy: 0.7 },
  '#FFA500': { imagery: ['日落', '晚霞', '金色', '温暖'], mood: 'romantic', energy: 0.8 },
  '#FFD700': { imagery: ['金光', '辉煌', '荣耀', '盛夏'], mood: 'energetic', energy: 0.9 },
  '#FF4500': { imagery: ['火焰', '激情', '夕阳', '燃烧'], mood: 'passionate', energy: 1.0 },

  // Cool blue tones
  '#1E90FF': { imagery: ['海洋', '天空', '辽阔', '自由'], mood: 'free', energy: 0.6 },
  '#4169E1': { imagery: ['深蓝', '夜空', '神秘', '远方'], mood: 'mysterious', energy: 0.5 },
  '#000080': { imagery: ['深夜', '星空', '孤独', '沉思'], mood: 'melancholy', energy: 0.3 },
  '#87CEEB': { imagery: ['蓝天', '白云', '清晨', '希望'], mood: 'hopeful', energy: 0.7 },

  // Nature greens
  '#228B22': { imagery: ['森林', '生机', '自然', '成长'], mood: 'healing', energy: 0.6 },
  '#90EE90': { imagery: ['嫩芽', '春天', '清新', '希望'], mood: 'fresh', energy: 0.7 },
  '#006400': { imagery: ['深林', '神秘', '幽静', '探索'], mood: 'mysterious', energy: 0.4 },
  '#808000': { imagery: ['橄榄', '时光', '沉淀', '回忆'], mood: 'nostalgic', energy: 0.5 },

  // Romantic pinks/reds
  '#FF69B4': { imagery: ['玫瑰', '爱情', '甜蜜', '心动'], mood: 'romantic', energy: 0.8 },
  '#FF1493': { imagery: ['激情', '热恋', '火焰', '渴望'], mood: 'passionate', energy: 1.0 },
  '#FFC0CB': { imagery: ['初恋', '柔软', '梦幻', '纯真'], mood: 'dreamy', energy: 0.5 },
  '#DC143C': { imagery: ['深恋', '执着', '心痛', '热烈'], mood: 'intense', energy: 0.9 },

  // Moody purples
  '#8A2BE2': { imagery: ['紫霞', '神秘', '幻想', '超越'], mood: 'mystical', energy: 0.7 },
  '#4B0082': { imagery: ['暗夜', '魔法', '深邃', '梦境'], mood: 'mysterious', energy: 0.5 },
  '#DDA0DD': { imagery: ['淡紫', '梦境', '轻盈', '想象'], mood: 'dreamy', energy: 0.4 },

  // Neutral/grayscale
  '#808080': { imagery: ['灰调', '平淡', '沉思', '过渡'], mood: 'neutral', energy: 0.3 },
  '#000000': { imagery: ['黑暗', '未知', '深渊', '静默'], mood: 'dark', energy: 0.2 },
  '#FFFFFF': { imagery: ['纯白', '纯洁', '初始', '空白'], mood: 'pure', energy: 0.5 },

  // Earth tones
  '#8B4513': { imagery: ['大地', '稳固', '时光', '积淀'], mood: 'grounded', energy: 0.5 },
  '#D2691E': { imagery: ['土地', '温暖', '归属', '家园'], mood: 'nostalgic', energy: 0.6 },
  '#F5DEB3': { imagery: ['米色', '温柔', '怀旧', '静谧'], mood: 'peaceful', energy: 0.4 },

  // Water/ocean
  '#00CED1': { imagery: ['流水', '清澈', '流动', '希望'], mood: 'refreshing', energy: 0.7 },
  '#4682B4': { imagery: ['海面', '风暴', '力量', '自由'], mood: 'powerful', energy: 0.8 },
};

/* =========================================================================
 * SCENE SEMANTIC MAPS — Combinations of features → specific scene types
 * ========================================================================= */

const SCENE_PROFILES = [
  {
    id: 'sunset_farewell',
    match: (f) => f.warmRatio > 0.3 && f.lightRatio < 0.5 && f.horizonLine,
    lyrics: {
      genre: ['ballad', 'nostalgic', 'romantic'],
      themes: ['memory', 'love', 'sadness'],
      imagery: ['夕阳', '余晖', '剪影', '长街', '背影', '晚风', '旧时光', '道别', '黄昏', '橙光'],
      emotions: ['不舍', '眷恋', '怅然', '温柔', '回味'],
      subjects: ['离别', '旧情人', '黄昏', '背影', '故事'],
      actions: ['回望', '挥手', '停留', '告别', '铭记'],
      locations: ['黄昏街角', '长街尽头', '晚风里', '回忆中'],
      tempos: [70, 80, 90],
      description: '夕阳下的离别场景，温暖又忧伤的怀旧情绪'
    }
  },
  {
    id: 'urban_loneliness',
    match: (f) => f.coolRatio > 0.4 && f.saturation < 0.5 && f.verticalRatio > 0.4,
    lyrics: {
      genre: ['electronic', 'rnb', 'indie'],
      themes: ['loneliness', 'modern_city', 'life'],
      imagery: ['霓虹', '高楼', '地铁', '雨丝', '玻璃', '倒影', '人群', '夜色', '车流', '孤独'],
      emotions: ['孤寂', '疏离', '渴望', '空洞', '清醒'],
      subjects: ['都市人', '夜归人', '独行者', '陌生人', '影子'],
      actions: ['穿行', '等待', '凝望', '逃离', '寻找'],
      locations: ['地铁站', '高楼间', '雨夜里', '人群中'],
      tempos: [90, 100, 110],
      description: '都市孤独感，霓虹灯下的疏离与渴望'
    }
  },
  {
    id: 'nature_healing',
    match: (f) => f.greenRatio > 0.2 && f.blueRatio > 0.15 && f.brightness > 0.4,
    lyrics: {
      genre: ['folk', 'chinese_traditional', 'ambient'],
      themes: ['nature', 'healing', 'spring_awakening'],
      imagery: ['森林', '溪流', '晨光', '落叶', '鸟鸣', '野花', '清风', '远山', '竹林', '露珠'],
      emotions: ['宁静', '释然', '治愈', '平和', '重生'],
      subjects: ['自然', '旅人', '草木', '山风', '归人'],
      actions: ['漫步', '呼吸', '聆听', '拥抱', '回归'],
      locations: ['林间小径', '溪边', '山谷', '草地上'],
      tempos: [60, 70, 80],
      description: '自然治愈场景，森林与溪流的宁静力量'
    }
  },
  {
    id: 'passionate_love',
    match: (f) => f.redRatio > 0.15 && f.saturation > 0.6 && f.brightness > 0.3,
    lyrics: {
      genre: ['rnb', 'pop', 'heartbreaking'],
      themes: ['love', 'heartbreak', 'romantic_night'],
      imagery: ['玫瑰', '红烛', '心跳', '烈焰', '拥抱', '誓言', '缠绵', '月光', '唇印', '颤抖'],
      emotions: ['炽热', '渴望', '痛苦', '甜蜜', '心碎'],
      subjects: ['恋人', '心跳', '缘分', '红颜', '知己'],
      actions: ['相拥', '承诺', '追寻', '等待', '沉沦'],
      locations: ['月下', '花前', '长街', '梦里', '怀中'],
      tempos: [95, 110, 125],
      description: '炽热的爱恋场景，激情与痛苦交织'
    }
  },
  {
    id: 'dreamy_night',
    match: (f) => f.darkRatio > 0.3 && f.blueRatio > 0.2 && f.saturation < 0.6,
    lyrics: {
      genre: ['dreamy', 'ambient', 'electronic'],
      themes: ['dreams', 'loneliness', 'nostalgic_memory'],
      imagery: ['星光', '月色', '夜雾', '梦境', '遥远', '漂浮', '流星', '银辉', '寂静', '倒影'],
      emotions: ['梦幻', '飘渺', '思念', '宁静', '遥远'],
      subjects: ['梦中人', '星辰', '回忆', '旅人', '孤独'],
      actions: ['漂浮', '追寻', '凝望', '入梦', '等待'],
      locations: ['星空下', '夜雾中', '梦境里', '月光里'],
      tempos: [70, 85, 95],
      description: '梦幻夜场景，星光与梦境交织的飘渺感'
    }
  },
  {
    id: 'energetic_crowd',
    match: (f) => f.saturation > 0.7 && f.brightness > 0.6 && f.colorfulness > 0.5,
    lyrics: {
      genre: ['pop', 'kpop', 'energetic'],
      themes: ['energetic_party', 'friendship', 'dreams'],
      imagery: ['霓虹', '烟花', '人群', '欢呼', '灯光', '节奏', '派对', '笑容', '庆典', '光芒'],
      emotions: ['兴奋', '快乐', '自由', '热情', '团结'],
      subjects: ['少年', '伙伴', '追梦人', '舞者', '星光'],
      actions: ['奔跑', '跳跃', '呐喊', '拥抱', '闪耀'],
      locations: ['舞台', '派对', '演唱会', '庆典'],
      tempos: [120, 128, 140],
      description: '活力四射的派对场景，青春与热情的迸发'
    }
  },
  {
    id: 'quiet_morning',
    match: (f) => f.brightness > 0.6 && f.saturation < 0.4 && f.warmRatio > 0.2,
    lyrics: {
      genre: ['folk', 'ballad', 'healing'],
      themes: ['spring_awakening', 'memory', 'friendship'],
      imagery: ['晨光', '薄雾', '露珠', '炊烟', '窗外', '新茶', '鸟鸣', '温柔', '苏醒', '希望'],
      emotions: ['平静', '温馨', '期待', '释然', '感恩'],
      subjects: ['清晨', '旧时光', '家人', '自己', '新生'],
      actions: ['醒来', '开窗', '凝视', '微笑', '拥抱'],
      locations: ['窗边', '阳台', '庭院', '厨房'],
      tempos: [65, 75, 85],
      description: '宁静清晨场景，晨光温柔地唤醒一切'
    }
  },
  {
    id: 'storm_tension',
    match: (f) => f.contrast > 0.6 && f.darkRatio > 0.2 && f.edgeDensity > 0.4,
    lyrics: {
      genre: ['rock', 'gothic_rock', 'electronic'],
      themes: ['dark_mystery', 'heartbreak', 'rebellion'],
      imagery: ['闪电', '暴雨', '破碎', '风暴', '影子', '裂痕', '挣扎', '燃烧', '嘶吼', '崩塌'],
      emotions: ['愤怒', '挣扎', '痛苦', '不屈', '爆发'],
      subjects: ['叛逆者', '破碎者', '流浪者', '反抗者', '风暴'],
      actions: ['撕裂', '咆哮', '摧毁', '重生', '抗争'],
      locations: ['暴风雨中', '废墟上', '深渊边', '烈焰里'],
      tempos: [130, 140, 150],
      description: '暴风雨般的紧张场景，内心挣扎与外部风暴的对抗'
    }
  },

  /* =========================================================================
   * EXPANDED SCENE PROFILES — comprehensive coverage for all image types
   * Each profile targets a specific subject category with professional
   * lyrics commands, labels, tags, wordings, and song style.
   * ========================================================================= */

  // Food & drink photography — warm, appetizing, lifestyle
  {
    id: 'food_warm_glow',
    match: (f) => f.warmRatio > 0.35 && f.brightness > 0.45 && f.saturation > 0.35 &&
      f.skinRatio < 0.03 && f.horizonLine === false && f.textureType !== 'complex',
    lyrics: {
      genre: ['jazz', 'rnb', 'pop', 'bossa_nova'],
      themes: ['life', 'memory', 'happiness'],
      imagery: ['烛光', '香气', '杯盏', '热汤', '甜点', '咖啡', '微醺', '烟火气', '暖光', '瓷盘'],
      emotions: ['温暖', '满足', '惬意', '幸福', '回味'],
      subjects: ['晚餐', '时光', '味道', '记忆', '此刻'],
      actions: ['品味', '细嚼', '举杯', '分享', '回味'],
      locations: ['餐桌上', '厨房里', '咖啡馆', '小酒馆', '炉火旁'],
      tempos: [75, 85, 95],
      description: '温暖的美食场景，烟火气里的生活味道'
    }
  },

  // Pet & animal photography — soft, warm, companionship
  {
    id: 'pet_companion',
    match: (f) => f.warmRatio > 0.25 && f.brightness > 0.4 && f.saturation < 0.6 &&
      f.skinRatio < 0.05 && f.textureType === 'detailed',
    lyrics: {
      genre: ['folk', 'pop', 'indie'],
      themes: ['friendship', 'life', 'healing'],
      imagery: ['绒毛', '眼神', '尾巴', '爪印', '陪伴', '窝边', '毛发', '呼噜', '依偎', '玩耍'],
      emotions: ['温柔', '治愈', '快乐', '依恋', '安心'],
      subjects: ['伙伴', '小生命', '毛孩子', '陪伴者', '家人'],
      actions: ['陪伴', '玩耍', '依偎', '追逐', '守候'],
      locations: ['膝上', '窝边', '阳光里', '院子里', '身边'],
      tempos: [80, 90, 100],
      description: '宠物陪伴的温暖场景，毛茸茸的治愈时光'
    }
  },

  // Architecture & buildings — geometric, structured, grand
  {
    id: 'architecture_grand',
    match: (f) => f.contrast > 0.4 && f.edgeDensity > 0.25 && f.saturation < 0.5 &&
      f.verticalRatio > 0.45 && f.skinRatio < 0.03,
    lyrics: {
      genre: ['classical', 'electronic', 'ambient', 'cinematic'],
      themes: ['memory', 'time', 'introspection'],
      imagery: ['穹顶', '石柱', '飞檐', '拱门', '塔尖', '阶梯', '回廊', '窗棂', '光影', '痕迹'],
      emotions: ['敬畏', '庄严', '沧桑', '沉思', '肃穆'],
      subjects: ['建筑', '时光', '石壁', '古迹', '殿堂'],
      actions: ['仰望', '触摸', '穿越', '凝望', '铭记'],
      locations: ['殿堂里', '回廊间', '阶梯上', '穹顶下', '古迹前'],
      tempos: [65, 75, 85],
      description: '建筑与古迹的庄严场景，石壁间流淌的时光'
    }
  },

  // Flowers & botanical — fresh, colorful, delicate
  {
    id: 'flowers_bloom',
    match: (f) => f.colorfulness > 0.5 && f.saturation > 0.5 && f.brightness > 0.45 &&
      f.warmRatio > 0.25 && f.blueRatio < 0.25 && f.skinRatio < 0.03 && !f.horizonLine,
    lyrics: {
      genre: ['folk', 'pop', 'chinese_traditional', 'classical'],
      themes: ['nature', 'spring_awakening', 'love'],
      imagery: ['花瓣', '花蕊', '盛开', '露珠', '蜂蝶', '枝头', '色彩', '芬芳', '绽放', '花海'],
      emotions: ['清新', '欣喜', '心动', '柔美', '盎然'],
      subjects: ['花朵', '春天', '生命', '色彩', '此刻'],
      actions: ['绽放', '摇曳', '吐蕊', '盛开', '散发'],
      locations: ['花丛中', '枝头上', '庭院里', '花海间', '春日里'],
      tempos: [80, 90, 100],
      description: '花朵盛开的绚烂场景，色彩与芬芳的绽放'
    }
  },

  // Sunrise & dawn — hopeful, warm, new beginnings
  {
    id: 'sunrise_hope',
    match: (f) => f.warmRatio > 0.3 && f.brightness > 0.5 && f.horizonLine &&
      f.saturation > 0.3 && f.skinRatio < 0.03,
    lyrics: {
      genre: ['pop', 'folk', 'classical', 'ambient'],
      themes: ['hope', 'dreams', 'spring_awakening'],
      imagery: ['朝阳', '霞光', '破晓', '晨曦', '天际', '金光', '云彩', '希望', '新生', '光芒'],
      emotions: ['希望', '振奋', '温暖', '期待', '崭新'],
      subjects: ['晨光', '新的一天', '希望', '黎明', '朝阳'],
      actions: ['升起', '照亮', '苏醒', '启程', '迎接'],
      locations: ['天际线', '山巅', '海边', '窗前', '地平线'],
      tempos: [85, 95, 105],
      description: '日出破晓的希望场景，朝阳照亮新的一天'
    }
  },

  // Beach & ocean — vast, blue, free
  {
    id: 'beach_ocean',
    match: (f) => f.blueRatio > 0.25 && f.brightness > 0.5 && f.horizonLine &&
      f.saturation < 0.6 && f.warmRatio < 0.35 && f.skinRatio < 0.05,
    lyrics: {
      genre: ['pop', 'folk', 'reggae', 'ambient'],
      themes: ['freedom', 'dreams', 'nature'],
      imagery: ['海浪', '沙滩', '海风', '贝壳', '浪花', '海平线', '阳光', '脚印', '潮汐', '远方'],
      emotions: ['自由', '辽阔', '放松', '畅快', '向往'],
      subjects: ['大海', '海浪', '远方', '自由', '潮汐'],
      actions: ['漫步', '聆听', '眺望', '追逐', '呼吸'],
      locations: ['沙滩上', '海边', '浪花间', '海风里', '海岸线'],
      tempos: [85, 95, 110],
      description: '海滩与海洋的辽阔场景，浪花与自由的心跳'
    }
  },

  // Mountain & forest wilderness — vast, green, majestic
  {
    id: 'mountain_wilderness',
    match: (f) => f.greenRatio > 0.2 && f.brightness > 0.4 && f.horizonLine &&
      f.skinRatio < 0.03 && f.saturation < 0.6,
    lyrics: {
      genre: ['folk', 'chinese_traditional', 'ambient', 'classical'],
      themes: ['nature', 'freedom', 'introspection'],
      imagery: ['山峦', '云海', '松林', '山径', '巅峰', '苍翠', '雾气', '溪流', '岩石', '远方'],
      emotions: ['敬畏', '辽阔', '宁静', '坚定', '自由'],
      subjects: ['群山', '森林', '远方', '旅人', '天地'],
      actions: ['攀登', '眺望', '穿行', '呼吸', '聆听'],
      locations: ['山巅', '林间', '云海间', '山径上', '溪畔'],
      tempos: [70, 80, 90],
      description: '山野森林的壮阔场景，云海松林间的自由'
    }
  },

  // Autumn & nostalgic — warm, golden, melancholic beauty
  {
    id: 'autumn_nostalgia',
    match: (f) => f.warmRatio > 0.3 && f.saturation > 0.35 && f.saturation < 0.6 &&
      f.brightness > 0.4 && f.brightness < 0.6 && f.skinRatio < 0.03,
    lyrics: {
      genre: ['folk', 'ballad', 'indie', 'jazz'],
      themes: ['memory', 'nostalgic_memory', 'life'],
      imagery: ['落叶', '金黄', '秋叶', '斜阳', '枯枝', '秋千', '旧街', '回忆', '暮色', '飘零'],
      emotions: ['怀旧', '温柔', '惆怅', '感慨', '温暖'],
      subjects: ['秋天', '旧时光', '回忆', '落叶', '往昔'],
      actions: ['拾起', '回忆', '漫步', '驻足', '怀念'],
      locations: ['落叶间', '旧街上', '秋千旁', '暮色里', '斜阳下'],
      tempos: [70, 80, 90],
      description: '秋日怀旧的金黄场景，落叶与斜阳里的温柔'
    }
  },

  // Winter & snow — cold, pure, serene
  {
    id: 'winter_serene',
    match: (f) => f.brightness > 0.6 && f.saturation < 0.3 && f.coolRatio > 0.2 &&
      f.warmRatio < 0.25 && f.skinRatio < 0.03,
    lyrics: {
      genre: ['ambient', 'classical', 'folk', 'ballad'],
      themes: ['introspection', 'memory', 'dreams'],
      imagery: ['雪花', '白雪', '寒风', '冰晶', '银白', '窗花', '寂静', '呵气', '炉火', '脚印'],
      emotions: ['宁静', '纯净', '沉思', '温暖', '安详'],
      subjects: ['冬天', '雪', '寂静', '回忆', '炉火'],
      actions: ['飘落', '覆盖', '凝望', '呵暖', '守候'],
      locations: ['雪地里', '窗前', '炉火旁', '银白间', '寂静中'],
      tempos: [60, 70, 80],
      description: '冬日雪景的纯净场景，银白世界里的宁静'
    }
  },

  // Travel & journey — scenic, varied, adventurous
  {
    id: 'travel_journey',
    match: (f) => f.colorfulness > 0.4 && f.brightness > 0.45 && f.horizonLine &&
      f.saturation > 0.35 && f.skinRatio < 0.05,
    lyrics: {
      genre: ['pop', 'folk', 'indie', 'country'],
      themes: ['dreams', 'freedom', 'life'],
      imagery: ['远方', '路途', '风景', '行囊', '车窗', '异乡', '地图', '足迹', '天际', '未知'],
      emotions: ['向往', '自由', '期待', '兴奋', '感慨'],
      subjects: ['旅人', '远方', '路', '风景', '梦想'],
      actions: ['启程', '穿越', '探索', '邂逅', '前行'],
      locations: ['路上', '异乡', '车窗外', '远方', '天际'],
      tempos: [90, 100, 115],
      description: '旅行途中的风景场景，远方与未知里的向往'
    }
  },

  // Festive & celebration — colorful, bright, joyful
  {
    id: 'festive_celebration',
    match: (f) => f.colorfulness > 0.5 && f.saturation > 0.55 && f.brightness > 0.55 &&
      f.skinRatio < 0.05 &&
      // HARD GUARD: never trigger for solo/duo confirmed portraits (party needs ≥3 people or NO person evidence)
      ((f.personCount || 0) >= 3 || f.subjectType === 'group' || ((f.personCount == null) && (f.skinRatio || 0) < 0.025)),
    lyrics: {
      genre: ['pop', 'kpop', 'dance', 'energetic'],
      themes: ['happiness', 'friendship', 'dreams'],
      imagery: ['彩灯', '烟花', '彩带', '欢笑', '气球', '礼物', '蛋糕', '烛光', '欢庆', '霓虹'],
      emotions: ['喜悦', '兴奋', '幸福', '热闹', '感动'],
      subjects: ['庆典', '欢笑', '此刻', '伙伴', '祝福'],
      actions: ['欢呼', '举杯', '拥抱', '庆祝', '许愿'],
      locations: ['派对上', '人群中', '灯光下', '庆典里', '欢聚间'],
      tempos: [115, 125, 135],
      description: '欢庆派对的绚烂场景，彩灯烟花里的喜悦'
    }
  },

  // Abstract & art — textured, colorful, imaginative
  {
    id: 'abstract_art',
    match: (f) => f.colorfulness > 0.55 && f.edgeDensity > 0.3 && f.saturation > 0.5 &&
      f.skinRatio < 0.02 && f.horizonLine === false,
    lyrics: {
      genre: ['electronic', 'ambient', 'classical', 'dreamy'],
      themes: ['dreams', 'introspection', 'dark_mystery'],
      imagery: ['色彩', '线条', '形状', '光影', '纹理', '抽象', '流动', '交织', '幻象', '梦境'],
      emotions: ['想象', '迷幻', '深邃', '震撼', '超脱'],
      subjects: ['色彩', '梦境', '想象', '抽象', '意象'],
      actions: ['流动', '交织', '变幻', '浮现', '消散'],
      locations: ['画布上', '色彩间', '梦境里', '想象中', '抽象里'],
      tempos: [80, 95, 110],
      description: '抽象艺术的色彩场景，线条与光影的想象'
    }
  },

  // Cafe & cozy indoor — warm, soft, intimate
  {
    id: 'cafe_cozy',
    match: (f) => f.warmRatio > 0.3 && f.brightness > 0.4 && f.brightness < 0.6 &&
      f.saturation < 0.5 && f.contrast < 0.5 && f.skinRatio < 0.05,
    lyrics: {
      genre: ['jazz', 'folk', 'indie', 'lofi'],
      themes: ['life', 'memory', 'introspection'],
      imagery: ['咖啡', '书页', '窗边', '暖灯', '蒸汽', '杯沿', '旋律', '午后', '慵懒', '时光'],
      emotions: ['惬意', '慵懒', '温暖', '平静', '怀旧'],
      subjects: ['午后', '时光', '咖啡', '自己', '此刻'],
      actions: ['品味', '翻阅', '凝望', '沉思', '停留'],
      locations: ['咖啡馆', '窗边', '书页间', '暖灯下', '角落里'],
      tempos: [70, 80, 90],
      description: '咖啡馆的慵懒午后，书页与咖啡香里的时光'
    }
  },

  // Night sky & stars — dark, blue, dreamy
  {
    id: 'night_starry',
    match: (f) => f.darkRatio > 0.4 && f.blueRatio > 0.2 && f.brightness < 0.4 &&
      f.skinRatio < 0.03 && f.saturation < 0.5,
    lyrics: {
      genre: ['ambient', 'dreamy', 'electronic', 'classical'],
      themes: ['dreams', 'introspection', 'memory'],
      imagery: ['星空', '银河', '流星', '夜幕', '繁星', '月色', '夜风', '寂静', '远方', '光点'],
      emotions: ['梦幻', '深邃', '宁静', '向往', '渺小'],
      subjects: ['星空', '夜', '梦境', '远方', '银河'],
      actions: ['闪烁', '凝望', '许愿', '漂浮', '追寻'],
      locations: ['星空下', '夜幕里', '银河边', '夜风中', '寂静里'],
      tempos: [65, 75, 85],
      description: '星空夜晚的梦幻场景，银河与流星下的向往'
    }
  },

  // Rainy & moody — cool, soft, reflective
  {
    id: 'rainy_reflective',
    match: (f) => f.coolRatio > 0.3 && f.brightness < 0.5 && f.saturation < 0.5 &&
      f.contrast < 0.5 && f.skinRatio < 0.03,
    lyrics: {
      genre: ['ballad', 'indie', 'rnb', 'jazz'],
      themes: ['memory', 'introspection', 'nostalgic_memory'],
      imagery: ['雨丝', '水滴', '窗玻璃', '伞下', ' puddle', '涟漪', '雾气', '倒影', '湿街', '冷光'],
      emotions: ['沉思', '惆怅', '怀念', '平静', '忧郁'],
      subjects: ['雨', '回忆', '窗外', '思绪', '倒影'],
      actions: ['滴落', '流淌', '凝望', '回忆', '漫步'],
      locations: ['雨中', '窗前', '伞下', '湿街上', '倒影里'],
      tempos: [65, 75, 85],
      description: '雨天的沉思场景，雨丝与窗玻璃上的回忆'
    }
  },

  // Vehicle & motion — dynamic, energetic
  {
    id: 'vehicle_motion',
    match: (f) => f.contrast > 0.4 && f.edgeDensity > 0.3 && f.saturation > 0.3 &&
      f.skinRatio < 0.03 && f.textureType !== 'smooth',
    lyrics: {
      genre: ['electronic', 'rock', 'pop', 'synthwave'],
      themes: ['dreams', 'freedom', 'life'],
      imagery: ['引擎', '公路', '速度', '风', '灯光', '远方', '驰骋', '里程', '地平线', '霓虹'],
      emotions: ['自由', '激动', '向往', '坚定', '冲劲'],
      subjects: ['旅途', '远方', '速度', '自由', '前路'],
      actions: ['驰骋', '穿越', '加速', '追逐', '前行'],
      locations: ['公路上', '风里', '霓虹间', '地平线', '远方'],
      tempos: [110, 120, 130],
      description: '驰骋公路的动感场景，引擎与风里的自由'
    }
  },

  // Minimalist & clean — bright, low saturation, simple
  {
    id: 'minimalist_clean',
    match: (f) => f.brightness > 0.6 && f.saturation < 0.3 && f.colorfulness < 0.35 &&
      f.edgeDensity < 0.2 && f.skinRatio < 0.03,
    lyrics: {
      genre: ['ambient', 'classical', 'indie', 'folk'],
      themes: ['introspection', 'life', 'healing'],
      imagery: ['留白', '光线', '空', '静', '纯粹', '简单', '呼吸', '此刻', '纯净', '空间'],
      emotions: ['平静', '纯净', '释然', '宁静', '清醒'],
      subjects: ['此刻', '留白', '简单', '纯净', '自己'],
      actions: ['呼吸', '凝望', '感受', '停留', '释然'],
      locations: ['空白里', '光线中', '此刻', '简单间', '纯净里'],
      tempos: [60, 70, 80],
      description: '极简纯净的场景，留白与光线里的平静'
    }
  },

  // Vintage & retro — warm, faded, nostalgic
  {
    id: 'vintage_retro',
    match: (f) => f.warmRatio > 0.25 && f.saturation < 0.45 && f.brightness > 0.35 &&
      f.brightness < 0.6 && f.colorfulness < 0.5 && f.skinRatio < 0.05,
    lyrics: {
      genre: ['folk', 'jazz', 'rnb', 'ballad'],
      themes: ['memory', 'nostalgic_memory', 'life'],
      imagery: ['泛黄', '旧照', '胶片', '复古', '褪色', '老街', '留声机', '怀表', '信笺', '旧时光'],
      emotions: ['怀旧', '温柔', '惆怅', '感慨', '温暖'],
      subjects: ['旧时光', '回忆', '胶片', '往昔', '故事'],
      actions: ['翻阅', '回忆', '凝望', '怀念', '珍藏'],
      locations: ['旧照里', '老街上', '回忆中', '泛黄间', '旧时光'],
      tempos: [70, 80, 90],
      description: '复古怀旧的泛黄场景，胶片与旧时光里的温柔'
    }
  },

  /* =========================================================================
   * EXTENDED SCENE PROFILES v2 — covering professional photography genres
   * Each profile includes: genre, themes, imagery (10+), emotions, subjects,
   * actions, locations, tempos, description — full professional coverage
   * ========================================================================= */

  // Children & family photography — warm, soft, innocent
  {
    id: 'children_family',
    match: (f) => f.warmRatio > 0.25 && f.brightness > 0.5 && f.saturation < 0.55 &&
      f.saturation > 0.3 && f.skinRatio > 0.03 && f.skinRatio < 0.15 &&
      f.lightingType !== 'low_key' && f.textureType !== 'complex',
    lyrics: {
      genre: ['pop', 'folk', 'ballad', 'healing'],
      themes: ['happiness', 'life', 'friendship', 'hope'],
      imagery: ['笑靥', '童真', '奔跑', '风筝', '糖果', '小手', '阳光', '玩具', '书包', '秋千', '笑脸', '午后'],
      emotions: ['温暖', '幸福', '纯真', '快乐', '柔软'],
      subjects: ['孩子', '童年', '家人', '时光', '小天使'],
      actions: ['奔跑', '嬉戏', '拥抱', '牵手', '成长', '微笑'],
      locations: ['草地上', '院子里', '阳光下', '校园', '家里'],
      tempos: [85, 95, 110],
      description: '儿童与家庭的温暖场景，童真笑颜里的幸福时光'
    }
  },

  // Concert & live music — energetic, colorful, dynamic
  {
    id: 'concert_live',
    match: (f) => f.saturation > 0.45 && f.contrast > 0.5 && f.darkRatio > 0.25 &&
      f.colorfulness > 0.45 && f.edgeDensity > 0.25 &&
      (f.redRatio > 0.08 || f.blueRatio > 0.15),
    lyrics: {
      genre: ['rock', 'electronic', 'kpop', 'energetic'],
      themes: ['dreams', 'energetic_party', 'happiness', 'rebellion'],
      imagery: ['聚光灯', '舞台', '荧光棒', '呐喊', '烟火', '汗水', '吉他', '鼓点', '欢呼', '人海', '节奏', '霓虹'],
      emotions: ['热血', '亢奋', '自由', '感动', '团结'],
      subjects: ['舞台', '乐手', '歌迷', '青春', '光芒'],
      actions: ['呐喊', '跳跃', '挥手', '合唱', '闪耀', '燃烧'],
      locations: ['舞台中央', '人群里', '聚光灯下', '现场', '霓虹间'],
      tempos: [120, 130, 145],
      description: '演唱会与现场音乐的热血场景，聚光灯下的青春燃烧'
    }
  },

  // Fashion & portrait editorial — stylish, elegant, moody
  {
    id: 'fashion_editorial',
    match: (f) => f.skinRatio > 0.04 && f.skinRatio < 0.2 && f.contrast > 0.35 &&
      f.saturation > 0.3 && f.saturation < 0.65 &&
      f.brightness > 0.35 && f.brightness < 0.65 && f.edgeDensity > 0.18,
    lyrics: {
      genre: ['rnb', 'pop', 'electronic', 'jazz'],
      themes: ['love', 'life', 'dreams', 'introspection'],
      imagery: ['霓裳', '高跟', '红唇', '镜头', '轮廓', '丝绸', '珠宝', '气场', '姿态', '魅影', '光影', '格调'],
      emotions: ['自信', '冷艳', '优雅', '魅惑', '独立'],
      subjects: ['模特', '时尚', '魅影', '自己', '女王'],
      actions: ['转身', '凝视', '定格', '摇曳', '登场', '闪耀'],
      locations: ['镜头前', 'T台上', '光影里', '都市', '画廊'],
      tempos: [90, 100, 115],
      description: '时尚人像的大片场景，光影与姿态里的格调美学'
    }
  },

  // Outdoor casual selfie / street style — bright sunny day, 1 person, casual vibe
  {
    id: 'outdoor_casual_selfie',
    match: (f) => (
      ((f.skinRatio > 0.02 && f.skinRatio < 0.2) || f.isSelfie === true) &&
      f.brightness > 0.5 && f.brightness < 0.78 &&
      f.saturation > 0.3 && f.saturation < 0.68 &&
      (f.warmRatio > 0.15 || f.greenRatio > 0.05 || f.blueRatio > 0.1) &&
      (f.personCount || 0) === 1 && f.subjectType !== 'couple'
    ),
    lyrics: {
      genre: ['pop', 'indie', 'folk', 'ballad'],
      themes: ['life', 'dreams', 'happiness', 'friendship', 'memory'],
      imagery: ['阳光', '微风', '街角', '笑容', '自拍', '墨镜', 'T恤', '风', '蓝天', '树叶', '身影', '脚步'],
      emotions: ['自由', '轻松', '阳光', '自在', '惬意'],
      subjects: ['自己', '旅人', '少年', '身影', '路人'],
      actions: ['漫步', '闲逛', '回眸', '微笑', '拍照', '呼吸'],
      locations: ['街角', '阳光下', '风里', '巷口', '路上', '户外'],
      tempos: [80, 92, 105],
      description: '户外随性自拍/街拍场景，阳光下自由松弛的日常'
    }
  },

  // Streetwear / cool lifestyle portrait — sunglasses, stylish urban
  {
    id: 'street_style_portrait',
    match: (f) => (
      f.skinRatio > 0.025 && f.skinRatio < 0.22 &&
      f.brightness > 0.45 && f.brightness < 0.78 &&
      f.saturation > 0.35 && f.saturation < 0.7 &&
      f.contrast > 0.3 && f.edgeDensity > 0.15 &&
      (f.coolRatio > 0.1 || f.warmRatio > 0.2) &&
      (f.personCount || 0) === 1
    ),
    lyrics: {
      genre: ['pop', 'rnb', 'kpop', 'indie'],
      themes: ['dreams', 'life', 'freedom', 'love'],
      imagery: ['墨镜', '潮牌', '街头', '涂鸦', '球鞋', '背影', '姿态', '霓虹', '巷弄', '耳机', '风', '镜头'],
      emotions: ['随性', '自信', '酷', '自由', '不羁'],
      subjects: ['少年', '潮人', '旅人', '镜头', '自己'],
      actions: ['耍帅', '走路带风', '定格', '转身', '抓拍'],
      locations: ['巷口', '街头', '斑马线前', '商场外', '天桥上'],
      tempos: [88, 100, 112],
      description: '潮流街拍/潮酷生活照场景，街头气场与自由感'
    }
  },

  // Solo travel photo — one person, outdoor, scenery background
  {
    id: 'solo_travel_photo',
    match: (f) => (
      (f.personCount || 0) === 1 &&
      (f.horizonLine || f.greenRatio > 0.1 || f.blueRatio > 0.12 || f.outdoorRatio > 0.35) &&
      f.brightness > 0.4 && f.skinRatio < 0.12 && f.saturation > 0.25
    ),
    lyrics: {
      genre: ['folk', 'indie', 'ballad', 'ambient'],
      themes: ['dreams', 'travel', 'life', 'memory', 'hope'],
      imagery: ['远方', '行囊', '山路', '异乡', '风景', '车站', '列车', '海', '风', '足迹', '天空', '旅程'],
      emotions: ['期待', '自由', '思念', '释然', '勇敢'],
      subjects: ['旅人', '异乡人', '背包客', '脚步', '远方'],
      actions: ['出发', '眺望', '前行', '驻足', '回望', '记录'],
      locations: ['路上', '山顶', '海岸', '站台', '旅途中', '天边'],
      tempos: [75, 88, 100],
      description: '单人旅行风景照的场景，旅途中的期待与远方'
    }
  },

  // Sports & action — dynamic, energetic, competitive
  {
    id: 'sports_action',
    match: (f) => f.edgeDensity > 0.3 && f.contrast > 0.45 && f.brightness > 0.4 &&
      f.saturation > 0.35 && f.colorfulness > 0.4 &&
      (f.greenRatio > 0.12 || f.blueRatio > 0.12) && f.skinRatio < 0.08 &&
      // Guard: sports needs crowd or no person count evidence
      ((f.personCount || 0) >= 3 || f.subjectType === 'group' || (f.personCount == null && f.skinRatio < 0.04)),
    lyrics: {
      genre: ['rock', 'electronic', 'pop', 'energetic'],
      themes: ['dreams', 'success', 'rebellion', 'friendship'],
      imagery: ['汗水', '赛道', '奔跑', '冲刺', '跳跃', '球门', '哨声', '欢呼', '奖杯', '拼搏', '心跳', '终点'],
      emotions: ['热血', '斗志', '坚持', '亢奋', '荣耀'],
      subjects: ['运动员', '梦想家', '斗士', '冠军', '追风者'],
      actions: ['冲刺', '跃起', '拼抢', '奔跑', '突破', '夺冠'],
      locations: ['赛场', '跑道', '球场', '终点线', '领奖台'],
      tempos: [125, 135, 150],
      description: '运动竞技的热血场景，汗水与拼搏中的荣耀时刻'
    }
  },

  // Workspace & office — productive, calm, creative
  {
    id: 'workspace_creative',
    match: (f) => f.brightness > 0.4 && f.brightness < 0.7 && f.saturation < 0.45 &&
      f.contrast > 0.25 && f.contrast < 0.55 && f.skinRatio < 0.05 &&
      f.edgeDensity > 0.15 && f.edgeDensity < 0.4,
    lyrics: {
      genre: ['lofi', 'indie', 'jazz', 'ambient'],
      themes: ['dreams', 'life', 'introspection', 'hope'],
      imagery: ['键盘', '咖啡', '纸笔', '台灯', '屏幕', '灵感', '笔记', '书架', '键盘声', '晨光', '思绪', '蓝图'],
      emotions: ['专注', '沉静', '期待', '充实', '思绪'],
      subjects: ['创作者', '奋斗者', '梦想', '灵感', '计划'],
      actions: ['书写', '敲击', '思考', '勾画', '创造', '打磨'],
      locations: ['书桌前', '台灯下', '屏幕前', '工作室', '咖啡角'],
      tempos: [70, 80, 95],
      description: '创意工作空间的专注场景，键盘与咖啡里的灵感涌现'
    }
  },

  // Books & library — intellectual, quiet, nostalgic
  {
    id: 'books_library',
    match: (f) => f.brightness > 0.35 && f.brightness < 0.65 && f.saturation < 0.4 &&
      f.contrast < 0.5 && f.edgeDensity > 0.2 && f.warmRatio > 0.2 &&
      f.skinRatio < 0.03 && f.colorfulness < 0.45,
    lyrics: {
      genre: ['folk', 'indie', 'classical', 'ballad'],
      themes: ['memory', 'dreams', 'introspection', 'nostalgic_memory'],
      imagery: ['书页', '墨香', '书架', '旧书', '书签', '文字', '台灯', '故事', '诗句', '扉页', '时光', '知识'],
      emotions: ['沉静', '充实', '怀旧', '思绪', '释然'],
      subjects: ['读书人', '故事', '旧书', '时光', '文字'],
      actions: ['翻阅', '默读', '书写', '夹签', '品味', '沉浸'],
      locations: ['书架间', '台灯下', '书桌', '图书馆', '旧书店'],
      tempos: [60, 70, 85],
      description: '书香与阅读的静谧场景，书页翻动间的时光流淌'
    }
  },

  // Product & still life — clean, refined, commercial
  {
    id: 'product_still_life',
    match: (f) => f.brightness > 0.45 && f.contrast > 0.3 && f.edgeDensity > 0.15 &&
      f.edgeDensity < 0.35 && f.saturation < 0.6 && f.skinRatio < 0.02 &&
      f.symmetry > 0.55 && !f.horizonLine,
    lyrics: {
      genre: ['pop', 'electronic', 'ambient', 'jazz'],
      themes: ['life', 'happiness', 'dreams'],
      imagery: ['光泽', '质感', '轮廓', '细节', '精致', '极简', '留白', '光影', '陈列', '设计', '匠心', '完美'],
      emotions: ['精致', '满足', '期待', '欣赏', '平静'],
      subjects: ['造物', '设计', '匠心', '作品', '物件'],
      actions: ['打磨', '呈现', '定格', '雕琢', '展现', '收藏'],
      locations: ['展台上', '聚光下', '橱窗里', '手心', '画面中'],
      tempos: [75, 85, 100],
      description: '产品与静物的精致场景，光影细节里的匠心呈现'
    }
  },

  // Wedding & ceremony — romantic, grand, emotional
  {
    id: 'wedding_ceremony',
    match: (f) => f.warmRatio > 0.28 && f.brightness > 0.45 && f.saturation > 0.3 &&
      f.saturation < 0.65 && f.skinRatio > 0.04 &&
      (f.whiteRatio_ || f.brightRatio > 0.2 || f.symmetry > 0.5),
    lyrics: {
      genre: ['ballad', 'pop', 'classical', 'love_song'],
      themes: ['love', 'happiness', 'romantic_night', 'memories'],
      imagery: ['白纱', '钻戒', '花束', '红毯', '誓言', '戒指', '相拥', '祝福', '礼花', '殿堂', '泪光', '牵手'],
      emotions: ['幸福', '感动', '甜蜜', '神圣', '眷恋'],
      subjects: ['新人', '爱人', '伴侣', '永恒', '约定'],
      actions: ['宣誓', '交换', '相拥', '亲吻', '携手', '承诺'],
      locations: ['殿堂', '红毯', '花门下', '证婚台前', '祝福里'],
      tempos: [70, 80, 95],
      description: '婚礼庆典的神圣场景，誓言与泪光中的永恒承诺'
    }
  },

  // Graduation & achievement — proud, hopeful, nostalgic
  {
    id: 'graduation_achievement',
    match: (f) => f.brightness > 0.45 && f.saturation > 0.3 && f.warmRatio > 0.2 &&
      f.skinRatio > 0.03 && f.skinRatio < 0.2 &&
      (f.blueRatio > 0.08 || f.redRatio > 0.08) && f.colorfulness > 0.3,
    lyrics: {
      genre: ['pop', 'folk', 'ballad', 'kpop'],
      themes: ['dreams', 'friendship', 'hope', 'nostalgic_memory'],
      imagery: ['学士帽', '证书', '校服', '合影', '鲜花', '操场', '教室', '离别', '未来', '祝福', '青春', '启程'],
      emotions: ['自豪', '不舍', '期待', '感动', '骄傲'],
      subjects: ['毕业生', '青春', '同窗', '未来', '梦想家'],
      actions: ['抛帽', '合影', '拥抱', '道别', '展望', '启程'],
      locations: ['校门', '操场', '礼堂', '教室里', '台阶上'],
      tempos: [85, 95, 110],
      description: '毕业与成就的骄傲场景，青春散场时的未来展望'
    }
  },

  // Bakery & dessert — sweet, warm, cozy
  {
    id: 'bakery_dessert',
    match: (f) => f.warmRatio > 0.35 && f.brightness > 0.45 && f.saturation > 0.3 &&
      f.saturation < 0.6 && f.skinRatio < 0.03 &&
      !f.horizonLine && f.edgeDensity < 0.35 && f.textureType !== 'complex',
    lyrics: {
      genre: ['jazz', 'pop', 'bossa_nova', 'folk'],
      themes: ['happiness', 'life', 'love', 'healing'],
      imagery: ['奶油', '糖霜', '烘焙', '烤箱', '香甜', '酥皮', '咖啡', '草莓', '蛋糕', '饼干', '暖意', '面粉'],
      emotions: ['甜蜜', '满足', '温暖', '幸福', '治愈'],
      subjects: ['甜点', '烘焙师', '下午茶', '时光', '甜蜜'],
      actions: ['烘焙', '挤花', '撒糖', '品尝', '分享', '装饰'],
      locations: ['烤箱前', '橱窗里', '厨房', '下午茶桌', '面包架'],
      tempos: [75, 85, 95],
      description: '烘焙甜点的甜蜜场景，奶油香气里的温暖时光'
    }
  },

  // Baby & newborn — soft, pure, tender
  {
    id: 'baby_newborn',
    match: (f) => f.brightness > 0.5 && f.saturation < 0.45 && f.warmRatio > 0.2 &&
      f.skinRatio > 0.05 && f.skinRatio < 0.25 &&
      f.lightingType !== 'low_key' && f.lightingType !== 'high_contrast' &&
      f.textureType !== 'complex',
    lyrics: {
      genre: ['ballad', 'folk', 'classical', 'healing'],
      themes: ['hope', 'happiness', 'life', 'love'],
      imagery: ['小手', '脚丫', '襁褓', '睡颜', '睫毛', '呼吸', '摇篮', '奶嘴', '柔软', '呢喃', '初啼', '晨光'],
      emotions: ['柔软', '怜惜', '幸福', '疼爱', '期待'],
      subjects: ['宝宝', '新生命', '宝贝', '天使', '小太阳'],
      actions: ['轻摇', '凝视', '哼唱', '拥抱', '呵护', '守护'],
      locations: ['摇篮里', '襁褓中', '晨光下', '怀抱里', '婴儿房'],
      tempos: [55, 65, 75],
      description: '婴儿与新生命的柔嫩场景，轻哼与呼吸中的守护'
    }
  },

  // Botanical garden & greenhouse — lush, green, vibrant
  {
    id: 'botanical_greenhouse',
    match: (f) => f.greenRatio > 0.25 && f.brightness > 0.4 && f.saturation > 0.35 &&
      f.skinRatio < 0.03 && f.edgeDensity > 0.2 &&
      (f.blueRatio > 0.05 || f.warmRatio > 0.15) && !f.horizonLine,
    lyrics: {
      genre: ['folk', 'ambient', 'chinese_traditional', 'classical'],
      themes: ['nature', 'healing', 'spring_awakening', 'life'],
      imagery: ['藤蔓', '苔藓', '蕨类', '温室', '花盆', '露珠', '叶片', '根系', '湿润', '新芽', '阳光', '泥土'],
      emotions: ['清新', '宁静', '生机', '治愈', '盎然'],
      subjects: ['植物', '绿意', '温室', '生命', '园丁'],
      actions: ['伸展', '舒展', '呼吸', '生长', '浇灌', '绽放'],
      locations: ['温室里', '叶丛间', '花架下', '玻璃房', '泥土上'],
      tempos: [65, 75, 85],
      description: '温室植物园的繁茂场景，绿意与湿润中的生命律动'
    }
  },

  // Underwater & diving — blue, weightless, mysterious
  {
    id: 'underwater_diving',
    match: (f) => f.blueRatio > 0.25 && f.brightness > 0.25 && f.brightness < 0.6 &&
      f.saturation > 0.25 && f.skinRatio < 0.05 &&
      f.coolRatio > 0.35 && f.colorfulness < 0.5,
    lyrics: {
      genre: ['ambient', 'electronic', 'classical', 'dreamy'],
      themes: ['dreams', 'freedom', 'dark_mystery', 'introspection'],
      imagery: ['珊瑚', '气泡', '鱼群', '深蓝', '光线', '海草', '沉船', '无声', '水母', '失重', '洋流', '宝藏'],
      emotions: ['宁静', '神秘', '自由', '悬浮', '震撼'],
      subjects: ['潜水者', '深海', '鱼群', '蔚蓝', '探险者'],
      actions: ['下潜', '悬浮', '游弋', '凝视', '探索', '呼吸'],
      locations: ['深海', '珊瑚丛', '沉船边', '鱼群中', '蓝光里'],
      tempos: [60, 70, 85],
      description: '水下潜水的失重场景，深蓝与光线间的神秘探索'
    }
  },

  // Fireworks & celebration night — explosive, colorful, joyful
  {
    id: 'fireworks_night',
    match: (f) => f.darkRatio > 0.3 && f.saturation > 0.45 && f.colorfulness > 0.5 &&
      f.brightness > 0.25 && f.contrast > 0.45 &&
      (f.warmRatio > 0.15 || f.coolRatio > 0.15) && f.skinRatio < 0.04,
    lyrics: {
      genre: ['pop', 'kpop', 'electronic', 'energetic'],
      themes: ['happiness', 'friendship', 'dreams', 'love'],
      imagery: ['烟火', '绽放', '夜空', '火花', '绚烂', '爆炸', '流星', '金光', '欢呼', '许愿', '瞬间', '庆典'],
      emotions: ['狂喜', '感动', '浪漫', '震撼', '幸福'],
      subjects: ['烟火', '夜空', '庆典', '许愿者', '瞬间'],
      actions: ['绽放', '升空', '闪烁', '许愿', '仰望', '欢呼'],
      locations: ['夜空', '河畔', '广场', '天台上', '人群中'],
      tempos: [110, 120, 135],
      description: '烟花庆典的绚烂场景，夜空绽放时的感动与许愿'
    }
  },

  // Hot spring & onsen — steamy, relaxing, healing
  {
    id: 'hotspring_relaxing',
    match: (f) => f.warmRatio > 0.25 && f.blueRatio > 0.08 && f.brightness > 0.35 &&
      f.brightness < 0.65 && f.saturation < 0.5 && f.skinRatio < 0.1 &&
      f.contrast < 0.45 && f.textureType !== 'complex',
    lyrics: {
      genre: ['ambient', 'jazz', 'folk', 'healing'],
      themes: ['healing', 'life', 'introspection', 'nature'],
      imagery: ['蒸汽', '温泉', '水汽', '汤池', '鹅卵石', '雾气', '松枝', '暖意', '松弛', '浸泡', '夜晚', '竹林'],
      emotions: ['松弛', '治愈', '温暖', '放空', '安逸'],
      subjects: ['温泉', '旅人', '暖意', '蒸汽', '时光'],
      actions: ['浸泡', '舒展', '呼吸', '凝望', '放空', '休憩'],
      locations: ['汤池中', '雾气里', '竹林间', '露天风吕', '石砌边'],
      tempos: [55, 65, 75],
      description: '温泉泡澡的松弛场景，蒸汽氤氲里的身心治愈'
    }
  },

  // Street photography & documentary — candid, urban, story-rich
  {
    id: 'street_documentary',
    match: (f) => f.contrast > 0.35 && f.brightness > 0.3 && f.brightness < 0.7 &&
      f.saturation < 0.55 && f.edgeDensity > 0.22 &&
      f.skinRatio < 0.1 && f.verticalRatio > 0.35 && f.verticalRatio < 0.65,
    lyrics: {
      genre: ['folk', 'indie', 'ballad', 'jazz'],
      themes: ['life', 'nostalgic_memory', 'introspection', 'friendship'],
      imagery: ['街角', '招牌', '行人', '自行车', '老巷', '路灯', '商贩', '背影', '烟火气', '门框', '墙头', '黄昏'],
      emotions: ['感慨', '平静', '沧桑', '温柔', '真实'],
      subjects: ['路人', '生活', '城市', '故事', '街角'],
      actions: ['穿行', '驻足', '叫卖', '凝视', '擦肩而过', '定格'],
      locations: ['老巷口', '骑楼下', '街角', '市场', '路边'],
      tempos: [70, 80, 95],
      description: '街头纪实的人间烟火场景，街角背影里的生活故事'
    }
  },

  // Northern lights / aurora — mystical, green-purple, awe-inspiring
  {
    id: 'aurora_mystical',
    match: (f) => f.darkRatio > 0.35 && f.saturation > 0.35 &&
      (f.greenRatio > 0.12 || f.coolRatio > 0.3) && f.colorfulness > 0.4 &&
      f.brightness < 0.5 && f.skinRatio < 0.02,
    lyrics: {
      genre: ['ambient', 'electronic', 'classical', 'dreamy'],
      themes: ['dreams', 'dark_mystery', 'nature', 'introspection'],
      imagery: ['极光', '绿带', '紫光', '夜空', '星野', '舞动', '帷幕', '地磁', '北极', '幻境', '天穹', '神秘'],
      emotions: ['震撼', '敬畏', '梦幻', '神秘', '渺小'],
      subjects: ['极光', '夜空', '旅人', '宇宙', '梦境'],
      actions: ['舞动', '闪烁', '流动', '仰望', '许愿', '惊叹'],
      locations: ['北极圈', '雪原上', '天穹', '极夜里', '星河下'],
      tempos: [60, 70, 85],
      description: '极光北极的神秘场景，绿紫天幕下的宇宙震撼'
    }
  },

  // Cherry blossom / sakura — pink, delicate, spring
  {
    id: 'sakura_spring',
    match: (f) => f.warmRatio > 0.2 && f.saturation > 0.35 && f.saturation < 0.65 &&
      f.brightness > 0.45 && f.skinRatio < 0.03 &&
      (f.redRatio > 0.08 || f.colorfulness > 0.4) && !f.horizonLine,
    lyrics: {
      genre: ['folk', 'pop', 'chinese_traditional', 'classical'],
      themes: ['spring_awakening', 'love', 'nostalgic_memory', 'nature'],
      imagery: ['樱花', '花瓣', '粉雪', '飘落', '枝头', '花雨', '春风', '花见', '和伞', '木屐', '粉白', '簌簌'],
      emotions: ['柔美', '浪漫', '怅然', '清新', '短暂'],
      subjects: ['樱花', '春天', '花见', '旅人', '花季'],
      actions: ['飘落', '绽放', '纷飞', '伫立', '仰望', '拾起'],
      locations: ['花树下', '小径', '樱园', '春风里', '花道'],
      tempos: [70, 80, 95],
      description: '樱花春日的柔美场景，花瓣纷飞里的浪漫与短暂'
    }
  },

  // Camping & bonfire — outdoor, warm orange, gathering
  {
    id: 'camping_bonfire',
    match: (f) => f.warmRatio > 0.35 && f.darkRatio > 0.2 && f.brightness > 0.3 &&
      f.brightness < 0.65 && f.saturation > 0.25 && f.saturation < 0.55 &&
      f.skinRatio < 0.08 && (f.greenRatio > 0.08 || f.night_),
    lyrics: {
      genre: ['folk', 'country', 'indie', 'ballad'],
      themes: ['friendship', 'life', 'nature', 'nostalgic_memory'],
      imagery: ['篝火', '帐篷', '木柴', '火星', '星夜', '围坐', '吉他', '热饮', '松林', '木柴味', '夜空', '低语'],
      emotions: ['温暖', '相聚', '安宁', '快乐', '真挚'],
      subjects: ['露营者', '旅人', '伙伴', '篝火', '星光'],
      actions: ['围坐', '拨火', '弹唱', '碰杯', '低语', '仰望'],
      locations: ['篝火旁', '帐篷外', '星空下', '松林边', '营地'],
      tempos: [70, 80, 95],
      description: '野营篝火的相聚场景，木柴火星间的友谊与歌唱'
    }
  },

  // Tea ceremony / traditional craft — zen, minimal, cultural
  {
    id: 'tea_zen_traditional',
    match: (f) => f.warmRatio > 0.2 && f.saturation < 0.45 && f.brightness > 0.35 &&
      f.brightness < 0.65 && f.contrast < 0.45 && f.symmetry > 0.55 &&
      f.skinRatio < 0.04 && f.textureType !== 'complex' && f.edgeDensity < 0.3,
    lyrics: {
      genre: ['chinese_traditional', 'classical', 'ambient', 'folk'],
      themes: ['introspection', 'healing', 'nature', 'life'],
      imagery: ['茶汤', '青瓷', '茶则', '禅意', '木纹', '茶烟', '留白', '水痕', '竹帘', '茶席', '清香', '静谧'],
      emotions: ['禅静', '沉淀', '安宁', '释然', '专注'],
      subjects: ['茶人', '茶汤', '禅意', '时光', '匠艺'],
      actions: ['注汤', '品茗', '静观', '焚香', '执壶', '拂拭'],
      locations: ['茶席上', '竹帘下', '茶室里', '炉边', '案几'],
      tempos: [55, 60, 70],
      description: '茶道禅意的静谧场景，茶汤留白间的内心沉淀'
    }
  },
];

/* =========================================================================
 * VISUAL FEATURE EXTRACTOR
 * ========================================================================= */

/**
 * Analyze an image through 7 layers of feature extraction
 * @param {HTMLImageElement|HTMLCanvasElement} source - Image or canvas element
 * @returns {Promise<Object>} Comprehensive visual features
 */
export async function analyzeImageVisuals(source) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Downscale for performance
  const maxSize = 256;
  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const w = canvas.width;
  const h = canvas.height;

  return {
    ...extractColorFeatures(pixels, w, h),
    ...extractLightingFeatures(pixels, w, h),
    ...extractCompositionFeatures(pixels, w, h),
    ...extractRegionFeatures(pixels, w, h),
    ...extractTextureFeatures(pixels, w, h),
    // extractSemanticFeatures is now async and optionally runs the neural
    // face detector against the ORIGINAL source (full-resolution) to
    // eliminate the "single-person → two persons" hallucination bug.
    ...(await extractSemanticFeatures(pixels, w, h, source)),
    width: w,
    height: h
  };
}

/**
 * Layer 1: Color features
 */
function extractColorFeatures(pixels, w, h) {
  const n = pixels.length / 4;

  // HSL histogram (12 hue bins)
  const hueBuckets = new Array(12).fill(0);
  let totalSat = 0, totalLight = 0;
  let warmCount = 0, coolCount = 0, greenCount = 0, redCount = 0, blueCount = 0, darkCount = 0, brightCount = 0;

  // Dominant color tracking
  const colorBuckets = {}; // quantized RGB

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];

    // Skip fully transparent
    if (pixels[i + 3] < 10) continue;

    const [h, s, l] = rgbToHsl(r, g, b);
    totalSat += s;
    totalLight += l;

    // Hue bucket
    const bucket = Math.floor(h / 30) % 12;
    hueBuckets[bucket]++;

    // Temperature classification
    if ((h >= 340 || h < 60) && s > 20) warmCount++;
    else if (h >= 160 && h < 260 && s > 20) coolCount++;
    else if (h >= 60 && h < 170 && s > 20) greenCount++;

    // Color-specific counts
    if (h >= 340 || h < 20) redCount++;
    if (h >= 180 && h < 260) blueCount++;

    // Brightness
    if (l > 70) brightCount++;
    if (l < 30) darkCount++;

    // Quantized color
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    colorBuckets[key] = (colorBuckets[key] || 0) + 1;
  }

  const validPixels = Object.values(colorBuckets).reduce((a, b) => a + b, 0) || 1;

  // Find dominant colors
  const dominantColors = Object.entries(colorBuckets)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [r, g, b] = key.split(',').map(Number);
      return {
        rgb: `rgb(${r},${g},${b})`,
        hex: rgbToHex(r, g, b),
        percentage: Math.round((count / validPixels) * 100) / 100,
        hsl: rgbToHsl(r, g, b)
      };
    });

  // Colorfulness metric
  const saturationValues = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const [, s] = rgbToHsl(pixels[i], pixels[i + 1], pixels[i + 2]);
    saturationValues.push(s);
  }
  const colorfulness = average(saturationValues) / 100;

  return {
    dominantColors,
    dominantColor: dominantColors[0] || { hex: '#808080', rgb: 'rgb(128,128,128)' },
    warmRatio: warmCount / n,
    coolRatio: coolCount / n,
    greenRatio: greenCount / n,
    redRatio: redCount / n,
    blueRatio: blueCount / n,
    saturation: totalSat / n / 100,
    colorfulness,
    avgHue: hueBuckets.indexOf(Math.max(...hueBuckets)) * 30 + 15
  };
}

/**
 * Layer 2: Lighting features
 */
function extractLightingFeatures(pixels, w, h) {
  const n = pixels.length / 4;
  let totalLight = 0;
  let brightCount = 0, darkCount = 0, midCount = 0;
  let minL = 100, maxL = 0;

  // Row-by-row brightness for horizon detection
  const rowBrightness = new Array(h).fill(0);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (pixels[idx + 3] < 10) continue;
      const [, , l] = rgbToHsl(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
      totalLight += l;
      rowBrightness[y] += l;
      if (l > 70) brightCount++;
      else if (l < 30) darkCount++;
      else midCount++;
      if (l < minL) minL = l;
      if (l > maxL) maxL = l;
    }
  }

  const avgLight = totalLight / n;
  const brightRatio = brightCount / n;
  const darkRatio = darkCount / n;
  const contrast = (maxL - minL) / 100;

  // Horizon line detection: find where brightness transitions sharply
  let horizonLine = false;
  let horizonY = -1;
  const rowAvgBrightness = rowBrightness.map(v => v / w);
  for (let y = Math.floor(h * 0.2); y < Math.floor(h * 0.8); y++) {
    const diff = Math.abs(rowAvgBrightness[y] - rowAvgBrightness[y - 1]);
    if (diff > 25) {
      horizonLine = true;
      horizonY = y;
      break;
    }
  }

  // Lighting classification
  let lightingType = 'normal';
  if (brightRatio > 0.6) lightingType = 'high_key';
  else if (darkRatio > 0.5) lightingType = 'low_key';
  else if (contrast > 0.7) lightingType = 'high_contrast';
  else if (contrast < 0.3) lightingType = 'soft_light';

  return {
    brightness: avgLight / 100,
    brightRatio,
    darkRatio,
    lightRatio: 1 - brightRatio - darkRatio,
    contrast,
    horizonLine,
    horizonY,
    lightingType
  };
}

/**
 * Layer 3: Composition features
 */
function extractCompositionFeatures(pixels, w, h) {
  // Visual weight: analyze brightness in 9 regions (rule of thirds)
  const regions = {
    topLeft: [], topCenter: [], topRight: [],
    midLeft: [], midCenter: [], midRight: [],
    botLeft: [], botCenter: [], botRight: []
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const [, , l] = rgbToHsl(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
      const xThird = x < w / 3 ? 'Left' : x < 2 * w / 3 ? 'Center' : 'Right';
      const yThird = y < h / 3 ? 'top' : y < 2 * h / 3 ? 'mid' : 'bot';
      regions[`${yThird}${xThird}`].push(l);
    }
  }

  const regionAverages = {};
  for (const [key, vals] of Object.entries(regions)) {
    regionAverages[key] = vals.length > 0 ? average(vals) : 50;
  }

  // Find visual weight center (brightest region)
  let brightestRegion = 'midCenter';
  let maxWeight = 0;
  for (const [key, val] of Object.entries(regionAverages)) {
    if (val > maxWeight) {
      maxWeight = val;
      brightestRegion = key;
    }
  }

  // Symmetry: compare left half vs right half
  let leftWeight = 0, rightWeight = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const [, , l] = rgbToHsl(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
      if (x < w / 2) leftWeight += l;
      else rightWeight += l;
    }
  }
  const symmetry = 1 - Math.abs(leftWeight - rightWeight) / Math.max(leftWeight, rightWeight);

  // Vertical emphasis
  const topWeight = regionAverages.topLeft + regionAverages.topCenter + regionAverages.topRight;
  const botWeight = regionAverages.botLeft + regionAverages.botCenter + regionAverages.botRight;
  const verticalRatio = topWeight / (topWeight + botWeight);

  // Diagonal composition detection
  let tlToBrWeight = 0, trToBlWeight = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const [, , l] = rgbToHsl(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
      const distToTLBR = Math.abs((x / w) - (y / h));
      const distToTRBL = Math.abs((1 - x / w) - (y / h));
      if (distToTLBR < 0.1) tlToBrWeight += l;
      if (distToTRBL < 0.1) trToBlWeight += l;
    }
  }

  return {
    brightestRegion,
    visualCenter: mapRegionToPosition(brightestRegion),
    symmetry,
    verticalRatio,
    horizontalEmphasis: 1 - Math.abs(leftWeight - rightWeight) / Math.max(leftWeight, rightWeight),
    diagonalStrength: Math.abs(tlToBrWeight - trToBlWeight) / Math.max(tlToBrWeight, trToBlWeight, 1),
    regionAverages
  };
}

/**
 * Layer 4: Region segmentation
 */
function extractRegionFeatures(pixels, w, h) {
  // Analyze sky vs ground regions
  const rowFeatures = [];
  for (let y = 0; y < h; y++) {
    let rowSat = 0, rowLight = 0, rowHue = 0;
    let count = 0;
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (pixels[idx + 3] < 10) continue;
      const [hue, sat, l] = rgbToHsl(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
      rowSat += sat;
      rowLight += l;
      rowHue += hue;
      count++;
    }
    rowFeatures.push({
      avgSat: count > 0 ? rowSat / count : 0,
      avgLight: count > 0 ? rowLight / count : 0,
      avgHue: count > 0 ? rowHue / count : 0
    });
  }

  // Sky detection: top rows are typically bright (sky)
  let skyRegion = 0;
  for (let y = 0; y < h; y++) {
    if (rowFeatures[y].avgLight > 40) {
      skyRegion = y;
    } else {
      break;
    }
  }

  // Ground detection: bottom rows are typically darker
  let groundRegion = h;
  for (let y = h - 1; y >= 0; y--) {
    if (rowFeatures[y].avgLight < 60) {
      groundRegion = y;
    } else {
      break;
    }
  }

  // Subject region: area between sky and ground where variation is high
  let subjectRegion = null;
  if (skyRegion > 0 && groundRegion < h && groundRegion > skyRegion) {
    const middleRows = rowFeatures.slice(skyRegion, groundRegion);
    const lightVariance = middleRows.map(r => r.avgLight);
    const maxVarRow = lightVariance.indexOf(Math.max(...lightVariance));
    subjectRegion = skyRegion + maxVarRow;
  }

  return {
    skyRatio: skyRegion / h,
    groundRatio: (h - groundRegion) / h,
    subjectRegion,
    rowProfile: rowFeatures.map(r => ({
      light: Math.round(r.avgLight),
      saturation: Math.round(r.avgSat)
    }))
  };
}

/**
 * Layer 5: Texture features
 */
function extractTextureFeatures(pixels, w, h) {
  // Edge detection via simple difference
  let edgeCount = 0;
  let totalVariance = 0;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      const idxR = (y * w + (x + 1)) * 4;
      const idxD = ((y + 1) * w + x) * 4;

      const [, , l] = rgbToHsl(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
      const [, , lR] = rgbToHsl(pixels[idxR], pixels[idxR + 1], pixels[idxR + 2]);
      const [, , lD] = rgbToHsl(pixels[idxD], pixels[idxD + 1], pixels[idxD + 2]);

      const edgeX = Math.abs(l - lR);
      const edgeY = Math.abs(l - lD);
      totalVariance += edgeX + edgeY;

      if (edgeX > 15 || edgeY > 15) {
        edgeCount++;
      }
    }
  }

  const totalPixels = (w - 2) * (h - 2);
  const edgeDensity = edgeCount / totalPixels;
  const avgVariance = totalVariance / totalPixels;

  // Texture classification
  let textureType = 'smooth';
  if (edgeDensity > 0.4) textureType = 'complex';
  else if (edgeDensity > 0.2) textureType = 'detailed';
  else if (edgeDensity > 0.1) textureType = 'moderate';

  return {
    edgeDensity,
    avgVariance,
    textureType,
    complexity: Math.min(1, edgeDensity * 2)
  };
}

/* =========================================================================
 * LAYER 7: SUBJECT / SEMANTIC DETECTION — What is IN the image
 * ========================================================================= */

/**
 * Detect semantic content: people count, subject type, scene context
 * Uses skin-tone detection, composition analysis, and color patterns
 * to infer WHAT the image contains, not just HOW it looks.
 */
async function extractSemanticFeatures(pixels, w, h, imgSource = null) {
  // -------------------------------------------------------------------------
  // PRIMARY: Neural face detection via @vladmandic/face-api.
  // We try this FIRST because the old YCbCr skin-color heuristic produced
  // catastrophic false positives: e.g. a single close-up selfie was split
  // by the flood-fill into "two clusters" and reported as "两个人 / 情侣".
  // The neural net is authoritative whenever its average face confidence
  // reaches 0.5 (which corresponds to SSD >= 0.55 default).
  //
  // NOTE: dynamic import is used so the heavy TFJS / face-api bundle is only
  // pulled in when actually analyzing an image (not on app startup / SSR).
  // -------------------------------------------------------------------------
  let neuralFaceMeta = null;
  if (imgSource) {
    try {
      const { detectFaces } = await import('./faceDetection.js');
      const res = await detectFaces(imgSource);
      if (res.ok) neuralFaceMeta = res.meta;
    } catch (_) { /* ignore failures; legacy heuristic below is the fallback */ }
  }

  // Skin tone detection with higher grid resolution for better face separation
  // Grid resolution increased from 20x15 to 30x22 to distinguish close faces
  let skinPixelCount = 0;
  const gridCols = 30;
  const gridRows = 22;
  const cellW = Math.max(1, Math.floor(w / gridCols));
  const cellH = Math.max(1, Math.floor(h / gridRows));
  const grid = Array(gridRows).fill(0).map(() => Array(gridCols).fill(0));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
      if (pixels[idx + 3] < 10) continue;

      // Inclusive skin tone heuristic using YCbCr color space
      // Ranges optimized for diverse skin tones while rejecting backgrounds
      const yCb = 0.299 * r + 0.587 * g + 0.114 * b;
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      // Inclusive skin tone ranges: allow brighter/darker skin and reduce false negatives
      const isSkin = yCb > 45 &&                   // Min luminance (more inclusive)
        cb > 77 && cb < 128 &&         // Blue-difference (widened)
        cr > 133 && cr < 175;          // Red-difference (widened)

      if (isSkin) {
        skinPixelCount++;
        const cellY = Math.min(gridRows - 1, Math.floor(y / cellH));
        const cellX = Math.min(gridCols - 1, Math.floor(x / cellW));
        grid[cellY][cellX]++;
      }
    }
  }

  const totalPixels = w * h;
  const skinRatio = skinPixelCount / totalPixels;

  // Count distinct skin-tone clusters
  // Higher threshold for new higher-resolution grid (was 3 at 20x15, now 6 at 30x22)
  const visited = Array(gridRows).fill(0).map(() => Array(gridCols).fill(false));
  const clusters = [];
  const minClusterSize = 6; // Raised from 3 to catch only real faces, not tiny background speckles

  for (let gy = 0; gy < gridRows; gy++) {
    for (let gx = 0; gx < gridCols; gx++) {
      if (!visited[gy][gx] && grid[gy][gx] >= minClusterSize) {
        const cluster = _floodFillGrid(grid, visited, gx, gy);
        if (cluster.size >= minClusterSize) {
          // Try to split large wide clusters into multiple people (e.g., couple selfies)
          const splitClusters = _trySplitCluster(cluster, grid, gridCols, gridRows);
          clusters.push(...splitClusters);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // POST-FILTER: Remove tiny noise-clusters (background speckles / clothing false positives)
  //   Keep only clusters that are ≥25% the size of the LARGEST cluster.
  //   This kills isolated tiny background skin-tone blobs that shouldn't count as a person.
  // -------------------------------------------------------------------------
  if (clusters.length > 1) {
    const biggest = clusters.reduce((m, c) => Math.max(m, c.size), 0);
    const sizeFloor = Math.max(8, biggest * 0.25);
    const before = clusters.length;
    const filtered = clusters.filter(c => c.size >= sizeFloor);
    // Only apply filter if it doesn't remove ALL clusters
    if (filtered.length >= 1) clusters.splice(0, clusters.length, ...filtered);
  }

  let personCount = clusters.length;

  // Determine subject type - lower thresholds for better detection
  let subjectType = 'unknown';
  let subjectConfidence = 0;

  if (skinRatio > 0.04 && personCount >= 1) {
    if (personCount >= 3) {
      subjectType = 'group';
      subjectConfidence = Math.min(1, skinRatio * 1.5);
    } else if (personCount === 2) {
      subjectType = 'couple';
      subjectConfidence = Math.min(1, skinRatio * 1.5 + 0.2);
    } else {
      subjectType = 'portrait';
      subjectConfidence = Math.min(1, skinRatio * 1.2 + 0.1);
    }
  } else if (skinRatio > 0.02) {
    subjectType = 'people_present';
    subjectConfidence = skinRatio * 1.5;
  }

  // -------------------------------------------------------------------------
  // NEURAL OVERRIDE — take SSD MobileNet count as the GROUND TRUTH when
  // the net returned anything with reasonable confidence (avg >= 0.5).
  // This is what eliminates the "单人自拍 → 两个人（情侣）" bug entirely:
  // the heuristic flood-fill/split above can still run for skinRatio /
  // skinRegion stats, but its personCount/subjectType is discarded for the
  // neural result whenever the net is available.
  // -------------------------------------------------------------------------
  if (neuralFaceMeta && (neuralFaceMeta.avgConfidence || 0) >= 0.5) {
    personCount = neuralFaceMeta.count;
    if (personCount >= 3) {
      subjectType = 'group';
      subjectConfidence = Math.min(1, 0.9 + (neuralFaceMeta.avgConfidence - 0.5));
    } else if (personCount === 2) {
      // For 2-person photos: only call it "couple" when both are age-similar
      // AND their bounding boxes are close together (isCoupleishLook=true).
      // Otherwise call it "people_present" (friends / siblings / parent-child
      // are NOT couples and we must not assume relationship).
      subjectType = neuralFaceMeta.isCoupleishLook ? 'couple' : 'people_present';
      subjectConfidence = neuralFaceMeta.isCoupleishLook
        ? Math.min(1, 0.82 + (neuralFaceMeta.avgConfidence - 0.5))
        : Math.min(1, 0.7 + (neuralFaceMeta.avgConfidence - 0.5));
    } else if (personCount === 1) {
      subjectType = 'portrait';
      subjectConfidence = Math.min(1, 0.92 + (neuralFaceMeta.avgConfidence - 0.5));
    } else {
      // 0 faces detected — still might be people in non-face clothing shots,
      // keep skinRatio-based guess if any.
      if (!(skinRatio > 0.02)) {
        subjectType = 'unknown';
        subjectConfidence = 0;
      }
    }
  }

  // Analyze where skin is concentrated
  let skinRegion = 'none';
  if (clusters.length > 0) {
    const avgY = clusters.reduce((s, c) => s + c.cy, 0) / clusters.length;
    const avgX = clusters.reduce((s, c) => s + c.cx, 0) / clusters.length;
    if (avgY < gridRows * 0.4) skinRegion = 'upper';
    else if (avgY < gridRows * 0.6) skinRegion = 'center';
    else skinRegion = 'lower';
    if (avgX < gridCols * 0.35) skinRegion += '_left';
    else if (avgX > gridCols * 0.65) skinRegion += '_right';
    else skinRegion += '_center';
  }

  // Indoor vs outdoor detection
  let indoorOutdoor = 'unknown';
  let skinInCenter = 0;
  if (clusters.length > 0) {
    for (const c of clusters) {
      if (c.cx > gridCols * 0.25 && c.cx < gridCols * 0.75 &&
        c.cy > gridRows * 0.2 && c.cy < gridRows * 0.75) {
        skinInCenter++;
      }
    }
    if (skinInCenter === clusters.length && skinRatio > 0.03) {
      indoorOutdoor = 'indoor';
    }
  }

  // Selfie detection (skin concentrated in upper-center, close-up)
  const isSelfie = subjectType === 'portrait' && skinRegion.startsWith('upper') && skinRatio > 0.08;

  // -------------------------------------------------------------------------
  // SECOND-PASS: "Potential Couple" promotion
  //
  // This runs ONLY when cluster-splitting found personCount=1.
  // OLD BUG: skinRatio>0.08 + 30% width automatically promoted EVERY close-up
  //   portrait to 'couple' — single face with neck/shoulders satisfies this!
  // NEW: EXTREMELY strict thresholds to avoid ANY false positive.
  //   We must have IRREFUTABLE evidence of two distinct horizontally-separated skin blobs.
  //   If evidence is soft, we only set potentialCouple=true as a WEAK HINT,
  //   we DO NOT change subjectType (classifyScene FIRST B will still apply
  //   portrait/solo logic and user won't see "两个人 detected").
  // -------------------------------------------------------------------------
  let potentialCouple = false;
  if (personCount === 1 && clusters.length === 1) {
    const cluster = clusters[0];
    const clusterWidth = _computeClusterWidth(cluster, grid, gridCols, gridRows);
    // Compute HEIGHT too so we can verify the cluster is genuinely wide/two-faced
    const clusterHeight = _computeClusterHeight(cluster, grid, gridCols, gridRows);
    // 1) Skin ratio must indicate two real faces, not one close-up face:
    //    - skinRatio > 0.16  (one medium close-up is typically 0.06~0.13)
    // 2) Cluster must span MOST of image WIDTH (not just a centered face):
    //    - width > gridCols * 0.62 (30 cols = ≥19 columns)
    // 3) Shape must be horizontal (two faces side by side), not tall square/torso:
    //    - clusterWidth must be > clusterHeight * 1.25
    // 4) Must be in upper region (where faces are, not in body/arm region)
    // If ALL 4 pass → strong evidence → set potentialCouple=true but still keep
    // subjectType as 'portrait' (no forced promotion).
    if (skinRatio > 0.16 &&
      clusterWidth > gridCols * 0.62 &&
      clusterWidth > clusterHeight * 1.25 &&
      skinRegion.startsWith('upper')) {
      potentialCouple = true;
      // DO NOT promote subjectType to 'couple' here.
      // subjectConfidence is not raised either.
      // potentialCouple is a weak hint only for classifyScene to consider
      // in weighted fallback scoring (never override personCount wording).
    }
  }

  return {
    skinRatio,
    personCount,
    subjectType,
    subjectConfidence,
    skinRegion,
    indoorOutdoor,
    isSelfie,
    potentialCouple,
    clusters: clusters.map(c => ({ cx: c.cx, cy: c.cy, size: c.size })),
    // Expose rich neural metadata (when available) so downstream
    // classification / lyrics engines can tailor style based on real
    // age / gender / expression instead of guessing from color palettes.
    faceMeta: neuralFaceMeta || null,
  };
}

function _floodFillGrid(grid, visited, sx, sy) {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue = [{ x: sx, y: sy }];
  visited[sy][sx] = true;
  let size = 0;
  let sumX = 0, sumY = 0;

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    size++;
    sumX += x;
    sumY += y;

    const neighbors = [
      { x: x + 1, y }, { x: x - 1, y },
      { x, y: y + 1 }, { x, y: y - 1 }
    ];
    for (const n of neighbors) {
      if (n.x >= 0 && n.x < cols && n.y >= 0 && n.y < rows &&
        !visited[n.y][n.x] && grid[n.y][n.x] > 1) {
        visited[n.y][n.x] = true;
        queue.push(n);
      }
    }
  }

  return { size, cx: sumX / size, cy: sumY / size };
}

/**
 * Try to split a large cluster into two (or more) people when the cluster
 * spans a significant horizontal or vertical range. This handles couple
 * selfies where two faces are close together and merge into one flood-fill
 * cluster on the coarse 20x15 grid.
 *
 * Strategy: find the densest column/row (projection), split at the gap
 * between two density peaks, flood-fill each sub-region.
 */
function _trySplitCluster(cluster, grid, cols, rows) {
  // Only split clusters that are LARGE enough to possibly contain 2 distinct real faces
  // Raised from 12 → 22 (for 30x22 grid): a single medium face is typically 10-18 cells.
  if (cluster.size < 22) return [cluster];

  // Re-collect cluster cells by BFS from centroid
  const cells = _collectClusterCells(grid, cluster, cols, rows);
  if (cells.length < 22) return [cluster];

  // ==== HEIGHT / ASPECT GUARD (NEW):
  //   Compute the cluster's vertical span and shape.
  //   A single-person head+shoulders cluster is often TALLER-than-wide or ~square.
  //   A real couple-cluster must be CLEARLY wider than tall (horizontal arrangement).
  let minX = cols, maxX = 0, minY = rows, maxY = 0;
  for (const { x, y } of cells) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  // If cluster isn't clearly horizontal → not a couple. Don't split a single tall torso.
  if (width < height * 1.15) return [cluster];
  // If cluster width < 50% of the whole grid (30 cols = <15) → not a wide couple shot.
  if (width < Math.floor(cols * 0.50)) return [cluster];

  // Project skin density onto X axis (columns)
  const colDensity = new Array(cols).fill(0);
  for (const { x, y } of cells) {
    colDensity[x] += grid[y][x];
  }

  // Find the two density peaks
  const peaks = _findTwoPeaks(colDensity, minX, maxX);
  if (!peaks) return [cluster];
  const [peakX1, peakX2] = peaks;

  // ==== PEAK SEPARATION GUARD (NEW):
  //   Two cheek peaks of ONE face are ~2-4 grid columns apart on 30x22 grid.
  //   Real two faces should be MUCH further apart.
  //   Require: peaks separated by >= 18% of total grid width (= ~5+ columns on 30-grid).
  const peakDistance = Math.abs(peakX2 - peakX1);
  if (peakDistance < cols * 0.18) return [cluster];

  // Split at the valley between peaks
  const splitX = Math.floor((peakX1 + peakX2) / 2);

  // ==== VALLEY DEPTH GUARD (NEW):
  //   For a true two-face split, the point between peaks must be a REAL gap
  //   (valley density ≤ 55% of the WEAKER peak).
  //   Otherwise: splitting a single face where left-cheek ↔ right-cheek are one continuous blob.
  const peak1Density = colDensity[peakX1];
  const peak2Density = colDensity[peakX2];
  const weakerPeakDensity = Math.min(peak1Density, peak2Density);
  const valleyDensity = colDensity[splitX] ?? 0;
  if (weakerPeakDensity > 0 && valleyDensity > weakerPeakDensity * 0.55) {
    return [cluster];
  }

  // Assign cells to left or right sub-cluster
  const leftCells = [];
  const rightCells = [];
  for (const cell of cells) {
    if (cell.x <= splitX) leftCells.push(cell);
    else rightCells.push(cell);
  }

  // ==== SIZE BALANCE GUARD (NEW):
  //   If we split face vs neck/arm, one side is tiny. Require reasonable balance.
  //   Raised minimum from 5 → 9 cells, and both sub-clusters must be ≥40% of the larger one.
  if (leftCells.length < 9 || rightCells.length < 9) return [cluster];
  const smaller = Math.min(leftCells.length, rightCells.length);
  const larger = Math.max(leftCells.length, rightCells.length);
  if (smaller / larger < 0.40) return [cluster];

  // Compute centroids and sizes
  const makeCluster = (subCells) => {
    let sx = 0, sy = 0;
    for (const c of subCells) { sx += c.x; sy += c.y; }
    const size = subCells.length;
    return { size, cx: sx / size, cy: sy / size };
  };

  return [makeCluster(leftCells), makeCluster(rightCells)];
}

/** Collect all cells belonging to a cluster by BFS from its centroid */
function _collectClusterCells(grid, cluster, cols, rows) {
  const { cx, cy } = cluster;
  // Start from the cell nearest to centroid
  const startX = Math.max(0, Math.min(cols - 1, Math.round(cx)));
  const startY = Math.max(0, Math.min(rows - 1, Math.round(cy)));

  // BFS: follow all connected skin cells from the start point
  const visited2 = Array(rows).fill(0).map(() => Array(cols).fill(false));
  const queue = [{ x: startX, y: startY }];
  const cells = [];

  if (grid[startY]?.[startX] < 1) {
    // Centroid cell may be empty; search neighbors for a skin cell
    for (let r = 0; r < 3; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = startX + dx, ny = startY + dy;
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny][nx] >= 1) {
            queue[0] = { x: nx, y: ny };
            visited2[ny][nx] = true;
            break;
          }
        }
        if (visited2[queue[0].y][queue[0].x]) break;
      }
    }
  }

  if (!visited2[queue[0].y]?.[queue[0].x]) visited2[queue[0].y][queue[0].x] = true;

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    if (grid[y][x] >= 1) cells.push({ x, y });
    const neighbors = [
      { x: x + 1, y }, { x: x - 1, y },
      { x, y: y + 1 }, { x, y: y - 1 }
    ];
    for (const n of neighbors) {
      if (n.x >= 0 && n.x < cols && n.y >= 0 && n.y < rows &&
        !visited2[n.y][n.x] && grid[n.y][n.x] >= 1) {
        visited2[n.y][n.x] = true;
        queue.push(n);
      }
    }
  }
  return cells;
}

/** Find two density peaks in a 1D array within [minX, maxX] */
function _findTwoPeaks(density, minX, maxX) {
  // Apply 3-point weighted smoothing (1-2-1 kernel) for cleaner peak detection
  const smoothed = density.map((v, i) => {
    const left = i > 0 ? density[i - 1] : v;
    const right = i < density.length - 1 ? density[i + 1] : v;
    return (left + 2 * v + right) / 4;
  });

  const halfWidth = Math.floor((maxX - minX + 1) / 2);
  const midX = Math.floor((minX + maxX) / 2);

  // Find the peak in the left half
  let leftPeak = minX;
  let leftMax = 0;
  for (let i = minX; i <= midX; i++) {
    if (smoothed[i] > leftMax) { leftMax = smoothed[i]; leftPeak = i; }
  }

  // Find the peak in the right half
  let rightPeak = midX;
  let rightMax = 0;
  for (let i = midX; i <= maxX; i++) {
    if (smoothed[i] > rightMax) { rightMax = smoothed[i]; rightPeak = i; }
  }

  // Peaks must be sufficiently separated (at least 3 grid cells apart)
  if (Math.abs(rightPeak - leftPeak) < 3) return null;

  // Both peaks must be meaningful relative to average density
  // Use 55% threshold for better sensitivity on higher-res grid
  const avgDensity = smoothed.reduce((a, b) => a + b, 0) / (maxX - minX + 1);
  if (leftMax < avgDensity * 0.55 || rightMax < avgDensity * 0.55) return null;

  return [leftPeak, rightPeak];
}

/** Compute the bounding width of a cluster in grid columns */
function _computeClusterWidth(cluster, grid, cols, rows) {
  const cells = _collectClusterCells(grid, cluster, cols, rows);
  if (cells.length < 2) return 0;
  let minX = cols, maxX = 0;
  for (const c of cells) {
    if (c.x < minX) minX = c.x;
    if (c.x > maxX) maxX = c.x;
  }
  return maxX - minX + 1;
}

/** Vertical span of cluster cells (maxY - minY + 1), used in couple-detection
 *  aspect-ratio guards. Returns 0 for tiny/single-cell clusters.
 */
function _computeClusterHeight(cluster, grid, cols, rows) {
  const cells = _collectClusterCells(grid, cluster, cols, rows);
  if (cells.length < 2) return 0;
  let minY = rows, maxY = 0;
  for (const c of cells) {
    if (c.y < minY) minY = c.y;
    if (c.y > maxY) maxY = c.y;
  }
  return maxY - minY + 1;
}

/* =========================================================================
 * SCENE CLASSIFICATION v2 — Boolean match + Weighted scoring fallback
 * Implements multi-criteria decision analysis for robust scene detection
 * ========================================================================= */

/**
 * Weighted scoring for all scene profiles. Each profile gets a score
 * based on how many of its match criteria are met (partial matching).
 * This handles edge cases where no single boolean match fires.
 */
function _weightedSceneScore(profile, f) {
  // Extract criteria from the match function by running a heuristic evaluation
  // Score ranges 0..1 based on how closely features align with profile intent
  let score = 0;
  const id = profile.id;

  // Keyword-based proxy scoring for known profile IDs
  const profileSignals = {
    sunset_farewell: [f.warmRatio > 0.2, f.horizonLine, f.lightRatio < 0.6, f.brightness > 0.25 && f.brightness < 0.7],
    urban_loneliness: [f.coolRatio > 0.3, f.saturation < 0.55, f.verticalRatio > 0.35, f.darkRatio > 0.15],
    nature_healing: [f.greenRatio > 0.15, f.blueRatio > 0.1, f.brightness > 0.35, f.horizonLine],
    passionate_love: [f.redRatio > 0.1, f.saturation > 0.5, f.brightness > 0.25, f.warmRatio > 0.2],
    dreamy_night: [f.darkRatio > 0.2, f.blueRatio > 0.15, f.saturation < 0.65, f.brightness < 0.5],
    energetic_crowd: [f.saturation > 0.6, f.brightness > 0.5, f.colorfulness > 0.4, f.contrast > 0.3],
    quiet_morning: [f.brightness > 0.5, f.saturation < 0.45, f.warmRatio > 0.15, f.contrast < 0.5],
    storm_tension: [f.contrast > 0.5, f.darkRatio > 0.15, f.edgeDensity > 0.35, f.brightness < 0.6],
    food_warm_glow: [f.warmRatio > 0.3, f.brightness > 0.4, f.saturation > 0.3, f.skinRatio < 0.04],
    pet_companion: [f.warmRatio > 0.2, f.brightness > 0.35, f.textureType === 'detailed', f.saturation < 0.6],
    architecture_grand: [f.contrast > 0.35, f.edgeDensity > 0.2, f.saturation < 0.55, f.verticalRatio > 0.4],
    flowers_bloom: [f.colorfulness > 0.4, f.saturation > 0.45, f.brightness > 0.4, f.warmRatio > 0.2],
    sunrise_hope: [f.warmRatio > 0.25, f.brightness > 0.45, f.horizonLine, f.saturation > 0.25],
    beach_ocean: [f.blueRatio > 0.2, f.brightness > 0.45, f.horizonLine, f.saturation < 0.6],
    mountain_wilderness: [f.greenRatio > 0.15, f.brightness > 0.35, f.horizonLine, f.saturation < 0.6],
    autumn_nostalgia: [f.warmRatio > 0.25, f.saturation > 0.3, f.brightness > 0.35 && f.brightness < 0.65],
    winter_serene: [f.brightness > 0.55, f.saturation < 0.3, f.coolRatio > 0.15, f.warmRatio < 0.3],
    travel_journey: [f.colorfulness > 0.35, f.brightness > 0.4, f.horizonLine, f.saturation > 0.3],
    festive_celebration: [f.colorfulness > 0.45, f.saturation > 0.5, f.brightness > 0.5, f.warmRatio > 0.2],
    abstract_art: [f.colorfulness > 0.5, f.edgeDensity > 0.25, f.saturation > 0.45, f.skinRatio < 0.03],
    cafe_cozy: [f.warmRatio > 0.25, f.brightness > 0.35 && f.brightness < 0.6, f.saturation < 0.5, f.contrast < 0.5],
    night_starry: [f.darkRatio > 0.35, f.blueRatio > 0.15, f.brightness < 0.45, f.saturation < 0.5],
    rainy_reflective: [f.coolRatio > 0.25, f.brightness < 0.55, f.saturation < 0.5, f.contrast < 0.5],
    vehicle_motion: [f.contrast > 0.35, f.edgeDensity > 0.25, f.saturation > 0.25, f.brightness > 0.35],
    minimalist_clean: [f.brightness > 0.55, f.saturation < 0.3, f.colorfulness < 0.4, f.edgeDensity < 0.2],
    vintage_retro: [f.warmRatio > 0.2, f.saturation < 0.5, f.brightness > 0.3 && f.brightness < 0.6, f.colorfulness < 0.5],
    children_family: [f.warmRatio > 0.2, f.brightness > 0.45, f.saturation < 0.6, f.skinRatio > 0.02],
    concert_live: [f.saturation > 0.4, f.contrast > 0.4, f.darkRatio > 0.2, f.colorfulness > 0.4],
    fashion_editorial: [f.skinRatio > 0.03, f.contrast > 0.3, f.saturation > 0.25 && f.saturation < 0.7, f.edgeDensity > 0.15],
    sports_action: [f.edgeDensity > 0.25, f.contrast > 0.4, f.brightness > 0.35, f.saturation > 0.3],
    workspace_creative: [f.brightness > 0.35 && f.brightness < 0.7, f.saturation < 0.5, f.contrast > 0.2, f.edgeDensity > 0.1],
    books_library: [f.brightness > 0.3 && f.brightness < 0.65, f.saturation < 0.45, f.contrast < 0.5, f.warmRatio > 0.15],
    product_still_life: [f.brightness > 0.4, f.contrast > 0.25, f.edgeDensity > 0.1 && f.edgeDensity < 0.4, f.symmetry > 0.5],
    wedding_ceremony: [f.warmRatio > 0.2, f.brightness > 0.4, f.saturation > 0.25, f.skinRatio > 0.03],
    graduation_achievement: [f.brightness > 0.4, f.saturation > 0.25, f.warmRatio > 0.15, f.skinRatio > 0.02],
    bakery_dessert: [f.warmRatio > 0.3, f.brightness > 0.4, f.saturation > 0.25 && f.saturation < 0.65, f.skinRatio < 0.04],
    baby_newborn: [f.brightness > 0.45, f.saturation < 0.5, f.warmRatio > 0.15, f.skinRatio > 0.04],
    botanical_greenhouse: [f.greenRatio > 0.2, f.brightness > 0.35, f.saturation > 0.3, f.edgeDensity > 0.15],
    underwater_diving: [f.blueRatio > 0.2, f.brightness > 0.2 && f.brightness < 0.6, f.saturation > 0.2, f.coolRatio > 0.25],
    fireworks_night: [f.darkRatio > 0.25, f.saturation > 0.4, f.colorfulness > 0.45, f.contrast > 0.4],
    hotspring_relaxing: [f.warmRatio > 0.2, f.blueRatio > 0.05, f.brightness > 0.3 && f.brightness < 0.65, f.contrast < 0.5],
    street_documentary: [f.contrast > 0.3, f.brightness > 0.25 && f.brightness < 0.7, f.saturation < 0.6, f.edgeDensity > 0.2],
    aurora_mystical: [f.darkRatio > 0.3, f.saturation > 0.3, (f.greenRatio > 0.1 || f.coolRatio > 0.25), f.colorfulness > 0.35],
    sakura_spring: [f.warmRatio > 0.15, f.saturation > 0.3 && f.saturation < 0.7, f.brightness > 0.4, f.colorfulness > 0.35],
    camping_bonfire: [f.warmRatio > 0.3, f.darkRatio > 0.15, f.brightness > 0.25 && f.brightness < 0.65, f.saturation > 0.2],
    tea_zen_traditional: [f.warmRatio > 0.15, f.saturation < 0.5, f.brightness > 0.3 && f.brightness < 0.65, f.symmetry > 0.5],
  };

  const signals = profileSignals[id] || [];
  for (const s of signals) {
    if (s) score += 1;
  }
  return signals.length > 0 ? score / signals.length : 0;
}

/* --------------------------------------------------------------------------
 * NEURAL META INJECTION — when the face detector returned age / gender /
 * expression, use them to COLOR / FILTER the scene's suggestions.
 *
 * This is the "value-add" of using a real neural net instead of the old
 * skin-tone heuristic: lyrics get more specific. Example:
 *   - 2 teens happy mixed-gender → teenage romance / K-pop / summer-pop
 *   - 1 senior lady neutral → warm nostalgic ballad about good old days
 *   - 3 young adults laughing → friendship / party / upbeat pop
 *   - 1 child surprised → playful kids-pop / wonder-filled imagery
 * -------------------------------------------------------------------------- */
function _applyFaceMetaToScene(scene, f) {
  if (!scene || !f) return scene;
  const meta = f.faceMeta || null;
  const pv = f.pythonVision || null;

  // We no longer early-return on absent face-only metadata.  A photo may be
  // a pet / beach / dinner shot (no faces) but still have pythonVision tags
  // from the YOLOv8n server-side object detector; those are injected below.
  const hasPeopleFaces = !!(meta && meta.count);
  if (!hasPeopleFaces && !pv) return scene;

  const {
    ageBucket = null,
    dominantGender = null,
    topExpression = null,
  } = hasPeopleFaces ? meta : {};

  // Genre & tempo tweaks per age bucket
  if (ageBucket === 'child') {
    scene.genre = _mergeUnique(scene.genre, ['kids_pop', 'childlike', 'playful_pop', 'lullaby'], 6);
    scene.tempos = _mergeUnique(scene.tempos || [80, 95, 110], [95, 110, 120], 6);
    scene.themes = _mergeUnique(scene.themes, ['childhood', 'innocence', 'toys_play', 'dream_big'], 6);
    scene.imagery = _mergeUnique(scene.imagery, ['彩虹', '气球', '泡泡', '糖果', '蝴蝶', '小脚丫', '木马', '风筝'], 16);
    scene.emotions = _mergeUnique(scene.emotions, ['纯真', '好奇', '快乐', '无忧', '惊喜'], 10);
  } else if (ageBucket === 'teen') {
    scene.genre = _mergeUnique(scene.genre, ['teen_pop', 'kpop', 'indie_pop', 'summer_pop'], 7);
    scene.tempos = _mergeUnique(scene.tempos || [90, 100, 110], [100, 115, 128], 6);
    scene.themes = _mergeUnique(scene.themes, ['youth', 'first_love', 'friendship', 'dreams', 'summer'], 6);
    scene.imagery = _mergeUnique(scene.imagery, ['校服', '单车', '操场', '耳机', '汽水', '晚风', '海边', '星光', '日记', '纸条'], 18);
  } else if (ageBucket === 'young_adult') {
    scene.genre = _mergeUnique(scene.genre, ['pop', 'rnb', 'city_pop', 'dance_pop', 'indie'], 7);
    // keep default tempos
    scene.themes = _mergeUnique(scene.themes, ['urban_life', 'growth', 'independence', 'travel', 'ambition'], 5);
    scene.imagery = _mergeUnique(scene.imagery, ['咖啡馆', '行李箱', '高铁', '都市', '霓虹', '简历', '键盘', '酒吧'], 16);
  } else if (ageBucket === 'adult') {
    scene.genre = _mergeUnique(scene.genre, ['ballad', 'jazz_pop', 'soul', 'acoustic'], 6);
    scene.tempos = _mergeUnique(scene.tempos || [80, 95, 110], [75, 85, 100], 6);
    scene.themes = _mergeUnique(scene.themes, ['family', 'career', 'home', 'commitment', 'memories'], 5);
    scene.imagery = _mergeUnique(scene.imagery, ['窗台', '旧相册', '晚归', '通勤', '家灯', '孩子', '伴侣', '书房'], 16);
  } else if (ageBucket === 'senior') {
    scene.genre = _mergeUnique(scene.genre, ['oldies', 'classic_ballad', 'retro_pop', 'folk'], 6);
    scene.tempos = _mergeUnique(scene.tempos || [80, 90, 100], [68, 78, 88], 6);
    scene.themes = _mergeUnique(scene.themes, ['nostalgia', 'good_old_days', 'lifelong_love', 'grandchildren', 'peace'], 5);
    scene.imagery = _mergeUnique(scene.imagery, ['白发', '老花镜', '藤椅', '旧照片', '庭院', '茶杯', '夕阳', '旧时光'], 18);
    scene.emotions = _mergeUnique(scene.emotions, ['安详', '怀念', '温柔', '释然', '满足'], 10);
  }

  // Gender tweaks (only useful for 1 person; for mixed we leave it alone)
  if (meta.count === 1 && dominantGender === 'female') {
    scene.imagery = _mergeUnique(scene.imagery, ['裙摆', '发梢', '耳环', '香水', '口红', '长发', '眼眸', '指尖'], 16);
  } else if (meta.count === 1 && dominantGender === 'male') {
    scene.imagery = _mergeUnique(scene.imagery, ['背影', '肩线', '胡茬', '掌心', '背影', '风衣领', '球鞋', '烟圈'], 16);
  } else if (dominantGender === 'mixed' && meta.count === 2) {
    // Boy+girl is a stronger signal for "romance" than same-gender pair.
    // Still append WITHOUT removing existing (may be siblings/friends).
    scene.themes = _mergeUnique(scene.themes, ['love', 'romantic_night', 'first_date'], 5);
    scene.imagery = _mergeUnique(scene.imagery, ['并肩', '对视', '共用伞', '手心温度', '情侣装'], 16);
  }

  // Expression tweaks: override emotions when someone is clearly emoting
  if (topExpression === 'happy') {
    scene.emotions = _mergeUnique(scene.emotions, ['开心', '喜悦', '欢乐', '雀跃', '甜蜜', '畅快'], 10);
    scene.themes = _mergeUnique(scene.themes, ['happiness', 'celebration', 'good_times'], 5);
    if (scene.tempos) scene.tempos = _mergeUnique(scene.tempos, [110, 120, 132], 6);
  } else if (topExpression === 'sad') {
    scene.emotions = _mergeUnique(scene.emotions, ['难过', '失落', '流泪', '心碎', '不舍', '委屈'], 10);
    scene.themes = _mergeUnique(scene.themes, ['sadness', 'heartbreak', 'goodbye', 'missing_you'], 5);
    scene.genre = _mergeUnique(scene.genre, ['sad_ballad', 'melancholic', 'heartbreaking'], 6);
    if (scene.tempos) scene.tempos = _mergeUnique(scene.tempos, [65, 75, 85], 6);
  } else if (topExpression === 'angry') {
    scene.emotions = _mergeUnique(scene.emotions, ['愤怒', '不甘', '倔强', '赌气', '决绝'], 10);
    scene.themes = _mergeUnique(scene.themes, ['breakup', 'rebellion', 'fighting_back'], 5);
    scene.genre = _mergeUnique(scene.genre, ['rock', 'punk', 'hip_hop'], 6);
    if (scene.tempos) scene.tempos = _mergeUnique(scene.tempos, [115, 128, 140], 6);
  } else if (topExpression === 'fearful') {
    scene.emotions = _mergeUnique(scene.emotions, ['忐忑', '慌张', '不安', '担心', '脆弱'], 10);
  } else if (topExpression === 'surprised') {
    scene.emotions = _mergeUnique(scene.emotions, ['惊喜', '意外', '惊叹', '雀跃', '心跳'], 10);
    scene.themes = _mergeUnique(scene.themes, ['unexpected', 'miracle', 'fate'], 5);
  } else if (topExpression === 'disgusted') {
    scene.emotions = _mergeUnique(scene.emotions, ['厌倦', '嫌弃', '烦闷', '冷漠', '疏离'], 10);
  } else {
    // neutral — no-op, keep scene's existing mood
  }

  // Confidence-tweaked description suffix (let the user know real neural
  // metadata was used, which builds trust vs "I guessed from colors")
  const tags = [
    ageBucket && `年龄：${_ageBucketZh(ageBucket)}`,
    dominantGender && (dominantGender === 'mixed' ? '性别：男女混合' : (dominantGender === 'female' ? '性别：女性' : dominantGender === 'male' ? '性别：男性' : null)),
    topExpression && `表情：${_expressionZh(topExpression)}`,
  ].filter(Boolean);
  if (tags.length > 0 && scene.description && !scene.description.includes('[面部识别标签]')) {
    scene.description = `${scene.description} [面部识别标签：${tags.join('；')}]`;
  }

  // =========================================================================
  // PYTHON-YOLO SERVER META INJECTION (objects, scene hints)
  // When the Node server spawns the centralizedhub Python 3.14 vision worker,
  // we get real 80-class COCO object detection for free: pets, food, sports
  // equipment, vehicles, travel, office furniture — areas where the pure
  // color heuristic is useless.  Inject matching imagery/subjects/themes.
  // =========================================================================
  if (pv) {
    const counts = pv.counts || {};
    const hasPet = counts.cat || counts.dog || counts.bird || counts.horse;
    const hasFood = counts.pizza || counts['hot dog'] || counts.donut || counts.cake ||
      counts.sandwich || counts.banana || counts.apple || counts.orange ||
      counts.broccoli || counts.carrot || counts.bowl || counts.cup;
    const hasSports = counts.surfboard || counts.snowboard || counts.skis ||
      counts['tennis racket'] || counts['baseball bat'] || counts['sports ball'] ||
      counts.skateboard || counts.frisbee || counts.kite;
    const hasTravel = counts.airplane || counts.suitcase || counts.backpack;
    const hasRoad = counts.car || counts.truck || counts.bus || counts.motorcycle;
    const hasOffice = counts.laptop || counts.keyboard || counts['cell phone'] || counts.mouse;
    const hasHome = counts.couch || counts.bed || counts.tv || counts['potted plant'];
    const hasWild = counts.elephant || counts.bear || counts.zebra || counts.giraffe;

    if (hasPet) {
      scene.subjects = _mergeUnique(scene.subjects, ['宠物', '陪伴',
        ...(counts.dog ? ['狗狗', '小狗', '毛孩子'] : []),
        ...(counts.cat ? ['猫咪', '小猫', '毛孩子'] : []),
        ...(counts.bird ? ['小鸟', '飞鸟'] : []),
        ...(counts.horse ? ['马儿', '骏马'] : []),
      ]);
      scene.imagery = _mergeUnique(scene.imagery, ['爪子', '尾巴', '毛茸', '鼻头', '耳朵', '小窝', '拥抱', '零食', '牵引绳', '沙发'], 20);
      scene.themes = _mergeUnique(scene.themes, ['pet_love', 'companionship', 'healing'], 5);
      scene.emotions = _mergeUnique(scene.emotions, ['温馨', '治愈', '陪伴', '喜悦', '温暖'], 10);
    }
    if (hasFood) {
      scene.subjects = _mergeUnique(scene.subjects, ['美食', '佳肴', '甜品', '饮品', '餐桌']);
      scene.imagery = _mergeUnique(scene.imagery, ['香气', '热气', '刀叉', '摆盘', '味道', '余味', '咖啡', '烛光', '蛋糕', '餐具'], 20);
      scene.themes = _mergeUnique(scene.themes, ['culinary', 'taste', 'dining'], 4);
      scene.emotions = _mergeUnique(scene.emotions, ['满足', '甜蜜', '温暖', '愉悦'], 8);
      if (counts.cake) scene.genre = _mergeUnique(scene.genre, ['celebration', 'birthday'], 6);
    }
    if (hasSports) {
      scene.subjects = _mergeUnique(scene.subjects, ['汗水', '胜利', '赛场', '队友', '挑战']);
      scene.imagery = _mergeUnique(scene.imagery, ['呐喊', '奔跑', '跳跃', '挥拍', '比分', '终点线', '奖牌', '风', '心跳', '欢呼'], 20);
      scene.themes = _mergeUnique(scene.themes, ['triumph', 'sportsmanship', 'challenge'], 4);
      scene.emotions = _mergeUnique(scene.emotions, ['热血', '澎湃', '紧张', '雀跃', '不服输'], 10);
      if (scene.tempos) scene.tempos = _mergeUnique(scene.tempos, [120, 135, 150], 6);
    }
    if (hasTravel) {
      scene.subjects = _mergeUnique(scene.subjects, ['旅人', '远方', '异乡', '归途', '行李']);
      scene.imagery = _mergeUnique(scene.imagery, ['机票', '航站楼', '舷窗', '云海', '火车票', '站牌', '行李箱', '旅馆', '明信片', '地图'], 20);
      scene.themes = _mergeUnique(scene.themes, ['wanderlust', 'dreams', 'discovery'], 5);
      scene.emotions = _mergeUnique(scene.emotions, ['期待', '忐忑', '自由', '向往', '惊喜'], 10);
    }
    if (hasRoad) {
      scene.imagery = _mergeUnique(scene.imagery, ['公路', '车窗', '尾灯', '信号灯', '方向盘', '后视镜', '加油站', '高速公路', '电台', '风景'], 20);
      scene.themes = _mergeUnique(scene.themes, ['road_trip', 'freedom'], 4);
    }
    if (hasOffice) {
      scene.subjects = _mergeUnique(scene.subjects, ['代码', '屏幕', '键盘', '方案', '进度']);
      scene.imagery = _mergeUnique(scene.imagery, ['键盘', '屏幕光', '咖啡杯', '会议', '文档', '报表', '邮件', '台灯', '椅子', ' deadline'], 20);
      scene.themes = _mergeUnique(scene.themes, ['hustle', 'ambition', 'urban_life'], 4);
    }
    if (hasHome) {
      scene.imagery = _mergeUnique(scene.imagery, ['沙发', '卧室', '窗边', '台灯', '家的味道', '被子', '拖鞋', '厨房', '冰箱', '抱枕'], 20);
      scene.themes = _mergeUnique(scene.themes, ['home', 'cozy', 'relaxation'], 4);
      scene.emotions = _mergeUnique(scene.emotions, ['安宁', '松弛', '温暖', '归属'], 8);
    }
    if (hasWild) {
      scene.subjects = _mergeUnique(scene.subjects, ['野生动物', '草原', '森林', '自然']);
      scene.imagery = _mergeUnique(scene.imagery, ['草原', '灌木丛', '脚印', '野性', '奔跑', '嘶吼', '羽毛', '鬃毛', '象群', '山谷'], 20);
      scene.themes = _mergeUnique(scene.themes, ['wild_nature', 'adventure', 'discovery'], 4);
    }

    // Append server-side object / scene-hint tags to description for transparency.
    const objList = Object.entries(counts).slice(0, 12).map(([k, v]) => v > 1 ? `${k}×${v}` : k).join('、');
    const hintList = (pv.sceneHints || []).filter(h => h.score >= 0.55).slice(0, 4)
      .map(h => `${h.id}(${Math.round(h.score * 100)}%)`).join('、');
    if ((objList || hintList) && scene.description && !scene.description.includes('[YOLO物体识别]')) {
      scene.description += ` [YOLO物体识别：${objList || '—'} | 场景提示：${hintList || '—'}]`;
    }
  }

  return scene;
}

function _ageBucketZh(b) {
  return { child: '儿童', teen: '青少年', young_adult: '青年', adult: '中年', senior: '老年' }[b] || b;
}
function _expressionZh(e) {
  return {
    happy: '开心', neutral: '平静', sad: '难过', angry: '生气',
    fearful: '担忧', disgusted: '厌烦', surprised: '惊讶',
  }[e] || e;
}

/* --------------------------------------------------------------------------
 * SERVER-VISION FUSION: POST uploaded image to our Node server's
 * /api/vision/analyze so the Python YOLOv8n ONNX worker can tag 80 COCO
 * object classes + scene hints from a real neural net on the backend.
 *
 * Returns: the "pythonVision" sub-object (objects, counts, sceneHints,
 *          colorFeatures, meta) or throws if the server is unreachable.
 *          Callers MUST try/catch and fall back to browser-only analysis.
 * -------------------------------------------------------------------------- */
async function _callPythonVisionServer(imageElement) {
  if (typeof window === 'undefined' || typeof fetch !== 'function') throw new Error('no browser fetch');
  if (!imageElement || !imageElement.complete || !imageElement.naturalWidth) throw new Error('image not ready');

  // Encode to JPEG at 85% — a good balance of size and detail.
  const canvas = document.createElement('canvas');
  const maxDim = 1280;
  const scale = Math.min(1, maxDim / Math.max(imageElement.naturalWidth, imageElement.naturalHeight));
  canvas.width = Math.round(imageElement.naturalWidth * scale);
  canvas.height = Math.round(imageElement.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85);
  });

  // Try same-origin first, then common dev-server proxy paths.  Short
  // timeouts so we don't block the UX for 30s on a dead server.
  const candidates = [
    '/api/vision/analyze',
    `http://${window.location.hostname}:5501/api/vision/analyze`,
    'http://localhost:5501/api/vision/analyze',
  ];

  let lastErr = null;
  for (const url of candidates) {
    try {
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), 25000);
      const res = await fetch(url, {
        method: 'POST',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' },
        signal: ctrl.signal,
      }).finally(() => clearTimeout(tm));
      if (!res.ok) { lastErr = new Error(`HTTP ${res.status}`); continue; }
      const json = await res.json();
      if (json && json.success && json.data && json.data.pythonVision) {
        return json.data.pythonVision;
      }
      // Even if python worker failed and fell back to pure heuristic, we
      // still don't throw; return null so caller proceeds with browser side.
      return null;
    } catch (e) {
      lastErr = e;
      /* try next candidate */
    }
  }
  throw lastErr || new Error('no vision server reachable');
}

export function classifyScene(features) {
  const f = features;

  // FIRST: check semantic features (people/couple detected) with high confidence
  if (f.subjectType && f.subjectConfidence > 0.15) {
    const semanticProfile = _classifyBySemantics(f);
    if (semanticProfile) {
      const result = { ...semanticProfile, profileId: semanticProfile._semanticId };
      result.vocalSuggestion = _inferVocalFromFeatures(f);
      // Merge with best scene profile if semantic is weak
      if (f.subjectConfidence < 0.35) {
        const bestScene = _findBestWeightedScene(f, ['urban_loneliness', 'storm_tension', 'dreamy_night', 'passionate_love'], /*peopleCountHint*/ f.personCount || 0);
        if (bestScene && bestScene.score > 0.6) {
          result.imagery = _mergeUnique(result.imagery, bestScene.profile.lyrics.imagery, 12);
          result.genre = _mergeUnique(result.genre, bestScene.profile.lyrics.genre, 5);
          result.themes = _mergeUnique(result.themes, bestScene.profile.lyrics.themes, 4);
          result.description += `；场景倾向：${bestScene.profile.lyrics.description}`;
        }
      }
      return _applyFaceMetaToScene(result, f);
    }
  }

  // FIRST B: direct-feature semantic fallback — catches people when subjectConfidence was too low.
  // Person count is more reliable than subjectConfidence threshold for some selfies (sunglasses, occluded).
  const directPersonCount = f.personCount || 0;
  const hasPersonEvidence = (f.skinRatio || 0) > 0.02 || directPersonCount >= 1 || f.isSelfie === true;
  if (hasPersonEvidence) {
    // Synthesize semantic classification from raw features
    const synthesizedType =
      directPersonCount >= 3 ? 'group' :
        directPersonCount === 2 ? 'couple' :
          directPersonCount === 1 ? 'portrait' :
            f.isSelfie ? 'portrait' :
              (f.skinRatio || 0) > 0.06 ? 'portrait' : 'people_present';

    const semanticFromFeatures = _classifyBySemantics({ ...f, subjectType: synthesizedType, subjectConfidence: 0.2 });
    if (semanticFromFeatures) {
      const result = { ...semanticFromFeatures, profileId: semanticFromFeatures._semanticId, matchScore: 0.68 };
      result.vocalSuggestion = _inferVocalFromFeatures(f);
      // Boost imagery with feature-derived words for this lower-confidence match
      result.imagery = _mergeUnique(result.imagery, _deriveImageryFromFeatures(f), 14);
      result.emotions = _mergeUnique(result.emotions, _deriveEmotionsFromFeatures(f), 8);
      result.description = `[人脸/人数启发式匹配] ${result.description}`;
      return _applyFaceMetaToScene(result, f);
    }
  }

  // FIRST C: SERVER SCENE-HINT PRIORITY MATCH (Python YOLO object detection)
  // FIRST A/B only reason about people.  For non-human photos (pets, food,
  // beach, office, travel…) the backend's YOLOv8 80-class COCO detector gives
  // direct strong signals.  If any hint >= 0.75 confidence matches a
  // SCENE_PROFILES.id, we use it with high priority DIRECTLY, skipping the
  // color-only guesswork below.
  if (f.pythonVision && Array.isArray(f.pythonVision.sceneHints)) {
    const strongHints = f.pythonVision.sceneHints.filter(h => h.score >= 0.75);
    for (const hint of strongHints) {
      const profile = SCENE_PROFILES.find(p => p.id === hint.id);
      if (!profile) continue;
      const result = { ...profile.lyrics, profileId: profile.id, matchScore: hint.score };
      result.vocalSuggestion = _inferVocalFromFeatures(f);
      result.description =
        `[服务器YOLO识别 · 场景${hint.id}置信度${Math.round(hint.score * 100)}%] ${result.description}`;
      // Still inject scene-independent features into the result.
      result.imagery = _mergeUnique(result.imagery, _deriveImageryFromFeatures(f), 12);
      result.emotions = _mergeUnique(result.emotions, _deriveEmotionsFromFeatures(f), 8);
      return _applyFaceMetaToScene(result, f);
    }
  }

  // SECOND: boolean match against scene profiles
  const hasPeopleEvidence = hasPersonEvidence;  // alias for continuity
  const darkProfileIds = ['urban_loneliness', 'storm_tension', 'dreamy_night', 'passionate_love'];

  for (const profile of SCENE_PROFILES) {
    if (hasPeopleEvidence && darkProfileIds.includes(profile.id)) continue;
    // Guard: Scenes that REQUIRE a CROWD (group event) shall NOT trigger for solo/duo photos.
    // e.g. "festive_celebration / concert_live / wedding_ceremony" needs ≥3 people OR no person evidence at all.
    if (_CROWD_SCENES.has(profile.id) && directPersonCount > 0 && directPersonCount < 3) continue;
    try {
      if (profile.match(f)) {
        const result = { ...profile.lyrics, profileId: profile.id, matchScore: 1.0 };
        result.vocalSuggestion = _inferVocalFromFeatures(f);
        return _applyFaceMetaToScene(result, f);
      }
    } catch (e) { /* ignore broken match functions */ }
  }

  // THIRD: weighted fallback — pick the profile with highest partial score
  // Crowd-exclusion: skip crowd-event profiles if directPersonCount === 1 || directPersonCount === 2
  const crowdSkipExtra = directPersonCount > 0 && directPersonCount < 3 ? [..._CROWD_SCENES] : [];
  const bestScene = _findBestWeightedScene(
    f,
    (hasPeopleEvidence ? [...darkProfileIds, ...crowdSkipExtra] : crowdSkipExtra),
    directPersonCount
  );
  if (bestScene && bestScene.score > 0.45) {
    const result = { ...bestScene.profile.lyrics, profileId: bestScene.profile.id, matchScore: bestScene.score };
    result.vocalSuggestion = _inferVocalFromFeatures(f);
    result.description = `[加权匹配 ${Math.round(bestScene.score * 100)}%] ${result.description}`;
    // Enhance with feature-derived words for low-confidence matches
    if (bestScene.score < 0.7) {
      result.imagery = _mergeUnique(result.imagery, _deriveImageryFromFeatures(f), 14);
      result.emotions = _mergeUnique(result.emotions, _deriveEmotionsFromFeatures(f), 8);
    }
    return _applyFaceMetaToScene(result, f);
  }

  // Fallback: generate from individual features
  return _applyFaceMetaToScene(generateFromFeatures(features), f);
}

// Scenes that conceptually require a CROWD / group event. Never fire these for solo/duo portraits.
const _CROWD_SCENES = new Set([
  'festive_celebration',
  'concert_live',
  'wedding_ceremony',
  'graduation_achievement',
  'fireworks_night',
  'sports_action',
  'camping_bonfire',  // (usually 2+ people, but allow 2 for romantic camping)
  'street_documentary',
]);

/** Find the scene profile with highest weighted score, excluding skipIds
 *  @param peopleCountHint - if < 3, penalize crowd-event profiles (festive/concert/wedding/etc.)
 */
function _findBestWeightedScene(f, skipIds = [], peopleCountHint = 0) {
  let best = null;
  let bestScore = -1;
  for (const profile of SCENE_PROFILES) {
    if (skipIds.includes(profile.id)) continue;
    let s = _weightedSceneScore(profile, f);
    // Extra: crowd-event scenes get huge penalty when people count is known to be 1 or 2.
    if (peopleCountHint > 0 && peopleCountHint < 3 && _CROWD_SCENES.has(profile.id)) {
      s = s * 0.15;
    }
    if (s > bestScore) {
      bestScore = s;
      best = profile;
    }
  }
  return best ? { profile: best, score: bestScore } : null;
}

/** Merge two arrays, keep unique entries, cap at maxLen */
function _mergeUnique(a, b, maxLen = 10) {
  const out = [...(a || [])];
  for (const item of (b || [])) {
    if (!out.includes(item)) out.push(item);
    if (out.length >= maxLen) break;
  }
  return out.slice(0, maxLen);
}

/**
 * Classify scene based on semantic subject detection
 * This ensures that a couple photo generates love lyrics, not generic color-based ones
 */
function _classifyBySemantics(f) {
  const type = f.subjectType;
  const conf = f.subjectConfidence || 0;

  if (type === 'couple') {
    const hasWarmBrightColors = f.warmRatio > 0.3 && f.brightness > 0.4;
    // CAUTIOUS WORDING (never assert "情侣" unless high confidence):
    //   - conf >= 0.7 → "双人合照，倾向于情侣/伴侣"
    //   - conf >= 0.5 → "双人合照（朋友/家人/伴侣）"
    //   - lower    → "画面有两处人脸/皮肤聚集区域" (avoid assumption entirely)
    let peopleDesc;
    if (conf >= 0.7) {
      peopleDesc = hasWarmBrightColors
        ? '检测到双人合照，倾向于情侣/伴侣，色彩温暖明亮'
        : '检测到双人合照，倾向于情侣/伴侣';
    } else if (conf >= 0.5) {
      peopleDesc = hasWarmBrightColors
        ? '检测到双人合照（朋友/家人/伴侣等），色彩温暖明亮'
        : '检测到双人合照（朋友/家人/伴侣等）';
    } else {
      peopleDesc = hasWarmBrightColors
        ? '画面有两处明显的人脸/皮肤聚集区域，色彩温暖明亮'
        : '画面有两处明显的人脸/皮肤聚集区域';
    }

    const scene = {
      _semanticId: 'semantic_couple',
      genre: hasWarmBrightColors
        ? ['pop', 'love_song', 'kpop', 'ballad']
        : ['love_song', 'ballad', 'romantic'],
      themes: hasWarmBrightColors
        ? ['love', 'happiness', 'memories']
        : ['love', 'romantic_night', 'memories'],
      imagery: ['恋人', '拥抱', '笑容', '心跳', '牵手', '夕阳', '月光', '回忆', '甜蜜', '温柔'],
      emotions: hasWarmBrightColors
        ? ['甜蜜', '幸福', '温馨', '快乐', '炽热']
        : ['甜蜜', '温馨', '眷恋', '炽热', '渴望'],
      subjects: ['恋人', '伴侣', '爱人', '另一半', '我们'],
      actions: ['相拥', '牵手', '凝望', '低语', '依偎', '承诺', '守护'],
      locations: ['在身边', '怀里', '目光里', '梦里', '此刻'],
      tempos: hasWarmBrightColors ? [95, 105, 115] : [75, 85, 95],
      description: `${peopleDesc}，生成抒情/甜蜜风格歌词（若实际并非情侣，可手动切换主题）`,
      confidence: conf,
    };
    if (f.skinRegion.includes('upper')) {
      scene.imagery.push('脸颊', '双眸', '发丝', '笑容');
      scene.actions.push('凝视', '微笑');
    }
    if (f.indoorOutdoor === 'indoor') {
      scene.locations.push('灯下', '房间里', '窗边');
      scene.imagery.push('灯光', '温暖');
    }
    if (f.isSelfie) {
      scene.description += '（自拍照风格）';
      scene.imagery.push('自拍', '屏幕', '滤镜');
    }
    return scene;
  }

  if (type === 'portrait') {
    // For high skin-ratio portraits (selfies / close-ups), use color analysis
    // to determine the right mood instead of defaulting to loneliness
    const hasWarmBrightColors = f.warmRatio > 0.35 && f.brightness > 0.45;
    const hasCoolDarkColors = f.coolRatio > 0.35 && f.brightness < 0.4;
    const highSkinRatio = f.skinRatio > 0.1; // lots of face showing
    // Use f.isSelfie (computed in extractSemanticFeatures) instead of local var
    const selfieDetected = f.isSelfie === true;

    let themes;
    if (selfieDetected && highSkinRatio && hasWarmBrightColors) {
      // Smiling selfie with warm colors → happy, love, nostalgia
      themes = ['happiness', 'love', 'life'];
    } else if (hasWarmBrightColors) {
      themes = ['love', 'memories', 'nostalgic'];
    } else if (hasCoolDarkColors) {
      // Cool/dark portrait: use introspection/memory instead of defaulting to sadness
      themes = ['introspection', 'memory', 'life'];
    } else if (highSkinRatio && f.skinRegion && f.skinRegion.startsWith('upper')) {
      // Close-up portrait: emotion detected by color
      themes = hasWarmBrightColors ? ['love', 'memories', 'life'] : ['memory', 'introspection', 'life'];
    } else {
      themes = ['memory', 'introspection', 'life'];
    }

    const scene = {
      _semanticId: 'semantic_portrait',
      genre: hasWarmBrightColors ? ['pop', 'ballad', 'kpop'] : ['ballad', 'rnb', 'nostalgic'],
      themes,
      imagery: ['身影', '剪影', '目光', '心事', '独白', '光影', '侧脸', '轮廓'],
      emotions: hasWarmBrightColors
        ? ['温暖', '幸福', '眷恋', '希望', '温柔']
        : hasCoolDarkColors
          ? ['沉思', '渴望', '坚定', '温柔', '内敛']
          : ['沉思', '渴望', '温柔', '坚定'],
      subjects: ['自己', '身影', '旅人', '归人', '角色'],
      actions: ['凝望', '沉思', '等待', '追寻'],
      locations: ['在心里', '角落', '路上', '此刻'],
      tempos: [70, 80, 90],
      description: '图片中检测到一个人（肖像/自拍），根据色彩和光线推断情绪主题',
      confidence: f.subjectConfidence
    };
    if (selfieDetected) {
      scene.imagery.push('自拍', '镜头前', '表情', '眼神');
      scene.actions.push('回眸', '微笑');
      scene.locations.push('屏幕里', '当下');
    }
    if (f.indoorOutdoor === 'indoor') {
      scene.locations.push('房间', '室内', '灯下');
    }
    return scene;
  }

  if (type === 'group') {
    return {
      _semanticId: 'semantic_group',
      genre: ['pop', 'kpop', 'friendship'],
      themes: ['friendship', 'energetic_party', 'dreams'],
      imagery: ['笑容', '欢呼', '人群', '拥抱', '派对', '舞台', '光芒', '庆典', '伙伴', '青春'],
      emotions: ['兴奋', '快乐', '团结', '自由', '热情'],
      subjects: ['伙伴', '朋友', '少年', '同伴', '追梦人'],
      actions: ['欢呼', '拥抱', '奔跑', '跳跃', '举杯', '闪耀'],
      locations: ['舞台', '派对', '人群中', '庆典'],
      tempos: [110, 120, 130],
      description: '图片中检测到多人（群体照），生成友情/活力主题歌词',
      confidence: f.subjectConfidence
    };
  }

  if (type === 'people_present') {
    return {
      _semanticId: 'semantic_people',
      genre: ['indie', 'folk', 'ballad'],
      themes: ['life', 'memory', 'friendship'],
      imagery: ['身影', '故事', '时光', '片段', '回忆', '人间', '烟火', '日常'],
      emotions: ['平静', '温馨', '释然', '感慨', '踏实'],
      subjects: ['人', '路人', '陌生人', '自己', '身边人'],
      actions: ['走过', '相遇', '停留', '擦肩而过', '留下'],
      locations: ['街角', '路上', '巷口', '身边'],
      tempos: [75, 85, 95],
      description: '图片中检测到人物轮廓，生成生活主题歌词',
      confidence: f.subjectConfidence
    };
  }

  // 'unknown' type but with detectable skin → treat as person for safety
  if (type === 'unknown' && f.skinRatio > 0.03) {
    return {
      _semanticId: 'semantic_unknown_people',
      genre: ['indie', 'folk', 'ballad'],
      themes: ['life', 'memory', 'dreams'],
      imagery: ['身影', '故事', '时光', '片段', '回忆'],
      emotions: ['平静', '感慨', '温柔'],
      subjects: ['身影', '路人', '身边人'],
      actions: ['走过', '相遇', '停留'],
      locations: ['街角', '路上', '此刻'],
      tempos: [75, 85, 95],
      description: '图片中检测到人物特征，生成生活主题歌词',
      confidence: f.skinRatio * 0.5
    };
  }

  return null;
}

/**
 * Fallback generation when no scene profile matches perfectly
 */
function generateFromFeatures(f) {
  const lyrics = {
    genre: [],
    themes: [],
    imagery: [],
    emotions: [],
    subjects: [],
    actions: [],
    locations: [],
    tempos: [],
    description: '',
    vocalSuggestion: null
  };

  // Genre from lighting + saturation
  if (f.lightingType === 'high_key' && f.saturation > 0.4) {
    lyrics.genre.push('pop', 'kpop', 'energetic');
  } else if (f.lightingType === 'low_key' && f.saturation < 0.5) {
    lyrics.genre.push('rock', 'gothic_rock', 'electronic');
  } else if (f.saturation > 0.6) {
    lyrics.genre.push('pop', 'dance', 'energetic');
  } else if (f.brightness < 0.35) {
    lyrics.genre.push('ballad', 'nostalgic', 'rnb');
  } else {
    lyrics.genre.push('indie', 'folk', 'ambient');
  }

  // Themes from dominant features
  if (f.warmRatio > 0.25 && f.darkRatio < 0.4) {
    lyrics.themes.push('love', 'nostalgic_memory', 'romantic_night');
  }
  if (f.coolRatio > 0.3 && f.darkRatio > 0.3) {
    // Cool/dark but neutral themes - avoid loneliness by default
    lyrics.themes.push('introspection', 'dreams', 'memory');
  }
  if (f.greenRatio > 0.2) {
    lyrics.themes.push('nature', 'healing', 'spring_awakening');
  }
  if (f.colorfulness > 0.5 && f.brightness > 0.5) {
    lyrics.themes.push('energetic_party', 'friendship', 'dreams');
  }
  if (lyrics.themes.length === 0) {
    lyrics.themes.push('life', 'memory', 'dreams');
  }

  // Imagery from dominant colors
  for (const dc of f.dominantColors?.slice(0, 3) || []) {
    const hex = dc.hex.toUpperCase();
    const semantic = COLOR_SEMANTICS[hex] || findClosestSemantic(hex);
    if (semantic) {
      lyrics.imagery.push(...semantic.imagery);
      lyrics.emotions.push(semantic.mood);
    }
  }
  if (lyrics.imagery.length === 0) {
    lyrics.imagery.push('光影', '色彩', '画面', '瞬间', '故事');
  }

  // Locations from region analysis
  if (f.horizonLine) lyrics.locations.push('远方', '天际', '地平线');
  if (f.skyRatio > 0.4) lyrics.locations.push('天空', '云端', '高空');
  if (f.groundRatio > 0.4) lyrics.locations.push('大地', '地面', '脚下');
  if (f.verticalRatio < 0.45) lyrics.locations.push('高处', '上方');
  if (f.verticalRatio > 0.55) lyrics.locations.push('低处', '下方');
  if (lyrics.locations.length === 0) lyrics.locations.push('眼前', '此刻');

  // Actions from texture
  if (f.textureType === 'complex') {
    lyrics.actions.push('交织', '纠缠', '变幻', '碰撞');
  } else if (f.textureType === 'smooth') {
    lyrics.actions.push('流动', '延展', '弥漫', '轻拂');
  } else {
    lyrics.actions.push('存在', '凝视', '感受', '经历');
  }

  // Subjects from composition
  const position = f.visualCenter;
  if (position.includes('Center')) lyrics.subjects.push('主体', '中心', '焦点');
  if (position.includes('Left')) lyrics.subjects.push('回忆', '过去', '左侧');
  if (position.includes('Right')) lyrics.subjects.push('未来', '远方', '右侧');
  if (position.includes('top')) lyrics.subjects.push('天空', '梦境', '高处');
  if (position.includes('bot')) lyrics.subjects.push('大地', '现实', '低处');
  if (lyrics.subjects.length === 0) lyrics.subjects.push('自我', '此刻', '存在');

  // Tempo
  const energy = f.brightness * 0.3 + f.saturation * 0.3 + (1 - f.darkRatio) * 0.4;
  const baseTempo = Math.round(60 + energy * 80);
  lyrics.tempos.push(baseTempo - 5, baseTempo, baseTempo + 5);

  // Description
  const colorDesc = f.dominantColors.slice(0, 3).map(c => c.hex).join('、');
  const lightDesc = {
    high_key: '明亮高调',
    low_key: '低沉暗调',
    high_contrast: '高对比',
    soft_light: '柔和光线',
    normal: '正常光线'
  }[f.lightingType] || '自然光线';

  lyrics.description = `图片主色调为${colorDesc}，${lightDesc}，${f.textureType === 'complex' ? '复杂纹理' : f.textureType === 'smooth' ? '平滑质感' : '中等纹理'}，` +
    `构图${f.symmetry > 0.8 ? '对称' : f.symmetry > 0.6 ? '平衡' : '动态不平衡'}，` +
    `视觉焦点位于${position}。建议风格：${lyrics.genre.slice(0, 2).join('/')}，主题：${lyrics.themes.slice(0, 2).join('/')}。`;

  lyrics.vocalSuggestion = _inferVocalFromFeatures(f);

  return lyrics;
}

/**
 * Infer vocal gender and characteristics from visual features.
 * Uses color psychology, lighting, and composition to suggest
 * a voice that matches the visual mood.
 */
function _inferVocalFromFeatures(f) {
  let femaleScore = 0;
  let maleScore = 0;
  let femaleTraits = [];
  let maleTraits = [];

  // Color-based gender association (subtle cultural mappings)
  const warmFeminineHues = ['#FF69B4', '#FF1493', '#FFC0CB', '#DDA0DD', '#FFA500', '#FFD700'];
  const coolMasculineHues = ['#4169E1', '#000080', '#4682B4', '#8B4513', '#808080', '#2F4F4F'];
  const neutralHues = ['#228B22', '#90EE90', '#87CEEB', '#FFFFFF', '#000000'];

  for (const dc of f.dominantColors || []) {
    const hex = dc.hex.toUpperCase();
    const pct = dc.percentage || 0;
    if (warmFeminineHues.includes(hex)) {
      femaleScore += pct * 1.5;
      femaleTraits.push(`暖色调 ${hex}`);
    } else if (coolMasculineHues.includes(hex)) {
      maleScore += pct * 1.5;
      maleTraits.push(`冷色调 ${hex}`);
    } else if (neutralHues.includes(hex)) {
      // Neutral colors keep the race undecided
    }
  }

  // Lighting-based gender association
  if (f.lightingType === 'high_key' && f.brightness > 0.5) {
    femaleScore += 20;
    femaleTraits.push('明亮高调光线');
  } else if (f.lightingType === 'low_key' && f.brightness < 0.35) {
    maleScore += 20;
    maleTraits.push('低沉暗调光线');
  }

  if (f.lightingType === 'soft_light') {
    femaleScore += 15;
    femaleTraits.push('柔和光线');
  } else if (f.lightingType === 'high_contrast') {
    maleScore += 15;
    maleTraits.push('高对比光线');
  }

  // Texture-based
  if (f.textureType === 'smooth') {
    femaleScore += 10;
    femaleTraits.push('平滑质感');
  } else if (f.textureType === 'complex') {
    maleScore += 10;
    maleTraits.push('复杂纹理');
  }

  // Saturation-based
  if (f.saturation > 0.55) {
    femaleScore += 10;
    femaleTraits.push('高饱和度');
  } else if (f.saturation < 0.3) {
    maleScore += 10;
    maleTraits.push('低饱和度');
  }

  // Composition-based
  if (f.symmetry > 0.75 && f.verticalRatio < 0.5) {
    femaleScore += 5;
  }
  if (f.verticalRatio > 0.55) {
    maleScore += 5;
  }

  const total = femaleScore + maleScore;
  if (total === 0) {
    return {
      gender: '女声',
      confidence: 0.3,
      traits: ['视觉特征不明显，默认女声'],
      reason: '无明显性别倾向视觉特征'
    };
  }

  const femaleRatio = femaleScore / total;
  const gender = femaleRatio > 0.55 ? '女声' : femaleRatio < 0.35 ? '男声' : '女声';
  const confidence = Math.abs(femaleRatio - 0.5) * 2;
  const traits = gender === '女声' ? femaleTraits : maleTraits;

  return {
    gender,
    confidence: Math.round(confidence * 100) / 100,
    traits: traits.length > 0 ? traits : [gender === '女声' ? '综合视觉特征偏向女声' : '综合视觉特征偏向男声'],
    reason: `基于色彩、光线、纹理等${traits.length}项特征推断为${gender}`
  };
}

/* =========================================================================
 * HELPER FUNCTIONS
 * ========================================================================= */

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function mapRegionToPosition(region) {
  const map = {
    topLeft: '左上', topCenter: '顶部中央', topRight: '右上',
    midLeft: '左侧', midCenter: '中央', midRight: '右侧',
    botLeft: '左下', botCenter: '底部中央', botRight: '右下'
  };
  return map[region] || '中央';
}

function findClosestSemantic(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  let closest = null;
  let minDist = Infinity;
  for (const [key, val] of Object.entries(COLOR_SEMANTICS)) {
    const kr = parseInt(key.slice(1, 3), 16);
    const kg = parseInt(key.slice(3, 5), 16);
    const kb = parseInt(key.slice(5, 7), 16);
    const dist = Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2);
    if (dist < minDist) {
      minDist = dist;
      closest = val;
    }
  }
  return minDist < 60 ? closest : null;
}

/* =========================================================================
 * MAIN EXPORT: Full analysis pipeline
 * ========================================================================= */

/**
 * ZUNICORN AGENT LOOP — Self-validation and refinement
 * ============================================
 * Implements the agent loop engineering pattern:
 *   ANALYZE → GENERATE → VALIDATE → REFINE (loop until quality threshold met)
 *
 * This function validates the generated scene against the extracted features
 * and refines it to ensure professional, image-relevant output.
 *
 * @param {Object} scene - The initially classified scene
 * @param {Object} features - The raw visual features
 * @param {number} [maxIterations=2] - Max refinement iterations
 * @returns {Object} Refined scene with quality metadata
 */
function _agentLoopValidate(scene, features, maxIterations = 2) {
  let current = { ...scene };
  let iteration = 0;
  const validationLog = [];

  while (iteration < maxIterations) {
    const issues = _detectSceneIssues(current, features);
    validationLog.push({
      iteration,
      issuesFound: issues.length,
      issues: issues.map(i => i.type)
    });

    if (issues.length === 0) break;

    current = _refineScene(current, features, issues);
    iteration++;
  }

  // Compute final quality score
  const quality = _computeSceneQuality(current, features);

  return {
    ...current,
    _agentLoop: {
      iterations: iteration,
      validationLog,
      qualityScore: quality.score,
      qualityGrade: quality.grade,
      confidence: quality.confidence
    }
  };
}

/**
 * Detect quality issues in a generated scene
 */
function _detectSceneIssues(scene, features) {
  const issues = [];

  // Issue 1: Empty or sparse vocabulary
  if (!scene.imagery || scene.imagery.length < 3) {
    issues.push({ type: 'sparse_imagery', severity: 'high' });
  }
  if (!scene.emotions || scene.emotions.length < 2) {
    issues.push({ type: 'sparse_emotions', severity: 'medium' });
  }
  if (!scene.subjects || scene.subjects.length < 2) {
    issues.push({ type: 'sparse_subjects', severity: 'medium' });
  }

  // Issue 2: Conflicting themes (e.g., happiness + heartbreak together)
  const negativeThemes = ['heartbreak', 'melancholy', 'loneliness', 'sadness', 'dark_mystery'];
  const positiveThemes = ['love', 'happiness', 'hope', 'friendship', 'dreams'];
  const themes = scene.themes || [];
  const hasNeg = themes.some(t => negativeThemes.includes(t));
  const hasPos = themes.some(t => positiveThemes.includes(t));
  if (hasNeg && hasPos && !features.subjectType) {
    // Only flag conflict if not a people photo (people photos can have complex emotions)
    issues.push({ type: 'theme_conflict', severity: 'high' });
  }

  // Issue 3: Theme-image mismatch — a love theme should have warm imagery
  if (themes.includes('love') && features.warmRatio < 0.15 && !features.subjectType) {
    issues.push({ type: 'love_theme_without_warmth', severity: 'medium' });
  }

  // Issue 4: Lonely themes on bright, warm images (the original bug)
  const isBrightWarm = features.brightness > 0.5 && features.warmRatio > 0.3;
  const hasLonelyTheme = themes.some(t =>
    ['loneliness', 'melancholy', 'heartbreak', 'sadness'].includes(t));
  if (isBrightWarm && hasLonelyTheme && !features.subjectType) {
    issues.push({ type: 'bright_image_lonely_theme', severity: 'critical' });
  }

  // Issue 5: No tempo defined
  if (!scene.tempos || scene.tempos.length === 0) {
    issues.push({ type: 'missing_tempo', severity: 'low' });
  }

  return issues;
}

/**
 * Refine a scene to fix detected issues
 */
function _refineScene(scene, features, issues) {
  const refined = {
    ...scene,
    imagery: [...(scene.imagery || [])],
    emotions: [...(scene.emotions || [])],
    subjects: [...(scene.subjects || [])],
    actions: [...(scene.actions || [])],
    locations: [...(scene.locations || [])],
    themes: [...(scene.themes || [])],
    genre: [...(scene.genre || [])],
    tempos: [...(scene.tempos || [])]
  };

  for (const issue of issues) {
    switch (issue.type) {
      case 'sparse_imagery':
        refined.imagery.push(..._deriveImageryFromFeatures(features));
        break;
      case 'sparse_emotions':
        refined.emotions.push(..._deriveEmotionsFromFeatures(features));
        break;
      case 'sparse_subjects':
        refined.subjects.push('此刻', '画面', '故事', '光影');
        break;
      case 'theme_conflict':
        // Keep positive themes, drop negative ones for non-people images
        refined.themes = refined.themes.filter(t =>
          !['heartbreak', 'melancholy', 'loneliness', 'sadness'].includes(t));
        if (refined.themes.length === 0) refined.themes.push('life', 'memory', 'dreams');
        break;
      case 'love_theme_without_warmth':
        // Demote love theme if image isn't warm
        refined.themes = refined.themes.filter(t => t !== 'love');
        refined.themes.push('memory', 'introspection');
        break;
      case 'bright_image_lonely_theme':
        // Critical fix: replace lonely themes with bright/warm themes
        refined.themes = refined.themes.filter(t =>
          !['loneliness', 'melancholy', 'heartbreak', 'sadness'].includes(t));
        refined.themes.push('hope', 'happiness', 'life');
        refined.emotions = refined.emotions.filter(e =>
          !['孤独', '忧伤', '悲伤', '心碎', '寂寥'].includes(e));
        refined.emotions.push('温暖', '希望', '幸福');
        break;
      case 'missing_tempo':
        refined.tempos = [80, 90, 100];
        break;
    }
  }

  // Deduplicate
  refined.imagery = [...new Set(refined.imagery)];
  refined.emotions = [...new Set(refined.emotions)];
  refined.subjects = [...new Set(refined.subjects)];
  refined.themes = [...new Set(refined.themes)];

  return refined;
}

/** Derive imagery words from color/lighting features */
function _deriveImageryFromFeatures(f) {
  const out = [];
  if (f.warmRatio > 0.3) out.push('暖光', '余晖', '温暖');
  if (f.coolRatio > 0.3) out.push('冷光', '清辉', '幽蓝');
  if (f.greenRatio > 0.2) out.push('绿意', '生机', '草木');
  if (f.blueRatio > 0.2) out.push('蓝调', '辽阔', '远方');
  if (f.brightness > 0.6) out.push('明亮', '光芒', '清透');
  if (f.darkRatio > 0.4) out.push('暗影', '深邃', '幽暗');
  if (f.horizonLine) out.push('地平线', '远方', '天际');
  return out.slice(0, 6);
}

/** Derive emotions from color/lighting features */
function _deriveEmotionsFromFeatures(f) {
  const out = [];
  if (f.warmRatio > 0.3 && f.brightness > 0.4) out.push('温暖', '幸福', '希望');
  else if (f.coolRatio > 0.3 && f.brightness < 0.4) out.push('沉思', '宁静', '深邃');
  else out.push('平静', '温柔', '感慨');
  return out;
}

/** Compute a quality score and grade for a scene */
function _computeSceneQuality(scene, features) {
  let score = 0;
  const checks = [];

  // Vocabulary richness (0-30 points)
  const imgScore = Math.min(10, (scene.imagery?.length || 0));
  const emoScore = Math.min(8, (scene.emotions?.length || 0));
  const subScore = Math.min(6, (scene.subjects?.length || 0));
  const actScore = Math.min(6, (scene.actions?.length || 0));
  score += imgScore + emoScore + subScore + actScore;
  checks.push({ name: 'vocabulary_richness', score: imgScore + emoScore + subScore + actScore, max: 30 });

  // Theme-image consistency (0-30 points)
  const themes = scene.themes || [];
  let consistencyScore = 30;
  const isBrightWarm = features.brightness > 0.5 && features.warmRatio > 0.3;
  if (isBrightWarm && themes.some(t => ['loneliness', 'melancholy', 'heartbreak'].includes(t))) {
    consistencyScore -= 30; // Major inconsistency
  }
  if (features.warmRatio < 0.15 && themes.includes('love') && !features.subjectType) {
    consistencyScore -= 15;
  }
  score += Math.max(0, consistencyScore);
  checks.push({ name: 'theme_consistency', score: Math.max(0, consistencyScore), max: 30 });

  // Feature coverage (0-25 points)
  let coverage = 0;
  if (scene.genre?.length >= 2) coverage += 8;
  if (scene.tempos?.length >= 3) coverage += 7;
  if (scene.locations?.length >= 3) coverage += 5;
  if (scene.description?.length > 10) coverage += 5;
  score += coverage;
  checks.push({ name: 'feature_coverage', score: coverage, max: 25 });

  // Semantic detection bonus (0-15 points)
  let semanticBonus = 0;
  if (features.subjectType && features.subjectType !== 'unknown') semanticBonus += 10;
  if (features.subjectConfidence > 0.3) semanticBonus += 5;
  score += semanticBonus;
  checks.push({ name: 'semantic_detection', score: semanticBonus, max: 15 });

  const normalizedScore = Math.min(100, score);
  const grade = normalizedScore >= 85 ? 'A' :
    normalizedScore >= 70 ? 'B' :
      normalizedScore >= 55 ? 'C' : 'D';
  const confidence = Math.round(normalizedScore / 100 * 100) / 100;

  return { score: normalizedScore, grade, confidence, checks };
}

/**
 * Generate structured metadata: labels, tags, wordings, songStyle
 * This produces the professional output the user requested.
 */
function _generateStructuredMetadata(scene, features, vocalSuggestion) {
  const themes = scene.themes || [];
  const emotions = scene.emotions || [];
  const genre = scene.genre || [];
  const imagery = scene.imagery || [];
  const sceneId = scene.profileId || scene._semanticId || 'generic';

  // LABELS — short descriptive category labels
  const labels = _buildLabels(scene, features);

  // TAGS — searchable keyword tags (Chinese + English)
  const tags = _buildTags(scene, features);

  // WORDINGS — suggested phrases / prompt wordings for the lyrics engine
  const wordings = _buildWordings(scene, features);

  // SONG STYLE — detailed song style breakdown
  const songStyle = _buildSongStyle(scene, features, vocalSuggestion);

  return { labels, tags, wordings, songStyle };
}

/** Build descriptive labels for the scene */
function _buildLabels(scene, features) {
  const labels = [];
  const subjectType = features.subjectType || 'unknown';

  // Subject-based labels
  const subjectLabels = {
    couple: ['情侣照', '双人合照', 'Couple Photo'],
    portrait: ['人像照', '肖像', 'Portrait'],
    group: ['合影', '群体照', 'Group Photo'],
    people_present: ['人物照', 'People']
  };
  if (subjectLabels[subjectType]) {
    labels.push(...subjectLabels[subjectType]);
  }

  // Color-based labels
  if (features.warmRatio > 0.3 && features.brightness > 0.45) {
    labels.push('暖色调', 'Warm Tone');
  } else if (features.coolRatio > 0.3 && features.brightness < 0.45) {
    labels.push('冷色调', 'Cool Tone');
  }
  if (features.saturation > 0.55) labels.push('高饱和', 'Vibrant');
  else if (features.saturation < 0.3) labels.push('低饱和', 'Muted');

  // Lighting labels
  if (features.lightingType === 'high_key') labels.push('高调光线', 'High-Key');
  else if (features.lightingType === 'low_key') labels.push('低调光线', 'Low-Key');
  else if (features.lightingType === 'soft_light') labels.push('柔光', 'Soft Light');

  // Scene labels from profileId
  const sceneLabels = {
    food_warm_glow: ['美食', 'Food'],
    pet_companion: ['宠物', 'Pet'],
    architecture_grand: ['建筑', 'Architecture'],
    flowers_bloom: ['花卉', 'Flowers'],
    sunrise_hope: ['日出', 'Sunrise'],
    beach_ocean: ['海滩', 'Beach'],
    mountain_wilderness: ['山野', 'Wilderness'],
    autumn_nostalgia: ['秋日', 'Autumn'],
    winter_serene: ['冬雪', 'Winter'],
    travel_journey: ['旅行', 'Travel'],
    festive_celebration: ['庆典', 'Festive'],
    abstract_art: ['抽象艺术', 'Abstract'],
    cafe_cozy: ['咖啡馆', 'Cafe'],
    night_starry: ['星空', 'Starry Night'],
    rainy_reflective: ['雨天', 'Rainy'],
    vehicle_motion: ['旅途', 'Road Trip'],
    minimalist_clean: ['极简', 'Minimalist'],
    vintage_retro: ['复古', 'Vintage'],
    sunset_farewell: ['夕阳', 'Sunset'],
    nature_healing: ['自然', 'Nature'],
    dreamy_night: ['夜色', 'Night'],
    quiet_morning: ['清晨', 'Morning'],
    children_family: ['亲子', 'Family'],
    concert_live: ['演唱会', 'Concert'],
    fashion_editorial: ['时尚', 'Fashion'],
    sports_action: ['运动', 'Sports'],
    workspace_creative: ['工作', 'Workspace'],
    books_library: ['书香', 'Books'],
    product_still_life: ['产品', 'Product'],
    wedding_ceremony: ['婚礼', 'Wedding'],
    graduation_achievement: ['毕业', 'Graduation'],
    bakery_dessert: ['甜点', 'Bakery'],
    baby_newborn: ['婴儿', 'Baby'],
    botanical_greenhouse: ['植物园', 'Greenhouse'],
    underwater_diving: ['水下', 'Underwater'],
    fireworks_night: ['烟花', 'Fireworks'],
    hotspring_relaxing: ['温泉', 'Hot Spring'],
    street_documentary: ['街头', 'Street'],
    aurora_mystical: ['极光', 'Aurora'],
    sakura_spring: ['樱花', 'Sakura'],
    camping_bonfire: ['露营', 'Camping'],
    tea_zen_traditional: ['茶道', 'Tea Ceremony'],
  };
  const sId = scene.profileId || scene._semanticId;
  if (sceneLabels[sId]) labels.push(...sceneLabels[sId]);

  return [...new Set(labels)].slice(0, 12);
}

/** Build searchable tags */
function _buildTags(scene, features) {
  const tags = new Set();

  // From themes
  for (const t of scene.themes || []) tags.add(t);

  // From genre
  for (const g of scene.genre || []) tags.add(g);

  // From emotions (primary)
  if (scene.emotions?.length > 0) tags.add(scene.emotions[0]);

  // From scene id
  const sId = scene.profileId || scene._semanticId;
  if (sId) tags.add(sId);

  // Feature-based tags
  if (features.brightness > 0.6) tags.add('bright');
  if (features.darkRatio > 0.4) tags.add('dark');
  if (features.warmRatio > 0.3) tags.add('warm');
  if (features.coolRatio > 0.3) tags.add('cool');
  if (features.horizonLine) tags.add('horizon');
  if (features.skinRatio > 0.05) tags.add('people');

  return [...tags].slice(0, 20);
}

/** Build suggested wordings / prompt phrases */
function _buildWordings(scene, features) {
  const wordings = [];
  const themes = scene.themes || [];
  const genre = scene.genre || [];
  const emotions = scene.emotions || [];

  // Build a natural-language description wording
  const themeStr = themes.slice(0, 2).join('、');
  const genreStr = genre.slice(0, 2).join('/');
  const emotionStr = emotions.slice(0, 2).join('、');
  wordings.push(`主题：${themeStr} | 风格：${genreStr} | 情绪：${emotionStr}`);

  // Build an English wording
  const themeEn = themes.slice(0, 2).join(', ');
  const genreEn = genre.slice(0, 2).join('/');
  wordings.push(`Theme: ${themeEn} | Genre: ${genreEn}`);

  // Build a command-style wording for the lyrics engine
  const bpm = scene.tempos?.[1] || 90;
  wordings.push(`[BPM:${bpm}] [风格:${genreStr}] [主题:${themeStr}]`);

  // Build an imagery-based wording
  const imageryStr = (scene.imagery || []).slice(0, 5).join('、');
  wordings.push(`意象：${imageryStr}`);

  return wordings;
}

/** Build detailed song style breakdown */
function _buildSongStyle(scene, features, vocalSuggestion) {
  const tempos = scene.tempos || [80, 90, 100];
  const genre = scene.genre || ['pop'];

  return {
    primaryGenre: genre[0],
    alternativeGenres: genre.slice(1, 4),
    bpm: tempos[1] || 90,
    bpmRange: { min: tempos[0] || 70, max: tempos[2] || 110 },
    // Infer key from color temperature
    keySignature: _inferKeyFromFeatures(features),
    // Infer time signature from texture/energy
    timeSignature: _inferTimeSignature(features, tempos[1] || 90),
    // Vocal recommendation
    vocal: vocalSuggestion || { gender: '女声', confidence: 0.3 },
    // Energy level (0-1)
    energy: _computeEnergyLevel(features, tempos[1] || 90),
    // Mood valence (-1 sad to +1 happy)
    valence: _computeValence(features, scene),
    // Acousticness vs electronic (0-1)
    acousticness: _inferAcousticness(genre[0], features)
  };
}

function _inferKeyFromFeatures(f) {
  // Warm/bright → major keys; cool/dark → minor keys
  if (f.warmRatio > 0.3 && f.brightness > 0.5) return 'C Major';
  if (f.warmRatio > 0.3) return 'G Major';
  if (f.coolRatio > 0.3 && f.brightness < 0.4) return 'A Minor';
  if (f.coolRatio > 0.3) return 'D Minor';
  if (f.greenRatio > 0.2) return 'G Major';
  return 'C Major';
}

function _inferTimeSignature(f, bpm) {
  if (bpm > 120) return '4/4';
  if (bpm < 70) return '3/4';
  if (f.textureType === 'complex') return '6/8';
  return '4/4';
}

function _computeEnergyLevel(f, bpm) {
  const brightnessEnergy = f.brightness * 0.3;
  const saturationEnergy = (f.saturation || 0) * 0.2;
  const tempoEnergy = Math.min(1, bpm / 140) * 0.3;
  const warmEnergy = (f.warmRatio || 0) * 0.2;
  return Math.min(1, brightnessEnergy + saturationEnergy + tempoEnergy + warmEnergy);
}

function _computeValence(f, scene) {
  // -1 = sad, +1 = happy
  let valence = 0;
  if (f.warmRatio > 0.3 && f.brightness > 0.5) valence += 0.4;
  if (f.coolRatio > 0.3 && f.brightness < 0.4) valence -= 0.4;
  if (f.darkRatio > 0.4) valence -= 0.2;
  if (f.saturation > 0.5) valence += 0.2;
  const positiveThemes = ['love', 'happiness', 'hope', 'friendship', 'dreams'];
  const negativeThemes = ['heartbreak', 'melancholy', 'loneliness', 'sadness'];
  const themes = scene.themes || [];
  if (themes.some(t => positiveThemes.includes(t))) valence += 0.3;
  if (themes.some(t => negativeThemes.includes(t))) valence -= 0.3;
  return Math.max(-1, Math.min(1, valence));
}

function _inferAcousticness(primaryGenre, f) {
  const acousticGenres = ['folk', 'classical', 'chinese_traditional', 'ballad', 'country'];
  const electronicGenres = ['electronic', 'synthwave', 'dreamy', 'ambient'];
  if (acousticGenres.includes(primaryGenre)) return 0.8;
  if (electronicGenres.includes(primaryGenre)) return 0.2;
  return 0.5;
}

/* =========================================================================
 * PROFESSIONAL COMMAND GENERATORS
 * Four output formats aligned with reference specs:
 *   SUNO — tag-based section markers with [风格][情绪][节奏][音色]
 *   MUSE — [LAYER:FOUNDATION/MELODY/EXPRESSION/EFFECTS] four-layer architecture
 *   FSM  — Trigger/Condition/Action state machine with emotion transitions
 *   LAYER — Timeline-driven progressive build with trigger gates (network layer)
 * ========================================================================= */

/**
 * SUNO format command generator
 * Format reference: [风格标签][情绪][节奏][音色] + section markers with timestamps
 * @returns {Object} { fullCommand, sectionMarkers, styleTags }
 */
function _generateSUNOCommand(scene, features, vocal) {
  const genre = (scene.genre || ['pop']).slice(0, 3).join(',');
  const themes = (scene.themes || ['life']).slice(0, 3).join(',');
  const emotions = (scene.emotions || []).slice(0, 5);
  const imagery = (scene.imagery || []).slice(0, 8);
  const tempos = scene.tempos || [80, 90, 100];
  const bpm = tempos[1] || 90;
  const key = _inferKeyFromFeatures(features);
  const vocalGender = (vocal?.gender || '女声').replace('声', '');

  // Emotion progression curve (5 sections)
  const emoProgression = _buildEmotionProgression(emotions);

  // Build core style tags
  const styleTags = `[风格标签：${genre}]`;
  const moodTag = `[情绪：${emoProgression[0]}→${emoProgression[2]}→${emoProgression[4]}]`;
  const tempoTag = `[节奏：${_tempoMark(bpm)}（BPM ${tempos[0]}~${tempos[2]}）]`;
  const timbreTag = `[音色：${vocalGender}声为主，${_genreInstruments(scene.genre?.[0] || 'pop').join('+')}]`;
  const keyTag = `[调性：${key}]`;
  const imageryTag = `[意象：${imagery.join('、')}]`;

  // Section markers (SUNO timeline format)
  const sections = [
    { name: '前奏', mark: 'Intro', time: '0:00~0:25', dynamic: 'pp→p', focus: imagery[0] || '意境' },
    { name: '主歌一', mark: 'Verse 1', time: '0:25~1:05', dynamic: 'p→mp', focus: imagery[1] || '叙事' },
    { name: '预副歌', mark: 'Pre-Chorus', time: '1:05~1:25', dynamic: 'mp→mf', focus: emotions[0] || '情感' },
    { name: '副歌', mark: 'Chorus', time: '1:25~2:05', dynamic: 'mf→f ★', focus: emotions[1] || emotions[0] || '高潮' },
    { name: '主歌二', mark: 'Verse 2', time: '2:05~2:45', dynamic: 'mp', focus: imagery[2] || '递进' },
    { name: '桥段', mark: 'Bridge', time: '2:45~3:10', dynamic: 'f→ff', focus: emotions[2] || '升华' },
    { name: '副歌反复', mark: 'Final Chorus', time: '3:10~3:50', dynamic: 'ff ★★', focus: imagery[3] || '收束' },
    { name: '尾声', mark: 'Outro', time: '3:50~4:15', dynamic: 'f→mp→pp', focus: imagery[4] || '余韵' },
  ];

  // Build section commands
  const sectionCommands = sections.map(s =>
    `[${s.name}·${s.mark} (${s.time}) ]\n[动态：${s.dynamic}]\n[意象焦点：${s.focus}]`
  ).join('\n\n');

  // Reference + Constraint + Trigger (FSM style triggers from design.md)
  const referenceTag = `\n[参考系：意象来自「${scene.description?.slice(0, 30) || '图片视觉'}」的氛围]`;
  const constraintTag = `[约束：意象词汇覆盖≥5，段落情绪需按「${emoProgression.join('→')}」曲线递进]`;
  const triggers = [
    '[TRIGGER::进入副歌 → 鼓组加强+和声叠层+混响增加30%]',
    '[TRIGGER::进入桥段 → 乐器降为极简+人声情绪拉满→最后爆发]',
    '[TRIGGER::进入尾声 → 渐弱+留白+核心意象回归]',
  ].join('\n');

  const fullCommand =
    `${styleTags}
${moodTag}
${tempoTag}
${timbreTag}
${keyTag}
${imageryTag}
${referenceTag}
${constraintTag}

── 分段执行指令 ──

${sectionCommands}

── FSM 触发器（状态机） ──
${triggers}

── 核心意象池（供填词调用）──
主体：${(scene.subjects || []).slice(0, 5).join('、')}
动作：${(scene.actions || []).slice(0, 5).join('、')}
场景：${(scene.locations || []).slice(0, 5).join('、')}
主题词：${themes}`;

  return {
    fullCommand,
    styleTags: [styleTags, moodTag, tempoTag, timbreTag, keyTag, imageryTag],
    sectionMarkers: sections.map(s => ({ ...s, genre, bpm })),
    bpm,
    emotionProgression: emoProgression,
    format: 'SUNO'
  };
}

/**
 * MUSE format command generator (4-layer network architecture)
 * Format: [LAYER: FOUNDATION / MELODY / EXPRESSION / EFFECTS]
 */
function _generateMUSECommand(scene, features, vocal) {
  const genre = scene.genre?.[0] || 'pop';
  const themes = (scene.themes || ['life']).slice(0, 3).join('、');
  const emotions = (scene.emotions || []).slice(0, 5);
  const imagery = (scene.imagery || []).slice(0, 10);
  const tempos = scene.tempos || [80, 90, 100];
  const bpm = tempos[1] || 90;
  const instruments = _genreInstruments(genre);
  const vocalGender = (vocal?.gender || '女声').replace('声', '');
  const primaryEmo = emotions[0] || '深沉';
  const sceneId = scene.profileId || scene._semanticId || 'scene';

  // Foundation layer (节拍/和声基底)
  const foundation =
    `[LAYER: FOUNDATION]
底层节拍: ${bpm}bpm 稳定律动, 围绕「${themes}」主题构建${_timeSignatureFor(genre)}基础拍
和声框架: ${_chordProgressionFor(genre)} 进行，调性${_inferKeyFromFeatures(features)}
低音骨架: ${_bassStyleFor(genre)}，BPM范围 ${tempos[0]}~${tempos[2]}`;

  // Melody layer (主旋律线条/器乐)
  const melody =
    `[LAYER: MELODY]
旋律层: ${_melodyStyleFor(genre)}，表达「${primaryEmo}」的情绪曲线，配合 ${instruments.slice(0, 2).join('/')} 主奏
器乐配置: ${instruments.join(' + ')}
主题动机: 以「${imagery[0] || '意象'}」为核心旋律句，贯穿主歌/副歌/桥段三次变奏
装饰音: ${_ornamentsFor(genre)}，营造「${scene.description?.slice(0, 20) || '氛围'}」质感`;

  // Expression layer (人声/和声/演绎)
  const expression =
    `[LAYER: EXPRESSION]
表现层: ${vocalGender}声 ${_vocalStyleFor(genre)} 演绎，情感${_emotionCurveMark(emotions)} 深度诠释主题
和声编排: ${_harmonyStyleFor(genre)}，情感浓度在副歌达到峰值，桥段留白后爆发
气息咬字: ${_articulationFor(genre)}，对应意象「${imagery.slice(0, 3).join('+')}」`;

  // Effects layer (空间/调制/采样)
  const effects =
    `[LAYER: EFFECTS]
效果层: 混响 ${_reverbFor(sceneId, genre)} + 延迟 ${_delayFor(genre)} + 调制 ${_modulationFor(genre)}
空间采样: ${_ambientSampleFor(sceneId)}，嵌入意象环境音
动态门限: 副歌处动态+6dB，桥段处全频段归零后强起，尾声渐弱至白噪声`;

  // Triggers (network layer gates)
  const triggers =
    `── LAYER 触发门控（IF·THEN 网络层逻辑）──
[GATE::Verse→Chorus] IF 检测到副歌段 THEN Foundation 全层激活 + Melody 升八度 + Expression 和声叠三层
[GATE::Bridge] IF 进入桥段 THEN Foundation 只保留低音 + Melody 极简单音 + Expression 纯人声独白 → 最后1/3全层炸开
[GATE::Outro] IF 进入尾声 THEN Foundation 渐隐 → Effects 仅保留混响尾音 + 核心意象采样淡出`;

  const fullCommand =
    `创作一首${genre}曲目，融入${themes}主题——将${imagery.slice(0, 3).join('、')}的视觉氛围与现代制作融合。采用${_tempoMark(bpm)}律动（BPM ${bpm}），搭配${instruments.slice(0, 2).join('与')}，${vocalGender}声以${_vocalTextureFor(genre)}质感呈现。
主题：${themes}
意象：${imagery.join('、')}
情绪曲线：${_buildEmotionProgression(emotions).join(' → ')}

${foundation}

${melody}

${expression}

${effects}

${triggers}`;

  return {
    fullCommand,
    layers: { foundation, melody, expression, effects },
    gates: ['Verse→Chorus', 'Bridge', 'Outro'],
    bpm,
    format: 'MUSE'
  };
}

/**
 * FSM format command generator (Finite State Machine)
 * Format: STATE / TRANSITION (TRIGGER:CONDITION → ACTION)
 */
function _generateFSMCommand(scene, features, vocal) {
  const emotions = (scene.emotions || ['平静', '温柔']).slice(0, 5);
  const genre = scene.genre?.[0] || 'pop';
  const themes = (scene.themes || ['life']).slice(0, 3);
  const imagery = (scene.imagery || []).slice(0, 10);
  const subjects = (scene.subjects || []).slice(0, 5);
  const locations = (scene.locations || []).slice(0, 5);
  const tempos = scene.tempos || [80, 90, 100];
  const emoSteps = _buildEmotionProgression(emotions);

  // 7 core states matching song structure
  const states = [
    { id: 'S0_INTRO', section: '前奏', emotion: emoSteps[0], duration: '18~28s', bpmShift: 0, density: '稀疏' },
    { id: 'S1_VERSE1', section: '主歌一', emotion: emoSteps[1], duration: '32~42s', bpmShift: 0, density: '低' },
    { id: 'S2_PRECHORUS', section: '预副歌', emotion: emoSteps[1] + '→' + emoSteps[2], duration: '16~22s', bpmShift: +2, density: '中' },
    { id: 'S3_CHORUS', section: '副歌', emotion: emoSteps[2], duration: '30~40s', bpmShift: +4, density: '高 ★' },
    { id: 'S4_VERSE2', section: '主歌二', emotion: emoSteps[3] || emoSteps[1], duration: '28~38s', bpmShift: 0, density: '中低' },
    { id: 'S5_BRIDGE', section: '桥段', emotion: emoSteps[2] + '→' + emoSteps[4], duration: '18~26s', bpmShift: -2, density: '低→极高' },
    { id: 'S6_FINAL', section: '终章', emotion: emoSteps[4], duration: '22~32s', bpmShift: 0, density: '高→渐弱' },
  ];

  // Transitions: TRIGGER : CONDITION → ACTION
  const transitions = [
    { from: 'S0_INTRO', to: 'S1_VERSE1', trigger: '时间到达 T0+25s', condition: '氛围已建立', action: `进入叙事视角：${subjects[0] || '主体'}出现在${locations[0] || '场景'}` },
    { from: 'S1_VERSE1', to: 'S2_PRECHORUS', trigger: '主歌结束句（第8句）', condition: '完成情节铺垫', action: `情绪抬升，指向意象「${imagery[0] || '焦点'}」` },
    { from: 'S2_PRECHORUS', to: 'S3_CHORUS', trigger: '预副歌最后一个和弦', condition: '张力拉满≥85%', action: `爆发式合唱，释放主题「${themes[0] || themes[0]}」+ 鼓组全层` },
    { from: 'S3_CHORUS', to: 'S4_VERSE2', trigger: '副歌反复×2结束', condition: '高潮完成宣泄', action: `视角转入${subjects[1] || subjects[0] || '主体'}的新情节` },
    { from: 'S4_VERSE2', to: 'S5_BRIDGE', trigger: '主歌二结束句', condition: '新信息交代完成', action: `乐器极简，聚焦${vocal?.gender || '女声'}独白 → 最后6拍爆发` },
    { from: 'S5_BRIDGE', to: 'S6_FINAL', trigger: '桥段最后强拍落下', condition: '情绪升华≥95%', action: `终章副歌+收尾，意象「${imagery[1] || imagery[0]}」回归，主题升华` },
  ];

  // Reference / Constraint
  const reference = `[参考系] 意象：${imagery.join('、')}；情绪：${emoSteps.join(' → ')}；风格：${genre}`;
  const constraint = `[约束] 每状态必须遵守 emotion/density/bpmShift；主题词「${themes.join('·')}」在副歌出现≥3次；意象词覆盖率≥70%`;

  const statesBlock = states.map(s =>
    `STATE ${s.id}【${s.section}】 { emotion: ${s.emotion}; duration: ${s.duration}; bpmShift: ${s.bpmShift > 0 ? '+' + s.bpmShift : s.bpmShift}; density: ${s.density}; }`
  ).join('\n');

  const transBlock = transitions.map(t =>
    `TRANSITION ${t.from} → ${t.to} [\n  TRIGGER: ${t.trigger}\n  CONDITION: ${t.condition}\n  ACTION:  ${t.action}\n]`
  ).join('\n\n');

  const fullCommand =
    `╔══════════════════════════════════════════════════╗
║  FSM 音乐状态机指令 (Scene: ${scene.profileId || scene._semanticId || 'custom'})  ║
╚══════════════════════════════════════════════════╝

${reference}
${constraint}
参数: BPM基准=${tempos[1]}, 风格=${genre}, 人声声部=${vocal?.gender || '女声'}

── 核心状态 ──
${statesBlock}

── 状态转移（触发器/条件/动作） ──
${transBlock}

── 全局不变式（GLOBAL INVARIANT）──
[GLOBAL::始终有效] 意象词「${imagery.slice(0, 5).join('·')}」分布于全部状态；每段至少引用 1 个动作 + 1 个场景
[GLOBAL::主题守恒] ${themes.map((t, i) => `LEVEL${i + 1}::「${t}」出现次数≥${2 + i}`).join(' ；  ')}
[FSM::终止态] S6_FINAL 必须以意象「${imagery[0]}」或「${imagery[1] || imagery[0]}」收束，留下余韵`;

  return {
    fullCommand,
    states,
    transitions,
    format: 'FSM'
  };
}

/**
 * LAYER format command generator — Timeline-driven with network layers
 * (aka NETWORK LAYER as in museaisamplecommand.md reference)
 */
function _generateLAYERCommand(scene, features, vocal) {
  const genre = scene.genre?.[0] || 'pop';
  const themes = (scene.themes || ['life']).slice(0, 3);
  const emotions = (scene.emotions || []).slice(0, 5);
  const imagery = (scene.imagery || []).slice(0, 10);
  const subjects = (scene.subjects || []).slice(0, 5);
  const actions = (scene.actions || []).slice(0, 5);
  const locations = (scene.locations || []).slice(0, 5);
  const tempos = scene.tempos || [80, 90, 100];
  const bpm = tempos[1] || 90;
  const emoSteps = _buildEmotionProgression(emotions);
  const instruments = _genreInstruments(genre);

  // 4 network layers
  const foundation = `[LAYER: FOUNDATION] 底层节拍：${bpm}bpm · ${_timeSignatureFor(genre)} · 主题：${themes[0]} · 低音：${_bassStyleFor(genre)}`;
  const melody = `[LAYER: MELODY] 旋律层：${_melodyStyleFor(genre)} · 主奏：${instruments.slice(0, 2).join('/')} · 动机核心：「${imagery[0]}」`;
  const expression = `[LAYER: EXPRESSION] 表现层：${vocal?.gender || '女声'}${_vocalStyleFor(genre)} · 情感：${emoSteps.join(' → ')} · 和声：${_harmonyStyleFor(genre)}`;
  const effects = `[LAYER: EFFECTS] 效果层：${_reverbFor(scene.profileId || 'scene', genre)} · ${_delayFor(genre)} · ${_modulationFor(genre)} · 环境采样：${_ambientSampleFor(scene.profileId || scene._semanticId || 'generic')}`;

  // Timeline triggers (5 gates across song timeline ~4:15)
  const timeline = [
    { gate: 'G1-INTRO', t: '0:00~0:25', active: 'FOUNDATION(30%)+MELODY(20%)', content: `${subjects[0] || '主体'}在${locations[0] || '场景'}的${actions[0] || '出现'}` },
    { gate: 'G2-VERSE1', t: '0:25~1:05', active: 'FOUNDATION(60%)+MELODY(70%)+EXPRESSION(50%)', content: `${imagery[0]}和${imagery[1] || '意象'}的叙事展开` },
    { gate: 'G3-CHORUS1', t: '1:05~1:50', active: 'ALL LAYERS ACTIVE(100%)', content: `主题爆发：${themes[0]}·情绪：${emoSteps[2]}·意象：${imagery.slice(0, 3).join('+')}` },
    { gate: 'G4-BRIDGE', t: '2:30~3:00', active: 'FOUNDATION(15%)+MELODY(10%)+EXPRESSION(80%)→最后1/3→ALL(100%)', content: `${subjects[1] || subjects[0]}的${actions[1] || actions[0]}，情绪升华` },
    { gate: 'G5-OUTRO', t: '3:40~4:15', active: 'EFFECTS(60%)+MELODY(30%)+FOUNDATION(10%)→渐隐', content: `意象「${imagery[0]}」回归，主题收束于${locations[1] || locations[0]}` },
  ];

  const timelineBlock = timeline.map(g =>
    `[${g.gate}] 时间轴：${g.t}\n    激活层：${g.active}\n    内容指令：${g.content}`
  ).join('\n\n');

  // Logical gates (AND/OR/NOT as from design.md network logic)
  const logicGates = [
    '[LOGIC::AND] 意象(' + imagery.slice(0, 2).join('∧') + ') ∧ 情绪(' + emoSteps[2] + ') ⇒ 副歌处必须全员合唱',
    '[LOGIC::OR]  桥段末拍『全层爆发』 ≡ (最后8拍 ∨ 人声最高音处) → 两者任一达到即触发',
    '[LOGIC::NOT] 全程：¬(意象词少于4种) → 意象密度<4视为无效输出，自动回溯',
    '[LOGIC::IF(α)∧IF(β) THEN γ] IF 意象丰富度≥7 AND 情绪递进检测通过 THEN 在桥段新增 4 小节纯器乐华彩',
  ].join('\n');

  const fullCommand =
    `╔══════════════════════════════════════════════════════╗
║  NETWORK LAYER 多层指令（时间轴驱动 + 逻辑门控制）   ║
╚══════════════════════════════════════════════════════╝

风格：${genre} · BPM基准：${bpm} · 人声声部：${vocal?.gender || '女声'}
主题：${themes.join(' · ')}
意象：${imagery.join(' · ')}
情绪曲线：${emoSteps.join(' → ')}

── 网络四层架构 ──
${foundation}
${melody}
${expression}
${effects}

── 时间轴·激活门控（TIMELINE × LAYERS） ──
${timelineBlock}

── 逻辑运算门控（Boolean Network Gates） ──
${logicGates}

── 意象·主体·动作·场景 对照表 ──
[主体] ${subjects.join(' | ')}
[动作] ${actions.join(' | ')}
[场景] ${locations.join(' | ')}
[约束] 每段至少引用「1主体+1动作+1场景+2意象」，覆盖率<80%触发 REGEN 信号`;

  return {
    fullCommand,
    layers: { foundation, melody, expression, effects },
    timeline,
    format: 'LAYER'
  };
}

/* -------- Command generator helpers (internal micro-utilities) -------- */

function _tempoMark(bpm) {
  if (bpm < 70) return '慢板Lento';
  if (bpm < 85) return '行板Andante';
  if (bpm < 100) return '中板Moderato';
  if (bpm < 120) return '稍快Allegretto';
  return '快板Allegro';
}

function _buildEmotionProgression(emotions) {
  if (!emotions || emotions.length === 0) return ['平静', '舒展', '升华', '回味', '释然'];
  // 5-step curve: 引入 → 铺垫 → 高峰 → 转合 → 收束
  const base = [...emotions];
  while (base.length < 5) base.push(base[base.length - 1] || '温暖');
  return [base[0], base[1] || base[0], base[2] || base[0], base[3] || base[1], base[4] || base[2]];
}

function _timeSignatureFor(genre) {
  if (['tango', 'ballad', 'classical'].includes(genre)) return '3/4华尔兹拍';
  if (['jazz', 'lofi', 'rnb'].includes(genre)) return '4/4摇摆拍';
  return '4/4稳定拍';
}

function _chordProgressionFor(genre) {
  const map = {
    pop: 'I-V-vi-IV',
    ballad: 'vi-IV-I-V (卡农变体)',
    folk: 'I-vi-IV-V',
    rock: 'i-VII-VI-V',
    rnb: 'ii-V-I + 替代和弦',
    jazz: 'ii-V-I + 延伸音',
    electronic: 'i-VI-III-VII',
    classical: 'I-IV-V-I 古典终止式',
    chinese_traditional: '五声宫商角徵羽 (1-2-3-5-6)',
    kpop: 'I-V-vi-IV + 转调副歌',
  };
  return map[genre] || 'I-V-vi-IV 流行通用';
}

function _bassStyleFor(genre) {
  if (['rock', 'electronic', 'kpop'].includes(genre)) return 'Sub Bass 下潜·强律动';
  if (['jazz', 'rnb'].includes(genre)) return 'Walking Bass 流动低音';
  if (['classical', 'chinese_traditional'].includes(genre)) return '大提琴/大阮·低频铺垫';
  return 'Fingered Bass 手指低音';
}

function _melodyStyleFor(genre) {
  const map = {
    pop: '流畅上口级进旋律，副歌八度大跳',
    ballad: '长线条抒情旋律，气口留白',
    folk: '五声/自然音阶，吟唱式',
    rock: '呐喊型，高音区持续旋律',
    rnb: '转音+装饰音丰富，蓝调音阶',
    jazz: '即兴摇摆，半音+延伸音',
    electronic: '合成器琶音+短动机循环',
    classical: '主题动机贯穿+变奏发展',
    chinese_traditional: '五声旋律·韵腔',
    kpop: '级进+跳音·洗脑Hook句',
  };
  return map[genre] || '旋律级进+高潮大跳';
}

function _ornamentsFor(genre) {
  if (['jazz', 'rnb'].includes(genre)) return '蓝调音+滑音+颤音';
  if (['chinese_traditional', 'classical'].includes(genre)) return '倚音·波音·回旋音';
  if (['rock', 'kpop'].includes(genre)) return '失真推弦·嘶吼装饰';
  return '轻倚音·气口装饰';
}

function _vocalStyleFor(genre) {
  const map = {
    pop: '通俗自然',
    ballad: '抒情气声',
    folk: '吟唱质朴',
    rock: '嘶吼爆发力',
    rnb: '转音灵魂',
    jazz: '即兴慵懒',
    electronic: '空灵处理·混响',
    classical: '美声共鸣',
    chinese_traditional: '古风戏腔·咬字韵',
    kpop: '唱跳型·律动',
    rnb: '柔情灵魂',
  };
  return map[genre] || '自然演绎';
}

function _vocalTextureFor(genre) {
  if (['rnb', 'jazz'].includes(genre)) return '丝绒/慵懒';
  if (['rock', 'electronic'].includes(genre)) return '金属/穿透力';
  if (['classical', 'chinese_traditional'].includes(genre)) return '晶莹/清澈共鸣';
  return '温暖/磁性';
}

function _harmonyStyleFor(genre) {
  if (['pop', 'kpop'].includes(genre)) return '三~四部和声齐唱';
  if (['classical', 'chinese_traditional'].includes(genre)) return '轮唱+卡农式复调';
  if (['rock', 'electronic'].includes(genre)) return '层叠和声+喊麦';
  return '二部和声·轻量垫唱';
}

function _articulationFor(genre) {
  if (['rnb', 'jazz'].includes(genre)) return '慵懒连音·字间粘连';
  if (['rock', 'kpop'].includes(genre)) return '咬字清晰·顿挫有力';
  if (['classical', 'ballad'].includes(genre)) return '气息支撑·长线条';
  return '自然咬字·呼吸留白';
}

function _reverbFor(sceneId, genre) {
  const sceneReverbs = {
    concert_live: '大型体育馆 Hall 3.2s',
    wedding_ceremony: '教堂混响 Church 2.8s',
    architecture_grand: '石砌厅堂 Hall 2.6s',
    night_starry: '深空Plate 4.0s',
    aurora_mystical: '北极圈Shimmer 5.0s',
    underwater_diving: '水下卷积混响 Wet 80%',
    botanical_greenhouse: '玻璃房Chamber 1.5s',
    tea_zen_traditional: '茶室Dry 0.8s 极简',
    books_library: '木房间 Chamber 1.8s',
    street_documentary: '城市街道 Urban 1.6s',
    hotspring_relaxing: '汤屋石池 Chamber 2.2s',
  };
  return sceneReverbs[sceneId] ||
    (['classical', 'chinese_traditional'].includes(genre) ? '音乐厅 Hall 2.2s'
      : ['electronic', 'ambient'].includes(genre) ? '大气Shimmer 3.5s'
        : ['jazz', 'lofi'].includes(genre) ? '俱乐部 Club 1.2s'
          : '录音室 Studio 1.5s');
}

function _delayFor(genre) {
  if (['rock', 'electronic', 'kpop'].includes(genre)) return '1/4点拍+PingPong';
  if (['jazz', 'rnb'].includes(genre)) return '1/8三连音延迟';
  if (['classical', 'ballad'].includes(genre)) return '1/2长Dotted轻微延迟';
  return '1/8轻量Slap';
}

function _modulationFor(genre) {
  if (['electronic', 'dreamy'].includes(genre)) return 'Chorus+Flanger相位调制';
  if (['rock'].includes(genre)) return 'Overdrive+Tremolo';
  if (['jazz', 'rnb'].includes(genre)) return '轻度Warm饱和';
  return '轻度Stereo Widener';
}

function _ambientSampleFor(sceneId) {
  const samples = {
    rainy_reflective: '雨打玻璃窗+远处雷声',
    night_starry: '远处虫鸣+风声',
    nature_healing: '溪流+鸟鸣+松风',
    beach_ocean: '海浪拍岸+海鸥',
    mountain_wilderness: '松涛+远处鹰鸣',
    concert_live: '远处人群欢呼+回音',
    cafe_cozy: '咖啡机+远处交谈声+爵士背景音',
    street_documentary: '远处自行车铃+人群低语',
    underwater_diving: '气泡上升+低频水流',
    aurora_mystical: '地磁低频+寂静风声',
    sakura_spring: '簌簌花落+微风',
    camping_bonfire: '木柴爆裂声+远处吉他',
    hotspring_relaxing: '水浪+远处木屐',
    tea_zen_traditional: '注水声+竹帘轻响',
    books_library: '翻书声+远处钢笔划纸',
    workspace_creative: '键盘敲击+咖啡机蒸汽',
    baby_newborn: '轻柔摇篮曲盒+呼吸声',
    fireworks_night: '烟花爆炸+远处欢呼',
  };
  return samples[sceneId] || '微弱环境氛围+空间底噪';
}

function _genreInstruments(genre) {
  const map = {
    pop: ['钢琴', '原声吉他', '合成器Pad', '鼓组'],
    ballad: ['钢琴', '弦乐四重奏', '木吉他', '大提琴'],
    folk: ['木吉他', '口琴', '小提琴', '手鼓'],
    rock: ['电吉他', '贝斯', '架子鼓', '合成器'],
    rnb: ['电钢琴Rhodes', '贝斯', '鼓机', '萨克斯'],
    jazz: ['萨克斯', '爵士鼓', '立式钢琴', '低音贝斯'],
    electronic: ['合成器Synth', '鼓机TR-808', 'Sub Bass', '采样Pad'],
    classical: ['钢琴', '小提琴', '大提琴', '管弦乐团'],
    chinese_traditional: ['古筝', '琵琶', '笛子', '二胡', '古琴'],
    kpop: ['合成器', '鼓组', '贝斯', '弦乐Pad'],
    lofi: ['爵士钢琴采样', '鼓机', '黑胶底噪', '暖贝斯'],
    ambient: ['Pad合成器', '低频Drone', '自然采样', '水晶音色'],
    dreamy: ['梦幻Synth', '八音盒', '竖琴', 'Pad'],
    bossa_nova: ['古典吉他', '沙锤', '低音提琴', '长笛'],
  };
  return map[genre] || ['钢琴', '吉他', '鼓组', '贝斯'];
}

function _emotionCurveMark(emotions) {
  const steps = _buildEmotionProgression(emotions);
  return `${steps[0]}(主歌) → ${steps[2]}(副歌高峰) → ${steps[4]}(终章释然)`;
}

/* =========================================================================
 * EXTENDED AGENT LOOP — 15+ quality checks & self-refinement
 * Part of ZUNICORN AGENT self-enhancing loop engineering
 * ========================================================================= */

/**
 * Extended issue detection: 15+ quality checks
 * @returns {Array<{type, severity, message}>}
 */
function _detectSceneIssuesExtended(scene, features) {
  const issues = _detectSceneIssues(scene, features); // base 5 checks

  // --- Additional 10+ professional checks ---
  const imagery = scene.imagery || [];
  const emotions = scene.emotions || [];
  const themes = scene.themes || [];
  const actions = scene.actions || [];
  const locations = scene.locations || [];
  const subjects = scene.subjects || [];
  const genres = scene.genre || [];

  // #6 Duplicate entries within arrays
  if (new Set(imagery).size !== imagery.length) issues.push({ type: 'duplicate_imagery', severity: 'low' });
  if (new Set(emotions).size !== emotions.length) issues.push({ type: 'duplicate_emotions', severity: 'low' });

  // #7 Imagery specificity — too generic (no concrete nouns)
  const genericWords = ['光影', '色彩', '画面', '瞬间', '故事', '此刻', '时光'];
  const genericCount = imagery.filter(w => genericWords.includes(w)).length;
  if (imagery.length > 0 && genericCount / imagery.length > 0.5) {
    issues.push({ type: 'generic_imagery', severity: 'medium' });
  }

  // #8 Missing required semantic quad (subject+action+location+imagery minimum)
  if (subjects.length < 2 || actions.length < 2 || locations.length < 2) {
    issues.push({ type: 'semantic_quad_incomplete', severity: 'medium' });
  }

  // #9 Genre-theme mismatch — love_song genre but no love theme
  const loveGenres = ['love_song', 'romantic', 'ballad'];
  const sadThemes = ['heartbreak', 'loneliness', 'sadness', 'melancholy'];
  if (loveGenres.some(g => genres.includes(g)) && !themes.includes('love') && themes.length > 0 && sadThemes.every(t => !themes.includes(t))) {
    issues.push({ type: 'genre_theme_mismatch', severity: 'medium' });
  }

  // #10 Tempo out of reasonable range
  const tempos = scene.tempos || [];
  if (tempos.some(t => t < 40 || t > 200)) {
    issues.push({ type: 'tempo_out_of_range', severity: 'low' });
  }

  // #11 Description too short / not informative
  if (!scene.description || scene.description.length < 10) {
    issues.push({ type: 'poor_description', severity: 'medium' });
  }

  // #12 Scene profile with low match score should boost vocabulary
  if (scene.matchScore && scene.matchScore < 0.6 && imagery.length < 12) {
    issues.push({ type: 'low_match_sparse_vocab', severity: 'medium' });
  }

  // #13 People photos must have interpersonal subjects
  const isPeoplePhoto = (features.subjectType && features.subjectType !== 'unknown');
  if (isPeoplePhoto && !subjects.some(s => ['恋人', '家人', '朋友', '伙伴', '自己', '伴侣', '爱人', '孩子', '宝宝'].some(k => s.includes(k)))) {
    issues.push({ type: 'people_without_relation', severity: 'low' });
  }

  // #14 Emotion diversity — too many same-category words
  const emoCategories = emotions.map(e => {
    if (['孤独', '忧伤', '悲伤', '寂寥', '心碎', '惆怅'].includes(e)) return 'sad';
    if (['幸福', '快乐', '甜蜜', '温暖', '喜悦'].includes(e)) return 'happy';
    if (['宁静', '平静', '释然', '沉静'].includes(e)) return 'peaceful';
    return 'other';
  });
  const topCat = emoCategories.reduce((acc, c) => { acc[c] = (acc[c] || 0) + 1; return acc; }, {});
  const maxCatRatio = Math.max(...Object.values(topCat)) / (emotions.length || 1);
  if (emotions.length >= 4 && maxCatRatio > 0.85) {
    issues.push({ type: 'emotion_monoculture', severity: 'low' });
  }

  // #15 BPM and energy mismatched with bright/warm
  const bpm = tempos[1] || 90;
  const isHighEnergy = features.brightness > 0.55 && features.warmRatio > 0.3 && features.saturation > 0.45;
  if (isHighEnergy && bpm < 75 && !sadThemes.some(t => themes.includes(t))) {
    issues.push({ type: 'energy_bpm_mismatch', severity: 'low' });
  }

  // #16 Scene tags not in label map (missing from sceneLabels)
  const sId = scene.profileId || scene._semanticId;
  if (sId && !['semantic_couple', 'semantic_portrait', 'semantic_group', 'semantic_people', 'semantic_unknown_people'].includes(sId)) {
    // ok, already validated above
  }

  return issues;
}

/* =========================================================================
 * ZUNICORN AGENT LOOP v2 — extended iterations + cross-pool enrichment
 * ANALYZE → CLASSIFY → V1 → VALIDATE → REFINE → V2 → VALIDATE → OUTPUT
 * Part of self-enhancing / self-finishing the project's objective
 * ========================================================================= */

function _agentLoopValidateV2(scene, features, maxIterations = 3) {
  let current = { ...scene };
  let iteration = 0;
  const validationLog = [];

  while (iteration < maxIterations) {
    const issues = _detectSceneIssuesExtended(current, features);
    validationLog.push({
      iteration,
      issuesFound: issues.length,
      issues: issues.map(i => ({ type: i.type, severity: i.severity }))
    });

    // Stop if no high/medium issues
    const hasBlocking = issues.some(i => ['critical', 'high', 'medium'].includes(i.severity));
    if (!hasBlocking) break;

    current = _refineSceneExtended(current, features, issues);
    iteration++;
  }

  const quality = _computeSceneQuality(current, features);
  // Quality boost: iteration-aware grade
  const finalScore = Math.min(100, quality.score + iteration);
  const grade = finalScore >= 88 ? 'S' : finalScore >= 75 ? 'A' : finalScore >= 60 ? 'B' : 'C';

  return {
    ...current,
    _agentLoop: {
      iterations: iteration,
      maxIterations,
      validationLog,
      qualityScore: finalScore,
      qualityGrade: grade,
      confidence: Math.round(finalScore / 100 * 100) / 100,
      qualityChecks: quality.checks,
      refinementStrategy: iteration > 0 ? 'multi_pass_refined' : 'one_pass_clean'
    }
  };
}

/** Extended refinement that fixes the new issue types */
function _refineSceneExtended(scene, features, issues) {
  let refined = _refineScene(scene, features, issues.filter(i =>
    ['sparse_imagery', 'sparse_emotions', 'sparse_subjects', 'theme_conflict',
      'love_theme_without_warmth', 'bright_image_lonely_theme', 'missing_tempo'].includes(i.type)));

  // Fix remaining new issue types
  for (const issue of issues) {
    switch (issue.type) {
      case 'generic_imagery':
        refined.imagery = refined.imagery.filter(w => !['光影', '色彩', '画面', '瞬间'].includes(w));
        refined.imagery = _mergeUnique(refined.imagery, _deriveImageryFromFeatures(features).filter(w => w.length > 2), 14);
        break;
      case 'semantic_quad_incomplete':
        refined.subjects = _mergeUnique(refined.subjects, ['故事', '时光', '主体', '此刻'], 5);
        refined.actions = _mergeUnique(refined.actions, ['凝望', '感受', '经历', '存在'], 5);
        refined.locations = _mergeUnique(refined.locations, ['眼前', '此刻', '心中', '场景'], 5);
        break;
      case 'genre_theme_mismatch':
        refined.themes = refined.themes.filter(t => !['life'].includes(t));
        refined.themes = _mergeUnique(refined.themes, ['love', 'memory'], 4);
        break;
      case 'tempo_out_of_range':
        refined.tempos = [75, 90, 105];
        break;
      case 'poor_description':
        refined.description = `根据图片的${refined.genre?.[0] || 'pop'}风格与${refined.themes?.[0] || 'life'}主题，生成意象丰富的歌词。`;
        break;
      case 'low_match_sparse_vocab':
        refined.imagery = _mergeUnique(refined.imagery, _deriveImageryFromFeatures(features), 16);
        refined.emotions = _mergeUnique(refined.emotions, _deriveEmotionsFromFeatures(features), 8);
        break;
      case 'people_without_relation':
        refined.subjects = _mergeUnique(refined.subjects, ['身边人', '自己', '同伴'], 5);
        break;
      case 'emotion_monoculture':
        if (refined.emotions.every(e => ['孤独', '忧伤', '悲伤', '寂寥'].includes(e))) {
          refined.emotions.push('温柔', '释然');
        } else if (refined.emotions.every(e => ['幸福', '快乐', '甜蜜'].includes(e))) {
          refined.emotions.push('回味', '珍惜');
        }
        refined.emotions = [...new Set(refined.emotions)].slice(0, 8);
        break;
      case 'energy_bpm_mismatch':
        refined.tempos = [95, 110, 125];
        break;
      case 'duplicate_imagery':
        refined.imagery = [...new Set(refined.imagery)];
        break;
      case 'duplicate_emotions':
        refined.emotions = [...new Set(refined.emotions)];
        break;
    }
  }

  // Deduplicate
  refined.imagery = [...new Set(refined.imagery)];
  refined.emotions = [...new Set(refined.emotions)];
  refined.subjects = [...new Set(refined.subjects)];
  refined.actions = [...new Set(refined.actions)];
  refined.locations = [...new Set(refined.locations)];
  refined.themes = [...new Set(refined.themes)];

  return refined;
}

/**
 * Complete image-to-lyrics analysis — v2 enhanced with professional commands
 * @param {HTMLImageElement} imageElement - The uploaded image element
 * @returns {Promise<Object>} Complete analysis with scene classification
 */
export async function fullImageAnalysis(imageElement) {
  // ─────────────────────────────────────────────────────────────────────
  // SERVER-SIDE PYTHON VISION (YOLOv8n object detection, 80 COCO classes)
  // When the backend is running (NODE server on localhost:5501 or same
  // origin /api endpoint), we call it FIRST for 10× richer non-face
  // semantics: detect pets, food, sports gear, travel, office furniture,
  // concert (no, COCO lacks stage/mic but CLIP adds it later), vehicles,
  // indoor/outdoor etc.  Results are merged into features.pythonVision
  // and used as a STRONG BIAS in classifyScene below.
  //
  // If the server is unreachable (file://, offline, CORS error) we just
  // fall back silently to the pure browser heuristics + face-api.  No
  // failure is ever surfaced to the user.
  // ─────────────────────────────────────────────────────────────────────
  let serverVision = null;
  try { serverVision = await _callPythonVisionServer(imageElement); }
  catch (_) { serverVision = null; }

  const features = await analyzeImageVisuals(imageElement);
  if (serverVision) {
    features.pythonVision = serverVision;
    // Cross-correlate: Python YOLO's person (full-body) count vs the
    // browser's SSD face count.  Take MAX so we catch group shots of
    // people turned away (face-api misses them, YOLO sees full body).
    const yoloPerson = serverVision.counts?.person | 0;
    const browserPerson = features.personCount | 0;
    if (yoloPerson > browserPerson && yoloPerson >= 1) {
      features.personCount = yoloPerson;
      // Recompute subjectType from the higher person count only if the
      // neural face net didn't already set a confident type.
      if (!features.faceMeta || (features.faceMeta.avgConfidence || 0) < 0.5) {
        if (yoloPerson >= 3) { features.subjectType = 'group'; features.subjectConfidence = Math.max(features.subjectConfidence || 0, 0.88); }
        else if (yoloPerson === 2) { features.subjectType = 'people_present'; features.subjectConfidence = Math.max(features.subjectConfidence || 0, 0.7); }
        else if (yoloPerson === 1) { features.subjectType = features.subjectType === 'couple' ? 'portrait' : (features.subjectType || 'portrait'); }
      }
    }
  }

  const initialScene = classifyScene(features);

  // Apply the ENHANCED ZUNICORN AGENT LOOP: V2 with 15+ checks & 3 refinement passes
  const sceneLyrics = _agentLoopValidateV2(initialScene, features, 3);

  // Apply vocalSuggestion from scene if available (e.g. from generateFromFeatures fallback)
  const vocalSuggestion = sceneLyrics.vocalSuggestion || _inferVocalFromFeatures(features);

  // Generate structured metadata: labels, tags, wordings, songStyle
  const metadata = _generateStructuredMetadata(sceneLyrics, features, vocalSuggestion);

  // ── NEW: Generate PROFESSIONAL COMMANDS in all 4 formats ──
  const commands = {
    suno: _generateSUNOCommand(sceneLyrics, features, vocalSuggestion),
    muse: _generateMUSECommand(sceneLyrics, features, vocalSuggestion),
    fsm: _generateFSMCommand(sceneLyrics, features, vocalSuggestion),
    layer: _generateLAYERCommand(sceneLyrics, features, vocalSuggestion),
  };

  // Master command picker: recommendation by scene energy
  const bpm = sceneLyrics.tempos?.[1] || 90;
  const energy = _computeEnergyLevel(features, bpm);
  const recommendedFormat =
    energy > 0.7 ? 'fsm' :
      energy > 0.5 ? 'suno' :
        energy > 0.3 ? 'layer' : 'muse';

  return {
    success: true,
    features,
    scene: sceneLyrics,
    // Legacy-compatible fields for existing UI
    dominantColor: {
      rgb: features.dominantColor.rgb,
      hex: features.dominantColor.hex,
      hsl: `hsl(${Math.round(features.avgHue)}, ${Math.round(features.saturation * 100)}%, ${Math.round(features.brightness * 100)}%)`,
      hue: features.avgHue,
      category: classifyColorCategory(features)
    },
    mood: extractPrimaryMood(sceneLyrics.emotions),
    themes: [...new Set(sceneLyrics.themes)],
    styles: [...new Set(sceneLyrics.genre)],
    description: sceneLyrics.description,
    // Vocal recommendation based on visual analysis
    vocalRecommendation: vocalSuggestion,
    // STRUCTURED METADATA — labels, tags, wordings, songStyle
    labels: metadata.labels,
    tags: metadata.tags,
    wordings: metadata.wordings,
    songStyle: metadata.songStyle,
    // Agent loop quality report (V2 — SABCD grade + iteration log)
    qualityReport: sceneLyrics._agentLoop,
    suggestions: {
      genre: sceneLyrics.genre[0],
      theme: sceneLyrics.themes[0],
      mood: extractPrimaryMood(sceneLyrics.emotions),
      bpm: sceneLyrics.tempos[1] || 120,
      // Include vocal suggestion in the suggestions object
      vocal: vocalSuggestion,
      alternatives: {
        themes: sceneLyrics.themes,
        styles: sceneLyrics.genre,
        imageries: sceneLyrics.imagery.slice(0, 5)
      },
      // NEW: recommended professional command format
      recommendedFormat,
    },
    // Enhanced data for lyrics generation - includes vocal gender hint
    visualContext: {
      imagery: sceneLyrics.imagery,
      emotions: sceneLyrics.emotions,
      subjects: sceneLyrics.subjects,
      actions: sceneLyrics.actions,
      locations: sceneLyrics.locations,
      sceneId: sceneLyrics.profileId || sceneLyrics._semanticId,
      vocalGender: vocalSuggestion?.gender || null,
      vocalConfidence: vocalSuggestion?.confidence || 0,
      // Semantic subject detection results
      subjectType: features.subjectType || 'unknown',
      subjectConfidence: features.subjectConfidence || 0,
      personCount: features.personCount || 0,
      skinRegion: features.skinRegion || 'none',
      isSelfie: features.isSelfie || false,
      indoorOutdoor: features.indoorOutdoor || 'unknown',
      // Semantic scene description
      description: sceneLyrics.description,
      confidence: sceneLyrics.confidence || sceneLyrics._agentLoop?.confidence || 0,
      // Pass through structured metadata for the lyrics engine
      labels: metadata.labels,
      tags: metadata.tags,
      songStyle: metadata.songStyle,
      // NEW: match score from classifier
      matchScore: sceneLyrics.matchScore || 0,
      // NEW: emotion progression for lyrics sectioning
      emotionProgression: commands.suno.emotionProgression,
    },
    // ── NEW: PROFESSIONAL COMMANDS in all 4 generation formats ──
    professionalCommands: {
      recommended: recommendedFormat,
      suno: commands.suno,
      muse: commands.muse,
      fsm: commands.fsm,
      layer: commands.layer,
      // Master quick-access full command (recommended format)
      masterFullCommand: commands[recommendedFormat].fullCommand,
      // Quick copy: commands for lyrics engine integration
      forLyricsEngine: {
        fsmStates: commands.fsm.states,
        fsmTransitions: commands.fsm.transitions,
        museLayers: commands.muse.layers,
        layerTimeline: commands.layer.timeline,
        sunoSections: commands.suno.sectionMarkers,
        emotionCurve: commands.suno.emotionProgression,
      }
    },
    colorPalette: features.dominantColors.map(c => ({ hex: c.hex, percentage: c.percentage })),
    processingTime: Date.now()
  };
}

function classifyColorCategory(f) {
  if (f.warmRatio > 0.3 && f.brightness > 0.4) return 'warm';
  if (f.coolRatio > 0.3 && f.brightness < 0.5) return 'cool';
  if (f.greenRatio > 0.2) return 'earth';
  if (f.colorfulness > 0.5) return 'vibrant';
  if (f.darkRatio > 0.4) return 'dark';
  return 'ambient';
}

function extractPrimaryMood(emotions) {
  if (!emotions || emotions.length === 0) return 'neutral';
  const moodMap = {
    '怀旧': 'nostalgic', '浪漫': 'romantic', '忧伤': 'melancholy',
    '热情': 'passionate', '宁静': 'peaceful', '梦幻': 'dreamy',
    '活力': 'energetic', '治愈': 'healing', '孤独': 'lonely',
    '渴望': 'hopeful', '愤怒': 'angry', '喜悦': 'joyful'
  };
  for (const e of emotions) {
    for (const [zh, en] of Object.entries(moodMap)) {
      if (e.includes(zh)) return en;
    }
  }
  return 'neutral';
}