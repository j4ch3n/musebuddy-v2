import { Lucide } from '@react-native-vector-icons/lucide';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

export type DailyProgressNavigatorStep =
  | 'goal'
  | 'chord'
  | 'rhythm-bass'
  | 'rhythm-treble'
  | 'freestyle';

type DailyProgressNavigatorProps = {
  currentStep: DailyProgressNavigatorStep;
};

export type TrainingStageIconId = DailyProgressNavigatorStep;

type DailyProgressNavigatorItem = {
  href?: Href;
  id: TrainingStageIconId;
  label: string;
};

const dailyProgressSteps: readonly DailyProgressNavigatorItem[] = [
  { href: '/session-goal', id: 'goal', label: 'Preview' },
  { href: '/chord-learning', id: 'chord', label: 'Chords' },
  {
    href: '/rhythm-training-treble',
    id: 'rhythm-treble',
    label: 'Right rhythm',
  },
  {
    href: '/rhythm-training-bass',
    id: 'rhythm-bass',
    label: 'Left rhythm',
  },
  { href: '/improvise', id: 'freestyle', label: 'Improvise' },
];

export function DailyProgressNavigator({ currentStep }: DailyProgressNavigatorProps) {
  const router = useRouter();
  const currentStepIndex = dailyProgressSteps.findIndex((step) => step.id === currentStep);

  return (
    <View accessibilityRole="tablist" style={styles.navigator}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={styles.shadow}
      />
      <View style={styles.capsule}>
        {dailyProgressSteps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isComplete = index < currentStepIndex;
          const isUnavailable = step.href === undefined;

          return (
            <Pressable
              accessibilityLabel={`${step.label} stage`}
              accessibilityRole="tab"
              accessibilityState={{ disabled: isUnavailable, selected: isActive }}
              disabled={isActive || isUnavailable}
              hitSlop={4}
              key={step.id}
              onPress={() => {
                if (step.href) {
                  router.replace(step.href);
                }
              }}
              style={({ pressed }) => [
                styles.step,
                isActive && styles.stepActive,
                isComplete && styles.stepComplete,
                pressed && !isActive && styles.stepPressed,
              ]}
            >
              <TrainingStageIcon
                color={isActive ? museBuddyColors.mist : museBuddyColors.pine}
                id={step.id}
                size={16}
              />
              {!isActive &&
              index + 1 !== currentStepIndex &&
              index < dailyProgressSteps.length - 1 ? (
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  pointerEvents="none"
                  style={styles.stepDivider}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function TrainingStageIcon({
  color,
  id,
  size,
}: {
  color: string;
  id: TrainingStageIconId;
  size: number;
}) {
  switch (id) {
    case 'goal':
      return <Lucide color={color} name="book-open" size={size} />;
    case 'chord':
      return <MaterialIcons color={color} name="grid-on" size={size} />;
    case 'freestyle':
      return <MaterialIcons color={color} name="piano" size={size} />;
    case 'rhythm-bass':
      return <MaterialDesignIcons color={color} name="music-clef-bass" size={size} />;
    case 'rhythm-treble':
      return <MaterialDesignIcons color={color} name="music-clef-treble" size={size} />;
  }
}

const styles = StyleSheet.create({
  capsule: {
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.round,
    borderWidth: 1,
    flexDirection: 'row',
    height: 38,
    overflow: 'hidden',
  },
  navigator: {
    flex: 1,
    height: 42,
    minWidth: 0,
    paddingBottom: 4,
    paddingRight: 4,
    position: 'relative',
  },
  shadow: {
    backgroundColor: museBuddyColors.frame,
    borderColor: museBuddyColors.mist,
    borderRadius: museBuddyRadii.round,
    borderWidth: 1,
    bottom: 0,
    left: 4,
    position: 'absolute',
    right: 0,
    top: 4,
  },
  step: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    position: 'relative',
  },
  stepDivider: {
    backgroundColor: museBuddyColors.frame,
    bottom: 8,
    position: 'absolute',
    right: 0,
    top: 8,
    width: 1,
  },
  stepComplete: {
    backgroundColor: museBuddyColors.leafWash,
  },
  stepActive: { backgroundColor: museBuddyColors.wildflower },
  stepPressed: { transform: [{ translateX: 1 }, { translateY: 1 }] },
});
