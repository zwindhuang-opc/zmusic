import re
import sys

with open('src/pages/LyricsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all JSX tags (simplified)
# We'll look for <tag ...> and </tag> patterns
lines = content.split('\n')
stack = []

for i, line in enumerate(lines, 1):
    # Find all opening tags (not self-closing, not fragments)
    for m in re.finditer(r'<(\w+)(?:\s[^>]*)?>', line):
        tag = m.group(1)
        full = m.group(0)
        # Skip self-closing tags
        if full.endswith('/>'):
            continue
        # Skip if it's actually a closing tag (shouldn't match the regex)
        if full.startswith('</'):
            continue
        stack.append((tag, i, line.strip()[:80]))
    
    # Find all closing tags
    for m in re.finditer(r'</(\w+)>', line):
        tag = m.group(1)
        if stack and stack[-1][0] == tag:
            stack.pop()
        elif stack:
            expected_tag, expected_line, expected_content = stack[-1]
            print(f"MISMATCH at line {i}: closing </{tag}> but expected </{expected_tag}> from line {expected_line}")
            print(f"  Expected: {expected_content}")
            print(f"  Got: {line.strip()[:100]}")
            # Don't pop, just report
        else:
            print(f"UNEXPECTED at line {i}: closing </{tag}> with no matching opening tag")

if stack:
    print(f"\n{len(stack)} unclosed tags remaining:")
    for tag, line, content in stack[-20:]:
        print(f"  <{tag}> at line {line}: {content}")
else:
    print("All JSX tags are properly balanced!")