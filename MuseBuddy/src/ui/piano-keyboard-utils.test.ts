import { describe, expect, it } from 'vitest';

import { getPianoKeyboardMarkers } from './piano-keyboard-utils';

describe('getPianoKeyboardMarkers', () => {
  it('supports a keyboard with selected keys and no root marker', () => {
    expect(getPianoKeyboardMarkers(undefined, [2, 5])).toEqual([
      { isRoot: false, pitchClass: 2 },
      { isRoot: false, pitchClass: 5 },
    ]);
  });
});
