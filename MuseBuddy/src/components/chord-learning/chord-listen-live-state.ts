import * as Note from '@tonaljs/note';

import { midiToPitchClass } from '@/music-theory/midi-note';
import type { PianoPitchClass } from '@schema/music-theory-schema';

export type ChordListenLiveKeyState = {
  isUnexpectedActive: boolean;
  isSuccess: boolean;
  labels: readonly string[];
  rippleId: number;
};

export type ChordListenLiveKeyStates = Partial<Record<PianoPitchClass, ChordListenLiveKeyState>>;

export type ChordListenAttack = {
  midiPitch: number;
  startTimeMs: number;
};

const MAX_LABELS_PER_KEY = 3;

export function getChordListenAttackId({ midiPitch, startTimeMs }: ChordListenAttack): string {
  return `${midiPitch}:${startTimeMs}`;
}

export function updateChordListenLiveKeyStates({
  attacks,
  expectedPitchClasses,
  previous,
  unexpectedMidiPitches,
}: {
  attacks: readonly ChordListenAttack[];
  expectedPitchClasses: ReadonlySet<PianoPitchClass>;
  previous: ChordListenLiveKeyStates;
  unexpectedMidiPitches: readonly number[];
}): ChordListenLiveKeyStates {
  const next: ChordListenLiveKeyStates = { ...previous };

  for (const pitchClass of Object.keys(next).map(Number) as PianoPitchClass[]) {
    const key = next[pitchClass];
    if (key) {
      next[pitchClass] = { ...key, isUnexpectedActive: false };
    }
  }

  for (const attack of attacks) {
    const pitchClass = midiToPitchClass(attack.midiPitch);
    const key = next[pitchClass] ?? {
      isSuccess: false,
      isUnexpectedActive: false,
      labels: [],
      rippleId: 0,
    };

    if (!expectedPitchClasses.has(pitchClass)) {
      next[pitchClass] = { ...key, isUnexpectedActive: true };
      continue;
    }

    const label = Note.fromMidiSharps(attack.midiPitch);
    const labels =
      label && key.labels.at(-1) !== label
        ? [...key.labels.slice(-(MAX_LABELS_PER_KEY - 1)), label]
        : key.labels;
    next[pitchClass] = {
      isSuccess: key.isSuccess,
      isUnexpectedActive: false,
      labels,
      rippleId: key.rippleId + 1,
    };
  }

  for (const midiPitch of unexpectedMidiPitches) {
    const pitchClass = midiToPitchClass(midiPitch);
    if (!expectedPitchClasses.has(pitchClass)) {
      const key = next[pitchClass] ?? {
        isSuccess: false,
        isUnexpectedActive: false,
        labels: [],
        rippleId: 0,
      };
      next[pitchClass] = { ...key, isUnexpectedActive: true };
    }
  }

  return next;
}

export function markChordListenLiveKeyStatesSuccess(
  previous: ChordListenLiveKeyStates,
  expectedPitchClasses: ReadonlySet<PianoPitchClass>,
): ChordListenLiveKeyStates {
  return Object.fromEntries(
    Object.entries(previous).map(([pitchClass, state]) => [
      pitchClass,
      expectedPitchClasses.has(Number(pitchClass) as PianoPitchClass)
        ? { ...state, isSuccess: true }
        : state,
    ]),
  ) as ChordListenLiveKeyStates;
}
