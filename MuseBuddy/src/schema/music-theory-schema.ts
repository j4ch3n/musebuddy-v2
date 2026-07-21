import { z } from 'zod';

export const musicNoteLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
export const musicNoteLetterSchema = z.enum(musicNoteLetters);

export const musicAccidentals = ['', '#', 'b'] as const;
export const musicAccidentalSchema = z.enum(musicAccidentals);

export const chordPitchSchema = z.string().regex(/^[A-G](?:#{1,2}|b{1,2})?$/);

export const pianoPitchClasses = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
export const pianoPitchClassSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
  z.literal(10),
  z.literal(11),
]);

export const chordIntervalSchema = z.enum([
  '1',
  'b2',
  '2',
  '#2',
  'b3',
  '3',
  '4',
  '#4',
  'b5',
  '5',
  '#5',
  'b6',
  '6',
  'b7',
  '7',
  '9',
  '11',
  '13',
]);

export const chordQualitySchema = z.enum(['major', 'minor', 'dominant7', 'major7', 'minor7']);

export const chordRootSchema = z.object({
  accidental: musicAccidentalSchema,
  letter: musicNoteLetterSchema,
});

export type MusicNoteLetter = z.infer<typeof musicNoteLetterSchema>;
export type MusicAccidental = z.infer<typeof musicAccidentalSchema>;
export type PianoPitchClass = z.infer<typeof pianoPitchClassSchema>;
export type ChordInterval = z.infer<typeof chordIntervalSchema>;
export type ChordQuality = z.infer<typeof chordQualitySchema>;
export type ChordRoot = z.infer<typeof chordRootSchema>;

export const naturalNoteSemitones = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
} satisfies Record<MusicNoteLetter, number>;

export const diatonicNoteLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

export const chordIntervalMetadata = {
  '1': { degree: 1, semitones: 0 },
  b2: { degree: 2, semitones: 1 },
  '2': { degree: 2, semitones: 2 },
  '#2': { degree: 2, semitones: 3 },
  b3: { degree: 3, semitones: 3 },
  '3': { degree: 3, semitones: 4 },
  '4': { degree: 4, semitones: 5 },
  '#4': { degree: 4, semitones: 6 },
  b5: { degree: 5, semitones: 6 },
  '5': { degree: 5, semitones: 7 },
  '#5': { degree: 5, semitones: 8 },
  b6: { degree: 6, semitones: 8 },
  '6': { degree: 6, semitones: 9 },
  b7: { degree: 7, semitones: 10 },
  '7': { degree: 7, semitones: 11 },
  '9': { degree: 2, semitones: 14 },
  '11': { degree: 4, semitones: 17 },
  '13': { degree: 6, semitones: 21 },
} satisfies Record<ChordInterval, { degree: number; semitones: number }>;
