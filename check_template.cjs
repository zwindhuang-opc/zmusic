const fs = require('fs');
const code = fs.readFileSync('src/pages/LyricsPage.jsx', 'utf-8');

// Find all backtick positions
const backtickPositions = [];
let inTemplateLiteral = false;
let templateStart = -1;
let braceDepth = 0;

for (let i = 0; i < code.length; i++) {
  const ch = code[i];
  
  if (!inTemplateLiteral) {
    if (ch === '`') {
      inTemplateLiteral = true;
      templateStart = i;
    }
  } else {
    if (ch === '$' && code[i + 1] === '{') {
      braceDepth++;
      i++; // skip the '{'
    } else if (ch === '}') {
      braceDepth--;
      if (braceDepth < 0) {
        // This is the closing } of the template literal
        // Actually, we need to track nested braces properly
      }
    } else if (ch === '`' && braceDepth <= 0) {
      // Found the closing backtick
      const content = code.substring(templateStart + 1, i);
      if (content.includes('${') === false && content.includes('/')) {
        console.log(`Possible regex-like template literal at pos ${templateStart}-${i}:`);
        console.log(`  Content: "${content.substring(0, 100)}"`);
      }
      inTemplateLiteral = false;
      templateStart = -1;
    }
  }
}

if (inTemplateLiteral) {
  console.log(`Unterminated template literal starting at pos ${templateStart}`);
  console.log(`  Content preview: "${code.substring(templateStart, templateStart + 200)}"`);
  
  // Find line number
  const before = code.substring(0, templateStart);
  const lineNum = before.split('\n').length;
  console.log(`  Line number: ${lineNum}`);
}