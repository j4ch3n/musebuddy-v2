import type {
  TrainingSession,
  TrainingSessionKeyArrangement,
  TrainingSessionRhythm,
} from '@/contexts/training-session-schema';

import { buildChordDisplay, type ChordDisplay } from './chord-display';
import { deriveRhythmFromKeyArrangement } from './rhythm-arrangement';

export type PreparedTrainingSession = {
  chordDisplays: ChordDisplay[];
  keyArrangement: TrainingSessionKeyArrangement;
  rhythm: TrainingSessionRhythm;
};

export function prepareTrainingSessionDisplay(session: TrainingSession): PreparedTrainingSession {
  return {
    chordDisplays: session.chords.map((chord) => buildChordDisplay(chord)),
    keyArrangement: session.keyArrangement,
    rhythm: deriveRhythmFromKeyArrangement(session.keyArrangement),
  };
}

export type { ChordDisplay, ChordDisplayNote, ChordDisplayToken } from './chord-display';
