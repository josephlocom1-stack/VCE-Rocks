import html
import re
import subprocess
import time
import urllib.request
from pathlib import Path

OUT = Path('public/media')
RAW = OUT / 'raw'
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

# One distinct source per output. No source is reused inside the Reel.
PEXELS = {
    'family_airport': [37130585, 7429363],
    'dishwasher': [8627106, 3768941],
    'startup_board': [8344124, 3256820],
    'vc_pitch': [8344137, 8343942],
    'facebook_phone': [6756650, 5201210],
    'finance_city': [29531860, 10218091],
    'acrew_team': [7224309, 7223708],
}

# Official Acrew Capital portrait. This replaces the previous aggressively cropped
# 1280x720 interview source, which became visibly soft after vertical enlargement.
GOUW_HEADSHOT = (
    'https://cdn.prod.website-files.com/613d4917540d8f04e2a52466/'
    '615898314a22b3d8fedda734_theresia-gouw.jpg'
)


def get(url: str, timeout=120) -> bytes:
    request = urllib.request.Request(url, headers={'User-Agent': UA, 'Referer': 'https://www.pexels.com/'})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def probe_video(path: Path):
    raw = subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=codec_name,width,height,bit_rate',
        '-of', 'csv=p=0', str(path),
    ], text=True).strip().split(',')
    if len(raw) < 3:
        raise RuntimeError(f'Unable to probe video: {path}')
    codec = raw[0]
    width = int(raw[1])
    height = int(raw[2])
    bitrate = int(raw[3]) if len(raw) > 3 and raw[3].isdigit() else 0
    return codec, width, height, bitrate


def high_quality_video(path: Path) -> bool:
    try:
        codec, width, height, bitrate = probe_video(path)
        # Require at least native 1080p-class source area. A 720p source that is
        # enlarged to 1080x1920 is rejected instead of being disguised by effects.
        area_ok = width * height >= 1920 * 1080
        short_edge_ok = min(width, height) >= 1000
        bitrate_ok = bitrate == 0 or bitrate >= 2_000_000
        print('source quality', path.name, codec, width, height, bitrate, area_ok, short_edge_ok, bitrate_ok)
        return bool(codec and area_ok and short_edge_ok and bitrate_ok)
    except Exception as exc:
        print('quality probe failed', path, exc)
        return False


def download_url(url: str, path: Path) -> bool:
    for attempt in range(4):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': UA, 'Referer': 'https://www.pexels.com/'})
            with urllib.request.urlopen(request, timeout=180) as response, path.open('wb') as output:
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    output.write(chunk)
            if path.stat().st_size > 200_000 and high_quality_video(path):
                return True
            print('rejecting low-quality downloaded video', url)
        except Exception as exc:
            print('download attempt failed', url, exc)
        path.unlink(missing_ok=True)
        time.sleep(3 * (attempt + 1))
    return False


def find_pexels_mp4(video_id: int):
    try:
        raw = get(f'https://www.pexels.com/video/{video_id}/').decode('utf-8', errors='ignore')
        raw = html.unescape(raw).replace('\\u0026', '&').replace('\\/', '/')
        urls = re.findall(r'https://videos\.pexels\.com/video-files/[^"<> ]+?\.mp4(?:\?[^"<> ]*)?', raw)
        urls = list(dict.fromkeys(urls))
        urls.sort(
            key=lambda url: (
                ('2160' in url or '3840' in url),
                ('1080' in url or '1920' in url),
                len(url),
            ),
            reverse=True,
        )
        return urls
    except Exception as exc:
        print('Pexels page parse failed', video_id, exc)
        return []


def download_pexels(name: str, ids):
    destination = RAW / f'{name}.mp4'
    for video_id in ids:
        print(f'Pexels {name}: trying {video_id}')
        candidates = [
            *find_pexels_mp4(video_id),
            f'https://www.pexels.com/download/video/{video_id}/',
            f'https://www.pexels.com/video/{video_id}/download/',
        ]
        for url in candidates:
            if download_url(url, destination):
                return destination
    raise RuntimeError(f'No native-1080p-or-better real-video source for {name}')


def normalize(src: Path, dest: Path, brightness='1.08'):
    vf = (
        'scale=1080:1920:force_original_aspect_ratio=increase,'
        'crop=1080:1920,fps=30,'
        f'eq=brightness=0.025:contrast=1.035:saturation=1.04:gamma={brightness},'
        'format=yuv420p'
    )
    subprocess.check_call([
        'ffmpeg', '-y', '-i', str(src), '-an', '-t', '8',
        '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
        '-movflags', '+faststart', str(dest),
    ])


def download_gouw_headshot():
    destination = OUT / 'gouw_headshot.jpg'
    request = urllib.request.Request(
        GOUW_HEADSHOT,
        headers={'User-Agent': UA, 'Referer': 'https://www.acrewcapital.com/'},
    )
    with urllib.request.urlopen(request, timeout=180) as response, destination.open('wb') as output:
        output.write(response.read())
    if destination.stat().st_size < 40_000:
        raise RuntimeError('Official Gouw portrait download is unexpectedly small')
    dims = subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height', '-of', 'csv=p=0', str(destination),
    ], text=True).strip().split(',')
    if len(dims) < 2 or min(int(dims[0]), int(dims[1])) < 700:
        raise RuntimeError(f'Official Gouw portrait is below quality gate: {dims}')
    print('official Gouw portrait', dims)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)

    download_gouw_headshot()
    for name, ids in PEXELS.items():
        raw = download_pexels(name, ids)
        lift = '1.13' if name in {'facebook_phone', 'finance_city'} else '1.08'
        normalize(raw, OUT / f'{name}.mp4', brightness=lift)

    expected_video = list(PEXELS.keys())
    seen = set()
    for name in expected_video:
        path = OUT / f'{name}.mp4'
        if not path.exists() or path.stat().st_size < 150_000:
            raise RuntimeError(f'Missing or weak normalized asset: {path}')
        if path.name in seen:
            raise RuntimeError(f'Duplicate output path: {path.name}')
        seen.add(path.name)
        print('\n--', name, '--')
        subprocess.check_call([
            'ffprobe', '-v', 'error',
            '-show_entries', 'stream=width,height,r_frame_rate:format=duration',
            '-of', 'default=noprint_wrappers=1', str(path),
        ])

    portrait = OUT / 'gouw_headshot.jpg'
    if not portrait.exists():
        raise RuntimeError('Missing official Gouw portrait')


if __name__ == '__main__':
    main()
