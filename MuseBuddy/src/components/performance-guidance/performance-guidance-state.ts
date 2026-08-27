import type { DetectionResult } from '@modules/basic-pitch';
import type { SoundFontPlaybackConfiguration } from '@modules/sound-font-player';

export type PerformanceGuidancePhase =
  | 'pending'
  | 'prepare'
  | 'demo'
  | 'listening'
  | 'retry'
  | 'finish';
export type PerformanceGuidanceStartPhase = Extract<
  PerformanceGuidancePhase,
  'pending' | 'prepare'
>;

export type GuidanceState = {
  phase: PerformanceGuidancePhase;
  completedCycles: number;
  currentSegmentIndex: number;
  countdownValue: number;
  currentStepIndex: number | null;
  latestDetection: DetectionResult | null;
  errorMessage: string;
  flowId: number;
  isRetryingCurrentSegment: boolean;
};

export type GuidanceAction =
  | { type: 'prepare'; flowId?: number }
  | { type: 'demo' }
  | { type: 'listening'; startedAtMs?: number }
  | { type: 'finish' }
  | { type: 'detection'; detection: DetectionResult }
  | { type: 'complete-cycle'; completedCycles: number }
  | { type: 'next-segment' }
  | { type: 'retry' }
  | {
      type: 'clock';
      countdownValue: number;
      currentStepIndex: number | null;
      phase: 'prepare' | 'demo';
      completedCycles: number;
    }
  | { type: 'pending'; errorMessage?: string; flowId?: number }
  | { type: 'clear-input' };

export function createGuidanceState(phase: PerformanceGuidanceStartPhase): GuidanceState {
  return {
    phase,
    completedCycles: 0,
    currentSegmentIndex: 0,
    countdownValue: 4,
    currentStepIndex: null,
    latestDetection: null,
    errorMessage: '',
    flowId: 0,
    isRetryingCurrentSegment: false,
  };
}

export function guidanceReducer(state: GuidanceState, action: GuidanceAction): GuidanceState {
  switch (action.type) {
    case 'prepare':
      return { ...createGuidanceState('prepare'), flowId: action.flowId ?? state.flowId };
    case 'demo':
      return { ...state, phase: 'demo', currentStepIndex: null };
    case 'listening':
      return {
        ...state,
        phase: 'listening',
        currentStepIndex: null,
        latestDetection: null,
      };
    case 'finish':
      return {
        ...state,
        phase: 'finish',
        currentStepIndex: null,
        latestDetection: null,
        isRetryingCurrentSegment: false,
      };
    case 'detection':
      return { ...state, latestDetection: action.detection };
    case 'complete-cycle':
      return {
        ...state,
        completedCycles: action.completedCycles,
        currentStepIndex: null,
        latestDetection: null,
      };
    case 'next-segment':
      return {
        ...state,
        completedCycles: 0,
        currentSegmentIndex: state.currentSegmentIndex + 1,
        currentStepIndex: null,
        latestDetection: null,
        isRetryingCurrentSegment: false,
      };
    case 'retry':
      return {
        ...state,
        phase: 'retry',
        currentStepIndex: null,
        latestDetection: null,
        isRetryingCurrentSegment: true,
      };
    case 'clock':
      return {
        ...state,
        completedCycles: action.completedCycles,
        countdownValue: action.countdownValue,
        currentStepIndex: action.currentStepIndex,
        phase: action.phase,
      };
    case 'pending':
      return {
        ...createGuidanceState('pending'),
        errorMessage: action.errorMessage ?? '',
        flowId: action.flowId ?? state.flowId + 1,
      };
    case 'clear-input':
      return { ...state, latestDetection: null, errorMessage: '' };
  }
}

export function getSoundFontStepCount(
  configuration: SoundFontPlaybackConfiguration | null,
): number {
  return configuration?.tracks.treble.reduce((count, part) => count + part.length, 0) ?? 0;
}

export function getSoundFontPartCount(
  configuration: SoundFontPlaybackConfiguration | null,
): number {
  return configuration?.tracks.treble.length ?? 0;
}

export function getSoundFontDemoDurationMs(configuration: SoundFontPlaybackConfiguration): number {
  return getSoundFontStepCount(configuration) * 0.125 * (60_000 / configuration.bpm);
}

export function getPlaybackClockState({
  completedCycles,
  configuration,
  leadIn,
  nowMs,
  repetitions,
  startedAtMs,
}: {
  completedCycles: number;
  configuration: SoundFontPlaybackConfiguration;
  leadIn: boolean;
  nowMs: number;
  repetitions: number;
  startedAtMs: number;
}): {
  completedCycles: number;
  countdownValue: number;
  currentStepIndex: number | null;
  phase: 'prepare' | 'demo';
} {
  const beatDurationMs = 60_000 / configuration.bpm;
  const leadInDurationMs = leadIn ? 4 * beatDurationMs : 0;
  const elapsedMs = Math.max(0, nowMs - startedAtMs);
  if (leadIn && elapsedMs < leadInDurationMs) {
    return {
      completedCycles,
      countdownValue: Math.max(1, 4 - Math.floor(elapsedMs / beatDurationMs)),
      currentStepIndex: null,
      phase: 'prepare',
    };
  }

  const demoElapsedMs = Math.max(0, elapsedMs - leadInDurationMs);
  const demoDurationMs = getSoundFontDemoDurationMs(configuration);
  const stepDurationMs = 0.125 * beatDurationMs;
  const stepCount = getSoundFontStepCount(configuration);
  const totalDemoDurationMs = demoDurationMs * repetitions;
  if (demoDurationMs > 0 && demoElapsedMs >= totalDemoDurationMs) {
    return {
      completedCycles: repetitions > 1 ? repetitions - 1 : completedCycles,
      countdownValue: 1,
      currentStepIndex: null,
      phase: 'demo',
    };
  }
  const repetitionIndex = Math.min(
    Math.max(0, repetitions - 1),
    demoDurationMs > 0 ? Math.floor(demoElapsedMs / demoDurationMs) : 0,
  );
  return {
    completedCycles: repetitions > 1 ? repetitionIndex : completedCycles,
    countdownValue: 1,
    currentStepIndex: stepCount > 0 ? Math.floor(demoElapsedMs / stepDurationMs) % stepCount : null,
    phase: 'demo',
  };
}

export function shouldHandlePlaybackEvent(
  activePlaybackId: number | null,
  eventPlaybackId: number,
): boolean {
  return activePlaybackId !== null && activePlaybackId === eventPlaybackId;
}

export function shouldHandleDetection(
  activeRecognitionId: number | null,
  detection: DetectionResult,
): boolean {
  return activeRecognitionId !== null && activeRecognitionId === detection.recognitionId;
}
