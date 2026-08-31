import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import {
  PerformanceGuidanceProvider,
  usePerformanceGuidance,
} from '@/components/performance-guidance';
import { museBuddyBorders, museBuddyColors } from '@/constants/design-tokens';
import {
  buildPatternSoundFontPlaybackConfiguration,
  type PreparedTrainingBar,
} from '@/music-theory';

type BarSoundPreviewButtonProps = {
  bar: PreparedTrainingBar;
  bpm: number;
};

const soundIconNames = ['volume-off', 'volume-low', 'volume-medium', 'volume-high'] as const;

export function BarSoundPreviewButton({ bar, bpm }: BarSoundPreviewButtonProps) {
  const configuration = useMemo(
    () => buildPatternSoundFontPlaybackConfiguration(bar.beats, bpm),
    [bar.beats, bpm],
  );

  return (
    <PerformanceGuidanceProvider
      cycleCount={1}
      finishDurationMs={0}
      finishText=""
      listeningMode={{ kind: 'none' }}
      onFinish={noop}
      onSkip={noop}
      playback={{ configuration, kind: 'piano' }}
    >
      <BarSoundPreviewControl />
    </PerformanceGuidanceProvider>
  );
}

function BarSoundPreviewControl() {
  const { isDisabled, phase, reset, start } = usePerformanceGuidance();
  const [frame, setFrame] = useState(0);
  const isPlaying = phase === 'demo' || phase === 'prepare';

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(
      () => setFrame((current) => (current + 1) % soundIconNames.length),
      180,
    );
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handlePress = () => {
    if (isPlaying) {
      reset();
      return;
    }
    setFrame(0);
    start();
  };

  return (
    <Pressable
      accessibilityLabel={isPlaying ? 'Stop bar audio preview' : 'Play bar audio preview'}
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
    >
      <Ionicons
        color={museBuddyColors.pine}
        name={isPlaying ? soundIconNames[frame] : 'volume-medium'}
        size={27}
      />
    </Pressable>
  );
}

function noop() {}

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
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { transform: [{ translateY: 2 }] },
});
