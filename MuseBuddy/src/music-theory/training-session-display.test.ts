import { describe, expect, it } from 'vitest';

import type { TrainingSession } from '@/contexts/training-session-schema';

import { prepareTrainingSessionDisplay } from './training-session-display';

const emptySlots = () =>
  Array.from({ length: 32 }, () => [
    {
      midi: null,
      velocity: null,
    },
  ]);

const trainingSession: TrainingSession = {
  chord: {
    displayTokens: [{ type: 'root', value: 'C' }],
    qualityBaseFormula: ['1', '3', '5'],
    root: 'C',
  },
  keyArrangement: {
    barIndex: 0,
    rows: [
      {
        beatIndex: 0,
        slots: [
          [
            {
              midi: 60,
              velocity: 80,
            },
          ],
          ...emptySlots().slice(1),
        ],
      },
      {
        beatIndex: 1,
        slots: emptySlots(),
      },
    ],
    songId: 'test-song',
  },
};

describe('prepareTrainingSessionDisplay', () => {
  it('derives display data and rhythm while dropping the raw key arrangement', () => {
    const preparedSession = prepareTrainingSessionDisplay(trainingSession);

    expect(preparedSession).not.toHaveProperty('keyArrangement');
    expect(preparedSession.chordDisplay.symbol).toBe('C');
    expect(preparedSession.rhythm.pattern).toHaveLength(32);
    expect(preparedSession.rhythm.pattern[0]).toBe('w');
  });
});
