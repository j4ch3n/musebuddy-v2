import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

const soundIconNames = ['volume-off', 'volume-low', 'volume-medium', 'volume-high'] as const;

type PlayButtonProps = {
  disabled?: boolean;
  isPlaying?: boolean;
  onPress: () => void;
};

export function PlayButton({ disabled = false, isPlaying = false, onPress }: PlayButtonProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(
      () => setFrame((current) => (current + 1) % soundIconNames.length),
      180,
    );
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <Pressable
      accessibilityLabel={isPlaying ? 'Stop progression preview' : 'Play progression preview'}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: isPlaying }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.shadow,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Ionicons
        color={museBuddyColors.pine}
        name={isPlaying ? soundIconNames[frame] : 'volume-medium'}
        size={25}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.round,
    borderWidth: museBuddyBorders.standard,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  disabled: { opacity: 0.45 },
  shadow: { boxShadow: `3px 3px 0 ${museBuddyColors.sky}` },
  pressed: {
    boxShadow: `1px 1px 0 ${museBuddyColors.sky}`,
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
});
