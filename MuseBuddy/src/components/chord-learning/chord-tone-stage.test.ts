import { describe, expect, it } from 'vitest';

import type { ChordDisplay } from '@/music-theory';

import {
  availableChordToneStages,
  chordToneStageLabel,
  emphasizedChordNotes,
  resolveChordToneStage,
  visibleChordNotes,
} from './chord-tone-stage';

describe('availableChordToneStages', () => {
  it('includes only teaching roles present in the chord and always ends complete', () => {
    expect(
      availableChordToneStages({
        ...display,
        notes: [
          { degree: '1', isBass: true, isRoot: true, teachingRole: 'anchor' },
          { degree: 'b7', isBass: false, isRoot: false, teachingRole: 'guide' },
          { degree: '5', isBass: false, isRoot: false, teachingRole: 'voicing' },
        ],
      } as unknown as ChordDisplay),
    ).toEqual(['anchor', 'guide', 'complete']);
  });
});

describe('resolveChordToneStage', () => {
  it('falls back to the nearest earlier available stage', () => {
    expect(resolveChordToneStage(['anchor', 'quality', 'complete'], 'color')).toBe('quality');
  });

  it('uses the first available stage when no earlier stage exists', () => {
    expect(resolveChordToneStage(['complete'], 'anchor')).toBe('complete');
  });
});

describe('chordToneStageLabel', () => {
  it('uses title case for every stage label', () => {
    expect(chordToneStageLabel('guide')).toBe('Guide Tone');
    expect(chordToneStageLabel('color')).toBe('Color Tones');
    expect(chordToneStageLabel('complete')).toBe('Complete Chord');
  });
});

const display = {
  notes: [
    { degree: '1', isBass: true, isRoot: true, teachingRole: 'anchor' },
    { degree: '3', isBass: false, isRoot: false, teachingRole: 'quality' },
    { degree: '5', isBass: false, isRoot: false, teachingRole: 'voicing' },
    { degree: '13', isBass: false, isRoot: false, teachingRole: 'color' },
  ],
} as unknown as ChordDisplay;

describe('visibleChordNotes', () => {
  it('adds quality before guide, color, and voicing tones', () => {
    expect(visibleChordNotes(display, 'anchor').map((note) => note.degree)).toEqual(['1']);
    expect(visibleChordNotes(display, 'quality').map((note) => note.degree)).toEqual(['1', '3']);
    expect(visibleChordNotes(display, 'color').map((note) => note.degree)).toEqual([
      '1',
      '3',
      '13',
    ]);
    expect(visibleChordNotes(display, 'complete').map((note) => note.degree)).toEqual([
      '1',
      '3',
      '5',
      '13',
    ]);
  });

  it('keeps a slash bass with the root through every cumulative stage', () => {
    const inversion = {
      notes: [
        { degree: '5', isBass: true, isRoot: false, teachingRole: 'voicing' },
        { degree: '1', isBass: false, isRoot: true, teachingRole: 'anchor' },
        { degree: '3', isBass: false, isRoot: false, teachingRole: 'quality' },
      ],
    } as unknown as ChordDisplay;

    expect(visibleChordNotes(inversion, 'anchor').map((note) => note.degree)).toEqual(['5', '1']);
    expect(visibleChordNotes(inversion, 'quality').map((note) => note.degree)).toEqual([
      '5',
      '1',
      '3',
    ]);
  });
});

describe('emphasizedChordNotes', () => {
  it('emphasizes only the notes introduced by the active teaching role', () => {
    expect(emphasizedChordNotes(display, 'anchor').map((note) => note.degree)).toEqual(['1']);
    expect(emphasizedChordNotes(display, 'quality').map((note) => note.degree)).toEqual(['3']);
    expect(emphasizedChordNotes(display, 'color').map((note) => note.degree)).toEqual(['13']);
    expect(emphasizedChordNotes(display, 'complete').map((note) => note.degree)).toEqual(['5']);
  });

  it('does not emphasize a visible slash bass before the complete stage', () => {
    const inversion = {
      notes: [
        { degree: '5', isBass: true, isRoot: false, teachingRole: 'voicing' },
        { degree: '1', isBass: false, isRoot: true, teachingRole: 'anchor' },
        { degree: '3', isBass: false, isRoot: false, teachingRole: 'quality' },
      ],
    } as unknown as ChordDisplay;

    expect(emphasizedChordNotes(inversion, 'anchor').map((note) => note.degree)).toEqual(['1']);
    expect(emphasizedChordNotes(inversion, 'quality').map((note) => note.degree)).toEqual(['3']);
    expect(emphasizedChordNotes(inversion, 'complete').map((note) => note.degree)).toEqual(['5']);
  });
});
