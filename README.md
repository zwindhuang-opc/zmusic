# ZMusic - AI Music Generation Platform

**Version 5.4.0** | Dynamic Procedural Lyrics Engine v6

ZMusic is a full-stack AI music generation platform with dual AI engines (Suno + Muse), dynamic procedural lyrics generation, MV timeline creation, and cross-platform mobile support.

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Dynamic Lyrics Engine](#dynamic-lyrics-engine)
- [History Persistence](#history-persistence)
- [Mobile Apps](#mobile-apps)
- [GitHub Actions (iOS Builds)](#github-actions-ios-builds)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

---

## Key Features

- **Dynamic Procedural Lyrics Engine v6** - No hardcoded lyrics. Billions of unique combinations from word banks, templates, and rhyme engine
- **Dual AI Engines** - Suno AI (structured params) + Muse AI (natural language commands)
- **Unicorn Agent v7** - FSM-based generation with 4 methods (basic, network, time, variation)
- **Mix Mode** - Combine multiple themes + styles for cross-genre hybrid lyrics
- **History Persistence** - All generated content saved locally (localStorage) and server-side (file system)
- **Cross-Platform** - Web, Android (APK), iOS (IPA via GitHub Actions), Desktop (Electron)
- **i18n Support** - Chinese/English bilingual interface
- **MVC Architecture** - Clean separation of concerns

---

## Tech Stack

### Frontend
- React 18 + Vite 5.4
- Tailwind CSS + Lucide Icons
- Capacitor 6 (mobile bridge)

### Backend
- Node.js 18+ / Express 5
- ES Modules
- File-based storage (no database required)

### AI Services
- Suno.cn API (v5.5) - Structured music generation
- Muse AI API - Natural language music generation

### Mobile
- Android: Gradle + Capacitor (signed APK)
- iOS: Xcode + Capacitor (IPA via GitHub Actions)

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/vcfhuang/zmusic.git
cd zmusic

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Run the Web App

```bash
# Start both frontend + backend together
npm run dev:full

# Or start separately:
npm run server    # Backend API on port 5501
npm run dev       # Frontend dev server on port 5500
```

Open **http://localhost:5500** in your browser.

### Build for Production

```bash
# Build frontend
npm run build

# Start production server
npm run server
```

---

## Project Structure

```
zmusic/
├── src/
│   ├── agents/                    # AI Agent Layer
│   │   └── unicorn-agent.js       # Unicorn Agent v7 (FSM + Dynamic Generation)
│   ├── config/                    # Configuration
│   │   ├── index.js               # Main config
│   │   ├── musicStyles.js         # Music style definitions
│   │   └── lyricsStyles.js        # Lyrics style metadata
│   ├── controllers/               # Controller Layer (HTTP handlers)
│   │   ├── health.controller.js
│   │   ├── music.controller.js
│   │   ├── lyrics.controller.js
│   │   ├── mv.controller.js
│   │   ├── agent.controller.js
│   │   └── history.controller.js  # History API endpoints
│   ├── i18n/                      # Internationalization
│   ├── pages/                     # React Page Components
│   │   ├── Dashboard.jsx
│   │   ├── MusicPage.jsx
│   │   ├── LyricsPage.jsx
│   │   ├── MVPage.jsx
│   │   └── SettingsPage.jsx
│   ├── routes/                    # Route Definitions
│   ├── services/                  # Service Layer (Business Logic)
│   │   ├── suno.service.js        # Suno AI integration
│   │   ├── muse.service.js        # Muse AI integration
│   │   ├── lyrics.service.js      # Dynamic lyrics generation
│   │   ├── mv.service.js          # MV timeline generation
│   │   ├── history.service.js     # Client-side history (localStorage)
│   │   └── generation.history.js  # Server-side history (file system)
│   ├── utils/                     # Utilities
│   │   ├── logger.js              # Log4j-style logger
│   │   ├── lyricsEngine.js        # Lyrics engine (delegates to dynamic engine)
│   │   └── dynamicLyricsEngine.js # Dynamic procedural generation engine v6
│   ├── App.jsx                    # Main app component
│   ├── main.jsx                   # Entry point
│   └── server.js                  # Backend server
├── android/                       # Android project
│   ├── app/build.gradle           # APK build config + signing
│   └── keystore/zmusic.jks        # Signing keystore
├── ios/                           # iOS project
├── .github/workflows/
│   └── build-ios.yml              # GitHub Actions iOS IPA build
├── build-ios.sh                   # macOS IPA build script
├── .env.example                   # Environment template
├── package.json
├── vite.config.js
├── capacitor.config.json
└── README.md
```

---

## Dynamic Lyrics Engine

The v6 engine replaces all hardcoded lyrics with procedural generation.

### How It Works

```
Word Banks (30 themes x 8 categories)
         +
Style Modifiers (30 styles)
         +
Sentence Templates (51 patterns)
         +
Chinese Rhyme Engine (10 rhyme groups)
         =
Billions of Unique Combinations
```

### Generation Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| `basic` | Standard section-based generation | Quick lyrics |
| `network` | 4-layer composition (Foundation/Melody/Expression/Effects) | Detailed commands |
| `time` | Time-stamped sections with instrument dynamics | MV timelines |
| `variation` | Style variations (A/B/C) | Remix exploration |
| `mix` | Blend multiple themes + styles | Cross-genre hybrids |

### Available Themes (30)
love, loneliness, sadness, dreams, memory, nature, friendship, success, hope, life, lunatic, tango, heartbreak, healing, time_travel, epic_journey, dark_mystery, romantic_night, nostalgic_memory, energetic_party, dreamy_fantasy, modern_city, ancient_legend, indie_story, folk_tale, summer_vibes, winter_solitude, spring_awakening, autumn_melancholy, ocean_dreams

### Available Styles (30)
pop, rock, electronic, hip_hop, ballad, jazz, classical, rnb, country, heartbreaking, healing, time_travel, epic, dark, romantic, nostalgic, energetic, dreamy, modern, ancient, indie, folk, kpop, reggae, ambient, chinese_traditional, chinese_classical, love_song, gothic_rock, ancient_modern

### Combinatorics
```
30 themes x 30 styles x 4 methods x 10 complexity x 3 variations
x 50+ templates x 100+ words per category = billions of unique outputs
```

---

## History Persistence

All generated content is automatically saved and accessible even offline.

### Client-Side (localStorage)
- File: `src/services/history.service.js`
- Stores: lyrics, music, MV, commands
- Capacity: 100 entries
- Accessible: Even when backend is offline

### Server-Side (File System)
- File: `src/services/generation.history.js`
- Storage: `.history/` directory with JSON files
- Capacity: 200 entries
- Auto-cleanup: Oldest entries removed when limit reached

### History API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/history` | GET | Get all history (optional `?type=lyrics`) |
| `/api/history/stats` | GET | Get generation statistics |
| `/api/history/:id` | GET | Get specific record |
| `/api/history/:id` | DELETE | Delete a record |
| `/api/history/clear` | POST | Clear all history |

---

## Mobile Apps

### Android APK

The signed APK is built locally on Windows:

```bash
# Build frontend + sync + build APK
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleRelease
```

Output: `zmusic-v5.4.0-signed.apk`

Signing config in `android/app/build.gradle`:
- Keystore: `android/keystore/zmusic.jks`
- Alias: `zmusic`
- Validity: 10000 days

### iOS IPA

iOS IPAs require macOS + Xcode. Two options:

1. **GitHub Actions (recommended)** - Build on cloud Mac from Windows
   - See: [GitHub Actions Guide](docs/GITHUB_ACTIONS_GUIDE.md)
   - Workflow: `.github/workflows/build-ios.yml`

2. **Local macOS build** - Run `build-ios.sh` on a Mac
   ```bash
   ./build-ios.sh development
   ```

---

## GitHub Actions (iOS Builds)

Build iOS IPAs from your Windows PC using GitHub's free macOS runners.

### Quick Steps

1. Go to **https://github.com/vcfhuang/zmusic/actions**
2. Select **"Build iOS IPA"** workflow
3. Click **"Run workflow"**
4. Choose export method: `development` / `ad-hoc` / `app-store`
5. Wait ~10-15 minutes
6. Download IPA from **Artifacts** section

### Detailed Guide

See: [docs/GITHUB_ACTIONS_GUIDE.md](docs/GITHUB_ACTIONS_GUIDE.md)

---

## API Reference

### Base URL
```
http://localhost:5501/api
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | System health check |
| `/api/agent/status` | GET | Unicorn Agent status |
| `/api/lyrics/genres` | GET | Available genres |
| `/api/lyrics/generate` | POST | Generate lyrics |
| `/api/music/generate` | POST | Generate music (Suno) |
| `/api/music/generate-agent` | POST | Generate music (dual engine) |
| `/api/mv/generate` | POST | Generate MV timeline |
| `/api/history` | GET | Get generation history |

Full API docs: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

## Configuration

### Environment Variables (.env)

```env
# Suno AI API
SUNO_CN_API_KEY=your_suno_api_key

# Muse AI API
MUSE_AI_API_KEY=your_muse_api_key
MUSE_AI_BASE_URL=https://api.muse.ai

# Server
PORT=5501
NODE_ENV=development
```

### Version Management

```bash
npm run version:current   # Show current version
npm run version:patch     # 5.4.0 -> 5.4.1
npm run version:minor     # 5.4.0 -> 5.5.0
npm run version:major     # 5.4.0 -> 6.0.0
```

### Backup to GitHub

```bash
npm run backup            # Commit + push all changes
npm run backup:tag        # Create dated tag
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :5500

# Kill process
taskkill /PID <PID> /F
```

### Backend Unreachable

1. Check backend is running: `npm run server`
2. Verify port 5501 is open
3. Check `.env` file exists and has correct config
4. View logs for errors

### APK Won't Install

- Ensure you have the signed APK: `zmusic-v5.4.0-signed.apk`
- Enable "Install from unknown sources" on Android
- The APK is signed with a self-signed certificate (valid until 2053)

### iOS Build Fails

- iOS builds require macOS (use GitHub Actions)
- See: [GitHub Actions Guide](docs/GITHUB_ACTIONS_GUIDE.md)

---

## Documentation

| Document | Description |
|----------|-------------|
| [User Guide](docs/USER_GUIDE.md) | End-user guide for using ZMusic |
| [GitHub Actions Guide](docs/GITHUB_ACTIONS_GUIDE.md) | Step-by-step iOS IPA build guide |
| [API Documentation](API_DOCUMENTATION.md) | Full REST API reference |
| [Architecture](docs/ARCHITECTURE.md) | System architecture details |

---

## License

MIT License

## Links

- GitHub: [https://github.com/vcfhuang/zmusic](https://github.com/vcfhuang/zmusic)
- Contact: vcfhuang@qq.com
