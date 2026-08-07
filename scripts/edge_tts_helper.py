"""
Edge TTS helper script - reads text from a file to avoid Windows CLI encoding issues.
Called by freemusic.controller.js via: python edge_tts_helper.py <text_file> <voice> <output_file>
"""
import sys
import asyncio
import edge_tts


async def generate(text_file, voice, output_file):
    with open(text_file, 'r', encoding='utf-8') as f:
        text = f.read().strip()
    
    if not text:
        print("ERROR: Empty text", file=sys.stderr)
        sys.exit(1)
    
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_file)
    print(f"OK: saved to {output_file}")


if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: edge_tts_helper.py <text_file> <voice> <output_file>", file=sys.stderr)
        sys.exit(1)
    
    text_file = sys.argv[1]
    voice = sys.argv[2]
    output_file = sys.argv[3]
    
    asyncio.run(generate(text_file, voice, output_file))
