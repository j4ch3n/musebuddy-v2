'use dom';

import { useEffect, useId, useRef } from 'react';
import { Dot, Factory, StaveNote, TimeSignature } from 'vexflow';

import { NoteBarVexflowEvent, RHYTHM_NOTE_KEY } from './note-bar-vexflow';

type NoteBarSheetProps = {
  currentStepIndex: number | null;
  events: readonly NoteBarVexflowEvent[];
  dom?: import('expo/dom').DOMProps;
};

const STAVE_WIDTH = 328;
const STAVE_HEIGHT = 120;
const SINGLE_LINE_NOTE_POSITION = 5;

export default function NoteBarSheet({ currentStepIndex, events }: NoteBarSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementId = useId().replaceAll(':', '-');

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = '';

    const factory = new Factory({
      renderer: {
        elementId,
        width: STAVE_WIDTH,
        height: STAVE_HEIGHT,
      },
    });
    const context = factory.getContext();
    const stave = factory.Stave({
      options: {
        numLines: 1,
        spaceAboveStaffLn: 4,
        spaceBelowStaffLn: 4,
      },
      width: STAVE_WIDTH - 16,
      x: 8,
      y: 8,
    });
    const timeSignature = new TimeSignature('4/4', 10);
    timeSignature.topLine = -1;
    timeSignature.bottomLine = 1;
    stave.addModifier(timeSignature);
    stave.setContext(context).draw();

    const notes = events.map((event) => {
      const duration = `${event.duration}${event.kind === 'rest' ? 'r' : ''}`;
      const staveNote = new StaveNote({
        clef: 'treble',
        duration,
        keys: [event.kind === 'note' ? (event.noteKey ?? RHYTHM_NOTE_KEY) : RHYTHM_NOTE_KEY],
      });

      if (event.kind === 'rest') {
        staveNote.setKeyLine(0, SINGLE_LINE_NOTE_POSITION);
      }

      Array.from({ length: event.dots }).forEach(() => {
        Dot.buildAndAttach([staveNote], { all: true });
      });

      const isCurrent =
        currentStepIndex !== null &&
        currentStepIndex >= event.startStep &&
        currentStepIndex < event.startStep + event.stepCount;

      if (isCurrent) {
        staveNote.setStyle({ fillStyle: '#2F80ED', strokeStyle: '#2F80ED' });
      }

      return staveNote;
    });

    const voice = factory.Voice({ time: '4/4' }).setStrict(false);
    voice.addTickables(notes);
    factory
      .Formatter()
      .joinVoices([voice])
      .format([voice], STAVE_WIDTH - 76);
    voice.draw(context, stave);

    events.forEach((event, eventIndex) => {
      if (!event.tieToNext) {
        return;
      }

      factory
        .StaveTie({
          from: notes[eventIndex],
          to: notes[eventIndex + 1],
          firstIndexes: [0],
          lastIndexes: [0],
        })
        .setContext(context)
        .draw();
    });
  }, [currentStepIndex, elementId, events]);

  return (
    <div
      aria-label="Note preview for rhythm bar"
      id={elementId}
      ref={containerRef}
      style={{
        alignItems: 'center',
        background: '#ffffff',
        display: 'flex',
        height: STAVE_HEIGHT,
        justifyContent: 'center',
        overflow: 'hidden',
        width: '100%',
      }}
    />
  );
}
