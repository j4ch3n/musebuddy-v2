export const STEPS_PER_BAR = 16;
export const MIN_BAR_COUNT = 1;
export const MAX_BAR_COUNT = 2;
export const ONE_BAR_STEP_COUNT = STEPS_PER_BAR;
export const TWO_BAR_STEP_COUNT = STEPS_PER_BAR * MAX_BAR_COUNT;

export const DEFAULT_BPM = 120;
export const MIN_BPM = 60;
export const MAX_BPM = 200;
export const BPM_STEP = 5;

export const RHYTHM_PATTERN_PROBABILITY_CONFIG = {
  strongBeat: 0.92,
  weakBeat: 0.48,
  offbeat: 0.28,
} as const;
