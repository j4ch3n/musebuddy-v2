export type ChordHandShapeTone = {
  degree: string;
  isBass?: boolean;
  pitchClass: number;
};
export type ChordHandShapeCueTone = {
  hand?: PianoHand | null;
  midi: number;
  pitchClass: number;
};
export type DerivedPianoHandShape = {
  adjacentSemitones: readonly number[];
  degreeFormula: string;
  intervalFormula: string;
  keyColorPattern: readonly ('black' | 'white')[];
  orderedDegrees: readonly string[];
};
export type PianoHand = 'left' | 'right';
export type PianoKeyColor = 'black' | 'white';
export type PianoHandShapeCueName =
  | 'All black'
  | 'All white'
  | 'Ends raised'
  | 'Left raised'
  | 'Left two raised'
  | 'Middle raised'
  | 'Right raised'
  | 'Right two raised';
export type PianoHandShapeCue = {
  hand: PianoHand;
  keyColorPattern: readonly PianoKeyColor[];
  name: PianoHandShapeCueName;
};

const blackPitchClasses = new Set([1, 3, 6, 8, 10]);
const semitones: Record<string, number> = {
  '1': 0,
  b2: 1,
  '2': 2,
  '#2': 3,
  b3: 3,
  '3': 4,
  '4': 5,
  '#4': 6,
  b5: 6,
  '5': 7,
  '#5': 8,
  b6: 8,
  '6': 9,
  bb7: 9,
  b7: 10,
  '7': 11,
  b9: 13,
  '9': 14,
  '#9': 15,
  '11': 17,
  '#11': 18,
  b13: 20,
  '13': 21,
};

export function derivePianoHandShape(tones: readonly ChordHandShapeTone[]): DerivedPianoHandShape {
  const ordered = [...tones].sort(
    (a, b) => (semitones[a.degree] ?? 0) - (semitones[b.degree] ?? 0),
  );
  const bassIndex = Math.max(
    ordered.findIndex((tone) => tone.isBass),
    0,
  );
  const bassPosition = [...ordered.slice(bassIndex), ...ordered.slice(0, bassIndex)];
  const positions = bassPosition.map(
    (tone, index) =>
      (semitones[tone.degree] ?? 0) + (index >= bassPosition.length - bassIndex ? 12 : 0),
  );
  const adjacentSemitones = positions
    .slice(1)
    .map((position, index) => position - positions[index]!);
  const intervalFormula = adjacentSemitones.join('+');
  return {
    adjacentSemitones,
    degreeFormula: bassPosition.map((tone) => tone.degree).join('-'),
    intervalFormula,
    keyColorPattern: bassPosition.map((tone) => keyColorForPitchClass(tone.pitchClass)),
    orderedDegrees: bassPosition.map((tone) => tone.degree),
  };
}

export function derivePianoHandShapeCues(
  tones: readonly ChordHandShapeCueTone[],
): readonly PianoHandShapeCue[] {
  return (['left', 'right'] as const).flatMap((hand) => {
    const keyColors = tones
      .filter((tone) => tone.hand === hand)
      .sort((a, b) => a.midi - b.midi)
      .map((tone) => keyColorForPitchClass(tone.pitchClass));

    if (!keyColors.length) return [];

    const keyColorPattern = representativeKeyColors(keyColors);
    return [{ hand, keyColorPattern, name: handShapeCueName(keyColorPattern) }];
  });
}

function keyColorForPitchClass(pitchClass: number): PianoKeyColor {
  return blackPitchClasses.has(pitchClass) ? 'black' : 'white';
}

function representativeKeyColors(keyColors: readonly PianoKeyColor[]): readonly PianoKeyColor[] {
  if (keyColors.length <= 2) return keyColors;

  return [keyColors[0]!, keyColors[Math.floor((keyColors.length - 1) / 2)]!, keyColors.at(-1)!];
}

function handShapeCueName(keyColors: readonly PianoKeyColor[]): PianoHandShapeCueName {
  switch (keyColors.join('-')) {
    case 'white':
    case 'white-white':
    case 'white-white-white':
      return 'All white';
    case 'black':
    case 'black-black':
    case 'black-black-black':
      return 'All black';
    case 'white-black-white':
      return 'Middle raised';
    case 'black-white-black':
      return 'Ends raised';
    case 'black-white':
    case 'black-white-white':
      return 'Left raised';
    case 'white-black':
    case 'white-white-black':
      return 'Right raised';
    case 'black-black-white':
      return 'Left two raised';
    case 'white-black-black':
      return 'Right two raised';
    default:
      throw new Error(`Unsupported hand-shape key pattern: ${keyColors.join('-')}`);
  }
}
