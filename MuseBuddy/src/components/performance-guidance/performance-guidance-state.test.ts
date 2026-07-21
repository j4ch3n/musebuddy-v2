import { describe, expect, it } from 'vitest';

import type { DetectionResult } from '@modules/basic-pitch';
import type { SoundFontPlaybackConfiguration } from '@modules/sound-font-player';

import {
  createGuidanceState,
  getPlaybackClockState,
  getSoundFontDemoDurationMs,
  getSoundFontPartCount,
  getSoundFontStepCount,
  guidanceReducer,
  shouldHandleDetection,
  shouldHandlePlaybackEvent,
} from './performance-guidance-state';

const part = Array.from({ length: 16 }, () => [{ midi: 60, velocity: 90 }]);
const configuration: SoundFontPlaybackConfiguration = { bpm: 120, parts: [part, part] };
const detection: DetectionResult = {
  recognitionId: 7,
  detectionId: 1,
  notes: [],
  processingDurationMs: 1,
  recordedDurationMs: 3_000,
  type: 'periodic',
  windowEndMs: 3_000,
  windowStartMs: 1_000,
};

describe('performance guidance state', () => {
  it('derives playback length and duration from public parts', () => {
    expect(getSoundFontPartCount(configuration)).toBe(2);
    expect(getSoundFontStepCount(configuration)).toBe(32);
    expect(getSoundFontDemoDurationMs(configuration)).toBe(4_000);
  });

  it('holds at four until native playback supplies a start time', () => {
    expect(createGuidanceState('prepare')).toMatchObject({
      countdownValue: 4,
      phase: 'prepare',
    });
  });

  it('derives lead-in countdown and demo steps from startedAtMs', () => {
    expect(
      getPlaybackClockState({
        completedCycles: 0,
        configuration,
        leadIn: true,
        nowMs: 10_750,
        repetitions: 1,
        startedAtMs: 10_000,
      }),
    ).toMatchObject({ countdownValue: 3, currentStepIndex: null, phase: 'prepare' });

    expect(
      getPlaybackClockState({
        completedCycles: 0,
        configuration,
        leadIn: true,
        nowMs: 12_375,
        repetitions: 1,
        startedAtMs: 10_000,
      }),
    ).toMatchObject({ currentStepIndex: 3, phase: 'demo' });
  });

  it('updates the session-goal repetition label from the same native clock', () => {
    expect(
      getPlaybackClockState({
        completedCycles: 0,
        configuration,
        leadIn: false,
        nowMs: 14_100,
        repetitions: 2,
        startedAtMs: 10_000,
      }).completedCycles,
    ).toBe(1);
  });

  it('resets progress, input, and errors on a fresh prepare', () => {
    const dirtyState = {
      ...createGuidanceState('pending'),
      completedCycles: 2,
      errorMessage: 'failed',
      latestDetection: detection,
    };
    expect(guidanceReducer(dirtyState, { type: 'prepare' })).toEqual(
      createGuidanceState('prepare'),
    );
  });

  it('publishes a scheduled rhythm boundary without entering listening', () => {
    const demoState = guidanceReducer(createGuidanceState('prepare'), { type: 'demo' });
    const scheduledState = guidanceReducer(demoState, {
      type: 'schedule-listening',
      startedAtMs: 14_000,
    });

    expect(scheduledState).toMatchObject({
      listeningStartedAtMs: 14_000,
      phase: 'demo',
    });
    expect(
      guidanceReducer(scheduledState, {
        completedCycles: 0,
        countdownValue: 1,
        currentStepIndex: 4,
        phase: 'demo',
        type: 'clock',
      }).listeningStartedAtMs,
    ).toBe(14_000);
  });

  it('filters stale playback and recognition events by active id', () => {
    expect(shouldHandlePlaybackEvent(null, 4)).toBe(false);
    expect(shouldHandlePlaybackEvent(4, 3)).toBe(false);
    expect(shouldHandlePlaybackEvent(4, 4)).toBe(true);
    expect(shouldHandleDetection(8, detection)).toBe(false);
    expect(shouldHandleDetection(7, detection)).toBe(true);
  });
});
