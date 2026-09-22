/**
 * AuthDB — Persistent storage for users, sessions, SMS verification codes
 * Uses better-sqlite3 for zero-config local persistence.
 */

import Logger from '../utils/logger.js';
import { createHash, randomBytes } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import Database from 'better-sqlite3';

const logger = new Logger('AuthDB');

const __dirname = (typeof import.meta !== 'undefined' && import.meta.url)
  ? dirname(fileURLToPath(import.meta.url))
  : process.cwd();

const DB_DIR = join(process.cwd(), 'data');
const DB_PATH = join(DB_DIR, 'zmusic_auth.db');

let db = null;
let stmt = {};

function hashPassword(plain) {
  return createHash('sha256').update('zmusic::' + String(plain || '')).digest('hex');
}

function genId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${randomBytes(5).toString('hex')}`;
}

export function initAuthDB() {
  if (db) return db;

  if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL DEFAULT '',
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT,
      avatar TEXT,
      settings TEXT DEFAULT '{}',
      registered_by TEXT NOT NULL DEFAULT 'email',   -- 'email' | 'phone'
      phone_verified INTEGER NOT NULL DEFAULT 0,
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      ip TEXT,
      ua TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS sms_codes (
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      purpose TEXT NOT NULL,                   -- 'register' | 'login' | 'reset'
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      used INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (phone, purpose)
    );
  `);

  stmt = {
    getUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
    getUserByEmail: db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)'),
    getUserByPhone: db.prepare('SELECT * FROM users WHERE phone = ?'),
    createUser: db.prepare(`INSERT INTO users
      (id, username, email, phone, password_hash, registered_by, phone_verified, email_verified, created_at)
      VALUES (@id, @username, @email, @phone, @password_hash, @registered_by, @phone_verified, @email_verified, @created_at)`),
    updateUser: db.prepare(`UPDATE users SET
      username = COALESCE(@username, username),
      avatar = COALESCE(@avatar, avatar),
      settings = COALESCE(@settings, settings),
      phone_verified = COALESCE(@phone_verified, phone_verified),
      email_verified = COALESCE(@email_verified, email_verified),
      updated_at = @updated_at
      WHERE id = @id`),
    setPhoneVerified: db.prepare('UPDATE users SET phone_verified = 1, updated_at = ? WHERE id = ?'),
    setPassword: db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'),
    deleteSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
    createSession: db.prepare(`INSERT INTO sessions
      (token, user_id, created_at, expires_at, ip, ua)
      VALUES (?, ?, ?, ?, ?, ?)`),
    getSession: db.prepare('SELECT * FROM sessions WHERE token = ?'),
    getSmsCode: db.prepare(`SELECT * FROM sms_codes
      WHERE phone = ? AND purpose = ? AND used = 0`),
    upsertSmsCode: db.prepare(`INSERT INTO sms_codes
      (phone, code, purpose, created_at, expires_at, attempts, used)
      VALUES (@phone, @code, @purpose, @created_at, @expires_at, 0, 0)
      ON CONFLICT(phone, purpose) DO UPDATE SET
        code = excluded.code,
        created_at = excluded.created_at,
        expires_at = excluded.expires_at,
        attempts = 0,
        used = 0`),
    incSmsAttempts: db.prepare(`UPDATE sms_codes SET attempts = attempts + 1
      WHERE phone = ? AND purpose = ? AND used = 0`),
    useSmsCode: db.prepare(`UPDATE sms_codes SET used = 1
      WHERE phone = ? AND purpose = ? AND used = 0`),
    cleanExpiredSessions: db.prepare('DELETE FROM sessions WHERE expires_at < ?'),
    cleanExpiredSms: db.prepare('DELETE FROM sms_codes WHERE expires_at < ?'),
  };

  // Periodically clean expired rows
  setInterval(() => {
    try {
      const now = new Date().toISOString();
      stmt.cleanExpiredSessions.run(now);
      stmt.cleanExpiredSms.run(now);
    } catch (_) { /* ignore */ }
  }, 3600_000).unref();

  logger.info(`AuthDB initialized at ${DB_PATH}`);
  return db;
}

// ============== USER HELPERS ==============

function safeUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  try { rest.settings = JSON.parse(rest.settings || '{}'); } catch(_) { rest.settings = {}; }
  return rest;
}

export function findUserByEmail(email) {
  initAuthDB();
  if (!email) return null;
  return safeUser(stmt.getUserByEmail.get(String(email).trim().toLowerCase()));
}

export function findUserByPhone(phone) {
  initAuthDB();
  if (!phone) return null;
  return safeUser(stmt.getUserByPhone.get(String(phone).trim()));
}

export function findUserById(id) {
  initAuthDB();
  return safeUser(stmt.getUserById.get(id));
}

export function createUser({ username, email, phone, password, registeredBy }) {
  initAuthDB();
  const now = new Date().toISOString();
  const user = {
    id: genId('user'),
    username: String(username || (email ? email.split('@')[0] : phone) || 'User').slice(0, 32),
    email: email ? String(email).trim().toLowerCase() : null,
    phone: phone ? String(phone).trim() : null,
    password_hash: password ? hashPassword(password) : null,
    registered_by: registeredBy || (email ? 'email' : 'phone'),
    phone_verified: registeredBy === 'phone' ? 1 : 0,
    email_verified: 0,
    created_at: now,
  };
  stmt.createUser.run(user);
  return safeUser(stmt.getUserById.get(user.id));
}

export function verifyUserPassword(userId, plainPassword) {
  initAuthDB();
  const user = stmt.getUserById.get(userId);
  if (!user || !user.password_hash) return false;
  return hashPassword(plainPassword) === user.password_hash;
}

export function changeUserPassword(userId, newPassword) {
  initAuthDB();
  stmt.setPassword.run(hashPassword(newPassword), new Date().toISOString(), userId);
  return true;
}

export function markPhoneVerified(userId) {
  initAuthDB();
  stmt.setPhoneVerified.run(new Date().toISOString(), userId);
  return true;
}

// ============== SESSION HELPERS ==============

export function createSession(userId, { ip, ua } = {}) {
  initAuthDB();
  const token = `sess_${randomBytes(24).toString('hex')}`;
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 3600 * 1000); // 30 days
  stmt.createSession.run(
    token, userId,
    now.toISOString(), expires.toISOString(),
    ip || null, ua ? String(ua).slice(0, 500) : null
  );
  return { token, expiresAt: expires.toISOString() };
}

export function getSession(token) {
  initAuthDB();
  if (!token) return null;
  const s = stmt.getSession.get(token);
  if (!s) return null;
  if (new Date(s.expires_at).getTime() < Date.now()) {
    stmt.deleteSession.run(token);
    return null;
  }
  return s;
}

export function destroySession(token) {
  initAuthDB();
  stmt.deleteSession.run(token);
  return true;
}

// ============== SMS CODE HELPERS ==============

export function generateSmsCode() {
  // 6-digit numeric code, good UX and acceptable security (expires quickly)
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function saveSmsCode(phone, purpose) {
  initAuthDB();
  const code = generateSmsCode();
  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
  stmt.upsertSmsCode.run({
    phone: String(phone).trim(),
    code,
    purpose: String(purpose),
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
  });
  return code;
}

export function verifySmsCode(phone, purpose, userCode) {
  initAuthDB();
  const row = stmt.getSmsCode.get(String(phone).trim(), String(purpose));
  if (!row) return { ok: false, reason: 'NO_CODE' };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'EXPIRED' };
  if (row.attempts >= 5) return { ok: false, reason: 'ATTEMPTS_EXCEEDED' };
  stmt.incSmsAttempts.run(phone, purpose);
  if (String(userCode).trim() !== row.code) return { ok: false, reason: 'INVALID' };
  stmt.useSmsCode.run(phone, purpose);
  return { ok: true };
}

export { hashPassword, genId };
export default {
  initAuthDB,
  findUserByEmail, findUserByPhone, findUserById,
  createUser, verifyUserPassword, changeUserPassword, markPhoneVerified,
  createSession, getSession, destroySession,
  generateSmsCode, saveSmsCode, verifySmsCode,
};
