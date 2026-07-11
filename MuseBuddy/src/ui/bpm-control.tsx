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
        <Text color={museBuddyColors.ink} fontSize={14} fontWeight="900" style={styles.bpmText}>
          {value} BPM
        </Text>
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
                  <Text
                    color={museBuddyColors.ink}
                    fontSize={14}
                    fontWeight="900"
                    numberOfLines={1}
                    style={styles.optionLabel}
                  >
                    {option.label}
                  </Text>
                  <Text
                    color={museBuddyColors.ink}
                    fontSize={13}
                    fontWeight="900"
                    numberOfLines={1}
                    style={[styles.bpmValue, isSelected && styles.bpmValueSelected]}
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
    minWidth: 92,
    zIndex: 20,
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.secondary,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.round,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 4px 0 ${museBuddyColors.ink}`,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 92,
    paddingHorizontal: 12,
  },
  triggerPressed: {
    boxShadow: `0 1px 0 ${museBuddyColors.ink}`,
    transform: [{ translateY: 3 }],
  },
  drawer: {
    backgroundColor: museBuddyColors.surface,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.large,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 5px 0 ${museBuddyColors.ink}`,
    minWidth: 210,
    padding: 10,
    position: 'absolute',
    right: 0,
    top: 52,
  },
  option: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.surfaceMuted,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.medium,
    borderWidth: 2,
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionPressed: {
    backgroundColor: museBuddyColors.secondary,
    transform: [{ translateY: 2 }],
  },
  optionSelected: {
    backgroundColor: museBuddyColors.active,
  },
  optionLabel: {
    flexShrink: 1,
  },
  bpmValue: {
    backgroundColor: museBuddyColors.surface,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.round,
    borderWidth: 2,
    fontVariant: ['tabular-nums'],
    minWidth: 48,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    textAlign: 'center',
  },
  bpmValueSelected: {
    backgroundColor: museBuddyColors.secondary,
  },
  bpmText: {
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});
