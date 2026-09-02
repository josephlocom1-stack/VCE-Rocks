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
  useVideoConfig,
} from 'remotion';
import {PHRASES, SENTENCE_STARTS, TOTAL_FRAMES} from './timings';

const YELLOW = '#FFD400';
const CREAM = '#F2EDDF';
const BLACK = '#10100E';
const WHITE = '#FFFFFF';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const s = (index: number) => SENTENCE_STARTS[index] ?? TOTAL_FRAMES;
const duration = (fromSentence: number, toSentence: number) => Math.max(1, s(toSentence) - s(fromSentence));

const MEDIA = {
  a01: 'media/paypal/a01.mp4',
  a03: 'media/paypal/a03.mp4',
  a04: 'media/paypal/a04.mp4',
  a05: 'media/paypal/a05.mp4',
  a06: 'media/paypal/a06.mp4',
  a07: 'media/paypal/a07.mp4',
  a08: 'media/paypal/a08.mp4',
  a09: 'media/paypal/a09.mp4',
  a10: 'media/paypal/a10.mp4',
  a11: 'media/paypal/a11.mp4',
  a12: 'media/paypal/a12.mp4',
  a13: 'media/paypal/a13.mp4',
  a14: 'media/paypal/a14.mp4',
  a15: 'media/paypal/a15.png',
  a16: 'media/paypal/a16.mp4',
  a17: 'media/paypal/a17.mp4',
} as const;

type RealClipProps = {
  src: string;
  position?: string;
  startFrom?: number;
  label?: string;
};

const RealClip: React.FC<RealClipProps> = ({src, position = '50% 50%', startFrom = 0, label}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const scale = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [1.015, 1.055], clamp);

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: BLACK}}>
      <OffthreadVideo
        src={staticFile(src)}
        startFrom={startFrom}
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: position,
          transform: `scale(${scale})`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(8,8,8,.12) 0%, rgba(8,8,8,.02) 30%, rgba(8,8,8,.10) 55%, rgba(8,8,8,.42) 100%)',
        }}
      />
      {label ? (
        <div
          style={{
            position: 'absolute',
            top: 72,
            left: 58,
            padding: '10px 16px',
            background: 'rgba(0,0,0,.55)',
            color: WHITE,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: 1.3,
            borderLeft: `5px solid ${YELLOW}`,
          }}
        >
          {label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const BrandChrome: React.FC = () => (
  <>
    <div
      style={{
        position: 'absolute',
        left: 54,
        top: 52,
        color: WHITE,
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: 22,
        letterSpacing: 3.5,
        textShadow: '0 2px 12px rgba(0,0,0,.45)',
      }}
    >
      ZELRO
    </div>
    <div style={{position: 'absolute', left: 54, top: 87, width: 82, height: 5, background: YELLOW}} />
  </>
);

const CaptionLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const phrase = PHRASES.find((item) => frame >= item.startFrame && frame <= item.endFrame);
  if (!phrase) return null;

  const local = frame - phrase.startFrame;
  const opacity = interpolate(local, [0, 6], [0, 1], clamp);
  const y = interpolate(local, [0, 7], [12, 0], clamp);

  return (
    <div
      style={{
        position: 'absolute',
        left: 78,
        right: 78,
        top: '46%',
        transform: `translateY(${y}px)`,
        opacity,
        textAlign: 'center',
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: 66,
        lineHeight: 1.03,
        letterSpacing: -2.5,
        textTransform: 'uppercase',
        color: WHITE,
        textShadow: '0 4px 22px rgba(0,0,0,.86), 0 1px 3px rgba(0,0,0,.95)',
      }}
    >
      {phrase.words.map((word, index) => (
        <React.Fragment key={`${word.word}-${index}`}>
          <span style={{color: index === phrase.emphasis ? YELLOW : WHITE}}>{word.word}</span>
          {index < phrase.words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </div>
  );
};

const CompactOverlay: React.FC<{children: React.ReactNode; tone?: 'dark' | 'yellow'}> = ({children, tone = 'dark'}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [4, 12], [0, 1], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: 90,
        right: 90,
        top: 310,
        padding: '22px 26px',
        background: tone === 'yellow' ? YELLOW : 'rgba(0,0,0,.72)',
        color: tone === 'yellow' ? BLACK : WHITE,
        borderRadius: 10,
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: 40,
        lineHeight: 1.05,
        textAlign: 'center',
        transform: `translateY(${(1 - p) * 18}px)`,
        opacity: p,
      }}
    >
      {children}
    </div>
  );
};

const OwnershipGraphic: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [4, 28], [0, 1], clamp);
  const q = interpolate(frame, [26, 48], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: BLACK, color: WHITE, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', top: 72, left: 58, fontFamily: 'Arial Black', fontSize: 22, letterSpacing: 3}}>ZELRO</div>
      <div style={{fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 142, letterSpacing: -7, transform: `scale(${0.88 + p * 0.12})`}}>
        <span style={{color: YELLOW}}>7%</span>
        <span style={{padding: '0 34px', opacity: p}}>→</span>
        <span style={{opacity: q}}>$22M</span>
      </div>
      <div style={{marginTop: 34, fontFamily: 'Arial, sans-serif', fontSize: 30, fontWeight: 800, letterSpacing: 2, opacity: 0.78}}>
        OWNERSHIP → PERSONAL PROCEEDS
      </div>
    </AbsoluteFill>
  );
};

const EditorialCard: React.FC<{text: string; tone: 'cream' | 'yellow'}> = ({text, tone}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 8], [0.96, 1], clamp);
  const bg = tone === 'yellow' ? YELLOW : CREAM;
  return (
    <AbsoluteFill style={{background: bg, color: BLACK, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', top: 72, left: 58, fontFamily: 'Arial Black', fontSize: 22, letterSpacing: 3}}>ZELRO</div>
      <div
        style={{
          width: 870,
          fontFamily: 'Arial Black, Arial, sans-serif',
          fontSize: 92,
          lineHeight: 0.98,
          letterSpacing: -4,
          textAlign: 'center',
          transform: `scale(${p})`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const FilingProof: React.FC = () => (
  <AbsoluteFill style={{background: CREAM, alignItems: 'center', justifyContent: 'center'}}>
    <Img
      src={staticFile(MEDIA.a15)}
      style={{width: 900, maxHeight: 1240, objectFit: 'contain', filter: 'drop-shadow(0 18px 45px rgba(0,0,0,.16))'}}
    />
    <div
      style={{
        position: 'absolute',
        top: 135,
        right: 72,
        padding: '14px 18px',
        background: YELLOW,
        color: BLACK,
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: 30,
      }}
    >
      ≈12% OWNERSHIP
    </div>
  </AbsoluteFill>
);

const ClipSequence: React.FC<{
  fromSentence: number;
  toSentence: number;
  src: string;
  position?: string;
  label?: string;
  overlay?: React.ReactNode;
}> = ({fromSentence, toSentence, src, position, label, overlay}) => (
  <Sequence from={s(fromSentence)} durationInFrames={duration(fromSentence, toSentence)}>
    <RealClip src={src} position={position} label={label} />
    {overlay}
  </Sequence>
);

const Sfx: React.FC<{from: number; file: string; volume?: number}> = ({from, file, volume = 0.35}) => (
  <Sequence from={from} durationInFrames={30}>
    <Audio src={staticFile(`media/${file}`)} volume={volume} />
  </Sequence>
);

export const ElonPayPalReel: React.FC<{prototype?: boolean}> = () => {
  return (
    <AbsoluteFill style={{background: BLACK}}>
      <Audio src={staticFile('media/narration.mp3')} volume={1} />
      <Audio src={staticFile('media/music.m4a')} volume={0.20} />

      <ClipSequence fromSentence={0} toSentence={1} src={MEDIA.a01} position="52% 42%" label="X.COM / 2000" overlay={<CompactOverlay>BOARD REMOVED HIM AS CEO</CompactOverlay>} />
      <ClipSequence fromSentence={1} toSentence={2} src={MEDIA.a03} label="PAYPAL × EBAY" overlay={<CompactOverlay tone="yellow">$1.5 BILLION</CompactOverlay>} />
      <ClipSequence fromSentence={2} toSentence={3} src={MEDIA.a04} position="45% 42%" label="PAYPAL OWNERSHIP" overlay={<CompactOverlay>≈12% STILL OWNED</CompactOverlay>} />
      <ClipSequence fromSentence={3} toSentence={4} src={MEDIA.a05} position="42% 40%" label="MEET ELON MUSK" />
      <ClipSequence fromSentence={4} toSentence={6} src={MEDIA.a06} position="52% 42%" label="ZIP2 / 1995" />
      <ClipSequence fromSentence={6} toSentence={7} src={MEDIA.a07} position="48% 42%" label="EARLY SILICON VALLEY" />
      <ClipSequence fromSentence={7} toSentence={8} src={MEDIA.a08} label="ZIP2 → COMPAQ" overlay={<CompactOverlay tone="yellow">$307M CASH</CompactOverlay>} />

      <Sequence from={s(8)} durationInFrames={duration(8, 9)}>
        <OwnershipGraphic />
      </Sequence>

      <ClipSequence fromSentence={9} toSentence={10} src={MEDIA.a09} position="48% 42%" label="X.COM" />
      <ClipSequence
        fromSentence={10}
        toSentence={11}
        src={MEDIA.a10}
        label="X.COM"
        overlay={<CompactOverlay>BANKING · INVESTMENTS · PAYMENTS</CompactOverlay>}
      />
      <ClipSequence
        fromSentence={11}
        toSentence={12}
        src={MEDIA.a11}
        label="EARLY ONLINE PAYMENTS"
        overlay={<CompactOverlay tone="yellow">SENDER → EMAIL → RECIPIENT</CompactOverlay>}
      />
      <ClipSequence fromSentence={12} toSentence={13} src={MEDIA.a12} position="50% 42%" label="CONFINITY / PAYPAL" />
      <ClipSequence
        fromSentence={13}
        toSentence={14}
        src={MEDIA.a13}
        label="2000"
        overlay={<CompactOverlay tone="yellow">X.COM + CONFINITY → PAYPAL</CompactOverlay>}
      />
      <ClipSequence fromSentence={14} toSentence={15} src={MEDIA.a14} position="50% 42%" label="BOARD REPLACED MUSK" />

      <Sequence from={s(15)} durationInFrames={duration(15, 16)}>
        <EditorialCard tone="yellow" text="LOSING THE CEO JOB DIDN'T ERASE HIS SHARES." />
      </Sequence>

      <Sequence from={s(16)} durationInFrames={duration(16, 17)}>
        <FilingProof />
      </Sequence>

      <ClipSequence fromSentence={17} toSentence={18} src={MEDIA.a16} label="PAYPAL → EBAY" overlay={<CompactOverlay tone="yellow">$1.5 BILLION</CompactOverlay>} />

      <Sequence from={s(18)} durationInFrames={duration(18, 19)}>
        <EditorialCard tone="cream" text="LOST THE CEO JOB." />
      </Sequence>
      <Sequence from={s(19)} durationInFrames={duration(19, 20)}>
        <EditorialCard tone="yellow" text="KEPT THE SHARES." />
      </Sequence>

      <Sequence from={s(20)} durationInFrames={Math.max(1, TOTAL_FRAMES - s(20))}>
        <RealClip src={MEDIA.a17} position="50% 40%" label="MUSK LATER SAID" />
        <CompactOverlay tone="yellow">≈$180M AFTER TAX</CompactOverlay>
      </Sequence>

      <BrandChrome />
      <CaptionLayer />

      <Sfx from={s(1)} file="impact.wav" volume={0.30} />
      <Sfx from={s(8)} file="impact.wav" volume={0.28} />
      <Sfx from={s(13)} file="riser.wav" volume={0.20} />
      <Sfx from={s(16)} file="proof.wav" volume={0.22} />
      <Sfx from={s(19)} file="impact.wav" volume={0.22} />
      <Sfx from={s(20)} file="impact.wav" volume={0.28} />
    </AbsoluteFill>
  );
};
