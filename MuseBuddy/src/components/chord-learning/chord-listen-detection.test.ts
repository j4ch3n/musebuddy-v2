import { describe, expect, it } from 'vitest';

import { getDetectionAttackSignature, getRecentMidiPitches } from './chord-listen-detection';

describe('getRecentMidiPitches', () => {
  it('removes notes whose last detected sound is at least two seconds old', () => {
    expect(
      getRecentMidiPitches(
        {
          notes: [
            { endTimeMs: 2_999, midiPitch: 60, startTimeMs: 2_500 },
            { endTimeMs: 3_000, midiPitch: 61, startTimeMs: 2_600 },
            { endTimeMs: 3_001, midiPitch: 64, startTimeMs: 2_700 },
            { endTimeMs: 4_900, midiPitch: 67, startTimeMs: 4_500 },
          ],
          windowEndMs: 5_000,
        },
        2_000,
      ),
    ).toEqual([64, 67]);
  });

  it('returns sorted unique pitches from the active decay window', () => {
    expect(
      getRecentMidiPitches(
        {
          notes: [
            { endTimeMs: 4_700, midiPitch: 67, startTimeMs: 4_400 },
            { endTimeMs: 4_800, midiPitch: 60, startTimeMs: 4_500 },
            { endTimeMs: 4_900, midiPitch: 67, startTimeMs: 4_600 },
          ],
          windowEndMs: 5_000,
        },
        2_000,
      ),
    ).toEqual([60, 67]);
  });

  it('keeps the same signature for repeated callbacks and changes it for a new attack', () => {
    const heldChord = [
      { endTimeMs: 4_800, midiPitch: 60, startTimeMs: 4_000 },
      { endTimeMs: 4_800, midiPitch: 64, startTimeMs: 4_000 },
      { endTimeMs: 4_800, midiPitch: 67, startTimeMs: 4_000 },
    ];
    const repeatedCallback = heldChord.map((note) => ({ ...note, endTimeMs: 4_900 }));
    const newAttack = heldChord.map((note) => ({ ...note, startTimeMs: 5_000 }));

    expect(getDetectionAttackSignature(heldChord)).toBe(
      getDetectionAttackSignature(repeatedCallback),
    );
    expect(getDetectionAttackSignature(newAttack)).not.toBe(getDetectionAttackSignature(heldChord));
  });
});
