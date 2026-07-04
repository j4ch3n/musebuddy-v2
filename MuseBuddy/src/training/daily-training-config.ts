import { dailyTrainingSchema } from './daily-training-schema';

export const dailyTrainingConfig = dailyTrainingSchema.parse({
  chordLearning: {
    chord: {
      explanation:
        'Placeholder: explain how the root, third, fifth, and seventh create this chord color.',
      intervals: ['1', '3', '5', '7'],
      quality: 'major7',
      root: { accidental: '', letter: 'C' },
    },
  },
  rhythmTraining: {
    pattern: [
      's',
      null,
      'w',
      null,
      's',
      null,
      null,
      'w',
      's',
      null,
      'w',
      null,
      's',
      'w',
      null,
      null,
      's',
      null,
      null,
      'w',
      's',
      null,
      'w',
      null,
      's',
      'w',
      null,
      null,
      's',
      null,
      'w',
      null,
    ],
  },
});
