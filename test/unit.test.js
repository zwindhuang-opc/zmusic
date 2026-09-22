/**
 * ZMusic offline unit test suite — service/controller level.
 *
 * Directly invokes controllers with mock req/res objects (no HTTP, no server,
 * no network) so the suite runs anywhere, including CI without the dev
 * environment. The auth SQLite DB is pointed at a throwaway temp directory
 * via ZMUSIC_DATA_DIR (supported by src/services/authdb.service.js), and the
 * SMS provider is forced to 'dev', which returns the code in the response —
 * the full register/login/reset flows are therefore testable offline.
 *
 *   npm run test:unit
 *
 * Covers (Sprint 15 backlog item: unit-test coverage beyond api.test.js):
 *   - AuthController: email register/login/me/logout/change-password,
 *     phone+SMS register/login, password reset, validation errors
 *   - LibraryController: register/login/me, song & album CRUD defaults
 *
 * Exit code is 0 only when every assertion passes.
 *
 * @module test/unit.test
 */

import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Environment MUST be set before importing the auth stack (the DB path and
// SMS provider are resolved at module-load time).
// ---------------------------------------------------------------------------
process.env.ZMUSIC_DATA_DIR = mkdtempSync(join(tmpdir(), 'zmusic-unit-'));
process.env.SMS_PROVIDER = 'dev';

const { default: authController } = await import('../src/controllers/auth.controller.js');
const { default: libraryController } = await import('../src/controllers/library.controller.js');

// ---------------------------------------------------------------------------
// Minimal Express-like req/res doubles
// ---------------------------------------------------------------------------
function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

function mockReq({ body = {}, token = null } = {}) {
  return {
    body,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    socket: { remoteAddress: '127.0.0.1' },
  };
}

/** Invoke a controller handler and return { status, body }. */
async function call(handler, { body, token } = {}) {
  const res = mockRes();
  await handler(mockReq({ body, token }), res);
  return { status: res.statusCode, body: res.body };
}

// ---------------------------------------------------------------------------
// Test harness (same style as test/api.test.js)
// ---------------------------------------------------------------------------
const results = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    results.push({ name, passed: true });
  } catch (error) {
    console.log(`  FAIL  ${name}: ${error.message}`);
    results.push({ name, passed: false, error: error.message });
  }
}

function assert(cond, message) {
  if (!cond) throw new Error(message || 'assertion failed');
}

function assertEq(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const ts = Date.now();
const EMAIL = `unit-${ts}@zmusic.test`;
const PHONE = `13800${String(ts).slice(-6)}`; // unique per run
const PWD = 'secret123';
const PWD2 = 'newsecret456';

// ---------------------------------------------------------------------------
// AuthController — email flows
// ---------------------------------------------------------------------------
console.log('\nAuthController — email flows');

await test('email register rejects missing email (EMAIL_REQUIRED)', async () => {
  const r = await call(authController.register, { body: { method: 'email', password: PWD } });
  assertEq(r.status, 400, 'status');
  assertEq(r.body.error, 'EMAIL_REQUIRED', 'error code');
});

await test('email register rejects short password (PWD_TOO_SHORT)', async () => {
  const r = await call(authController.register, { body: { method: 'email', email: EMAIL, password: '123' } });
  assertEq(r.status, 400, 'status');
  assertEq(r.body.error, 'PWD_TOO_SHORT', 'error code');
});

await test('email register rejects invalid format (EMAIL_INVALID)', async () => {
  const r = await call(authController.register, { body: { method: 'email', email: 'not-an-email', password: PWD } });
  assertEq(r.status, 400, 'status');
  assertEq(r.body.error, 'EMAIL_INVALID', 'error code');
});

await test('email register succeeds and returns user + token', async () => {
  const r = await call(authController.register, { body: { method: 'email', username: 'Unit Tester', email: EMAIL, password: PWD } });
  assertEq(r.status, 200, 'status');
  assert(r.body.success === true, 'success flag');
  assertEq(r.body.user.email, EMAIL, 'user email');
  assert(typeof r.body.token === 'string' && r.body.token.length > 10, 'token present');
});

await test('duplicate email register rejected (EMAIL_EXISTS)', async () => {
  const r = await call(authController.register, { body: { method: 'email', email: EMAIL, password: PWD } });
  assertEq(r.status, 409, 'status');
  assertEq(r.body.error, 'EMAIL_EXISTS', 'error code');
});

await test('login with wrong password rejected (PWD_MISMATCH / 401)', async () => {
  const r = await call(authController.login, { body: { method: 'email', email: EMAIL, password: 'wrong-password' } });
  assertEq(r.status, 401, 'status');
  assertEq(r.body.error, 'PWD_MISMATCH', 'error code');
});

let sessionToken = null;

await test('login with correct password returns token', async () => {
  const r = await call(authController.login, { body: { method: 'email', email: EMAIL, password: PWD } });
  assertEq(r.status, 200, 'status');
  assert(r.body.success === true, 'success flag');
  sessionToken = r.body.token;
  assert(typeof sessionToken === 'string', 'token');
});

await test('GET /auth/me without token → 401 UNAUTHORIZED', async () => {
  const r = await call(authController.me, {});
  assertEq(r.status, 401, 'status');
  assertEq(r.body.error, 'UNAUTHORIZED', 'error code');
});

await test('GET /auth/me with token returns the user', async () => {
  const r = await call(authController.me, { token: sessionToken });
  assertEq(r.status, 200, 'status');
  assertEq(r.body.user.email, EMAIL, 'user email');
  assertEq(r.body.smsProvider, 'dev', 'sms provider reported');
});

await test('change password rejects wrong old password (401)', async () => {
  const r = await call(authController.changePassword, { token: sessionToken, body: { oldPassword: 'nope', newPassword: PWD2 } });
  assertEq(r.status, 401, 'status');
  assertEq(r.body.error, 'PWD_MISMATCH', 'error code');
});

await test('change password succeeds and new password logs in', async () => {
  const r = await call(authController.changePassword, { token: sessionToken, body: { oldPassword: PWD, newPassword: PWD2 } });
  assertEq(r.status, 200, 'status');
  const relogin = await call(authController.login, { body: { method: 'email', email: EMAIL, password: PWD2 } });
  assertEq(relogin.status, 200, 're-login status');
  assertEq(relogin.body.user.email, EMAIL, 're-login user');
});

await test('logout destroys the session (me → 401 afterwards)', async () => {
  const r = await call(authController.logout, { token: sessionToken });
  assertEq(r.status, 200, 'status');
  const me = await call(authController.me, { token: sessionToken });
  assertEq(me.status, 401, 'me after logout');
});

// ---------------------------------------------------------------------------
// AuthController — phone + SMS flows (dev provider returns the code inline)
// ---------------------------------------------------------------------------
console.log('\nAuthController — phone + SMS flows');

const PHONE2 = `13900${String(ts).slice(-6)}`;

await test('SMS send rejects bad phone (PHONE_INVALID)', async () => {
  const r = await call(authController.sendSmsCode, { body: { phone: 'abc', purpose: 'register' } });
  assertEq(r.status, 400, 'status');
  assertEq(r.body.error, 'PHONE_INVALID', 'error code');
});

await test('SMS send (dev) returns the code inline', async () => {
  const r = await call(authController.sendSmsCode, { body: { phone: PHONE, purpose: 'register', lang: 'zh' } });
  assertEq(r.status, 200, 'status');
  assertEq(r.body.provider, 'dev', 'provider');
  assert(/^\d{6}$/.test(String(r.body.devCode)), 'devCode is a 6-digit code');
});

await test('SMS verify rejects a wrong code (SMS_INVALID)', async () => {
  const r = await call(authController.verifySms, { body: { phone: PHONE, purpose: 'register', code: '000000' } });
  assert(r.status === 401 || r.status === 400, `unexpected status ${r.status}`);
  assert(['SMS_INVALID', 'SMS_RATE_LIMIT'].includes(r.body.error), `unexpected error ${r.body.error}`);
});

await test('SMS verify accepts the dev code and returns oneTimeToken', async () => {
  const sent = await call(authController.sendSmsCode, { body: { phone: PHONE, purpose: 'register' } });
  const r = await call(authController.verifySms, { body: { phone: PHONE, purpose: 'register', code: String(sent.body.devCode) } });
  assertEq(r.status, 200, 'status');
  assert(typeof r.body.oneTimeToken === 'string' && r.body.oneTimeToken.length > 20, 'oneTimeToken present');
});

await test('phone register with inline smsCode succeeds', async () => {
  const sent = await call(authController.sendSmsCode, { body: { phone: PHONE2, purpose: 'register' } });
  const r = await call(authController.register, { body: { method: 'phone', username: 'Phone Tester', phone: PHONE2, smsCode: String(sent.body.devCode), password: PWD } });
  assertEq(r.status, 200, 'status');
  assert(r.body.success === true, 'success flag');
  assertEq(r.body.user.phone, `+86${PHONE2}`, 'normalized phone');
  assert(typeof r.body.token === 'string', 'token');
});

await test('phone login with password succeeds', async () => {
  const r = await call(authController.login, { body: { method: 'phone', phone: PHONE2, password: PWD } });
  assertEq(r.status, 200, 'status');
  assert(r.body.success === true, 'success flag');
});

await test('password reset via SMS code succeeds', async () => {
  const sent = await call(authController.sendSmsCode, { body: { phone: PHONE2, purpose: 'reset' } });
  const r = await call(authController.resetPassword, { body: { phone: PHONE2, smsCode: String(sent.body.devCode), newPassword: 'reset789reset' } });
  assertEq(r.status, 200, 'status');
  const relogin = await call(authController.login, { body: { method: 'phone', phone: PHONE2, password: 'reset789reset' } });
  assertEq(relogin.status, 200, 'login with reset password');
});

await test('login SMS send for unknown phone → 404 PHONE_NOT_FOUND', async () => {
  const r = await call(authController.sendSmsCode, { body: { phone: '15000000000', purpose: 'login' } });
  assertEq(r.status, 404, 'status');
  assertEq(r.body.error, 'PHONE_NOT_FOUND', 'error code');
});

await test('auth config reports both methods + dev provider', async () => {
  const r = await call(authController.getConfig, {});
  assertEq(r.status, 200, 'status');
  assertEq(r.body.methods.email, true, 'email method');
  assertEq(r.body.methods.phone, true, 'phone method');
  assertEq(r.body.smsProvider, 'dev', 'sms provider');
});

// ---------------------------------------------------------------------------
// LibraryController — in-memory CRUD
// ---------------------------------------------------------------------------
console.log('\nLibraryController — in-memory CRUD');

await test('library register returns user', async () => {
  const r = await call(libraryController.register, { body: { username: 'Lib Tester', email: `lib-${ts}@zmusic.test`, password: PWD } });
  assertEq(r.status, 200, 'status');
  assertEq(r.body.user.email, `lib-${ts}@zmusic.test`, 'email lowercased');
});

await test('library register requires email+password (400)', async () => {
  const r = await call(libraryController.register, { body: { email: 'x@y.z' } });
  assertEq(r.status, 400, 'status');
});

let libToken = null;

await test('library login auto-creates unknown user and issues token', async () => {
  const r = await call(libraryController.login, { body: { email: `auto-${ts}@zmusic.test`, password: PWD } });
  assertEq(r.status, 200, 'status');
  libToken = r.body.token;
  assert(typeof libToken === 'string', 'token');
});

await test('library me validates the session token', async () => {
  const ok = await call(libraryController.me, { token: libToken });
  assertEq(ok.status, 200, 'valid token status');
  const bad = await call(libraryController.me, { token: 'sess-bogus-token' });
  assertEq(bad.status, 401, 'bogus token status');
});

await test('createSong applies safe defaults', async () => {
  const r = await call(libraryController.createSong, { body: { title: 'Unit Test Song', engine: 'suno' } });
  assertEq(r.status, 200, 'status');
  const song = r.body.song;
  assertEq(song.title, 'Unit Test Song', 'title');
  assertEq(song.owner_id, 'guest', 'default owner');
  assertEq(song.favorite, false, 'favorite default');
  assertEq(song.play_count, 0, 'play_count default');
  assertEq(song.publishing_status, 'none', 'publishing_status default');
});

await test('listSongs returns created songs', async () => {
  const r = await call(libraryController.listSongs, {});
  assertEq(r.status, 200, 'status');
  assert(Array.isArray(r.body.songs), 'songs array');
  assert(r.body.songs.some((s) => s.title === 'Unit Test Song'), 'created song listed');
});

await test('createAlbum applies safe defaults incl. share token', async () => {
  const r = await call(libraryController.createAlbum, { body: { title: 'Unit Album' } });
  assertEq(r.status, 200, 'status');
  const album = r.body.album;
  assertEq(album.title, 'Unit Album', 'title');
  assertEq(album.owner_id, 'guest', 'default owner');
  assert(Array.isArray(album.song_ids) && album.song_ids.length === 0, 'empty song_ids');
  assert(/^share-/.test(album.share_token), 'share token generated');
});

await test('listAlbums returns created albums', async () => {
  const r = await call(libraryController.listAlbums, {});
  assertEq(r.status, 200, 'status');
  assert(r.body.albums.some((a) => a.title === 'Unit Album'), 'created album listed');
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const passed = results.filter((r) => r.passed).length;
const failed = results.length - passed;

console.log(`\n${'='.repeat(50)}`);
console.log(`Unit Test Results: ${passed}/${results.length} passed`);
if (failed > 0) {
  console.log(`${failed} failed:`);
  results.filter((r) => !r.passed).forEach((r) => console.log(`   - ${r.name}: ${r.error}`));
} else {
  console.log('All unit tests passed.');
}
console.log('='.repeat(50));

// Remove the throwaway auth DB.
try { rmSync(process.env.ZMUSIC_DATA_DIR, { recursive: true, force: true }); } catch (_) { /* best-effort */ }

process.exit(failed > 0 ? 1 : 0);
