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
  scoreChordChanges: ScoreChordChange[];
  score: TrainingSessionScore;
};

export type ScoreChordChange = {
  beatIndex: 0 | 1;
  measureIndex: number;
  symbol: string;
};

export function prepareTrainingSessionDisplay(session: TrainingSession): PreparedTrainingSession {
  const chordDisplays = session.chords.map((chord) => buildChordDisplay(chord));
  const chordDisplaysById = new Map(chordDisplays.map((display) => [display.idName, display]));

  return {
    chordDisplays,
    notes: session.notes.beats,
    rhythms: {
      bass: deriveRhythmFromPatternBeats(session.notes.beats, 'bass'),
      treble: deriveRhythmFromPatternBeats(session.notes.beats, 'treble'),
    },
    scoreChordChanges: session.notes.beats.map((beat) => {
      const display = chordDisplaysById.get(beat.chord);
      if (!display) {
        throw new Error(`Pattern beat references an unknown chord: ${beat.chord}`);
      }

      return {
        beatIndex: beat.beat_index,
        measureIndex: beat.bar_index,
        symbol: display.symbol,
      };
    }),
    score: session.score,
  };
}

export type { ChordDisplay, ChordDisplayNote, ChordDisplayToken } from './chord-display';
