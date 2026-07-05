import { z } from 'zod';

const displayTokenTypeSchema = z.enum([
  'root',
  'quality',
  'extension',
  'alteration',
  'addition',
  'omission',
  'bass',
  'separator',
]);

export const chordDisplayTokenSchema = z.object({
  type: displayTokenTypeSchema,
  value: z.string(),
});

export const chordDegreeSchema = z.enum([
  '#11',
  '#2',
  '#4',
  '#5',
  '#9',
  '1',
  '11',
  '13',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '9',
  'b2',
  'b3',
  'b5',
  'b6',
  'b7',
  'b9',
  'b13',
  'bb7',
]);

export const rhythmStepSchema = z.union([z.literal('s'), z.literal('w'), z.literal('h'), z.null()]);

export const trainingSessionSchema = z.object({
  chord: z.object({
    displayTokens: z.array(chordDisplayTokenSchema).min(1),
    qualityBaseFormula: z.array(chordDegreeSchema).min(1),
    root: z.string().min(1),
  }),
  rhythm: z.object({
    averageAttackVelocity: z.number().min(0).max(127).nullable(),
    pattern: z.array(rhythmStepSchema).length(32),
  }),
});

export type TrainingSession = z.infer<typeof trainingSessionSchema>;
export type TrainingSessionChord = TrainingSession['chord'];
export type TrainingSessionRhythmPattern = TrainingSession['rhythm']['pattern'];
export type ChordDisplayTokenValue = z.infer<typeof chordDisplayTokenSchema>;
export type ChordDegree = z.infer<typeof chordDegreeSchema>;
