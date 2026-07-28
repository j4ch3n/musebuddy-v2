import {
  MAX_BAR_COUNT,
  ONE_BAR_STEP_COUNT,
  RHYTHM_PATTERN_PROBABILITY_CONFIG,
  STEPS_PER_BAR,
} from './constants';
import type { RhythmAttack, RhythmPattern, RhythmStep } from './types';

export type RhythmEvent = {
  attack: RhythmAttack | null;
  kind: 'attack' | 'rest';
  startStep: number;
  stepCount: number;
};

export function isValidRhythmPatternLength(length: number) {
  return (
    length >= ONE_BAR_STEP_COUNT &&
    length <= STEPS_PER_BAR * MAX_BAR_COUNT &&
    length % STEPS_PER_BAR === 0
  );
}

export function assertRhythmPattern(pattern: RhythmPattern): asserts pattern is RhythmPattern {
  if (!isValidRhythmPatternLength(pattern.length)) {
    throw new Error(
      `Expected a non-empty multiple of 16 up to 128 rhythm steps, received ${pattern.length}.`,
    );
  }
}

export function splitRhythmPatternBars(pattern: RhythmPattern): RhythmStep[][] {
  assertRhythmPattern(pattern);

  return Array.from({ length: pattern.length / STEPS_PER_BAR }, (_, barIndex) =>
    pattern.slice(barIndex * STEPS_PER_BAR, (barIndex + 1) * STEPS_PER_BAR),
  );
}

export function collectRhythmEvents(steps: readonly RhythmStep[]): RhythmEvent[] {
  const events: RhythmEvent[] = [];
  let stepIndex = 0;

  while (stepIndex < steps.length) {
    const step = steps[stepIndex];
    const startStep = stepIndex;
    const isAttack = isRhythmAttack(step);
    const kind = isAttack ? 'attack' : 'rest';
    const attack = isRhythmAttack(step) ? step : null;

    stepIndex += 1;

    while (isAttack && steps[stepIndex] === 'h') {
      stepIndex += 1;
    }

    while (!isAttack && stepIndex < steps.length && !isRhythmAttack(steps[stepIndex])) {
      stepIndex += 1;
    }

    events.push({
      attack,
      kind,
      startStep,
      stepCount: stepIndex - startStep,
    });
  }

  return events;
}

function isRhythmAttack(step: RhythmStep): step is RhythmAttack {
  return step === 's' || step === 'w';
}

export function generateRandomRhythmPattern(length: number = ONE_BAR_STEP_COUNT): RhythmStep[] {
  if (!isValidRhythmPatternLength(length)) {
    throw new Error(
      `Expected a non-empty multiple of 16 up to 128 random rhythm steps, received ${length}.`,
    );
  }

  return Array.from({ length }, (_, stepIndex) => {
    if (stepIndex % STEPS_PER_BAR === 0) {
      return 's';
    }

    if (stepIndex % 4 === 0) {
      return Math.random() < RHYTHM_PATTERN_PROBABILITY_CONFIG.strongBeat ? 's' : null;
    }

    if (stepIndex % 2 === 0) {
      return Math.random() < RHYTHM_PATTERN_PROBABILITY_CONFIG.weakBeat ? 'w' : null;
    }

    return Math.random() < RHYTHM_PATTERN_PROBABILITY_CONFIG.offbeat ? 'w' : null;
  });
}
