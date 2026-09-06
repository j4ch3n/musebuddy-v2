import { describe, expect, it } from 'vitest';

import { derivePianoHandShape } from './chord-hand-shape';

describe('derivePianoHandShape', () => {
  it('separates the major-triad interval shape from physical key colors', () => {
    expect(
      derivePianoHandShape([
        { degree: '1', midiPitchClass: 2, pitch: 'D' },
        { degree: '3', midiPitchClass: 6, pitch: 'F#' },
        { degree: '5', midiPitchClass: 9, pitch: 'A' },
      ]),
    ).toMatchObject({
      intervalFormula: '4+3',
      keyColorPattern: ['white', 'black', 'white'],
      structuralShapeId: 'bass-position-v2:1:4-3',
    });
  });
});
