import { describe, expect, it } from 'vitest';

import type { TrainingSessionScore } from '@/contexts/training-session-schema';

import { groupScoreMeasures } from './piano-pattern-score-layout';

function measures(count: number): TrainingSessionScore['measures'] {
  return Array.from({ length: count }, (_, index) => ({
    beams: [],
    index,
    staves: {
      bass: {
        clef: 'bass' as const,
        voices: [],
      },
      treble: {
        clef: 'treble' as const,
        voices: [],
      },
    },
  }));
}

describe('groupScoreMeasures', () => {
  it('places exactly one measure on each row', () => {
    expect(
      groupScoreMeasures(measures(4)).map((row) => row.map((measure) => measure.index)),
    ).toEqual([[0], [1], [2], [3]]);
  });

  it('keeps every row to one measure for odd measure counts', () => {
    expect(groupScoreMeasures(measures(3)).map((row) => row.length)).toEqual([1, 1, 1]);
  });
});
