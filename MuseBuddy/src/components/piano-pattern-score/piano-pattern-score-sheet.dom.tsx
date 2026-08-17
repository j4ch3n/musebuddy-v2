'use dom';

import { useEffect, useId, useRef } from 'react';
import { Accidental, Dot, Factory, Stem, type StaveNote } from 'vexflow';

import { museBuddyColors } from '@/constants/design-tokens';
import type { TrainingSessionScore } from '@/contexts/training-session-schema';

import { groupScoreMeasures } from './piano-pattern-score-layout';

type PianoPatternScoreSheetProps = {
  dom?: import('expo/dom').DOMProps;
  score: TrainingSessionScore;
};

type ScoreEvent =
  TrainingSessionScore['measures'][number]['staves']['treble']['voices'][number]['events'][number];

const MIN_SCORE_WIDTH = 300;
const HORIZONTAL_PADDING = 4;
const ROW_HEIGHT = 200;
const SCORE_SCALE = 0.8;
const TOP_PADDING = 12;

export default function PianoPatternScoreSheet({ score }: PianoPatternScoreSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementId = useId().replaceAll(':', '-');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const render = () => {
      renderScore(container, elementId, score);
    };
    const observer = new ResizeObserver(render);
    observer.observe(container);
    render();

    return () => {
      observer.disconnect();
      container.replaceChildren();
    };
  }, [elementId, score]);

  return (
    <div
      aria-label={`Piano score with ${score.measures.length} measures`}
      id={elementId}
      ref={containerRef}
      style={{
        background: museBuddyColors.mist,
        height:
          (groupScoreMeasures(score.measures).length * ROW_HEIGHT + TOP_PADDING) * SCORE_SCALE,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    />
  );
}

function renderScore(container: HTMLDivElement, elementId: string, score: TrainingSessionScore) {
  container.replaceChildren();

  const width = Math.max(MIN_SCORE_WIDTH, Math.floor(container.clientWidth / SCORE_SCALE));
  const rows = groupScoreMeasures(score.measures);
  const height = rows.length * ROW_HEIGHT + TOP_PADDING;
  const factory = new Factory({
    renderer: {
      elementId,
      height,
      width,
    },
  });
  factory.getContext().setFillStyle(museBuddyColors.pine);
  factory.getContext().setStrokeStyle(museBuddyColors.pine);
  const notesById = new Map<string, StaveNote>();
  const rowByEventId = new Map<string, number>();

  rows.forEach((rowMeasures, rowIndex) => {
    const measureWidth = (width - HORIZONTAL_PADDING * 2) / rowMeasures.length;

    rowMeasures.forEach((measure, columnIndex) => {
      const x = HORIZONTAL_PADDING + columnIndex * measureWidth;
      const system = factory.System({
        formatOptions: { alignRests: true },
        spaceBetweenStaves: 10,
        width: measureWidth,
        x,
        y: TOP_PADDING + rowIndex * ROW_HEIGHT,
      });

      for (const staffName of ['treble', 'bass'] as const) {
        const staffData = measure.staves[staffName];
        const voices = staffData.voices.map((voiceData) => {
          const notes = voiceData.events.map((event) => {
            const note = createNote(factory, event, staffData.clef);
            notesById.set(event.id, note);
            rowByEventId.set(event.id, rowIndex);
            return note;
          });

          return factory.Voice({ time: score.time_signature }).addTickables(notes);
        });
        const stave = system.addStave({ voices });

        if (columnIndex === 0) {
          stave.addClef(staffData.clef).addKeySignature(score.key_signature);
          if (rowIndex === 0) {
            stave.addTimeSignature(score.time_signature);
          }
        }
      }

      if (columnIndex === 0) {
        system.addConnector('brace');
        system.addConnector('singleLeft');
      }

      measure.beams.forEach((beam) => {
        const notes = beam.event_ids.map((eventId) => requireNote(notesById, eventId));
        factory.Beam({ notes });
      });
    });
  });

  score.ties.forEach((tie) => {
    const from = requireNote(notesById, tie.from.event_id);
    const to = requireNote(notesById, tie.to.event_id);
    const firstIndexes = [tie.from.key_index];
    const lastIndexes = [tie.to.key_index];

    if (rowByEventId.get(tie.from.event_id) === rowByEventId.get(tie.to.event_id)) {
      factory.StaveTie({ firstIndexes, from, lastIndexes, to });
      return;
    }

    factory.StaveTie({ firstIndexes, from, lastIndexes: firstIndexes });
    factory.StaveTie({ firstIndexes: lastIndexes, lastIndexes, to });
  });

  factory.draw();

  const svg = container.querySelector('svg');
  if (svg) {
    svg.style.position = 'absolute';
    svg.style.transform = `scale(${SCORE_SCALE})`;
    svg.style.transformOrigin = 'top left';
  }
}

function createNote(factory: Factory, event: ScoreEvent, clef: 'bass' | 'treble'): StaveNote {
  const duration = `${event.duration}${'d'.repeat(event.dots)}${event.type === 'rest' ? 'r' : ''}`;
  const note = factory.StaveNote({
    clef,
    duration,
    keys: event.keys,
    stemDirection:
      event.stem_direction === 'up'
        ? Stem.UP
        : event.stem_direction === 'down'
          ? Stem.DOWN
          : undefined,
  });

  Array.from({ length: event.dots }).forEach(() => {
    Dot.buildAndAttach([note], { all: true });
  });
  event.accidentals.forEach((accidental, keyIndex) => {
    if (accidental) {
      note.addModifier(new Accidental(accidental), keyIndex);
    }
  });
  return note;
}

function requireNote(notesById: ReadonlyMap<string, StaveNote>, eventId: string) {
  const note = notesById.get(eventId);
  if (!note) {
    throw new Error(`Score references unknown event ${eventId}.`);
  }
  return note;
}
