import { describe, expect, it } from 'vitest';

import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';
import type { ChordDisplay } from '@/music-theory/chord-display';

import {
  buildChordPreviewSoundFontPlaybackConfiguration,
  buildChordSummarySoundFontPlaybackConfiguration,
  buildRhythmSoundFontPlaybackConfiguration,
  buildSoundFontPlaybackConfiguration,
} from './sound-font-playback';

type SourceSlot = TrainingSessionKeyArrangement['rows'][number]['slots'][number];
type SourceCell = SourceSlot[number];

function emptyCell(): SourceCell {
  return { midi: null, velocity: null };
}

function emptySlots(): SourceSlot[] {
  return Array.from({ length: 32 }, () => [emptyCell()]);
}

function keyArrangement(slots: Record<number, SourceSlot>): TrainingSessionKeyArrangement {
  const rowSlots = emptySlots();

  Object.entries(slots).forEach(([slotIndex, slot]) => {
    rowSlots[Number(slotIndex)] = slot;
  });

  return {
    rows: [
      {
        beatIndex: 0,
        slots: rowSlots,
      },
      {
        beatIndex: 1,
        slots: emptySlots(),
      },
    ],
  };
}

function chordDisplay(idName: string, midis: readonly number[]): ChordDisplay {
  return {
    commonNotations: [idName],
    friendlyName: idName,
    idName,
    normalizedSymbol: idName,
    notes: midis.map((midi, index) => ({
      accidental: '',
      interval: index === 0 ? '1' : '3',
      isRoot: index === 0,
      keyboardKey: 'C',
      letter: 'C',
      midi,
      octave: 4,
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
      tracks: [
        {
          instrument: 'percussion',
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
        },
      ],
    });
  });
});

describe('buildSoundFontPlaybackConfiguration', () => {
  it('uses selected BPM and preserves raw arrangement MIDI, hold, and velocity values', () => {
    const configuration = buildSoundFontPlaybackConfiguration(
      keyArrangement({
        0: [{ midi: 60, velocity: 40 }],
        2: [{ midi: -50, velocity: null }],
        4: [{ midi: 64, velocity: 90 }],
      }),
      60,
    );

    expect(configuration.bpm).toBe(60);
    expect(configuration.tracks).toHaveLength(1);
    expect(configuration.tracks[0]?.instrument).toBe('piano');
    expect(configuration.tracks[0]?.parts).toHaveLength(2);
    expect(configuration.tracks[0]?.parts[0]?.slice(0, 4)).toEqual([
      [{ midi: 60, velocity: 40 }],
      [{ midi: -50, velocity: null }],
      [{ midi: 64, velocity: 90 }],
      [{ midi: null, velocity: null }],
    ]);
  });
});

describe('buildChordPreviewSoundFontPlaybackConfiguration', () => {
  it('plays one chord as four even quarter-note hits with alternating strong/weak velocities and a sub-octave root', () => {
    const configuration = buildChordPreviewSoundFontPlaybackConfiguration(
      chordDisplay('C', [60, 64, 67]),
      88,
    );

    expect(configuration.bpm).toBe(88);
    expect(configuration.tracks).toHaveLength(1);
    expect(configuration.tracks[0]?.instrument).toBe('piano');
    expect(configuration.tracks[0]?.parts).toHaveLength(1);

    const part = configuration.tracks[0]?.parts[0];
    expect(part).toHaveLength(16);

    const noteStep = (velocity: number) => [
      { midi: 60, velocity },
      { midi: 64, velocity },
      { midi: 67, velocity },
      { midi: 48, velocity },
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
    expect(configuration.tracks).toHaveLength(1);
    expect(configuration.tracks[0]?.instrument).toBe('piano');
    expect(configuration.tracks[0]?.parts).toHaveLength(2);
    expect(configuration.tracks[0]?.parts[0]?.filter((step) => step[0]?.midi === 60)).toHaveLength(
      4,
    );
    expect(configuration.tracks[0]?.parts[1]?.filter((step) => step[0]?.midi === 65)).toHaveLength(
      4,
    );
    expect(configuration.tracks[0]?.parts[0]?.[0]).toEqual([
      { midi: 60, velocity: 96 },
      { midi: 64, velocity: 96 },
      { midi: 67, velocity: 96 },
    ]);
    expect(configuration.tracks[0]?.parts[1]?.[12]).toEqual([
      { midi: 65, velocity: 96 },
      { midi: 69, velocity: 96 },
      { midi: 72, velocity: 96 },
    ]);
  });
});
