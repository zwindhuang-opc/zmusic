# ZMusic — Real AI Music Generation Platform

![Version](https://img.shields.io/badge/version-7.5.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Node](https://img.shields.io/badge/node-18%2B-339933) ![React](https://img.shields.io/badge/React-18-61DAFB) ![Capacitor](https://img.shields.io/badge/Capacitor-6-119EFF)

ZMusic is a full-stack, cross-platform AI music generation platform that unifies **three AI music engines** — Muse AI, Suno AI, and Melo AI — into a single bilingual (Chinese/English) workspace. It features a Dynamic Procedural Lyrics Engine v6, MV timeline generation, a unified GLOBAL AUTO mode, multi-platform social publishing, a song library, quality analysis, batch generation, and analytics dashboards.

- **Author**: Vincent Huang (zwindhuang@qq.com)
- **Repository**: https://github.com/zwindhuang-opc/zmusic
- **License**: MIT

---

## Table of Contents

- [Live Demo / Web App](#live-demo--web-app)
- [Feature Highlights](#feature-highlights)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Three AI Engines](#three-ai-engines)
- [Mobile Apps](#mobile-apps)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Version Management](#version-management)
- [Documentation](#documentation)
- [Screenshots](#screenshots)
- [License](#license)

---

## Live Demo / Web App

| Platform | URL | Notes |
|----------|-----|-------|
| GitHub Pages | _Pending_ (requires repo public OR paid GitHub plan — currently private) | Configured as non-fatal `continue-on-error` |
| Vercel | Auto-deploy via `vercel.json` | |
| Netlify | Auto-deploy via `netlify.toml` + `netlify/functions/api/` | Serverless API bundled with esbuild |
| Cloudflare Pages | Via `deploy-cloudflare.yml` workflow | |
| Local | http://localhost:4720 | Frontend 4720 · Backend 4721 |

---

## Feature Highlights

- **Three AI Engines** — Muse AI (natural language), Suno AI (structured v5.5), Melo AI (multi-layer MS55)
- **GLOBAL AUTO** — One button generates across Muse → Suno → Melo sequentially with a 5-second delay
- **10 AUTO Strategy Presets** — 流行抓耳, 民谣叙事, 电子氛围, 摇滚能量, 古风古韵, 治愈清新, 嘻哈律动, 史诗磅礴, 情歌浪漫, 先锋实验
- **Dynamic Procedural Lyrics Engine v6** — 30 themes × 30 styles × 5 methods, billions of combinations
- **Unicorn Agent v7** — FSM-based generation orchestration
- **18 Feature Pages** — Dashboard, Music Studio, Muse/Suno/Melo AI, Lyrics, Image-to-Lyrics, Creative Notebook, MV (3 sub-tabs), Remix Studio, Publish Studio, Song Library, Album Detail, Quality Analyzer, Batch Generation, Analytics, Settings, Login
- **Multi-Platform Publishing** — Douyin, TikTok, Xiaohongshu, YouTube, Qishui Music (OAuth + chunked upload + JSZip bundle export)
- **Song Library & Auth** — Phase-1 sha256 auth, guest mode, albums, favorites, bulk ZIP/JSON export
- **Quality Analyzer** — 6-metric 1–100 scoring with QualityScoreBadge + useQualityGate hook
- **Batch Generation** — CSV/JSON upload, sequential queue with ETA, ZIP bundle output
- **Analytics Dashboard** — 4 KPI cards, 4 inline SVG/CSS charts, CSV export
- **Persistent Audio Player** — Bottom bar with MediaSession API integration, mini-player with waveform + lyrics
- **Easy Mode / Expert Mode** — Dual-mode interface for all skill levels
- **Edge Browser CDP Integration** — Auto-detects login state for Muse/Suno/Melo on port 9222
- **Cross-Platform** — Web, Android APK (signed), iOS IPA (GitHub Actions), Desktop (Electron)
- **Bilingual i18n** — Chinese/English, 150+ synchronized keys
- **Log4j-style Logging** — ConsoleAppender + FileAppender (5MB rolling), 6 levels

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite 5.4 + Tailwind CSS + Lucide Icons |
| **Backend** | Node.js 18+ / Express 5, ES Modules, JavaScript |
| **Mobile** | Capacitor 6 (Android APK signed, iOS IPA via GitHub Actions) |
| **Desktop** | Electron 43 |
| **Database** | better-sqlite3 + Prisma (i18n); file-based history (`.history/`, 200 max); localStorage (100 max) |
| **Logging** | log4j-style logger (`src/utils/logger.js`), ConsoleAppender + FileAppender (5MB rolling), writes to `logs/server.log` |
| **i18n** | Custom bilingual system (`zh.json` + `en.json`), 150+ keys |
| **Architecture** | MVC Pattern (Model, View, Controller, Service, Agent) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/zwindhuang-opc/zmusic.git
cd zmusic

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys (SUNO_CN_API_KEY, MUSE_API_KEY, MELO_API_KEY)
```

### Run

```bash
# Start both frontend + backend (recommended - dynamic port launcher)
npm start

# Or run concurrently
npm run dev:full

# Or separately
npm run server    # Backend API on port 4721
npm run dev       # Frontend dev server on port 4720
```

Open **http://localhost:4720** in your browser.

> **Pinned ports**: Frontend `4720`, Backend `4721` (configured in `.env`).
> **FORBIDDEN ports**: 5500, 5501, 5502, 5173, 3000, 8000.

---

## Project Structure

```
zmusic/
├── src/
│   ├── agents/                    # AI Agent Layer (unicorn-agent.js v7 FSM)
│   ├── components/                # Reusable React components (+ mv/ subfolder)
│   ├── config/                    # musicStyles.js, lyricsStyles.js, index.js
│   ├── contexts/                  # AuthContext, PlayerContext, AutoProgressContext
│   ├── controllers/               # 14 HTTP controllers
│   ├── data/                      # creativePresets.js (10 strategy presets)
│   ├── hooks/                     # useQualityGate
│   ├── i18n/                      # locales/zh.json + en.json (150+ keys)
│   ├── pages/                     # 18 React pages (lazy-loaded)
│   ├── routes/index.js            # Central route registry (handleRoute)
│   ├── services/                  # 17 services (suno, muse, melo, lyrics, mv, ...)
│   ├── stores/                    # generationStore, songLibraryStore
│   ├── utils/                     # logger.js, dynamicLyricsEngine.js, autoConfig.js
│   ├── App.jsx                    # Main app (routing + providers)
│   ├── main.jsx                   # Entry point
│   └── server.js                  # Backend server
├── android/                       # Android project (Capacitor 6, signed APK)
├── ios/                           # iOS project (Capacitor 6)
├── electron/                      # Electron desktop shell (main.js, preload.js)
├── api/                           # Standalone API bundle entry
├── netlify/functions/api/         # Netlify serverless API (esbuild bundle)
├── .github/workflows/             # CI/CD (auto-deploy, build-ios, cloudflare, netlify)
├── docs/                          # Documentation
├── scripts/                       # version.js, release.mjs, backup.js
├── public/                        # Static assets (favicon, sw.js, face-api models)
├── .env.example                   # Environment template
├── .dev-ports.json                # Shared port state (frontend/backend)
├── VERSION.json                   # Single source of truth for version
├── package.json
├── vite.config.js
└── capacitor.config.ts
```

---

## Three AI Engines

| Engine | Site | Auth | Strength |
|--------|------|------|----------|
| **Muse AI** | muse.top | JWT (AuthToken + App-Key header); CDP fallback via Edge port 9222 | Natural language music generation |
| **Suno AI** | suno.cn | API Key (`sk-xxx`) | Structured music generation v5.5 |
| **Melo AI** | melo.bytedance.com | Session-based; `model_code MS55` | Advanced multi-layer composition (default 240s) |

All three are exposed through backend proxy endpoints (`/api/muse/*`, `/api/suno/*`, `/api/melo/*`) so secrets never reach the browser. Each engine page has an **AUTO button** and a refreshable history panel.

---

## Mobile Apps

### Android APK

The signed APK is built locally on Windows:

```bash
npm run cap:android      # Build + sync + open Android Studio
# Or directly:
npm run build && npx cap sync android && cd android && .\gradlew.bat assembleRelease
```

Output: `zmusic-v7.5.0-signed.apk` · Keystore: `android/keystore/zmusic.jks` (alias `zmusic`, validity 10000 days).

### iOS IPA

iOS requires macOS + Xcode. On Windows, use GitHub Actions:

1. Go to **https://github.com/zwindhuang-opc/zmusic/actions**
2. Select **"Build iOS IPA"** workflow → **Run workflow**
3. Choose export method (`development` / `ad-hoc` / `app-store`)
4. Wait ~10–15 minutes, download IPA from **Artifacts**

See [GitHub Actions Guide](docs/GITHUB_ACTIONS_GUIDE.md) for details.

---

## Deployment

| Platform | Config | Trigger |
|----------|--------|---------|
| **GitHub Actions** | `.github/workflows/auto-deploy.yml` | Auto on push to `master` (web + APK debug/release + GitHub Release + tag; Pages deploy non-fatal) |
| **Vercel** | `vercel.json` | Auto-deploy |
| **Netlify** | `netlify.toml` + `netlify/functions/api/` | `npm run deploy:netlify` |
| **Cloudflare Pages** | `.github/workflows/deploy-cloudflare.yml` | Workflow trigger |

- **Ports**: Frontend 4720, Backend 4721 (pinned in `.env`)
- **Version Management**: `VERSION.json` (single source of truth), `scripts/version.js`, `scripts/release.mjs`, `scripts/backup.js`

---

## Configuration

### Environment Variables (`.env`)

```env
# Suno AI API
SUNO_CN_API_KEY=sk-your-api-key-here

# Muse AI (muse.top) - JWT from SMS login
MUSE_APP_KEY=8e33a5e60ef347df808d14026f27d227
MUSE_API_KEY=your-muse-jwt-token-here
MUSE_BASE_URL=https://project-api.atmob.com

# Melo AI
MELO_API_KEY=your-melo-api-key

# Pinned Ports (FORBIDDEN: 5500, 5501, 5502, 5173, 3000, 8000)
FRONTEND_PORT=4720
BACKEND_PORT=4721

# Server
NODE_ENV=development
```

See [`.env.example`](.env.example) for the full template.

---

## API Reference

Base URL: `http://localhost:4721/api`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | System health + browser status |
| `/api/agent/status` | GET | Unicorn Agent status |
| `/api/music/generate` | POST | Music generation (Suno) |
| `/api/lyrics/generate` | POST | Generate lyrics |
| `/api/mv/generate` | POST | Generate MV timeline |
| `/api/history` | GET | Generation history |
| `/api/suno/*` | GET/POST | Suno proxy |
| `/api/muse/*` | GET/POST | Muse proxy |
| `/api/melo/*` | GET/POST | Melo proxy |
| `/api/freemusic/*` | GET/POST | Free music generation |
| `/api/content/*` | GET | Database-driven content |
| `/api/vision/analyze` | POST | Image analysis |
| `/api/publish/*` | GET/POST | Multi-platform publishing |
| `/api/auth/*` | POST/GET | Authentication |
| `/api/albums`, `/api/songs` | GET/POST | Library CRUD |

Full reference: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

## Version Management

```bash
npm run version:show       # Show current version
npm run version:patch      # 7.4.1 -> 7.4.2
npm run version:minor      # 7.4.1 -> 7.5.0
npm run version:major      # 7.4.1 -> 8.0.0

npm run release:patch      # Release a patch version
npm run release:minor      # Release a minor version
npm run release:major      # Release a major version
npm run backup             # Backup (commit + push)
npm run backup:tag         # Backup with a dated tag
```

`VERSION.json` is the single source of truth, synced across `package.json` and `build.gradle`.

---

## Documentation

| Document | Description |
|----------|-------------|
| [System Specification](docs/SYSTEM_SPEC.md) | PMP system spec — requirements, boundaries, constraints, acceptance criteria |
| [Program Specification](docs/PROGRAM_SPEC.md) | PMP program spec — module specs, data flows, integration points |
| [Technical Guide](docs/TECHNICAL_GUIDE.md) | Developer guide — setup, structure, adding pages/endpoints/engines |
| [User Guide](docs/USER_GUIDE.md) | End-user guide for using ZMusic |
| [PMP Project Plan](docs/PMP_PROJECT_PLAN.md) | PMP project management plan |
| [Issue Log](docs/ISSUE_LOG.md) | Issue tracking log |
| [Architecture](docs/ARCHITECTURE.md) | System architecture details |
| [API Documentation](API_DOCUMENTATION.md) | Full REST API reference |
| [Changelog](CHANGELOG.md) | Version changelog |
| [Deployment](DEPLOYMENT.md) | Deployment guide |
| [GitHub Actions Guide](docs/GITHUB_ACTIONS_GUIDE.md) | iOS IPA build guide |

---

## Screenshots

Screenshots are organized by version in the [`screenshots/`](screenshots/) directory:

- [`screenshots/V7.1.0/`](screenshots/V7.1.0/) — Dashboard, Music Studio, Muse/Suno/Melo AI, Lyrics, Creative Notebook, Image-Lyrics, Settings, Mobile
- [`screenshots/v7.2.0/`](screenshots/v7.2.0/) — Sidebar reorganization, Remix/Publish Studios
- [`screenshots/v6.7.0/`](screenshots/v6.7.0/) — AUTO modals, dashboard, engine pages
- [`screenshots/v6.6.6/`](screenshots/v6.6.6/) — Dashboard, Muse, Suno, Melo AI chat

---

## License

MIT License — see [LICENSE](LICENSE).

## Links

- **GitHub**: https://github.com/zwindhuang-opc/zmusic
- **Contact**: zwindhuang@qq.com
- **Author**: Vincent Huang

---

*Last Updated: 2026-08-15 · Version 7.5.0*
