import { describe, expect, it } from 'vitest';

import { dailyTrainingSchema } from './daily-training-schema';

const validPattern = [
  's',
  null,
  'w',
  null,
  's',
  null,
  null,
  'w',
  's',
  'w',
  null,
  null,
  's',
  null,
  'w',
  null,
];

const validChordLearning = {
  chord: {
    intervals: ['1', '3', '5', '7'],
    quality: 'major7',
    root: { accidental: '', letter: 'C' },
  },
};

describe('dailyTrainingSchema', () => {
  it('parses a valid daily training config', () => {
    const result = dailyTrainingSchema.safeParse({
      chordLearning: validChordLearning,
      rhythmTraining: {
        pattern: validPattern,
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects rhythm patterns without exactly sixteen or thirty-two steps', () => {
    const result = dailyTrainingSchema.safeParse({
      chordLearning: validChordLearning,
      rhythmTraining: {
        pattern: validPattern.slice(0, 8),
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects unsupported rhythm step values', () => {
    const result = dailyTrainingSchema.safeParse({
      chordLearning: validChordLearning,
      rhythmTraining: {
        pattern: [...validPattern.slice(0, 15), 'x'],
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects unsupported chord roots', () => {
    const result = dailyTrainingSchema.safeParse({
      chordLearning: {
        chord: {
          intervals: ['1', '3', '5'],
          quality: 'major',
          root: { accidental: '', letter: 'H' },
        },
      },
      rhythmTraining: {
        pattern: validPattern,
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects unsupported chord intervals', () => {
    const result = dailyTrainingSchema.safeParse({
      chordLearning: {
        chord: {
          intervals: ['1', '3', '5', '#15'],
          quality: 'major7',
          root: { accidental: '', letter: 'C' },
        },
      },
      rhythmTraining: {
        pattern: validPattern,
      },
    });

    expect(result.success).toBe(false);
  });
});
