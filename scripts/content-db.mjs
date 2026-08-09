/**
 * ZMusic Content Database Manager
 * 
 * Manages all configurable content in SQLite (genres, styles, effects,
 * scene templates, AI video tools, mock songs). Replaces hardcoded arrays
 * in source code with a proper database-driven content management system.
 * 
 * Uses the same prisma/i18n.db database, extending it with content tables.
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '../prisma/i18n.db');

function getDb() {
    const dbDir = dirname(DB_PATH);
    if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
    }
    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initContentTables(db);
    return db;
}

function initContentTables(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      label_zh TEXT NOT NULL,
      label_en TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scene_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      label_zh TEXT NOT NULL,
      label_en TEXT NOT NULL,
      icon TEXT,
      prompt TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ai_video_tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      url TEXT,
      description_zh TEXT,
      description_en TEXT,
      features TEXT,
      pricing TEXT,
      best_for_zh TEXT,
      best_for_en TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS effects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      label_zh TEXT NOT NULL,
      label_en TEXT NOT NULL,
      category TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS style_palettes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      label_zh TEXT NOT NULL,
      label_en TEXT NOT NULL,
      colors TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );
  `);

    // music_styles needs UNIQUE on genre_key — drop and recreate if needed
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='music_styles'").get();
    if (tables) {
        const cols = db.prepare("PRAGMA table_info(music_styles)").all();
        const genreKeyCol = cols.find(c => c.name === 'genre_key');
        const hasUnique = genreKeyCol && genreKeyCol.notnull === 1; // not reliable
        const indexList = db.prepare("SELECT * FROM sqlite_master WHERE tbl_name='music_styles' AND type='index'").all();
        const hasUniqueIdx = indexList.some(idx => idx.sql && idx.sql.includes('UNIQUE') && idx.sql.includes('genre_key'));
        if (!hasUniqueIdx) {
            db.exec(`DROP TABLE IF EXISTS music_styles`);
        }
    }

    db.exec(`
    CREATE TABLE IF NOT EXISTS music_styles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      genre_key TEXT NOT NULL UNIQUE,
      style_name TEXT NOT NULL,
      style_suno TEXT,
      style_muse TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );
  `);

    db.exec(`
    CREATE INDEX IF NOT EXISTS idx_genres_key ON genres(key);
    CREATE INDEX IF NOT EXISTS idx_scene_templates_key ON scene_templates(key);
    CREATE INDEX IF NOT EXISTS idx_ai_video_tools_key ON ai_video_tools(key);
    CREATE INDEX IF NOT EXISTS idx_effects_key ON effects(key);
    CREATE INDEX IF NOT EXISTS idx_style_palettes_key ON style_palettes(key);
    CREATE INDEX IF NOT EXISTS idx_music_styles_genre ON music_styles(genre_key);
  `);
}

const SEED_DATA = {
    genres: [
        { key: 'pop', zh: '流行', en: 'Pop', order: 1 },
        { key: 'rock', zh: '摇滚', en: 'Rock', order: 2 },
        { key: 'electronic', zh: '电子', en: 'Electronic', order: 3 },
        { key: 'hip_hop', zh: '嘻哈', en: 'Hip Hop', order: 4 },
        { key: 'ballad', zh: '民谣', en: 'Ballad', order: 5 },
        { key: 'chinese_traditional', zh: '中国风', en: 'Chinese Traditional', order: 6 },
        { key: 'jazz', zh: '爵士', en: 'Jazz', order: 7 },
        { key: 'classical', zh: '古典', en: 'Classical', order: 8 },
        { key: 'rnb', zh: 'R&B', en: 'R&B', order: 9 },
        { key: 'country', zh: '乡村', en: 'Country', order: 10 },
        { key: 'love_song', zh: '情歌', en: 'Love Song', order: 11 },
        { key: 'chinese_classical', zh: '古风', en: 'Chinese Classical', order: 12 },
        { key: 'concert', zh: '演唱会', en: 'Concert', order: 13 },
        { key: 'modern', zh: '现代', en: 'Modern', order: 14 },
        { key: 'cinematic', zh: '电影配乐', en: 'Cinematic', order: 15 },
        { key: 'retro', zh: '复古', en: 'Retro', order: 16 },
        { key: 'anime', zh: '动漫', en: 'Anime', order: 17 },
        { key: 'gothic_rock', zh: '哥特摇滚', en: 'Gothic Rock', order: 18 },
    ],

    scene_templates: [
        {
            key: 'cinematic_concert', zh: '电影演唱会', en: 'Cinematic Concert',
            icon: 'Users', prompt: 'Cinematic concert stage with dramatic lighting, crowd silhouettes, sweeping camera moves',
            order: 1
        },
        {
            key: 'neon_city', zh: '霓虹都市', en: 'Neon City',
            icon: 'Cloud', prompt: 'Cyberpunk neon city at night, rain reflections, dynamic camera angles',
            order: 2
        },
        {
            key: 'dreamy_pastel', zh: '梦幻粉彩', en: 'Dreamy Pastel',
            icon: 'Sparkles', prompt: 'Dreamy pastel aesthetic, soft lighting, ethereal atmosphere, floating particles',
            order: 3
        },
        {
            key: 'epic_fantasy', zh: '史诗奇幻', en: 'Epic Fantasy',
            icon: 'Sparkles', prompt: 'Epic fantasy landscape, magical effects, golden hour, dramatic scale',
            order: 4
        },
        {
            key: 'dark_moody', zh: '暗黑氛围', en: 'Dark Moody',
            icon: 'Moon', prompt: 'Dark moody atmosphere, low lighting, shadow play, intense emotions',
            order: 5
        },
        {
            key: 'summer_vibes', zh: '夏日氛围', en: 'Summer Vibes',
            icon: 'Sun', prompt: 'Summer beach vibes, golden sunlight, waves, carefree atmosphere',
            order: 6
        },
    ],

    ai_video_tools: [
        {
            key: 'freebeat', name: 'Freebeat', icon: 'Film',
            url: 'https://freebeat.ai',
            desc_zh: 'AI 音乐视频代理——节拍同步，完整歌曲输出',
            desc_en: 'AI music video agent — beat-synced, full-song output',
            features: ['Full-song video', 'Beat sync', 'Suno import', 'Lip sync'],
            pricing: 'Free tier + $4.99/week',
            best_zh: '完整歌曲到视频', best_en: 'Complete song-to-video',
            order: 1
        },
        {
            key: 'neuralframes', name: 'Neural Frames', icon: 'Brain',
            url: 'https://play.neuralframes.com',
            desc_zh: '8声道音频分析，AI 视频生成',
            desc_en: '8-stem audio analysis, AI video generation',
            features: ['8-stem analysis', 'Autopilot mode', 'Kling/Seedance/Runway'],
            pricing: '$26/mo',
            best_zh: '音频反应视觉', best_en: 'Audio-reactive visuals',
            order: 2
        },
        {
            key: 'kaiber', name: 'Kaiber', icon: 'Palette',
            url: 'https://kaiber.ai',
            desc_zh: '风格化艺术音乐视频，节拍同步',
            desc_en: 'Stylized artistic music videos with beat sync',
            features: ['Beat Sync', 'Flipbook/Motion modes', 'Stylized visuals'],
            pricing: '$10/mo',
            best_zh: '艺术风格视频', best_en: 'Artistic/Stylized videos',
            order: 3
        },
        {
            key: 'fal', name: 'fal.ai (Hunyuan)', icon: 'Zap',
            url: 'https://fal.ai/models/fal-ai/hunyuan-video',
            desc_zh: '腾讯混元视频——开源，高质量',
            desc_en: 'Tencent Hunyuan Video — open source, high quality',
            features: ['720p', '5s clips', '$0.4/video', 'Commercial OK'],
            pricing: 'Pay-per-use',
            best_zh: 'API 集成', best_en: 'API integration',
            order: 4
        },
        {
            key: 'runway', name: 'Runway Gen-4', icon: 'Clapperboard',
            url: 'https://runwayml.com',
            desc_zh: '电影级 AI 剪辑，导演控制',
            desc_en: 'Cinematic AI clips with director control',
            features: ['Motion Brush', 'Camera control', '4K quality'],
            pricing: 'From $12/mo',
            best_zh: '电影级剪辑', best_en: 'Cinematic clips',
            order: 5
        },
        {
            key: 'kling', name: 'Kling AI', icon: 'Camera',
            url: 'https://klingai.com',
            desc_zh: '平价长视频，强人体动作',
            desc_en: 'Affordable, longer videos, strong human motion',
            features: ['~3min clips', 'Lip sync', 'Multi-shot'],
            pricing: 'From $6.99/mo',
            best_zh: '角色表演', best_en: 'Character performance',
            order: 6
        },
    ],

    effects: [
        { key: 'rain_wind', zh: '风雨', en: 'Rain & Wind', category: 'ambient', order: 1 },
        { key: 'footsteps', zh: '脚步声', en: 'Footsteps', category: 'ambient', order: 2 },
        { key: 'reverb', zh: '混响', en: 'Reverb', category: 'audio', order: 3 },
        { key: 'delay', zh: '延迟', en: 'Delay', category: 'audio', order: 4 },
        { key: 'di_da_delay', zh: '滴答延迟', en: 'Di-Da Delay', category: 'audio', order: 5 },
        { key: 'shimmer_reverb', zh: '闪光混响', en: 'Shimmer Reverb', category: 'audio', order: 6 },
        { key: 'vocals', zh: '人声', en: 'Vocals', category: 'vocal', order: 7 },
        { key: 'tropical_percussion', zh: '热带打击', en: 'Tropical Percussion', category: 'percussion', order: 8 },
        { key: 'bass_line', zh: '低音线', en: 'Bass Line', category: 'instrument', order: 9 },
        { key: 'guitar_riffs', zh: '吉他即兴', en: 'Guitar Riffs', category: 'instrument', order: 10 },
        { key: 'ambient_pads', zh: '氛围垫', en: 'Ambient Pads', category: 'instrument', order: 11 },
        { key: 'modulation', zh: '调制', en: 'Modulation', category: 'audio', order: 12 },
    ],

    style_palettes: [
        { key: 'purple_pink_gradient', zh: '紫粉渐变', en: 'Purple-Pink Gradient', colors: '["#8B5CF6","#EC4899"]', order: 1 },
        { key: 'red_black_contrast', zh: '红黑对比', en: 'Red-Black Contrast', colors: '["#DC2626","#000000"]', order: 2 },
        { key: 'gold_red_jade', zh: '金红翠', en: 'Gold-Red-Jade', colors: '["#D97706","#DC2626","#059669"]', order: 3 },
        { key: 'neon_cyber', zh: '霓虹赛博', en: 'Neon Cyber', colors: '["#06B6D4","#8B5CF6","#EC4899"]', order: 4 },
        { key: 'urban_gold', zh: '都市金色', en: 'Urban Gold', colors: '["#D97706","#78716C","#0F172A"]', order: 5 },
        { key: 'soft_pastel', zh: '柔和粉彩', en: 'Soft Pastel', colors: '["#F9A8D4","#C4B5FD","#93C5FD"]', order: 6 },
    ],

    music_styles: [
        { genre: 'pop', style_name: '流行音乐', style_suno: 'pop', style_muse: '流行音乐' },
        { genre: 'rock', style_name: '摇滚', style_suno: 'rock', style_muse: '摇滚' },
        { genre: 'electronic', style_name: '电子音乐', style_suno: 'electronic', style_muse: '电子音乐' },
        { genre: 'hip_hop', style_name: '嘻哈/说唱', style_suno: 'hip-hop', style_muse: '嘻哈/说唱' },
        { genre: 'ballad', style_name: '民谣', style_suno: 'ballad', style_muse: '民谣' },
        { genre: 'chinese_traditional', style_name: '中国风', style_suno: 'chinese', style_muse: '中国风' },
        { genre: 'jazz', style_name: '爵士', style_suno: 'jazz', style_muse: '爵士' },
        { genre: 'classical', style_name: '古典', style_suno: 'classical', style_muse: '古典' },
        { genre: 'rnb', style_name: 'R&B', style_suno: 'rnb', style_muse: 'R&B' },
        { genre: 'country', style_name: '乡村', style_suno: 'country', style_muse: '乡村' },
        { genre: 'love_song', style_name: '情歌', style_suno: 'pop', style_muse: '情歌' },
        { genre: 'chinese_classical', style_name: '古风', style_suno: 'chinese', style_muse: '古风' },
    ],
};

function seedContent(db) {
    const results = { genres: 0, templates: 0, tools: 0, effects: 0, palettes: 0, styles: 0 };

    const upsertGenre = db.prepare(`
    INSERT INTO genres (key, label_zh, label_en, sort_order)
    VALUES (@key, @zh, @en, @order)
    ON CONFLICT(key) DO UPDATE SET label_zh=@zh, label_en=@en, sort_order=@order
  `);
    for (const g of SEED_DATA.genres) {
        upsertGenre.run({ key: g.key, zh: g.zh, en: g.en, order: g.order });
        results.genres++;
    }

    const upsertTemplate = db.prepare(`
    INSERT INTO scene_templates (key, label_zh, label_en, icon, prompt, sort_order)
    VALUES (@key, @zh, @en, @icon, @prompt, @order)
    ON CONFLICT(key) DO UPDATE SET label_zh=@zh, label_en=@en, icon=@icon, prompt=@prompt, sort_order=@order
  `);
    for (const t of SEED_DATA.scene_templates) {
        upsertTemplate.run({ key: t.key, zh: t.zh, en: t.en, icon: t.icon, prompt: t.prompt, order: t.order });
        results.templates++;
    }

    const upsertTool = db.prepare(`
    INSERT INTO ai_video_tools (key, name, icon, url, description_zh, description_en, features, pricing, best_for_zh, best_for_en, sort_order)
    VALUES (@key, @name, @icon, @url, @descZh, @descEn, @features, @pricing, @bestZh, @bestEn, @order)
    ON CONFLICT(key) DO UPDATE SET name=@name, icon=@icon, url=@url, description_zh=@descZh, description_en=@descEn, features=@features, pricing=@pricing, best_for_zh=@bestZh, best_for_en=@bestEn, sort_order=@order
  `);
    for (const t of SEED_DATA.ai_video_tools) {
        upsertTool.run({
            key: t.key, name: t.name, icon: t.icon, url: t.url,
            descZh: t.desc_zh, descEn: t.desc_en,
            features: JSON.stringify(t.features), pricing: t.pricing,
            bestZh: t.best_zh, bestEn: t.best_en, order: t.order
        });
        results.tools++;
    }

    const upsertEffect = db.prepare(`
    INSERT INTO effects (key, label_zh, label_en, category, sort_order)
    VALUES (@key, @zh, @en, @category, @order)
    ON CONFLICT(key) DO UPDATE SET label_zh=@zh, label_en=@en, category=@category, sort_order=@order
  `);
    for (const e of SEED_DATA.effects) {
        upsertEffect.run({ key: e.key, zh: e.zh, en: e.en, category: e.category, order: e.order });
        results.effects++;
    }

    const upsertPalette = db.prepare(`
    INSERT INTO style_palettes (key, label_zh, label_en, colors, sort_order)
    VALUES (@key, @zh, @en, @colors, @order)
    ON CONFLICT(key) DO UPDATE SET label_zh=@zh, label_en=@en, colors=@colors, sort_order=@order
  `);
    for (const p of SEED_DATA.style_palettes) {
        upsertPalette.run({ key: p.key, zh: p.zh, en: p.en, colors: p.colors, order: p.order });
        results.palettes++;
    }

    const upsertStyle = db.prepare(`
    INSERT INTO music_styles (genre_key, style_name, style_suno, style_muse)
    VALUES (@genre, @name, @suno, @muse)
    ON CONFLICT(genre_key) DO UPDATE SET style_name=@name, style_suno=@suno, style_muse=@muse
  `);
    for (const s of SEED_DATA.music_styles) {
        upsertStyle.run({ genre: s.genre, name: s.style_name, suno: s.style_suno, muse: s.style_muse });
        results.styles++;
    }

    return results;
}

function readContent(db, table) {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE active=1 ORDER BY sort_order`).all();
    return rows;
}

function stats(db) {
    return {
        genres: db.prepare('SELECT COUNT(*) as c FROM genres').get().c,
        scene_templates: db.prepare('SELECT COUNT(*) as c FROM scene_templates').get().c,
        ai_video_tools: db.prepare('SELECT COUNT(*) as c FROM ai_video_tools').get().c,
        effects: db.prepare('SELECT COUNT(*) as c FROM effects').get().c,
        style_palettes: db.prepare('SELECT COUNT(*) as c FROM style_palettes').get().c,
        music_styles: db.prepare('SELECT COUNT(*) as c FROM music_styles').get().c,
    };
}

const cmd = process.argv[2];

if (cmd === 'seed') {
    const db = getDb();
    const results = seedContent(db);
    console.log('🌱 Content seed complete:');
    console.log(`  Genres:         ${results.genres}`);
    console.log(`  Scene templates: ${results.templates}`);
    console.log(`  AI video tools:  ${results.tools}`);
    console.log(`  Effects:         ${results.effects}`);
    console.log(`  Style palettes:  ${results.palettes}`);
    console.log(`  Music styles:    ${results.styles}`);
    db.close();
} else if (cmd === 'stats') {
    const db = getDb();
    const s = stats(db);
    console.log('📊 Content database stats:');
    for (const [k, v] of Object.entries(s)) {
        console.log(`  ${k}: ${v}`);
    }
    db.close();
} else if (cmd === 'read') {
    const db = getDb();
    const table = process.argv[3];
    if (!table) {
        console.log('Usage: node content-db.mjs read <table>');
        console.log('Tables: genres, scene_templates, ai_video_tools, effects, style_palettes, music_styles');
        process.exit(1);
    }
    const rows = readContent(db, table);
    console.log(JSON.stringify(rows, null, 2));
    db.close();
} else {
    console.log('Usage:');
    console.log('  node content-db.mjs seed   — Seed all content');
    console.log('  node content-db.mjs stats  — Show content statistics');
    console.log('  node content-db.mjs read <table> — Read table data');
}

export { getDb, seedContent, readContent, stats };