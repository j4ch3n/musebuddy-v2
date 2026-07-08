import type { ChordDegree, TrainingSessionChord } from '@/contexts/training-session-schema';

import { midiToDisplayNote, pitchClassToMidi, type MusicDisplayNote } from './midi-note';

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
  explanation?: string;
  interval: ChordDegree;
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
    friendlyName: formatChordIdName(chord.idName),
    idName: chord.idName,
    notes: chord.qualityBaseFormula.map((interval, index) =>
      buildChordNote(chord.root, interval, chord.tones[index]?.explanation),
    ),
    normalizedSymbol: chord.normalizedSymbol,
    symbol,
    tokens,
  };
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

function buildChordNote(
  root: string,
  interval: ChordDegree,
  explanation: string | undefined,
): ChordDisplayNote {
  const midi = pitchClassToMidi(root, 4) + INTERVAL_SEMITONES[interval];
  const note = midiToDisplayNote(midi, interval === '1' ? root : undefined);

  return {
    ...note,
    explanation,
    interval,
    isRoot: interval === '1',
  };
}
