'use dom';

import { useEffect, useId, useRef } from 'react';
import { Accidental, Factory, StaveNote } from 'vexflow';

import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplayNote } from '@/music-theory';

import { chordToneRoleByImportance, chordToneRoleColors } from './chord-color-role';

type ChordSheetProps = {
  dom?: import('expo/dom').DOMProps;
  height?: number;
  notes: readonly ChordDisplayNote[];
};

const DEFAULT_STAVE_HEIGHT = 120;
const STAVE_WIDTH = 328;
const STAVE_GAP = 8;
const STAVE_INSET_X = 4;
const STAVE_RENDER_WIDTH = (STAVE_WIDTH - STAVE_INSET_X * 2 - STAVE_GAP) / 2;
const BASS_TOP_MIDI_LIMIT = 64;

export default function ChordSheet({ height = DEFAULT_STAVE_HEIGHT, notes }: ChordSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementId = useId().replaceAll(':', '-');

  useEffect(() => {
    document.documentElement.style.backgroundColor = museBuddyColors.paper;
    document.documentElement.style.height = '100%';
    document.body.style.backgroundColor = museBuddyColors.paper;
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
        height,
        width: STAVE_WIDTH,
      },
    });
    const context = factory.getContext();
    context.setFillStyle(museBuddyColors.notation);
    context.setStrokeStyle(museBuddyColors.notation);
    const bassOctaveOffset = getBassOctaveOffset(notes);
    const staveY = Math.max(4, (height - 92) / 2);

    (['treble', 'bass'] as const).forEach((clef, index) => {
      const stave = factory.Stave({
        width: STAVE_RENDER_WIDTH,
        x: STAVE_INSET_X + index * (STAVE_RENDER_WIDTH + STAVE_GAP),
        y: staveY,
      });
      stave.addClef(clef);
      stave.setContext(context).draw();

      const octaveOffset = clef === 'bass' ? bassOctaveOffset : 0;
      const staveNote = new StaveNote({
        clef,
        duration: 'w',
        keys: notes.map((note) => `${note.letter.toLowerCase()}/${note.octave + octaveOffset}`),
      });

      notes.forEach((note, noteIndex) => {
        const toneRole = note.isRoot ? 'root' : chordToneRoleByImportance[note.importance];
        const color = chordToneRoleColors[toneRole].color;
        const noteStyle = { fillStyle: color, strokeStyle: color };

        staveNote.setKeyStyle(noteIndex, noteStyle);

        if (note.accidental) {
          const accidental = new Accidental(note.accidental);
          accidental.setStyle(noteStyle);
          staveNote.addModifier(accidental, noteIndex);
        }
      });

      const voice = factory.Voice({ time: '4/4' }).setStrict(false);
      voice.addTickable(staveNote);
      factory
        .Formatter()
        .joinVoices([voice])
        .format([voice], STAVE_RENDER_WIDTH - 52);
      voice.draw(context, stave);
    });

    const svg = container.querySelector('svg');
    if (svg) {
      svg.style.backgroundColor = museBuddyColors.paper;
    }
  }, [elementId, height, notes]);

  return (
    <div
      aria-label="Treble and bass sheet music for today's chord"
      id={elementId}
      ref={containerRef}
      style={{
        alignItems: 'center',
        background: museBuddyColors.paper,
        display: 'flex',
        height,
        justifyContent: 'center',
        overflow: 'hidden',
        width: '100%',
      }}
    />
  );
}

function getBassOctaveOffset(notes: readonly ChordDisplayNote[]) {
  const highestMidi = Math.max(...notes.map((note) => note.midi));

  return highestMidi > BASS_TOP_MIDI_LIMIT
    ? -Math.ceil((highestMidi - BASS_TOP_MIDI_LIMIT) / 12)
    : 0;
}
