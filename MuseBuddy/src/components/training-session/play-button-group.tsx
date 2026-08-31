import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { TactileControlAction } from '@/ui/tactile-control';

type PlayButtonGroupProps = {
  canMoveBack: boolean;
  canMoveForward: boolean;
  countdownValue: number;
  isPlaying: boolean;
  isPreparing: boolean;
  onMoveBack: () => void;
  onMoveForward: () => void;
  onPlayPress: () => void;
  playDisabled: boolean;
  view: 'bar-details' | 'sheet';
};

const ARROW_WIDTH = 48;
const PLAY_WIDTH = 80;
const STOP_HOLD_SECONDS = 0.8;

export function PlayButtonGroup({
  canMoveBack,
  canMoveForward,
  countdownValue,
  isPlaying,
  isPreparing,
  onMoveBack,
  onMoveForward,
  onPlayPress,
  playDisabled,
  view,
}: PlayButtonGroupProps) {
  const navigationProgress = useSharedValue(view === 'bar-details' ? 1 : 0);
  const stopHoldProgress = useSharedValue(0);
  const showNavigation = view === 'bar-details';
  const navigationIconColor =
    !isPlaying || (isPreparing && countdownValue === 4)
      ? museBuddyColors.mist
      : museBuddyColors.pine;

  useEffect(() => {
    navigationProgress.value = withTiming(showNavigation ? 1 : 0, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.Never,
    });
  }, [navigationProgress, showNavigation]);

  const leftSegmentStyle = useAnimatedStyle(() => ({
    opacity: navigationProgress.value,
    transform: [{ translateX: -18 * (1 - navigationProgress.value) }],
  }));
  const rightSegmentStyle = useAnimatedStyle(() => ({
    opacity: navigationProgress.value,
    transform: [{ translateX: 18 * (1 - navigationProgress.value) }],
  }));
  const stopHoldProgressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: stopHoldProgress.value }],
  }));

  return (
    <View style={[styles.group, isPlaying && !isPreparing ? styles.activeGroup : null]}>
      {isPreparing ? <LeadInOverlay countdownValue={countdownValue} /> : null}
      <Animated.View
        pointerEvents={showNavigation ? 'auto' : 'none'}
        style={[styles.sideSegment, leftSegmentStyle]}
      >
        <TactileControlAction
          accessibilityLabel="Previous bar"
          disabled={!canMoveBack}
          onPress={onMoveBack}
          pressedStyle={styles.segmentPressed}
          style={styles.arrowSegment}
        >
          <FontAwesome5 color={navigationIconColor} iconStyle="solid" name="angle-left" size={24} />
        </TactileControlAction>
      </Animated.View>
      <TactileControlAction
        accessibilityLabel={
          isPreparing
            ? `Lead-in: ${leadInLabel(countdownValue)}`
            : isPlaying
              ? 'Hold for 0.8 seconds to stop playback'
              : 'Play selection'
        }
        disabled={!isPlaying && playDisabled}
        holdProgress={stopHoldProgress}
        longPressSeconds={isPlaying ? STOP_HOLD_SECONDS : null}
        onPress={onPlayPress}
        pressedStyle={styles.segmentPressed}
        progressColor={museBuddyColors.wildflower}
        showHoldProgress={false}
        style={styles.playSegment}
      >
        {!isPreparing ? (
          <View style={styles.playContent}>
            <FontAwesome5
              color={isPlaying ? museBuddyColors.pine : museBuddyColors.mist}
              iconStyle="solid"
              name={isPlaying ? 'stop' : 'play'}
              size={22}
            />
          </View>
        ) : null}
      </TactileControlAction>
      <Animated.View
        pointerEvents={showNavigation ? 'auto' : 'none'}
        style={[styles.sideSegment, rightSegmentStyle]}
      >
        <TactileControlAction
          accessibilityLabel="Next bar"
          disabled={!canMoveForward}
          onPress={onMoveForward}
          pressedStyle={styles.segmentPressed}
          style={styles.arrowSegment}
        >
          <FontAwesome5
            color={navigationIconColor}
            iconStyle="solid"
            name="angle-right"
            size={24}
          />
        </TactileControlAction>
      </Animated.View>
      {isPlaying ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.stopHoldProgress, stopHoldProgressStyle]}
        />
      ) : null}
    </View>
  );
}

function leadInLabel(countdownValue: number) {
  return countdownValue === 4 ? 'Ready' : String(countdownValue);
}

function LeadInOverlay({ countdownValue }: { countdownValue: number }) {
  const colorStep = useSharedValue(countdownValue);
  const pulse = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    colorStep.value = withTiming(countdownValue, {
      duration: 180,
      reduceMotion: ReduceMotion.System,
    });
    pulse.value = 0;
    pulse.value = withSequence(
      withTiming(1, { duration: 140, reduceMotion: ReduceMotion.System }),
      withTiming(0, { duration: 400, reduceMotion: ReduceMotion.System }),
    );
    cancelAnimation(shimmer);
    shimmer.value = 0;
    if (countdownValue === 4) {
      shimmer.value = withTiming(1, { duration: 620, reduceMotion: ReduceMotion.System });
    }
  }, [colorStep, countdownValue, pulse, shimmer]);

  const surfaceStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      colorStep.value,
      [1, 2, 3, 4],
      [museBuddyColors.sky, museBuddyColors.leaf, museBuddyColors.sun, museBuddyColors.wildflower],
    ),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.12 }],
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.12, 0.82, 1], [0, 0.3, 0.3, 0]),
    transform: [{ rotate: '-16deg' }, { translateX: -220 + shimmer.value * 440 }],
  }));

  return (
    <View pointerEvents="none" style={styles.leadInOverlay}>
      <Animated.View style={[styles.leadInSurface, surfaceStyle]} />
      <Animated.View style={[styles.shimmer, shimmerStyle]} />
      <Animated.View style={[styles.leadInLabelWrap, labelStyle]}>
        <Text style={[styles.leadInLabel, countdownValue === 4 ? styles.readyLabel : null]}>
          {leadInLabel(countdownValue)}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeGroup: { backgroundColor: museBuddyColors.sky },
  arrowSegment: { alignItems: 'center', height: 44, justifyContent: 'center', width: ARROW_WIDTH },
  sideSegment: { height: 44, overflow: 'hidden', width: ARROW_WIDTH, zIndex: 1 },
  group: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.wildflower,
    borderColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.round,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `4px 4px 0 ${museBuddyColors.skyWash}`,
    flexDirection: 'row',
    height: 44,
    overflow: 'hidden',
    position: 'relative',
    width: ARROW_WIDTH * 2 + PLAY_WIDTH,
  },
  leadInLabel: { color: museBuddyColors.pine, fontSize: 18, fontWeight: '900' },
  leadInLabelWrap: { zIndex: 1 },
  leadInOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  leadInSurface: { ...StyleSheet.absoluteFill },
  playContent: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center' },
  playSegment: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: PLAY_WIDTH,
    zIndex: 1,
  },
  readyLabel: { color: museBuddyColors.mist },
  segmentPressed: { opacity: 0.76, transform: [{ translateY: 2 }] },
  shimmer: { backgroundColor: museBuddyColors.mist, height: 90, position: 'absolute', width: 46 },
  stopHoldProgress: {
    backgroundColor: museBuddyColors.wildflower,
    bottom: 0,
    height: 4,
    left: 0,
    position: 'absolute',
    right: 0,
    transformOrigin: 'left',
    zIndex: 3,
  },
});
