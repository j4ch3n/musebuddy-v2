import * as Note from '@tonaljs/note';

import type { TrainingSessionChord, ChordDegree } from '@/contexts/training-session-schema';
import type { MusicNoteLetter, PianoKeyboardKeyName } from '@schema/music-theory-schema';

export type ChordDisplayTokenType =
  | 'root'
  | 'quality'
  | 'extension'
  | 'alteration'
  | 'addition'
  | 'omission'
  | 'bass'
  | 'separator';

export type ChordDisplayToken = {
  text: string;
  type: ChordDisplayTokenType;
};

export type ChordDisplayNote = {
  accidental: string;
  interval: ChordDegree;
  isRoot: boolean;
  keyboardKey: PianoKeyboardKeyName;
  letter: MusicNoteLetter;
  octave: number;
  text: string;
};

export type ChordDisplay = {
  commonNotations: readonly string[];
  friendlyName: string;
  notes: readonly ChordDisplayNote[];
  symbol: string;
  tokens: readonly ChordDisplayToken[];
};

const INTERVAL_SEMITONES = {
  '#11': 18,
  '#2': 3,
  '#4': 6,
  '#5': 8,
  '#9': 15,
  '1': 0,
  '11': 17,
  '13': 21,
  '2': 2,
  '3': 4,
  '4': 5,
  '5': 7,
  '6': 9,
  '7': 11,
  '9': 14,
  b2: 1,
  b3: 3,
  b5: 6,
  b6: 8,
  b7: 10,
  b9: 13,
  b13: 20,
  bb7: 9,
} satisfies Record<ChordDegree, number>;

export function buildChordDisplay(chord: TrainingSessionChord): ChordDisplay {
  const tokens = chord.displayTokens.map((token) => ({
    text: token.value,
    type: token.type,
  }));
  const symbol = tokens.map((token) => token.text).join('');

  return {
    commonNotations: [symbol],
    friendlyName: `${chord.root} chord`,
    notes: chord.qualityBaseFormula.map((interval) => buildNote(chord.root, interval)),
    symbol,
    tokens,
  };
}

function buildNote(root: string, interval: ChordDegree): ChordDisplayNote {
  const rootMidi = Note.midi(`${root}4`);

  if (rootMidi === null) {
    throw new Error(`Unsupported chord root: ${root}.`);
  }

  const midi = rootMidi + INTERVAL_SEMITONES[interval];
  const noteName = interval === '1' ? root : Note.pitchClass(Note.fromMidiSharps(midi));
  const parsedNote = parsePitchClass(noteName);
  const keyboardKey = midiToKeyboardKey(midi);
  const octave = Note.octave(Note.fromMidiSharps(midi)) ?? 4;

  return {
    accidental: parsedNote.accidental,
    interval,
    isRoot: interval === '1',
    keyboardKey,
    letter: parsedNote.letter,
    octave,
    text: interval === '1' ? root : keyboardKey,
  };
}

function parsePitchClass(pitchClass: string): { accidental: string; letter: MusicNoteLetter } {
  const note = Note.get(`${pitchClass}4`);

  if (note.empty) {
    throw new Error(`Unsupported pitch class: ${pitchClass}.`);
  }

  return {
    accidental: note.acc,
    letter: note.letter as MusicNoteLetter,
  };
}

function midiToKeyboardKey(midi: number): PianoKeyboardKeyName {
  const pitchClass = Note.pitchClass(Note.fromMidiSharps(midi));

  if (!pitchClass) {
    throw new Error(`Unsupported MIDI pitch: ${midi}.`);
  }

  return pitchClass as PianoKeyboardKeyName;
}
