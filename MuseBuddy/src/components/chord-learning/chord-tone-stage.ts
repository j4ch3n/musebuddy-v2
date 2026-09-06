import type { ChordDisplay, ChordDisplayNote } from '@/music-theory';

export const chordLearningStages = ['anchor', 'quality', 'guide', 'color', 'complete'] as const;
export type ChordToneStage = (typeof chordLearningStages)[number];
const teachingRoleOrder = ['anchor', 'quality', 'guide', 'color', 'voicing'] as const;

export function availableChordToneStages(display: ChordDisplay): readonly ChordToneStage[] {
  return chordLearningStages.filter(
    (stage) =>
      stage === 'complete' ||
      display.notes.some((note) =>
        stage === 'anchor'
          ? note.isRoot || note.teachingRole === stage
          : note.teachingRole === stage,
      ),
  );
}

export function resolveChordToneStage(
  availableStages: readonly ChordToneStage[],
  requestedStage: ChordToneStage,
): ChordToneStage {
  const requestedIndex = chordLearningStages.indexOf(requestedStage);
  const resolvedStage = [...availableStages]
    .reverse()
    .find((stage) => chordLearningStages.indexOf(stage) <= requestedIndex);

  return resolvedStage ?? availableStages[0] ?? 'complete';
}

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

export function emphasizedChordNotes(
  display: ChordDisplay,
  stage: ChordToneStage,
): readonly ChordDisplayNote[] {
  const teachingRole = stage === 'complete' ? 'voicing' : stage;
  return visibleChordNotes(display, stage).filter(
    (note) => note.teachingRole === teachingRole || (stage === 'anchor' && note.isRoot),
  );
}

export function chordToneStageLabel(stage: ChordToneStage) {
  return {
    anchor: 'Anchor',
    quality: 'Quality',
    guide: 'Guide Tone',
    color: 'Color Tones',
    complete: 'Complete Chord',
  }[stage];
}
