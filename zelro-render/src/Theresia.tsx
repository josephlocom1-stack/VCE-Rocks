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
const PROOF_HOLD = 90;

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9'-]/g, '');
const matches = (needle: string) => WORDS.map((word, index) => ({word, index})).filter(({word}) => norm(word.word) === norm(needle));
const indexOf = (needle: string, occurrence = 0) => matches(needle)[occurrence]?.index ?? 0;
const at = (needle: string, occurrence = 0) => WORDS[indexOf(needle, occurrence)]?.startFrame ?? 0;
const endAt = (needle: string, occurrence = 0) => WORDS[indexOf(needle, occurrence)]?.endFrame ?? at(needle, occurrence) + 7;
const minAfter = (candidate: number, previous: number, minimum = MIN_HOLD) => Math.max(candidate, previous + minimum);

type Entry = 'soft' | 'punch';

type ClipProps = {
  src: string;
  startFrom?: number;
  pos?: string;
  brightness?: number;
  entry?: Entry;
};

const VideoFill: React.FC<ClipProps> = ({src, startFrom = 0, pos = '50% 50%', brightness = 1.05, entry = 'soft'}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 4], [0, 1], clamp);
  const drift = interpolate(frame, [0, 150], [1.01, 1.035], clamp);
  const punch = entry === 'punch' ? interpolate(frame, [0, 3, 9], [1.045, 0.998, 1], clamp) : 1;
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
          opacity: reveal,
          transform: `scale(${drift * punch})`,
          filter: `brightness(${brightness}) contrast(1.035) saturate(1.035)`,
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(180deg,rgba(0,0,0,.025),transparent 34%,transparent 76%,rgba(0,0,0,.12))'}} />
    </AbsoluteFill>
  );
};

const Clip: React.FC<{from: number; to: number} & ClipProps> = ({from, to, ...props}) => (
  <Sequence from={from} durationInFrames={Math.max(MIN_HOLD, to - from)}>
    <VideoFill {...props} />
  </Sequence>
);

const IdentityEditorial: React.FC<{from: number; to: number}> = ({from, to}) => (
  <Sequence from={from} durationInFrames={Math.max(60, to - from)}>
    <IdentityEditorialInner />
  </Sequence>
);

const IdentityEditorialInner: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 6], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: BLACK, color: WHITE, padding: '130px 68px', overflow: 'hidden'}}>
      <div style={{fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 27, fontWeight: 900, letterSpacing: 6, color: YELLOW, opacity: reveal}}>THERESIA GOUW</div>
      <div style={{marginTop: 22, fontFamily: "'Arial Narrow', Arial, sans-serif", fontSize: 85, fontWeight: 950, lineHeight: .9, letterSpacing: -4, opacity: reveal}}>THE DAUGHTER<br/>WHO BUILT HER<br/>OWN FORTUNE.</div>
      <div style={{marginTop: 38, width: 430, height: 9, background: YELLOW, opacity: reveal}} />
      <div style={{position: 'absolute', left: 60, right: 60, bottom: 155, height: 540, background: '#1D1D1D', border: `8px solid ${CREAM}`, overflow: 'hidden', boxShadow: '0 28px 80px rgba(0,0,0,.45)', opacity: reveal}}>
        <OffthreadVideo
          muted
          src={staticFile('media/gouw_wapo_contained.mp4')}
          startFrom={45}
          style={{width: '100%', height: '100%', objectFit: 'contain', background: '#050505'}}
        />
      </div>
    </AbsoluteFill>
  );
};

const PureCard: React.FC<{
  from: number;
  to: number;
  kind: 'white' | 'yellow';
  primary: string;
  secondary?: string;
}> = ({from, to, kind, primary, secondary}) => (
  <Sequence from={from} durationInFrames={Math.max(PROOF_HOLD, to - from)}>
    <PureCardInner kind={kind} primary={primary} secondary={secondary} />
  </Sequence>
);

const PureCardInner: React.FC<{kind: 'white' | 'yellow'; primary: string; secondary?: string}> = ({kind, primary, secondary}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 4], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: kind === 'yellow' ? YELLOW : WHITE, color: BLACK, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: 930, textAlign: 'center', opacity: enter}}>
        <div style={{fontFamily: "'Arial Narrow', Arial, sans-serif", fontSize: primary.length > 9 ? 150 : 205, fontWeight: 950, letterSpacing: -7, lineHeight: .86}}>{primary}</div>
        {secondary ? (
          <div style={{marginTop: 34, fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 54, fontWeight: 900, letterSpacing: -1, lineHeight: 1.02}}>{secondary}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// Founded benchmark timing is activity-rich but not cut-rich. For Theresia, the measured
// visual-activity interval is about 1.01s, while primary story states should hold 2–4s and
// proof/mechanism states 3–5s. New text + new visual receives extra processing time.
const getCuts = () => {
  const airportEnd = Math.max(76, at('dentist') - 3);
  const dishesEnd = minAfter(at('His') - 3, airportEnd, 60);
  const identityEnd = minAfter(at('When') - 4, dishesEnd, 66);
  const boardEnd = minAfter(at('three') - 4, identityEnd, 54);
  const ceoAnimEnd = Math.max(boardEnd + 90, endAt('months') + 18);
  const pitchEnd = minAfter(at('At') - 4, ceoAnimEnd, 60);
  const retentionEnd = minAfter(at('two-thirds') - 4, pitchEnd, 54);
  const metricEnd = Math.max(retentionEnd + PROOF_HOLD, endAt('day') + 24);
  const financeEnd = minAfter(at('Now') - 4, metricEnd, 60);
  const desiredFinalStart = Math.max(minAfter(at('manages') - 2, financeEnd, 48), at('one') - 4);
  const finalStart = Math.min(desiredFinalStart, Math.max(financeEnd, TOTAL_FRAMES - PROOF_HOLD));
  return {airportEnd, dishesEnd, identityEnd, boardEnd, ceoAnimEnd, pitchEnd, retentionEnd, metricEnd, financeEnd, finalStart};
};

const CeoTimelineAnimation: React.FC<{from: number; to: number}> = ({from, to}) => (
  <Sequence from={from} durationInFrames={Math.max(90, to - from)}>
    <CeoTimelineAnimationInner duration={Math.max(90, to - from)} />
  </Sequence>
);

const CeoTimelineAnimationInner: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [8, duration - 14], [0, 1], clamp);
  const title = interpolate(frame, [0, 6], [0, 1], clamp);
  const points = [0.14, 0.51, 0.86];
  return (
    <AbsoluteFill style={{background: BLACK, color: WHITE, padding: '160px 88px'}}>
      <div style={{fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 33, fontWeight: 900, letterSpacing: 6, opacity: title, color: YELLOW}}>12 MONTHS</div>
      <div style={{marginTop: 28, fontFamily: "'Arial Narrow', Arial, sans-serif", fontSize: 92, fontWeight: 950, lineHeight: .92, letterSpacing: -4}}>THREE CEO<br/>CHANGES.</div>
      <div style={{position: 'absolute', left: 100, right: 100, top: 930, height: 12, background: 'rgba(255,255,255,.18)', borderRadius: 8}}>
        <div style={{height: '100%', width: `${progress * 100}%`, background: YELLOW, borderRadius: 8}} />
      </div>
      {points.map((p, index) => {
        const local = interpolate(progress, [Math.max(0, p - .08), p], [0, 1], clamp);
        const x = 100 + p * 880;
        return (
          <React.Fragment key={index}>
            <div style={{position: 'absolute', left: x - 16, top: 920, width: 32, height: 32, borderRadius: 18, background: local > .02 ? YELLOW : '#4C4C4C', transform: `scale(${.78 + .22 * local})`}} />
            <div style={{position: 'absolute', left: x - 82, top: 1010, width: 164, opacity: local, textAlign: 'center'}}>
              <div style={{fontFamily: "'Arial Narrow', Arial, sans-serif", fontSize: 48, fontWeight: 950}}>CEO {index + 1}</div>
              <div style={{height: 6, background: index === 2 ? YELLOW : WHITE, marginTop: 12, opacity: .8}} />
            </div>
          </React.Fragment>
        );
      })}
      <div style={{position: 'absolute', left: 100, bottom: 210, fontFamily: 'Georgia, Times New Roman, serif', fontSize: 44, fontStyle: 'italic', fontWeight: 700, color: CREAM, opacity: interpolate(frame, [duration * .58, duration * .76], [0, 1], clamp)}}>Instability became the turning point.</div>
    </AbsoluteFill>
  );
};

const RetentionAnimation: React.FC<{from: number; to: number}> = ({from, to}) => (
  <Sequence from={from} durationInFrames={Math.max(78, to - from)}>
    <RetentionAnimationInner duration={Math.max(78, to - from)} />
  </Sequence>
);

const RetentionAnimationInner: React.FC<{duration: number}> = ({duration}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 5], [0, 1], clamp);
  const loop1 = interpolate(frame, [duration * .30, duration * .55], [0, 1], clamp);
  const loop2 = interpolate(frame, [duration * .48, duration * .73], [0, 1], clamp);
  const thirdFade = interpolate(frame, [duration * .50, duration * .78], [1, .26], clamp);
  return (
    <AbsoluteFill style={{background: CREAM, color: BLACK, padding: '120px 74px'}}>
      <div style={{fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 30, fontWeight: 900, letterSpacing: 6, color: BLACK}}>FACEBOOK'S REAL SIGNAL</div>
      <div style={{marginTop: 24, fontFamily: "'Arial Narrow', Arial, sans-serif", fontSize: 79, fontWeight: 950, lineHeight: .9, letterSpacing: -4}}>WHO CAME<br/>BACK TOMORROW?</div>
      <div style={{position: 'absolute', left: 72, top: 610, width: 440, height: 760, borderRadius: 48, overflow: 'hidden', border: '12px solid #151515', boxShadow: '0 24px 70px rgba(0,0,0,.18)', opacity: enter}}>
        <OffthreadVideo muted src={staticFile('media/facebook_phone.mp4')} startFrom={18} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      <div style={{position: 'absolute', right: 76, top: 660, width: 410}}>
        {[0, 1, 2].map((index) => {
          const y = index * 205;
          const returned = index < 2;
          const local = index === 0 ? loop1 : index === 1 ? loop2 : thirdFade;
          return (
            <div key={index} style={{position: 'absolute', top: y, left: 0, width: 410, height: 160, opacity: index === 2 ? thirdFade : 1}}>
              <div style={{position: 'absolute', left: 0, top: 20, width: 110, height: 110, borderRadius: 58, background: returned ? BLACK : '#8F8F8F', color: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Arial Narrow', Arial, sans-serif", fontSize: 42, fontWeight: 950}}>U{index + 1}</div>
              <div style={{position: 'absolute', left: 145, top: 28, fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 31, fontWeight: 900, color: returned ? BLACK : '#777'}}>DAY 1</div>
              {returned ? (
                <>
                  <div style={{position: 'absolute', left: 150, top: 82, width: `${190 * local}px`, height: 8, borderRadius: 8, background: YELLOW}} />
                  <div style={{position: 'absolute', right: 0, top: 60, width: 76, height: 76, borderRadius: 40, border: `8px solid ${YELLOW}`, opacity: local, transform: `rotate(${local * 260}deg)`}} />
                  <div style={{position: 'absolute', right: -3, top: 79, width: 0, height: 0, borderTop: '11px solid transparent', borderBottom: '11px solid transparent', borderLeft: `18px solid ${YELLOW}`, opacity: local}} />
                  <div style={{position: 'absolute', left: 150, top: 110, fontFamily: "'Arial Narrow', Arial, sans-serif", fontSize: 32, fontWeight: 950, opacity: local}}>RETURNED</div>
                </>
              ) : (
                <div style={{position: 'absolute', left: 150, top: 100, fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 28, fontWeight: 800, color: '#777', opacity: interpolate(frame, [duration * .56, duration * .76], [0, 1], clamp)}}>DIDN'T RETURN</div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Timeline: React.FC = () => {
  const cuts = getCuts();
  return (
    <AbsoluteFill>
      <Clip from={0} to={cuts.airportEnd} src="media/family_airport.mp4" startFrom={9} pos="50% 48%" brightness={1.09} entry="punch" />
      <Clip from={cuts.airportEnd} to={cuts.dishesEnd} src="media/dishwasher.mp4" startFrom={22} pos="50% 50%" brightness={1.12} />
      <IdentityEditorial from={cuts.dishesEnd} to={cuts.identityEnd} />
      <Clip from={cuts.identityEnd} to={cuts.boardEnd} src="media/startup_board.mp4" startFrom={18} pos="50% 48%" brightness={1.09} />
      <CeoTimelineAnimation from={cuts.boardEnd} to={cuts.ceoAnimEnd} />
      <Clip from={cuts.ceoAnimEnd} to={cuts.pitchEnd} src="media/vc_pitch.mp4" startFrom={15} pos="50% 47%" brightness={1.10} />
      <RetentionAnimation from={cuts.pitchEnd} to={cuts.retentionEnd} />
      <PureCard from={cuts.retentionEnd} to={cuts.metricEnd} kind="white" primary="2 IN 3" secondary="RETURNED EVERY DAY" />
      <Clip from={cuts.metricEnd} to={cuts.financeEnd} src="media/finance_city.mp4" startFrom={11} pos="50% 48%" brightness={1.13} />
      <Clip from={cuts.financeEnd} to={cuts.finalStart} src="media/acrew_team.mp4" startFrom={20} pos="50% 47%" brightness={1.10} />
      <PureCard from={cuts.finalStart} to={TOTAL_FRAMES} kind="yellow" primary="$1.7B" secondary="UNDER MANAGEMENT" />
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

type CaptionStyle = {
  size: number;
  weight: number;
  color: string;
  font: string;
  special: boolean;
};

const wordStyle = (item: TimedWord): CaptionStyle => {
  const word = norm(item.word);
  if (['dishwasher', 'billionaire', "facebook's", 'facebook', 'two-thirds', 'returned'].includes(word)) {
    return {size: 98, weight: 950, color: YELLOW, font: "'Arial Narrow',Arial,sans-serif", special: true};
  }
  if (['theresia', "gouw's", 'gouw', 'acrew', 'accel', 'dentist', 'ceos', 'fortune'].includes(word)) {
    return {size: 86, weight: 950, color: WHITE, font: "'Arial Narrow',Arial,sans-serif", special: false};
  }
  return {size: 70, weight: 800, color: WHITE, font: 'Arial,Helvetica,sans-serif', special: false};
};

const CaptionWord: React.FC<{item: TimedWord; frame: number}> = ({item, frame}) => {
  const style = wordStyle(item);
  const age = frame - item.startFrame;
  const scale = style.special ? interpolate(age, [0, 3, 9], [.90, 1.045, 1], clamp) : 1;
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: style.font,
      fontSize: style.size,
      fontWeight: style.weight,
      lineHeight: .98,
      letterSpacing: -1.5,
      color: style.color,
      opacity: 1,
      transform: `scale(${scale})`,
      textShadow: '0 4px 15px rgba(0,0,0,.88)',
      WebkitTextStroke: '0.6px rgba(0,0,0,.4)',
    }}>{item.word}</span>
  );
};

const isPureCardFrame = (frame: number) => {
  const cuts = getCuts();
  return (frame >= cuts.retentionEnd && frame < cuts.metricEnd) || frame >= cuts.finalStart;
};

const isCustomGraphicFrame = (frame: number) => {
  const cuts = getCuts();
  return (frame >= cuts.boardEnd && frame < cuts.ceoAnimEnd)
    || (frame >= cuts.pitchEnd && frame < cuts.metricEnd);
};

// Founded-style captions behave as stable short phrases. Normal words do not bounce,
// rise, blur or resize. Only a small number of story-critical words receive motion.
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const current = activeWordIndex(frame);
  const titleEnd = 76;
  if (current < 0 || frame < titleEnd || isCustomGraphicFrame(frame) || isPureCardFrame(frame)) return null;

  const groupSize = 4;
  const groupStart = Math.floor(current / groupSize) * groupSize;
  const groupEnd = Math.min(WORDS.length, groupStart + groupSize);
  const visible = WORDS.slice(groupStart, Math.min(current + 1, groupEnd));

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: '49%', left: 70, width: 940, transform: 'translateY(-50%)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline', gap: '11px 14px', textAlign: 'center'}}>
        {visible.map((word, offset) => (
          <CaptionWord key={`${groupStart + offset}-${word.startFrame}`} item={word} frame={frame} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const GrowthWatermark: React.FC = () => {
  const frame = useCurrentFrame();
  if (isPureCardFrame(frame)) return null;
  return (
    <div style={{position: 'absolute', bottom: 76, left: '50%', transform: 'translateX(-50%)', width: 118, height: 54, opacity: .18, pointerEvents: 'none'}}>
      <svg width="118" height="54" viewBox="0 0 118 54" fill="none">
        <path d="M5 45 L32 31 L55 37 L91 10" stroke={YELLOW} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M77 10 H91 V24" stroke={YELLOW} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="5" cy="45" r="4" fill={YELLOW}/>
      </svg>
    </div>
  );
};

const BrandBug: React.FC = () => {
  const frame = useCurrentFrame();
  if (isPureCardFrame(frame)) return null;
  return <div style={{position: 'absolute', top: 62, left: 70, fontFamily: 'Arial, sans-serif', fontSize: 21, fontWeight: 900, letterSpacing: 4, color: YELLOW, textShadow: '0 2px 8px rgba(0,0,0,.58)', opacity: .84}}>ZELRO</div>;
};

const Sound: React.FC = () => {
  const cuts = getCuts();
  const ceoDuration = Math.max(90, cuts.ceoAnimEnd - cuts.boardEnd);
  const retentionDuration = Math.max(78, cuts.retentionEnd - cuts.pitchEnd);
  const ceoTicks = [0.14, 0.51, 0.86].map((p) => cuts.boardEnd + Math.round(ceoDuration * p));
  const returnPops = [cuts.pitchEnd + Math.round(retentionDuration * .55), cuts.pitchEnd + Math.round(retentionDuration * .73)];

  const musicVolume = (frame: number) => {
    if (frame < 24) return interpolate(frame, [0, 24], [.26, .21], clamp);
    if (frame >= cuts.boardEnd && frame < cuts.ceoAnimEnd) return .24;
    if (frame >= cuts.retentionEnd && frame < cuts.metricEnd) return .17;
    if (frame >= cuts.finalStart) return interpolate(frame, [cuts.finalStart, TOTAL_FRAMES], [.30, .36], clamp);
    if (frame >= cuts.metricEnd && frame < cuts.financeEnd) return .21;
    return .22;
  };

  return <>
    <Audio src={staticFile('media/narration.mp3')} volume={1} />
    <Audio src={staticFile('media/music.m4a')} volume={musicVolume} />
    <Sequence from={0} durationInFrames={18}><Audio src={staticFile('media/impact.wav')} volume={.62} /></Sequence>
    <Sequence from={Math.max(0, cuts.airportEnd - 4)} durationInFrames={20}><Audio src={staticFile('media/whoosh.wav')} volume={.40} /></Sequence>
    <Sequence from={Math.max(0, cuts.boardEnd - 2)} durationInFrames={18}><Audio src={staticFile('media/impact.wav')} volume={.58} /></Sequence>
    {ceoTicks.map((tick, index) => <Sequence key={`ceo-${index}`} from={tick} durationInFrames={8}><Audio src={staticFile('media/timeline-tick.wav')} volume={.66} /></Sequence>)}
    <Sequence from={Math.max(0, cuts.pitchEnd - 2)} durationInFrames={18}><Audio src={staticFile('media/impact.wav')} volume={.50} /></Sequence>
    {returnPops.map((tick, index) => <Sequence key={`return-${index}`} from={tick} durationInFrames={8}><Audio src={staticFile('media/return-pop.wav')} volume={.64} /></Sequence>)}
    <Sequence from={cuts.retentionEnd + 10} durationInFrames={10}><Audio src={staticFile('media/proof-click.wav')} volume={.60} /></Sequence>
    <Sequence from={Math.max(0, cuts.finalStart - 12)} durationInFrames={24}><Audio src={staticFile('media/riser.wav')} volume={.52} /></Sequence>
    <Sequence from={Math.max(0, cuts.finalStart - 1)} durationInFrames={20}><Audio src={staticFile('media/money-roll.wav')} volume={.62} /></Sequence>
    <Sequence from={cuts.finalStart + 8} durationInFrames={18}><Audio src={staticFile('media/scale-ding.wav')} volume={.74} /></Sequence>
  </>;
};

export const ZelroTheresiaGouw: React.FC = () => (
  <AbsoluteFill style={{background: CREAM}}>
    <Timeline />
    <Captions />
    <GrowthWatermark />
    <BrandBug />
    <Sound />
  </AbsoluteFill>
);
