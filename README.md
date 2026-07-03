# ZMusic - AI音乐生成平台

## 项目概述

ZMusic是一个基于MVC架构的AI音乐生成平台，集成Suno AI和Muse AI双引擎，提供音乐、歌词、MV时间线的智能生成服务。

## 核心特性

- **双AI引擎支持**: Suno AI (结构化参数) + Muse AI (自然语言命令)
- **智能代理系统**: Unicorn Agent + Hermes Agent + OpenClaw Agent
- **多种生成方法**: FSM编程、网络层组合、Muse风格、Suno风格
- **完整的i18n支持**: 中英文双语界面
- **MVC架构**: 清晰的职责分离，易于维护和扩展
- **实时日志系统**: Log4j风格的分级日志

## 技术栈

### 前端
- React 18
- Vite 5
- Tailwind CSS
- Lucide React Icons

### 后端
- Express 5
- Node.js 18+
- ES Modules

### AI服务
- Suno.cn API (v5.5)
- Muse AI API

## 项目结构

```
zmusic/
├── src/
│   ├── agents/              # AI代理层
│   │   └── unicorn-agent.js # 独角兽代理（FSM + 网络层）
│   ├── config/              # 配置管理
│   │   └── index.js
│   ├── controllers/         # 控制器层
│   │   ├── health.controller.js
│   │   ├── music.controller.js
│   │   ├── lyrics.controller.js
│   │   ├── mv.controller.js
│   │   └── agent.controller.js
│   ├── i18n/                # 国际化
│   │   └── index.js
│   ├── pages/               # 页面组件
│   │   ├── Dashboard.jsx
│   │   ├── MusicPage.jsx
│   │   ├── LyricsPage.jsx
│   │   ├── MVPage.jsx
│   │   └── SettingsPage.jsx
│   ├── routes/              # 路由定义
│   │   └── index.js
│   ├── services/            # 服务层
│   │   ├── suno.service.js
│   │   ├── muse.service.js
│   │   ├── lyrics.service.js
│   │   └── mv.service.js
│   ├── utils/               # 工具函数
│   │   └── logger.js
│   ├── App.jsx              # 主应用组件
│   ├── main.jsx             # 入口文件
│   └── server.js            # 后端服务器
├── .env.example             # 环境变量示例
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填写API密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Suno AI API配置
SUNO_CN_API_KEY=your_suno_api_key_here

# Muse AI API配置
MUSE_AI_API_KEY=your_muse_api_key_here
MUSE_AI_BASE_URL=https://api.muse.ai

# 服务器配置
PORT=5501
NODE_ENV=development
```

### 3. 启动应用

```bash
# 启动完整应用（前端 + 后端）
npm start

# 或分别启动
npm run server    # 后端 API (端口 5501)
npm run dev       # 前端开发服务器 (端口 5500)
```

访问 http://localhost:5500

## API文档

### 健康检查

```
GET /api/health
```

返回系统状态和配置信息。

### 业务分析

```
GET /api/business/analytics
```

返回使用统计数据。

### AI代理状态

```
GET /api/agent/status
```

返回Unicorn Agent配置和能力信息。

### 音乐生成

```
POST /api/music/generate
Content-Type: application/json

{
  "prompt": "一首关于夏天的快乐歌曲",
  "style": "pop",
  "duration": 120
}
```

使用Suno AI生成音乐。

### 代理音乐生成

```
POST /api/music/generate-agent
Content-Type: application/json

{
  "sunoEnabled": true,
  "museEnabled": true,
  "autoGenerateLyrics": true,
  "genre": "pop",
  "theme": "love",
  "style": "modern",
  "mood": "happy",
  "bpm": 120,
  "duration": 180
}
```

使用双AI引擎生成音乐。

### 歌词生成

```
POST /api/lyrics/generate
Content-Type: application/json

{
  "genre": "pop",
  "theme": "love",
  "subject": "我",
  "object": "你"
}
```

生成结构化歌词。

### AI代理歌词生成

```
POST /api/agent/lyrics
Content-Type: application/json

{
  "method": "fsm",  // fsm | network_layer | muse | suno
  "genre": "pop",
  "theme": "love",
  "bpm": 128
}
```

使用AI代理智能生成歌词。

### MV时间线生成

```
POST /api/mv/generate
Content-Type: application/json

{
  "genre": "electronic",
  "duration": 240
}
```

生成MV视频时间线。

### AI代理MV生成

```
POST /api/agent/mv
Content-Type: application/json

{
  "duration": 240,
  "style": "cinematic",
  "colorPalette": "warm_tones"
}
```

使用AI代理生成MV时间线。

## 架构说明

### MVC模式

- **Model**: 服务层（suno.service, muse.service, lyrics.service, mv.service）
- **View**: React页面组件（Dashboard, MusicPage, LyricsPage, MVPage, SettingsPage）
- **Controller**: 控制器层（处理HTTP请求，协调服务调用）

### AI代理系统

**Unicorn Agent** 是核心AI代理，提供四种生成方法：

1. **FSM编程**: 使用有限状态机生成结构化歌词
   - 8个状态：INTRO → VERSE_1 → CHORUS_1 → VERSE_2 → CHORUS_2 → BRIDGE → FINAL_CHORUS → OUTRO
   - 状态转换确保音乐逻辑性

2. **网络层组合**: 4层音频组合
   - Foundation: 基础节拍和节奏
   - Melody: 主旋律元素
   - Expression: 情感和动态元素
   - Effects: 音效和氛围元素

3. **Muse风格**: 自然语言命令
   - 生成描述性中文命令
   - 适合Muse AI的直观方式

4. **Suno风格**: 结构化参数
   - JSON格式的参数对象
   - 适合Suno AI的精确控制

### 日志系统

使用Log4j风格的分级日志：

- TRACE: 最详细的开发日志
- DEBUG: 调试信息
- INFO: 一般运行信息
- WARN: 警告消息
- ERROR: 错误事件
- FATAL: 致命错误

日志格式：`[时间戳] [级别] [模块名] 消息`

## 国际化

支持中英文双语切换：

- 默认语言：中文 (zh)
- 支持语言：中文、英文
- 所有UI文本已100%翻译
- 语言切换即时生效

## 版本控制

- 当前版本：1.0.0
- 语义化版本控制
- Git分支管理
- GitHub自动备份

## 开发指南

### 添加新的AI代理方法

1. 在 `unicorn-agent.js` 中添加新方法
2. 在 `agent.controller.js` 中添加对应的API端点
3. 在路由中注册新端点
4. 更新文档

### 添加新的音乐风格

1. 在对应的服务文件中添加模板（lyrics.service.js 或 mv.service.js）
2. 更新i18n翻译文件
3. 测试新风格

### 调试技巧

```javascript
// 调整日志级别
logger.setLevel(LogLevel.DEBUG);

// 查看代理状态
GET /api/agent/status

// 查看系统健康
GET /api/health
```

## 故障排除

### API密钥未配置

确保在 `.env` 文件中设置了正确的API密钥：

```env
SUNO_CN_API_KEY=sk-...
MUSE_AI_API_KEY=...
```

### 端口冲突

如果端口5500或5501被占用：

```bash
# 查找占用进程
netstat -ano | findstr :5500

# 终止进程
taskkill /PID <进程ID> /F
```

### 依赖问题

```bash
# 清除缓存
npm cache clean --force

# 重新安装
rm -rf node_modules package-lock.json
npm install
```

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

- GitHub: @vcfhuang
- Email: vcfhuang@qq.com

## 致谢

- Suno AI - 音乐生成引擎
- Muse AI - 自然语言音乐生成
- React & Vite - 前端框架
- Express - 后端框架
