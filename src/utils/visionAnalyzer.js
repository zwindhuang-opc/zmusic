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
      f.skinRatio < 0.05,
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
    ...extractSemanticFeatures(pixels, w, h),
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
function extractSemanticFeatures(pixels, w, h) {
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
  // Lower threshold for new higher-resolution grid to detect smaller faces
  const visited = Array(gridRows).fill(0).map(() => Array(gridCols).fill(false));
  const clusters = [];
  const minClusterSize = 3; // Lower for higher-res grid (was 5 for 20x15)

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

  const personCount = clusters.length;

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

  // Second-pass: if we detected 1 person but skin coverage is high,
  // the cluster-splitting may have missed a second person (e.g., very close
  // faces in a couple selfie). Use additional heuristics.
  // Heuristic: wide cluster + high skinRatio + upper-region = likely a couple
  let potentialCouple = false;
  if (personCount === 1 && clusters.length === 1) {
    const cluster = clusters[0];
    // Compute cluster width relative to grid
    const clusterWidth = _computeClusterWidth(cluster, grid, gridCols, gridRows);
    // More sensitive thresholds with new higher-res grid (30x22 vs old 20x15)
    if (skinRatio > 0.08 && clusterWidth > gridCols * 0.30 && skinRegion.startsWith('upper')) {
      potentialCouple = true;
      // Promote subjectType to 'couple'
      subjectType = 'couple';
      subjectConfidence = Math.max(subjectConfidence, 0.5);
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
    clusters: clusters.map(c => ({ cx: c.cx, cy: c.cy, size: c.size }))
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
  // Only split clusters that are large enough to contain multiple faces
  // Higher threshold for higher-res grid (30x22 vs old 20x15)
  if (cluster.size < 12) return [cluster];

  // Re-collect cluster cells by BFS from centroid
  const cells = _collectClusterCells(grid, cluster, cols, rows);
  if (cells.length < 12) return [cluster];

  // Project skin density onto X axis (columns)
  const colDensity = new Array(cols).fill(0);
  for (const { x, y } of cells) {
    colDensity[x] += grid[y][x];
  }

  // Find left and right bounds of the cluster
  let minX = cols, maxX = 0;
  for (const { x } of cells) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  const width = maxX - minX + 1;

  // If cluster spans >40% of grid width, it likely contains 2+ faces
  if (width < Math.floor(cols * 0.40)) return [cluster];

  // Find the two density peaks
  const peaks = _findTwoPeaks(colDensity, minX, maxX);
  if (!peaks) return [cluster];

  // Split at the valley between peaks
  const splitX = Math.floor((peaks[0] + peaks[1]) / 2);

  // Assign cells to left or right sub-cluster
  const leftCells = [];
  const rightCells = [];
  for (const cell of cells) {
    if (cell.x <= splitX) leftCells.push(cell);
    else rightCells.push(cell);
  }

  // Both sub-clusters must have meaningful size (at least 5 cells each)
  if (leftCells.length < 5 || rightCells.length < 5) return [cluster];

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

/* =========================================================================
 * SCENE CLASSIFICATION — Map all features to scene profile
 * ========================================================================= */

export function classifyScene(features) {
  // FIRST: check semantic features (people/couple detected)
  if (features.subjectType && features.subjectConfidence > 0.15) {
    const semanticProfile = _classifyBySemantics(features);
    if (semanticProfile) {
      const result = { ...semanticProfile, profileId: semanticProfile._semanticId };
      result.vocalSuggestion = _inferVocalFromFeatures(features);
      return result;
    }
  }

  // SECOND: match against scene profiles
  // If there's weak semantic evidence of people (low confidence or unknown type),
  // skip dark/lonely profiles to avoid incorrectly classifying people as lonely
  const hasPeopleEvidence = (features.skinRatio || 0) > 0.02;

  for (const profile of SCENE_PROFILES) {
    // Skip dark/lonely profiles when there's evidence of people in the image
    const darkProfileIds = ['urban_loneliness', 'storm_tension', 'dreamy_night', 'passionate_love'];
    if (hasPeopleEvidence && darkProfileIds.includes(profile.id)) {
      continue;
    }
    if (profile.match(features)) {
      const result = { ...profile.lyrics, profileId: profile.id };
      result.vocalSuggestion = _inferVocalFromFeatures(features);
      return result;
    }
  }

  // Fallback: generate from individual features
  return generateFromFeatures(features);
}

/**
 * Classify scene based on semantic subject detection
 * This ensures that a couple photo generates love lyrics, not generic color-based ones
 */
function _classifyBySemantics(f) {
  const type = f.subjectType;

  if (type === 'couple') {
    const hasWarmBrightColors = f.warmRatio > 0.3 && f.brightness > 0.4;
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
      description: hasWarmBrightColors
        ? '图片中检测到两个人（情侣/合照），色彩温暖明亮，生成甜蜜爱情主题歌词'
        : '图片中检测到两个人（可能是情侣），生成爱情主题歌词',
      confidence: f.subjectConfidence
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
    quiet_morning: ['清晨', 'Morning']
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

/**
 * Complete image-to-lyrics analysis
 * @param {HTMLImageElement} imageElement - The uploaded image element
 * @returns {Promise<Object>} Complete analysis with scene classification
 */
export async function fullImageAnalysis(imageElement) {
  const features = await analyzeImageVisuals(imageElement);
  const initialScene = classifyScene(features);

  // Apply the ZUNICORN AGENT LOOP: validate and refine the scene
  const sceneLyrics = _agentLoopValidate(initialScene, features);

  // Apply vocalSuggestion from scene if available (e.g. from generateFromFeatures fallback)
  const vocalSuggestion = sceneLyrics.vocalSuggestion || _inferVocalFromFeatures(features);

  // Generate structured metadata: labels, tags, wordings, songStyle
  const metadata = _generateStructuredMetadata(sceneLyrics, features, vocalSuggestion);

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
    // Agent loop quality report
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
      }
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
      songStyle: metadata.songStyle
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