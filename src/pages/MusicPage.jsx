import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music, Sparkles, Loader, History, Play, Pause, SkipBack, SkipForward, Zap, Wand2, Download, Cloud, Brain, Lightbulb, Music2, Disc3, Gift, Mic, Headphones } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import HistoryPanel from '../components/HistoryPanel.jsx';
import { MUSIC_STYLES, MUSIC_THEMES } from '../config/musicStyles.js';
import { composeMusic } from '../utils/musicComposer.js';
import { playComposition, pausePlayback, resumePlayback, stopAll, getPlaybackTime, exportToWav } from '../utils/audioEngine.js';
import SunoService from '../services/suno.service.js';
import FreeMusicService from '../services/freemusic.service.js';
import MuseService from '../services/muse.service.js';
import { generateCoverArt } from '../utils/coverArtGenerator.js';

/**
 * Map our internal MUSIC_STYLES keys → muse.top Chinese style names.
 * muse.top's style catalog (from /project/song/v30/song/style) uses Chinese
 * genre names. For Master Mode we pass these as the `style` field. Keys
 * without a muse equivalent fall back to "" (muse picks a default style).
 * @type {Record<string, string>}
 */
const MUSE_STYLE_MAP = {
  pop: '流行音乐',
  rock: '摇滚',
  electronic: '电子乐',
  hip_hop: '说唱',
  jazz: '爵士',
  rnb: 'R&B',
  folk: '民谣',
  ancient: '古风',
  ancient_modern: '古风',
  chinese_classical: '古风',
  chinese_traditional: '古风',
  gothic_rock: '摇滚',
  love_song: '流行音乐',
  ballad: '流行音乐',
  romantic: '流行音乐',
  dance_party: '电子乐',
  energetic: '电子乐',
  kpop: '流行音乐',
  jpop: '流行音乐',
  reggae: '流行音乐',
};

const INSPIRATION_CHIPS = [
  '追逐梦想，永不放弃',
  '夏日回忆，海边漫步',
  '都市夜晚，霓虹闪烁',
  '暗恋心事，心跳加速',
  '怀旧时光，童年记忆',
  '自由奔跑，青春飞扬',
  '安静夜晚，思绪万千',
  '远方的诗，故乡的云'
];

const ENGINES = [
  { id: 'free', label: 'Free', icon: Gift, desc: '100% FREE: Edge TTS vocals + MusicGen', color: 'from-emerald-500 to-teal-500', free: true },
  { id: 'auto', label: 'Auto', icon: Sparkles, desc: 'AI picks best engine', color: 'from-violet-500 to-pink-500', free: false },
  { id: 'suno', label: 'Suno.cn', icon: Cloud, desc: 'Real songs + vocals (needs credits)', color: 'from-sky-500 to-violet-500', free: false },
  { id: 'muse', label: 'Muse', icon: Headphones, desc: 'muse.top AI: real songs + vocals (14 credits)', color: 'from-fuchsia-500 to-purple-500', free: false },
  { id: 'tonejs', label: 'Tone.js', icon: Zap, desc: 'Instant procedural preview', color: 'from-amber-500 to-rose-500', free: true },
];

function analyzePromptForThinking(prompt, style, theme, bpm, duration) {
  const steps = [];
  const moodKeywords = {
    'love': ['深情', '浪漫', '甜蜜', '温柔', '心动'],
    'sad': ['忧伤', '思念', '孤独', '离别', '哭泣'],
    'happy': ['快乐', '幸福', '阳光', '庆祝', '跳舞'],
    'inspiration': ['励志', '梦想', '奋斗', '希望', '力量'],
    'nature': ['自然', '风景', '田园', '清新', '宁静'],
    'nostalgia': ['怀旧', '回忆', '童年', '时光', '往事']
  };

  const detectedMoods = [];
  const lowerPrompt = (prompt || '').toLowerCase();

  Object.entries(moodKeywords).forEach(([mood, keywords]) => {
    if (keywords.some(k => lowerPrompt.includes(k.toLowerCase()) || prompt?.includes(k))) {
      detectedMoods.push(mood);
    }
  });

  if (detectedMoods.length === 0) detectedMoods.push(theme || 'love');

  const styleInfo = MUSIC_STYLES[style];
  const styleDesc = styleInfo?.description || style;

  // Step 1: Analyze intent
  steps.push({
    icon: Brain,
    title: 'Analyzing prompt intent',
    detail: `Detected ${detectedMoods.join(', ')} mood(s) | Style: ${styleDesc} | Theme: ${theme}`,
    status: 'done'
  });

  // Step 2: Design chord progression
  const chordMap = {
    pop: ['C-G-Am-F', 'G-D-Em-C'],
    electronic: ['Am-F-C-G', 'Dm-Bb-F-C'],
    rock: ['E-G-D-A', 'C-G-D-Am'],
    jazz: ['ii-V-I', 'I-vi-ii-V'],
    classical: ['I-IV-V-I', 'vi-IV-I-V'],
    rnb: ['Am-F-C-G', 'Dm-Gm-C-A#'],
    folk: ['C-G-Am-F', 'G-C-D-Em'],
    cinematic: ['C-Am-F-G', 'D-A-Bm-F#m']
  };
  const chords = chordMap[style] || chordMap.pop;

  steps.push({
    icon: Music2,
    title: 'Designing chord progression',
    detail: `Primary: ${chords[0]} | Alternative: ${chords[1] || chords[0]} | Key: ${style === 'electronic' || style === 'rnb' ? 'minor' : 'major'}`,
    status: 'done'
  });

  // Step 3: Structure
  const structure = duration >= 120
    ? 'Intro → Verse → Pre-Chorus → Chorus → Verse → Pre-Chorus → Chorus → Bridge → Outro'
    : duration >= 60
      ? 'Intro → Verse → Chorus → Verse → Chorus → Outro'
      : 'Intro → Verse → Chorus → Outro';

  steps.push({
    icon: Lightbulb,
    title: 'Planning song structure',
    detail: `${structure} | Target BPM: ${bpm} | Duration: ${duration}s`,
    status: 'done'
  });

  // Step 4: Instrumentation
  const instruments = {
    pop: ['Acoustic Guitar', 'Electric Bass', 'Drums', 'Synth Pad', 'Vocal'],
    electronic: ['Synth Lead', 'Sub Bass', '808 Drums', 'Arpeggiator', 'FX Risers'],
    rock: ['Electric Guitar', 'Distortion', 'Acoustic Drums', 'Bass Guitar', 'Vocal'],
    jazz: ['Saxophone', 'Piano', 'Upright Bass', 'Brushes', 'Vocal'],
    classical: ['Grand Piano', 'Violin', 'Cello', 'Orchestral Drums'],
    rnb: ['Rhodes Piano', 'Clap Drums', 'Slap Bass', 'Synth Pad', 'Vocal'],
    folk: ['Acoustic Guitar', 'Harmonica', 'Upright Bass', 'Shaker', 'Vocal'],
    cinematic: ['Orchestra Strings', 'Timpani', 'Synth Pad', 'Piano', 'Choir']
  };
  const inst = instruments[style] || instruments.pop;

  steps.push({
    icon: Disc3,
    title: 'Selecting instruments',
    detail: inst.slice(0, 5).join(' + '),
    status: 'done'
  });

  // Step 5: AI orchestration
  steps.push({
    icon: Sparkles,
    title: 'AI orchestration ready',
    detail: 'Ready to generate. Click the button to create your song!',
    status: 'ready'
  });

  return steps;
}

function MusicPage() {
  const { t, ts } = useTranslation();
  const { addToHistory, pendingLyrics, getHistoryByType } = useGeneration();

  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [mode, setMode] = useState('quick');
  const [style, setStyle] = useState('pop');
  const [theme, setTheme] = useState('love');
  const [duration, setDuration] = useState(60);
  const [bpm, setBpm] = useState(120);
  const [instrumental, setInstrumental] = useState(false);
  const [engine, setEngine] = useState('free');
  const [voice, setVoice] = useState('zh-female-soft');
  const [freeAudioUrl, setFreeAudioUrl] = useState(null);

  const [composition, setComposition] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStage, setGenStage] = useState('');
  const [genProgress, setGenProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showWorksGallery, setShowWorksGallery] = useState(false);

  const [sunoTaskId, setSunoTaskId] = useState(null);
  const [sunoAudioUrl, setSunoAudioUrl] = useState(null);
  const [sunoTitle, setSunoTitle] = useState('');
  const [sunoStatus, setSunoStatus] = useState('');

  // Muse (muse.top) generation state — mirrors suno state but for the Muse engine.
  // museAudioUrl holds the final CDN mp3 once polling completes.
  const [museTaskId, setMuseTaskId] = useState(null);
  const [museAudioUrl, setMuseAudioUrl] = useState(null);
  const [museTitle, setMuseTitle] = useState('');
  const [museStatus, setMuseStatus] = useState('');
  const [museCredits, setMuseCredits] = useState(null);

  const [coverArtUrl, setCoverArtUrl] = useState(null);
  const [coverArtUrlSuno, setCoverArtUrlSuno] = useState(null);
  const [coverArtUrlMuse, setCoverArtUrlMuse] = useState(null);
  const [historyCovers, setHistoryCovers] = useState({});

  const [thinkingSteps, setThinkingSteps] = useState([]);
  const [showThinking, setShowThinking] = useState(false);
  const [activeThinkingStep, setActiveThinkingStep] = useState(-1);

  const progressTimerRef = useRef(null);
  const audioElementRef = useRef(null);

  const musicHistory = getHistoryByType?.('song') || [];
  const displayedWorks = showWorksGallery ? musicHistory.slice() : musicHistory.slice(0, 2);

  const getStyleLabel = (key) => {
    return ts(`lyrics_styles.${key}`) || ts(`styles.${key}`) || MUSIC_STYLES[key]?.description || key;
  };

  const getThemeLabel = (key) => {
    return ts(`themes.${key}`) || MUSIC_THEMES[key]?.sunoTags?.split(',')[0] || key;
  };

  const startThinking = useCallback((p, s, th, b, d) => {
    const steps = analyzePromptForThinking(p, s, th, b, d);
    setThinkingSteps(steps);
    setShowThinking(true);
    setActiveThinkingStep(0);

    // Animate through steps
    steps.forEach((step, idx) => {
      setTimeout(() => {
        setActiveThinkingStep(idx);
      }, idx * 600);
    });
  }, []);

  useEffect(() => {
    if (pendingLyrics) setPrompt(pendingLyrics);
  }, [pendingLyrics]);

  useEffect(() => {
    if (!prompt.trim()) {
      setThinkingSteps([]);
      setShowThinking(false);
      return;
    }
    // Auto-analyze when prompt changes
    const timer = setTimeout(() => {
      startThinking(prompt, style, theme, bpm, duration);
    }, 500);
    return () => clearTimeout(timer);
  }, [prompt, style, theme, bpm, duration, startThinking]);

  useEffect(() => {
    const audioUrl = sunoAudioUrl || museAudioUrl || freeAudioUrl;
    if (isPlaying && !audioUrl) {
      progressTimerRef.current = setInterval(() => {
        setPlayTime(getPlaybackTime());
      }, 100);
    } else if (isPlaying && audioUrl && audioElementRef.current) {
      progressTimerRef.current = setInterval(() => {
        setPlayTime(audioElementRef.current.currentTime || 0);
      }, 100);
    } else {
      clearInterval(progressTimerRef.current);
    }
    return () => clearInterval(progressTimerRef.current);
  }, [isPlaying, sunoAudioUrl, museAudioUrl, freeAudioUrl]);

  useEffect(() => {
    if (engine === 'muse' && MuseService.isConfigured()) {
      let cancelled = false;
      MuseService.getUser()
        .then((user) => {
          if (!cancelled) {
            const credit = user?.memberInfo?.credit ?? user?.credit ?? 0;
            setMuseCredits(credit);
          }
        })
        .catch(() => { if (!cancelled) setMuseCredits(0); });
      return () => { cancelled = true; };
    } else if (engine !== 'muse') {
      setMuseCredits(null);
    }
  }, [engine]);

  useEffect(() => {
    if (composition?.title || prompt) {
      const url = generateCoverArt({
        title: composition?.title || prompt || 'ZMusic',
        genre: style || 'pop',
        style: style,
      });
      setCoverArtUrl(url);
    }
  }, [composition?.title, prompt, style]);

  useEffect(() => {
    if (sunoTitle) {
      const url = generateCoverArt({ title: sunoTitle, genre: style || 'pop' });
      setCoverArtUrlSuno(url);
    }
  }, [sunoTitle]);

  useEffect(() => {
    if (museTitle) {
      const url = generateCoverArt({ title: museTitle, genre: style || 'pop' });
      setCoverArtUrlMuse(url);
    }
  }, [museTitle]);

  useEffect(() => {
    const newCovers = {};
    displayedWorks.forEach((item, idx) => {
      if (!item.coverArtUrl && !historyCovers[idx]) {
        const title = item.title || item.result?.composition?.title || item.prompt?.slice(0, 30) || 'Untitled';
        const genre = item.style || item.genre || 'pop';
        newCovers[idx] = generateCoverArt({ title, genre });
      }
    });
    if (Object.keys(newCovers).length > 0) {
      setHistoryCovers(prev => ({ ...prev, ...newCovers }));
    }
  }, [displayedWorks]);

  const handleGenerate = async () => {
    if (!prompt.trim() && !lyrics.trim()) {
      setError(t('music.please_enter_prompt'));
      return;
    }

    setError('');
    setIsGenerating(true);
    setComposition(null);
    setSunoAudioUrl(null);
    setFreeAudioUrl(null);
    setSunoTaskId(null);
    setMuseAudioUrl(null);
    setMuseTaskId(null);
    setMuseStatus('');
    setGenProgress(0.05);
    setGenStage('preparing');
    stopAll();
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    setActiveThinkingStep(thinkingSteps.length - 1);

    try {
      // === FREE ENGINE: 100% free, no paid APIs ===
      if (engine === 'free' || engine === 'auto') {
        setGenStage('preview');
        setGenProgress(0.15);

        // Step 1: Start Tone.js instant preview while waiting
        const comp = composeMusic({ prompt: prompt || lyrics, style, theme, duration, bpm });
        setComposition(comp);
        setGenProgress(0.25);

        // Play preview immediately
        playComposition(comp, () => { }, () => { }).catch(() => { });
        setIsPlaying(true);
        setGenProgress(0.35);

        // Step 2: Generate real song via free backend (Edge TTS + MusicGen)
        setGenStage('suno_generating');
        setSunoStatus('Generating FREE song (Edge TTS + MusicGen)...');

        const genStep = {
          icon: Gift,
          title: 'Generating with FREE engine',
          detail: 'Edge TTS vocals + MusicGen instrumental, 100% free',
          status: 'active'
        };
        setThinkingSteps(prev => [...prev, genStep]);
        setActiveThinkingStep(thinkingSteps.length);

        try {
          const result = await FreeMusicService.generateSong({
            prompt: prompt || '',
            lyrics: lyrics || prompt || '',
            voice,
            style,
            duration: Math.min(duration, 30),
            instrumental,
            engine: 'edge-tts',
          });

          setGenProgress(0.85);

          if (result.success && result.audioUrl) {
            setFreeAudioUrl(result.audioUrl);
            setGenStage('complete');
            setGenProgress(1);
            setSunoStatus('');

            setThinkingSteps(prev => prev.map((s, i) =>
              i === thinkingSteps.length ? { ...s, detail: `✨ FREE song generated! Engine: ${result.engine}`, status: 'done' } : s
            ));

            // Stop Tone.js preview, switch to real audio
            stopAll();
            setIsPlaying(false);

            const audio = new Audio(result.audioUrl);
            audio.loop = false;
            audioElementRef.current = audio;

            addToHistory({
              type: 'song',
              method: result.engine,
              theme, style, genre: style, bpm,
              duration: result.duration || duration,
              provider: 'free',
              prompt,
              lyrics: lyrics.slice(0, 200),
              title: prompt.slice(0, 30) || lyrics.slice(0, 20),
              audioUrl: result.audioUrl,
              result: { composition: comp, freeEngine: result.engine }
            });

            // Auto-play the generated song
            setTimeout(() => {
              if (audioElementRef.current) {
                audioElementRef.current.play().catch(() => { });
                setIsPlaying(true);
              }
            }, 300);
          } else {
            throw new Error(result.error || 'Free generation failed');
          }
        } catch (freeErr) {
          console.error('Free engine error:', freeErr);
          // Keep Tone.js preview as fallback
          setSunoStatus(`Free engine error: ${freeErr.message}. Using Tone.js preview.`);
          setGenStage('complete');
          setGenProgress(1);
          setThinkingSteps(prev => prev.map((s, i) =>
            i === thinkingSteps.length ? { ...s, detail: `⚠️ ${freeErr.message}. Using preview.`, status: 'done' } : s
          ));
          addToHistory({
            type: 'song',
            method: 'tonejs_procedural',
            theme, style, genre: style, bpm, duration: comp.duration,
            provider: 'tonejs',
            prompt,
            result: { composition: comp }
          });
        }
      } else if (engine === 'suno' && SunoService.isConfigured()) {
        // === SUNO ENGINE: paid (needs credits) ===
        setGenStage('preview');
        setGenProgress(0.1);
        const comp = composeMusic({ prompt, style, theme, duration, bpm });
        setComposition(comp);
        setGenProgress(0.2);
        await playComposition(comp, (p) => setGenProgress(0.2 + p * 0.15), () => { });
        setIsPlaying(true);
        setGenProgress(0.35);

        setGenStage('suno_generating');
        setSunoStatus(t('music.suno_submitting'));

        const styleTag = MUSIC_STYLES[style]?.sunoTags || style;
        const result = await SunoService.generateMusic(prompt, styleTag, duration, false, instrumental);

        if (result.success && result.serialNos?.length > 0) {
          setSunoTaskId(result.serialNos[0]);
          setGenProgress(0.5);
          setSunoStatus(t('music.suno_processing'));

          let taskResult;
          for (let attempt = 0; attempt < 10; attempt++) {
            taskResult = await SunoService.queryTaskStatus(result.serialNos[0], false);
            if (taskResult.status === 'success' || taskResult.status === 'failed') break;
            setGenProgress(0.5 + (attempt / 10) * 0.3);
            setSunoStatus(`${t('music.suno_processing')}... ${attempt + 1}/10`);
            await new Promise(r => setTimeout(r, 3000));
          }

          if (taskResult.status === 'success' && taskResult.audioUrl) {
            setSunoAudioUrl(taskResult.audioUrl);
            setSunoTitle(taskResult.title || prompt.slice(0, 20));
            setGenStage('complete');
            setGenProgress(1);
            stopAll();
            setIsPlaying(false);
            const audio = new Audio(taskResult.audioUrl);
            audio.crossOrigin = 'anonymous';
            audioElementRef.current = audio;
            addToHistory({
              type: 'song', method: 'suno_cn', theme, style, genre: style, bpm,
              duration: taskResult.duration || duration, provider: 'suno', prompt,
              title: taskResult.title || prompt.slice(0, 20), audioUrl: taskResult.audioUrl,
              result: { composition: comp, sunoTaskId: result.serialNos[0] }
            });
            setTimeout(() => { audioElementRef.current?.play().catch(() => { }); setIsPlaying(true); }, 300);
          } else {
            setSunoStatus(t('music.suno_failed'));
            setGenStage('complete');
            setGenProgress(1);
            addToHistory({ type: 'song', method: 'tonejs_procedural', theme, style, genre: style, bpm, duration: comp.duration, provider: 'tonejs', prompt, result: { composition: comp } });
          }
        }
      } else if (engine === 'muse' && MuseService.isConfigured()) {
        // === MUSE ENGINE: muse.top AI — real songs with vocals (14 credits) ===
        // Quick Mode: DeepSeek thinks lyrics from the prompt, then generates a full song.
        // Master Mode: user provides lyrics; muse generates with the chosen style/vocal.
        // Both modes return a taskId that we poll via the backend proxy until done.

        // Credit guard: check if user has enough credits (14 per song)
        let currentCredits = museCredits;
        if (currentCredits === null) {
          try {
            const user = await MuseService.getUser();
            currentCredits = user?.memberInfo?.credit ?? user?.credit ?? 0;
            setMuseCredits(currentCredits);
          } catch {
            currentCredits = 0;
          }
        }
        if (currentCredits < 14) {
          throw new Error(`Muse credits insufficient: ${currentCredits} credits available, 14 required per song. Please purchase more credits or use a different engine.`);
        }

        setGenStage('preview');
        setGenProgress(0.1);
        // Instant Tone.js preview while muse.top generates (so the user hears something).
        const comp = composeMusic({ prompt, style, theme, duration, bpm });
        setComposition(comp);
        playComposition(comp, () => { }, () => { }).catch(() => { });
        setIsPlaying(true);
        setGenProgress(0.25);

        setGenStage('suno_generating');
        setMuseStatus(t('music.muse_submitting'));

        // Build the muse.top request. Map our internal style key to a muse style name.
        const museStyle = MUSE_STYLE_MAP[style] || '';
        const museParams = mode === 'master'
          ? {
            mode: 'master',
            lyrics: lyrics || prompt,
            style: museStyle,
            title: prompt.slice(0, 20) || 'Untitled',
            vocal: '',            // "" = random voice
            instrumental: instrumental ? 1 : 0,
            languageId: 1001,     // 1001 = 中文 (Mandarin)
          }
          : {
            mode: 'quick',
            prompt: prompt || lyrics,  // DeepSeek thinks lyrics from this inspiration
            songModel: 'general',
            instrumental: instrumental ? 1 : 0,
            ...(museStyle ? { style: museStyle } : {}),
          };

        const museGenStep = {
          icon: Headphones,
          title: mode === 'master' ? 'Generating with Muse AI (Master Mode)' : 'Generating with Muse AI (Quick Mode)',
          detail: mode === 'master'
            ? `Style: ${museStyle || 'auto'} · lyrics provided · muse.top generates full song`
            : `DeepSeek thinks lyrics from prompt · muse.top generates full song · 14 credits`,
          status: 'active'
        };
        setThinkingSteps(prev => [...prev, museGenStep]);
        setActiveThinkingStep(thinkingSteps.length);

        try {
          const genResult = await MuseService.generateSong(museParams);
          const taskId = genResult?.taskId || genResult?.workId;
          if (!taskId) {
            throw new Error('Muse did not return a taskId');
          }
          setMuseTaskId(taskId);
          setGenProgress(0.45);
          setMuseStatus(t('music.muse_processing'));

          // Poll the backend proxy until the song is ready (or fails / times out).
          // muse.top generation typically takes 1-3 minutes.
          const finalTask = await MuseService.pollUntilDone(taskId, {
            intervalMs: 6000,
            timeoutMs: 300000,   // 5 min max
            onPoll: (task) => {
              setMuseStatus(`${t('music.muse_processing')}... ${String(task?.status || task?.state || '').slice(0, 24)}`);
            },
          });

          const audioUrl = finalTask?.audioUrl || finalTask?.data?.audioUrl;
          if (!audioUrl) {
            throw new Error(finalTask?.msg || finalTask?.failReason || 'Muse generation produced no audio');
          }

          setMuseAudioUrl(audioUrl);
          setMuseTitle(finalTask?.title || prompt.slice(0, 20) || 'Muse Song');
          setGenStage('complete');
          setGenProgress(1);
          setMuseStatus('');

          setThinkingSteps(prev => prev.map((s, i) =>
            i === thinkingSteps.length
              ? { ...s, detail: `✨ Muse song ready! Title: ${finalTask?.title || 'Untitled'}`, status: 'done' }
              : s
          ));

          // Stop Tone.js preview, switch to the real muse.top CDN audio.
          stopAll();
          setIsPlaying(false);
          const audio = new Audio(audioUrl);
          audio.crossOrigin = 'anonymous';
          audioElementRef.current = audio;

          addToHistory({
            type: 'song',
            method: 'muse_ai',
            theme, style, genre: style, bpm,
            duration: finalTask?.duration || duration,
            provider: 'muse',
            prompt,
            lyrics: lyrics.slice(0, 200),
            title: finalTask?.title || prompt.slice(0, 30),
            audioUrl,
            result: { composition: comp, museTaskId: taskId, museMode: mode },
          });

          // Auto-play the generated song.
          setTimeout(() => {
            if (audioElementRef.current) {
              audioElementRef.current.play().catch(() => { });
              setIsPlaying(true);
            }
          }, 300);
        } catch (museErr) {
          console.error('Muse engine error:', museErr);
          setMuseStatus(`${t('music.muse_failed')}: ${museErr.message}`);
          // Keep Tone.js preview as a fallback so the user still hears something.
          setGenStage('complete');
          setGenProgress(1);
          setThinkingSteps(prev => prev.map((s, i) =>
            i === thinkingSteps.length
              ? { ...s, detail: `⚠️ ${museErr.message}. Using Tone.js preview.`, status: 'done' }
              : s
          ));
          addToHistory({
            type: 'song', method: 'tonejs_procedural', theme, style, genre: style, bpm,
            duration: comp.duration, provider: 'tonejs', prompt,
            result: { composition: comp, museError: museErr.message }
          });
        }
      } else {
        // === TONE.JS ONLY ===
        setGenStage('preview');
        const comp = composeMusic({ prompt, style, theme, duration, bpm });
        setComposition(comp);
        await playComposition(comp, (p) => setGenProgress(p), () => setIsPlaying(false));
        setIsPlaying(true);
        setGenStage('complete');
        setGenProgress(1);
        addToHistory({ type: 'song', method: 'tonejs_procedural', theme, style, genre: style, bpm, duration: comp.duration, provider: 'tonejs', prompt, result: { composition: comp } });
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setError(`${t('common.error')}: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = async () => {
    if ((sunoAudioUrl || museAudioUrl || freeAudioUrl) && audioElementRef.current) {
      audioElementRef.current.play();
      setIsPlaying(true);
    } else if (composition) {
      const currentTime = getPlaybackTime();
      if (currentTime > 0 && !isPlaying) {
        resumePlayback();
        setIsPlaying(true);
      } else {
        await playComposition(composition, () => { }, () => setIsPlaying(false));
        setIsPlaying(true);
      }
    }
  };

  const handlePause = () => {
    if ((sunoAudioUrl || museAudioUrl || freeAudioUrl) && audioElementRef.current) {
      audioElementRef.current.pause();
    } else {
      pausePlayback();
    }
    setIsPlaying(false);
  };

  const handleStop = () => {
    stopAll();
    if (audioElementRef.current) audioElementRef.current.pause();
    setIsPlaying(false);
    setPlayTime(0);
  };

  const handleSkipBack = () => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = 0;
    } else {
      stopAll();
    }
    setIsPlaying(false);
    setPlayTime(0);
  };

  const togglePlay = () => {
    if (isPlaying) handlePause();
    else handlePlay();
  };

  const handleDownload = async () => {
    const audioUrl = sunoAudioUrl || museAudioUrl || freeAudioUrl;
    if (audioUrl) {
      try {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${sunoTitle || museTitle || 'zmusic_track'}_${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } catch (err) {
        window.open(audioUrl, '_blank');
      }
    } else if (composition && !isExporting) {
      setIsExporting(true);
      try {
        const fileName = `${composition.title || 'zmusic_track'}_${Date.now()}.wav`;
        await exportToWav(composition, fileName);
      } catch (err) {
        setError(`${t('common.error')}: ${err.message}`);
      } finally {
        setIsExporting(false);
      }
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const audioUrl = sunoAudioUrl || museAudioUrl || freeAudioUrl;
  const totalDuration = audioUrl
    ? (audioElementRef.current?.duration || composition?.duration || 60)
    : (composition?.duration || 60);
  const progressPercent = totalDuration > 0 ? (playTime / totalDuration) * 100 : 0;

  const generatePlaceholder = () => {
    const idx = Math.floor(Math.random() * INSPIRATION_CHIPS.length);
    setPrompt(INSPIRATION_CHIPS[idx]);
  };

  const displayTitle = sunoAudioUrl ? sunoTitle
    : (museAudioUrl ? museTitle
      : (freeAudioUrl ? (prompt.slice(0, 25) || 'Free Song')
        : (composition?.title || t('music.now_playing'))));
  const sunoAvailable = SunoService.isConfigured();
  const museAvailable = MuseService.isConfigured();

  const isDraggingRef = useRef(false);

  const performSeek = (timeSec) => {
    if (audioElementRef.current && (sunoAudioUrl || museAudioUrl || freeAudioUrl)) {
      audioElementRef.current.currentTime = Math.max(0, Math.min(timeSec, audioElementRef.current.duration || timeSec));
    }
    setPlayTime(Math.max(0, Math.min(timeSec, totalDuration)));
  };

  const handleSeekStart = (e) => {
    e.stopPropagation();
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const seekTime = percent * totalDuration;
    performSeek(seekTime);
    isDraggingRef.current = true;

    const handleMove = (ev) => {
      if (!isDraggingRef.current) return;
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const pct = Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
      performSeek(pct * totalDuration);
    };
    const handleUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleUp);
  };

  const handleSkipForward = () => {
    if (audioElementRef.current) {
      const newTime = Math.min(audioElementRef.current.duration || totalDuration, audioElementRef.current.currentTime + 5);
      audioElementRef.current.currentTime = newTime;
      setPlayTime(newTime);
    } else {
      setPlayTime(prev => Math.min(totalDuration, prev + 5));
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-slide-in pb-32">
      {/* Header */}
      <div className="gradient-border p-4 md:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-white">{t('music.ai_music_generation')}</h1>
              <p className="text-[10px] text-gray-400">
                {engine === 'free' ? '🆓 100% FREE: Edge TTS + MusicGen' :
                  engine === 'suno' ? 'Powered by Suno.cn AI (needs credits)' :
                    engine === 'muse' ? 'Powered by muse.top AI (needs credits)' :
                      engine === 'tonejs' ? 'Powered by Tone.js (free)' :
                        sunoAvailable ? 'Powered by Suno.cn + Tone.js' : 'Powered by Tone.js'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-gray-300"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t('lyrics.history')}</span>
          </button>
        </div>
      </div>

      {/* Main Prompt Area */}
      <div className="gradient-border p-4 md:p-6 space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
            {t('music.tagline')}
          </h2>
        </div>

        {/* Engine Selection */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {ENGINES.map(e => {
            const isActive = engine === e.id;
            const museInsufficient = e.id === 'muse' && museCredits !== null && museCredits < 14;
            const isDisabled = (e.id === 'suno' && !sunoAvailable) || (e.id === 'muse' && (!museAvailable || museInsufficient));
            const museCreditLabel = e.id === 'muse' && museCredits !== null ? ` (${museCredits}cr)` : '';
            return (
              <button
                key={e.id}
                onClick={() => !isDisabled && setEngine(e.id)}
                disabled={isDisabled}
                title={isDisabled
                  ? museInsufficient
                    ? `Muse credits insufficient (${museCredits} available, 14 required)`
                    : `${e.label} not available`
                  : e.desc}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] md:text-[11px] font-medium transition-all ${isActive
                  ? `bg-gradient-to-r ${e.color} text-white shadow-md`
                  : isDisabled
                    ? 'bg-white/[0.02] text-gray-600 border border-white/5 cursor-not-allowed'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                  }`}
              >
                <e.icon className="w-3 h-3" />
                {e.label}{museCreditLabel}
                {e.free && <span className="text-[8px] opacity-80">FREE</span>}
              </button>
            );
          })}
        </div>

        {/* Prompt Input */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('music.prompt_placeholder')}
            className="w-full h-20 md:h-24 bg-white/5 border border-white/10 rounded-xl p-3.5 pr-24 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
          />
          <button
            onClick={generatePlaceholder}
            className="absolute bottom-2.5 right-2.5 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lyrics Input (for Free engine vocals OR Muse Master Mode) */}
        {(engine === 'free' || (engine === 'muse' && mode === 'master')) && (
          <div className="relative">
            <label className="text-[10px] font-medium text-gray-400 mb-1 flex items-center gap-1">
              <Mic className="w-3 h-3" />
              {engine === 'muse'
                ? t('music.muse_lyrics_label')
                : 'Lyrics (for vocals - 100% free via Edge TTS)'}
            </label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder={engine === 'muse'
                ? t('music.muse_lyrics_placeholder')
                : 'Enter lyrics here... e.g. 夏日阳光照耀，海浪轻轻拍岸，我们一起奔跑在沙滩上'}
              className="w-full h-16 md:h-20 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>
        )}

        {/* Inspiration Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">💡 {t('music.inspiration')}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {INSPIRATION_CHIPS.map((chip, i) => (
              <button
                key={i}
                onClick={() => setPrompt(chip)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${prompt === chip
                  ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md shadow-violet-500/20'
                  : 'bg-white/5 text-gray-400 hover:bg-violet-500/10 hover:text-violet-300 border border-white/5'
                  }`}
              >
                {chip.length > 8 ? chip.slice(0, 8) + '...' : chip}
              </button>
            ))}
          </div>
        </div>

        {/* Thinking Panel (Muse-style) */}
        {showThinking && thinkingSteps.length > 0 && (
          <div className="p-3 rounded-xl bg-black/20 border border-violet-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[11px] font-semibold text-violet-300">{t('music.ai_thinking_process')}</span>
              </div>
              <button
                onClick={() => setShowThinking(false)}
                className="text-[10px] text-gray-500 hover:text-gray-300"
              >
                {t('common.hide')}
              </button>
            </div>
            <div className="space-y-1.5">
              {thinkingSteps.map((step, idx) => {
                const isActive = idx === activeThinkingStep;
                const isDone = step.status === 'done';
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 p-2 rounded-lg transition-all ${isActive
                      ? 'bg-violet-500/20 border border-violet-500/40'
                      : isDone
                        ? 'bg-white/[0.02]'
                        : 'bg-white/[0.01]'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${isDone || isActive
                      ? 'bg-gradient-to-br from-violet-500 to-pink-500'
                      : 'bg-white/10'
                      }`}>
                      <Icon className={`w-3 h-3 ${isDone || isActive ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[11px] font-medium ${isActive ? 'text-white' : isDone ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                        {step.title}
                        {isActive && <Loader className="w-3 h-3 inline ml-1 animate-spin" />}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {step.detail}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('quick')}
            className={`p-3 rounded-xl text-left transition-all ${mode === 'quick'
              ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 border-2 border-violet-500/40'
              : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className={`w-3.5 h-3.5 ${mode === 'quick' ? 'text-violet-400' : 'text-gray-500'}`} />
              <span className={`text-xs font-semibold ${mode === 'quick' ? 'text-white' : 'text-gray-400'}`}>
                {t('music.quick_mode')}
              </span>
            </div>
            <p className="text-[10px] text-gray-500">{t('music.quick_mode_desc')}</p>
          </button>
          <button
            onClick={() => setMode('master')}
            className={`p-3 rounded-xl text-left transition-all ${mode === 'master'
              ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 border-2 border-violet-500/40'
              : 'bg-white/5 border border-white/10 hover:border-white/20'
              }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Wand2 className={`w-3.5 h-3.5 ${mode === 'master' ? 'text-violet-400' : 'text-gray-500'}`} />
              <span className={`text-xs font-semibold ${mode === 'master' ? 'text-white' : 'text-gray-400'}`}>
                {t('music.master_mode')}
              </span>
            </div>
            <p className="text-[10px] text-gray-500">{t('music.master_mode_desc')}</p>
          </button>
        </div>

        {/* Master Mode Controls */}
        {mode === 'master' && (
          <div className="space-y-3 p-3 rounded-xl bg-black/20 border border-white/5">
            <div>
              <label className="text-[10px] font-medium text-gray-400 mb-1.5 block">🎨 {t('music.music_style')}</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(MUSIC_STYLES).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${style === s
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                      }`}
                  >
                    {getStyleLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-gray-400 mb-1.5 block">🎭 {t('music.theme')}</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(MUSIC_THEMES).map((th) => (
                  <button
                    key={th}
                    onClick={() => setTheme(th)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${theme === th
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                      }`}
                  >
                    {getThemeLabel(th)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">{t('music.duration_s')}</label>
                <input
                  type="number" value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                  min="10" max="300"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 mb-1 block">{t('music.bpm')}</label>
                <input
                  type="number" value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                  min="60" max="200"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>

            {engine === 'suno' || engine === 'auto' || engine === 'free' || engine === 'muse' ? (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox" checked={instrumental}
                    onChange={(e) => setInstrumental(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-violet-500"
                  />
                  <span className="text-[11px] text-gray-400">{t('music.instrumental_only')}</span>
                </label>

                {engine === 'free' && !instrumental && (
                  <div>
                    <label className="text-[10px] font-medium text-gray-400 mb-1.5 block">🎤 Voice (Free Edge TTS)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'zh-female-soft', label: '晓晓 (温柔女声)' },
                        { id: 'zh-male-calm', label: '云希 (沉稳男声)' },
                        { id: 'zh-female-warm', label: '夏伊 (温暖女声)' },
                        { id: 'zh-male-strong', label: '云扬 (力量男声)' },
                        { id: 'en-female-soft', label: 'Jenny (EN Female)' },
                        { id: 'en-male-calm', label: 'Guy (EN Male)' },
                      ].map(v => (
                        <button
                          key={v.id}
                          onClick={() => setVoice(v.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${voice === v.id
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                            }`}
                        >
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating ||
            (!prompt.trim() && !(engine === 'muse' && mode === 'master' && lyrics.trim())) ||
            (engine === 'muse' && museCredits !== null && museCredits < 14)
          }
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg shadow-purple-500/30 active:scale-[0.98] transition-transform"
        >
          {isGenerating ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              {genStage === 'preparing' ? t('music.preparing') :
                genStage === 'preview' ? t('music.creating_preview') :
                  genStage === 'suno_generating' ? (engine === 'muse' ? (museStatus || t('music.muse_processing')) : (sunoStatus || t('music.suno_processing'))) :
                    t('music.processing')}
            </>
          ) : (
            <>
              <Music className="w-4 h-4" />
              {t('music.generate_song')}
            </>
          )}
        </button>

        {isGenerating && genProgress > 0 && (
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-300"
              style={{ width: `${genProgress * 100}%` }}
            />
          </div>
        )}

        <p className="text-[10px] text-gray-500 text-center">
          {engine === 'free' ? '🆓 100% FREE: Edge TTS vocals + MusicGen music — No paid APIs!' :
            engine === 'suno' ? 'Real song with vocals via Suno.cn (needs credits)' :
              engine === 'muse' ? 'Real song with vocals via muse.top AI (14 credits)' :
                engine === 'tonejs' ? 'Instant procedural music via Tone.js (free)' :
                  sunoAvailable ? 'Hybrid: Tone.js preview → Suno.cn real song' :
                    'Procedural music generation'}
        </p>
      </div>

      {
        error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            {error}
          </div>
        )
      }

      {/* Works Gallery */}
      {
        musicHistory.length > 0 && (
          <div className="gradient-border p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                📜 {t('music.works_gallery')}
              </h3>
              {musicHistory.length > 2 && (
                <button
                  onClick={() => setShowWorksGallery(!showWorksGallery)}
                  className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {showWorksGallery ? (t('common.collapse') || '收起 ▲') : `+${musicHistory.length - 2} ${(t('common.more') || '更多 ▼')}`}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {displayedWorks.map((item, idx) => {
                const itemTitle = item.title || item.result?.composition?.title || item.prompt?.slice(0, 30) || 'Untitled';
                const itemStyle = item.style || item.genre || '';
                const itemDuration = item.duration ? `${item.duration}s` : '';
                const isSuno = item.method === 'suno_cn';
                const isMuse = item.method === 'muse_ai';
                return (
                  <div
                    key={item.id || idx}
                    className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 border border-violet-500/30 cursor-pointer hover:border-violet-400/50 transition-colors"
                  >
                    <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-violet-600/30 to-pink-600/30 mb-2 flex items-center justify-center relative overflow-hidden">
                      <img
                        src={item.coverArtUrl || historyCovers[idx] || ''}
                        alt={itemTitle}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Music className="w-8 h-8 text-violet-400 opacity-50" />
                      </div>
                      {isSuno && (
                        <span className="absolute top-1 right-1 px-1 py-0.5 rounded bg-violet-500/80 text-[8px] text-white font-bold">SUNO</span>
                      )}
                      {isMuse && (
                        <span className="absolute top-1 right-1 px-1 py-0.5 rounded bg-fuchsia-500/80 text-[8px] text-white font-bold">MUSE</span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-white truncate">{itemTitle}</div>
                    <div className="text-[10px] text-gray-400 truncate">
                      {itemStyle && getStyleLabel(itemStyle)} {itemDuration}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      }

      {/* Bottom Player Bar */}
      {
        (composition || isPlaying || sunoAudioUrl || museAudioUrl || freeAudioUrl) && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="max-w-lg mx-auto px-4 pb-3">
              <div className="gradient-border bg-gray-900/80 backdrop-blur-md p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/20">
                    <img
                      src={coverArtUrlMuse || coverArtUrlSuno || coverArtUrl || ''}
                      alt={displayTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{displayTitle}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400 font-mono">{formatTime(playTime)}</span>
                      <div
                        className="flex-1 h-4 flex items-center cursor-pointer group relative"
                        onMouseDown={(e) => handleSeekStart(e)}
                        onTouchStart={(e) => handleSeekStart(e)}
                      >
                        <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden group-hover:h-1.5 transition-all">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 relative"
                            style={{ width: `${progressPercent}%` }}
                          >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" />
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">{formatTime(totalDuration)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={handleSkipBack}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 active:scale-95 transition-all"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <button
                      onClick={handleSkipForward}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={isExporting}
                      title={t('music.download')}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-violet-500/20 flex items-center justify-center text-gray-300 hover:text-violet-300 transition-colors disabled:opacity-50"
                    >
                      {isExporting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        filterType="song"
      />
    </div >
  );
}

export default MusicPage;
