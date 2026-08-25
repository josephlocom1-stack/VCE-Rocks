import html
import re
import subprocess
import time
import urllib.request
from pathlib import Path

OUT = Path('public/media')
RAW = OUT / 'raw'
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

SOURCES = {
    'club': [7271837, 7722388, 9003210, 7269151],
    'house': [7804402, 10576660, 7804244],
    'switch': [4403890, 5498990, 35999374],
    'cash': [6266433, 6700011, 6266251, 5220473],
}


def get(url: str, timeout=120) -> bytes:
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Referer': 'https://www.pexels.com/'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def download_url(url: str, path: Path) -> bool:
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Referer': 'https://www.pexels.com/'})
            with urllib.request.urlopen(req, timeout=180) as r, path.open('wb') as f:
                while True:
                    chunk = r.read(1024 * 1024)
                    if not chunk:
                        break
                    f.write(chunk)
            if path.stat().st_size > 200_000:
                probe = subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=codec_name','-of','csv=p=0',str(path)], capture_output=True, text=True)
                if probe.returncode == 0 and probe.stdout.strip():
                    return True
        except Exception as e:
            print('download attempt failed', url, e)
        path.unlink(missing_ok=True)
        time.sleep(3 * (attempt + 1))
    return False


def find_pexels_mp4(video_id: int):
    page = f'https://www.pexels.com/video/{video_id}/'
    try:
        raw = get(page).decode('utf-8', errors='ignore')
        raw = html.unescape(raw).replace('\\u0026', '&').replace('\\/', '/')
        urls = re.findall(r'https://videos\.pexels\.com/video-files/[^"<> ]+?\.mp4(?:\?[^"<> ]*)?', raw)
        # Prefer portrait or 1080+ variants when file names expose them.
        urls = list(dict.fromkeys(urls))
        urls.sort(key=lambda u: (('1080' in u or '1920' in u), ('hd' in u.lower()), len(u)), reverse=True)
        if urls:
            return urls
    except Exception as e:
        print('page parse failed', video_id, e)
    return []


def download_pexels(name: str, ids):
    dest = RAW / f'{name}.mp4'
    for video_id in ids:
        print(f'Pexels {name}: trying {video_id}')
        # First try official public download redirects.
        direct_candidates = [
            f'https://www.pexels.com/download/video/{video_id}/',
            f'https://www.pexels.com/video/{video_id}/download/',
        ]
        for u in direct_candidates:
            if download_url(u, dest):
                print('downloaded', name, dest.stat().st_size)
                return dest
        # Then parse the public page for videos.pexels.com file URLs.
        for u in find_pexels_mp4(video_id):
            if download_url(u, dest):
                print('downloaded parsed', name, dest.stat().st_size, u)
                return dest
    raise RuntimeError(f'No usable real Pexels source downloaded for {name}')


def normalize(src: Path, dest: Path):
    # 12 seconds is enough for all selected source offsets. Preserve source motion; crop centrally for vertical.
    subprocess.check_call([
        'ffmpeg','-y','-i',str(src),'-an','-t','12',
        '-vf','scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p',
        '-c:v','libx264','-preset','medium','-crf','18','-movflags','+faststart',str(dest)
    ])


def download_elon():
    dest = OUT / 'elon.jpg'
    urls = [
        'https://upload.wikimedia.org/wikipedia/commons/c/cb/Elon_Musk_Royal_Society_crop.jpg',
        'https://commons.wikimedia.org/wiki/Special:Redirect/file/Elon_Musk_Royal_Society_crop.jpg?width=1200',
    ]
    for url in urls:
        for attempt in range(5):
            try:
                req = urllib.request.Request(url, headers={'User-Agent': UA})
                with urllib.request.urlopen(req, timeout=120) as r:
                    dest.write_bytes(r.read())
                if dest.stat().st_size > 80_000:
                    return
            except Exception as e:
                print('Elon image retry', attempt + 1, e)
                time.sleep(4 * (attempt + 1))
    raise RuntimeError('Unable to download real Elon identity image')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    download_elon()
    for name, ids in SOURCES.items():
        raw = download_pexels(name, ids)
        normalize(raw, OUT / f'{name}.mp4')
    for name in ['club','house','switch','cash']:
        subprocess.check_call(['ffprobe','-v','error','-show_entries','stream=width,height,r_frame_rate:format=duration','-of','default=noprint_wrappers=1',str(OUT / f'{name}.mp4')])


if __name__ == '__main__':
    main()
