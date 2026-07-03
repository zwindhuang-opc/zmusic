# ZMusic - Human-Like Music Speech Commands

## Overview

This project generates professional music commands using programming concepts translated into music language, based on the design.md specifications:

1. **FSM (Finite State Machine)** - State transitions for music structure
2. **Network Layers** - OSI-style layered music composition
3. **Muse Style** - Natural descriptive language
4. **Suno Style** - Structured parameter-based commands

---

## 1. FSM-Based Music Commands

### State Machine Approach

The FSM generator treats music as a series of state transitions with triggers and actions.

**Example FSM Command Generated:**

```
STATE intro:
  IF time_reached == 8 -> TRANSITION TO verse_1
  ACTIONS: THEN instrument(piano+voice) && THEN volume(0.7)

STATE verse_1:
  IF time_reached == 38 -> TRANSITION TO pre_chorus
  ACTIONS: THEN full_band && THEN max_volume && THEN compression
  CONDITION: AND (energy_high && emotion_peak)

STATE pre_chorus:
  IF chord_detected == Am -> TRANSITION TO chorus
  ACTIONS: THEN add_drums && THEN build_up
  CONDITION: OR (tension_build || anticipation)

STATE chorus:
  IF time_reached == 60 -> TRANSITION TO verse_2
  ACTIONS: THEN full_power && THEN highlight && THEN effects_on
  AND_GATE: (melody_active && rhythm_stable)

STATE verse_2:
  IF time_reached == 90 -> TRANSITION TO bridge
  ACTIONS: THEN reduce_intensity && THEN focus_vocals

STATE bridge:
  IF time_reached == 110 -> TRANSITION TO chorus_repeat
  ACTIONS: THEN change_key && THEN emotional_peak

STATE chorus_repeat:
  IF time_reached == 130 -> TRANSITION TO outro
  ACTIONS: THEN max_energy && THEN final_hook

STATE outro:
  IF time_reached == 150 -> TRANSITION TO finished
  ACTIONS: THEN fade_out && THEN end_sequence
```

**Generated Suno AI Prompt:**
```
创作一首pop曲目，融入modern标志性风格——将精致、感性与催眠般的氛围与现代制作完美融合。

采用流畅的中速律动（约128 BPM），搭配温暖、律动的贝斯线、清爽的吉他连复段，以及丰盈、氛围感的铺底音色。

加入微妙的热带打击乐和带有混响与回响效果的人声切片节奏层。

融入标志性人声质感：耳语般的低语、魅惑的女声和声，以及带有回响的抒情片段。

主题:love，情绪:romantic，风格:浩室
```

---

## 2. Network Layer-Based Music Commands

### OSI-Style Layered Approach

Music is built from bottom layer to top layer, like network packet encapsulation.

**Layer Structure:**

```
Layer 1 - Foundation (Physical):
  Protocol: RHYTHM_FOUNDATION
  Data: {
    tempo: 128 BPM,
    key_signature: C Major,
    time_signature: 4/4,
    rhythm_pattern: [kick, snare, hi_hat]
  }
  -> Encapsulate to Layer 2

Layer 2 - Melody (Data Link):
  Protocol: MELODY_CONTENT
  Data: {
    melody_sequence: [C-E-G-C],
    scale: major,
    harmony: [C-Am-F-G],
    contour: ascending
  }
  -> Encapsulate to Layer 3

Layer 3 - Expression (Network):
  Protocol: DYNAMIC_EXPRESSION
  Data: {
    dynamics: [soft->loud->soft],
    articulation: legato,
    phrasing: 8-bar phrases,
    breathing_points: [bar 4, bar 8]
  }
  -> Encapsulate to Layer 4

Layer 4 - Effects (Transport):
  Protocol: AUDIO_EFFECTS
  Data: {
    reverb: 0.3,
    delay: 0.2,
    compression: medium,
    EQ: bass_boost
  }
  -> Encapsulate to Layer 5

Layer 5 - Mixing (Session):
  Protocol: BALANCE_MIXING
  Data: {
    instrument_balance: {
      drums: 0.8,
      bass: 0.7,
      melody: 0.9,
      vocals: 1.0
    },
    panning: { left: [guitar], right: [synth] },
    depth: { foreground: [vocals], background: [pads] }
  }
  -> Encapsulate to Layer 6

Layer 6 - Style (Presentation):
  Protocol: GENRE_STYLE
  Data: {
    genre: electronic,
    era: 2020s,
    production_style: modern,
    characteristics: [synthesizer_heavy, digital_production]
  }
  -> Encapsulate to Layer 7

Layer 7 - Emotion (Application):
  Protocol: EMOTIONAL_IMPACT
  Data: {
    primary_emotion: energetic,
    intensity: high,
    storytelling: summer_energy,
    climax_point: chorus
  }
```

**Generated Muse AI Command:**
```
Build the song starting from Layer 1 (Foundation),
add Layer 2 (Melody) on top, then Layer 3 (Expression) for vocals,
finally Layer 4 (Effect) for production polish.

Layer Elements:
- Foundation: drums, bass, rhythm (Basic rhythm and beat structure)
- Melody: melody, harmony, chords (Melodic content and harmonic progression)
- Expression: vocals, lyrics, expression (Human expression and story telling)
- Effect: effects, ambience, production (Audio effects and production polish)

Parameters:
  Genre: electronic
  Style: dance
  Complexity: high
```

---

## 3. API Endpoints

### Agent-Based Generation

**Endpoint:** `POST /api/lyrics/generate-agent`

**Request Body:**
```json
{
  "genre": "pop",
  "theme": "love",
  "style": "modern",
  "mood": "romantic",
  "bpm": 128,
  "method": "fsm",          // Options: "fsm", "network_layer", "muse", "suno"
  "provider": "suno_ai",    // Options: "suno_ai", "muse_ai", "both"
  "elements": "electronic elements",
  "subStyle": "house"
}
```

**Response:**
```json
{
  "success": true,
  "command": {
    "type": "FSM_STATE_MACHINE",
    "transitions": [...],
    "actions": [...],
    "conditions": [...]
  },
  "execution": {
    "success": true,
    "data": {
      "sunoPrompt": "...",
      "musePrompt": "...",
      "humanReadableCommand": "..."
    }
  }
}
```

---

## 4. Testing Results

All tests passed successfully:

- Health Check: PASS
- FSM Lyrics Generation: PASS
- Network Layer Lyrics Generation: PASS
- Agent Status: PASS
- Music Generation: PASS

---

## 5. Integration with Suno AI and Muse AI

### Suno AI Integration

The system generates structured prompts that Suno AI can understand:

```
创作一首pop曲目，融入modern标志性风格...
采用流畅的中速律动（约128 BPM）...
加入微妙的热带打击乐...
```

### Muse AI Integration

The system generates descriptive commands for Muse AI:

```
Build the song starting from Layer 1 (Foundation)...
Add Layer 2 (Melody) on top...
Layer 3 (Expression) for vocals...
```

---

## 6. Professional Command Examples

### FSM Example (State Machine):

```
IF time == 38s THEN full_band && max_volume && compression
IF chord == Am THEN transition_to_chorus && add_drums && build_up
IF energy_high && emotion_peak THEN highlight_section
```

### Network Layer Example (OSI Model):

```
LAYER_1_FOUNDATION -> LAYER_2_MELODY -> LAYER_3_EXPRESSION -> LAYER_4_EFFECTS
Protocol: RHYTHM_FOUNDATION -> MELODY_CONTENT -> DYNAMIC_EXPRESSION -> AUDIO_EFFECTS
```

### Assembly/Circuit Language Style:

```
AND_GATE: (melody_active && rhythm_stable)
OR_GATE: (tension_build || anticipation)
NOR_GATE: !(pause || silence)
CASE: genre_selector -> pop_style_config
GOTO: transition_to_chorus
```

---

## 7. Real Server Output

**Server Status:**
```
ZMusic AI Platform v1.0.0
Unicorn Agent (Hermes + OpenClaw)
Real Suno.cn Integration

Running at: http://localhost:5500

Features:
- FSM Programming - State machine transitions for music structure
- Network Layers - Layered music composition (4-7 layers)
- Muse Style - Natural language descriptive commands
- Suno Style - Structured parameter-based commands

Providers:
- Suno AI - https://mcp.suno.cn
- Muse AI - https://muse.ai/api
```

---

## 8. How It Works

1. **User Input:** Genre, theme, mood, BPM, method (FSM/Network/Muse/Suno)
2. **Agent Processing:** Unicorn Agent routes to Hermes (planning) + OpenClaw (execution)
3. **Command Generation:** FSM or Network Layer generator creates professional commands
4. **Translation:** Commands are translated to human-like music speech
5. **API Integration:** Commands are passed to Suno AI or Muse AI for actual generation

---

## Conclusion

The ZMusic platform successfully transforms programming concepts into professional music commands:

- **FSM:** If-Then logic becomes musical structure transitions
- **Network Layers:** OSI model becomes layered music composition
- **Assembly/Circuit:** Gates and conditions become musical triggers
- **Human-Like Output:** Professional music speech for both Suno and Muse AI

This implementation fulfills the design.md requirement for "human-like-music-speech-commands" that can be passed to Suno AI or Muse AI for lyrics, music, or MV generation.