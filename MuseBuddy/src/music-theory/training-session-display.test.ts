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
  chords: [
    {
      displayTokens: [{ type: 'root', value: 'C' }],
      idName: 'c-major',
      normalizedSymbol: 'C',
      qualityBaseFormula: ['1', '3', '5'],
      root: 'C',
      tones: [
        { explanation: 'is the root. It names and anchors the chord.' },
        { explanation: 'is the third. It gives the chord its major color.' },
        { explanation: 'is the fifth. It makes the chord feel stable.' },
      ],
    },
  ],
  keyArrangement: {
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
  },
};

describe('prepareTrainingSessionDisplay', () => {
  it('derives display data and rhythm while retaining the raw key arrangement', () => {
    const preparedSession = prepareTrainingSessionDisplay(trainingSession);

    expect(preparedSession.keyArrangement).toBe(trainingSession.keyArrangement);
    expect(preparedSession.chordDisplays[0]?.symbol).toBe('C');
    expect(preparedSession.rhythm.pattern).toHaveLength(32);
    expect(preparedSession.rhythm.pattern[0]).toBe('w');
  });
});
