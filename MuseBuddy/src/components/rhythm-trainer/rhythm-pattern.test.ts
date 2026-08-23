import { describe, expect, it, vi } from 'vitest';

import {
  collectRhythmEvents,
  expandRhythmEvents,
  generateRandomRhythmPattern,
  isValidRhythmPatternLength,
  normalizeRhythmPattern,
  splitRhythmPatternBars,
  splitRhythmPatternChunks,
} from './rhythm-pattern';
import type { RhythmStep } from './types';

describe('rhythm pattern helpers', () => {
  it('accepts one through eight thirty-two-step rows', () => {
    expect(isValidRhythmPatternLength(16)).toBe(false);
    expect(isValidRhythmPatternLength(32)).toBe(true);
    expect(isValidRhythmPatternLength(64)).toBe(true);
    expect(isValidRhythmPatternLength(128)).toBe(true);
    expect(isValidRhythmPatternLength(256)).toBe(true);
    expect(isValidRhythmPatternLength(8)).toBe(false);
    expect(isValidRhythmPatternLength(288)).toBe(false);
  });

  it('splits a two-bar pattern into two thirty-two-step rows', () => {
    const pattern = Array.from<RhythmStep>({ length: 64 }).fill(null);

    expect(splitRhythmPatternBars(pattern)).toHaveLength(2);
    expect(splitRhythmPatternBars(pattern)[0]).toHaveLength(32);
    expect(splitRhythmPatternBars(pattern)[1]).toHaveLength(32);
  });

  it('groups bars into two-bar chunks while preserving a final odd bar', () => {
    const pattern = Array.from<RhythmStep>({ length: 96 }).fill(null);

    expect(splitRhythmPatternChunks(pattern).map((chunk) => chunk.length)).toEqual([64, 32]);
  });

  it('keeps adjacent strong and weak attacks as separate rhythm events', () => {
    expect(collectRhythmEvents(['s', 'w', 'w', null, 'w', 's'])).toEqual([
      { attack: 's', kind: 'attack', startStep: 0, stepCount: 1 },
      { attack: 'w', kind: 'attack', startStep: 1, stepCount: 1 },
      { attack: 'w', kind: 'attack', startStep: 2, stepCount: 1 },
      { attack: null, kind: 'rest', startStep: 3, stepCount: 1 },
      { attack: 'w', kind: 'attack', startStep: 4, stepCount: 1 },
      { attack: 's', kind: 'attack', startStep: 5, stepCount: 1 },
    ]);
  });

  it('extends attack durations only through following hold steps', () => {
    expect(collectRhythmEvents(['s', 'h', 'h', null, 'w', 'h'])).toEqual([
      { attack: 's', kind: 'attack', startStep: 0, stepCount: 3 },
      { attack: null, kind: 'rest', startStep: 3, stepCount: 1 },
      { attack: 'w', kind: 'attack', startStep: 4, stepCount: 2 },
    ]);
  });

  it('treats holds without a preceding attack as rests', () => {
    expect(collectRhythmEvents(['h', 'h', 's'])).toEqual([
      { attack: null, kind: 'rest', startStep: 0, stepCount: 2 },
      { attack: 's', kind: 'attack', startStep: 2, stepCount: 1 },
    ]);
  });

  it('expands merged events back into the canonical step representation', () => {
    const events = collectRhythmEvents(['s', 'h', 'h', null, 'w', 'h']);

    expect(expandRhythmEvents(events)).toEqual(['s', 'h', 'h', null, 'w', 'h']);
  });

  it('normalizes orphan holds while preserving owned holds and adjacent attacks', () => {
    expect(normalizeRhythmPattern(['h', 's', 'h', 'w', 'h', null])).toEqual([
      null,
      's',
      'h',
      'w',
      'h',
      null,
    ]);
  });

  it('generates random patterns with supported values and preserved length', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const pattern = generateRandomRhythmPattern(32);

    expect(pattern).toHaveLength(32);
    expect(pattern.every((step) => step === 's' || step === 'w' || step === null)).toBe(true);
    expect(pattern[0]).toBe('s');
    expect(pattern[16]).toBe('s');

    vi.restoreAllMocks();
  });

  it('rejects unsupported random pattern lengths', () => {
    expect(() => generateRandomRhythmPattern(24)).toThrow(
      'Expected a non-empty multiple of 32 up to 256 random rhythm steps, received 24.',
    );
  });
});
