# ZMusic AI Platform — Project Management Plan (PMP)

| Field | Value |
|-------|-------|
| **Document Title** | Project Management Plan |
| **Version** | 7.5.0 |
| **Release Date** | 2026-08-15 |
| **Project Manager** | Vincent Huang (zwindhuang@qq.com) |
| **Repository** | https://github.com/zwindhuang-opc/zmusic |
| **Status** | Active Development — v7.5.0 Upcoming Release |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Business Case](#2-business-case)
3. [Project Scope](#3-project-scope)
4. [Work Breakdown Structure (WBS)](#4-work-breakdown-structure-wbs)
5. [Schedule and Timeline](#5-schedule-and-timeline)
6. [Resource Management](#6-resource-management)
7. [Risk Management](#7-risk-management)
8. [Quality Management](#8-quality-management)
9. [Communication Plan](#9-communication-plan)
10. [Change Management](#10-change-management)
11. [Issue Log Summary](#11-issue-log-summary)
12. [Appendix](#12-appendix)

---

## 1. Project Overview

### Project Name
**ZMusic — Real AI Music Generation Platform**

### Project Purpose
Develop a profitable, user-friendly, cross-platform AI music generation platform that integrates three production-grade AI music engines (Muse AI, Suno AI, Melo AI) with a dynamic procedural lyrics engine, MV generation, multi-platform publishing, a song library, quality analysis, batch generation, and analytics — delivered as web, Android, iOS, and desktop apps.

### Project Objectives

#### Original Objectives (Phase 1–8) — All Complete ✅
1. ✅ Build functional Unicorn Agent v7 with FSM-based autonomous decision-making
2. ✅ Integrate Suno.cn API for real music generation (v5.5)
3. ✅ Implement monetization strategy with tier-based pricing model
4. ✅ Create modern React GUI with excellent UX
5. ✅ Establish log4j-style logging mechanism (Console + File appender, 5MB rolling)
6. ✅ Implement JUnit-style testing framework (i18n validate + simulation scripts)
7. ✅ Deploy and preview in IDE (pinned ports 4720/4721)
8. ✅ Complete documentation and version control

#### v7.x Objectives — All Complete ✅
9. ✅ Integrate three AI engines (Muse + Suno + Melo) with per-engine AUTO buttons
10. ✅ Implement GLOBAL AUTO mode (sequential Muse → Suno → Melo with 5s delay)
11. ✅ Implement 10 AUTO Strategy Presets
12. ✅ Build Workbench features: Song Library, Quality Analyzer, Batch Generation, Analytics Dashboard
13. ✅ Implement multi-platform publishing (Douyin/TikTok/Xiaohongshu/YouTube/Qishui)
14. ✅ Add Phase-1 authentication (sha256, guest mode) + Song Library
15. ✅ Add persistent audio player with MediaSession API integration
16. ✅ Build Remix Studio (A/B compare + cross-engine regeneration)
17. ✅ Add Edge Browser CDP integration for login-state detection
18. ✅ Implement Dynamic Procedural Lyrics Engine v6 (30 themes × 30 styles × 5 methods)
19. ✅ Complete bilingual i18n system (150+ synchronized keys)
20. ✅ Dynamic port management with pinned ports (4720/4721) and forbidden-port list

---

## 2. Business Case

### Market Analysis
| Platform | Strength | Weakness |
|----------|----------|----------|
| Suno AI | High efficiency, easy to use | Credits can be expensive |
| Udio AI | Superior audio quality | Slower generation |
| Tencent Music | Large user base | Limited AI features |
| SenseAudio | Chinese market focus | Smaller community |

### Competitive Advantage
- **Three-Engine Unification**: Only platform combining Muse + Suno + Melo in one workspace
- **GLOBAL AUTO**: One-click cross-engine sequential generation
- **Dynamic Procedural Lyrics Engine v6**: Billions of unique combinations, no hardcoded lyrics
- **Multi-Platform Publishing**: Direct publishing to 5 social/music platforms
- **Cross-Platform**: Web + Android APK + iOS IPA + Electron desktop from one codebase
- **Bilingual**: Full Chinese/English support with 150+ synchronized keys

### Revenue Model
| Tier | Monthly Price | Included Credits | Discount |
|------|---------------|------------------|----------|
| Free | $0 | 50/day | 0% |
| Basic | $9.99 | 200/month | 10% |
| Pro | $29.99 | 1,000/month | 20% |
| VIP | $99.99 | 5,000/month | 30% |
| Enterprise | $499.99 | 50,000/month | 50% |

---

## 3. Project Scope

### In Scope
- ✅ Core backend with Unicorn Agent v7 (FSM)
- ✅ Three AI engine integrations (Muse, Suno, Melo)
- ✅ React 18 SPA GUI (18 pages)
- ✅ HTTP REST API server (50+ endpoints)
- ✅ Business logic and monetization model
- ✅ Log4j-style logging (Console + File appender)
- ✅ Testing framework (i18n validate, simulation scripts)
- ✅ Full PMP + API + User + System + Program + Technical documentation
- ✅ Version control and backup scripts
- ✅ Cross-platform: Web, Android (APK), iOS (IPA), Desktop (Electron)
- ✅ Bilingual i18n (Chinese/English)
- ✅ GLOBAL AUTO + 10 Strategy Presets
- ✅ Multi-platform publishing (5 platforms)
- ✅ Song Library + Phase-1 auth
- ✅ Quality Analyzer, Batch Generation, Analytics Dashboard
- ✅ Persistent audio player (MediaSession)
- ✅ Edge Browser CDP integration

### Out of Scope
- Server-side persistent user account database beyond Phase 1 (thin echo endpoints)
- Real-time multi-user collaboration
- Payment processing / credit purchasing flows (handled externally per engine)
- Native music streaming / CDN hosting of generated audio
- Advanced ML model training (platform consumes external AI APIs)
- GitHub Pages deployment for private repositories (limitation — see Risks)

---

## 4. Work Breakdown Structure (WBS)

### Phase 1: Architecture & Design ✅
```
1.1 Project Structure Setup ✅
1.2 Configuration Module ✅
1.3 Version Control Setup ✅
```

### Phase 2: Core Backend ✅
```
2.1 Unicorn Agent v7 (FSM) ✅
2.2 Logging System (log4j-style + FileAppender) ✅
2.3 HTTP Server Setup (Express 5) ✅
```

### Phase 3: Frontend GUI ✅
```
3.1 React 18 SPA Components ✅
3.2 18 Lazy-Loaded Pages ✅
3.3 Contexts + Stores (Auth/Player/AutoProgress/Generation/SongLibrary) ✅
```

### Phase 4: AI Engine Integration ✅
```
4.1 Suno.cn API (v5.5) ✅
4.2 Muse.top API (JWT + App-Key + CDP fallback) ✅
4.3 Melo API (MS55 multi-layer) ✅
4.4 Task Management + Polling ✅
```

### Phase 5: Business Logic & Workbench ✅
```
5.1 Credit System (per-engine) ✅
5.2 User Management (Phase-1 sha256 auth + guest) ✅
5.3 Song Library + Albums + Favorites ✅
5.4 Quality Analyzer (6-metric scoring) ✅
5.5 Batch Generation (CSV/queue/ETA) ✅
5.6 Analytics Dashboard (charts from localStorage) ✅
```

### Phase 6: Studios & Publishing ✅
```
6.1 Remix Studio (A/B + cross-engine) ✅
6.2 Publish Studio (5 platforms + JSZip bundle) ✅
6.3 AUTO Strategy Presets (10 presets) ✅
6.4 GLOBAL AUTO mode ✅
```

### Phase 7: Testing & Documentation ✅
```
7.1 i18n Validation (zh/en parity) ✅
7.2 Simulation Scripts ✅
7.3 PMP Documentation (System Spec, Program Spec, Project Plan) ✅
7.4 API Documentation ✅
7.5 User Guide + Technical Guide ✅
```

### Phase 8: Deployment ✅
```
8.1 Build Configuration (Vite + esbuild) ✅
8.2 IDE Preview (pinned ports 4720/4721) ✅
8.3 GitHub Actions (web + APK + release + Pages non-fatal) ✅
8.4 Vercel / Netlify / Cloudflare Pages ✅
8.5 Electron Desktop Build ✅
8.6 iOS IPA via GitHub Actions ✅
```

---

## 5. Schedule and Timeline

### Sprint Planning (Agile/Scrum)

| Sprint | Version | Goals | Status |
|--------|---------|-------|--------|
| Sprint 1 | v1.0.0 | Architecture, Config, Version | ✅ Complete |
| Sprint 2 | v1.x | Unicorn Agent, Logging, HTTP Server | ✅ Complete |
| Sprint 3 | v5.x | React GUI, Suno Integration | ✅ Complete |
| Sprint 4 | v5.4.0 | Dynamic Lyrics Engine v6, MV, History | ✅ Complete |
| Sprint 5 | v6.x | Muse AI integration, expanded styles | ✅ Complete |
| Sprint 6 | v6.6.6 | Melo AI, CDP bridges, port pinning, ERR_ABORTED fix | ✅ Complete |
| Sprint 7 | v6.8.0 | History persistence, engine color themes, AUTO config | ✅ Complete |
| Sprint 8 | v7.0.0 | MV sub-pages (Muse/Suno/Melo MV) + AUTO mode | ✅ Complete |
| Sprint 9 | v7.1.0–v7.2.1 | Creative Notebook, Remix/Publish Studios, sidebar reorg, brand icons, APK | ✅ Complete |
| Sprint 10 | v7.3.0 | i18n overhaul (582 broken keys fixed, t() migration) | ✅ Complete |
| Sprint 11 | v7.4.0 | SUPER FEATURE: Library/Accounts, Remix A/B, Publish exports, Strategy presets, Quality analyzer, Audio player, Batch gen, Analytics | ✅ Complete |
| Sprint 12 | v7.4.1 | Stabilization, version sync | ✅ Complete |
| Sprint 13 | v7.5.0 | Documentation overhaul, logging file appender, PMP docs (System/Program/Technical specs) | ✅ Complete |

### Version History

```
v1.0.0  → Initial Release (Unicorn Agent, Suno, Console GUI)
v5.x    → React SPA, Dynamic Lyrics Engine v6, MV, History persistence
v5.4.0  → Stable lyrics/MV/music release
v6.x    → Muse AI integration, expanded styles (30+), themes (30+)
v6.6.6  → Melo AI, CDP bridges, port pinning (4720/4721), ERR_ABORTED fix
v6.8.0  → History persistence fix, engine color themes, AUTO config
v7.0.0  → MV sub-pages (Muse/Suno/Melo MV) with AUTO mode
v7.1.0  → Creative Notebook, AUTO copy buttons, Melo song_length fix
v7.2.0  → Sidebar reorg, Remix/Publish Studios, enhanced auto-creative
v7.2.1  → Brand icons, signed APK, versioning scripts, screenshots
v7.3.0  → i18n overhaul (582 keys fixed, t() migration)
v7.4.0  → SUPER FEATURE: Library/Accounts + Remix A/B + Publish exports +
          Strategy presets + Quality analyzer + Audio player + Batch gen +
          Analytics + 150+ i18n keys
v7.4.1  → Stabilization
v7.5.0  → Documentation overhaul (System/Program/Technical specs),
          logging file appender, PMP documentation refresh (CURRENT)
```

---

## 6. Resource Management

### Team Structure
| Role | Responsibility | Assignment |
|------|---------------|------------|
| Project Manager | Overall coordination | Vincent Huang |
| Backend Developer | Agent, API, Logging, Services | AI Assistant |
| Frontend Developer | GUI, UX, Contexts, Stores | AI Assistant |
| QA Engineer | Testing, i18n validation | AI Assistant |
| Documentation | PMP, System/Program/Technical/User docs | AI Assistant |

### Technical Resources
- **Runtime**: Node.js v18+ (ES Modules, JavaScript)
- **Frontend**: React 18 + Vite 5.4 + Tailwind CSS
- **Mobile**: Capacitor 6 (Android + iOS)
- **Desktop**: Electron 43
- **Database**: better-sqlite3 + Prisma (i18n)
- **AI APIs**: Muse (muse.top), Suno (suno.cn), Melo (melo.bytedance.com)
- **IDE**: Trae IDE
- **Pinned Ports**: Frontend 4720, Backend 4721 (FORBIDDEN: 5500/5501/5502, 5173, 3000, 8000)
- **Repository**: GitHub — https://github.com/zwindhuang-opc/zmusic (contact: zwindhuang@qq.com)
- **CI/CD**: GitHub Actions, Vercel, Netlify, Cloudflare Pages

> **Note**: The old GitHub account `vcfhuang@qq.com` is deprecated. The active repository is `zwindhuang-opc/zmusic` with contact `zwindhuang@qq.com`.

---

## 7. Risk Management

### Risk Register

| Risk ID | Description | Probability | Impact | Status | Mitigation |
|---------|-------------|-------------|--------|--------|------------|
| R001 | API key expires | Low | High | ⚠️ Open | Implement key rotation; document re-login flows |
| R002 | Suno/Muse/Melo API changes | Medium | High | ⚠️ Open | Abstract API layer in services |
| R003 | Port conflicts | Low | Medium | ✅ Resolved | Pinned ports 4720/4721; forbidden-port list; `npm start` auto-kills lingering processes |
| R004 | Credit abuse | Medium | Medium | ⚠️ Open | Rate limiting; credit bypass only for flow testing |
| R005 | Data loss | Low | High | ✅ Resolved | Git backup scripts; localStorage + file-based history with auto-cleanup |
| R006 | Performance issues | Medium | Medium | ✅ Resolved | Lazy loading, code splitting, 60s polling, retry logic |
| R007 | Muse server-side session expiry (~24h) | Medium | High | ⚠️ Open | Banner + re-login instructions; auto-detect on 60s health poll; diagnostic scripts |
| R008 | GitHub Pages blocked on private repo | High | Low | ⚠️ Open | `continue-on-error` non-fatal; awaiting plan upgrade or repo public conversion |
| R009 | GitHub push transient network resets (GFW) | Medium | Low | ⚠️ Open | Retry when connectivity returns |
| R010 | better-sqlite3 segfault in CI | Low | Medium | ✅ Resolved | Use `i18n:validate` (JSON parity) in CI instead of DB-dependent commands |

---

## 8. Quality Management

### Quality Standards
- ✅ All functions have JSDoc documentation comments
- ✅ No hardcoded user-facing strings (use `t()` translation function)
- ✅ Log4j-style logging for all operations (6 levels, Console + File appender)
- ✅ i18n parity validation (`npm run i18n:validate`) on every build
- ✅ Semantic versioning (MAJOR.MINOR.PATCH) via `VERSION.json`
- ✅ Clean code principles (ES Modules, single `handleRoute` registry)
- ✅ All 18 pages lazy-loaded for performance

### Testing Requirements
- i18n parity test (`npm run i18n:validate`) — must pass before build
- Production build (`npm run build`) — 0 errors required
- Simulation script (`scripts/simulate-generation.mjs`) — smoke test
- Manual smoke checks: health endpoint, page rendering, GLOBAL AUTO, language toggle

---

## 9. Communication Plan

### Reporting Schedule
- **Daily**: Progress updates via logs (`logs/server.log`)
- **Daily**: Git commits
- **Weekly**: Sprint review + documentation sync
- **Per-release**: GitHub Release with tag + changelog

### Documentation Updates
- Real-time: Code comments (JSDoc)
- Daily: Git commits
- Weekly: Documentation sync (PMP, User Guide, Technical Guide)
- Per-release: System/Program/Technical specs refreshed

---

## 10. Change Management

### Change Control Process
1. Submit change request
2. Impact analysis
3. Approval decision
4. Implementation
5. Verification (build + i18n validate)
6. Documentation update

### Version Control Strategy
```
v1.0.0  → Initial Release (Unicorn Agent + Suno + Console GUI)
v5.x    → React SPA + Dynamic Lyrics Engine v6 + MV + History
v6.x    → Muse + Melo integration + CDP bridges + port pinning
v7.0.x  → MV sub-pages + AUTO mode
v7.1.x  → Creative Notebook + AUTO copy buttons
v7.2.x  → Sidebar reorg + Remix/Publish Studios + brand icons + APK
v7.3.x  → i18n overhaul (582 keys fixed)
v7.4.x  → SUPER FEATURE release (Library/Accounts + Workbench + Studios)
v7.5.0  → Documentation overhaul + logging file appender (CURRENT)
```

Semantic versioning: MAJOR (breaking), MINOR (new features), PATCH (fixes/docs).

---

## 11. Issue Log Summary

Detailed issue tracking is maintained in [ISSUE_LOG.md](ISSUE_LOG.md).

| Status | Count | Examples |
|--------|-------|----------|
| ✅ Resolved | 8 | API key format, port restrictions, ERR_ABORTED, style options, Melo char floor, i18n fixes, APK black screen, MV translations |
| ⚠️ Open | 3 | Muse session expiry, GitHub push resets, GitHub Pages private repo limitation |
| 🔄 In Progress | 0 | — |

### v7.5.0 New Entries
- Documentation overhaul (System/Program/Technical specs created) — ✅ Resolved
- Logging file appender added (FileAppender, 5MB rolling) — ✅ Resolved
- GitHub Pages private repo limitation — ⚠️ Open (awaiting plan upgrade or repo public conversion)

See [ISSUE_LOG.md](ISSUE_LOG.md) for full details.

---

## 12. Appendix

### References
- [System Specification](SYSTEM_SPEC.md) — Requirements baseline
- [Program Specification](PROGRAM_SPEC.md) — Module specs + data flows
- [Technical Guide](TECHNICAL_GUIDE.md) — Developer guide
- [User Guide](USER_GUIDE.md) — End-user guide
- [Issue Log](ISSUE_LOG.md) — Issue tracking
- [Architecture](ARCHITECTURE.md) — System architecture
- [API Documentation](../API_DOCUMENTATION.md) — REST API reference
- [Scrum Plan v5.1.0](PMP_SCRUM_PLAN_v5.1.0.md) — Sprint plan

### Project Files
```
e:\AI_Projects\zmusic\
├── src/
│   ├── agents/          # Unicorn Agent v7
│   ├── controllers/     # 14 HTTP controllers
│   ├── services/        # 17 services
│   ├── pages/           # 18 React pages
│   ├── components/      # Reusable components
│   ├── contexts/        # Auth/Player/AutoProgress
│   ├── stores/          # Generation/SongLibrary stores
│   ├── routes/index.js  # Central route registry
│   ├── utils/           # logger, dynamicLyricsEngine, autoConfig
│   ├── i18n/            # zh.json + en.json (150+ keys)
│   └── server.js        # Backend server
├── android/             # Android (Capacitor 6, signed APK)
├── ios/                 # iOS (Capacitor 6)
├── electron/            # Desktop (Electron 43)
├── docs/                # Documentation
├── scripts/             # version.js, release.mjs, backup.js
├── VERSION.json         # Single source of truth
├── package.json
└── .env                 # Environment config (pinned ports 4720/4721)
```

---

*Last Updated: 2026-08-15 · Document Version: 7.5.0*
