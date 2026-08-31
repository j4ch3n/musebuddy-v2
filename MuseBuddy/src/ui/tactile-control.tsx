/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated by event handlers and worklets. */
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityState,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type TactileControlActionProps = {
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  disabledStyle?: StyleProp<ViewStyle>;
  holdProgress?: SharedValue<number>;
  menu?: ReactNode;
  onPress: () => void;
  longPressSeconds?: number | null;
  pressedStyle?: StyleProp<ViewStyle>;
  progressColor?: ColorValue;
  showHoldProgress?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function TactileControlAction({
  accessibilityLabel,
  accessibilityState,
  children,
  containerStyle,
  disabled = false,
  disabledStyle,
  holdProgress: externalHoldProgress,
  menu,
  onPress,
  longPressSeconds = null,
  pressedStyle,
  progressColor,
  showHoldProgress = true,
  style,
}: TactileControlActionProps) {
  const localHoldProgress = useSharedValue(0);
  const holdProgress = externalHoldProgress ?? localHoldProgress;
  const consumesReleaseRef = useRef(false);
  const holdDurationMs = Math.max(0, longPressSeconds ?? 0) * 1000;
  const requiresLongPress = holdDurationMs > 0;

  useEffect(() => {
    if (!requiresLongPress || disabled) {
      cancelAnimation(holdProgress);
      holdProgress.value = 0;
    }
  }, [disabled, holdProgress, requiresLongPress]);

  const holdProgressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: holdProgress.value }],
  }));

  function handlePressIn() {
    if (!requiresLongPress || disabled) return;

    consumesReleaseRef.current = false;
    cancelAnimation(holdProgress);
    holdProgress.value = withTiming(1, {
      duration: holdDurationMs,
      easing: Easing.linear,
    });
  }

  function handlePressOut() {
    if (!requiresLongPress || disabled) return;

    cancelAnimation(holdProgress);
    holdProgress.value = withTiming(0, { duration: 140 });
  }

  function handleLongPress() {
    consumesReleaseRef.current = true;
    onPress();
  }

  function handlePress() {
    if (consumesReleaseRef.current) {
      consumesReleaseRef.current = false;
      return;
    }
    if (!requiresLongPress) onPress();
  }

  const action = (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      delayLongPress={requiresLongPress ? holdDurationMs : undefined}
      onLongPress={requiresLongPress ? handleLongPress : undefined}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        styles.action,
        style,
        pressed && !disabled ? pressedStyle : null,
        disabled ? [styles.disabled, disabledStyle] : null,
      ]}
    >
      {requiresLongPress && progressColor && showHoldProgress ? (
        <Animated.View
          style={[styles.holdProgress, { backgroundColor: progressColor }, holdProgressStyle]}
        />
      ) : null}
      <View pointerEvents="none" style={styles.content}>
        {children}
      </View>
    </Pressable>
  );

  if (!containerStyle && !menu) return action;

  return (
    <View style={[styles.container, containerStyle]}>
      {action}
      {menu}
    </View>
  );
}

const styles = StyleSheet.create({
  action: { overflow: 'hidden', position: 'relative' },
  container: { position: 'relative' },
  content: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
    zIndex: 1,
  },
  disabled: { opacity: 0.62 },
  holdProgress: {
    bottom: 0,
    height: 6,
    left: 0,
    position: 'absolute',
    right: 0,
    transformOrigin: 'left',
    zIndex: 2,
  },
});
