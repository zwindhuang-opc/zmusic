const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpColor(c1, c2, t) {
  return [Math.round(lerp(c1[0], c2[0], t)), Math.round(lerp(c1[1], c2[1], t)), Math.round(lerp(c1[2], c2[2], t))];
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function smoothstep(e0, e1, x) { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
function dist(x1, y1, x2, y2) { return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2); }

function isInRoundedRect(x, y, rx, ry, rw, rh, radius) {
  const left = rx + radius, right = rx + rw - radius;
  const top = ry + radius, bottom = ry + rh - radius;
  if (x >= left && x <= right && y >= ry && y <= ry + rh) return true;
  if (x >= rx && x <= rx + rw && y >= top && y <= bottom) return true;
  const corners = [[left, top], [right, top], [left, bottom], [right, bottom]];
  for (const [cx, cy] of corners) { if (dist(x, y, cx, cy) <= radius) return true; }
  return false;
}

function isInEllipse(x, y, cx, cy, rx, ry) {
  const nx = (x - cx) / rx, ny = (y - cy) / ry;
  return nx * nx + ny * ny <= 1;
}

function isInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function sdSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 0.0001) return dist(px, py, x1, y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  return dist(px, py, x1 + t * dx, y1 + t * dy);
}

function renderIcon(size) {
  const pixels = [];
  const cx = size / 2, cy = size / 2;
  const s = size / 1024;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size, ny = y / size;

      const cornerRad = 230 * s;
      const inSquircle = isInRoundedRect(x, y, 0, 0, size, size, cornerRad);

      if (!inSquircle) {
        pixels.push(0, 0, 0, 0);
        continue;
      }

      const gradAngle = Math.PI * 0.7;
      const projGrad = (nx - 0.5) * Math.cos(gradAngle) + (ny - 0.5) * Math.sin(gradAngle);
      const t = clamp(projGrad + 0.5, 0, 1);

      const c1 = [67, 20, 115];
      const c2 = [139, 92, 246];
      const c3 = [196, 132, 252];

      let bg = lerpColor(c1, c2, t * 0.6);
      bg = lerpColor(bg, c3, t * 0.4);

      const dFromCenter = dist(x, y, cx, cy) / (size * 0.55);
      const glowT = clamp(1 - dFromCenter, 0, 1);
      const glow = glowT * glowT * 0.4;
      bg[0] = Math.min(255, Math.round(bg[0] + glow * 50));
      bg[1] = Math.min(255, Math.round(bg[1] + glow * 25));
      bg[2] = Math.min(255, Math.round(bg[2] + glow * 70));

      const noise = (((x * 7 + y * 13) % 100) / 100 - 0.5) * 6;
      bg[0] = clamp(bg[0] + noise, 0, 255);
      bg[1] = clamp(bg[1] + noise, 0, 255);
      bg[2] = clamp(bg[2] + noise, 0, 255);

      let r = bg[0], g = bg[1], b = bg[2];

      const zTopY = cy - 210 * s;
      const zBotY = cy + 210 * s;
      const zLeft = cx - 140 * s;
      const zRight = cx + 140 * s;
      const zThick = 56 * s;

      const dTop = sdSegment(x, y, zLeft, zTopY, zRight, zTopY);
      const dDiag = sdSegment(x, y, zRight - zThick * 0.3, zTopY + zThick * 0.5, zLeft + zThick * 0.3, zBotY - zThick * 0.5);
      const dBot = sdSegment(x, y, zLeft, zBotY, zRight, zBotY);

      const dZ = Math.min(dTop, dDiag, dBot);
      const zHalfThick = zThick / 2;
      const inZ = dZ < zHalfThick;

      const noteHeadCX = cx - 80 * s;
      const noteHeadCY = cy + 150 * s;
      const noteHeadRX = 80 * s;
      const noteHeadRY = 60 * s;

      const inNoteHead = isInEllipse(x, y, noteHeadCX, noteHeadCY, noteHeadRX, noteHeadRY);

      const stemX = cx + 60 * s;
      const stemTopY = cy - 210 * s;
      const stemBotY = noteHeadCY;
      const stemWidth = 28 * s;
      const inStem = x >= stemX - stemWidth / 2 && x <= stemX + stemWidth / 2 && y >= stemTopY && y <= stemBotY + 10 * s;

      const flagTopY = stemTopY;
      const flagPts = [
        [stemX - stemWidth / 2, flagTopY],
        [stemX + stemWidth / 2, flagTopY],
        [stemX + stemWidth / 2 + 90 * s, flagTopY + 50 * s],
        [stemX + stemWidth / 2 + 70 * s, flagTopY + 100 * s],
        [stemX + stemWidth / 2 + 50 * s, flagTopY + 80 * s],
        [stemX + stemWidth / 2, flagTopY + 60 * s],
        [stemX - stemWidth / 2, flagTopY + 50 * s]
      ];
      const inFlag = isInPolygon(x, y, flagPts);

      const inIcon = inZ || inNoteHead || inStem || inFlag;

      if (inIcon) {
        const lightProj = (ny - 0.5) * (-1) + 0.3;
        const highlight = clamp(lightProj, 0, 1) * 0.15;

        r = 255;
        g = 255;
        b = 255;

        r = Math.min(255, Math.round(r + highlight * 20 - 10));
        g = Math.min(255, Math.round(g + highlight * 15 - 5));
        b = Math.min(255, Math.round(b + highlight * 30));

        const dFromIcon = Math.min(dZ - zHalfThick,
          inNoteHead ? 0 : dist(x, y, noteHeadCX, noteHeadCY) - noteHeadRX);
        const shadowDist = clamp(-dFromIcon / (15 * s), 0, 1);
        r = Math.round(r * (1 - shadowDist * 0.15));
        g = Math.round(g * (1 - shadowDist * 0.15));
        b = Math.round(b * (1 - shadowDist * 0.15));
      }

      const edgeDist = Math.min(x, y, size - 1 - x, size - 1 - y);
      if (edgeDist < 4 * s) {
        const edgeAlpha = smoothstep(0, 4 * s, edgeDist);
        r = Math.round(r * edgeAlpha);
        g = Math.round(g * edgeAlpha);
        b = Math.round(b * edgeAlpha);
      }

      pixels.push(r, g, b, 255);
    }
  }

  return pixels;
}

function createPNG(width, height, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0);
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x++) {
      const idx = rowStart + x * 4;
      rawData.push(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]);
    }
  }

  const compressed = zlib.deflateSync(Buffer.from(rawData));
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0))
  ]);
}

function generateIcon(size) {
  const pixels = renderIcon(size);
  return createPNG(size, size, pixels);
}

const androidSizes = [
  { size: 48, dir: 'mipmap-mdpi' },
  { size: 72, dir: 'mipmap-hdpi' },
  { size: 96, dir: 'mipmap-xhdpi' },
  { size: 144, dir: 'mipmap-xxhdpi' },
  { size: 192, dir: 'mipmap-xxxhdpi' }
];

const iosSizes = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024];
const electronSizes = [16, 24, 32, 48, 64, 128, 256, 512];

const iconDir = path.join(__dirname, '../resources/icons');
if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true });

console.log('Generating premium app icons...');

androidSizes.forEach(({ size, dir }) => {
  const androidDir = path.join(__dirname, '../android/app/src/main/res', dir);
  if (!fs.existsSync(androidDir)) fs.mkdirSync(androidDir, { recursive: true });
  fs.writeFileSync(path.join(androidDir, 'ic_launcher.png'), generateIcon(size));
  fs.writeFileSync(path.join(androidDir, 'ic_launcher_round.png'), generateIcon(size));
  console.log(`  Android ${dir}: ${size}x${size}`);
});

const androidAnydpi = path.join(__dirname, '../android/app/src/main/res/mipmap-anydpi-v26');
if (!fs.existsSync(androidAnydpi)) fs.mkdirSync(androidAnydpi, { recursive: true });

const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`;

fs.writeFileSync(path.join(androidAnydpi, 'ic_launcher.xml'), adaptiveXml);
fs.writeFileSync(path.join(androidAnydpi, 'ic_launcher_round.xml'), adaptiveXml);

const valuesDir = path.join(__dirname, '../android/app/src/main/res/values');
if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });
fs.writeFileSync(path.join(valuesDir, 'ic_launcher_colors.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#431473</color>\n</resources>`);
const oldBgFile = path.join(valuesDir, 'ic_launcher_background.xml');
if (fs.existsSync(oldBgFile)) fs.unlinkSync(oldBgFile);

const drawableDir = path.join(__dirname, '../android/app/src/main/res/drawable');
if (!fs.existsSync(drawableDir)) fs.mkdirSync(drawableDir, { recursive: true });
fs.writeFileSync(path.join(drawableDir, 'ic_launcher_foreground.png'), generateIcon(512));

iosSizes.forEach(size => {
  const iosDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset');
  if (!fs.existsSync(iosDir)) fs.mkdirSync(iosDir, { recursive: true });
  fs.writeFileSync(path.join(iosDir, `icon_${size}x${size}.png`), generateIcon(size));
  console.log(`  iOS: ${size}x${size}`);
});

const iosDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset');
if (fs.existsSync(iosDir)) {
  const iosContents = {
    "images": iosSizes.map(size => ({
      "size": `${size}x${size}`,
      "idiom": "universal",
      "filename": `icon_${size}x${size}.png`,
      "platform": "ios",
      "scale": "1x"
    })),
    "info": { "version": 1, "author": "xcode" }
  };
  fs.writeFileSync(path.join(iosDir, 'Contents.json'), JSON.stringify(iosContents, null, 2));
}

electronSizes.forEach(size => {
  fs.writeFileSync(path.join(iconDir, `icon-${size}.png`), generateIcon(size));
  console.log(`  Electron: ${size}x${size}`);
});

const webDir = path.join(__dirname, '../public');
if (!fs.existsSync(webDir)) fs.mkdirSync(webDir, { recursive: true });
fs.writeFileSync(path.join(webDir, 'logo192.png'), generateIcon(192));
fs.writeFileSync(path.join(webDir, 'logo512.png'), generateIcon(512));
fs.writeFileSync(path.join(webDir, 'favicon.png'), generateIcon(64));
console.log('  Web: logo192.png, logo512.png, favicon.png');

const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'logo192.png'), generateIcon(192));
  fs.writeFileSync(path.join(distDir, 'logo512.png'), generateIcon(512));
  fs.writeFileSync(path.join(distDir, 'favicon.png'), generateIcon(64));
}

console.log('\n✅ Premium icons generated!');
console.log('   Design: Purple gradient squircle + white Z + music note');
console.log('   Colors: Deep violet (#431473) → Purple (#8B5CF6) → Light (#C084FC)');
