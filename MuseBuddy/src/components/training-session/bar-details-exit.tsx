import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Pressable, StyleSheet } from 'react-native';

import { museBuddyBorders, museBuddyColors } from '@/constants/design-tokens';

type BarDetailsExitProps = {
  onPress: () => void;
};

export function BarDetailsExit({ onPress }: BarDetailsExitProps) {
  return (
    <Pressable
      accessibilityHint="Returns to the full sheet preview"
      accessibilityLabel="Exit bar details"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <MaterialIcons color={museBuddyColors.pine} name="fullscreen-exit" size={25} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.pine,
    borderRadius: 22,
    borderWidth: museBuddyBorders.standard,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  buttonPressed: { transform: [{ translateY: 2 }] },
});
