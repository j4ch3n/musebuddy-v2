import { describe, expect, it } from 'vitest';

import {
  RHYTHM_NOTE_KEY_BY_CLEF,
  convertRhythmBarToVexflowEvents,
  convertRhythmPatternToVexflowBars,
} from './note-bar-vexflow';
import type { RhythmStep } from './types';

function bar(...initial: RhythmStep[]): RhythmStep[] {
  return [...initial, ...Array.from<RhythmStep>({ length: 32 - initial.length }).fill(null)];
}

describe('convertRhythmBarToVexflowEvents', () => {
  it('uses a middle-line pitch for each clef in the one-line preview', () => {
    expect(RHYTHM_NOTE_KEY_BY_CLEF).toEqual({ bass: 'd/3', treble: 'b/4' });
    expect(convertRhythmBarToVexflowEvents(bar('s'), { clef: 'bass' })[0]?.noteKey).toBe('d/3');
  });

  it('renders one source step as a thirty-second note', () => {
    const events = convertRhythmBarToVexflowEvents(bar('s', 'w'));

    expect(events.slice(0, 2)).toMatchObject([
      { duration: '32', kind: 'note', startStep: 0, stepCount: 1 },
      { duration: '32', kind: 'note', startStep: 1, stepCount: 1 },
    ]);
  });

  it('extends exact holds and keeps adjacent attacks separate', () => {
    const events = convertRhythmBarToVexflowEvents(bar('s', 'h', 'h', 'w'));

    expect(events.slice(0, 2)).toMatchObject([
      { duration: '16', dots: 1, kind: 'note', startStep: 0, stepCount: 3 },
      { duration: '32', kind: 'note', startStep: 3, stepCount: 1 },
    ]);
  });

  it('renders a complete 32-step rest bar as a whole rest', () => {
    expect(convertRhythmBarToVexflowEvents(bar())).toMatchObject([
      { duration: 'w', kind: 'rest', startStep: 0, stepCount: 32 },
    ]);
  });

  it('rejects malformed bar lengths', () => {
    expect(() => convertRhythmBarToVexflowEvents(['s', null])).toThrow(
      'Expected 32 bar steps, received 2.',
    );
  });

  it('creates partial ties when a held note crosses a card boundary', () => {
    const pattern = Array.from<RhythmStep>({ length: 64 }).fill(null);
    pattern.splice(31, 3, 's', 'h', 'h');

    const bars = convertRhythmPatternToVexflowBars(pattern);

    expect(bars[0]?.at(-1)).toMatchObject({ tieToNext: true });
    expect(bars[1]?.[0]).toMatchObject({ tieFromPrevious: true });
  });
});
