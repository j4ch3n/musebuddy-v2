import Lucide from '@react-native-vector-icons/lucide';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text, XStack, YStack } from 'tamagui';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { BPM_OPTIONS } from '@/music-theory';

type BpmControlProps = {
  onChange: (bpm: number) => void;
  value: number;
};

const DRAWER_ANIMATION_MS = 180;

export function BpmControl({ onChange, value }: BpmControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerProgress = useSharedValue(0);

  useEffect(() => {
    drawerProgress.value = withTiming(isOpen ? 1 : 0, {
      duration: DRAWER_ANIMATION_MS,
      reduceMotion: ReduceMotion.System,
    });
  }, [drawerProgress, isOpen]);

  const drawerStyle = useAnimatedStyle(() => ({
    opacity: drawerProgress.value,
    transform: [
      {
        translateY: (1 - drawerProgress.value) * -8,
      },
      {
        scale: 0.96 + drawerProgress.value * 0.04,
      },
    ],
  }));

  return (
    <YStack style={styles.container}>
      <Pressable
        accessibilityLabel={`${value} BPM`}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => {
          setIsOpen((current) => !current);
        }}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
      >
        <XStack style={styles.triggerContent}>
          <Text color={museBuddyColors.pine} fontSize={11} fontWeight="900" style={styles.bpmText}>
            {value} BPM
          </Text>
          <MaterialDesignIcons color={museBuddyColors.pine} name="metronome" size={14} />
        </XStack>
      </Pressable>

      {isOpen ? (
        <Animated.View style={[styles.drawer, drawerStyle]}>
          <YStack accessibilityLabel="BPM options" accessibilityRole="tablist" gap="$2">
            {BPM_OPTIONS.map((option) => {
              const isSelected = option.bpm === value;

              return (
                <XStack
                  accessibilityLabel={`${option.label}, ${option.bpm} BPM`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  key={option.id}
                  onPress={() => {
                    onChange(option.bpm);
                    setIsOpen(false);
                  }}
                  pressStyle={styles.optionPressed}
                  style={[styles.option, isSelected && styles.optionSelected]}
                >
                  {isSelected ? (
                    <Lucide color={museBuddyColors.mist} name="check" size={16} />
                  ) : null}
                  <Text
                    color={museBuddyColors.pine}
                    fontSize={14}
                    fontWeight="900"
                    numberOfLines={1}
                    style={[styles.optionLabel, isSelected && styles.optionTextSelected]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    color={museBuddyColors.pine}
                    fontSize={13}
                    fontWeight="900"
                    numberOfLines={1}
                    style={[styles.bpmValue, isSelected && styles.optionTextSelected]}
                  >
                    {option.bpm}
                  </Text>
                </XStack>
              );
            })}
          </YStack>
        </Animated.View>
      ) : null}
    </YStack>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    height: 42,
    minWidth: 84,
    zIndex: 20,
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.round,
    borderWidth: 1,
    boxShadow: `4px 4px 0 ${museBuddyColors.frame}`,
    justifyContent: 'center',
    height: 38,
    minWidth: 84,
    paddingHorizontal: 8,
  },
  triggerPressed: {
    boxShadow: `1px 1px 0 ${museBuddyColors.frame}`,
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  triggerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  drawer: {
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: 1,
    boxShadow: `4px 4px 0 ${museBuddyColors.frame}`,
    minWidth: 210,
    padding: 10,
    position: 'absolute',
    right: 0,
    top: 40,
  },
  option: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: 2,
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionPressed: {
    backgroundColor: museBuddyColors.leafWash,
    transform: [{ translateY: 2 }],
  },
  optionSelected: {
    backgroundColor: museBuddyColors.wildflower,
    borderColor: museBuddyColors.frame,
    borderWidth: museBuddyBorders.standard,
  },
  optionLabel: {
    flexShrink: 1,
  },
  optionTextSelected: {
    color: museBuddyColors.mist,
  },
  bpmValue: {
    fontVariant: ['tabular-nums'],
    minWidth: 48,
    textAlign: 'center',
  },
  bpmText: {
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});
