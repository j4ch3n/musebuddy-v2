import { describe, expect, it } from 'vitest';

import { getActiveRhythmBarIndex } from './rhythm-bar-selection';

describe('getActiveRhythmBarIndex', () => {
  it('keeps the first bar visible until playback advances into the second bar', () => {
    expect(getActiveRhythmBarIndex(null, 3)).toBe(0);
    expect(getActiveRhythmBarIndex(0, 3)).toBe(0);
    expect(getActiveRhythmBarIndex(31, 3)).toBe(0);
    expect(getActiveRhythmBarIndex(32, 3)).toBe(1);
  });

  it('holds the final bar for an out-of-range final playhead', () => {
    expect(getActiveRhythmBarIndex(95, 3)).toBe(2);
    expect(getActiveRhythmBarIndex(120, 3)).toBe(2);
  });
});
