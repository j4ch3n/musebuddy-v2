import type {
  TrainingSession,
  TrainingSessionChord,
  TrainingSessionRhythm,
} from '@/contexts/training-session-schema';

import { buildChordDisplay, type ChordDisplay } from './chord-display';
import { deriveRhythmFromKeyArrangement } from './rhythm-arrangement';

export type PreparedTrainingSession = {
  chord: TrainingSessionChord;
  chordDisplay: ChordDisplay;
  rhythm: TrainingSessionRhythm;
};

export function prepareTrainingSessionDisplay(session: TrainingSession): PreparedTrainingSession {
  return {
    chord: session.chord,
    chordDisplay: buildChordDisplay(session.chord),
    rhythm: deriveRhythmFromKeyArrangement(session.keyArrangement),
  };
}

export type { ChordDisplay, ChordDisplayNote, ChordDisplayToken } from './chord-display';
