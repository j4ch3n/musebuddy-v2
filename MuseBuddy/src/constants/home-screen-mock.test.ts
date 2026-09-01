import { describe, expect, it } from 'vitest';

import { isStreakDayComplete, streakFixture } from './home-screen-mock';

describe('home screen mock', () => {
  it('represents a complete day only when every learning activity is complete', () => {
    expect(isStreakDayComplete(streakFixture.days[0])).toBe(true);
    expect(isStreakDayComplete(streakFixture.days[3])).toBe(false);
  });

  it('contains one seven-day week with one current day', () => {
    expect(streakFixture.days).toHaveLength(7);
    expect(streakFixture.days.filter((day) => day.status === 'current')).toHaveLength(1);
  });
});
