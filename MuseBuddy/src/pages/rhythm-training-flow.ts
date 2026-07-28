export const rhythmTrainingHrefs = {
  bass: '/rhythm-training-bass',
  treble: '/rhythm-training-treble',
} as const;

export type RhythmStaff = keyof typeof rhythmTrainingHrefs;

export function getNextRhythmTrainingHref(
  staff: RhythmStaff,
): (typeof rhythmTrainingHrefs)['treble'] | '/pattern-training' {
  return staff === 'bass' ? rhythmTrainingHrefs.treble : '/pattern-training';
}
