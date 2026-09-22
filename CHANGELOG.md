# ZMusic Changelog

## v7.7.2 (2026-09-23) — Guest Mode & Suno Music List Fix Release

**Guest Mode Actually Works Now (I023)**
- The login page's "无需账号继续浏览 / Continue without account" button was a no-op: it set `user` to `null`, so the App-level auth guard immediately bounced the user back to the login page — all 17 main pages were unreachable without an account. The `zmusic_users` localStorage write it performed was dead code (nothing read it).
- `src/contexts/AuthContext.jsx` — NEW real guest session: `enterGuest()` clears the token, persists a `zmusic_guest_mode` flag, and installs `GUEST_USER` (`{ id: 'guest', isGuest: true }`); `restoreSession()` resumes the guest session on reload; real login/register clear the flag; `logout()` ends guest mode.
- `src/pages/LoginPage.jsx` — `handleGuest` calls `enterGuest()` instead of `setUser(null)`; dead code removed.
- Guest data lands in the local `guest` bucket (`zmusic_songs_guest`), matching the i18n guest note "数据仅保存在本机".

**Suno Music List 500 Fixed (I024)**
- `GET /api/suno/music` (Suno page song history) always returned HTTP 500 ("Failed to load music list"). Root cause: `src/routes/index.js` assigned `req.query = url.searchParams` — `IncomingMessage.query` is a getter-only accessor on modern Node, so the assignment throws; and `URLSearchParams` doesn't expose the plain `.page`/`.page_size` properties the controller reads anyway.
- NEW `setQuery(req, url)` helper converts search params into a plain object and installs it via `Object.defineProperty` (safe against getter-only accessors). Applied to `/api/suno/music` and `/api/suno/task/:serialNo`.
- Verified: `/api/suno/music?page=1&page_size=5` returns the real upstream song list.

**Full UI Walkthrough Verification (new capability)**
- `scripts/verify_webapp.cjs` upgraded from a single-page smoke check to a full walkthrough: enters via the guest button, clicks all 18 navigation targets (17 pages + guest entry), captures one screenshot per page under `screenshots/v7.7.2/walkthrough-*.png`, and fails (exit 1) on any uncaught page error.
- Result: **19/19 PASS, 0 console errors**; `npm run test:api` 20/20 passed.

**Chores**
- Untracked 8 legacy root APK build artifacts from git (committed before the `*.apk` ignore rule existed; files remain on disk).
- ISSUE_LOG: I008 (GitHub push reset) confirmed resolved — pushes succeed on retry; statistics updated to 24 issues / 20 resolved.


## v7.7.1 (2026-09-22) · Reliability & Observability Release

**Per-Page Error Isolation**
- NEW `src/components/PageErrorBoundary.jsx` — React error boundary wrapping the lazy-loaded page region. A render-time exception in one page no longer unmounts the whole SPA (previously a black screen): the sidebar, header, and persistent audio player stay alive, and the user can **Retry** (re-mount the page) or **Back to Dashboard**.
- `src/App.jsx` — `<PageErrorBoundary key={currentPage} pageKey={currentPage} onNavigate={setCurrentPage}>` wraps `<Suspense>`; the `key={currentPage}` remount clears the boundary automatically on navigation.
- Root boundary in `src/main.jsx` is retained for truly fatal startup errors.

**Frontend Error Reporting (browser → backend log)**
- NEW `src/utils/errorReporter.js` — fire-and-forget client reporter: djb2 fingerprint dedupe (same error reported once per session), 20 unique reports per session cap, `navigator.sendBeacon` fallback, never throws.
- NEW `installGlobalErrorCapture()` — registers `window.onerror` + `unhandledrejection` handlers; called once from `src/main.jsx`.
- NEW `src/controllers/errorReport.controller.js` + route `POST /api/errors/report` — writes each client report through the log4j-style logger into `logs/server.log`; in-memory rate limiter (max 100 reports / 60s) silently drops floods instead of 5xx-ing clients.
- `src/utils/logger.js` — NEW `Logger.globalAppenders` + `Logger.addGlobalAppender()`; `severity()` now fans out to global appenders too, so **every** logger instance (controllers/services, not just the server entry-point logger) persists to `logs/server.log`.
- `src/server.js` — registers the server-wide `FileAppender` via `Logger.addGlobalAppender()`.

**Suno AI Generation Fixes (2 independent blockers)**
- **Model**: `src/controllers/suno.controller.js` — the hardcoded `mv: 'chirp-fenix'` value is rejected by suno.cn (as is the legacy v3.5/v4 model set). Generation now sends a supported model and accepts a per-request override:
  - `ALLOWED_MODELS = ['v6', 'v6-wild', 'v6-mini']`, default `v6`; callers may pass `model` in the request body.
  - An unknown `model` value falls back to `v6` instead of being forwarded and rejected upstream.
- **Duration**: suno.cn rejects `duration` unless `custom_mode` is enabled (`duration 仅支持 custom_mode=true 的自定义模式`). Since the app always passes a duration, custom mode is now implied:
  `const customModeEnabled = customMode === true || customMode === 'true' || Boolean(duration);`
  The effective `custom_mode` value is logged together with the other parameters so the request body is auditable in `logs/server.log`.

**`/api/music/*` Rebuilt on Server-Side Controllers (I019)**
- `src/controllers/music.controller.js` used to import the **browser** clients `services/suno.service.js` / `services/muse.service.js` and call them from the backend. Those modules fetch their own proxy through relative paths (`/api/suno/...`), which Node's `fetch` rejects — so `POST /api/music/generate` always failed with `Failed to parse URL from /api/suno/generate`, and `/api/music/generate-agent` was doubly broken (it also called `museService.generateMuseCommand()`, which does not exist on that module).
- Now composes the real server-side controllers instead:
  - NEW `invokeController(controller, method, body)` — runs another controller's `(req, res)` handler against a minimal response double and captures `{ statusCode, payload }`; no extra HTTP hop, and the method stays bound to its instance (`museController.sendMuseResult` relies on `this`).
  - NEW `extractError(payload)` — normalises the many upstream error field names (`error` / `message` / `msg` / `data.error`).
  - `POST /api/music/generate` delegates to `sunoController.generate`, preserving the 400 "not configured" contract and mapping upstream failures to `{ success: false, error }`.
  - `POST /api/music/generate-agent` delegates to `sunoController.generate` / `museController.generate` and still reports each provider independently, so one failing engine cannot fail the whole request.

**Restart Safety — No More Silently Served Stale Code (I021)**
- `src/server.js` → `resolveBackendPort()` — an **explicitly configured** port (`.dev-ports.json`, `RESOLVED_BACKEND_PORT`, `BACKEND_PORT`, `API_PORT`) is now treated as pinned: if occupied, the process logs an actionable error (exact `netstat` / `taskkill` commands) and exits with code 1. Previously it silently auto-switched to the next free port (a `logger.warn` buried in `logs/server.log`), which left the *old* backend answering on the port vite proxies to — so `npm start` could serve stale code with no visible error. Only the generic fallback path (`PORT + 1`, default `4201`) still auto-increments.
- `scripts/start-dev.mjs` — `killPort()` now parses the netstat `Local Address` column and requires an exact `:<port>` suffix (`findstr :4721` also matched `14721` / `47210`); and in pinned mode an occupied backend port fails loudly instead of falling back to another port.
- `src/controllers/health.controller.js` — `GET /api/health` now reports the **real** backend listening port (`app.set('backendPort', …)` in the `listen` callback). It previously reported `config.port` — the *frontend* port — so a healthy backend on 4721 advertised `4720`.

**PWA Cache Versioning (I022)**
- `public/sw.js` — `CACHE_NAME` was frozen at `zmusic-v7.4.1` while the app version kept moving, so the `activate` cleanup never matched a new release and the installed PWA/mobile shell could keep serving the previous app shell. It is now derived from the registration query: ``zmusic-v${new URL(self.location.href).searchParams.get('v') || 'dev'}``.
- `src/main.jsx` — registers `/sw.js?v=<__APP_VERSION__>` (build-time `define` from `vite.config.js`), giving every release a distinct worker URL so the browser installs it eagerly and the old cache is purged. No per-release manual edit of `sw.js` any more.

**Testing Infrastructure**
- `test/api.test.js` — rewritten to be port-agnostic and version-independent: backend base URL resolves from `API_BASE_URL` → `BACKEND_PORT` → `.dev-ports.json` → `4721` (was hardcoded `http://127.0.0.1:5501`, an obsolete port that made every assertion fail). The suite exits non-zero on failure so it can gate CI.
- Credit-aware assertions: an upstream "not enough credits" rejection (suno.cn `用户积点不足`) is reported as **SKIP** rather than FAIL, since that is an account condition (I003), not a code defect.
- `package.json` — new scripts `test` (`test:i18n` + `test:api`), `test:i18n` and `test:api` (live API suite, **20 assertions**).
- Added assertions for `POST /api/errors/report` (accepts a report / rejects a missing message) and `POST /api/music/generate-agent` (structure + per-provider outcome).

**Verification**
- `npm run i18n:validate` — clean, zh/en key parity (including the new `error.*` keys).
- `npm run test:api` — **20/20 passed** (1 skipped: upstream credits exhausted).
- `npm run build` — production build succeeds (all lazy-page chunks emitted).
- `POST /api/errors/report` smoke test → `{success:true,logged:true}` and the entry appears in `logs/server.log` as `[ERROR] [FrontendError]`.
- `GET /api/health` → `status: healthy`, `version: 7.7.1`, `port: 4721`.
- Fail-fast check: starting a second backend with `BACKEND_PORT=4721` exits with code 1 instead of binding a hidden port.

**Version Sync**
- `VERSION.json`: 7.7.0 → 7.7.1 (buildNumber 15 → 16)
- `package.json`: 7.7.0 → 7.7.1
- `src/App.jsx`: `BUILD_VERSION` fallback → 7.7.1
- `android/app/build.gradle`: versionCode 70700 → 70701, versionName "7.7.0" → "7.7.1"

---

## v7.7.0 (2026-08-16) · Accounts, SMS Auth & Server-Side Platform Credentials

**Auth Guard**
- Unauthenticated visitors are no longer dropped into the Dashboard: `src/App.jsx` routes to `LoginPage` while `authLoading` is false and no user session exists, and redirects away from `login` once a session appears.
- `src/contexts/AuthContext.jsx` — session bootstrap from Bearer token on mount, loading state exposed to the guard.

**Phone / SMS Registration & Login (end-to-end)**
- NEW `src/services/authdb.service.js` — SQLite-backed user store (better-sqlite3): `users` / `sessions` / `sms_codes` tables, sha256 password hashing, session create/get/destroy, SMS code issue + verify.
- NEW `src/services/sms.service.js` — provider chain with automatic selection: Tencent Cloud SMS → Aliyun SMS → Twilio → **dev log-only fallback** (no keys required; the code is printed to the server log so register/login can be exercised locally).
- NEW `src/controllers/auth.controller.js` — `POST /api/auth/register`, `POST /api/auth/login` (email+password, phone+password, phone+SMS), `POST /api/auth/sms/send`, `POST /api/auth/sms/verify` (returns `oneTimeToken`), `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/password/change`, `POST /api/auth/password/reset`.
- `src/pages/LoginPage.jsx` — rewritten: login/register tab switch, email vs phone mode, SMS code request + countdown, guest mode, bilingual validation messages.
- Registration and login endpoints verified working end-to-end.

**Server-Side Platform Credentials (CDP replacement)**
- NEW `src/services/platformAuth.service.js` + `src/controllers/platformAuth.controller.js` — browser-agnostic token store for Muse / Melo (and other platforms): the user pastes a platform JWT once in Settings, the backend validates it against the platform's user-info endpoint, persists it to a JSON file (survives restarts), and reuses it for all outbound API calls. Token priority: user token → CDP-extracted token → `.env` key.
- Removes the previous hard dependency on Edge/Chrome running with `--remote-debugging-port` (fragile: process exits, port conflicts, IPv6 issues) and works from mobile/desktop/any browser. CDP (`src/services/museCdpBridge.js`) is retained as a fallback path.

**AI Cover / Scene Image Generation**
- NEW `src/services/imageGen.service.js` + `src/controllers/imageGen.controller.js` — text-to-image generation for song covers, MV scene cards and thumbnails (square / portrait / landscape size presets, zh+en prompt assembly, returns a directly usable image URL).

**Settings Wiring — Zero Hardcoded Values**
- `src/pages/SettingsPage.jsx` + `src/utils/autoConfig.js` — the AUTO pipeline now honours every setting instead of hardcoded defaults: song count, duration per engine, strategy preset, auto-close behaviour (`autoCloseOnStop` / `autoCloseOnDone` / `autoCloseDelay`), and language.
- All four generation pages (Muse / Suno / Melo / MV) plus `EasyMode.jsx` read durations and counts from the shared auto-config rather than inline literals.

**Other**
- `src/services/socialPublish.service.js` — assisted publishing: auto-open portal, auto-copy metadata, pre-publish checklist.
- `src/pages/PublishStudio.jsx` — publishes with the assisted flow.
- `src/services/api.client.js` — retry with backoff for transient failures.
- Codebase audit completed; version bumped 7.6.1 → 7.7.0.

---

## v7.6.1 (2026-08-16) · Version System Verification Patch

- Test patch bump to verify the rewritten auto-versioning pipeline propagates to all four version locations (`VERSION.json`, `package.json`, `src/App.jsx`, `android/app/build.gradle`).

---

## v7.6.0 (2026-08-16) · Auto-Versioning, Auth Guard & Settings Wiring

**Auto-Versioning**
- `scripts/version.js` — rewritten from a JSON-only bumper into a full release helper:
  - Updates `VERSION.json`, `package.json`, `src/App.jsx` (`BUILD_VERSION` fallback) and `android/app/build.gradle` in one pass.
  - `versionCode` is derived deterministically as `major * 10000 + minor * 100 + patch` (e.g. 7.7.1 → 70701), removing manual Android version arithmetic.
  - Increments `buildNumber`, stamps `releaseDate`, and accepts an optional changelog message: `node scripts/version.js patch "message"`.
  - Prints the matching `git tag -a` command.

**Fixes**
- Auth guard added so the dashboard is no longer reachable without a session.
- Settings wiring corrected so generation parameters actually reach the engines.
- GLOBAL AUTO chaining fixed across engines.

---

## v7.5.2 (2026-08-15) · Zero Hardcoded Values

- `src/utils/autoConfig.js` — centralised AUTO configuration; removed scattered hardcoded counts/durations.
- `src/pages/SettingsPage.jsx` — AUTO settings section expanded and persisted.
- Muse / Suno / Melo / MV pages now read song count and duration from the shared config on every generation, so changing a setting takes effect immediately without a reload.

---

## v7.5.1 (2026-08-15) · AUTO & Melo Fixes

- **AUTO generation count** — the configured song count was ignored by the AUTO loop in Muse / Suno / Melo / MV; corrected in `src/utils/autoConfig.js` and all four pages.
- **Melo HTML detection** — `src/services/melo.service.js` / `src/controllers/melo.controller.js` now detect an HTML login/page response instead of leaking a JSON parse error to the UI.
- **Dialog auto-close** — generation dialogs close automatically after completion (or after the configured retry budget) instead of staying open.
- **Melo page** — hardening around async result handling.

---

## v7.5.0 (2026-08-15) · Documentation & Logging Overhaul Release

**Documentation Suite (PMP Standard)**
- NEW `docs/SYSTEM_SPEC.md` — PMP System Specification (50+ functional requirements FR-001~FR-151, 71 non-functional requirements NFR-001~NFR-071, system boundaries, constraints, acceptance criteria, glossary)
- NEW `docs/PROGRAM_SPEC.md` — PMP Program Specification (5-layer MVC + Agent architecture, module specs for all 14 controllers / 17 services / 18 pages, data flow diagrams, integration points, API summary, persistence design, logging spec, error handling, security)
- NEW `docs/TECHNICAL_GUIDE.md` — Developer Technical Guide (environment setup, project structure, build & deployment for web/APK/IPA/Electron/Vercel/Netlify/Cloudflare, coding standards, step-by-step guides for adding new pages/API endpoints/AI engines, logging usage examples with all 6 levels + FileAppender, testing, troubleshooting, performance, version management)
- UPDATED `docs/USER_GUIDE.md` — Rewritten from v5.4.0 to v7.5.0 (25 sections covering all 18 pages, GLOBAL AUTO, 10 strategy presets, lyrics engine, studios, library, quality analyzer, batch gen, analytics, audio player, settings, auth, history, i18n, tips, FAQ, troubleshooting)
- UPDATED `README.md` — Rewritten from v5.4.0 to v7.5.0 (badges, 3 AI engines, live demo links, feature highlights, tech stack table, quick start, project structure, mobile apps, deployment, config, API reference, documentation table linking all 10 docs, screenshots, repo zwindhuang-opc/zmusic, contact zwindhuang@qq.com)
- UPDATED `docs/PMP_PROJECT_PLAN.md` — Updated from v1.0.0 to v7.5.0 (all 8 phases marked ✅ Complete, 13 sprints, full version history v1→v7.5, updated risk register with port conflicts RESOLVED and GitHub Pages private repo OPEN, issue log summary, updated resources, pinned ports 4720/4721)
- UPDATED `docs/ISSUE_LOG.md` — Added v7.x resolved issues (i18n 582-key fix, APK black screen, MV translations, Melo validation) and v7.5.0 entries (documentation overhaul ✅, logging file appender ✅, GitHub Pages private repo limitation ⚠️ Open)

**Logging Mechanism Enhancement (log4j-style)**
- `src/utils/logger.js` — Added `FileAppender` class with rolling 5MB file rotation (log4j-style); exported alongside `ConsoleAppender` and `PatternLayout`
- `src/server.js` — Wired FileAppender into BackendServer logger; all server logs now persist to `logs/server.log` (dual appender: console + file); logs/ already in .gitignore
- 6 log levels: TRACE / DEBUG / INFO / WARN / ERROR / FATAL
- Pattern layout: `[YYYY-MM-DDTHH:mm:ss.sssZ] [LEVEL] [Category] - message`
- UTF-8 encoding enforced on Windows via `src/init.js` (process.stdout.setDefaultEncoding('utf8'))

**i18n Cleanup**
- Migrated remaining hardcoded strings to `t()` i18n calls across `App.jsx`, `main.jsx`, and 15 other component/page files
- 75+ new translation keys added to `en.json` / `zh.json` (header.edge_cdp, app.restart, app.retry_render, common.untitled, visual_recommendations, send_to_muse/suno/melo, score_badge_click, six_metrics, feedback, click_to_expand, untitled_song, suffix_songs, zip_building, enter_themes_or_csv, select_at_least_one_engine, queue_built, api_error, response_parse_error, sample_lyrics, simulated_failure, unknown_error, processing_complete, file_parsed_success, file_parse_error, no_completed_results, zip_library_failed, packaged_songs, bundle_failed, engine_muse/suno/melo, strategy.preset_applied, strategy.applied_short, etc.)
- `en.json` and `zh.json` perfectly synchronized with zero mixed CN/EN

**Verification**
- Browser verification: 11+ pages verified working without console errors (Dashboard, Music Studio, Muse AI, Suno AI, Melo AI, Lyrics, Creative Notebook, Image-to-Lyrics, MV, Remix Studio, Settings)
- Backend health endpoint confirms all services configured (apiConfigured, museConfigured, meloConfigured)
- Dev server running on pinned ports: Frontend http://localhost:4720/, Backend http://localhost:4721/

**Version Sync**
- `VERSION.json`: 7.4.1 → 7.5.0 (buildNumber 11 → 12)
- `package.json`: 7.4.1 → 7.5.0
- `android/app/build.gradle`: versionCode 33 → 34, versionName "7.4.1" → "7.5.0"

---

## v7.4.1 (2026-08-15) · APK Black Screen Fix + Assisted Publishing

- Fix APK black screen: AuthProvider/SongLibraryProvider/PlayerProvider imports in App.jsx
- Assisted Publishing: auto-open portal + auto-copy + checklist
- PWA Notifications
- SongLibraryProvider auto-reads auth context
- versionCode 33

---

## v7.4.0 (2026-08-14) · Super Feature Release

**P1 · Song Library & Accounts Phase 1**
- `src/services/auth.service.js` — sha256 password encryption; login/register/logout/update profile; backup export/import under `localStorage.zmusic_users`
- `AuthContext.jsx` (provider + `useAuth()` hook) + `SongLibraryProvider` + `useSongLibrary()` store keyed per userId
- LoginPage: Tab switch 登录 / Register with form validation, Guest Mode single-click entry, global consistent gradient UI
- SongLibrary page: Top engine tabs (All / Muse / Suno / Melo / MV / Favorites / Albums), Albums gradient cards with create-modal, song rows with fav/play/add-to-album/delete/copy/Remix/Publish full action buttons, search + sort, empty artwork state, bulk ZIP/JSON export bar
- AlbumDetail page + auto-migration helper to import pre-P7.4 generation history into library on first login
- Backend thin layer: `library.controller.js` + 8 `/api/auth/*` and `/api/albums|songs` routes

**P2 · Remix Studio Polish**
- History cards inside RemixStudio now show 🔁 A/B对比 button which opens a bottom compare split view
- Left pane: original song (player, meta, lyrics excerpt); Right pane: engine picker + regenerate in any engine

**P3 · Publish Studio Advanced Exports**
- Bitrate selector: 192 / 256 / 320 kbps + Lossless WAV / FLAC labels; filename suffixed by bitrate (e.g. `.bit320.mp3`)
- ZIP Publish Bundle via dynamic ESM `import('JSZip')` from jsdelivr CDN: `audio.mp3 + cover.jpg + metadata.json + lyrics.txt + caption.txt + MANUAL_UPLOAD_STEPS.md` (bilingual platform step-by-step)
- LRC lyrics export: timestamps `[mm:ss.xx]` evenly distributed by duration
- ID3/cover info panel (clarifies ffmpeg required server-side for actual embedding)
- For TikTok/Douyin/RedNote: vertical 1080×1920 toggle with orientation=vertical passthrough

**P4 · Strategy Presets Wired**
- `StrategySelector` embedded at top of `AutoCreativePanel`; selection persisted in `autoConfig.selectedStrategyId`
- In Muse/Suno/Melo AUTO: `applyStrategyPreset(getStrategy(id), snapshot)` called at startAutoGeneration entry + 40s ideation snapshot as defaults; explicit user values always override strategy baseline

**P5 · Song Quality Analyzer**
- `qualityAnalyzer.service.js`: 6-metric heuristic 1-100 scoring (structural 15%, lyrics 25%, duration accuracy 15%, BPM consistency 15%, style match 15%, clarity 15%); bilingual feedback[] strings; thresholds via localStorage
- `QualityScoreBadge.jsx`: clickable pill badge with gradient background + expanded mini-card (6 metric bars + bilingual feedback)
- `useQualityGate.js` hook: belowThreshold, score, reason, regen suggestion
- QualityAnalyzerPage: empty dropdown select, giant circle score ring + 6 metric bars + regen threshold slider (default 55)

**P6 · Persistent Bottom Audio Player**
- `PlayerContext.jsx` provider: currentSong / playlist / isPlaying / currentTime / duration / volume + shuffle/repeat state; play/pause/seek/enqueue/prev/next actions; Audio singleton; 7 MediaSession handlers
- `PersistentAudioPlayer.jsx`: 48-64px glassmorphism bottom bar (marquee title / engine badge / play / prev / next / volume / shuffle / repeat), click to expand into 16:9 mini-player with animated waveform bars, scrub bar, lyrics excerpt. Mounted globally via App.jsx.

**P7 · Batch Generation**
- BatchGenerationPage wizard: manual textarea input OR CSV/JSON upload (mini inline parser), engine checkboxes, strategy preset, queue status cards per item + global N total/X done/Y failed HH:MM:SS elapsed + ETA, sequential execution with `fetch('/api/{engine}/generate')`, completion ZIP of all outputs (JSZip CDN)

**P8 · Analytics Dashboard**
- Reads from `localStorage.zmusic_history` (avoids backend 0 hardcodes)
- 4 KPI cards: total songs + duration, success rate, avg gen time, credit estimate
- 4 zero-library inline charts: Engine bar comparison, CSS conic-gradient style donut, 7×24 week/hour heatmap grid, SVG polyline 7-day area trend
- Publishing metrics, Top-5 habits badges (styles / engines / BPM ranges), CSV report export button

**Wiring + Navigation + Providers**
- App.jsx: lazy loads 6 new pages; sidebar "工作台/Workbench" group (Library / Quality / Batch / Analytics) + Login button or Logout with `user.displayName`; action handlers for logout `isAction` items; `PersistentAudioPlayer` globally mounted
- `AppWithProviders` wrapped: AuthProvider > SongLibraryProvider > PlayerProvider > GenerationProvider > AutoProgressProvider
- Dashboard: Added 4-card Workbench quick-grid (Library/Quality/Batch/Analytics) landing below KPI row

**i18n**
- Added 150+ new keys across 9 namespace prefixes (library, auth, remix, publish_export, strategy, quality, player, batch, analytics) + 8 nav.* keys
- en.json / zh.json perfectly synchronized, zero 中/英 mixing in UI strings

- Build #10 | APK versionCode 32


## v7.3.0 (2026-08-14)

- v7.3.0: i18n overhaul — fixed 582 broken zh.json key-path values (e.g. `actions.下潜` → `下潜`) across actions/emotions/imagery/locations/subjects sections. Migrated hardcoded Chinese strings in RemixStudio.jsx, PublishStudio.jsx, AutoCreativePanel.jsx, AutoProgressBar.jsx to use `t()` i18n calls. Added new i18n sections: `remix` (3 engine description keys), `publish` (6 toast/label keys), `common.untitled`, and 24 new keys in the `auto` section for phase labels, status strings, and panel texts. Verified zero Chinese/English mixing in user-facing UI strings. Synchronized version numbers across VERSION.json, package.json, and android/app/build.gradle.
- Build #9


## v6.7.0 (2026-08-11)

- v6.7.0: AUTO creative thinking panel (shows AI's reasoning for each song) + credit-check-free test mode (stop after 8 consecutive errors) + manual stop button + icon color fixes (Suno=teal, Muse=fuchsia, Melo=amber) + floating ball overlap fix + full-screen desktop screenshots (1920x1080) + Android APK build + iOS project sync
- Build #3


## v6.0.0 (2026-08-07)

- V6.0.0 MAJOR: 100% FREE music generation engine - (1) Added FreeMusicController with Edge TTS (free vocals, no API key) reused from zinteligencevideoagent project; (2) Added HuggingFace MusicGen + Bark (Suno open-source) integration for free instrumental/singing; (3) Created backend proxy for Suno.cn API to fix CORS; (4) Added Muse-style AI Thinking Panel showing 5-step composition plan before generation; (5) Multi-engine selector: Free/Auto/Suno.cn/Tone.js; (6) Added lyrics input field + 6 free voice presets (zh/en); (7) ffmpeg-static for audio mixing; (8) edge_tts_helper.py to avoid Windows CLI encoding issues; (9) Comprehensive logging in generation pipeline
- Build #30


## v5.8.1 (2026-08-06)

- Fixed irrelevant lyrics from photo upload: (1) EasyMode now creates Image element from base64 data URL before analysis, (2) Added semantic subject detection layer - detects people, couples, groups via YCbCr skin tone analysis, (3) Semantic scene classification takes priority over color-based classification, (4) Visual context now includes subject type, person count, selfie detection, (5) createVisualBank boosts vocabulary with couple/portrait/group-specific imagery and actions
- Build #27


## v5.7.0 (2026-07-28)

- Added Easy Mode (简洁模式) - 3-step wizard for elderly and non-technical users, UI mode toggle in sidebar and settings, persistent mode preference, accessibility-friendly design with large fonts and touch targets, elderly-friendly UX requirements documented
- Build #25


## v5.6.0 (2026-07-28)

- Added social media BGM generator, prompt engineering assistant, visual style recommendations from image analysis, Xiaohongshu reference integration with platform-specific templates (小红书/抖音/Bilibili), structured prompt template generation with section presets, instrument selection UI, and comprehensive i18n updates
- Build #24

