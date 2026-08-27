import { describe, expect, it } from 'vitest';

import {
  CHORD_SUCCESS_SHADOW_DURATION_MS,
  CHORD_WRONG_SHADOW_DURATION_MS,
  clearExpiredChordListenLiveKeyStates,
  markChordListenLiveKeyStatesSuccess,
  updateChordListenLiveKeyStates,
} from './chord-listen-live-state';

describe('updateChordListenLiveKeyStates', () => {
  it('keeps only the most recent expected octave label for each normalized key', () => {
    const state = updateChordListenLiveKeyStates({
      attacks: [
        { midiPitch: 36, startTimeMs: 1 },
        { midiPitch: 48, startTimeMs: 2 },
        { midiPitch: 36, startTimeMs: 3 },
        { midiPitch: 60, startTimeMs: 4 },
      ],
      expectedPitchClasses: new Set([0]),
      previous: {},
      unexpectedMidiPitches: [],
    });

    expect(state[0]).toMatchObject({
      expiresAtMs: 2_004,
      label: 'C4',
      rippleId: 4,
    });
  });

  it('does not add an immediately repeated expected octave label but still increments its ripple', () => {
    const state = updateChordListenLiveKeyStates({
      attacks: [
        { midiPitch: 60, startTimeMs: 1 },
        { midiPitch: 60, startTimeMs: 2 },
      ],
      expectedPitchClasses: new Set([0]),
      previous: {},
      unexpectedMidiPitches: [],
    });

    expect(state[0]).toMatchObject({ expiresAtMs: 2_002, label: 'C4', rippleId: 2 });
  });

  it('shows unexpected notes as temporary red-shadow state without labels or ripples', () => {
    const state = updateChordListenLiveKeyStates({
      attacks: [{ midiPitch: 61, startTimeMs: 1 }],
      expectedPitchClasses: new Set([0]),
      previous: {},
      unexpectedMidiPitches: [61],
    });

    expect(state[1]).toEqual({
      isSuccess: false,
      isUnexpectedActive: true,
      expiresAtMs: 501,
      rippleId: 0,
      label: null,
    });
  });

  it('clears an unexpected shadow after half a second', () => {
    const state = clearExpiredChordListenLiveKeyStates(
      {
        1: {
          expiresAtMs: 500,
          isSuccess: false,
          isUnexpectedActive: true,
          label: null,
          rippleId: 0,
        },
      },
      CHORD_WRONG_SHADOW_DURATION_MS,
    );

    expect(state[1]).toEqual({
      expiresAtMs: null,
      isSuccess: false,
      isUnexpectedActive: false,
      label: null,
      rippleId: 0,
    });
  });

  it('changes every expected key shadow to the completion state', () => {
    const state = markChordListenLiveKeyStatesSuccess(
      {
        0: {
          expiresAtMs: null,
          isSuccess: false,
          isUnexpectedActive: false,
          label: 'C4',
          rippleId: 1,
        },
        4: {
          expiresAtMs: null,
          isSuccess: false,
          isUnexpectedActive: false,
          label: 'E4',
          rippleId: 1,
        },
        7: {
          expiresAtMs: 100,
          isSuccess: false,
          isUnexpectedActive: true,
          label: null,
          rippleId: 0,
        },
      },
      new Set([0, 4]),
      10,
    );

    expect(state[0]?.isSuccess).toBe(true);
    expect(state[4]?.isSuccess).toBe(true);
    expect(state[7]?.isSuccess).toBe(false);
    expect(state[0]?.expiresAtMs).toBe(10 + CHORD_SUCCESS_SHADOW_DURATION_MS);
  });
});
