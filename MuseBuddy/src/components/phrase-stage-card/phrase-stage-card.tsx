import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Lucide } from '@react-native-vector-icons/lucide';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ChordKeyboardCard, ChordName, ChordToneLegend } from '@/components/chord-learning';
import {
  PerformanceGuidanceProvider,
  usePerformanceGuidance,
} from '@/components/performance-guidance';
import { RhythmViewer } from '@/components/rhythm-trainer';
import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { type PhraseStage } from '@/contexts/training-session-context';
import type { PreparedTrainingBar } from '@/music-theory';
import {
  buildChordPhrasePreviewSoundFontPlaybackConfiguration,
  buildPatternSoundFontPlaybackConfiguration,
  buildRhythmSoundFontPlaybackConfiguration,
} from '@/music-theory';
import { Button, FlashCard, MusicViewFlip } from '@/ui';

const STAGES: readonly PhraseStage[] = ['ideas', 'chords', 'rhythms'];

const stageDetails: Record<
  PhraseStage,
  { backgroundColor: string; label: string; shadowColor: string }
> = {
  ideas: {
    backgroundColor: museBuddyColors.sunWash,
    label: 'Ideas',
    shadowColor: museBuddyColors.sun,
  },
  chords: {
    backgroundColor: museBuddyColors.skyWash,
    label: 'Chords',
    shadowColor: museBuddyColors.sky,
  },
  rhythms: {
    backgroundColor: museBuddyColors.leafWash,
    label: 'Rhythms',
    shadowColor: museBuddyColors.leaf,
  },
};

type PhraseStageCardProps = {
  bar: PreparedTrainingBar;
  bpm: number;
  selectedStage: PhraseStage;
  onStageChange: (stage: PhraseStage) => void;
};

export function PhraseStageCard({ bar, bpm, selectedStage, onStageChange }: PhraseStageCardProps) {
  return (
    <FlashCard
      accessibilityLabel="Phrase learning stage"
      shadowColor={stageDetails[selectedStage].shadowColor}
      sideA={
        <View style={styles.content}>
          <View accessibilityRole="tablist" style={styles.tabs}>
            {STAGES.map((stage) => (
              <StageTab
                isSelected={stage === selectedStage}
                key={stage}
                onPress={() => onStageChange(stage)}
                stage={stage}
              />
            ))}
          </View>
          <View style={styles.mainContent}>
            {selectedStage === 'ideas' ? <IdeasStage bar={bar} bpm={bpm} /> : null}
            {selectedStage === 'chords' ? <ChordsStage bar={bar} bpm={bpm} /> : null}
            {selectedStage === 'rhythms' ? <RhythmsStage bar={bar} bpm={bpm} /> : null}
          </View>
        </View>
      }
      style={styles.card}
    />
  );
}

function IdeasStage({ bar, bpm }: { bar: PreparedTrainingBar; bpm: number }) {
  const configuration = useMemo(
    () => buildPatternSoundFontPlaybackConfiguration(bar.beats, bpm),
    [bar.beats, bpm],
  );
  return (
    <PreviewProvider configuration={configuration}>
      <IdeasPreview />
    </PreviewProvider>
  );
}

function IdeasPreview() {
  const { errorMessage, isDisabled, phase, reset, start } = usePerformanceGuidance();
  const isPlaying = phase === 'demo' || phase === 'prepare';
  return (
    <View style={styles.ideasContent}>
      <View style={styles.inlinePreview}>
        <SoundPreviewButton
          disabled={isDisabled}
          isPlaying={isPlaying}
          onPress={isPlaying ? reset : start}
        />
        <WaveLine isPlaying={isPlaying} />
      </View>
      <PreviewError message={errorMessage} />
    </View>
  );
}

function ChordsStage({ bar, bpm }: { bar: PreparedTrainingBar; bpm: number }) {
  const chord = bar.chordDisplays[0];
  return chord ? (
    <ChordStagePreview bpm={bpm} chord={chord} />
  ) : (
    <StageEmpty message="No chord is available for this bar." />
  );
}

function ChordStagePreview({
  bpm,
  chord,
}: {
  bpm: number;
  chord: NonNullable<PreparedTrainingBar['chordDisplays'][number]>;
}) {
  const configuration = useMemo(
    () => buildChordPhrasePreviewSoundFontPlaybackConfiguration(chord, bpm),
    [bpm, chord],
  );
  return (
    <PreviewProvider configuration={configuration} leadIn={false}>
      <ChordPreview chord={chord} />
    </PreviewProvider>
  );
}

function ChordPreview({
  chord,
}: {
  chord: NonNullable<PreparedTrainingBar['chordDisplays'][number]>;
}) {
  const { errorMessage, isDisabled, phase, reset, start } = usePerformanceGuidance();
  const isPlaying = phase === 'demo' || phase === 'prepare';
  return (
    <View style={styles.chordContent}>
      <View style={styles.chordHeading}>
        <View style={styles.chordSoundControl}>
          <SoundPreviewButton
            disabled={isDisabled}
            isPlaying={isPlaying}
            onPress={isPlaying ? reset : start}
          />
        </View>
        <View style={styles.chordLabels}>
          <ChordName display={chord} />
          <Text style={styles.friendlyName}>{chord.friendlyName}</Text>
        </View>
      </View>
      <View style={styles.chordStudyArea}>
        <MusicViewFlip
          keyboard={<ChordKeyboardCard display={chord} displayMode="keyboard" />}
          notation={<ChordKeyboardCard display={chord} displayMode="notation" />}
          style={styles.chordStudy}
        />
      </View>
      <View style={styles.chordLegendDock}>
        <ChordToneLegend />
      </View>
      <PreviewError message={errorMessage} />
    </View>
  );
}

function RhythmsStage({ bar, bpm }: { bar: PreparedTrainingBar; bpm: number }) {
  const [selectedStaff, setSelectedStaff] = useState<'bass' | 'treble'>('treble');
  const [playRequest, setPlayRequest] = useState(0);
  const rhythm = bar.rhythms[selectedStaff];
  const configuration = useMemo(
    () => buildRhythmSoundFontPlaybackConfiguration(rhythm.pattern, bpm),
    [bpm, rhythm],
  );

  return (
    <View style={styles.rhythmContent}>
      <PreviewProvider
        configuration={configuration}
        cycleCount={2}
        key={selectedStaff}
        kind="groove"
      >
        <RhythmRows
          activeStaff={selectedStaff}
          bar={bar}
          onRequestPlay={(staff) => {
            setPlayRequest((request) => request + 1);
            if (staff !== selectedStaff) setSelectedStaff(staff);
          }}
          playRequest={playRequest}
        />
      </PreviewProvider>
    </View>
  );
}

function RhythmRows({
  activeStaff,
  bar,
  onRequestPlay,
  playRequest,
}: {
  activeStaff: 'bass' | 'treble';
  bar: PreparedTrainingBar;
  onRequestPlay: (staff: 'bass' | 'treble') => void;
  playRequest: number;
}) {
  const guidance = usePerformanceGuidance();
  const isPlaying = guidance.phase === 'demo' || guidance.phase === 'prepare';
  useEffect(() => {
    if (playRequest > 0 && !isPlaying) guidance.start();
  }, [guidance, isPlaying, playRequest]);

  return (
    <>
      {(['treble', 'bass'] as const).map((staff) => (
        <RhythmRow
          active={activeStaff === staff && isPlaying}
          currentStepIndex={activeStaff === staff && isPlaying ? guidance.currentStepIndex : null}
          isPlaying={activeStaff === staff && Boolean(isPlaying)}
          key={staff}
          onPress={() => {
            if (activeStaff === staff && isPlaying) guidance.reset();
            else onRequestPlay(staff);
          }}
          pattern={bar.rhythms[staff].pattern}
          staff={staff}
        />
      ))}
      <PreviewError message={guidance.errorMessage} />
    </>
  );
}

function RhythmRow({
  active,
  currentStepIndex,
  isPlaying,
  onPress,
  pattern,
  staff,
}: {
  active: boolean;
  currentStepIndex: number | null;
  isPlaying: boolean;
  onPress: () => void;
  pattern: PreparedTrainingBar['rhythms']['treble']['pattern'];
  staff: 'bass' | 'treble';
}) {
  return (
    <View style={[styles.rhythmRow, active && styles.activeRhythmRow]}>
      <SoundPreviewButton isPlaying={isPlaying} onPress={onPress} />
      <View style={styles.rhythmViewer}>
        <RhythmViewer
          clef={staff}
          currentStepIndex={currentStepIndex}
          pattern={pattern}
          showLegend={false}
        />
      </View>
    </View>
  );
}

function PreviewProvider({
  children,
  configuration,
  cycleCount = 1,
  kind = 'piano',
  leadIn = true,
}: {
  children: ReactNode;
  configuration: ReturnType<typeof buildPatternSoundFontPlaybackConfiguration>;
  cycleCount?: number;
  kind?: 'groove' | 'piano';
  leadIn?: boolean;
}) {
  return (
    <PerformanceGuidanceProvider
      cycleCount={cycleCount}
      finishDurationMs={0}
      finishText=""
      leadIn={leadIn}
      listeningMode={{ kind: 'none' }}
      onFinish={noop}
      onSkip={noop}
      playback={{ configuration, kind }}
    >
      {children}
    </PerformanceGuidanceProvider>
  );
}

function SoundPreviewButton({
  disabled = false,
  isPlaying,
  onPress,
}: {
  disabled?: boolean;
  isPlaying: boolean;
  onPress: () => void;
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const timer = setInterval(() => setFrame((current) => (current + 1) % 4), 180);
    return () => clearInterval(timer);
  }, [isPlaying]);
  const iconNames = ['volume-off', 'volume-low', 'volume-medium', 'volume-high'] as const;
  const handlePress = () => {
    if (!isPlaying) {
      setFrame(0);
    }
    onPress();
  };
  return (
    <Pressable
      accessibilityLabel={isPlaying ? 'Stop audio preview' : 'Play audio preview'}
      accessibilityRole="button"
      disabled={disabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.soundButton,
        pressed && styles.soundButtonPressed,
        disabled && styles.soundButtonDisabled,
      ]}
    >
      <Ionicons
        color={museBuddyColors.pine}
        name={isPlaying ? iconNames[frame] : 'volume-medium'}
        size={27}
      />
    </Pressable>
  );
}

function WaveLine({ isPlaying }: { isPlaying: boolean }) {
  const movement = useSharedValue(0);
  useEffect(() => {
    movement.value = isPlaying
      ? withRepeat(
          withSequence(withTiming(1, { duration: 450 }), withTiming(-1, { duration: 450 })),
          -1,
          true,
        )
      : withTiming(0, { duration: 120 });
  }, [isPlaying, movement]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: movement.value * 12 }, { rotate: `${movement.value * 3}deg` }],
  }));
  return (
    <View accessibilityLabel="Decorative musical waveform" style={styles.waveFrame}>
      <Animated.View style={[styles.wave, animatedStyle]}>
        {Array.from({ length: 10 }, (_, index) => (
          <View
            key={index}
            style={[styles.waveStem, index % 2 === 0 ? styles.waveTall : styles.waveShort]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

function PreviewError({ message }: { message: string }) {
  return message ? (
    <Text accessibilityRole="alert" style={styles.previewError}>
      {message}
    </Text>
  ) : null;
}
function StageEmpty({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.previewError}>{message}</Text>
    </View>
  );
}
function noop() {}

function StageTab({
  isSelected,
  onPress,
  stage,
}: {
  isSelected: boolean;
  onPress: () => void;
  stage: PhraseStage;
}) {
  const { backgroundColor, label } = stageDetails[stage];
  const iconColor = isSelected ? museBuddyColors.wildflower : museBuddyColors.pine;
  return (
    <Button
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      backgroundColor={backgroundColor}
      frameColor={museBuddyColors.pine}
      onPress={onPress}
      shadowColor={museBuddyColors.pine}
      shadowEnabled={false}
      style={styles.tab}
      surfaceColor={museBuddyColors.pine}
    >
      <View style={styles.tabContent}>
        {stage === 'ideas' ? (
          <Lucide color={iconColor} name="lightbulb" size={isSelected ? 22 : 18} />
        ) : null}
        {stage === 'chords' ? (
          <MaterialDesignIcons color={iconColor} name="piano" size={isSelected ? 22 : 19} />
        ) : null}
        {stage === 'rhythms' ? (
          <FontAwesome5
            color={iconColor}
            iconStyle="solid"
            name="drum"
            size={isSelected ? 22 : 17}
          />
        ) : null}
        <Text style={[styles.tabLabel, isSelected && styles.selectedTabLabel]}>{label}</Text>
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  activeRhythmRow: { backgroundColor: museBuddyColors.skyWash },
  card: { flex: 1, minHeight: 0 },
  chordContent: { flex: 1, gap: 8, minHeight: 0, paddingBottom: 4, paddingTop: 8 },
  chordHeading: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    paddingHorizontal: 52,
    position: 'relative',
  },
  chordLabels: { alignItems: 'center', gap: 0 },
  chordLegendDock: { bottom: 2, left: 0, minHeight: 18, position: 'absolute', right: 0 },
  chordSoundControl: { left: 0, position: 'absolute' },
  chordStudy: { flex: 0, height: 220, minHeight: 208 },
  chordStudyArea: { flex: 1, justifyContent: 'center', marginBottom: 22, minHeight: 0 },
  content: { flex: 1, minHeight: 0 },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  friendlyName: {
    color: museBuddyColors.pine,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  ideasContent: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  inlinePreview: { alignItems: 'center', flexDirection: 'row', gap: 12, width: '100%' },
  mainContent: { flex: 1, minHeight: 0 },
  previewError: {
    color: museBuddyColors.error,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  rhythmContent: { flex: 1, gap: 8, paddingTop: 10 },
  rhythmRow: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: museBuddyRadii.medium,
    flexDirection: 'row',
    gap: 6,
    minHeight: 154,
    padding: 6,
  },
  rhythmViewer: { flex: 1, minWidth: 0 },
  selectedTabLabel: { fontWeight: '900' },
  soundButton: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.pine,
    borderRadius: 22,
    borderWidth: museBuddyBorders.standard,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  soundButtonDisabled: { opacity: 0.45 },
  soundButtonPressed: { transform: [{ translateY: 2 }] },
  tab: {
    borderRadius: museBuddyRadii.small,
    borderWidth: museBuddyBorders.standard,
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  tabContent: { alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'center' },
  tabLabel: { color: museBuddyColors.pine, fontSize: 13, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 6 },
  wave: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    height: 60,
    justifyContent: 'center',
  },
  waveFrame: { flex: 1, overflow: 'hidden' },
  waveShort: { height: 22 },
  waveStem: { backgroundColor: museBuddyColors.sky, borderRadius: 8, width: 8 },
  waveTall: { height: 48 },
});
