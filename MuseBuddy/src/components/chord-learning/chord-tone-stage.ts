import type { ChordDisplay, ChordDisplayNote } from '@/music-theory';

export const chordLearningStages = ['anchor', 'quality', 'guide', 'color', 'complete'] as const;
export type ChordToneStage = (typeof chordLearningStages)[number];
const teachingRoleOrder = ['anchor', 'quality', 'guide', 'color', 'voicing'] as const;

export function visibleChordNotes(
  display: ChordDisplay,
  stage: ChordToneStage,
): readonly ChordDisplayNote[] {
  const stageIndex = chordLearningStages.indexOf(stage);
  return display.notes.filter((note) => {
    if (note.isRoot || note.isBass) return true;
    return (
      stage === 'complete' ||
      teachingRoleOrder.indexOf(note.teachingRole ?? 'voicing') <= stageIndex
    );
  });
}

export function chordToneStageLabel(stage: ChordToneStage) {
  return {
    anchor: 'Anchor',
    quality: 'Quality',
    guide: 'Guide tone',
    color: 'Color tones',
    complete: 'Complete chord',
  }[stage];
}
