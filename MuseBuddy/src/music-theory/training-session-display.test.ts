import { describe, expect, it } from 'vitest';

import { createTrainingSession } from '@/contexts/training-session-test-fixture';

import { prepareTrainingSessionDisplay } from './training-session-display';

describe('prepareTrainingSessionDisplay', () => {
  it('prepares chord, score, and independent full-pattern rhythms', () => {
    const trainingSession = createTrainingSession(4);
    const firstBeat = trainingSession.notes.beats[0];
    if (!firstBeat) {
      throw new Error('Fixture is missing its first beat.');
    }
    firstBeat.staves.treble.arrangement[0] = [60];
    firstBeat.staves.treble.velocity[0] = [80];

    const preparedSession = prepareTrainingSessionDisplay(trainingSession);

    expect(preparedSession.notes).toBe(trainingSession.notes.beats);
    expect(preparedSession.score).toBe(trainingSession.score);
    expect(preparedSession.chordDisplays[0]?.symbol).toBe('C');
    expect(preparedSession.bars).toHaveLength(4);
    expect(preparedSession.bars[0]?.beats).toHaveLength(2);
    expect(preparedSession.bars[0]?.beats.map((beat) => beat.beat_index)).toEqual([0, 1]);
    expect(preparedSession.bars[0]?.chordDisplays).toHaveLength(1);
    expect(preparedSession.bars[0]?.chordDisplays[0]?.idName).toBe('c-major');
    expect(preparedSession.bars[0]?.chordChanges).toEqual([
      { beatIndex: 0, chordId: 'c-major', measureIndex: 0, symbol: 'C' },
    ]);
    expect(preparedSession.bars[0]?.score.measures).toHaveLength(1);
    expect(preparedSession.bars[0]?.rhythms.treble.pattern).toHaveLength(64);
    expect(preparedSession.bars[0]?.rhythms.bass.pattern).toHaveLength(64);
    expect(preparedSession.scoreChordChanges).toEqual([
      { beatIndex: 0, chordId: 'c-major', measureIndex: 0, symbol: 'C' },
      { beatIndex: 0, chordId: 'c-major', measureIndex: 1, symbol: 'C' },
      { beatIndex: 0, chordId: 'c-major', measureIndex: 2, symbol: 'C' },
      { beatIndex: 0, chordId: 'c-major', measureIndex: 3, symbol: 'C' },
    ]);
    expect(preparedSession.rhythms.treble.pattern).toHaveLength(256);
    expect(preparedSession.rhythms.treble.pattern[0]).toBe('s');
    expect(preparedSession.rhythms.bass.pattern.every((step) => step === null)).toBe(true);
  });

  it('keeps distinct chords in their beat order within a bar', () => {
    const trainingSession = createTrainingSession();
    trainingSession.chords.push({
      ...trainingSession.chords[0]!,
      idName: 'c-major-duplicate-name',
      normalizedSymbol: 'C alt',
    });
    trainingSession.notes.beats[1]!.chord = 'c-major-duplicate-name';

    const preparedSession = prepareTrainingSessionDisplay(trainingSession);

    expect(preparedSession.bars[0]?.chordDisplays.map((display) => display.idName)).toEqual([
      'c-major',
      'c-major-duplicate-name',
    ]);
  });
});
