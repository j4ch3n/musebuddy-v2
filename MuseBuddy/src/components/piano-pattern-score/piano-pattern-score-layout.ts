import type { TrainingSessionScore } from '@/contexts/training-session-schema';

export const SCORE_MEASURES_PER_ROW = 1;

export function groupScoreMeasures(
  measures: TrainingSessionScore['measures'],
): TrainingSessionScore['measures'][] {
  return Array.from(
    { length: Math.ceil(measures.length / SCORE_MEASURES_PER_ROW) },
    (_, rowIndex) =>
      measures.slice(rowIndex * SCORE_MEASURES_PER_ROW, (rowIndex + 1) * SCORE_MEASURES_PER_ROW),
  );
}
