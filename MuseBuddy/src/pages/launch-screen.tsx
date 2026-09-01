import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { museBuddyColors } from '@/constants/design-tokens';

const DESIGN_WIDTH = 1290;
const DESIGN_HEIGHT = 2796;
const LAUNCH_HOLD_MS = 1000;
const SCREEN_EXIT_MS = 460;

const buddySource = require('@assets/images/brand/musebuddy-buddy.png');
const postcardSource = require('@assets/images/splash-screen-postcard.png');
const wordmarkSource = require('@assets/images/brand/musebuddy-wordmark.png');

type LaunchScreenProps = {
  onComplete: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
};

export function LaunchScreen({ onComplete, onLayout }: LaunchScreenProps) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const [hasLaidOut, setHasLaidOut] = useState(false);
  const transitionProgress = useSharedValue(0);
  const scale = Math.max(screenWidth / DESIGN_WIDTH, screenHeight / DESIGN_HEIGHT);
  const scaledWidth = DESIGN_WIDTH * scale;
  const scaledHeight = DESIGN_HEIGHT * scale;
  const canvasOffsetX = (screenWidth - scaledWidth) / 2;
  const canvasOffsetY = (screenHeight - scaledHeight) / 2;

  const transitionStyle = useAnimatedStyle(() => ({
    opacity: 1 - transitionProgress.value,
    transform: [{ scale: 1 + transitionProgress.value * 0.28 }],
  }));

  useEffect(() => {
    if (!hasLaidOut) return;

    transitionProgress.value = withDelay(
      LAUNCH_HOLD_MS,
      withTiming(1, { duration: SCREEN_EXIT_MS }, (finished) => {
        if (finished) runOnJS(onComplete)();
      }),
    );

    return () => {
      cancelAnimation(transitionProgress);
    };
  }, [hasLaidOut, onComplete, transitionProgress]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onLayout(event);
      setHasLaidOut(true);
    },
    [onLayout],
  );

  return (
    <View onLayout={handleLayout} style={styles.screen}>
      <Animated.View
        style={[
          styles.canvasViewport,
          transitionStyle,
          {
            height: scaledHeight,
            left: canvasOffsetX,
            top: canvasOffsetY,
            width: scaledWidth,
          },
        ]}
      >
        <View style={[styles.designCanvas, { transform: [{ scale }] }]}>
          <Image
            accessibilityLabel="Buddy, the MuseBuddy companion"
            contentFit="contain"
            source={buddySource}
            style={styles.mascot}
          />
          <View style={styles.postcardShadow} />
          <View style={styles.postcardFrame}>
            <View style={styles.postcardMask}>
              <Image contentFit="cover" source={postcardSource} style={styles.postcardImage} />
            </View>
          </View>
          <View style={styles.leftHand} />
          <View style={styles.rightHand} />
          <Image
            accessibilityLabel="MuseBuddy"
            contentFit="contain"
            source={wordmarkSource}
            style={styles.wordmark}
          />
        </View>
      </Animated.View>
    </View>
  );
}

function centered(centerX: number, centerY: number, width: number, height: number) {
  return {
    height,
    left: centerX - width / 2,
    position: 'absolute' as const,
    top: centerY - height / 2,
    width,
  };
}

const styles = StyleSheet.create({
  canvasViewport: {
    position: 'absolute',
  },
  designCanvas: {
    height: DESIGN_HEIGHT,
    position: 'absolute',
    transformOrigin: 'top left',
    width: DESIGN_WIDTH,
  },
  leftHand: {
    ...centered(335, 875, 96, 96),
    backgroundColor: museBuddyColors.buddy,
    borderRadius: 48,
  },
  mascot: {
    ...centered(645, 720, 620, 620),
    borderRadius: 72,
  },
  postcardFrame: {
    ...centered(645, 1165, 1070, 700),
    backgroundColor: museBuddyColors.pine,
    borderRadius: 52,
    overflow: 'hidden',
    padding: 10,
    transform: [{ rotate: '-7deg' }],
  },
  postcardImage: { height: 680, width: 1050 },
  postcardMask: {
    borderRadius: 42,
    height: 680,
    overflow: 'hidden',
    width: 1050,
  },
  postcardShadow: {
    ...centered(671, 1195, 1070, 700),
    backgroundColor: museBuddyColors.sky,
    borderRadius: 52,
    transform: [{ rotate: '-7deg' }],
  },
  screen: {
    backgroundColor: museBuddyColors.skyWash,
    flex: 1,
    overflow: 'hidden',
  },
  rightHand: {
    ...centered(955, 800, 96, 96),
    backgroundColor: museBuddyColors.buddy,
    borderRadius: 48,
  },
  wordmark: centered(645, 2015, 1080, 283),
});
