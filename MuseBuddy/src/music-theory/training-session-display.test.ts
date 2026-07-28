import { describe, expect, it } from 'vitest';

import { createTrainingSession } from '@/contexts/training-session-test-fixture';

import { prepareTrainingSessionDisplay } from './training-session-display';

describe('prepareTrainingSessionDisplay', () => {
  it('prepares chord, score, and independent full-pattern rhythms', () => {
    const trainingSession = createTrainingSession(4);
    const firstBeat = trainingSession.notes.beats[0];
    if (!firstBeat) {
      throw new Error('Fixture is missing its first beat.');
    }
    firstBeat.staves.treble.arrangement[0] = [60];
    firstBeat.staves.treble.velocity[0] = [80];

    const preparedSession = prepareTrainingSessionDisplay(trainingSession);

    expect(preparedSession.notes).toBe(trainingSession.notes.beats);
    expect(preparedSession.score).toBe(trainingSession.score);
    expect(preparedSession.chordDisplays[0]?.symbol).toBe('C');
    expect(preparedSession.rhythms.treble.pattern).toHaveLength(256);
    expect(preparedSession.rhythms.treble.pattern[0]).toBe('s');
    expect(preparedSession.rhythms.bass.pattern.every((step) => step === null)).toBe(true);
  });
});
