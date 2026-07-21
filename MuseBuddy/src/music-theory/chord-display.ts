import type {
  ChordDegree,
  ChordTone,
  ChordToneImportance,
  TrainingSessionChord,
} from '@/contexts/training-session-schema';

import { midiToDisplayNote, type MusicDisplayNote } from './midi-note';

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

export type ChordDisplayNote = MusicDisplayNote & {
  degree: ChordDegree;
  explanation: string;
  importance: ChordToneImportance;
  isRoot: boolean;
};

export type ChordDisplay = {
  commonNotations: readonly string[];
  friendlyName: string;
  idName: string;
  notes: readonly ChordDisplayNote[];
  normalizedSymbol: string;
  symbol: string;
  tokens: readonly ChordDisplayToken[];
};

export function buildChordDisplay(chord: TrainingSessionChord): ChordDisplay {
  const tokens = chord.displayTokens.map((token) => ({
    text: token.value,
    type: token.type,
  }));
  const symbol = tokens.map((token) => token.text).join('');

  return {
    commonNotations: [symbol],
    friendlyName: formatChordIdName(chord.idName),
    idName: chord.idName,
    notes: buildChordNotes(chord),
    normalizedSymbol: chord.normalizedSymbol,
    symbol,
    tokens,
  };
}

function buildChordNotes(chord: TrainingSessionChord) {
  let octaveOffset = 0;

  return chord.tones.map((tone, index) => {
    if (index > 0 && tone.pitchClass < chord.tones[index - 1]!.pitchClass) {
      octaveOffset += 12;
    }

    return buildChordNote(chord.root, 60 + octaveOffset + tone.pitchClass, tone);
  });
}

function formatChordIdName(idName: string) {
  const displayName = idName
    .replaceAll('-', ' ')
    .replace(/\b(?:first|second) inversion\b/g, '')
    .replace(/\bover ([a-z])\b/g, (_, pitch: string) => `over ${pitch.toUpperCase()}`)
    .replace(/\s+/g, ' ')
    .trim();

  return `${displayName.charAt(0).toUpperCase()}${displayName.slice(1)}`;
}

function buildChordNote(root: string, midi: number, tone: ChordTone): ChordDisplayNote {
  const note = midiToDisplayNote(midi, tone.pitch);

  return {
    ...note,
    degree: tone.degree,
    explanation: tone.explanation,
    importance: tone.importance,
    isRoot: tone.pitch === root,
    pitchClass: tone.pitchClass,
  };
}
