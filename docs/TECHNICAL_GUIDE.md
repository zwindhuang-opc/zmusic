# ZMusic — Technical Guide

| Field | Value |
|-------|-------|
| **Project Name** | ZMusic — Real AI Music Generation Platform |
| **Document Title** | Technical Guide for Developers |
| **Version** | 7.5.0 |
| **Date** | 2026-08-15 |
| **Author** | Vincent Huang (zwindhuang@qq.com) |
| **Repository** | https://github.com/zwindhuang-opc/zmusic |
| **License** | MIT |
| **Status** | Approved — Upcoming Release |
| **Document Status** | Final |

---

## Table of Contents

1. [Development Environment Setup](#1-development-environment-setup)
2. [Project Structure](#2-project-structure)
3. [Installation & Running](#3-installation--running)
4. [Build & Deployment](#4-build--deployment)
5. [Coding Standards](#5-coding-standards)
6. [Adding a New Page](#6-adding-a-new-page)
7. [Adding a New API Endpoint](#7-adding-a-new-api-endpoint)
8. [Adding a New AI Engine Integration](#8-adding-a-new-ai-engine-integration)
9. [Logging Usage Examples](#9-logging-usage-examples)
10. [Testing Strategy](#10-testing-strategy)
11. [Troubleshooting Guide](#11-troubleshooting-guide)
12. [Performance Considerations](#12-performance-considerations)
13. [Version Management](#13-version-management)

---

## 1. Development Environment Setup

### 1.1 Prerequisites

| Tool | Version | Required For |
|------|---------|---------------|
| Node.js | 18+ | All development |
| npm | bundled with Node | Dependency management |
| Git | latest | Version control + backups |
| Android Studio | latest | Android APK builds (optional) |
| Xcode | latest | iOS IPA builds (macOS only, optional) |
| Edge Browser | latest | CDP login-state detection (optional but recommended) |

### 1.2 Initial Setup

```bash
# Clone the repository
git clone https://github.com/zwindhuang-opc/zmusic.git
cd zmusic

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys (SUNO_CN_API_KEY, MUSE_API_KEY, MELO_API_KEY, ports)
```

### 1.3 IDE

The project is developed in **Trae IDE**. Any editor with JavaScript/React support (VS Code) works equally well.

---

## 2. Project Structure

```
zmusic/
├── src/
│   ├── agents/                    # AI Agent Layer
│   │   └── unicorn-agent.js       # Unicorn Agent v7 (FSM + Dynamic Generation)
│   ├── assets/brands/             # Brand SVG icons (muse/suno/melo)
│   ├── components/                # Reusable React components
│   │   ├── mv/                    # MV-specific components
│   │   ├── AutoCreativePanel.jsx
│   │   ├── AutoProgressBar.jsx
│   │   ├── EasyMode.jsx
│   │   ├── FloatingChatBall.jsx
│   │   ├── HistoryPanel.jsx
│   │   ├── PersistentAudioPlayer.jsx
│   │   ├── QualityScoreBadge.jsx
│   │   ├── StrategySelector.jsx
│   │   └── BrandIcons.jsx
│   ├── config/                    # Configuration
│   │   ├── index.js               # Main config
│   │   ├── musicStyles.js         # 30+ music styles with Suno tags
│   │   └── lyricsStyles.js        # Lyrics style metadata
│   ├── contexts/                  # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── AutoProgressContext.jsx
│   │   └── PlayerContext.jsx
│   ├── controllers/               # Controller Layer (14 HTTP handlers)
│   ├── data/                      # Static data
│   │   └── creativePresets.js     # 10 AUTO strategy presets
│   ├── hooks/                     # Custom React hooks
│   │   └── useQualityGate.js
│   ├── i18n/                      # Internationalization
│   │   ├── locales/zh.json        # Chinese locale (150+ keys)
│   │   ├── locales/en.json        # English locale (150+ keys)
│   │   ├── index.js
│   │   └── useTranslation.js
│   ├── pages/                     # 18 React pages (lazy-loaded)
│   ├── routes/
│   │   └── index.js               # Central route registry (handleRoute)
│   ├── services/                  # Service Layer (17 services)
│   ├── stores/                    # State stores
│   │   ├── generationStore.jsx
│   │   └── songLibraryStore.jsx
│   ├── utils/                     # Utilities
│   │   ├── logger.js              # Log4j-style logger
│   │   ├── dynamicLyricsEngine.js # Procedural lyrics v6 engine
│   │   ├── autoConfig.js          # AUTO config (localStorage)
│   │   └── ...                    # engines, analyzers, generators
│   ├── App.jsx                    # Main app component (routing + providers)
│   ├── app.js
│   ├── main.jsx                   # Entry point
│   ├── server.js                  # Backend server
│   ├── mobile.js                  # Capacitor mobile entry
│   └── standalone.js
├── android/                       # Android project (Capacitor 6)
├── ios/                           # iOS project (Capacitor 6)
├── electron/                      # Electron desktop shell
│   ├── main.js
│   └── preload.js
├── api/                           # Standalone API bundle entry
├── netlify/functions/api/         # Netlify serverless API (esbuild bundle)
├── .github/workflows/             # CI/CD workflows
├── docs/                          # Documentation
├── scripts/                       # Version/backup/release scripts
├── public/                        # Static assets (favicon, sw.js, face-api models)
├── reference/                     # Reference materials
├── screenshots/                   # Screenshots by version
├── .env.example                   # Environment template
├── .dev-ports.json                # Shared port state
├── VERSION.json                   # Single source of truth for version
├── package.json
├── vite.config.js
├── capacitor.config.ts
└── README.md
```

---

## 3. Installation & Running

### 3.1 Install Dependencies

```bash
npm install
```

### 3.2 Run the App (Recommended)

`npm start` launches the dynamic port launcher that kills lingering processes on the target ports, then spawns both frontend and backend:

```bash
npm start
```

This reads pinned ports from `.env` (`FRONTEND_PORT=4720`, `BACKEND_PORT=4721`) and writes the allocation to `.dev-ports.json`.

### 3.3 Run Frontend + Backend Concurrently

```bash
npm run dev:full
```

This runs `concurrently "npm run server" "npm run dev"`.

### 3.4 Run Frontend Only (Vite)

```bash
npm run dev
```

### 3.5 Run Backend Only

```bash
npm run server
```

### 3.6 Ports

| Service | Port | Source |
|---------|------|--------|
| Frontend (Vite) | 4720 | `FRONTEND_PORT` in `.env` |
| Backend (Express) | 4721 | `BACKEND_PORT` in `.env` |

> **FORBIDDEN ports**: 5500, 5501, 5502, 5173, 3000, 8000. Never use these.

Open **http://localhost:4720** in your browser.

---

## 4. Build & Deployment

### 4.1 Web Build

```bash
npm run build
```

This runs three steps: `i18n:validate` (zh/en parity) → `bundle:api` (esbuild bundle for Netlify) → `vite build`.

### 4.2 Android APK Build

```bash
# Build + sync + open Android Studio
npm run cap:android

# Or build APK directly
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleRelease
```

Output: signed APK (`zmusic-v7.5.0-signed.apk`). Keystore: `android/keystore/zmusic.jks` (alias `zmusic`, validity 10000 days).

### 4.3 iOS IPA Build

iOS requires macOS + Xcode. On Windows, use GitHub Actions:

1. Go to **https://github.com/zwindhuang-opc/zmusic/actions**
2. Select **"Build iOS IPA"** workflow
3. Click **"Run workflow"**, choose export method (`development` / `ad-hoc` / `app-store`)
4. Wait ~10–15 minutes
5. Download IPA from **Artifacts**

Local macOS build:

```bash
./build-ios.sh development
```

### 4.4 Electron Desktop Build

```bash
npm run electron:build    # Builds installer (NSIS for Windows)
npm run electron:pack     # Packs without installer (unpackaged dir)
```

### 4.5 Deployment Targets

| Platform | Config | Command / Trigger |
|----------|--------|-------------------|
| GitHub Actions | `.github/workflows/auto-deploy.yml` | Auto on push to `master` (web + APK + release + Pages non-fatal) |
| Vercel | `vercel.json` | Auto-deploy |
| Netlify | `netlify.toml` + `netlify/functions/api/` | `npm run deploy:netlify` |
| Cloudflare Pages | `.github/workflows/deploy-cloudflare.yml` | Workflow trigger |

---

## 5. Coding Standards

### 5.1 Modules

- Use **ES Modules** (`import`/`export`) — the project is `"type": "module"` in `package.json`.
- JavaScript (not TypeScript) at runtime.

### 5.2 Comments

- Use **JSDoc** comments for functions (`@param`, `@returns`, `@module`).
- Document controllers, services, and utils with module headers.

### 5.3 Internationalization

- **No hardcoded user-facing strings.** Use the `t()` translation function.
- Add new keys to BOTH `src/i18n/locales/zh.json` AND `src/i18n/locales/en.json`.
- Validate parity with `npm run i18n:validate`.

```jsx
import { useTranslation } from './i18n/useTranslation.js';
const { t } = useTranslation();
return <button>{t('nav.dashboard')}</button>;
```

### 5.4 Architecture

- Follow the **MVC + Agent** layering: Pages → Controllers → Services → Agent/Model.
- Register all routes in the single `handleRoute` function in `src/routes/index.js`.
- Create a new logger per module: `new Logger('ModuleName')`.

### 5.5 Versioning

- Update version via scripts, never edit `VERSION.json`/`package.json` manually for releases:
  ```bash
  npm run version:patch   # 7.4.1 -> 7.4.2
  npm run version:minor   # 7.4.1 -> 7.5.0
  npm run version:major   # 7.4.1 -> 8.0.0
  ```

---

## 6. Adding a New Page

To add a new page (e.g., `FeaturePage.jsx`):

1. **Create the page component** in `src/pages/FeaturePage.jsx`:
   ```jsx
   import { useTranslation } from '../i18n/useTranslation.js';
   export default function FeaturePage() {
     const { t } = useTranslation();
     return <div className="p-6">{t('feature.title')}</div>;
   }
   ```

2. **Add a lazy import** in `src/App.jsx` alongside the other `lazy(...)` imports:
   ```jsx
   const FeaturePage = lazy(() => import('./pages/FeaturePage.jsx'));
   ```

3. **Register the route** in the routing logic inside `App.jsx` (render the lazy component within `<Suspense>`).

4. **Add to navigation** — add an entry to the `navigationItems` array (in the sidebar/navigation config), including `id`, `labelKey`, `icon`, and `path`.

5. **Add i18n keys** to BOTH `src/i18n/locales/zh.json` and `src/i18n/locales/en.json`:
   ```json
   { "feature": { "title": "Feature" } }
   ```
   ```json
   { "feature": { "title": "功能" } }
   ```

6. **Validate i18n parity**: `npm run i18n:validate`.

---

## 7. Adding a New API Endpoint

To add a new endpoint (e.g., `GET /api/feature/list`):

1. **Add a controller method** (in an existing controller or a new `feature.controller.js`):
   ```js
   import Logger from '../utils/logger.js';
   const logger = new Logger('FeatureController');
   export function list(req, res) {
     logger.info('Listing features');
     return res.json({ success: true, data: [] });
   }
   export default { list };
   ```

2. **Register the route** in `src/routes/index.js` inside `handleRoute`:
   ```js
   import featureController from '../controllers/feature.controller.js';
   // ...inside handleRoute:
   if (path === '/api/feature/list' && method === 'GET') {
     return featureController.list(req, res);
   }
   ```

3. **Add a service** (if business logic/external calls are needed) in `src/services/feature.service.js`, and call it from the controller.

4. **Call from the frontend** via `src/services/api.client.js`.

> **Route matching convention**: For sub-path groups (e.g., `/api/feature/*`), use a regex match like `path.match(/^\/api\/feature\/(.+)$/)` and switch on the captured `subPath`, mirroring the existing Suno/Muse/Melo patterns.

---

## 8. Adding a New AI Engine Integration

To add a fourth AI engine (e.g., "Nova AI"):

1. **Create the service** `src/services/nova.service.js` — implement `status()`, `getUser()`, `generate()`, `queryTask()`, calling the Nova API with the appropriate auth.

2. **Create the controller** `src/controllers/nova.controller.js` — thin HTTP handlers delegating to the service. Add a `new Logger('NovaController')`.

3. **Register routes** in `src/routes/index.js` under a `/api/nova/*` regex group (status, user, generate, task).

4. **Create the frontend page** `src/pages/NovaPage.jsx` — include an AUTO button, a refreshable history panel ("历史音乐"), and engine-specific styling. Add it to `App.jsx` lazy imports and `navigationItems` in the "Music Generation" group.

5. **Add a brand icon** in `src/assets/brands/nova-icon.svg` and wire it in `src/components/BrandIcons.jsx`.

6. **Wire into GLOBAL AUTO** — add Nova to the sequential chain in the AUTO orchestration (after Melo) with the 5-second delay.

7. **Add an AUTO strategy override** — extend `src/utils/autoConfig.js` and the Settings page per-engine overrides.

8. **Add i18n keys** for all Nova UI strings (zh + en) and validate.

---

## 9. Logging Usage Examples

### 9.1 Import and Create a Logger

```js
import Logger from '../utils/logger.js';
const logger = new Logger('MyModule');
```

### 9.2 Log at Each Level

```js
logger.trace('Entering function X');           // TRACE
logger.debug('Variable value: %s', value);     // DEBUG (dev default)
logger.info('Generation started for %s', id);  // INFO  (prod default)
logger.warn('Deprecated field used: %s', key); // WARN
logger.error('API call failed: %o', err);      // ERROR (goes to console.error)
logger.fatal('Unrecoverable state reached');   // FATAL
```

### 9.3 Format Tokens

- `%s` string, `%d` number, `%j` / `%o` JSON

### 9.4 File Appender (Server-Side)

The server wires `node:fs` into a `FileAppender`:

```js
import Logger, { FileAppender } from './utils/logger.js';
import fs from 'node:fs';

const fileAppender = new FileAppender('./logs/server.log', {
  maxSize: 5 * 1024 * 1024, // 5MB rotation
  fs,                        // injected node:fs
});
const logger = new Logger('Server');
logger.addAppender(fileAppender);
```

- Rotates at 5MB by renaming `server.log` → `server.log.1`.
- In the browser, `FileAppender` is a safe no-op (no `fs`).

### 9.5 Global Level

```js
import { Logger, LogLevel } from './utils/logger.js';
Logger.setGlobalLevel(LogLevel.DEBUG); // dev
Logger.setGlobalLevel(LogLevel.INFO);  // prod
```

---

## 10. Testing Strategy

### 10.1 i18n Validation

```bash
npm run i18n:validate
```

Performs a JSON parity check between `zh.json` and `en.json`. CI-safe (does not load `better-sqlite3`, avoiding segfaults). Must pass before any build.

### 10.2 Simulation Script

```bash
node scripts/simulate-generation.mjs
```

Simulates a generation flow end-to-end for smoke testing without spending engine credits.

### 10.3 Build Validation

```bash
npm run build
```

Runs i18n validate + API bundle + Vite production build. A clean build (0 errors) is the primary integration test.

### 10.4 Manual Smoke Checks

- `GET /api/health` returns `status: "healthy"` and `browser.connected`.
- All 18 pages render without console errors.
- GLOBAL AUTO triggers Muse → Suno → Melo sequentially.
- Language toggle switches all visible strings.

---

## 11. Troubleshooting Guide

### 11.1 Port Conflicts

```powershell
# Find process using port 4720 or 4721
netstat -ano | findstr :4720
netstat -ano | findstr :4721

# Kill the process
taskkill /PID <PID> /F
```

`npm start` automatically kills lingering processes on the target ports before spawning. Never use forbidden ports (5500, 5501, 5502, 5173, 3000, 8000).

### 11.2 CDP Connection Issues (Edge)

- Ensure Edge is running with `--remote-debugging-port=9222`.
- Verify: open `http://localhost:9222/json` in a browser — it should return JSON targets.
- ZMusic **never** launches a new browser window; the user must start Edge manually in debug mode.
- The 60s health poll auto-detects login state once CDP is reachable.

### 11.3 API Auth Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Muse `code=1006 login state失效` | Server-side session (`sid`) expired (~24h) | Re-login interactively on muse.top via Edge (phone + SMS) |
| Suno "insufficient points" | 0 credits | Top up at suno.cn |
| Melo "credit insufficient" | 0 credits | Top up at h.51melo.com |
| 401 / unauthorized | Missing/invalid API key | Check `.env` (`SUNO_CN_API_KEY`, `MUSE_API_KEY`, `MELO_API_KEY`) |

### 11.4 Build Errors

| Error | Fix |
|-------|-----|
| i18n parity failure | Add missing keys to both `zh.json` and `en.json`; re-run `npm run i18n:validate` |
| better-sqlite3 segfault in CI | Use `i18n:validate` (JSON parity) instead of DB-dependent commands in CI |
| Vite build OOM | Close other heavy processes; ensure Node 18+ |
| APK build fails | Run `npx cap sync android` first; ensure Android SDK + Java installed |

### 11.5 GitHub Push Failures

Transient network resets to github.com are common (GFW/ISP). Retry when connectivity returns:

```bash
git -C "e:/AI_Projects/zmusic" push origin master
git -C "e:/AI_Projects/zmusic" push origin v7.5.0
```

---

## 12. Performance Considerations

| Area | Strategy |
|------|----------|
| **Lazy loading** | All 18 pages are `lazy()`-loaded with `<Suspense>` to keep the initial bundle small (code-split per route). |
| **Polling** | The Dashboard health/status poll runs at most once every 60 seconds — never per-render. A single interval ref avoids React StrictMode double-fire aborts. |
| **Retry** | `api.client.js` retries transient failures (max 2, 1s/2s backoff) instead of failing fast. |
| **History cleanup** | Client localStorage caps at 100 entries; server `.history/` caps at 200 — oldest auto-removed. |
| **Serverless bundle** | Netlify API function bundled with esbuild (tree-shaking, `--external` for native modules). |
| **Log rotation** | FileAppender rolls `server.log` at 5MB to prevent unbounded disk growth. |

---

## 13. Version Management

### 13.1 Single Source of Truth

`VERSION.json` is the authoritative version file:

```json
{
  "version": "7.5.0",
  "major": 7,
  "minor": 5,
  "patch": 0,
  "buildNumber": 12,
  "releaseDate": "2026-08-15",
  "status": "production-ready"
}
```

### 13.2 Scripts

| Script | Purpose |
|--------|---------|
| `scripts/version.js` | Bumps version (patch/minor/major), syncs `VERSION.json` + `package.json` + `build.gradle` |
| `scripts/release.mjs` | Creates release: bump + commit + tag + push |
| `scripts/backup.js` | Commits + pushes all changes (backup) |

### 13.3 Commands

```bash
npm run version:show       # Print current version
npm run version:patch      # 7.4.1 -> 7.4.2
npm run version:minor      # 7.4.1 -> 7.5.0
npm run version:major      # 7.4.1 -> 8.0.0

npm run release:patch      # Release a patch version
npm run release:minor      # Release a minor version
npm run release:major      # Release a major version
npm run backup             # Backup (commit + push)
npm run backup:tag         # Backup with a dated tag
```

### 13.4 Semantic Versioning

- **MAJOR**: breaking changes / architecture shifts
- **MINOR**: new features (e.g., new pages, new engine)
- **PATCH**: bug fixes / documentation

### 13.5 Release Flow (GitHub Actions)

1. Push to `master` triggers `.github/workflows/auto-deploy.yml`.
2. Workflow builds web + Android APK (debug + release) + creates a GitHub Release with tag.
3. GitHub Pages deploy is `continue-on-error` (non-fatal — blocked on free private plan).
4. Vercel / Netlify / Cloudflare auto-deploy from their respective configs.

---

*Cross-references: [System Specification](SYSTEM_SPEC.md) (requirements) · [Program Specification](PROGRAM_SPEC.md) (module detail) · [User Guide](USER_GUIDE.md) · [PMP Project Plan](PMP_PROJECT_PLAN.md) · [Issue Log](ISSUE_LOG.md) · [Architecture](ARCHITECTURE.md) · [API Documentation](../API_DOCUMENTATION.md)*

*Last Updated: 2026-08-15 · Document Version: 7.5.0*
