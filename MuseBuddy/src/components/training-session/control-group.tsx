import Lucide from '@react-native-vector-icons/lucide';
import { type ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { BpmControl, TactileControlAction } from '@/ui';

type ControlGroupProps = {
  action: ReactNode;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  onExit: () => void;
  onExitConfirmed: () => void;
};

/**
 * The persistent training control dock. Each activity supplies its own primary action,
 * while tempo and exit controls stay consistent across performance and quiz stages.
 */
export function ControlGroup({
  action,
  bpm,
  onBpmChange,
  onExit,
  onExitConfirmed,
}: ControlGroupProps) {
  return (
    <View accessibilityLabel="Training controls" style={styles.row}>
      <View style={styles.action}>{action}</View>
      <View style={styles.spacer} />
      <BpmControl direction="up" onChange={onBpmChange} value={bpm} />
      <TactileControlAction
        accessibilityLabel="Exit training"
        onPress={() =>
          Alert.alert('Quit training?', 'Your current practice will end.', [
            { text: 'Keep practicing', style: 'cancel' },
            {
              text: 'Quit',
              style: 'destructive',
              onPress: () => {
                onExitConfirmed();
                onExit();
              },
            },
          ])
        }
        pressedStyle={styles.exitPressed}
        style={styles.exitButton}
      >
        <Lucide color={museBuddyColors.wildflower} name="x" size={20} />
      </TactileControlAction>
    </View>
  );
}

const styles = StyleSheet.create({
  action: { minWidth: 0 },
  exitButton: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.wildflower,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `4px 4px 0 ${museBuddyColors.petal}`,
    height: 44,
    justifyContent: 'center',
    width: 48,
  },
  exitPressed: {
    boxShadow: `1px 1px 0 ${museBuddyColors.petal}`,
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  spacer: { flex: 1 },
});
