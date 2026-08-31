import subprocess
from pathlib import Path

OUT = Path('public/media')
OUT.mkdir(parents=True, exist_ok=True)


def run(*args):
    subprocess.check_call(['ffmpeg', '-y', *args])

# Original, self-contained documentary/business bed. No external music download or license dependency.
run(
    '-f', 'lavfi', '-i', 'sine=frequency=73.42:duration=90:sample_rate=48000',
    '-f', 'lavfi', '-i', 'sine=frequency=110.00:duration=90:sample_rate=48000',
    '-f', 'lavfi', '-i', 'sine=frequency=146.83:duration=90:sample_rate=48000',
    '-f', 'lavfi', '-i', 'sine=frequency=220.00:duration=90:sample_rate=48000',
    '-f', 'lavfi', '-i', 'anoisesrc=color=pink:amplitude=0.018:duration=90:sample_rate=48000',
    '-filter_complex',
    '[0:a]volume=0.050,tremolo=f=0.125:d=0.28,lowpass=f=420[a0];'
    '[1:a]volume=0.026,tremolo=f=0.25:d=0.35,lowpass=f=620[a1];'
    '[2:a]volume=0.020,tremolo=f=0.125:d=0.22,lowpass=f=900[a2];'
    '[3:a]volume=0.010,tremolo=f=0.5:d=0.65,highpass=f=150,lowpass=f=1800[a3];'
    '[4:a]highpass=f=800,lowpass=f=5500,volume=0.13[a4];'
    '[a0][a1][a2][a3][a4]amix=inputs=5:normalize=0,'
    'acompressor=threshold=-28dB:ratio=1.8:attack=20:release=220,'
    'afade=t=in:st=0:d=0.35,afade=t=out:st=86.5:d=3.0,'
    'loudnorm=I=-24:LRA=5:TP=-3.0[out]',
    '-map', '[out]', '-c:a', 'aac', '-b:a', '192k', str(OUT / 'music.m4a')
)

# Major reversal / hero-number impact.
run(
    '-f', 'lavfi', '-i', 'sine=frequency=68:duration=0.42:sample_rate=48000',
    '-f', 'lavfi', '-i', 'sine=frequency=420:duration=0.20:sample_rate=48000',
    '-filter_complex',
    '[0:a]volume=.62,afade=t=out:st=.05:d=.34[lo];'
    '[1:a]volume=.16,afade=t=out:st=.02:d=.15[hi];'
    '[lo][hi]amix=inputs=2:normalize=0,alimiter=limit=.90[out]',
    '-map', '[out]', '-c:a', 'pcm_s16le', str(OUT / 'impact.wav')
)

# Evidence tick for filings and transaction proof.
run(
    '-f', 'lavfi', '-i', 'sine=frequency=1120:duration=0.19:sample_rate=48000',
    '-f', 'lavfi', '-i', 'sine=frequency=1680:duration=0.19:sample_rate=48000',
    '-filter_complex',
    '[0:a]volume=.28,afade=t=out:st=.035:d=.13[a];'
    '[1:a]volume=.13,afade=t=out:st=.025:d=.13[b];'
    '[a][b]amix=inputs=2:normalize=0[out]',
    '-map', '[out]', '-c:a', 'pcm_s16le', str(OUT / 'proof.wav')
)

# Restrained transition cue.
run(
    '-f', 'lavfi', '-i', 'sine=frequency=180:duration=0.72:sample_rate=48000',
    '-filter_complex',
    '[0:a]asetrate=56640,aresample=48000,highpass=f=140,volume=.18,'
    'afade=t=in:st=0:d=.08,afade=t=out:st=.48:d=.20[out]',
    '-map', '[out]', '-c:a', 'pcm_s16le', str(OUT / 'riser.wav')
)

report = [
    'ELON PAYPAL MUSIC + SOUND DESIGN',
    'music_source=original procedural instrumental generated locally in workflow',
    'external_music_dependency=none',
    'music_character=restrained documentary/business pulse; low harmonic bed; subtle air',
    'sfx=original impact + proof tick + restrained transition cue',
    'mix_role=voice remains dominant; music supplies forward motion rather than trailer bombast',
    'delivery_master_target=-14 LUFS; true peak below -1 dBTP',
]
(OUT / 'MUSIC_AUDITION_REPORT.txt').write_text('\n'.join(report) + '\n', encoding='utf-8')
print('\n'.join(report))
