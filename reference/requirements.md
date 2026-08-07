# ZMusic Requirements & Architecture

## 1. Core Purpose
AI Music Generation Platform that converts lyrics, themes, and style into actual playable music.

## 2. Hybrid Music Generation Architecture (3-Tier System)

### Tier 1: LLM Composition (Planning Layer)
- **Input**: User prompt / lyrics / style / theme
- **Engine**: LLM (GLM-4o / DeepSeek via API calls)
- **Output**: Structured Music JSON Schema (single source of truth)
- **Purpose**: Convert natural-language intent into a musical "score" that both renderers consume
- **Fallback**: Built-in rule-based composer (deterministic, no API needed)

### Tier 2: Cloud AI Render (Primary Audio Renderer)
- **Input**: Music JSON from Tier 1
- **Engine**: HuggingFace Inference API (MusicGen-medium model)
- **Output**: Real AI-generated audio file (MP3/WAV)
- **Speed**: 30-60 seconds per generation
- **Cost**: Free tier (HF free inference tokens, user-supplied)
- **Fallback**: Auto-skips to Tier 3 if HF token not available or API down

### Tier 3: Tone.js Procedural Render (Instant Fallback)
- **Input**: Same Music JSON from Tier 1
- **Engine**: Tone.js Web Audio API (runs entirely in browser)
- **Output**: Synthesized instrumental music (instant playback, 0 wait)
- **Speed**: Instant (compositional rules synthesized in real-time)
- **Cost**: Free, no API needed, works offline
- **Quality**: Synthesized/procedural, not AI-quality — but guaranteed to work

### Degradation Strategy
```
Tier 1 (LLM) -> Tier 2 (Cloud AI) -> Tier 3 (Tone.js fallback)
                     ↓ fails            ↓ always works
                  30-60s wait         Instant playback
```

### Music JSON Schema (Single Source of Truth)
```json
{
  "key": "C",
  "scale": "minor",
  "tempo": 120,
  "timeSignature": "4/4",
  "duration": 60,
  "style": "pop",
  "theme": "love",
  "sections": [
    {
      "name": "intro",
      "bars": 4,
      "chords": ["Am", "F", "C", "G"],
      "instruments": ["piano", "pad"],
      "mood": "hopeful"
    },
    {
      "name": "verse",
      "bars": 8,
      "chords": ["Am", "F", "C", "G"],
      "instruments": ["piano", "bass", "drums"],
      "mood": "intimate"
    },
    {
      "name": "chorus",
      "bars": 8,
      "chords": ["F", "C", "G", "Am"],
      "instruments": ["piano", "bass", "drums", "strings"],
      "mood": "uplifting"
    }
  ]
}
```

## 3. Audio Engine Files (New, Self-Contained)
- `src/utils/musicComposer.js` — LLM + rule-based composition → Music JSON
- `src/utils/audioEngine.js` — Tone.js renderer (consumes Music JSON → plays audio)
- `src/utils/cloudMusicRenderer.js` — HuggingFace API wrapper (consumes Music JSON → MP3)
- `src/components/MusicPlayer.jsx` — Muse-style player UI

## 4. API Integration
- LLM API: User configures GLM/DeepSeek API key in settings (localStorage)
- HF Inference API: User configures HF token in settings (localStorage)
- No hardcoded keys; all user-supplied for privacy

## 5. Key Constraints
- 16GB RAM, NO GPU — all heavy AI runs via cloud APIs
- GitHub Pages static hosting — backend APIs called from browser
- Must work on both Web (GitHub Pages) and Mobile (Capacitor)
- Only modify MusicPage.jsx; do NOT affect other pages
- Muse.top reference for player UX and generation flow

## 6. Original Requirements (Legacy)
- i need both suno ai and muse ai for this software
- Use openclaw, hermes agent or unicorn agent from anna ai project / zunicornagent
- Auto-generation of "lyrics professional commands" (FSM programming, network layers)
- Pass commands to Suno/Muse for real lyric generation
- Same approach for MV generation
