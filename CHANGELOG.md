# ZMusic Changelog

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

