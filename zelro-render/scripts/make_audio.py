import subprocess
from pathlib import Path
from mido import MidiFile, MidiTrack, Message, MetaMessage, bpm2tempo

OUT = Path('public/media')
OUT.mkdir(parents=True, exist_ok=True)

mid = MidiFile(ticks_per_beat=480)
conductor = MidiTrack(); mid.tracks.append(conductor)
conductor.append(MetaMessage('set_tempo', tempo=bpm2tempo(154), time=0))
strings = MidiTrack(); mid.tracks.append(strings); strings.append(Message('program_change', program=48, channel=0, time=0))
horn = MidiTrack(); mid.tracks.append(horn); horn.append(Message('program_change', program=60, channel=1, time=0))
bass = MidiTrack(); mid.tracks.append(bass); bass.append(Message('program_change', program=43, channel=2, time=0))

def note(track, pitch, beats, vel, channel):
    track.append(Message('note_on', note=pitch, velocity=vel, channel=channel, time=0))
    track.append(Message('note_off', note=pitch, velocity=0, channel=channel, time=max(1, int(beats * 480))))

motifs = [
    ([55,55,55,51],[.34,.34,.34,1.18]),
    ([53,53,53,50],[.34,.34,.34,1.18]),
    ([58,58,58,55],[.34,.34,.34,1.18]),
    ([56,56,56,53],[.34,.34,.34,1.18]),
]
for cycle in range(9):
    pitches, lens = motifs[cycle % 4]
    octave = 12 if cycle in (3,7) else 0
    for p, l in zip(pitches, lens):
        note(strings, p + octave, l, 100 if l < 1 else 108, 0)
    note(horn, [55,53,58,56][cycle % 4], 1.5, 70, 1)
for i in range(64):
    root = [36,36,39,34][(i // 4) % 4]
    note(bass, root, .40, 62 if i % 4 else 82, 2)

midi_path = OUT / 'score.mid'; mid.save(midi_path)

sf_candidates = [Path('/usr/share/sounds/sf2/FluidR3_GM.sf2')]
for p in Path('/usr/share/sounds').rglob('*.sf2'):
    sf_candidates.append(p)
sf = next((p for p in sf_candidates if p.exists()), None)
if not sf:
    raise RuntimeError('No General MIDI soundfont found')

subprocess.check_call(['fluidsynth','-ni',str(sf),str(midi_path),'-F',str(OUT/'score.wav'),'-r','48000'])
subprocess.check_call(['ffmpeg','-y','-i',str(OUT/'score.wav'),'-t','24','-af','highpass=f=55,lowpass=f=15000,acompressor=threshold=-19dB:ratio=2.8:attack=12:release=150,volume=1.0,afade=t=in:st=0:d=.18,afade=t=out:st=22:d=1.4','-c:a','aac','-b:a','192k',str(OUT/'music.m4a')])

# Purpose-built short-form sound effects: restrained and aligned to semantic beats.
cmds = [
    ['ffmpeg','-y','-f','lavfi','-i','sine=frequency=72:duration=.42:sample_rate=48000','-af','volume=.9,afade=t=out:st=.05:d=.36',str(OUT/'impact.wav')],
    ['ffmpeg','-y','-f','lavfi','-i','anoisesrc=d=.46:c=pink:r=48000','-af','highpass=f=600,lowpass=f=7200,volume=.42,afade=t=in:st=0:d=.07,afade=t=out:st=.25:d=.2',str(OUT/'whoosh.wav')],
    ['ffmpeg','-y','-f','lavfi','-i','sine=frequency=1250:duration=.12:sample_rate=48000','-af','volume=.32,afade=t=out:st=.025:d=.09',str(OUT/'switch.wav')],
    ['ffmpeg','-y','-f','lavfi','-i','anoisesrc=d=.52:c=white:r=48000','-af','highpass=f=1100,lowpass=f=6800,tremolo=f=19:d=.88,volume=.32,afade=t=out:st=.39:d=.12',str(OUT/'money-roll.wav')],
    ['ffmpeg','-y','-f','lavfi','-i','aevalsrc=0.15*sin(2*PI*(230*t+1250*t*t)):d=.58:s=48000','-af','afade=t=in:st=0:d=.05,afade=t=out:st=.46:d=.12',str(OUT/'riser.wav')],
    ['ffmpeg','-y','-f','lavfi','-i','anoisesrc=d=.13:c=white:r=48000','-af','highpass=f=2800,lowpass=f=8500,volume=.22,afade=t=out:st=.025:d=.1',str(OUT/'paper-tick.wav')],
    ['ffmpeg','-y','-f','lavfi','-i','anoisesrc=d=1.8:c=pink:r=48000','-af','highpass=f=250,lowpass=f=5000,volume=.10,afade=t=out:st=1.2:d=.5','-c:a','aac',str(OUT/'crowd.m4a')],
]
for cmd in cmds:
    subprocess.check_call(cmd)
subprocess.check_call(['ffmpeg','-y','-f','lavfi','-i','sine=frequency=1850:duration=.42:sample_rate=48000','-f','lavfi','-i','sine=frequency=2470:duration=.42:sample_rate=48000','-filter_complex','[0:a]volume=.36[a];[1:a]volume=.19[b];[a][b]amix=inputs=2,afade=t=out:st=.08:d=.32',str(OUT/'cash-ding.wav')])
