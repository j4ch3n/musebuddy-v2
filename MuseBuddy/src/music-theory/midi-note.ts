import * as Note from '@tonaljs/note';

import type { MusicNoteLetter, PianoPitchClass } from '@schema/music-theory-schema';

export type MusicDisplayNote = {
  accidental: string;
  letter: MusicNoteLetter;
  midi: number;
  octave: number;
  pitchClass: PianoPitchClass;
  text: string;
  vexflowKey: string;
};

export function midiToDisplayNote(midi: number, textOverride?: string): MusicDisplayNote {
  const noteName = Note.fromMidiSharps(midi);

  if (!noteName) {
    throw new Error(`Unsupported MIDI pitch: ${midi}.`);
  }

  const pitchClass = Note.pitchClass(noteName);
  const parsedNote = parsePitchClass(textOverride ?? pitchClass);
  const octave = textOverride
    ? 4 + (midi - pitchClassToMidi(textOverride, 4)) / 12
    : Note.octave(noteName);

  if (octave === undefined || !Number.isInteger(octave)) {
    throw new Error(`Unsupported MIDI octave: ${midi}.`);
  }

  return {
    accidental: parsedNote.accidental,
    letter: parsedNote.letter,
    midi,
    octave,
    pitchClass: midiToPitchClass(midi),
    text: textOverride ?? pitchClass,
    vexflowKey: `${parsedNote.letter.toLowerCase()}/${octave}`,
  };
}

export function pitchClassToMidi(pitchClass: string, octave: number) {
  const midi = Note.midi(`${pitchClass}${octave}`);

  if (midi === null) {
    throw new Error(`Unsupported pitch class: ${pitchClass}.`);
  }

  return midi;
}

export function parsePitchClass(pitchClass: string): {
  accidental: string;
  letter: MusicNoteLetter;
} {
  const note = Note.get(`${pitchClass}4`);

  if (note.empty) {
    throw new Error(`Unsupported pitch class: ${pitchClass}.`);
  }

  return {
    accidental: note.acc,
    letter: note.letter as MusicNoteLetter,
  };
}

export function midiToPitchClass(midi: number): PianoPitchClass {
  if (!Number.isInteger(midi)) {
    throw new Error(`Unsupported MIDI pitch: ${midi}.`);
  }

  return (((midi % 12) + 12) % 12) as PianoPitchClass;
}
