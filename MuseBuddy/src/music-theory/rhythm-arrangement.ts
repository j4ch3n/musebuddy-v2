import type {
  TrainingSessionKeyArrangement,
  TrainingSessionRhythm,
  TrainingSessionRhythmPattern,
} from '@/contexts/training-session-schema';

type KeyArrangementCell = TrainingSessionKeyArrangement['rows'][number]['slots'][number][number];

type SourceAttack = {
  midi: number;
  velocity: number;
};

type SourceSlotEvents = {
  attacks: SourceAttack[];
  heldMidi: number[];
};

const SOURCE_SLOTS_PER_RHYTHM_STEP = 2;
const HOLD_MIDI = -50;

export function deriveRhythmFromKeyArrangement(
  keyArrangement: TrainingSessionKeyArrangement,
): TrainingSessionRhythm {
  const orderedRows = [...keyArrangement.rows].sort(
    (left, right) => left.beatIndex - right.beatIndex,
  );
  const attackVelocities = orderedRows.flatMap((row) =>
    row.slots.flatMap((slot) =>
      slot.flatMap((cell) => (isAttackCell(cell) ? [cell.velocity] : [])),
    ),
  );
  const averageAttackVelocity =
    attackVelocities.length === 0
      ? null
      : attackVelocities.reduce((total, velocity) => total + velocity, 0) / attackVelocities.length;

  return {
    averageAttackVelocity,
    pattern: deriveRhythmPattern(orderedRows, averageAttackVelocity),
  };
}

function deriveRhythmPattern(
  rows: TrainingSessionKeyArrangement['rows'],
  averageAttackVelocity: number | null,
): TrainingSessionRhythmPattern {
  return rows.flatMap((row) => {
    const activeLaneMidi = new Map<number, number>();
    let activeRhythmMidi = new Set<number>();

    return Array.from(
      { length: row.slots.length / SOURCE_SLOTS_PER_RHYTHM_STEP },
      (_, stepIndex) => {
        const sourceStartIndex = stepIndex * SOURCE_SLOTS_PER_RHYTHM_STEP;
        const sourceSlots = [row.slots[sourceStartIndex], row.slots[sourceStartIndex + 1]];
        const sourceEvents = sourceSlots.map((slot) =>
          collectSourceSlotEvents(slot, activeLaneMidi),
        );
        const attacks = sourceEvents.flatMap((events) => events.attacks);

        if (attacks.length > 0 && averageAttackVelocity !== null) {
          activeRhythmMidi = new Set(attacks.map((attack) => attack.midi));

          const maxVelocity = Math.max(...attacks.map((attack) => attack.velocity));
          return maxVelocity > averageAttackVelocity ? 's' : 'w';
        }

        const hasActiveHold = sourceEvents.some((events) =>
          events.heldMidi.some((midi) => activeRhythmMidi.has(midi)),
        );

        if (hasActiveHold) {
          return 'h';
        }

        activeRhythmMidi = new Set();
        return null;
      },
    );
  });
}

function collectSourceSlotEvents(
  slot: readonly KeyArrangementCell[],
  activeLaneMidi: Map<number, number>,
): SourceSlotEvents {
  const attacks: SourceAttack[] = [];
  const heldMidi: number[] = [];

  slot.forEach((cell, laneIndex) => {
    if (cell.midi === null) {
      activeLaneMidi.delete(laneIndex);
      return;
    }

    if (cell.midi === HOLD_MIDI) {
      const activeMidi = activeLaneMidi.get(laneIndex);

      if (activeMidi !== undefined) {
        heldMidi.push(activeMidi);
      }

      return;
    }

    if (isAttackCell(cell)) {
      activeLaneMidi.set(laneIndex, cell.midi);
      attacks.push({
        midi: cell.midi,
        velocity: cell.velocity,
      });
    }
  });

  return {
    attacks,
    heldMidi,
  };
}

function isAttackCell(cell: KeyArrangementCell): cell is KeyArrangementCell & {
  midi: number;
  velocity: number;
} {
  return typeof cell.midi === 'number' && cell.midi > 0 && typeof cell.velocity === 'number';
}
