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
    ('sci-fi-score', 'https://assets.mixkit.co/music/464/464.mp3', 'space atmosphere and tension'),
    ('raising-higher', 'https://assets.mixkit.co/music/34/34.mp3', 'aspirational lift'),
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

preference = {'sci-fi-score': 0, 'close-up': 1, 'raising-higher': 2}
selected = sorted(downloaded, key=lambda item: preference[item[0]])[0]
selected_name, selected_path, selected_character, selected_duration = selected

subprocess.check_call([
    'ffmpeg', '-y', '-stream_loop', '-1', '-ss', '2.0', '-i', str(selected_path), '-t', '90',
    '-af', 'highpass=f=65,lowpass=f=15800,equalizer=f=1800:t=q:w=1.1:g=1.8,'
           'acompressor=threshold=-19dB:ratio=2.1:attack=10:release=145,'
           'volume=0.92,afade=t=in:st=0:d=.12,afade=t=out:st=87:d=2.6',
    '-c:a', 'aac', '-b:a', '192k', str(OUT / 'music.m4a'),
])

report = [
    'ELON FALCON 1 MUSIC AUDITION',
    *[f'{name}: {character}; duration={seconds:.2f}s; source=Mixkit' for name, _, character, seconds in downloaded],
    f'selected={selected_name}; reason={selected_character} best matches failure-to-orbit tension wave',
    'cue 00:00-00:08 hook: immediate pulse at 25 percent Remotion gain',
    'cue 00:08-00:28 setup/failures: restrain to 17 percent, then 13 percent at collision',
    'cue 00:28-00:47 last chance/repair: rebuild from 13 to 20 percent',
    'cue 00:47-01:02 launch/orbit: peak at 30 percent',
    'cue 01:02-end lesson: resolve at 24 percent',
    'final master target=-14 LUFS; phone/iPad midrange preserved',
]
(OUT / 'MUSIC_AUDITION_REPORT.txt').write_text('\n'.join(report) + '\n', encoding='utf-8')
print('\n'.join(report))


def ffmpeg(*args):
    subprocess.check_call(['ffmpeg', '-y', *args])


ffmpeg(
    '-f', 'lavfi', '-i', 'sine=frequency=72:duration=.45:sample_rate=48000',
    '-f', 'lavfi', '-i', 'sine=frequency=510:duration=.22:sample_rate=48000',
    '-filter_complex', '[0:a]volume=.75,afade=t=out:st=.05:d=.38[lo];[1:a]volume=.28,afade=t=out:st=.03:d=.17[mid];[lo][mid]amix=inputs=2,alimiter=limit=.92',
    str(OUT / 'impact.wav'),
)
ffmpeg(
    '-f', 'lavfi', '-i', 'anoisesrc=d=.52:c=white:r=48000',
    '-f', 'lavfi', '-i', 'sine=frequency=64:duration=.52:sample_rate=48000',
    '-filter_complex', '[0:a]highpass=f=780,lowpass=f=7600,volume=.34,afade=t=out:st=.25:d=.25[n];[1:a]volume=.9,afade=t=out:st=.06:d=.44[b];[n][b]amix=inputs=2,alimiter=limit=.94',
    str(OUT / 'collision.wav'),
)
ffmpeg(
    '-f', 'lavfi', '-i', 'sine=frequency=62:duration=1.1:sample_rate=48000',
    '-af', 'tremolo=f=1.85:d=.92,volume=.7,afade=t=out:st=.72:d=.35', str(OUT / 'heartbeat.wav'),
)
ffmpeg(
    '-f', 'lavfi', '-i', 'aevalsrc=0.13*sin(2*PI*(185*t+1550*t*t)):d=.82:s=48000',
    '-af', 'highpass=f=120,afade=t=in:st=0:d=.05,afade=t=out:st=.68:d=.13,volume=1.2', str(OUT / 'riser.wav'),
)
ffmpeg(
    '-f', 'lavfi', '-i', 'anoisesrc=d=.72:c=pink:r=48000',
    '-f', 'lavfi', '-i', 'sine=frequency=92:duration=.72:sample_rate=48000',
    '-filter_complex', '[0:a]highpass=f=360,lowpass=f=7200,volume=.28,afade=t=out:st=.55:d=.15[n];[1:a]volume=.86,afade=t=out:st=.18:d=.5[b];[n][b]amix=inputs=2,alimiter=limit=.94', str(OUT / 'launch.wav'),
)
ffmpeg(
    '-f', 'lavfi', '-i', 'sine=frequency=1320:duration=.22:sample_rate=48000',
    '-f', 'lavfi', '-i', 'sine=frequency=1980:duration=.22:sample_rate=48000',
    '-filter_complex', '[0:a]volume=.46[a];[1:a]volume=.25[b];[a][b]amix=inputs=2,afade=t=out:st=.05:d=.15', str(OUT / 'proof.wav'),
)
