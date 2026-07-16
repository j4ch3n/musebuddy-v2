import { getChordListenMatchScore, type ChordDisplay } from '@/music-theory';

type FindBestChordListenMatchInput = {
  completedChordIndexes: ReadonlySet<number>;
  detectedMidiPitches: readonly number[];
  displays: readonly Pick<ChordDisplay, 'notes'>[];
};

type AdvanceChordListenProgressInput = {
  completedChordIndexes: ReadonlySet<number>;
  matchedChordIndex: number;
  totalChordCount: number;
};

export function advanceChordListenProgress({
  completedChordIndexes,
  matchedChordIndex,
  totalChordCount,
}: AdvanceChordListenProgressInput): {
  completedChordIndexes: ReadonlySet<number>;
  isComplete: boolean;
} {
  const nextCompletedChordIndexes = new Set(completedChordIndexes).add(matchedChordIndex);

  return {
    completedChordIndexes: nextCompletedChordIndexes,
    isComplete: totalChordCount > 0 && nextCompletedChordIndexes.size >= totalChordCount,
  };
}

export function findBestChordListenMatchIndex({
  completedChordIndexes,
  detectedMidiPitches,
  displays,
}: FindBestChordListenMatchInput): number | null {
  let bestMatch: {
    expectedPitchClassCount: number;
    extraPitchClassCount: number;
    index: number;
  } | null = null;

  for (const [index, display] of displays.entries()) {
    if (completedChordIndexes.has(index)) {
      continue;
    }

    const score = getChordListenMatchScore({
      detectedMidiPitches,
      expectedNotes: display.notes,
    });
    if (!score) {
      continue;
    }

    if (
      !bestMatch ||
      score.extraPitchClassCount < bestMatch.extraPitchClassCount ||
      (score.extraPitchClassCount === bestMatch.extraPitchClassCount &&
        score.expectedPitchClassCount > bestMatch.expectedPitchClassCount)
    ) {
      bestMatch = { ...score, index };
    }
  }

  return bestMatch?.index ?? null;
}
