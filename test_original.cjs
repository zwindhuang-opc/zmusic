const esbuild = require('esbuild');
const fs = require('fs');

// Read the original file from git
const { execSync } = require('child_process');
const original = execSync('git show HEAD:src/pages/LyricsPage.jsx', { encoding: 'utf-8' });

esbuild.transform(original, { 
  loader: 'jsx',
  jsx: 'automatic',
}).then(result => {
  console.log('Original file: SUCCESS');
}).catch(err => {
  console.log('Original file: ERROR:', err.message.substring(0, 200));
});

// Read the current file
const current = fs.readFileSync('src/pages/LyricsPage.jsx', 'utf-8');

esbuild.transform(current, { 
  loader: 'jsx',
  jsx: 'automatic',
}).then(result => {
  console.log('Current file: SUCCESS');
}).catch(err => {
  console.log('Current file: ERROR:', err.message.substring(0, 200));
});