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
];

/* =========================================================================
 * VISUAL FEATURE EXTRACTOR
 * ========================================================================= */

/**
 * Analyze an image through 6 layers of feature extraction
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
 * SCENE CLASSIFICATION — Map all features to scene profile
 * ========================================================================= */

export function classifyScene(features) {
  for (const profile of SCENE_PROFILES) {
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
    lyrics.themes.push('loneliness', 'dreams', 'dark_mystery');
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
 * Complete image-to-lyrics analysis
 * @param {HTMLImageElement} imageElement - The uploaded image element
 * @returns {Promise<Object>} Complete analysis with scene classification
 */
export async function fullImageAnalysis(imageElement) {
  const features = await analyzeImageVisuals(imageElement);
  const sceneLyrics = classifyScene(features);

  // Apply vocalSuggestion from scene if available (e.g. from generateFromFeatures fallback)
  const vocalSuggestion = sceneLyrics.vocalSuggestion || _inferVocalFromFeatures(features);

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
      sceneId: sceneLyrics.profileId,
      vocalGender: vocalSuggestion?.gender || null,
      vocalConfidence: vocalSuggestion?.confidence || 0
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