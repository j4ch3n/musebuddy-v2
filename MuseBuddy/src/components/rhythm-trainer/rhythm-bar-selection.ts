import { STEPS_PER_BAR } from './constants';

export function getActiveRhythmBarIndex(currentStepIndex: number | null, barCount: number): number {
  if (barCount <= 1 || currentStepIndex === null) {
    return 0;
  }

  return Math.min(Math.floor(currentStepIndex / STEPS_PER_BAR), barCount - 1);
}

export function getCurrentStepInRhythmBar(currentStepIndex: number | null, barIndex: number) {
  const barStart = barIndex * STEPS_PER_BAR;

  return currentStepIndex !== null &&
    currentStepIndex >= barStart &&
    currentStepIndex < barStart + STEPS_PER_BAR
    ? currentStepIndex - barStart
    : null;
}
