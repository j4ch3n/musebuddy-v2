import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PianoPatternScore } from '@/components/piano-pattern-score';
import { StreakProgressRing } from '@/components/streak-progress-ring';
import {
  dailyPracticeFixture,
  getPreviewStepIndex,
  isStreakDayComplete,
  streakFixture,
} from '@/constants/home-screen-mock';
import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { TactileControlAction } from '@/ui/tactile-control';

const prepareTrainingSessionHref = '/prepare-training-session-splash' as Href;
const wordmarkSource = require('@assets/images/brand/musebuddy-wordmark.png');
const buddySource = require('@assets/images/brand/musebuddy-buddy.png');

export function WelcomePage() {
  const router = useRouter();
  const [isStreakExpanded, setIsStreakExpanded] = useState(false);
  const [previewStepIndex] = useState(() => getPreviewStepIndex(dailyPracticeFixture));

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.brandHeader}>
          <Image
            accessibilityLabel="MuseBuddy"
            contentFit="contain"
            source={wordmarkSource}
            style={styles.wordmark}
          />
          <FloatingMusicAccent
            delay={240}
            icon="musical-note-outline"
            style={styles.musicAccentOne}
          />
          <FloatingMusicAccent delay={920} icon="musical-notes" style={styles.musicAccentTwo} />
        </View>
        <DailyPracticeCard compact={isStreakExpanded} previewStepIndex={previewStepIndex} />
        <StreakCard
          expanded={isStreakExpanded}
          onToggle={() => setIsStreakExpanded((value) => !value)}
        />
      </ScrollView>
      <View style={styles.actionDock}>
        <Pressable
          accessibilityLabel="Start Practice"
          accessibilityRole="button"
          onPress={() => router.push(prepareTrainingSessionHref)}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <FontAwesome5 color={museBuddyColors.mist} iconStyle="solid" name="play" size={20} />
          <Text style={styles.primaryButtonLabel}>Start Practice</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function FloatingMusicAccent({
  delay,
  icon,
  style,
}: {
  delay: number;
  icon: 'musical-note-outline' | 'musical-notes';
  style: object;
}) {
  const reducedMotion = useReducedMotion();
  const drift = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      drift.value = 0;
      return;
    }

    drift.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2400 }), -1, true));
  }, [delay, drift, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -7 * drift.value }, { rotate: `${5 * drift.value}deg` }],
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.musicAccent, style, animatedStyle]}
    >
      <Ionicons
        color={icon === 'musical-notes' ? museBuddyColors.sky : museBuddyColors.wildflower}
        name={icon}
        size={icon === 'musical-notes' ? 21 : 29}
      />
    </Animated.View>
  );
}

function DailyPracticeCard({
  compact,
  previewStepIndex,
}: {
  compact: boolean;
  previewStepIndex: number;
}) {
  return (
    <View style={[styles.practiceCard, compact && styles.practiceCardCompact]}>
      <ScoreWatermarks hidden={compact} />
      <View pointerEvents="none" style={[styles.scorePreview, compact && styles.scoreHidden]}>
        <PianoPatternScore
          chordChanges={[]}
          currentStepIndex={previewStepIndex}
          notationColor={museBuddyColors.pine}
          renderHeight={224}
          score={dailyPracticeFixture.score}
          surfaceColor="transparent"
          swipeEnabled={false}
        />
      </View>
      <View style={styles.practiceCopy}>
        <Text style={styles.eyebrow}>{dailyPracticeFixture.eyebrow}</Text>
        <Text style={styles.title}>{dailyPracticeFixture.title}</Text>
        <Text style={styles.keyLabel}>{dailyPracticeFixture.keyLabel}</Text>
      </View>
      <View style={[styles.buddyTile, compact && styles.buddyTileCompact]}>
        <Image
          accessibilityLabel="Buddy, the MuseBuddy companion"
          contentFit="cover"
          source={buddySource}
          style={styles.buddy}
        />
      </View>
    </View>
  );
}

function ScoreWatermarks({ hidden }: { hidden: boolean }) {
  return (
    <>
      <View pointerEvents="none" style={[styles.watermarkClef, hidden && styles.scoreHidden]}>
        <MaterialDesignIcons
          color={museBuddyColors.cobaltWash}
          name="music-clef-treble"
          size={250}
        />
      </View>
      <View
        pointerEvents="none"
        style={[styles.watermarkScore, styles.watermarkScoreUpper, hidden && styles.scoreHidden]}
      >
        <PianoPatternScore
          chordChanges={[]}
          currentStepIndex={null}
          notationColor={museBuddyColors.pine}
          renderHeight={112}
          score={dailyPracticeFixture.score}
          surfaceColor="transparent"
          swipeEnabled={false}
        />
      </View>
      <View
        pointerEvents="none"
        style={[styles.watermarkScore, styles.watermarkScoreLower, hidden && styles.scoreHidden]}
      >
        <PianoPatternScore
          chordChanges={[]}
          currentStepIndex={null}
          notationColor={museBuddyColors.pine}
          renderHeight={112}
          score={dailyPracticeFixture.score}
          surfaceColor="transparent"
          swipeEnabled={false}
        />
      </View>
    </>
  );
}

function StreakCard({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <View style={[styles.streakCard, expanded && styles.streakCardExpanded]}>
      <View style={styles.streakHeader}>
        <Text style={styles.streakTitle}>{expanded ? 'This month' : 'This week'}</Text>
        <TactileControlAction
          accessibilityLabel={expanded ? 'Collapse streak calendar' : 'Expand streak calendar'}
          accessibilityState={{ expanded }}
          onPress={onToggle}
          pressedStyle={styles.chevronPressed}
          style={styles.chevronButton}
        >
          <MaterialIcons
            color={museBuddyColors.pine}
            name={expanded ? 'expand-less' : 'expand-more'}
            size={31}
          />
        </TactileControlAction>
      </View>
      {expanded ? <ExpandedStreakCalendar /> : <CompactStreak />}
    </View>
  );
}

function CompactStreak() {
  return (
    <View style={styles.compactStreakContent}>
      <View style={styles.compactDays}>
        {streakFixture.days.map((day, index) => (
          <View key={`${day.dayLabel}-${index}`} style={styles.compactDay}>
            <Text style={[styles.dayLabel, day.status === 'current' && styles.currentDayLabel]}>
              {day.dayLabel}
            </Text>
            <View style={[styles.starDot, day.status === 'upcoming' && styles.starDotUpcoming]}>
              {day.status !== 'upcoming' ? (
                <FontAwesome5
                  color={museBuddyColors.mist}
                  iconStyle="solid"
                  name={isStreakDayComplete(day) ? 'star' : 'star-half-alt'}
                  size={13}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>
      <View style={styles.streakCount}>
        <FontAwesome5 color={museBuddyColors.wildflower} iconStyle="solid" name="fire" size={29} />
        <Text style={styles.countLabel}>{streakFixture.currentCount}</Text>
      </View>
    </View>
  );
}

function ExpandedStreakCalendar() {
  return (
    <View style={styles.calendar}>
      <View style={styles.calendarWeekdays}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayLabel, index) => (
          <Text key={`${dayLabel}-${index}`} style={styles.calendarWeekdayLabel}>
            {dayLabel}
          </Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {Array.from({ length: streakFixture.month.leadingEmptyDays }, (_, index) => (
          <View key={`empty-${index}`} style={styles.calendarEmptyDay} />
        ))}
        {streakFixture.month.days.map((day) => (
          <View key={day.dayOfMonth} style={styles.calendarDay}>
            <Text style={[styles.dayLabel, day.status === 'current' && styles.currentDayLabel]}>
              {day.dayOfMonth}
            </Text>
            <StreakProgressRing
              accessibilityLabel={`Day ${day.dayOfMonth}`}
              completedSegments={day.progress}
              showCenterIcon={day.status !== 'upcoming'}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionDock: {
    backgroundColor: museBuddyColors.sun,
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  buddy: { height: '100%', width: '100%' },
  brandHeader: { height: 68, position: 'relative' },
  buddyTile: {
    backgroundColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.medium,
    bottom: -10,
    boxShadow: `4px 4px 0 ${museBuddyColors.sky}`,
    height: 88,
    overflow: 'hidden',
    position: 'absolute',
    right: 14,
    transform: [{ rotate: '-8deg' }],
    width: 88,
    zIndex: 2,
  },
  buddyTileCompact: { bottom: -12, height: 72, right: 12, width: 72 },
  calendar: {
    gap: 10,
    paddingTop: 10,
  },
  calendarDay: { alignItems: 'center', gap: 5, paddingVertical: 3, width: '14.285714%' },
  calendarEmptyDay: { width: '14.285714%' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarWeekdayLabel: {
    color: museBuddyColors.pine,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    width: '14.285714%',
  },
  calendarWeekdays: { flexDirection: 'row' },
  chevronButton: {
    alignItems: 'center',
    borderRadius: museBuddyRadii.round,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  chevronPressed: { backgroundColor: museBuddyColors.leafWash, transform: [{ translateY: 2 }] },
  compactDay: { alignItems: 'center', gap: 7 },
  compactDays: { flex: 1, flexDirection: 'row', gap: 4, justifyContent: 'space-between' },
  compactStreakContent: { alignItems: 'flex-end', flexDirection: 'row', gap: 14 },
  content: { gap: 22, paddingBottom: 18, paddingHorizontal: 20, paddingTop: 12 },
  countLabel: { color: museBuddyColors.pine, fontSize: 29, fontWeight: '900', lineHeight: 34 },
  currentDayLabel: { color: museBuddyColors.wildflower },
  dayLabel: { color: museBuddyColors.pine, fontSize: 13, fontWeight: '900', lineHeight: 16 },
  eyebrow: {
    color: museBuddyColors.wildflower,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  keyLabel: { color: museBuddyColors.pine, fontSize: 21, fontWeight: '700', lineHeight: 27 },
  musicAccent: { position: 'absolute' },
  musicAccentOne: { right: 46, top: 2 },
  musicAccentTwo: { right: 10, top: 29 },
  practiceCard: {
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.pine,
    borderRadius: 34,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `7px 8px 0 ${museBuddyColors.sky}`,
    minHeight: 410,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingTop: 28,
    position: 'relative',
  },
  practiceCardCompact: { marginBottom: 8, minHeight: 170, paddingTop: 27 },
  practiceCopy: { gap: 8, maxWidth: '80%', zIndex: 2 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.wildflower,
    borderColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.round,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `6px 7px 0 ${museBuddyColors.pine}`,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: 24,
  },
  primaryButtonLabel: {
    color: museBuddyColors.mist,
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 28,
  },
  primaryButtonPressed: {
    boxShadow: `2px 2px 0 ${museBuddyColors.pine}`,
    transform: [{ translateX: 4 }, { translateY: 5 }],
  },
  safeArea: { backgroundColor: museBuddyColors.sun, flex: 1 },
  scorePreview: {
    height: 232,
    left: 18,
    position: 'absolute',
    right: -4,
    top: 128,
    transform: [{ rotate: '-8deg' }],
    zIndex: 1,
  },
  scoreHidden: { opacity: 0 },
  scroll: { flex: 1 },
  starDot: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.wildflower,
    borderRadius: museBuddyRadii.round,
    height: 27,
    justifyContent: 'center',
    width: 27,
  },
  starDotUpcoming: {
    backgroundColor: 'transparent',
    borderColor: museBuddyColors.leaf,
    borderWidth: 3,
  },
  streakCard: {
    backgroundColor: museBuddyColors.sunWash,
    borderColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.large,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `6px 7px 0 ${museBuddyColors.sky}`,
    gap: 9,
    padding: 16,
  },
  streakCardExpanded: { gap: 14, paddingBottom: 20 },
  streakCount: {
    alignItems: 'center',
    borderLeftColor: museBuddyColors.pine,
    borderLeftWidth: 2,
    flexDirection: 'row',
    gap: 5,
    paddingLeft: 12,
  },
  streakHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  streakTitle: {
    color: museBuddyColors.pine,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
    textTransform: 'uppercase',
  },
  title: {
    color: museBuddyColors.pine,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  watermarkClef: {
    left: -50,
    opacity: 0.38,
    position: 'absolute',
    top: 134,
    transform: [{ rotate: '10deg' }],
    zIndex: 0,
  },
  watermarkScore: {
    opacity: 0.12,
    position: 'absolute',
    transform: [{ rotate: '-8deg' }],
    width: 330,
    zIndex: 0,
  },
  watermarkScoreLower: { bottom: 16, right: -92 },
  watermarkScoreUpper: { right: -118, top: 114 },
  wordmark: { height: 54, marginTop: 4, width: 220 },
});
