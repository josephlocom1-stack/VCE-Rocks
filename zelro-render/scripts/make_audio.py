import subprocess
import urllib.request
from pathlib import Path

OUT = Path('public/media')
MUSIC = OUT / 'music-candidates'
OUT.mkdir(parents=True, exist_ok=True)
MUSIC.mkdir(parents=True, exist_ok=True)
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

CANDIDATES = [
    ('close-up', 'https://assets.mixkit.co/music/1167/1167.mp3', 'restrained documentary pulse'),
    ('raising-higher', 'https://assets.mixkit.co/music/34/34.mp3', 'aspirational business lift'),
    ('sci-fi-score', 'https://assets.mixkit.co/music/464/464.mp3', 'tense electronic texture'),
]


def duration(path: Path) -> float:
    return float(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=nokey=1:noprint_wrappers=1', str(path),
    ], text=True).strip())


def download(name, url):
    destination = MUSIC / f'{name}.mp3'
    try:
        request = urllib.request.Request(url, headers={'User-Agent': UA, 'Referer': 'https://mixkit.co/'})
        with urllib.request.urlopen(request, timeout=180) as response, destination.open('wb') as output:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                output.write(chunk)
        if destination.stat().st_size < 200_000 or duration(destination) < 30:
            raise RuntimeError('incomplete track')
        return destination
    except Exception as exc:
        destination.unlink(missing_ok=True)
        print(name, 'unavailable', exc)
        return None


downloaded = []
for name, url, character in CANDIDATES:
    path = download(name, url)
    if path:
        downloaded.append((name, path, character, duration(path)))

if not downloaded:
    raise RuntimeError('No rights-compatible music candidate downloaded')

preference = {'close-up': 0, 'raising-higher': 1, 'sci-fi-score': 2}
selected = sorted(downloaded, key=lambda item: preference[item[0]])[0]
selected_name, selected_path, selected_character, selected_duration = selected

subprocess.check_call([
    'ffmpeg', '-y', '-stream_loop', '-1', '-ss', '1.5', '-i', str(selected_path), '-t', '90',
    '-af', 'highpass=f=65,lowpass=f=15800,equalizer=f=1800:t=q:w=1.1:g=1.2,'
           'acompressor=threshold=-19dB:ratio=2.0:attack=10:release=145,'
           'volume=0.90,afade=t=in:st=0:d=0.18,afade=t=out:st=87:d=2.6',
    '-c:a', 'aac', '-b:a', '192k', str(OUT / 'music.m4a'),
])

report = [
    'ELON PAYPAL MUSIC AUDITION',
    *[f'{name}: {character}; duration={seconds:.2f}s; source=Mixkit' for name, _, character, seconds in downloaded],
    f'selected={selected_name}; reason={selected_character} fits ownership-reversal documentary pacing',
    'music_role=forward motion under narration, not trailer bombast',
    'final master target=-14 LUFS; true peak below -1 dBTP',
]
(OUT / 'MUSIC_AUDITION_REPORT.txt').write_text('\n'.join(report) + '\n', encoding='utf-8')
print('\n'.join(report))


def ffmpeg(*args):
    subprocess.check_call(['ffmpeg', '-y', *args])

ffmpeg('-f','lavfi','-i','sine=frequency=70:duration=0.38:sample_rate=48000','-f','lavfi','-i','sine=frequency=480:duration=0.18:sample_rate=48000','-filter_complex','[0:a]volume=.7,afade=t=out:st=.05:d=.3[lo];[1:a]volume=.22,afade=t=out:st=.02:d=.14[hi];[lo][hi]amix=inputs=2,alimiter=limit=.9',str(OUT/'impact.wav'))
ffmpeg('-f','lavfi','-i','aevalsrc=0.12*sin(2*PI*(190*t+1400*t*t)):d=0.7:s=48000','-af','highpass=f=130,afade=t=in:st=0:d=.04,afade=t=out:st=.55:d=.14,volume=1.0',str(OUT/'riser.wav'))
ffmpeg('-f','lavfi','-i','sine=frequency=1180:duration=0.18:sample_rate=48000','-f','lavfi','-i','sine=frequency=1770:duration=0.18:sample_rate=48000','-filter_complex','[0:a]volume=.40[a];[1:a]volume=.22[b];[a][b]amix=inputs=2,afade=t=out:st=.04:d=.12',str(OUT/'proof.wav'))
