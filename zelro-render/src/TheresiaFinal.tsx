import React from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {ZelroTheresiaGouw as BaseReel} from './Theresia';

const YELLOW = '#FFD400';
const BLACK = '#111111';
const WHITE = '#FFFFFF';
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const TITLE_FRAMES = 76;

const TitlePage: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 8], [0, 1], clamp);
  const textY = interpolate(frame, [0, 10], [38, 0], clamp);
  const portraitY = interpolate(frame, [0, 13], [46, 0], clamp);
  const brandScale = interpolate(frame, [0, TITLE_FRAMES], [1.03, 1.0], clamp);

  return (
    <AbsoluteFill style={{background: YELLOW, overflow: 'hidden', color: BLACK}}>
      <div style={{
        position: 'absolute',
        left: 58,
        right: 58,
        top: 70,
        opacity: reveal,
        transform: `translateY(${textY}px)`,
        zIndex: 4,
        textAlign: 'center',
      }}>
        <div style={{fontFamily: "'Arial Narrow',Arial,sans-serif", fontSize: 67, fontWeight: 950, letterSpacing: -2.5, lineHeight: .92}}>
          HER DAD WENT FROM
        </div>
        <div style={{marginTop: 4, fontFamily: "'Arial Narrow',Arial,sans-serif", fontSize: 104, fontWeight: 950, letterSpacing: -5.5, lineHeight: .84}}>
          DENTIST TO<br/>DISHWASHER.
        </div>
        <div style={{marginTop: 24, fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 43, fontWeight: 900, lineHeight: 1.02, color: WHITE, letterSpacing: -.8}}>
          SHE BECAME AMERICA'S FIRST
        </div>
        <div style={{marginTop: 4, fontFamily: "'Arial Narrow',Arial,sans-serif", fontSize: 71, fontWeight: 950, lineHeight: .9, letterSpacing: -3.2}}>
          FEMALE BILLIONAIRE VC.
        </div>
      </div>

      <div style={{
        position: 'absolute',
        left: -18,
        right: -18,
        top: 760,
        zIndex: 1,
        textAlign: 'center',
        fontFamily: "'Arial Narrow',Arial,sans-serif",
        fontSize: 285,
        fontWeight: 950,
        lineHeight: .82,
        letterSpacing: -16,
        color: WHITE,
        opacity: .98,
        transform: `scale(${brandScale})`,
      }}>
        ZELRO
      </div>

      <div style={{
        position: 'absolute',
        left: 155,
        right: 155,
        bottom: -40,
        height: 880,
        zIndex: 3,
        opacity: reveal,
        transform: `translateY(${portraitY}px)`,
        overflow: 'hidden',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)',
      }}>
        <Img
          src={staticFile('media/gouw_identity_2017.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 30%',
            filter: 'contrast(1.06) saturate(.96) brightness(1.04)',
          }}
        />
      </div>

      <div style={{
        position: 'absolute',
        left: 58,
        bottom: 72,
        zIndex: 5,
        fontFamily: 'Arial,Helvetica,sans-serif',
        fontSize: 29,
        fontWeight: 950,
        letterSpacing: 1,
        color: WHITE,
        lineHeight: .95,
        textShadow: '0 2px 8px rgba(0,0,0,.35)',
      }}>
        THERESIA<br/>GOUW
      </div>
    </AbsoluteFill>
  );
};

export const ZelroTheresiaGouwFinal: React.FC = () => (
  <AbsoluteFill>
    <BaseReel />
    <Sequence from={0} durationInFrames={TITLE_FRAMES}>
      <TitlePage />
    </Sequence>
  </AbsoluteFill>
);
