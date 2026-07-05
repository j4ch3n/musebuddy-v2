import { describe, expect, it } from 'vitest';

import { midiToDisplayNote, midiToKeyboardKey, parsePitchClass } from './midi-note';

describe('midi note utilities', () => {
  it('converts MIDI pitches into display notes and VexFlow keys', () => {
    expect(midiToDisplayNote(60)).toMatchObject({
      accidental: '',
      keyboardKey: 'C',
      letter: 'C',
      midi: 60,
      octave: 4,
      text: 'C',
      vexflowKey: 'c/4',
    });
  });

  it('uses sharp pitch classes for canonical keyboard keys', () => {
    expect(midiToDisplayNote(70)).toMatchObject({
      accidental: '#',
      keyboardKey: 'A#',
      letter: 'A',
      text: 'A#',
      vexflowKey: 'a/4',
    });
    expect(midiToKeyboardKey(70)).toBe('A#');
  });

  it('parses flat pitch classes for display overrides', () => {
    expect(parsePitchClass('Bb')).toEqual({ accidental: 'b', letter: 'B' });
    expect(midiToDisplayNote(70, 'Bb')).toMatchObject({
      accidental: 'b',
      keyboardKey: 'A#',
      letter: 'B',
      text: 'Bb',
    });
  });
});
