export type ChordLearningCueVisibility = {
  showKeyHighlightDots: boolean;
  showSheetNotation: boolean;
};

export function getChordLearningCueVisibility(completedCycles: number): ChordLearningCueVisibility {
  return {
    showKeyHighlightDots: completedCycles < 1,
    showSheetNotation: completedCycles < 2,
  };
}
