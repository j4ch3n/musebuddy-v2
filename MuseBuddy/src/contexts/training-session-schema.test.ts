import { describe, expect, it } from 'vitest';

import { trainingSessionSchema } from './training-session-schema';

const emptySlots = () =>
  Array.from({ length: 32 }, () => [
    {
      midi: null,
      velocity: null,
    },
  ]);

const validSession = {
  chord: {
    displayTokens: [
      { type: 'root', value: 'A' },
      { type: 'addition', value: 'add9' },
    ],
    qualityBaseFormula: ['1', '3', '5'],
    root: 'A',
  },
  keyArrangement: {
    barIndex: 0,
    rows: [
      {
        beatIndex: 0,
        slots: emptySlots(),
      },
      {
        beatIndex: 1,
        slots: emptySlots(),
      },
    ],
    songId: 'test-song',
  },
};

describe('trainingSessionSchema', () => {
  it('accepts the edge function session payload', () => {
    expect(trainingSessionSchema.safeParse(validSession).success).toBe(true);
  });

  it('requires full raw key arrangement rows', () => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      keyArrangement: {
        ...validSession.keyArrangement,
        rows: [
          {
            beatIndex: 0,
            slots: emptySlots(),
          },
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects hold cells with velocity', () => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      keyArrangement: {
        ...validSession.keyArrangement,
        rows: [
          {
            beatIndex: 0,
            slots: [
              [
                {
                  midi: -50,
                  velocity: 80,
                },
              ],
              ...emptySlots().slice(1),
            ],
          },
          validSession.keyArrangement.rows[1],
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects attack cells without velocity', () => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      keyArrangement: {
        ...validSession.keyArrangement,
        rows: [
          {
            beatIndex: 0,
            slots: [
              [
                {
                  midi: 60,
                  velocity: null,
                },
              ],
              ...emptySlots().slice(1),
            ],
          },
          validSession.keyArrangement.rows[1],
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects non-hold negative MIDI cells', () => {
    const result = trainingSessionSchema.safeParse({
      ...validSession,
      keyArrangement: {
        ...validSession.keyArrangement,
        rows: [
          {
            beatIndex: 0,
            slots: [
              [
                {
                  midi: -1,
                  velocity: null,
                },
              ],
              ...emptySlots().slice(1),
            ],
          },
          validSession.keyArrangement.rows[1],
        ],
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
