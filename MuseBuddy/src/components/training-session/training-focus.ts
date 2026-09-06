export type TrainingFocus = 'chords' | 'rhythm' | 'voicing';

export const trainingFocuses = [
  'chords',
  'rhythm',
  'voicing',
] as const satisfies readonly TrainingFocus[];

export function nextTrainingFocus(focus: TrainingFocus): TrainingFocus | null {
  const index = trainingFocuses.indexOf(focus);
  return trainingFocuses[index + 1] ?? null;
}
