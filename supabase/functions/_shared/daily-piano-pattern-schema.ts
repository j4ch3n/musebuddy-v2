import { z } from "zod";

import {
  chordDisplayTokenSchema,
  chordPitchSchema,
  chordToneSchema,
} from "./chord-profile-schema.ts";

const arrangementSlotSchema = z.array(z.number().int().nullable()).min(1);
const velocitySlotSchema = z.array(
  z.number().int().min(0).max(127).nullable(),
).min(1);

function progressionSchema(mode: "major" | "minor") {
  return z.object({
    active_circle_of_fifths_indices: z.array(z.number().int().min(0).max(11)),
    display: z.array(z.string().min(1)).min(1),
    mode: z.literal(mode),
    tonic: z.string().min(1),
    tonic_circle_of_fifths_index: z.number().int().min(0).max(11),
  });
}

export const pianoPatternRowSchema = z.object({
  id: z.string().min(1),
  key_signature_display: z.string().min(1),
  name: z.string().min(1).nullable(),
  progression_in_major_scale: progressionSchema("major"),
  progression_in_minor_scale: progressionSchema("minor"),
  time_signature: z.literal("4/4"),
});

export const pianoPatternNoteRowSchema = z.object({
  bar_index: z.number().int().nonnegative(),
  bass_arrangement: z.array(arrangementSlotSchema).length(32),
  bass_velocity: z.array(velocitySlotSchema).length(32),
  beat_index: z.union([z.literal(0), z.literal(1)]),
  chord: z.string().min(1),
  id: z.string().min(1),
  pattern_id: z.string().min(1),
  treble_arrangement: z.array(arrangementSlotSchema).length(32),
  treble_velocity: z.array(velocitySlotSchema).length(32),
});

const scoreEventSchema = z.object({
  accidentals: z.array(z.string().nullable()).min(1),
  dots: z.number().int().min(0).max(3),
  duration: z.enum(["w", "h", "q", "8", "16", "32", "64"]),
  id: z.string().min(1),
  keys: z.array(z.string().min(1)).min(1),
  stem_direction: z.enum(["up", "down"]).nullable(),
  type: z.enum(["note", "rest"]),
});

const scoreVoiceSchema = z.object({
  events: z.array(scoreEventSchema).min(1),
  id: z.string().min(1),
});

const scoreStaveSchema = z.object({
  clef: z.enum(["treble", "bass"]),
  voices: z.array(scoreVoiceSchema).min(1),
});

const scoreBeamSchema = z.object({
  event_ids: z.array(z.string().min(1)).min(2),
  staff: z.enum(["treble", "bass"]),
  voice_id: z.string().min(1),
});

const scoreMeasureSchema = z.object({
  beams: z.array(scoreBeamSchema),
  index: z.number().int().nonnegative(),
  staves: z.object({
    bass: scoreStaveSchema,
    treble: scoreStaveSchema,
  }),
});

const scoreTieEndpointSchema = z.object({
  event_id: z.string().min(1),
  key_index: z.number().int().nonnegative(),
});

const scoreTieSchema = z.object({
  from: scoreTieEndpointSchema,
  to: scoreTieEndpointSchema,
});

export const pianoPatternScoreRowSchema = z.object({
  format: z.literal("vexflow"),
  format_version: z.literal(1),
  key_signature: z.string().min(1),
  measures: z.array(scoreMeasureSchema).min(1).max(4),
  pattern_id: z.string().min(1),
  ties: z.array(scoreTieSchema),
  time_signature: z.literal("4/4"),
});

export const chordProfileRowSchema = z.object({
  displayTokens: z.array(chordDisplayTokenSchema).min(1),
  id: z.string().min(1),
  normalizedSymbol: z.string().min(1),
  root: chordPitchSchema,
  tones: z.array(chordToneSchema).min(1),
});

export type PianoPatternRow = z.infer<typeof pianoPatternRowSchema>;
export type PianoPatternNoteRow = z.infer<typeof pianoPatternNoteRowSchema>;
export type PianoPatternScoreRow = z.infer<typeof pianoPatternScoreRowSchema>;
export type ChordProfileRow = z.infer<typeof chordProfileRowSchema>;
