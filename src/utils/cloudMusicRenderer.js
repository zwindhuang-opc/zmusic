const HF_API_URL = 'https://api-inference.huggingface.co/models/facebook/musicgen-medium';

const STYLE_PROMPTS = {
  pop: 'pop music, upbeat, catchy melody, modern production',
  rock: 'rock music, electric guitar, heavy drums, powerful',
  electronic: 'electronic music, synthwave, digital, bass drops',
  hip_hop: 'hip hop, beat, bassline, urban, street',
  ballad: 'ballad, piano, acoustic guitar, strings, emotional',
  chinese_traditional: 'chinese traditional music, guzheng, erhu, classical',
  jazz: 'jazz music, saxophone, trumpet, piano, swing',
  classical: 'classical music, orchestra, violin, cello, symphony',
  rnb: 'rnb, soul, piano, bass, drums, smooth',
  country: 'country music, acoustic guitar, banjo, fiddle',
  heartbreaking: 'sad ballad, minor key, crying piano, emotional',
  healing: 'ambient, gentle piano, calming, peaceful, ethereal',
  time_travel: 'retro synthwave, nostalgic, 80s vibes, futuristic',
  epic: 'cinematic, orchestra, choir, dramatic, heroic',
  dark: 'gothic, minor key, haunting, heavy bass, mysterious',
  romantic: 'love song, piano, strings, sweet, tender',
  nostalgic: 'retro, 90s pop, warm piano, sentimental, vintage',
  energetic: 'upbeat, dance, electronic, party, high energy',
  dreamy: 'ethereal, ambient, reverb, floating, magical',
  modern: 'contemporary, trendy, minimalist, clean production',
  ancient: 'chinese folk, guzheng, traditional, elegant'
};

function getHFToken() {
  try {
    return localStorage.getItem('zmusic_hf_token') || '';
  } catch {
    return '';
  }
}

export function setHFToken(token) {
  try {
    localStorage.setItem('zmusic_hf_token', token);
  } catch {}
}

export function hasHFToken() {
  return !!getHFToken();
}

export async function renderMusicWithAI(composition, onProgress) {
  const token = getHFToken();
  if (!token) {
    throw new Error('no-hf-token');
  }

  const stylePrompt = STYLE_PROMPTS[composition.style] || 'instrumental music';
  const themePrompt = composition.theme || '';
  const titlePrompt = composition.title || '';

  const fullPrompt = buildHFPrompt(composition, stylePrompt, themePrompt, titlePrompt);

  onProgress?.(0.2, 'Connecting to MusicGen...');

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 256,
          do_sample: true,
          temperature: 0.8,
          guidance_scale: 7.5
        }
      }),
      signal: AbortSignal.timeout(120000)
    });

    if (response.status === 503) {
      onProgress?.(0.5, 'Model loading, retrying...');
      await new Promise(r => setTimeout(r, 5000));
      return renderMusicWithAI(composition, onProgress);
    }

    if (!response.ok) {
      throw new Error(`HF API error: ${response.status} ${response.statusText}`);
    }

    onProgress?.(0.8, 'Processing audio...');

    const contentType = response.headers.get('content-type') || '';
    let blob;

    if (contentType.includes('audio')) {
      blob = await response.blob();
    } else {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data.audio) {
          const audioData = atob(data.audio);
          const arr = new Uint8Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) arr[i] = audioData.charCodeAt(i);
          blob = new Blob([arr], { type: 'audio/wav' });
        } else {
          throw new Error('No audio data in response');
        }
      } catch {
        throw new Error('Unexpected response format from HF API');
      }
    }

    const url = URL.createObjectURL(blob);
    onProgress?.(1, 'Complete');

    return { blob, url, duration: composition.duration, source: 'huggingface' };
  } catch (err) {
    console.warn('[cloudMusicRenderer] HF API failed:', err.message);
    throw err;
  }
}

function buildHFPrompt(composition, stylePrompt, themePrompt, titlePrompt) {
  const sectionDesc = composition.sections.map((s, i) => {
    const chords = s.chords.join(', ');
    const instruments = s.instruments.join(', ');
    return `Section ${i + 1} (${s.name}, ${s.bars} bars): ${instruments}. Chords: ${chords}. Mood: ${s.mood}.`;
  }).join(' ');

  return [
    `Title: ${titlePrompt}`,
    `Style: ${stylePrompt}`,
    `Theme: ${themePrompt}`,
    `Tempo: ${composition.tempo} BPM`,
    `Key: ${composition.key} ${composition.scale}`,
    `Duration: ${composition.duration} seconds`,
    `Structure: ${sectionDesc}`,
    'Instrumental music only, no vocals. Professional production.'
  ].join('. ');
}

const HF_MODELS = [
  { id: 'facebook/musicgen-medium', name: 'MusicGen Medium (recommended)', size: '1.5B', quality: 'high' },
  { id: 'facebook/musicgen-small', name: 'MusicGen Small', size: '300M', quality: 'medium' },
  { id: 'stabilityai/stable-audio-open-1.0', name: 'Stable Audio Open', size: '1B', quality: 'high' }
];

export function getHFModels() {
  return HF_MODELS;
}
