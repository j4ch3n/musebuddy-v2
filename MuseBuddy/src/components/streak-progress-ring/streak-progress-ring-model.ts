import { museBuddyColors } from '@/constants/design-tokens';

export type StreakProgressSegment = 'sheetRead' | 'chordLearned' | 'rhythmTrained' | 'practiced';

export const streakProgressSegments: readonly StreakProgressSegment[] = [
  'sheetRead',
  'chordLearned',
  'rhythmTrained',
  'practiced',
];

export const streakProgressSegmentColors: Record<StreakProgressSegment, string> = {
  chordLearned: museBuddyColors.sky,
  practiced: museBuddyColors.cobalt,
  rhythmTrained: museBuddyColors.petal,
  sheetRead: museBuddyColors.leaf,
};

export function isStreakProgressComplete(
  completedSegments: Readonly<Partial<Record<StreakProgressSegment, boolean>>>,
) {
  return streakProgressSegments.every((segment) => completedSegments[segment]);
}
