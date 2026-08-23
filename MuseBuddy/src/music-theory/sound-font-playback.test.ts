import { describe, expect, it } from 'vitest';

import { createTrainingSession } from '@/contexts/training-session-test-fixture';
import type { ChordDisplay } from '@/music-theory/chord-display';
import type { PianoPitchClass } from '@schema/music-theory-schema';

import {
  buildChordPreviewSoundFontPlaybackConfiguration,
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
    const pattern = Array.from<null | 'h' | 's' | 'w'>({ length: 32 }).fill(null);
    pattern.splice(0, 4, 's', 'h', null, 'w');
    const configuration = buildRhythmSoundFontPlaybackConfiguration(pattern, 120);

    expect(configuration.bpm).toBe(120);
    expect(configuration.tracks.bass).toBeUndefined();
    expect(configuration.tracks.treble).toHaveLength(1);
    expect(configuration.tracks.treble[0]?.slice(0, 4)).toEqual([
      [{ midi: 45, velocity: 112 }],
      [{ midi: -50, velocity: null }],
      [{ midi: null, velocity: null }],
      [{ midi: 50, velocity: 74 }],
    ]);
  });

  it('uses canonical timeline normalization so orphan holds become groove rests', () => {
    const pattern = Array.from<null | 'h' | 's' | 'w'>({ length: 32 }).fill(null);
    pattern.splice(0, 5, 'h', 's', 'h', 'w', 'h');

    const configuration = buildRhythmSoundFontPlaybackConfiguration(pattern, 120);

    expect(configuration.tracks.treble[0]?.slice(0, 5)).toEqual([
      [{ midi: null, velocity: null }],
      [{ midi: 45, velocity: 112 }],
      [{ midi: -50, velocity: null }],
      [{ midi: 50, velocity: 74 }],
      [{ midi: -50, velocity: null }],
    ]);
  });
});

describe('buildPatternSoundFontPlaybackConfiguration', () => {
  it('copies all 32 slots into independent simultaneous staff tracks', () => {
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
    expect(configuration.tracks.treble).toHaveLength(8);
    expect(configuration.tracks.treble[0]).toHaveLength(32);
    expect(configuration.tracks.treble[0]?.slice(0, 4)).toEqual([
      [{ midi: 60, velocity: 40 }],
      [{ midi: null, velocity: null }],
      [{ midi: -50, velocity: null }],
      [{ midi: null, velocity: null }],
    ]);
    expect(configuration.tracks.bass?.[0]?.[0]).toEqual([{ midi: 48, velocity: 70 }]);
    expect(configuration.tracks.bass?.[0]?.[4]).toEqual([{ midi: 52, velocity: 90 }]);
  });
});

describe('buildChordPreviewSoundFontPlaybackConfiguration', () => {
  it('plays one chord as four even quarter-note hits with alternating velocities and a C2 root', () => {
    const configuration = buildChordPreviewSoundFontPlaybackConfiguration(
      chordDisplay('C', [60, 64, 67]),
      88,
    );

    expect(configuration.bpm).toBe(88);
    expect(configuration.tracks.treble).toHaveLength(1);

    const part = configuration.tracks.treble[0];
    expect(part).toHaveLength(32);

    const noteStep = (velocity: number) => [
      { midi: 60, velocity },
      { midi: 64, velocity },
      { midi: 67, velocity },
      { midi: 36, velocity },
    ];
    const holdStep = Array.from({ length: 4 }, () => ({ midi: -50, velocity: null }));

    expect(part?.[0]).toEqual(noteStep(96));
    expect(part?.[8]).toEqual(noteStep(65));
    expect(part?.[16]).toEqual(noteStep(96));
    expect(part?.[24]).toEqual(noteStep(65));

    [1, 7, 9, 15, 17, 23, 25, 31].forEach((stepIndex) => {
      expect(part?.[stepIndex]).toEqual(holdStep);
    });
  });
});
