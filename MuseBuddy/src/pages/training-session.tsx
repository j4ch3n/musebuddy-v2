import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ControlGroup } from '@/components/training-session';
import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import { TactileControlAction } from '@/ui';

export function TrainingSessionPage() {
  const router = useRouter();
  const {
    errorMessage,
    learningConfig,
    phase,
    resetTrainingSession,
    selectedPhraseIndex,
    session,
    setBpm,
  } = useTrainingSession();
  const barCount = session?.bars.length ?? 0;
  const progress = barCount > 0 ? Math.min((selectedPhraseIndex + 1) / barCount, 1) : 0;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <TrainingStage errorMessage={errorMessage} isLoading={phase === 'loading'} />
      <ControlGroup
        action={<StageAction />}
        bpm={learningConfig.bpm}
        onBpmChange={setBpm}
        onExit={() => router.dismissTo('/')}
        onExitConfirmed={resetTrainingSession}
      />
    </SafeAreaView>
  );
}

function TrainingStage({ errorMessage, isLoading }: { errorMessage: string; isLoading: boolean }) {
  const description = errorMessage
    ? errorMessage
    : isLoading
      ? 'Preparing your training material…'
      : 'Performance and quiz activities will appear here.';

  return (
    <View accessibilityRole={errorMessage ? 'alert' : undefined} style={styles.stage}>
      <Text style={styles.stageTitle}>
        {errorMessage ? 'Training unavailable' : 'Training stage'}
      </Text>
      <Text style={styles.stageDescription}>{description}</Text>
    </View>
  );
}

function StageAction() {
  return (
    <TactileControlAction
      accessibilityLabel="Start performance"
      disabled
      onPress={noop}
      style={styles.startButton}
    >
      <Text style={styles.startButtonLabel}>Start performance</Text>
    </TactileControlAction>
  );
}

function noop() {}

const styles = StyleSheet.create({
  progressFill: {
    backgroundColor: museBuddyColors.sky,
    borderRadius: museBuddyRadii.round,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: museBuddyColors.skyWash,
    borderRadius: museBuddyRadii.round,
    height: 10,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
  },
  safeArea: { backgroundColor: museBuddyColors.mist, flex: 1 },
  stage: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.paper,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.large,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `6px 6px 0 ${museBuddyColors.sky}`,
    flex: 1,
    justifyContent: 'center',
    margin: 16,
    minHeight: 0,
    padding: 24,
  },
  stageDescription: {
    color: museBuddyColors.pine,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
  },
  stageTitle: { color: museBuddyColors.pine, fontSize: 22, fontWeight: '800' },
  startButton: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.wildflower,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `4px 4px 0 ${museBuddyColors.pine}`,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  startButtonLabel: { color: museBuddyColors.mist, fontSize: 15, fontWeight: '800' },
});
