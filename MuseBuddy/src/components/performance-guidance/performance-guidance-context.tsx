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

type PerformanceGuidancePlayback = {
  configuration: SoundFontPlaybackConfiguration | null;
  kind: 'groove' | 'piano';
};

export type PerformanceGuidanceContextValue = GuidanceState & {
  completeListening: () => Promise<void>;
  cycleCount: number;
  finishText: string;
  isDisabled: boolean;
  listeningEnabled: boolean;
  requestFinish: (message?: string) => void;
  requestSkip: () => void;
  reset: () => void;
  start: () => void;
};

type PerformanceGuidanceProviderProps = {
  children: ReactNode;
  cycleCount?: number;
  demoListenCycleCount?: number;
  finishText: string;
  listeningEnabled?: boolean;
  onFinish: () => void;
  onSkip: () => void;
  playback: PerformanceGuidancePlayback;
  startPhase?: PerformanceGuidanceStartPhase;
};

const FINISH_DURATION_MS = 3_000;
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
  demoListenCycleCount,
  finishText,
  listeningEnabled = true,
  onFinish,
  onSkip,
  playback,
  startPhase = 'pending',
}: PerformanceGuidanceProviderProps) {
  const ownerIdRef = useRef(nextOwnerId++);
  const [state, reactDispatch] = useReducer(guidanceReducer, startPhase, createGuidanceState);
  const stateRef = useRef(state);
  const [finishMessageOverride, setFinishMessageOverride] = useState<string | null>(null);
  const playbackRef = useRef(playback);
  const previousConfigurationRef = useRef(playback.configuration);
  const flowGenerationRef = useRef(0);
  const playbackIdRef = useRef<number | null>(null);
  const recognitionIdRef = useRef<number | null>(null);
  const completionInProgressRef = useRef(false);
  const clockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didAutoStartRef = useRef(false);
  const totalCycleCount = demoListenCycleCount ?? cycleCount;
  const configuration = playback.configuration;
  const isDisabled =
    !configuration ||
    getSoundFontPartCount(configuration) === 0 ||
    getSoundFontStepCount(configuration) === 0;

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
      }, FINISH_DURATION_MS);
    },
    [clearClock, clearFinishTimer, dispatch, onFinish],
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
        const currentConfiguration = playbackRef.current.configuration;
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
      if (!currentPlayback.configuration) {
        return;
      }

      clearClock();
      completionInProgressRef.current = false;
      dispatch(leadIn ? { type: 'prepare' } : { type: 'demo' });
      const repetitions = listeningEnabled ? 1 : totalCycleCount;
      try {
        const result = await trainingAudioCoordinator.play(
          ownerIdRef.current,
          currentPlayback.kind,
          currentPlayback.configuration,
          { leadIn, repetitions },
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
    [clearClock, dispatch, listeningEnabled, startClock, totalCycleCount],
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
    const currentConfiguration = playbackRef.current.configuration;
    if (
      !currentConfiguration ||
      getSoundFontPartCount(currentConfiguration) === 0 ||
      getSoundFontStepCount(currentConfiguration) === 0
    ) {
      return;
    }
    flowGenerationRef.current += 1;
    const generation = flowGenerationRef.current;
    clearFinishTimer();
    setFinishMessageOverride(null);
    dispatch({ type: 'prepare' });
    void trainingAudioCoordinator.release(ownerIdRef.current).then(() => {
      if (flowGenerationRef.current === generation) {
        void startDemo(generation, true);
      }
    });
  }, [clearFinishTimer, dispatch, startDemo]);

  const completeListening = useCallback(async () => {
    const recognitionId = recognitionIdRef.current;
    if (
      stateRef.current.phase !== 'listening' ||
      recognitionId === null ||
      completionInProgressRef.current
    ) {
      return;
    }
    completionInProgressRef.current = true;
    const generation = flowGenerationRef.current;
    try {
      await trainingAudioCoordinator.releaseRecognition(ownerIdRef.current, recognitionId);
      if (flowGenerationRef.current !== generation) {
        return;
      }
      recognitionIdRef.current = null;
      const completedCycles = stateRef.current.completedCycles + 1;
      dispatch({ type: 'complete-cycle', completedCycles });
      if (completedCycles >= totalCycleCount) {
        enterFinish(generation);
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
  }, [dispatch, enterFinish, startDemo, totalCycleCount]);

  const reset = useCallback(() => {
    flowGenerationRef.current += 1;
    clearClock();
    clearFinishTimer();
    playbackIdRef.current = null;
    recognitionIdRef.current = null;
    completionInProgressRef.current = false;
    setFinishMessageOverride(null);
    dispatch({ type: 'pending' });
    void trainingAudioCoordinator.release(ownerIdRef.current);
  }, [clearClock, clearFinishTimer, dispatch]);

  const requestSkip = useCallback(() => {
    flowGenerationRef.current += 1;
    clearClock();
    clearFinishTimer();
    playbackIdRef.current = null;
    recognitionIdRef.current = null;
    dispatch({ type: 'pending' });
    void trainingAudioCoordinator.release(ownerIdRef.current).finally(onSkip);
  }, [clearClock, clearFinishTimer, dispatch, onSkip]);

  const requestFinish = useCallback(
    (message?: string) => {
      flowGenerationRef.current += 1;
      const generation = flowGenerationRef.current;
      clearClock();
      void trainingAudioCoordinator.release(ownerIdRef.current).then(() => {
        enterFinish(generation, message);
      });
    },
    [clearClock, enterFinish],
  );

  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

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
          if (listeningEnabled) {
            void startRecognition(generation);
          } else {
            dispatch({ type: 'complete-cycle', completedCycles: totalCycleCount });
            enterFinish(generation);
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
  }, [clearClock, dispatch, enterFinish, listeningEnabled, startRecognition, totalCycleCount]);

  useEffect(() => {
    const previousConfiguration = previousConfigurationRef.current;
    previousConfigurationRef.current = configuration;
    if (previousConfiguration === configuration || stateRef.current.phase === 'pending') {
      return;
    }
    if (stateRef.current.phase === 'finish') {
      return;
    }

    flowGenerationRef.current += 1;
    const generation = flowGenerationRef.current;
    clearClock();
    clearFinishTimer();
    playbackIdRef.current = null;
    recognitionIdRef.current = null;
    completionInProgressRef.current = false;
    dispatch({ type: 'prepare' });
    void trainingAudioCoordinator.release(ownerIdRef.current).then(() => {
      if (flowGenerationRef.current === generation) {
        void startDemo(generation, true);
      }
    });
  }, [clearClock, clearFinishTimer, configuration, dispatch, startDemo]);

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
      void trainingAudioCoordinator.release(ownerIdRef.current);
    },
    [clearClock, clearFinishTimer],
  );

  const value = useMemo<PerformanceGuidanceContextValue>(
    () => ({
      ...state,
      completeListening,
      cycleCount: totalCycleCount,
      finishText: finishMessageOverride ?? finishText,
      isDisabled,
      listeningEnabled,
      requestFinish,
      requestSkip,
      reset,
      start,
    }),
    [
      completeListening,
      finishMessageOverride,
      finishText,
      isDisabled,
      listeningEnabled,
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
