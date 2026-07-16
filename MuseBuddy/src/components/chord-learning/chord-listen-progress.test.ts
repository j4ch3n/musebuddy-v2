import { describe, expect, it } from 'vitest';

import { pitchClassToMidi, type ChordDisplay } from '@/music-theory';

import { advanceChordListenProgress, findBestChordListenMatchIndex } from './chord-listen-progress';

describe('advanceChordListenProgress', () => {
  it('completes an individual chord listen after its one target matches', () => {
    const progress = advanceChordListenProgress({
      completedChordIndexes: new Set(),
      matchedChordIndex: 0,
      totalChordCount: 1,
    });

    expect([...progress.completedChordIndexes]).toEqual([0]);
    expect(progress.isComplete).toBe(true);
  });

  it('keeps combined listening open until every chord has matched', () => {
    let completedChordIndexes: ReadonlySet<number> = new Set();

    for (const matchedChordIndex of [2, 0, 3]) {
      const progress = advanceChordListenProgress({
        completedChordIndexes,
        matchedChordIndex,
        totalChordCount: 4,
      });
      completedChordIndexes = progress.completedChordIndexes;
      expect(progress.isComplete).toBe(false);
    }

    const finalProgress = advanceChordListenProgress({
      completedChordIndexes,
      matchedChordIndex: 1,
      totalChordCount: 4,
    });

    expect([...finalProgress.completedChordIndexes].sort()).toEqual([0, 1, 2, 3]);
    expect(finalProgress.isComplete).toBe(true);
  });

  it('does not advance combined progress for a duplicate chord', () => {
    const progress = advanceChordListenProgress({
      completedChordIndexes: new Set([1]),
      matchedChordIndex: 1,
      totalChordCount: 4,
    });

    expect([...progress.completedChordIndexes]).toEqual([1]);
    expect(progress.isComplete).toBe(false);
  });
});

describe('findBestChordListenMatchIndex', () => {
  it('matches an unticked chord in any display order', () => {
    expect(
      findBestChordListenMatchIndex({
        completedChordIndexes: new Set(),
        detectedMidiPitches: chordMidi('F', 'A', 'C'),
        displays: [display('C', 'E', 'G'), display('F', 'A', 'C')],
      }),
    ).toBe(1);
  });

  it('ignores chords that already have a tick', () => {
    expect(
      findBestChordListenMatchIndex({
        completedChordIndexes: new Set([0]),
        detectedMidiPitches: chordMidi('C', 'E', 'G'),
        displays: [display('C', 'E', 'G')],
      }),
    ).toBeNull();
  });

  it('prefers the match with fewer extra pitch classes', () => {
    expect(
      findBestChordListenMatchIndex({
        completedChordIndexes: new Set(),
        detectedMidiPitches: chordMidi('C', 'E', 'G', 'B'),
        displays: [display('C', 'E', 'G'), display('C', 'E', 'G', 'B')],
      }),
    ).toBe(1);
  });

  it('prefers the more specific chord when extra counts tie', () => {
    expect(
      findBestChordListenMatchIndex({
        completedChordIndexes: new Set(),
        detectedMidiPitches: chordMidi('C', 'E', 'G', 'B', 'D'),
        displays: [display('C', 'E', 'G'), display('C', 'E', 'G', 'B')],
      }),
    ).toBe(1);
  });

  it('uses display order for equal scores', () => {
    expect(
      findBestChordListenMatchIndex({
        completedChordIndexes: new Set(),
        detectedMidiPitches: chordMidi('C', 'E', 'G'),
        displays: [display('C', 'E', 'G'), display('C', 'E', 'G')],
      }),
    ).toBe(0);
  });
});

function display(...pitchClasses: string[]): Pick<ChordDisplay, 'notes'> {
  return {
    notes: pitchClasses.map((pitchClass, index) => ({
      accidental: '',
      interval: index === 0 ? '1' : '3',
      isRoot: index === 0,
      keyboardKey: 'C',
      letter: 'C',
      midi: pitchClassToMidi(pitchClass, 4),
      octave: 4,
      text: pitchClass,
      vexflowKey: 'c/4',
    })),
  };
}

function chordMidi(...pitchClasses: string[]): number[] {
  return pitchClasses.map((pitchClass) => pitchClassToMidi(pitchClass, 4));
}
