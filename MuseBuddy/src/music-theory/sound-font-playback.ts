import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';

import { splitRhythmPatternBars } from '@/components/rhythm-trainer/rhythm-pattern';
import type { RhythmPattern } from '@/components/rhythm-trainer/types';
import type {
  SoundFontPlaybackCell,
  SoundFontPlaybackConfiguration,
  SoundFontPlaybackStep,
} from '@modules/sound-font-player';
import type { ChordDisplay } from './chord-display';
import { DEFAULT_BPM } from './tempo';

const HOLD_MIDI = -50;
const SOFT_BRUSH_SNARE_5_MIDI = 45;
const HARD_BRUSH_SNARE_3_MIDI = 50;
const STRONG_RHYTHM_NOTE: SoundFontPlaybackCell = {
  midi: SOFT_BRUSH_SNARE_5_MIDI,
  velocity: 112,
};
const WEAK_RHYTHM_NOTE: SoundFontPlaybackCell = {
  midi: HARD_BRUSH_SNARE_3_MIDI,
  velocity: 74,
};
const CHORD_NOTE_VELOCITY = 96;
const CHORD_NOTE_STRONG_VELOCITY = 96;
const CHORD_NOTE_WEAK_VELOCITY = 65;
const HOLD_CELL: SoundFontPlaybackCell = {
  midi: HOLD_MIDI,
  velocity: null,
};
const REST_CELL: SoundFontPlaybackCell = {
  midi: null,
  velocity: null,
};

export function buildSoundFontPlaybackConfiguration(
  keyArrangement: TrainingSessionKeyArrangement,
  bpm: number = DEFAULT_BPM,
): SoundFontPlaybackConfiguration {
  return {
    bpm,
    parts: buildPartsFromKeyArrangement(keyArrangement),
  };
}

export function buildRhythmSoundFontPlaybackConfiguration(
  pattern: RhythmPattern,
  bpm: number,
): SoundFontPlaybackConfiguration {
  const bars = splitRhythmPatternBars(pattern);

  return {
    bpm,
    parts: bars.map((part) =>
      part.map((step): SoundFontPlaybackStep => {
        if (step === 's') {
          return [STRONG_RHYTHM_NOTE];
        }

        if (step === 'w') {
          return [WEAK_RHYTHM_NOTE];
        }

        if (step === 'h') {
          return [HOLD_CELL];
        }

        return [REST_CELL];
      }),
    ),
  };
}

export function buildChordPreviewSoundFontPlaybackConfiguration(
  display: ChordDisplay,
  bpm: number,
): SoundFontPlaybackConfiguration {
  return {
    bpm,
    parts: [
      buildChordPart(display, [
        { durationSteps: 4, startStep: 0, velocity: CHORD_NOTE_STRONG_VELOCITY },
        { durationSteps: 4, startStep: 4, velocity: CHORD_NOTE_WEAK_VELOCITY },
        { durationSteps: 4, startStep: 8, velocity: CHORD_NOTE_STRONG_VELOCITY },
        { durationSteps: 4, startStep: 12, velocity: CHORD_NOTE_WEAK_VELOCITY },
      ]),
    ],
  };
}

export function buildChordSummarySoundFontPlaybackConfiguration(
  displays: readonly ChordDisplay[],
  bpm: number,
): SoundFontPlaybackConfiguration {
  return {
    bpm,
    parts: displays.map((display) =>
      buildChordPart(display, [
        { durationSteps: 4, startStep: 0, velocity: 96 },
        { durationSteps: 4, startStep: 4, velocity: 75 },
        { durationSteps: 4, startStep: 8, velocity: 80 },
        { durationSteps: 4, startStep: 12, velocity: 96 },
      ]),
    ),
  };
}

function buildPartsFromKeyArrangement(
  keyArrangement: TrainingSessionKeyArrangement,
): SoundFontPlaybackStep[][] {
  return [...keyArrangement.rows]
    .sort((left, right) => left.beatIndex - right.beatIndex)
    .map((row) =>
      Array.from({ length: row.slots.length / 2 }, (_, stepIndex) => {
        const firstSlot = row.slots[stepIndex * 2] ?? [];
        const secondSlot = row.slots[stepIndex * 2 + 1] ?? [];

        return mergeSourceSlotsIntoPlaybackStep(firstSlot, secondSlot);
      }),
    );
}

function mergeSourceSlotsIntoPlaybackStep(
  firstSlot: SoundFontPlaybackStep,
  secondSlot: SoundFontPlaybackStep,
): SoundFontPlaybackStep {
  const laneCount = Math.max(firstSlot.length, secondSlot.length);

  return Array.from({ length: laneCount }, (_, laneIndex) => {
    const firstCell = firstSlot[laneIndex] ?? REST_CELL;
    const secondCell = secondSlot[laneIndex] ?? REST_CELL;

    if (firstCell.midi !== null) {
      return firstCell;
    }

    return secondCell;
  });
}

type ChordAttack = {
  durationSteps: number;
  startStep: number;
  velocity: number;
};

function buildChordPart(
  display: ChordDisplay,
  attacks: readonly ChordAttack[],
): SoundFontPlaybackStep[] {
  const chordMidis = display.notes.map((note) => note.midi);
  const rootNote = display.notes.find((note) => note.isRoot) ?? display.notes[0];

  if (rootNote) {
    chordMidis.push(36 + rootNote.pitchClass);
  }

  const stepModes = Array.from({ length: 16 }, () => 'rest' as 'hold' | 'note' | 'rest');
  const stepVelocities = Array.from({ length: 16 }, () => CHORD_NOTE_VELOCITY);

  attacks.forEach(({ durationSteps, startStep, velocity }) => {
    if (startStep >= stepModes.length) {
      return;
    }

    stepModes[startStep] = 'note';
    stepVelocities[startStep] = velocity;

    for (let stepIndex = startStep + 1; stepIndex < startStep + durationSteps; stepIndex += 1) {
      if (stepIndex < stepModes.length) {
        stepModes[stepIndex] = 'hold';
      }
    }
  });

  return stepModes.map((mode, stepIndex) =>
    chordMidis.map((midi) => cellForChordStep(mode, midi, stepVelocities[stepIndex])),
  );
}

function cellForChordStep(
  mode: 'hold' | 'note' | 'rest',
  midi: number,
  velocity: number,
): SoundFontPlaybackCell {
  if (mode === 'note') {
    return {
      midi,
      velocity,
    };
  }

  if (mode === 'hold') {
    return HOLD_CELL;
  }

  return REST_CELL;
}
