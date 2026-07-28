import type {
  PatternStaffName,
  TrainingSessionPatternBeat,
  TrainingSessionPatternStave,
  TrainingSessionRhythm,
  TrainingSessionRhythmPattern,
} from '@/contexts/training-session-schema';

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
  const activeLaneMidi = new Map<number, number>();
  let activeRhythmMidi = new Set<number>();

  return staves.flatMap((stave) =>
    Array.from(
      { length: stave.arrangement.length / SOURCE_SLOTS_PER_RHYTHM_STEP },
      (_, stepIndex) => {
        const sourceStartIndex = stepIndex * SOURCE_SLOTS_PER_RHYTHM_STEP;
        const sourceEvents = [sourceStartIndex, sourceStartIndex + 1].map((slotIndex) =>
          collectSourceSlotEvents(stave, slotIndex, activeLaneMidi),
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
    ),
  );
}

function collectSourceSlotEvents(
  stave: TrainingSessionPatternStave,
  slotIndex: number,
  activeLaneMidi: Map<number, number>,
): SourceSlotEvents {
  const slot = stave.arrangement[slotIndex] ?? [];
  const velocitySlot = stave.velocity[slotIndex] ?? [];
  const attacks: SourceAttack[] = [];
  const heldMidi: number[] = [];

  slot.forEach((midi, laneIndex) => {
    const velocity = velocitySlot[laneIndex];
    if (midi === null) {
      activeLaneMidi.delete(laneIndex);
      return;
    }

    if (midi === HOLD_MIDI) {
      const activeMidi = activeLaneMidi.get(laneIndex);
      if (activeMidi !== undefined) {
        heldMidi.push(activeMidi);
      }
      return;
    }

    if (typeof midi === 'number' && midi > 0 && typeof velocity === 'number') {
      activeLaneMidi.set(laneIndex, midi);
      attacks.push({ midi, velocity });
    }
  });

  return { attacks, heldMidi };
}
