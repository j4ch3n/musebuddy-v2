import { describe, expect, it } from 'vitest';

import {
  markChordListenLiveKeyStatesSuccess,
  updateChordListenLiveKeyStates,
} from './chord-listen-live-state';

describe('updateChordListenLiveKeyStates', () => {
  it('keeps the three most recent expected octave labels for each normalized key', () => {
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
      labels: ['C3', 'C2', 'C4'],
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

    expect(state[0]).toMatchObject({ labels: ['C4'], rippleId: 2 });
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
      labels: [],
      rippleId: 0,
    });
  });

  it('resets an unexpected shadow when its note is no longer active', () => {
    const state = updateChordListenLiveKeyStates({
      attacks: [],
      expectedPitchClasses: new Set([0]),
      previous: {
        1: { isSuccess: false, isUnexpectedActive: true, labels: [], rippleId: 0 },
      },
      unexpectedMidiPitches: [],
    });

    expect(state[1]).toEqual({
      isSuccess: false,
      isUnexpectedActive: false,
      labels: [],
      rippleId: 0,
    });
  });

  it('changes every expected key shadow to the completion state', () => {
    const state = markChordListenLiveKeyStatesSuccess(
      {
        0: { isSuccess: false, isUnexpectedActive: false, labels: ['C4'], rippleId: 1 },
        4: { isSuccess: false, isUnexpectedActive: false, labels: ['E4'], rippleId: 1 },
        7: { isSuccess: false, isUnexpectedActive: true, labels: [], rippleId: 0 },
      },
      new Set([0, 4]),
    );

    expect(state[0]?.isSuccess).toBe(true);
    expect(state[4]?.isSuccess).toBe(true);
    expect(state[7]?.isSuccess).toBe(false);
  });
});
