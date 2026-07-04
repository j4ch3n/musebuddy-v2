import { STEPS_PER_BAR } from './constants';
import { collectRhythmEvents } from './rhythm-pattern';
import type { RhythmStep } from './types';

export const RHYTHM_NOTE_KEY = 'f/5';
export const BAR_STEP_COUNT = STEPS_PER_BAR;

export type VexflowDuration = '16' | '8' | 'q' | 'h' | 'w';

export type NoteBarVexflowEvent = {
  duration: VexflowDuration;
  id: string;
  kind: 'note' | 'rest';
  noteKey?: string;
  dots: 0 | 1;
  startStep: number;
  stepCount: number;
  tieFromPrevious: boolean;
  tieToNext: boolean;
};

type ConvertOptions = {
  noteKey?: string;
};

const DURATION_BY_STEP_COUNT: Record<number, { duration: VexflowDuration; dots: 0 | 1 }> = {
  1: { duration: '16', dots: 0 },
  2: { duration: '8', dots: 0 },
  3: { duration: '8', dots: 1 },
  4: { duration: 'q', dots: 0 },
  6: { duration: 'q', dots: 1 },
  8: { duration: 'h', dots: 0 },
  12: { duration: 'h', dots: 1 },
  16: { duration: 'w', dots: 0 },
};

const SPLIT_COUNTS_DESCENDING = [16, 12, 8, 6, 4, 3, 2, 1] as const;

export function convertRhythmBarToVexflowEvents(
  steps: readonly RhythmStep[],
  options: ConvertOptions = {},
): NoteBarVexflowEvent[] {
  if (steps.length !== BAR_STEP_COUNT) {
    throw new Error(`Expected ${BAR_STEP_COUNT} bar steps, received ${steps.length}.`);
  }

  const noteKey = options.noteKey ?? RHYTHM_NOTE_KEY;

  return collectRhythmEvents(steps).flatMap((event) => {
    const segments = splitStepCountForVexflow(event.stepCount);

    return segments.map((stepCount, segmentIndex) => {
      const startStep =
        event.startStep +
        segments.slice(0, segmentIndex).reduce((total, count) => total + count, 0);
      const duration = getDurationForStepCount(stepCount);
      const isSplitNote = event.kind === 'attack' && segments.length > 1;

      return {
        ...duration,
        id: `${event.startStep}-${event.kind}-${segmentIndex}`,
        kind: event.kind === 'attack' ? 'note' : 'rest',
        noteKey: event.kind === 'attack' ? noteKey : undefined,
        startStep,
        stepCount,
        tieFromPrevious: isSplitNote && segmentIndex > 0,
        tieToNext: isSplitNote && segmentIndex < segments.length - 1,
      };
    });
  });
}

function splitStepCountForVexflow(stepCount: number): number[] {
  const segments: number[] = [];
  let remainingSteps = stepCount;

  while (remainingSteps > 0) {
    const nextSegment = SPLIT_COUNTS_DESCENDING.find((count) => count <= remainingSteps);

    if (!nextSegment) {
      throw new Error(`Unsupported duration segment: ${remainingSteps} steps.`);
    }

    segments.push(nextSegment);
    remainingSteps -= nextSegment;
  }

  return segments;
}

function getDurationForStepCount(stepCount: number): { duration: VexflowDuration; dots: 0 | 1 } {
  const duration = DURATION_BY_STEP_COUNT[stepCount];

  if (!duration) {
    throw new Error(`Unsupported duration segment: ${stepCount} steps.`);
  }

  return duration;
}
