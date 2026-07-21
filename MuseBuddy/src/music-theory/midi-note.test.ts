import { describe, expect, it } from 'vitest';

import { midiToDisplayNote, midiToPitchClass, parsePitchClass } from './midi-note';

describe('midi note utilities', () => {
  it('converts MIDI pitches into display notes and VexFlow keys', () => {
    expect(midiToDisplayNote(60)).toMatchObject({
      accidental: '',
      letter: 'C',
      midi: 60,
      octave: 4,
      pitchClass: 0,
      text: 'C',
      vexflowKey: 'c/4',
    });
  });

  it('derives numeric pitch classes from MIDI', () => {
    expect(midiToDisplayNote(70)).toMatchObject({
      accidental: '#',
      letter: 'A',
      pitchClass: 10,
      text: 'A#',
      vexflowKey: 'a/4',
    });
    expect(midiToPitchClass(70)).toBe(10);
  });

  it('parses flat pitch classes for display overrides', () => {
    expect(parsePitchClass('Bb')).toEqual({ accidental: 'b', letter: 'B' });
    expect(midiToDisplayNote(70, 'Bb')).toMatchObject({
      accidental: 'b',
      letter: 'B',
      pitchClass: 10,
      text: 'Bb',
    });
  });

  it('preserves double-accidental notation octaves for an assigned MIDI pitch', () => {
    expect(midiToDisplayNote(74, 'C##')).toMatchObject({
      accidental: '##',
      letter: 'C',
      midi: 74,
      octave: 5,
      pitchClass: 2,
      text: 'C##',
      vexflowKey: 'c/5',
    });
  });
});
