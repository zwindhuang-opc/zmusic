const esbuild = require('esbuild');
const fs = require('fs');
const code = fs.readFileSync('src/pages/LyricsPage.jsx', 'utf-8');

esbuild.transform(code, { 
  loader: 'jsx',
  jsx: 'automatic',
  minify: false
}).then(result => {
  console.log('SUCCESS');
}).catch(err => {
  console.log('ERROR:', err.message);
  console.log('Location:', err.location);
  if (err.message.includes('Unterminated')) {
    const lines = code.split('\n');
    const line = err.location.line;
    const col = err.location.column;
    console.log('Context around the error:');
    for (let i = Math.max(0, line - 3); i < Math.min(lines.length, line + 3); i++) {
      const marker = i === line - 1 ? '>>>' : '   ';
      console.log(`${marker} ${i + 1}: ${lines[i]}`);
    }
    // Show character codes around the error
    const targetLine = lines[line - 1];
    console.log('\nCharacter codes at error location:');
    for (let i = Math.max(0, col - 5); i < Math.min(targetLine.length, col + 5); i++) {
      console.log(`  pos ${i}: char='${targetLine[i]}' code=${targetLine.charCodeAt(i)}`);
    }
  }
});