import type {
  TrainingSession,
  TrainingSessionPatternBeat,
  TrainingSessionRhythm,
  TrainingSessionScore,
} from '@/contexts/training-session-schema';

import { buildChordDisplay, type ChordDisplay } from './chord-display';
import { deriveRhythmFromPatternBeats } from './rhythm-arrangement';

export type PreparedTrainingSession = {
  chordDisplays: ChordDisplay[];
  notes: readonly TrainingSessionPatternBeat[];
  rhythms: {
    bass: TrainingSessionRhythm;
    treble: TrainingSessionRhythm;
  };
  score: TrainingSessionScore;
};

export function prepareTrainingSessionDisplay(session: TrainingSession): PreparedTrainingSession {
  return {
    chordDisplays: session.chords.map((chord) => buildChordDisplay(chord)),
    notes: session.notes.beats,
    rhythms: {
      bass: deriveRhythmFromPatternBeats(session.notes.beats, 'bass'),
      treble: deriveRhythmFromPatternBeats(session.notes.beats, 'treble'),
    },
    score: session.score,
  };
}

export type { ChordDisplay, ChordDisplayNote, ChordDisplayToken } from './chord-display';
