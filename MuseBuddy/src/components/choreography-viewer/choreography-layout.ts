import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';

type ArrangementCell = TrainingSessionKeyArrangement['rows'][number]['slots'][number][number];

export type ChoreographyAttack = {
  id: string;
  isRoot: boolean;
  laneIndex: number;
  midi: number;
  rootPitchClass: number;
  size: number;
  slotIndex: number;
  velocity: number;
  xPercent: number;
  yPercent: number;
};

export type ChoreographyStepGroup = {
  id: string;
  attackIds: string[];
  rootAttackIds: string[];
  slotIndex: number;
  xPercent: number;
  yEndPercent: number;
  yStartPercent: number;
};

export type ChoreographyLayout = {
  attacks: ChoreographyAttack[];
  stepGroups: ChoreographyStepGroup[];
};

type SourceAttack = {
  laneIndex: number;
  midi: number;
  slotIndex: number;
  velocity: number;
};

const MAX_VELOCITY = 127;
const ROOT_MIN_DOT_SIZE = 5.5;
const ROOT_MAX_DOT_SIZE = 8.5;
const NOTE_MIN_DOT_SIZE = 3;
const NOTE_MAX_DOT_SIZE = 4.8;
const SAME_PITCH_COLLISION_OFFSET = 2.4;
const SINGLE_PITCH_Y_PERCENT = 50;
const TIME_SIDE_PADDING_PERCENT = 4;
const PITCH_SIDE_PADDING_PERCENT = 10;

export function buildChoreographyLayout(
  keyArrangement: TrainingSessionKeyArrangement,
): ChoreographyLayout {
  const slots = flattenArrangementSlots(keyArrangement);
  const sourceAttacks = collectSourceAttacks(slots);

  if (slots.length === 0 || sourceAttacks.length === 0) {
    return {
      attacks: [],
      stepGroups: [],
    };
  }

  const minMidi = Math.min(...sourceAttacks.map((attack) => attack.midi));
  const maxMidi = Math.max(...sourceAttacks.map((attack) => attack.midi));
  const attacksBySlot = groupAttacksBySlot(sourceAttacks);
  const slotXPositions = buildSlotXPositions([...attacksBySlot.keys()]);
  const attacks: ChoreographyAttack[] = [];
  const stepGroups: ChoreographyStepGroup[] = [];

  [...attacksBySlot.entries()]
    .sort(([leftSlotIndex], [rightSlotIndex]) => leftSlotIndex - rightSlotIndex)
    .forEach(([slotIndex, slotAttacks]) => {
      const rootPitchClass = getRootPitchClass(slotAttacks);
      const collisions = new Map<number, number>();
      const positionedAttacks = slotAttacks
        .sort((left, right) => left.midi - right.midi || left.laneIndex - right.laneIndex)
        .map((sourceAttack) => {
          const collisionIndex = collisions.get(sourceAttack.midi) ?? 0;
          collisions.set(sourceAttack.midi, collisionIndex + 1);

          const isRoot = getPitchClass(sourceAttack.midi) === rootPitchClass;
          const size = velocityToDotSize(sourceAttack.velocity, isRoot);
          const attack: ChoreographyAttack = {
            id: `attack-${slotIndex}-${sourceAttack.laneIndex}-${sourceAttack.midi}-${collisionIndex}`,
            isRoot,
            laneIndex: sourceAttack.laneIndex,
            midi: sourceAttack.midi,
            rootPitchClass,
            size,
            slotIndex,
            velocity: sourceAttack.velocity,
            xPercent: slotXPositions.get(slotIndex) ?? 50,
            yPercent: applyCollisionOffset(
              midiToYPercent(sourceAttack.midi, minMidi, maxMidi),
              collisionIndex,
            ),
          };

          attacks.push(attack);
          return attack;
        });

      const yValues = positionedAttacks.map((attack) => attack.yPercent);

      stepGroups.push({
        attackIds: positionedAttacks.map((attack) => attack.id),
        id: `step-${slotIndex}`,
        rootAttackIds: positionedAttacks
          .filter((attack) => attack.isRoot)
          .map((attack) => attack.id),
        slotIndex,
        xPercent: positionedAttacks[0]?.xPercent ?? slotXPositions.get(slotIndex) ?? 50,
        yEndPercent: Math.max(...yValues),
        yStartPercent: Math.min(...yValues),
      });
    });

  return {
    attacks,
    stepGroups: stepGroups.filter((group) => group.attackIds.length > 1),
  };
}

function flattenArrangementSlots(keyArrangement: TrainingSessionKeyArrangement) {
  return [...keyArrangement.rows]
    .sort((left, right) => left.beatIndex - right.beatIndex)
    .flatMap((row) => row.slots);
}

function collectSourceAttacks(slots: readonly ArrangementCell[][]): SourceAttack[] {
  return slots.flatMap((slot, slotIndex) =>
    slot.flatMap((cell, laneIndex) => {
      if (!isAttackCell(cell)) {
        return [];
      }

      return [
        {
          laneIndex,
          midi: cell.midi,
          slotIndex,
          velocity: cell.velocity,
        },
      ];
    }),
  );
}

function groupAttacksBySlot(sourceAttacks: readonly SourceAttack[]) {
  return sourceAttacks.reduce((groups, attack) => {
    const attacks = groups.get(attack.slotIndex) ?? [];
    attacks.push(attack);
    groups.set(attack.slotIndex, attacks);
    return groups;
  }, new Map<number, SourceAttack[]>());
}

function getRootPitchClass(attacks: readonly SourceAttack[]) {
  return getPitchClass(Math.min(...attacks.map((attack) => attack.midi)));
}

function buildSlotXPositions(slotIndexes: readonly number[]) {
  const orderedSlotIndexes = [...slotIndexes].sort((left, right) => left - right);

  if (orderedSlotIndexes.length === 1) {
    return new Map([[orderedSlotIndexes[0] ?? 0, 50]]);
  }

  const usableWidthPercent = 100 - TIME_SIDE_PADDING_PERCENT * 2;
  return new Map(
    orderedSlotIndexes.map((slotIndex, index) => [
      slotIndex,
      TIME_SIDE_PADDING_PERCENT + (index / (orderedSlotIndexes.length - 1)) * usableWidthPercent,
    ]),
  );
}

function midiToYPercent(midi: number, minMidi: number, maxMidi: number) {
  if (minMidi === maxMidi) {
    return SINGLE_PITCH_Y_PERCENT;
  }

  const normalizedPitch = (midi - minMidi) / (maxMidi - minMidi);
  return (
    PITCH_SIDE_PADDING_PERCENT + (1 - normalizedPitch) * (100 - PITCH_SIDE_PADDING_PERCENT * 2)
  );
}

function velocityToDotSize(velocity: number, isRoot: boolean) {
  const minSize = isRoot ? ROOT_MIN_DOT_SIZE : NOTE_MIN_DOT_SIZE;
  const maxSize = isRoot ? ROOT_MAX_DOT_SIZE : NOTE_MAX_DOT_SIZE;
  return minSize + (velocity / MAX_VELOCITY) * (maxSize - minSize);
}

function applyCollisionOffset(yPercent: number, collisionIndex: number) {
  if (collisionIndex === 0) {
    return yPercent;
  }

  const direction = collisionIndex % 2 === 0 ? 1 : -1;
  const offsetMultiplier = Math.ceil(collisionIndex / 2);
  const nextYPercent = yPercent + direction * offsetMultiplier * SAME_PITCH_COLLISION_OFFSET;
  return Math.min(
    100 - PITCH_SIDE_PADDING_PERCENT,
    Math.max(PITCH_SIDE_PADDING_PERCENT, nextYPercent),
  );
}

function getPitchClass(midi: number) {
  return ((midi % 12) + 12) % 12;
}

function isAttackCell(cell: ArrangementCell): cell is ArrangementCell & {
  midi: number;
  velocity: number;
} {
  return typeof cell.midi === 'number' && cell.midi > 0 && typeof cell.velocity === 'number';
}
