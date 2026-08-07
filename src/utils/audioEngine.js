import * as Tone from 'tone';

let initialized = false;
let transport = null;
let masterGain = null;
let scheduledEvents = [];
let activeInstruments = {};

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

function initAudioEngine() {
  if (initialized) return;
  masterGain = new Tone.Gain(0.7).toDestination();
  transport = Tone.getTransport();
  transport.bpm.value = 120;
  initialized = true;
}

const INSTRUMENT_CONFIGS = {
  piano: {
    type: 'PolySynth',
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

  synth.connect(masterGain);
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

function triggerEvent(evt) {
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

export async function playComposition(composition, onProgress, onComplete) {
  await Tone.start();
  initAudioEngine();
  stopAll();

  transport.seconds = 0;
  const totalDuration = scheduleComposition(composition, onProgress, onComplete);
  transport.start();

  return { totalDuration };
}

export function pausePlayback() {
  if (transport && transport.state === 'started') {
    transport.pause();
    return true;
  }
  return false;
}

export function resumePlayback() {
  if (transport && transport.state === 'paused') {
    transport.start();
    return true;
  }
  return false;
}

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

export function isPlaying() {
  return transport && transport.state === 'started';
}

export function getPlaybackTime() {
  if (!transport) return 0;
  return transport.seconds;
}
