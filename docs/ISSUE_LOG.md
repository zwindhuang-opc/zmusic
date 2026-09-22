# ZMusic Platform — Issue Log

| Field | Value |
|-------|-------|
| **Document Title** | Issue Log |
| **Version** | 7.7.1 |
| **Date Created** | 2026-07-12 |
| **Last Updated** | 2026-09-22 |
| **Project Manager** | Vincent Huang (zwindhuang@qq.com) |
| **Repository** | https://github.com/zwindhuang-opc/zmusic |
| **Status** | Active |

---

## Issue Tracking Guidelines

### Severity Levels
| Level | Description | Priority |
|-------|-------------|----------|
| 🔴 Critical | Blocks core functionality, application crashes | P0 - Fix immediately |
| 🟠 High | Major feature broken, affects user experience | P1 - Fix in current sprint |
| 🟡 Medium | Minor bugs, cosmetic issues, usability problems | P2 - Fix in next sprint |
| 🟢 Low | Enhancement requests, non-critical improvements | P3 - Plan for future |

### Status Definitions
| Status | Description |
|--------|-------------|
| ✅ Resolved | Issue has been fixed and verified |
| ⚠️ Open | Issue identified, pending resolution |
| 🔄 In Progress | Currently being worked on |
| 📋 Pending | Issue acknowledged, waiting for prioritization |

---

## Active Issues

### Issue I003: User Account 0 Credits

| Field | Value |
|-------|-------|
| **ID** | I003 |
| **Severity** | 🟡 Medium |
| **Status** | 🔄 In Progress (workaround shipped in v6.6.6) |
| **Created** | 2026-07-02 |
| **Priority** | P2 |
| **Updated** | 2026-08-10 (v6.6.6) |

**Description**: User account shows 0 credits after API configuration, blocking the generate button.

**Current state per engine (2026-08-10 snapshot)**:
| Engine | Displayed Credit | API / Source | Can Generate? | Action Required |
|--------|-----------------|--------------|---------------|-----------------|
| **Muse AI** | 29 (live from DOM credit formula) | `evaluationCreditPaid(30) - evaluationCreditNoPaid(10) + base(0)` | Session expired (loginStatus=0, sessionExpired=true) | Refresh muse.top in Edge, phone+SMS re-login to renew server-side session (typically 24h idle expiry). 14积分 per generate. |
| **Suno AI** | 0 pts, VIP (程鋒 Vincent Huang) | Direct from Suno `/user/info` points field | No — needs purchased points | Top-up at suno.cn (VIP membership does NOT include free points) |
| **Melo AI** | 0 credit, non_member (風裡浪子) | Direct from Melo `/user/info` credit field | No — needs purchased credits | Top-up at h.51melo.com (每首歌约需 14-50 积分) |

**Workaround shipped v6.6.6 — CREDIT BYPASS FOR FLOW TESTING**:
1. **Frontend** — Removed `credits > 0` guard in MusePage.jsx, MeloPage.jsx, SunoPage.jsx. Generate button is enabled without credits.
2. **Backend** — Removed credit > 0 short-circuit in muse.controller.js `login.canGenerate` logic.
3. **Lyrics validation** — melo.controller.js lowered lyrics minimum from 50 → 10 characters so short test prompts can pass validation.

**Resolution (permanent)**: User needs to recharge at suno.cn, h.51melo.com, and re-login to muse.top (session refresh).

---

### Issue I007: Muse Server-Side Session Expiry (code=1006 despite valid JWT)

| Field | Value |
|-------|-------|
| **ID** | I007 |
| **Severity** | 🟠 High |
| **Status** | ⚠️ Open (requires user action) |
| **Created** | 2026-08-09 |
| **Priority** | P1 |

**Description**: Muse API `/generate` returns `code=1006 login state失效` while `/user/info` returns `code=0, loginStatus=0`. The JWT itself is valid (exp: 2027) but the `sid` it tracks server-side expires after ~24h of inactivity — separately from the JWT exp claim. Frontend shows correct credit (29) and the "Muse 会话已过期" banner with re-login instructions.

**Root Cause**: Muse tracks two levels of auth: (a) the JWT's `exp` claim, and (b) a server-side session (`sid`) that is independently evicted. Only an interactive phone+SMS login creates a new sid.

**Workaround**: Re-login interactively on muse.top via Edge CDP session. ZMusic will auto-detect the new login on next `/api/health` poll (every 60s) or page reload.

---

### Issue I008: GitHub Push Fails on Transient Network Reset

| Field | Value |
|-------|-------|
| **ID** | I008 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Resolved (2026-09-23) |
| **Created** | 2026-08-10 |
| **Resolved** | 2026-09-23 |
| **Priority** | P2 |

**Description**: `git push origin master` fails with `fatal: unable to access 'https://github.com/zwindhuang-opc/zmusic.git/': Recv failure: Connection was reset` due to transient ISP / GFW network instability to github.com.

**Resolution**: Confirmed transient — pushes to `origin/master` succeeded repeatedly on 2026-09-22/23 (commits `a3b5a1f`, `5b122b3` landed; tag `v7.7.1` pushed). Occasional single-attempt failures still happen; retrying after a few seconds works. No code change required.

**Workaround** (for the occasional reset): when connectivity returns, run:
```
git -C "d:/AI_Projects/zmusic" push origin master
```
Auto-deploy workflow triggers on push to `master` and will run deploy-pages (non-fatal) + APK build + GitHub release.

---

### Issue I016: GitHub Pages Private Repo Limitation (v7.5.0)

| Field | Value |
|-------|-------|
| **ID** | I016 |
| **Severity** | 🟡 Medium |
| **Status** | ⚠️ Open |
| **Created** | 2026-08-15 |
| **Priority** | P2 |
| **Version** | v7.5.0 |

**Description**: GitHub Pages deployment is configured in `.github/workflows/auto-deploy.yml` but fails silently because the repository (`zwindhuang-opc/zmusic`) is currently **private**. GitHub Pages for private repositories requires a paid GitHub plan (Pro/Team/Enterprise). The workflow uses `continue-on-error: true` so the failure is non-fatal — APK build, GitHub Release, and tag creation still succeed.

**Root Cause**: GitHub Pages availability restriction on free private repositories.

**Resolution Options** (awaiting decision):
1. Upgrade GitHub account to a paid plan (Pro/Team) that supports Pages for private repos.
2. Convert the repository to public (Pages becomes available for free).
3. Continue using Vercel / Netlify / Cloudflare Pages as the primary web hosts (Pages remains a non-fatal bonus).

**Impact**: No live web preview via GitHub Pages URL. Web deployment remains fully functional via Vercel/Netlify/Cloudflare.

---

## v7.7.x Issues (Resolved)

### Issue I024: `req.query` Assignment Threw on Node IncomingMessage (Suno Music List 500)

| Field | Value |
|-------|-------|
| **ID** | I024 |
| **Severity** | 🟠 High |
| **Status** | ✅ Resolved (v7.7.2) |
| **Created** | 2026-09-23 |
| **Resolved** | 2026-09-23 |
| **Priority** | P1 |
| **Version** | v7.7.2 |

**Description**: `GET /api/suno/music` (the Suno page's song history list) always failed with HTTP 500 — "Failed to load music list: Error: List error: 500" — making the Suno page's history panel permanently empty.

**Root Cause**: `src/routes/index.js` assigned `req.query = url.searchParams`. On modern Node, `IncomingMessage.query` is a getter-only legacy accessor, so the assignment throws `Cannot set property query of #<IncomingMessage> which has only a getter`. Even if it had worked, `URLSearchParams` exposes `.get()`, not the plain `.page`/`.page_size` properties the controller reads.

**Resolution** (v7.7.2): Added `setQuery()` helper that converts `url.searchParams` into a plain object and installs it via `Object.defineProperty(req, 'query', …)` (assignment-safe on getter-only accessors). Applied to both `/api/suno/music` and `/api/suno/task/:serialNo`.

**Verification**: `GET /api/suno/music?page=1&page_size=5` now returns the real upstream song list (titles + play URLs); the Suno page walkthrough reports 0 console errors.

---

### Issue I023: Guest Mode Button Was a No-Op (Bounced Back to Login)

| Field | Value |
|-------|-------|
| **ID** | I023 |
| **Severity** | 🟠 High |
| **Status** | ✅ Resolved (v7.7.2) |
| **Created** | 2026-09-23 |
| **Resolved** | 2026-09-23 |
| **Priority** | P1 |
| **Version** | v7.7.2 |

**Description**: The login page's "无需账号继续浏览 / Continue without account" button showed a success toast but never entered the app — the user stayed on the login page, so all 17 main pages were unreachable without an account.

**Root Cause**: `LoginPage.handleGuest` set `user` to `null` and navigated to `dashboard`, but the App-level auth guard (`!user && !publicPages.includes(currentPage) → setCurrentPage('login')`) immediately bounced back to the login page. The `zmusic_users`/`activeUserId` localStorage write it performed was dead code — nothing anywhere reads it.

**Resolution** (v7.7.2):
1. `AuthContext` gains a real guest session: `enterGuest()` clears the token, sets a persisted `zmusic_guest_mode` flag and a `GUEST_USER` object (`{ id: 'guest', isGuest: true }`); `restoreSession()` resumes it on reload; real login/register clear the flag; logout ends guest mode.
2. `handleGuest` now calls `enterGuest()` instead of `setUser(null)`; dead `zmusic_users` code removed.

**Verification**: The Puppeteer walkthrough (`node scripts/verify_webapp.cjs`) enters via the guest button and successfully visits all 18 nav targets (17 pages + guest entry) with zero console errors; guest data lands in the `guest` bucket (`zmusic_songs_guest`) as the i18n guest note promises.

---

### Issue I022: PWA Service Worker Served a Stale App Shell

| Field | Value |
|-------|-------|
| **ID** | I022 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Resolved (v7.7.1) |
| **Created** | 2026-09-22 |
| **Resolved** | 2026-09-22 |
| **Priority** | P2 |
| **Version** | v7.7.1 |

**Description**: The installed PWA / mobile shell could keep serving a previous release's HTML/JS after a deploy. The cache name was frozen at `zmusic-v7.4.1` while the app version kept moving, so the "activate" cleanup never matched a new version and the old app-shell cache was never purged.

**Root Cause**: `public/sw.js` hardcoded `const CACHE_NAME = 'zmusic-v7.4.1'`, and `src/main.jsx` registered the worker at a version-less URL (`/sw.js`), so a deploy produced a byte-identical worker URL from the browser's point of view — no reliable update trigger for the shell.

**Resolution** (v7.7.1):
1. `src/main.jsx` registers `/sw.js?v=<__APP_VERSION__>` (build-time `define` from `vite.config.js`), so each release has a distinct worker URL and installs eagerly.
2. `public/sw.js` derives the cache name from that query: `zmusic-v${new URL(self.location.href).searchParams.get('v') || 'dev'}` — a new version therefore creates a new cache and the existing `activate` handler deletes the previous one.

**Verification**: the generated service worker URL carries the release version and the cache name changes with it; no per-release manual edit of `sw.js` is needed any more.

---

### Issue I021: `npm start` Silently Served Stale Code (Port Auto-Switch + Unreliable Kill)

| Field | Value |
|-------|-------|
| **ID** | I021 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Resolved (v7.7.1) |
| **Created** | 2026-09-22 |
| **Resolved** | 2026-09-22 |
| **Priority** | P2 |
| **Version** | v7.7.1 |

**Description**: Restarting with `npm start` sometimes left the OLD backend running: the edits just made were not in effect, yet no error was shown — `npm start` reported "✅ Backend : 4721" and the app kept answering with the previous build. Combined with the new test suite this looked like a phantom bug in freshly written code.

**Root Cause**: two cooperating defects:
1. `src/server.js` → `resolveBackendPort()` **silently auto-switched** to the next free port (`logger.warn` only, i.e. a line buried in `logs/server.log`) when the configured port was occupied. So the new backend bound an unseen port (e.g. 4722) while the old backend kept answering on the pinned 4721 — which is exactly the port `vite.config.js`/`.dev-ports.json` point at.
2. `scripts/start-dev.mjs` → `killPort()` matched ports with `findstr :4721`, which also matches `14721`/`47210`, and it did not verify the kill result; then the pinned-port branch fell back to another port instead of failing.

**Resolution** (v7.7.1):
1. `resolveBackendPort()` — an **explicitly configured** port (`.dev-ports.json`, `RESOLVED_BACKEND_PORT`, `BACKEND_PORT`, `API_PORT`) is now treated as pinned: if it is occupied the process logs an actionable error and `process.exit(1)`. Only the generic fallback path (`PORT + 1`, default `4201`) still auto-increments.
2. `scripts/start-dev.mjs` — `killPort()` now parses the netstat `Local Address` column and requires an exact `:<port>` suffix; the pinned-port branch fails loudly (with the exact `netstat`/`taskkill` commands) instead of silently switching ports.
3. `GET /api/health` now reports the **real** backend listening port (`app.set('backendPort', …)` in the listen callback) instead of `config.port`, which is the *frontend* port in the dev setup — it previously reported `4720` while listening on `4721`.

**Verification**: with the backend live on 4721, starting a second instance with `BACKEND_PORT=4721` exits with code 1 and prints the remediation steps; `/api/health` reports `port: 4721`.

---

### Issue I020: Suno Rejects `duration` Unless `custom_mode` Is Enabled

| Field | Value |
|-------|-------|
| **ID** | I020 |
| **Severity** | 🟠 High |
| **Status** | ✅ Resolved (v7.7.1) |
| **Created** | 2026-09-22 |
| **Resolved** | 2026-09-22 |
| **Priority** | P1 |
| **Version** | v7.7.1 |

**Description**: Any generation request carrying a `duration` was rejected by suno.cn with HTTP 400 `duration 仅支持 custom_mode=true 的自定义模式`. Because the app always passes a duration (settings-driven), this made Suno generation unusable.

**Root Cause**: `src/controllers/suno.controller.js` forwarded `duration` while sending `custom_mode: false` (the default `false` was hardcoded via `customMode || false`). The upstream contract only accepts `duration` in custom mode.

**Resolution** (v7.7.1): custom mode is now implied whenever a duration is requested:
`const customModeEnabled = customMode === true || customMode === 'true' || Boolean(duration);`
`custom_mode` is set from that variable and the effective value is logged alongside the other parameters, so the request body is auditable in `logs/server.log`.

**Verification**: the generate call now passes input validation and reaches the credit check (the remaining failure was the account balance — see I003), which proves the payload is accepted.

---

### Issue I019: `/api/music/generate` Always Failed Server-Side (Relative URL Fetch)

| Field | Value |
|-------|-------|
| **ID** | I019 |
| **Severity** | 🟠 High |
| **Status** | ✅ Resolved (v7.7.1) |
| **Created** | 2026-09-22 |
| **Resolved** | 2026-09-22 |
| **Priority** | P1 |
| **Version** | v7.7.1 |

**Description**: The two documented dual-provider endpoints `POST /api/music/generate` and `POST /api/music/generate-agent` failed on every call with
`Failed to parse URL from /api/suno/generate`. They are listed in `README.md`, `API_DOCUMENTATION.md`, `PROGRAM_SPEC.md` and in the `GET /api/health` endpoint inventory, but were effectively dead.

**Root Cause**: `src/controllers/music.controller.js` imported `services/suno.service.js` and `services/muse.service.js` and called them **from the backend**. Those modules are *browser* clients: they fetch their own backend proxy through relative paths (`/api/suno/...`, `/api/muse/...`). Node's `fetch` rejects relative URLs, so every call threw. The Muse branch was doubly broken — it called `museService.generateMuseCommand()`, which does not exist on that module (the helper lives in `utils/referenceData.js`), and the resulting `TypeError` was swallowed into `providers.muse = { success: false }`.

**Resolution** (v7.7.1): `music.controller.js` now composes the **server-side** engine controllers instead of the browser clients:
1. New `invokeController(controller, method, body)` runs another controller's `(req, res)` handler against a minimal response double and captures `{ statusCode, payload}` — no extra HTTP round-trip, and the method is invoked on the instance so `this`-bound helpers (`museController.sendMuseResult`) keep working.
2. `/api/music/generate` delegates to `sunoController.generate` and returns `{ success, data }`, preserving the 400 "not configured" contract and mapping upstream errors to `{ success: false, error }`.
3. `/api/music/generate-agent` delegates to `sunoController.generate` / `museController.generate` and keeps reporting each provider independently, so one failing engine cannot fail the whole request.
4. `extractError()` normalises the many upstream error field names (`error`, `message`, `msg`, `data.error`).

**Verification**: both endpoints now return structured JSON; `POST /api/music/generate-agent` returns `taskId` + per-provider `success` flags (covered by the new test suite).

---

### Issue I018: Suno Generation Rejected — Unsupported `mv` Model Value

| Field | Value |
|-------|-------|
| **ID** | I018 |
| **Severity** | 🔴 Critical |
| **Status** | ✅ Resolved (v7.7.1) |
| **Created** | 2026-09-22 |
| **Resolved** | 2026-09-22 |
| **Priority** | P0 |
| **Version** | v7.7.1 |

**Description**: Every Suno AI generation failed on suno.cn. `src/controllers/suno.controller.js` hardcoded `mv: 'chirp-fenix'` in the generate body — an internal model identifier that suno.cn no longer accepts (the current API only serves the v6 model family).

**Root Cause**: Hardcoded model identifier that was never validated against the upstream API contract; the failure happened server-side at suno.cn, so the UI only surfaced a generic generation error.

**Resolution** (v7.7.1):
1. Introduced a whitelist `ALLOWED_MODELS = ['v6', 'v6-wild', 'v6-mini']` with `v6` as the default, replacing the hardcoded `chirp-fenix`.
2. `model` is now read from `req.body` and validated against the whitelist — an unknown value falls back to `v6` rather than being forwarded and rejected upstream.
3. Documented the constraint inline so the legacy value is not reintroduced.

**Verification**: Generation request body carries a supported `mv` value; unknown `model` values fall back to `v6`.

---

### Issue I017: Page Render Error Killed The Whole SPA (Black Screen) + No Client-Side Error Visibility

| Field | Value |
|-------|-------|
| **ID** | I017 |
| **Severity** | 🟠 High |
| **Status** | ✅ Resolved (v7.7.1) |
| **Created** | 2026-09-22 |
| **Resolved** | 2026-09-22 |
| **Priority** | P1 |
| **Version** | v7.7.1 |

**Description**: Two related observability gaps:
1. A render-time exception in any single lazy-loaded page unmounted the entire SPA, leaving the user on a blank screen with no way back except a full reload.
2. Errors happening in the browser (devtools-level `window.onerror` / `unhandledrejection`) were invisible in production, in the Capacitor/APK shell, and in post-mortem debugging — server logs only contained backend activity.

**Resolution** (v7.7.1):
1. **Isolation** — new `src/components/PageErrorBoundary.jsx` wraps the lazy-page region in `src/App.jsx` with `key={currentPage}`, so a crashing page shows an inline recovery card (Retry / Back to Dashboard) while the sidebar, header and persistent audio player stay alive. Navigating away auto-clears the boundary.
2. **Reporting** — new `src/utils/errorReporter.js` (djb2 fingerprint dedupe, 20 reports/session cap, `sendBeacon` fallback, never throws) plus `installGlobalErrorCapture()` in `src/main.jsx` capturing `window.onerror` + `unhandledrejection`.
3. **Ingestion** — new `POST /api/errors/report` (`src/controllers/errorReport.controller.js`) writes client reports into the log4j-style logger, so they land in `logs/server.log`; guarded by an in-memory 100-reports/60s limiter that drops floods with HTTP 200 instead of 5xx-ing clients.
4. **Global appenders** — `src/utils/logger.js` gained `Logger.globalAppenders` / `Logger.addGlobalAppender()`; `src/server.js` registers the `FileAppender` globally, so **all** logger instances (controllers/services, not only the entry-point logger) persist to `logs/server.log`.

**Verification**: `POST /api/errors/report` returns `{success:true,logged:true}` and the report appears in `logs/server.log` as `[ERROR] [FrontendError]`; production build succeeds; `npm run i18n:validate` clean including the new `error.*` keys.

---

## v7.5.0 Issues (Resolved)

### Issue I014: Documentation Overhaul — PMP System/Program/Technical Specs

| Field | Value |
|-------|-------|
| **ID** | I014 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Resolved |
| **Created** | 2026-08-15 |
| **Resolved** | 2026-08-15 |
| **Priority** | P2 |
| **Version** | v7.5.0 |

**Description**: The project lacked comprehensive PMP-standard documentation. The existing PMP_PROJECT_PLAN.md was at v1.0.0, USER_GUIDE.md and README.md were outdated at v5.4.0, and there were no System Specification, Program Specification, or Technical Guide documents.

**Resolution**: Created/updated 7 documentation files for v7.5.0:
1. ✅ Created `docs/SYSTEM_SPEC.md` — PMP System Specification (requirements, boundaries, constraints, acceptance criteria)
2. ✅ Created `docs/PROGRAM_SPEC.md` — PMP Program Specification (module specs, data flows, integration points)
3. ✅ Created `docs/TECHNICAL_GUIDE.md` — Developer Technical Guide (setup, structure, adding pages/endpoints/engines)
4. ✅ Updated `docs/USER_GUIDE.md` — Rewrote from v5.4.0 to v7.5.0 (all 18 pages, GLOBAL AUTO, presets, studios)
5. ✅ Updated `README.md` — Rewrote from v5.4.0 to v7.5.0 (3 engines, badges, deployment, docs table)
6. ✅ Updated `docs/PMP_PROJECT_PLAN.md` — Updated from v1.0.0 to v7.5.0 (all phases complete, version history)
7. ✅ Updated `docs/ISSUE_LOG.md` — Appended v7.x resolved issues + v7.5.0 entries

All documents cross-reference each other and reference version 7.5.0, the GitHub repo URL, and contact email.

**Verification**: All 7 files created/updated with consistent v7.5.0 versioning and PMP formatting.

---

### Issue I015: Logging File Appender Added

| Field | Value |
|-------|-------|
| **ID** | I015 |
| **Severity** | 🟢 Low |
| **Status** | ✅ Resolved |
| **Created** | 2026-08-15 |
| **Resolved** | 2026-08-15 |
| **Priority** | P3 |
| **Version** | v7.5.0 |

**Description**: The log4j-style logger (`src/utils/logger.js`) previously only had a `ConsoleAppender`. Server-side logs were not persisted to disk, making post-mortem debugging difficult.

**Resolution**: Added a `FileAppender` class to `src/utils/logger.js`:
- Writes log lines to `logs/server.log` via injected `node:fs` (server-side only).
- **5MB rolling rotation**: when the file exceeds 5MB, it is renamed to `server.log.1` and a fresh file starts.
- **Browser-safe**: no-ops when `fs` is unavailable (in the browser), so the same module imports cleanly on both tiers.
- **Crash-safe**: all `fs` operations are wrapped in try/catch — logging never crashes the app.
- Uses the same `PatternLayout` (`[%d] [%p] [%c] - %m`) as the console appender.

**Verification**: FileAppender documented in [Technical Guide](TECHNICAL_GUIDE.md) §9 and [Program Specification](PROGRAM_SPEC.md) §8.

---

## v7.x Issues (Resolved)

### Issue I010: i18n Translation — 582 Broken zh.json Key-Path Values

| Field | Value |
|-------|-------|
| **ID** | I010 |
| **Severity** | 🟠 High |
| **Status** | ✅ Resolved (v7.3.0) |
| **Created** | 2026-08-12 |
| **Resolved** | 2026-08-12 (v7.3.0) |
| **Priority** | P1 |

**Description**: 582 broken key-path values existed in `src/i18n/locales/zh.json`, plus hardcoded Chinese strings remained in Remix/Publish/AutoCreative/AutoProgress components, causing mixed CN/EN display and missing translations.

**Resolution** (v7.3.0):
1. Fixed 582 broken `zh.json` key-path values.
2. Migrated hardcoded Chinese in Remix Studio, Publish Studio, AutoCreativePanel, and AutoProgress to `t()` calls.
3. Added new `remix`, `publish`, and `common.untitled` i18n sections.
4. Synchronized `en.json` / `zh.json` with zero mixed CN/EN.
5. Version synced across `VERSION.json`, `package.json`, and `build.gradle`.

**Verification**: `npm run i18n:validate` passes with zh/en key parity.

---

### Issue I011: Android APK Black Screen on Launch

| Field | Value |
|-------|-------|
| **ID** | I011 |
| **Severity** | 🔴 Critical |
| **Status** | ✅ Resolved (v7.2.1) |
| **Created** | 2026-07-30 |
| **Resolved** | 2026-07-31 (v7.2.1) |
| **Priority** | P0 |

**Description**: The signed Android APK launched to a black screen with no UI rendering. The Capacitor webview was not loading the bundled assets correctly.

**Resolution** (v7.2.1):
1. Fixed asset path resolution in the Capacitor build configuration.
2. Ensured `npx cap sync android` ran after `npm run build` to copy the latest `dist/` into the Android project.
3. Verified the signed APK (`zmusic-v7.2.1-signed.apk`) renders all pages correctly on device.

**Verification**: APK installed and rendered Dashboard, Music, Muse/Suno/Melo, Lyrics, and Settings pages on Android device.

---

### Issue I012: MV Translations Missing / Broken

| Field | Value |
|-------|-------|
| **ID** | I012 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Resolved (v7.0.1) |
| **Created** | 2026-07-28 |
| **Resolved** | 2026-07-29 (v7.0.1) |
| **Priority** | P2 |

**Description**: The MV page (and its new Muse MV / Suno MV / Melo MV sub-tabs) had missing or broken translations, showing raw key paths instead of localized strings.

**Resolution** (v7.0.1):
1. Added missing MV i18n keys to both `zh.json` and `en.json`.
2. Fixed MV page translation calls.
3. Verified all MV sub-tabs render localized strings in both languages.

**Verification**: MV page renders fully localized in zh and en.

---

### Issue I013: Melo Validation — song_length / TDZ Bug

| Field | Value |
|-------|-------|
| **ID** | I013 |
| **Severity** | 🟠 High |
| **Status** | ✅ Resolved (v7.0.1 / v7.1.0) |
| **Created** | 2026-07-28 |
| **Resolved** | 2026-07-29 (v7.0.1) + 2026-07-30 (v7.1.0) |
| **Priority** | P1 |

**Description**: Two Melo-related bugs: (a) the Melo `song_length` parameter was not being sent correctly to the API, causing generation failures; (b) a Temporal Dead Zone (TDZ) bug in MeloPage.jsx crashed the page on load when a `const`/`let` variable was referenced before initialization.

**Resolution**:
1. **v7.0.1**: Fixed the MeloPage TDZ bug by reordering variable declarations so all references occur after initialization.
2. **v7.1.0**: Fixed the Melo `song_length` parameter to correctly pass the duration (default 240s) to the `POST /agent/api/v1/music/generate` endpoint with `model_code MS55`.

**Verification**: MeloPage loads without crash; Melo generation sends correct `song_length`.

---

## Historical Issues (Resolved)

### Issue I001: API Key Format Confusion

| Field | Value |
|-------|-------|
| **ID** | I001 |
| **Severity** | 🟠 High |
| **Status** | ✅ Resolved |
| **Created** | 2026-07-02 |

**Description**: Users confused about API key format requirements.

**Resolution**: Use pure `sk-xxx` format; documented in `.env.example`.

---

### Issue I002: Port Number Restrictions

| Field | Value |
|-------|-------|
| **ID** | I002 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Resolved |
| **Created** | 2026-07-02 |

**Description**: Port conflicts with IDE preview ports.

**Resolution**: Migrated from forbidden ports (5500/5501/5502, 5173, 3000, 8000) to **pinned ports 4720 (frontend) / 4721 (backend)** via `FRONTEND_PORT`/`BACKEND_PORT` in `.env`. `npm start` auto-kills lingering processes on target ports before spawning.

---

### Issue I004: Suno Generation Results Too Similar

| Field | Value |
|-------|-------|
| **ID** | I004 |
| **Severity** | 🟠 High |
| **Status** | ✅ Resolved |
| **Created** | 2026-07-12 |
| **Priority** | P1 |

**Description**: Regardless of style/genre selections, Suno AI generated music that sounded very similar. The prompt being sent was too generic: `A {genre} song about {theme}`.

**Root Cause**: `music.controller.js` was sending generic prompts to Suno API; limited style/genre options; no detailed instrument/mood/BPM information.

**Resolution**:
1. Created centralized music styles config at `src/config/musicStyles.js` with 30+ styles, 30+ genres, 30+ themes — each with instruments, mood, BPM range, and detailed Suno tags.
2. Updated `music.controller.js` to build rich prompts including instruments, mood, BPM, and duration.
3. Updated translations in `zh.json` and `en.json`.

**Verification**: Build successful; frontend 4720 + backend 4721 running.

---

### Issue I005: Browser Console ERR_ABORTED Errors

| Field | Value |
|-------|-------|
| **ID** | I005 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Resolved |
| **Created** | 2026-07-12 |
| **Priority** | P2 |
| **Resolved** | 2026-08-10 (v6.6.6) |

**Description**: Browser console showed ERR_ABORTED errors when loading the web app, caused by transient network errors, browser cache conflicts, Vite HMR issues, server restart on the same port without socket-reuse cooldown, and React StrictMode double-running effects firing AbortController signals twice.

**Resolution** (cumulative through v6.6.6):
1. Enabled DEBUG-level logging in `logger.js` with `Logger.setGlobalLevel()`.
2. Added retry logic (max 2 retries, 1s/2s backoff) in `api.client.js`.
3. Dynamic port launcher + pinning in `scripts/start-dev.mjs` — kills lingering processes, pins ports via `FRONTEND_PORT`/`BACKEND_PORT`, writes allocation to `.dev-ports.json`.
4. Removed StrictMode AbortController double-fire in `App.jsx` — 60s `loadAppStatus` poller uses a single interval ref.

**Verification**: 0 errors / 0 warnings; `i18n:validate` passes; vite build succeeds; dev servers on pinned ports 4720/4721; all sidebar entries render with no aborted sub-resource loads; `GET /api/health` returns `status: "healthy"`.

---

### Issue I006: Insufficient Style/Genre/Theme Options

| Field | Value |
|-------|-------|
| **ID** | I006 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Resolved |
| **Created** | 2026-07-12 |
| **Priority** | P2 |

**Description**: Users requested more specific and differentiated style/genre/theme options (虐心, 治愈, 现代, 穿越, etc.).

**Resolution**: Expanded style/genre/theme options from ~10 each to 30+ each with unique characteristics (heartbreaking, healing, time_travel, epic, dark, romantic, nostalgic, energetic, dreamy, modern, indie, kpop, reggae, ambient, and more).

**Verification**: All new options appear in UI with Chinese and English translations.

---

### Issue I009: Melo Lyrics Length Hardcoded 50-char Floor

| Field | Value |
|-------|-------|
| **ID** | I009 |
| **Severity** | 🟢 Low |
| **Status** | ✅ Resolved (v6.6.6) |
| **Created** | 2026-08-10 |
| **Resolved** | 2026-08-10 |
| **Priority** | P3 |

**Description**: Melo controller rejected prompts with lyrics < 50 characters, preventing short tests from reaching the API during the 0-credit bypass flow.

**Resolution**: `melo.controller.js` lowered the floor to `>= 10` characters in development / credit-bypass context. When the account has real credits, the upstream API still enforces its own length limits.

**Verification**: A 36-char test payload successfully passed controller validation.

---

## Issue Statistics

| Metric | Count |
|--------|-------|
| Total Issues | 24 (I001–I024) |
| ✅ Resolved | 20 |
| ⚠️ Open | 2 |
| 🔄 In Progress | 1 |
| 🔴 Critical | 2 (both resolved) |
| 🟠 High | 9 |
| 🟡 Medium | 10 |
| 🟢 Low | 3 |

### Status Breakdown
| Status | Issues |
|--------|--------|
| ✅ Resolved | I001, I002, I004, I005, I006, I008, I009, I010, I011, I012, I013, I014, I015, I017, I018, I019, I020, I021, I022, I023, I024 |
| ⚠️ Open | I007, I016 |
| 🔄 In Progress | I003 |

---

## Sprint Backlog

### Previous Sprint (Sprint 14 — Reliability & Observability Sprint) — completed v7.7.1
- [x] I017 - Per-page React error boundary (`PageErrorBoundary`) → ✅ Resolved
- [x] I017 - Frontend error reporting (browser → `POST /api/errors/report` → `logs/server.log`) → ✅ Resolved
- [x] I018 - Suno `mv` model parameter fix (v6 family whitelist) → ✅ Resolved
- [x] I020 - Suno `duration` requires `custom_mode=true` → ✅ Resolved
- [x] I019 - `/api/music/*` relative-URL fetch failure → ✅ Resolved
- [x] I021 - `npm start` silently served stale code (port auto-switch) → ✅ Resolved
- [x] I022 - PWA service worker served a stale app shell → ✅ Resolved
- [x] Global log appenders so all server loggers persist to `logs/server.log` → ✅ Done
- [x] Test coverage: port-agnostic `test/api.test.js` (20 assertions) + `npm run test:api` / `npm run test:i18n` → ✅ Done
- [ ] I016 - GitHub Pages private repo limitation ⚠️ Open (`build:ghpages` / `deploy:ghpages` scripts added as workaround; decision still pending)

### Current Sprint (Sprint 15 — proposed)
- [ ] Resolve I016: Decide on GitHub Pages strategy (paid plan vs public repo vs Vercel/Netlify primary)
- [ ] Centralized log shipping to centralizedhub sink (per user rules — must use centralizedhub + zunicornagent project as base)
- [x] Extend unit-test coverage beyond `test/api.test.js` ✅ Done (v7.7.2, 2026-09-23): `test/unit.test.js` — 29 offline assertions across AuthController (email + phone/SMS + reset flows) and LibraryController (CRUD); `ZMUSIC_DATA_DIR` redirects the auth SQLite DB to a temp dir; `npm run test:unit`, chained into `npm test`
- [ ] Wire APK build verification into the auto-deploy workflow (build + install smoke check)
- [ ] I003 - User credit management 🔄 In Progress (blocks live Suno/Muse generation; top-up https://www.suno.cn/home/#/account → the API tests SKIP until funded)
- [ ] I007 - Muse server-side session expiry ⚠️ Open (mitigated by server-side platform token store in v7.7.0; user re-login still needed when no token is pasted)
- [ ] I008 - GitHub push transient network failure ✅ Resolved (pushes succeed on retry; 2026-09-23)

---

## Change Log

| Date | Issue | Action | Author |
|------|-------|--------|--------|
| 2026-07-12 | I004, I006 | Implemented expanded music styles/config | AI Assistant |
| 2026-07-12 | I005 | Enabled DEBUG logging, investigating | AI Assistant |
| 2026-07-29 | I012 | Fixed MV translations (v7.0.1) | AI Assistant |
| 2026-07-29 | I013 | Fixed MeloPage TDZ bug (v7.0.1) | AI Assistant |
| 2026-07-30 | I013 | Fixed Melo song_length parameter (v7.1.0) | AI Assistant |
| 2026-07-31 | I011 | Fixed APK black screen (v7.2.1) | AI Assistant |
| 2026-08-10 | I005 | Marked resolved; port pinning, poller refactor, full verification suite | AI Assistant |
| 2026-08-10 | I003 | Credit bypass (front+back) + Melo min-length 10; real per-engine credit snapshot | AI Assistant |
| 2026-08-10 | I007, I008, I009 | Opened 3 new issues (Muse session expiry, GitHub push reset, Melo char floor) | AI Assistant |
| 2026-08-12 | I010 | i18n overhaul — fixed 582 broken keys, migrated hardcoded Chinese to t() (v7.3.0) | AI Assistant |
| 2026-08-15 | I014 | Documentation overhaul — created System/Program/Technical specs, updated User Guide/README/PMP plan (v7.5.0) | AI Assistant |
| 2026-08-15 | I015 | Added FileAppender to logger (5MB rolling, browser-safe) (v7.5.0) | AI Assistant |
| 2026-08-15 | I016 | Opened — GitHub Pages private repo limitation (non-fatal, awaiting decision) (v7.5.0) | AI Assistant |
| 2026-08-16 | I017 (open) | Opened — page render errors killed the SPA; no client-side error visibility (v7.6.0) | AI Assistant |
| 2026-08-16 | I018 (open) | Opened — Suno generation rejected (unsupported `mv` model value) (v7.7.0) | AI Assistant |
| 2026-09-22 | I017 | Resolved — per-page error boundary + global error capture + `POST /api/errors/report` + global log appenders (v7.7.1) | AI Assistant |
| 2026-09-22 | I018 | Resolved — Suno `mv` whitelist (v6/v6-wild/v6-mini), default v6, body override (v7.7.1) | AI Assistant |
| 2026-09-22 | I019 | Resolved — `/api/music/generate(-agent)` now composes server-side engine controllers via `invokeController()` (v7.7.1) | AI Assistant |
| 2026-09-22 | I020 | Resolved — Suno `custom_mode` implied when `duration` is sent (v7.7.1) | AI Assistant |
| 2026-09-22 | I021 | Resolved — pinned backend port no longer silently auto-switched; `killPort` exact-port match; `/api/health` reports real port (v7.7.1) | AI Assistant |
| 2026-09-22 | I022 | Resolved — service worker registered with `?v=<version>`, cache name derived from it (v7.7.1) | AI Assistant |
| 2026-09-22 | — | Added port-agnostic API test suite (20 assertions, credit-aware SKIP) + `test` / `test:api` / `test:i18n` npm scripts (v7.7.1) | AI Assistant |

---

*Cross-references: [System Specification](SYSTEM_SPEC.md) · [Program Specification](PROGRAM_SPEC.md) · [Technical Guide](TECHNICAL_GUIDE.md) · [User Guide](USER_GUIDE.md) · [PMP Project Plan](PMP_PROJECT_PLAN.md)*

*Last Updated: 2026-09-22 · Document Version: 7.7.1*
