import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { initialize, BasicPitchError } from '../../modules/basic-pitch';
import { prepareTrainingSessionDisplay, type PreparedTrainingSession } from '@/music-theory';
import { fetchDailyTrainingSession } from './training-session-api';

type TrainingSessionPhase = 'idle' | 'loading' | 'ready' | 'error';

type TrainingSessionContextValue = {
  errorMessage: string;
  phase: TrainingSessionPhase;
  prepareTrainingSession: () => Promise<void>;
  session: PreparedTrainingSession | null;
};

const TrainingSessionContext = createContext<TrainingSessionContextValue | null>(null);

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
  const [phase, setPhase] = useState<TrainingSessionPhase>('idle');
  const [session, setSession] = useState<PreparedTrainingSession | null>(null);

  const prepareTrainingSession = useCallback(async () => {
    setErrorMessage('');
    setPhase('loading');
    const startedAt = performance.now();

    console.info('Daily training preparation started.');

    try {
      const [, loadedSession] = await Promise.all([initialize(), fetchDailyTrainingSession()]);
      const preparedSession = prepareTrainingSessionDisplay(loadedSession);
      setSession(preparedSession);
      setPhase('ready');
      console.info('Daily training preparation completed.', {
        chordRoot: preparedSession.chord.root,
        durationMs: Math.round(performance.now() - startedAt),
        rhythmSteps: preparedSession.rhythm.pattern.length,
      });
    } catch (error) {
      console.error('Daily training preparation failed.', {
        durationMs: Math.round(performance.now() - startedAt),
        error,
      });
      setErrorMessage(messageFor(error));
      setPhase('error');
    }
  }, []);

  const value = useMemo(
    () => ({
      errorMessage,
      phase,
      prepareTrainingSession,
      session,
    }),
    [errorMessage, phase, prepareTrainingSession, session],
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
