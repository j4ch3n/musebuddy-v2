import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { initialize, BasicPitchError } from '@modules/basic-pitch';
import { prepareTrainingSessionDisplay, type PreparedTrainingSession } from '@/music-theory';
import { createLogger } from '@/utils/logger';
import { fetchDailyTrainingSession } from './training-session-api';

type TrainingSessionPhase = 'loading' | 'ready' | 'error';

export type TrainingDetailTab =
  | { chordIndex: number; kind: 'chord' }
  | { kind: 'rhythm'; staff: 'bass' | 'treble' };
export type TrainingSessionView = 'bar-details' | 'sheet';

export type TrainingLearningConfig = {
  bpm: number;
};

type TrainingSessionContextValue = {
  errorMessage: string;
  learningConfig: TrainingLearningConfig;
  phase: TrainingSessionPhase;
  prepareTrainingSession: () => Promise<void>;
  selectedDetailTab: TrainingDetailTab | null;
  selectedPhraseIndex: number;
  session: PreparedTrainingSession | null;
  setBpm: (bpm: number) => void;
  openBarDetails: (barIndex: number, tab: TrainingDetailTab) => void;
  resetTrainingSession: () => void;
  setSelectedPhraseIndex: (phraseIndex: number) => void;
  showSheet: () => void;
  view: TrainingSessionView;
};

const TrainingSessionContext = createContext<TrainingSessionContextValue | null>(null);
const logger = createLogger('TrainingSession');
const DEFAULT_LEARNING_CONFIG: TrainingLearningConfig = {
  bpm: 96,
};

type TrainingSessionProviderProps = {
  children: ReactNode;
};

function messageFor(error: unknown) {
  if (error instanceof BasicPitchError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Training material could not be loaded.';
}

export function TrainingSessionProvider({ children }: TrainingSessionProviderProps) {
  const [errorMessage, setErrorMessage] = useState('');
  const [learningConfig, setLearningConfig] =
    useState<TrainingLearningConfig>(DEFAULT_LEARNING_CONFIG);
  const [phase, setPhase] = useState<TrainingSessionPhase>('loading');
  const [selectedPhraseIndex, setSelectedPhraseIndex] = useState(0);
  const [selectedDetailTab, setSelectedDetailTab] = useState<TrainingDetailTab | null>(null);
  const [session, setSession] = useState<PreparedTrainingSession | null>(null);
  const [view, setView] = useState<TrainingSessionView>('sheet');

  const setBpm = useCallback((bpm: number) => {
    setLearningConfig((currentConfig) => ({
      ...currentConfig,
      bpm,
    }));
  }, []);

  const selectPhrase = useCallback(
    (phraseIndex: number) => {
      const highestPhraseIndex = Math.max((session?.bars.length ?? 1) - 1, 0);
      setSelectedPhraseIndex(Math.max(0, Math.min(phraseIndex, highestPhraseIndex)));
    },
    [session],
  );

  const openBarDetails = useCallback(
    (barIndex: number, tab: TrainingDetailTab) => {
      selectPhrase(barIndex);
      setSelectedDetailTab(tab);
      setView('bar-details');
    },
    [selectPhrase],
  );

  const showSheet = useCallback(() => setView('sheet'), []);

  const resetTrainingSession = useCallback(() => {
    setErrorMessage('');
    setLearningConfig(DEFAULT_LEARNING_CONFIG);
    setSelectedPhraseIndex(0);
    setSelectedDetailTab(null);
    setView('sheet');
  }, []);

  const prepareTrainingSession = useCallback(async () => {
    setErrorMessage('');
    setPhase('loading');

    logger.info('Daily training preparation started.');

    try {
      const [, loadedSession] = await Promise.all([initialize(), fetchDailyTrainingSession()]);
      const preparedSession = prepareTrainingSessionDisplay(loadedSession);
      setSession(preparedSession);
      setSelectedPhraseIndex(0);
      setSelectedDetailTab(null);
      setView('sheet');
      setPhase('ready');
    } catch (error) {
      logger.error('Daily training preparation failed.', {
        error,
      });
      setErrorMessage(messageFor(error));
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    const initialAttempt = setTimeout(() => {
      void prepareTrainingSession();
    }, 0);

    return () => clearTimeout(initialAttempt);
  }, [prepareTrainingSession]);

  useEffect(() => {
    if (phase !== 'error') return;

    const retryTimer = setTimeout(() => {
      void prepareTrainingSession();
    }, 10_000);

    return () => clearTimeout(retryTimer);
  }, [phase, prepareTrainingSession]);

  const value = useMemo(
    () => ({
      errorMessage,
      learningConfig,
      phase,
      prepareTrainingSession,
      openBarDetails,
      resetTrainingSession,
      selectedDetailTab,
      selectedPhraseIndex,
      session,
      setBpm,
      setSelectedPhraseIndex: selectPhrase,
      showSheet,
      view,
    }),
    [
      errorMessage,
      learningConfig,
      phase,
      prepareTrainingSession,
      openBarDetails,
      resetTrainingSession,
      selectedDetailTab,
      selectPhrase,
      selectedPhraseIndex,
      session,
      setBpm,
      showSheet,
      view,
    ],
  );

  return (
    <TrainingSessionContext.Provider value={value}>{children}</TrainingSessionContext.Provider>
  );
}

export function useTrainingSession() {
  const context = useContext(TrainingSessionContext);

  if (!context) {
    throw new Error('useTrainingSession must be used within TrainingSessionProvider.');
  }

  return context;
}
