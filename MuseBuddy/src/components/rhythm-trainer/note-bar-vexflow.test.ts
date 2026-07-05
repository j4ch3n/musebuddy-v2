import { describe, expect, it } from 'vitest';

import { convertRhythmBarToVexflowEvents, RHYTHM_NOTE_KEY } from './note-bar-vexflow';
import type { RhythmStep } from './types';

type ExpectedEvent = {
  kind: 'note' | 'rest';
  duration: string;
  dots?: 0 | 1;
  startStep: number;
  stepCount: number;
  tieFromPrevious?: boolean;
  tieToNext?: boolean;
};

function pattern(source: string): RhythmStep[] {
  return source.split(/\s+/).map((token) => {
    if (token === 's' || token === 'w' || token === 'h') {
      return token;
    }

    if (token === '-') {
      return null;
    }

    throw new Error(`Unsupported pattern token: ${token}`);
  });
}

function convert(source: string) {
  return convertRhythmBarToVexflowEvents(pattern(source)).map(
    ({ kind, duration, dots, startStep, stepCount, tieFromPrevious, tieToNext, noteKey }) => ({
      kind,
      duration,
      dots,
      startStep,
      stepCount,
      tieFromPrevious,
      tieToNext,
      noteKey,
    }),
  );
}

function note(
  startStep: number,
  stepCount: number,
  duration: string,
  options: Pick<ExpectedEvent, 'dots' | 'tieFromPrevious' | 'tieToNext'> = {},
) {
  return {
    kind: 'note',
    duration,
    dots: options.dots ?? 0,
    startStep,
    stepCount,
    tieFromPrevious: options.tieFromPrevious ?? false,
    tieToNext: options.tieToNext ?? false,
    noteKey: RHYTHM_NOTE_KEY,
  };
}

function rest(startStep: number, stepCount: number, duration: string, dots: 0 | 1 = 0) {
  return {
    kind: 'rest',
    duration,
    dots,
    startStep,
    stepCount,
    tieFromPrevious: false,
    tieToNext: false,
    noteKey: undefined,
  };
}

describe('convertRhythmBarToVexflowEvents', () => {
  it('converts all rests into one whole rest', () => {
    expect(convert('- - - - - - - - - - - - - - - -')).toEqual([rest(0, 16, 'w')]);
  });

  it('keeps consecutive strong and weak attacks as separate sixteenth notes', () => {
    expect(convert('s w w - - - - - - - - - - - - -')).toEqual([
      note(0, 1, '16'),
      note(1, 1, '16'),
      note(2, 1, '16'),
      rest(3, 12, 'h', 1),
      rest(15, 1, '16'),
    ]);
  });

  it('uses hold steps to extend attack duration', () => {
    expect(convert('s h h - - - - - - - - - - - - -')).toEqual([
      note(0, 3, '8', { dots: 1 }),
      rest(3, 12, 'h', 1),
      rest(15, 1, '16'),
    ]);
  });

  it('keeps attacks separated by rests as separate note events', () => {
    expect(convert('s - w - s - w - s - w - s - w -')).toEqual([
      note(0, 1, '16'),
      rest(1, 1, '16'),
      note(2, 1, '16'),
      rest(3, 1, '16'),
      note(4, 1, '16'),
      rest(5, 1, '16'),
      note(6, 1, '16'),
      rest(7, 1, '16'),
      note(8, 1, '16'),
      rest(9, 1, '16'),
      note(10, 1, '16'),
      rest(11, 1, '16'),
      note(12, 1, '16'),
      rest(13, 1, '16'),
      note(14, 1, '16'),
      rest(15, 1, '16'),
    ]);
  });

  it('ties sustained attacks that need multiple notation segments', () => {
    expect(convert('s h h h h h h h h h h h h h h -')).toEqual([
      note(0, 12, 'h', { dots: 1, tieToNext: true }),
      note(12, 3, '8', { dots: 1, tieFromPrevious: true }),
      rest(15, 1, '16'),
    ]);
  });

  it('treats hold markers without a preceding attack as rests', () => {
    expect(convert('h h h h - - - - - - - - - - - -')).toEqual([rest(0, 16, 'w')]);
  });

  it('rejects bars that are not exactly sixteen slots', () => {
    expect(() => convertRhythmBarToVexflowEvents(['s', null])).toThrow(
      'Expected 16 bar steps, received 2.',
    );
  });

  it('covers the whole bar without gaps or overlaps', () => {
    const events = convertRhythmBarToVexflowEvents(pattern('s w w - s - - w s - w - s w - -'));

    events.forEach((event, index) => {
      expect(event.startStep).toBe(
        index === 0 ? 0 : events[index - 1].startStep + events[index - 1].stepCount,
      );
    });
    expect(events.reduce((total, event) => total + event.stepCount, 0)).toBe(16);
  });
});
