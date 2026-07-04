import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { initialize, BasicPitchError } from '../../modules/basic-pitch';
import { fetchDailyTrainingSession } from './training-session-api';
import type { TrainingSession } from './training-session-schema';

type TrainingSessionPhase = 'idle' | 'loading' | 'ready' | 'error';

type TrainingSessionContextValue = {
  errorMessage: string;
  phase: TrainingSessionPhase;
  prepareTrainingSession: () => Promise<void>;
  session: TrainingSession | null;
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
  const [session, setSession] = useState<TrainingSession | null>(null);

  const prepareTrainingSession = useCallback(async () => {
    setErrorMessage('');
    setPhase('loading');
    const startedAt = performance.now();

    console.info('Daily training preparation started.');

    try {
      const [, loadedSession] = await Promise.all([initialize(), fetchDailyTrainingSession()]);
      setSession(loadedSession);
      setPhase('ready');
      console.info('Daily training preparation completed.', {
        barIndex: loadedSession.arrangement.barIndex,
        chordRoot: loadedSession.chord.root,
        durationMs: Math.round(performance.now() - startedAt),
        songId: loadedSession.arrangement.songId,
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
