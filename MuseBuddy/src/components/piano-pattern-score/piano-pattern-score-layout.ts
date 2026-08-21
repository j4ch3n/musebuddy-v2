import type { TrainingSessionScore } from '@/contexts/training-session-schema';

export const SCORE_MEASURES_PER_ROW = 1;
export const SCORE_MEASURES_PER_PAGE = 3;

export function groupScoreMeasures(
  measures: TrainingSessionScore['measures'],
): TrainingSessionScore['measures'][] {
  return Array.from(
    { length: Math.ceil(measures.length / SCORE_MEASURES_PER_ROW) },
    (_, rowIndex) =>
      measures.slice(rowIndex * SCORE_MEASURES_PER_ROW, (rowIndex + 1) * SCORE_MEASURES_PER_ROW),
  );
}

export function paginateScore(score: TrainingSessionScore): TrainingSessionScore[] {
  return Array.from(
    { length: Math.ceil(score.measures.length / SCORE_MEASURES_PER_PAGE) },
    (_, pageIndex) => {
      const measures = score.measures.slice(
        pageIndex * SCORE_MEASURES_PER_PAGE,
        (pageIndex + 1) * SCORE_MEASURES_PER_PAGE,
      );
      const eventIds = new Set(
        measures.flatMap((measure) =>
          ['treble', 'bass'].flatMap((staff) =>
            measure.staves[staff as 'treble' | 'bass'].voices.flatMap((voice) =>
              voice.events.map((event) => event.id),
            ),
          ),
        ),
      );

      return {
        ...score,
        measures,
        ties: score.ties.filter(
          (tie) => eventIds.has(tie.from.event_id) && eventIds.has(tie.to.event_id),
        ),
      };
    },
  );
}
