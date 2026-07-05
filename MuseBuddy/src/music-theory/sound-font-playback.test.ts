import { describe, expect, it } from 'vitest';

import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';

import {
  buildSoundFontPlaybackConfiguration,
  DEFAULT_SOUND_FONT_SLOT_DURATION_SECONDS,
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

describe('buildSoundFontPlaybackConfiguration', () => {
  it('uses fixed piano playback timing at 100 bpm', () => {
    const configuration = buildSoundFontPlaybackConfiguration(keyArrangement({}));

    expect(configuration.instrument).toBe('piano');
    expect(configuration.bpm).toBe(100);
    expect(configuration.slotDurationSeconds).toBe(0.075);
    expect(DEFAULT_SOUND_FONT_SLOT_DURATION_SECONDS).toBe(0.075);
  });

  it('converts a single attack to a minimum one-slot note', () => {
    const configuration = buildSoundFontPlaybackConfiguration(
      keyArrangement({
        0: [{ midi: 60, velocity: 72 }],
        1: [{ midi: null, velocity: null }],
      }),
    );

    expect(configuration.notes).toEqual([
      {
        channel: 0,
        durationSeconds: 0.075,
        id: 'note-0-0-60',
        midi: 60,
        startTimeSeconds: 0,
        velocity: 72,
      },
    ]);
  });

  it('extends a note through same-lane hold cells', () => {
    const configuration = buildSoundFontPlaybackConfiguration(
      keyArrangement({
        0: [{ midi: 60, velocity: 80 }],
        1: [{ midi: -50, velocity: null }],
        2: [{ midi: -50, velocity: null }],
        3: [{ midi: null, velocity: null }],
      }),
    );

    expect(configuration.notes[0]?.durationSeconds).toBeCloseTo(0.225);
  });

  it('ends a held note when a new attack appears in the same lane', () => {
    const configuration = buildSoundFontPlaybackConfiguration(
      keyArrangement({
        0: [{ midi: 60, velocity: 70 }],
        1: [{ midi: -50, velocity: null }],
        2: [{ midi: 64, velocity: 90 }],
        3: [{ midi: null, velocity: null }],
      }),
    );

    expect(
      configuration.notes.map((note) => [note.midi, note.startTimeSeconds, note.durationSeconds]),
    ).toEqual([
      [60, 0, 0.15],
      [64, 0.15, 0.075],
    ]);
  });

  it('supports simultaneous notes on separate lanes', () => {
    const configuration = buildSoundFontPlaybackConfiguration(
      keyArrangement({
        0: [
          { midi: 60, velocity: 70 },
          { midi: 64, velocity: 82 },
        ],
        1: [
          { midi: null, velocity: null },
          { midi: null, velocity: null },
        ],
      }),
    );

    expect(configuration.notes).toHaveLength(2);
    expect(configuration.notes.map((note) => note.startTimeSeconds)).toEqual([0, 0]);
    expect(configuration.notes.map((note) => note.midi)).toEqual([60, 64]);
  });

  it('sorts rows by beat index before converting start times', () => {
    const firstBeat = emptySlots();
    const secondBeat = emptySlots();
    firstBeat[0] = [{ midi: 60, velocity: 40 }];
    firstBeat[1] = [{ midi: null, velocity: null }];
    secondBeat[0] = [{ midi: 64, velocity: 80 }];
    secondBeat[1] = [{ midi: null, velocity: null }];

    const configuration = buildSoundFontPlaybackConfiguration({
      rows: [
        {
          beatIndex: 1,
          slots: secondBeat,
        },
        {
          beatIndex: 0,
          slots: firstBeat,
        },
      ],
    });

    expect(configuration.notes.map((note) => [note.midi, note.startTimeSeconds])).toEqual([
      [60, 0],
      [64, 2.4],
    ]);
  });
});
