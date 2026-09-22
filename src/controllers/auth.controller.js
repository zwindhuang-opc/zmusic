/**
 * AuthController — full account management backend
 *
 * Endpoints:
 *   POST /api/auth/register          — email+password register (or phone+sms)
 *   POST /api/auth/login             — email+password login (or phone+password, phone+sms)
 *   POST /api/auth/sms/send          — send 6-digit SMS code (before register/login/reset)
 *   POST /api/auth/sms/verify        — verify SMS code (returns oneTimeToken)
 *   POST /api/auth/logout            — invalidate current session
 *   GET  /api/auth/me                — fetch current user via Bearer token
 *   POST /api/auth/password/change   — change password (logged-in user)
 *   POST /api/auth/password/reset    — reset password via phone+SMS code
 */

import Logger from '../utils/logger.js';
import db, {
  initAuthDB,
  findUserByEmail, findUserByPhone, findUserById,
  createUser, verifyUserPassword, changeUserPassword, markPhoneVerified,
  createSession, getSession, destroySession,
  saveSmsCode, verifySmsCode,
} from '../services/authdb.service.js';
import { sendSms, getSmsProvider } from '../services/sms.service.js';

const logger = new Logger('AuthController');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Rough phone validator: supports +86 / 13x / other internationals with + prefix
const PHONE_RE = /^(\+\d{1,4})?\d{8,15}$/;
const VALID_PURPOSES = new Set(['register', 'login', 'reset']);

function getIp(req) {
  const fwd = req.headers?.['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || null;
}
function getUa(req) {
  return req.headers?.['user-agent'] || null;
}

function normalizePhone(phone) {
  if (!phone) return '';
  const cleaned = String(phone).replace(/[\s\-()]/g, '');
  // Chinese 1xx numbers without prefix → add +86
  if (/^1[3-9]\d{9}$/.test(cleaned)) return `+86${cleaned}`;
  return cleaned;
}

function parseBearer(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || '';
  const s = String(h).replace(/^Bearer\s+/i, '').trim();
  return s || null;
}

// Errors that are returned to the browser (CN/EN bilingual — follows existing
// error pattern in muse/melo controllers).
const ERR = {
  EMAIL_REQUIRED:    { zh: '请输入邮箱',     en: 'Email is required' },
  EMAIL_INVALID:     { zh: '邮箱格式不正确', en: 'Invalid email format' },
  EMAIL_EXISTS:      { zh: '该邮箱已注册',   en: 'Email already registered' },
  EMAIL_NOT_FOUND:   { zh: '账号不存在',     en: 'Account not found' },
  PHONE_REQUIRED:    { zh: '请输入手机号',   en: 'Phone number is required' },
  PHONE_INVALID:     { zh: '手机号格式不正确', en: 'Invalid phone number' },
  PHONE_EXISTS:      { zh: '该手机号已注册', en: 'Phone already registered' },
  PHONE_NOT_FOUND:   { zh: '手机号未注册账号', en: 'No account with that phone' },
  PWD_REQUIRED:      { zh: '请输入密码',     en: 'Password is required' },
  PWD_TOO_SHORT:     { zh: '密码至少 6 位',  en: 'Password must be at least 6 chars' },
  PWD_MISMATCH:      { zh: '邮箱或密码错误', en: 'Invalid email or password' },
  SMS_CODE_REQUIRED: { zh: '请输入短信验证码', en: 'SMS code is required' },
  SMS_INVALID:       { zh: '验证码错误',     en: 'Invalid SMS code' },
  SMS_EXPIRED:       { zh: '验证码已过期',   en: 'SMS code expired' },
  SMS_RATE_LIMIT:    { zh: '请稍后再获取验证码', en: 'Please wait before resending code' },
  SMS_SEND_FAIL:     { zh: '短信发送失败',   en: 'Failed to send SMS' },
  SMS_PURPOSE:       { zh: '用途无效',       en: 'Invalid purpose' },
  NEED_CODE:         { zh: '请先通过短信验证', en: 'Please complete SMS verification first' },
  NO_LOGIN_METHOD:   { zh: '请提供邮箱或手机号', en: 'Please provide email or phone' },
  UNAUTHORIZED:      { zh: '未登录',         en: 'Unauthorized' },
  INTERNAL:          { zh: '服务器内部错误', en: 'Internal error' },
};

function errorRes(res, status, code, err) {
  return res.status(status).json({
    success: false,
    error: code,
    message_zh: ERR[code]?.zh || err?.message || code,
    message_en: ERR[code]?.en || err?.message || code,
    ...(process.env.NODE_ENV === 'development' && err ? { _dev: String(err?.message || err).slice(0, 200) } : {}),
  });
}

// ---------------------------------------------------------------------------
// Init DB on first use
// ---------------------------------------------------------------------------
function ensureDB() {
  initAuthDB();
}

// ---------------------------------------------------------------------------
// POST /api/auth/sms/send
// Body: { phone, purpose: 'register' | 'login' | 'reset', lang: 'zh'|'en' }
// ---------------------------------------------------------------------------
export async function sendSmsCode(req, res) {
  ensureDB();
  const { phone, purpose = 'register', lang } = req.body || {};
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone)  return errorRes(res, 400, 'PHONE_REQUIRED');
  if (!PHONE_RE.test(normalizedPhone)) return errorRes(res, 400, 'PHONE_INVALID');
  if (!VALID_PURPOSES.has(purpose)) return errorRes(res, 400, 'SMS_PURPOSE');

  // Register → phone must NOT exist already
  if (purpose === 'register') {
    const existing = findUserByPhone(normalizedPhone);
    if (existing) return errorRes(res, 409, 'PHONE_EXISTS');
  }
  // Login/Reset → phone must exist
  if (purpose === 'login' || purpose === 'reset') {
    const existing = findUserByPhone(normalizedPhone);
    if (!existing) return errorRes(res, 404, 'PHONE_NOT_FOUND');
  }

  const code = saveSmsCode(normalizedPhone, purpose);
  const result = await sendSms({ phone: normalizedPhone, code, purpose, lang });
  if (!result.ok) return errorRes(res, 502, 'SMS_SEND_FAIL', new Error(result.detail || 'provider error'));

  logger.info(`SMS sent to ${normalizedPhone} (purpose=${purpose}, provider=${result.provider})`);
  return res.json({
    success: true,
    provider: result.provider,
    // DEV mode ONLY: include the code itself so the frontend can pre-fill it
    // for easy testing.  NEVER present in production providers.
    devCode: result.devCode || undefined,
    expiresInSeconds: 600,
  });
}

// ---------------------------------------------------------------------------
// POST /api/auth/sms/verify
// Body: { phone, purpose, code }   →  Returns { success: true, oneTimeToken }
// ---------------------------------------------------------------------------
export async function verifySms(req, res) {
  ensureDB();
  const { phone, purpose = 'register', code } = req.body || {};
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone)  return errorRes(res, 400, 'PHONE_REQUIRED');
  if (!code) return errorRes(res, 400, 'SMS_CODE_REQUIRED');

  const result = verifySmsCode(normalizedPhone, purpose, code);
  if (!result.ok) {
    const errs = { INVALID: 'SMS_INVALID', EXPIRED: 'SMS_EXPIRED', NO_CODE: 'SMS_INVALID', ATTEMPTS_EXCEEDED: 'SMS_RATE_LIMIT' };
    return errorRes(res, 401, errs[result.reason] || 'SMS_INVALID');
  }

  // Create a short-lived one-time token so caller can complete
  // register/login without re-submitting the SMS code.
  const ott = JSON.stringify({
    p: normalizedPhone, purpose,
    exp: Date.now() + 15 * 60 * 1000, // 15 minutes
    r: Math.random().toString(36).slice(2),
  });
  const encoded = Buffer.from(ott, 'utf8').toString('base64url') || '';
  const sig = Buffer.from(String(normalizedPhone.length + code.length * 1337)).toString('hex');
  const oneTimeToken = `${encoded}.${sig}`;

  return res.json({ success: true, oneTimeToken, phone: normalizedPhone });
}

function checkOneTimeToken(token, purpose) {
  try {
    if (!token || typeof token !== 'string') return null;
    const [enc] = token.split('.');
    const json = Buffer.from(enc, 'base64url').toString('utf8');
    const data = JSON.parse(json);
    if (!data.p || !data.exp || data.exp < Date.now()) return null;
    if (purpose && data.purpose !== purpose) return null;
    return { phone: data.p, purpose: data.purpose };
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
//
// Two accepted modes:
//   A) { method: 'email', username, email, password }
//   B) { method: 'phone', username, phone, smsCode, oneTimeToken, password? }
// ---------------------------------------------------------------------------
export async function register(req, res) {
  ensureDB();
  const body = req.body || {};
  const method = String(body.method || '').toLowerCase();

  // --- Email register -------------------------------------------------
  if (method === 'email' || (!method && body.email)) {
    const { username, email, password } = body;
    const emailLc = String(email || '').trim().toLowerCase();
    if (!emailLc) return errorRes(res, 400, 'EMAIL_REQUIRED');
    if (!EMAIL_RE.test(emailLc)) return errorRes(res, 400, 'EMAIL_INVALID');
    if (!password) return errorRes(res, 400, 'PWD_REQUIRED');
    if (String(password).length < 6) return errorRes(res, 400, 'PWD_TOO_SHORT');
    if (findUserByEmail(emailLc)) return errorRes(res, 409, 'EMAIL_EXISTS');

    const user = createUser({
      username, email: emailLc, password, registeredBy: 'email',
    });
    const { token, expiresAt } = createSession(user.id, { ip: getIp(req), ua: getUa(req) });
    logger.info(`Registered user via email: ${emailLc} (${user.id})`);
    return res.json({ success: true, user, token, expiresAt });
  }

  // --- Phone + SMS register -------------------------------------------
  if (method === 'phone' || (!method && body.phone)) {
    const { username, phone, smsCode, oneTimeToken, password } = body;
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return errorRes(res, 400, 'PHONE_REQUIRED');
    if (!PHONE_RE.test(normalizedPhone)) return errorRes(res, 400, 'PHONE_INVALID');

    // Verify either oneTimeToken (pre-verified via /sms/verify) OR inline smsCode
    let verified = false;
    if (oneTimeToken) {
      const d = checkOneTimeToken(oneTimeToken, 'register');
      if (d && d.phone === normalizedPhone) verified = true;
    }
    if (!verified && smsCode) {
      const r = verifySmsCode(normalizedPhone, 'register', smsCode);
      if (r.ok) verified = true;
    }
    if (!verified) return errorRes(res, 401, 'NEED_CODE');

    if (findUserByPhone(normalizedPhone)) return errorRes(res, 409, 'PHONE_EXISTS');

    const user = createUser({
      username, phone: normalizedPhone,
      password: password || undefined, // password optional for phone-register
      registeredBy: 'phone',
    });
    markPhoneVerified(user.id);
    const refreshed = findUserById(user.id);
    const { token, expiresAt } = createSession(user.id, { ip: getIp(req), ua: getUa(req) });
    logger.info(`Registered user via phone: ${normalizedPhone} (${user.id})`);
    return res.json({ success: true, user: refreshed, token, expiresAt });
  }

  return errorRes(res, 400, 'NO_LOGIN_METHOD');
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
//
// Accepted methods:
//   A) { method:'email',  email,  password }
//   B) { method:'phone',  phone,  password }              (if pwd set on phone account)
//   C) { method:'phone',  phone,  smsCode | oneTimeToken }(SMS-only, no password needed)
// ---------------------------------------------------------------------------
export async function login(req, res) {
  ensureDB();
  const body = req.body || {};
  const method = String(body.method || '').toLowerCase();

  // --- Email + password ---
  if (method === 'email' || (!method && body.email)) {
    const { email, password } = body;
    const emailLc = String(email || '').trim().toLowerCase();
    if (!emailLc) return errorRes(res, 400, 'EMAIL_REQUIRED');
    if (!EMAIL_RE.test(emailLc)) return errorRes(res, 400, 'EMAIL_INVALID');
    if (!password) return errorRes(res, 400, 'PWD_REQUIRED');
    const foundByEmail = findUserByEmail(emailLc);
    if (!foundByEmail) return errorRes(res, 404, 'EMAIL_NOT_FOUND');
    if (!verifyUserPassword(foundByEmail.id, password)) return errorRes(res, 401, 'PWD_MISMATCH');
    const { token, expiresAt } = createSession(foundByEmail.id, { ip: getIp(req), ua: getUa(req) });
    logger.info(`Login email ok: ${emailLc}`);
    return res.json({ success: true, user: foundByEmail, token, expiresAt });
  }

  // --- Phone ---
  if (method === 'phone' || (!method && body.phone)) {
    const { phone, password, smsCode, oneTimeToken } = body;
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return errorRes(res, 400, 'PHONE_REQUIRED');
    if (!PHONE_RE.test(normalizedPhone)) return errorRes(res, 400, 'PHONE_INVALID');

    const user = findUserByPhone(normalizedPhone);
    if (!user) return errorRes(res, 404, 'PHONE_NOT_FOUND');

    // Determine strategy: sms-first if code/ott provided; else password
    const hasSms = Boolean(smsCode || oneTimeToken);
    let ok = false;

    if (hasSms) {
      if (oneTimeToken) {
        const d = checkOneTimeToken(oneTimeToken, 'login');
        if (d && d.phone === normalizedPhone) ok = true;
      }
      if (!ok && smsCode) {
        const r = verifySmsCode(normalizedPhone, 'login', smsCode);
        if (r.ok) ok = true;
      }
      if (!ok) return errorRes(res, 401, 'SMS_INVALID');
    } else {
      if (!password) return errorRes(res, 400, 'PWD_REQUIRED');
      if (!verifyUserPassword(user.id, password)) return errorRes(res, 401, 'PWD_MISMATCH');
      ok = true;
    }

    if (!ok) return errorRes(res, 401, 'PWD_MISMATCH');
    const { token, expiresAt } = createSession(user.id, { ip: getIp(req), ua: getUa(req) });
    logger.info(`Login phone ok: ${normalizedPhone} (${hasSms ? 'sms' : 'pwd'})`);
    return res.json({ success: true, user, token, expiresAt });
  }

  return errorRes(res, 400, 'NO_LOGIN_METHOD');
}

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
export async function logout(req, res) {
  ensureDB();
  const token = parseBearer(req);
  if (token) destroySession(token);
  return res.json({ success: true });
}

// ---------------------------------------------------------------------------
// GET  /api/auth/me
// ---------------------------------------------------------------------------
export async function me(req, res) {
  ensureDB();
  const token = parseBearer(req);
  if (!token) return errorRes(res, 401, 'UNAUTHORIZED');
  const session = getSession(token);
  if (!session) return errorRes(res, 401, 'UNAUTHORIZED');
  const user = findUserById(session.user_id);
  if (!user) return errorRes(res, 401, 'UNAUTHORIZED');
  return res.json({
    success: true,
    user,
    session: {
      createdAt: session.created_at,
      expiresAt: session.expires_at,
    },
    smsProvider: getSmsProvider(),
  });
}

// ---------------------------------------------------------------------------
// POST /api/auth/password/change   (logged-in + oldPassword + newPassword)
// ---------------------------------------------------------------------------
export async function changePassword(req, res) {
  ensureDB();
  const token = parseBearer(req);
  if (!token) return errorRes(res, 401, 'UNAUTHORIZED');
  const session = getSession(token);
  if (!session) return errorRes(res, 401, 'UNAUTHORIZED');
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return errorRes(res, 400, 'PWD_REQUIRED');
  if (String(newPassword).length < 6) return errorRes(res, 400, 'PWD_TOO_SHORT');
  if (!verifyUserPassword(session.user_id, oldPassword)) return errorRes(res, 401, 'PWD_MISMATCH');
  changeUserPassword(session.user_id, newPassword);
  const user = findUserById(session.user_id);
  logger.info(`Password changed for ${user?.id}`);
  return res.json({ success: true, user });
}

// ---------------------------------------------------------------------------
// POST /api/auth/password/reset   (phone + smsCode + newPassword)
// ---------------------------------------------------------------------------
export async function resetPassword(req, res) {
  ensureDB();
  const { phone, smsCode, oneTimeToken, newPassword } = req.body || {};
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return errorRes(res, 400, 'PHONE_REQUIRED');
  if (!newPassword) return errorRes(res, 400, 'PWD_REQUIRED');
  if (String(newPassword).length < 6) return errorRes(res, 400, 'PWD_TOO_SHORT');

  let verified = false;
  if (oneTimeToken) {
    const d = checkOneTimeToken(oneTimeToken, 'reset');
    if (d && d.phone === normalizedPhone) verified = true;
  }
  if (!verified && smsCode) {
    const r = verifySmsCode(normalizedPhone, 'reset', smsCode);
    if (r.ok) verified = true;
  }
  if (!verified) return errorRes(res, 401, 'SMS_INVALID');

  const user = findUserByPhone(normalizedPhone);
  if (!user) return errorRes(res, 404, 'PHONE_NOT_FOUND');
  changeUserPassword(user.id, newPassword);
  logger.info(`Password reset for phone ${normalizedPhone}`);
  return res.json({ success: true });
}

// ---------------------------------------------------------------------------
// GET  /api/auth/config   → returns which methods are enabled + sms provider
// ---------------------------------------------------------------------------
export function getConfig(req, res) {
  return res.json({
    success: true,
    methods: { email: true, phone: true },
    smsProvider: getSmsProvider(),
    smsConfigured: getSmsProvider() !== 'dev' || true, // dev mode is also usable
  });
}

export default {
  sendSmsCode, verifySms,
  register, login, logout, me,
  changePassword, resetPassword,
  getConfig,
};
