import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {TOTAL_FRAMES, WORDS, TimedWord} from './timings';

const YELLOW = '#FFD400';
const CREAM = '#F7F2E8';
const BLACK = '#111111';
const WHITE = '#FFFFFF';
const MIN_HOLD = 18;

const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9'-]/g, '');
const matches = (needle: string) => WORDS.map((word, index) => ({word, index})).filter(({word}) => norm(word.word) === norm(needle));
const indexOf = (needle: string, occurrence = 0) => matches(needle)[occurrence]?.index ?? 0;
const at = (needle: string, occurrence = 0) => WORDS[indexOf(needle, occurrence)]?.startFrame ?? 0;
const endAt = (needle: string, occurrence = 0) => WORDS[indexOf(needle, occurrence)]?.endFrame ?? at(needle, occurrence) + 7;
const minAfter = (candidate: number, previous: number, minimum = MIN_HOLD) => Math.max(candidate, previous + minimum);

type Entry = 'soft' | 'push-left' | 'push-up' | 'punch';

const VideoFill: React.FC<{
  src: string;
  startFrom?: number;
  pos?: string;
  brightness?: number;
  entry?: Entry;
}> = ({src, startFrom = 0, pos = '50% 50%', brightness = 1.05, entry = 'soft'}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const drift = interpolate(frame, [0, 110], [1.015, 1.065], {extrapolateRight: 'clamp'});
  const entryX = entry === 'push-left' ? interpolate(frame, [0, 7], [95, 0], {extrapolateRight: 'clamp'}) : 0;
  const entryY = entry === 'push-up' ? interpolate(frame, [0, 7], [70, 0], {extrapolateRight: 'clamp'}) : 0;
  const punch = entry === 'punch' ? interpolate(frame, [0, 3, 8], [1.12, 0.995, 1], {extrapolateRight: 'clamp'}) : 1;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: CREAM}}>
      <OffthreadVideo
        muted
        src={staticFile(src)}
        startFrom={startFrom}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: pos,
          opacity: entry === 'soft' ? reveal : 1,
          transform: `translate(${entryX}px, ${entryY}px) scale(${drift * punch})`,
          filter: `brightness(${brightness}) contrast(1.035) saturate(1.035)`,
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(180deg,rgba(0,0,0,.04),transparent 30%,transparent 72%,rgba(0,0,0,.16))'}} />
    </AbsoluteFill>
  );
};

const Clip: React.FC<{
  from: number;
  to: number;
  src: string;
  startFrom?: number;
  pos?: string;
  brightness?: number;
  entry?: Entry;
  label?: string;
}> = ({from, to, ...props}) => (
  <Sequence from={from} durationInFrames={Math.max(MIN_HOLD, to - from)}>
    <VideoFill {...props} />
  </Sequence>
);

const ProofCard: React.FC<{
  from: number;
  to: number;
  kind: 'white' | 'yellow';
  eyebrow: string;
  hero: string;
  sub: string;
}> = ({from, to, kind, eyebrow, hero, sub}) => (
  <Sequence from={from} durationInFrames={Math.max(MIN_HOLD, to - from)}>
    <ProofCardInner kind={kind} eyebrow={eyebrow} hero={hero} sub={sub} />
  </Sequence>
);

const ProofCardInner: React.FC<{kind: 'white' | 'yellow'; eyebrow: string; hero: string; sub: string}> = ({kind, eyebrow, hero, sub}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 5], [0, 1], {extrapolateRight: 'clamp'});
  const heroY = interpolate(frame, [0, 8], [55, 0], {extrapolateRight: 'clamp'});
  const line = interpolate(frame, [4, 12], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: kind === 'yellow' ? YELLOW : CREAM, color: BLACK, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: 900, textAlign: 'center', opacity: reveal}}>
        <div style={{fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 26, fontWeight: 900, letterSpacing: 8}}>{eyebrow}</div>
        <div style={{marginTop: 28, fontFamily: "'Arial Narrow', Arial, sans-serif", fontSize: hero.length > 8 ? 145 : 206, fontWeight: 900, letterSpacing: -7, lineHeight: .84, transform: `translateY(${heroY}px)`}}>{hero}</div>
        <div style={{width: `${line * 560}px`, height: 9, margin: '38px auto 30px', background: kind === 'yellow' ? BLACK : YELLOW}} />
        <div style={{fontFamily: 'Georgia, Times New Roman, serif', fontSize: 38, fontStyle: 'italic', fontWeight: 700, lineHeight: 1.12}}>{sub}</div>
      </div>
    </AbsoluteFill>
  );
};

const getCuts = () => {
  const airportEnd = Math.max(58, at('dentist') - 2);
  const dishesEnd = minAfter(at('His') - 2, airportEnd, 42);
  const identityEnd = minAfter(at('When') - 3, dishesEnd, 44);
  const boardEnd = minAfter(at('three') - 3, identityEnd, 32);
  const ceoCardEnd = Math.max(boardEnd + 42, endAt('months') + 5);
  const pitchEnd = minAfter(at('At') - 3, ceoCardEnd, 38);
  const phoneEnd = minAfter(at('two-thirds') - 4, pitchEnd, 38);
  const metricEnd = Math.max(phoneEnd + 40, endAt('day') + 5);
  const financeEnd = minAfter(at('Now') - 3, metricEnd, 34);
  const finalStart = Math.max(minAfter(at('manages') - 3, financeEnd, 30), at('one') - 3);
  return {airportEnd, dishesEnd, identityEnd, boardEnd, ceoCardEnd, pitchEnd, phoneEnd, metricEnd, financeEnd, finalStart};
};

const Timeline: React.FC = () => {
  const cuts = getCuts();
  return (
    <AbsoluteFill>
      {/* Every source file appears exactly once. */}
      <Clip from={0} to={cuts.airportEnd} src="media/family_airport.mp4" startFrom={9} pos="50% 48%" brightness={1.09} entry="punch" />
      <Clip from={cuts.airportEnd} to={cuts.dishesEnd} src="media/dishwasher.mp4" startFrom={22} pos="50% 50%" brightness={1.12} entry="push-left" />
      <Clip from={cuts.dishesEnd} to={cuts.identityEnd} src="media/gouw_wapo.mp4" startFrom={10} pos="52% 43%" brightness={1.10} entry="soft" />
      <Clip from={cuts.identityEnd} to={cuts.boardEnd} src="media/startup_board.mp4" startFrom={18} pos="50% 48%" brightness={1.09} entry="push-up" />
      <ProofCard from={cuts.boardEnd} to={cuts.ceoCardEnd} kind="white" eyebrow="STARTUP CHAOS" hero="3 CEOs" sub="in twelve months" />
      <Clip from={cuts.ceoCardEnd} to={cuts.pitchEnd} src="media/vc_pitch.mp4" startFrom={15} pos="50% 47%" brightness={1.10} entry="push-left" />
      <Clip from={cuts.pitchEnd} to={cuts.phoneEnd} src="media/facebook_phone.mp4" startFrom={18} pos="50% 50%" brightness={1.16} entry="punch" />
      <ProofCard from={cuts.phoneEnd} to={cuts.metricEnd} kind="white" eyebrow="FACEBOOK'S SIGNAL" hero="2 IN 3" sub="returned every day" />
      <Clip from={cuts.metricEnd} to={cuts.financeEnd} src="media/finance_city.mp4" startFrom={11} pos="50% 48%" brightness={1.13} entry="soft" />
      <Clip from={cuts.financeEnd} to={cuts.finalStart} src="media/acrew_team.mp4" startFrom={20} pos="50% 47%" brightness={1.10} entry="push-up" />
      <ProofCard from={cuts.finalStart} to={TOTAL_FRAMES} kind="yellow" eyebrow="ACREW CAPITAL" hero="$1.7B" sub="under management" />
    </AbsoluteFill>
  );
};

const HookTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const titleEnd = Math.min(getCuts().airportEnd, 72);
  if (frame >= titleEnd) return null;
  const reveal = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const y = interpolate(frame, [0, 9], [52, 0], {extrapolateRight: 'clamp'});
  const arrow = interpolate(frame, [6, 15], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', padding: '0 76px', background: 'linear-gradient(90deg,rgba(0,0,0,.64),rgba(0,0,0,.10) 78%)'}}>
      <div style={{opacity: reveal, transform: `translateY(${y}px)`, marginTop: -70}}>
        <div style={{fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 24, fontWeight: 900, letterSpacing: 7, color: YELLOW}}>ZELRO · ORIGIN STORY</div>
        <div style={{marginTop: 24, fontFamily: "'Arial Narrow', Arial, sans-serif", fontSize: 116, fontWeight: 900, letterSpacing: -5, lineHeight: .84, color: WHITE}}>DENTIST</div>
        <div style={{height: 10, width: `${arrow * 560}px`, background: YELLOW, margin: '26px 0 22px'}} />
        <div style={{fontFamily: 'Georgia, Times New Roman, serif', fontSize: 84, fontWeight: 700, fontStyle: 'italic', letterSpacing: -3, lineHeight: .92, color: WHITE}}>TO DISHWASHER</div>
        <div style={{marginTop: 34, fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 31, fontWeight: 900, lineHeight: 1.18, color: WHITE}}>HIS DAUGHTER BECAME<br/><span style={{color: YELLOW}}>A BILLIONAIRE VC.</span></div>
      </div>
    </AbsoluteFill>
  );
};

const activeWordIndex = (frame: number) => {
  if (!WORDS.length || frame < WORDS[0].startFrame) return -1;
  let active = 0;
  for (let index = 0; index < WORDS.length; index++) {
    if (WORDS[index].startFrame <= frame) active = index;
    else break;
  }
  return active;
};

const hiddenOnCard = new Set(['three', 'twelve', 'months', 'two-thirds', 'users', 'returned', 'every', 'day', 'one', 'point', 'seven', 'billion']);

const wordStyle = (item: TimedWord) => {
  const word = norm(item.word);
  if (['theresia', "gouw's", 'gouw', 'acrew', 'accel'].includes(word)) return {size: 82, weight: 900, color: WHITE, font: "'Arial Narrow',Arial,sans-serif", entry: 'hard'};
  if (word === 'dentist') return {size: 92, weight: 900, color: WHITE, font: 'Georgia,Times New Roman,serif', entry: 'blur'};
  if (word === 'dishwasher') return {size: 102, weight: 900, color: YELLOW, font: "'Arial Narrow',Arial,sans-serif", entry: 'punch'};
  if (['billionaire', 'fortune'].includes(word)) return {size: 104, weight: 900, color: YELLOW, font: "'Arial Narrow',Arial,sans-serif", entry: 'punch'};
  if (['startup', 'ceos', 'capitalist'].includes(word)) return {size: 88, weight: 900, color: WHITE, font: 'Georgia,Times New Roman,serif', entry: 'blur'};
  if (['facebook', "facebook's", 'advantage'].includes(word)) return {size: 88, weight: 900, color: YELLOW, font: "'Arial Narrow',Arial,sans-serif", entry: 'rise'};
  if (['fled', 'pushed', 'spotted', 'returned', 'manages'].includes(word)) return {size: 82, weight: 900, color: WHITE, font: "'Arial Narrow',Arial,sans-serif", entry: 'rise'};
  return {size: 61, weight: 700, color: WHITE, font: 'Arial,Helvetica,sans-serif', entry: 'rise'};
};

const CaptionWord: React.FC<{item: TimedWord; frame: number; active: boolean}> = ({item, frame, active}) => {
  const style = wordStyle(item);
  const age = frame - item.startFrame;
  const reveal = interpolate(age, [0, 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rise = style.entry === 'rise' ? interpolate(age, [0, 5], [20, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const scale = style.entry === 'punch' ? interpolate(age, [0, 2, 7], [.78, 1.09, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const blur = style.entry === 'blur' ? interpolate(age, [0, 5], [11, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: style.font,
      fontSize: active ? style.size : Math.max(54, style.size - 8),
      fontWeight: style.weight,
      lineHeight: .94,
      letterSpacing: -1.5,
      color: style.color,
      opacity: style.entry === 'hard' ? (active ? 1 : .76) : reveal * (active ? 1 : .76),
      transform: `translateY(${rise}px) scale(${scale})`,
      filter: `blur(${blur}px)`,
      textShadow: '0 4px 15px rgba(0,0,0,.88)',
      WebkitTextStroke: '0.7px rgba(0,0,0,.45)',
    }}>{item.word}</span>
  );
};

const isCardFrame = (frame: number) => {
  const cuts = getCuts();
  return (frame >= cuts.boardEnd && frame < cuts.ceoCardEnd)
    || (frame >= cuts.phoneEnd && frame < cuts.metricEnd)
    || frame >= cuts.finalStart;
};

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const current = activeWordIndex(frame);
  const titleEnd = Math.min(getCuts().airportEnd, 72);
  if (current < 0 || frame < titleEnd || isCardFrame(frame)) return null;
  const groupStart = Math.floor(current / 4) * 4;
  const visible = WORDS.slice(groupStart, current + 1).filter((word) => !hiddenOnCard.has(norm(word.word)));
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: '49%', left: 78, width: 924, transform: 'translateY(-50%)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', gap: '10px 14px', textAlign: 'center'}}>
        {visible.map((word, index) => (
          <CaptionWord key={`${groupStart + index}-${word.startFrame}`} item={word} frame={frame} active={groupStart + index === current} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const CutAccent: React.FC<{from: number; color?: string}> = ({from, color = YELLOW}) => (
  <Sequence from={Math.max(0, from - 3)} durationInFrames={9}>
    <CutAccentInner color={color} />
  </Sequence>
);

const CutAccentInner: React.FC<{color: string}> = ({color}) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 8], [-1250, 1250], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const opacity = interpolate(frame, [0, 2, 6, 8], [0, .62, .62, 0], {extrapolateRight: 'clamp'});
  return <div style={{position: 'absolute', left: 0, top: -250, width: 360, height: 2420, background: color, opacity, transform: `translateX(${x}px) rotate(9deg)`, transformOrigin: 'center'}} />;
};

const MotionAccents: React.FC = () => {
  const cuts = getCuts();
  return <AbsoluteFill style={{pointerEvents: 'none'}}>
    <CutAccent from={cuts.airportEnd} />
    <CutAccent from={cuts.dishesEnd} color={WHITE} />
    <CutAccent from={cuts.ceoCardEnd} />
    <CutAccent from={cuts.metricEnd} color={WHITE} />
  </AbsoluteFill>;
};

const GrowthWatermark: React.FC = () => {
  const frame = useCurrentFrame();
  const color = isCardFrame(frame) ? BLACK : YELLOW;
  return (
    <div style={{position: 'absolute', bottom: 76, left: '50%', transform: 'translateX(-50%)', width: 118, height: 54, opacity: .20, pointerEvents: 'none'}}>
      <svg width="118" height="54" viewBox="0 0 118 54" fill="none">
        <path d="M5 45 L32 31 L55 37 L91 10" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M77 10 H91 V24" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="5" cy="45" r="4" fill={color}/>
      </svg>
    </div>
  );
};

const Sound: React.FC = () => {
  const cuts = getCuts();
  return <>
    <Audio src={staticFile('media/narration.mp3')} volume={1} />
    <Audio src={staticFile('media/music.m4a')} volume={(frame) => interpolate(frame, [0, 18, TOTAL_FRAMES - 40, TOTAL_FRAMES], [.10, .135, .135, .18], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
    <Sequence from={0} durationInFrames={18}><Audio src={staticFile('media/impact.wav')} volume={.48} /></Sequence>
    <Sequence from={Math.max(0, cuts.airportEnd - 4)} durationInFrames={20}><Audio src={staticFile('media/whoosh.wav')} volume={.30} /></Sequence>
    <Sequence from={Math.max(0, cuts.dishesEnd - 4)} durationInFrames={20}><Audio src={staticFile('media/whoosh.wav')} volume={.26} /></Sequence>
    <Sequence from={Math.max(0, cuts.boardEnd - 2)} durationInFrames={18}><Audio src={staticFile('media/impact.wav')} volume={.44} /></Sequence>
    <Sequence from={cuts.boardEnd + 7} durationInFrames={10}><Audio src={staticFile('media/proof-click.wav')} volume={.42} /></Sequence>
    <Sequence from={Math.max(0, cuts.phoneEnd - 2)} durationInFrames={18}><Audio src={staticFile('media/impact.wav')} volume={.42} /></Sequence>
    <Sequence from={cuts.phoneEnd + 8} durationInFrames={10}><Audio src={staticFile('media/proof-click.wav')} volume={.44} /></Sequence>
    <Sequence from={Math.max(0, cuts.finalStart - 12)} durationInFrames={24}><Audio src={staticFile('media/riser.wav')} volume={.30} /></Sequence>
    <Sequence from={Math.max(0, cuts.finalStart - 1)} durationInFrames={20}><Audio src={staticFile('media/money-roll.wav')} volume={.46} /></Sequence>
    <Sequence from={cuts.finalStart + 7} durationInFrames={18}><Audio src={staticFile('media/scale-ding.wav')} volume={.62} /></Sequence>
  </>;
};

export const ZelroTheresiaGouw: React.FC = () => (
  <AbsoluteFill style={{background: CREAM}}>
    <Timeline />
    <HookTitle />
    <Captions />
    <MotionAccents />
    <GrowthWatermark />
    <Sound />
    <div style={{position: 'absolute', top: 62, left: 70, fontFamily: 'Arial, sans-serif', fontSize: 21, fontWeight: 900, letterSpacing: 4, color: isFinite(TOTAL_FRAMES) ? YELLOW : YELLOW, textShadow: '0 2px 8px rgba(0,0,0,.58)', opacity: .84}}>ZELRO</div>
  </AbsoluteFill>
);
