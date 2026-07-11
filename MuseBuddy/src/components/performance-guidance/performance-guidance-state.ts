import type { SoundFontPlaybackConfiguration } from '@modules/sound-font-player';

export const SOUND_FONT_STEPS_PER_PART = 16;

export type PerformanceGuidancePhase = 'pending' | 'prepare' | 'demo' | 'listening' | 'finish';
export type PerformanceGuidanceStartPhase = Extract<
  PerformanceGuidancePhase,
  'pending' | 'prepare'
>;

const SOUND_FONT_STEP_DURATION_BEATS = 0.25;

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

export function getSoundFontDemoDurationMs(configuration: SoundFontPlaybackConfiguration): number {
  const durationBeats = getSoundFontStepCount(configuration) * SOUND_FONT_STEP_DURATION_BEATS;

  return durationBeats * (60_000 / configuration.bpm);
}

export function shouldHandlePlaybackEvent(
  activePlaybackId: number | null,
  eventPlaybackId: number,
): boolean {
  return activePlaybackId !== null && activePlaybackId === eventPlaybackId;
}
