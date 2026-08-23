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

export function buildChordPreviewSoundFontPlaybackConfiguration(
  display: ChordDisplay,
  bpm: number,
): SoundFontPlaybackConfiguration {
  return {
    bpm,
    tracks: {
      treble: [
        buildChordPart(display, [
          { durationSteps: 8, startStep: 0, velocity: CHORD_NOTE_STRONG_VELOCITY },
          { durationSteps: 8, startStep: 8, velocity: CHORD_NOTE_WEAK_VELOCITY },
          { durationSteps: 8, startStep: 16, velocity: CHORD_NOTE_STRONG_VELOCITY },
          { durationSteps: 8, startStep: 24, velocity: CHORD_NOTE_WEAK_VELOCITY },
        ]),
      ],
    },
  };
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
