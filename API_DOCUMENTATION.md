# ZMusic API 文档

## 基础信息

- 基础URL: `http://localhost:5501/api`
- 内容类型: `application/json`
- 字符编码: `UTF-8`

## 端点列表

### 1. 健康检查

**GET** `/api/health`

获取系统健康状态和配置信息。

**响应示例:**
```json
{
  "success": true,
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "port": 5501,
  "apiConfigured": true,
  "museConfigured": true,
  "architecture": "MVC Pattern",
  "layers": ["Model", "View", "Controller", "Service", "Agent"],
  "endpoints": [
    "GET  /api/health",
    "GET  /api/agent/status",
    "POST /api/music/generate",
    "POST /api/music/generate-agent",
    "POST /api/lyrics/generate",
    "POST /api/lyrics/generate-agent",
    "POST /api/mv/generate",
    "POST /api/mv/generate-agent",
    "GET  /api/lyrics/genres",
    "GET  /api/mv/genres"
  ]
}
```

---

### 2. 业务分析

**GET** `/api/business/analytics`

获取系统使用统计数据。

**响应示例:**
```json
{
  "success": true,
  "data": {
    "activeUsers": 1,
    "totalCredits": 50,
    "songsGenerated": 0,
    "lyricsGenerated": 0,
    "mvGenerated": 0
  }
}
```

---

### 3. AI代理状态

**GET** `/api/agent/status`

获取Unicorn Agent配置和能力信息。

**响应示例:**
```json
{
  "success": true,
  "data": {
    "unicorn": {
      "name": "Unicorn Agent",
      "hermes": true,
      "openclaw": true,
      "fsmStates": 8,
      "networkLayers": 4
    }
  }
}
```

---

### 4. 音乐生成（Suno AI）

**POST** `/api/music/generate`

使用Suno AI生成音乐。

**请求体:**
```json
{
  "prompt": "一首关于夏天的快乐歌曲",
  "style": "pop",
  "duration": 120
}
```

**参数说明:**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| prompt | string | 否 | "A happy song" | 音乐描述提示 |
| style | string | 否 | "pop" | 音乐风格 |
| duration | number | 否 | 60 | 时长（秒） |

**响应示例:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "taskId": "task_123456",
    "serialNos": ["123456"],
    "message": "Submitted",
    "status": "submitted",
    "estimatedTime": 60
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "Suno API key not configured. Please set SUNO_CN_API_KEY in .env file."
}
```

---

### 5. 代理音乐生成（双引擎）

**POST** `/api/music/generate-agent`

使用Suno AI和Muse AI双引擎生成音乐。

**请求体:**
```json
{
  "sunoEnabled": true,
  "museEnabled": true,
  "autoGenerateLyrics": true,
  "genre": "pop",
  "theme": "love",
  "style": "modern",
  "mood": "happy",
  "bpm": 120,
  "duration": 180,
  "lyrics": "自定义歌词（可选）",
  "elements": "热带打击乐",
  "subStyle": "浩室"
}
```

**参数说明:**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| sunoEnabled | boolean | 否 | true | 是否启用Suno AI |
| museEnabled | boolean | 否 | false | 是否启用Muse AI |
| autoGenerateLyrics | boolean | 否 | true | 是否自动生成歌词 |
| genre | string | 否 | "pop" | 音乐风格 |
| theme | string | 否 | "love" | 主题 |
| style | string | 否 | "modern" | 编曲风格 |
| mood | string | 否 | "happy" | 情绪 |
| bpm | number | 否 | 120 | 节拍速度 |
| duration | number | 否 | 180 | 时长（秒） |
| lyrics | string | 否 | - | 自定义歌词 |
| elements | string | 否 | "热带打击乐" | 音乐元素 |
| subStyle | string | 否 | "浩室" | 子风格 |

**响应示例:**
```json
{
  "success": true,
  "data": {
    "taskId": "agent_1234567890",
    "providers": {
      "suno": {
        "success": true,
        "taskId": "task_123456",
        "status": "submitted"
      },
      "muse": {
        "success": true,
        "taskId": "muse_123456",
        "status": "generating"
      }
    }
  }
}
```

---

### 6. 歌词生成

**POST** `/api/lyrics/generate`

生成结构化歌词。

**请求体:**
```json
{
  "genre": "pop",
  "theme": "love",
  "subject": "我",
  "object": "你"
}
```

**参数说明:**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| genre | string | 否 | "pop" | 音乐风格 |
| theme | string | 否 | "love" | 主题 |
| subject | string | 否 | "我" | 主语 |
| object | string | 否 | "你" | 宾语 |
| verse | string | 否 | "verse_1" | 段落标识 |

**支持的风格:**
- pop: 流行
- rock: 摇滚
- chinese_traditional: 中国风
- electronic: 电子
- hip_hop: 嘻哈
- ballad: 民谣
- love_song: 情歌

**支持的主题:**
- love: 爱情
- friendship: 友谊
- success: 成功
- dreams: 梦想
- nature: 自然
- life: 生活
- memory: 回忆

**响应示例:**
```json
{
  "success": true,
  "data": {
    "genre": "pop",
    "theme": "love",
    "subject": "我",
    "object": "你",
    "verse": "verse_1",
    "structure": ["verse", "chorus", "verse", "chorus", "bridge", "chorus"],
    "sections": [
      {
        "type": "verse",
        "content": "我走在街头，想着你的笑容..."
      },
      {
        "type": "chorus",
        "content": "哦，我爱你，就像星星爱着夜空..."
      }
    ],
    "fullText": "[verse]\n我走在街头，想着你的笑容...\n\n[chorus]\n哦，我爱你，就像星星爱着夜空...",
    "generatedAt": "2026-07-03T10:30:00.000Z"
  }
}
```

---

### 7. AI代理歌词生成

**POST** `/api/agent/lyrics`

使用AI代理智能生成歌词。

**请求体:**
```json
{
  "method": "fsm",
  "genre": "pop",
  "theme": "love",
  "style": "modern",
  "mood": "happy",
  "bpm": 128
}
```

**参数说明:**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| method | string | 否 | "muse" | 生成方法 |
| genre | string | 否 | "pop" | 音乐风格 |
| theme | string | 否 | "love" | 主题 |
| style | string | 否 | "modern" | 编曲风格 |
| mood | string | 否 | "happy" | 情绪 |
| bpm | number | 否 | 120 | 节拍速度 |

**生成方法:**
- `fsm`: FSM编程（有限状态机）
- `network_layer`: 网络层组合（4层音频）
- `muse`: Muse风格（自然语言命令）
- `suno`: Suno风格（结构化参数）

**响应示例（FSM方法）:**
```json
{
  "success": true,
  "data": {
    "taskId": "lyrics_1234567890",
    "success": true,
    "method": "fsm",
    "command": "[FSM-COMMAND] Genre=pop | Theme=love | Style=modern | Mood=happy | BPM=128 | States=intro->verse_1->chorus_1->verse_2->chorus_2->bridge->final_chorus->outro",
    "execution": {
      "data": "[INTRO]\n轻柔的现代前奏, 营造happy氛围, 128bpm\n\n[VERSE_1]\n主歌开始, 讲述love的故事, 情绪happy..."
    },
    "stats": {
      "states": 8,
      "transitions": 7,
      "bpm": 128
    }
  }
}
```

---

### 8. MV时间线生成

**POST** `/api/mv/generate`

生成MV视频时间线。

**请求体:**
```json
{
  "genre": "electronic",
  "duration": 240
}
```

**参数说明:**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| genre | string | 否 | "pop" | 音乐风格 |
| duration | number | 否 | 180 | MV时长（秒） |

**响应示例:**
```json
{
  "success": true,
  "data": {
    "genre": "electronic",
    "duration": 240,
    "colorPalette": "neon_cyber",
    "totalScenes": 5,
    "timeline": [
      {
        "sceneId": 1,
        "scene": "club",
        "startTime": 0,
        "endTime": 48,
        "duration": 48,
        "effects": ["glitch", "chromatic", "digital_wave"],
        "transition": "fade_in"
      },
      {
        "sceneId": 2,
        "scene": "city_night",
        "startTime": 48,
        "endTime": 96,
        "duration": 48,
        "effects": ["glitch", "chromatic", "digital_wave"],
        "transition": "cut"
      }
    ],
    "effects": ["glitch", "chromatic", "digital_wave"],
    "generatedAt": "2026-07-03T10:30:00.000Z"
  }
}
```

---

### 9. AI代理MV生成

**POST** `/api/agent/mv`

使用AI代理生成MV时间线。

**请求体:**
```json
{
  "duration": 240,
  "style": "cinematic",
  "colorPalette": "warm_tones"
}
```

**参数说明:**
| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| duration | number | 否 | 180 | MV时长（秒） |
| style | string | 否 | "modern" | MV风格 |
| colorPalette | string | 否 | "purple_gradient" | 色调方案 |

**响应示例:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "taskId": "mv_1234567890",
    "timeline": [
      {
        "sceneId": 1,
        "scene": "intro",
        "startTime": 0,
        "endTime": 48,
        "duration": 48,
        "effects": ["fade", "cut", "transition"],
        "colorPalette": "warm_tones"
      }
    ],
    "stats": {
      "scenes": 5,
      "duration": 240,
      "style": "cinematic"
    }
  }
}
```

---

### 10. 获取歌词风格

**GET** `/api/lyrics/genres`

获取支持的歌词风格和主题列表。

**响应示例:**
```json
{
  "success": true,
  "data": {
    "genres": ["pop", "rock", "chinese_traditional", "electronic", "hip_hop", "ballad", "love_song"],
    "themes": ["love", "friendship", "success", "dreams", "nature", "life", "memory"]
  }
}
```

---

### 11. 获取MV风格

**GET** `/api/mv/genres`

获取支持的MV风格列表。

**响应示例:**
```json
{
  "success": true,
  "data": ["pop", "rock", "chinese_traditional", "electronic", "hip_hop", "ballad"]
}
```

---

## 错误处理

所有API端点在发生错误时返回统一格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

**常见错误:**
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: API密钥无效或过期
- `403 Forbidden`: 访问被拒绝
- `404 Not Found`: 端点不存在
- `500 Internal Server Error`: 服务器内部错误

---

## 认证

需要API密钥的端点会在 `.env` 文件中配置：

```env
SUNO_CN_API_KEY=sk-...
MUSE_AI_API_KEY=...
```

---

## 速率限制

当前版本未实施速率限制。建议在生产环境中添加适当的速率限制。

---

## 更新日志

### v1.0.0 (2026-07-03)
- 初始版本发布
- 支持Suno AI和Muse AI双引擎
- 实现Unicorn Agent智能生成系统
- 完整的MVC架构
- 中英文双语支持
