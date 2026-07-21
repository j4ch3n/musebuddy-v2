import { z } from "zod";

export const chordDisplayTokenSchema = z.object({
  type: z.enum([
    "root",
    "quality",
    "extension",
    "alteration",
    "addition",
    "omission",
    "bass",
    "separator",
  ]),
  value: z.string(),
});

export const chordDegreeSchema = z.enum([
  "#11",
  "#2",
  "#4",
  "#5",
  "#9",
  "1",
  "11",
  "13",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "9",
  "b2",
  "b3",
  "b5",
  "b6",
  "b7",
  "b9",
  "b13",
  "bb7",
]);

export const chordPitchSchema = z.string().regex(/^[A-G](?:#{1,2}|b{1,2})?$/);

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

export const chordToneSchema = z.object({
  degree: chordDegreeSchema,
  explanation: z.string().min(1),
  importance: z.enum(["essential", "supporting", "color", "optional"]),
  pitch: chordPitchSchema,
  pitchClass: pianoPitchClassSchema,
});

export const dbArrangementRowSchema = z.object({
  arrangement: z.array(z.array(z.number().int().nullable())).length(32),
  bar_index: z.number().int().nonnegative(),
  beat_index: z.number().int().nonnegative(),
  chord: z.string().min(1),
  chord_display_tokens: z.array(chordDisplayTokenSchema).min(1),
  chord_normalized_symbol: z.string().min(1),
  chord_root: chordPitchSchema,
  chord_tones: z.array(chordToneSchema).min(1),
  song_id: z.string().min(1),
  velocity: z.array(z.array(z.number().int().min(0).max(127).nullable()))
    .length(32),
});

export const dbArrangementRowsSchema = z.array(dbArrangementRowSchema).length(
  2,
);

export type DbArrangementRow = z.infer<typeof dbArrangementRowSchema>;
export type RhythmStep = "s" | "w" | "h" | null;
