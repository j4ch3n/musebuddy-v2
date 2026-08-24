import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChordKeyboardCard, ChordName } from '@/components/chord-learning';
import { PianoPatternScore } from '@/components/piano-pattern-score';
import { RhythmViewer } from '@/components/rhythm-trainer';
import { museBuddyColors } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import {
  buildChordBreakdownSoundFontPlaybackConfiguration,
  buildPatternSoundFontPlaybackConfiguration,
  buildRhythmSoundFontPlaybackConfiguration,
} from '@/music-theory';
import { BpmControl, Button, FlashCard } from '@/ui';
import type { FlashCardPage } from '@/ui/flash-card';
import { addPlaybackFinishListener, playGroove, playPiano, stop } from '@modules/sound-font-player';
import {
  addDetectionFinishListener,
  cancelRecognition,
  startRecognition,
} from '@modules/basic-pitch';

type FocusedCard = 'sheet' | 'chord' | 'rhythm';
type RhythmStaff = 'treble' | 'bass';

export function BarDetailsSection() {
  const { learningConfig, session, setBpm } = useTrainingSession();
  const router = useRouter();
  const [barIndex, setBarIndex] = useState(0);
  const [focusedCard, setFocusedCard] = useState<FocusedCard>('sheet');
  const [chordIndex, setChordIndex] = useState(0);
  const [rhythmStaff, setRhythmStaff] = useState<RhythmStaff>('treble');
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackId = useRef<number | null>(null);
  const recognitionId = useRef<number | null>(null);
  const heardPitchClasses = useRef(new Set<number>());

  const bars = session?.bars ?? [];
  const bar = bars[barIndex];

  const resetForBar = useCallback((next: number) => {
    if (playbackId.current !== null) void stop(playbackId.current);
    playbackId.current = null;
    setIsPlaying(false);
    setBarIndex(next);
    setFocusedCard('sheet');
    setChordIndex(0);
    setRhythmStaff('treble');
  }, []);

  useEffect(() => {
    const subscription = addPlaybackFinishListener((event) => {
      if (event.playbackId === playbackId.current) {
        playbackId.current = null;
        setIsPlaying(false);
      }
    });
    return () => {
      subscription.remove();
      if (playbackId.current !== null) void stop(playbackId.current);
    };
  }, []);

  useEffect(() => {
    if (focusedCard !== 'chord' || !bar?.chordDisplays[chordIndex]) {
      return;
    }
    const chord = bar.chordDisplays[chordIndex]!;
    const expectedPitchClasses = new Set(chord.notes.map((note) => note.pitchClass));
    heardPitchClasses.current = new Set();
    let active = true;
    void startRecognition({ detectionIntervalMs: 200, rollingWindowMs: 2_000 }).then((result) => {
      if (!active) {
        void cancelRecognition(result.recognitionId);
        return;
      }
      recognitionId.current = result.recognitionId;
    });
    const subscription = addDetectionFinishListener((event) => {
      if (event.recognitionId !== recognitionId.current) return;
      event.notes.forEach((note) => {
        const pitchClass = ((note.midiPitch % 12) + 12) % 12;
        if (expectedPitchClasses.has(pitchClass as (typeof chord.notes)[number]['pitchClass'])) {
          heardPitchClasses.current.add(pitchClass);
        }
      });
      if (
        [...expectedPitchClasses].every((pitchClass) => heardPitchClasses.current.has(pitchClass))
      ) {
        heardPitchClasses.current = new Set();
        setChordIndex((current) => (current + 1) % bar.chordDisplays.length);
      }
    });
    return () => {
      active = false;
      subscription.remove();
      if (recognitionId.current !== null) {
        void cancelRecognition(recognitionId.current);
        recognitionId.current = null;
      }
    };
  }, [bar, chordIndex, focusedCard]);

  const playFocused = useCallback(async () => {
    if (!bar || isPlaying) return;
    const configuration =
      focusedCard === 'sheet'
        ? buildPatternSoundFontPlaybackConfiguration(bar.beats, learningConfig.bpm)
        : focusedCard === 'chord'
          ? buildChordBreakdownSoundFontPlaybackConfiguration(
              bar.chordDisplays[chordIndex]!,
              learningConfig.bpm,
            )
          : buildRhythmSoundFontPlaybackConfiguration(
              bar.rhythms[rhythmStaff].pattern,
              learningConfig.bpm,
            );
    setIsPlaying(true);
    const result =
      focusedCard === 'rhythm'
        ? await playGroove(configuration, {
            keepAudioSessionActive: false,
            leadIn: true,
            repetitions: 1,
          })
        : await playPiano(configuration, {
            keepAudioSessionActive: false,
            leadIn: true,
            repetitions: 1,
          });
    playbackId.current = result.playbackId;
  }, [bar, chordIndex, focusedCard, isPlaying, learningConfig.bpm, rhythmStaff]);

  if (!bar || !session) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Training material is not loaded yet.</Text>
      </View>
    );
  }
  const chordPages: readonly FlashCardPage[] = bar.chordDisplays.map((display, index) => ({
    content: (
      <View style={styles.chordContent}>
        <Text style={styles.friendlyName}>{display.friendlyName}</Text>
        <ChordName display={display} size="compact" />
        <ChordKeyboardCard display={display} displayMode="notation" />
      </View>
    ),
    id: `${display.idName}-${index}`,
    label: display.friendlyName,
  }));
  const rhythmPages: readonly FlashCardPage[] = (['treble', 'bass'] as const).map((staff) => ({
    content: (
      <RhythmViewer
        currentStepIndex={null}
        pattern={bar.rhythms[staff].pattern}
        showLegend={false}
      />
    ),
    id: staff,
    label: staff === 'treble' ? 'Treble rhythm' : 'Bass rhythm',
  }));

  return (
    <View style={styles.page}>
      <View style={styles.cards}>
        <FocusCard
          focused={focusedCard === 'sheet'}
          onPress={() => setFocusedCard('sheet')}
          shadowColor={museBuddyColors.sky}
        >
          <PianoPatternScore
            chordChanges={bar.chordChanges}
            score={bar.score}
            swipeEnabled={false}
          />
        </FocusCard>
        <FocusCard
          focused={focusedCard === 'chord'}
          onPress={() => setFocusedCard('chord')}
          pages={focusedCard === 'chord' ? chordPages : undefined}
          onPageChange={setChordIndex}
          selectedPageIndex={chordIndex}
          shadowColor={museBuddyColors.sun}
          size="compact"
        >
          {focusedCard !== 'chord' ? (
            <View style={styles.collapsedChordList}>
              {bar.chordDisplays.map((display, index) => (
                <View key={`${display.idName}-${index}`} style={styles.collapsedChordSlot}>
                  <ChordName
                    colorized={false}
                    display={display}
                    size="compact"
                    style={styles.mutedChord}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </FocusCard>
        <FocusCard
          focused={focusedCard === 'rhythm'}
          onPress={() => setFocusedCard('rhythm')}
          onPageChange={(index) => setRhythmStaff(index === 0 ? 'treble' : 'bass')}
          pages={focusedCard === 'rhythm' ? rhythmPages : undefined}
          selectedPageIndex={rhythmStaff === 'treble' ? 0 : 1}
          shadowColor={museBuddyColors.leaf}
        >
          {focusedCard !== 'rhythm' ? <Text style={styles.mutedRhythm}>Rhythm</Text> : null}
        </FocusCard>
      </View>
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
        <SmallArrow
          direction="left"
          disabled={barIndex === 0}
          onPress={() => resetForBar(barIndex - 1)}
        />
        <Button
          backgroundColor={isPlaying ? museBuddyColors.sky : museBuddyColors.wildflower}
          frameColor={museBuddyColors.pine}
          icon={
            <MaterialDesignIcons
              color={museBuddyColors.mist}
              name={isPlaying ? 'pause' : 'play'}
              size={20}
            />
          }
          label={`${isPlaying ? 'Pause' : 'Start'} ${barIndex + 1}/${bars.length}`}
          onPress={() => {
            if (isPlaying && playbackId.current !== null) {
              void stop(playbackId.current);
              playbackId.current = null;
              setIsPlaying(false);
            } else void playFocused();
          }}
          shadowColor={museBuddyColors.pine}
          surfaceColor={museBuddyColors.mist}
        />
        <SmallArrow
          direction="right"
          disabled={barIndex >= bars.length - 1}
          onPress={() => resetForBar(barIndex + 1)}
        />
        <BpmControl direction="up" onChange={setBpm} value={learningConfig.bpm} />
      </View>
    </View>
  );
}

function FocusCard({
  children,
  focused,
  onPress,
  onPageChange,
  pages,
  selectedPageIndex,
  shadowColor,
  size = 'flexible',
}: {
  children: ReactNode;
  focused: boolean;
  onPress: () => void;
  onPageChange?: (pageIndex: number) => void;
  pages?: readonly FlashCardPage[];
  selectedPageIndex?: number;
  shadowColor: string;
  size?: 'compact' | 'flexible';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={
        size === 'compact'
          ? styles.compactChordCard
          : focused
            ? styles.focusedCard
            : styles.collapsedCard
      }
    >
      <FlashCard
        onPageChange={onPageChange}
        padded={focused}
        pages={pages}
        selectedPageIndex={selectedPageIndex}
        shadowColor={shadowColor}
        sideA={<View style={styles.cardInner}>{children}</View>}
        style={styles.fillCard}
      />
    </Pressable>
  );
}
function SmallArrow({
  direction,
  disabled = false,
  onPress,
}: {
  direction: 'left' | 'right';
  disabled?: boolean;
  onPress: () => void;
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

const styles = StyleSheet.create({
  page: { backgroundColor: museBuddyColors.mist, flex: 1, gap: 10, padding: 12 },
  cards: { flex: 1, gap: 10, minHeight: 0 },
  focusedCard: { flex: 1.8, minHeight: 0 },
  compactChordCard: { height: 196 },
  fillCard: { flex: 1 },
  collapsedCard: { flex: 0.45, minHeight: 64 },
  cardInner: { flex: 1, justifyContent: 'center' },
  chordContent: { gap: 4 },
  collapsedChordList: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  collapsedChordSlot: {
    alignItems: 'center',
    flexBasis: 120,
    flexGrow: 0,
    flexShrink: 1,
    justifyContent: 'center',
  },
  friendlyName: {
    color: museBuddyColors.pine,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  mutedChord: { color: museBuddyColors.notationGray },
  mutedRhythm: {
    color: museBuddyColors.notationGray,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  controls: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  emptyText: { color: museBuddyColors.pine, fontWeight: '800' },
});
