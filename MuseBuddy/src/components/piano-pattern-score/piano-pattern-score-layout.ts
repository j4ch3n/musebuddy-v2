import type { TrainingSessionScore } from '@/contexts/training-session-schema';

export const SCORE_MEASURES_PER_ROW = 1;
export const SCORE_MEASURES_PER_PAGE = 3;
export const SCORE_PLAYBACK_STEPS_PER_MEASURE = 64;

export function getActiveScoreMeasureIndex(currentStepIndex: number | null): number | null {
  return currentStepIndex === null
    ? null
    : Math.floor(currentStepIndex / SCORE_PLAYBACK_STEPS_PER_MEASURE);
}

export function getScorePageIndexForMeasure(
  pages: readonly TrainingSessionScore[],
  measureIndex: number | null,
): number | null {
  if (measureIndex === null) {
    return null;
  }

  const pageIndex = pages.findIndex((page) =>
    page.measures.some((measure) => measure.index === measureIndex),
  );

  return pageIndex >= 0 ? pageIndex : null;
}

export function getActiveScoreEventIds(
  score: TrainingSessionScore,
  currentStepIndex: number | null,
): ReadonlySet<string> {
  const activeMeasureIndex = getActiveScoreMeasureIndex(currentStepIndex);
  if (activeMeasureIndex === null || currentStepIndex === null) {
    return new Set();
  }

  const measure = score.measures.find((candidate) => candidate.index === activeMeasureIndex);
  if (!measure) {
    return new Set();
  }

  const stepInMeasure = currentStepIndex % SCORE_PLAYBACK_STEPS_PER_MEASURE;
  return new Set(
    ['treble', 'bass'].flatMap((staffName) =>
      measure.staves[staffName as 'treble' | 'bass'].voices.flatMap((voice) =>
        getActiveVoiceEventId(voice.events, stepInMeasure),
      ),
    ),
  );
}

function getActiveVoiceEventId(
  events: TrainingSessionScore['measures'][number]['staves']['treble']['voices'][number]['events'],
  stepInMeasure: number,
): string[] {
  const totalDuration = events.reduce(
    (total, event) => total + getEventDurationInThirtySeconds(event),
    0,
  );
  if (totalDuration <= 0) {
    return [];
  }

  const position = (stepInMeasure / SCORE_PLAYBACK_STEPS_PER_MEASURE) * totalDuration;
  let elapsed = 0;

  for (const event of events) {
    elapsed += getEventDurationInThirtySeconds(event);
    if (position < elapsed) {
      return [event.id];
    }
  }

  return events.length > 0 ? [events[events.length - 1].id] : [];
}

function getEventDurationInThirtySeconds(
  event: TrainingSessionScore['measures'][number]['staves']['treble']['voices'][number]['events'][number],
) {
  const baseDuration = {
    '8': 4,
    '16': 2,
    '32': 1,
    '64': 0.5,
    h: 16,
    q: 8,
    w: 32,
  }[event.duration];
  const dotMultiplier = 2 - 1 / 2 ** event.dots;

  return baseDuration * dotMultiplier;
}

export function groupScoreMeasures(
  measures: TrainingSessionScore['measures'],
): TrainingSessionScore['measures'][] {
  return Array.from(
    { length: Math.ceil(measures.length / SCORE_MEASURES_PER_ROW) },
    (_, rowIndex) =>
      measures.slice(rowIndex * SCORE_MEASURES_PER_ROW, (rowIndex + 1) * SCORE_MEASURES_PER_ROW),
  );
}

export function paginateScore(
  score: TrainingSessionScore,
  measuresPerPage = SCORE_MEASURES_PER_PAGE,
): TrainingSessionScore[] {
  return Array.from(
    { length: Math.ceil(score.measures.length / measuresPerPage) },
    (_, pageIndex) => {
      const measures = score.measures.slice(
        pageIndex * measuresPerPage,
        (pageIndex + 1) * measuresPerPage,
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
