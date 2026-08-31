import React from 'react';
import {Composition} from 'remotion';
import {ElonPayPalReel} from './ElonPayPalFixed';
import {TOTAL_FRAMES} from './timings';

export const Root: React.FC = () => (
  <>
    <Composition
      id="ZelroElonPayPalPrototype"
      component={ElonPayPalReel}
      defaultProps={{prototype: true}}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="ZelroElonPayPal"
      component={ElonPayPalReel}
      defaultProps={{prototype: false}}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
