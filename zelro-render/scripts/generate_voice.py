import asyncio
import json
import math
import re
import shutil
import subprocess
from pathlib import Path

import edge_tts

SENTENCES = [
    "Elon Musk's first three rockets failed.",
    "The fourth changed everything.",
    "In 2002, SpaceX began building Falcon 1, then shipped it to tiny Omelek Island.",
    "The whole launch site had one small hangar, an office trailer, and an outhouse.",
    "Flight one lifted off, leaked fuel, caught fire, and fell into the reef.",
    "Flight two reached space, then began rolling until its engine shut down before orbit.",
    "Flight three got farther.",
    "But after stage separation, leftover thrust pushed the first stage back into the second.",
    "They collided.",
    "SpaceX was nearly out of money.",
    "One spare rocket was all the team had left.",
    "They rented a cargo plane to save weeks.",
    "During landing, the rocket's empty tank crumpled.",
    "Engineers repaired it on the island.",
    "Then they changed one small thing: wait longer before separating the stages, giving the first engine time to stop pushing.",
    "On September 28, 2008, Flight four launched.",
    "Nine and a half minutes later, Falcon 1 reached orbit—the first privately developed liquid-fuel rocket to do it.",
    "Three failures did not make the fourth launch lucky.",
    "Each failure revealed what to change.",
    "Persistence is not repeating the same move.",
    "It is learning faster than failure can finish you.",
]

CANDIDATES = [
    {'id': 'andrew', 'voice': 'en-US-AndrewMultilingualNeural', 'rate': '+4%', 'pitch': '-3Hz'},
    {'id': 'brian', 'voice': 'en-US-BrianNeural', 'rate': '+2%', 'pitch': '-2Hz'},
]

FPS = 30
TARGET_SECONDS = 68.0
OUT = Path('public/media')
RAW = OUT / 'voice-candidates'
TIMING = Path('src/timings.ts')
KEYWORDS = {
    'failed', 'fourth', 'everything', 'spacex', 'falcon', 'one', 'two', 'three',
    'fire', 'orbit', 'collided', 'money', 'spare', 'crumpled', 'repaired', 'changed',
    'wait', 'longer', 'first', 'persistence', 'learning', 'failure', 'finish',
}


def clean(text: str) -> str:
    return re.sub(r"[^A-Za-z0-9'-]+", '', text).strip()


def duration(path: Path) -> float:
    return float(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=nokey=1:noprint_wrappers=1', str(path),
    ], text=True).strip())


async def synth_sentence(text: str, voice: str, rate: str, pitch: str, base: Path):
    raw_mp3 = base.with_suffix('.raw.mp3')
    trimmed = base.with_suffix('.wav')
    boundaries = []
    communicator = edge_tts.Communicate(text, voice=voice, rate=rate, pitch=pitch, boundary='WordBoundary')
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
                        'duration': max(int(chunk.get('duration', 0)) / 10_000_000, 0.06),
                    })
    subprocess.check_call([
        'ffmpeg', '-y', '-i', str(raw_mp3),
        '-af', 'silenceremove=start_periods=1:start_silence=0.02:start_threshold=-47dB,'
               'areverse,silenceremove=start_periods=1:start_silence=0.045:start_threshold=-47dB,'
               'areverse,aresample=48000',
        '-c:a', 'pcm_s16le', str(trimmed),
    ])
    if not boundaries:
        raise RuntimeError(f'No word boundaries returned for {text}')
    return trimmed, boundaries


async def build_candidate(candidate):
    candidate_dir = RAW / candidate['id']
    candidate_dir.mkdir(parents=True, exist_ok=True)
    chunks = []
    all_words = []
    sentence_starts = []
    cursor = 0.0
    overlap = 0.12
    for sentence_index, sentence in enumerate(SENTENCES):
        chunk_path, boundaries = await synth_sentence(
            sentence, candidate['voice'], candidate['rate'], candidate['pitch'], candidate_dir / f'{sentence_index:02d}'
        )
        chunks.append(chunk_path)
        sentence_starts.append(round(cursor * FPS))
        first_offset = boundaries[0]['offset']
        for boundary in boundaries:
            relative = max(0.0, boundary['offset'] - first_offset)
            all_words.append({
                'word': boundary['word'],
                'start': cursor + relative,
                'end': cursor + relative + boundary['duration'],
                'sentence': sentence_index,
            })
        cursor += duration(chunk_path) - (overlap if sentence_index < len(SENTENCES) - 1 else 0)

    output = RAW / f"candidate-{candidate['id']}.mp3"
    inputs = []
    for chunk in chunks:
        inputs.extend(['-i', str(chunk)])
    chain = '[0:a][1:a]acrossfade=d=0.12:c1=tri:c2=tri[x1];'
    for index in range(2, len(chunks)):
        incoming = f'[x{index - 1}]'
        outgoing = f'[x{index}]' if index < len(chunks) - 1 else '[out]'
        chain += f'{incoming}[{index}:a]acrossfade=d=0.12:c1=tri:c2=tri{outgoing};'
    subprocess.check_call([
        'ffmpeg', '-y', *inputs, '-filter_complex', chain.rstrip(';'),
        '-map', '[out]', '-c:a', 'libmp3lame', '-b:a', '192k', str(output),
    ])
    return {**candidate, 'path': output, 'duration': duration(output), 'words': all_words, 'sentence_starts': sentence_starts}


def phrase_rows(words):
    phrases = []
    for sentence_index in range(len(SENTENCES)):
        sentence_words = [word for word in words if word['sentence'] == sentence_index]
        cursor = 0
        while cursor < len(sentence_words):
            remaining = len(sentence_words) - cursor
            size = 4
            if remaining in {1, 2} and cursor > 0:
                size = remaining
            elif remaining == 5:
                size = 5
            group = sentence_words[cursor:cursor + size]
            emphasis = len(group) - 1
            for index, word in enumerate(group):
                if clean(word['word']).lower() in KEYWORDS:
                    emphasis = index
            phrases.append((group, emphasis))
            cursor += size
    return phrases


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    results = [await build_candidate(candidate) for candidate in CANDIDATES]
    chosen = min(results, key=lambda item: abs(item['duration'] - TARGET_SECONDS) + (20 if not 61 <= item['duration'] <= 75 else 0))
    narration = OUT / 'narration.mp3'
    subprocess.check_call([
        'ffmpeg', '-y', '-i', str(chosen['path']),
        '-af', 'highpass=f=72,lowpass=f=15800,acompressor=threshold=-18dB:ratio=2.3:attack=7:release=95,'
               'equalizer=f=2600:t=q:w=1.2:g=1.4,loudnorm=I=-15:LRA=6:TP=-1.2',
        '-c:a', 'libmp3lame', '-b:a', '192k', str(narration),
    ])
    master_duration = duration(narration)
    timed = []
    for word in chosen['words']:
        start = max(0, round(word['start'] * FPS))
        end = max(start + 2, round(word['end'] * FPS))
        timed.append({**word, 'startFrame': start, 'endFrame': end})

    phrase_lines = []
    caption_json = []
    phrases = phrase_rows(timed)
    for index, (group, emphasis) in enumerate(phrases):
        start = group[0]['startFrame']
        next_start = phrases[index + 1][0][0]['startFrame'] if index + 1 < len(phrases) else math.ceil(master_duration * FPS)
        end = max(group[-1]['endFrame'] + 8, next_start - 1)
        words_js = ', '.join(
            '{word: ' + json.dumps(word['word']) + f", startFrame: {word['startFrame']}, endFrame: {word['endFrame']}, sentence: {word['sentence']}" + '}'
            for word in group
        )
        phrase_lines.append(f"  {{words: [{words_js}], startFrame: {start}, endFrame: {end}, emphasis: {emphasis}}},")
        caption_json.append({
            'text': ' '.join(word['word'] for word in group),
            'startMs': round(start / FPS * 1000),
            'endMs': round(end / FPS * 1000),
            'timestampMs': round(start / FPS * 1000),
            'confidence': 1,
        })

    word_lines = [
        '  {word: ' + json.dumps(word['word']) + f", startFrame: {word['startFrame']}, endFrame: {word['endFrame']}, sentence: {word['sentence']}" + '},'
        for word in timed
    ]
    total_frames = math.ceil(master_duration * FPS) + 12
    TIMING.write_text(
        "export type TimedWord = {word: string; startFrame: number; endFrame: number; sentence: number};\n"
        "export type CaptionPhrase = {words: TimedWord[]; startFrame: number; endFrame: number; emphasis: number};\n"
        "export const WORDS: TimedWord[] = [\n" + '\n'.join(word_lines) + "\n];\n"
        "export const PHRASES: CaptionPhrase[] = [\n" + '\n'.join(phrase_lines) + "\n];\n"
        f"export const SENTENCE_STARTS = {json.dumps(chosen['sentence_starts'])};\n"
        f"export const TOTAL_FRAMES = {total_frames};\n",
        encoding='utf-8',
    )
    (OUT / 'captions.json').write_text(json.dumps(caption_json, indent=2), encoding='utf-8')
    report = [
        'ELON FALCON 1 NARRATION AUDITION',
        *[f"{item['id']}: {item['voice']} {item['rate']} duration={item['duration']:.3f}s words={len(item['words'])}" for item in results],
        f"selected={chosen['id']} target={TARGET_SECONDS:.1f}s master_duration={master_duration:.3f}s total_frames={total_frames}",
        'sentence_join=120ms crossfade; dead air removed without rushing individual words',
        'caption_source=exact Edge word boundaries grouped into readable 2-5 word phrases',
    ]
    (OUT / 'NARRATION_REPORT.txt').write_text('\n'.join(report) + '\n', encoding='utf-8')
    print('\n'.join(report))


if __name__ == '__main__':
    asyncio.run(main())
