import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import Lucide from '@react-native-vector-icons/lucide';
import { StyleSheet } from 'react-native';
import { View, XStack, YStack } from 'tamagui';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

export type DailyProgressStep = 'goal' | 'chord' | 'rhythm' | 'pattern' | 'jam';

type TrainingStepIconName = 'music' | 'drum' | 'magic';

type DailyProgressProps = {
  currentStep: DailyProgressStep;
};

type DailyProgressItem = {
  accent: 'blue' | 'green' | 'purple' | 'secondary';
  id: DailyProgressStep;
  label: string;
} & (
  | {
      iconFamily: 'fontAwesome5';
      iconName: TrainingStepIconName | 'shapes';
    }
  | {
      iconFamily: 'lucide';
      iconName: 'piano';
    }
);

const dailyProgressSteps: DailyProgressItem[] = [
  {
    accent: 'secondary',
    iconFamily: 'lucide',
    iconName: 'piano',
    id: 'goal',
    label: 'Goal',
  },
  {
    accent: 'blue',
    iconFamily: 'fontAwesome5',
    iconName: 'music',
    id: 'chord',
    label: 'Chord',
  },
  {
    accent: 'green',
    iconFamily: 'fontAwesome5',
    iconName: 'drum',
    id: 'rhythm',
    label: 'Rhythm',
  },
  {
    accent: 'purple',
    iconFamily: 'fontAwesome5',
    iconName: 'shapes',
    id: 'pattern',
    label: 'Pattern',
  },
  {
    accent: 'purple',
    iconFamily: 'fontAwesome5',
    iconName: 'magic',
    id: 'jam',
    label: 'Jam',
  },
];

export function DailyProgress({ currentStep }: DailyProgressProps) {
  const currentStepIndex = dailyProgressSteps.findIndex((step) => step.id === currentStep);

  return (
    <XStack accessibilityRole="summary" gap={10}>
      {dailyProgressSteps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentStepIndex;
        const accentStyle = isActive ? styles.stepAccentActive : accentStyles[step.accent];

        return (
          <YStack
            accessibilityLabel={`${step.label} step${isActive ? ', current' : ''}`}
            flex={1}
            key={step.id}
            style={[
              styles.stepItem,
              isActive && styles.stepItemActive,
              isComplete && styles.stepItemComplete,
            ]}
          >
            {step.iconFamily === 'lucide' ? (
              <Lucide color={museBuddyColors.ink} name={step.iconName} size={24} />
            ) : (
              <FontAwesome5
                color={museBuddyColors.ink}
                iconStyle="solid"
                name={step.iconName}
                size={22}
              />
            )}
            <View style={[styles.stepAccent, accentStyle]} />
          </YStack>
        );
      })}
    </XStack>
  );
}

const accentStyles = StyleSheet.create({
  blue: {
    backgroundColor: museBuddyColors.accentBlue,
  },
  green: {
    backgroundColor: museBuddyColors.accentGreen,
  },
  purple: {
    backgroundColor: museBuddyColors.accentPurple,
  },
  secondary: {
    backgroundColor: museBuddyColors.secondary,
  },
});

const styles = StyleSheet.create({
  stepItem: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.surface,
    borderRadius: museBuddyRadii.medium,
    justifyContent: 'center',
    minHeight: 52,
    overflow: 'hidden',
    paddingBottom: 8,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  stepItemActive: {
    boxShadow: `0 5px 0 ${museBuddyColors.active}`,
    transform: [{ translateY: -2 }],
  },
  stepItemComplete: {
    backgroundColor: museBuddyColors.surfaceMuted,
  },
  stepAccent: {
    bottom: 0,
    height: 7,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  stepAccentActive: {
    backgroundColor: museBuddyColors.active,
  },
});
