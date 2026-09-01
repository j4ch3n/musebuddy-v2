export type StreakActivityId = 'sheetRead' | 'chordLearned' | 'rhythmTrained' | 'practiced';

export type StreakDayStatus = 'completed' | 'current' | 'upcoming';

export type StreakDayFixture = {
  dayLabel: string;
  progress: Record<StreakActivityId, boolean>;
  status: StreakDayStatus;
};

export type StreakMonthDayFixture = Omit<StreakDayFixture, 'dayLabel'> & {
  dayOfMonth: number;
};

export type StreakFixture = {
  currentCount: number;
  days: readonly StreakDayFixture[];
  month: {
    leadingEmptyDays: number;
    days: readonly StreakMonthDayFixture[];
  };
};

const streakWeek: readonly StreakDayFixture[] = [
  {
    dayLabel: 'M',
    progress: { chordLearned: true, practiced: true, rhythmTrained: true, sheetRead: true },
    status: 'completed',
  },
  {
    dayLabel: 'T',
    progress: { chordLearned: true, practiced: true, rhythmTrained: true, sheetRead: true },
    status: 'completed',
  },
  {
    dayLabel: 'W',
    progress: { chordLearned: true, practiced: true, rhythmTrained: true, sheetRead: true },
    status: 'completed',
  },
  {
    dayLabel: 'T',
    progress: { chordLearned: true, practiced: false, rhythmTrained: true, sheetRead: true },
    status: 'current',
  },
  {
    dayLabel: 'F',
    progress: { chordLearned: false, practiced: false, rhythmTrained: false, sheetRead: false },
    status: 'upcoming',
  },
  {
    dayLabel: 'S',
    progress: { chordLearned: false, practiced: false, rhythmTrained: false, sheetRead: false },
    status: 'upcoming',
  },
  {
    dayLabel: 'S',
    progress: { chordLearned: false, practiced: false, rhythmTrained: false, sheetRead: false },
    status: 'upcoming',
  },
];

const emptyProgress = {
  chordLearned: false,
  practiced: false,
  rhythmTrained: false,
  sheetRead: false,
};

export const streakFixture: StreakFixture = {
  currentCount: 4,
  days: streakWeek,
  month: {
    days: Array.from({ length: 31 }, (_, index) => {
      const weekIndex = index - 17;
      const matchingWeekDay = streakWeek[weekIndex];
      return matchingWeekDay
        ? { ...matchingWeekDay, dayOfMonth: index + 1 }
        : { dayOfMonth: index + 1, progress: { ...emptyProgress }, status: 'upcoming' };
    }),
    leadingEmptyDays: 0,
  },
};

export function isStreakDayComplete(day: Pick<StreakDayFixture, 'progress'>) {
  return Object.values(day.progress).every(Boolean);
}
