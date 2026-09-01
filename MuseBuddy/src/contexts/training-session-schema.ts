import { z } from 'zod';

import { chordPitchSchema, pianoPitchClassSchema } from '@schema/music-theory-schema';

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

export const chordToneImportanceSchema = z.enum(['essential', 'supporting', 'color', 'optional']);

export const chordToneSchema = z.object({
  degree: chordDegreeSchema,
  explanation: z.string().min(1),
  importance: chordToneImportanceSchema,
  pitch: chordPitchSchema,
  pitchClass: pianoPitchClassSchema,
});

export const rhythmStepSchema = z.union([z.literal('s'), z.literal('w'), z.literal('h'), z.null()]);

const arrangementCellSchema = z.number().int().nullable();
const velocityCellSchema = z.number().int().min(0).max(127).nullable();
const arrangementSlotSchema = z.array(arrangementCellSchema).min(1);
const velocitySlotSchema = z.array(velocityCellSchema).min(1);

export const patternStaveSchema = z
  .object({
    arrangement: z.array(arrangementSlotSchema).length(32),
    velocity: z.array(velocitySlotSchema).length(32),
  })
  .superRefine((stave, context) => {
    stave.arrangement.forEach((slot, slotIndex) => {
      const velocitySlot = stave.velocity[slotIndex];
      if (!velocitySlot || slot.length !== velocitySlot.length) {
        context.addIssue({
          code: 'custom',
          message: 'Arrangement and velocity slots must have matching lanes.',
          path: ['velocity', slotIndex],
        });
        return;
      }

      slot.forEach((midi, laneIndex) => {
        const velocity = velocitySlot[laneIndex];
        if (midi === null || midi === -50) {
          if (velocity !== null) {
            context.addIssue({
              code: 'custom',
              message: 'Rest and hold cells must not carry velocity.',
              path: ['velocity', slotIndex, laneIndex],
            });
          }
          return;
        }

        if (midi <= 0 || midi > 127 || velocity === null || velocity === undefined) {
          context.addIssue({
            code: 'custom',
            message: 'Attack cells require valid MIDI and velocity.',
            path: ['arrangement', slotIndex, laneIndex],
          });
        }
      });
    });
  });

export const patternBeatSchema = z.object({
  bar_index: z.number().int().nonnegative(),
  beat_index: z.union([z.literal(0), z.literal(1)]),
  chord: z.string().min(1),
  id: z.string().min(1),
  pattern_id: z.string().min(1),
  staves: z.object({
    bass: patternStaveSchema,
    treble: patternStaveSchema,
  }),
});

const scoreEventSchema = z.object({
  accidentals: z.array(z.string().nullable()).min(1),
  dots: z.number().int().min(0).max(3),
  duration: z.enum(['w', 'h', 'q', '8', '16', '32', '64']),
  id: z.string().min(1),
  keys: z.array(z.string().min(1)).min(1),
  stem_direction: z.enum(['up', 'down']).nullable(),
  type: z.enum(['note', 'rest']),
});

const scoreVoiceSchema = z.object({
  events: z.array(scoreEventSchema).min(1),
  id: z.string().min(1),
});

const scoreStaveSchema = z.object({
  clef: z.enum(['treble', 'bass']),
  voices: z.array(scoreVoiceSchema).min(1),
});

const scoreBeamSchema = z.object({
  event_ids: z.array(z.string().min(1)).min(2),
  staff: z.enum(['treble', 'bass']),
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

export const trainingSessionScoreSchema = z.object({
  format: z.literal('vexflow'),
  format_version: z.literal(1),
  key_signature: z.string().min(1),
  measures: z.array(scoreMeasureSchema).min(1).max(4),
  ties: z.array(scoreTieSchema),
  time_signature: z.literal('4/4'),
});

export const rhythmSchema = z.object({
  averageAttackVelocity: z.number().min(0).max(127).nullable(),
  pattern: z.array(rhythmStepSchema).min(32).max(256),
});

export const trainingSessionChordSchema = z.object({
  displayTokens: z.array(chordDisplayTokenSchema).min(1),
  idName: z.string().min(1),
  normalizedSymbol: z.string().min(1),
  root: chordPitchSchema,
  tones: z.array(chordToneSchema).min(1),
});

function progressionSchema(mode: 'major' | 'minor') {
  return z.object({
    active_circle_of_fifths_indices: z.array(z.number().int().min(0).max(11)),
    display: z.array(z.string().min(1)).min(1),
    mode: z.literal(mode),
    tonic: chordPitchSchema,
    tonic_circle_of_fifths_index: z.number().int().min(0).max(11),
  });
}

const notesDocumentSchema = z.object({
  beats: z.array(patternBeatSchema).min(2).max(8),
  pattern: z.object({
    id: z.string().min(1),
    key_signature_display: z.string().min(1),
    progression_in_major_scale: progressionSchema('major'),
    progression_in_minor_scale: progressionSchema('minor'),
    time_signature: z.literal('4/4'),
    title: z.string().min(1).nullable(),
  }),
});

export const trainingSessionSchema = z
  .object({
    chords: z.array(trainingSessionChordSchema).min(1).max(8),
    notes: notesDocumentSchema,
    score: trainingSessionScoreSchema,
    version: z.literal(1),
  })
  .superRefine((session, context) => {
    const { beats, pattern } = session.notes;
    if (beats.length !== session.score.measures.length * 2) {
      context.addIssue({
        code: 'custom',
        message: 'Score measures must each have two note rows.',
        path: ['notes', 'beats'],
      });
    }

    beats.forEach((beat, index) => {
      if (
        beat.pattern_id !== pattern.id ||
        beat.bar_index !== Math.floor(index / 2) ||
        beat.beat_index !== index % 2
      ) {
        context.addIssue({
          code: 'custom',
          message: 'Pattern beats must be contiguous and ordered.',
          path: ['notes', 'beats', index],
        });
      }
    });

    session.score.measures.forEach((measure, index) => {
      if (measure.index !== index) {
        context.addIssue({
          code: 'custom',
          message: 'Score measures must be contiguous and ordered.',
          path: ['score', 'measures', index, 'index'],
        });
      }
    });

    const firstChordOrder = [...new Set(beats.map((beat) => beat.chord))];
    if (
      firstChordOrder.length !== session.chords.length ||
      firstChordOrder.some((chordId, index) => session.chords[index]?.idName !== chordId)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Chord profiles must follow first appearance in the pattern.',
        path: ['chords'],
      });
    }
  });

export type TrainingSession = z.infer<typeof trainingSessionSchema>;
export type TrainingSessionChord = TrainingSession['chords'][number];
export type TrainingSessionPatternBeat = TrainingSession['notes']['beats'][number];
export type TrainingSessionPatternStave = TrainingSessionPatternBeat['staves']['treble'];
export type TrainingSessionScore = TrainingSession['score'];
export type TrainingSessionRhythm = z.infer<typeof rhythmSchema>;
export type TrainingSessionRhythmPattern = TrainingSessionRhythm['pattern'];
export type PatternStaffName = keyof TrainingSessionPatternBeat['staves'];
export type ChordDisplayTokenValue = z.infer<typeof chordDisplayTokenSchema>;
export type ChordDegree = z.infer<typeof chordDegreeSchema>;
export type ChordTone = z.infer<typeof chordToneSchema>;
export type ChordToneImportance = z.infer<typeof chordToneImportanceSchema>;
