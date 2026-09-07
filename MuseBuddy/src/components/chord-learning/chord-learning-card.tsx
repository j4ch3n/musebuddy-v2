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
import { normalizeChordNotesForHand, type ChordDisplay, type ChordHandSide } from '@/music-theory';
import { FlashCard, MusicViewFlip, PlayButton } from '@/ui';

import { ChordHandShapeCue } from './chord-hand-shape-cue';
import { ChordKeyboardCard } from './chord-keyboard-card';
import { ChordName } from './chord-name';
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
const activeTabStrokeSource = require('@assets/images/stroke.png');

type ChordLearningCardProps = {
  display: ChordDisplay;
  isPlaying?: boolean;
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

export function ChordLearningCard({
  display,
  isPlaying = false,
  onPlayPress,
  toneStage,
}: ChordLearningCardProps) {
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
      heightMode="daily-training"
      shadowColor={museBuddyColors.sky}
      sideA={
        <View style={styles.content}>
          <View>
            <PlayButton isPlaying={isPlaying} onPress={onPlayPress} />
          </View>
          <View style={styles.details}>
            <View style={styles.detailsContent}>
              <View style={styles.heading}>
                <ChordName colorized display={display} style={styles.chordName} />
                <Text style={styles.friendlyName}>{display.friendlyName}</Text>
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
          <View style={styles.ledge}>
            <ChordToneLegend />
          </View>
        </View>
      }
      style={styles.card}
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
        <View style={styles.handPanels}>
          <HandPanel
            display={display}
            emphasizedKeys={emphasizedNotes
              .filter((note) => note.hand === 'left')
              .map((note) => note.pitchClass)}
            hand="left"
            notes={leftNotes}
          />
          <HandPanel
            display={display}
            emphasizedKeys={emphasizedNotes
              .filter((note) => note.hand === 'right')
              .map((note) => note.pitchClass)}
            hand="right"
            notes={rightNotes}
          />
        </View>
      }
      notation={
        <ChordKeyboardCard
          display={display}
          displayMode="notation"
          visibleNotes={normalizedSheetNotes}
        />
      }
      style={styles.study}
    />
  );
}

function HandPanel({
  display,
  emphasizedKeys,
  hand,
  notes,
}: {
  display: ChordDisplay;
  emphasizedKeys: readonly ChordDisplay['notes'][number]['pitchClass'][];
  hand: ChordHandSide;
  notes: readonly ChordDisplay['notes'][number][];
}) {
  return (
    <View style={styles.handPanel}>
      <ChordKeyboardCard
        display={display}
        displayMode="keyboard"
        emphasizedKeys={emphasizedKeys}
        fitKeyboardToContainer
        showKeyHighlightLabels={false}
        visibleNotes={notes}
      />
      <ChordHandShapeCue hand={hand} notes={notes} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 0 },
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
  friendlyName: {
    color: museBuddyColors.pine,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  heading: { alignItems: 'center', minHeight: 74 },
  handPanel: { flex: 1, minWidth: 0 },
  handPanels: { alignItems: 'flex-start', flexDirection: 'row', gap: 0, width: '100%' },
  ledge: { alignSelf: 'stretch' },
  // Leaves room for the flip toggle's solid bottom shadow inside TabView's clipped scene.
  stageTabs: { alignSelf: 'stretch', flex: 0, height: 289, minHeight: 289 },
  study: { alignSelf: 'stretch', flex: 0, height: 244 },
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
  tabLabel: { color: museBuddyColors.pine, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  selectedTabLabel: { fontWeight: '900' },
  strokeImage: { height: '100%', tintColor: museBuddyColors.wildflower, width: '100%' },
});
