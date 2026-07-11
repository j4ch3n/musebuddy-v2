import { describe, expect, it } from 'vitest';

import type { SoundFontPlaybackConfiguration } from '@modules/sound-font-player';

import {
  getPhaseAfterCycleRepeat,
  getPhaseAfterDemoFinish,
  getSoundFontPartCount,
  getSoundFontStepCount,
} from './performance-guidance-state';

const configuration: SoundFontPlaybackConfiguration = {
  bpm: 100,
  tracks: [
    {
      instrument: 'piano',
      parts: [[[{ midi: 60, velocity: 90 }]], [[{ midi: 62, velocity: 90 }]]],
    },
    {
      instrument: 'bass',
      parts: [[[{ midi: 48, velocity: 80 }]]],
    },
  ],
};

describe('performance guidance state helpers', () => {
  it('derives the demo length from the longest SoundFont track', () => {
    expect(getSoundFontPartCount(configuration)).toBe(2);
    expect(getSoundFontStepCount(configuration)).toBe(32);
  });

  it('returns zero length when playback is unavailable', () => {
    expect(getSoundFontPartCount(null)).toBe(0);
    expect(getSoundFontStepCount(null)).toBe(0);
  });

  it('moves from demo to listening only when native reports a silent period', () => {
    expect(getPhaseAfterDemoFinish('demo', true)).toBe('listening');
    expect(getPhaseAfterDemoFinish('demo', false)).toBe('demo');
    expect(getPhaseAfterDemoFinish('prepare', true)).toBe('prepare');
  });

  it('uses native cycle repeat intent to choose the next phase', () => {
    expect(getPhaseAfterCycleRepeat(true)).toBe('demo');
    expect(getPhaseAfterCycleRepeat(false)).toBe('finish');
  });
});
