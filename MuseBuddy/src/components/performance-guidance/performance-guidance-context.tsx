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
  addCycleRepeatListener,
  addDemoFinishListener,
  addLeadInFinishListener,
  addStepListener,
  addTickListener,
  playBand,
  playGroove,
  SoundFontPlayerError,
  stop,
  type BandSoundFontPlaybackConfiguration,
  type GrooveSoundFontPlaybackConfiguration,
  type SoundFontPlaybackConfiguration,
  type SoundFontStepEvent,
} from '@modules/sound-font-player';

import {
  getPhaseAfterCycleRepeat,
  getPhaseAfterDemoFinish,
  getSoundFontPartCount,
  getSoundFontStepCount,
  type PerformanceGuidancePhase,
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
  start: () => void;
};

type PerformanceGuidanceProviderProps = {
  children: ReactNode;
  cycleCount?: number;
  finishText: string;
  listeningEnabled?: boolean;
  onFinish: () => void;
  onSkip: () => void;
  playback: PerformanceGuidancePlayback;
};

const LEAD_IN_BEATS = 4;

const PerformanceGuidanceContext = createContext<PerformanceGuidanceContextValue | null>(null);

export function PerformanceGuidanceProvider({
  children,
  cycleCount = 3,
  finishText,
  listeningEnabled = true,
  onFinish,
  onSkip,
  playback,
}: PerformanceGuidanceProviderProps) {
  const [phase, setPhase] = useState<PerformanceGuidancePhase>('pending');
  const [countdownValue, setCountdownValue] = useState(LEAD_IN_BEATS);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [finishMessageOverride, setFinishMessageOverride] = useState<string | null>(null);
  const phaseRef = useRef<PerformanceGuidancePhase>('pending');
  const playbackIdRef = useRef<number | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const partCount = getSoundFontPartCount(playback.configuration);
  const expectedStepCount = getSoundFontStepCount(playback.configuration);
  const isDisabled = !playback.configuration || partCount === 0 || expectedStepCount === 0;

  const clearFinishTimer = useCallback(() => {
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
  }, []);

  const setPhaseValue = useCallback((nextPhase: PerformanceGuidancePhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const resetPlaybackMarkers = useCallback(() => {
    playbackIdRef.current = null;
    setCurrentStepIndex(null);
  }, []);

  const enterFinish = useCallback(
    (message?: string) => {
      clearFinishTimer();
      resetPlaybackMarkers();
      setFinishMessageOverride(message ?? null);
      setPhaseValue('finish');
      finishTimerRef.current = setTimeout(() => {
        onFinish();
      }, 3000);
    },
    [clearFinishTimer, onFinish, resetPlaybackMarkers, setPhaseValue],
  );

  const requestFinish = useCallback(
    (message?: string) => {
      void stop();
      enterFinish(message);
    },
    [enterFinish],
  );

  const requestSkip = useCallback(() => {
    clearFinishTimer();
    void stop();
    resetPlaybackMarkers();
    onSkip();
  }, [clearFinishTimer, onSkip, resetPlaybackMarkers]);

  const startPrepare = useCallback(async () => {
    if (!playback.configuration || isDisabled) {
      return;
    }

    clearFinishTimer();
    setErrorMessage('');
    setCountdownValue(LEAD_IN_BEATS);
    resetPlaybackMarkers();
    setPhaseValue('prepare');

    try {
      const configuration = withCycleOptions(playback.configuration, {
        cycleCount,
        includesSilentPeriod: listeningEnabled,
      });

      if (playback.kind === 'band') {
        await playBand(configuration as BandSoundFontPlaybackConfiguration);
      } else {
        await playGroove(configuration as GrooveSoundFontPlaybackConfiguration);
      }
    } catch (error) {
      resetPlaybackMarkers();
      setPhaseValue('pending');
      setErrorMessage(messageFor(error));
    }
  }, [
    clearFinishTimer,
    cycleCount,
    isDisabled,
    listeningEnabled,
    playback,
    resetPlaybackMarkers,
    setPhaseValue,
  ]);

  const handleStep = useCallback(
    (event: SoundFontStepEvent) => {
      if (phaseRef.current !== 'demo') {
        return;
      }

      if (playbackIdRef.current !== null && event.playbackId !== playbackIdRef.current) {
        return;
      }

      if (playbackIdRef.current === null) {
        playbackIdRef.current = event.playbackId;
      }

      setCurrentStepIndex(event.stepIndex % Math.max(expectedStepCount, 1));
    },
    [expectedStepCount],
  );

  useEffect(() => {
    const cycleRepeatSubscription = addCycleRepeatListener((event) => {
      if (playbackIdRef.current !== null && event.playbackId !== playbackIdRef.current) {
        return;
      }

      if (playbackIdRef.current === null) {
        playbackIdRef.current = event.playbackId;
      }

      setCompletedCycles(event.completedCycleCount);

      setCurrentStepIndex(null);

      if (getPhaseAfterCycleRepeat(event.willRepeat) === 'finish') {
        enterFinish();
      } else {
        setPhaseValue('demo');
      }
    });
    const demoFinishSubscription = addDemoFinishListener((event) => {
      if (playbackIdRef.current !== null && event.playbackId !== playbackIdRef.current) {
        return;
      }

      if (playbackIdRef.current === null) {
        playbackIdRef.current = event.playbackId;
      }

      setCurrentStepIndex(null);

      setPhaseValue(getPhaseAfterDemoFinish(phaseRef.current, event.includesSilentPeriod));
    });
    const leadInSubscription = addLeadInFinishListener((event) => {
      if (phaseRef.current !== 'prepare') {
        return;
      }

      playbackIdRef.current = event.playbackId;

      if (phaseRef.current === 'prepare') {
        setPhaseValue('demo');
      }
    });
    const stepSubscription = addStepListener(handleStep);
    const tickSubscription = addTickListener((event) => {
      if (phaseRef.current !== 'prepare' || event.event !== 'beat') {
        return;
      }

      setCountdownValue(Math.max(1, LEAD_IN_BEATS - (event.beatIndex % LEAD_IN_BEATS)));
    });

    return () => {
      cycleRepeatSubscription.remove();
      demoFinishSubscription.remove();
      leadInSubscription.remove();
      stepSubscription.remove();
      tickSubscription.remove();
    };
  }, [enterFinish, handleStep, setPhaseValue]);

  useEffect(
    () => () => {
      clearFinishTimer();
      void stop();
    },
    [clearFinishTimer],
  );

  const value = useMemo<PerformanceGuidanceContextValue>(
    () => ({
      completedCycles,
      cycleCount,
      countdownValue,
      currentStepIndex,
      errorMessage,
      finishText: finishMessageOverride ?? finishText,
      isDisabled,
      listeningEnabled,
      phase,
      requestFinish,
      requestSkip,
      start: () => {
        void startPrepare();
      },
    }),
    [
      completedCycles,
      cycleCount,
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

function withCycleOptions<TInstrument extends string>(
  configuration: SoundFontPlaybackConfiguration<TInstrument>,
  options: Pick<SoundFontPlaybackConfiguration<TInstrument>, 'cycleCount' | 'includesSilentPeriod'>,
): SoundFontPlaybackConfiguration<TInstrument> {
  return {
    ...configuration,
    cycleCount: options.cycleCount,
    includesSilentPeriod: options.includesSilentPeriod,
  };
}
