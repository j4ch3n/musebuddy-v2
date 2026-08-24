import { useEffect, useMemo } from 'react';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { PianoPatternScore } from '@/components/piano-pattern-score';
import {
  PerformanceGuidanceProvider,
  usePerformanceGuidance,
} from '@/components/performance-guidance';
import { museBuddyColors } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import { buildPatternSoundFontPlaybackConfiguration } from '@/music-theory/sound-font-playback';
import { BpmControl, Button } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function SessionGoalPage() {
  const { learningConfig, prepareTrainingSession, session } = useTrainingSession();
  const playbackConfiguration = useMemo(
    () =>
      session
        ? buildPatternSoundFontPlaybackConfiguration(session.notes, learningConfig.bpm)
        : null,
    [learningConfig.bpm, session],
  );

  const content = (
    <TrainingScreenShell currentStep="goal" footer={session ? <PreviewControlDock /> : null}>
      {session ? (
        <GuidedPianoPatternScore chordChanges={session.scoreChordChanges} score={session.score} />
      ) : (
        <PlaceholderPanel
          accent="wildflower"
          body="Load today's training to set a clear practice target before moving into chord and rhythm work."
          title="Today's goal"
        />
      )}
      {!session && (
        <Button
          backgroundColor={museBuddyColors.wildflower}
          frameColor={museBuddyColors.pine}
          label="Load training"
          onPress={() => void prepareTrainingSession()}
          shadowColor={museBuddyColors.pine}
          surfaceColor={museBuddyColors.mist}
        />
      )}
    </TrainingScreenShell>
  );

  if (!session) {
    return content;
  }

  return (
    <PerformanceGuidanceProvider
      cycleCount={2}
      finishText="I'm excited, let's go!"
      key="session-goal"
      listeningMode={{ kind: 'none' }}
      onFinish={() => {}}
      onSkip={() => {}}
      playback={{
        configuration: playbackConfiguration,
        kind: 'piano',
      }}
      startPhase="pending"
    >
      {content}
    </PerformanceGuidanceProvider>
  );
}

function PreviewControlDock() {
  const { isDisabled, phase, reset, start } = usePerformanceGuidance();
  const { learningConfig, setBpm } = useTrainingSession();
  const router = useRouter();

  useEffect(() => {
    if (phase === 'finish') {
      reset();
    }
  }, [phase, reset]);

  const isPlaying = phase === 'prepare' || phase === 'demo';

  return (
    <View style={styles.controls}>
      <Button
        backgroundColor={museBuddyColors.mist}
        frameColor={museBuddyColors.wildflower}
        icon={<MaterialDesignIcons color={museBuddyColors.wildflower} name="close" size={20} />}
        onPress={() =>
          Alert.alert('Quit training?', 'Your current practice will end.', [
            { text: 'Keep practicing', style: 'cancel' },
            { text: 'Quit', style: 'destructive', onPress: () => router.replace('/') },
          ])
        }
        shadowColor={museBuddyColors.petal}
        surfaceColor={museBuddyColors.wildflower}
      />
      <PreviewArrow direction="left" disabled />
      <Button
        backgroundColor={isPlaying ? museBuddyColors.sky : museBuddyColors.wildflower}
        disabled={phase === 'pending' && isDisabled}
        frameColor={museBuddyColors.pine}
        icon={
          <MaterialDesignIcons
            color={museBuddyColors.mist}
            name={isPlaying ? 'pause' : 'play'}
            size={20}
          />
        }
        label={`${isPlaying ? 'Pause' : 'Start'} 1/1`}
        onPress={isPlaying ? reset : start}
        shadowColor={museBuddyColors.pine}
        surfaceColor={museBuddyColors.mist}
      />
      <PreviewArrow direction="right" onPress={() => router.replace('/bar-details')} />
      <BpmControl direction="up" onChange={setBpm} value={learningConfig.bpm} />
    </View>
  );
}

function PreviewArrow({
  direction,
  disabled = false,
  onPress = () => {},
}: {
  direction: 'left' | 'right';
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <Button
      backgroundColor={museBuddyColors.mist}
      disabled={disabled}
      frameColor={museBuddyColors.pine}
      icon={
        <MaterialDesignIcons
          color={museBuddyColors.pine}
          name={direction === 'left' ? 'chevron-left' : 'chevron-right'}
          size={24}
        />
      }
      onPress={onPress}
      shadowColor={museBuddyColors.sky}
      surfaceColor={museBuddyColors.pine}
    />
  );
}

function GuidedPianoPatternScore({
  chordChanges,
  score,
}: {
  chordChanges: NonNullable<ReturnType<typeof useTrainingSession>['session']>['scoreChordChanges'];
  score: NonNullable<ReturnType<typeof useTrainingSession>['session']>['score'];
}) {
  const { currentStepIndex, phase } = usePerformanceGuidance();

  return (
    <PianoPatternScore
      chordChanges={chordChanges}
      currentStepIndex={currentStepIndex}
      score={score}
      swipeEnabled={phase === 'pending'}
    />
  );
}

const styles = StyleSheet.create({
  controls: { alignItems: 'center', flexDirection: 'row', gap: 7 },
});
