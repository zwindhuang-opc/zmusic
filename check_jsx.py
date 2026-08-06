import re

with open('e:/AI_Projects/zmusic/src/pages/LyricsPage.jsx', 'r') as f:
    content = f.read()
    lines = content.split('\n')

# Find all self-closing tags
self_closing = re.findall(r'<(\w+)[^>]*/>', content)
print(f"Self-closing tags: {len(self_closing)}")

# Find all opening tags (not self-closing, not closing)
# This regex finds <tag ...> but not </tag> and not <tag ... />
open_pattern = re.compile(r'<(\w+)(?:\s[^>]*)?>(?!</)(?!\/>)')
close_pattern = re.compile(r'</(\w+)>')

opens = []
for i, line in enumerate(lines, 1):
    for match in open_pattern.finditer(line):
        tag = match.group(1)
        # Skip if it's a self-closing tag
        full_match = match.group(0)
        if not full_match.endswith('/>'):
            opens.append((tag, i, full_match.strip()[:60]))

closes = []
for i, line in enumerate(lines, 1):
    for match in close_pattern.finditer(line):
        closes.append((match.group(1), i))

# Match opens to closes
open_stack = []
issues = []
for tag, line, text in opens:
    open_stack.append((tag, line, text))

close_idx = 0
for i, (tag, line) in enumerate(closes):
    # Find matching open
    found = False
    for j in range(len(open_stack) - 1, -1, -1):
        if open_stack[j][0] == tag:
            open_stack.pop(j)
            found = True
            break
    if not found:
        # This closing tag has no matching open - could be OK if we already matched it
        pass

if open_stack:
    print(f"\nUnclosed opening tags: {len(open_stack)}")
    for tag, line, text in open_stack[:20]:
        print(f"  Line {line}: <{tag}> - {text}")
else:
    print("\nAll opening tags are closed")

# Check closes that don't match opens
close_tags = [tag for tag, _ in closes]
open_tags = [tag for tag, _, _ in opens]
# Simple count check
from collections import Counter
open_counts = Counter(open_tags)
close_counts = Counter(close_tags)
print("\nTag counts:")
for tag in set(list(open_counts.keys()) + list(close_counts.keys())):
    o = open_counts.get(tag, 0)
    c = close_counts.get(tag, 0)
    if o != c:
        print(f"  {tag}: opens={o}, closes={c} - MISMATCH!")