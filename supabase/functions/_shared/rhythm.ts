import type {
  DbArrangementRow,
  RhythmStep,
} from "./daily-training-session-schema.ts";

type RhythmResult = {
  averageAttackVelocity: number | null;
  pattern: RhythmStep[];
};

const SOURCE_SLOTS_PER_APP_STEP = 2;

export function deriveRhythmPattern(
  rows: readonly DbArrangementRow[],
): RhythmResult {
  validateLaneShapes(rows);

  const attackVelocities = rows.flatMap((row) => collectAttackVelocities(row));
  const averageAttackVelocity = attackVelocities.length === 0
    ? null
    : attackVelocities.reduce((total, velocity) => total + velocity, 0) /
      attackVelocities.length;

  const pattern = rows.flatMap((row) =>
    Array.from(
      { length: row.arrangement.length / SOURCE_SLOTS_PER_APP_STEP },
      (_, stepIndex) => {
        const sourceStartIndex = stepIndex * SOURCE_SLOTS_PER_APP_STEP;
        const sourceIndexes = [sourceStartIndex, sourceStartIndex + 1];
        const attacks = sourceIndexes.flatMap((sourceIndex) =>
          getSlotAttacks(row, sourceIndex)
        );

        if (attacks.length > 0 && averageAttackVelocity !== null) {
          const maxVelocity = Math.max(...attacks);
          return maxVelocity > averageAttackVelocity ? "s" : "w";
        }

        const hasHold = sourceIndexes.some((sourceIndex) =>
          row.arrangement[sourceIndex].some((value) => value === -50)
        );

        return hasHold ? "h" : null;
      },
    )
  );

  return {
    averageAttackVelocity,
    pattern,
  };
}

function validateLaneShapes(rows: readonly DbArrangementRow[]) {
  rows.forEach((row) => {
    row.arrangement.forEach((slot, slotIndex) => {
      if (slot.length !== row.velocity[slotIndex].length) {
        throw new Error(
          `Arrangement and velocity lane counts differ at beat ${row.beat_index}, slot ${slotIndex}.`,
        );
      }
    });
  });
}

function collectAttackVelocities(row: DbArrangementRow) {
  return row.arrangement.flatMap((slot, slotIndex) =>
    getSlotAttacks(row, slotIndex)
  );
}

function getSlotAttacks(row: DbArrangementRow, slotIndex: number) {
  return row.arrangement[slotIndex].flatMap((value, laneIndex) => {
    const velocity = row.velocity[slotIndex][laneIndex];

    if (
      typeof value === "number" && value > 0 && typeof velocity === "number"
    ) {
      return [velocity];
    }

    return [];
  });
}
