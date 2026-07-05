import { describe, expect, it } from 'vitest';

import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';

import { deriveRhythmFromKeyArrangement } from './rhythm-arrangement';

type SourceSlot = TrainingSessionKeyArrangement['rows'][number]['slots'][number];

function emptySlots() {
  const slots: SourceSlot[] = Array.from({ length: 32 }, () => [{ midi: null, velocity: null }]);

  return slots;
}

function keyArrangement(slots: Record<number, SourceSlot>): TrainingSessionKeyArrangement {
  const rowSlots = emptySlots();

  Object.entries(slots).forEach(([slotIndex, slot]) => {
    rowSlots[Number(slotIndex)] = slot;
  });

  return {
    barIndex: 0,
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
    songId: 'test-song',
  };
}

describe('deriveRhythmFromKeyArrangement', () => {
  it('splits strong and weak attacks by average velocity', () => {
    const result = deriveRhythmFromKeyArrangement(
      keyArrangement({
        0: [{ midi: 60, velocity: 40 }],
        2: [{ midi: 62, velocity: 80 }],
      }),
    );

    expect(result.averageAttackVelocity).toBe(60);
    expect(result.pattern.slice(0, 4)).toEqual(['w', 's', null, null]);
  });

  it('extends holds for the same active MIDI pitch', () => {
    const result = deriveRhythmFromKeyArrangement(
      keyArrangement({
        0: [{ midi: 60, velocity: 80 }],
        1: [{ midi: -50, velocity: null }],
        2: [{ midi: -50, velocity: null }],
        3: [{ midi: -50, velocity: null }],
      }),
    );

    expect(result.pattern.slice(0, 3)).toEqual(['w', 'h', null]);
  });

  it('treats a different MIDI pitch as a new attack and cancels the previous hold', () => {
    const result = deriveRhythmFromKeyArrangement(
      keyArrangement({
        0: [{ midi: 60, velocity: 40 }],
        1: [{ midi: -50, velocity: null }],
        2: [
          { midi: -50, velocity: null },
          { midi: 64, velocity: 80 },
        ],
        3: [
          { midi: -50, velocity: null },
          { midi: -50, velocity: null },
        ],
        4: [
          { midi: -50, velocity: null },
          { midi: null, velocity: null },
        ],
      }),
    );

    expect(result.pattern.slice(0, 4)).toEqual(['w', 's', null, null]);
  });

  it('lets attacks win over holds inside a compressed app step', () => {
    const result = deriveRhythmFromKeyArrangement(
      keyArrangement({
        0: [{ midi: 60, velocity: 40 }],
        1: [{ midi: -50, velocity: null }],
        2: [{ midi: -50, velocity: null }],
        3: [{ midi: 64, velocity: 80 }],
        4: [{ midi: -50, velocity: null }],
      }),
    );

    expect(result.pattern.slice(0, 4)).toEqual(['w', 's', 'h', null]);
  });

  it('sorts raw rows by beat index before deriving rhythm', () => {
    const firstBeat = emptySlots();
    const secondBeat = emptySlots();
    firstBeat[0] = [{ midi: 60, velocity: 40 }];
    secondBeat[0] = [{ midi: 64, velocity: 80 }];

    const result = deriveRhythmFromKeyArrangement({
      barIndex: 0,
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
      songId: 'test-song',
    });

    expect(result.pattern[0]).toBe('w');
    expect(result.pattern[16]).toBe('s');
  });
});
