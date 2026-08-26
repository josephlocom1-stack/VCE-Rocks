import React from 'react';
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {PHRASES, SENTENCE_STARTS, TOTAL_FRAMES} from './timings';

const YELLOW = '#FFD400';
const CREAM = '#F5F0E6';
const BLACK = '#101010';
const WHITE = '#FFFFFF';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const s = (index: number) => SENTENCE_STARTS[index] ?? TOTAL_FRAMES;

const Scene: React.FC<{from: number; to: number; children: React.ReactNode; direction?: 'left' | 'up' | 'none'}> = ({from, to, children, direction = 'none'}) => (
  <Sequence from={from} durationInFrames={Math.max(18, to - from + 6)}>
    <SceneEntrance direction={direction}>{children}</SceneEntrance>
  </Sequence>
);

const SceneEntrance: React.FC<{children: React.ReactNode; direction: 'left' | 'up' | 'none'}> = ({children, direction}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 5], [0, 1], clamp);
  const x = direction === 'left' ? interpolate(frame, [0, 7], [95, 0], clamp) : 0;
  const y = direction === 'up' ? interpolate(frame, [0, 7], [75, 0], clamp) : 0;
  return <AbsoluteFill style={{opacity, transform: `translate(${x}px, ${y}px)`, overflow: 'hidden'}}>{children}</AbsoluteFill>;
};

const RealClip: React.FC<{src: string; startFrom?: number; position?: string; tone?: 'normal' | 'dark' | 'hot'}> = ({src, startFrom = 0, position = '50% 50%', tone = 'normal'}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 210], [1.02, 1.09], clamp);
  const filter = tone === 'hot'
    ? 'brightness(1.05) contrast(1.13) saturate(1.16)'
    : tone === 'dark'
      ? 'brightness(.84) contrast(1.14) saturate(.88)'
      : 'brightness(1.02) contrast(1.08) saturate(1.03)';
  return (
    <AbsoluteFill style={{background: BLACK}}>
      <OffthreadVideo
        muted
        src={staticFile(src)}
        startFrom={startFrom}
        style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, transform: `scale(${zoom})`, filter}}
      />
      <AbsoluteFill style={{background: 'linear-gradient(180deg,rgba(0,0,0,.06),rgba(0,0,0,.01) 42%,rgba(0,0,0,.72) 100%)'}} />
    </AbsoluteFill>
  );
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const wipe = interpolate(frame, [18, 33], [100, 0], clamp);
  const z = interpolate(frame, [0, 28], [.96, 1.04], clamp);
  return (
    <AbsoluteFill style={{background: YELLOW, overflow: 'hidden'}}>
      <RealClip src="media/hook_launch.mp4" tone="hot" position="54% 50%" />
      <AbsoluteFill style={{background: `linear-gradient(90deg,rgba(255,212,0,.92) 0%,rgba(255,212,0,.52) ${wipe}%,rgba(255,212,0,.05) 100%)`}} />
      <div style={{position: 'absolute', top: 250, left: -36, right: -36, textAlign: 'center', fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 246, fontWeight: 950, letterSpacing: -18, color: WHITE, opacity: .82, transform: `scale(${z})`}}>ZELRO</div>
      <div style={{position: 'absolute', left: 72, top: 112, padding: '15px 24px 12px', background: BLACK, color: YELLOW, fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 31, fontWeight: 950, letterSpacing: 6}}>ELON MUSK</div>
      <div style={{position: 'absolute', right: 70, top: 120, fontFamily: 'Arial, sans-serif', fontSize: 28, fontWeight: 900, color: BLACK, letterSpacing: 3}}>FALCON 1</div>
    </AbsoluteFill>
  );
};

const FlightCounter: React.FC<{active: number}> = ({active}) => (
  <div style={{position: 'absolute', left: 58, right: 58, top: 105, display: 'flex', gap: 12, zIndex: 10}}>
    {[1, 2, 3, 4].map((n) => (
      <div key={n} style={{flex: 1, height: 56, border: `4px solid ${n === active ? YELLOW : 'rgba(255,255,255,.45)'}`, background: n < active ? 'rgba(0,0,0,.72)' : n === active ? YELLOW : 'rgba(0,0,0,.30)', color: n === active ? BLACK : WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 25, fontWeight: 950}}>FLIGHT {n}</div>
    ))}
  </div>
);

const StageFailure: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame, fps, config: {damping: 17, stiffness: 90, mass: .8}});
  const separate = interpolate(frame, [12, 48], [0, 250], clamp);
  const recoil = interpolate(frame, [48, 80], [0, 165], clamp);
  const impact = interpolate(frame, [77, 84, 104], [0, 1, 0], clamp);
  const rotate = interpolate(frame, [82, 145], [0, -19], clamp);
  return (
    <AbsoluteFill style={{background: '#242424', color: WHITE, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'linear-gradient(150deg,rgba(255,212,0,.16),transparent 42%,rgba(255,255,255,.06))'}} />
      <FlightCounter active={3} />
      <div style={{position: 'absolute', top: 260, left: 72, right: 72, fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 87, lineHeight: .88, letterSpacing: -4}}>THE STAGES<br/><span style={{color: YELLOW}}>SEPARATED.</span></div>
      <div style={{position: 'absolute', left: 405, top: 760, width: 270, height: 660, transform: `rotate(${rotate}deg)`, transformOrigin: '50% 50%'}}>
        <div style={{position: 'absolute', left: 66, top: 0 - separate + recoil, width: 138, height: 310, borderRadius: '70px 70px 16px 16px', border: `8px solid ${WHITE}`, background: '#232323'}}>
          <div style={{position: 'absolute', left: 38, right: 38, top: 55, height: 14, background: YELLOW}} />
          <div style={{position: 'absolute', left: 42, top: -56, width: 54, height: 70, background: WHITE, clipPath: 'polygon(50% 0,100% 100%,0 100%)'}} />
        </div>
        <div style={{position: 'absolute', left: 50, top: 330 + separate * .25, width: 170, height: 320, border: `8px solid ${CREAM}`, background: '#444'}}>
          <div style={{position: 'absolute', left: 35, bottom: -90, width: 100, height: 95, background: `linear-gradient(${YELLOW},#FF5C00,transparent)`, clipPath: 'polygon(22% 0,78% 0,100% 100%,0 100%)', opacity: interpolate(frame, [38, 55, 92], [0, 1, .15], clamp)}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 120, right: 120, top: 1515, height: 10, background: 'rgba(255,255,255,.20)'}}>
        <div style={{width: `${interpolate(frame, [0, 110], [0, 100], clamp)}%`, height: '100%', background: YELLOW}} />
      </div>
      <div style={{position: 'absolute', top: 1560, left: 120, fontFamily: 'Arial, sans-serif', fontSize: 30, fontWeight: 900, letterSpacing: 3, color: CREAM}}>LEFTOVER THRUST</div>
      <div style={{position: 'absolute', inset: 0, background: YELLOW, opacity: impact * .72, transform: `scale(${1 + impact * .08})`}} />
      <div style={{position: 'absolute', top: 900, left: 0, right: 0, textAlign: 'center', fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 144, color: BLACK, opacity: impact, transform: `scale(${.6 + p * .4}) rotate(-6deg)`}}>COLLISION</div>
    </AbsoluteFill>
  );
};

const OneRocketLeft: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = [1, 2, 3, 4];
  return (
    <AbsoluteFill style={{background: BLACK, color: WHITE, padding: '150px 74px'}}>
      <div style={{fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 92, lineHeight: .91, letterSpacing: -5}}>SPACE X WAS<br/><span style={{background: YELLOW, color: BLACK, padding: '0 18px'}}>RUNNING OUT.</span></div>
      <div style={{position: 'absolute', left: 78, right: 78, top: 700, display: 'flex', gap: 24, alignItems: 'flex-end', height: 610}}>
        {bars.map((n, i) => {
          const reveal = interpolate(frame, [i * 8, i * 8 + 12], [0, 1], clamp);
          const failed = i < 3;
          return (
            <div key={n} style={{flex: 1, height: 560 - i * 56, background: failed ? '#454545' : YELLOW, color: failed ? WHITE : BLACK, border: `7px solid ${failed ? '#777' : YELLOW}`, transform: `scaleY(${reveal})`, transformOrigin: 'bottom', position: 'relative'}}>
              <div style={{position: 'absolute', top: 28, left: 0, right: 0, textAlign: 'center', fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 50}}>{n}</div>
              <div style={{position: 'absolute', bottom: 26, left: 0, right: 0, textAlign: 'center', fontFamily: 'Arial, sans-serif', fontSize: 28, fontWeight: 950}}>{failed ? 'FAILED' : 'LEFT'}</div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', bottom: 240, left: 74, right: 74, textAlign: 'center', fontFamily: 'Georgia, Times New Roman, serif', fontSize: 54, fontWeight: 800, fontStyle: 'italic'}}>One rocket. One chance.</div>
    </AbsoluteFill>
  );
};

const SeparationFix: React.FC = () => {
  const frame = useCurrentFrame();
  const duration = Math.max(120, s(15) - s(14));
  const p = interpolate(frame, [8, duration - 15], [0, 1], clamp);
  const leftGap = interpolate(p, [0, .55], [18, 105], clamp);
  const rightGap = interpolate(p, [.2, 1], [18, 330], clamp);
  return (
    <AbsoluteFill style={{background: BLACK, color: WHITE, padding: '145px 70px'}}>
      <div style={{fontFamily: 'Arial, sans-serif', fontSize: 29, fontWeight: 950, letterSpacing: 6, color: YELLOW}}>THE FIX</div>
      <div style={{marginTop: 24, fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 94, lineHeight: .88, letterSpacing: -5}}>WAIT<br/><span style={{color: YELLOW}}>LONGER.</span></div>
      <div style={{position: 'absolute', left: 70, right: 70, top: 630, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32}}>
        <RocketGap label="FLIGHT 3" gap={leftGap} bad />
        <RocketGap label="FLIGHT 4" gap={rightGap} />
      </div>
      <div style={{position: 'absolute', left: 70, right: 70, bottom: 250, height: 12, background: '#353535'}}>
        <div style={{height: '100%', width: `${p * 100}%`, background: YELLOW}} />
      </div>
      <div style={{position: 'absolute', left: 70, bottom: 185, fontFamily: 'Arial, sans-serif', fontSize: 28, fontWeight: 900, letterSpacing: 3}}>ENGINE OFF</div>
      <div style={{position: 'absolute', right: 70, bottom: 185, fontFamily: 'Arial, sans-serif', fontSize: 28, fontWeight: 900, letterSpacing: 3}}>SEPARATE</div>
    </AbsoluteFill>
  );
};

const RocketGap: React.FC<{label: string; gap: number; bad?: boolean}> = ({label, gap, bad = false}) => (
  <div style={{height: 720, border: `5px solid ${bad ? '#5C5C5C' : YELLOW}`, position: 'relative', overflow: 'hidden', background: '#191919'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 28, textAlign: 'center', fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 36, color: bad ? '#A9A9A9' : YELLOW}}>{label}</div>
    <div style={{position: 'absolute', left: 136, top: 150 - gap / 2, width: 130, height: 230, borderRadius: '70px 70px 8px 8px', background: WHITE}} />
    <div style={{position: 'absolute', left: 120, top: 390 + gap / 2, width: 162, height: 250, background: bad ? '#727272' : CREAM}} />
    <div style={{position: 'absolute', left: 132, top: 640 + gap / 2, width: 140, height: 72, background: bad ? '#FF6537' : YELLOW, opacity: .8, clipPath: 'polygon(18% 0,82% 0,100% 100%,0 100%)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 20, textAlign: 'center', fontFamily: 'Arial, sans-serif', fontSize: 25, fontWeight: 900, color: bad ? '#AAAAAA' : WHITE}}>{bad ? 'RECONTACT' : 'CLEAN GAP'}</div>
  </div>
);

const SuccessOrbit: React.FC = () => {
  const frame = useCurrentFrame();
  const orbit = interpolate(frame, [45, 170], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: BLACK}}>
      <RealClip src="media/falcon_success.mp4" startFrom={0} position="48% 50%" tone="hot" />
      <div style={{position: 'absolute', left: 80, top: 110, padding: '14px 20px', background: YELLOW, color: BLACK, fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 31, letterSpacing: 4}}>28 SEP 2008</div>
      <div style={{position: 'absolute', right: 85, top: 330, width: 250, height: 250, border: `5px solid rgba(255,255,255,.55)`, borderRadius: '50%', opacity: orbit}}>
        <div style={{position: 'absolute', left: 112, top: -18, width: 25, height: 58, background: YELLOW, transform: `rotate(${orbit * 260}deg)`, transformOrigin: '13px 143px'}} />
      </div>
      <div style={{position: 'absolute', right: 84, top: 600, color: WHITE, fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: 27, letterSpacing: 3, opacity: orbit}}>EARTH ORBIT</div>
    </AbsoluteFill>
  );
};

const LessonLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, Math.max(180, TOTAL_FRAMES - s(17) - 12)], [0, 1], clamp);
  const items = [
    {label: 'FAIL', color: '#353535'},
    {label: 'FIND', color: '#5A5A5A'},
    {label: 'CHANGE', color: YELLOW},
    {label: 'LAUNCH', color: WHITE},
  ];
  return (
    <AbsoluteFill style={{background: BLACK, color: WHITE, padding: '145px 60px'}}>
      <div style={{fontFamily: 'Arial, sans-serif', fontSize: 30, fontWeight: 950, letterSpacing: 6}}>WHAT ACTUALLY WORKED</div>
      <div style={{marginTop: 26, fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 86, lineHeight: .9, letterSpacing: -5}}>NOT BLIND<br/>PERSISTENCE.</div>
      <div style={{position: 'absolute', left: 68, right: 68, top: 690}}>
        {items.map((item, i) => {
          const reveal = interpolate(progress, [i * .18, i * .18 + .18], [0, 1], clamp);
          const light = i >= 2;
          return (
            <div key={item.label} style={{height: 190, marginBottom: 24, border: `6px solid ${light ? YELLOW : '#777'}`, background: item.color, color: light ? BLACK : WHITE, transform: `translateX(${(1 - reveal) * (i % 2 ? 90 : -90)}px)`, opacity: reveal, display: 'flex', alignItems: 'center', padding: '0 48px'}}>
              <div style={{width: 82, height: 82, borderRadius: 50, background: light ? BLACK : YELLOW, color: light ? WHITE : BLACK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 36}}>{i + 1}</div>
              <div style={{marginLeft: 38, fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 72, letterSpacing: -2}}>{item.label}</div>
              {i < items.length - 1 ? <div style={{marginLeft: 'auto', fontSize: 70, fontWeight: 950}}>→</div> : null}
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 72, right: 72, bottom: 150, textAlign: 'center', color: CREAM, fontFamily: 'Georgia, Times New Roman, serif', fontStyle: 'italic', fontWeight: 800, fontSize: 45}}>Learn faster than failure can finish you.</div>
    </AbsoluteFill>
  );
};

const CaptionLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const phraseIndex = PHRASES.findIndex((phrase) => frame >= phrase.startFrame && frame <= phrase.endFrame);
  if (phraseIndex < 0) return null;
  const phrase = PHRASES[phraseIndex];
  const center = frame < s(2) || (frame >= s(8) && frame < s(9));
  const left = phraseIndex % 5 === 2;
  const keyword = phrase.words[phrase.emphasis]?.word.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
  const editorial = ['failed', 'fourth', 'collided', 'money', 'one', 'orbit', 'persistence', 'learning', 'change'].includes(keyword);
  return (
    <div style={{position: 'absolute', zIndex: 50, left: 74, right: 74, top: center ? 740 : undefined, bottom: center ? undefined : 245, display: 'flex', flexWrap: 'wrap', justifyContent: left ? 'flex-start' : 'center', gap: '9px 13px', textAlign: left ? 'left' : 'center', filter: 'drop-shadow(0 5px 9px rgba(0,0,0,.72))'}}>
      {phrase.words.map((word, index) => {
        const visible = frame >= word.startFrame;
        if (!visible) return null;
        const current = frame >= word.startFrame && frame <= Math.max(word.endFrame + 3, phrase.words[index + 1]?.startFrame ?? phrase.endFrame);
        const emph = index === phrase.emphasis;
        const pop = spring({frame: frame - word.startFrame, fps: 30, config: {damping: 16, stiffness: emph ? 245 : 180, mass: .48}});
        const size = emph ? (editorial ? 104 : 88) : 72;
        return (
          <span key={`${word.startFrame}-${word.word}`} style={{display: 'inline-block', padding: emph ? '1px 11px 5px' : '0 1px', color: emph ? BLACK : WHITE, background: emph ? YELLOW : 'transparent', fontFamily: emph && editorial ? 'Georgia, Times New Roman, serif' : 'Arial Black, Impact, sans-serif', fontStyle: emph && editorial && phraseIndex % 2 === 1 ? 'italic' : 'normal', fontSize: size, fontWeight: 950, lineHeight: .94, letterSpacing: emph ? -3 : -2, opacity: interpolate(pop, [0, 1], [0, 1], clamp), transform: `translateY(${(1 - pop) * 34}px) scale(${(emph ? .76 : .88) + pop * (emph ? .32 : .12) + (current && emph ? .035 : 0)})`, transformOrigin: '50% 70%', WebkitTextStroke: emph ? '0' : '2px rgba(0,0,0,.55)'}}>{word.word}</span>
        );
      })}
    </div>
  );
};

const Soundtrack: React.FC = () => {
  const volume = (frame: number) => {
    if (frame < s(2)) return .25;
    if (frame < s(6)) return .17;
    if (frame < s(11)) return .13;
    if (frame < s(15)) return .20;
    if (frame < s(17)) return .30;
    return .24;
  };
  return (
    <>
      <Audio src={staticFile('media/narration.mp3')} volume={1} />
      <Audio src={staticFile('media/music.m4a')} volume={volume} />
      <Sequence from={s(1)} durationInFrames={18}><Audio src={staticFile('media/impact.wav')} volume={.58} /></Sequence>
      <Sequence from={s(4)} durationInFrames={18}><Audio src={staticFile('media/impact.wav')} volume={.48} /></Sequence>
      <Sequence from={s(8)} durationInFrames={18}><Audio src={staticFile('media/collision.wav')} volume={.78} /></Sequence>
      <Sequence from={s(10)} durationInFrames={18}><Audio src={staticFile('media/heartbeat.wav')} volume={.55} /></Sequence>
      <Sequence from={s(14)} durationInFrames={28}><Audio src={staticFile('media/riser.wav')} volume={.55} /></Sequence>
      <Sequence from={s(15)} durationInFrames={20}><Audio src={staticFile('media/launch.wav')} volume={.66} /></Sequence>
      <Sequence from={s(16)} durationInFrames={18}><Audio src={staticFile('media/proof.wav')} volume={.55} /></Sequence>
    </>
  );
};

export const ElonFalconReel: React.FC<{prototype?: boolean}> = ({prototype = false}) => {
  const end = prototype ? 450 : TOTAL_FRAMES;
  return (
    <AbsoluteFill style={{background: BLACK}}>
      <Scene from={0} to={s(2)} direction="none"><Hook /></Scene>
      <Scene from={s(2)} to={s(4)} direction="left"><RealClip src="media/island.mp4" position="52% 50%" /></Scene>
      <Scene from={s(4)} to={s(5)} direction="up"><><RealClip src="media/failure_fire.mp4" tone="hot" /><AbsoluteFill style={{background: 'rgba(255,156,0,.20)', mixBlendMode: 'screen'}} /><FlightCounter active={1} /></></Scene>
      {!prototype ? (
        <>
          <Scene from={s(5)} to={s(6)} direction="left"><><RealClip src="media/flight_two.mp4" startFrom={36} tone="normal" /><FlightCounter active={2} /></></Scene>
          <Scene from={s(6)} to={s(9)} direction="none"><StageFailure /></Scene>
          <Scene from={s(9)} to={s(11)} direction="up"><OneRocketLeft /></Scene>
          <Scene from={s(11)} to={s(13)} direction="left"><RealClip src="media/cargo_plane.mp4" tone="dark" position="48% 50%" /></Scene>
          <Scene from={s(13)} to={s(14)} direction="up"><RealClip src="media/repair_factory.mp4" tone="normal" /></Scene>
          <Scene from={s(14)} to={s(15)} direction="none"><SeparationFix /></Scene>
          <Scene from={s(15)} to={s(17)} direction="left"><SuccessOrbit /></Scene>
          <Scene from={s(17)} to={end} direction="up"><LessonLoop /></Scene>
        </>
      ) : null}
      <CaptionLayer />
      <Soundtrack />
    </AbsoluteFill>
  );
};
