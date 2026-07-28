import { z } from "zod";

import {
  chordDisplayTokenSchema,
  chordPitchSchema,
  chordToneSchema,
} from "./chord-profile-schema.ts";

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
