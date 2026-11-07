/**
 * CaptionService - "AI 生词" 文案生成服务
 *
 * 借鉴微信朋友圈「AI 生词」的交互：用户在输入框旁点一下，AI 给出几条
 * 可直接使用的候选文案，点选即填入。
 *
 * 覆盖的文案类型（kind）：
 *   - inspiration : 歌曲灵感描述（Muse / Suno 的 prompt 输入框）
 *   - lyrics      : 歌词创作方向脚本（Lyrics / Melo）
 *   - share       : 发布分享文案（发布工坊的 Caption）
 *   - title       : 歌名候选（发布工坊的标题）
 *
 * 分层策略（与 vision.service.js 保持一致的项目惯例）：
 *   Level 1: 若配置了 LLM Key（config.llmApiKey），调用 LLM 生成
 *   Level 2: 本地词池 + 模板组合（无需任何外部依赖，离线可用）
 *
 * 本地生成使用带种子的伪随机，保证同一 seed 结果稳定、点「换一批」有变化。
 *
 * @module services/caption.service
 * @version 1.0.0
 * @author ZMusic Team
 */

import config from "../config/index.js";
import Logger from "../utils/logger.js";

const logger = new Logger("CaptionService");

// ---------------------------------------------------------------------------
// 词池：中文
// ---------------------------------------------------------------------------

/** 场景池 —— 都带具体画面，便于直接当灵感描述使用。 */
const ZH_SCENES = [
  "夏夜的海边",
  "清晨的地铁站",
  "深夜的录音棚",
  "城市的天台",
  "回乡的老街",
  "雨天的公交车",
  "雪山的营地",
  "校园的走廊",
  "加班到深夜的办公室",
  "黄昏的球场",
  "清晨的豆浆铺",
  "江边的长椅",
  "livehouse 的舞台",
  "高铁的车窗旁",
  "老城区的小巷",
  "海岛的码头",
  "山顶的日出",
  "夜市的烟火气",
  "图书馆的窗边",
  "老家的院子",
];

/** 情绪池。 */
const ZH_MOODS = [
  "温柔",
  "倔强",
  "释然",
  "心动",
  "孤独",
  "热烈",
  "安静",
  "思念",
  "勇敢",
  "怅然",
  "期待",
  "治愈",
  "澎湃",
  "慵懒",
  "笃定",
];

/** 意象池 —— 具体的物件/细节，比抽象形容词更容易让模型出好歌。 */
const ZH_IMAGERY = [
  "一把旧吉他",
  "半杯没喝完的咖啡",
  "循环播放的老歌",
  "路灯下被拉长的影子",
  "耳机里漏出的一首歌",
  "写满字的笔记本",
  "凌晨三点的窗外",
  "一张褪色的照片",
  "风里的口哨声",
  "没寄出的信",
  "车窗外的雨线",
  "掌心里的一点温度",
  "便利店的关东煮",
  "背包上的旧徽章",
  "桌角那盏小台灯",
];

/** 灵感描述收束句。 */
const ZH_ENDINGS = [
  "听见自己的影子",
  "找到勇气的形状",
  "想起某个很久没联系的人",
  "允许自己慢下来",
  "相信明天会更好",
  "把遗憾轻轻放下",
];

/** 歌名模板。 */
const ZH_TITLE_PATTERNS = [
  (s, i, m) => `${s.split("的")[0]}${m}`,
  (s, i, m) => `关于${m}的第${1 + Math.floor(Math.random() * 9)}种${m}`,
  (s, i, m) => `${m}与${s}`,
  (s, i, m) => `在${s}说${m}`,
  (s, i, m) => `${m}的${s.split("的").pop()}`,
  (s, i, m) => `把${m}唱给${s.split("的").pop()}`,
];

/** 分享文案模板（发布工坊 Caption）。 */
const ZH_SHARE_PATTERNS = [
  (title, scene, imagery) =>
    `《${title}》上线了。\n灵感来自${scene}——${imagery}，还有一点没说出口的心情。\n如果你也在这样的时刻停留过，这首歌也许属于你。`,
  (title, scene, imagery) =>
    `写《${title}》的时候，脑子里一直是${scene}的画面。\n${imagery}，和那些没来得及说完的话，都写进副歌里了。\n戴上耳机听一遍吧。`,
  (title, scene, imagery) =>
    `新歌《${title}》。\n从${scene}开始，到${imagery}结束，中间是很多人的日常。\n希望它在你的某个深夜，刚好响起。`,
];

// ---------------------------------------------------------------------------
// 词池：英文
// ---------------------------------------------------------------------------

const EN_SCENES = [
  "a seaside night in midsummer",
  "an empty subway car at dawn",
  "the studio at 3 a.m.",
  "a rooftop above the city",
  "the old street back home",
  "a rainy bus ride",
  "a camp under the snow mountain",
  "a school corridor after class",
  "a late-night office",
  "a bench by the river",
  "a small venue stage",
  "the window seat of a night train",
];

const EN_MOODS = [
  "tender",
  "stubborn",
  "relieved",
  "fluttering",
  "lonely",
  "fiery",
  "quiet",
  "longing",
  "brave",
  "wistful",
  "hopeful",
  "healing",
];

const EN_IMAGERY = [
  "an old guitar",
  "a half-finished cup of coffee",
  "a song on repeat",
  "a shadow stretched under a streetlight",
  "a faded photograph",
  "an unsent letter",
  "rain on the window",
  "a small desk lamp",
  "a worn badge on a backpack",
];

const EN_ENDINGS = [
  "hear their own shadow",
  "find the shape of courage",
  "think of someone they lost touch with",
  "let themselves slow down",
  "believe tomorrow is kinder",
  "set the regret down gently",
];

const EN_SHARE_PATTERNS = [
  (title, scene, imagery) =>
    `"${title}" is out now.\nIt started with ${scene} — ${imagery}, and a feeling I couldn't quite name.\nIf you've stood in a moment like that, this one is for you.`,
  (title, scene, imagery) =>
    `I kept seeing ${scene} while writing "${title}".\n${imagery} and the words I never got to say ended up in the chorus.\nPut your headphones on for this one.`,
];

// ---------------------------------------------------------------------------
// 带种子的伪随机
// ---------------------------------------------------------------------------

/**
 * mulberry32 —— 轻量确定性伪随机数生成器。
 * @param {number} a 种子
 * @returns {() => number} 返回 0~1 的随机函数
 */
function mulberry32(a) {
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 把任意字符串转成 32 位整数种子。
 * @param {string} str
 * @returns {number}
 */
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 从数组中随机取一项。
 * @template T
 * @param {() => number} rand
 * @param {T[]} arr
 * @returns {T}
 */
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

// ---------------------------------------------------------------------------
// 本地模板生成
// ---------------------------------------------------------------------------

/**
 * 用本地词池生成候选文案。
 *
 * @param {object} opts
 * @param {string} opts.kind - inspiration | lyrics | share | title
 * @param {string} opts.seed - 用户当前输入（作为上下文/种子，可为空）
 * @param {string} opts.title - 歌曲标题（share/title 用）
 * @param {string} opts.style - 音乐风格（如「流行」「摇滚」）
 * @param {string} opts.lang - zh | en
 * @param {number} opts.count - 候选数量
 * @returns {string[]} 候选文案列表
 */
function buildLocalCaptions({
  kind,
  seed = "",
  title = "",
  style = "",
  lang = "zh",
  count = 3,
}) {
  // 候选数量统一夹紧在 1~5（generateCaptions 之外的直接调用者也生效）
  count = Math.max(1, Math.min(5, Number(count) || 3));
  const isZh = lang !== "en";
  const rand = mulberry32(
    hashSeed(`${kind}|${seed}|${title}|${style}|${Date.now()}`),
  );

  const scenes = isZh ? ZH_SCENES : EN_SCENES;
  const moods = isZh ? ZH_MOODS : EN_MOODS;
  const imageryPool = isZh ? ZH_IMAGERY : EN_IMAGERY;
  const endings = isZh ? ZH_ENDINGS : EN_ENDINGS;

  const out = [];
  const used = new Set();

  for (let i = 0; i < count * 3 && out.length < count; i += 1) {
    const scene = pick(rand, scenes);
    const mood = pick(rand, moods);
    const imagery = pick(rand, imageryPool);
    const ending = pick(rand, endings);
    let text = "";

    if (kind === "title") {
      const songTitle = title || (isZh ? "未命名歌曲" : "Untitled");
      const sceneShort = isZh ? scene.split("的").pop() : scene;
      // 用"意象 + 情绪 / 场景 + 情绪"的短标题，比拼后缀更自然
      const zhTitles = [
        imagery,
        `把${mood}留在${sceneShort}`,
        `${mood}的${sceneShort}`,
      ].filter(Boolean);
      text = isZh
        ? pick(rand, zhTitles)
        : `${scene.split(" ").slice(-1)[0]} ${mood}`;
      // 避免与已有标题重复
      if (songTitle && text === songTitle) continue;
    } else if (kind === "lyrics") {
      text = isZh
        ? `主题：${scene}里的${mood}\n副歌意象：${imagery}、${pick(rand, imageryPool)}\n情绪走向：从${pick(rand, moods)}到${mood}\n结构建议：主歌铺垫场景 → 预副歌转入心情 → 副歌点题 → 尾句留白`
        : `Theme: ${mood} in ${scene}\nChorus imagery: ${imagery}\nEmotional arc: from ${pick(rand, moods)} to ${mood}\nStructure: verse sets the scene → pre-chorus turns inward → chorus lands the hook → a quiet last line`;
    } else if (kind === "share") {
      const patterns = isZh ? ZH_SHARE_PATTERNS : EN_SHARE_PATTERNS;
      text = pick(rand, patterns)(
        title || (isZh ? "这首新歌" : "this new song"),
        scene,
        imagery,
      );
      const tags = isZh
        ? `\n\n#ZMusic #原创音乐${style ? ` #${style}` : ""}`
        : `\n\n#ZMusic #OriginalMusic${style ? ` #${style.replace(/\s+/g, "")}` : ""}`;
      text += tags;
    } else {
      // inspiration（默认）：用"在…，…"句式，避免连续"的"造成语病
      text = isZh
        ? `在${scene}，${imagery}，用${mood}的声音，让听众在最后一句里${ending}。${style ? `风格偏${style}。` : ""}`
        : `Picture ${scene}: ${imagery}, a ${mood} melody — let the last line help people ${ending}.${style ? ` Lean ${style}.` : ""}`;
    }

    // 若用户已有输入，把原意带进去，避免完全跑题
    if (seed && seed.trim() && kind === "inspiration") {
      text = isZh
        ? `${seed.trim().replace(/[。.]?\s*$/, "")}；画面是${scene}，${imagery}，情绪要${mood}。`
        : `${seed.trim().replace(/[。.]?\s*$/, "")} — frame it in ${scene}, anchor on ${imagery}, keep the mood ${mood}.`;
    }

    if (!used.has(text)) {
      used.add(text);
      out.push(text);
    }
  }

  return out;
}

/**
 * 生成候选文案（对外主入口）。
 *
 * @param {object} params
 * @param {string} [params.kind='inspiration'] 文案类型
 * @param {string} [params.seed=''] 用户当前输入
 * @param {string} [params.title=''] 歌曲标题
 * @param {string} [params.style=''] 音乐风格
 * @param {string} [params.lang='zh'] 语言
 * @param {number} [params.count=3] 候选数量（1~5）
 * @returns {Promise<{captions: string[], source: 'llm'|'local'}>}
 */
async function generateCaptions({
  kind = "inspiration",
  seed = "",
  title = "",
  style = "",
  lang = "zh",
  count = 3,
} = {}) {
  const safeCount = Math.max(1, Math.min(5, Number(count) || 3));

  // Level 1：配置了 LLM 时优先使用（当前项目默认未配置，自动落到 Level 2）
  if (config.llmApiKey && config.llmBaseUrl) {
    try {
      const llmCaptions = await requestLlmCaptions({
        kind,
        seed,
        title,
        style,
        lang,
        count: safeCount,
      });
      if (llmCaptions.length) return { captions: llmCaptions, source: "llm" };
    } catch (e) {
      logger.warn(`[AI 生词] LLM 生成失败，回退本地词池：${e.message}`);
    }
  }

  return {
    captions: buildLocalCaptions({
      kind,
      seed,
      title,
      style,
      lang,
      count: safeCount,
    }),
    source: "local",
  };
}

/**
 * 调用 OpenAI 兼容的 LLM 接口生成文案（Level 1，需配置 Key）。
 *
 * @param {object} opts 同 generateCaptions
 * @returns {Promise<string[]>}
 */
async function requestLlmCaptions({ kind, seed, title, style, lang, count }) {
  const kindHint =
    {
      inspiration: "歌曲灵感描述（一句话到两句话，200 字以内，具体画面感）",
      lyrics: "歌词创作方向（主题、意象、情绪走向、结构建议）",
      share: "社交平台发布文案（有故事感，结尾带 3 个话题标签）",
      title: "歌曲标题（不超过 10 个字，有画面感）",
    }[kind] || "歌曲相关文案";

  const prompt = `你是 ZMusic 的音乐文案助手。请生成 ${count} 条${kindHint}，语言：${lang === "en" ? "English" : "简体中文"}。
${seed ? `用户的原始想法：${seed}` : "用户还没写任何想法，请自由发挥一个音乐场景。"}
${title ? `歌曲标题：${title}` : ""}
${style ? `音乐风格：${style}` : ""}
只输出文案，每条之间用单独一行 "---" 分隔，不要编号。`;

  const res = await fetch(
    `${config.llmBaseUrl.replace(/\/+$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.llmApiKey}`,
      },
      body: JSON.stringify({
        model: config.llmModel || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
      }),
    },
  );

  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return text
    .split(/\n---\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, count);
}

export default {
  generateCaptions,
  buildLocalCaptions,
};
