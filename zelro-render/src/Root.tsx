import React from 'react';
import {Composition} from 'remotion';
import {ZelroV6} from './V6';
import {TOTAL_FRAMES} from './timings';

export const Root: React.FC = () => (
  <Composition
    id="ZelroV6"
    component={ZelroV6}
    durationInFrames={TOTAL_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
