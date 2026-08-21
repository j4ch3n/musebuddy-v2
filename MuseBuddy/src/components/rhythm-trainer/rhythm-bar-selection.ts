import { STEPS_PER_BAR } from './constants';

export function getActiveRhythmBarIndex(currentStepIndex: number | null, barCount: number): number {
  if (barCount <= 1 || currentStepIndex === null) {
    return 0;
  }

  return Math.min(Math.floor(currentStepIndex / STEPS_PER_BAR), barCount - 1);
}
