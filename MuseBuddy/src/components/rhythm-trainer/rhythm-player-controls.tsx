import { Pressable, StyleSheet, Text, View } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

type RhythmPlayerControlsProps = {
  isPlaying: boolean;
  onRandomPattern: () => void;
  onTogglePlayback: () => void;
};

export function RhythmPlayerControls({
  isPlaying,
  onRandomPattern,
  onTogglePlayback,
}: RhythmPlayerControlsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        onPress={onTogglePlayback}
        style={({ pressed }) => [
          styles.button,
          isPlaying && styles.stopButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonLabel}>{isPlaying ? 'Stop rhythm' : 'Play rhythm'}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={isPlaying}
        onPress={onRandomPattern}
        style={({ pressed }) => [
          styles.button,
          styles.randomButton,
          isPlaying && styles.buttonDisabled,
          pressed && !isPlaying && styles.buttonPressed,
        ]}
      >
        <Text style={[styles.buttonLabel, isPlaying && styles.disabledLabel]}>Random</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  button: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.primary,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 6px 0 ${museBuddyColors.ink}`,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  stopButton: {
    backgroundColor: museBuddyColors.accentRed,
  },
  randomButton: {
    backgroundColor: museBuddyColors.accentPurple,
  },
  buttonDisabled: {
    backgroundColor: museBuddyColors.surfaceMuted,
    opacity: 0.72,
  },
  buttonPressed: {
    boxShadow: `0 2px 0 ${museBuddyColors.ink}`,
    transform: [{ translateY: 4 }],
  },
  buttonLabel: {
    color: museBuddyColors.ink,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  disabledLabel: {
    color: 'rgba(32, 27, 34, 0.62)',
  },
});
