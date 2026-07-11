import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';

import { splitRhythmPatternBars } from '@/components/rhythm-trainer/rhythm-pattern';
import type { RhythmPattern } from '@/components/rhythm-trainer/types';
import type {
  SoundFontPlaybackCell,
  SoundFontPlaybackConfiguration,
  SoundFontPlaybackStep,
} from '@modules/sound-font-player';

const DEFAULT_SESSION_GOAL_BPM = 96;
const HOLD_MIDI = -50;
const STRONG_RHYTHM_NOTE: SoundFontPlaybackCell = {
  midi: 67,
  velocity: 112,
};
const WEAK_RHYTHM_NOTE: SoundFontPlaybackCell = {
  midi: 60,
  velocity: 74,
};
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
  bpm: number = DEFAULT_SESSION_GOAL_BPM,
): SoundFontPlaybackConfiguration {
  return {
    bpm,
    tracks: [
      {
        instrument: 'piano',
        parts: buildPartsFromKeyArrangement(keyArrangement),
      },
    ],
  };
}

export function buildRhythmSoundFontPlaybackConfiguration(
  pattern: RhythmPattern,
  bpm: number,
): SoundFontPlaybackConfiguration {
  return {
    bpm,
    tracks: [
      {
        instrument: 'percussion',
        parts: splitRhythmPatternBars(pattern).map((part) =>
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
    ],
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
