import type {
  TrainingSession,
  TrainingSessionPatternBeat,
  TrainingSessionRhythm,
  TrainingSessionScore,
} from '@/contexts/training-session-schema';

import { buildChordDisplay, type ChordDisplay } from './chord-display';
import { deriveRhythmFromPatternBeats } from './rhythm-arrangement';

export type PreparedTrainingSession = {
  bars: readonly PreparedTrainingBar[];
  chordDisplays: ChordDisplay[];
  notes: readonly TrainingSessionPatternBeat[];
  rhythms: {
    bass: TrainingSessionRhythm;
    treble: TrainingSessionRhythm;
  };
  scoreChordChanges: ScoreChordChange[];
  score: TrainingSessionScore;
};

export type PreparedTrainingBar = {
  beats: readonly [TrainingSessionPatternBeat, TrainingSessionPatternBeat];
  chordDisplays: readonly ChordDisplay[];
  chordChanges: readonly ScoreChordChange[];
  index: number;
  rhythms: {
    bass: TrainingSessionRhythm;
    treble: TrainingSessionRhythm;
  };
  score: TrainingSessionScore;
};

export type ScoreChordChange = {
  beatIndex: 0 | 1;
  chordId: string;
  measureIndex: number;
  symbol: string;
};

export function prepareTrainingSessionDisplay(session: TrainingSession): PreparedTrainingSession {
  const chordDisplays = session.chords.map((chord) => buildChordDisplay(chord));
  const chordDisplaysById = new Map(chordDisplays.map((display) => [display.idName, display]));

  const scoreChordChanges = session.notes.beats.reduce<ScoreChordChange[]>(
    (changes, beat, index) => {
      const display = chordDisplaysById.get(beat.chord);
      if (!display) {
        throw new Error(`Pattern beat references an unknown chord: ${beat.chord}`);
      }

      const previousBeat = session.notes.beats[index - 1];
      const repeatsPreviousChordInBar =
        previousBeat?.bar_index === beat.bar_index && previousBeat.chord === beat.chord;

      if (!repeatsPreviousChordInBar) {
        changes.push({
          beatIndex: beat.beat_index,
          chordId: display.idName,
          measureIndex: beat.bar_index,
          symbol: display.symbol,
        });
      }

      return changes;
    },
    [],
  );

  return {
    bars: session.score.measures.map((measure) =>
      prepareTrainingBar({
        chordDisplaysById,
        measure,
        score: session.score,
        scoreChordChanges,
        session,
      }),
    ),
    chordDisplays,
    notes: session.notes.beats,
    rhythms: {
      bass: deriveRhythmFromPatternBeats(session.notes.beats, 'bass'),
      treble: deriveRhythmFromPatternBeats(session.notes.beats, 'treble'),
    },
    scoreChordChanges,
    score: session.score,
  };
}

function prepareTrainingBar({
  chordDisplaysById,
  measure,
  score,
  scoreChordChanges,
  session,
}: {
  chordDisplaysById: ReadonlyMap<string, ChordDisplay>;
  measure: TrainingSessionScore['measures'][number];
  score: TrainingSessionScore;
  scoreChordChanges: readonly ScoreChordChange[];
  session: TrainingSession;
}): PreparedTrainingBar {
  const beats = session.notes.beats.filter((beat) => beat.bar_index === measure.index);
  const [firstBeat, secondBeat] = beats;
  if (
    beats.length !== 2 ||
    !firstBeat ||
    !secondBeat ||
    firstBeat.beat_index !== 0 ||
    secondBeat.beat_index !== 1
  ) {
    throw new Error(`Bar ${measure.index + 1} must contain exactly two ordered beats.`);
  }
  const chordChanges = scoreChordChanges.filter((change) => change.measureIndex === measure.index);
  const chordDisplays = chordChanges.map((change) => {
    const display = chordDisplaysById.get(change.chordId);
    if (!display) {
      throw new Error(`Bar ${measure.index + 1} references a chord that is not available.`);
    }
    return display;
  });
  const eventIds = new Set(
    ['treble', 'bass'].flatMap((staff) =>
      measure.staves[staff as 'treble' | 'bass'].voices.flatMap((voice) =>
        voice.events.map((event) => event.id),
      ),
    ),
  );

  return {
    beats: [firstBeat, secondBeat],
    chordChanges,
    chordDisplays,
    index: measure.index,
    rhythms: {
      bass: deriveRhythmFromPatternBeats([firstBeat, secondBeat], 'bass'),
      treble: deriveRhythmFromPatternBeats([firstBeat, secondBeat], 'treble'),
    },
    score: {
      ...score,
      measures: [measure],
      ties: score.ties.filter(
        (tie) => eventIds.has(tie.from.event_id) && eventIds.has(tie.to.event_id),
      ),
    },
  };
}

export type { ChordDisplay, ChordDisplayNote, ChordDisplayToken } from './chord-display';
