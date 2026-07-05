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

export const chordToneSchema = z.object({
  explanation: z.string().min(1),
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

export const keyArrangementCellSchema = z
  .object({
    midi: z.number().int().nullable(),
    velocity: z.number().int().min(0).max(127).nullable(),
  })
  .superRefine((cell, context) => {
    if (cell.midi === null || cell.midi === -50) {
      if (cell.velocity !== null) {
        context.addIssue({
          code: 'custom',
          message: 'Rest and hold cells must not carry velocity.',
          path: ['velocity'],
        });
      }

      return;
    }

    if (cell.midi <= 0) {
      context.addIssue({
        code: 'custom',
        message: 'Arrangement MIDI must be a positive pitch, -50 hold, or null rest.',
        path: ['midi'],
      });
    }

    if (cell.velocity === null) {
      context.addIssue({
        code: 'custom',
        message: 'Attack cells must carry velocity.',
        path: ['velocity'],
      });
    }
  });

export const keyArrangementRowSchema = z.object({
  beatIndex: z.number().int().nonnegative(),
  slots: z.array(z.array(keyArrangementCellSchema).min(1)).length(32),
});

export const keyArrangementSchema = z.object({
  rows: z.array(keyArrangementRowSchema).length(2),
});

export const rhythmSchema = z.object({
  averageAttackVelocity: z.number().min(0).max(127).nullable(),
  pattern: z.array(rhythmStepSchema).length(32),
});

export const trainingSessionSchema = z.object({
  chords: z
    .array(
      z.object({
        displayTokens: z.array(chordDisplayTokenSchema).min(1),
        idName: z.string().min(1),
        normalizedSymbol: z.string().min(1),
        qualityBaseFormula: z.array(chordDegreeSchema).min(1),
        root: z.string().min(1),
        tones: z.array(chordToneSchema).min(1),
      }),
    )
    .min(1),
  keyArrangement: keyArrangementSchema,
});

export type TrainingSession = z.infer<typeof trainingSessionSchema>;
export type TrainingSessionChord = TrainingSession['chords'][number];
export type TrainingSessionKeyArrangement = TrainingSession['keyArrangement'];
export type TrainingSessionRhythm = z.infer<typeof rhythmSchema>;
export type TrainingSessionRhythmPattern = TrainingSessionRhythm['pattern'];
export type ChordDisplayTokenValue = z.infer<typeof chordDisplayTokenSchema>;
export type ChordDegree = z.infer<typeof chordDegreeSchema>;
export type ChordTone = z.infer<typeof chordToneSchema>;
