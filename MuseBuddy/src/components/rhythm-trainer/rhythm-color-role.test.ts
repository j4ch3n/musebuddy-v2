import { describe, expect, it } from 'vitest';

import { getRhythmStepColorRole } from './rhythm-color-role';

describe('getRhythmStepColorRole', () => {
  it.each([
    ['s', 'strong'],
    ['w', 'weak'],
    ['h', 'hold'],
    [null, 'rest'],
  ] as const)('maps %s to %s', (step, expectedRole) => {
    expect(getRhythmStepColorRole(step)).toBe(expectedRole);
  });
});
