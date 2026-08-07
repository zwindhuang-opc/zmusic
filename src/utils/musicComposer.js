import { MUSIC_STYLES, MUSIC_THEMES } from '../config/musicStyles.js';

const PROGRESSIONS = {
  pop: { major: ['C', 'G', 'Am', 'F'], minor: ['Am', 'F', 'C', 'G'] },
  rock: { major: ['E', 'A', 'B', 'E'], minor: ['Em', 'C', 'G', 'D'] },
  electronic: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  hip_hop: { major: ['C', 'G', 'F', 'C'], minor: ['Em', 'Cm', 'G', 'Dm'] },
  ballad: { major: ['C', 'Am', 'F', 'G'], minor: ['Am', 'F', 'C', 'G'] },
  chinese_traditional: { major: ['C', 'D', 'G', 'C'], minor: ['Am', 'Dm', 'G', 'C'] },
  jazz: { major: ['Cmaj7', 'Am7', 'Dm7', 'G7'], minor: ['Am7', 'Dm7', 'G7', 'Cmaj7'] },
  classical: { major: ['C', 'G', 'Am', 'F'], minor: ['Am', 'E', 'Am', 'E'] },
  rnb: { major: ['C', 'Am', 'F', 'G'], minor: ['Dm', 'G', 'C', 'Am'] },
  country: { major: ['G', 'C', 'D', 'G'], minor: ['Em', 'C', 'G', 'D'] },
  heartbreaking: { major: ['C', 'Am', 'F', 'G'], minor: ['Am', 'F', 'C', 'G'] },
  healing: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  time_travel: { major: ['C', 'G', 'F', 'C'], minor: ['Fm', 'C', 'G', 'Dm'] },
  epic: { major: ['C', 'G', 'D', 'C'], minor: ['Am', 'E', 'Am', 'E'] },
  dark: { major: ['C', 'F', 'G', 'C'], minor: ['Dm', 'Am', 'Dm', 'Gm'] },
  romantic: { major: ['C', 'Am', 'F', 'G'], minor: ['Am', 'F', 'C', 'G'] },
  nostalgic: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  energetic: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  dreamy: { major: ['C', 'E', 'Am', 'F'], minor: ['Am', 'C', 'E', 'G'] },
  modern: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  ancient: { major: ['C', 'D', 'G', 'C'], minor: ['Am', 'Dm', 'G', 'C'] },
  chinese_classical: { major: ['C', 'D', 'G', 'C'], minor: ['Am', 'Dm', 'G', 'C'] },
  love_song: { major: ['C', 'Am', 'F', 'G'], minor: ['Am', 'F', 'C', 'G'] },
  gothic_rock: { major: ['C', 'F', 'G', 'C'], minor: ['Dm', 'Am', 'Dm', 'Gm'] },
  ancient_modern: { major: ['C', 'D', 'G', 'C'], minor: ['Am', 'Dm', 'G', 'C'] },
  folk: { major: ['G', 'C', 'D', 'G'], minor: ['Em', 'C', 'G', 'D'] },
  indie: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  reggae: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  kpop: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  funk: { major: ['C', 'F', 'G', 'C'], minor: ['Dm', 'G', 'C', 'Am'] },
  ambient: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  latin: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  children: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  ballad_piano: { major: ['C', 'Am', 'F', 'G'], minor: ['Am', 'F', 'C', 'G'] },
  meditation: { major: ['C', 'E', 'G', 'C'], minor: ['Am', 'C', 'E', 'G'] },
  film_score: { major: ['C', 'G', 'D', 'C'], minor: ['Am', 'E', 'Am', 'E'] },
  podcast: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  ambient_chill: { major: ['C', 'E', 'Am', 'F'], minor: ['Am', 'C', 'E', 'G'] },
  xiaohongshu_vlog: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  dance_party: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  tech_explainer: { major: ['C', 'G', 'F', 'C'], minor: ['Am', 'F', 'C', 'G'] },
  lofi: { major: ['C', 'E', 'G', 'C'], minor: ['Am', 'C', 'E', 'G'] }
};

const STYLE_KEYS = {
  pop: 'C', rock: 'E', electronic: 'A', hip_hop: 'C', ballad: 'D',
  chinese_traditional: 'C', jazz: 'Bb', classical: 'C', rnb: 'D',
  country: 'G', heartbreaking: 'A', healing: 'C', time_travel: 'F',
  epic: 'D', dark: 'D', romantic: 'C', nostalgic: 'F',
  energetic: 'E', dreamy: 'A', modern: 'C', ancient: 'D',
  chinese_classical: 'G', love_song: 'C', gothic_rock: 'E',
  ancient_modern: 'C', folk: 'G', indie: 'C', reggae: 'A',
  kpop: 'C', funk: 'D', ambient: 'C', latin: 'D',
  children: 'C', ballad_piano: 'C', meditation: 'C',
  film_score: 'D', podcast: 'C', ambient_chill: 'A',
  xiaohongshu_vlog: 'C', dance_party: 'E', tech_explainer: 'C',
  lofi: 'D'
};

const SECTION_STRUCTURES = {
  standard: [
    { name: 'intro', bars: 4, instruments: ['piano', 'pad'], mood: 'hopeful' },
    { name: 'verse', bars: 8, instruments: ['piano', 'bass', 'drums'], mood: 'intimate' },
    { name: 'pre-chorus', bars: 4, instruments: ['piano', 'bass', 'drums', 'pad'], mood: 'building' },
    { name: 'chorus', bars: 8, instruments: ['piano', 'bass', 'drums', 'strings', 'pad'], mood: 'uplifting' },
    { name: 'verse2', bars: 8, instruments: ['piano', 'bass', 'drums'], mood: 'intimate' },
    { name: 'pre-chorus2', bars: 4, instruments: ['piano', 'bass', 'drums', 'pad'], mood: 'building' },
    { name: 'chorus2', bars: 8, instruments: ['piano', 'bass', 'drums', 'strings', 'pad'], mood: 'uplifting' },
    { name: 'bridge', bars: 4, instruments: ['piano', 'pad', 'strings'], mood: 'reflective' },
    { name: 'final-chorus', bars: 8, instruments: ['piano', 'bass', 'drums', 'strings', 'pad'], mood: 'triumphant' },
    { name: 'outro', bars: 4, instruments: ['piano', 'pad'], mood: 'fading' }
  ],
  short: [
    { name: 'intro', bars: 2, instruments: ['piano', 'pad'], mood: 'hopeful' },
    { name: 'verse', bars: 4, instruments: ['piano', 'bass', 'drums'], mood: 'intimate' },
    { name: 'chorus', bars: 4, instruments: ['piano', 'bass', 'drums', 'strings'], mood: 'uplifting' },
    { name: 'verse2', bars: 4, instruments: ['piano', 'bass', 'drums'], mood: 'intimate' },
    { name: 'chorus2', bars: 4, instruments: ['piano', 'bass', 'drums', 'strings'], mood: 'uplifting' },
    { name: 'outro', bars: 2, instruments: ['piano', 'pad'], mood: 'fading' }
  ],
  loop: [
    { name: 'intro', bars: 2, instruments: ['piano', 'pad'], mood: 'hopeful' },
    { name: 'main', bars: 8, instruments: ['piano', 'bass', 'drums'], mood: 'steady' },
    { name: 'build', bars: 2, instruments: ['piano', 'bass', 'drums', 'pad'], mood: 'building' },
    { name: 'drop', bars: 4, instruments: ['piano', 'bass', 'drums', 'strings', 'pad'], mood: 'energetic' },
    { name: 'breakdown', bars: 4, instruments: ['piano', 'pad'], mood: 'minimal' }
  ]
};

function useMajorKey(theme) {
  const minorThemes = ['heartbreak', 'sadness', 'dark_mystery', 'time_travel', 'winter_solitude', 'autumn_melancholy', 'loneliness'];
  return !minorThemes.includes(theme);
}

function selectProgression(style, isMajor) {
  const prog = PROGRESSIONS[style];
  if (!prog) return PROGRESSIONS.pop[isMajor ? 'major' : 'minor'];
  return prog[isMajor ? 'major' : 'minor'] || prog.major;
}

function selectKey(style, isMajor) {
  const k = STYLE_KEYS[style] || 'C';
  return isMajor ? k : relativeMinor(k);
}

function relativeMinor(majorKey) {
  const map = { 'C': 'Am', 'G': 'Em', 'D': 'Bm', 'A': 'Fm', 'E': 'Cm', 'F': 'Dm', 'Bb': 'Gm' };
  return map[majorKey] || 'Am';
}

export function composeMusic(params) {
  const { prompt = '', style = 'pop', theme = 'love', duration = 60, bpm = 120 } = params;

  const styleInfo = MUSIC_STYLES[style] || MUSIC_STYLES.pop;
  const themeInfo = MUSIC_THEMES[theme] || MUSIC_THEMES.love;

  const isMajor = useMajorKey(theme);
  const key = selectKey(style, isMajor);
  const scale = isMajor ? 'major' : 'minor';
  const progression = selectProgression(style, isMajor);

  const avgBpm = styleInfo.bpmRange
    ? Math.round((styleInfo.bpmRange[0] + styleInfo.bpmRange[1]) / 2)
    : bpm;

  const structure = duration <= 20 ? SECTION_STRUCTURES.short
    : duration <= 40 ? SECTION_STRUCTURES.short
    : duration <= 80 ? SECTION_STRUCTURES.standard
    : SECTION_STRUCTURES.standard;

  const totalBars = structure.reduce((sum, s) => sum + s.bars, 0);
  const barsPerSecond = avgBpm / 60 / 4;
  const actualDuration = totalBars / barsPerSecond;

  const sections = structure.map((s, i) => {
    const chordIndex = i % progression.length;
    const sectionChords = [];
    for (let b = 0; b < s.bars; b++) {
      sectionChords.push(progression[(chordIndex + b) % progression.length]);
    }
    return {
      name: s.name,
      bars: s.bars,
      chords: sectionChords,
      instruments: s.instruments,
      mood: s.mood
    };
  });

  return {
    key,
    scale,
    tempo: avgBpm,
    timeSignature: '4/4',
    duration: Math.round(actualDuration),
    style,
    theme,
    title: prompt.slice(0, 40) || `${styleInfo.mood} · ${themeInfo.name}`,
    sections
  };
}

const LLM_PROMPT_TEMPLATE = `You are a professional music composer. Given the following request, generate a structured music composition as JSON.

Request:
- Prompt/Theme: "{{PROMPT}}"
- Style: "{{STYLE}}"
- Theme/Mood: "{{THEME}}"
- Target Duration: {{DURATION}} seconds
- BPM: {{BPM}}

Style info: {{STYLE_INFO}}
Theme info: {{THEME_INFO}}

Generate valid JSON with this schema:
{
  "key": "C",
  "scale": "major or minor",
  "tempo": number,
  "timeSignature": "4/4",
  "duration": number,
  "style": "style name",
  "theme": "theme name",
  "title": "creative title",
  "sections": [
    {
      "name": "section name (intro, verse, pre-chorus, chorus, bridge, outro)",
      "bars": number of bars (must sum to total duration),
      "chords": ["chord1", "chord2", ...one per bar],
      "instruments": ["instrument list"],
      "mood": "mood descriptor"
    }
  ]
}

IMPORTANT: Output ONLY valid JSON, no other text. Make the music interesting with varied chord progressions and section structures. Ensure bars sum to create approximately the target duration at the given tempo (4 beats per bar).`;

export async function composeMusicWithLLM(params, config) {
  const { prompt = '', style = 'pop', theme = 'love', duration = 60, bpm = 120 } = params;
  const { llmProvider, llmApiKey, llmApiEndpoint } = config;

  if (!llmApiKey || !llmProvider) {
    return { source: 'rule-based', ...composeMusic(params) };
  }

  const styleInfo = MUSIC_STYLES[style] || MUSIC_STYLES.pop;
  const themeInfo = MUSIC_THEMES[theme] || MUSIC_THEMES.love;

  const fullPrompt = LLM_PROMPT_TEMPLATE
    .replace('{{PROMPT}}', prompt || 'Create music matching this mood')
    .replace('{{STYLE}}', styleInfo.description || style)
    .replace('{{THEME}}', themeInfo.sunoTags || theme)
    .replace('{{DURATION}}', duration)
    .replace('{{BPM}}', bpm)
    .replace('{{STYLE_INFO}}', styleInfo.sunoTags || '')
    .replace('{{THEME_INFO}}', themeInfo.sunoTags || '');

  try {
    const response = await fetch(llmApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmApiKey}`
      },
      body: JSON.stringify({
        model: llmProvider === 'glm' ? 'glm-4-flash' : llmProvider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini',
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.8,
        max_tokens: 2000
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) throw new Error(`LLM API failed: ${response.status}`);
    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || data.content || '';

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('LLM did not return valid JSON');

    const composition = JSON.parse(jsonMatch[0]);
    validateComposition(composition);
    return { source: 'llm', ...composition };
  } catch (err) {
    console.warn('[musicComposer] LLM failed, falling back to rule-based:', err.message);
    return { source: 'rule-based', ...composeMusic(params) };
  }
}

function validateComposition(comp) {
  if (!comp.key || !comp.scale || !comp.tempo || !comp.sections) {
    throw new Error('Invalid composition JSON structure');
  }
  if (!Array.isArray(comp.sections) || comp.sections.length === 0) {
    throw new Error('Composition must have at least one section');
  }
  for (const s of comp.sections) {
    if (!s.name || !Array.isArray(s.chords) || !Array.isArray(s.instruments)) {
      throw new Error(`Invalid section: ${s.name}`);
    }
  }
}

export { MUSIC_STYLES, MUSIC_THEMES };
