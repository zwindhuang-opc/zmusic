const esbuild = require('esbuild');
const fs = require('fs');
const code = fs.readFileSync('src/pages/LyricsPage.jsx', 'utf-8');

// Test with different line ranges
const lines = code.split('\n');

// Test lines 1-900
const part1 = lines.slice(0, 900).join('\n');
esbuild.transform(part1, { loader: 'jsx' }).then(r => console.log('Lines 1-900: OK')).catch(e => console.log('Lines 1-900: ERR:', e.message.substring(0, 200)));

// Test lines 900-1600
const part2 = lines.slice(900, 1600).join('\n');
esbuild.transform(part2, { loader: 'jsx' }).then(r => console.log('Lines 900-1600: OK')).catch(e => console.log('Lines 900-1600: ERR:', e.message.substring(0, 200)));

// Test lines 1600-end
const part3 = lines.slice(1600).join('\n');
esbuild.transform(part3, { loader: 'jsx' }).then(r => console.log('Lines 1600-end: OK')).catch(e => console.log('Lines 1600-end: ERR:', e.message.substring(0, 200)));

// Test lines 1-1600
const part12 = lines.slice(0, 1600).join('\n');
esbuild.transform(part12, { loader: 'jsx' }).then(r => console.log('Lines 1-1600: OK')).catch(e => console.log('Lines 1-1600: ERR:', e.message.substring(0, 200)));