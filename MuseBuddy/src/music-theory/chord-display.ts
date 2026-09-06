import type {
  ChordDegree,
  ChordTeachingRole,
  ChordVoicingRole,
} from '@/contexts/training-session-schema';

import { midiToDisplayNote, type MusicDisplayNote } from './midi-note';
import type { PianoPitchClass } from '@schema/music-theory-schema';

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
  teachingRole?: ChordTeachingRole | null;
  type: ChordDisplayTokenType;
};

export type ChordDisplayNote = MusicDisplayNote & {
  degree: ChordDegree;
  /** @deprecated Chord-learning copy is derived from teachingRole. */
  explanation?: string;
  /** @deprecated Chord-learning color is derived from teachingRole. */
  importance?: 'essential' | 'supporting' | 'color' | 'optional';
  isBass?: boolean;
  isRoot: boolean;
  teachingRole?: ChordTeachingRole;
  voicingRole?: ChordVoicingRole;
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

type ChordDisplayInputTone = {
  degree: ChordDegree;
  isBass?: boolean;
  pitch: string;
  pitchClass: number;
  teachingRole?: ChordTeachingRole;
  voicingRole?: ChordVoicingRole;
};

type ChordDisplayInput = {
  displayTokens: readonly {
    teachingRole?: ChordTeachingRole | null;
    type: ChordDisplayTokenType;
    value: string;
  }[];
  idName: string;
  normalizedSymbol: string;
  root: string;
  tones: readonly ChordDisplayInputTone[];
};

export function buildChordDisplay(chord: ChordDisplayInput): ChordDisplay {
  const tokens = chord.displayTokens.map((token) => ({
    text: token.value,
    teachingRole: token.teachingRole ?? null,
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

function buildChordNotes(chord: ChordDisplayInput) {
  const soundingTones = chord.tones.filter((tone) => tone.voicingRole !== 'omitted');
  const foundBassIndex = soundingTones.findIndex((tone) => tone.isBass);
  const bassIndex = foundBassIndex < 0 ? 0 : foundBassIndex;
  const orderedTones = [...soundingTones.slice(bassIndex), ...soundingTones.slice(0, bassIndex)];
  let octaveOffset = 0;

  return orderedTones.map((tone, index) => {
    if (index > 0 && tone.pitchClass < orderedTones[index - 1]!.pitchClass) {
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

function buildChordNote(root: string, midi: number, tone: ChordDisplayInputTone): ChordDisplayNote {
  const note = midiToDisplayNote(midi, tone.pitch);

  return {
    ...note,
    degree: tone.degree,
    isBass: tone.isBass ?? false,
    isRoot: tone.pitch === root,
    pitchClass: tone.pitchClass as PianoPitchClass,
    teachingRole: tone.teachingRole ?? teachingRoleForDegree(tone.degree),
    voicingRole: tone.voicingRole ?? 'required',
  };
}

function teachingRoleForDegree(degree: ChordDegree): ChordTeachingRole {
  if (degree === '1') return 'anchor';
  if (degree === '3' || degree === 'b3' || degree === '2' || degree === '4') return 'quality';
  if (degree === '7' || degree === 'b7' || degree === 'bb7') return 'guide';
  if (degree === '5') return 'voicing';
  return 'color';
}
