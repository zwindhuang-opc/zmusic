# ZMusic User Guide

| Field | Value |
|-------|-------|
| **Project Name** | ZMusic — Real AI Music Generation Platform |
| **Document Title** | User Guide |
| **Version** | 7.5.0 |
| **Date** | 2026-08-15 |
| **Author** | Vincent Huang (zwindhuang@qq.com) |
| **Repository** | https://github.com/zwindhuang-opc/zmusic |
| **License** | MIT |

A complete guide to using ZMusic for AI music, lyrics, MV generation, publishing, and analytics.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Interface Overview](#2-interface-overview)
3. [Easy Mode vs Expert Mode](#3-easy-mode-vs-expert-mode)
4. [Dashboard](#4-dashboard)
5. [Music Generation](#5-music-generation)
6. [GLOBAL AUTO](#6-global-auto)
7. [AUTO Strategy Presets](#7-auto-strategy-presets)
8. [Lyrics Generation](#8-lyrics-generation)
9. [Image-to-Lyrics](#9-image-to-lyrics)
10. [MV Generation](#10-mv-generation)
11. [Creative Notebook](#11-creative-notebook)
12. [Remix Studio](#12-remix-studio)
13. [Publish Studio](#13-publish-studio)
14. [Song Library](#14-song-library)
15. [Quality Analyzer](#15-quality-analyzer)
16. [Batch Generation](#16-batch-generation)
17. [Analytics Dashboard](#17-analytics-dashboard)
18. [Persistent Audio Player](#18-persistent-audio-player)
19. [Settings](#19-settings)
20. [Account & Login](#20-account--login)
21. [History & Persistence](#21-history--persistence)
22. [Internationalization (i18n)](#22-internationalization-i18n)
23. [Tips & Tricks](#23-tips--tricks)
24. [FAQ](#24-faq)
25. [Troubleshooting](#25-troubleshooting)

---

## 1. Getting Started

ZMusic runs as a web app, a mobile app, and a desktop app.

### Web App

```bash
npm start
```

Open **http://localhost:4720** in your browser. The backend API runs on port 4721.

### Mobile App

- **Android**: Install `zmusic-v7.5.0-signed.apk` (enable "Install from unknown sources" in Android settings first).
- **iOS**: Build the IPA via GitHub Actions (see [GitHub Actions Guide](GITHUB_ACTIONS_GUIDE.md)), then sideload using Sideloadly or AltStore. Trust the developer in Settings > General > VPN & Device Management.

### Desktop App

Run the Electron build (`npm run electron:build`) and launch the resulting installer.

### Interface Language

ZMusic is bilingual (Chinese/English). Toggle the language using the button in the top-right corner. All 150+ UI keys switch instantly.

---

## 2. Interface Overview

The sidebar groups features logically:

| Group | Pages |
|-------|-------|
| **Dashboard** | Dashboard |
| **Music Generation** | Music Studio, Muse AI, Suno AI, Melo AI |
| **Lyrics** | Lyrics Generation, Image-to-Lyrics, Creative Notebook |
| **MV** | MV (3 sub-tabs: Muse MV / Suno MV / Melo MV) |
| **Studios** | Remix Studio, Publish Studio |
| **Workbench** | Song Library, Quality Analyzer, Batch Generation, Analytics Dashboard |
| **Settings** | Settings |
| **Account** | Login / Logout |

A **persistent audio player** sits at the bottom of every page.

---

## 3. Easy Mode vs Expert Mode

ZMusic offers two interface modes:

| Mode | Best For | Features |
|------|----------|----------|
| **Easy Mode** | Beginners | 3-step wizard, large fonts, emoji mood selection, simplified controls |
| **Expert Mode** | Advanced users | Full parameter controls (BPM, duration, complexity, mix mode, network layers) |

Toggle between modes in Settings or via the mode toggle in the UI.

---

## 4. Dashboard

The Dashboard is your home screen. It includes:

- **KPI Cards** — Total generations, library size, analytics summary.
- **Workbench Quick Access** — 4 cards linking to Library, Quality, Batch, and Analytics.
- **AI Status Indicators** — Live status for Muse, Suno, Melo, and Edge CDP connection. Refreshed every 60 seconds.
- **GLOBAL AUTO Button** — One-click generation across all three engines (see [GLOBAL AUTO](#6-global-auto)).

---

## 5. Music Generation

ZMusic integrates three AI music engines, each with its own page.

### 5.1 Music Studio (Unicorn Agent)

The Music Studio uses the **Unicorn Agent v7** (FSM-based) to coordinate lyrics + music generation. Choose from 4 methods:

| Method | Produces | Best For |
|--------|----------|----------|
| Basic | Structured lyrics + sections | Quick songwriting |
| Network | Lyrics + 4-layer audio commands (Foundation/Melody/Expression/Effects) | Detailed production |
| Time | Time-stamped sections with instrument dynamics | MV/video |
| Variation | Style remix (A/B/C variations) | Exploring alternatives |

### 5.2 Muse AI

- Natural-language music generation (muse.top).
- Authenticated via JWT (server-side proxy — your token never reaches the browser).
- **AUTO button** triggers automated sequential generation.
- **History panel** ("历史音乐") with a refresh button shows previous Muse songs.

### 5.3 Suno AI

- Structured music generation (v5.5, suno.cn).
- Set style, duration (30–300s), BPM (60–200).
- **AUTO button** + refreshable **history panel**.

### 5.4 Melo AI

- Advanced multi-layer composition (melo.bytedance.com, model MS55).
- Default duration **240 seconds**.
- **AUTO button** + refreshable **history panel**.

> Each engine page has a refresh button on its "生成历史" (generation history) header to reload recently generated songs.

---

## 6. GLOBAL AUTO

The **GLOBAL AUTO** button (on the main page) triggers **simultaneous generation across Muse → Suno → Melo sequentially**, with a **5-second delay** between engines.

- Cross-page state is shared via `localStorage`, so navigating during an AUTO run does not interrupt it.
- Progress is shown via the AutoProgressBar.
- Results are enqueued in the persistent audio player and saved to history.

---

## 7. AUTO Strategy Presets

Ten creative strategy presets steer AUTO generation toward a specific musical character. Select one via the StrategySelector inside the AutoCreativePanel. Your choice is persisted and applied as baseline defaults in Muse/Suno/Melo AUTO start (explicit values override).

| # | Preset (zh) | Preset (en) | Character |
|---|-------------|-------------|-----------|
| 1 | 流行抓耳 | Radio-Friendly | Strict verse-chorus, monster hooks |
| 2 | 民谣叙事 | Folk Narrative | Storytelling, acoustic |
| 3 | 电子氛围 | Electronic Ambient | Atmospheric, synth-driven |
| 4 | 摇滚能量 | Rock Energy | High-energy, guitar-driven |
| 5 | 古风古韵 | Ancient Classical | Chinese traditional/classical fusion |
| 6 | 治愈清新 | Healing Fresh | Calm, uplifting |
| 7 | 嘻哈律动 | Hip-Hop Groove | Rhythmic, beat-focused |
| 8 | 史诗磅礴 | Epic Cinematic | Orchestral, trailer-style |
| 9 | 情歌浪漫 | Romantic Ballad | Emotional love songs |
| 10 | 先锋实验 | Experimental | Avant-garde, genre fusions |

Each preset defines a BPM range, default duration, structure, melodic/lyric complexity, style hint, instruments, and tags.

---

## 8. Lyrics Generation

The Lyrics page uses the **Dynamic Procedural Lyrics Engine v6** — no two generations are the same.

### Top Panel: 创作脚本 (Creative Script)

A creative ideation panel sits at the top of the page for entering your concept/inspiration.

### Themes (30)

love, loneliness, sadness, dreams, memory, nature, friendship, success, hope, life, lunatic, tango, heartbreak, healing, time_travel, epic_journey, dark_mystery, romantic_night, nostalgic_memory, energetic_party, dreamy_fantasy, modern_city, ancient_legend, indie_story, folk_tale, summer_vibes, winter_solitude, spring_awakening, autumn_melancholy, ocean_dreams

### Styles (30)

pop, rock, electronic, hip_hop, ballad, jazz, classical, rnb, country, heartbreaking, healing, time_travel, epic, dark, romantic, nostalgic, energetic, dreamy, modern, ancient, indie, folk, kpop, reggae, ambient, chinese_traditional, chinese_classical, love_song, gothic_rock, ancient_modern

### Methods (5)

| Method | Output | Best For |
|--------|--------|----------|
| Basic | Structured lyrics with sections | Quick songwriting |
| Network Layer | Lyrics + 4-layer audio commands | Detailed production |
| Time Section | Lyrics + time-stamped dynamics | MV/video |
| Variation | A/B/C style remix | Exploring alternatives |
| Mix | Blend multiple themes + styles | Cross-genre hybrids |

### Complexity (1–10)

- **1–3**: Simple, short lyrics
- **4–6**: Standard (recommended)
- **7–10**: Complex, layered

### Mix Mode

Enable **Mix Mode** to combine 2–3 themes and 2–3 styles for cross-genre hybrid lyrics (thousands of combinations).

### Easy Mode Wizard

In Easy Mode, lyrics generation uses a 3-step wizard with emoji mood selection and large fonts.

---

## 9. Image-to-Lyrics

A standalone page that analyzes an uploaded image (via `/api/vision/analyze`) and generates lyrics derived from the image's visual content. Useful for turning artwork, photos, or mood boards into song lyrics.

---

## 10. MV Generation

The MV page has **3 sub-tabs**, each with AUTO mode:

| Sub-Tab | Engine | Color Theme |
|---------|--------|-------------|
| Muse MV | Muse AI | Engine-specific |
| Suno MV | Suno AI | Engine-specific |
| Melo MV | Melo AI | Engine-specific |

### Output

Each MV timeline includes time-stamped scene descriptions, camera movements, color grading instructions, transition effects, and instrument-to-scene mapping.

---

## 11. Creative Notebook

The **Creative Notebook** (创作构思记录簿) is a dedicated history page for creative ideas. Each entry has:

- **Copy** button — copy text to clipboard
- **Send-to** buttons — send the idea to Lyrics, Music, or MV generation

---

## 12. Remix Studio

The Remix Studio provides **A/B side-by-side comparison** of two tracks and supports **cross-engine regeneration** — re-master a track using a different AI engine (e.g., turn a Suno track into a Muse rendition).

---

## 13. Publish Studio

Publish your generated music to **5 platforms**:

| Platform | Type |
|----------|------|
| Douyin (抖音) | Video |
| TikTok | Video |
| Xiaohongshu (小红书) | Note |
| YouTube | Video |
| Qishui Music (汽水音乐) | Track |

### Features

- **OAuth + chunked upload** for each platform.
- **JSZip bundle export**: MP3 + cover + `metadata.json` + `lyrics.txt` + `caption.txt` + `MANUAL_UPLOAD_STEPS.md`.
- **Bitrate selector**: 192 / 256 / 320 + Lossless.
- **`.lrc` lyrics export** with evenly distributed timestamps.
- **ID3 info panel** for metadata editing.
- **Vertical 1080×1920 video toggle** for short-form platforms.
- **Hashtag suggestions** via `/api/publish/suggest-hashtags`.

---

## 14. Song Library

The Song Library organizes your generated songs.

- **Engine tabs** — filter by Muse / Suno / Melo.
- **Albums** — group songs into albums (create via `/api/albums`).
- **Favorites** — mark songs as favorites.
- **Search & sort** — find songs quickly.
- **Bulk export** — export selected songs as ZIP or JSON.
- **Auto-migration** — songs are auto-migrated from generation history.
- **Album Detail page** — view songs within an album.

---

## 15. Quality Analyzer

The Quality Analyzer scores each song on **6 metrics** (1–100):

| Metric | Weight | Measures |
|--------|--------|----------|
| Structural | 15% | Song structure completeness |
| Lyrics | 25% | Lyrics quality/richness |
| Duration | 15% | Appropriate length |
| BPM | 15% | Tempo suitability |
| Style | 15% | Style consistency |
| Clarity | 15% | Audio clarity |

- Displays a **QualityScoreBadge** pill.
- Exposes a **useQualityGate** threshold hook for gating actions by quality.
- Standalone analyzer page with a regen slider for re-evaluation.

**Weighted score** = structural×0.15 + lyrics×0.25 + duration×0.15 + bpm×0.15 + style×0.15 + clarity×0.15.

---

## 16. Batch Generation

Generate multiple songs in a queue.

- **Input**: manual textarea or **CSV/JSON upload** (built-in parser).
- **Engine checkboxes**: select which engines to use.
- **Strategy preset**: choose one of the 10 presets.
- **Sequential queue**: per-item status cards (queued/running/done/failed) + global status.
- **ETA**: calculated from the first-job average duration.
- **Output**: ZIP bundle (MP3 + cover + metadata).

---

## 17. Analytics Dashboard

Visualize your generation activity.

- **4 KPI cards** — summary metrics.
- **4 inline SVG/CSS charts**:
  - Engine comparison bars
  - Style donut (conic-gradient)
  - 7×24 productive-hours heatmap
  - 7-day polyline area trend
- **Top-5 habits** list.
- **Data source**: localStorage history + publishing metrics.
- **CSV report export**.

---

## 18. Persistent Audio Player

A glassmorphism **bottom bar** present on every page.

### Controls

- Play / Pause
- Previous / Next
- Seek
- Volume
- Shuffle
- Repeat

### MediaSession Integration

- Metadata (title, artist, artwork)
- Position state
- 7 action handlers (OS-level media controls)

### Expandable Mini-Player

Click to expand into a 16:9 mini-player with an **animated waveform** and a **lyrics excerpt scroller**.

---

## 19. Settings

### AUTO Configuration

| Setting | Range / Options |
|---------|-----------------|
| Song count | 1–20 |
| Countdown | 10–120 seconds |
| Auto-chain | On / Off |
| Stop-on-error | On / Off |
| Per-engine overrides | Customize per engine (Muse/Suno/Melo) |

### Preferences

| Setting | Description |
|---------|-------------|
| Language | Chinese / English toggle |
| Mode | Easy Mode / Expert Mode toggle |

---

## 20. Account & Login

### Login Page (Phase 1 Auth)

- **Register** with a username + password (sha256-hashed).
- **Login** to access the Song Library.
- **Guest mode** — browse and generate without an account.

A Login/Logout button appears in the sidebar showing the current user's name when logged in.

---

## 21. History & Persistence

All generated content is **automatically saved** — you never lose your work.

| Layer | Storage | Capacity | Offline |
|-------|---------|----------|---------|
| Client | Browser `localStorage` | 100 entries | Yes |
| Server | File system (`.history/`) | 200 entries | Yes (if server running) |

Oldest entries are auto-removed when capacity is reached. Access history via the per-page history panels or the Creative Notebook.

---

## 22. Internationalization (i18n)

ZMusic is fully bilingual (Chinese/English) with 150+ synchronized keys.

- Toggle language from the top-right button.
- No hardcoded user-facing strings — all use the `t()` translation function.
- Locale files (`zh.json`, `en.json`) are validated for parity on every build.

---

## 23. Tips & Tricks

### Getting Better Lyrics

1. **Mix themes** — combine "love" + "sadness" + "hope" for emotional depth.
2. **Use higher complexity** (7–10) for more detailed output.
3. **Try Variation mode** for 3 different takes on the same theme/style.
4. **Network Layer method** gives production-ready 4-layer commands.

### Production Workflow

1. Generate lyrics (Basic method).
2. Refine lyrics (Variation method).
3. Generate music commands (Network Layer method).
4. Run GLOBAL AUTO to generate across all three engines.
5. Compare in Remix Studio (A/B).
6. Score with Quality Analyzer.
7. Publish via Publish Studio.

### Mix Mode Examples

| Theme Combo | Style Combo | Result |
|-------------|-------------|--------|
| love + sadness | pop + jazz | Melancholic jazz-pop love song |
| nature + dreams | ambient + classical | Ethereal classical ambient piece |
| modern_city + loneliness | electronic + hip_hop | Urban electronic hip-hop |
| ancient_legend + epic_journey | chinese_classical + rock | Epic Chinese rock fusion |

---

## 24. FAQ

**Q: Why are my lyrics different each time with the same settings?**
A: The v6 engine uses procedural generation from word banks + templates with random selection. Same settings = different output. This is by design.

**Q: Can I edit generated lyrics?**
A: Yes — copy from the output area and edit in any text editor.

**Q: Why does the backend show "unreachable"?**
A: The backend must be running. Start it with `npm run server` or `npm start` (which starts both). Check ports 4720/4721.

**Q: Does the app work offline?**
A: History (localStorage) works offline. Generation requires the backend + external AI APIs.

**Q: How do I share generated content?**
A: Use Publish Studio (multi-platform) or the Song Library bulk export (ZIP/JSON).

**Q: The Muse banner says "会话已过期" (session expired). What do I do?**
A: Muse server-side sessions expire ~24h after inactivity. Re-login interactively on muse.top via Edge (phone + SMS). ZMusic auto-detects the new login on the next 60s health poll.

**Q: Suno/Melo says "insufficient credits". What now?**
A: Top up credits at suno.cn / h.51melo.com. The platform cannot purchase credits for you.

**Q: How many unique lyrics can be generated?**
A: Billions — 30 themes × 30 styles × 5 methods × 50+ templates × 100+ words per category.

**Q: The APK won't install — what do I do?**
A: Ensure you have `zmusic-v7.5.0-signed.apk` (signed version). Enable "Install from unknown sources" in Android Settings > Security.

**Q: What is GLOBAL AUTO?**
A: A single button that generates across Muse → Suno → Melo sequentially with a 5-second delay, sharing state across pages via localStorage.

---

## 25. Troubleshooting

### Port Already in Use

```powershell
netstat -ano | findstr :4720
taskkill /PID <PID> /F
```

`npm start` auto-kills lingering processes on the target ports. Never use forbidden ports (5500, 5501, 5502, 5173, 3000, 8000).

### Backend Unreachable

1. Check backend is running: `npm run server` or `npm start`.
2. Verify port 4721 is open.
3. Check `.env` exists with correct API keys.
4. View `logs/server.log` for errors.

### CDP / Edge Login Not Detected

- Start Edge with `--remote-debugging-port=9222`.
- Verify `http://localhost:9222/json` returns JSON.
- ZMusic never launches a browser window — you must start Edge manually.

### APK Won't Install

- Use the signed APK: `zmusic-v7.5.0-signed.apk`.
- Enable "Install from unknown sources".
- The APK is signed with a self-signed certificate (valid until ~2053).

### iOS Build Fails

- iOS builds require macOS + Xcode. On Windows, use GitHub Actions (see [GitHub Actions Guide](GITHUB_ACTIONS_GUIDE.md)).

---

*Cross-references: [System Specification](SYSTEM_SPEC.md) · [Program Specification](PROGRAM_SPEC.md) · [Technical Guide](TECHNICAL_GUIDE.md) · [PMP Project Plan](PMP_PROJECT_PLAN.md) · [Issue Log](ISSUE_LOG.md)*

*Last Updated: 2026-08-15 · Document Version: 7.5.0*
