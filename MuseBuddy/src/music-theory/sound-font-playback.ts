import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';

import type {
  SoundFontPlaybackConfiguration,
  SoundFontPlaybackNote,
} from '../../modules/sound-font-player';

type ArrangementCell = TrainingSessionKeyArrangement['rows'][number]['slots'][number][number];

type ActiveNote = {
  laneIndex: number;
  midi: number;
  startSlotIndex: number;
  velocity: number;
};

const HOLD_MIDI = -50;
const DEFAULT_PLAYBACK_BPM = 100;
const SOURCE_SLOTS_PER_QUARTER_NOTE = 8;
export const DEFAULT_SOUND_FONT_SLOT_DURATION_SECONDS =
  60 / DEFAULT_PLAYBACK_BPM / SOURCE_SLOTS_PER_QUARTER_NOTE;

export function buildSoundFontPlaybackConfiguration(
  keyArrangement: TrainingSessionKeyArrangement,
): SoundFontPlaybackConfiguration {
  const slots = flattenArrangementSlots(keyArrangement);
  const notes = collectPlaybackNotes(slots);

  return {
    bpm: DEFAULT_PLAYBACK_BPM,
    instrument: 'piano',
    notes,
    slotDurationSeconds: DEFAULT_SOUND_FONT_SLOT_DURATION_SECONDS,
  };
}

function flattenArrangementSlots(keyArrangement: TrainingSessionKeyArrangement) {
  return [...keyArrangement.rows]
    .sort((left, right) => left.beatIndex - right.beatIndex)
    .flatMap((row) => row.slots);
}

function collectPlaybackNotes(slots: ArrangementCell[][]): SoundFontPlaybackNote[] {
  const activeNotes = new Map<number, ActiveNote>();
  const notes: SoundFontPlaybackNote[] = [];

  slots.forEach((slot, slotIndex) => {
    slot.forEach((cell, laneIndex) => {
      if (isHoldCell(cell)) {
        return;
      }

      const activeNote = activeNotes.get(laneIndex);
      if (activeNote) {
        notes.push(createPlaybackNote(activeNote, slotIndex));
        activeNotes.delete(laneIndex);
      }

      if (isAttackCell(cell)) {
        activeNotes.set(laneIndex, {
          laneIndex,
          midi: cell.midi,
          startSlotIndex: slotIndex,
          velocity: cell.velocity,
        });
      }
    });
  });

  activeNotes.forEach((activeNote) => {
    notes.push(createPlaybackNote(activeNote, slots.length));
  });

  return notes.sort(
    (left, right) => left.startTimeSeconds - right.startTimeSeconds || left.midi - right.midi,
  );
}

function createPlaybackNote(activeNote: ActiveNote, endSlotIndex: number): SoundFontPlaybackNote {
  const durationSlots = Math.max(1, endSlotIndex - activeNote.startSlotIndex);

  return {
    channel: 0,
    durationSeconds: durationSlots * DEFAULT_SOUND_FONT_SLOT_DURATION_SECONDS,
    id: `note-${activeNote.startSlotIndex}-${activeNote.laneIndex}-${activeNote.midi}`,
    midi: activeNote.midi,
    startTimeSeconds: activeNote.startSlotIndex * DEFAULT_SOUND_FONT_SLOT_DURATION_SECONDS,
    velocity: activeNote.velocity,
  };
}

function isAttackCell(cell: ArrangementCell): cell is ArrangementCell & {
  midi: number;
  velocity: number;
} {
  return typeof cell.midi === 'number' && cell.midi > 0 && typeof cell.velocity === 'number';
}

function isHoldCell(cell: ArrangementCell) {
  return cell.midi === HOLD_MIDI;
}
