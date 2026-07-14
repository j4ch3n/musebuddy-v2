import type { SoundFontPlaybackBarEvent } from '@modules/sound-font-player';

export type PlaybackClockAnchor = {
  audioClockMsAtReceipt: number;
  userPlaybackPositionMsAtReceipt: number;
};

type CreatePlaybackClockAnchorOptions = {
  audioClockMs: number;
  barDurationMs: number;
  event: SoundFontPlaybackBarEvent;
  receivedAtMs: number;
};

type CurrentStepIndexOptions = {
  anchor: PlaybackClockAnchor;
  audioClockMs: number;
  expectedStepCount: number;
  stepDurationMs: number;
};

export function createPlaybackClockAnchor({
  audioClockMs,
  barDurationMs,
  event,
  receivedAtMs,
}: CreatePlaybackClockAnchorOptions): PlaybackClockAnchor {
  const nativeEventLatencyMs = Math.max(0, receivedAtMs - event.absoluteTimeMs);

  return {
    audioClockMsAtReceipt: audioClockMs,
    userPlaybackPositionMsAtReceipt: event.barIndex * barDurationMs + nativeEventLatencyMs,
  };
}

export function estimateUserPlaybackPositionMs(
  anchor: PlaybackClockAnchor,
  audioClockMs: number,
): number {
  return Math.max(
    0,
    anchor.userPlaybackPositionMsAtReceipt + audioClockMs - anchor.audioClockMsAtReceipt,
  );
}

export function getClockedCurrentStepIndex({
  anchor,
  audioClockMs,
  expectedStepCount,
  stepDurationMs,
}: CurrentStepIndexOptions): number | null {
  if (expectedStepCount <= 0 || stepDurationMs <= 0) {
    return null;
  }

  const playbackPositionMs = estimateUserPlaybackPositionMs(anchor, audioClockMs);

  return Math.floor(playbackPositionMs / stepDurationMs) % expectedStepCount;
}
