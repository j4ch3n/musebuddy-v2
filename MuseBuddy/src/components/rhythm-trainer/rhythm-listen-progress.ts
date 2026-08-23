import { STEPS_PER_BAR } from './constants';
import type { RhythmAttackDot, RhythmPattern } from './types';

export type RhythmExpectedHit = {
  matched: boolean;
  missed: boolean;
  offsetMs: number;
  stepIndex: number;
};

export type RhythmListenProgress = {
  combo: number;
  dots: readonly RhythmAttackDot[];
  expectedHits: readonly RhythmExpectedHit[];
};

export type RhythmDetectedAttack = {
  absoluteTimeMs: number;
  id: number;
};

export type RhythmTiming = {
  barDurationMs: number;
  listeningDurationMs: number;
  stepDurationMs: number;
};

export function getRhythmTiming(bpm: number, stepCount: number): RhythmTiming {
  const stepDurationMs = 0.125 * (60_000 / bpm);
  return {
    barDurationMs: STEPS_PER_BAR * stepDurationMs,
    listeningDurationMs: stepCount * stepDurationMs,
    stepDurationMs,
  };
}

export function createRhythmListenProgress(
  pattern: RhythmPattern,
  stepDurationMs: number,
  combo = 0,
): RhythmListenProgress {
  return {
    combo,
    dots: [],
    expectedHits: pattern.flatMap((step, stepIndex) =>
      step === 's' || step === 'w'
        ? [
            {
              matched: false,
              missed: false,
              offsetMs: stepIndex * stepDurationMs,
              stepIndex,
            },
          ]
        : [],
    ),
  };
}

export function deriveRhythmListenProgress({
  allowedOffsetMs,
  attacks,
  elapsedMs,
  listeningDurationMs,
  listeningStartedAtMs,
  pattern,
  startingCombo = 0,
  stepDurationMs,
}: {
  allowedOffsetMs: number;
  attacks: readonly RhythmDetectedAttack[];
  elapsedMs: number;
  listeningDurationMs: number;
  listeningStartedAtMs: number;
  pattern: RhythmPattern;
  startingCombo?: number;
  stepDurationMs: number;
}): RhythmListenProgress {
  const baseProgress = createRhythmListenProgress(pattern, stepDurationMs, startingCombo);
  const seenAttackIds = new Set<number>();
  const recordedAttacks = attacks
    .flatMap((attack) => {
      if (seenAttackIds.has(attack.id)) {
        return [];
      }
      seenAttackIds.add(attack.id);
      const attackOffsetMs = attack.absoluteTimeMs - listeningStartedAtMs;
      return [{ ...attack, attackOffsetMs }];
    })
    .sort((left, right) => left.attackOffsetMs - right.attackOffsetMs || left.id - right.id);
  const candidates = recordedAttacks.flatMap((attack, attackIndex) =>
    baseProgress.expectedHits.flatMap((expectedHit, expectedHitIndex) => {
      const distanceMs = Math.abs(attack.attackOffsetMs - expectedHit.offsetMs);
      return distanceMs <= allowedOffsetMs ? [{ attackIndex, distanceMs, expectedHitIndex }] : [];
    }),
  );
  candidates.sort(
    (left, right) =>
      left.distanceMs - right.distanceMs ||
      recordedAttacks[left.attackIndex].attackOffsetMs -
        recordedAttacks[right.attackIndex].attackOffsetMs ||
      recordedAttacks[left.attackIndex].id - recordedAttacks[right.attackIndex].id ||
      left.expectedHitIndex - right.expectedHitIndex,
  );

  const matchedAttackIndexes = new Set<number>();
  const matchedExpectedHitIndexes = new Set<number>();
  candidates.forEach(({ attackIndex, expectedHitIndex }) => {
    if (matchedAttackIndexes.has(attackIndex) || matchedExpectedHitIndexes.has(expectedHitIndex)) {
      return;
    }
    matchedAttackIndexes.add(attackIndex);
    matchedExpectedHitIndexes.add(expectedHitIndex);
  });

  const expectedHits = baseProgress.expectedHits.map((expectedHit, expectedHitIndex) => ({
    ...expectedHit,
    matched: matchedExpectedHitIndexes.has(expectedHitIndex),
    missed:
      !matchedExpectedHitIndexes.has(expectedHitIndex) &&
      elapsedMs > expectedHit.offsetMs + allowedOffsetMs,
  }));
  const dots = recordedAttacks.map((attack, attackIndex) => {
    const matched = matchedAttackIndexes.has(attackIndex);
    return {
      // Keep every in-phase attack visible, including an early or late one. The
      // marker is clamped only for display so it stays in the current two-bar grid.
      attackOffsetMs: clampAttackOffsetForDisplay(attack.attackOffsetMs, listeningDurationMs),
      id: attack.id,
      matched,
    };
  });

  const comboOutcomes: { increments: boolean; timeMs: number }[] = [];
  recordedAttacks.forEach((attack, attackIndex) => {
    if (attack.attackOffsetMs > elapsedMs) {
      return;
    }
    if (matchedAttackIndexes.has(attackIndex)) {
      comboOutcomes.push({ increments: true, timeMs: attack.attackOffsetMs });
    } else if (attack.attackOffsetMs >= 0) {
      comboOutcomes.push({ increments: false, timeMs: attack.attackOffsetMs });
    }
  });
  expectedHits.forEach((expectedHit) => {
    if (expectedHit.missed) {
      comboOutcomes.push({
        increments: false,
        timeMs: expectedHit.offsetMs + allowedOffsetMs,
      });
    }
  });
  comboOutcomes.sort(
    (left, right) =>
      left.timeMs - right.timeMs || Number(left.increments) - Number(right.increments),
  );
  const combo = comboOutcomes.reduce(
    (currentCombo, outcome) => (outcome.increments ? currentCombo + 1 : 0),
    startingCombo,
  );

  return { combo, dots, expectedHits };
}

function clampAttackOffsetForDisplay(attackOffsetMs: number, listeningDurationMs: number): number {
  return Math.min(Math.max(attackOffsetMs, 0), Math.max(0, listeningDurationMs - 0.001));
}
