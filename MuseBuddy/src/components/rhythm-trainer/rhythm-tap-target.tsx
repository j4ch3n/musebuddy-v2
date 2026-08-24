import { Pressable, StyleSheet, View } from 'react-native';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

type RhythmTapTargetProps = {
  isActive: boolean;
  onTap: (timestampMs: number) => void;
};

/**
 * A transparent input layer for the upcoming bar. The notation beneath it remains visible
 * while its corner brackets make the tap target discoverable.
 */
export function RhythmTapTarget({ isActive, onTap }: RhythmTapTargetProps) {
  return (
    <Pressable
      accessibilityHint="Tap in time with the rhythm."
      accessibilityLabel="Tap the next rhythm bar"
      accessibilityRole="button"
      disabled={!isActive}
      onPress={() => {
        onTap(Date.now());
      }}
      style={({ pressed }) => [
        styles.target,
        !isActive && styles.inactiveTarget,
        isActive && pressed && styles.pressedTarget,
      ]}
    >
      <View pointerEvents="none" style={styles.topLeftCorner} />
      <View pointerEvents="none" style={styles.topRightCorner} />
      <View pointerEvents="none" style={styles.bottomLeftCorner} />
      <View pointerEvents="none" style={styles.bottomRightCorner} />
    </Pressable>
  );
}

const corner = {
  borderColor: museBuddyColors.rhythmCurrent,
  height: 18,
  position: 'absolute' as const,
  width: 18,
};

const styles = StyleSheet.create({
  target: {
    borderCurve: 'continuous',
    borderRadius: museBuddyRadii.medium,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  inactiveTarget: {
    pointerEvents: 'none',
  },
  pressedTarget: {
    backgroundColor: museBuddyColors.skyWash,
  },
  topLeftCorner: {
    ...corner,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    left: 0,
    top: 0,
  },
  topRightCorner: {
    ...corner,
    borderRightWidth: 3,
    borderTopWidth: 3,
    right: 0,
    top: 0,
  },
  bottomLeftCorner: {
    ...corner,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    bottom: 0,
    left: 0,
  },
  bottomRightCorner: {
    ...corner,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    bottom: 0,
    right: 0,
  },
});
