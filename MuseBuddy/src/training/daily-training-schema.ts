import { z } from 'zod';

import {
  chordIntervalSchema,
  chordQualitySchema,
  chordRootSchema,
  type ChordInterval,
  type ChordQuality,
  type ChordRoot,
} from '@schema/music-theory-schema';

const rhythmStepSchema = z.union([z.literal('s'), z.literal('w'), z.null()]);
const rhythmPatternSchema = z
  .array(rhythmStepSchema)
  .refine((pattern) => pattern.length === 16 || pattern.length === 32, {
    message: 'Rhythm pattern must contain exactly 16 or 32 steps.',
  });

export const chordLearningChordSchema = z.object({
  add: z.array(chordIntervalSchema).optional(),
  alterations: z.array(chordIntervalSchema).optional(),
  bass: chordRootSchema.optional(),
  explanation: z.string().optional(),
  friendlyName: z.string().optional(),
  intervals: z.array(chordIntervalSchema).min(1),
  omit: z.array(chordIntervalSchema).optional(),
  quality: chordQualitySchema,
  root: chordRootSchema,
});

export const dailyTrainingSchema = z.object({
  chordLearning: z.object({
    chord: chordLearningChordSchema,
  }),
  rhythmTraining: z.object({
    pattern: rhythmPatternSchema,
  }),
});

export type DailyTrainingConfig = z.infer<typeof dailyTrainingSchema>;
export type ChordLearningChord = z.infer<typeof chordLearningChordSchema>;
export type DailyTrainingRhythmPattern = z.infer<typeof rhythmPatternSchema>;
export type { ChordInterval, ChordQuality, ChordRoot };
export { chordIntervalSchema, chordQualitySchema, chordRootSchema };
