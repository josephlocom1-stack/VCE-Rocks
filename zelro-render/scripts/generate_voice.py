import asyncio
import json
import math
import re
import subprocess
from pathlib import Path

import edge_tts

# Write numbers as spoken words so Edge provides reliable word boundaries.
# The renderer replaces the spoken money/percentage words with authored graphics.
SCRIPT = """Alexandr Wang became a billionaire by selling AI something it still needed humans to create: labeled data.
At nineteen, he dropped out of MIT and cofounded Scale AI.
Self-driving companies had millions of images, but people still had to teach the models what they were seeing.
In twenty twenty-five, Meta paid fourteen point three billion dollars for forty nine percent of Scale — and recruited Wang to lead its superintelligence push."""

FPS = 30
OUT = Path('public/media')
TIMING = Path('src/timings.ts')
VOICE = 'en-US-AndrewNeural'


def clean(text: str) -> str:
    return re.sub(r"[^A-Za-z0-9$'-]+", '', text).strip()


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    boundaries = []
    audio_path = OUT / 'narration.mp3'

    comm = edge_tts.Communicate(
        SCRIPT,
        voice=VOICE,
        rate='+8%',
        pitch='-2Hz',
        boundary='WordBoundary',
    )
    with audio_path.open('wb') as f:
        async for chunk in comm.stream():
            if chunk['type'] == 'audio':
                f.write(chunk['data'])
            elif chunk['type'] == 'WordBoundary':
                word = clean(chunk.get('text', ''))
                if word:
                    boundaries.append({
                        'word': word,
                        'offset': int(chunk.get('offset', 0)),
                        'duration': int(chunk.get('duration', 0)),
                    })

    duration = float(subprocess.check_output([
        'ffprobe','-v','error','-show_entries','format=duration',
        '-of','default=nokey=1:noprint_wrappers=1', str(audio_path)
    ], text=True).strip())

    expected_words = [clean(x) for x in SCRIPT.split() if clean(x)]
    if len(boundaries) < max(50, int(len(expected_words) * 0.80)):
        raise RuntimeError(
            f'Word-boundary metadata incomplete: got {len(boundaries)} for {len(expected_words)} script words'
        )

    rows = []
    for item in boundaries:
        start = item['offset'] / 10_000_000
        dur = max(item['duration'] / 10_000_000, 0.06)
        sf = max(0, round(start * FPS))
        ef = max(sf + 2, round((start + dur) * FPS))
        word = json.dumps(item['word'])
        rows.append(f"  {{word: {word}, startFrame: {sf}, endFrame: {ef}}},")

    total = max(math.ceil(duration * FPS) + 18, 570)
    TIMING.write_text(
        "export type TimedWord = {word: string; startFrame: number; endFrame: number};\n"
        "export const WORDS: TimedWord[] = [\n" + '\n'.join(rows) + "\n];\n"
        f"export const TOTAL_FRAMES = {total};\n",
        encoding='utf-8'
    )

    print(f'voice={VOICE} duration={duration:.3f}s words={len(boundaries)} total_frames={total}')
    print(' '.join(x['word'] for x in boundaries))


if __name__ == '__main__':
    asyncio.run(main())
