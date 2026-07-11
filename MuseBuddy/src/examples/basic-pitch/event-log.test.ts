import { describe, expect, it } from 'vitest';

import { formatDetectionNote, groupDetectionNotesByMidi } from './event-log';

import type { DetectionNote } from '@modules/basic-pitch';

function note(overrides: Partial<DetectionNote> = {}): DetectionNote {
  const startTimeMs = overrides.startTimeMs ?? 1_000;
  const endTimeMs = overrides.endTimeMs ?? 1_700;

  return {
    confidence: 0.876,
    durationMs: endTimeMs - startTimeMs,
    endTimeMs,
    id: 1,
    midiPitch: 60,
    startTimeMs,
    velocity: 111,
    ...overrides,
  };
}

describe('Basic Pitch note log formatting', () => {
  it('formats detected notes', () => {
    expect(formatDetectionNote(note({ endTimeMs: 1_750, startTimeMs: 1_234 }))).toBe(
      '[1.234s-1.750s] #1 MIDI 60 · confidence 88% · velocity 111',
    );
  });

  it('groups events by MIDI pitch for expandable display', () => {
    const groups = groupDetectionNotesByMidi([
      note({ confidence: 0.6, endTimeMs: 1_450, id: 1, midiPitch: 64, startTimeMs: 1_100 }),
      note({ confidence: 0.8, endTimeMs: 900, id: 2, midiPitch: 60, startTimeMs: 500 }),
      note({ confidence: 0.7, endTimeMs: 1_800, id: 3, midiPitch: 64, startTimeMs: 1_500 }),
    ]);

    expect(groups).toEqual([
      {
        averageConfidence: expect.any(Number),
        count: 1,
        events: [note({ confidence: 0.8, endTimeMs: 900, id: 2, midiPitch: 60, startTimeMs: 500 })],
        firstAttackMs: 500,
        id: 'midi-60',
        lastReleaseMs: 900,
        midiPitch: 60,
        peakConfidence: 0.8,
        peakVelocity: 111,
      },
      {
        averageConfidence: expect.any(Number),
        count: 2,
        events: [
          note({
            confidence: 0.6,
            endTimeMs: 1_450,
            id: 1,
            midiPitch: 64,
            startTimeMs: 1_100,
          }),
          note({
            confidence: 0.7,
            endTimeMs: 1_800,
            id: 3,
            midiPitch: 64,
            startTimeMs: 1_500,
          }),
        ],
        firstAttackMs: 1_100,
        id: 'midi-64',
        lastReleaseMs: 1_800,
        midiPitch: 64,
        peakConfidence: 0.7,
        peakVelocity: 111,
      },
    ]);
    expect(groups[0]?.averageConfidence).toBeCloseTo(0.8);
    expect(groups[1]?.averageConfidence).toBeCloseTo(0.65);
  });
});
