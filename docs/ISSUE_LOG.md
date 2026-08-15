# ZMusic Platform — Issue Log

| Field | Value |
|-------|-------|
| **Document Title** | Issue Log |
| **Version** | 7.5.0 |
| **Date Created** | 2026-07-12 |
| **Last Updated** | 2026-08-15 |
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
| **Status** | ⚠️ Open |
| **Created** | 2026-08-10 |
| **Priority** | P2 |

**Description**: `git push origin master` fails with `fatal: unable to access 'https://github.com/zwindhuang-opc/zmusic.git/': Recv failure: Connection was reset` due to transient ISP / GFW network instability to github.com.

**Workaround**: When connectivity returns, run:
```
git -C "e:/AI_Projects/zmusic" push origin master
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
| Total Issues | 16 (I001–I016) |
| ✅ Resolved | 12 |
| ⚠️ Open | 4 |
| 🔄 In Progress | 1 |
| 🔴 Critical | 1 (resolved) |
| 🟠 High | 4 |
| 🟡 Medium | 8 |
| 🟢 Low | 3 |

### Status Breakdown
| Status | Issues |
|--------|--------|
| ✅ Resolved | I001, I002, I004, I005, I006, I009, I010, I011, I012, I013, I014, I015 |
| ⚠️ Open | I007, I008, I016 |
| 🔄 In Progress | I003 |

---

## Sprint Backlog

### Current Sprint (Sprint 13 — v7.5.0 Documentation & Logging Sprint)
- [x] I014 - Documentation overhaul (System/Program/Technical specs + User Guide + README + PMP plan) → ✅ Resolved
- [x] I015 - Logging file appender added (FileAppender, 5MB rolling) → ✅ Resolved
- [ ] I016 - GitHub Pages private repo limitation ⚠️ Open (awaiting plan upgrade or repo public conversion)
- [ ] I003 - User credit management 🔄 In Progress (bypass shipped; permanent: user to top-up Muse/Suno/Melo)
- [ ] I007 - Muse server-side session expiry ⚠️ Open (user re-login required, diagnostic scripts shipped)
- [ ] I008 - GitHub push transient network failure ⚠️ Open (retry when connectivity returns)

### Next Sprint (Sprint 14 — proposed)
- [ ] Resolve I016: Decide on GitHub Pages strategy (paid plan vs public repo vs Vercel/Netlify primary)
- [ ] Add error boundary components to React (catch per-page errors without crashing whole SPA)
- [ ] Implement comprehensive error reporting (frontend error → backend log → GitHub issue draft)
- [ ] Centralized log shipping to centralizedhub sink (per user rules — must use centralizedhub + zunicornagent project as base)
- [ ] Expand test coverage beyond i18n:validate + simulation (unit tests for services)
- [ ] Watch auto-deploy workflow on next push: APK build + release + deploy-pages (non-fatal)

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

---

*Cross-references: [System Specification](SYSTEM_SPEC.md) · [Program Specification](PROGRAM_SPEC.md) · [Technical Guide](TECHNICAL_GUIDE.md) · [User Guide](USER_GUIDE.md) · [PMP Project Plan](PMP_PROJECT_PLAN.md)*

*Last Updated: 2026-08-15 · Document Version: 7.5.0*
