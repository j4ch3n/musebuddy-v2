import { describe, expect, it } from 'vitest';

import type { SoundFontPlaybackBarEvent } from '@modules/sound-font-player';

import {
  createPlaybackClockAnchor,
  estimateUserPlaybackPositionMs,
  getClockedCurrentStepIndex,
} from './performance-guidance-clock';

const barEvent: SoundFontPlaybackBarEvent = {
  absoluteTimeMs: 1_000,
  barInCycle: 0,
  barIndex: 1,
  bpm: 120,
  cycleIndex: 0,
  playbackId: 42,
  playbackPositionMs: 2_000,
};

describe('performance guidance clock helpers', () => {
  it('anchors user playback to native bar time plus bridge latency', () => {
    const anchor = createPlaybackClockAnchor({
      audioClockMs: 2_060,
      barDurationMs: 2_000,
      event: barEvent,
      receivedAtMs: 1_060,
    });

    expect(anchor).toEqual({
      audioClockMsAtReceipt: 2_060,
      userPlaybackPositionMsAtReceipt: 2_060,
    });
  });

  it('advances anchored playback with the expo audio clock', () => {
    const anchor = createPlaybackClockAnchor({
      audioClockMs: 2_060,
      barDurationMs: 2_000,
      event: barEvent,
      receivedAtMs: 1_060,
    });

    expect(estimateUserPlaybackPositionMs(anchor, 2_310)).toBe(2_310);
  });

  it('derives the highlighted step and wraps at the expected pattern length', () => {
    const anchor = createPlaybackClockAnchor({
      audioClockMs: 0,
      barDurationMs: 2_000,
      event: {
        ...barEvent,
        absoluteTimeMs: 1_000,
        barIndex: 0,
      },
      receivedAtMs: 1_000,
    });

    expect(
      getClockedCurrentStepIndex({
        anchor,
        audioClockMs: 375,
        expectedStepCount: 16,
        stepDurationMs: 125,
      }),
    ).toBe(3);
    expect(
      getClockedCurrentStepIndex({
        anchor,
        audioClockMs: 2_125,
        expectedStepCount: 16,
        stepDurationMs: 125,
      }),
    ).toBe(1);
  });

  it('returns null when step metadata is invalid', () => {
    const anchor = createPlaybackClockAnchor({
      audioClockMs: 0,
      barDurationMs: 2_000,
      event: barEvent,
      receivedAtMs: 1_000,
    });

    expect(
      getClockedCurrentStepIndex({
        anchor,
        audioClockMs: 0,
        expectedStepCount: 0,
        stepDurationMs: 125,
      }),
    ).toBeNull();
    expect(
      getClockedCurrentStepIndex({
        anchor,
        audioClockMs: 0,
        expectedStepCount: 16,
        stepDurationMs: 0,
      }),
    ).toBeNull();
  });
});
