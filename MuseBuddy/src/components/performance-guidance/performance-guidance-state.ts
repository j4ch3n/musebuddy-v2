import type { SoundFontPlaybackConfiguration } from '@modules/sound-font-player';

export const SOUND_FONT_STEPS_PER_PART = 16;

export type PerformanceGuidancePhase = 'pending' | 'prepare' | 'demo' | 'listening' | 'finish';

export function getSoundFontPartCount(
  configuration: SoundFontPlaybackConfiguration | null,
): number {
  if (!configuration) {
    return 0;
  }

  return configuration.tracks.reduce(
    (partCount, track) => Math.max(partCount, track.parts.length),
    0,
  );
}

export function getSoundFontStepCount(
  configuration: SoundFontPlaybackConfiguration | null,
): number {
  return getSoundFontPartCount(configuration) * SOUND_FONT_STEPS_PER_PART;
}

export function getPhaseAfterDemoFinish(
  currentPhase: PerformanceGuidancePhase,
  includesSilentPeriod: boolean,
): PerformanceGuidancePhase {
  if (currentPhase !== 'demo' || !includesSilentPeriod) {
    return currentPhase;
  }

  return 'listening';
}

export function getPhaseAfterCycleRepeat(willRepeat: boolean): PerformanceGuidancePhase {
  return willRepeat ? 'demo' : 'finish';
}
