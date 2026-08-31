import { describe, expect, it } from 'vitest';

import {
  dailyPracticeFixture,
  getPreviewStepIndex,
  isStreakDayComplete,
  streakFixture,
} from './home-screen-mock';

describe('home screen mock', () => {
  it('selects a valid score step for a chosen preview beat', () => {
    expect(getPreviewStepIndex(dailyPracticeFixture, () => 2)).toBe(32);
    expect(getPreviewStepIndex(dailyPracticeFixture, () => -1)).toBe(0);
    expect(getPreviewStepIndex(dailyPracticeFixture, () => 8)).toBe(48);
  });

  it('represents a complete day only when every learning activity is complete', () => {
    expect(isStreakDayComplete(streakFixture.days[0])).toBe(true);
    expect(isStreakDayComplete(streakFixture.days[3])).toBe(false);
  });

  it('contains one seven-day week with one current day', () => {
    expect(streakFixture.days).toHaveLength(7);
    expect(streakFixture.days.filter((day) => day.status === 'current')).toHaveLength(1);
  });
});
