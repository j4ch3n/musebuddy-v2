import { museBuddyColors } from '@/constants/design-tokens';

import type { RhythmStep } from './types';

export type RhythmStepColorRole = 'hold' | 'rest' | 'strong' | 'weak';

export const rhythmStepRoleLabels: Record<RhythmStepColorRole, string> = {
  hold: 'Hold',
  rest: 'Rest',
  strong: 'Strong',
  weak: 'Weak',
};

export const rhythmStepRoleColors: Record<RhythmStepColorRole, string> = {
  hold: museBuddyColors.rhythmHold,
  rest: museBuddyColors.rhythmRest,
  strong: museBuddyColors.rhythmStrong,
  weak: museBuddyColors.rhythmWeak,
};

export function getRhythmStepColorRole(step: RhythmStep): RhythmStepColorRole {
  if (step === 's') {
    return 'strong';
  }

  if (step === 'w') {
    return 'weak';
  }

  if (step === 'h') {
    return 'hold';
  }

  return 'rest';
}
