import React from 'react';
import {Composition} from 'remotion';
import {ZelroAlexandrWang} from './Alexandr';
import {TOTAL_FRAMES} from './timings';

export const Root: React.FC = () => (
  <Composition
    id="ZelroAlexandrWang"
    component={ZelroAlexandrWang}
    durationInFrames={TOTAL_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
