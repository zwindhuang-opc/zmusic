# ZMusic — System Specification (PMP)

| Field | Value |
|-------|-------|
| **Project Name** | ZMusic — Real AI Music Generation Platform |
| **Document Title** | System Specification |
| **Version** | 7.5.0 |
| **Date** | 2026-08-15 |
| **Author** | Vincent Huang (zwindhuang@qq.com) |
| **Repository** | https://github.com/zwindhuang-opc/zmusic |
| **License** | MIT |
| **Status** | Approved — Upcoming Release |
| **Document Status** | Final |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [System Boundaries](#3-system-boundaries)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [System Interfaces](#6-system-interfaces)
7. [System Constraints](#7-system-constraints)
8. [Assumptions and Dependencies](#8-assumptions-and-dependencies)
9. [Acceptance Criteria](#9-acceptance-criteria)
10. [Glossary](#10-glossary)

---

## 1. Executive Summary

ZMusic is a full-stack, cross-platform AI music generation platform that integrates three production-grade AI music engines — **Muse AI**, **Suno AI**, and **Melo AI** — into a single bilingual (Chinese/English) workspace. The platform is built on a strict **Model–View–Controller (MVC) + Agent** architecture and ships as a web application, an Android APK, an iOS IPA, and a desktop Electron build.

Version 7.5.0 consolidates 18 feature pages, a Unicorn Agent v7 finite-state-machine generation orchestrator, a Dynamic Procedural Lyrics Engine v6, a unified GLOBAL AUTO mode that drives all three engines sequentially, a persistent audio player with MediaSession integration, a multi-platform social publishing studio, a song library with Phase-1 authentication, and analytics dashboards.

This System Specification defines the functional and non-functional requirements, system boundaries, interfaces, constraints, and acceptance criteria for the v7.5.0 release. It is the authoritative requirements baseline referenced by the [Program Specification](PROGRAM_SPEC.md), the [Technical Guide](TECHNICAL_GUIDE.md), and the [PMP Project Plan](PMP_PROJECT_PLAN.md).

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Web (React) │  │ Android (APK)│  │  iOS (IPA)   │  │Electron Desktop│ │
│  │  Vite 5.4    │  │ Capacitor 6  │  │ Capacitor 6  │  │  Electron 43 │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │
│         └──────────────────┴─────────────────┴─────────────────┘        │
│                            React 18 SPA                                 │
│  Pages (18) · Contexts · Stores · Components · i18n (zh/en)             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / fetch (pinned ports 4720/4721)
┌────────────────────────────────────▼────────────────────────────────────┐
│                       APPLICATION TIER (Node.js 18+)                    │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Express 5 Server  ·  src/routes/index.js (handleRoute)          │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  Controllers (14): health, music, lyrics, mv, agent, history,    │   │
│  │    suno, muse, melo, freemusic, vision, content, publish, library│   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  Services (17): suno, muse, melo, lyrics, mv, history, auth,     │   │
│  │    browserStatus, douyin, socialPublish, qualityAnalyzer,        │   │
│  │    content, freemusic, generation, vision, api.client,           │   │
│  │    notification                                                  │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  Agent Layer: src/agents/unicorn-agent.js (FSM v7)               │   │
│  ├──────────────────────────────────────────────────────────────────┤   │
│  │  Utils: logger (log4j-style) · dynamicLyricsEngine v6            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────┬──────────────────┬──────────────────┬──────────────────┬──────┘
          │                  │                  │                  │
┌─────────▼─────────┐ ┌──────▼───────┐ ┌────────▼────────┐ ┌──────▼──────┐
│   Muse AI API     │ │  Suno API    │ │   Melo API      │ │ Edge CDP    │
│  muse.top         │ │  suno.cn     │ │ melo.bytedance  │ │ port 9222   │
│  JWT + App-Key    │ │  API Key     │ │ MS55 model_code │ │ (login detect)│
└───────────────────┘ └──────────────┘ └─────────────────┘ └─────────────┘
          │
┌─────────▼───────────────────────────────────────────────────────────────┐
│                       PERSISTENCE TIER                                  │
│  .history/ (JSON, 200 max) · localStorage (100 max) · better-sqlite3 +  │
│  Prisma (i18n) · logs/server.log (rolling 5MB)                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Architectural Layers

| Layer | Responsibility | Location |
|-------|----------------|----------|
| **View** | React pages & components, lazy-loaded | `src/pages/`, `src/components/` |
| **Controller** | HTTP request handling, validation, response shaping | `src/controllers/` |
| **Service** | Business logic, external API orchestration | `src/services/` |
| **Agent** | FSM-based generation orchestration | `src/agents/unicorn-agent.js` |
| **Model** | Data access, persistence, lyrics engine | `src/utils/`, `src/stores/` |

---

## 3. System Boundaries

### 3.1 In Scope

- Web application (React 18 + Vite 5.4) accessible at pinned port 4720
- Backend API server (Express 5, ES Modules) at pinned port 4721
- Integration with three AI music engines: Muse AI, Suno AI, Melo AI
- Mobile applications: Android APK (signed) and iOS IPA (via GitHub Actions)
- Desktop application (Electron 43)
- Dynamic Procedural Lyrics Engine v6 (30 themes × 30 styles × 5 methods)
- Unicorn Agent v7 FSM orchestrator
- GLOBAL AUTO mode (sequential Muse → Suno → Melo generation)
- 10 AUTO Strategy Presets
- Multi-platform publishing (Douyin, TikTok, Xiaohongshu, YouTube, Qishui Music)
- Song Library with Phase-1 authentication (sha256, guest mode)
- Quality Analyzer (6-metric scoring)
- Batch Generation (CSV/JSON, queue with ETA)
- Analytics Dashboard (KPIs, charts, CSV export)
- Persistent Audio Player with MediaSession API
- Bilingual i18n system (zh/en, 150+ keys)
- Edge Browser CDP integration (port 9222) for login-state detection
- Log4j-style logging (ConsoleAppender + FileAppender, 5MB rolling)
- Version management (VERSION.json, semantic versioning)
- CI/CD via GitHub Actions, Vercel, Netlify, Cloudflare Pages

### 3.2 Out of Scope

- Server-side user account database with persistent sessions beyond Phase 1 (thin echo endpoints)
- Real-time multi-user collaboration
- Payment processing / credit purchasing flows (handled externally on each engine's site)
- Native music streaming / CDN hosting of generated audio (audio served via engine URLs + CORS proxy)
- Advanced ML model training (platform consumes external AI APIs; no in-house model training)
- GitHub Pages deployment for private repositories (limitation — see Constraints)

---

## 4. Functional Requirements

Functional requirements are numbered `FR-XXX`. Each maps to one or more feature pages or engine integrations.

### 4.1 Dashboard & Navigation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | The system shall display a Dashboard as the landing page with KPI cards (total generations, library size, analytics summary). | High |
| FR-002 | The system shall provide a Workbench quick-access row of cards linking to Library, Quality, Batch, and Analytics. | Medium |
| FR-003 | The Dashboard shall display AI status indicators for Muse, Suno, Melo, and Edge CDP connection state, refreshed every 60 seconds. | High |
| FR-004 | The system shall provide a sidebar navigation grouped into: Dashboard, Music Generation (Music Studio/Muse/Suno/Melo), Lyrics (Lyrics/Image-to-Lyrics/Creative Notebook), MV, Studios (Remix/Publish), Workbench (Library/Quality/Batch/Analytics), Settings, Login. | High |

### 4.2 Music Generation — Three AI Engines

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-010 | The system shall provide a **Music Studio** page using the Unicorn Agent v7 FSM to coordinate lyrics + music generation with 4 methods (basic, network, time, variation). | High |
| FR-011 | The system shall provide a **Muse AI** page for natural-language music generation, authenticated via JWT (AuthToken header + App-Key header), with a CDP fallback through Edge on port 9222. | High |
| FR-012 | The system shall provide a **Suno AI** page for structured music generation (v5.5) using API-key authentication, with style/duration/BPM parameters. | High |
| FR-013 | The system shall provide a **Melo AI** page for advanced multi-layer composition via `POST /agent/api/v1/music/generate` with `model_code MS55`, default duration 240s. | High |
| FR-014 | Each engine page (Muse/Suno/Melo) shall provide an **AUTO button** that triggers automated sequential generation using configured presets. | High |
| FR-015 | Each engine page shall display a **history panel** with a refresh button showing previously generated songs ("历史音乐" section). | Medium |
| FR-016 | The system shall support **Easy Mode** (3-step wizard, large fonts, emoji mood selection) and **Expert Mode** (full controls) toggled in the UI. | Medium |

### 4.3 GLOBAL AUTO & Strategy Presets

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-020 | The system shall provide a **GLOBAL AUTO** button on the main page that triggers simultaneous generation across Muse → Suno → Melo sequentially with a 5-second delay between engines. | High |
| FR-021 | GLOBAL AUTO state shall be shared across pages via `localStorage` so navigation does not interrupt an in-progress AUTO run. | High |
| FR-022 | The system shall provide **10 AUTO Strategy Presets** (流行抓耳, 民谣叙事, 电子氛围, 摇滚能量, 古风古韵, 治愈清新, 嘻哈律动, 史诗磅礴, 情歌浪漫, 先锋实验) stored in `src/data/creativePresets.js`. | Medium |
| FR-023 | The selected strategy preset shall be persisted via `getAutoConfig`/`setAutoConfig` and applied in Muse/Suno/Melo AUTO start, with explicit user values overriding preset defaults. | Medium |

### 4.4 Lyrics Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-030 | The system shall provide a **Lyrics Generation** page using the Dynamic Procedural Engine v6 with 30 themes, 30 styles, and 5 methods. | High |
| FR-031 | The lyrics page shall display a 创作脚本 (creative script) panel at the top for ideation input. | Medium |
| FR-032 | The system shall support a **complexity slider** (1–10) controlling output detail. | Medium |
| FR-033 | The system shall support **Mix Mode** to combine 2–3 themes and 2–3 styles for cross-genre hybrid lyrics. | Medium |
| FR-034 | Easy Mode lyrics shall use a 3-step wizard with emoji mood selection. | Low |

### 4.5 Image-to-Lyrics & Vision

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-040 | The system shall provide a standalone **Image-to-Lyrics** page that analyzes an uploaded image via `/api/vision/analyze` and generates lyrics derived from the image content. | Medium |

### 4.6 MV Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-050 | The system shall provide an **MV page** with 3 sub-tabs: Muse MV, Suno MV, Melo MV, each with AUTO mode. | High |
| FR-051 | Each MV sub-tab shall produce time-stamped scene descriptions, camera movements, color grading, and instrument-to-scene mapping. | Medium |

### 4.7 Creative Notebook

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-060 | The system shall provide a **Creative Notebook** (创作构思记录簿) dedicated history page with copy and Send-to buttons for each entry. | Medium |

### 4.8 Remix Studio

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-070 | The system shall provide a **Remix Studio** with A/B side-by-side comparison and cross-engine regeneration (re-master a track using a different engine). | Medium |

### 4.9 Publish Studio

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-080 | The system shall provide a **Publish Studio** supporting 5 platforms: Douyin, TikTok, Xiaohongshu, YouTube, and Qishui Music, with OAuth + chunked upload. | Medium |
| FR-081 | Publish Studio shall support **JSZip bundle export** (MP3 + cover + metadata.json + lyrics.txt + caption.txt + MANUAL_UPLOAD_STEPS.md). | Medium |
| FR-082 | Publish Studio shall support bitrate selection (192/256/320 + Lossless), `.lrc` lyrics export with timestamps, ID3 info panel, and a vertical 1080×1920 video toggle. | Low |

### 4.10 Song Library & Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-090 | The system shall provide a **Login Page** with Phase-1 authentication using sha256 password hashing and a guest mode. | High |
| FR-091 | The system shall provide a **Song Library** with engine tabs, albums, favorites, search/sort, and bulk ZIP/JSON export. | High |
| FR-092 | The Song Library shall auto-migrate entries from generation history. | Medium |
| FR-093 | The system shall provide an **Album Detail** page. | Medium |

### 4.11 Quality Analyzer

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-100 | The system shall provide a **Quality Analyzer** with 6 metrics scored 1–100: structural, lyrics, duration, bpm, style, clarity. | Medium |
| FR-101 | The analyzer shall display a `QualityScoreBadge` and expose a `useQualityGate` threshold hook. | Low |

### 4.12 Batch Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-110 | The system shall provide a **Batch Generation** page accepting CSV/JSON upload or manual textarea input, with engine checkboxes and strategy preset selection. | Medium |
| FR-112 | Batch Generation shall run a sequential queue with per-item status cards (queued/running/done/failed), global status, and ETA calculated from the first-job average. | Medium |
| FR-113 | Batch output shall be packaged as a ZIP bundle (MP3 + cover + metadata). | Low |

### 4.13 Analytics Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-120 | The system shall provide an **Analytics Dashboard** with 4 KPI cards and 4 inline SVG/CSS charts: engine comparison bars, style donut, 7×24 heatmap, 7-day trend. | Medium |
| FR-121 | The Analytics Dashboard shall derive data from localStorage history and publishing metrics, and support CSV report export. | Low |

### 4.14 Persistent Audio Player

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-130 | The system shall provide a **persistent bottom audio player** with prev/next/seek/volume/shuffle/repeat controls, globally mounted. | Medium |
| FR-131 | The player shall integrate the **MediaSession API** (metadata, position state, 7 action handlers) and provide an expandable mini-player with animated waveform + lyrics excerpt scroller. | Low |

### 4.15 Settings & History

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-140 | The system shall provide a **Settings** page with AUTO configuration: song count 1–20, countdown 10–120s, auto-chain, stop-on-error, and per-engine overrides. | High |
| FR-141 | The system shall persist client history in `localStorage` (max 100 entries) and server history in `.history/` (max 200 entries) with automatic oldest-entry cleanup. | High |
| FR-142 | The system shall provide history CRUD endpoints and statistics. | Medium |

### 4.16 i18n

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-150 | The system shall provide a bilingual interface (Chinese/English) with 150+ synchronized keys, toggled from the UI. | High |
| FR-151 | The i18n system shall use `better-sqlite3` + Prisma for storage and `zh.json` + `en.json` locale files, validated via `npm run i18n:validate`. | Medium |

---

## 5. Non-Functional Requirements

Non-functional requirements are numbered `NFR-XXX`.

### 5.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | The web application shall lazy-load all 18 pages to keep the initial bundle minimal. | Code-split per route |
| NFR-002 | The Dashboard health/status poll shall run at most once every 60 seconds to avoid load. | 60s polling interval |
| NFR-003 | The backend API shall respond to health checks within 500ms under normal load. | < 500ms |
| NFR-004 | Production builds shall pass `npm run build` (i18n validate + bundle API + vite build) with 0 errors. | 0 build errors |

### 5.2 Security

| ID | Requirement |
|----|-------------|
| NFR-010 | Passwords shall be hashed with sha256 before storage (Phase-1 auth). |
| NFR-011 | AI engine JWTs (Muse) shall never be sent to the browser; all generation goes through the `/api/muse` proxy. |
| NFR-012 | The audio proxy (`/api/proxy/audio`) shall bypass CORS only for external audio URLs and set a restrictive User-Agent. |
| NFR-013 | Publish credentials shall be stored server-side and managed via `/api/publish/credentials`. |
| NFR-014 | The Android APK shall be signed with a self-signed certificate (valid 10000 days). |

### 5.3 Reliability

| ID | Requirement |
|----|-------------|
| NFR-020 | The client shall remain functional offline for history browsing (localStorage) even when the backend is unreachable. |
| NFR-021 | The API client shall implement automatic retry (max 2 retries with 1s/2s backoff) for transient failures. |
| NFR-022 | Logging shall never crash the application (FileAppender wraps all fs operations in try/catch). |
| NFR-023 | The logger FileAppender shall rotate the log file at 5MB. |

### 5.4 Usability

| ID | Requirement |
|----|-------------|
| NFR-030 | The UI shall provide an Easy Mode (3-step wizard, large fonts, emoji selection) and Expert Mode for all skill levels. |
| NFR-031 | The interface shall be fully bilingual (zh/en) with no hardcoded user-facing strings. |
| NFR-032 | A persistent audio player shall remain accessible across all pages via a bottom bar. |

### 5.5 Scalability

| ID | Requirement |
|----|-------------|
| NFR-040 | History storage shall auto-cleanup oldest entries when capacity (100 client / 200 server) is reached. |
| NFR-041 | The serverless Netlify function bundle shall be built with esbuild for tree-shaking and size reduction. |

### 5.6 Maintainability

| ID | Requirement |
|----|-------------|
| NFR-050 | The codebase shall follow ES Modules and JSDoc commenting conventions. |
| NFR-051 | All routes shall be registered in a single `handleRoute` function in `src/routes/index.js` for centralised maintainability. |
| NFR-052 | Version shall be managed via a single source of truth (`VERSION.json`) with scripts (`version.js`, `release.mjs`). |

### 5.7 Portability

| ID | Requirement |
|----|-------------|
| NFR-060 | The application shall deploy to Web, Android (APK), iOS (IPA), and Desktop (Electron) from one codebase. |
| NFR-061 | The application shall deploy to GitHub Actions, Vercel, Netlify, and Cloudflare Pages. |
| NFR-062 | The application shall run on Node.js 18+ across operating systems (Windows, macOS, Linux). |

### 5.8 Internationalization

| ID | Requirement |
|----|-------------|
| NFR-070 | All locale files (`zh.json`, `en.json`) shall remain synchronized (validated by `i18n:validate`). |
| NFR-071 | No user-facing string shall be hardcoded; all shall use the `t()` translation function. |

---

## 6. System Interfaces

### 6.1 Frontend Interface

- **Framework**: React 18 + Vite 5.4 + Tailwind CSS + Lucide Icons
- **State**: React Contexts (`AuthContext`, `PlayerContext`, `AutoProgressContext`) + Stores (`generationStore`, `songLibraryStore`)
- **Routing**: Client-side, lazy-loaded page components registered in `App.jsx`
- **API Access**: `src/services/api.client.js` (fetch-based with retry)

### 6.2 Backend Interface

- **Runtime**: Node.js 18+ / Express 5, ES Modules
- **Entry**: `src/server.js`
- **Route Registry**: `src/routes/index.js` (`handleRoute`)
- **Base URL**: `http://localhost:4721/api`

### 6.3 Mobile Interface

- **Bridge**: Capacitor 6
- **Android**: Gradle build, signed APK (`android/keystore/zmusic.jks`)
- **iOS**: Xcode project, IPA built via GitHub Actions macOS runners

### 6.4 Desktop Interface

- **Runtime**: Electron 43
- **Entry**: `electron/main.js` + `electron/preload.js`
- **Build**: `electron-builder` (NSIS for Windows, DMG for macOS, deb/rpm/AppImage for Linux)

### 6.5 External API Interfaces

| Interface | Endpoint | Auth |
|-----------|----------|------|
| Muse AI | `https://project-api.atmob.com` (muse.top) | JWT (AuthToken) + App-Key header; CDP fallback |
| Suno AI | `https://mcp.suno.cn` | API Key (`sk-xxx`) |
| Melo AI | `https://melo.bytedance.com` (`/agent/api/v1/music/generate`) | Session-based; `model_code MS55` |
| Edge CDP | `http://localhost:9222` | Chrome DevTools Protocol (login detection only) |

---

## 7. System Constraints

| ID | Constraint | Impact |
|----|-----------|--------|
| C-001 | **Forbidden ports**: 5500, 5501, 5502, 5173, 3000, 8000. Pinned ports must be `FRONTEND_PORT=4720` and `BACKEND_PORT=4721`. | Avoids conflicts with IDE/legacy previews. |
| C-002 | **GitHub Pages** deployment requires the repository to be public OR a paid GitHub plan. The repo is currently private, so Pages deploy is `continue-on-error` (non-fatal). | Pages preview unavailable until plan upgrade or repo made public. |
| C-003 | **Edge Browser CDP** integration requires a running Edge browser launched with `--remote-debugging-port=9222`. The system shall NEVER launch a new browser window. | User must start Edge manually in debug mode for login-state detection. |
| C-004 | **Muse sessions** expire server-side (~24h inactivity) independently of the JWT `exp` claim; only an interactive phone+SMS login refreshes the session. | Periodic manual re-login required for Muse. |
| C-005 | **Suno/Melo credits** are external; the platform cannot purchase credits programmatically. Users must top up at suno.cn / h.51melo.com. | Generation blocked when credits are 0 (bypass enabled for flow testing). |
| C-006 | **iOS builds** require macOS + Xcode; on Windows, GitHub Actions macOS runners are used. | Local iOS build not possible on Windows. |
| C-007 | The shared port file `.dev-ports.json` must remain in sync between frontend and backend for `VITE_API_URL` resolution. | Dynamic port assignment writes here; pinned mode reads here. |

---

## 8. Assumptions and Dependencies

### 8.1 Assumptions

- Users have valid API keys / accounts for at least one AI engine (Muse, Suno, or Melo).
- For Muse CDP fallback, the user has Edge installed and can launch it in debug mode.
- The developer environment has Node.js 18+ and npm available.
- Network connectivity to external AI APIs is available during generation.

### 8.2 Dependencies

| Dependency | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 5.2.1+ | HTTP server |
| React | 18.2+ | UI framework |
| Vite | 5.0.8+ | Build tool / dev server |
| Capacitor | 6.2.1+ | Mobile bridge |
| Electron | 43.1+ | Desktop runtime |
| better-sqlite3 | 13+ | i18n storage |
| Prisma | 7.9+ | ORM for i18n DB |
| JSZip | (bundled) | Publish bundle export |
| Tailwind CSS | 3.3.6+ | Styling |
| Lucide React | 0.294+ | Icons |
| External: Muse/Suno/Melo APIs | — | Music generation |

---

## 9. Acceptance Criteria

The v7.5.0 release is accepted when ALL of the following are satisfied:

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC-001 | `npm run build` completes with 0 errors (i18n validate + bundle API + vite build). | CI / local build |
| AC-002 | `npm run i18n:validate` passes with zh/en key parity. | Script output |
| AC-003 | Dev servers start on pinned ports 4720 (frontend) and 4721 (backend). | `.dev-ports.json` |
| AC-004 | `GET /api/health` returns `status: "healthy"`. | API call |
| AC-005 | All 18 pages render without console errors. | Browser snapshot |
| AC-006 | GLOBAL AUTO triggers sequential Muse → Suno → Melo generation with 5s delay. | Manual test |
| AC-007 | Each engine page (Muse/Suno/Melo) shows an AUTO button and a refreshable history panel. | Manual test |
| AC-008 | Persistent audio player controls (play/pause/seek/volume) work across page navigation. | Manual test |
| AC-009 | Language toggle switches all visible strings between zh and en. | Manual test |
| AC-010 | Android APK builds and is signed (`zmusic-v7.5.0-signed.apk`). | `npm run cap:android` + gradle |
| AC-011 | Song Library displays engine tabs, albums, favorites, and supports bulk ZIP export. | Manual test |
| AC-012 | Analytics Dashboard renders 4 KPI cards and 4 charts from localStorage history. | Manual test |
| AC-013 | Logger writes to `logs/server.log` and rotates at 5MB. | File inspection |
| AC-014 | GitHub Actions workflow builds web + APK + creates a GitHub Release with tag on push to master. | Actions run |

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| **AUTO mode** | Automated sequential generation across one or all AI engines using configured presets. |
| **CDP** | Chrome DevTools Protocol — used to connect to a running Edge browser on port 9222 for login-state detection. |
| **Dynamic Procedural Lyrics Engine v6** | The lyrics generation engine that constructs lyrics from word banks, templates, and a rhyme engine (no hardcoded lyrics). |
| **FSM** | Finite State Machine — the orchestration model used by the Unicorn Agent v7. |
| **GLOBAL AUTO** | A unified AUTO button that triggers generation across Muse → Suno → Melo sequentially. |
| **MVC** | Model–View–Controller architectural pattern. |
| **MediaSession API** | Browser API enabling media metadata and controls integration with OS-level media UI. |
| **Pinned Ports** | Fixed frontend (4720) and backend (4721) ports configured in `.env` to ensure stable URLs. |
| **Strategy Preset** | A named creative configuration (BPM range, duration, structure, complexity) that steers AUTO generation. |
| **Unicorn Agent v7** | The FSM-based agent that orchestrates lyrics + music generation. |
| **WBS** | Work Breakdown Structure. |

---

*Cross-references: [Program Specification](PROGRAM_SPEC.md) · [Technical Guide](TECHNICAL_GUIDE.md) · [User Guide](USER_GUIDE.md) · [PMP Project Plan](PMP_PROJECT_PLAN.md) · [Issue Log](ISSUE_LOG.md)*

*Last Updated: 2026-08-15 · Document Version: 7.5.0*
