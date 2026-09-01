import type { TrainingSession, TrainingSessionPatternStave } from './training-session-schema';

export function createEmptyPatternStave(): TrainingSessionPatternStave {
  return {
    arrangement: Array.from({ length: 32 }, () => [null]),
    velocity: Array.from({ length: 32 }, () => [null]),
  };
}

export function createTrainingSession(measureCount = 1): TrainingSession {
  const patternId = 'piano-pattern/test';
  return {
    chords: [
      {
        displayTokens: [{ type: 'root', value: 'C' }],
        idName: 'c-major',
        normalizedSymbol: 'C',
        root: 'C',
        tones: [
          {
            degree: '1',
            explanation: 'is the root.',
            importance: 'essential',
            pitch: 'C',
            pitchClass: 0,
          },
          {
            degree: '3',
            explanation: 'is the third.',
            importance: 'essential',
            pitch: 'E',
            pitchClass: 4,
          },
          {
            degree: '5',
            explanation: 'is the fifth.',
            importance: 'supporting',
            pitch: 'G',
            pitchClass: 7,
          },
        ],
      },
    ],
    notes: {
      beats: Array.from({ length: measureCount * 2 }, (_, index) => ({
        bar_index: Math.floor(index / 2),
        beat_index: (index % 2) as 0 | 1,
        chord: 'c-major',
        id: `beat-${index}`,
        pattern_id: patternId,
        staves: {
          bass: createEmptyPatternStave(),
          treble: createEmptyPatternStave(),
        },
      })),
      pattern: {
        id: patternId,
        key_signature_display: 'C major / A minor',
        progression_in_major_scale: {
          active_circle_of_fifths_indices: [0],
          display: ['I'],
          mode: 'major',
          tonic: 'C',
          tonic_circle_of_fifths_index: 0,
        },
        progression_in_minor_scale: {
          active_circle_of_fifths_indices: [0],
          display: ['III'],
          mode: 'minor',
          tonic: 'A',
          tonic_circle_of_fifths_index: 3,
        },
        time_signature: '4/4',
        title: null,
      },
    },
    score: {
      format: 'vexflow',
      format_version: 1,
      key_signature: 'C',
      measures: Array.from({ length: measureCount }, (_, index) => ({
        beams: [],
        index,
        staves: {
          bass: {
            clef: 'bass',
            voices: [
              {
                events: [
                  {
                    accidentals: [null],
                    dots: 0,
                    duration: 'w',
                    id: `m${index}-bass-v1-e0`,
                    keys: ['d/3'],
                    stem_direction: null,
                    type: 'rest',
                  },
                ],
                id: '1',
              },
            ],
          },
          treble: {
            clef: 'treble',
            voices: [
              {
                events: [
                  {
                    accidentals: [null],
                    dots: 0,
                    duration: 'w',
                    id: `m${index}-treble-v1-e0`,
                    keys: ['b/4'],
                    stem_direction: null,
                    type: 'rest',
                  },
                ],
                id: '1',
              },
            ],
          },
        },
      })),
      ties: [],
      time_signature: '4/4',
    },
    version: 1,
  };
}
