import { describe, expect, it } from 'vitest';

import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';

import { buildChoreographyLayout } from './choreography-layout';

type SourceSlot = TrainingSessionKeyArrangement['rows'][number]['slots'][number];

const rest = () => [{ midi: null, velocity: null }];

function keyArrangement(
  firstRowSlots: Record<number, SourceSlot>,
  secondRowSlots: Record<number, SourceSlot> = {},
): TrainingSessionKeyArrangement {
  return {
    rows: [
      {
        beatIndex: 1,
        slots: slots(secondRowSlots),
      },
      {
        beatIndex: 0,
        slots: slots(firstRowSlots),
      },
    ],
  };
}

function slots(overrides: Record<number, SourceSlot>) {
  const sourceSlots: SourceSlot[] = Array.from({ length: 32 }, rest);

  Object.entries(overrides).forEach(([index, slot]) => {
    sourceSlots[Number(index)] = slot;
  });

  return sourceSlots;
}

describe('buildChoreographyLayout', () => {
  it('normalizes pitch so higher MIDI attacks render above lower MIDI attacks', () => {
    const layout = buildChoreographyLayout(
      keyArrangement({
        0: [{ midi: 60, velocity: 64 }],
        8: [{ midi: 72, velocity: 64 }],
      }),
    );

    expect(layout.attacks).toHaveLength(2);
    expect(layout.attacks[1]?.yPercent).toBeLessThan(layout.attacks[0]?.yPercent ?? 0);
  });

  it('centers a single repeated pitch vertically', () => {
    const layout = buildChoreographyLayout(
      keyArrangement({
        0: [{ midi: 60, velocity: 64 }],
        8: [{ midi: 60, velocity: 96 }],
      }),
    );

    expect(layout.attacks.map((attack) => attack.yPercent)).toEqual([50, 50]);
  });

  it('uses the lowest note pitch class in a step as the root pitch class', () => {
    const layout = buildChoreographyLayout(
      keyArrangement({
        0: [
          { midi: 64, velocity: 72 },
          { midi: 60, velocity: 96 },
          { midi: 67, velocity: 88 },
        ],
      }),
    );

    expect(layout.attacks.map((attack) => ({ midi: attack.midi, isRoot: attack.isRoot }))).toEqual([
      { isRoot: true, midi: 60 },
      { isRoot: false, midi: 64 },
      { isRoot: false, midi: 67 },
    ]);
  });

  it('treats every same-pitch-class octave in the step as a root node', () => {
    const layout = buildChoreographyLayout(
      keyArrangement({
        0: [
          { midi: 48, velocity: 82 },
          { midi: 60, velocity: 96 },
          { midi: 67, velocity: 88 },
        ],
      }),
    );

    expect(layout.attacks.filter((attack) => attack.isRoot).map((attack) => attack.midi)).toEqual([
      48, 60,
    ]);
  });

  it('draws non-root notes smaller than root notes in the same step', () => {
    const layout = buildChoreographyLayout(
      keyArrangement({
        0: [
          { midi: 60, velocity: 96 },
          { midi: 64, velocity: 96 },
        ],
      }),
    );

    expect(layout.attacks[1]?.size).toBeLessThan(layout.attacks[0]?.size ?? 0);
  });

  it('creates light step-group connectors for notes that appear together', () => {
    const layout = buildChoreographyLayout(
      keyArrangement({
        0: [
          { midi: 60, velocity: 64 },
          { midi: 67, velocity: 96 },
        ],
      }),
    );

    expect(layout.stepGroups).toEqual([
      expect.objectContaining({
        attackIds: [layout.attacks[0]?.id, layout.attacks[1]?.id],
        rootAttackIds: [layout.attacks[0]?.id],
        slotIndex: 0,
      }),
    ]);
    expect(layout.stepGroups[0]?.yEndPercent).toBeGreaterThan(
      layout.stepGroups[0]?.yStartPercent ?? 0,
    );
  });

  it('ignores hold cells because the preview only cares when notes appear', () => {
    const layout = buildChoreographyLayout(
      keyArrangement({
        0: [{ midi: 60, velocity: 64 }],
        1: [{ midi: -50, velocity: null }],
        2: [{ midi: -50, velocity: null }],
        3: [{ midi: null, velocity: null }],
      }),
    );

    expect(layout.attacks).toHaveLength(1);
    expect(layout.stepGroups).toHaveLength(0);
  });

  it('spreads active steps from left to right', () => {
    const layout = buildChoreographyLayout(
      keyArrangement({
        12: [{ midi: 60, velocity: 64 }],
        20: [{ midi: 67, velocity: 96 }],
      }),
    );

    expect(layout.attacks[0]?.xPercent).toBe(4);
    expect(layout.attacks[1]?.xPercent).toBe(96);
  });

  it('spaces active steps evenly even when source slots are close together', () => {
    const layout = buildChoreographyLayout(
      keyArrangement({
        12: [{ midi: 60, velocity: 64 }],
        13: [{ midi: 64, velocity: 80 }],
        20: [{ midi: 67, velocity: 96 }],
      }),
    );

    expect(layout.attacks.map((attack) => attack.xPercent)).toEqual([4, 50, 96]);
  });

  it('does not connect notes across different steps', () => {
    const layout = buildChoreographyLayout(
      keyArrangement({
        0: [{ midi: 60, velocity: 64 }],
        8: [{ midi: 67, velocity: 96 }],
      }),
    );

    expect(layout.stepGroups).toHaveLength(0);
  });

  it('sorts rows by beat index before assigning timeline positions', () => {
    const layout = buildChoreographyLayout(
      keyArrangement(
        {
          0: [{ midi: 60, velocity: 64 }],
        },
        {
          0: [{ midi: 72, velocity: 96 }],
        },
      ),
    );

    expect(layout.attacks[0]).toEqual(expect.objectContaining({ midi: 60, slotIndex: 0 }));
    expect(layout.attacks[1]).toEqual(expect.objectContaining({ midi: 72, slotIndex: 32 }));
  });
});
