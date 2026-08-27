'use dom';

import { useEffect, useId, useRef } from 'react';
import { Dot, Factory, StaveNote, TimeSignature } from 'vexflow';

import { museBuddyColors } from '@/constants/design-tokens';

import { RHYTHM_MEASURE_WIDTH_PX, RHYTHM_SHEET_HEIGHT_PX } from './constants';
import { RHYTHM_NOTE_KEY_BY_CLEF, type NoteBarVexflowEvent } from './note-bar-vexflow';

type NoteBarSheetProps = {
  clef: 'bass' | 'treble';
  currentStepIndex: number | null;
  events: readonly NoteBarVexflowEvent[];
  showClefAndTimeSignature: boolean;
  width: number;
  dom?: import('expo/dom').DOMProps;
};

const MIDDLE_STAFF_LINE = 2;
const SINGLE_LINE_STAFF_CONFIG = [
  { visible: false },
  { visible: false },
  { visible: true },
  { visible: false },
  { visible: false },
];

export default function NoteBarSheet({
  clef,
  currentStepIndex,
  events,
  showClefAndTimeSignature,
  width = RHYTHM_MEASURE_WIDTH_PX,
}: NoteBarSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementId = useId().replaceAll(':', '-');

  useEffect(() => {
    document.documentElement.style.backgroundColor = museBuddyColors.mist;
    document.documentElement.style.height = '100%';
    document.body.style.backgroundColor = museBuddyColors.mist;
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = '';

    const factory = new Factory({
      renderer: {
        elementId,
        width,
        height: RHYTHM_SHEET_HEIGHT_PX,
      },
    });
    const context = factory.getContext();
    context.setFillStyle(museBuddyColors.notation);
    context.setStrokeStyle(museBuddyColors.notation);
    const stave = factory.Stave({
      options: {
        // Keep VexFlow's five-line geometry for the treble G and bass F clef
        // glyphs, then expose only their shared middle line for the rhythm
        // preview.
        numLines: 5,
        spaceAboveStaffLn: 4,
        spaceBelowStaffLn: 4,
      },
      width: width - 16,
      x: 8,
      y: 6,
    });
    // Stave construction resets line config, so apply the one-line visibility
    // after creating it rather than passing it through the constructor.
    stave.setConfigForLines(SINGLE_LINE_STAFF_CONFIG);
    if (showClefAndTimeSignature) {
      const timeSignature = new TimeSignature('4/4', 10);
      // Keep the numerator and denominator equally spaced above and below the
      // one visible middle line, so the complete 4/4 glyph is centered on it.
      timeSignature.topLine = MIDDLE_STAFF_LINE - 1;
      timeSignature.bottomLine = MIDDLE_STAFF_LINE + 1;
      stave.addClef(clef).addModifier(timeSignature);
    }
    stave.setContext(context).draw();

    const notes = events.map((event) => {
      const duration = `${event.duration}${event.kind === 'rest' ? 'r' : ''}`;
      const staveNote = new StaveNote({
        clef,
        duration,
        keys: [
          event.kind === 'note'
            ? (event.noteKey ?? RHYTHM_NOTE_KEY_BY_CLEF[clef])
            : RHYTHM_NOTE_KEY_BY_CLEF[clef],
        ],
      });

      if (event.kind === 'rest') {
        staveNote.setKeyLine(0, MIDDLE_STAFF_LINE);
      }

      Array.from({ length: event.dots }).forEach(() => {
        Dot.buildAndAttach([staveNote], { all: true });
      });

      const isCurrent =
        currentStepIndex !== null &&
        currentStepIndex >= event.startStep &&
        currentStepIndex < event.startStep + event.stepCount;

      if (isCurrent) {
        staveNote.setStyle({
          fillStyle: museBuddyColors.rhythmCurrent,
          strokeStyle: museBuddyColors.rhythmCurrent,
        });
      }

      return staveNote;
    });

    const voice = factory.Voice({ time: '4/4' }).setStrict(false);
    voice.addTickables(notes);
    factory
      .Formatter()
      .joinVoices([voice])
      .format([voice], width - (showClefAndTimeSignature ? 76 : 24));
    voice.draw(context, stave);

    events.forEach((event, eventIndex) => {
      if (event.tieToNext) {
        factory
          .StaveTie({
            firstIndexes: [0],
            from: notes[eventIndex],
            lastIndexes: [0],
            to: notes[eventIndex + 1],
          })
          .setContext(context)
          .draw();
      }
      if (event.tieFromPrevious && eventIndex === 0) {
        factory
          .StaveTie({
            firstIndexes: [0],
            from: undefined,
            lastIndexes: [0],
            to: notes[eventIndex],
          })
          .setContext(context)
          .draw();
      }
    });

    const svg = container.querySelector('svg');
    if (svg) {
      svg.style.backgroundColor = museBuddyColors.mist;
    }
  }, [clef, currentStepIndex, elementId, events, showClefAndTimeSignature, width]);

  return (
    <div
      aria-label="Note preview for rhythm bar"
      id={elementId}
      ref={containerRef}
      style={{
        alignItems: 'center',
        background: museBuddyColors.mist,
        display: 'flex',
        height: RHYTHM_SHEET_HEIGHT_PX,
        justifyContent: 'center',
        overflow: 'hidden',
        width: '100%',
      }}
    />
  );
}
