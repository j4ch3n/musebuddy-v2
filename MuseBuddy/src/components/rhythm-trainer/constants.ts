export const STEPS_PER_BAR = 32;
export const ATTACK_DOT_DIAMETER_PX = 10;
export const ATTACK_DOT_RADIUS_PX = ATTACK_DOT_DIAMETER_PX / 2;
export const MAX_BAR_COUNT = 8;
export const ONE_BAR_STEP_COUNT = STEPS_PER_BAR;
export const RHYTHM_SHEET_HEIGHT_PX = 78;
export const RHYTHM_SHEET_WRAPPER_HEIGHT_PX = 82;

export { BPM_OPTIONS as RHYTHM_SPEED_OPTIONS, DEFAULT_BPM } from '@/music-theory/tempo';

export const RHYTHM_PATTERN_PROBABILITY_CONFIG = {
  strongBeat: 0.92,
  weakBeat: 0.48,
  offbeat: 0.28,
} as const;
