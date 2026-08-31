import Lucide from '@react-native-vector-icons/lucide';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  FadeInUp,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text, XStack, YStack } from 'tamagui';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { BPM_OPTIONS } from '@/music-theory';

import { TactileControlAction } from './tactile-control';

type BpmControlProps = {
  direction?: 'down' | 'up';
  onChange: (bpm: number) => void;
  value: number;
};

const DRAWER_ANIMATION_MS = 180;

export function BpmControl({ direction = 'down', onChange, value }: BpmControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerProgress = useSharedValue(0);
  const drawerEnterOffset = direction === 'up' ? 8 : -8;

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
        translateY: (1 - drawerProgress.value) * drawerEnterOffset,
      },
      {
        scale: 0.96 + drawerProgress.value * 0.04,
      },
    ],
  }));

  const menu = isOpen ? (
    <Animated.View
      style={[styles.drawer, direction === 'up' ? styles.drawerUp : null, drawerStyle]}
    >
      <YStack accessibilityLabel="BPM options" accessibilityRole="tablist" gap="$2">
        {BPM_OPTIONS.map((option, optionIndex) => {
          const isSelected = option.bpm === value;
          const bottomUpDelay = (BPM_OPTIONS.length - optionIndex - 1) * 45;

          return (
            <Animated.View
              entering={FadeInUp.delay(bottomUpDelay)
                .duration(180)
                .reduceMotion(ReduceMotion.System)}
              key={option.id}
            >
              <XStack
                accessibilityLabel={`${option.label}, ${option.bpm} BPM`}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onChange(option.bpm);
                  setIsOpen(false);
                }}
                pressStyle={styles.optionPressed}
                style={[styles.option, isSelected && styles.optionSelected]}
              >
                {isSelected ? <Lucide color={museBuddyColors.mist} name="check" size={16} /> : null}
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
            </Animated.View>
          );
        })}
      </YStack>
    </Animated.View>
  ) : null;

  return (
    <TactileControlAction
      accessibilityLabel={`${value} BPM`}
      accessibilityState={{ expanded: isOpen }}
      containerStyle={styles.container}
      menu={menu}
      onPress={() => setIsOpen((current) => !current)}
      pressedStyle={styles.triggerPressed}
      style={styles.trigger}
    >
      <XStack style={styles.triggerContent}>
        <MaterialDesignIcons color={museBuddyColors.pine} name="metronome" size={18} />
        <XStack style={styles.bpmLabel}>
          <Text color={museBuddyColors.pine} fontSize={16} fontWeight="800" style={styles.bpmText}>
            {value}
          </Text>
          <Text color={museBuddyColors.pine} fontSize={12} fontWeight="700">
            BPM
          </Text>
        </XStack>
      </XStack>
    </TactileControlAction>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    height: 44,
    marginHorizontal: 4,
    minWidth: 84,
    zIndex: 20,
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.paper,
    borderColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.round,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `4px 4px 0 ${museBuddyColors.leafWash}`,
    justifyContent: 'center',
    height: 44,
    minWidth: 84,
    paddingHorizontal: 8,
  },
  triggerPressed: {
    boxShadow: `1px 1px 0 ${museBuddyColors.leafWash}`,
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
    borderWidth: museBuddyBorders.standard,
    minWidth: 210,
    padding: 10,
    position: 'absolute',
    right: 0,
    top: 44,
  },
  drawerUp: { bottom: 52, right: -10, top: undefined },
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
  bpmLabel: { alignItems: 'baseline', flexDirection: 'row', gap: 2 },
});
