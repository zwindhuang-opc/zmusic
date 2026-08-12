# ZMusic Further Possible Design & Future Enhancements

> Document Version: V1.0 (2026-08-12)
> Based on ZMusic V7.1.0 architecture

---

## Table of Contents
1. [Suggestion A: AI Style Transfer / Remix Studio](#a-ai-style-transfer--remix-studio)
2. [Suggestion B: Batch Generation Pipeline](#b-batch-generation-pipeline)
3. [Suggestion C: Song Quality Analyzer](#c-song-quality-analyzer)
4. [Suggestion D: Collaborative Songwriting](#d-collaborative-songwriting)
5. [Suggestion E: Music Export & Publishing](#e-music-export--publishing)
6. [Suggestion F: Enhanced Auto-Creative Mode](#f-enhanced-auto-creative-mode)
7. [Suggestion G: Mobile-First PWA Improvements](#g-mobile-first-pwa-improvements)
8. [Suggestion H: Analytics Dashboard](#h-analytics-dashboard)
9. [Suggestion I: Account Management + Song Albums](#i-account-management--song-albums-user-architecture)

---

## I. Account Management + Song Albums (User Architecture)

### 1. Data Model

```
User Account
├── id, email, password_hash, created_at
├── profile (avatar, display_name, language preference)
├── subscription_tier (free/pro/enterprise)
│
├── Song Albums (歌集 / 音乐专辑)
│   ├── id, owner_id, title, description, cover_image
│   ├── tags[], is_public (boolean), share_token
│   └── songs[]
│       ├── id, engine (muse/suno/melo/mv), title, duration
│       ├── lyrics, audio_url, cover_image, metadata_json
│       ├── source_task_id, created_at, engine_task_id
│       ├── favorite (boolean)
│       └── publishing_status (draft/published)
│
└── Credits / Usage
    ├── total_credits, remaining_credits
    └── usage_log[]
```

### 2. Implementation Approach (Phased)

#### Phase 1 (MVP - localStorage based, no backend auth)
- Simple user profile switching in the browser
- Song library stored locally
- Generated songs auto-tagged to the active user profile
- Export/Import library as JSON backup

#### Phase 2 (Backend Auth)
- Node.js backend with JWT authentication
- bcrypt for password hashing
- SQLite / PostgreSQL database for persistence
- Multi-profile support per account

#### Phase 3 (Cloud + Social)
- Cloud sync across devices
- OAuth login (Google / GitHub / WeChat / QQ)
- Public album sharing (shareable links)
- Embed player widget

### 3. Key Benefits
- **Never lose songs**: Unified library across Muse, Suno, Melo, and MV
- **Album organization**: Collections like "Summer 2026 Demo", "Film Score Tracks"
- **Cross-platform favorites**: Favorite songs from any engine in one place
- **Distribution ready**: Central hub for publishing to Douyin, Qishui, etc.
- **Trend tracking**: Know which engine works best for each style

---

## A. AI Style Transfer / Remix Studio

### 1. Overview
Take any generated song and re-create it in a different engine. Builds on the existing "Send to" infrastructure.

### 2. Features
- **Engine-to-Engine Remix**: 
  - Muse song → re-create in Suno / Melo
  - Suno song → re-create in Muse / Melo
  - Melo song → re-create in Muse / Suno
- **Style Variation**: Same lyrics + BPM, different style
- **Structure Remix**: Same style, different song structure
- **A/B Comparison**: Compare original vs remixed versions side-by-side

### 3. Implementation
- Dedicated page `/pages/RemixStudio.jsx`
- Reuses `pendingData` pipeline for cross-page transfer
- Remix buttons added to history items and song libraries

---

## B. Batch Generation Pipeline

### 1. Overview
Upload lyrics/themes in bulk → auto-generate 10+ songs as queue

### 2. Features
- CSV / TXT / JSON upload with lyrics and metadata
- Manual batch input (line-by-line theme entry)
- Queue progress bar with ETA
- Pause/Resume/Cancel batch
- Download all outputs as ZIP

### 3. Use Cases
- Content creators needing 10+ tracks at once
- A/B testing multiple BPM/Style combinations
- Album compilation workflow

---

## C. Song Quality Analyzer

### 1. Overview
Auto-score each generated song (1-100) with structured feedback

### 2. Metrics
- **Structural Score**: Did it follow the requested section structure?
- **Lyrics Match**: Do the sung lyrics match the input?
- **Duration Accuracy**: Is the actual length close to the requested?
- **BPM Consistency**: Beat detection vs requested BPM
- **Style Match**: Audio fingerprint vs reference examples
- **Clarity**: Instrumentation separation, vocal intelligibility

### 3. Implementation
- Scoring runs after each generation completes
- Average score per engine, per style, per user
- "Regenerate if score < N" auto-fail setting

---

## D. Collaborative Songwriting

### 1. Overview
Multiple users edit the same lyrics draft before final generation

### 2. Features
- Real-time collaborative lyrics editor (Yjs / CRDT)
- Comment threads on specific verses
- AI merges contributions
- Version history with diff comparison
- "Accept / Reject change" per edit

---

## E. Music Export & Publishing

### 1. Export Capabilities

#### Audio
- WAV / FLAC / MP3 (320kbps, 256kbps, 192kbps)
- Stems export (where API supports):
  - Vocals only
  - Instrumental only
  - Drums only
  - Bass only

#### Metadata
- **ISRC**: Auto-generate for copyright
- **LRC** synced lyrics file
- **Cover art** (embed in MP3 ID3 tags)
- **Waveform image** (for video previews)

#### Video / MV
- H.264 MP4 (1080p / 720p / 4K)
- Vertical format (1080×1920) for short-video platforms
- Auto-subtitle burn-in
- Add ZMusic watermark

### 2. Direct Publishing Platforms

#### 抖音 (Douyin) - Priority 1
```
Account: ZMUSIC
ID: z.music.z
Password: vgbzg92x
```
- **Upload endpoints**: Official Douyin Open Platform API
  - `POST /oauth2/access_token` (auth)
  - `POST /video/create` (create video)
  - `POST /video/upload` (upload file)
  - `POST /video/publish` (publish)
- **Music publishing**: Douyin Music Service API
  - Register as musician profile
  - Attach tracks to video as background music
- **Schedule posting**: Upload at optimal engagement times
- **Title / Caption**: Auto-generate from song title + theme + hashtags

#### 汽水音乐 (Qishui Music) - Priority 2
- Tencent short-video music platform
- Uses Tencent Music Entertainment (TME) Open API
- Upload audio files → publish to streaming
- Cross-sync to Douyin from Qishui

#### Other Platforms (Future)
- YouTube Music / YouTube Shorts
- Spotify for Artists
- Apple Music / iTunes
- NetEase Cloud Music
- Bilibili

### 3. Implementation Reference (zshortmovies)
See sibling project `zshortmovies` for:
- Douyin OAuth flow implementation
- Video chunked upload protocol
- Task scheduling queue
- Publishing retry with exponential backoff
- Status polling after upload

### 4. Publishing Workflow UI
1. User clicks "发布" (Publish) on any song/MV
2. Wizard with checkboxes: ☑ Douyin  ☑ 汽水音乐  ☑ Download ZIP
3. Enter caption / hashtags (auto-suggested based on style/theme)
4. Preview thumbnail / cover
5. One-click "发布全部"
6. Progress + post-result screen with links

---

## F. Enhanced Auto-Creative Mode

### 1. Creative Strategy Presets

Instead of just a 60-second countdown, users pick a **creation strategy**:

| Strategy | Description | Ideal For |
|----------|-------------|-----------|
| `experimental` | Unusual chords, odd meters, genre fusions | Artistic exploration |
| `radio_friendly` | Strict verse-chorus-verse, 3-4 min, strong hooks | Commercial release |
| `film_score` | Cinematic, orchestral focus, longer builds | Film / game soundtracks |
| `lofi_hiphop` | 70-90 BPM, chill beats, jazzy samples | Study / background music |
| `pop_punk` | Fast 140-180 BPM, power chords, simple lyrics | Youth / upbeat |
| `ballad_emotional` | Slow 60-80 BPM, piano/strings focus, storytelling | Love / emotional songs |
| `chinese_style` | 五声音阶, 古风配器, 意象词汇 | 国风 / 古典流行 |
| `edm_banger` | Build-drop structure, 120-140 BPM heavy beat | Club / festival |
| `kids_song` | Simple melody, easy lyrics, repetition | Children / nursery |
| `viral_short` | 15-30 sec version, hook in first 3 seconds | 抖音 / short-video |

### 2. Strategy Preset Parameters
Each strategy overrides:
- Default BPM range
- Default duration (minutes)
- Structure template (verse/chorus count, section order)
- Melodic complexity (1-10)
- Lyric complexity (1-10)
- Recommended instrument set
- Style suggestion weights

### 3. User-Presets
- Save any successful AUTO generation as a reusable strategy
- "Clone from successful song" option
- Community strategy marketplace (future)

### 4. Implementation
- Store presets in `src/data/creativePresets.js`
- Strategy selector dropdown in AUTO trigger panel
- Each strategy also gets its own theme color

---

## G. Mobile-First PWA Improvements

### 1. Offline Mode
- Service Worker caches library pages and generated audio
- Browse library without internet
- Queue offline generation requests (sync when online)

### 2. Background Audio Player
- Persistent bottom audio bar across navigation
- Playlist support (play through album)
- Lock-screen playback controls (Media Session API)

### 3. Notifications
- AUTO generation completes → push notification
- Song finishes publishing to Douyin → push notification
- Reminder for AUTO credit reset schedule

### 4. App Shortcuts (Android)
- Long-press app icon → quick actions:
  - New Song
  - Open Library
  - Start AUTO Mode
  - Upload to Douyin

---

## H. Analytics Dashboard

### 1. Metrics

#### Engine Performance
- **Success Rate per Engine**: Muse vs Suno vs Melo
- **Avg Gen Time**: Per engine, per style
- **Failure Breakdown**: API errors vs credit issues vs timeouts
- **Avg Quality Score**: Per engine, per genre

#### User Habits
- Most successful styles, themes, BPM ranges
- Most productive creation hours
- Average songs per session
- AUTO trigger vs Manual trigger ratio

#### Credit Usage
- Daily / Weekly / Monthly credit burn rate
- Projection: remaining credits → days until empty
- Efficiency: successful songs per credit

#### Publishing
- Posting frequency to each platform
- Most shared songs
- Engagement rate per platform (if API returns)

### 2. Visualizations
- Line charts: success rate over time
- Bar charts: engine comparison
- Pie charts: style distribution
- Heatmap: creation hours per week

---

## Appendix: Implementation Priority Ranking

| Priority | Feature | Why |
|----------|---------|-----|
| **1** | Account Management (Phase 1) + Song Library | Immediate user value, prevents data loss |
| **2** | Remix Studio (Suggestion A) | Reuses existing infrastructure |
| **3** | Publishing (Suggestion E: Douyin + 汽水音乐) | Major distribution, monetization link |
| **4** | Enhanced AUTO Mode (Suggestion F) | Existing AUTO code easy to extend |
| **5** | Song Quality Analyzer (C) | Validation layer for all generations |
| **6** | PWA Offline + BG Player (G) | Mobile UX improvement |
| **7** | Batch Generation (B) | Power user feature |
| **8** | Analytics Dashboard (H) | Useful but not blocking |
| **9** | Collaboration (D) | Requires backend, higher complexity |

---

## I. Account Management + Song Books / Song Albums (详细实现规范)

### 1. 功能概述
为ZMusic用户系统提供完整的账号管理和歌曲存储能力。用户登录后可以：
- 保存和管理从Muse、Suno、Melo、MV各平台生成的所有歌曲
- 创建"歌集/专辑"来组织歌曲
- 存储歌曲封面图片、歌词、元数据
- 跨设备同步（Phase 2+）

### 2. Phase 1 实现方案 (MVP - 基于 localStorage)

#### 2.1 前端结构
```
src/
├── contexts/
│   └── AuthContext.jsx          # 认证上下文
├── pages/
│   ├── LoginPage.jsx            # 登录/注册页面
│   ├── SongLibrary.jsx          # 歌曲库/歌集页面
│   └── AlbumDetail.jsx          # 专辑详情页
├── services/
│   └── auth.service.js          # 认证服务
└── stores/
    └── songLibraryStore.jsx     # 歌曲库状态管理
```

#### 2.2 数据模型 (localStorage schema)
```javascript
// users table (localStorage: 'zmusic_users')
{
  users: [
    {
      id: 'uuid',
      username: 'string',
      email: 'string',
      password_hash: 'sha256',  // simple hash for MVP
      display_name: 'string',
      avatar_color: 'string',   // gradient color index
      language: 'zh' | 'en',
      created_at: 'ISO date',
      last_login: 'ISO date',
      preferences: {
        theme: 'dark',
        default_engine: 'muse' | 'suno' | 'melo',
        auto_save: true,
      }
    }
  ],
  activeUserId: 'uuid | null'
}

// song library (localStorage: 'zmusic_songs_{userId}')
{
  albums: [
    {
      id: 'uuid',
      owner_id: 'uuid',
      title: 'string',
      description: 'string',
      cover_color: 'string',
      cover_emoji: 'string',
      tags: ['string[]'],
      is_public: false,
      created_at: 'ISO date',
      updated_at: 'ISO date',
      song_ids: ['uuid[]']
    }
  ],
  songs: [
    {
      id: 'uuid',
      owner_id: 'uuid',
      engine: 'muse' | 'suno' | 'melo' | 'mv-muse' | 'mv-suno' | 'mv-melo',
      engine_task_id: 'string',
      title: 'string',
      lyrics: 'string',
      style: 'string',
      theme: 'string',
      bpm: 'number',
      duration: 'number',
      language: 'zh' | 'en' | 'mix',
      audio_url: 'string',      // blob URL or server path
      cover_data: 'string',     // base64 image
      metadata: {
        lyrics_text: 'string',
        full_command: 'string',
        structure: 'string',
        instruments: ['string[]'],
      },
      favorite: false,
      play_count: 0,
      created_at: 'ISO date',
      publishing_status: 'draft' | 'published',
      publishing_result: {
        douyin_url: 'string | null',
        qishui_url: 'string | null',
      }
    }
  ]
}
```

#### 2.3 API 接口设计 (Phase 2 后端用)
```
POST   /api/auth/register         { username, email, password }
POST   /api/auth/login            { email, password }
POST   /api/auth/logout
GET    /api/auth/me               → 当前用户信息
PUT    /api/auth/profile           → 更新用户资料

GET    /api/albums                → 获取所有歌集
POST   /api/albums                → 创建新歌集
PUT    /api/albums/:id            → 更新歌集信息
DELETE /api/albums/:id            → 删除歌集
POST   /api/albums/:id/songs      → 添加歌曲到歌集
DELETE /api/albums/:id/songs/:sid → 从歌集移除歌曲

GET    /api/songs                 → 获取所有歌曲（支持分页和过滤）
POST   /api/songs                 → 保存新歌曲
PUT    /api/songs/:id             → 更新歌曲信息
DELETE /api/songs/:id             → 删除歌曲
POST   /api/songs/:id/favorite    → 收藏/取消收藏

GET    /api/songs?engine=muse     → 按引擎过滤
GET    /api/songs?favorite=true   → 只显示收藏
```

#### 2.4 UI 组件设计
```
┌─────────────────────────────────────────────────────────────┐
│  🎵 ZMusic 歌曲库                            [+ 新建歌集]    │
├─────────────────────────────────────────────────────────────┤
│  全部  │  Muse  │  Suno  │  Melo  │  MV  │  收藏  │  专辑   │
├─────────────────────────────────────────────────────────────┤
│  📁 我的歌集                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ 🔥 热门     │  │ 🌙 夜间     │  │ 🎬 电影     │            │
│  │ 12 首歌曲   │  │ 8 首歌曲    │  │ 5 首歌曲    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
├─────────────────────────────────────────────────────────────┤
│  🎵 最近生成                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [封面] Title - Artist    Muse AI  3:45  ⭐  🎵  ▶    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [封面] Title - Artist    Suno AI  4:12  ⭐  🎵  ▶    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### 2.5 关键交互流程
1. **首次登录**: 用户打开应用 → 弹出登录框 → 注册/登录 → 进入主界面
2. **自动保存**: 每次生成歌曲完成后 → 自动保存到当前用户的歌曲库
3. **创建歌集**: 用户点击"新建歌集" → 输入名称/描述 → 选择封面颜色/emoji → 保存
4. **添加歌曲**: 在歌曲库中 → 点击歌曲的"添加到歌集" → 选择目标歌集
5. **导出**: 在歌曲详情页 → 点击"导出" → 选择格式 → 下载

### 3. Phase 2 后端实现 (当需要时)
- Node.js + Express + SQLite/PostgreSQL
- JWT 认证 (Access Token + Refresh Token)
- bcrypt 密码哈希
- 歌曲文件存储 (本地文件系统或对象存储)
- 歌曲封面自动生成 (canvas 或服务端合成)
- API 限流和用量统计

### 4. 安全考虑
- Phase 1: 密码在 localStorage 中以 SHA-256 存储
- Phase 2: bcrypt + salt，密码永不明文存储
- 所有用户数据按 userId 隔离
- API 端点强制 JWT 认证
- 敏感操作需要二次验证

### 5. 与现有系统的集成
- **生成完成回调**: 在 MusePage/SunoPage/MeloPage 的生成完成回调中自动保存到歌曲库
- **历史记录迁移**: 将现有 localStorage 中的历史记录迁移到用户歌曲库
- **发布集成**: PublishStudio 可以直接从歌曲库选择歌曲发布
- **Remix 集成**: RemixStudio 可以直接从歌曲库选择歌曲进行重混
