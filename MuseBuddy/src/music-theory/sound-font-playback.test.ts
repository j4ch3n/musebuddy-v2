import { describe, expect, it } from 'vitest';

import { createTrainingSession } from '@/contexts/training-session-test-fixture';
import type { ChordDisplay } from '@/music-theory/chord-display';
import type { PianoPitchClass } from '@schema/music-theory-schema';

import {
  buildChordPreviewSoundFontPlaybackConfiguration,
  buildChordSummarySoundFontPlaybackConfiguration,
  buildPatternSoundFontPlaybackConfiguration,
  buildRhythmSoundFontPlaybackConfiguration,
} from './sound-font-playback';

function chordDisplay(idName: string, midis: readonly number[]): ChordDisplay {
  return {
    commonNotations: [idName],
    friendlyName: idName,
    idName,
    normalizedSymbol: idName,
    notes: midis.map((midi, index) => ({
      accidental: '',
      degree: index === 0 ? ('1' as const) : ('3' as const),
      explanation: 'test explanation',
      importance: 'essential',
      isRoot: index === 0,
      letter: 'C',
      midi,
      octave: 4,
      pitchClass: (midi % 12) as PianoPitchClass,
      text: 'C',
      vexflowKey: 'c/4',
    })),
    symbol: idName,
    tokens: [{ text: idName, type: 'root' }],
  };
}

describe('buildRhythmSoundFontPlaybackConfiguration', () => {
  it('maps rhythm strong and weak steps to groove brush percussion hits', () => {
    const configuration = buildRhythmSoundFontPlaybackConfiguration(
      ['s', 'h', null, 'w', null, null, null, null, null, null, null, null, null, null, null, null],
      120,
    );

    expect(configuration).toEqual({
      bpm: 120,
      parts: [
        [
          [{ midi: 45, velocity: 112 }],
          [{ midi: -50, velocity: null }],
          [{ midi: null, velocity: null }],
          [{ midi: 50, velocity: 74 }],
          [{ midi: null, velocity: null }],
          [{ midi: null, velocity: null }],
          [{ midi: null, velocity: null }],
          [{ midi: null, velocity: null }],
          [{ midi: null, velocity: null }],
          [{ midi: null, velocity: null }],
          [{ midi: null, velocity: null }],
          [{ midi: null, velocity: null }],
          [{ midi: null, velocity: null }],
          [{ midi: null, velocity: null }],
          [{ midi: null, velocity: null }],
          [{ midi: null, velocity: null }],
        ],
      ],
    });
  });
});

describe('buildPatternSoundFontPlaybackConfiguration', () => {
  it('plays every beat and combines matching treble and bass timing', () => {
    const session = createTrainingSession(4);
    const firstBeat = session.notes.beats[0];
    if (!firstBeat) {
      throw new Error('Fixture is missing its first beat.');
    }
    firstBeat.staves.treble.arrangement[0] = [60];
    firstBeat.staves.treble.velocity[0] = [40];
    firstBeat.staves.treble.arrangement[2] = [-50];
    firstBeat.staves.bass.arrangement[0] = [48];
    firstBeat.staves.bass.velocity[0] = [70];
    firstBeat.staves.bass.arrangement[4] = [52];
    firstBeat.staves.bass.velocity[4] = [90];

    const configuration = buildPatternSoundFontPlaybackConfiguration(session.notes.beats, 60);

    expect(configuration.bpm).toBe(60);
    expect(configuration.parts).toHaveLength(8);
    expect(configuration.parts[0]?.slice(0, 4)).toEqual([
      [
        { midi: 60, velocity: 40 },
        { midi: 48, velocity: 70 },
      ],
      [
        { midi: -50, velocity: null },
        { midi: null, velocity: null },
      ],
      [
        { midi: null, velocity: null },
        { midi: 52, velocity: 90 },
      ],
      [
        { midi: null, velocity: null },
        { midi: null, velocity: null },
      ],
    ]);
  });
});

describe('buildChordPreviewSoundFontPlaybackConfiguration', () => {
  it('plays one chord as four even quarter-note hits with alternating velocities and a C2 root', () => {
    const configuration = buildChordPreviewSoundFontPlaybackConfiguration(
      chordDisplay('C', [60, 64, 67]),
      88,
    );

    expect(configuration.bpm).toBe(88);
    expect(configuration.parts).toHaveLength(1);

    const part = configuration.parts[0];
    expect(part).toHaveLength(16);

    const noteStep = (velocity: number) => [
      { midi: 60, velocity },
      { midi: 64, velocity },
      { midi: 67, velocity },
      { midi: 36, velocity },
    ];
    const holdStep = Array.from({ length: 4 }, () => ({ midi: -50, velocity: null }));

    expect(part?.[0]).toEqual(noteStep(96));
    expect(part?.[4]).toEqual(noteStep(65));
    expect(part?.[8]).toEqual(noteStep(96));
    expect(part?.[12]).toEqual(noteStep(65));

    [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15].forEach((stepIndex) => {
      expect(part?.[stepIndex]).toEqual(holdStep);
    });
  });
});

describe('buildChordSummarySoundFontPlaybackConfiguration', () => {
  it('plays each chord as four quarter-note hits before moving to the next chord', () => {
    const configuration = buildChordSummarySoundFontPlaybackConfiguration(
      [chordDisplay('C', [60, 64, 67]), chordDisplay('F', [65, 69, 72])],
      104,
    );

    expect(configuration.bpm).toBe(104);
    expect(configuration.parts).toHaveLength(2);
    expect(configuration.parts[0]?.filter((step) => step[0]?.midi === 60)).toHaveLength(4);
    expect(configuration.parts[1]?.filter((step) => step[0]?.midi === 65)).toHaveLength(4);
    expect(configuration.parts[0]?.[0]).toEqual([
      { midi: 60, velocity: 96 },
      { midi: 64, velocity: 96 },
      { midi: 67, velocity: 96 },
      { midi: 36, velocity: 96 },
    ]);
    expect(configuration.parts[1]?.[12]).toEqual([
      { midi: 65, velocity: 96 },
      { midi: 69, velocity: 96 },
      { midi: 72, velocity: 96 },
      { midi: 41, velocity: 96 },
    ]);
  });
});
