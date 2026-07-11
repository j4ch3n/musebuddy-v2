import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import Lucide from '@react-native-vector-icons/lucide';
import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { View, XStack } from 'tamagui';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

export type DailyProgressNavigatorStep = 'goal' | 'chord' | 'rhythm' | 'pattern' | 'jam';

type TrainingStepIconName = 'music' | 'drum' | 'magic';

type DailyProgressNavigatorProps = {
  currentStep: DailyProgressNavigatorStep;
};

type DailyProgressNavigatorItem = {
  accent: 'blue' | 'green' | 'purple' | 'secondary';
  href: Href;
  id: DailyProgressNavigatorStep;
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

const dailyProgressSteps: DailyProgressNavigatorItem[] = [
  {
    accent: 'secondary',
    href: '/session-goal',
    iconFamily: 'lucide',
    iconName: 'piano',
    id: 'goal',
    label: 'Goal',
  },
  {
    accent: 'blue',
    href: '/chord-learning',
    iconFamily: 'fontAwesome5',
    iconName: 'music',
    id: 'chord',
    label: 'Chord',
  },
  {
    accent: 'green',
    href: '/rhythm-training',
    iconFamily: 'fontAwesome5',
    iconName: 'drum',
    id: 'rhythm',
    label: 'Rhythm',
  },
  {
    accent: 'purple',
    href: '/pattern-training',
    iconFamily: 'fontAwesome5',
    iconName: 'shapes',
    id: 'pattern',
    label: 'Pattern',
  },
  {
    accent: 'purple',
    href: '/jam-session',
    iconFamily: 'fontAwesome5',
    iconName: 'magic',
    id: 'jam',
    label: 'Jam',
  },
];

export function DailyProgressNavigator({ currentStep }: DailyProgressNavigatorProps) {
  const router = useRouter();
  const currentStepIndex = dailyProgressSteps.findIndex((step) => step.id === currentStep);

  return (
    <XStack accessibilityRole="tablist" flex={1} gap={6}>
      {dailyProgressSteps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isComplete = index < currentStepIndex;
        const accentStyle = isActive ? styles.stepAccentActive : accentStyles[step.accent];

        return (
          <Pressable
            accessibilityLabel={`${step.label} step`}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            disabled={isActive}
            key={step.id}
            onPress={() => {
              router.replace(step.href);
            }}
            style={[
              styles.stepItem,
              isActive && styles.stepItemActive,
              isComplete && styles.stepItemComplete,
            ]}
          >
            {step.iconFamily === 'lucide' ? (
              <Lucide color={museBuddyColors.ink} name={step.iconName} size={20} />
            ) : (
              <FontAwesome5
                color={museBuddyColors.ink}
                iconStyle="solid"
                name={step.iconName}
                size={18}
              />
            )}
            <View style={[styles.stepAccent, accentStyle]} />
          </Pressable>
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
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    overflow: 'hidden',
    paddingBottom: 7,
    paddingHorizontal: 4,
    paddingTop: 7,
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
    height: 6,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  stepAccentActive: {
    backgroundColor: museBuddyColors.active,
  },
});
