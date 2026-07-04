import { describe, expect, it, vi } from 'vitest';

import {
  collectRhythmEvents,
  generateRandomRhythmPattern,
  isValidRhythmPatternLength,
  splitRhythmPatternBars,
} from './rhythm-pattern';
import type { RhythmStep } from './types';

describe('rhythm pattern helpers', () => {
  it('accepts only one or two sixteen-step bars', () => {
    expect(isValidRhythmPatternLength(16)).toBe(true);
    expect(isValidRhythmPatternLength(32)).toBe(true);
    expect(isValidRhythmPatternLength(8)).toBe(false);
    expect(isValidRhythmPatternLength(48)).toBe(false);
  });

  it('splits a two-bar pattern into two sixteen-step rows', () => {
    const pattern = Array.from<RhythmStep>({ length: 32 }).fill(null);

    expect(splitRhythmPatternBars(pattern)).toHaveLength(2);
    expect(splitRhythmPatternBars(pattern)[0]).toHaveLength(16);
    expect(splitRhythmPatternBars(pattern)[1]).toHaveLength(16);
  });

  it('groups consecutive attacks independently from strong and weak labels', () => {
    expect(collectRhythmEvents(['s', 'w', 'w', null, 'w', 's'])).toEqual([
      { attack: 's', kind: 'attack', startStep: 0, stepCount: 3 },
      { attack: null, kind: 'rest', startStep: 3, stepCount: 1 },
      { attack: 'w', kind: 'attack', startStep: 4, stepCount: 2 },
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
      'Expected random rhythm length of 16 or 32, received 24.',
    );
  });
});
