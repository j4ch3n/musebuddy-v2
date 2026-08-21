import { describe, expect, it } from 'vitest';

import type { TrainingSessionScore } from '@/contexts/training-session-schema';
import { createTrainingSession } from '@/contexts/training-session-test-fixture';

import { groupScoreMeasures, paginateScore } from './piano-pattern-score-layout';

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

describe('paginateScore', () => {
  it('keeps at most three grand-staff systems on a page', () => {
    const score = createTrainingSession(4).score;

    expect(
      paginateScore(score).map((page) => page.measures.map((measure) => measure.index)),
    ).toEqual([[0, 1, 2], [3]]);
  });

  it('keeps ties only when both endpoints are visible on the same page', () => {
    const score = createTrainingSession(4).score;
    score.ties.push(
      {
        from: { event_id: 'm2-treble-v1-e0', key_index: 0 },
        to: { event_id: 'm3-treble-v1-e0', key_index: 0 },
      },
      {
        from: { event_id: 'm0-treble-v1-e0', key_index: 0 },
        to: { event_id: 'm1-treble-v1-e0', key_index: 0 },
      },
    );

    expect(paginateScore(score).map((page) => page.ties)).toEqual([
      [
        {
          from: { event_id: 'm0-treble-v1-e0', key_index: 0 },
          to: { event_id: 'm1-treble-v1-e0', key_index: 0 },
        },
      ],
      [],
    ]);
  });
});
