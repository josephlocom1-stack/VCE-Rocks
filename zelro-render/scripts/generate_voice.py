import asyncio
import json
import math
import re
import subprocess
from pathlib import Path

import edge_tts

SENTENCES = [
    "The board removed him as CEO of the company he started.",
    "Two years later, eBay bought it for $1.5 billion.",
    "He still owned roughly 12%.",
    "Meet Elon Musk.",
    "In 1995, Musk started Zip2 with his brother.",
    "It helped newspapers put local business listings online.",
    "Back then, he was showering at the YMCA.",
    "Four years later, Compaq bought Zip2 for $307 million in cash.",
    "Musk's 7% stake paid him $22 million.",
    "Instead of stopping, he put most of that money into X.com, a new online bank.",
    "The plan was huge: put banking, investments and payments on one website.",
    "But users cared most about one simple feature—sending money to someone by email.",
    "Another startup, Confinity, had built a similar payment service called PayPal.",
    "The two companies merged in 2000, and Musk became CEO.",
    "Then, in September, the board replaced him.",
    "But losing the CEO job didn't erase his shares.",
    "When PayPal went public in 2002, SEC filings still showed Musk owning about 12% of the company.",
    "Eight months later, eBay bought PayPal for $1.5 billion.",
    "He had lost the CEO job.",
    "But he kept the shares.",
    "Musk later said the sale left him with about $180 million after tax.",
]

CANDIDATES = [
    {'id': 'andrew', 'voice': 'en-US-AndrewMultilingualNeural', 'rate': '+8%', 'pitch': '-3Hz'},
    {'id': 'brian', 'voice': 'en-US-BrianNeural', 'rate': '+6%', 'pitch': '-2Hz'},
    {'id': 'guy', 'voice': 'en-US-GuyNeural', 'rate': '+7%', 'pitch': '-2Hz'},
]

FPS = 30
TARGET_SECONDS = 68.0
OUT = Path('public/media')
RAW = OUT / 'voice-candidates'
TIMING = Path('src/timings.ts')
KEYWORDS = {
    'board', 'removed', 'ceo', 'ebay', 'billion', 'owned', '12', 'elon', 'musk',
    'zip2', 'ymca', 'compaq', '307', '7', '22', 'xcom', 'bank', 'payments', 'email',
    'confinity', 'paypal', 'merged', 'september', 'shares', 'sec', 'kept', '180', 'tax',
}


def clean(text: str) -> str:
    return re.sub(r"[^A-Za-z0-9%$.'-]+", '', text).strip()


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
                        'duration': max(int(chunk.get('duration', 0)) / 10_000_000, 0.055),
                    })
    subprocess.check_call([
        'ffmpeg', '-y', '-i', str(raw_mp3),
        '-af', 'silenceremove=start_periods=1:start_silence=0.015:start_threshold=-47dB,'
               'areverse,silenceremove=start_periods=1:start_silence=0.040:start_threshold=-47dB,'
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
    sentence_starts = []
    cursor = 0.0
    overlap = 0.105
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
    if len(chunks) == 1:
        subprocess.check_call(['ffmpeg', '-y', '-i', str(chunks[0]), '-c:a', 'libmp3lame', '-b:a', '192k', str(output)])
    else:
        inputs = []
        for chunk in chunks:
            inputs.extend(['-i', str(chunk)])
        chain_parts = [f'[0:a][1:a]acrossfade=d={overlap}:c1=tri:c2=tri[x1]']
        for index in range(2, len(chunks)):
            incoming = f'[x{index - 1}]'
            outgoing = f'[x{index}]' if index < len(chunks) - 1 else '[out]'
            chain_parts.append(f'{incoming}[{index}:a]acrossfade=d={overlap}:c1=tri:c2=tri{outgoing}')
        subprocess.check_call([
            'ffmpeg', '-y', *inputs, '-filter_complex', ';'.join(chain_parts),
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
            size = 3 if remaining >= 3 else remaining
            if remaining == 4:
                size = 2
            group = sentence_words[cursor:cursor + size]
            emphasis = len(group) - 1
            for index, word in enumerate(group):
                normalized = re.sub(r'[^a-z0-9]', '', word['word'].lower())
                if normalized in {re.sub(r'[^a-z0-9]', '', k.lower()) for k in KEYWORDS}:
                    emphasis = index
            phrases.append((group, emphasis))
            cursor += size
    return phrases


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    results = []
    failures = []
    for candidate in CANDIDATES:
        try:
            results.append(await build_candidate(candidate))
        except Exception as exc:
            failures.append(f"{candidate['id']}: {exc}")
    if not results:
        raise RuntimeError('All TTS candidates failed: ' + ' | '.join(failures))

    chosen = min(results, key=lambda item: abs(item['duration'] - TARGET_SECONDS) + (30 if not 60 <= item['duration'] <= 78 else 0))
    narration = OUT / 'narration.mp3'
    subprocess.check_call([
        'ffmpeg', '-y', '-i', str(chosen['path']),
        '-af', 'highpass=f=72,lowpass=f=15800,acompressor=threshold=-18dB:ratio=2.25:attack=7:release=95,'
               'equalizer=f=2500:t=q:w=1.15:g=1.2,loudnorm=I=-15:LRA=6:TP=-1.2',
        '-c:a', 'libmp3lame', '-b:a', '192k', str(narration),
    ])
    master_duration = duration(narration)
    timed = []
    for word in chosen['words']:
        start = max(0, round(word['start'] * FPS))
        end = max(start + 2, round(word['end'] * FPS))
        timed.append({**word, 'startFrame': start, 'endFrame': end})

    phrases = phrase_rows(timed)
    phrase_lines = []
    caption_json = []
    for index, (group, emphasis) in enumerate(phrases):
        start = group[0]['startFrame']
        next_start = phrases[index + 1][0][0]['startFrame'] if index + 1 < len(phrases) else math.ceil(master_duration * FPS)
        end = max(group[-1]['endFrame'] + 7, next_start - 1)
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
    total_frames = max(math.ceil(master_duration * FPS) + 12, chosen['sentence_starts'][-1] + 60)
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
        'ELON PAYPAL PREMIUM NARRATION AUDITION',
        *[f"{item['id']}: {item['voice']} {item['rate']} duration={item['duration']:.3f}s words={len(item['words'])}" for item in results],
        *[f'failed_candidate={failure}' for failure in failures],
        f"selected={chosen['id']} target={TARGET_SECONDS:.1f}s master_duration={master_duration:.3f}s total_frames={total_frames}",
        'script_state=USER APPROVED + LOCKED; wording unchanged',
        'sentence_join=105ms crossfade; dead air trimmed conservatively',
        'caption_source=exact Edge WordBoundary timing grouped into 2-3 word authored phrases',
    ]
    (OUT / 'NARRATION_REPORT.txt').write_text('\n'.join(report) + '\n', encoding='utf-8')
    print('\n'.join(report))


if __name__ == '__main__':
    asyncio.run(main())
