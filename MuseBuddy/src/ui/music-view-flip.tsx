import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

type MusicViewFlipProps = {
  keyboard: ReactNode;
  notation: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** A reusable keyboard/notation flip control for musical learning surfaces. */
export function MusicViewFlip({ keyboard, notation, style }: MusicViewFlipProps) {
  const [isNotationVisible, setIsNotationVisible] = useState(false);
  const progress = useDerivedValue(() => withTiming(isNotationVisible ? 1 : 0, { duration: 280 }));
  const keyboardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45, 0.55, 1], [1, 0, 0, 0]),
    transform: [{ perspective: 900 }, { rotateY: `${progress.value * 180}deg` }],
  }));
  const notationStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.45, 0.55, 1], [0, 0, 0, 1]),
    transform: [{ perspective: 900 }, { rotateY: `${180 + progress.value * 180}deg` }],
  }));
  const toggleView = useCallback(() => {
    setIsNotationVisible((visible) => !visible);
  }, []);
  const nextViewLabel = isNotationVisible ? 'View keyboard' : 'View notation';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.surface}>
        <Animated.View
          accessibilityElementsHidden={isNotationVisible}
          importantForAccessibility={isNotationVisible ? 'no-hide-descendants' : 'auto'}
          pointerEvents={isNotationVisible ? 'none' : 'auto'}
          style={[styles.face, keyboardStyle]}
        >
          {keyboard}
        </Animated.View>
        <Animated.View
          accessibilityElementsHidden={!isNotationVisible}
          importantForAccessibility={isNotationVisible ? 'auto' : 'no-hide-descendants'}
          pointerEvents={isNotationVisible ? 'auto' : 'none'}
          style={[styles.face, notationStyle]}
        >
          {notation}
        </Animated.View>
      </View>
      <Pressable
        accessibilityHint="Switches between keyboard and notation views"
        accessibilityLabel={nextViewLabel}
        accessibilityRole="button"
        onPress={toggleView}
        style={({ pressed }) => [
          styles.toggle,
          { boxShadow: `${pressed ? 1 : 3}px ${pressed ? 1 : 3}px 0 ${museBuddyColors.pine}` },
          pressed && styles.togglePressed,
        ]}
      >
        <Ionicons color={museBuddyColors.pine} name="swap-horizontal" size={18} />
        <Text style={styles.toggleLabel}>{nextViewLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, gap: 8, minHeight: 0 },
  face: {
    alignItems: 'stretch',
    backfaceVisibility: 'hidden',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  surface: { alignSelf: 'stretch', flex: 1, minHeight: 0 },
  toggle: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.round,
    borderWidth: museBuddyBorders.standard,
    flexDirection: 'row',
    gap: 5,
    minHeight: 36,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  toggleLabel: { color: museBuddyColors.pine, fontSize: 13, fontWeight: '900' },
  togglePressed: { transform: [{ translateX: 2 }, { translateY: 2 }] },
});
