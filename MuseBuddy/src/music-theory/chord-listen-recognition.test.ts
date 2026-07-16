import { describe, expect, it } from 'vitest';

import { pitchClassToMidi } from './midi-note';
import { isChordListenMatch } from './chord-listen-recognition';

describe('isChordListenMatch', () => {
  it('passes when C, E, and G are detected for C major', () => {
    expect(
      isChordListenMatch({
        detectedMidiPitches: [midi('C', 4), midi('E', 4), midi('G', 4)],
        expectedNotes: chordNotes('C', 'E', 'G'),
      }),
    ).toBe(true);
  });

  it('passes when expected notes are repeated across octaves', () => {
    expect(
      isChordListenMatch({
        detectedMidiPitches: [midi('C', 3), midi('C', 4), midi('C', 5), midi('E', 4), midi('G', 4)],
        expectedNotes: chordNotes('C', 'E', 'G'),
      }),
    ).toBe(true);
  });

  it('normalizes enharmonic pitch classes', () => {
    expect(
      isChordListenMatch({
        detectedMidiPitches: [midi('C#', 4)],
        expectedNotes: chordNotes('Db'),
      }),
    ).toBe(true);
  });

  it('passes with one or two extra pitch classes', () => {
    expect(
      isChordListenMatch({
        detectedMidiPitches: [midi('C', 4), midi('E', 4), midi('G', 4), midi('A', 4)],
        expectedNotes: chordNotes('C', 'E', 'G'),
      }),
    ).toBe(true);

    expect(
      isChordListenMatch({
        detectedMidiPitches: [midi('C', 4), midi('E', 4), midi('G', 4), midi('A', 4), midi('B', 4)],
        expectedNotes: chordNotes('C', 'E', 'G'),
      }),
    ).toBe(true);
  });

  it('fails when an expected pitch class is missing', () => {
    expect(
      isChordListenMatch({
        detectedMidiPitches: [midi('C', 4), midi('E', 4)],
        expectedNotes: chordNotes('C', 'E', 'G'),
      }),
    ).toBe(false);
  });

  it('fails with more than two extra pitch classes', () => {
    expect(
      isChordListenMatch({
        detectedMidiPitches: [
          midi('C', 4),
          midi('E', 4),
          midi('G', 4),
          midi('A', 4),
          midi('B', 4),
          midi('D', 5),
        ],
        expectedNotes: chordNotes('C', 'E', 'G'),
      }),
    ).toBe(false);
  });
});

function chordNotes(...pitchClasses: string[]) {
  return pitchClasses.map((pitchClass) => ({ midi: midi(pitchClass, 4) }));
}

function midi(pitchClass: string, octave: number) {
  return pitchClassToMidi(pitchClass, octave);
}
