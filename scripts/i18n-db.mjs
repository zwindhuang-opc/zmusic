/**
 * ZMusic i18n Database Manager
 * 
 * Uses better-sqlite3 for a real SQLite database as the source of truth
 * for all translations. Replaces fragile manual JSON editing.
 * 
 * Schema:
 *   translations(key, category, zh, en, validated, notes, created_at, updated_at)
 *   categories(name, description, required)
 * 
 * Usage:
 *   node scripts/i18n-db.mjs seed    — Import JSON → DB
 *   node scripts/i18n-db.mjs sync    — DB → JSON (with validation)
 *   node scripts/i18n-db.mjs validate— Check for missing/duplicate keys
 *   node scripts/i18n-db.mjs stats   — Show translation statistics
 */

import Database from 'better-sqlite3';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '../prisma/i18n.db');
const LOCALES_DIR = resolve(__dirname, '../src/i18n/locales');

// ============================================
// DATABASE INITIALIZATION
// ============================================

function initDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      zh TEXT NOT NULL DEFAULT '',
      en TEXT NOT NULL DEFAULT '',
      validated INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_translations_category ON translations(category);
    CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key);
    
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      required INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  return db;
}

// ============================================
// FLATTEN NESTED JSON TO DOT-NOTATION KEYS
// ============================================

function flattenJson(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenJson(value, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

// ============================================
// REBUILD NESTED JSON FROM DOT-NOTATION KEYS
// ============================================

function unflattenJson(flat) {
  const result = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

// ============================================
// SEED: Import JSON files → Database
// ============================================

function seed() {
  const db = initDb();
  
  const zhRaw = JSON.parse(readFileSync(resolve(LOCALES_DIR, 'zh.json'), 'utf-8'));
  const enRaw = JSON.parse(readFileSync(resolve(LOCALES_DIR, 'en.json'), 'utf-8'));
  
  const zhFlat = flattenJson(zhRaw);
  const enFlat = flattenJson(enRaw);
  
  const allKeys = new Set([...Object.keys(zhFlat), ...Object.keys(enFlat)]);
  
  // Get known categories from the i18n index.js VISION_CATEGORIES
  const knownCategories = new Set([
    'lyrics_styles', 'lyrics_themes', 'styles', 'themes',
    'styles_extra', 'themes_extra', 'vision_scenes',
    'emotions', 'subjects', 'actions', 'locations', 'imagery',
    'common', 'music', 'nav', 'lyrics', 'mv', 'image', 'dashboard',
    'settings', 'history', 'anna', 'vision', 'error'
  ]);
  
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, description, required) VALUES (?, ?, ?)');
  for (const cat of knownCategories) {
    insertCategory.run(cat, `${cat} translation category`, 1);
  }
  
  const upsertTranslation = db.prepare(`
    INSERT INTO translations (key, category, zh, en, validated, updated_at)
    VALUES (@key, @category, @zh, @en, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET
      category = @category,
      zh = @zh,
      en = @en,
      updated_at = CURRENT_TIMESTAMP
  `);
  
  let imported = 0;
  let updated = 0;
  
  const tx = db.transaction(() => {
    for (const key of allKeys) {
      const zh = zhFlat[key] || '';
      const en = enFlat[key] || '';
      const category = key.split('.')[0];
      
      // Auto-register unknown categories
      if (!knownCategories.has(category)) {
        insertCategory.run(category, `Auto-detected category: ${category}`, 1);
        knownCategories.add(category);
      }
      
      const existing = db.prepare('SELECT key FROM translations WHERE key = ?').get(key);
      upsertTranslation.run({ key, category, zh, en });
      
      if (existing) updated++;
      else imported++;
    }
  });
  
  tx();
  
  console.log(`✅ Seed complete: ${imported} imported, ${updated} updated, ${allKeys.size} total keys`);
  db.close();
}

// ============================================
// SYNC: Database → JSON files (with validation)
// ============================================

function sync() {
  const db = initDb();
  
  const errors = validate(db);
  if (errors.length > 0) {
    console.log(`\n❌ Validation found ${errors.length} issues:`);
    errors.forEach(e => console.log(`   ${e}`));
    console.log('\n⚠️  Syncing anyway, but please fix these issues.\n');
  }
  
  const rows = db.prepare('SELECT key, zh, en FROM translations ORDER BY key').all();
  
  const zhFlat = {};
  const enFlat = {};
  
  for (const row of rows) {
    if (row.zh) zhFlat[row.key] = row.zh;
    if (row.en) enFlat[row.key] = row.en;
  }
  
  const zhJson = unflattenJson(zhFlat);
  const enJson = unflattenJson(enFlat);
  
  writeFileSync(resolve(LOCALES_DIR, 'zh.json'), JSON.stringify(zhJson, null, 2) + '\n', 'utf-8');
  writeFileSync(resolve(LOCALES_DIR, 'en.json'), JSON.stringify(enJson, null, 2) + '\n', 'utf-8');
  
  console.log(`✅ Sync complete: ${rows.length} keys → zh.json + en.json`);
  db.close();
}

// ============================================
// VALIDATE: Check for issues
// ============================================

function validate(db) {
  const errors = [];
  
  // Check 1: Missing translations (zh or en empty)
  const missing = db.prepare("SELECT key, zh, en FROM translations WHERE zh = '' OR en = ''").all();
  for (const row of missing) {
    if (!row.zh) errors.push(`Missing zh: ${row.key}`);
    if (!row.en) errors.push(`Missing en: ${row.key}`);
  }
  
  // Check 2: Known typo patterns
  const typoRows = db.prepare("SELECT key FROM translations WHERE key LIKE '%thems%' OR key LIKE '%themses%'").all();
  for (const row of typoRows) {
    errors.push(`Typo detected: ${row.key} (should be "themes" not "thems")`);
  }
  
  // Check 3: Duplicate keys (shouldn't happen with UNIQUE constraint, but check)
  const dupes = db.prepare("SELECT key, COUNT(*) as cnt FROM translations GROUP BY key HAVING cnt > 1").all();
  for (const row of dupes) {
    errors.push(`Duplicate key: ${row.key} (${row.cnt} times)`);
  }
  
  // Check 4: Keys that exist in JSON but not in DB (orphaned)
  const zhRaw = JSON.parse(readFileSync(resolve(LOCALES_DIR, 'zh.json'), 'utf-8'));
  const enRaw = JSON.parse(readFileSync(resolve(LOCALES_DIR, 'en.json'), 'utf-8'));
  const zhFlat = flattenJson(zhRaw);
  const enFlat = flattenJson(enRaw);
  
  const jsonKeys = new Set([...Object.keys(zhFlat), ...Object.keys(enFlat)]);
  const dbKeys = new Set(db.prepare('SELECT key FROM translations').all().map(r => r.key));
  
  for (const key of jsonKeys) {
    if (!dbKeys.has(key)) {
      errors.push(`Orphaned key in JSON (not in DB): ${key}`);
    }
  }
  
  return errors;
}

// ============================================
// STATS: Show translation statistics
// ============================================

function stats() {
  const db = initDb();
  
  const total = db.prepare('SELECT COUNT(*) as cnt FROM translations').get().cnt;
  const validated = db.prepare('SELECT COUNT(*) as cnt FROM translations WHERE validated = 1').get().cnt;
  const missingZh = db.prepare("SELECT COUNT(*) as cnt FROM translations WHERE zh = ''").get().cnt;
  const missingEn = db.prepare("SELECT COUNT(*) as cnt FROM translations WHERE en = ''").get().cnt;
  
  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as cnt 
    FROM translations 
    GROUP BY category 
    ORDER BY cnt DESC
  `).all();
  
  console.log('\n📊 ZMusic i18n Database Statistics');
  console.log('═══════════════════════════════════');
  console.log(`Total keys:      ${total}`);
  console.log(`Validated:       ${validated}/${total} (${Math.round(validated/total*100)}%)`);
  console.log(`Missing zh:      ${missingZh}`);
  console.log(`Missing en:      ${missingEn}`);
  console.log('\nBy category:');
  for (const row of byCategory) {
    console.log(`  ${row.category.padEnd(20)} ${row.cnt}`);
  }
  
  const errors = validate(db);
  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} validation issues found. Run 'node scripts/i18n-db.mjs validate' for details.`);
  } else {
    console.log('\n✅ All validations passed!');
  }
  
  db.close();
}

// ============================================
// VALIDATE COMMAND
// ============================================

function validateCmd() {
  const db = initDb();
  const errors = validate(db);
  
  if (errors.length === 0) {
    console.log('✅ All translations validated successfully! No issues found.');
  } else {
    console.log(`❌ Found ${errors.length} validation issues:`);
    errors.forEach(e => console.log(`   ${e}`));
    process.exit(1);
  }
  
  db.close();
}

// ============================================
// MAIN
// ============================================

const command = process.argv[2];

switch (command) {
  case 'seed':
    console.log('🌱 Seeding database from JSON files...');
    seed();
    break;
  case 'sync':
    console.log('🔄 Syncing database → JSON files...');
    sync();
    break;
  case 'validate':
    console.log('🔍 Validating translations...');
    validateCmd();
    break;
  case 'stats':
    stats();
    break;
  default:
    console.log('Usage: node scripts/i18n-db.mjs <seed|sync|validate|stats>');
    console.log('');
    console.log('Commands:');
    console.log('  seed      Import JSON files → SQLite database');
    console.log('  sync      Export database → JSON files (with validation)');
    console.log('  validate  Check for missing keys, typos, duplicates');
    console.log('  stats     Show translation statistics');
}
