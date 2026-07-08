import { describe, expect, it } from 'vitest';

import { buildChordDisplay } from './chord-display';

describe('buildChordDisplay', () => {
  it('builds display tokens and notes from a Supabase chord payload', () => {
    const display = buildChordDisplay({
      displayTokens: [
        { type: 'root', value: 'C' },
        { type: 'quality', value: 'maj' },
        { type: 'extension', value: '7' },
      ],
      idName: 'c-major-seven',
      normalizedSymbol: 'Cmaj7',
      qualityBaseFormula: ['1', '3', '5', '7'],
      root: 'C',
      tones: [
        { explanation: 'is the root. It names and anchors the chord.' },
        { explanation: 'is the third. It gives the chord its major color.' },
        { explanation: 'is the fifth. It makes the chord feel stable.' },
        { explanation: 'is the seventh. It adds a smooth color.' },
      ],
    });

    expect(display.symbol).toBe('Cmaj7');
    expect(display.idName).toBe('c-major-seven');
    expect(display.friendlyName).toBe('C major seven');
    expect(display.normalizedSymbol).toBe('Cmaj7');
    expect(display.commonNotations).toEqual(['Cmaj7']);
    expect(display.tokens).toEqual([
      { text: 'C', type: 'root' },
      { text: 'maj', type: 'quality' },
      { text: '7', type: 'extension' },
    ]);
    expect(display.notes.map((note) => note.text)).toEqual(['C', 'E', 'G', 'B']);
    expect(display.notes[0]).toMatchObject({
      explanation: 'is the root. It names and anchors the chord.',
    });
  });

  it('supports additions from display tokens', () => {
    const display = buildChordDisplay({
      displayTokens: [
        { type: 'root', value: 'A' },
        { type: 'addition', value: 'add9' },
      ],
      idName: 'a-add9',
      normalizedSymbol: 'Aadd9',
      qualityBaseFormula: ['1', '3', '5'],
      root: 'A',
      tones: [
        { explanation: 'is the root. It names and anchors the chord.' },
        { explanation: 'is the third. It gives the chord its major color.' },
        { explanation: 'is the fifth. It makes the chord feel stable.' },
      ],
    });

    expect(display.symbol).toBe('Aadd9');
    expect(display.tokens).toContainEqual({ text: 'add9', type: 'addition' });
    expect(display.notes.map((note) => note.text)).toEqual(['A', 'C#', 'E']);
  });

  it('formats chord profile ids for friendly names', () => {
    expect(
      buildChordDisplay({
        displayTokens: [{ type: 'root', value: 'Ab' }],
        idName: 'a-flat-major-no-fifth',
        normalizedSymbol: 'Ab',
        qualityBaseFormula: ['1'],
        root: 'Ab',
        tones: [{ explanation: 'is the root. It names and anchors the chord.' }],
      }).friendlyName,
    ).toBe('A flat major no fifth');

    expect(
      buildChordDisplay({
        displayTokens: [{ type: 'root', value: 'Ab' }],
        idName: 'a-flat-minor-first-inversion-over-c-flat',
        normalizedSymbol: 'Abm/Cb',
        qualityBaseFormula: ['1'],
        root: 'Ab',
        tones: [{ explanation: 'is the root. It names and anchors the chord.' }],
      }).friendlyName,
    ).toBe('A flat minor over C flat');

    expect(
      buildChordDisplay({
        displayTokens: [{ type: 'root', value: 'A' }],
        idName: 'a-major-over-c',
        normalizedSymbol: 'A/C',
        qualityBaseFormula: ['1'],
        root: 'A',
        tones: [{ explanation: 'is the root. It names and anchors the chord.' }],
      }).friendlyName,
    ).toBe('A major over C');

    expect(
      buildChordDisplay({
        displayTokens: [{ type: 'root', value: 'D' }],
        idName: 'd-major-second-inversion-over-a',
        normalizedSymbol: 'D/A',
        qualityBaseFormula: ['1'],
        root: 'D',
        tones: [{ explanation: 'is the root. It names and anchors the chord.' }],
      }).friendlyName,
    ).toBe('D major over A');

    expect(
      buildChordDisplay({
        displayTokens: [{ type: 'root', value: 'Ab' }],
        idName: 'a-flat-suspended-fourth-second-inversion-over-e-flat',
        normalizedSymbol: 'Absus4/Eb',
        qualityBaseFormula: ['1'],
        root: 'Ab',
        tones: [{ explanation: 'is the root. It names and anchors the chord.' }],
      }).friendlyName,
    ).toBe('A flat suspended fourth over E flat');
  });

  it('spells accidental roots for sheet display and keyboard highlighting', () => {
    const display = buildChordDisplay({
      displayTokens: [
        { type: 'root', value: 'Bb' },
        { type: 'extension', value: '7' },
      ],
      idName: 'bb-dominant-seven',
      normalizedSymbol: 'Bb7',
      qualityBaseFormula: ['1', '3', '5', 'b7'],
      root: 'Bb',
      tones: [
        { explanation: 'is the root. It names and anchors the chord.' },
        { explanation: 'is the third. It gives the chord its major color.' },
        { explanation: 'is the fifth. It makes the chord feel stable.' },
        { explanation: 'is the flat seventh. It creates dominant tension.' },
      ],
    });

    expect(display.symbol).toBe('Bb7');
    expect(display.commonNotations).toEqual(['Bb7']);
    expect(display.notes.map((note) => note.text)).toEqual(['Bb', 'D', 'F', 'G#']);
    expect(display.notes.map((note) => note.keyboardKey)).toEqual(['A#', 'D', 'F', 'G#']);
    expect(display.notes[0]).toMatchObject({ accidental: 'b', letter: 'B' });
  });
});
