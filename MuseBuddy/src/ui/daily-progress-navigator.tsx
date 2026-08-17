import { Ionicons } from '@react-native-vector-icons/ionicons';
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
  | 'pattern';

type DailyProgressNavigatorProps = {
  currentStep: DailyProgressNavigatorStep;
};

type DailyProgressNavigatorItem = {
  href?: Href;
  id: DailyProgressNavigatorStep | 'freestyle';
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
  { href: '/pattern-training', id: 'pattern', label: 'Full score' },
  { id: 'freestyle', label: 'Freestyle' },
];

export function DailyProgressNavigator({ currentStep }: DailyProgressNavigatorProps) {
  const router = useRouter();
  const currentStepIndex = dailyProgressSteps.findIndex((step) => step.id === currentStep);

  return (
    <View accessibilityRole="tablist" style={styles.navigator}>
      <View pointerEvents="none" style={styles.connectionTrack}>
        {dailyProgressSteps.slice(0, -1).map((step, index) => (
          <View
            key={step.id}
            style={[styles.connection, index < currentStepIndex && styles.connectionComplete]}
          />
        ))}
      </View>
      <View style={styles.steps}>
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
                styles.stepTouchTarget,
                isActive && styles.stepTouchTargetActive,
                pressed && !isActive && styles.stepPressed,
              ]}
            >
              <View
                style={[
                  styles.stepTile,
                  isActive && styles.stepTileActive,
                  isComplete && styles.stepTileComplete,
                ]}
              >
                <TrainingStageIcon
                  color={isActive ? museBuddyColors.mist : museBuddyColors.pine}
                  id={step.id}
                  size={isActive ? 21 : 18}
                />
                {isComplete ? (
                  <View style={styles.completionCheck}>
                    <MaterialDesignIcons color={museBuddyColors.mist} name="check" size={10} />
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TrainingStageIcon({
  color,
  id,
  size,
}: {
  color: string;
  id: DailyProgressNavigatorItem['id'];
  size: number;
}) {
  switch (id) {
    case 'goal':
      return <Lucide color={color} name="book-open" size={size} />;
    case 'chord':
      return <MaterialIcons color={color} name="grid-on" size={size} />;
    case 'pattern':
      return <Ionicons color={color} name="musical-note" size={size} />;
    case 'freestyle':
      return <MaterialIcons color={color} name="piano" size={size} />;
    case 'rhythm-bass':
      return <MaterialDesignIcons color={color} name="music-clef-bass" size={size} />;
    case 'rhythm-treble':
      return <MaterialDesignIcons color={color} name="music-clef-treble" size={size} />;
  }
}

const styles = StyleSheet.create({
  completionCheck: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.round,
    bottom: -3,
    height: 15,
    justifyContent: 'center',
    position: 'absolute',
    right: -3,
    width: 15,
  },
  connection: { backgroundColor: museBuddyColors.pine, flex: 1, height: 1, opacity: 0.34 },
  connectionComplete: { backgroundColor: museBuddyColors.leaf, opacity: 1 },
  connectionTrack: {
    flexDirection: 'row',
    left: '8.333%',
    position: 'absolute',
    right: '8.333%',
    top: 22,
  },
  navigator: { flex: 1, height: 61, minWidth: 0 },
  stepPressed: { transform: [{ translateY: 1 }] },
  stepTile: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.small,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepTileActive: {
    backgroundColor: museBuddyColors.wildflower,
    borderColor: museBuddyColors.wildflower,
    height: 42,
    width: 42,
  },
  stepTileComplete: {
    backgroundColor: museBuddyColors.leaf,
    borderColor: museBuddyColors.leaf,
  },
  stepTouchTarget: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    minHeight: 36,
  },
  stepTouchTargetActive: { marginTop: -3 },
  steps: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
});
