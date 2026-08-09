/**
 * ContentService — Database-driven content management
 * 
 * Reads all configurable content from SQLite (genres, scene templates,
 * AI video tools, effects, palettes, music styles) and serves it via API.
 * Eliminates hardcoded arrays from frontend source code.
 */

import { getDb } from '../../scripts/content-db.mjs';

let _db = null;
function db() {
    if (!_db) _db = getDb();
    return _db;
}

export function getGenres() {
    return db().prepare('SELECT * FROM genres WHERE active=1 ORDER BY sort_order').all();
}

export function getSceneTemplates() {
    return db().prepare('SELECT * FROM scene_templates WHERE active=1 ORDER BY sort_order').all();
}

export function getAIVideoTools() {
    const rows = db().prepare('SELECT * FROM ai_video_tools WHERE active=1 ORDER BY sort_order').all();
    return rows.map(r => ({ ...r, features: JSON.parse(r.features || '[]') }));
}

export function getEffects() {
    return db().prepare('SELECT * FROM effects WHERE active=1 ORDER BY category, sort_order').all();
}

export function getStylePalettes() {
    return db().prepare('SELECT * FROM style_palettes WHERE active=1 ORDER BY sort_order').all();
}

export function getMusicStyles() {
    return db().prepare('SELECT * FROM music_styles WHERE active=1 ORDER BY genre_key').all();
}

export function getAll() {
    return {
        genres: getGenres(),
        sceneTemplates: getSceneTemplates(),
        aiVideoTools: getAIVideoTools(),
        effects: getEffects(),
        stylePalettes: getStylePalettes(),
        musicStyles: getMusicStyles(),
    };
}

export default { getGenres, getSceneTemplates, getAIVideoTools, getEffects, getStylePalettes, getMusicStyles, getAll };