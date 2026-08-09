# ZMusic Reference Links

## AI Music Generation Platforms

### Suno AI
- https://suno.mxdraw.cn/?from=Xbing&msclkid=6c5ff1ababce1e9bec449bee6eea83f2
- https://suno.com (Official)

### Muse AI

https://muse.top/
- https://mp.weixin.qq.com/s/ikX5JeNCvhE9vxAijFDUCQ?scene=1
- https://weixin.qq.com/sph/Asct4CIXJM

### MELO AI
https://h.51melo.com/?from=bing_ad&utm_source=bing&utm_medium=cpc&msclkid=64cea330d71e1b17f59bc948cffaedf1


### Tencent Music
- https://y.tencentmusic.com/#/home

### SenseAudio
- https://www.senseaudio.cn/

## Social Media & Content Creation References

### Xiaohongshu (Little Red Book) - AI Music Video Reference
- https://www.xiaohongshu.com/explore/6a604deb000000000503b8a7?app_platform=ios&app_version=9.39&share_from_user_hidden=true&xsec_source=app_share&type=video&xsec_token=CBmWn0wwM-DmaKjK9QS-L03ryft6qWOimGUgmDmbUWEUE=&author_share=1&xhsshare=WeixinSession&shareRedId=OEcyRDNJNDw2NzUyOTgwNjY1OTc2OTY5&apptime=1785117846&share_id=5be3c157bc784e6cbba762d77e1404b3&xstag=1&code=2UJcaLU4eki

## Key AI Music Trends & Improvement Ideas for ZMusic

Based on analysis of current AI music generation trends and Xiaohongshu content creation patterns:

### 1. Structured Prompt Templates (High Priority)
- Add pre-built style templates for common use cases:
  - **Xiaohongshu Vlog BGM**: Lo-fi hip hop, acoustic guitar, warm piano, 70-84 BPM
  - **Commercial Advertisement**: Upbeat synth, clean percussion, 120 BPM
  - **Emotional Storytelling**: Piano + strings, 68-80 BPM, sad/nostalgic mood
  - **Dance/Party**: EDM synth, strong bass, 128 BPM
- Include section tags: [Verse], [Chorus], [Bridge], [Intro], [Outro]
- FSM-based trigger templates: "If chorus, add reverb and increase tempo by 5 BPM"

### 2. Visual-to-Music Style Matching (Medium Priority)
- Enhance visionAnalyzer.js to recommend music styles based on uploaded images:
  - Dark/cool colors → Melancholic, Electronic, Lo-fi
  - Bright/warm colors → Happy, Acoustic, Pop
  - Nature/green → Folk, Ambient, Acoustic
  - Urban/neon → Synthwave, Electronic, Phonk

### 3. Prompt Engineering Assistant (Medium Priority)
- Add interactive prompt builder:
  - Style selector (dropdown with genre, mood, BPM)
  - Instrument checklist
  - Section structure visualizer
  - "Generate Professional Command" button

### 4. Social Media BGM Generator (Low Priority)
- Dedicated mode for creating BGM for social media:
  - Platform-specific templates (Xiaohongshu, Douyin/TikTok, Bilibili)
  - Duration presets (15s, 30s, 60s)
  - Auto-loop detection for background music
  - Volume normalization for voiceover mixing

### 5. Commercial Music Production (Low Priority)
- Add licensing-aware generation:
  - Commercial-use style presets
  - Royalty-free instrument combinations
  - Auto-generation of metadata for licensing

## Technical References

### Current Best Practices (2026)
- **Prompt Structure**: Style + Instruments + Emotion + BPM + Section Tags
- **Generation Flow**: Generate section by section (chorus first, then extend)
- **Refinement**: Use inpainting/stem separation for post-processing
- **Format**: WAV 16-bit PCM, 44.1kHz for professional quality

### ZMusic Implementation References
- `src/utils/dynamicLyricsEngine.js` - Dynamic lyrics generation with FSM
- `src/utils/visionAnalyzer.js` - Image analysis for style matching
- `src/services/suno.service.js` - Suno AI integration
- `src/services/muse.service.js` - Muse AI integration
- `src/config/musicStyles.js` - Music style configurations
- `src/config/lyricsStyles.js` - Lyrics style configurations

## UX Requirements - Elderly & Non-Technical Users

### Key Requirement
The system MUST be usable by elderly users and people with NO prior computer or music knowledge.

### Design Principles
1. **Dual Mode System**: 
   - **简洁模式 (Easy Mode)**: 3-step wizard with emoji icons, large fonts (16px+), big touch targets (48px+), auto-defaults for all technical parameters
   - **专业模式 (Expert Mode)**: Full-featured interface for advanced users

2. **Easy Mode Features**:
   - Step 1: Choose type (写歌词 / 做BGM / 看图写歌) with large icon cards
   - Step 2: Pick mood via emoji selector (12 moods) or upload picture
   - Step 3: One big "一键生成" button → results with copy/share
   - All technical params (method, BPM, instruments, sections) auto-selected

3. **UI Requirements for Easy Mode**:
   - Minimum font size: 16px for body, 18px+ for headings
   - Minimum touch target: 48x48px
   - High contrast colors (4.5:1 minimum)
   - Chinese-first language with English toggle
   - No technical jargon (FSM, BPM, section presets hidden)
   - Clear visual feedback on all actions
   - Error messages in simple, non-technical language

4. **Accessibility**:
   - Screen reader support (aria-labels)
   - Keyboard navigation for all interactive elements
   - Visual focus indicators (not just outline)
   - Motion reduction support