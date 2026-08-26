import json
import re
import subprocess
import urllib.request
from pathlib import Path

OUT = Path('public/media')
RAW = OUT / 'raw'
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

# Every output comes from a different real source. No source is re-trimmed or reused.
PEXELS = {
    'hook_launch': [854262],
    'island': [1550083, 30120173],
    'failure_fire': [856295, 856227],
    'flight_two': [854232, 31398201],
    'cargo_plane': [35232121],
    'repair_factory': [11017956, 31016925],
}


def run(command):
    subprocess.check_call(command)


def probe(path: Path):
    raw = subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=codec_name,width,height,bit_rate:format=duration',
        '-of', 'json', str(path),
    ], text=True)
    data = json.loads(raw)
    stream = data['streams'][0]
    return stream.get('codec_name'), int(stream.get('width', 0)), int(stream.get('height', 0)), float(data['format'].get('duration', 0))


def download_url(url: str, destination: Path):
    try:
        request = urllib.request.Request(url, headers={'User-Agent': UA, 'Referer': 'https://www.pexels.com/'})
        with urllib.request.urlopen(request, timeout=180) as response, destination.open('wb') as output:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                output.write(chunk)
        if destination.stat().st_size < 250_000:
            raise RuntimeError('download too small')
        _, width, height, seconds = probe(destination)
        if max(width, height) < 1080 or seconds < 4:
            raise RuntimeError(f'quality gate failed {width}x{height} {seconds:.2f}s')
        return True
    except Exception as exc:
        print('direct download failed', url, exc)
        destination.unlink(missing_ok=True)
        return False


def pexels_candidates(video_id: int):
    page = f'https://www.pexels.com/video/{video_id}/'
    request = urllib.request.Request(page, headers={'User-Agent': UA})
    try:
        html = urllib.request.urlopen(request, timeout=90).read().decode('utf-8', 'ignore')
    except Exception as exc:
        print('Pexels page parse failed', video_id, exc)
        return []
    urls = re.findall(r'https:\\?/\\?/[^"<> ]+?\.mp4(?:\\?[^"<> ]*)?', html)
    urls = [url.replace('\\/', '/') for url in urls]
    urls = list(dict.fromkeys(urls))
    urls.sort(key=lambda url: (('2160' in url or '3840' in url), ('1080' in url or '1920' in url), len(url)), reverse=True)
    return urls


def download_pexels(name: str, ids):
    destination = RAW / f'{name}.mp4'
    for video_id in ids:
        print(f'Pexels {name}: trying unique source {video_id}')
        candidates = [
            *pexels_candidates(video_id),
            f'https://www.pexels.com/download/video/{video_id}/',
            f'https://www.pexels.com/video/{video_id}/download/',
        ]
        for url in candidates:
            if download_url(url, destination):
                return destination, video_id
    raise RuntimeError(f'No real high-resolution source available for {name}')


def download_falcon_success():
    destination = RAW / 'falcon_success_source.mp4'
    urls = [
        'https://www.dailymotion.com/video/x9b9bh6',
        'https://www.youtube.com/watch?v=To-XOPgaGsQ',
    ]
    for url in urls:
        try:
            run([
                'yt-dlp', '--no-playlist', '--retries', '4',
                '-f', 'bv*[height>=720]+ba/b[height>=720]/best',
                '--merge-output-format', 'mp4', '-o', str(destination), url,
            ])
            if destination.exists() and destination.stat().st_size > 1_000_000:
                return destination, url
        except Exception as exc:
            print('Falcon success source failed', url, exc)
            destination.unlink(missing_ok=True)
    raise RuntimeError('Actual Falcon 1 Flight 4 footage could not be downloaded')


def normalize(src: Path, dest: Path, start='0', position='center'):
    crop_x = '(in_w-out_w)/2'
    if position == 'left':
        crop_x = '0.34*(in_w-out_w)'
    elif position == 'right':
        crop_x = '0.66*(in_w-out_w)'
    vf = (
        'scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,'
        f'crop=1080:1920:{crop_x}:(in_h-out_h)/2,fps=30,'
        'eq=brightness=0.015:contrast=1.045:saturation=1.03,format=yuv420p'
    )
    run([
        'ffmpeg', '-y', '-stream_loop', '-1', '-ss', str(start), '-i', str(src), '-an', '-t', '15',
        '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-movflags', '+faststart', str(dest),
    ])


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    sources = []
    starts = {
        'hook_launch': '0.2',
        'island': '0.6',
        'failure_fire': '0.0',
        'flight_two': '0.5',
        'cargo_plane': '0.2',
        'repair_factory': '0.4',
    }
    positions = {'cargo_plane': 'left', 'repair_factory': 'right'}
    for name, ids in PEXELS.items():
        raw, source_id = download_pexels(name, ids)
        normalize(raw, OUT / f'{name}.mp4', start=starts[name], position=positions.get(name, 'center'))
        sources.append((name, f'https://www.pexels.com/video/{source_id}/'))

    falcon_raw, falcon_url = download_falcon_success()
    # The SpaceX retrospective places the Flight 4 launch and celebration at ~1:49.
    normalize(falcon_raw, OUT / 'falcon_success.mp4', start='109', position='center')
    sources.append(('falcon_success', falcon_url))

    lines = ['ELON FALCON 1 REAL-MEDIA MANIFEST']
    used = set()
    for name, url in sources:
        if url in used:
            raise RuntimeError(f'Source reused: {url}')
        used.add(url)
        path = OUT / f'{name}.mp4'
        codec, width, height, seconds = probe(path)
        if codec != 'h264' or width != 1080 or height != 1920 or seconds < 14.5:
            raise RuntimeError(f'Normalized asset failed: {name} {codec} {width}x{height} {seconds:.2f}s')
        lines.append(f'{name}: {url} -> {codec} {width}x{height} {seconds:.2f}s')
    lines.append('generated_images=0')
    lines.append('source_reuse=0')
    (OUT / 'ASSET_REPORT.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('\n'.join(lines))


if __name__ == '__main__':
    main()
