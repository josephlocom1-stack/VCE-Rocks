import React from 'react';
import {Composition} from 'remotion';
import {ElonFalconReel} from './ElonFalcon';
import {TOTAL_FRAMES} from './timings';

export const Root: React.FC = () => (
  <>
    <Composition
      id="ZelroElonFalconPrototype"
      component={ElonFalconReel}
      defaultProps={{prototype: true}}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="ZelroElonFalcon"
      component={ElonFalconReel}
      defaultProps={{prototype: false}}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
