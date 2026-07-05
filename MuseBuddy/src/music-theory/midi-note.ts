import * as Note from '@tonaljs/note';

import type { MusicNoteLetter, PianoKeyboardKeyName } from '@schema/music-theory-schema';

export type MusicDisplayNote = {
  accidental: string;
  keyboardKey: PianoKeyboardKeyName;
  letter: MusicNoteLetter;
  midi: number;
  octave: number;
  text: string;
  vexflowKey: string;
};

export function midiToDisplayNote(midi: number, textOverride?: string): MusicDisplayNote {
  const noteName = Note.fromMidiSharps(midi);

  if (!noteName) {
    throw new Error(`Unsupported MIDI pitch: ${midi}.`);
  }

  const pitchClass = Note.pitchClass(noteName);
  const keyboardKey = midiToKeyboardKey(midi);
  const parsedNote = parsePitchClass(textOverride ?? pitchClass);
  const octave = Note.octave(noteName);

  if (octave === undefined) {
    throw new Error(`Unsupported MIDI octave: ${midi}.`);
  }

  return {
    accidental: parsedNote.accidental,
    keyboardKey,
    letter: parsedNote.letter,
    midi,
    octave,
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

export function midiToKeyboardKey(midi: number): PianoKeyboardKeyName {
  const pitchClass = Note.pitchClass(Note.fromMidiSharps(midi));

  if (!pitchClass) {
    throw new Error(`Unsupported MIDI pitch: ${midi}.`);
  }

  return pitchClass as PianoKeyboardKeyName;
}
