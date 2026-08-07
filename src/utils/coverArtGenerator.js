/**
 * Procedural album cover art generator.
 * Creates unique Canvas-based cover images for each song so they display artwork instead of icons.
 * Uses color palettes derived from genre/mood and geometric patterns.
 */

/**
 * Generate a canvas-based album cover as a data URL (image/png).
 * @param {Object} opts
 * @param {string} opts.title - Song title (used for text rendering on cover)
 * @param {string} [opts.genre='pop'] - Music genre (influences color palette)
 * @param {string} [opts.style] - Visual style preference
 * @param {number} [opts.size=512] - Square image size in pixels
 * @returns {string} Data URL (image/png)
 */
export function generateCoverArt({ title, genre = 'pop', style, size = 512 }) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const palettes = {
    pop: ['#ff6b9d', '#c94b84', '#7b2d8e', '#3a1c71'],
    electronic: ['#00f5ff', '#0099ff', '#6b21ff', '#1a0033'],
    rock: ['#ff4141', '#d32f2f', '#7b1fa2', '#1a1a2e'],
    jazz: ['#ffc857', '#ff8c42', '#e63946', '#1d3557'],
    classical: ['#e8d5b7', '#c9a66b', '#7a5230', '#2d2d2d'],
    hiphop: ['#ff6b35', '#f7c948', '#e63946', '#0d1b2a'],
    ambient: ['#8ecae6', '#219ebc', '#023047', '#ffb703'],
    folk: ['#dda15e', '#bc6c25', '#606c38', '#283618'],
    rnb: ['#ff0081', '#7928ca', '#00dfd8', '#ff7b00'],
    cinematic: ['#14213d', '#fca311', '#e5e5e5', '#000000'],
    default: ['#667eea', '#764ba2', '#f093fb', '#4facfe'],
  };

  const palette = palettes[genre?.toLowerCase()] || palettes.default;
  const seed = hashString(title || 'song');
  const rng = mulberry32(seed);

  const angle = rng() * Math.PI * 2;
  const grad = ctx.createLinearGradient(
    size / 2 + Math.cos(angle) * size, size / 2 + Math.sin(angle) * size,
    size / 2 - Math.cos(angle) * size, size / 2 - Math.sin(angle) * size
  );
  grad.addColorStop(0, palette[0]);
  grad.addColorStop(0.5, palette[2]);
  grad.addColorStop(1, palette[3] || palette[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.globalAlpha = 0.35;

  const circleCount = 3 + Math.floor(rng() * 4);
  for (let i = 0; i < circleCount; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = (0.1 + rng() * 0.3) * size;
    const grad2 = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad2.addColorStop(0, palette[1] + 'cc');
    grad2.addColorStop(1, palette[1] + '00');
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 8; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const s = (0.02 + rng() * 0.08) * size;
    ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
    const shape = Math.floor(rng() * 3);
    if (shape === 0) {
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === 1) {
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y - s);
      ctx.lineTo(x + s, y + s);
      ctx.lineTo(x - s, y + s);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;

  const displayTitle = (title || 'Untitled').trim();
  const words = displayTitle.split(/\s+/);

  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxFontSize = size * 0.11;
  const minFontSize = size * 0.05;
  let fontSize = maxFontSize;

  const maxWidth = size * 0.8;
  let lines = [];
  if (words.length <= 2) {
    lines = words;
  } else {
    const mid = Math.ceil(words.length / 2);
    lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  }

  while (fontSize > minFontSize) {
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const widths = lines.map(l => ctx.measureText(l).width);
    if (Math.max(...widths) <= maxWidth || lines.length <= 1) break;
    fontSize -= 2;
  }

  const totalTextHeight = lines.length * fontSize * 1.3;
  const startY = (size - totalTextHeight) / 2 + fontSize / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line.toUpperCase(), size / 2, startY + i * fontSize * 1.3);
  });

  ctx.font = `600 ${size * 0.035}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText((genre || 'ZMusic').toUpperCase(), size / 2, size * 0.92);

  return canvas.toDataURL('image/png');
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateThumbnailCover({ title, genre = 'pop', size = 128 }) {
  return generateCoverArt({ title, genre, size });
}