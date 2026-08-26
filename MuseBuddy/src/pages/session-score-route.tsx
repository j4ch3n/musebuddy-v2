import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  PerformanceGuidanceProvider,
  usePerformanceGuidance,
} from '@/components/performance-guidance';
import { PianoPatternScore } from '@/components/piano-pattern-score';
import type { TrainingSessionRoute } from '@/components/training-session';
import { museBuddyColors } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import {
  buildPatternSoundFontPlaybackConfiguration,
  type PreparedTrainingSession,
} from '@/music-theory';
import { Button, FlashCard } from '@/ui';

import { TrainingSessionShell } from './training-session-shell';

export function SessionScoreRoute({
  activeRoute,
}: {
  activeRoute: Extract<TrainingSessionRoute, 'full-play' | 'preview'>;
}) {
  const { learningConfig, session } = useTrainingSession();

  return (
    <TrainingSessionShell activeRoute={activeRoute}>
      {session ? (
        <SessionScorePlayback
          activeRoute={activeRoute}
          bpm={learningConfig.bpm}
          session={session}
        />
      ) : (
        <SessionUnavailable />
      )}
    </TrainingSessionShell>
  );
}

function SessionScorePlayback({
  activeRoute,
  bpm,
  session,
}: {
  activeRoute: Extract<TrainingSessionRoute, 'full-play' | 'preview'>;
  bpm: number;
  session: PreparedTrainingSession;
}) {
  const configuration = useMemo(
    () => buildPatternSoundFontPlaybackConfiguration(session.notes, bpm),
    [bpm, session.notes],
  );

  return (
    <PerformanceGuidanceProvider
      cycleCount={1}
      finishText=""
      listeningMode={{ kind: 'none' }}
      onFinish={noop}
      onSkip={noop}
      playback={{ configuration, kind: 'piano' }}
    >
      <SessionScorePlaybackContent activeRoute={activeRoute} session={session} />
    </PerformanceGuidanceProvider>
  );
}

function SessionScorePlaybackContent({
  activeRoute,
  session,
}: {
  activeRoute: Extract<TrainingSessionRoute, 'full-play' | 'preview'>;
  session: PreparedTrainingSession;
}) {
  const { countdownValue, currentStepIndex, errorMessage, isDisabled, phase, reset, start } =
    usePerformanceGuidance();
  const isPlaying = phase === 'demo' || phase === 'prepare';
  const isPreparing = phase === 'prepare';
  const routeName = activeRoute === 'preview' ? 'preview' : 'full session';

  return (
    <View style={styles.cardArea}>
      <FlashCard
        accessibilityLabel={activeRoute === 'preview' ? 'Score preview' : 'Full play score'}
        shadowColor={activeRoute === 'preview' ? museBuddyColors.sky : museBuddyColors.leaf}
        sideA={
          <PianoPatternScore
            chordChanges={session.scoreChordChanges}
            currentStepIndex={currentStepIndex}
            score={session.score}
            surfaceColor={museBuddyColors.paper}
          />
        }
        footer={
          <View style={styles.playControl}>
            {errorMessage ? (
              <Text accessibilityRole="alert" style={styles.playbackError}>
                {errorMessage}
              </Text>
            ) : null}
            <Button
              accessibilityLabel={
                isPlaying
                  ? `Hold for 1.5 seconds to stop ${routeName} playback`
                  : `Play ${routeName}`
              }
              backgroundColor={isPlaying ? museBuddyColors.sky : museBuddyColors.wildflower}
              disabled={!isPlaying && isDisabled}
              frameColor={museBuddyColors.pine}
              icon={
                isPreparing ? undefined : (
                  <FontAwesome5
                    color={isPlaying ? museBuddyColors.pine : museBuddyColors.mist}
                    iconStyle="solid"
                    name={isPlaying ? 'stop' : 'play'}
                    size={20}
                  />
                )
              }
              label={isPreparing ? undefined : isPlaying ? 'Hold to stop' : 'Play'}
              longPressSeconds={isPlaying ? 1.5 : null}
              onPress={isPlaying ? reset : start}
              progressColor={museBuddyColors.wildflower}
              shadowColor={museBuddyColors.pine}
              surfaceColor={isPlaying ? museBuddyColors.pine : museBuddyColors.mist}
            >
              {isPreparing ? <LeadInCountdown countdownValue={countdownValue} /> : undefined}
            </Button>
          </View>
        }
        style={styles.scoreCard}
      />
    </View>
  );
}

function LeadInCountdown({ countdownValue }: { countdownValue: number }) {
  const pulse = useSharedValue(0);
  const isCountInBeat = countdownValue < 4;

  useEffect(() => {
    pulse.value = 0;
    pulse.value = withSequence(withTiming(1, { duration: 150 }), withTiming(0, { duration: 650 }));
  }, [countdownValue, pulse]);

  const animatedCountdownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.12 }],
  }));

  return (
    <View accessibilityLiveRegion="polite" style={styles.countdownContent}>
      <Animated.Text
        accessibilityLabel={isCountInBeat ? `${countdownValue}` : 'Get ready'}
        style={[
          styles.countdownValue,
          !isCountInBeat && styles.countdownPrompt,
          animatedCountdownStyle,
        ]}
      >
        {isCountInBeat ? countdownValue : 'Get ready'}
      </Animated.Text>
    </View>
  );
}

export function SessionUnavailable() {
  return (
    <View accessibilityRole="alert" style={styles.unavailable}>
      <Text style={styles.unavailableText}>Training material is not ready yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardArea: { flex: 1, minHeight: 0, padding: 12, paddingBottom: 18 },
  countdownContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  countdownPrompt: { fontSize: 20 },
  countdownValue: {
    color: museBuddyColors.mist,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
    minWidth: 32,
    textAlign: 'center',
  },
  playControl: { alignSelf: 'center', gap: 8, width: '100%' },
  playbackError: {
    color: museBuddyColors.error,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreCard: { flex: 1 },
  unavailable: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  unavailableText: { color: museBuddyColors.pine, fontSize: 16, fontWeight: '800' },
});

const noop = () => {};
