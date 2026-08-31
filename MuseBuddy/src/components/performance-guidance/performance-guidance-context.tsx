import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { addDetectionFinishListener, BasicPitchError } from '@modules/basic-pitch';
import {
  addPlaybackFinishListener,
  SoundFontPlayerError,
  type SoundFontPlaybackConfiguration,
} from '@modules/sound-font-player';

import {
  createGuidanceState,
  getPlaybackClockState,
  getSoundFontPartCount,
  getSoundFontStepCount,
  guidanceReducer,
  shouldHandleDetection,
  shouldHandlePlaybackEvent,
  type GuidanceAction,
  type GuidanceState,
  type PerformanceGuidanceStartPhase,
} from './performance-guidance-state';
import { trainingAudioCoordinator } from './training-audio-coordinator';

type PerformanceGuidancePlayback =
  | {
      configuration: SoundFontPlaybackConfiguration | null;
      kind: 'groove' | 'piano';
    }
  | {
      configuration: null;
      kind: 'silent';
    };

export type PerformanceGuidanceListeningMode = { kind: 'none' } | { kind: 'basic-pitch' };

export type PerformanceGuidanceContextValue = GuidanceState & {
  completeListening: (outcome?: 'pass' | 'retry') => Promise<void>;
  cycleCount: number;
  finishDurationMs: number;
  finishText: string;
  isDisabled: boolean;
  listeningMode: PerformanceGuidanceListeningMode;
  primaryButtonLabel: string;
  requestFinish: (message?: string) => void;
  requestSkip: () => void;
  reset: () => void;
  start: () => void;
};

type PerformanceGuidanceProviderProps = {
  children: ReactNode;
  cycleCount?: number;
  finishDurationMs?: number;
  finishText: string;
  leadIn?: boolean;
  listeningMode: PerformanceGuidanceListeningMode;
  onFinish: () => void;
  onSkip: () => void;
  passiveRecognitionEnabled?: boolean;
  passiveRecognitionKey?: string;
  getPrimaryButtonLabel?: (
    state: Pick<
      GuidanceState,
      'completedCycles' | 'currentSegmentIndex' | 'isRetryingCurrentSegment' | 'phase'
    >,
  ) => string;
  playback: PerformanceGuidancePlayback;
  segmentConfigurations?: readonly SoundFontPlaybackConfiguration[];
  startPhase?: PerformanceGuidanceStartPhase;
};

const DEFAULT_FINISH_DURATION_MS = 1_500;
const DEFAULT_RETRY_DURATION_MS = 750;
const CLOCK_INTERVAL_MS = 30;
const RECOGNITION_OPTIONS = {
  detectionIntervalMs: 200,
  rollingWindowMs: 2_000,
} as const;

let nextOwnerId = 1;
const PerformanceGuidanceContext = createContext<PerformanceGuidanceContextValue | null>(null);

export function PerformanceGuidanceProvider({
  children,
  cycleCount = 3,
  finishDurationMs = DEFAULT_FINISH_DURATION_MS,
  finishText,
  leadIn = true,
  listeningMode,
  onFinish,
  onSkip,
  passiveRecognitionEnabled = false,
  passiveRecognitionKey,
  getPrimaryButtonLabel,
  playback,
  segmentConfigurations,
  startPhase = 'pending',
}: PerformanceGuidanceProviderProps) {
  const ownerIdRef = useRef(nextOwnerId++);
  const [state, reactDispatch] = useReducer(guidanceReducer, startPhase, createGuidanceState);
  const stateRef = useRef(state);
  const [finishMessageOverride, setFinishMessageOverride] = useState<string | null>(null);
  const playbackRef = useRef(playback);
  const segmentConfigurationsRef = useRef(segmentConfigurations);
  const listeningModeRef = useRef(listeningMode);
  const previousConfigurationRef = useRef(playback.configuration);
  const flowGenerationRef = useRef(0);
  const playbackIdRef = useRef<number | null>(null);
  const recognitionIdRef = useRef<number | null>(null);
  const passiveRecognitionAttemptKeyRef = useRef<string | null>(null);
  const completionInProgressRef = useRef(false);
  const internalSegmentTransitionRef = useRef(false);
  const clockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didAutoStartRef = useRef(false);
  const totalCycleCount = cycleCount;
  const configuration =
    segmentConfigurations?.[state.currentSegmentIndex] ?? playback.configuration;
  const isDisabled =
    playback.kind !== 'silent' &&
    (!configuration ||
      getSoundFontPartCount(configuration) === 0 ||
      getSoundFontStepCount(configuration) === 0);

  const dispatch = useCallback((action: GuidanceAction) => {
    stateRef.current = guidanceReducer(stateRef.current, action);
    reactDispatch(action);
  }, []);

  const clearClock = useCallback(() => {
    if (clockTimerRef.current) {
      clearInterval(clockTimerRef.current);
      clockTimerRef.current = null;
    }
  }, []);

  const clearFinishTimer = useCallback(() => {
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
  }, []);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const releaseAllAudio = useCallback(async () => {
    await trainingAudioCoordinator.release(ownerIdRef.current);
  }, []);

  const enterFinish = useCallback(
    (generation: number, message?: string) => {
      if (flowGenerationRef.current !== generation) {
        return;
      }
      clearClock();
      clearFinishTimer();
      playbackIdRef.current = null;
      recognitionIdRef.current = null;
      completionInProgressRef.current = false;
      setFinishMessageOverride(message ?? null);
      dispatch({ type: 'finish' });
      finishTimerRef.current = setTimeout(() => {
        finishTimerRef.current = null;
        if (flowGenerationRef.current !== generation) {
          return;
        }
        void trainingAudioCoordinator.release(ownerIdRef.current).finally(onFinish);
      }, finishDurationMs);
    },
    [clearClock, clearFinishTimer, dispatch, finishDurationMs, onFinish],
  );

  const startClock = useCallback(
    ({
      generation,
      leadIn,
      repetitions,
      startedAtMs,
    }: {
      generation: number;
      leadIn: boolean;
      repetitions: number;
      startedAtMs: number;
    }) => {
      clearClock();
      const update = () => {
        const currentConfiguration =
          segmentConfigurationsRef.current?.[stateRef.current.currentSegmentIndex] ??
          playbackRef.current.configuration;
        if (!currentConfiguration || flowGenerationRef.current !== generation) {
          clearClock();
          return;
        }
        const clockState = getPlaybackClockState({
          completedCycles: stateRef.current.completedCycles,
          configuration: currentConfiguration,
          leadIn,
          nowMs: Date.now(),
          repetitions,
          startedAtMs,
        });
        dispatch({ type: 'clock', ...clockState });
      };
      update();
      clockTimerRef.current = setInterval(update, CLOCK_INTERVAL_MS);
    },
    [clearClock, dispatch],
  );

  const startDemo = useCallback(
    async (generation: number, leadIn: boolean) => {
      const currentPlayback = playbackRef.current;
      const currentConfiguration =
        segmentConfigurationsRef.current?.[stateRef.current.currentSegmentIndex] ??
        currentPlayback.configuration;
      if (currentPlayback.kind === 'silent') {
        completionInProgressRef.current = false;
        dispatch({ type: 'demo' });
        return;
      }
      if (!currentConfiguration) {
        return;
      }

      clearClock();
      completionInProgressRef.current = false;
      dispatch(leadIn ? { type: 'prepare' } : { type: 'demo' });
      const mode = listeningModeRef.current;
      const repetitions = mode.kind === 'none' ? totalCycleCount : 1;
      try {
        const result = await trainingAudioCoordinator.play(
          ownerIdRef.current,
          currentPlayback.kind,
          currentConfiguration,
          {
            keepAudioSessionActive: false,
            leadIn,
            repetitions,
          },
        );
        if (flowGenerationRef.current !== generation) {
          await trainingAudioCoordinator.releasePlayback(ownerIdRef.current, result.playbackId);
          return;
        }
        playbackIdRef.current = result.playbackId;
        recognitionIdRef.current = null;
        startClock({ generation, leadIn, repetitions, startedAtMs: result.startedAtMs });
      } catch (error) {
        if (flowGenerationRef.current !== generation) {
          return;
        }
        clearClock();
        playbackIdRef.current = null;
        recognitionIdRef.current = null;
        dispatch({ type: 'pending', errorMessage: messageFor(error, 'Playback failed.') });
      }
    },
    [clearClock, dispatch, startClock, totalCycleCount],
  );

  const startRecognition = useCallback(
    async (generation: number) => {
      try {
        const result = await trainingAudioCoordinator.startRecognition(
          ownerIdRef.current,
          RECOGNITION_OPTIONS,
        );
        if (flowGenerationRef.current !== generation) {
          await trainingAudioCoordinator.releaseRecognition(
            ownerIdRef.current,
            result.recognitionId,
          );
          return;
        }
        recognitionIdRef.current = result.recognitionId;
        completionInProgressRef.current = false;
        dispatch({ type: 'listening' });
      } catch (error) {
        if (flowGenerationRef.current !== generation) {
          return;
        }
        recognitionIdRef.current = null;
        dispatch({
          type: 'pending',
          errorMessage: messageFor(error, 'Recognition could not start.'),
        });
      }
    },
    [dispatch],
  );

  const start = useCallback(() => {
    const currentPlayback = playbackRef.current;
    const currentConfiguration =
      segmentConfigurationsRef.current?.[stateRef.current.currentSegmentIndex] ??
      currentPlayback.configuration;
    if (
      currentPlayback.kind !== 'silent' &&
      (!currentConfiguration ||
        getSoundFontPartCount(currentConfiguration) === 0 ||
        getSoundFontStepCount(currentConfiguration) === 0)
    ) {
      return;
    }
    didAutoStartRef.current = true;
    flowGenerationRef.current += 1;
    const generation = flowGenerationRef.current;
    clearFinishTimer();
    setFinishMessageOverride(null);
    dispatch({ type: 'prepare', flowId: generation });
    void trainingAudioCoordinator
      .release(ownerIdRef.current)
      .then(() => {
        if (flowGenerationRef.current === generation) {
          void startDemo(generation, leadIn);
        }
      })
      .catch((error) => {
        if (flowGenerationRef.current === generation) {
          dispatch({
            type: 'pending',
            errorMessage: messageFor(error, 'Audio could not start.'),
          });
        }
      });
  }, [clearFinishTimer, dispatch, leadIn, startDemo]);

  const completeListening = useCallback(
    async (outcome: 'pass' | 'retry' = 'pass') => {
      const mode = listeningModeRef.current;
      const recognitionId = recognitionIdRef.current;
      if (
        stateRef.current.phase !== 'listening' ||
        mode.kind === 'none' ||
        (mode.kind === 'basic-pitch' && recognitionId === null) ||
        completionInProgressRef.current
      ) {
        return;
      }
      completionInProgressRef.current = true;
      const generation = flowGenerationRef.current;
      try {
        if (mode.kind === 'basic-pitch' && recognitionId !== null) {
          await trainingAudioCoordinator.releaseRecognition(ownerIdRef.current, recognitionId);
        }
        if (flowGenerationRef.current !== generation) {
          return;
        }
        recognitionIdRef.current = null;
        if (outcome === 'retry') {
          dispatch({ type: 'retry' });
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            if (flowGenerationRef.current === generation) {
              void startDemo(generation, false);
            }
          }, DEFAULT_RETRY_DURATION_MS);
          return;
        }
        const completedCycles = stateRef.current.completedCycles + 1;
        dispatch({ type: 'complete-cycle', completedCycles });
        if (completedCycles >= totalCycleCount) {
          const hasNextSegment =
            stateRef.current.currentSegmentIndex + 1 <
            (segmentConfigurationsRef.current?.length ?? 1);
          if (hasNextSegment) {
            internalSegmentTransitionRef.current = true;
            dispatch({ type: 'next-segment' });
            await startDemo(generation, false);
          } else {
            enterFinish(generation);
          }
        } else {
          await startDemo(generation, false);
        }
      } catch (error) {
        if (flowGenerationRef.current === generation) {
          recognitionIdRef.current = null;
          dispatch({ type: 'pending', errorMessage: messageFor(error, 'Recognition failed.') });
        }
      } finally {
        if (flowGenerationRef.current === generation) {
          completionInProgressRef.current = false;
        }
      }
    },
    [dispatch, enterFinish, startDemo, totalCycleCount],
  );

  const reset = useCallback(() => {
    flowGenerationRef.current += 1;
    clearClock();
    clearFinishTimer();
    clearRetryTimer();
    playbackIdRef.current = null;
    recognitionIdRef.current = null;
    completionInProgressRef.current = false;
    setFinishMessageOverride(null);
    dispatch({ type: 'pending', flowId: flowGenerationRef.current });
    void releaseAllAudio();
  }, [clearClock, clearFinishTimer, clearRetryTimer, dispatch, releaseAllAudio]);

  const requestSkip = useCallback(() => {
    flowGenerationRef.current += 1;
    clearClock();
    clearFinishTimer();
    clearRetryTimer();
    playbackIdRef.current = null;
    recognitionIdRef.current = null;
    dispatch({ type: 'pending', flowId: flowGenerationRef.current });
    void releaseAllAudio().finally(onSkip);
  }, [clearClock, clearFinishTimer, clearRetryTimer, dispatch, onSkip, releaseAllAudio]);

  const requestFinish = useCallback(
    (message?: string) => {
      flowGenerationRef.current += 1;
      const generation = flowGenerationRef.current;
      clearClock();
      clearRetryTimer();
      void releaseAllAudio().then(() => {
        enterFinish(generation, message);
      });
    },
    [clearClock, clearRetryTimer, enterFinish, releaseAllAudio],
  );

  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  useEffect(() => {
    segmentConfigurationsRef.current = segmentConfigurations;
  }, [segmentConfigurations]);

  useEffect(() => {
    listeningModeRef.current = listeningMode;
  }, [listeningMode]);

  useEffect(() => {
    const recognitionId = recognitionIdRef.current;
    const isPlaybackActive = state.phase === 'prepare' || state.phase === 'demo';
    if (!passiveRecognitionEnabled || isPlaybackActive || state.phase === 'finish') {
      if (!passiveRecognitionEnabled || state.phase === 'finish') {
        passiveRecognitionAttemptKeyRef.current = null;
      }
      if (recognitionId !== null) {
        recognitionIdRef.current = null;
        void trainingAudioCoordinator.releaseRecognition(ownerIdRef.current, recognitionId);
      }
      return;
    }
    if (recognitionId !== null) {
      return;
    }
    const recognitionKey = passiveRecognitionKey ?? 'default';
    if (passiveRecognitionAttemptKeyRef.current === recognitionKey) {
      return;
    }

    passiveRecognitionAttemptKeyRef.current = recognitionKey;
    flowGenerationRef.current += 1;
    const generation = flowGenerationRef.current;
    void trainingAudioCoordinator
      .release(ownerIdRef.current)
      .then(() => startRecognition(generation))
      .catch((error) => {
        if (flowGenerationRef.current === generation) {
          dispatch({
            type: 'pending',
            errorMessage: messageFor(error, 'Recognition could not start.'),
          });
        }
      });
  }, [dispatch, passiveRecognitionEnabled, passiveRecognitionKey, startRecognition, state.phase]);

  useEffect(() => {
    const playbackSubscription = addPlaybackFinishListener((event) => {
      if (!shouldHandlePlaybackEvent(playbackIdRef.current, event.playbackId)) {
        return;
      }
      const generation = flowGenerationRef.current;
      playbackIdRef.current = null;
      clearClock();
      void trainingAudioCoordinator
        .finishPlayback(ownerIdRef.current, event.playbackId)
        .then(() => {
          if (flowGenerationRef.current !== generation) {
            return;
          }
          const mode = listeningModeRef.current;
          if (mode.kind === 'basic-pitch') {
            void startRecognition(generation);
          } else {
            const hasNextSegment =
              stateRef.current.currentSegmentIndex + 1 <
              (segmentConfigurationsRef.current?.length ?? 1);
            if (hasNextSegment) {
              internalSegmentTransitionRef.current = true;
              dispatch({ type: 'complete-cycle', completedCycles: totalCycleCount });
              dispatch({ type: 'next-segment' });
              void startDemo(generation, false);
            } else {
              dispatch({ type: 'complete-cycle', completedCycles: totalCycleCount });
              enterFinish(generation);
            }
          }
        });
    });
    const detectionSubscription = addDetectionFinishListener((event) => {
      if (
        stateRef.current.phase !== 'listening' ||
        completionInProgressRef.current ||
        !shouldHandleDetection(recognitionIdRef.current, event)
      ) {
        return;
      }
      dispatch({ type: 'detection', detection: event });
    });
    return () => {
      playbackSubscription.remove();
      detectionSubscription.remove();
    };
  }, [clearClock, dispatch, enterFinish, startDemo, startRecognition, totalCycleCount]);

  useEffect(() => {
    const previousConfiguration = previousConfigurationRef.current;
    previousConfigurationRef.current = configuration;
    if (internalSegmentTransitionRef.current) {
      internalSegmentTransitionRef.current = false;
      return;
    }
    if (
      previousConfiguration === configuration ||
      (stateRef.current.phase !== 'prepare' && stateRef.current.phase !== 'demo')
    ) {
      return;
    }
    flowGenerationRef.current += 1;
    const generation = flowGenerationRef.current;
    clearClock();
    clearFinishTimer();
    playbackIdRef.current = null;
    recognitionIdRef.current = null;
    completionInProgressRef.current = false;
    dispatch({ type: 'prepare', flowId: generation });
    void trainingAudioCoordinator
      .release(ownerIdRef.current)
      .then(() => {
        if (flowGenerationRef.current === generation) {
          void startDemo(generation, leadIn);
        }
      })
      .catch((error) => {
        if (flowGenerationRef.current === generation) {
          dispatch({ type: 'pending', errorMessage: messageFor(error, 'Audio restart failed.') });
        }
      });
  }, [clearClock, clearFinishTimer, configuration, dispatch, leadIn, startDemo]);

  useEffect(() => {
    if (startPhase === 'prepare' && !didAutoStartRef.current) {
      didAutoStartRef.current = true;
      start();
    }
  }, [start, startPhase]);

  useEffect(
    () => () => {
      flowGenerationRef.current += 1;
      clearClock();
      clearFinishTimer();
      clearRetryTimer();
      void releaseAllAudio();
    },
    [clearClock, clearFinishTimer, clearRetryTimer, releaseAllAudio],
  );

  const value = useMemo<PerformanceGuidanceContextValue>(
    () => ({
      ...state,
      completeListening,
      cycleCount: totalCycleCount,
      finishDurationMs,
      finishText: finishMessageOverride ?? finishText,
      isDisabled,
      listeningMode,
      primaryButtonLabel:
        getPrimaryButtonLabel?.(state) ?? (state.phase === 'pending' ? 'Start' : 'Pause'),
      requestFinish,
      requestSkip,
      reset,
      start,
    }),
    [
      completeListening,
      finishMessageOverride,
      finishDurationMs,
      finishText,
      isDisabled,
      getPrimaryButtonLabel,
      listeningMode,
      requestFinish,
      requestSkip,
      reset,
      start,
      state,
      totalCycleCount,
    ],
  );

  return (
    <PerformanceGuidanceContext.Provider value={value}>
      {children}
    </PerformanceGuidanceContext.Provider>
  );
}

export function usePerformanceGuidance(): PerformanceGuidanceContextValue {
  const context = useContext(PerformanceGuidanceContext);
  if (!context) {
    throw new Error('usePerformanceGuidance must be used within PerformanceGuidanceProvider.');
  }
  return context;
}

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof SoundFontPlayerError || error instanceof BasicPitchError) {
    if (__DEV__ && error.nativeMessage) {
      return `${error.message} ${error.nativeMessage}`;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : fallback;
}
