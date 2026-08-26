import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { initialize, BasicPitchError } from '@modules/basic-pitch';
import { prepareTrainingSessionDisplay, type PreparedTrainingSession } from '@/music-theory';
import { createLogger } from '@/utils/logger';
import { fetchDailyTrainingSession } from './training-session-api';

type TrainingSessionPhase = 'idle' | 'loading' | 'ready' | 'error';

export type PhraseStage = 'ideas' | 'chords' | 'rhythms';

export type TrainingLearningConfig = {
  bpm: number;
};

type TrainingSessionContextValue = {
  errorMessage: string;
  learningConfig: TrainingLearningConfig;
  phase: TrainingSessionPhase;
  prepareTrainingSession: () => Promise<void>;
  selectedPhraseStage: PhraseStage;
  selectedPhraseIndex: number;
  session: PreparedTrainingSession | null;
  setBpm: (bpm: number) => void;
  setSelectedPhraseStage: (stage: PhraseStage) => void;
  setSelectedPhraseIndex: (phraseIndex: number) => void;
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
  const [phase, setPhase] = useState<TrainingSessionPhase>('idle');
  const [selectedPhraseIndex, setSelectedPhraseIndex] = useState(0);
  const [selectedPhraseStage, setSelectedPhraseStage] = useState<PhraseStage>('ideas');
  const [session, setSession] = useState<PreparedTrainingSession | null>(null);

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

  const prepareTrainingSession = useCallback(async () => {
    setErrorMessage('');
    setPhase('loading');

    logger.info('Daily training preparation started.');

    try {
      const [, loadedSession] = await Promise.all([initialize(), fetchDailyTrainingSession()]);
      const preparedSession = prepareTrainingSessionDisplay(loadedSession);
      setSession(preparedSession);
      setSelectedPhraseIndex(0);
      setSelectedPhraseStage('ideas');
      setPhase('ready');
    } catch (error) {
      logger.error('Daily training preparation failed.', {
        error,
      });
      setErrorMessage(messageFor(error));
      setPhase('error');
    }
  }, []);

  const value = useMemo(
    () => ({
      errorMessage,
      learningConfig,
      phase,
      prepareTrainingSession,
      selectedPhraseStage,
      selectedPhraseIndex,
      session,
      setBpm,
      setSelectedPhraseStage,
      setSelectedPhraseIndex: selectPhrase,
    }),
    [
      errorMessage,
      learningConfig,
      phase,
      prepareTrainingSession,
      selectedPhraseStage,
      selectPhrase,
      selectedPhraseIndex,
      session,
      setBpm,
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
