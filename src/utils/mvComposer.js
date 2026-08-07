/**
 * MV Composer — Real MV video generation via Canvas + MediaRecorder.
 *
 * This module composes actual downloadable music videos by:
 *   1. Rendering animated visual scenes on a <canvas> element (gradients,
 *      particles, lyric text, light effects, etc.)
 *   2. Playing music via HTMLAudioElement (from Tone.js or a CDN URL)
 *   3. Recording the canvas + audio stream via MediaRecorder into a WebM file
 *
 * Supports 20+ color palettes and 6 scene renderers (gradient, concert, rain,
 * cyberpunk, ink-wash, starry) with 75+ scene name mappings. Visual effects
 * include light leaks, lens flares, glitch, vignette, grain, chromatic aberration,
 * strobe, light trails, and sparkle.
 *
 * No server-side ffmpeg needed — pure client-side WebM video generation.
 *
 * @module utils/mvComposer
 * @version 1.0.0
 */

// ──────────────────────────────────────────────────────────────────────────────
// Color palettes (gradients) — mapped from mvEngine.js palette names
// ──────────────────────────────────────────────────────────────────────────────
const PALETTES = {
  purple_pink_gradient: ['#8b5cf6', '#ec4899', '#f9a8d4'],
  red_black_contrast: ['#dc2626', '#1f1f1f', '#f87171'],
  gold_red_jade: ['#d4a574', '#c41e3a', '#00a86b'],
  neon_cyber: ['#06b6d4', '#8b5cf6', '#ec4899'],
  urban_gold: ['#92400e', '#d97706', '#fbbf24'],
  soft_pastel: ['#f9a8d4', '#c4b5fd', '#fca5a5'],
  warm_brown_gold: ['#78350f', '#d97706', '#fcd34d'],
  dark_blue_gold: ['#1e3a5f', '#d4a574', '#60a5fa'],
  deep_purple_blue: ['#4c1d95', '#1e40af', '#7c3aed'],
  warm_yellow: ['#ca8a04', '#facc15', '#fef08a'],
  pink_rose: ['#f472b6', '#fb7185', '#fda4af'],
  green_landscape: ['#065f46', '#14b8a6', '#6ee7b7'],
  stage_red_blue: ['#dc2626', '#2563eb', '#f87171'],
  blue_gray_cool: ['#475569', '#94a3b8', '#0ea5e9'],
  blue_orange_contrast: ['#2563eb', '#ea580c', '#f97316'],
  brown_yellow_vintage: ['#92400e', '#ca8a04', '#fbbf24'],
  pink_blue_dream: ['#f472b6', '#60a5fa', '#a78bfa'],
  black_red_purple: ['#18181b', '#dc2626', '#a855f7'],
  cold_blue: ['#1e3a5f', '#3b82f6', '#93c5fd'],
  cinematic_teal: ['#0f766e', '#0891b2', '#22d3ee'],
};

// ──────────────────────────────────────────────────────────────────────────────
// Scene visual renderers — each draws one animation loop
// Each function takes (ctx, time, width, height, config) and draws one frame.
// Time is in seconds (can use for smooth animations).
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Draw an animated gradient background with floating particles.
 * This is the default scene renderer, suitable for most "studio", "closeup",
 * "smoke", and other abstract/performance scene names.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
 * @param {number} t - Current time in seconds (for animation)
 * @param {number} w - Canvas width in pixels
 * @param {number} h - Canvas height in pixels
 * @param {string[]} colors - Color palette array (hex strings)
 * @param {Object} [config={}] - Rendering configuration
 * @param {number} [config.particleCount=40] - Number of floating particles
 * @param {string[]} [config.particleColors] - Particle color RGBA strings
 * @param {Object} [reactive={}] - Music-reactive frequency data
 * @param {number} [reactive.bass=0] - Normalized bass frequency level (0-1)
 * @param {number} [reactive.mid=0] - Normalized mid frequency level (0-1)
 * @param {number} [reactive.treble=0] - Normalized treble frequency level (0-1)
 * @param {number} [reactive.level=0] - Overall frequency level average (0-1)
 */
function drawGradientScene(ctx, t, w, h, colors, config = {}, reactive = {}) {
  const { bass = 0, mid = 0 } = reactive;
  const cx = w / 2;
  const cy = h / 2;

  // Animated radial gradient - hue modulated by mid frequencies
  const angle = t * 0.3 + mid * 0.5;
  const hueShift = mid * 30;
  const grad = ctx.createLinearGradient(
    cx + Math.cos(angle) * w / 2,
    cy + Math.sin(angle) * h / 2,
    cx - Math.cos(angle) * w / 2,
    cy - Math.sin(angle) * h / 2
  );
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.5, colors[1] || colors[0]);
  grad.addColorStop(1, colors[2] || colors[1] || colors[0]);
  ctx.globalAlpha = 0.85 + mid * 0.15;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;

  // Floating particles - size scaled by bass
  const count = config.particleCount || 40;
  const particleColors = config.particleColors || ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)'];
  const sizeScale = 1 + bass * 0.8;
  for (let i = 0; i < count; i++) {
    const phase = (i * 1.37) % (Math.PI * 2);
    const speed = 0.5 + (i % 7) * 0.15;
    const radius = (2 + (i % 5)) * sizeScale;
    const px = cx + Math.cos(t * speed + phase) * (w * 0.35);
    const py = cy + Math.sin(t * speed * 0.8 + phase) * (h * 0.35);
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = particleColors[i % particleColors.length];
    ctx.fill();
  }
}

/**
 * Draw a concert/stage scene with sweeping light beams and crowd silhouettes.
 * Suitable for "concert", "stage", "dance_hall", "orchestra" scenes.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
 * @param {number} t - Current time in seconds
 * @param {number} w - Canvas width in pixels
 * @param {number} h - Canvas height in pixels
 * @param {string[]} colors - Color palette for light beams
 * @param {Object} [config={}] - Rendering configuration (unused, for API consistency)
 * @param {Object} [reactive={}] - Music-reactive frequency data
 * @param {number} [reactive.bass=0] - Normalized bass frequency level (0-1)
 * @param {number} [reactive.level=0] - Overall frequency level average (0-1)
 */
function drawConcertScene(ctx, t, w, h, colors, config = {}, reactive = {}) {
  const { bass = 0, level = 0 } = reactive;

  // Dark background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);

  // Stage lights sweeping - brightness scaled by overall level
  const lightCount = 5;
  const brightnessScale = 1 + level * 2;
  for (let i = 0; i < lightCount; i++) {
    const baseAngle = (i / lightCount) * Math.PI - Math.PI / 2;
    const sway = Math.sin(t * 0.8 + i * 0.7) * 0.4;
    const angle = baseAngle + sway + bass * 0.2;
    const lightLen = Math.max(w, h) * 0.6;
    const alpha0 = Math.min(1, (0x66 / 255) * brightnessScale);
    const alphaHex = Math.floor(alpha0 * 255).toString(16).padStart(2, '0');
    const grad = ctx.createLinearGradient(w / 2, 0, w / 2 + Math.cos(angle) * lightLen, Math.sin(angle) * lightLen);
    grad.addColorStop(0, colors[i % colors.length] + alphaHex);
    grad.addColorStop(1, colors[i % colors.length] + '00');
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2 + Math.cos(angle - 0.15) * lightLen, Math.sin(angle - 0.15) * lightLen);
    ctx.lineTo(w / 2 + Math.cos(angle + 0.15) * lightLen, Math.sin(angle + 0.15) * lightLen);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Crowd silhouettes at bottom - jump with bass
  const bassJump = bass * 15;
  ctx.fillStyle = '#000000';
  for (let i = 0; i < w; i += 12) {
    const bh = 20 + Math.sin(i * 0.1 + t * 0.5) * 8 + (i % 5) * 3 + bassJump * (0.5 + (i % 3) * 0.25);
    ctx.beginPath();
    ctx.arc(i + 6, h - 15 - bh, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(i, h - 15 - bh, 12, 15 + bh);
  }
  // Crowd highlight - more frequent with higher overall level
  const highlightChance = 0.01 + level * 0.05;
  for (let i = 0; i < w; i += 12) {
    if (Math.random() < highlightChance) {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(i + 6, h - 10, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Draw a rain/water scene with animated raindrops and water ripples.
 * Suitable for "rain", "rain_scene", "window" scenes.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
 * @param {number} t - Current time in seconds
 * @param {number} w - Canvas width in pixels
 * @param {number} h - Canvas height in pixels
 * @param {string[]} colors - Color palette for cloudy gradient
 * @param {Object} [config={}] - Rendering configuration (unused)
 * @param {Object} [reactive={}] - Music-reactive frequency data
 * @param {number} [reactive.bass=0] - Normalized bass frequency level (0-1)
 * @param {number} [reactive.mid=0] - Normalized mid frequency level (0-1)
 */
function drawRainScene(ctx, t, w, h, colors, config = {}, reactive = {}) {
  const { bass = 0, mid = 0 } = reactive;

  // Dark cloudy gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, colors[0] || '#1e293b');
  grad.addColorStop(1, colors[1] || '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Lightning-like flash on strong bass
  if (bass > 0.6) {
    ctx.fillStyle = `rgba(255, 255, 255, ${(bass - 0.6) * 0.6})`;
    ctx.fillRect(0, 0, w, h);
  }

  // Rain drops - speed scaled by mid frequencies
  const dropCount = 150;
  const speedScale = 1 + mid * 2;
  ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
  ctx.lineWidth = 1;
  for (let i = 0; i < dropCount; i++) {
    const x = (i * 13.7 + t * 200 * speedScale) % w;
    const y = (i * 23.1 + t * 600 * speedScale) % h;
    const dropLen = 10 * (1 + mid * 0.5);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y + dropLen);
    ctx.stroke();
  }

  // Water ripple at bottom - more active with bass
  const rippleAmp = 1 + bass * 2;
  ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
  for (let i = 0; i < 5; i++) {
    const waveY = h - 20 + Math.sin(t * 2 * speedScale + i) * 5 * rippleAmp;
    ctx.beginPath();
    ctx.moveTo(0, waveY);
    for (let x = 0; x <= w; x += 10) {
      ctx.lineTo(x, waveY + Math.sin(x * 0.05 + t * 2 * speedScale + i) * 3 * rippleAmp);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  }
}

/**
 * Draw a neon/cyberpunk scene with perspective grid, retro sun, and scan lines.
 * Suitable for "club", "city_night", "neon_street", "car_chase", "rooftop".
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
 * @param {number} t - Current time in seconds
 * @param {number} w - Canvas width in pixels
 * @param {number} h - Canvas height in pixels
 * @param {string[]} colors - Color palette for grid and sun
 * @param {Object} [config={}] - Rendering configuration (unused)
 * @param {Object} [reactive={}] - Music-reactive frequency data
 * @param {number} [reactive.bass=0] - Normalized bass frequency level (0-1)
 * @param {number} [reactive.treble=0] - Normalized treble frequency level (0-1)
 */
function drawCyberScene(ctx, t, w, h, colors, config = {}, reactive = {}) {
  const { bass = 0, treble = 0 } = reactive;

  // Dark bg
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, w, h);

  // Glitch offset with bass
  const glitchOffset = bass * 8 * (Math.random() - 0.5);
  const horizon = h * 0.5 + glitchOffset * 2;

  // Neon brightness pulse with treble
  const neonScale = 1 + treble;

  // Grid floor perspective - neon line brightness pulses with treble
  const baseAlpha = Math.floor(0x66 * neonScale);
  ctx.strokeStyle = colors[0] + Math.min(255, baseAlpha).toString(16).padStart(2, '0');
  ctx.lineWidth = 1 + treble;
  // Vertical grid lines
  for (let i = -10; i <= 10; i++) {
    const lineGlitch = (i % 2 === 0) ? glitchOffset : -glitchOffset;
    ctx.beginPath();
    ctx.moveTo(w / 2 + lineGlitch, horizon);
    ctx.lineTo(w / 2 + i * (w / 5) + lineGlitch, h);
    ctx.stroke();
  }
  // Horizontal grid lines (animated)
  for (let i = 0; i < 8; i++) {
    const y = horizon + Math.pow((i + (t * 2) % 2) / 8, 2) * (h - horizon) + glitchOffset;
    const lineAlpha = Math.min(255, Math.floor((255 - i * 30) * neonScale));
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.strokeStyle = colors[i % colors.length] + lineAlpha.toString(16).padStart(2, '0');
    ctx.stroke();
  }

  // Sun/horizon circle
  const sunR = Math.min(w, h) * 0.15 * (1 + treble * 0.15);
  const sunY = horizon - sunR * 0.3;
  const sunGrad = ctx.createLinearGradient(w / 2, sunY - sunR, w / 2, sunY + sunR);
  sunGrad.addColorStop(0, colors[1] || '#ec4899');
  sunGrad.addColorStop(1, colors[0] || '#06b6d4');
  ctx.fillStyle = sunGrad;
  ctx.globalAlpha = 0.9 + treble * 0.1;
  ctx.beginPath();
  ctx.arc(w / 2, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Scan lines - intensify with bass
  ctx.fillStyle = `rgba(0,0,0,${0.2 + bass * 0.2})`;
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y + glitchOffset, w, 1);
  }
}

/**
 * Draw an ink-wash / Chinese traditional painting scene with rice paper
 * background, layered mountains, and a glowing moon.
 * Suitable for "palace", "garden", "mountain", "moon", "bamboo_forest".
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
 * @param {number} t - Current time in seconds
 * @param {number} w - Canvas width in pixels
 * @param {number} h - Canvas height in pixels
 * @param {string[]} colors - Color palette (used minimally for moon glow)
 * @param {Object} [config={}] - Rendering configuration (unused)
 * @param {Object} [reactive={}] - Music-reactive frequency data
 * @param {number} [reactive.level=0] - Overall frequency level average (0-1)
 */
function drawInkWashScene(ctx, t, w, h, colors, config = {}, reactive = {}) {
  const { level = 0 } = reactive;
  const swirlScale = 1 + level * 0.15;
  const swirlRot = level * 0.1;

  // Rice paper background
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, w, h);

  // Ink mountains - scaled and slightly rotated with level
  ctx.fillStyle = '#1a1a1a';
  ctx.globalAlpha = 0.6;
  // Far mountain
  ctx.beginPath();
  ctx.moveTo(0, h * 0.65);
  for (let x = 0; x <= w; x += 5) {
    const phaseShift = swirlRot * x;
    const y = h * 0.65 - Math.sin(x * 0.008 + t * 0.1 + phaseShift) * 40 * swirlScale - Math.sin(x * 0.02) * 20 * swirlScale;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Middle mountain
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.75);
  for (let x = 0; x <= w; x += 5) {
    const phaseShift = swirlRot * x * 0.5;
    const y = h * 0.75 - Math.sin(x * 0.015 + 1 + phaseShift) * 30 * swirlScale - Math.cos(x * 0.01) * 15 * swirlScale;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Near mountain (darkest)
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.85);
  for (let x = 0; x <= w; x += 5) {
    const phaseShift = swirlRot * x * 0.3;
    const y = h * 0.85 - Math.sin(x * 0.025 + 2 + phaseShift) * 20 * swirlScale - Math.cos(x * 0.03) * 10 * swirlScale;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Moon - glow size pulses with overall level
  ctx.globalAlpha = 1;
  const moonX = w * 0.75 + Math.sin(t * 0.1 + swirlRot * 10) * 20 * swirlScale;
  const moonY = h * 0.2;
  const moonRadius = 30 * swirlScale;
  const moonGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonRadius);
  moonGrad.addColorStop(0, '#fffbe6');
  moonGrad.addColorStop(0.5, '#fef3c7');
  moonGrad.addColorStop(1, 'rgba(254,243,199,0)');
  ctx.fillStyle = moonGrad;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw a starry night scene with twinkling stars, nebula glow, and deep space gradient.
 * Suitable for "starry_sky", "sunset", "field", "starry" scenes.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
 * @param {number} t - Current time in seconds
 * @param {number} w - Canvas width in pixels
 * @param {number} h - Canvas height in pixels
 * @param {string[]} colors - Color palette for nebula/gradient
 * @param {Object} [config={}] - Rendering configuration (unused)
 * @param {Object} [reactive={}] - Music-reactive frequency data
 * @param {number} [reactive.bass=0] - Normalized bass frequency level (0-1)
 * @param {number} [reactive.treble=0] - Normalized treble frequency level (0-1)
 * @param {number} [reactive.level=0] - Overall frequency level average (0-1)
 */
function drawStarryScene(ctx, t, w, h, colors, config = {}, reactive = {}) {
  const { bass = 0, treble = 0, level = 0 } = reactive;

  // Deep space gradient
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
  grad.addColorStop(0, colors[0] || '#1e1b4b');
  grad.addColorStop(0.5, colors[1] || '#312e81');
  grad.addColorStop(1, colors[2] || '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Twinkling stars - brighter with treble
  const starCount = 200;
  const trebleBoost = 1 + treble * 1.5;
  for (let i = 0; i < starCount; i++) {
    const sx = (i * 17.3) % w;
    const sy = (i * 31.7) % h;
    const baseBrightness = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i));
    const brightness = Math.min(1, baseBrightness * trebleBoost);
    const size = ((i % 3) + 0.5) * (1 + level * 0.3);
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
    ctx.beginPath();
    ctx.arc(sx, sy, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shooting stars on bass spikes (bass > 0.5)
  if (bass > 0.5) {
    const shootCount = Math.floor(bass * 5);
    ctx.strokeStyle = `rgba(255, 255, 255, ${bass})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < shootCount; i++) {
      const sx = (i * 137.5 + t * 100) % w;
      const sy = (i * 89.3) % (h * 0.6);
      const trailLen = 60 + bass * 40;
      const angle = Math.PI * 0.25 + i * 0.1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(angle) * trailLen, sy + Math.sin(angle) * trailLen);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, bass + 0.3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Nebula glow - pulses with overall level
  const nebX = w * 0.3 + Math.sin(t * 0.2) * 50;
  const nebY = h * 0.4;
  const nebAlpha = 0.3 + level * 0.3;
  const nebGrad = ctx.createRadialGradient(nebX, nebY, 0, nebX, nebY, w * 0.4);
  nebGrad.addColorStop(0, `rgba(139, 92, 246, ${nebAlpha})`);
  nebGrad.addColorStop(0.5, `rgba(139, 92, 246, ${nebAlpha * 0.35})`);
  nebGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
  ctx.fillStyle = nebGrad;
  ctx.fillRect(0, 0, w, h);
}

/** Map scene names to render functions */
const SCENE_RENDERERS = {
  studio: drawGradientScene,
  street: drawGradientScene,
  closeup: drawGradientScene,
  crowd: drawGradientScene,
  sunset: drawStarryScene,
  concert: drawConcertScene,
  stage: drawConcertScene,
  smoke: drawGradientScene,
  lights: drawConcertScene,
  club: drawCyberScene,
  city_night: drawCyberScene,
  neon_street: drawCyberScene,
  vr_world: drawCyberScene,
  laser: drawCyberScene,
  palace: drawInkWashScene,
  garden: drawInkWashScene,
  mountain: drawInkWashScene,
  moon: drawInkWashScene,
  river: drawInkWashScene,
  rain: drawRainScene,
  window: drawRainScene,
  candle: drawGradientScene,
  letter: drawGradientScene,
  bar: drawGradientScene,
  saxophone: drawGradientScene,
  whiskey: drawGradientScene,
  piano: drawGradientScene,
  concert_hall: drawConcertScene,
  orchestra: drawConcertScene,
  conductor: drawConcertScene,
  violin: drawConcertScene,
  mirror: drawGradientScene,
  car: drawCyberScene,
  studio_alt: drawGradientScene,
  money: drawGradientScene,
  rooftop: drawCyberScene,
  country_road: drawGradientScene,
  field: drawStarryScene,
  cabin: drawGradientScene,
  guitar: drawGradientScene,
  couple: drawGradientScene,
  flower_sea: drawGradientScene,
  candlelight: drawGradientScene,
  love_letter: drawGradientScene,
  bamboo_forest: drawInkWashScene,
  lotus_pond: drawInkWashScene,
  guqin: drawInkWashScene,
  calligraphy: drawInkWashScene,
  mountain_water: drawInkWashScene,
  city_skyline: drawCyberScene,
  glass_wall: drawCyberScene,
  subway: drawCyberScene,
  elevator: drawGradientScene,
  car_chase: drawCyberScene,
  slow_motion: drawGradientScene,
  rain_scene: drawRainScene,
  silhouette: drawGradientScene,
  vinyl_record: drawGradientScene,
  cassette: drawGradientScene,
  neon_sign: drawCyberScene,
  vintage_tv: drawGradientScene,
  dance_hall: drawConcertScene,
  cherry_blossom: drawGradientScene,
  starry_sky: drawStarryScene,
  seaside: drawGradientScene,
  school: drawGradientScene,
  summer_festival: drawConcertScene,
  castle: drawGradientScene,
  cross: drawGradientScene,
  bats: drawGradientScene,
  fog: drawGradientScene,
};

/**
 * Get the appropriate scene renderer function for a given scene name.
 * Falls back to drawGradientScene for unknown scene names.
 *
 * @param {string} sceneName - Scene identifier (e.g. "studio", "concert", "rain")
 * @returns {Function} Render function matching (ctx, t, w, h, colors, config)
 */
function getSceneRenderer(sceneName) {
  return SCENE_RENDERERS[sceneName] || drawGradientScene;
}

/**
 * Overlay lyrics text on the canvas with multi-line fade-in/fade-out animation.
 * Lyrics are paginated by time, with configurable lines per page and fade duration.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
 * @param {string} lyrics - Full lyrics text (newlines separate lines)
 * @param {number} t - Current time in seconds
 * @param {number} w - Canvas width in pixels
 * @param {number} h - Canvas height in pixels
 * @param {Object} [config={}] - Lyrics overlay configuration
 * @param {number} [config.fontSize] - Font size in pixels (auto-calculated from height)
 * @param {number} [config.fadeDuration=2] - Fade duration in seconds per line
 * @param {number} [config.linesPerPage=4] - Number of lyric lines visible at once
 */
function drawLyricsOverlay(ctx, lyrics, t, w, h, config = {}) {
  if (!lyrics) return;

  const fontSize = config.fontSize || Math.floor(h * 0.045);
  const fadeDuration = config.fadeDuration || 2;
  const linesPerPage = config.linesPerPage || 4;

  // Split lyrics into lines
  const allLines = lyrics.split(/\n/).filter(l => l.trim());
  if (allLines.length === 0) return;

  // Calculate which page of lyrics to show based on time
  const pageDuration = fadeDuration * linesPerPage * 2;
  const currentPage = Math.floor(t / pageDuration);
  const pages = [];
  for (let i = 0; i < allLines.length; i += linesPerPage) {
    pages.push(allLines.slice(i, i + linesPerPage));
  }
  const page = pages[currentPage % pages.length];
  const localT = t % pageDuration;

  // Position lyrics at bottom third of screen
  const startY = h * 0.75;
  const lineHeight = fontSize * 1.4;

  // Background semi-transparent strip
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  const stripH = lineHeight * linesPerPage + 40;
  ctx.fillRect(0, startY - 20, w, stripH);

  // Draw each line with fade-in/out
  ctx.textAlign = 'center';
  ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif`;

  page.forEach((line, i) => {
    const lineT = localT - i * fadeDuration * 2;
    let alpha = 1;
    if (lineT < 0 || lineT > fadeDuration * 2) {
      alpha = 0;
    } else if (lineT < fadeDuration) {
      alpha = lineT / fadeDuration; // fade in
    } else if (lineT > fadeDuration) {
      alpha = Math.max(0, 1 - (lineT - fadeDuration) / fadeDuration); // fade out
    }

    const y = startY + i * lineHeight;
    // Text shadow
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillText(line, w / 2 + 2, y + 2);
    // Main text
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillText(line, w / 2, y);
  });
}

/**
 * Draw visual effect overlays on the canvas.
 * Supports: light_leak, lens_flare, glitch, vignette, grain, chromatic,
 * strobe, light_trails, sparkle.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
 * @param {number} t - Current time in seconds
 * @param {number} w - Canvas width in pixels
 * @param {number} h - Canvas height in pixels
 * @param {string[]} [effects=[]] - Array of effect names to apply
 * @param {Object} [reactive={}] - Music-reactive frequency data
 * @param {number} [reactive.bass=0] - Normalized bass frequency level (0-1)
 * @param {number} [reactive.mid=0] - Normalized mid frequency level (0-1)
 * @param {number} [reactive.treble=0] - Normalized treble frequency level (0-1)
 * @param {number} [reactive.level=0] - Overall frequency level average (0-1)
 * @param {boolean} [beat=false] - Whether a beat was detected on this frame
 */
function drawEffectOverlay(ctx, t, w, h, effects = [], reactive = {}, beat = false) {
  const { bass = 0, level = 0, treble = 0 } = reactive;
  for (const effect of effects) {
    switch (effect) {
      case 'light_leak': {
        const leakIntensity = 1 + level * 0.8;
        const x = (Math.sin(t * 0.4 + bass * 0.5) * 0.3 + 0.5) * w;
        const y = (Math.cos(t * 0.3 + bass * 0.5) * 0.3 + 0.5) * h;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, w * 0.4);
        grad.addColorStop(0, `rgba(255, 200, 100, ${0.2 * leakIntensity})`);
        grad.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        break;
      }
      case 'lens_flare': {
        const flareIntensity = 1 + level;
        const x = w * 0.2 + Math.sin(t * 0.5) * 100;
        const y = h * 0.3 + Math.cos(t * 0.5) * 50;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 80 * (1 + bass * 0.3));
        grad.addColorStop(0, `rgba(255, 255, 255, ${0.3 * flareIntensity})`);
        grad.addColorStop(0.5, `rgba(255, 200, 150, ${0.15 * flareIntensity})`);
        grad.addColorStop(1, 'rgba(255, 200, 150, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        break;
      }
      case 'glitch': {
        // Occasional color shift - amplified by bass or beat
        if (Math.sin(t * 8) > 0.95 || bass > 0.7 || beat) {
          const glitchAmt = beat ? 0.15 : 0.08 + bass * 0.1;
          ctx.fillStyle = `rgba(255, 0, 0, ${glitchAmt})`;
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = `rgba(0, 255, 255, ${glitchAmt})`;
          ctx.fillRect(0, 0, w, h);
        }
        break;
      }
      case 'vignette': {
        const vignetteStrength = 0.5 + level * 0.2;
        const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, `rgba(0, 0, 0, ${vignetteStrength})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        break;
      }
      case 'grain': {
        // Film grain noise - density increases with treble
        const grainChance = 0.05 + treble * 0.1;
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (Math.random() < grainChance) {
            const noise = (Math.random() - 0.5) * 40 * (1 + level * 0.5);
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
          }
        }
        ctx.putImageData(imgData, 0, 0);
        break;
      }
      case 'chromatic': {
        // Subtle RGB split - stronger on beat or high bass
        if (Math.sin(t * 3) > 0.7 || bass > 0.6 || beat) {
          const splitAmt = beat ? 6 : (3 + bass * 3);
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = `rgba(255, 0, 100, ${0.05 + bass * 0.05})`;
          ctx.fillRect(splitAmt, 0, w, h);
          ctx.fillStyle = `rgba(0, 200, 255, ${0.05 + bass * 0.05})`;
          ctx.fillRect(-splitAmt, 0, w, h);
          ctx.globalCompositeOperation = 'source-over';
        }
        break;
      }
      case 'strobe': {
        // Strobe triggers on sin wave or beat detection
        if (Math.sin(t * 15) > 0.95 || beat) {
          const strobeAlpha = beat ? 0.4 : 0.3;
          ctx.fillStyle = `rgba(255, 255, 255, ${strobeAlpha})`;
          ctx.fillRect(0, 0, w, h);
        }
        break;
      }
      case 'light_trails': {
        // Draw streaking lights - speed and count increase with level
        const trailCount = 8 + Math.floor(level * 8);
        const speedScale = 1 + level;
        for (let i = 0; i < trailCount; i++) {
          const lx = ((t * 200 * speedScale + i * 100) % (w + 200)) - 100;
          const ly = h * 0.2 + i * (h * 0.08) + Math.sin(t + i + bass * 2) * 30;
          const grad = ctx.createLinearGradient(lx - 100, ly, lx + 100, ly);
          grad.addColorStop(0, 'rgba(255, 200, 50, 0)');
          grad.addColorStop(0.5, `rgba(255, 200, 50, ${0.4 + level * 0.4})`);
          grad.addColorStop(1, 'rgba(255, 200, 50, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 3 + treble * 2;
          ctx.beginPath();
          ctx.moveTo(lx - 100, ly);
          ctx.lineTo(lx + 100, ly);
          ctx.stroke();
        }
        break;
      }
      case 'sparkle': {
        const sparkleCount = 20 + Math.floor(treble * 30);
        for (let i = 0; i < sparkleCount; i++) {
          const sx = (i * 83 + t * 30 * (1 + level)) % w;
          const sy = (i * 47 + t * 20 * (1 + level)) % h;
          const sparkle = Math.abs(Math.sin(t * 4 + i));
          const sparkleThreshold = beat ? 0.5 : (0.8 - treble * 0.3);
          if (sparkle > sparkleThreshold) {
            ctx.fillStyle = `rgba(255, 255, 255, ${sparkle * (1 + level * 0.5)})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 2 + treble, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }
      // soft_focus, bokeh, slow_zoom, etc. are handled by the renderer itself
      default:
        break;
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Main MV generation function — composes real video via Canvas + MediaRecorder
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Generate a real MV video file by composing animated canvas scenes with music.
 *
 * @param {Object} options
 * @param {string} options.audioUrl - URL of the music to use (CDN URL or blob URL)
 * @param {Object[]} options.timeline - Array of scene objects from mvEngine
 * @param {string} options.colorPalette - Palette key (e.g. 'purple_pink_gradient')
 * @param {string[]} options.effects - Effect names to overlay
 * @param {string} [options.lyrics=''] - Lyrics text to overlay on video
 * @param {number} [options.duration] - Duration in seconds (auto from timeline)
 * @param {number} [options.width=1280] - Canvas width
 * @param {number} [options.height=720] - Canvas height
 * @param {number} [options.fps=30] - Frame rate for recording
 * @param {Function} [options.onProgress] - Progress callback (0-1)
 * @returns {Promise<Blob>} WebM video blob that can be downloaded
 */
export async function generateMVVideo({
  audioUrl,
  timeline,
  colorPalette = 'purple_pink_gradient',
  effects = [],
  lyrics = '',
  duration,
  width = 1280,
  height = 720,
  fps = 30,
  onProgress,
}) {
  // Determine total duration
  if (!duration && timeline.length > 0) {
    duration = timeline[timeline.length - 1].endTime;
  }
  if (!duration || duration <= 0) {
    duration = 30; // Minimum 30s
  }

  const colors = PALETTES[colorPalette] || PALETTES.purple_pink_gradient;

  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Create audio element
  const audio = new Audio();
  audio.src = audioUrl;
  audio.crossOrigin = 'anonymous';
  audio.loop = false;
  audio.preload = 'auto';

  // Wait for audio to be ready
  await new Promise((resolve, reject) => {
    const onCanPlay = () => { cleanup(); resolve(); };
    const onError = (e) => { cleanup(); reject(new Error('Failed to load audio: ' + (e?.message || 'unknown'))); };
    const cleanup = () => {
      audio.removeEventListener('canplaythrough', onCanPlay);
      audio.removeEventListener('error', onError);
    };
    audio.addEventListener('canplaythrough', onCanPlay, { once: true });
    audio.addEventListener('error', onError, { once: true });
    // Timeout after 10 seconds
    setTimeout(() => {
      cleanup();
      resolve(); // Proceed anyway — audio might play but canplaythrough never fires
    }, 10000);
  });

  // Capture canvas stream
  const canvasStream = canvas.captureStream(fps);

  /** @type {AudioContext|null} Web Audio API context for frequency analysis */
  let audioCtx = null;
  /** @type {MediaElementAudioSourceNode|null} Source node wrapping the <audio> element */
  let audioSrc = null;
  /** @type {AnalyserNode|null} AnalyserNode for real-time frequency data extraction */
  let analyser = null;

  // Try to capture audio stream and set up frequency analysis
  let combinedStream;
  try {
    // Create an audio context to capture the audio element's stream + analyse frequencies
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Create MediaElementSourceNode to read from the <audio> element
    audioSrc = audioCtx.createMediaElementSource(audio);

    // Create AnalyserNode for frequency-domain data extraction
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    // Create MediaStreamDestination for recording the audio track
    const dest = audioCtx.createMediaStreamDestination();

    // Audio graph: audioSrc -> analyser -> (audioCtx.destination for hearing + dest for recording)
    audioSrc.connect(analyser);
    analyser.connect(dest);
    analyser.connect(audioCtx.destination);

    // Combine canvas + audio streams
    combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    // Resume audio context (required in some browsers after user gesture)
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
  } catch (e) {
    // Audio capture failed (e.g. CORS on audio URL) — fall back to video-only
    console.warn('Audio capture / analyser setup failed, recording video only:', e.message);
    combinedStream = canvasStream;
    analyser = null;
  }

  /**
   * Sample the current frequency spectrum from the AnalyserNode and return
   * normalized band levels (bass / mid / treble / overall level).
   * Returns zeros if analyser is unavailable.
   *
   * @returns {{bass:number, mid:number, treble:number, level:number}}
   *   Normalized frequency band levels, each in range [0, 1].
   *   bass = first 25% of bins, mid = middle 50%, treble = last 25%.
   *   level = average of the three bands.
   */
  function getFrequencyData() {
    if (!analyser) return { bass: 0, mid: 0, treble: 0, level: 0 };
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    const len = dataArray.length;
    // Bass = first 1/4 bins, Mid = middle 1/2, Treble = last 1/4
    let bass = 0, mid = 0, treble = 0;
    for (let i = 0; i < len; i++) {
      if (i < len * 0.25) bass += dataArray[i];
      else if (i < len * 0.75) mid += dataArray[i];
      else treble += dataArray[i];
    }
    bass = bass / (len * 0.25) / 255;
    mid = mid / (len * 0.5) / 255;
    treble = treble / (len * 0.25) / 255;
    const level = (bass + mid + treble) / 3;
    return { bass, mid, treble, level };
  }

  // Set up MediaRecorder
  const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  let mimeType = '';
  for (const mt of mimeTypes) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(mt)) {
      mimeType = mt;
      break;
    }
  }

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: mimeType || undefined,
    videoBitsPerSecond: 5_000_000, // 5 Mbps
  });

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingDone = new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };
  });

  // Start audio first, wait for it to be ready, then start recording
  audio.currentTime = 0;
  await audio.play().catch(() => { /* CORS autoplay blocked — video only */ });

  // Now start recording (audio is already playing)
  recorder.start(100); // Collect data every 100ms

  // Render loop — use audio.currentTime for sync
  const startTime = performance.now();
  let rafId;
  let finished = false;
  let lastAudioTime = 0;
  /** @type {number} Previous-frame bass level for beat detection (onset) */
  let prevBass = 0;

  const renderFrame = () => {
    // Use audio.currentTime for sync when possible, fallback to performance.now()
    const currentAudioTime = !audio.paused && !audio.ended ? audio.currentTime : lastAudioTime;
    const elapsed = currentAudioTime > 0 ? currentAudioTime : (performance.now() - startTime) / 1000;

    if (currentAudioTime > 0) lastAudioTime = currentAudioTime;

    // Get music-reactive frequency data
    const reactive = getFrequencyData();

    // Simple beat detection: bass onset (sudden increase > 0.35 delta)
    const beat = (reactive.bass - prevBass > 0.35);
    prevBass = reactive.bass;

    // Find active scene
    const sceneTime = elapsed % duration;
    const activeScene = timeline.find(s => sceneTime >= s.startTime && sceneTime < s.endTime) || timeline[0];

    // Render the scene
    const sceneName = activeScene?.scene || 'studio';
    const renderer = getSceneRenderer(sceneName);
    const sceneColors = activeScene?.effects ? colors : colors;
    // Pass local time within current scene for animation
    const localT = sceneTime - (activeScene?.startTime || 0);

    renderer(ctx, localT, width, height, sceneColors, {
      particleCount: 50,
      particleColors: ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.3)'],
    }, reactive);

    // Draw effects overlay (with reactive data and beat flag)
    drawEffectOverlay(ctx, elapsed, width, height, activeScene?.effects || effects, reactive, beat);

    // Beat flash overlay (1 frame of low-opacity white on detected beat)
    if (beat) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw lyrics
    if (lyrics) {
      drawLyricsOverlay(ctx, lyrics, elapsed, width, height, {
        fontSize: Math.floor(height * 0.045),
        fadeDuration: 2,
        linesPerPage: 4,
      });
    }

    // Progress callback
    if (onProgress) {
      onProgress(Math.min(1, elapsed / duration));
    }

    // Check if recording duration is up
    if (elapsed >= duration + 0.5) {
      finished = true;
      recorder.stop();
      audio.pause();
      return;
    }

    rafId = requestAnimationFrame(renderFrame);
  };

  rafId = requestAnimationFrame(renderFrame);

  // Wait for recording to finish
  const videoBlob = await recordingDone;

  // Cleanup
  cancelAnimationFrame(rafId);
  audio.pause();
  audio.src = '';
  canvas.width = 0;
  canvas.height = 0;

  // Cleanup Web Audio nodes (best effort — GC should handle rest)
  try {
    if (analyser) { analyser.disconnect(); }
    if (audioSrc) { audioSrc.disconnect(); }
    if (audioCtx && audioCtx.state !== 'closed') { audioCtx.close(); }
  } catch (e) { /* noop */ }

  // Stop all tracks
  try {
    canvasStream.getTracks().forEach(t => t.stop());
    combinedStream.getTracks().forEach(t => t.stop());
  } catch (e) { /* noop */ }

  return videoBlob;
}

/**
 * Generate a simple tone.js-based MV without needing any external audio.
 * Uses procedural audio synthesis + canvas animation simultaneously.
 *
 * @param {Object} options
 * @param {string} options.genre - Music genre for scene selection
 * @param {number} options.duration - Duration in seconds
 * @param {string} options.colorPalette - Visual palette
 * @param {string[]} options.effects - Visual effects
 * @param {string} [options.lyrics=''] - Lyrics overlay
 * @param {function} [options.onProgress] - Progress callback
 * @returns {Promise<{blob:Blob, audioUrl:string, videoUrl:string}>}
 */
export async function generateMVFromToneJS({
  genre = 'pop',
  duration = 30,
  colorPalette = 'purple_pink_gradient',
  effects = [],
  lyrics = '',
  onProgress,
}) {
  // Import composeMusic dynamically to avoid circular deps
  const { composeMusic } = await import('../utils/musicComposer.js');
  const { exportToWav } = await import('../utils/audioEngine.js');

  // Generate procedural audio
  const composition = composeMusic({
    prompt: `${genre} music`,
    style: genre,
    theme: 'general',
    duration,
    bpm: 120,
  });

  // Export to WAV
  const wavBlob = exportToWav(composition);
  const audioUrl = URL.createObjectURL(wavBlob);

  // Build a simple timeline for the genre
  const { generateMV } = await import('../utils/mvEngine.js');
  const mvData = generateMV({ genre, duration, colorPalette, effects });

  // Generate the video
  const videoBlob = await generateMVVideo({
    audioUrl,
    timeline: mvData.timeline,
    colorPalette: mvData.colorPalette || colorPalette,
    effects,
    lyrics,
    duration,
    onProgress,
  });

  const videoUrl = URL.createObjectURL(videoBlob);

  return { blob: videoBlob, videoUrl, audioUrl, composition };
}
