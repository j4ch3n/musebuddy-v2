import { describe, expect, it } from 'vitest';

import type { SoundFontPlaybackConfiguration } from '@modules/sound-font-player';

import {
  getSoundFontDemoDurationMs,
  getSoundFontPartCount,
  getSoundFontStepCount,
  shouldHandlePlaybackEvent,
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

  it('derives the demo duration from the longest SoundFont track and BPM', () => {
    expect(getSoundFontDemoDurationMs(configuration)).toBe(4800);
  });

  it('ignores playback events until a start result has established the active id', () => {
    expect(shouldHandlePlaybackEvent(null, 42)).toBe(false);
    expect(shouldHandlePlaybackEvent(41, 42)).toBe(false);
    expect(shouldHandlePlaybackEvent(42, 42)).toBe(true);
  });

  it('ignores stale playback finish events with mismatched playback ids', () => {
    expect(shouldHandlePlaybackEvent(12, 11)).toBe(false);
  });
});
