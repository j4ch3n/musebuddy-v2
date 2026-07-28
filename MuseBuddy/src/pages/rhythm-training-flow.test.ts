import { describe, expect, it } from 'vitest';

import { getNextRhythmTrainingHref } from './rhythm-training-flow';

describe('rhythm training flow', () => {
  it('advances bass rhythm to treble rhythm', () => {
    expect(getNextRhythmTrainingHref('bass')).toBe('/rhythm-training-treble');
  });

  it('advances treble rhythm to pattern training', () => {
    expect(getNextRhythmTrainingHref('treble')).toBe('/pattern-training');
  });
});
