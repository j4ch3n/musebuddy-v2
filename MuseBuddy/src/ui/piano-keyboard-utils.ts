import type { PianoPitchClass } from '@schema/music-theory-schema';

export type PianoKeyboardMarker = {
  isRoot: boolean;
  pitchClass: PianoPitchClass;
};

export function getPianoKeyboardMarkers(
  root: PianoPitchClass,
  keys: readonly PianoPitchClass[] = [],
): PianoKeyboardMarker[] {
  const selectedPitchClasses = new Set<PianoPitchClass>([root, ...keys]);

  return [...selectedPitchClasses].map((pitchClass) => ({
    isRoot: pitchClass === root,
    pitchClass,
  }));
}
