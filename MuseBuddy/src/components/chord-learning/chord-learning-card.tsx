import { Octicons } from '@react-native-vector-icons/octicons';
import { useMemo, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import {
  TabBar,
  TabView,
  type TabBarIndicatorProps,
  type TabDescriptor,
} from 'react-native-tab-view';

import { museBuddyColors } from '@/constants/design-tokens';
import { normalizeChordNotesForHand, type ChordDisplay } from '@/music-theory';
import { ChordName, FlashCard, MusicViewFlip, PlayButton } from '@/ui';

import { ChordHandShapeCue } from './chord-hand-shape-cue';
import { ChordKeyboardCard } from './chord-keyboard-card';
import { ChordToneLegend } from './chord-role-legend';
import {
  availableChordToneStages,
  chordToneStageLabel,
  emphasizedChordNotes,
  resolveChordToneStage,
  type ChordToneStage,
  visibleChordNotes,
} from './chord-tone-stage';

const TAB_STROKE_BASE_WIDTH = 96;
const TAB_STROKE_SCALE = 1.12;
const STACKED_HAND_KEYBOARD_WIDTH = 250;
const STACKED_PANEL_GAP = 12;
const COMPACT_NOTATION_HEIGHT = 136;
const COMPACT_NOTATION_ROW_GAP = 12;
const COMPACT_NOTATION_CUE_WIDTH = 140;
const COMPACT_NOTATION_WIDTH = 168;
const activeTabStrokeSource = require('@assets/images/stroke.png');

type ChordLearningCardProps = {
  display: ChordDisplay;
  onPlayPress: () => void;
  toneStage: ChordToneStage;
};

type ChordStageSelection = {
  requestedStage: ChordToneStage;
  selectedStage: ChordToneStage;
  sourceKey: string;
};

type ChordStageRoute = {
  accessibilityLabel: string;
  key: ChordToneStage;
  title: string;
};

export function ChordLearningCard({ display, onPlayPress, toneStage }: ChordLearningCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const availableStages = useMemo(() => availableChordToneStages(display), [display]);
  const routes = useMemo<ChordStageRoute[]>(
    () =>
      availableStages.map((stage) => ({
        accessibilityLabel: chordToneStageLabel(stage),
        key: stage,
        title: chordToneStageLabel(stage),
      })),
    [availableStages],
  );
  const sourceKey = `${display.idName}:${availableStages.join('|')}`;
  const [stageSelection, setStageSelection] = useState<ChordStageSelection>(() => ({
    requestedStage: toneStage,
    selectedStage: resolveChordToneStage(availableStages, toneStage),
    sourceKey,
  }));
  const selectedStage =
    stageSelection.sourceKey === sourceKey && stageSelection.requestedStage === toneStage
      ? stageSelection.selectedStage
      : resolveChordToneStage(availableStages, toneStage);

  const selectStage = (stage: ChordToneStage) =>
    setStageSelection({
      requestedStage: toneStage,
      selectedStage: stage,
      sourceKey,
    });
  const handlePlayPress = () => {
    setIsPlaying((currentIsPlaying) => !currentIsPlaying);
    onPlayPress();
  };

  const selectedStageIndex = Math.max(
    routes.findIndex((route) => route.key === selectedStage),
    0,
  );
  const navigationState = { index: selectedStageIndex, routes };
  const tabOptions = useMemo<Record<string, TabDescriptor<ChordStageRoute>>>(
    () =>
      Object.fromEntries(
        routes.map((route) => [
          route.key,
          {
            accessibilityLabel: route.accessibilityLabel,
            label: ({ focused }) => (
              <View style={styles.tabContent}>
                <Octicons
                  color={focused ? museBuddyColors.wildflower : museBuddyColors.pine}
                  name={focused ? 'dot-fill' : 'dot'}
                  size={14}
                />
                <Text style={[styles.tabLabel, focused ? styles.selectedTabLabel : null]}>
                  {route.title}
                </Text>
              </View>
            ),
          },
        ]),
      ),
    [routes],
  );

  return (
    <FlashCard
      footer={<ChordToneLegend />}
      header={
        <View style={styles.header}>
          <Text
            accessibilityRole="header"
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            numberOfLines={2}
            style={styles.title}
          >
            {display.friendlyName}
          </Text>
          <View style={styles.playControl}>
            <PlayButton isPlaying={isPlaying} onPress={handlePlayPress} />
          </View>
        </View>
      }
      heightMode="daily-training"
      shadowColor={museBuddyColors.sky}
      sideA={
        <View style={styles.content}>
          <View style={styles.details}>
            <View style={styles.detailsContent}>
              <View style={styles.heading}>
                <ChordName
                  adjustsFontSizeToFit
                  colorized
                  display={display}
                  minimumFontScale={0.45}
                  style={styles.chordName}
                />
              </View>
              <TabView
                animationEnabled
                keyboardDismissMode="none"
                navigationState={navigationState}
                onIndexChange={(index) => {
                  const route = routes[index];
                  if (route) selectStage(route.key);
                }}
                options={tabOptions}
                renderScene={({ route }) => (
                  <ChordLearningStage display={display} toneStage={route.key} />
                )}
                renderTabBar={(props) => (
                  <TabBar
                    {...props}
                    activeColor={museBuddyColors.wildflower}
                    gap={0}
                    inactiveColor={museBuddyColors.pine}
                    pressOpacity={0.72}
                    renderIndicator={(indicatorProps) => (
                      <ChordStageTabIndicator {...indicatorProps} />
                    )}
                    scrollEnabled
                    contentContainerStyle={styles.tabBarContent}
                    style={styles.tabBar}
                    tabStyle={styles.tab}
                  />
                )}
                style={styles.stageTabs}
              />
            </View>
          </View>
        </View>
      }
      surfaceColor={museBuddyColors.paper}
    />
  );
}

function ChordStageTabIndicator({
  gap = 0,
  getTabWidth,
  layout,
  navigationState,
  position,
}: TabBarIndicatorProps<ChordStageRoute>) {
  const inputRange = navigationState.routes.map((_, index) => index);
  const fallbackTabWidth =
    layout.width > 0
      ? layout.width / Math.max(navigationState.routes.length, 1)
      : TAB_STROKE_BASE_WIDTH;
  const tabWidths = navigationState.routes.map(
    (_, index) => getTabWidth(index) || fallbackTabWidth,
  );
  const tabBarWidth =
    tabWidths.reduce((width, tabWidth) => width + tabWidth, 0) +
    gap * Math.max(0, tabWidths.length - 1);
  const alignmentOffset = Math.max(0, (layout.width - tabBarWidth) / 2);
  const tabCenterX = position.interpolate({
    inputRange,
    outputRange: navigationState.routes.map((_, tabIndex) => {
      const previousTabsWidth = navigationState.routes
        .slice(0, tabIndex)
        .reduce((width, _, index) => width + tabWidths[index]! + gap, 0);

      return alignmentOffset + previousTabsWidth + tabWidths[tabIndex]! / 2;
    }),
    extrapolate: 'clamp',
  });
  const strokeScaleX = position.interpolate({
    inputRange,
    outputRange: navigationState.routes.map(
      (_, tabIndex) => (tabWidths[tabIndex]! * TAB_STROKE_SCALE) / TAB_STROKE_BASE_WIDTH,
    ),
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.tabStrokeAnchor,
        { transform: [{ translateX: Animated.add(tabCenterX, -TAB_STROKE_BASE_WIDTH / 2) }] },
      ]}
    >
      <Animated.Image
        resizeMode="stretch"
        source={activeTabStrokeSource}
        style={[styles.strokeImage, { transform: [{ scaleX: strokeScaleX }] }]}
      />
    </Animated.View>
  );
}

function ChordLearningStage({
  display,
  toneStage,
}: {
  display: ChordDisplay;
  toneStage: ChordToneStage;
}) {
  const visibleNotes = visibleChordNotes(display, toneStage);
  const emphasizedNotes = emphasizedChordNotes(display, toneStage);
  const leftNotes = visibleNotes.filter((note) => note.hand === 'left');
  const rightNotes = visibleNotes.filter((note) => note.hand === 'right');
  const normalizedSheetNotes = [
    ...normalizeChordNotesForHand(leftNotes, 'left'),
    ...normalizeChordNotesForHand(rightNotes, 'right'),
  ];

  return (
    <MusicViewFlip
      keyboard={
        <View style={styles.keyboardPanels}>
          <KeyboardPanel
            display={display}
            emphasizedKeys={emphasizedNotes
              .filter((note) => note.hand === 'right')
              .map((note) => note.pitchClass)}
            notes={rightNotes}
          />
          <KeyboardPanel
            display={display}
            emphasizedKeys={emphasizedNotes
              .filter((note) => note.hand === 'left')
              .map((note) => note.pitchClass)}
            notes={leftNotes}
          />
        </View>
      }
      notation={
        <View style={styles.notationHandStack}>
          <NotationHandRow
            cueHand="right"
            cueNotes={rightNotes}
            display={display}
            notationClef="treble"
            sheetNotes={normalizedSheetNotes}
          />
          <NotationHandRow
            cueHand="left"
            cueNotes={leftNotes}
            display={display}
            notationClef="bass"
            sheetNotes={normalizedSheetNotes}
          />
        </View>
      }
      style={styles.study}
    />
  );
}

function NotationHandRow({
  cueHand,
  cueNotes,
  display,
  notationClef,
  sheetNotes,
}: {
  cueHand: 'left' | 'right';
  cueNotes: readonly ChordDisplay['notes'][number][];
  display: ChordDisplay;
  notationClef: 'bass' | 'treble';
  sheetNotes: readonly ChordDisplay['notes'][number][];
}) {
  return (
    <View style={styles.notationHandRow}>
      <View style={styles.notationPanel}>
        <ChordKeyboardCard
          display={display}
          displayMode="notation"
          notationClef={notationClef}
          notationHeight={COMPACT_NOTATION_HEIGHT}
          notationWidth={COMPACT_NOTATION_WIDTH}
          visibleNotes={sheetNotes}
        />
      </View>
      <View style={styles.notationCuePanel}>
        <ChordHandShapeCue align="start" hand={cueHand} notes={cueNotes} size="large" />
      </View>
    </View>
  );
}

function KeyboardPanel({
  display,
  emphasizedKeys,
  notes,
}: {
  display: ChordDisplay;
  emphasizedKeys: readonly ChordDisplay['notes'][number]['pitchClass'][];
  notes: readonly ChordDisplay['notes'][number][];
}) {
  return (
    <View style={styles.keyboardPanel}>
      <ChordKeyboardCard
        display={display}
        displayMode="keyboard"
        emphasizedKeys={emphasizedKeys}
        fitKeyboardToContainer
        keyboardWidth={STACKED_HAND_KEYBOARD_WIDTH}
        showKeyHighlightLabels={false}
        visibleNotes={notes}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chordName: { lineHeight: 56 },
  content: { alignItems: 'center', flex: 1, minHeight: 0 },
  details: {
    alignSelf: 'stretch',
    flex: 1,
    minHeight: 0,
  },
  detailsContent: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flex: 1,
    gap: 6,
    justifyContent: 'center',
    minHeight: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 3,
  },
  heading: { alignItems: 'center', minHeight: 60 },
  keyboardPanel: { alignSelf: 'stretch' },
  keyboardPanels: {
    alignSelf: 'stretch',
    flex: 1,
    gap: STACKED_PANEL_GAP,
    justifyContent: 'center',
    minHeight: 0,
  },
  notationCuePanel: {
    minWidth: 0,
    position: 'relative',
    top: 10,
    width: COMPACT_NOTATION_CUE_WIDTH,
  },
  notationHandRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    height: COMPACT_NOTATION_HEIGHT,
    width: COMPACT_NOTATION_WIDTH + COMPACT_NOTATION_CUE_WIDTH,
  },
  notationHandStack: {
    alignSelf: 'stretch',
    flex: 1,
    gap: COMPACT_NOTATION_ROW_GAP,
    justifyContent: 'center',
    minHeight: 0,
  },
  notationPanel: { minWidth: 0, width: COMPACT_NOTATION_WIDTH },
  playControl: { flexShrink: 0 },
  stageTabs: {
    alignSelf: 'stretch',
    flex: 1,
    minHeight: 0,
  },
  study: { alignSelf: 'stretch', flex: 1, minHeight: 0 },
  tab: { height: 36, minHeight: 36, paddingHorizontal: 6, paddingVertical: 0, width: 'auto' },
  tabBar: {
    backgroundColor: 'transparent',
    elevation: 0,
    marginBottom: 5,
    shadowOpacity: 0,
  },
  tabBarContent: { flexGrow: 1, justifyContent: 'center' },
  tabStrokeAnchor: {
    bottom: 0,
    height: 11,
    left: 0,
    position: 'absolute',
    width: TAB_STROKE_BASE_WIDTH,
  },
  tabContent: { alignItems: 'center', flexDirection: 'row', gap: 2, minHeight: 25 },
  tabLabel: { color: museBuddyColors.pine, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  title: {
    color: museBuddyColors.pine,
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
    minWidth: 0,
  },
  selectedTabLabel: { fontWeight: '900' },
  strokeImage: { height: '100%', tintColor: museBuddyColors.wildflower, width: '100%' },
});
