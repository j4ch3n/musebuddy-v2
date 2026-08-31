import type { TrainingSessionScore } from '@/contexts/training-session-schema';

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

export type DailyPracticeFixture = {
  eyebrow: string;
  id: string;
  keyLabel: string;
  preview: { beatsPerMeasure: 4; measureIndex: number };
  score: TrainingSessionScore;
  title: string;
};

export type StreakFixture = {
  currentCount: number;
  days: readonly StreakDayFixture[];
  month: {
    leadingEmptyDays: number;
    days: readonly StreakMonthDayFixture[];
  };
};

const quarter = (id: string, key: string, stem_direction: 'up' | 'down') => ({
  accidentals: [null],
  dots: 0,
  duration: 'q' as const,
  id,
  keys: [key],
  stem_direction,
  type: 'note' as const,
});

export const dailyPracticeFixture: DailyPracticeFixture = {
  eyebrow: 'Today',
  id: 'daily-practice/d-minor-window',
  keyLabel: 'D minor',
  preview: { beatsPerMeasure: 4, measureIndex: 0 },
  score: {
    format: 'vexflow',
    format_version: 1,
    key_signature: 'Dm',
    measures: [
      {
        beams: [],
        index: 0,
        staves: {
          bass: {
            clef: 'bass',
            voices: [
              {
                events: [
                  quarter('bass-1', 'd/3', 'down'),
                  quarter('bass-2', 'a/2', 'down'),
                  quarter('bass-3', 'c/3', 'down'),
                  quarter('bass-4', 'd/3', 'down'),
                ],
                id: 'bass-voice',
              },
            ],
          },
          treble: {
            clef: 'treble',
            voices: [
              {
                events: [
                  quarter('treble-1', 'd/5', 'up'),
                  quarter('treble-2', 'f/5', 'up'),
                  quarter('treble-3', 'a/5', 'up'),
                  quarter('treble-4', 'g/5', 'up'),
                ],
                id: 'treble-voice',
              },
            ],
          },
        },
      },
    ],
    ties: [],
    time_signature: '4/4',
  },
  title: "Today's Practice",
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

export function getPreviewStepIndex(
  fixture: DailyPracticeFixture,
  selectBeat: (beatCount: number) => number = (beatCount) => Math.floor(Math.random() * beatCount),
) {
  const selectedBeat = Math.max(
    0,
    Math.min(selectBeat(fixture.preview.beatsPerMeasure), fixture.preview.beatsPerMeasure - 1),
  );
  return fixture.preview.measureIndex * 64 + selectedBeat * (64 / fixture.preview.beatsPerMeasure);
}

export function isStreakDayComplete(day: Pick<StreakDayFixture, 'progress'>) {
  return Object.values(day.progress).every(Boolean);
}
