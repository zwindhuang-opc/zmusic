/**
 * AudioEngine — Tone.js-based composition playback and offline rendering.
 *
 * This module provides real-time playback of generated compositions via the
 * Tone.js framework, as well as offline rendering to WAV format for export
 * and MV video composition. It manages synthesizer instruments (piano, pad,
 * bass, strings, drums, hihat) and schedules note events on the Tone.js
 * Transport timeline.
 *
 * @module utils/audioEngine
 */

import * as Tone from 'tone';

let initialized = false;
let transport = null;
let masterGain = null;
let masterReverb = null;
let masterDelay = null;
let masterCompressor = null;
let scheduledEvents = [];
let activeInstruments = {};
let sfPlayer = null;
let sfPlayerReady = false;
let sfPlayerInitPromise = null;

const NOTE_MAP = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

function noteToFreq(note, octave = 4) {
  const semi = NOTE_MAP[note];
  if (semi === undefined) return 440;
  return 440 * Math.pow(2, (semi - 9 + (octave - 4) * 12) / 12);
}

function chordToNotes(chord, octave = 4) {
  const chordMap = {
    'C': ['C', 'E', 'G'], 'Cm': ['C', 'Eb', 'G'], 'C7': ['C', 'E', 'G', 'Bb'],
    'Cmaj7': ['C', 'E', 'G', 'B'], 'Cmin7': ['C', 'Eb', 'G', 'Bb'],
    'D': ['D', 'F#', 'A'], 'Dm': ['D', 'F', 'A'], 'D7': ['D', 'F#', 'A', 'C'],
    'Dmaj7': ['D', 'F#', 'A', 'C#'], 'Dmin7': ['D', 'F', 'A', 'C'],
    'E': ['E', 'G#', 'B'], 'Em': ['E', 'G', 'B'], 'E7': ['E', 'G#', 'B', 'D'],
    'Emaj7': ['E', 'G#', 'B', 'D#'], 'Emin7': ['E', 'G', 'B', 'D'],
    'F': ['F', 'A', 'C'], 'Fm': ['F', 'Ab', 'C'], 'F7': ['F', 'A', 'C', 'Eb'],
    'Fmaj7': ['F', 'A', 'C', 'E'], 'Fmin7': ['F', 'Ab', 'C', 'Eb'],
    'G': ['G', 'B', 'D'], 'Gm': ['G', 'Bb', 'D'], 'G7': ['G', 'B', 'D', 'F'],
    'Gmaj7': ['G', 'B', 'D', 'F#'], 'Gmin7': ['G', 'Bb', 'D', 'F'],
    'A': ['A', 'C#', 'E'], 'Am': ['A', 'C', 'E'], 'A7': ['A', 'C#', 'E', 'G'],
    'Amaj7': ['A', 'C#', 'E', 'G#'], 'Amin7': ['A', 'C', 'E', 'G'],
    'B': ['B', 'D#', 'F#'], 'Bm': ['B', 'D', 'F#'], 'B7': ['B', 'D#', 'F#', 'A'],
    'Bmaj7': ['B', 'D#', 'F#', 'A#'], 'Bmin7': ['B', 'D', 'F#', 'A']
  };
  const notes = chordMap[chord];
  if (!notes) {
    const root = chord.replace(/[m7]|maj7|min7|[Mm]$/, '');
    const base = chordMap[root] || chordMap['C'];
    return base.map(n => noteToFreq(n, octave));
  }
  return notes.map(n => noteToFreq(n, octave));
}

async function initSoundFontPlayer() {
  if (sfPlayerReady) return sfPlayer;
  if (sfPlayerInitPromise) return sfPlayerInitPromise;

  sfPlayerInitPromise = (async () => {
    try {
      const { SoundFontPlayer } = await import('soundfont-player');
      const audioCtx = Tone.context;
      sfPlayer = await SoundFontPlayer('acoustic_grand_piano', audioCtx);
      sfPlayerReady = true;
      return sfPlayer;
    } catch (e) {
      console.warn('SoundFontPlayer failed to load, using basic synths:', e.message);
      sfPlayerReady = false;
      return null;
    }
  })();

  return sfPlayerInitPromise;
}

/**
 * Initialize the Tone.js audio engine with a full master effects chain.
 *
 * Signal flow:
 *   Instruments → Compressor → Reverb → Delay → MasterGain → Destination
 *
 * This produces a warmer, more professional sound than direct-to-destination.
 * Also initializes the SoundFont piano player for realistic piano timbres.
 */
function initAudioEngine() {
  if (initialized) return;

  // Master effects chain
  masterCompressor = new Tone.Compressor({
    threshold: -16,
    knee: 24,
    ratio: 4,
    attack: 0.005,
    release: 0.18,
  });

  masterReverb = new Tone.Reverb({
    decay: 3.5,
    wet: 0.25,
    preDelay: 0.01,
  });

  masterDelay = new Tone.FeedbackDelay({
    delayTime: '8n',
    feedback: 0.28,
    wet: 0.12,
  });

  masterGain = new Tone.Gain(0.82);

  // Wire: Compressor → (Reverb + Delay + Direct) → Master → Destination
  masterCompressor.connect(masterReverb);
  masterCompressor.connect(masterDelay);
  masterCompressor.connect(masterGain);
  masterReverb.connect(masterGain);
  masterDelay.connect(masterGain);
  masterGain.toDestination();

  transport = Tone.getTransport();
  transport.bpm.value = 120;
  initialized = true;
  initSoundFontPlayer();
}

const INSTRUMENT_CONFIGS = {
  piano: {
    type: 'PolySynth',
    useSoundFont: true,
    config: {
      harmonicity: 2, volume: -8,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 0.2, sustain: 0.4, release: 2.5 },
      filter: { frequency: 4000, type: 'lowpass', Q: 1 }
    }
  },
  pad: {
    type: 'PolySynth',
    config: {
      harmonicity: 8, volume: -12,
      oscillator: { type: 'sine' },
      envelope: { attack: 1.5, decay: 0.5, sustain: 0.8, release: 3 },
      filter: { frequency: 600, type: 'lowpass', Q: 2 }
    }
  },
  bass: {
    type: 'MonoSynth',
    config: {
      harmonicity: 2, volume: -10,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.8 },
      filter: { frequency: 400, type: 'lowpass', Q: 5 }
    }
  },
  strings: {
    type: 'PolySynth',
    config: {
      harmonicity: 3.1, volume: -10,
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.8, decay: 0.3, sustain: 0.7, release: 2.5 },
      filter: { frequency: 2500, type: 'lowpass', Q: 1 }
    }
  },
  drums: {
    type: 'MembraneSynth',
    config: {
      volume: -6, pitchDecay: 0.05, octaves: 6,
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
      filter: { frequency: 8000, type: 'lowpass', Q: 1 }
    }
  },
  hihat: {
    type: 'MetalSynth',
    config: {
      volume: -15, frequency: 8000,
      envelope: { attack: 0.001, decay: 0.05, release: 0.05 }
    }
  }
};

function createInstrument(name) {
  const config = INSTRUMENT_CONFIGS[name];
  if (!config) return null;

  let synth;
  switch (config.type) {
    case 'PolySynth':
      synth = new Tone.PolySynth(Tone.Synth, config.config);
      break;
    case 'MonoSynth':
      synth = new Tone.MonoSynth(config.config);
      break;
    case 'MembraneSynth':
      synth = new Tone.MembraneSynth(config.config);
      break;
    case 'MetalSynth':
      synth = new Tone.MetalSynth(config.config);
      break;
    default:
      synth = new Tone.Synth(config.config);
  }

  synth.connect(masterCompressor);
  return synth;
}

function scheduleComposition(composition, onProgress, onComplete) {
  initAudioEngine();
  stopAll();

  transport.bpm.value = composition.tempo;

  const instruments = {};
  const allNotes = [];
  let cursor = 0;

  for (const section of composition.sections) {
    const bars = section.bars;
    const beatsPerBar = 4;
    const secondsPerBeat = 60 / composition.tempo;
    const sectionDuration = bars * beatsPerBar * secondsPerBeat;
    const totalBeats = bars * beatsPerBar;

    for (let beat = 0; beat < totalBeats; beat++) {
      const chordIndex = Math.floor(beat / beatsPerBar) % section.chords.length;
      const chordName = section.chords[chordIndex];
      const beatTime = cursor + beat * secondsPerBeat;

      for (const instrName of section.instruments) {
        if (!instruments[instrName]) {
          const cfg = INSTRUMENT_CONFIGS[instrName];
          if (cfg) {
            instruments[instrName] = createInstrument(instrName);
          }
        }

        const instr = instruments[instrName];
        if (!instr) continue;

        if (instrName === 'drums') {
          if (beat % 4 === 0) {
            allNotes.push({ time: beatTime, type: 'drum', freq: 80, duration: 0.1 });
          }
          if (beat % 2 === 1) {
            allNotes.push({ time: beatTime, type: 'drum', freq: 200, duration: 0.05 });
          }
        } else if (instrName === 'hihat') {
          allNotes.push({ time: beatTime, type: 'hihat', duration: 0.03 });
        } else {
          const octave = instrName === 'bass' ? 2 : instrName === 'pad' ? 3 : 4;
          const shiftedNotes = chordToNotes(chordName, octave);

          if (beat === 0 || (beat === 2 && instrName !== 'pad')) {
            allNotes.push({
              time: beatTime,
              type: instrName,
              freqs: shiftedNotes,
              duration: secondsPerBeat * 3,
              chord: true
            });
          } else {
            const noteFreq = shiftedNotes[beat % shiftedNotes.length] || shiftedNotes[0];
            allNotes.push({
              time: beatTime,
              type: instrName,
              freqs: [noteFreq],
              duration: secondsPerBeat * 0.8,
              chord: false
            });
          }
        }
      }
    }

    cursor += sectionDuration;
  }

  activeInstruments = instruments;

  const totalDuration = cursor;
  const sortedEvents = allNotes.sort((a, b) => a.time - b.time);

  sortedEvents.forEach((evt) => {
    transport.schedule((time) => {
      triggerEvent(evt);
      if (onProgress) {
        const elapsed = time;
        onProgress(Math.min(1, Math.max(0, elapsed / totalDuration)));
      }
    }, evt.time);
  });

  if (onComplete) {
    transport.schedule(() => {
      onComplete();
      stopAll();
    }, totalDuration + 0.5);
  }

  return totalDuration;
}

/**
 * Trigger a single note/chord event on the appropriate instrument.
 * For piano, uses SoundFont acoustic grand piano when available (realistic piano samples).
 * All other instruments use Tone.js native synths routed through the master effects chain.
 *
 * @param {Object} evt - Event descriptor from scheduleComposition
 */
function triggerEvent(evt) {
  // Piano: use SoundFont player for realistic samples if available
  if (evt.type === 'piano' && sfPlayerReady && sfPlayer) {
    if (evt.chord && Array.isArray(evt.freqs)) {
      evt.freqs.forEach((freq, i) => {
        const note = Tone.Frequency(freq).toNote();
        const duration = (evt.duration || 1.5) + i * 0.005;
        try {
          sfPlayer.play(note, Tone.context.currentTime, {
            duration,
            gain: 0.65,
            attack: 0.005,
            release: 2.5,
          }).connect(masterCompressor);
        } catch {
          // Fallback to PolySynth if SoundFont fails for this note
          const instr = activeInstruments['piano'];
          if (instr && instr instanceof Tone.PolySynth) {
            instr.triggerAttackRelease(note, duration);
          }
        }
      });
    } else if (Array.isArray(evt.freqs) && evt.freqs.length > 0) {
      const note = Tone.Frequency(evt.freqs[0]).toNote();
      try {
        sfPlayer.play(note, Tone.context.currentTime, {
          duration: evt.duration || 0.8,
          gain: 0.65,
          attack: 0.005,
          release: 2.0,
        }).connect(masterCompressor);
      } catch {
        const instr = activeInstruments['piano'];
        if (instr) instr.triggerAttackRelease(note, evt.duration || 0.8);
      }
    }
    return;
  }

  const instr = activeInstruments[evt.type];
  if (!instr) return;

  if (evt.type === 'drum') {
    instr.triggerAttackRelease(evt.freq, evt.duration);
  } else if (evt.type === 'hihat') {
    instr.triggerAttackRelease('16n', evt.duration);
  } else {
    if (evt.chord && instr instanceof Tone.PolySynth) {
      const freqs = evt.freqs.map(f => Tone.Frequency(f).toNote());
      instr.triggerAttackRelease(freqs, evt.duration);
    } else if (Array.isArray(evt.freqs) && evt.freqs.length > 0) {
      const note = Tone.Frequency(evt.freqs[0]).toNote();
      instr.triggerAttackRelease(note, evt.duration);
    }
  }
}

/**
 * Play a generated composition in real time using Tone.js.
 * Initializes the audio engine, schedules all note events on the transport,
 * and starts playback from the beginning.
 *
 * @param {Object} composition - The composition object from musicComposer.composeMusic()
 * @param {number} composition.tempo - BPM (beats per minute)
 * @param {Array} composition.sections - Array of section objects (bars, chords, instruments)
 * @param {Function} [onProgress] - Callback with progress value (0-1) during playback
 * @param {Function} [onComplete] - Callback fired when playback finishes
 * @returns {Promise<{totalDuration:number}>} Resolves when playback starts, with total duration in seconds
 */
export async function playComposition(composition, onProgress, onComplete) {
  await Tone.start();
  initAudioEngine();
  stopAll();

  transport.seconds = 0;
  const totalDuration = scheduleComposition(composition, onProgress, onComplete);
  transport.start();

  return { totalDuration };
}

/**
 * Pause the currently playing composition.
 * @returns {boolean} True if playback was paused, false if nothing was playing
 */
export function pausePlayback() {
  if (transport && transport.state === 'started') {
    transport.pause();
    return true;
  }
  return false;
}

/**
 * Resume a previously paused composition.
 * @returns {boolean} True if playback was resumed, false if not paused
 */
export function resumePlayback() {
  if (transport && transport.state === 'paused') {
    transport.start();
    return true;
  }
  return false;
}

/**
 * Stop all playback and dispose of all active instruments.
 * Resets the transport and releases synthesizer resources.
 */
export function stopAll() {
  if (!transport) return;

  transport.stop();
  transport.cancel();

  Object.values(activeInstruments).forEach(instr => {
    try { instr.dispose(); } catch { }
  });
  activeInstruments = {};
  scheduledEvents = [];
}

/**
 * Check if a composition is currently playing.
 * @returns {boolean} True if the Tone.js transport is actively playing
 */
export function isPlaying() {
  return transport && transport.state === 'started';
}

/**
 * Get the current playback position in seconds.
 * @returns {number} Current transport time in seconds, or 0 if not playing
 */
export function getPlaybackTime() {
  if (!transport) return 0;
  return transport.seconds;
}

/**
 * Export a composition to a WAV audio file by rendering offline.
 * Delegates the heavy lifting to compositionToWavBlob() which uses the
 * full multi-instrument synthesis engine (compressor, reverb, delay, etc.)
 * then triggers a browser download of the resulting WAV file.
 *
 * @param {Object} composition - The composition object from musicComposer.composeMusic()
 * @param {string} [fileName='zmusic_track.wav'] - Download filename
 * @returns {Promise<void>} Triggers a browser download when complete
 */
export async function exportToWav(composition, fileName = 'zmusic_track.wav') {
  const blob = await compositionToWavBlob(composition);
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Convert a composition to a WAV Blob (for MV video composition).
 *
 * Engineered with multi-layer instrument synthesis using Web Audio primitives:
 *   - Piano: triangle + sub sine, with body low-pass filter, percussive ADSR
 *   - Pad:   multi-oscillator (sine + triangle 5ct detune) with slow attack + LPF
 *   - Bass:  sawtooth + 2x sub-octave square, LPF 12dB/oct, pluck envelope
 *   - Strings: sawtooth -> notch-band-pass filter -> chorus-like LFO detune
 *   - Drums: tuned 808-kick (sine pitch drop), snare (tone osc + noise burst),
 *            hihats (highpassed noise, 16th pattern)
 *   - Master: DynamicsCompressor + stereo reverb (4s synthetic impulse) + delay feedback
 *
 * This produces a full, warm, musical mix instead of raw oscillator beeps.
 *
 * @param {Object} composition - The composition object from composeMusic()
 * @returns {Promise<Blob>} Audio WAV blob (44.1 kHz stereo 16-bit)
 */
export async function compositionToWavBlob(composition) {
  const sampleRate = 44100;
  const duration = composition.duration + 2; // +2s for reverb tail
  const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * duration), sampleRate);

  // ============= MASTER EFFECTS CHAIN =============
  // Compressor -> Reverb -> Delay -> Master Gain -> Destination
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 24;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.18;

  // --- Synthetic reverb impulse (4 seconds, exponential decay, early reflections) ---
  const reverbSeconds = 4.0;
  const impulseLen = Math.floor(sampleRate * reverbSeconds);
  const impulseL = offlineCtx.createBuffer(2, impulseLen, sampleRate);
  const dataL = impulseL.getChannelData(0);
  const dataR = impulseL.getChannelData(1);
  for (let i = 0; i < impulseLen; i++) {
    const t = i / sampleRate;
    // Comb-filtered noise creates "hall-ish" reflection density
    const decay = Math.exp(-t * 1.6);
    const early = i < sampleRate * 0.04 ? (1 - i / (sampleRate * 0.04)) * 0.9 : 0;
    dataL[i] = (Math.random() * 2 - 1) * decay * 0.6 + (Math.random() * 2 - 1) * early * 0.5;
    dataR[i] = (Math.random() * 2 - 1) * decay * 0.6 + (Math.random() * 2 - 1) * early * 0.45;
  }
  const reverb = offlineCtx.createConvolver();
  reverb.buffer = impulseL;
  const reverbWet = offlineCtx.createGain();
  reverbWet.gain.value = 0.28;

  // --- Feedback delay (1/8 dotted at 120bpm = 375ms) ---
  const delayTime = (60 / (composition.tempo || 120)) * 0.75;
  const delay = offlineCtx.createDelay(2.0);
  delay.delayTime.value = Math.max(0.1, Math.min(1.5, delayTime));
  const feedback = offlineCtx.createGain();
  feedback.gain.value = 0.32;
  const delayWet = offlineCtx.createGain();
  delayWet.gain.value = 0.14;

  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.82;

  // Wire the master chain
  compressor.connect(reverb);
  compressor.connect(delay);
  compressor.connect(masterGain);
  reverb.connect(reverbWet);
  reverbWet.connect(masterGain);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(delayWet);
  delayWet.connect(masterGain);
  masterGain.connect(offlineCtx.destination);

  // ============= TRACK GAINS (balanced mix) =============
  const trackGains = {
    piano: createGain(offlineCtx, compressor, 0.22),
    pad: createGain(offlineCtx, compressor, 0.14),
    bass: createGain(offlineCtx, compressor, 0.28),
    strings: createGain(offlineCtx, compressor, 0.16),
    drums: createGain(offlineCtx, compressor, 0.34), // kick + snare share
    hihat: createGain(offlineCtx, compressor, 0.14),
  };

  const secondsPerBeat = 60 / composition.tempo;
  let cursor = 0;

  // ============= SCHEDULE EVENTS PER SECTION =============
  for (const section of composition.sections) {
    const bars = section.bars;
    const beatsPerBar = 4;
    const sectionDuration = bars * beatsPerBar * secondsPerBeat;
    const totalBeats = bars * beatsPerBar;

    for (let beat = 0; beat < totalBeats; beat++) {
      const chordIndex = Math.floor(beat / beatsPerBar) % section.chords.length;
      const chordName = section.chords[chordIndex];
      const beatTime = cursor + beat * secondsPerBeat;
      const sixteenth = secondsPerBeat / 4;

      // --- DRUMS: modern 4/4 pattern (kick 1 & 2.5, snare 2 & 4, hihat 16ths) ---
      if (section.instruments.includes('drums')) {
        if (beat % 4 === 0) {
          playOfflineKick(offlineCtx, trackGains.drums, beatTime);
        }
        if (beat % 4 === 2) {
          playOfflineSnare(offlineCtx, trackGains.drums, beatTime, sampleRate);
        }
        // Extra kick on the & of beat 2 (every other bar for groove)
        if (Math.floor(beat / 4) % 2 === 0 && beat % 4 === 1) {
          playOfflineKick(offlineCtx, trackGains.drums, beatTime + sixteenth * 2, 0.85);
        }
      }
      if (section.instruments.includes('hihat')) {
        // Hi-hat: closed on 8ths, open on every 4th 16th
        for (let s = 0; s < 4; s++) {
          const t = beatTime + s * sixteenth;
          const isOpen = s === 2 && beat % 2 === 1;
          playOfflineHihat(offlineCtx, trackGains.hihat, t, sampleRate, isOpen ? 0.18 : 0.06);
        }
      }

      // --- PITCHED INSTRUMENTS ---
      for (const instrName of section.instruments) {
        if (instrName === 'drums' || instrName === 'hihat') continue;
        const octave = instrName === 'bass' ? 2 : instrName === 'pad' ? 4 : instrName === 'strings' ? 4 : 5;
        const notes = chordToNotes(chordName, octave);

        if (instrName === 'piano') {
          // Arpeggio pattern: chord tone on beat, passing tones on off-beats
          if (beat === 0) {
            // Full chord attack on bar start (every 4 beats)
            notes.forEach((freq, i) => {
              playOfflinePiano(offlineCtx, trackGains.piano, freq, beatTime + i * 0.005, secondsPerBeat * 3.2);
            });
          } else {
            // Arpeggiated melody + root on each beat
            const arpIdx = beat % notes.length;
            playOfflinePiano(offlineCtx, trackGains.piano, notes[arpIdx], beatTime, secondsPerBeat * 0.95);
            playOfflinePiano(offlineCtx, trackGains.piano, notes[(arpIdx + 2) % notes.length], beatTime + sixteenth * 2, secondsPerBeat * 0.6);
          }
        } else if (instrName === 'pad') {
          // Long sustained pad chords - whole bar
          if (beat % 4 === 0) {
            notes.forEach((freq, i) => {
              playOfflinePad(offlineCtx, trackGains.pad, freq, beatTime + i * 0.01, secondsPerBeat * 4);
            });
          }
        } else if (instrName === 'bass') {
          // 1-5 bass pattern: root on 1, 5 on 2&3, root on 4
          const rootFreq = notes[0];
          const fifthFreq = notes[2] || notes[0];
          playOfflineBass(offlineCtx, trackGains.bass, rootFreq, beatTime, secondsPerBeat * 0.9);
          if (beat % 2 === 1) {
            playOfflineBass(offlineCtx, trackGains.bass, fifthFreq, beatTime + sixteenth * 2, secondsPerBeat * 0.7);
          }
        } else if (instrName === 'strings') {
          // Half-note counter-melody on top of pad
          if (beat % 2 === 0) {
            const noteIdx = Math.floor(beat / 2) % notes.length;
            playOfflineStrings(offlineCtx, trackGains.strings, notes[noteIdx], beatTime, secondsPerBeat * 1.9);
          }
        } else {
          // Generic fallback
          if (beat === 0) {
            notes.forEach((freq) => {
              playOfflineNote(offlineCtx, trackGains[instrName] || compressor, freq, beatTime, secondsPerBeat * 3, instrName);
            });
          } else {
            playOfflineNote(offlineCtx, trackGains[instrName] || compressor, notes[beat % notes.length] || notes[0], beatTime, secondsPerBeat * 0.8, instrName);
          }
        }
      }
    }
    cursor += sectionDuration;
  }

  // Fade out master over last 1.5s to avoid click
  const totalTime = cursor + 0.5;
  masterGain.gain.setValueAtTime(0.82, Math.max(0, totalTime - 1.5));
  masterGain.gain.exponentialRampToValueAtTime(0.0001, totalTime + 0.05);

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBuffer = audioBufferToWav(renderedBuffer);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });

  // Cleanup nodes
  [masterGain, compressor, reverb, reverbWet, delay, feedback, delayWet,
    ...Object.values(trackGains)].forEach(n => { try { n.disconnect(); } catch { } });

  return blob;
}

/**
 * Helper: create a GainNode with a static linear value and patch it into the graph.
 * @param {OfflineAudioContext} ctx
 * @param {AudioNode} output - Destination node
 * @param {number} linearGain - Linear gain 0..1
 * @returns {GainNode}
 */
function createGain(ctx, output, linearGain) {
  const g = ctx.createGain();
  g.gain.value = Math.max(0, Math.min(1, linearGain));
  g.connect(output);
  return g;
}

/**
 * Piano voice: triangle oscillator + sub sine -> low-pass filter -> output.
 * Percussive ADSR: quick attack, fast-decaying mid, long release.
 *
 * @param {OfflineAudioContext} ctx
 * @param {AudioNode} dest
 * @param {number} freq - Note fundamental in Hz
 * @param {number} t0 - Start time (s)
 * @param {number} dur - Held duration (s)
 */
function playOfflinePiano(ctx, dest, freq, t0, dur) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  // Gentle sub-oscillator for warmth
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = freq / 2;
  const subGain = ctx.createGain();
  subGain.gain.value = 0.45;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 3800;
  filter.Q.value = 0.7;

  const eg = ctx.createGain();
  const attack = 0.004;
  const peak = 1.0;
  const sustain = 0.35;
  const release = Math.max(0.15, dur * 0.45);
  eg.gain.setValueAtTime(0.0001, t0);
  eg.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  eg.gain.exponentialRampToValueAtTime(sustain, t0 + attack + dur * 0.25);
  eg.gain.setValueAtTime(sustain, t0 + dur);
  eg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);

  osc.connect(filter);
  sub.connect(subGain); subGain.connect(filter);
  filter.connect(eg);
  eg.connect(dest);
  osc.start(t0); osc.stop(t0 + dur + release + 0.05);
  sub.start(t0); sub.stop(t0 + dur + release + 0.05);
}

/**
 * Pad voice: two detuned oscillators -> low-pass with subtle filter sweep -> slow ADSR.
 *
 * @param {OfflineAudioContext} ctx
 * @param {AudioNode} dest
 * @param {number} freq
 * @param {number} t0
 * @param {number} dur
 */
function playOfflinePad(ctx, dest, freq, t0, dur) {
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = freq;
  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = freq * Math.pow(2, 0.004); // +4 cents detune for thickness
  const oscMix = ctx.createGain();
  oscMix.gain.value = 0.5;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.9;
  // Filter sweep: starts at 800Hz, opens to 3200Hz, closes slightly at end
  filter.frequency.setValueAtTime(800, t0);
  filter.frequency.exponentialRampToValueAtTime(3200, t0 + dur * 0.4);
  filter.frequency.exponentialRampToValueAtTime(2200, t0 + dur);

  const eg = ctx.createGain();
  const attack = dur * 0.35;
  const release = dur * 0.5;
  eg.gain.setValueAtTime(0.0001, t0);
  eg.gain.exponentialRampToValueAtTime(0.95, t0 + attack);
  eg.gain.setValueAtTime(0.9, t0 + dur * 0.8);
  eg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);

  osc1.connect(oscMix); osc2.connect(oscMix);
  oscMix.connect(filter); filter.connect(eg); eg.connect(dest);
  osc1.start(t0); osc1.stop(t0 + dur + release + 0.1);
  osc2.start(t0); osc2.stop(t0 + dur + release + 0.1);
}

/**
 * Bass voice: sawtooth + square sub -> 2-pole LPF -> pluck envelope.
 *
 * @param {OfflineAudioContext} ctx
 * @param {AudioNode} dest
 * @param {number} freq
 * @param {number} t0
 * @param {number} dur
 */
function playOfflineBass(ctx, dest, freq, t0, dur) {
  const saw = ctx.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.value = freq;
  const sub1 = ctx.createOscillator();
  sub1.type = 'square';
  sub1.frequency.value = freq / 2;
  const sub2 = ctx.createOscillator();
  sub2.type = 'sine';
  sub2.frequency.value = freq / 4;
  const subMix = ctx.createGain();
  subMix.gain.value = 0.6;
  const sub1G = ctx.createGain(); sub1G.gain.value = 0.45;
  const sub2G = ctx.createGain(); sub2G.gain.value = 0.35;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 2.2;
  // Filter sweep opens then closes (classic synth bass)
  filter.frequency.setValueAtTime(280, t0);
  filter.frequency.exponentialRampToValueAtTime(1400, t0 + 0.02);
  filter.frequency.exponentialRampToValueAtTime(520, t0 + 0.25);

  const eg = ctx.createGain();
  eg.gain.setValueAtTime(0.0001, t0);
  eg.gain.exponentialRampToValueAtTime(1.0, t0 + 0.006);
  eg.gain.exponentialRampToValueAtTime(0.55, t0 + 0.08);
  eg.gain.setValueAtTime(0.55, t0 + dur * 0.7);
  eg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.05);

  saw.connect(filter);
  sub1.connect(sub1G); sub1G.connect(subMix);
  sub2.connect(sub2G); sub2G.connect(subMix);
  subMix.connect(filter);
  filter.connect(eg);
  eg.connect(dest);
  saw.start(t0); saw.stop(t0 + dur + 0.1);
  sub1.start(t0); sub1.stop(t0 + dur + 0.1);
  sub2.start(t0); sub2.stop(t0 + dur + 0.1);
}

/**
 * Strings voice: sawtooth -> band-pass -> slow vibrato LFO -> warm ADSR.
 *
 * @param {OfflineAudioContext} ctx
 * @param {AudioNode} dest
 * @param {number} freq
 * @param {number} t0
 * @param {number} dur
 */
function playOfflineStrings(ctx, dest, freq, t0, dur) {
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = freq;

  // Vibrato LFO (6Hz, +/- 6 cents)
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.5;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = freq * 0.0035; // ~6 cents
  lfo.connect(lfoGain); lfoGain.connect(osc.frequency);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq * 3.5;
  filter.Q.value = 1.6;

  const eg = ctx.createGain();
  const attack = 0.18;
  const release = 0.4;
  eg.gain.setValueAtTime(0.0001, t0);
  eg.gain.exponentialRampToValueAtTime(0.9, t0 + attack);
  eg.gain.setValueAtTime(0.85, t0 + dur * 0.9);
  eg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);

  osc.connect(filter); filter.connect(eg); eg.connect(dest);
  osc.start(t0); osc.stop(t0 + dur + release + 0.05);
  lfo.start(t0); lfo.stop(t0 + dur + release + 0.05);
}

/**
 * Generic fallback instrument (used for unknown instrType strings).
 * Uses triangle with simple ADSR and low-pass for warmth.
 *
 * @param {OfflineAudioContext} ctx
 * @param {AudioNode} dest
 * @param {number} freq
 * @param {number} startTime
 * @param {number} duration
 * @param {string} instrType - Informational (unused for generic)
 */
function playOfflineNote(ctx, dest, freq, startTime, duration, instrType) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 4200;
  filter.Q.value = 0.6;

  const gain = ctx.createGain();
  const attack = 0.008;
  const release = Math.max(0.12, duration * 0.35);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.7, startTime + attack);
  gain.gain.setValueAtTime(0.55, startTime + attack + duration * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration + release);

  osc.connect(filter); filter.connect(gain); gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + duration + release + 0.05);
}

/**
 * 808-style kick drum: sine wave with exponential pitch drop + body envelope.
 *
 * @param {OfflineAudioContext} ctx
 * @param {AudioNode} dest
 * @param {number} startTime
 * @param {number} [amplitude=1.0] - Relative amplitude multiplier (0.0..1.0)
 */
function playOfflineKick(ctx, dest, startTime, amplitude = 1.0) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, startTime);
  osc.frequency.exponentialRampToValueAtTime(45, startTime + 0.12);
  // Tiny pitch bump at end for "click" body
  osc.frequency.exponentialRampToValueAtTime(38, startTime + 0.22);

  const click = ctx.createOscillator();
  click.type = 'square';
  click.frequency.value = 2800;
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.18 * amplitude, startTime);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.015);

  const gain = ctx.createGain();
  const peak = 1.0 * amplitude;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.002);
  gain.gain.exponentialRampToValueAtTime(peak * 0.6, startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.42);

  click.connect(clickGain); clickGain.connect(dest);
  osc.connect(gain); gain.connect(dest);
  click.start(startTime); click.stop(startTime + 0.02);
  osc.start(startTime); osc.stop(startTime + 0.45);
}

/**
 * Snare drum: tonal sine body + band-passed white noise burst.
 *
 * @param {OfflineAudioContext} ctx
 * @param {AudioNode} dest
 * @param {number} startTime
 * @param {number} sr - Sample rate (for noise buffer length)
 */
function playOfflineSnare(ctx, dest, startTime, sr) {
  const noiseLen = Math.floor(sr * 0.22);
  const noiseBuf = ctx.createBuffer(1, noiseLen, sr);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    // Slightly rolled-off noise (pre-emphasise high end)
    data[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen * 0.5);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 1600;
  const noiseFilter2 = ctx.createBiquadFilter();
  noiseFilter2.type = 'bandpass';
  noiseFilter2.frequency.value = 5200;
  noiseFilter2.Q.value = 0.7;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.55, startTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.2);

  const tone = ctx.createOscillator();
  tone.type = 'triangle';
  tone.frequency.setValueAtTime(200, startTime);
  tone.frequency.exponentialRampToValueAtTime(140, startTime + 0.12);
  const toneGain = ctx.createGain();
  toneGain.gain.setValueAtTime(0.5, startTime);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.15);

  noise.connect(noiseFilter); noiseFilter.connect(noiseFilter2);
  noiseFilter2.connect(noiseGain); noiseGain.connect(dest);
  tone.connect(toneGain); toneGain.connect(dest);
  noise.start(startTime); noise.stop(startTime + 0.22);
  tone.start(startTime); tone.stop(startTime + 0.16);
}

/**
 * Hi-hat: high-pass filtered white noise of variable length (closed vs open).
 *
 * @param {OfflineAudioContext} ctx
 * @param {AudioNode} dest
 * @param {number} startTime
 * @param {number} sr
 * @param {number} lengthSec - Decay length: ~0.06s closed, 0.15s+ open
 */
function playOfflineHihat(ctx, dest, startTime, sr, lengthSec = 0.06) {
  const noiseLen = Math.floor(sr * Math.max(0.05, lengthSec * 1.5));
  const noiseBuf = ctx.createBuffer(1, noiseLen, sr);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7200;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 9500;
  bp.Q.value = 1.3;

  const gain = ctx.createGain();
  const peak = lengthSec > 0.1 ? 0.5 : 0.32;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + lengthSec);

  noise.connect(hp); hp.connect(bp); bp.connect(gain); gain.connect(dest);
  noise.start(startTime);
  noise.stop(startTime + lengthSec * 1.5 + 0.01);
}

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const channels = [];
  for (let i = 0; i < numChannels; i++) channels.push(buffer.getChannelData(i));

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = Math.max(-1, Math.min(1, channels[channel][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}