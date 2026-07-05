import type { TrainingSession } from '@/contexts/training-session-schema';

import { buildChordDisplay, type ChordDisplay } from './chord-display';

export type PreparedTrainingSession = TrainingSession & {
  chordDisplay: ChordDisplay;
};

export function prepareTrainingSessionDisplay(session: TrainingSession): PreparedTrainingSession {
  return {
    ...session,
    chordDisplay: buildChordDisplay(session.chord),
  };
}

export type { ChordDisplay, ChordDisplayNote, ChordDisplayToken } from './chord-display';
