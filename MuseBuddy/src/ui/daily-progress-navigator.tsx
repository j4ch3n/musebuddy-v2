import FontAwesome5 from '@react-native-vector-icons/fontawesome5';
import Lucide from '@react-native-vector-icons/lucide';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { View, XStack } from 'tamagui';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

export type DailyProgressNavigatorStep =
  | 'goal'
  | 'chord'
  | 'rhythm-bass'
  | 'rhythm-treble'
  | 'pattern';

type TrainingStepIconName = 'music';
type RhythmClefIconName = 'music-clef-bass' | 'music-clef-treble';

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
  | {
      clefIconName: RhythmClefIconName;
      iconFamily: 'rhythm';
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
    clefIconName: 'music-clef-bass',
    href: '/rhythm-training-bass',
    iconFamily: 'rhythm',
    id: 'rhythm-bass',
    label: 'Bass rhythm',
  },
  {
    accent: 'green',
    clefIconName: 'music-clef-treble',
    href: '/rhythm-training-treble',
    iconFamily: 'rhythm',
    id: 'rhythm-treble',
    label: 'Treble rhythm',
  },
  {
    accent: 'purple',
    href: '/pattern-training',
    iconFamily: 'fontAwesome5',
    iconName: 'shapes',
    id: 'pattern',
    label: 'Pattern',
  },
];

export function DailyProgressNavigator({ currentStep }: DailyProgressNavigatorProps) {
  const router = useRouter();
  const currentStepIndex = dailyProgressSteps.findIndex((step) => step.id === currentStep);

  return (
    <XStack accessibilityRole="tablist" flex={1} gap={4}>
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
            {step.iconFamily === 'rhythm' ? (
              <View style={styles.rhythmIconPair}>
                <FontAwesome5 color={museBuddyColors.ink} iconStyle="solid" name="drum" size={14} />
                <MaterialDesignIcons
                  color={museBuddyColors.ink}
                  name={step.clefIconName}
                  size={14}
                />
              </View>
            ) : step.iconFamily === 'lucide' ? (
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
  rhythmIconPair: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 1,
  },
  stepItem: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.surface,
    borderRadius: museBuddyRadii.medium,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    overflow: 'hidden',
    paddingBottom: 7,
    paddingHorizontal: 1,
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
