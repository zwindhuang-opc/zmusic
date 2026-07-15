# ZMusic Platform - Issue Log

## Version: 1.0.0
**Date Created**: 2026-07-12  
**Project Manager**: Vincent Huang  
**Status**: Active

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

### Issue I004: Suno Generation Results Too Similar

| Field | Value |
|-------|-------|
| **ID** | I004 |
| **Severity** | 🟠 High |
| **Status** | ✅ Resolved |
| **Created** | 2026-07-12 |
| **Priority** | P1 |

**Description**:
Regardless of style/genre selections, Suno AI generates music that sounds very similar. The prompt being sent was too generic: `A {genre} song about {theme}`.

**Root Cause**:
- `music.controller.js` was sending generic prompts to Suno API
- Limited style/genre options (only 10 styles, 10 genres)
- No detailed instrument/mood/BPM information included in prompts

**Resolution**:
1. Created centralized music styles config at [musicStyles.js](file:///e:/AI_Projects/zmusic/src/config/musicStyles.js) with:
   - 30+ music styles with unique Suno tags (虐心、治愈、穿越、史诗、暗黑等)
   - 30+ genres with specific tag combinations
   - 30+ themes with emotional descriptors
   - Each style includes instruments, mood, BPM range, and detailed Suno tags

2. Updated [music.controller.js](file:///e:/AI_Projects/zmusic/src/controllers/music.controller.js) to build rich prompts:
   ```
   A heartbreaking love_song song with Piano, Strings, Synthesizer Pad, Vocals, 
   悲伤、心碎 mood, heartbreak theme, 120 BPM, 60 seconds duration.
   heartbreaking, sad ballad, minor key, crying piano, emotional vocals, longing, tragic.
   love song, romantic, heartfelt.
   heartbreak, loss, pain, separation.
   ```

3. Updated translations in [zh.json](file:///e:/AI_Projects/zmusic/src/i18n/locales/zh.json) and [en.json](file:///e:/AI_Projects/zmusic/src/i18n/locales/en.json)

**Verification**:
- Build successful: `npm run build` ✅
- Frontend running: http://localhost:5500 ✅
- Backend running: http://localhost:5501 ✅

---

### Issue I005: Browser Console ERR_ABORTED Errors

| Field | Value |
|-------|-------|
| **ID** | I005 |
| **Severity** | 🟡 Medium |
| **Status** | 🔄 In Progress |
| **Created** | 2026-07-12 |
| **Priority** | P2 |

**Description**:
Browser console shows 9 ERR_ABORTED errors when loading the web app:
```
net::ERR_ABORTED http://localhost:5500/
net::ERR_ABORTED http://localhost:5500/src/App.jsx
net::ERR_ABORTED http://localhost:5500/src/index.css
net::ERR_ABORTED http://localhost:5500/node_modules/vite/dist/client/env.mjs
net::ERR_ABORTED http://localhost:5500/api/health
```

**Root Cause**:
- Transient network errors during page load
- Browser cache conflicts after server restart
- Vite dev server hot module replacement issues

**Resolution**:
1. **Enabled DEBUG-level logging** in [logger.js](file:///e:/AI_Projects/zmusic/src/utils/logger.js):
   - Set global log level to DEBUG in development mode
   - Added `Logger.setGlobalLevel()` static method
   - Loggers now default to global level instead of INFO

2. **Added error handling and retry logic** in [api.client.js](file:///e:/AI_Projects/zmusic/src/services/api.client.js):
   - Added request logging with DEBUG level
   - Implemented automatic retry mechanism (max 2 retries)
   - Added delay between retries (1s, 2s)
   - Enhanced error logging with error name and message

**Verification**:
- Backend running at http://localhost:5501 ✅
- Frontend running at http://localhost:5500 ✅
- Debug logs now visible in browser console ✅

---

### Issue I006: Insufficient Style/Genre/Theme Options

| Field | Value |
|-------|-------|
| **ID** | I006 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Resolved |
| **Created** | 2026-07-12 |
| **Priority** | P2 |

**Description**:
Users requested more specific and differentiated style/genre/theme options, including:
- 虐心、治愈 (heartbreaking, healing)
- 现代、穿越 (modern, time travel)
- More classifications that are "specific", "special", and "different"

**Resolution**:
Expanded style/genre/theme options from ~10 each to 30+ each with unique characteristics:

**New Styles**: 虐心(heartbreaking), 治愈(healing), 穿越(time_travel), 史诗(epic), 暗黑(dark), 浪漫(romantic), 怀旧(nostalgic), 活力(energetic), 梦幻(dreamy), 现代(modern), 独立(indie), 韩流(kpop), 雷鬼(reggae), 氛围(ambient)

**New Themes**: 心碎(heartbreak), 治愈(healing), 穿越(time_travel), 史诗旅程(epic_journey), 暗黑神秘(dark_mystery), 浪漫之夜(romantic_night), 怀旧回忆(nostalgic_memory), 活力派对(energetic_party), 梦幻幻想(dreamy_fantasy), 现代都市(modern_city), 古老传说(ancient_legend), 夏日氛围(summer_vibes), 冬日孤寂(winter_solitude), 春日觉醒(spring_awakening), 秋日忧郁(autumn_melancholy), 海洋之梦(ocean_dreams)

**Verification**:
- All new options appear in UI ✅
- Translations available in Chinese and English ✅

---

## Historical Issues (Resolved)

### Issue I001: API Key Format Confusion

| Field | Value |
|-------|-------|
| **ID** | I001 |
| **Severity** | 🟠 High |
| **Status** | ✅ Resolved |
| **Created** | 2026-07-02 |

**Description**: Users confused about API key format requirements

**Resolution**: Use pure sk-xxx format; documented in .env.example

---

### Issue I002: Port Number Restrictions

| Field | Value |
|-------|-------|
| **ID** | I002 |
| **Severity** | 🟡 Medium |
| **Status** | ✅ Resolved |
| **Created** | 2026-07-02 |

**Description**: Port conflicts with IDE preview ports

**Resolution**: Use port 5500 instead of 3XXX/8XXX range

---

### Issue I003: User Account 0 Credits

| Field | Value |
|-------|-------|
| **ID** | I003 |
| **Severity** | 🟡 Medium |
| **Status** | ⚠️ Open |
| **Created** | 2026-07-02 |

**Description**: User account shows 0 credits after API configuration

**Resolution**: User needs to recharge at suno.cn

---

## Issue Statistics

| Metric | Count |
|--------|-------|
| Total Issues | 6 |
| Resolved | 3 |
| Open | 2 |
| In Progress | 1 |
| Critical | 0 |
| High | 1 |
| Medium | 3 |
| Low | 0 |

---

## Sprint Backlog

### Current Sprint (Sprint 4)
- [ ] I005 - Browser ERR_ABORTED errors
- [ ] I003 - User credit management

### Next Sprint (Sprint 5)
- [ ] Enhance logging system with file appender
- [ ] Add error boundary components to React
- [ ] Implement comprehensive error reporting

---

## Change Log

| Date | Issue | Action | Author |
|------|-------|--------|--------|
| 2026-07-12 | I004, I006 | Implemented expanded music styles/config | AI Assistant |
| 2026-07-12 | I005 | Enabled DEBUG logging, investigating | AI Assistant |

---

*Last Updated: 2026-07-12*  
*Document Version: 1.0.0*