import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  addPlaybackBarListener,
  addPlaybackFinishListener,
  playBand,
  playGroove,
  SoundFontPlayerError,
  stop,
  type BandSoundFontPlaybackConfiguration,
  type GrooveSoundFontPlaybackConfiguration,
} from '@modules/sound-font-player';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import {
  createPlaybackClockAnchor,
  getClockedCurrentStepIndex,
  type PlaybackClockAnchor,
} from './performance-guidance-clock';
import {
  getSoundFontDemoDurationMs,
  getSoundFontPartCount,
  getSoundFontStepCount,
  shouldHandlePlaybackEvent,
  type PerformanceGuidancePhase,
  type PerformanceGuidanceStartPhase,
} from './performance-guidance-state';

type PerformanceGuidancePlayback =
  | {
      configuration: BandSoundFontPlaybackConfiguration | null;
      kind: 'band';
    }
  | {
      configuration: GrooveSoundFontPlaybackConfiguration | null;
      kind: 'groove';
    };

export type PerformanceGuidanceContextValue = {
  completedCycles: number;
  cycleCount: number;
  countdownValue: number;
  currentStepIndex: number | null;
  errorMessage: string;
  finishText: string;
  isDisabled: boolean;
  listeningEnabled: boolean;
  phase: PerformanceGuidancePhase;
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

const LEAD_IN_BEATS = 4;
const LISTENING_DURATION_MS = 3000;
const STEP_DURATION_BEATS = 0.25;
const BAR_DURATION_BEATS = 4;
const CLOCK_UPDATE_INTERVAL_MS = 50;
const silentClockSource = require('@assets/audio/silent-clock.wav') as number;

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
  const [phase, setPhase] = useState<PerformanceGuidancePhase>(startPhase);
  const [countdownValue, setCountdownValue] = useState(LEAD_IN_BEATS);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [finishMessageOverride, setFinishMessageOverride] = useState<string | null>(null);
  const clockPlayer = useAudioPlayer(silentClockSource, {
    keepAudioSessionActive: true,
    updateInterval: CLOCK_UPDATE_INTERVAL_MS,
  });
  const clockStatus = useAudioPlayerStatus(clockPlayer);
  const phaseRef = useRef<PerformanceGuidancePhase>(startPhase);
  const didAutoStartRef = useRef(false);
  const playbackIdRef = useRef<number | null>(null);
  const clockAnchorRef = useRef<PlaybackClockAnchor | null>(null);
  const isHighlightActiveRef = useRef(false);
  const audioClockMsRef = useRef(0);
  const flowIdRef = useRef(0);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listeningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visualTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const partCount = getSoundFontPartCount(playback.configuration);
  const expectedStepCount = getSoundFontStepCount(playback.configuration);
  const totalCycleCount = demoListenCycleCount ?? cycleCount;
  const isDisabled = !playback.configuration || partCount === 0 || expectedStepCount === 0;

  const clearFinishTimer = useCallback(() => {
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
  }, []);

  const clearListeningTimer = useCallback(() => {
    if (listeningTimerRef.current) {
      clearTimeout(listeningTimerRef.current);
      listeningTimerRef.current = null;
    }
  }, []);

  const clearVisualTimers = useCallback(() => {
    visualTimerRefs.current.forEach((timer) => {
      clearTimeout(timer);
    });
    visualTimerRefs.current = [];
  }, []);

  const stopClock = useCallback(() => {
    clockAnchorRef.current = null;
    isHighlightActiveRef.current = false;
    safelyPauseClock(clockPlayer);
    void safelySeekClockToStart(clockPlayer);
  }, [clockPlayer]);

  const startClock = useCallback(async () => {
    clockAnchorRef.current = null;
    isHighlightActiveRef.current = false;
    safelyPauseClock(clockPlayer);
    await safelySeekClockToStart(clockPlayer);
    audioClockMsRef.current = 0;
    safelyPlayClock(clockPlayer);
  }, [clockPlayer]);

  const setPhaseValue = useCallback((nextPhase: PerformanceGuidancePhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const resetPlaybackMarkers = useCallback(() => {
    playbackIdRef.current = null;
    stopClock();
    setCurrentStepIndex(null);
  }, [stopClock]);

  const enterFinish = useCallback(
    (message?: string) => {
      clearFinishTimer();
      clearListeningTimer();
      clearVisualTimers();
      resetPlaybackMarkers();
      setFinishMessageOverride(message ?? null);
      setPhaseValue('finish');
      finishTimerRef.current = setTimeout(() => {
        onFinish();
      }, 3000);
    },
    [
      clearFinishTimer,
      clearListeningTimer,
      clearVisualTimers,
      onFinish,
      resetPlaybackMarkers,
      setPhaseValue,
    ],
  );

  const requestFinish = useCallback(
    (message?: string) => {
      flowIdRef.current += 1;
      void stop();
      enterFinish(message);
    },
    [enterFinish],
  );

  const requestSkip = useCallback(() => {
    clearFinishTimer();
    clearListeningTimer();
    clearVisualTimers();
    flowIdRef.current += 1;
    void stop();
    resetPlaybackMarkers();
    onSkip();
  }, [clearFinishTimer, clearListeningTimer, clearVisualTimers, onSkip, resetPlaybackMarkers]);

  const reset = useCallback(() => {
    clearFinishTimer();
    clearListeningTimer();
    clearVisualTimers();
    flowIdRef.current += 1;
    void stop();
    resetPlaybackMarkers();
    setCountdownValue(LEAD_IN_BEATS);
    setCompletedCycles(0);
    setErrorMessage('');
    setFinishMessageOverride(null);
    setPhaseValue('pending');
  }, [
    clearFinishTimer,
    clearListeningTimer,
    clearVisualTimers,
    resetPlaybackMarkers,
    setPhaseValue,
  ]);

  const scheduleVisualTimer = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      visualTimerRefs.current = visualTimerRefs.current.filter((entry) => entry !== timer);
      callback();
    }, delay);
    visualTimerRefs.current.push(timer);
  }, []);

  const startHighlighting = useCallback(
    (flowId: number, beatDurationMs: number) => {
      if (flowIdRef.current !== flowId || phaseRef.current !== 'demo') {
        return;
      }

      const anchor: PlaybackClockAnchor = {
        audioClockMsAtReceipt: audioClockMsRef.current,
        userPlaybackPositionMsAtReceipt: 0,
      };
      clockAnchorRef.current = anchor;
      isHighlightActiveRef.current = true;

      const stepIndex = getClockedCurrentStepIndex({
        anchor,
        audioClockMs: audioClockMsRef.current,
        expectedStepCount,
        stepDurationMs: STEP_DURATION_BEATS * beatDurationMs,
      });
      setCurrentStepIndex(stepIndex);
    },
    [expectedStepCount],
  );

  const stopHighlighting = useCallback((flowId: number) => {
    if (flowIdRef.current !== flowId) {
      return;
    }

    clockAnchorRef.current = null;
    isHighlightActiveRef.current = false;
    setCurrentStepIndex(null);
  }, []);

  const startDemoPlayback = useCallback(
    async ({ flowId, leadIn }: { flowId: number; leadIn: boolean }) => {
      if (!playback.configuration || isDisabled) {
        return;
      }

      clearVisualTimers();
      setCurrentStepIndex(null);
      setCountdownValue(LEAD_IN_BEATS);
      setPhaseValue(leadIn ? 'prepare' : 'demo');

      try {
        const cycles = listeningEnabled ? 1 : totalCycleCount;
        await startClock();
        const result =
          playback.kind === 'band'
            ? await playBand(playback.configuration as BandSoundFontPlaybackConfiguration, {
                cycles,
                leadIn,
              })
            : await playGroove(playback.configuration as GrooveSoundFontPlaybackConfiguration, {
                cycles,
                leadIn,
              });

        if (flowIdRef.current !== flowId) {
          return;
        }

        playbackIdRef.current = result.playbackId;

        const beatDurationMs = 60_000 / playback.configuration.bpm;
        const demoDurationMs = getSoundFontDemoDurationMs(playback.configuration);
        const demoStartDelayMs = leadIn ? LEAD_IN_BEATS * beatDurationMs : 0;
        const activeDemoDurationMs = cycles * demoDurationMs;

        if (leadIn) {
          for (let beatIndex = 1; beatIndex < LEAD_IN_BEATS; beatIndex += 1) {
            scheduleVisualTimer(() => {
              if (flowIdRef.current === flowId && phaseRef.current === 'prepare') {
                setCountdownValue(LEAD_IN_BEATS - beatIndex);
              }
            }, beatIndex * beatDurationMs);
          }
          scheduleVisualTimer(() => {
            if (flowIdRef.current === flowId && phaseRef.current === 'prepare') {
              setPhaseValue('demo');
              startHighlighting(flowId, beatDurationMs);
            }
          }, demoStartDelayMs);
        } else {
          startHighlighting(flowId, beatDurationMs);
        }

        scheduleVisualTimer(() => {
          stopHighlighting(flowId);
        }, demoStartDelayMs + activeDemoDurationMs);

        if (!listeningEnabled) {
          for (let cycleIndex = 1; cycleIndex < totalCycleCount; cycleIndex += 1) {
            scheduleVisualTimer(
              () => {
                if (flowIdRef.current === flowId && phaseRef.current === 'demo') {
                  setCompletedCycles(cycleIndex);
                }
              },
              demoStartDelayMs + cycleIndex * demoDurationMs,
            );
          }
        }
      } catch (error) {
        if (flowIdRef.current !== flowId) {
          return;
        }

        clearVisualTimers();
        resetPlaybackMarkers();
        setPhaseValue('pending');
        setErrorMessage(messageFor(error));
      }
    },
    [
      clearVisualTimers,
      isDisabled,
      listeningEnabled,
      playback,
      resetPlaybackMarkers,
      scheduleVisualTimer,
      setPhaseValue,
      startClock,
      startHighlighting,
      stopHighlighting,
      totalCycleCount,
    ],
  );

  const startPrepare = useCallback(() => {
    if (!playback.configuration || isDisabled) {
      return;
    }

    flowIdRef.current += 1;
    const flowId = flowIdRef.current;
    clearFinishTimer();
    clearListeningTimer();
    setErrorMessage('');
    setCompletedCycles(0);
    resetPlaybackMarkers();
    void startDemoPlayback({ flowId, leadIn: true });
  }, [
    clearFinishTimer,
    clearListeningTimer,
    isDisabled,
    playback.configuration,
    resetPlaybackMarkers,
    startDemoPlayback,
  ]);

  useEffect(() => {
    audioClockMsRef.current = clockStatus.currentTime * 1000;
  }, [clockStatus.currentTime]);

  useEffect(() => {
    const playbackBarSubscription = addPlaybackBarListener((event) => {
      if (!shouldHandlePlaybackEvent(playbackIdRef.current, event.playbackId)) {
        return;
      }

      if (phaseRef.current !== 'demo' || !isHighlightActiveRef.current) {
        return;
      }

      const beatDurationMs = 60_000 / event.bpm;
      const barDurationMs = BAR_DURATION_BEATS * beatDurationMs;
      const anchor = createPlaybackClockAnchor({
        audioClockMs: audioClockMsRef.current,
        barDurationMs,
        event,
        receivedAtMs: Date.now(),
      });
      clockAnchorRef.current = anchor;

      const stepIndex = getClockedCurrentStepIndex({
        anchor,
        audioClockMs: audioClockMsRef.current,
        expectedStepCount,
        stepDurationMs: STEP_DURATION_BEATS * beatDurationMs,
      });
      setCurrentStepIndex(stepIndex);
    });

    return () => {
      playbackBarSubscription.remove();
    };
  }, [expectedStepCount]);

  useEffect(() => {
    if (
      phase !== 'demo' ||
      !playback.configuration ||
      !clockAnchorRef.current ||
      !isHighlightActiveRef.current
    ) {
      return;
    }

    const beatDurationMs = 60_000 / playback.configuration.bpm;
    const stepIndex = getClockedCurrentStepIndex({
      anchor: clockAnchorRef.current,
      audioClockMs: clockStatus.currentTime * 1000,
      expectedStepCount,
      stepDurationMs: STEP_DURATION_BEATS * beatDurationMs,
    });
    setCurrentStepIndex((currentStepIndex) =>
      currentStepIndex === stepIndex ? currentStepIndex : stepIndex,
    );
  }, [clockStatus.currentTime, expectedStepCount, phase, playback.configuration]);

  useEffect(() => {
    const playbackFinishSubscription = addPlaybackFinishListener((event) => {
      if (!shouldHandlePlaybackEvent(playbackIdRef.current, event.playbackId)) {
        return;
      }

      const flowId = flowIdRef.current;
      setCurrentStepIndex(null);
      clearVisualTimers();
      stopClock();

      if (!listeningEnabled) {
        setCompletedCycles(event.completedCycles);
        enterFinish();
        return;
      }

      setPhaseValue('listening');
      clearListeningTimer();
      listeningTimerRef.current = setTimeout(() => {
        listeningTimerRef.current = null;
        if (flowIdRef.current !== flowId) {
          return;
        }

        const nextCompletedCycles = completedCycles + 1;
        setCompletedCycles(nextCompletedCycles);

        if (nextCompletedCycles >= totalCycleCount) {
          enterFinish();
          return;
        }

        void startDemoPlayback({ flowId, leadIn: false });
      }, LISTENING_DURATION_MS);
    });

    return () => {
      playbackFinishSubscription.remove();
    };
  }, [
    clearListeningTimer,
    clearVisualTimers,
    completedCycles,
    enterFinish,
    listeningEnabled,
    setPhaseValue,
    startDemoPlayback,
    stopClock,
    totalCycleCount,
  ]);

  useEffect(() => {
    if (startPhase !== 'prepare' || !didAutoStartRef.current || !playback.configuration) {
      return;
    }

    flowIdRef.current += 1;
    const flowId = flowIdRef.current;
    clearFinishTimer();
    clearListeningTimer();
    setErrorMessage('');
    setCompletedCycles(0);
    resetPlaybackMarkers();
    void stop();
    void startDemoPlayback({ flowId, leadIn: true });
  }, [
    clearFinishTimer,
    clearListeningTimer,
    playback.configuration,
    resetPlaybackMarkers,
    startDemoPlayback,
    startPhase,
  ]);

  useEffect(() => {
    if (startPhase !== 'prepare' || didAutoStartRef.current) {
      return;
    }

    didAutoStartRef.current = true;
    startPrepare();
  }, [startPhase, startPrepare]);

  useEffect(
    () => () => {
      clearFinishTimer();
      clearListeningTimer();
      clearVisualTimers();
      stopClock();
      void stop();
    },
    [clearFinishTimer, clearListeningTimer, clearVisualTimers, stopClock],
  );

  const value = useMemo<PerformanceGuidanceContextValue>(
    () => ({
      completedCycles,
      cycleCount: totalCycleCount,
      countdownValue,
      currentStepIndex,
      errorMessage,
      finishText: finishMessageOverride ?? finishText,
      isDisabled,
      listeningEnabled,
      phase,
      requestFinish,
      requestSkip,
      reset,
      start: startPrepare,
    }),
    [
      completedCycles,
      totalCycleCount,
      countdownValue,
      currentStepIndex,
      errorMessage,
      finishMessageOverride,
      finishText,
      isDisabled,
      listeningEnabled,
      phase,
      requestFinish,
      requestSkip,
      reset,
      startPrepare,
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

function messageFor(error: unknown) {
  if (error instanceof SoundFontPlayerError) {
    if (__DEV__ && error.nativeMessage) {
      return `${error.message} ${error.nativeMessage}`;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Playback failed.';
}

type ExpoAudioClockPlayer = {
  pause(): void;
  play(): void;
  seekTo(seconds: number): Promise<void>;
};

function safelyPauseClock(clockPlayer: ExpoAudioClockPlayer) {
  try {
    clockPlayer.pause();
  } catch {
    // Expo Audio may release its native shared object before React cleanup runs.
  }
}

function safelyPlayClock(clockPlayer: ExpoAudioClockPlayer) {
  try {
    clockPlayer.play();
  } catch {
    // SoundFont playback still runs; native bar events can continue to recalibrate on restart.
  }
}

async function safelySeekClockToStart(clockPlayer: ExpoAudioClockPlayer) {
  try {
    await clockPlayer.seekTo(0);
  } catch {
    // Ignore released-player cleanup failures from Expo Audio.
  }
}
