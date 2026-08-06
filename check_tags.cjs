const fs = require('fs');
const code = fs.readFileSync('src/pages/LyricsPage.jsx', 'utf-8');

// Track JSX tag nesting
const lines = code.split('\n');
const tagStack = [];
const issues = [];

for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];
  const lineNum = lineIdx + 1;
  
  // Find all JSX tags on this line
  // Match <TagName, </TagName, <TagName/, <TagName ... >
  const tagRegex = /<(\/?)(\w+)[\s\S]*?(\/?)>/g;
  let match;
  
  while ((match = tagRegex.exec(line)) !== null) {
    const isClosing = match[1] === '/';
    const tagName = match[2];
    const isSelfClosing = match[3] === '/';
    
    if (isSelfClosing) continue; // <br />, <img />, etc.
    
    if (isClosing) {
      // Check if this matches the top of the stack
      if (tagStack.length === 0) {
        issues.push(`Line ${lineNum}: Closing </${tagName}> without matching opening tag`);
      } else {
        const top = tagStack[tagStack.length - 1];
        if (top.name === tagName) {
          tagStack.pop();
        } else {
          issues.push(`Line ${lineNum}: Closing </${tagName}> but expected </${top.name}> (opened at line ${top.line})`);
        }
      }
    } else {
      tagStack.push({ name: tagName, line: lineNum });
    }
  }
}

if (issues.length > 0) {
  console.log('JSX tag issues found:');
  issues.forEach(i => console.log('  ' + i));
} else {
  console.log('No JSX tag issues found');
}

if (tagStack.length > 0) {
  console.log('\nUnclosed tags:');
  tagStack.forEach(t => console.log(`  <${t.name}> opened at line ${t.line}`));
} else {
  console.log('\nAll tags properly closed');
}