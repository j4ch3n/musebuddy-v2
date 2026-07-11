/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated by event handlers and worklets. */
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import { usePerformanceGuidance } from './performance-guidance-context';

const HOLD_DURATION_MS = 3000;

export function PerformanceGuidanceButton() {
  const {
    completedCycles,
    cycleCount,
    countdownValue,
    errorMessage,
    finishText,
    isDisabled,
    listeningEnabled,
    phase,
    requestSkip,
    start,
  } = usePerformanceGuidance();
  const prepareScale = useSharedValue(1);
  const finishFill = useSharedValue(0);
  const skipFill = useSharedValue(0);
  const isMainPressable = phase === 'pending' && !isDisabled;
  const label = getMainLabel({
    completedCycles,
    countdownValue,
    cycleCount,
    finishText,
    listeningEnabled,
    phase,
  });

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

  const mainAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: prepareScale.value }],
  }));

  const finishFillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: finishFill.value }],
  }));

  const skipFillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: skipFill.value }],
  }));

  function handleSkipPressIn() {
    if (phase === 'finish') {
      return;
    }

    cancelAnimation(skipFill);
    skipFill.value = withTiming(
      1,
      {
        duration: HOLD_DURATION_MS,
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

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !isMainPressable }}
        disabled={!isMainPressable}
        onPress={start}
      >
        <Animated.View
          style={[
            styles.mainButton,
            phase === 'demo' && styles.demoButton,
            phase === 'listening' && styles.listeningButton,
            phase === 'finish' && styles.finishButton,
            isDisabled && styles.disabledButton,
            mainAnimatedStyle,
          ]}
        >
          {phase === 'finish' && <Animated.View style={[styles.fill, finishFillStyle]} />}
          <Text style={styles.mainLabel}>{label}</Text>
        </Animated.View>
      </Pressable>

      <View style={styles.metaRow}>
        <Text style={styles.statusText}>{getStatusText(phase)}</Text>
        <Pressable
          accessibilityHint="Hold for three seconds to skip this training page."
          accessibilityRole="button"
          disabled={phase === 'finish'}
          onPressIn={handleSkipPressIn}
          onPressOut={handleSkipPressOut}
          style={[styles.skipButton, phase === 'finish' && styles.skipDisabled]}
        >
          <Animated.View style={[styles.skipFill, skipFillStyle]} />
          <Text style={styles.skipLabel}>Hold to skip</Text>
        </Pressable>
      </View>

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
    </View>
  );
}

function getMainLabel({
  completedCycles,
  countdownValue,
  cycleCount,
  finishText,
  listeningEnabled,
  phase,
}: {
  completedCycles: number;
  countdownValue: number;
  cycleCount: number;
  finishText: string;
  listeningEnabled: boolean;
  phase: string;
}) {
  switch (phase) {
    case 'prepare':
      return String(countdownValue);
    case 'demo':
      return `Demo ${completedCycles + 1}/${cycleCount}`;
    case 'listening':
      return listeningEnabled ? 'Your turn' : 'Demo';
    case 'finish':
      return finishText;
    default:
      return 'Start';
  }
}

function getStatusText(phase: string) {
  switch (phase) {
    case 'prepare':
      return 'Get ready';
    case 'demo':
      return 'Demoing';
    case 'listening':
      return 'Listening';
    case 'finish':
      return 'Finished';
    default:
      return 'Ready';
  }
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  demoButton: {
    backgroundColor: museBuddyColors.accentBlue,
  },
  disabledButton: {
    backgroundColor: museBuddyColors.surfaceMuted,
    opacity: 0.72,
  },
  errorText: {
    color: museBuddyColors.accentRed,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
  fill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: museBuddyColors.accentGreen,
    opacity: 0.9,
    transformOrigin: 'left',
  },
  finishButton: {
    backgroundColor: museBuddyColors.surface,
  },
  listeningButton: {
    backgroundColor: museBuddyColors.accentPurple,
  },
  mainButton: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.primary,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 8px 0 ${museBuddyColors.ink}`,
    justifyContent: 'center',
    minHeight: 72,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  mainLabel: {
    color: museBuddyColors.ink,
    fontSize: 24,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    lineHeight: 30,
    textAlign: 'center',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  skipButton: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.surface,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.medium,
    borderWidth: 3,
    minHeight: 40,
    minWidth: 126,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipDisabled: {
    opacity: 0.48,
  },
  skipFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: museBuddyColors.accentRed,
    opacity: 0.9,
    transformOrigin: 'left',
  },
  skipLabel: {
    color: museBuddyColors.ink,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
    textAlign: 'center',
  },
  statusText: {
    color: museBuddyColors.ink,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
    textTransform: 'uppercase',
  },
});
