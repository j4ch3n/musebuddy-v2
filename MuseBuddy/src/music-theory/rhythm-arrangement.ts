import type {
  PatternStaffName,
  TrainingSessionPatternBeat,
  TrainingSessionPatternStave,
  TrainingSessionRhythm,
  TrainingSessionRhythmPattern,
} from '@/contexts/training-session-schema';

type SourceAttack = {
  laneIndex: number;
  velocity: number;
};
const HOLD_MIDI = -50;

export function deriveRhythmFromPatternBeats(
  beats: readonly TrainingSessionPatternBeat[],
  staff: PatternStaffName,
): TrainingSessionRhythm {
  const orderedStaves = [...beats]
    .sort((left, right) => left.bar_index - right.bar_index || left.beat_index - right.beat_index)
    .map((beat) => beat.staves[staff]);
  const attackVelocities: number[] = [];
  orderedStaves.forEach((stave) => {
    stave.arrangement.forEach((slot, slotIndex) => {
      slot.forEach((midi, laneIndex) => {
        const velocity = stave.velocity[slotIndex]?.[laneIndex];
        if (typeof midi === 'number' && midi > 0 && typeof velocity === 'number') {
          attackVelocities.push(velocity);
        }
      });
    });
  });
  const averageAttackVelocity =
    attackVelocities.length === 0
      ? null
      : attackVelocities.reduce((total, velocity) => total + velocity, 0) / attackVelocities.length;

  return {
    averageAttackVelocity,
    pattern: deriveRhythmPattern(orderedStaves, averageAttackVelocity),
  };
}

function deriveRhythmPattern(
  staves: readonly TrainingSessionPatternStave[],
  averageAttackVelocity: number | null,
): TrainingSessionRhythmPattern {
  let trackedLanes = new Set<number>();
  return staves.flatMap((stave) =>
    stave.arrangement.map((slot, slotIndex) => {
      const attacks = collectAttacks(stave, slotIndex);
      if (attacks.length > 0 && averageAttackVelocity !== null) {
        trackedLanes = new Set(attacks.map((attack) => attack.laneIndex));
        const maxVelocity = Math.max(...attacks.map((attack) => attack.velocity));
        return maxVelocity >= averageAttackVelocity ? 's' : 'w';
      }
      const hasActiveHold = [...trackedLanes].some((laneIndex) => slot[laneIndex] === HOLD_MIDI);
      if (hasActiveHold) {
        return 'h';
      }
      trackedLanes = new Set();
      return null;
    }),
  );
}

function collectAttacks(stave: TrainingSessionPatternStave, slotIndex: number): SourceAttack[] {
  const slot = stave.arrangement[slotIndex] ?? [];
  const velocitySlot = stave.velocity[slotIndex] ?? [];
  const attacks: SourceAttack[] = [];
  slot.forEach((midi, laneIndex) => {
    const velocity = velocitySlot[laneIndex];
    if (typeof midi === 'number' && midi > 0 && typeof velocity === 'number') {
      attacks.push({ laneIndex, velocity });
    }
  });
  return attacks;
}
