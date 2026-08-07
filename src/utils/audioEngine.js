import * as Tone from 'tone';

let initialized = false;
let transport = null;
let masterGain = null;
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

function initAudioEngine() {
  if (initialized) return;
  masterGain = new Tone.Gain(0.7).toDestination();
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

export async function exportToWav(composition, fileName = 'zmusic_track.wav') {
  const sampleRate = Tone.context.sampleRate;
  const duration = composition.duration + 1;
  const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * duration), sampleRate);

  const offlineMaster = new Tone.Gain(0.7).connect(offlineCtx.destination);

  const secondsPerBeat = 60 / composition.tempo;
  let cursor = 0;

  for (const section of composition.sections) {
    const bars = section.bars;
    const beatsPerBar = 4;
    const sectionDuration = bars * beatsPerBar * secondsPerBeat;
    const totalBeats = bars * beatsPerBar;

    for (let beat = 0; beat < totalBeats; beat++) {
      const chordIndex = Math.floor(beat / beatsPerBar) % section.chords.length;
      const chordName = section.chords[chordIndex];
      const beatTime = cursor + beat * secondsPerBeat;
      const sampleOffset = Math.floor(beatTime * sampleRate);

      for (const instrName of section.instruments) {
        if (instrName === 'drums') {
          if (beat % 4 === 0) {
            playOfflineKick(offlineCtx, offlineMaster, sampleOffset / sampleRate);
          }
          if (beat % 2 === 1) {
            playOfflineSnare(offlineCtx, offlineMaster, sampleOffset / sampleRate, sampleRate * 0.05);
          }
        } else if (instrName === 'hihat') {
          playOfflineHihat(offlineCtx, offlineMaster, sampleOffset / sampleRate, sampleRate * 0.03, sampleRate);
        } else {
          const octave = instrName === 'bass' ? 2 : instrName === 'pad' ? 3 : 4;
          const shiftedNotes = chordToNotes(chordName, octave);

          if (beat === 0 || (beat === 2 && instrName !== 'pad')) {
            shiftedNotes.forEach((freq) => {
              playOfflineNote(offlineCtx, offlineMaster, freq, sampleOffset / sampleRate, secondsPerBeat * 3, instrName);
            });
          } else {
            const noteFreq = shiftedNotes[beat % shiftedNotes.length] || shiftedNotes[0];
            playOfflineNote(offlineCtx, offlineMaster, noteFreq, sampleOffset / sampleRate, secondsPerBeat * 0.8, instrName);
          }
        }
      }
    }
    cursor += sectionDuration;
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBuffer = audioBufferToWav(renderedBuffer);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 5000);
  offlineMaster.dispose();
}

function playOfflineNote(ctx, dest, freq, startTime, duration, instrType) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  const typeMap = { piano: 'triangle', pad: 'sine', bass: 'sawtooth', strings: 'sawtooth' };
  osc.type = typeMap[instrType] || 'triangle';
  osc.frequency.value = freq;

  const volMap = { piano: -8, pad: -12, bass: -10, strings: -10 };
  const volume = volMap[instrType] || -10;

  const attackTime = instrType === 'pad' ? 1.5 : 0.005;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + attackTime);
  gain.gain.setValueAtTime(volume, startTime + duration - 0.5);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);
}

function playOfflineKick(ctx, dest, startTime) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(120, startTime);
  osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.1);
  gain.gain.setValueAtTime(-6, startTime);
  gain.gain.exponentialRampToValueAtTime(-40, startTime + 0.15);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + 0.2);
}

function playOfflineSnare(ctx, dest, startTime, noiseLength) {
  const noiseBuf = ctx.createBuffer(1, Math.floor(noiseLength), ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(-12, startTime);
  gain.gain.exponentialRampToValueAtTime(-40, startTime + 0.1);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 7000;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  noise.start(startTime);
}

function playOfflineHihat(ctx, dest, startTime, noiseLength, sampleRate) {
  const noiseBuf = ctx.createBuffer(1, Math.floor(noiseLength), sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(-20, startTime);
  gain.gain.exponentialRampToValueAtTime(-50, startTime + 0.05);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 6000;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  noise.start(startTime);
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