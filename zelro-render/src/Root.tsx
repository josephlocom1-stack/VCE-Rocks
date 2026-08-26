// Reel 003 production composition
import React from 'react';
import {Composition} from 'remotion';
import {ZelroTheresiaGouwFinal} from './TheresiaFinal';
import {TOTAL_FRAMES} from './timings';

export const Root: React.FC = () => (
  <Composition
    id="ZelroTheresiaGouw"
    component={ZelroTheresiaGouwFinal}
    durationInFrames={TOTAL_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
