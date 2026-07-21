import { describe, expect, it } from 'vitest';

import { pianoPitchClasses } from '@schema/music-theory-schema';

import { getPianoKeyboardMarkers } from './piano-keyboard-utils';

describe('getPianoKeyboardMarkers', () => {
  it('supports all twelve pitch-class positions', () => {
    expect(getPianoKeyboardMarkers(0, pianoPitchClasses.slice(1))).toEqual(
      pianoPitchClasses.map((pitchClass) => ({
        isRoot: pitchClass === 0,
        pitchClass,
      })),
    );
  });

  it('includes the root when no other keys are selected', () => {
    expect(getPianoKeyboardMarkers(0)).toEqual([{ isRoot: true, pitchClass: 0 }]);
  });

  it('deduplicates pitch classes and lets the root marker win', () => {
    expect(getPianoKeyboardMarkers(1, [1, 4, 6, 1])).toEqual([
      { isRoot: true, pitchClass: 1 },
      { isRoot: false, pitchClass: 4 },
      { isRoot: false, pitchClass: 6 },
    ]);
  });
});
