export const STEPS_PER_BAR = 16;
export const MIN_BAR_COUNT = 1;
export const MAX_BAR_COUNT = 2;
export const ONE_BAR_STEP_COUNT = STEPS_PER_BAR;
export const TWO_BAR_STEP_COUNT = STEPS_PER_BAR * MAX_BAR_COUNT;

export const RHYTHM_SPEED_OPTIONS = [
  { bpm: 40, id: 'slowest', label: 'Slowest' },
  { bpm: 60, id: 'slow', label: 'Slow' },
  { bpm: 95, id: 'normal', label: 'Normal' },
  { bpm: 120, id: 'fast', label: 'Fast' },
] as const;

export const DEFAULT_BPM = 95;

export const RHYTHM_PATTERN_PROBABILITY_CONFIG = {
  strongBeat: 0.92,
  weakBeat: 0.48,
  offbeat: 0.28,
} as const;
