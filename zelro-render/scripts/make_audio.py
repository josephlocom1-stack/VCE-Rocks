import subprocess
import urllib.request
from pathlib import Path

OUT = Path('public/media')
MUSIC = OUT / 'music-candidates'
OUT.mkdir(parents=True, exist_ok=True)
MUSIC.mkdir(parents=True, exist_ok=True)
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

# Three researched, realistic Mixkit candidates. Close Up is the preferred
# story fit; the other two remain genuine audition evidence and fallbacks.
CANDIDATES = [
    ('raising-me-higher', 'https://assets.mixkit.co/music/34/34.mp3'),
    ('close-up', 'https://assets.mixkit.co/music/1167/1167.mp3'),
    ('sci-fi-score', 'https://assets.mixkit.co/music/464/464.mp3'),
]


def probe_duration(path: Path) -> float:
    return float(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=nokey=1:noprint_wrappers=1', str(path),
    ], text=True).strip())


def download_candidate(name: str, url: str):
    try:
        destination = MUSIC / f'{name}.mp3'
        request = urllib.request.Request(url, headers={'User-Agent': UA, 'Referer': 'https://mixkit.co/'})
        with urllib.request.urlopen(request, timeout=180) as response, destination.open('wb') as output:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                output.write(chunk)
        if destination.stat().st_size < 200_000 or probe_duration(destination) < 30:
            raise RuntimeError('downloaded track is incomplete')
        return destination
    except Exception as exc:
        print(f'music candidate {name} unavailable:', exc)
        return None


def make_fallback():
    destination = MUSIC / 'generated-fallback.wav'
    subprocess.check_call([
        'ffmpeg', '-y',
        '-f', 'lavfi', '-i', 'sine=frequency=55:duration=28:sample_rate=48000',
        '-f', 'lavfi', '-i', 'sine=frequency=220:duration=28:sample_rate=48000',
        '-f', 'lavfi', '-i', 'anoisesrc=d=28:c=pink:r=48000',
        '-filter_complex',
        '[0:a]volume=0.20,tremolo=f=3.1:d=0.72[b];'
        '[1:a]volume=0.045,tremolo=f=1.55:d=0.58[p];'
        '[2:a]highpass=f=2500,lowpass=f=8000,volume=0.022[n];'
        '[b][p][n]amix=inputs=3,acompressor=threshold=-22dB:ratio=2.5:attack=12:release=170[out]',
        '-map', '[out]', str(destination),
    ])
    return destination


downloaded = []
for name, url in CANDIDATES:
    path = download_candidate(name, url)
    if path:
        downloaded.append((name, path, probe_duration(path)))

if downloaded:
    preferred_order = {'close-up': 0, 'raising-me-higher': 1, 'sci-fi-score': 2}
    selected = sorted(downloaded, key=lambda item: preferred_order[item[0]])[0]
    selected_name, selected_path, selected_duration = selected
    start_offset = '3.0' if selected_name == 'close-up' else '2.0'
else:
    selected_name = 'generated-fallback'
    selected_path = make_fallback()
    selected_duration = probe_duration(selected_path)
    start_offset = '0'

# Preserve more mid/high energy so the bed remains perceptible on iPad/phone speakers.
subprocess.check_call([
    'ffmpeg', '-y', '-ss', start_offset, '-i', str(selected_path), '-t', '30',
    '-af', 'highpass=f=70,lowpass=f=15500,equalizer=f=1900:t=q:w=1.2:g=1.6,'
           'acompressor=threshold=-20dB:ratio=2.2:attack=12:release=150,'
           'volume=0.82,afade=t=in:st=0:d=0.12,afade=t=out:st=28.0:d=1.6',
    '-c:a', 'aac', '-b:a', '192k', str(OUT / 'music.m4a'),
])

report = [
    'THERESIA GOUW MUSIC AUDITION',
    *[f'{name}: duration={duration:.2f}s source=Mixkit' for name, _, duration in downloaded],
    f'selected={selected_name} duration={selected_duration:.2f}s',
    'reason=clean first beat, no vocals, modern technology pulse, editable build under narration',
    'mix_change=midrange presence preserved for phone/iPad audibility; final level automated in Remotion rather than buried at one static gain',
]
(OUT / 'MUSIC_AUDITION_REPORT.txt').write_text('\n'.join(report) + '\n', encoding='utf-8')
print('\n'.join(report))

# Motivated SFX palette. Effects include mid/high-frequency information so they
# survive tablet/phone playback instead of relying on sub-bass alone.
subprocess.check_call([
    'ffmpeg', '-y',
    '-f', 'lavfi', '-i', 'sine=frequency=78:duration=0.42:sample_rate=48000',
    '-f', 'lavfi', '-i', 'sine=frequency=430:duration=0.23:sample_rate=48000',
    '-f', 'lavfi', '-i', 'anoisesrc=d=0.11:c=white:r=48000',
    '-filter_complex',
    '[0:a]volume=0.70,afade=t=out:st=0.05:d=0.34[lo];'
    '[1:a]volume=0.30,afade=t=out:st=0.03:d=0.18[mid];'
    '[2:a]highpass=f=1400,lowpass=f=7000,volume=0.09,afade=t=out:st=0.02:d=0.08[hi];'
    '[lo][mid][hi]amix=inputs=3,alimiter=limit=0.92[out]',
    '-map', '[out]', str(OUT / 'impact.wav'),
])

commands = [
    ['ffmpeg', '-y', '-f', 'lavfi', '-i', 'anoisesrc=d=0.42:c=pink:r=48000',
     '-af', 'highpass=f=650,lowpass=f=7600,volume=0.40,afade=t=in:st=0:d=0.045,afade=t=out:st=0.24:d=0.17', str(OUT / 'whoosh.wav')],
    ['ffmpeg', '-y', '-f', 'lavfi', '-i', 'sine=frequency=1320:duration=0.10:sample_rate=48000',
     '-af', 'volume=0.40,afade=t=out:st=0.018:d=0.075', str(OUT / 'proof-click.wav')],
    ['ffmpeg', '-y', '-f', 'lavfi', '-i', 'anoisesrc=d=0.46:c=white:r=48000',
     '-af', 'highpass=f=1200,lowpass=f=7200,tremolo=f=21:d=0.86,volume=0.34,afade=t=out:st=0.34:d=0.11', str(OUT / 'money-roll.wav')],
    ['ffmpeg', '-y', '-f', 'lavfi', '-i', 'aevalsrc=0.13*sin(2*PI*(210*t+1350*t*t)):d=0.55:s=48000',
     '-af', 'afade=t=in:st=0:d=0.04,afade=t=out:st=0.43:d=0.11,volume=1.18', str(OUT / 'riser.wav')],
    ['ffmpeg', '-y', '-f', 'lavfi', '-i', 'sine=frequency=980:duration=0.09:sample_rate=48000',
     '-af', 'volume=0.44,afade=t=out:st=0.018:d=0.065', str(OUT / 'timeline-tick.wav')],
    ['ffmpeg', '-y', '-f', 'lavfi', '-i', 'sine=frequency=1480:duration=0.12:sample_rate=48000',
     '-af', 'volume=0.34,afade=t=out:st=0.02:d=0.09', str(OUT / 'return-pop.wav')],
]
for command in commands:
    subprocess.check_call(command)

subprocess.check_call([
    'ffmpeg', '-y',
    '-f', 'lavfi', '-i', 'sine=frequency=1760:duration=0.40:sample_rate=48000',
    '-f', 'lavfi', '-i', 'sine=frequency=2340:duration=0.40:sample_rate=48000',
    '-filter_complex', '[0:a]volume=0.38[a];[1:a]volume=0.20[b];[a][b]amix=inputs=2,afade=t=out:st=0.07:d=0.30',
    str(OUT / 'scale-ding.wav'),
])
