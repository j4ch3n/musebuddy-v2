import { describe, expect, it } from 'vitest';

import { trainingSessionSchema } from './training-session-schema';
import { createTrainingSession } from './training-session-test-fixture';

describe('trainingSessionSchema', () => {
  it('accepts a complete ordered pattern payload', () => {
    expect(trainingSessionSchema.safeParse(createTrainingSession(4)).success).toBe(true);
  });

  it('requires two note rows per score measure', () => {
    const session = createTrainingSession(2);
    session.notes.beats.pop();

    expect(trainingSessionSchema.safeParse(session).success).toBe(false);
  });

  it('requires contiguous bar and beat order', () => {
    const session = createTrainingSession(2);
    const beat = session.notes.beats[2];
    if (beat) {
      beat.bar_index = 7;
    }

    expect(trainingSessionSchema.safeParse(session).success).toBe(false);
  });

  it('rejects hold cells with velocity', () => {
    const session = createTrainingSession();
    const stave = session.notes.beats[0]?.staves.treble;
    if (stave) {
      stave.arrangement[0] = [-50];
      stave.velocity[0] = [80];
    }

    expect(trainingSessionSchema.safeParse(session).success).toBe(false);
  });

  it('rejects attacks without velocity', () => {
    const session = createTrainingSession();
    const stave = session.notes.beats[0]?.staves.treble;
    if (stave) {
      stave.arrangement[0] = [60];
      stave.velocity[0] = [null];
    }

    expect(trainingSessionSchema.safeParse(session).success).toBe(false);
  });

  it('rejects mismatched arrangement and velocity lanes', () => {
    const session = createTrainingSession();
    const stave = session.notes.beats[0]?.staves.bass;
    if (stave) {
      stave.arrangement[0] = [48, 52];
      stave.velocity[0] = [90];
    }

    expect(trainingSessionSchema.safeParse(session).success).toBe(false);
  });

  it('requires chord profiles in first-appearance order', () => {
    const session = createTrainingSession();
    session.chords[0] = { ...session.chords[0], idName: 'f-major' };

    expect(trainingSessionSchema.safeParse(session).success).toBe(false);
  });
});
