import { describe, expect, it } from 'vitest';

import { getChordLearningCueVisibility } from './chord-learning-cue-visibility';

describe('getChordLearningCueVisibility', () => {
  it('shows all teaching cues during the first round', () => {
    expect(getChordLearningCueVisibility(0)).toEqual({
      showKeyHighlightDots: true,
      showSheetNotation: true,
    });
  });

  it('hides keyboard dots after the first completed round', () => {
    expect(getChordLearningCueVisibility(1)).toEqual({
      showKeyHighlightDots: false,
      showSheetNotation: true,
    });
  });

  it('hides keyboard dots and notation after the second completed round', () => {
    expect(getChordLearningCueVisibility(2)).toEqual({
      showKeyHighlightDots: false,
      showSheetNotation: false,
    });
  });
});
