import { describe, expect, it } from 'vitest';

import { derivePianoHandShape, derivePianoHandShapeCues } from './chord-hand-shape';

describe('derivePianoHandShape', () => {
  it('separates the major-triad interval shape from physical key colors', () => {
    expect(
      derivePianoHandShape([
        { degree: '1', pitchClass: 2 },
        { degree: '3', pitchClass: 6 },
        { degree: '5', pitchClass: 9 },
      ]),
    ).toMatchObject({
      intervalFormula: '4+3',
      keyColorPattern: ['white', 'black', 'white'],
      orderedDegrees: ['1', '3', '5'],
    });
  });
});

describe('derivePianoHandShapeCues', () => {
  it.each([
    [['white', 'white', 'white'], 'All white'],
    [['white', 'black', 'white'], 'Middle raised'],
    [['black', 'white', 'black'], 'Ends raised'],
    [['black', 'black', 'black'], 'All black'],
    [['black', 'white', 'white'], 'Left raised'],
    [['white', 'white', 'black'], 'Right raised'],
    [['black', 'black', 'white'], 'Left two raised'],
    [['white', 'black', 'black'], 'Right two raised'],
  ] as const)('names the %s hand pattern as %s', (keyColors, name) => {
    const cues = derivePianoHandShapeCues(
      keyColors.map((keyColor, index) => ({
        hand: 'left' as const,
        midi: 60 + index,
        pitchClass: keyColor === 'black' ? 1 : 0,
      })),
    );

    expect(cues).toEqual([{ hand: 'left', keyColorPattern: keyColors, name }]);
  });

  it('uses the lower middle key when reducing a four-note hand', () => {
    expect(
      derivePianoHandShapeCues([
        { hand: 'right', midi: 60, pitchClass: 0 },
        { hand: 'right', midi: 61, pitchClass: 1 },
        { hand: 'right', midi: 62, pitchClass: 0 },
        { hand: 'right', midi: 63, pitchClass: 1 },
      ]),
    ).toEqual([
      {
        hand: 'right',
        keyColorPattern: ['white', 'black', 'black'],
        name: 'Right two raised',
      },
    ]);
  });

  it('uses compact all-white and right-raised names for one- and two-note hands', () => {
    expect(
      derivePianoHandShapeCues([
        { hand: 'left', midi: 48, pitchClass: 0 },
        { hand: 'right', midi: 60, pitchClass: 0 },
        { hand: 'right', midi: 61, pitchClass: 1 },
      ]),
    ).toEqual([
      { hand: 'left', keyColorPattern: ['white'], name: 'All white' },
      { hand: 'right', keyColorPattern: ['white', 'black'], name: 'Right raised' },
    ]);
  });
});
