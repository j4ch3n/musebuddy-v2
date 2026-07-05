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

export const chordToneSchema = z.object({
  explanation: z.string().min(1),
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

export const dbArrangementRowSchema = z.object({
  arrangement: z.array(z.array(z.number().int().nullable())).length(32),
  bar_index: z.number().int().nonnegative(),
  beat_index: z.number().int().nonnegative(),
  chord: z.string().min(1),
  chord_display_tokens: z.array(chordDisplayTokenSchema).min(1),
  chord_normalized_symbol: z.string().min(1),
  chord_quality_base_formula: z.array(chordDegreeSchema).min(1),
  chord_root: z.string().min(1),
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
