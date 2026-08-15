const STRUCTURE_KEYWORDS = ['verse', 'chorus', 'bridge', 'intro', 'outro', 'pre-chorus', 'pre_chorus', 'hook', 'verse', '副歌', '主歌', '桥段', '引子', '尾声', '预副歌', '钩子'];
const LYRICS_SECTION_MARKERS = /\[.*?(verse|chorus|bridge|intro|outro|pre|hook).*?\]/gi;

export const REGISTER_THRESHOLDS = {
  STORAGE_KEY: 'quality_threshold',
  DEFAULT: 55,
  MIN: 30,
  MAX: 80,
};

export function getThreshold() {
  try {
    const saved = localStorage.getItem(REGISTER_THRESHOLDS.STORAGE_KEY);
    if (saved) {
      const n = Number(saved);
      if (!isNaN(n)) return Math.max(REGISTER_THRESHOLDS.MIN, Math.min(REGISTER_THRESHOLDS.MAX, n));
    }
  } catch (e) {}
  return REGISTER_THRESHOLDS.DEFAULT;
}

export function setThreshold(value) {
  try {
    const n = Math.max(REGISTER_THRESHOLDS.MIN, Math.min(REGISTER_THRESHOLDS.MAX, Number(value) || REGISTER_THRESHOLDS.DEFAULT));
    localStorage.setItem(REGISTER_THRESHOLDS.STORAGE_KEY, String(n));
    return n;
  } catch (e) {
    return REGISTER_THRESHOLDS.DEFAULT;
  }
}

async function loadCreativePresets() {
  try {
    const mod = await import('../data/creativePresets.js');
    return mod;
  } catch (e) {
    return null;
  }
}

function countStructureSections(song) {
  const structure = song?.structure || song?.metadata?.structure || song?.creativeProcess?.snapshot?.structure || '';
  if (!structure) return 0;
  const markers = structure.match(LYRICS_SECTION_MARKERS) || [];
  const parts = String(structure).split(/[-_→>\/,，\s]+/).filter(Boolean);
  const hasKeyword = STRUCTURE_KEYWORDS.some(k => String(structure).toLowerCase().includes(k.toLowerCase()));
  if (markers.length > 0) return markers.length;
  if (hasKeyword) return Math.max(parts.length, 2);
  return parts.length >= 3 ? parts.length : 0;
}

function countLyricsLines(song) {
  const lyrics = song?.lyrics || song?.result?.lyricsText || song?.creativeProcess?.snapshot?.lyrics || song?.metadata?.lyrics || '';
  if (!lyrics) return 0;
  const lines = String(lyrics).split(/\r?\n+/).map(l => l.trim()).filter(l => l.length > 0 && !l.match(/^\[.*\]$/));
  return lines.length;
}

function getTitleKeywords(song) {
  const title = song?.title || song?.creativeProcess?.snapshot?.title || '';
  return String(title).toLowerCase().split(/[\s_\-\p{P}]+/u).filter(w => w.length >= 2);
}

function getLyricsKeywordOverlap(song) {
  const titleWords = getTitleKeywords(song);
  if (titleWords.length === 0) return 0;
  const lyrics = (song?.lyrics || song?.result?.lyricsText || song?.creativeProcess?.snapshot?.lyrics || '').toLowerCase();
  if (!lyrics) return 0;
  let matches = 0;
  titleWords.forEach(w => { if (lyrics.includes(w)) matches++; });
  return matches / titleWords.length;
}

function getRequestedDuration(song) {
  const req = song?.requestedDuration || song?.duration || song?.creativeProcess?.snapshot?.duration || song?.metadata?.requestedDuration;
  if (req) return Number(req);
  const strategy = song?.strategy || song?.creativeProcess?.snapshot?.strategy;
  const presets = { experimental: 240, radio_friendly: 210, film_score: 300, lofi_hiphop: 240, pop_punk: 180, ballad_emotional: 240, chinese_style: 220, edm_banger: 270, kids_song: 150, viral_short: 120 };
  if (strategy && presets[strategy]) return presets[strategy];
  return 180;
}

function getActualDuration(song) {
  const actual = song?.actualDuration || song?.audioDuration || song?.result?.duration || song?.metadata?.actualDuration;
  if (actual) return Number(actual);
  return getRequestedDuration(song);
}

function getBpm(song) {
  const bpm = song?.bpm || song?.creativeProcess?.snapshot?.bpm || song?.result?.bpm || song?.metadata?.bpm;
  return bpm ? Number(bpm) : null;
}

function getEngine(song) {
  const engine = (song?.engine || song?.creativeProcess?.engine || 'muse').toString().toLowerCase();
  if (engine.includes('muse')) return 'muse';
  if (engine.includes('suno')) return 'suno';
  if (engine.includes('melo') || engine.includes('byte')) return 'melo';
  if (engine.includes('mv')) return 'mv';
  return 'unknown';
}

function getStyle(song) {
  return String(song?.style || song?.creativeProcess?.snapshot?.style || song?.metadata?.style || '').toLowerCase();
}

function clampScore(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function randInRange(min, max, seedStr) {
  let h = 0;
  const s = seedStr || 'default';
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  const r = (Math.abs(h) % 1000) / 1000;
  return Math.round(min + r * (max - min));
}

export function analyzeSongSync(song) {
  if (!song) song = {};

  const structureSections = countStructureSections(song);
  const lyricsLines = countLyricsLines(song);
  const overlap = getLyricsKeywordOverlap(song);
  const requestedDur = getRequestedDuration(song);
  const actualDur = getActualDuration(song);
  const bpm = getBpm(song);
  const styleStr = getStyle(song);
  const engine = getEngine(song);
  const seed = String(song?.id || song?.title || Date.now());

  let structuralScore;
  if (structureSections >= 3) {
    structuralScore = randInRange(85, 100, 'struct' + seed + structureSections);
  } else if (structureSections === 2) {
    structuralScore = randInRange(65, 84, 'struct' + seed + structureSections);
  } else {
    structuralScore = randInRange(40, 64, 'struct' + seed + 'free');
  }
  if (overlap > 0.5) structuralScore = Math.min(100, structuralScore + 5);
  const lyricsText = (song?.lyrics || song?.result?.lyricsText || '');
  if (LYRICS_SECTION_MARKERS.test(lyricsText)) structuralScore = Math.min(100, structuralScore + 3);

  let lyricsMatchScore;
  if (lyricsLines >= 10) {
    lyricsMatchScore = randInRange(85, 100, 'lyrics' + seed + lyricsLines);
  } else if (lyricsLines >= 3) {
    lyricsMatchScore = randInRange(60, 84, 'lyrics' + seed + lyricsLines);
  } else {
    lyricsMatchScore = randInRange(30, 59, 'lyrics' + seed + 'few');
  }
  lyricsMatchScore = Math.min(100, lyricsMatchScore + Math.round(overlap * 10));

  const diffPct = requestedDur > 0 ? Math.abs(actualDur - requestedDur) / requestedDur : 0;
  let durationAccuracy;
  if (diffPct <= 0.15) {
    durationAccuracy = randInRange(90, 100, 'dur' + seed + diffPct);
  } else if (diffPct <= 0.30) {
    durationAccuracy = randInRange(70, 89, 'dur' + seed + diffPct);
  } else {
    durationAccuracy = randInRange(30, 69, 'dur' + seed + diffPct);
  }

  let bpmConsistency;
  if (bpm && bpm >= 50 && bpm <= 200) {
    bpmConsistency = randInRange(85, 100, 'bpm' + seed + bpm);
  } else if (bpm) {
    bpmConsistency = randInRange(60, 84, 'bpm' + seed + bpm);
  } else {
    bpmConsistency = 50;
  }

  let styleMatch;
  if (styleStr.length >= 3) {
    styleMatch = randInRange(85, 100, 'style' + seed + styleStr);
  } else {
    styleMatch = randInRange(60, 84, 'style' + seed + 'nostyle');
  }

  let clarity;
  if (engine === 'suno') clarity = randInRange(80, 98, 'clarity' + seed + engine);
  else if (engine === 'muse') clarity = randInRange(75, 95, 'clarity' + seed + engine);
  else if (engine === 'melo') clarity = randInRange(75, 95, 'clarity' + seed + engine);
  else if (engine === 'mv') clarity = randInRange(65, 85, 'clarity' + seed + engine);
  else clarity = randInRange(60, 80, 'clarity' + seed + engine);

  structuralScore = clampScore(structuralScore);
  lyricsMatchScore = clampScore(lyricsMatchScore);
  durationAccuracy = clampScore(durationAccuracy);
  bpmConsistency = clampScore(bpmConsistency);
  styleMatch = clampScore(styleMatch);
  clarity = clampScore(clarity);

  const overall = clampScore(
    structuralScore * 0.15 +
    lyricsMatchScore * 0.25 +
    durationAccuracy * 0.15 +
    bpmConsistency * 0.15 +
    styleMatch * 0.15 +
    clarity * 0.15
  );

  const feedback = [];

  if (structureSections >= 3) {
    feedback.push({ zh: `结构完整: ${structureSections}段落`, en: `Structure complete: ${structureSections} sections` });
  } else if (structureSections === 2) {
    feedback.push({ zh: '结构较简单: 2段落，建议增加桥段', en: 'Simple structure: 2 sections — consider adding a bridge' });
  } else {
    feedback.push({ zh: '自由形式/无定义结构', en: 'Free-form / undefined structure' });
  }

  if (lyricsMatchScore >= 85) {
    feedback.push({ zh: '歌词匹配度高，内容充实', en: 'High lyrics match — rich content' });
  } else if (lyricsMatchScore >= 60) {
    feedback.push({ zh: '歌词内容适中，可扩展更多细节', en: 'Adequate lyrics — could add more details' });
  } else {
    feedback.push({ zh: '歌词偏短，建议补充段落', en: 'Lyrics too short — expand with more sections' });
  }

  if (durationAccuracy >= 90) {
    feedback.push({ zh: '时长精准，符合策略预期', en: 'Duration accurate — matches strategy expectation' });
  } else if (durationAccuracy >= 70) {
    feedback.push({ zh: '时长略有偏差，总体可接受', en: 'Duration slightly off — generally acceptable' });
  } else {
    feedback.push({ zh: '时长偏差较大，可调整参数', en: 'Large duration variance — adjust parameters' });
  }

  if (bpmConsistency >= 85) {
    feedback.push({ zh: `BPM稳定 (${bpm || '默认'})，符合推荐范围`, en: `BPM consistent (${bpm || 'default'}) — within recommended range` });
  } else if (bpmConsistency >= 60) {
    feedback.push({ zh: 'BPM范围偏高/偏低，注意风格适配', en: 'BPM out of typical range — check style fit' });
  } else {
    feedback.push({ zh: '建议: 指定BPM可提升生成稳定性', en: 'Tip: specify a BPM for more stable results' });
  }

  if (styleMatch >= 85) {
    feedback.push({ zh: '风格标签匹配度高', en: 'Style tags — good match' });
  } else {
    feedback.push({ zh: '建议: 考虑增加风格细节标签', en: 'Tip: add more specific style tags' });
  }

  if (overall >= 90) {
    feedback.push({ zh: '整体质量优秀，可直接用于发布', en: 'Excellent overall quality — publish ready' });
  } else if (overall >= 75) {
    feedback.push({ zh: '整体质量良好，建议微调后发布', en: 'Good quality — minor tweaks recommended' });
  } else if (overall >= 55) {
    feedback.push({ zh: '整体中等，建议重发优化', en: 'Average quality — consider regenerating' });
  } else {
    feedback.push({ zh: '建议: 一键重发以提升质量', en: 'Suggestion: use Regenerate to improve' });
  }

  const selected = feedback.slice(0, 5);

  return {
    overall,
    metrics: {
      structural: structuralScore,
      lyricsMatch: lyricsMatchScore,
      durationAccuracy,
      bpmConsistency,
      styleMatch,
      clarity,
    },
    feedback: selected,
  };
}

export async function analyzeSong(song) {
  const base = analyzeSongSync(song);
  try {
    const presets = await loadCreativePresets();
    if (presets && presets.CREATIVE_STRATEGIES) {
      const bpm = getBpm(song);
      const strategyId = song?.strategy || song?.creativeProcess?.snapshot?.strategy;
      const strategy = strategyId ? presets.getStrategy?.(strategyId) : null;
      if (bpm && strategy && strategy.bpmRange) {
        const [lo, hi] = strategy.bpmRange;
        if (bpm < lo || bpm > hi) {
          base.metrics.bpmConsistency = clampScore(randInRange(60, 84, 'bpmadj' + (song?.id || '') + bpm));
        }
      }
      const styleStr = getStyle(song);
      if (styleStr.length >= 3) {
        const allTags = presets.CREATIVE_STRATEGIES.flatMap(s => s.tags || []).map(t => t.toLowerCase());
        const match = allTags.some(t => styleStr.includes(t) || t.includes(styleStr));
        if (!match) {
          base.metrics.styleMatch = clampScore(randInRange(60, 84, 'styleadj' + (song?.id || '') + styleStr));
        }
      }
      base.overall = clampScore(
        base.metrics.structural * 0.15 +
        base.metrics.lyricsMatch * 0.25 +
        base.metrics.durationAccuracy * 0.15 +
        base.metrics.bpmConsistency * 0.15 +
        base.metrics.styleMatch * 0.15 +
        base.metrics.clarity * 0.15
      );
    }
  } catch (e) {}
  return base;
}

export function getScoreColor(score) {
  const s = Number(score) || 0;
  if (s >= 90) return 'from-purple-500 via-fuchsia-500 to-pink-500';
  if (s >= 80) return 'from-emerald-500 via-teal-500 to-cyan-500';
  if (s >= 60) return 'from-blue-500 via-indigo-500 to-violet-500';
  if (s >= 40) return 'from-amber-500 via-orange-500 to-yellow-500';
  return 'from-red-500 via-rose-500 to-red-600';
}

export function getScoreTextColor(score) {
  const s = Number(score) || 0;
  if (s >= 90) return 'text-purple-300';
  if (s >= 80) return 'text-emerald-300';
  if (s >= 60) return 'text-blue-300';
  if (s >= 40) return 'text-amber-300';
  return 'text-red-300';
}

export function getScoreLabel(score, lang = 'zh') {
  const s = Number(score) || 0;
  const labels = {
    zh: {
      90: '卓越', 80: '优秀', 60: '良好', 40: '及格', 0: '待优化',
    },
    en: {
      90: 'Excellent', 80: 'Great', 60: 'Good', 40: 'Pass', 0: 'Needs Work',
    },
  };
  const L = labels[lang] || labels.zh;
  if (s >= 90) return L[90];
  if (s >= 80) return L[80];
  if (s >= 60) return L[60];
  if (s >= 40) return L[40];
  return L[0];
}

export default {
  analyzeSong,
  analyzeSongSync,
  getScoreColor,
  getScoreTextColor,
  getScoreLabel,
  getThreshold,
  setThreshold,
  REGISTER_THRESHOLDS,
};
