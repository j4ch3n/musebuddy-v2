/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated by event handlers and worklets. */
import { useEffect, useRef, useState } from 'react';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { TrainingControlDeck } from '@/ui';

import { usePerformanceGuidance } from './performance-guidance-context';

const HOLD_DURATION_MS = 3000;
const SKIP_HOLD_DURATION_MS = 1000;
const STOP_HOLD_DURATION_MS = 800;

export function PerformanceGuidanceButton() {
  const { errorMessage, isDisabled, phase, requestSkip, reset, start } = usePerformanceGuidance();
  const router = useRouter();
  const prepareScale = useSharedValue(1);
  const finishFill = useSharedValue(0);
  const mainHoldFill = useSharedValue(0);
  const skipFill = useSharedValue(0);
  const abortFill = useSharedValue(0);
  const [isMainHoldActive, setIsMainHoldActive] = useState(false);
  const abortConfirmationVisibleRef = useRef(false);
  const shouldSuppressNextMainPressRef = useRef(false);
  const isMainDisabled = phase === 'pending' && isDisabled;
  const label = phase === 'pending' ? 'Start' : 'Pause';

  useEffect(() => {
    if (phase === 'prepare') {
      prepareScale.value = withRepeat(
        withTiming(0.94, {
          duration: 420,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true,
      );
      return;
    }

    cancelAnimation(prepareScale);
    prepareScale.value = withTiming(1, { duration: 140 });
  }, [phase, prepareScale]);

  useEffect(() => {
    cancelAnimation(finishFill);
    finishFill.value = 0;

    if (phase === 'finish') {
      finishFill.value = withTiming(1, {
        duration: HOLD_DURATION_MS,
        easing: Easing.linear,
      });
    }
  }, [finishFill, phase]);

  useEffect(() => {
    if (phase !== 'pending') {
      return;
    }

    cancelAnimation(mainHoldFill);
    mainHoldFill.value = 0;
  }, [mainHoldFill, phase]);

  const mainAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: prepareScale.value }],
  }));

  const finishFillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: finishFill.value }],
  }));

  const mainHoldFillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: mainHoldFill.value }],
  }));

  const skipFillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: skipFill.value }],
  }));

  const abortFillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: abortFill.value }],
  }));

  function handleMainPressIn() {
    if (phase === 'pending') {
      return;
    }

    setIsMainHoldActive(true);
    cancelAnimation(mainHoldFill);
    mainHoldFill.value = withTiming(
      1,
      {
        duration: STOP_HOLD_DURATION_MS,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          runOnJS(suppressNextMainPress)();
          runOnJS(setIsMainHoldActive)(false);
          runOnJS(reset)();
        }
      },
    );
  }

  function suppressNextMainPress() {
    shouldSuppressNextMainPressRef.current = true;
  }

  function handleMainPressOut() {
    if (phase === 'pending') {
      return;
    }

    setIsMainHoldActive(false);
    cancelAnimation(mainHoldFill);
    mainHoldFill.value = withTiming(0, { duration: 140 });
  }

  function handleSkipPressIn() {
    if (phase === 'finish') {
      return;
    }

    cancelAnimation(skipFill);
    skipFill.value = withTiming(
      1,
      {
        duration: SKIP_HOLD_DURATION_MS,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          runOnJS(requestSkip)();
        }
      },
    );
  }

  function handleSkipPressOut() {
    if (phase === 'finish') {
      return;
    }

    cancelAnimation(skipFill);
    skipFill.value = withTiming(0, { duration: 140 });
  }

  function handleAbortPressIn() {
    cancelAnimation(abortFill);
    abortFill.value = withTiming(
      1,
      {
        duration: STOP_HOLD_DURATION_MS,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          runOnJS(showAbortConfirmation)();
        }
      },
    );
  }

  function handleAbortPressOut() {
    cancelAnimation(abortFill);
    abortFill.value = withTiming(0, { duration: 140 });
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
          reset();
          router.replace('/');
        },
        style: 'destructive',
        text: 'Quit',
      },
    ]);
  }

  function handleMainPress() {
    if (shouldSuppressNextMainPressRef.current) {
      shouldSuppressNextMainPressRef.current = false;
      return;
    }

    start();
  }

  return (
    <View style={styles.container}>
      <TrainingControlDeck
        primary={
          <Pressable
            accessibilityHint={
              phase === 'pending'
                ? 'Starts performance guidance.'
                : 'Pauses the current playback control.'
            }
            accessibilityRole="button"
            accessibilityState={{ busy: isMainHoldActive, disabled: isMainDisabled }}
            disabled={isMainDisabled}
            onPress={phase === 'pending' ? handleMainPress : undefined}
            onPressIn={handleMainPressIn}
            onPressOut={handleMainPressOut}
            style={styles.primaryPressable}
          >
            <Animated.View
              style={[
                styles.mainButton,
                phase !== 'pending' && styles.pauseButton,
                isMainDisabled && styles.disabledButton,
                mainAnimatedStyle,
              ]}
            >
              {phase === 'finish' && <Animated.View style={[styles.fill, finishFillStyle]} />}
              {phase !== 'pending' && (
                <Animated.View style={[styles.stopFill, mainHoldFillStyle]} />
              )}
              <MaterialDesignIcons
                color={phase === 'pending' ? museBuddyColors.mist : museBuddyColors.pine}
                name={phase === 'pending' ? 'play' : 'pause'}
                size={21}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.mainLabel,
                  phase !== 'pending' && styles.pauseLabel,
                  isMainDisabled && styles.disabledLabel,
                ]}
              >
                {label}
              </Text>
            </Animated.View>
          </Pressable>
        }
        skip={
          <Pressable
            accessibilityLabel="Skip training"
            accessibilityHint="Hold for one second to skip this training page."
            accessibilityRole="button"
            disabled={phase === 'finish'}
            onPressIn={handleSkipPressIn}
            onPressOut={handleSkipPressOut}
            style={[styles.skipButton, phase === 'finish' && styles.skipDisabled]}
          >
            <Animated.View style={[styles.skipFill, skipFillStyle]} />
            <MaterialDesignIcons color={museBuddyColors.pine} name="skip-next" size={21} />
            <Text style={styles.skipLabel}>Skip</Text>
          </Pressable>
        }
        abort={
          <Pressable
            accessibilityLabel="Abort training"
            accessibilityHint="Hold to quit this training activity."
            accessibilityRole="button"
            onPressIn={handleAbortPressIn}
            onPressOut={handleAbortPressOut}
            style={styles.abortButton}
          >
            <Animated.View style={[styles.abortFill, abortFillStyle]} />
            <MaterialDesignIcons color={museBuddyColors.wildflower} name="close" size={21} />
          </Pressable>
        }
      />

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  abortButton: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.wildflower,
    borderRadius: museBuddyRadii.medium,
    borderWidth: 1,
    boxShadow: `4px 4px 0 ${museBuddyColors.wildflower}`,
    flex: 1,
    justifyContent: 'center',
    minHeight: 58,
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  abortFill: {
    backgroundColor: museBuddyColors.wildflower,
    bottom: 0,
    height: 5,
    left: 0,
    position: 'absolute',
    right: 0,
    transformOrigin: 'left',
  },
  container: {
    gap: 10,
  },
  disabledButton: {
    backgroundColor: museBuddyColors.mist,
    boxShadow: 'none',
    opacity: 0.72,
  },
  disabledLabel: {
    color: museBuddyColors.pine,
  },
  errorText: {
    color: museBuddyColors.pine,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
  fill: {
    bottom: 0,
    backgroundColor: museBuddyColors.leaf,
    height: 6,
    left: 0,
    position: 'absolute',
    right: 0,
    transformOrigin: 'left',
  },
  pauseButton: {
    backgroundColor: museBuddyColors.sky,
  },
  pauseLabel: { color: museBuddyColors.pine },
  mainButton: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.wildflower,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: 1,
    boxShadow: `4px 4px 0 ${museBuddyColors.frame}`,
    flexDirection: 'row',
    gap: 8,
    height: 58,
    justifyContent: 'center',
    flex: 1,
    minHeight: 58,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 0,
  },
  mainLabel: {
    color: museBuddyColors.mist,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryPressable: { flex: 1 },
  skipButton: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: 1,
    boxShadow: `4px 4px 0 ${museBuddyColors.sun}`,
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    overflow: 'hidden',
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 4,
  },
  skipLabel: {
    color: museBuddyColors.pine,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  skipDisabled: {
    opacity: 0.48,
  },
  skipFill: {
    backgroundColor: museBuddyColors.sky,
    bottom: 0,
    height: 5,
    left: 0,
    position: 'absolute',
    right: 0,
    transformOrigin: 'left',
  },
  stopFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: museBuddyColors.mist,
    opacity: 0.22,
    transformOrigin: 'left',
  },
});
