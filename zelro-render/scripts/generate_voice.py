import asyncio
import json
import math
import re
import shutil
import subprocess
from pathlib import Path

import edge_tts

SENTENCES = [
    "Theresia Gouw's father fled Indonesia and went from dentist to dishwasher.",
    "His daughter became America's first female billionaire venture capitalist.",
    "When Gouw's startup changed CEOs three times in twelve months a board member pushed her toward venture capital.",
    "At Accel she spotted Facebook's real advantage two-thirds of users returned every day.",
    "That early bet helped build her fortune.",
    "Now her own firm, Acrew, manages one point seven billion.",
]

CANDIDATES = [
    {'id': 'ava', 'voice': 'en-US-AvaNeural', 'rate': '+14%', 'pitch': '-2Hz'},
    {'id': 'emma', 'voice': 'en-US-EmmaNeural', 'rate': '+11%', 'pitch': '-1Hz'},
]

FPS = 30
TARGET_SECONDS = 22.0
OUT = Path('public/media')
RAW = OUT / 'voice-candidates'
TIMING = Path('src/timings.ts')


def clean(text: str) -> str:
    return re.sub(r"[^A-Za-z0-9$'-]+", '', text).strip()


def duration(path: Path) -> float:
    return float(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=nokey=1:noprint_wrappers=1', str(path),
    ], text=True).strip())


async def synth_sentence(text: str, voice: str, rate: str, pitch: str, base: Path):
    raw_mp3 = base.with_suffix('.raw.mp3')
    trimmed = base.with_suffix('.wav')
    boundaries = []
    communicator = edge_tts.Communicate(
        text,
        voice=voice,
        rate=rate,
        pitch=pitch,
        boundary='WordBoundary',
    )
    with raw_mp3.open('wb') as output:
        async for chunk in communicator.stream():
            if chunk['type'] == 'audio':
                output.write(chunk['data'])
            elif chunk['type'] == 'WordBoundary':
                word = clean(chunk.get('text', ''))
                if word:
                    boundaries.append({
                        'word': word,
                        'offset': int(chunk.get('offset', 0)) / 10_000_000,
                        'duration': max(int(chunk.get('duration', 0)) / 10_000_000, 0.055),
                    })

    subprocess.check_call([
        'ffmpeg', '-y', '-i', str(raw_mp3),
        '-af', 'silenceremove=start_periods=1:start_silence=0.025:start_threshold=-46dB,'
               'areverse,'
               'silenceremove=start_periods=1:start_silence=0.055:start_threshold=-46dB,'
               'areverse,aresample=48000',
        '-c:a', 'pcm_s16le', str(trimmed),
    ])
    if not boundaries:
        raise RuntimeError(f'No word boundaries returned for: {text}')
    return trimmed, boundaries


async def build_candidate(candidate):
    candidate_dir = RAW / candidate['id']
    candidate_dir.mkdir(parents=True, exist_ok=True)
    chunks = []
    all_words = []
    cursor = 0.0
    overlap = 0.28

    for index, sentence in enumerate(SENTENCES):
        chunk_path, boundaries = await synth_sentence(
            sentence,
            candidate['voice'],
            candidate['rate'],
            candidate['pitch'],
            candidate_dir / f'{index:02d}',
        )
        chunks.append(chunk_path)
        chunk_duration = duration(chunk_path)
        first_offset = boundaries[0]['offset']
        for boundary in boundaries:
            relative = max(0.0, boundary['offset'] - first_offset)
            all_words.append({
                'word': boundary['word'],
                'start': cursor + relative,
                'end': cursor + relative + boundary['duration'],
            })
        cursor += chunk_duration - (overlap if index < len(SENTENCES) - 1 else 0)

    output = RAW / f"candidate-{candidate['id']}.mp3"
    inputs = []
    for chunk in chunks:
        inputs.extend(['-i', str(chunk)])
    if len(chunks) == 1:
        shutil.copyfile(chunks[0], output)
    else:
        chain = '[0:a][1:a]acrossfade=d=0.28:c1=tri:c2=tri[x1];'
        for index in range(2, len(chunks)):
            incoming = f'[x{index - 1}]'
            outgoing = f'[x{index}]' if index < len(chunks) - 1 else '[out]'
            chain += f'{incoming}[{index}:a]acrossfade=d=0.28:c1=tri:c2=tri{outgoing};'
        chain = chain.rstrip(';')
        subprocess.check_call([
            'ffmpeg', '-y', *inputs, '-filter_complex', chain,
            '-map', '[out]', '-c:a', 'libmp3lame', '-b:a', '192k', str(output),
        ])

    return {
        **candidate,
        'path': output,
        'duration': duration(output),
        'words': all_words,
    }


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    results = []
    for candidate in CANDIDATES:
        results.append(await build_candidate(candidate))

    # Audition gate: both voices are confident neutral female voices. Select the cadence
    # closest to the 22-second story target while rejecting out-of-band pacing.
    def score(item):
        penalty = 10 if item['duration'] < 20.5 or item['duration'] > 23.3 else 0
        return abs(item['duration'] - TARGET_SECONDS) + penalty

    chosen = min(results, key=score)
    narration = OUT / 'narration.mp3'
    subprocess.check_call([
        'ffmpeg', '-y', '-i', str(chosen['path']),
        '-af', 'highpass=f=75,lowpass=f=15500,acompressor=threshold=-17dB:ratio=2.2:attack=8:release=90,'
               'loudnorm=I=-16:LRA=7:TP=-1.5',
        '-c:a', 'libmp3lame', '-b:a', '192k', str(narration),
    ])

    final_duration = duration(narration)
    rows = []
    captions = []
    for word in chosen['words']:
        start_ms = round(word['start'] * 1000)
        end_ms = max(start_ms + 55, round(word['end'] * 1000))
        start_frame = max(0, round(word['start'] * FPS))
        end_frame = max(start_frame + 2, round(word['end'] * FPS))
        rows.append(
            f"  {{word: {json.dumps(word['word'])}, startFrame: {start_frame}, endFrame: {end_frame}}},"
        )
        captions.append({
            'text': f" {word['word']}",
            'startMs': start_ms,
            'endMs': end_ms,
            'timestampMs': start_ms,
            'confidence': 1,
        })

    total_frames = max(math.ceil(final_duration * FPS) + 10, 630)
    TIMING.write_text(
        "export type TimedWord = {word: string; startFrame: number; endFrame: number};\n"
        "export const WORDS: TimedWord[] = [\n" + '\n'.join(rows) + "\n];\n"
        f"export const TOTAL_FRAMES = {total_frames};\n",
        encoding='utf-8',
    )
    (OUT / 'captions.json').write_text(json.dumps(captions, indent=2), encoding='utf-8')

    report = [
        'THERESIA GOUW NARRATION AUDITION',
        *[
            f"{item['id']}: {item['voice']} {item['rate']} duration={item['duration']:.3f}s words={len(item['words'])}"
            for item in results
        ],
        f"selected={chosen['id']} reason=closest clean cadence to {TARGET_SECONDS:.1f}s target",
        f"master_duration={final_duration:.3f}s total_frames={total_frames}",
        'sentence_join=280ms equal-power crossfade; dead inter-sentence air removed',
    ]
    (OUT / 'NARRATION_REPORT.txt').write_text('\n'.join(report) + '\n', encoding='utf-8')
    print('\n'.join(report))


if __name__ == '__main__':
    asyncio.run(main())
