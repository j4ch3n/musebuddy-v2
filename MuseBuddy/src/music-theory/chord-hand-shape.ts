export type ChordHandShapeTone = {
  degree: string;
  isBass?: boolean;
  midiPitchClass: number;
  pitch: string;
};
export type DerivedPianoHandShape = {
  adjacentSemitones: readonly number[];
  degreeFormula: string;
  intervalFormula: string;
  keyColorPattern: readonly ('black' | 'white')[];
  structuralShapeId: string;
};
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
    keyColorPattern: bassPosition.map((tone) =>
      [1, 3, 6, 8, 10].includes(tone.midiPitchClass) ? 'black' : 'white',
    ),
    structuralShapeId: `bass-position-v2:${bassPosition[0]?.degree ?? '1'}:${adjacentSemitones.join('-')}`,
  };
}
