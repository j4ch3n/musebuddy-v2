import type { ChordDisplayNote } from './chord-display';

const MAX_EXTRA_PITCH_CLASSES = 2;

type ChordListenMatchInput = {
  detectedMidiPitches: readonly number[];
  expectedNotes: readonly Pick<ChordDisplayNote, 'midi'>[];
};

export type ChordListenMatchScore = {
  expectedPitchClassCount: number;
  extraPitchClassCount: number;
};

export function isChordListenMatch({
  detectedMidiPitches,
  expectedNotes,
}: ChordListenMatchInput): boolean {
  return getChordListenMatchScore({ detectedMidiPitches, expectedNotes }) !== null;
}

export function getChordListenMatchScore({
  detectedMidiPitches,
  expectedNotes,
}: ChordListenMatchInput): ChordListenMatchScore | null {
  const expectedPitchClasses = toPitchClassSet(expectedNotes.map((note) => note.midi));
  const detectedPitchClasses = toPitchClassSet(detectedMidiPitches);

  for (const pitchClass of expectedPitchClasses) {
    if (!detectedPitchClasses.has(pitchClass)) {
      return null;
    }
  }

  let extraPitchClassCount = 0;
  for (const pitchClass of detectedPitchClasses) {
    if (!expectedPitchClasses.has(pitchClass)) {
      extraPitchClassCount += 1;
    }
  }

  if (extraPitchClassCount > MAX_EXTRA_PITCH_CLASSES) {
    return null;
  }

  return {
    expectedPitchClassCount: expectedPitchClasses.size,
    extraPitchClassCount,
  };
}

function toPitchClassSet(midiPitches: readonly number[]) {
  return new Set(midiPitches.map((midiPitch) => normalizeMidiPitchClass(midiPitch)));
}

function normalizeMidiPitchClass(midiPitch: number) {
  return ((midiPitch % 12) + 12) % 12;
}
