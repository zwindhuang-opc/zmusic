# ZMusic — Program Specification (PMP)

| Field | Value |
|-------|-------|
| **Project Name** | ZMusic — Real AI Music Generation Platform |
| **Document Title** | Program Specification |
| **Version** | 7.5.0 |
| **Date** | 2026-08-15 |
| **Author** | Vincent Huang (zwindhuang@qq.com) |
| **Repository** | https://github.com/zwindhuang-opc/zmusic |
| **License** | MIT |
| **Status** | Approved — Upcoming Release |
| **Document Status** | Final |

---

## Table of Contents

1. [Program Overview](#1-program-overview)
2. [Program Structure](#2-program-structure)
3. [Module Specifications](#3-module-specifications)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Integration Points](#5-integration-points)
6. [API Specification Summary](#6-api-specification-summary)
7. [Database / Persistence Design](#7-database--persistence-design)
8. [Logging Specification](#8-logging-specification)
9. [Error Handling Strategy](#9-error-handling-strategy)
10. [Configuration Management](#10-configuration-management)
11. [Security Considerations](#11-security-considerations)

---

## 1. Program Overview

ZMusic is a modular, multi-platform AI music generation program composed of a React single-page application, a Node.js/Express backend, a Capacitor mobile bridge, and an Electron desktop shell. The program is organised into a **5-layer MVC + Agent architecture** that cleanly separates presentation, request handling, business logic, AI orchestration, and data access.

This Program Specification describes the internal structure of the program at the module level, the data flows between layers, the integration points with external AI engines, the persistence design, the logging model, the error-handling strategy, and the configuration and security posture. It elaborates on the requirements defined in the [System Specification](SYSTEM_SPEC.md) and is companion to the developer-facing [Technical Guide](TECHNICAL_GUIDE.md).

---

## 2. Program Structure

### 2.1 The 5-Layer MVC + Agent Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 1 — VIEW (src/pages, src/components)                      │
│  React 18 SPA · 18 lazy-loaded pages · contexts/stores for state │
└───────────────────────────────┬──────────────────────────────────┘
                                │ fetch (api.client.js)
┌───────────────────────────────▼──────────────────────────────────┐
│  LAYER 2 — CONTROLLER (src/controllers)                          │
│  14 HTTP controllers · validate input · shape responses          │
│  Registered centrally in src/routes/index.js (handleRoute)       │
└───────────────────────────────┬──────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│  LAYER 3 — SERVICE (src/services)                                │
│  17 services · business logic · external API orchestration       │
└───────────────┬───────────────────────────────┬──────────────────┘
                │                               │
┌───────────────▼──────────────┐  ┌────────────▼──────────────────┐
│  LAYER 4 — AGENT             │  │  LAYER 5 — MODEL / UTILS      │
│  src/agents/unicorn-agent.js │  │  src/utils (logger, lyrics    │
│  FSM-based orchestration     │  │  engine), src/stores          │
└──────────────────────────────┘  └───────────────────────────────┘
```

| Layer | Purpose | Key Files |
|-------|---------|-----------|
| View | Render UI, capture user input, manage client state | `src/pages/*.jsx`, `src/components/*.jsx`, `src/contexts/*.jsx`, `src/stores/*.jsx` |
| Controller | Handle HTTP requests, validate, delegate to services | `src/controllers/*.controller.js`, `src/routes/index.js` |
| Service | Business logic, call external APIs, transform data | `src/services/*.service.js`, `src/services/api.client.js` |
| Agent | FSM-based generation orchestration (Unicorn Agent v7) | `src/agents/unicorn-agent.js` |
| Model/Utils | Data access, persistence, logging, lyrics engine | `src/utils/logger.js`, `src/utils/dynamicLyricsEngine.js`, `src/services/generation.history.js` |

---

## 3. Module Specifications

### 3.1 Controllers (`src/controllers/`)

| Module | File | Responsibility |
|--------|------|----------------|
| Health | `health.controller.js` | System health + browser status + analytics |
| Music | `music.controller.js` | Music generation (Suno) + dual-engine agent generation; builds rich prompts from style config |
| Lyrics | `lyrics.controller.js` | Lyrics genres + generation via dynamic engine |
| MV | `mv.controller.js` | MV timeline genres + generation |
| Agent | `agent.controller.js` | Unicorn Agent status + lyrics/MV generation |
| History | `history.controller.js` | History CRUD (getAll, getStats, getById, delete, clear) |
| Suno | `suno.controller.js` | Suno proxy: status, user, generate, task, gen-lyrics, music |
| Muse | `muse.controller.js` | Muse proxy: status, user, styles, fast-config, master-config, templates, explore, generate, fill-input, task |
| Melo | `melo.controller.js` | Melo proxy: status, user, generate, fill-input, task (MS55) |
| Freemusic | `freemusic.controller.js` | 100% free music generation (no paid APIs) |
| Vision | `vision.controller.js` | Image analysis for image-to-lyrics |
| Content | `content.controller.js` | Database-driven content: genres, scene-templates, ai-tools, effects, palettes, music-styles |
| Publish | `publish.controller.js` | Multi-platform publishing + credentials + suggest-hashtags |
| Library | `library.controller.js` | Auth (register, login, me) + albums + songs CRUD |

### 3.2 Services (`src/services/`)

| Module | File | Responsibility |
|--------|------|----------------|
| API Client | `api.client.js` | Fetch wrapper with request logging + retry (max 2, 1s/2s backoff) |
| Suno | `suno.service.js` | Suno.cn API integration (v5.5) |
| Muse | `muse.service.js` | Muse.top API integration |
| Muse CDP Bridge | `museCdpBridge.js` | Edge CDP login-state detection for Muse |
| Muse Puppeteer Bridge | `musePuppeteerBridge.js` | Puppeteer fallback bridge for Muse |
| Melo | `melo.service.js` | Melo (ByteDance) API integration (MS55) |
| Lyrics | `lyrics.service.js` | Client-side lyrics generation orchestration |
| MV | `mv.service.js` | MV timeline generation |
| History (client) | `history.service.js` | localStorage history (100 entries max) |
| Generation History (server) | `generation.history.js` | File-based history (`.history/`, 200 entries max) |
| Auth | `auth.service.js` | Phase-1 authentication (sha256, guest mode) |
| Browser Status | `browserStatus.service.js` | Edge browser connection status |
| Douyin | `douyin.service.js` | Douyin publishing integration |
| Social Publish | `socialPublish.service.js` | Multi-platform social publishing (TikTok/Xiaohongshu/YouTube/Qishui) |
| Quality Analyzer | `qualityAnalyzer.service.js` | 6-metric 1–100 scoring heuristic |
| Content | `content.service.js` | DB-driven content access |
| Freemusic | `freemusic.service.js` | Free music generation logic |
| Generation | (generation flow helpers) | Generation orchestration helpers |
| Vision | `vision.service.js` | Image analysis |
| Notification | `notification.service.js` | User notifications |

### 3.3 Pages (`src/pages/`)

| Page | File | Group |
|------|------|-------|
| Dashboard | `Dashboard.jsx` | Dashboard |
| Music Studio | `MusicPage.jsx` | Music Generation |
| Muse AI | `MusePage.jsx` | Music Generation |
| Suno AI | `SunoPage.jsx` | Music Generation |
| Melo AI | `MeloPage.jsx` | Music Generation |
| Lyrics Generation | `LyricsPage.jsx` | Lyrics |
| Image-to-Lyrics | `ImageLyricsPage.jsx` | Lyrics |
| Creative Notebook | `CreativeNotebook.jsx` | Lyrics |
| MV | `MVPage.jsx` | MV |
| Remix Studio | `RemixStudio.jsx` | Studios |
| Publish Studio | `PublishStudio.jsx` | Studios |
| Song Library | `SongLibrary.jsx` | Workbench |
| Album Detail | `AlbumDetail.jsx` | Workbench |
| Quality Analyzer | `QualityAnalyzerPage.jsx` | Workbench |
| Batch Generation | `BatchGenerationPage.jsx` | Workbench |
| Analytics Dashboard | `AnalyticsPage.jsx` | Workbench |
| Settings | `SettingsPage.jsx` | Settings |
| Login | `LoginPage.jsx` | Account |

### 3.4 Components (`src/components/`)

| Component | File | Purpose |
|-----------|------|---------|
| AutoCreativePanel | `AutoCreativePanel.jsx` | AUTO creative ideation panel with strategy selector |
| AutoProgressBar | `AutoProgressBar.jsx` | AUTO progress visualisation |
| StrategySelector | `StrategySelector.jsx` | Selects one of 10 strategy presets |
| EasyMode | `EasyMode.jsx` | 3-step wizard UI for Easy Mode |
| FloatingChatBall | `FloatingChatBall.jsx` | Floating AI assistant chat ball |
| HistoryPanel | `HistoryPanel.jsx` | Per-page history display with copy buttons |
| PersistentAudioPlayer | `PersistentAudioPlayer.jsx` | Bottom-bar audio player (MediaSession) |
| QualityScoreBadge | `QualityScoreBadge.jsx` | Quality score pill display |
| BrandIcons | `BrandIcons.jsx` | Muse/Suno/Melo brand SVG icons |
| MV Controls | `mv/MVControls.jsx` | MV parameter controls |
| MV Engine Selector | `mv/MVEngineSelector.jsx` | MV engine (Muse/Suno/Melo) selector |
| MV Timeline Preview | `mv/MVTimelinePreview.jsx` | MV timeline preview |
| MV Video Player | `mv/MVVideoPlayer.jsx` | MV video player |

### 3.5 Contexts (`src/contexts/`)

| Context | File | Scope |
|---------|------|-------|
| AuthContext | `AuthContext.jsx` | User auth state (login/guest), AuthProvider |
| PlayerContext | `PlayerContext.jsx` | Global audio player state, MediaSession integration |
| AutoProgressContext | `AutoProgressContext.jsx` | GLOBAL AUTO progress state |

### 3.6 Stores (`src/stores/`)

| Store | File | Scope |
|-------|------|-------|
| Generation Store | `generationStore.jsx` | Generation state management |
| Song Library Store | `songLibraryStore.jsx` | Song library state (albums, favorites, songs) |

### 3.7 Utils (`src/utils/`)

| Util | File | Purpose |
|------|------|---------|
| Logger | `logger.js` | Log4j-style logger (6 levels, Console + File appender, 5MB rotation) |
| Dynamic Lyrics Engine | `dynamicLyricsEngine.js` | Procedural lyrics v6 engine (themes/styles/templates/rhyme) |
| Lyrics Engine | `lyricsEngine.js` | Delegates to dynamic engine |
| Auto Config | `autoConfig.js` | AUTO config get/set (localStorage) |
| Auto Gen Utils | `autoGenUtils.js` | AUTO generation helpers |
| Cover Art Generator | `coverArtGenerator.js` | Generates cover art for songs |
| Audio Engine | `audioEngine.js` | Audio playback engine |
| Music Engine | `musicEngine.js` | Music generation engine helpers |
| Music Composer | `musicComposer.js` | Music composition helpers |
| MV Engine | `mvEngine.js` | MV generation engine helpers |
| MV Composer | `mvComposer.js` | MV composition helpers |
| Vision Analyzer | `visionAnalyzer.js` | Image analysis for image-to-lyrics |
| Face Detection | `faceDetection.js` | Face detection (face-api) |
| Reference Data | `referenceData.js` | Reference data lookups |

### 3.8 Agent (`src/agents/`)

| Agent | File | Purpose |
|-------|------|---------|
| Unicorn Agent v7 | `unicorn-agent.js` | FSM-based generation orchestration with 4 methods (basic, network, time, variation) |

### 3.9 Hooks (`src/hooks/`)

| Hook | File | Purpose |
|------|------|---------|
| useQualityGate | `useQualityGate.js` | Quality threshold gate hook |

### 3.10 Data & Config

| Module | File | Purpose |
|--------|------|---------|
| Creative Presets | `src/data/creativePresets.js` | 10 AUTO strategy presets |
| Config | `src/config/index.js` | Main configuration |
| Music Styles | `src/config/musicStyles.js` | Music style definitions (30+ styles with Suno tags) |
| Lyrics Styles | `src/config/lyricsStyles.js` | Lyrics style metadata |

---

## 4. Data Flow Diagrams

### 4.1 Request Flow (Music Generation — Suno)

```
[User] → [SunoPage.jsx]
   │  POST /api/suno/generate { prompt, style, duration }
   ▼
[api.client.js] ──fetch──▶ [Express Server :4721]
   │                           │
   │                           ▼
   │                      [routes/index.js] handleRoute()
   │                           │ matches /api/suno/generate
   │                           ▼
   │                      [suno.controller.js] generate()
   │                           │ validate body
   │                           ▼
   │                      [suno.service.js] generate()
   │                           │ call external Suno API
   │                           ▼
   │                      [https://mcp.suno.cn] (API key auth)
   │                           │
   │                           ▼  task serialNo
   │                      [suno.service.js] queryTask()
   │                           │ poll until done
   │                           ▼
   │                      [generation.history.js] persist to .history/
   │                           │
   ◀──────────────────────────  JSON { success, audioUrl, ... }
[SunoPage.jsx] → render result → enqueue in PlayerContext
```

### 4.2 GLOBAL AUTO Flow

```
[Dashboard GLOBAL AUTO button]
   │  set localStorage AUTO flag + config
   ▼
[AutoProgressContext]  ──▶  Muse AUTO  ──▶ (5s delay) ──▶  Suno AUTO  ──▶ (5s delay) ──▶  Melo AUTO
   │                        │                                  │                                  │
   │                        ▼                                  ▼                                  ▼
   │                   /api/muse/generate              /api/suno/generate              /api/melo/generate
   │                        │                                  │                                  │
   │                        ▼                                  ▼                                  ▼
   │                   poll /api/muse/task/:id         poll /api/suno/task/:id         poll /api/melo/task/:id
   │                        │                                  │                                  │
   └─────────────────── all results enqueued in PlayerContext + saved to history ────────────────────────┘
```

### 4.3 Lyrics Generation Flow

```
[LyricsPage.jsx] → POST /api/lyrics/generate { genre, theme, style, method, complexity }
   │
   ▼
[lyrics.controller.js] → [lyrics.service.js] → [dynamicLyricsEngine.js]
   │  word banks + templates + rhyme engine → procedural output
   ▼
JSON { lyrics, sections, layers? } → [history.service.js] (localStorage) + [generation.history.js] (.history/)
```

---

## 5. Integration Points

### 5.1 Muse AI Integration

| Aspect | Detail |
|--------|--------|
| Base URL | `https://project-api.atmob.com` (muse.top) |
| Auth | JWT in `AuthToken` header + `App-Key` header |
| CDP Fallback | Connects to running Edge on port 9222 to detect login state |
| Key Endpoints | status, user, styles, fast-config, master-config, templates, explore, generate, fill-input, task |
| Constraint | Server-side session (`sid`) expires ~24h; requires interactive phone+SMS re-login |

### 5.2 Suno AI Integration

| Aspect | Detail |
|--------|--------|
| Base URL | `https://mcp.suno.cn` |
| Auth | API Key (`sk-xxx`) |
| Key Endpoints | status, user, generate, task, gen-lyrics, music |
| Version | v5.5 structured generation |

### 5.3 Melo AI Integration

| Aspect | Detail |
|--------|--------|
| Base URL | `https://melo.bytedance.com` |
| Endpoint | `POST /agent/api/v1/music/generate` |
| Model | `model_code: MS55` |
| Auth | Session-based |
| Default Duration | 240s |

### 5.4 Edge Browser CDP Integration

- Connects to `http://localhost:9222` (Chrome DevTools Protocol)
- **Never** launches a new browser window
- Auto-detects login state for Muse/Suno/Melo on the 60s health poll
- Bridges: `museCdpBridge.js`, `musePuppeteerBridge.js`

### 5.5 CDN / Storage

- Generated audio served via engine URLs + `/api/proxy/audio` CORS bypass
- Static assets bundled by Vite; face-api models in `public/face-api-models/`
- No in-house CDN hosting of generated audio

---

## 6. API Specification Summary

All endpoints are under base URL `http://localhost:4721/api`. Full reference: [API_DOCUMENTATION.md](../API_DOCUMENTATION.md).

### 6.1 Health & Agent

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | System health + browser status |
| `/api/business/analytics` | GET | Business analytics |
| `/api/agent/status` | GET | Unicorn Agent status |
| `/api/agent/lyrics` | POST | Agent lyrics generation |
| `/api/agent/mv` | POST | Agent MV generation |

### 6.2 Music & Lyrics & MV

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/music/generate` | POST | Music generation (Suno) |
| `/api/music/generate-agent` | POST | Dual-engine agent generation |
| `/api/lyrics/genres` | GET | Available genres |
| `/api/lyrics/generate` | POST | Generate lyrics |
| `/api/lyrics/generate-agent` | POST | Agent lyrics generation |
| `/api/mv/genres` | GET | MV genres |
| `/api/mv/generate` | POST | MV timeline generation |
| `/api/mv/generate-agent` | POST | Agent MV generation |

### 6.3 History

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/history` | GET | Get all history (optional `?type=`) |
| `/api/history/stats` | GET | Generation statistics |
| `/api/history/:id` | GET | Get specific record |
| `/api/history/:id` | DELETE | Delete a record |
| `/api/history/clear` | POST | Clear all history |

### 6.4 Engine Proxies

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/suno/*` | GET/POST | Suno proxy (status, user, generate, task, gen-lyrics, music) |
| `/api/muse/*` | GET/POST | Muse proxy (status, user, styles, fast-config, master-config, templates, explore, generate, fill-input, task) |
| `/api/melo/*` | GET/POST | Melo proxy (status, user, generate, fill-input, task) |
| `/api/freemusic/*` | GET/POST | Free music generation (generate, voices, status) |

### 6.5 Content & Vision & Proxy

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/content/all` | GET | All database content |
| `/api/content/genres` | GET | Genres |
| `/api/content/scene-templates` | GET | Scene templates |
| `/api/content/ai-tools` | GET | AI video tools |
| `/api/content/effects` | GET | Effects |
| `/api/content/palettes` | GET | Style palettes |
| `/api/content/music-styles` | GET | Music styles |
| `/api/vision/analyze` | POST | Image analysis |
| `/api/proxy/audio` | GET | CORS bypass for external audio |

### 6.6 Publish

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/publish/status` | GET | Publish status |
| `/api/publish/suggest-hashtags` | POST | Suggest hashtags |
| `/api/publish/submit` | POST | Unified publish submit |
| `/api/publish/douyin/video` | POST | Douyin video publish |
| `/api/publish/qishui/track` | POST | Qishui music publish |
| `/api/publish/rednote/note` | POST | Xiaohongshu note publish |
| `/api/publish/tiktok/video` | POST | TikTok video publish |
| `/api/publish/youtube/video` | POST | YouTube video publish |
| `/api/publish/credentials` | GET/POST | Credentials management |
| `/api/publish/download-url` | GET | Get download URL |

### 6.7 Auth & Library

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register |
| `/api/auth/login` | POST | Login |
| `/api/auth/me` | GET | Current user |
| `/api/albums` | GET/POST | Album list / create |
| `/api/songs` | GET/POST | Song list / create |

---

## 7. Database / Persistence Design

### 7.1 i18n Database

- **Engine**: better-sqlite3 + Prisma ORM
- **Purpose**: Bilingual key storage and synchronisation
- **Locale files**: `src/i18n/locales/zh.json` + `src/i18n/locales/en.json` (150+ keys)
- **Validation**: `npm run i18n:validate` (JSON parity check, CI-safe)

### 7.2 History Persistence (File-Based)

| Layer | Storage | Capacity | Cleanup |
|-------|---------|----------|---------|
| Client | Browser `localStorage` | 100 entries | Oldest removed |
| Server | `.history/` directory (JSON files) | 200 entries | Oldest removed |

- **Client service**: `src/services/history.service.js`
- **Server service**: `src/services/generation.history.js`

### 7.3 Song Library

- Albums and songs managed via `/api/albums` and `/api/songs`
- Auto-migration from history into the library
- Bulk export as ZIP/JSON

### 7.4 Publish Credentials

- Stored server-side, managed via `/api/publish/credentials` (GET loads, POST saves)

### 7.5 Port State

- `.dev-ports.json` — shared port file recording `frontendPort`, `backendPort`, `assignedAt`, `pid`, `pinned`

---

## 8. Logging Specification

The logging system (`src/utils/logger.js`) is a log4j-style logger.

### 8.1 Log Levels

| Level | Numeric | Usage |
|-------|---------|-------|
| TRACE | 0 | Finest-grained flow tracing |
| DEBUG | 1 | Diagnostic info (dev mode default) |
| INFO | 2 | General operational info (prod default) |
| WARN | 3 | Potentially harmful situations |
| ERROR | 4 | Error events (still running) |
| FATAL | 5 | Severe errors (may stop app) |

### 8.2 Appenders

| Appender | Behaviour |
|----------|-----------|
| `ConsoleAppender` | Outputs formatted lines to console (browser + server). Errors go to `console.error`. |
| `FileAppender` | Writes to `logs/server.log` (server-side via injected `node:fs`). Rotates at 5MB (renames to `.log.1`). No-ops safely in browser. |

### 8.3 Layout

- `PatternLayout` with default pattern `[%d] [%p] [%c] - %m`
- Tokens: `%d` (ISO date), `%p` (level), `%c` (category/module), `%m` (message)

### 8.4 Usage Pattern

```js
import Logger from './utils/logger.js';
const logger = new Logger('ModuleName');
logger.info('Started generation %s', taskId);
logger.error('API failed: %o', err);
```

- Global level configurable via `Logger.setGlobalLevel()`
- Development mode defaults to DEBUG; production defaults to INFO

---

## 9. Error Handling Strategy

| Layer | Strategy |
|-------|----------|
| API Client (`api.client.js`) | Automatic retry (max 2, 1s/2s backoff) for transient failures; structured error logging |
| Controllers | Validate input; return `{ success: false, error }` JSON with appropriate HTTP status; unknown routes return 404 |
| Services | Wrap external API calls in try/catch; surface engine-native errors (e.g., "insufficient points") |
| Logger | FileAppender wraps all `fs` operations in try/catch — logging never crashes the app |
| Frontend | Credit bypass shipped for flow testing (generate button enabled without credits; engine returns native error) |
| Health Polling | Single interval ref (no per-render AbortController) to avoid StrictMode double-fire aborts |

### Error Response Shape

```json
{ "success": false, "error": "Endpoint not found", "path": "/api/unknown" }
```

---

## 10. Configuration Management

### 10.1 Environment Configuration (`.env`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `SUNO_CN_API_KEY` | Suno API key | `sk-xxx` |
| `MUSE_APP_KEY` | Muse App Key (public) | `8e33a5e60ef347df...` |
| `MUSE_API_KEY` | Muse JWT token | `eyJ...` |
| `MUSE_BASE_URL` | Muse API base | `https://project-api.atmob.com` |
| `MELO_API_KEY` | Melo API key | (session) |
| `FRONTEND_PORT` | Pinned frontend port | `4720` |
| `BACKEND_PORT` | Pinned backend port | `4721` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Log level | `INFO` |
| `LOG_FILE_PATH` | Log file path | `./logs/zmusic.log` |

### 10.2 Version Management

- **Single source of truth**: `VERSION.json` (version, major/minor/patch, buildNumber, releaseDate, notes, status, changes)
- **Scripts**: `scripts/version.js` (bump), `scripts/release.mjs` (release + backup), `scripts/backup.js`
- **Commands**: `npm run version:patch|minor|major`, `npm run release:patch|minor|major`
- **Semantic versioning**: MAJOR.MINOR.PATCH

### 10.3 Port Management

- Pinned ports read from `.env` (`FRONTEND_PORT=4720`, `BACKEND_PORT=4721`)
- FORBIDDEN ports: 5500, 5501, 5502, 5173, 3000, 8000
- Dynamic assignment (fallback) stays in 4200–4999, skipping forbidden set
- Shared state in `.dev-ports.json`

### 10.4 i18n Configuration

- DB seed/sync: `npm run i18n:seed`, `npm run i18n:sync`
- Validation: `npm run i18n:validate`
- Stats: `npm run i18n:stats`

---

## 11. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Password storage | sha256 hashing (Phase-1 auth) |
| Muse JWT exposure | JWT never sent to browser; all generation proxied through `/api/muse` |
| Audio CORS bypass | `/api/proxy/audio` sets restrictive User-Agent and `Access-Control-Allow-Origin: *` only for audio streams |
| Publish credentials | Stored server-side, managed via authenticated endpoint |
| APK signing | Self-signed certificate (valid 10000 days), keystore `android/keystore/zmusic.jks` |
| Session expiry (Muse) | Banner shown with re-login instructions; auto-detected on 60s health poll |
| Credit bypass | Generate button enabled without credits only for flow testing; production users see native engine errors |
| Logging safety | All file appender operations wrapped in try/catch |

---

*Cross-references: [System Specification](SYSTEM_SPEC.md) · [Technical Guide](TECHNICAL_GUIDE.md) · [User Guide](USER_GUIDE.md) · [PMP Project Plan](PMP_PROJECT_PLAN.md) · [Issue Log](ISSUE_LOG.md) · [Architecture](ARCHITECTURE.md)*

*Last Updated: 2026-08-15 · Document Version: 7.5.0*
