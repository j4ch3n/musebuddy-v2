import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { PlayButtonGroup } from './play-button-group';
import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { BpmControl, TactileControlAction } from '@/ui';

type NavigatorProps = {
  bpm: number;
  canMoveBack: boolean;
  canMoveForward: boolean;
  countdownValue: number;
  isPlaying: boolean;
  isPreparing: boolean;
  onBpmChange: (bpm: number) => void;
  onExitConfirmed: () => void;
  onMoveBack: () => void;
  onMoveForward: () => void;
  onPlayPress: () => void;
  playDisabled: boolean;
  view: 'bar-details' | 'sheet';
};

export function Navigator({
  bpm,
  canMoveBack,
  canMoveForward,
  countdownValue,
  isPlaying,
  isPreparing,
  onBpmChange,
  onExitConfirmed,
  onMoveBack,
  onMoveForward,
  onPlayPress,
  playDisabled,
  view,
}: NavigatorProps) {
  const router = useRouter();

  return (
    <View accessibilityLabel="Training controls" style={styles.row}>
      <PlayButtonGroup
        canMoveBack={canMoveBack}
        canMoveForward={canMoveForward}
        countdownValue={countdownValue}
        isPlaying={isPlaying}
        isPreparing={isPreparing}
        onMoveBack={onMoveBack}
        onMoveForward={onMoveForward}
        onPlayPress={onPlayPress}
        playDisabled={playDisabled}
        view={view}
      />
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
                router.dismissTo('/');
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
