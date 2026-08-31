import { describe, expect, it } from 'vitest';

import type { TrainingSessionScore } from '@/contexts/training-session-schema';
import { createTrainingSession } from '@/contexts/training-session-test-fixture';

import {
  getActiveScoreEventIds,
  getActiveScoreMeasureIndex,
  getScorePageIndexForMeasure,
  groupScoreMeasures,
  paginateScore,
} from './piano-pattern-score-layout';

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

  it('supports four grand-staff systems per page for the full sheet preview', () => {
    const score = createTrainingSession(5).score;

    expect(
      paginateScore(score, 4).map((page) => page.measures.map((measure) => measure.index)),
    ).toEqual([[0, 1, 2, 3], [4]]);
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

describe('getActiveScoreMeasureIndex', () => {
  it('maps the two 32-step playback parts in each measure to one score measure', () => {
    expect(getActiveScoreMeasureIndex(null)).toBeNull();
    expect(getActiveScoreMeasureIndex(0)).toBe(0);
    expect(getActiveScoreMeasureIndex(63)).toBe(0);
    expect(getActiveScoreMeasureIndex(64)).toBe(1);
    expect(getActiveScoreMeasureIndex(191)).toBe(2);
  });
});

describe('getScorePageIndexForMeasure', () => {
  it('finds the page that contains the active score measure', () => {
    const pages = paginateScore(createTrainingSession(4).score);

    expect(getScorePageIndexForMeasure(pages, 0)).toBe(0);
    expect(getScorePageIndexForMeasure(pages, 2)).toBe(0);
    expect(getScorePageIndexForMeasure(pages, 3)).toBe(1);
    expect(getScorePageIndexForMeasure(pages, null)).toBeNull();
  });
});

describe('getActiveScoreEventIds', () => {
  it('selects the individual event under the playback position in each voice', () => {
    const score = createTrainingSession(1).score;
    const trebleVoice = score.measures[0].staves.treble.voices[0];
    const [event] = trebleVoice.events;

    trebleVoice.events = [
      { ...event, duration: 'q', id: 'treble-first' },
      { ...event, duration: 'q', id: 'treble-second' },
      { ...event, duration: 'h', id: 'treble-third' },
    ];

    expect(getActiveScoreEventIds(score, 0)).toEqual(new Set(['treble-first', 'm0-bass-v1-e0']));
    expect(getActiveScoreEventIds(score, 16)).toEqual(new Set(['treble-second', 'm0-bass-v1-e0']));
    expect(getActiveScoreEventIds(score, 32)).toEqual(new Set(['treble-third', 'm0-bass-v1-e0']));
  });
});
