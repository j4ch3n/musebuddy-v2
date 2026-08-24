/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated by event handlers and worklets. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, type ColorValue, type TextStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text, YStack } from 'tamagui';

import { museBuddyBorders, museBuddyRadii } from '@/constants/design-tokens';

type ButtonProps = {
  backgroundColor: string;
  children?: ReactNode;
  disabled?: boolean;
  fontWeight?: TextStyle['fontWeight'];
  frameColor: string;
  icon?: ReactNode;
  label?: string;
  longPressSeconds?: number | null;
  onPress: () => void;
  progressColor?: ColorValue;
  shadowColor: string;
  surfaceColor: string;
};

export function Button({
  backgroundColor,
  children,
  disabled = false,
  fontWeight = '900',
  frameColor,
  icon,
  label,
  longPressSeconds = null,
  onPress,
  progressColor,
  shadowColor,
  surfaceColor,
}: ButtonProps) {
  const holdFill = useSharedValue(0);
  const consumesReleaseRef = useRef(false);
  const [isPressed, setIsPressed] = useState(false);
  const holdDurationMs = Math.max(0, longPressSeconds ?? 0) * 1000;
  const requiresLongPress = holdDurationMs > 0;
  const resolvedProgressColor = progressColor ?? (surfaceColor as ColorValue);

  useEffect(() => {
    if (!requiresLongPress || disabled) {
      cancelAnimation(holdFill);
      holdFill.value = 0;
    }
  }, [disabled, holdFill, requiresLongPress]);

  const holdFillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: holdFill.value }],
  }));

  function handlePressIn() {
    if (disabled) {
      return;
    }

    setIsPressed(true);
    consumesReleaseRef.current = requiresLongPress;

    if (!requiresLongPress) {
      return;
    }

    cancelAnimation(holdFill);
    holdFill.value = withTiming(
      1,
      { duration: holdDurationMs, easing: Easing.linear },
      (finished) => {
        if (finished) {
          runOnJS(completeLongPress)();
        }
      },
    );
  }

  function handlePressOut() {
    if (disabled) {
      return;
    }

    setIsPressed(false);

    if (!requiresLongPress) {
      return;
    }

    cancelAnimation(holdFill);
    holdFill.value = withTiming(0, { duration: 140 });
  }

  function completeLongPress() {
    onPress();
  }

  function handlePress() {
    if (consumesReleaseRef.current) {
      consumesReleaseRef.current = false;
      return;
    }

    if (!requiresLongPress) {
      onPress();
    }
  }

  return (
    <YStack
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor: frameColor,
          boxShadow: `6px 6px 0 ${shadowColor}`,
        },
        isPressed &&
          !disabled && {
            boxShadow: `2px 2px 0 ${shadowColor}`,
            transform: [{ translateX: 4 }, { translateY: 4 }],
          },
        disabled && styles.disabledButton,
      ]}
    >
      {requiresLongPress && (
        <Animated.View
          style={[styles.progressFill, { backgroundColor: resolvedProgressColor }, holdFillStyle]}
        />
      )}
      {children ?? (
        <YStack style={styles.content}>
          {icon}
          {label ? (
            <Text
              color={surfaceColor as never}
              fontSize={18}
              fontWeight={fontWeight as never}
              numberOfLines={1}
            >
              {label}
            </Text>
          ) : null}
        </YStack>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    justifyContent: 'center',
    minHeight: 58,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    zIndex: 1,
  },
  disabledButton: {
    boxShadow: 'none',
    opacity: 0.62,
  },
  progressFill: {
    bottom: 0,
    height: 6,
    left: 0,
    position: 'absolute',
    right: 0,
    transformOrigin: 'left',
  },
});
