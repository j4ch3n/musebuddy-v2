import { describe, expect, it } from 'vitest';

import type { ChordDegree, ChordToneImportance } from '@/contexts/training-session-schema';
import type { PianoPitchClass } from '@schema/music-theory-schema';

import { buildChordDisplay } from './chord-display';

function tone(
  degree: ChordDegree,
  pitch: string,
  pitchClass: PianoPitchClass,
  importance: ChordToneImportance,
  explanation: string,
) {
  return { degree, explanation, importance, pitch, pitchClass };
}

describe('buildChordDisplay', () => {
  it('builds display tokens and ordered tone metadata from a Supabase chord payload', () => {
    const display = buildChordDisplay({
      displayTokens: [
        { type: 'root', value: 'C' },
        { type: 'quality', value: 'maj' },
        { type: 'extension', value: '7' },
      ],
      idName: 'c-major-seven',
      normalizedSymbol: 'Cmaj7',
      root: 'C',
      tones: [
        tone('1', 'C', 0, 'essential', 'root explanation'),
        tone('3', 'E', 4, 'essential', 'third explanation'),
        tone('5', 'G', 7, 'supporting', 'fifth explanation'),
        tone('7', 'B', 11, 'color', 'seventh explanation'),
      ],
    });

    expect(display).toMatchObject({
      commonNotations: ['Cmaj7'],
      friendlyName: 'C major seven',
      idName: 'c-major-seven',
      normalizedSymbol: 'Cmaj7',
      symbol: 'Cmaj7',
      tokens: [
        { text: 'C', type: 'root' },
        { text: 'maj', type: 'quality' },
        { text: '7', type: 'extension' },
      ],
    });
    expect(display.notes.map((note) => note.text)).toEqual(['C', 'E', 'G', 'B']);
    expect(display.notes[0]).toMatchObject({
      degree: '1',
      explanation: 'root explanation',
      importance: 'essential',
      isRoot: true,
      pitchClass: 0,
    });
  });

  it('uses every pitch class directly for keyboard positions', () => {
    const pitches = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const degrees: ChordDegree[] = [
      '1',
      'b2',
      '2',
      '#2',
      '3',
      '4',
      '#4',
      '5',
      '#5',
      '6',
      'b7',
      '7',
    ];

    const display = buildChordDisplay({
      displayTokens: [{ type: 'root', value: 'C' }],
      idName: 'chromatic-test',
      normalizedSymbol: 'C',
      root: 'C',
      tones: pitches.map((pitch, pitchClass) =>
        tone(
          degrees[pitchClass]!,
          pitch,
          pitchClass as PianoPitchClass,
          'supporting',
          `${pitch} explanation`,
        ),
      ),
    });

    expect(display.notes.map((note) => note.pitchClass)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
    expect(display.notes.map((note) => note.midi)).toEqual([
      60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71,
    ]);
  });

  it('creates ascending C4-zone MIDI notes across pitch-class wraparound', () => {
    const display = buildChordDisplay({
      displayTokens: [{ type: 'root', value: 'F' }],
      idName: 'f-major-seven',
      normalizedSymbol: 'Fmaj7',
      root: 'F',
      tones: [
        tone('1', 'F', 5, 'essential', 'root explanation'),
        tone('3', 'A', 9, 'essential', 'third explanation'),
        tone('5', 'C', 0, 'supporting', 'fifth explanation'),
        tone('7', 'E', 4, 'color', 'seventh explanation'),
      ],
    });

    expect(display.notes.map((note) => note.pitchClass)).toEqual([5, 9, 0, 4]);
    expect(display.notes.map((note) => note.midi)).toEqual([65, 69, 72, 76]);
    expect(
      display.notes.map(({ degree, explanation, importance }) => ({
        degree,
        explanation,
        importance,
      })),
    ).toEqual([
      { degree: '1', explanation: 'root explanation', importance: 'essential' },
      { degree: '3', explanation: 'third explanation', importance: 'essential' },
      { degree: '5', explanation: 'fifth explanation', importance: 'supporting' },
      { degree: '7', explanation: 'seventh explanation', importance: 'color' },
    ]);
  });

  it('includes additions from the ordered tones', () => {
    const display = buildChordDisplay({
      displayTokens: [
        { type: 'root', value: 'A' },
        { type: 'addition', value: 'add9' },
      ],
      idName: 'a-add9',
      normalizedSymbol: 'Aadd9',
      root: 'A',
      tones: [
        tone('1', 'A', 9, 'essential', 'root explanation'),
        tone('3', 'C#', 1, 'essential', 'third explanation'),
        tone('5', 'E', 4, 'supporting', 'fifth explanation'),
        tone('9', 'B', 11, 'color', 'ninth explanation'),
      ],
    });

    expect(display.tokens).toContainEqual({ text: 'add9', type: 'addition' });
    expect(display.notes.map((note) => note.text)).toEqual(['A', 'C#', 'E', 'B']);
    expect(display.notes.map((note) => note.midi)).toEqual([69, 73, 76, 83]);
    expect(display.notes.at(-1)).toMatchObject({
      degree: '9',
      explanation: 'ninth explanation',
      importance: 'color',
    });
  });

  it('preserves flat spellings while selecting their numeric piano positions', () => {
    const display = buildChordDisplay({
      displayTokens: [{ type: 'root', value: 'Bb' }],
      idName: 'bb-dominant-seven',
      normalizedSymbol: 'Bb7',
      root: 'Bb',
      tones: [
        tone('1', 'Bb', 10, 'essential', 'root explanation'),
        tone('3', 'D', 2, 'essential', 'third explanation'),
        tone('5', 'F', 5, 'supporting', 'fifth explanation'),
        tone('b7', 'Ab', 8, 'essential', 'seventh explanation'),
      ],
    });

    expect(display.notes.map((note) => note.text)).toEqual(['Bb', 'D', 'F', 'Ab']);
    expect(display.notes.map((note) => note.pitchClass)).toEqual([10, 2, 5, 8]);
    expect(display.notes[0]).toMatchObject({ accidental: 'b', isRoot: true, letter: 'B' });
  });

  it('preserves double accidentals and their notation octaves', () => {
    const display = buildChordDisplay({
      displayTokens: [{ type: 'root', value: 'A#' }],
      idName: 'a-sharp-add-ninth',
      normalizedSymbol: 'A#add9',
      root: 'A#',
      tones: [
        tone('1', 'A#', 10, 'essential', 'root explanation'),
        tone('3', 'C##', 2, 'essential', 'third explanation'),
        tone('5', 'E#', 5, 'supporting', 'fifth explanation'),
        tone('9', 'B#', 0, 'color', 'ninth explanation'),
      ],
    });

    expect(display.notes.map((note) => note.text)).toEqual(['A#', 'C##', 'E#', 'B#']);
    expect(display.notes.map((note) => note.midi)).toEqual([70, 74, 77, 84]);
    expect(display.notes.map((note) => note.vexflowKey)).toEqual(['a/4', 'c/5', 'e/5', 'b/5']);
    expect(display.notes.map((note) => note.accidental)).toEqual(['#', '##', '#', '#']);
  });

  it('identifies the root by exact tone pitch instead of degree metadata', () => {
    const display = buildChordDisplay({
      displayTokens: [{ type: 'root', value: 'C' }],
      idName: 'root-pitch-test',
      normalizedSymbol: 'C',
      root: 'C',
      tones: [
        tone('1', 'E', 4, 'essential', 'deliberately mismatched degree'),
        tone('3', 'C', 0, 'essential', 'deliberately mismatched degree'),
      ],
    });

    expect(display.notes.map((note) => note.isRoot)).toEqual([false, true]);
  });

  it('formats chord profile ids for friendly names', () => {
    const cases = [
      ['a-flat-major-no-fifth', 'Ab', 'Ab', 8, 'A flat major no fifth'],
      ['a-flat-minor-first-inversion-over-c-flat', 'Abm/Cb', 'Ab', 8, 'A flat minor over C flat'],
      ['a-major-over-c', 'A/C', 'A', 9, 'A major over C'],
      ['d-major-second-inversion-over-a', 'D/A', 'D', 2, 'D major over A'],
    ] as const;

    for (const [idName, normalizedSymbol, root, pitchClass, expectedName] of cases) {
      expect(
        buildChordDisplay({
          displayTokens: [{ type: 'root', value: root }],
          idName,
          normalizedSymbol,
          root,
          tones: [tone('1', root, pitchClass, 'essential', 'root explanation')],
        }).friendlyName,
      ).toBe(expectedName);
    }
  });
});
