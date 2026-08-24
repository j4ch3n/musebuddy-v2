import { useRef } from 'react';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import { Button, TrainingControlDeck } from '@/ui';

import { useTrainingSession } from '@/contexts/training-session-context';

import { usePerformanceGuidance } from './performance-guidance-context';

const SKIP_HOLD_SECONDS = 1;
const STOP_HOLD_SECONDS = 0.8;

export function PerformanceGuidanceButton() {
  const {
    errorMessage,
    isDisabled,
    isRetryingCurrentSegment,
    phase,
    primaryButtonLabel,
    requestSkip,
    reset,
    start,
  } = usePerformanceGuidance();
  const { setTraining } = useTrainingSession();
  const router = useRouter();
  const abortConfirmationVisibleRef = useRef(false);
  const isMainDisabled = phase === 'pending' && isDisabled;
  const isMainLongPress = phase !== 'pending' && phase !== 'finish';
  const mainBackgroundColor = isRetryingCurrentSegment
    ? museBuddyColors.dangerFace
    : phase === 'pending'
      ? museBuddyColors.wildflower
      : museBuddyColors.sky;
  const mainSurfaceColor =
    phase === 'pending' || isRetryingCurrentSegment ? museBuddyColors.mist : museBuddyColors.pine;

  function startTraining() {
    setTraining(true);
    start();
  }

  function pauseTraining() {
    setTraining(false);
    reset();
  }

  function showAbortConfirmation() {
    if (abortConfirmationVisibleRef.current) {
      return;
    }

    abortConfirmationVisibleRef.current = true;
    Alert.alert('Quit training?', 'Your current training activity will end.', [
      {
        onPress: () => {
          abortConfirmationVisibleRef.current = false;
        },
        style: 'cancel',
        text: 'Keep practicing',
      },
      {
        onPress: () => {
          abortConfirmationVisibleRef.current = false;
          pauseTraining();
          router.replace('/');
        },
        style: 'destructive',
        text: 'Quit',
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <TrainingControlDeck
        primary={
          <Button
            backgroundColor={mainBackgroundColor}
            disabled={isMainDisabled}
            frameColor={museBuddyColors.pine}
            icon={
              <MaterialDesignIcons
                color={mainSurfaceColor}
                name={phase === 'pending' ? 'play' : 'pause'}
                size={21}
              />
            }
            label={primaryButtonLabel}
            longPressSeconds={isMainLongPress ? STOP_HOLD_SECONDS : null}
            onPress={phase === 'pending' ? startTraining : pauseTraining}
            progressColor={phase === 'pending' ? museBuddyColors.leaf : museBuddyColors.mist}
            shadowColor={museBuddyColors.pine}
            surfaceColor={mainSurfaceColor}
          />
        }
        skip={
          <Button
            backgroundColor={museBuddyColors.mist}
            disabled={phase === 'finish'}
            fontWeight="500"
            frameColor={museBuddyColors.pine}
            icon={<MaterialDesignIcons color={museBuddyColors.pine} name="skip-next" size={21} />}
            label="Skip"
            longPressSeconds={SKIP_HOLD_SECONDS}
            onPress={requestSkip}
            progressColor={museBuddyColors.sky}
            shadowColor={museBuddyColors.sunWash}
            surfaceColor={museBuddyColors.pine}
          />
        }
        abort={
          <Button
            backgroundColor={museBuddyColors.mist}
            frameColor={museBuddyColors.wildflower}
            icon={<MaterialDesignIcons color={museBuddyColors.wildflower} name="close" size={21} />}
            longPressSeconds={STOP_HOLD_SECONDS}
            onPress={showAbortConfirmation}
            progressColor={museBuddyColors.wildflower}
            shadowColor={museBuddyColors.petal}
            surfaceColor={museBuddyColors.wildflower}
          />
        }
      />

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  errorText: {
    color: museBuddyColors.pine,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
});
