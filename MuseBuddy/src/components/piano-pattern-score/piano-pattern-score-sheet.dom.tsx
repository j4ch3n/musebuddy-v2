'use dom';

import { useEffect, useId, useRef, useState } from 'react';
import { Accidental, Clef, Dot, Factory, Stem, type StaveNote } from 'vexflow';

import { museBuddyColors } from '@/constants/design-tokens';
import type { TrainingSessionScore } from '@/contexts/training-session-schema';
import type { ScoreChordChange } from '@/music-theory';
import type { ScoreTarget } from './piano-pattern-score';

import { getActiveScoreEventIds, groupScoreMeasures } from './piano-pattern-score-layout';

type PianoPatternScoreSheetProps = {
  chordChanges: readonly ScoreChordChange[];
  currentStepIndex: number | null;
  dom?: import('expo/dom').DOMProps;
  notationColor: string;
  onTargetPress?: (target: ScoreTarget) => Promise<void>;
  renderHeight?: number;
  score: TrainingSessionScore;
  surfaceColor: string;
};

type ScoreEvent =
  TrainingSessionScore['measures'][number]['staves']['treble']['voices'][number]['events'][number];

const MIN_SCORE_WIDTH = 300;
const HORIZONTAL_PADDING = 4;
const STAFF_HEIGHT = 95;
const CLEF_BASS_GAP_SIZE = 10;
const SCORE_SCALE = 0.8;
const SCORE_HEIGHT = STAFF_HEIGHT * 2 + CLEF_BASS_GAP_SIZE;
const TARGET_PADDING = 6;
const MIN_TARGET_SIZE = 30;

type BoundingBox = {
  getH: () => number;
  getW: () => number;
  getX: () => number;
  getY: () => number;
};

type ScoreTargetRegion = {
  height: number;
  target: ScoreTarget;
  width: number;
  x: number;
  y: number;
};

type VexScoreTarget = {
  element: { getBoundingBox: () => BoundingBox };
  target: ScoreTarget;
};

export default function PianoPatternScoreSheet({
  chordChanges,
  currentStepIndex,
  notationColor,
  onTargetPress,
  renderHeight,
  score,
  surfaceColor,
}: PianoPatternScoreSheetProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const elementId = useId().replaceAll(':', '-');
  const canvasId = `${elementId}-canvas`;
  const [targetRegions, setTargetRegions] = useState<readonly ScoreTargetRegion[]>([]);

  useEffect(() => {
    document.documentElement.style.backgroundColor = surfaceColor;
    document.documentElement.style.height = '100%';
    document.body.style.backgroundColor = surfaceColor;
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    const container = canvasRef.current;
    if (!container) {
      return;
    }

    const render = () => {
      setTargetRegions(
        renderScore(
          container,
          canvasId,
          score,
          chordChanges,
          currentStepIndex,
          notationColor,
          renderHeight,
          surfaceColor,
        ),
      );
    };
    const observer = new ResizeObserver(render);
    observer.observe(container);
    render();

    return () => {
      observer.disconnect();
      container.replaceChildren();
      setTargetRegions([]);
    };
  }, [canvasId, chordChanges, currentStepIndex, notationColor, renderHeight, score, surfaceColor]);

  return (
    <div
      aria-label={`Piano score with ${score.measures.length} measures`}
      id={elementId}
      style={{
        background: surfaceColor,
        height:
          renderHeight ?? groupScoreMeasures(score.measures).length * SCORE_HEIGHT * SCORE_SCALE,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    >
      <div
        id={canvasId}
        ref={canvasRef}
        style={{ height: '100%', inset: 0, position: 'absolute', width: '100%' }}
      />
      {onTargetPress
        ? targetRegions.map(({ height, target, width, x, y }) => (
            <button
              aria-label={
                target.kind === 'chord'
                  ? `Open chord ${target.chordIndex + 1}`
                  : `Open ${target.staff} rhythm`
              }
              key={`${target.kind}-${target.measureIndex}-${target.kind === 'chord' ? target.chordIndex : target.staff}`}
              onClick={() => void onTargetPress(target)}
              style={{
                background: 'transparent',
                border: `2px solid ${target.kind === 'chord' ? museBuddyColors.sky : museBuddyColors.leaf}`,
                borderRadius: 4,
                cursor: 'pointer',
                height,
                left: x,
                padding: 0,
                position: 'absolute',
                top: y,
                width,
                zIndex: 2,
              }}
            />
          ))
        : null}
    </div>
  );
}

function renderScore(
  container: HTMLDivElement,
  elementId: string,
  score: TrainingSessionScore,
  chordChanges: readonly ScoreChordChange[],
  currentStepIndex: number | null,
  notationColor: string,
  renderHeight: number | undefined,
  surfaceColor: string,
): ScoreTargetRegion[] {
  container.replaceChildren();

  const width = Math.max(MIN_SCORE_WIDTH, Math.floor(container.clientWidth / SCORE_SCALE));
  const rows = groupScoreMeasures(score.measures);
  const height = renderHeight ? Math.ceil(renderHeight / SCORE_SCALE) : rows.length * SCORE_HEIGHT;
  const factory = new Factory({
    renderer: {
      elementId,
      height,
      width,
    },
  });
  factory.getContext().setFillStyle(notationColor);
  factory.getContext().setStrokeStyle(notationColor);
  const notesById = new Map<string, StaveNote>();
  const rowByEventId = new Map<string, number>();
  const targetElements: VexScoreTarget[] = [];
  const activeEventIds = getActiveScoreEventIds(score, currentStepIndex);

  rows.forEach((rowMeasures, rowIndex) => {
    const measureWidth = (width - HORIZONTAL_PADDING * 2) / rowMeasures.length;

    rowMeasures.forEach((measure, columnIndex) => {
      const x = HORIZONTAL_PADDING + columnIndex * measureWidth;
      const system = factory.System({
        formatOptions: { alignRests: true },
        spaceBetweenStaves: CLEF_BASS_GAP_SIZE,
        width: measureWidth,
        x,
        y: rowIndex * SCORE_HEIGHT,
      });

      for (const staffName of ['treble', 'bass'] as const) {
        const staffData = measure.staves[staffName];
        const voices = staffData.voices.map((voiceData, voiceIndex) => {
          const notes = voiceData.events.map((event) => {
            const note = createNote(factory, event, staffData.clef);
            if (activeEventIds.has(event.id)) {
              note.setStyle({
                fillStyle: museBuddyColors.rhythmCurrent,
                strokeStyle: museBuddyColors.rhythmCurrent,
              });
            }
            notesById.set(event.id, note);
            rowByEventId.set(event.id, rowIndex);
            return note;
          });

          if (staffName === 'treble' && voiceIndex === 0) {
            targetElements.push(
              ...addChordSymbols(
                factory,
                notes,
                voiceData.events,
                chordChanges.filter((chordChange) => chordChange.measureIndex === measure.index),
                measure.index,
              ),
            );
          }

          return factory.Voice({ time: score.time_signature }).addTickables(notes);
        });
        const stave = system.addStave({ voices });

        if (columnIndex === 0) {
          stave.addClef(staffData.clef).addKeySignature(score.key_signature);
          if (rowIndex === 0) {
            stave.addTimeSignature(score.time_signature);
          }
          const clef = stave.getModifiers(undefined, Clef.CATEGORY)[0];
          if (clef) {
            targetElements.push({
              element: clef,
              target: { kind: 'rhythm', measureIndex: measure.index, staff: staffName },
            });
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
    svg.style.backgroundColor = surfaceColor;
    svg.style.position = 'absolute';
    svg.style.transform = `scale(${SCORE_SCALE})`;
    svg.style.transformOrigin = 'top left';
  }

  return targetElements.map(({ element, target }) =>
    getTargetRegion(element.getBoundingBox(), target, container),
  );
}

function addChordSymbols(
  factory: Factory,
  notes: readonly StaveNote[],
  events: readonly ScoreEvent[],
  chordChanges: readonly ScoreChordChange[],
  measureIndex: number,
): VexScoreTarget[] {
  return chordChanges.flatMap((chordChange, chordIndex) => {
    const note = notes[getEventIndexForChordChange(events, chordChange.beatIndex)];
    if (!note) return [];
    const chordSymbol = factory
      .ChordSymbol({ hJustify: 'left', vJustify: 'top' })
      .addGlyphOrText(chordChange.symbol);
    note.addModifier(chordSymbol, 0);
    return [{ element: chordSymbol, target: { chordIndex, kind: 'chord', measureIndex } }];
  });
}

function getTargetRegion(
  boundingBox: BoundingBox,
  target: ScoreTarget,
  container: HTMLDivElement,
): ScoreTargetRegion {
  const width = Math.min(
    Math.max(MIN_TARGET_SIZE, boundingBox.getW() * SCORE_SCALE + TARGET_PADDING * 2),
    container.clientWidth,
  );
  const height = Math.min(
    Math.max(MIN_TARGET_SIZE, boundingBox.getH() * SCORE_SCALE + TARGET_PADDING * 2),
    container.clientHeight,
  );
  return {
    height,
    target,
    width,
    x: clamp(
      boundingBox.getX() * SCORE_SCALE - TARGET_PADDING,
      0,
      Math.max(container.clientWidth - width, 0),
    ),
    y: clamp(
      boundingBox.getY() * SCORE_SCALE - TARGET_PADDING,
      0,
      Math.max(container.clientHeight - height, 0),
    ),
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getEventIndexForChordChange(events: readonly ScoreEvent[], beatIndex: 0 | 1) {
  const totalDuration = events.reduce(
    (total, event) => total + getEventDurationInThirtySeconds(event),
    0,
  );
  const chordChangeOffset = (totalDuration * beatIndex) / 2;
  let elapsed = 0;

  for (const [eventIndex, event] of events.entries()) {
    elapsed += getEventDurationInThirtySeconds(event);
    if (chordChangeOffset < elapsed) {
      return eventIndex;
    }
  }

  return Math.max(events.length - 1, 0);
}

function getEventDurationInThirtySeconds(event: ScoreEvent) {
  const baseDuration = {
    '8': 4,
    '16': 2,
    '32': 1,
    '64': 0.5,
    h: 16,
    q: 8,
    w: 32,
  }[event.duration];

  return baseDuration * (2 - 1 / 2 ** event.dots);
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
