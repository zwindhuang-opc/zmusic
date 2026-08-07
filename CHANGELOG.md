# ZMusic Changelog

## v6.0.0 (2026-08-07)

- V6.0.0 MAJOR: 100% FREE music generation engine - (1) Added FreeMusicController with Edge TTS (free vocals, no API key) reused from zinteligencevideoagent project; (2) Added HuggingFace MusicGen + Bark (Suno open-source) integration for free instrumental/singing; (3) Created backend proxy for Suno.cn API to fix CORS; (4) Added Muse-style AI Thinking Panel showing 5-step composition plan before generation; (5) Multi-engine selector: Free/Auto/Suno.cn/Tone.js; (6) Added lyrics input field + 6 free voice presets (zh/en); (7) ffmpeg-static for audio mixing; (8) edge_tts_helper.py to avoid Windows CLI encoding issues; (9) Comprehensive logging in generation pipeline
- Build #30


## v5.8.1 (2026-08-06)

- Fixed irrelevant lyrics from photo upload: (1) EasyMode now creates Image element from base64 data URL before analysis, (2) Added semantic subject detection layer - detects people, couples, groups via YCbCr skin tone analysis, (3) Semantic scene classification takes priority over color-based classification, (4) Visual context now includes subject type, person count, selfie detection, (5) createVisualBank boosts vocabulary with couple/portrait/group-specific imagery and actions
- Build #27


## v5.7.0 (2026-07-28)

- Added Easy Mode (简洁模式) - 3-step wizard for elderly and non-technical users, UI mode toggle in sidebar and settings, persistent mode preference, accessibility-friendly design with large fonts and touch targets, elderly-friendly UX requirements documented
- Build #25


## v5.6.0 (2026-07-28)

- Added social media BGM generator, prompt engineering assistant, visual style recommendations from image analysis, Xiaohongshu reference integration with platform-specific templates (小红书/抖音/Bilibili), structured prompt template generation with section presets, instrument selection UI, and comprehensive i18n updates
- Build #24

