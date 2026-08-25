import html
import re
import subprocess
import time
import urllib.request
from pathlib import Path

OUT = Path('public/media')
RAW = OUT / 'raw'
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'

# Every item is a different source asset. The reel may use each output file only once.
YOUTUBE = {
    'wang_leadership': ('https://www.youtube.com/watch?v=eRYP2arKkk0', '00:00:24-00:00:34'),
    'wang_gov24': ('https://www.youtube.com/watch?v=rnVQICBZg54', '00:00:22-00:00:32'),
    'wang_gov23': ('https://www.youtube.com/watch?v=ARfjcziFPtE', '00:00:24-00:00:34'),
    'wang_cnbc': ('https://www.youtube.com/watch?v=x9Ekl9Izd38', '00:00:08-00:00:18'),
}

PEXELS = {
    'server': [5028622],
    'code_human': [8275951],
    'autocar_wide': [33016018],
    'autocar_label': [36629601],
    'code_teach': [13522186],
    'data_screen': [9783691],
    'finance_screen': [7579576],
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
        urls = list(dict.fromkeys(urls))
        urls.sort(key=lambda u: (('1080' in u or '1920' in u or '2160' in u), ('hd' in u.lower()), len(u)), reverse=True)
        return urls
    except Exception as e:
        print('page parse failed', video_id, e)
        return []


def download_pexels(name: str, ids):
    dest = RAW / f'{name}.mp4'
    for video_id in ids:
        print(f'Pexels {name}: trying {video_id}')
        for u in [f'https://www.pexels.com/download/video/{video_id}/', f'https://www.pexels.com/video/{video_id}/download/']:
            if download_url(u, dest):
                return dest
        for u in find_pexels_mp4(video_id):
            if download_url(u, dest):
                return dest
    raise RuntimeError(f'No usable Pexels source for {name}')


def normalize(src: Path, dest: Path, brightness='1.10'):
    # Brightness is deliberately lifted because dark/muddy visuals fail the Zelro phone-readability gate.
    vf = (
        'scale=1080:1920:force_original_aspect_ratio=increase,'
        'crop=1080:1920,fps=30,'
        f'eq=brightness=0.04:contrast=1.03:saturation=1.05:gamma={brightness},'
        'format=yuv420p'
    )
    subprocess.check_call([
        'ffmpeg','-y','-i',str(src),'-an','-t','7',
        '-vf',vf,'-c:v','libx264','-preset','medium','-crf','17','-movflags','+faststart',str(dest)
    ])


def youtube_thumbnail(video_id: str, name: str):
    img = RAW / f'{name}.jpg'
    for base in ['maxresdefault','sddefault','hqdefault']:
        try:
            img.write_bytes(get(f'https://i.ytimg.com/vi/{video_id}/{base}.jpg'))
            if img.stat().st_size > 30_000:
                break
        except Exception:
            pass
    if not img.exists() or img.stat().st_size < 30_000:
        raise RuntimeError(f'No fallback thumbnail for {name}')
    out = OUT / f'{name}.mp4'
    subprocess.check_call([
        'ffmpeg','-y','-loop','1','-i',str(img),'-t','4.2','-an',
        '-vf',"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0007,1.07)':d=126:s=1080x1920:fps=30,eq=brightness=0.05:contrast=1.04:saturation=1.03,format=yuv420p",
        '-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',str(out)
    ])


def download_youtube(name: str, url: str, section: str):
    raw_template = str(RAW / f'{name}.%(ext)s')
    cmd = [
        'yt-dlp','--no-playlist','--download-sections',f'*{section}',
        '--force-keyframes-at-cuts','--merge-output-format','mp4',
        '-f','bv*[height>=720]+ba/b[height>=720]/best',
        '-o',raw_template,url,
    ]
    try:
        subprocess.check_call(cmd)
        candidates = sorted(RAW.glob(f'{name}.*'))
        video = next((p for p in candidates if p.suffix.lower() in {'.mp4','.webm','.mkv'}), None)
        if not video:
            raise RuntimeError('yt-dlp returned no video file')
        normalize(video, OUT / f'{name}.mp4', brightness='1.07')
        return
    except Exception as e:
        print('YouTube video failed; using unique source thumbnail fallback:', name, e)
        match = re.search(r'v=([A-Za-z0-9_-]+)', url)
        if not match:
            raise
        youtube_thumbnail(match.group(1), name)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)

    for name, (url, section) in YOUTUBE.items():
        download_youtube(name, url, section)

    for name, ids in PEXELS.items():
        raw = download_pexels(name, ids)
        # The screen sources are dark by nature; lift them further rather than hiding them under overlays.
        lift = '1.18' if name in {'code_human','code_teach','data_screen','finance_screen'} else '1.10'
        normalize(raw, OUT / f'{name}.mp4', brightness=lift)

    # Validate all unique outputs before rendering.
    expected = list(YOUTUBE) + list(PEXELS)
    seen = set()
    for name in expected:
        p = OUT / f'{name}.mp4'
        if not p.exists() or p.stat().st_size < 150_000:
            raise RuntimeError(f'Missing/weak normalized asset: {p}')
        if p.name in seen:
            raise RuntimeError(f'Duplicate output path: {p.name}')
        seen.add(p.name)
        print('\n--', name, '--')
        subprocess.check_call(['ffprobe','-v','error','-show_entries','stream=width,height,r_frame_rate:format=duration','-of','default=noprint_wrappers=1',str(p)])


if __name__ == '__main__':
    main()
