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

function createPNG(width, height) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0);
    for (let x = 0; x < width; x++) {
      const cx = width / 2, cy = height / 2;
      const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
      const maxDist = Math.sqrt(cx * cx + cy * cy);
      const t = dist / maxDist;

      let r, g, b;
      if (t < 0.35) {
        const tt = t / 0.35;
        r = Math.round(216 + (139 - 216) * tt);
        g = Math.round(180 + (92 - 180) * tt);
        b = Math.round(254 + (246 - 254) * tt);
      } else if (t < 0.7) {
        const tt = (t - 0.35) / 0.35;
        r = Math.round(139 + (79 - 139) * tt);
        g = Math.round(92 + (70 - 92) * tt);
        b = Math.round(246 + (229 - 246) * tt);
      } else {
        const tt = (t - 0.7) / 0.3;
        r = Math.round(79 * (1 - tt));
        g = Math.round(70 * (1 - tt));
        b = Math.round(229 * (1 - tt));
      }

      const glowFactor = Math.max(0, 1 - t);
      r = Math.min(255, Math.round(r + glowFactor * 30));
      g = Math.min(255, Math.round(g + glowFactor * 20));
      b = Math.min(255, Math.round(b + glowFactor * 40));

      rawData.push(r, g, b, 255);
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
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

console.log('Generating app icons...');

androidSizes.forEach(({ size, dir }) => {
  const androidDir = path.join(__dirname, '../android/app/src/main/res', dir);
  if (!fs.existsSync(androidDir)) {
    fs.mkdirSync(androidDir, { recursive: true });
  }
  const buffer = createPNG(size, size);
  fs.writeFileSync(path.join(androidDir, 'ic_launcher.png'), buffer);
  console.log(`  Android ${dir}: ${size}x${size}`);
});

iosSizes.forEach(size => {
  const iosDir = path.join(__dirname, '../ios/App/App/Assets.xcassets/AppIcon.appiconset');
  if (!fs.existsSync(iosDir)) {
    fs.mkdirSync(iosDir, { recursive: true });
  }
  const buffer = createPNG(size, size);
  fs.writeFileSync(path.join(iosDir, `icon_${size}x${size}.png`), buffer);
  console.log(`  iOS: ${size}x${size}`);
});

electronSizes.forEach(size => {
  const buffer = createPNG(size, size);
  fs.writeFileSync(path.join(iconDir, `icon-${size}.png`), buffer);
  console.log(`  Electron: ${size}x${size}`);
});

const webDir = path.join(__dirname, '../public');
if (!fs.existsSync(webDir)) {
  fs.mkdirSync(webDir, { recursive: true });
}
fs.writeFileSync(path.join(webDir, 'logo192.png'), createPNG(192, 192));
fs.writeFileSync(path.join(webDir, 'logo512.png'), createPNG(512, 512));
console.log('  Web: logo192.png, logo512.png');

console.log('\n✅ All icons generated successfully!');