import { describe, expect, it } from 'vitest';

import { trainingSessionSchema } from './training-session-schema';

const validSession = {
  arrangement: {
    barIndex: 3,
    rows: [
      {
        arrangement: Array.from({ length: 32 }, () => [null]),
        beatIndex: 0,
        songId: '001',
        velocity: Array.from({ length: 32 }, () => [null]),
      },
      {
        arrangement: Array.from({ length: 32 }, () => [null]),
        beatIndex: 1,
        songId: '001',
        velocity: Array.from({ length: 32 }, () => [null]),
      },
    ],
    songId: '001',
  },
  chord: {
    displayTokens: [
      { type: 'root', value: 'A' },
      { type: 'addition', value: 'add9' },
    ],
    qualityBaseFormula: ['1', '3', '5'],
    root: 'A',
  },
  rhythm: {
    averageAttackVelocity: null,
    pattern: Array.from({ length: 32 }, () => null),
  },
};

describe('trainingSessionSchema', () => {
  it('accepts the edge function session payload', () => {
    expect(trainingSessionSchema.safeParse(validSession).success).toBe(true);
  });

  it('requires a full one-bar rhythm pattern', () => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      rhythm: {
        averageAttackVelocity: 80,
        pattern: ['s', 'w', 'h', null],
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects unsupported chord formula degrees', () => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      chord: {
        ...validSession.chord,
        qualityBaseFormula: ['1', '3', '15'],
      },
    });

    expect(result.success).toBe(false);
  });
});
