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
      qualityBaseFormula: ['1', '3', '5', '7'],
      root: 'C',
    });

    expect(display.symbol).toBe('Cmaj7');
    expect(display.commonNotations).toEqual(['Cmaj7']);
    expect(display.tokens).toEqual([
      { text: 'C', type: 'root' },
      { text: 'maj', type: 'quality' },
      { text: '7', type: 'extension' },
    ]);
    expect(display.notes.map((note) => note.text)).toEqual(['C', 'E', 'G', 'B']);
  });

  it('supports additions from display tokens', () => {
    const display = buildChordDisplay({
      displayTokens: [
        { type: 'root', value: 'A' },
        { type: 'addition', value: 'add9' },
      ],
      qualityBaseFormula: ['1', '3', '5'],
      root: 'A',
    });

    expect(display.symbol).toBe('Aadd9');
    expect(display.tokens).toContainEqual({ text: 'add9', type: 'addition' });
    expect(display.notes.map((note) => note.text)).toEqual(['A', 'C#', 'E']);
  });

  it('spells accidental roots for sheet display and keyboard highlighting', () => {
    const display = buildChordDisplay({
      displayTokens: [
        { type: 'root', value: 'Bb' },
        { type: 'extension', value: '7' },
      ],
      qualityBaseFormula: ['1', '3', '5', 'b7'],
      root: 'Bb',
    });

    expect(display.symbol).toBe('Bb7');
    expect(display.commonNotations).toEqual(['Bb7']);
    expect(display.notes.map((note) => note.text)).toEqual(['Bb', 'D', 'F', 'G#']);
    expect(display.notes.map((note) => note.keyboardKey)).toEqual(['A#', 'D', 'F', 'G#']);
    expect(display.notes[0]).toMatchObject({ accidental: 'b', letter: 'B' });
  });
});
