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
