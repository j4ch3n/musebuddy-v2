import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import { StyleSheet } from 'react-native';
import { Text, View, XStack, YStack } from 'tamagui';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

export type DailyProgressStep = 'chord' | 'rhythm' | 'jam';

type TrainingStepIconName = 'music' | 'drum' | 'magic';

type DailyProgressProps = {
  currentStep: DailyProgressStep;
};

type DailyProgressItem = {
  accent: 'blue' | 'green' | 'purple';
  iconName: TrainingStepIconName;
  id: DailyProgressStep;
  label: string;
};

const dailyProgressSteps: DailyProgressItem[] = [
  {
    accent: 'blue',
    iconName: 'music',
    id: 'chord',
    label: 'Chord',
  },
  {
    accent: 'green',
    iconName: 'drum',
    id: 'rhythm',
    label: 'Rhythm',
  },
  {
    accent: 'purple',
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
            <FontAwesome5
              color={museBuddyColors.ink}
              iconStyle="solid"
              name={step.iconName}
              size={22}
            />
            <Text
              color={museBuddyColors.ink}
              fontSize={13}
              fontWeight="900"
              lineHeight={16}
              style={styles.stepLabel}
            >
              {step.label}
            </Text>
            <View style={[styles.stepAccent, accentStyles[step.accent]]} />
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
});

const styles = StyleSheet.create({
  stepItem: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.surface,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 4px 0 ${museBuddyColors.ink}`,
    gap: 6,
    minHeight: 86,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingTop: 12,
  },
  stepItemActive: {
    backgroundColor: museBuddyColors.active,
    boxShadow: `0 6px 0 ${museBuddyColors.ink}`,
    transform: [{ translateY: -2 }],
  },
  stepItemComplete: {
    backgroundColor: museBuddyColors.surfaceMuted,
  },
  stepLabel: {
    textAlign: 'center',
  },
  stepAccent: {
    borderColor: museBuddyColors.ink,
    borderTopWidth: museBuddyBorders.bold,
    bottom: 0,
    height: 10,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
