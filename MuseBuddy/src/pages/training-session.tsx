import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarDetailsExit, BarSoundPreviewButton, Navigator } from '@/components/training-session';
import { PhraseStageCard } from '@/components/phrase-stage-card';
import { PianoPatternScore, type ScoreTarget } from '@/components/piano-pattern-score';
import {
  PerformanceGuidanceProvider,
  usePerformanceGuidance,
} from '@/components/performance-guidance';
import { museBuddyColors } from '@/constants/design-tokens';
import { type TrainingDetailTab, useTrainingSession } from '@/contexts/training-session-context';
import {
  buildChordPhrasePreviewSoundFontPlaybackConfiguration,
  buildPatternSoundFontPlaybackConfiguration,
  buildRhythmSoundFontPlaybackConfiguration,
  type PreparedTrainingBar,
} from '@/music-theory';
import { FlashCard } from '@/ui';

export function TrainingSessionPage() {
  const {
    learningConfig,
    openBarDetails,
    selectedDetailTab,
    selectedPhraseIndex,
    session,
    showSheet,
    view,
  } = useTrainingSession();
  const bar = session?.bars[selectedPhraseIndex];
  const tab = useMemo<TrainingDetailTab>(
    () => selectedDetailTab ?? { chordIndex: 0, kind: 'chord' },
    [selectedDetailTab],
  );
  const configuration = useMemo(() => {
    if (!session) return null;
    if (view === 'sheet')
      return buildPatternSoundFontPlaybackConfiguration(session.notes, learningConfig.bpm);
    if (!bar) return null;
    if (tab.kind === 'rhythm')
      return buildRhythmSoundFontPlaybackConfiguration(
        bar.rhythms[tab.staff].pattern,
        learningConfig.bpm,
      );
    const chord = bar.chordDisplays[tab.chordIndex] ?? bar.chordDisplays[0];
    return chord
      ? buildChordPhrasePreviewSoundFontPlaybackConfiguration(chord, learningConfig.bpm)
      : null;
  }, [bar, learningConfig.bpm, session, tab, view]);

  if (!session || !configuration) return <SessionUnavailable />;
  return (
    <PerformanceGuidanceProvider
      cycleCount={1}
      finishText=""
      listeningMode={{ kind: 'none' }}
      onFinish={noop}
      onSkip={noop}
      playback={{
        configuration,
        kind: tab.kind === 'rhythm' && view === 'bar-details' ? 'groove' : 'piano',
      }}
    >
      <TrainingSessionContent
        bar={bar}
        onOpenTarget={(target) => openBarDetails(target.measureIndex, targetToTab(target))}
        showSheet={showSheet}
        tab={tab}
      />
    </PerformanceGuidanceProvider>
  );
}

function TrainingSessionContent({
  bar,
  onOpenTarget,
  showSheet,
  tab,
}: {
  bar: PreparedTrainingBar | undefined;
  onOpenTarget: (target: ScoreTarget) => void;
  showSheet: () => void;
  tab: TrainingDetailTab;
}) {
  const { learningConfig, openBarDetails, selectedPhraseIndex, session, setBpm, view } =
    useTrainingSession();
  const { countdownValue, currentStepIndex, errorMessage, isDisabled, phase, reset, start } =
    usePerformanceGuidance();
  const isPlaying = phase === 'demo' || phase === 'prepare';
  const bars = session?.bars ?? [];
  const move = (offset: number) => {
    const next = selectedPhraseIndex + offset;
    if (next < 0 || next >= bars.length) return;
    openBarDetails(next, { chordIndex: 0, kind: 'chord' });
  };
  useEffect(() => () => reset(), [reset, view, selectedPhraseIndex, tab]);
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.content}>
        {view === 'sheet' ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.fill}>
            <FlashCard
              borderColor={museBuddyColors.frame}
              padded={false}
              shadowColor={museBuddyColors.leaf}
              sideA={
                <PianoPatternScore
                  chordChanges={session?.scoreChordChanges ?? []}
                  currentStepIndex={currentStepIndex}
                  measuresPerPage={4}
                  onTargetPress={async (target) => onOpenTarget(target)}
                  score={session!.score}
                  style={styles.fill}
                  surfaceColor={museBuddyColors.paper}
                />
              }
              style={styles.sheetPreviewCard}
              surfaceColor={museBuddyColors.paper}
            />
          </Animated.View>
        ) : bar ? (
          <Animated.View entering={SlideInRight} exiting={SlideInLeft} style={styles.barContent}>
            <View style={styles.barPreview}>
              <View style={styles.barControls}>
                <BarSoundPreviewButton bar={bar} bpm={learningConfig.bpm} />
                <BarDetailsExit onPress={showSheet} />
              </View>
              <View style={styles.barScore}>
                <PianoPatternScore
                  chordChanges={bar.chordChanges}
                  onTargetPress={async (target) => onOpenTarget(target)}
                  score={bar.score}
                  surfaceColor={museBuddyColors.mist}
                  swipeEnabled={false}
                />
              </View>
            </View>
            <PhraseStageCard
              bar={bar}
              onTabChange={(nextTab) => openBarDetails(selectedPhraseIndex, nextTab)}
              selectedTab={tab}
            />
          </Animated.View>
        ) : null}
      </View>
      {errorMessage ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}
      <Navigator
        bpm={learningConfig.bpm}
        canMoveBack={selectedPhraseIndex > 0}
        canMoveForward={selectedPhraseIndex < bars.length - 1}
        countdownValue={countdownValue}
        isPlaying={isPlaying}
        isPreparing={phase === 'prepare'}
        onBpmChange={setBpm}
        onMoveBack={() => move(-1)}
        onMoveForward={() => move(1)}
        onPlayPress={isPlaying ? reset : start}
        playDisabled={!isPlaying && isDisabled}
        view={view}
      />
    </SafeAreaView>
  );
}

function targetToTab(target: ScoreTarget): TrainingDetailTab {
  return target.kind === 'chord'
    ? { chordIndex: target.chordIndex, kind: 'chord' }
    : { kind: 'rhythm', staff: target.staff };
}

function SessionUnavailable() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View accessibilityRole="alert" style={styles.unavailable}>
        <Text style={styles.error}>Training material is not ready yet.</Text>
      </View>
    </SafeAreaView>
  );
}
function noop() {}

const styles = StyleSheet.create({
  barContent: { flex: 1, gap: 8, minHeight: 0, padding: 12 },
  barControls: { alignSelf: 'flex-end', flexDirection: 'row', gap: 8 },
  barPreview: { gap: 4 },
  barScore: { height: 190, overflow: 'hidden' },
  content: { flex: 1, minHeight: 0 },
  error: {
    color: museBuddyColors.error,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  fill: { flex: 1, minHeight: 0 },
  safeArea: { backgroundColor: museBuddyColors.mist, flex: 1 },
  sheetPreviewCard: { flex: 1, margin: 14, minHeight: 0 },
  unavailable: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
});
