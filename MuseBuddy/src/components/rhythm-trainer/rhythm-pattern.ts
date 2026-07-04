import {
  ONE_BAR_STEP_COUNT,
  RHYTHM_PATTERN_PROBABILITY_CONFIG,
  STEPS_PER_BAR,
  TWO_BAR_STEP_COUNT,
} from './constants';
import type { RhythmAttack, RhythmPattern, RhythmStep } from './types';

export type RhythmEvent = {
  attack: RhythmAttack | null;
  kind: 'attack' | 'rest';
  startStep: number;
  stepCount: number;
};

export function isValidRhythmPatternLength(length: number) {
  return length === ONE_BAR_STEP_COUNT || length === TWO_BAR_STEP_COUNT;
}

export function assertRhythmPattern(pattern: RhythmPattern): asserts pattern is RhythmPattern {
  if (!isValidRhythmPatternLength(pattern.length)) {
    throw new Error(`Expected 16 or 32 rhythm steps, received ${pattern.length}.`);
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
    const kind = step === null ? 'rest' : 'attack';
    const startStep = stepIndex;
    const attack = step;

    stepIndex += 1;

    while (stepIndex < steps.length) {
      const nextStep = steps[stepIndex];
      const nextKind = nextStep === null ? 'rest' : 'attack';

      if (nextKind !== kind) {
        break;
      }

      stepIndex += 1;
    }

    events.push({
      attack: kind === 'attack' ? attack : null,
      kind,
      startStep,
      stepCount: stepIndex - startStep,
    });
  }

  return events;
}

export function generateRandomRhythmPattern(length: number = ONE_BAR_STEP_COUNT): RhythmStep[] {
  if (!isValidRhythmPatternLength(length)) {
    throw new Error(`Expected random rhythm length of 16 or 32, received ${length}.`);
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
