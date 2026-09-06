import { describe, expect, it } from 'vitest';

import type { ChordDisplay } from '@/music-theory';

import { visibleChordNotes } from './chord-tone-stage';

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
