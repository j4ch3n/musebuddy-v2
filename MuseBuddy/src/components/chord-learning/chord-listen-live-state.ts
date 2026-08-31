import * as Note from '@tonaljs/note';

import { midiToPitchClass } from '@/music-theory/midi-note';
import type { PianoPitchClass } from '@schema/music-theory-schema';

export type ChordListenLiveKeyState = {
  isUnexpectedActive: boolean;
  isSuccess: boolean;
  label: string | null;
  rippleId: number;
  expiresAtMs: number | null;
};

export type ChordListenLiveKeyStates = Partial<Record<PianoPitchClass, ChordListenLiveKeyState>>;

export type ChordListenAttack = {
  midiPitch: number;
  startTimeMs: number;
};

export const CHORD_SUCCESS_SHADOW_DURATION_MS = 2_000;
export const CHORD_WRONG_SHADOW_DURATION_MS = 2_000;

export function getChordListenAttackId({ midiPitch, startTimeMs }: ChordListenAttack): string {
  return `${midiPitch}:${startTimeMs}`;
}

export function updateChordListenLiveKeyStates({
  attacks,
  expectedPitchClasses,
  nowMs = attacks.at(-1)?.startTimeMs ?? Date.now(),
  previous,
  unexpectedMidiPitches,
}: {
  attacks: readonly ChordListenAttack[];
  expectedPitchClasses: ReadonlySet<PianoPitchClass>;
  nowMs?: number;
  previous: ChordListenLiveKeyStates;
  unexpectedMidiPitches: readonly number[];
}): ChordListenLiveKeyStates {
  const next = clearExpiredChordListenLiveKeyStates(previous, nowMs);

  for (const attack of attacks) {
    const pitchClass = midiToPitchClass(attack.midiPitch);
    const label = Note.fromMidiSharps(attack.midiPitch);
    const key = next[pitchClass] ?? {
      isSuccess: false,
      isUnexpectedActive: false,
      label: null,
      rippleId: 0,
      expiresAtMs: null,
    };

    if (!expectedPitchClasses.has(pitchClass)) {
      next[pitchClass] = {
        ...key,
        expiresAtMs: attack.startTimeMs + CHORD_WRONG_SHADOW_DURATION_MS,
        isUnexpectedActive: true,
        label,
      };
      continue;
    }

    next[pitchClass] = {
      expiresAtMs: attack.startTimeMs + CHORD_SUCCESS_SHADOW_DURATION_MS,
      isSuccess: true,
      isUnexpectedActive: false,
      label,
      rippleId: key.rippleId + 1,
    };
  }

  for (const midiPitch of unexpectedMidiPitches) {
    const pitchClass = midiToPitchClass(midiPitch);
    if (!expectedPitchClasses.has(pitchClass)) {
      const key = next[pitchClass] ?? {
        isSuccess: false,
        isUnexpectedActive: false,
        label: null,
        rippleId: 0,
        expiresAtMs: null,
      };
      next[pitchClass] = {
        ...key,
        expiresAtMs: nowMs + CHORD_WRONG_SHADOW_DURATION_MS,
        isUnexpectedActive: true,
        label: Note.fromMidiSharps(midiPitch),
      };
    }
  }

  return next;
}

export function clearExpiredChordListenLiveKeyStates(
  previous: ChordListenLiveKeyStates,
  nowMs: number,
): ChordListenLiveKeyStates {
  return Object.fromEntries(
    Object.entries(previous).map(([pitchClass, state]) => [
      pitchClass,
      state.expiresAtMs !== null && state.expiresAtMs <= nowMs
        ? {
            ...state,
            expiresAtMs: null,
            isSuccess: false,
            isUnexpectedActive: false,
            label: null,
          }
        : state,
    ]),
  ) as ChordListenLiveKeyStates;
}
