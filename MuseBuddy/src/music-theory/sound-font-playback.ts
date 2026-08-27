import type { TrainingSessionPatternBeat } from '@/contexts/training-session-schema';

import {
  normalizeRhythmPattern,
  splitRhythmPatternBars,
} from '@/components/rhythm-trainer/rhythm-pattern';
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

export function buildPatternSoundFontPlaybackConfiguration(
  beats: readonly TrainingSessionPatternBeat[],
  bpm: number = DEFAULT_BPM,
): SoundFontPlaybackConfiguration {
  return {
    bpm,
    tracks: buildTracksFromPatternBeats(beats),
  };
}

export function buildRhythmSoundFontPlaybackConfiguration(
  pattern: RhythmPattern,
  bpm: number,
): SoundFontPlaybackConfiguration {
  const bars = splitRhythmPatternBars(normalizeRhythmPattern(pattern));

  return {
    bpm,
    tracks: {
      treble: bars.map((part) =>
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
    },
  };
}

/** Plays the enriched chord voicing, then introduces its C4-area tones from low to high. */
export function buildChordPhrasePreviewSoundFontPlaybackConfiguration(
  display: ChordDisplay,
  bpm: number,
): SoundFontPlaybackConfiguration {
  const notes = [...display.notes].sort((left, right) => left.midi - right.midi);

  return {
    bpm,
    tracks: {
      treble: [
        [
          ...buildChordPart(display, [
            { durationSteps: 16, startStep: 0, velocity: CHORD_NOTE_STRONG_VELOCITY },
          ]).slice(0, 16),
          ...buildChordBreakdownSteps(notes),
        ],
      ],
    },
  };
}

function buildChordBreakdownSteps(notes: readonly ChordDisplay['notes'][number][]) {
  const steps = Array.from({ length: notes.length * 8 }, () => [] as SoundFontPlaybackCell[]);
  notes.forEach((note, noteIndex) => {
    const start = noteIndex * 8;
    steps[start] = [{ midi: note.midi, velocity: CHORD_NOTE_VELOCITY }];
    for (let step = start + 1; step < start + 8; step += 1) {
      steps[step] = [HOLD_CELL];
    }
  });
  return steps;
}

function buildTracksFromPatternBeats(
  beats: readonly TrainingSessionPatternBeat[],
): SoundFontPlaybackConfiguration['tracks'] {
  const orderedBeats = [...beats].sort(
    (left, right) => left.bar_index - right.bar_index || left.beat_index - right.beat_index,
  );
  const buildStaff = (staff: 'bass' | 'treble') =>
    orderedBeats.map((beat) =>
      beat.staves[staff].arrangement.map((slot, slotIndex) =>
        slot.map((midi, laneIndex) => ({
          midi,
          velocity: beat.staves[staff].velocity[slotIndex]?.[laneIndex] ?? null,
        })),
      ),
    );
  const treble = buildStaff('treble');
  const bass = buildStaff('bass');
  return { bass, treble };
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

  const stepModes = Array.from({ length: 32 }, () => 'rest' as 'hold' | 'note' | 'rest');
  const stepVelocities = Array.from({ length: 32 }, () => CHORD_NOTE_VELOCITY);

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
