import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { museBuddyColors } from '@/constants/design-tokens';

type RhythmAttackDebugIndicatorProps = {
  flashId: number;
};

export function RhythmAttackDebugIndicator({ flashId }: RhythmAttackDebugIndicatorProps) {
  const opacity = useSharedValue(0.18);

  useEffect(() => {
    if (flashId === 0) {
      return;
    }

    cancelAnimation(opacity);
    opacity.value = withSequence(
      withTiming(1, { duration: 70 }),
      withTiming(0.18, { duration: 230 }),
    );
  }, [flashId, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityLabel="Piano attack activity indicator"
      pointerEvents="none"
      style={[styles.indicator, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: museBuddyColors.error,
    borderColor: museBuddyColors.frame,
    borderRadius: 6,
    borderWidth: 1,
    height: 12,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 12,
    zIndex: 2,
  },
});
