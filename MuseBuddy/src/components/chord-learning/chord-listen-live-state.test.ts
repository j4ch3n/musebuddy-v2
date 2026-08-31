import { describe, expect, it } from 'vitest';

import {
  CHORD_WRONG_SHADOW_DURATION_MS,
  clearExpiredChordListenLiveKeyStates,
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
      isSuccess: true,
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

    expect(state[0]).toMatchObject({
      expiresAtMs: 2_002,
      isSuccess: true,
      label: 'C4',
      rippleId: 2,
    });
  });

  it('shows unexpected notes as a temporary red shadow with the detected key name', () => {
    const state = updateChordListenLiveKeyStates({
      attacks: [{ midiPitch: 61, startTimeMs: 1 }],
      expectedPitchClasses: new Set([0]),
      previous: {},
      unexpectedMidiPitches: [61],
    });

    expect(state[1]).toEqual({
      isSuccess: false,
      isUnexpectedActive: true,
      expiresAtMs: 2_001,
      rippleId: 0,
      label: 'C#4',
    });
  });

  it('clears an unexpected shadow after two seconds', () => {
    const state = clearExpiredChordListenLiveKeyStates(
      {
        1: {
          expiresAtMs: 2_000,
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
});
