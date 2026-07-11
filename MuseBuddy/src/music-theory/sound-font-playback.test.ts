import { describe, expect, it } from 'vitest';

import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';

import {
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

describe('buildRhythmSoundFontPlaybackConfiguration', () => {
  it('maps rhythm strong and weak steps to percussion hits with different velocities', () => {
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
              [{ midi: 67, velocity: 112 }],
              [{ midi: -50, velocity: null }],
              [{ midi: null, velocity: null }],
              [{ midi: 60, velocity: 74 }],
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
