import { describe, expect, it } from 'vitest';

import { museBuddyColors } from '@/constants/design-tokens';

import {
  isStreakProgressComplete,
  streakProgressSegmentColors,
} from './streak-progress-ring-model';

describe('streak progress ring', () => {
  it('requires all four learning activities for completion', () => {
    expect(
      isStreakProgressComplete({
        chordLearned: true,
        practiced: true,
        rhythmTrained: true,
        sheetRead: true,
      }),
    ).toBe(true);
    expect(isStreakProgressComplete({ practiced: true, sheetRead: true })).toBe(false);
  });

  it('keeps the learning activities mapped to their semantic colors', () => {
    expect(streakProgressSegmentColors).toEqual({
      chordLearned: museBuddyColors.sky,
      practiced: museBuddyColors.cobalt,
      rhythmTrained: museBuddyColors.petal,
      sheetRead: museBuddyColors.leaf,
    });
  });
});
