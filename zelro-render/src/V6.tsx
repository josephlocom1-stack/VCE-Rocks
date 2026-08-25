import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {TOTAL_FRAMES, WORDS} from './timings';

const YELLOW = '#FFD400';
const BONE = '#F4EEE4';
const DARK = '#09090A';
const VIOLET = '#C6A2FF';
const FADE = 6;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9'-]/g, '');
const matches = (needle: string) => WORDS.map((w, i) => ({w, i})).filter(({w}) => norm(w.word) === norm(needle));
const idx = (needle: string, occurrence = 0) => matches(needle)[occurrence]?.i ?? 0;
const at = (needle: string, occurrence = 0) => WORDS[idx(needle, occurrence)]?.startFrame ?? 0;
const endAt = (needle: string, occurrence = 0) => WORDS[idx(needle, occurrence)]?.endFrame ?? at(needle, occurrence) + 8;

const fadeOpacity = (local: number, duration: number) => {
  const intro = interpolate(local, [0, FADE], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const outro = interpolate(local, [Math.max(0, duration - FADE), duration], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return Math.min(intro, outro);
};

const VideoScene: React.FC<{
  from: number;
  to: number;
  src: string;
  startFrom?: number;
  pos?: string;
  scale?: number;
  filter?: string;
  violet?: boolean;
  darken?: number;
}> = ({from, to, src, startFrom = 0, pos = '50% 50%', scale = 1.03, filter = '', violet = false, darken = 0.18}) => {
  const duration = Math.max(1, to - from);
  return (
    <Sequence from={from} durationInFrames={duration}>
      <VideoSceneInner duration={duration} src={src} startFrom={startFrom} pos={pos} scale={scale} filter={filter} violet={violet} darken={darken} />
    </Sequence>
  );
};

const VideoSceneInner: React.FC<{
  duration: number;
  src: string;
  startFrom: number;
  pos: string;
  scale: number;
  filter: string;
  violet: boolean;
  darken: number;
}> = ({duration, src, startFrom, pos, scale, filter, violet, darken}) => {
  const f = useCurrentFrame();
  const zoom = scale + interpolate(f, [0, duration], [0, 0.028], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity: fadeOpacity(f, duration), overflow: 'hidden', backgroundColor: DARK}}>
      <OffthreadVideo
        muted
        src={staticFile(src)}
        startFrom={startFrom}
        style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: `scale(${zoom})`, filter}}
      />
      <AbsoluteFill style={{background: violet
        ? `linear-gradient(180deg, rgba(55,12,86,.14), rgba(77,16,128,.34)), rgba(0,0,0,${darken})`
        : `linear-gradient(180deg, rgba(0,0,0,.04), rgba(0,0,0,.38)), rgba(0,0,0,${darken})`}} />
    </AbsoluteFill>
  );
};

const ElonScene: React.FC<{from: number; to: number; end?: boolean}> = ({from, to, end = false}) => {
  const duration = Math.max(1, to - from);
  return (
    <Sequence from={from} durationInFrames={duration}>
      <ElonSceneInner duration={duration} end={end} />
    </Sequence>
  );
};

const ElonSceneInner: React.FC<{duration: number; end: boolean}> = ({duration, end}) => {
  const f = useCurrentFrame();
  const zoom = interpolate(f, [0, duration], [1.08, 1.13], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{opacity: fadeOpacity(f, duration), backgroundColor: DARK, overflow: 'hidden'}}>
      <Img src={staticFile('media/elon.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: end ? '54% 39%' : '52% 38%', transform: `scale(${zoom})`, filter: 'contrast(1.04) saturate(.82)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.06), rgba(0,0,0,.52))'}} />
    </AbsoluteFill>
  );
};

const Background: React.FC = () => {
  const n = Math.max(0, at('nightclub') - 3);
  const he = Math.max(n + 12, at('He') - 2);
  const covered = Math.max(he + 16, at('covered') - 2);
  const switched = Math.max(covered + 12, at('switched') - 2);
  const black = Math.max(switched + 10, at('blacklights') - 1);
  const some = Math.max(black + 16, at('Some') - 2);
  const fiveHundred = Math.max(some + 12, at('five', 1) - 5);
  const one = Math.max(fiveHundred + 16, at('One') - 2);
  const finalElon = Math.max(one + 22, at('Elon', 1) - 3);
  const operation = Math.max(finalElon + 16, at('operation') - 3);

  return (
    <AbsoluteFill>
      <ElonScene from={0} to={n + FADE} />
      <VideoScene from={Math.max(0, n - FADE)} to={he + FADE} src="media/club.mp4" startFrom={12} pos="50% 48%" filter="contrast(1.06) saturate(1.16)" violet darken={0.06} />
      <VideoScene from={Math.max(0, he - FADE)} to={covered + FADE} src="media/house.mp4" startFrom={18} pos="50% 48%" filter="contrast(1.03) saturate(.92)" darken={0.12} />
      <VideoScene from={Math.max(0, covered - FADE)} to={switched + FADE} src="media/house.mp4" startFrom={92} pos="48% 48%" filter="brightness(.66) contrast(1.10) saturate(.70)" darken={0.30} />
      <VideoScene from={Math.max(0, switched - FADE)} to={black + FADE} src="media/switch.mp4" startFrom={10} pos="50% 50%" filter="contrast(1.08) saturate(.78)" darken={0.10} />
      <VideoScene from={Math.max(0, black - FADE)} to={some + FADE} src="media/club.mp4" startFrom={115} pos="51% 47%" filter="contrast(1.12) saturate(1.24)" violet darken={0.03} />
      <VideoScene from={Math.max(0, some - FADE)} to={fiveHundred + FADE} src="media/house.mp4" startFrom={175} pos="50% 47%" filter="contrast(1.06) saturate(.98)" darken={0.10} />
      <VideoScene from={Math.max(0, fiveHundred - FADE)} to={one + FADE} src="media/club.mp4" startFrom={210} pos="50% 46%" filter="contrast(1.10) saturate(1.15)" violet darken={0.04} />
      <VideoScene from={Math.max(0, one - FADE)} to={finalElon + FADE} src="media/cash.mp4" startFrom={24} pos="50% 48%" filter="contrast(1.05) saturate(.84)" darken={0.12} />
      <ElonScene from={Math.max(0, finalElon - FADE)} to={operation + FADE} end />
      <VideoScene from={Math.max(0, operation - FADE)} to={TOTAL_FRAMES} src="media/cash.mp4" startFrom={120} pos="50% 48%" filter="contrast(1.08) saturate(.80)" darken={0.18} />
    </AbsoluteFill>
  );
};

const activeWordIndex = (frame: number) => {
  if (!WORDS.length || frame < WORDS[0].startFrame) return -1;
  let current = 0;
  for (let i = 0; i < WORDS.length; i++) {
    if (WORDS[i].startFrame <= frame) current = i;
    else break;
  }
  return current;
};

const firstFive = () => idx('five', 0);
const secondFive = () => idx('five', 1);
const hundred = () => idx('hundred', 0);
const dollars = () => idx('dollars', 0);

const flashOn = (frame: number) => {
  const a = at('nightclub');
  const b = at('rent');
  return (frame >= a - 1 && frame <= a + 2) || (frame >= b - 1 && frame <= b + 2);
};

const wordSpec = (word: string) => {
  const w = norm(word);
  if (w === 'nightclub') return {size: 126, font: "'Arial Narrow', Arial, sans-serif", weight: 900, color: YELLOW, entry: 'rise' as const, caps: true};
  if (w === 'ten-bedroom') return {size: 104, font: "'Arial Narrow', Arial, sans-serif", weight: 900, color: YELLOW, entry: 'punch' as const, caps: true};
  if (w === 'blacklights') return {size: 112, font: "'Arial Narrow', Arial, sans-serif", weight: 900, color: VIOLET, entry: 'hard' as const, caps: true};
  if (w === "month's") return {size: 92, font: "Georgia, 'Times New Roman', serif", weight: 800, color: BONE, entry: 'blur' as const, caps: false};
  if (w === 'rent') return {size: 120, font: "Georgia, 'Times New Roman', serif", weight: 900, color: YELLOW, entry: 'hard' as const, caps: true};
  if (w === 'sober') return {size: 96, font: "'Arial Narrow', Arial, sans-serif", weight: 900, color: BONE, entry: 'fade' as const, caps: true};
  if (w === 'operation') return {size: 126, font: "'Arial Narrow', Arial, sans-serif", weight: 900, color: YELLOW, entry: 'punch' as const, caps: true};
  if (w === 'elon' || w === 'musk') return {size: 82, font: "'Arial Narrow', Arial, sans-serif", weight: 900, color: BONE, entry: 'hard' as const, caps: true};
  return {size: 64, font: 'Arial, Helvetica, sans-serif', weight: 700, color: BONE, entry: 'rise' as const, caps: false};
};

const Caption: React.FC = () => {
  const frame = useCurrentFrame();
  const wi = activeWordIndex(frame);
  if (wi < 0) return null;
  if ([firstFive(), dollars(), secondFive(), hundred()].includes(wi)) return null;
  const item = WORDS[wi];
  const spec = wordSpec(item.word);
  const age = frame - item.startFrame;
  const reveal = interpolate(age, [0, 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const yMove = spec.entry === 'rise' ? interpolate(age, [0, 5], [24, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const scale = spec.entry === 'punch' ? interpolate(age, [0, 2, 7], [.78, 1.08, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const blur = spec.entry === 'blur' ? interpolate(age, [0, 6], [13, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const opacity = spec.entry === 'hard' ? 1 : reveal;
  const onFlash = flashOn(frame);
  const w = norm(item.word);
  const y = w === 'nightclub' ? 51 : w === 'operation' ? 55 : wi < idx('covered') ? 48 : wi < idx('Some') ? 52 : 49;
  const color = onFlash ? DARK : spec.color;

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: `${y}%`, width: 920, textAlign: 'center', transform: `translateY(calc(-50% + ${yMove}px)) scale(${scale})`, opacity, filter: `blur(${blur}px)`}}>
        <span style={{fontFamily: spec.font, fontSize: spec.size, lineHeight: .95, fontWeight: spec.weight, letterSpacing: spec.caps ? -2.4 : -1, color, textTransform: spec.caps ? 'uppercase' : 'none', textShadow: onFlash ? 'none' : '0 4px 24px rgba(0,0,0,.58)'}}>
          {item.word}
        </span>
        {(w === 'nightclub' || w === 'operation') && <div style={{height: 7, width: 150, margin: '18px auto 0', borderRadius: 9, background: onFlash ? YELLOW : YELLOW}} />}
      </div>
    </AbsoluteFill>
  );
};

const FlashPlate: React.FC = () => {
  const frame = useCurrentFrame();
  return flashOn(frame) ? <AbsoluteFill style={{backgroundColor: BONE}} /> : null;
};

const MoneyCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const settle = at('five', 0);
  const start = settle - 10;
  const end = endAt('dollars') + 8;
  if (frame < start || frame > end) return null;
  const values = [19, 2, 38, 7, 24, 3, 11, 4, 8, 5];
  const rolling = frame < settle;
  const value = rolling ? values[Math.max(0, frame - start) % values.length] : 5;
  const age = frame - settle;
  const scale = rolling ? 1 : interpolate(age, [0, 2, 8], [.82, 1.12, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'}}>
      <div style={{transform: `translateY(90px) scale(${scale})`, textAlign: 'center'}}>
        <div style={{fontFamily: "'Arial Narrow', Arial, sans-serif", fontWeight: 900, fontSize: 190, lineHeight: .82, letterSpacing: -10, color: YELLOW, textShadow: '0 8px 34px rgba(0,0,0,.62)'}}>${value}</div>
        <div style={{marginTop: 22, fontFamily: 'Arial, sans-serif', fontSize: 35, fontWeight: 900, letterSpacing: 9, color: BONE}}>ENTRY</div>
      </div>
    </AbsoluteFill>
  );
};

const Crowd500: React.FC = () => {
  const frame = useCurrentFrame();
  const start = at('five', 1);
  const end = endAt('hundred') + 13;
  if (frame < start || frame > end) return null;
  const age = frame - start;
  const scale = interpolate(age, [0, 2, 8], [.62, 1.10, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', pointerEvents: 'none'}}>
      <div style={{transform: `translateY(72px) scale(${scale})`, textAlign: 'center'}}>
        <div style={{fontFamily: "'Arial Narrow', Arial, sans-serif", fontWeight: 900, fontSize: 250, lineHeight: .78, letterSpacing: -14, color: YELLOW, textShadow: '0 9px 38px rgba(0,0,0,.68)'}}>500</div>
        <div style={{fontFamily: "'Arial Narrow', Arial, sans-serif", fontWeight: 900, fontSize: 43, letterSpacing: 10, color: BONE}}>PEOPLE</div>
      </div>
    </AbsoluteFill>
  );
};

const Watermark: React.FC = () => (
  <div style={{position: 'absolute', left: '50%', bottom: 88, transform: 'translateX(-50%)', opacity: .22, width: 124, height: 58, pointerEvents: 'none'}}>
    <svg width="124" height="58" viewBox="0 0 124 58" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 49 L34 33 L58 40 L96 10" stroke={YELLOW} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M80 10 H96 V26" stroke={YELLOW} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="49" r="4" fill={YELLOW}/>
    </svg>
  </div>
);

const Texture: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity: .045, mixBlendMode: 'screen', backgroundImage: `radial-gradient(circle at ${15 + (frame % 7) * 12}% ${12 + (frame % 5) * 18}%, rgba(255,255,255,.55) 0 1px, transparent 1.2px)`, backgroundSize: '9px 9px', pointerEvents: 'none'}} />;
};

const AudioBed: React.FC = () => {
  const money = Math.max(0, at('five', 0) - 10);
  const switchF = Math.max(0, at('switched') - 1);
  const club = Math.max(0, at('nightclub') - 4);
  const fiveHundred = Math.max(0, at('five', 1) - 8);
  const rent = Math.max(0, at('rent') - 1);
  const op = Math.max(0, at('operation') - 1);
  return (
    <>
      <Audio src={staticFile('media/narration.mp3')} volume={1} />
      <Audio src={staticFile('media/music.m4a')} volume={(f) => interpolate(f, [0, 18, Math.max(18, TOTAL_FRAMES - 35), TOTAL_FRAMES], [.12, .24, .24, .08], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      <Sequence from={0} durationInFrames={18}><Audio src={staticFile('media/impact.wav')} volume={.46} /></Sequence>
      <Sequence from={club} durationInFrames={28}><Audio src={staticFile('media/whoosh.wav')} volume={.42} /></Sequence>
      <Sequence from={switchF} durationInFrames={18}><Audio src={staticFile('media/switch.wav')} volume={.55} /></Sequence>
      <Sequence from={Math.max(0, at('blacklights') - 6)} durationInFrames={55}><Audio src={staticFile('media/crowd.m4a')} volume={.22} /></Sequence>
      <Sequence from={money} durationInFrames={30}><Audio src={staticFile('media/money-roll.wav')} volume={.58} /></Sequence>
      <Sequence from={at('five', 0)} durationInFrames={20}><Audio src={staticFile('media/cash-ding.wav')} volume={.68} /></Sequence>
      <Sequence from={fiveHundred} durationInFrames={34}><Audio src={staticFile('media/riser.wav')} volume={.38} /></Sequence>
      <Sequence from={at('five', 1)} durationInFrames={20}><Audio src={staticFile('media/impact.wav')} volume={.58} /></Sequence>
      <Sequence from={rent} durationInFrames={18}><Audio src={staticFile('media/paper-tick.wav')} volume={.40} /></Sequence>
      <Sequence from={op} durationInFrames={22}><Audio src={staticFile('media/impact.wav')} volume={.58} /></Sequence>
    </>
  );
};

export const ZelroV6: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: DARK}}>
    <Background />
    <FlashPlate />
    <Caption />
    <MoneyCounter />
    <Crowd500 />
    <Watermark />
    <Texture />
    <AudioBed />
  </AbsoluteFill>
);
