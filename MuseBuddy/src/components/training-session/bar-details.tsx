import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { Octicons } from '@react-native-vector-icons/octicons';
import { useMemo } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import {
  TabBar,
  TabView,
  type TabBarIndicatorProps,
  type TabDescriptor,
} from 'react-native-tab-view';

import { ChordKeyboardCard, ChordName, ChordToneLegend } from '@/components/chord-learning';
import { RhythmViewer } from '@/components/rhythm-trainer';
import { museBuddyColors } from '@/constants/design-tokens';
import type { TrainingDetailTab } from '@/contexts/training-session-context';
import type { PreparedTrainingBar } from '@/music-theory';
import { FlashCard, MusicViewFlip } from '@/ui';
import type { PianoKeyboardLiveKeyState } from '@/ui';
import type { PianoPitchClass } from '@schema/music-theory-schema';

const CARD_CONTENT_HORIZONTAL_INSET = 18;
const CARD_CONTENT_TOP_INSET = 8;
const CARD_CONTENT_BOTTOM_INSET = 18;
const CHORD_CONTENT_TOP_INSET = 12;
const CHORD_GROUP_GAP = 4;
const CHORD_STUDY_BOTTOM_LEDGE = 10;
const TAB_STROKE_BASE_WIDTH = 96;
const TAB_STROKE_SCALE = 1.12;

const activeTabStrokeSource = require('@assets/images/stroke.png');

type BarDetailRoute = {
  accessibilityLabel: string;
  key: string;
  tab: TrainingDetailTab;
  title: string;
};

type BarDetailsProps = {
  bar: PreparedTrainingBar;
  currentStepIndex: number | null;
  liveKeys?: Partial<Record<PianoPitchClass, PianoKeyboardLiveKeyState>>;
  onTabChange: (tab: TrainingDetailTab) => void;
  selectedTab: TrainingDetailTab;
};

export function BarDetails({
  bar,
  currentStepIndex,
  liveKeys,
  onTabChange,
  selectedTab,
}: BarDetailsProps) {
  const routes = useMemo<BarDetailRoute[]>(
    () => [
      ...bar.chordDisplays.map((chord, chordIndex) => ({
        accessibilityLabel: `${chord.symbol} chord`,
        key: `chord-${chordIndex}`,
        tab: { chordIndex, kind: 'chord' } as const,
        title: chord.symbol,
      })),
      {
        accessibilityLabel: 'Treble rhythm',
        key: 'rhythm-treble',
        tab: { kind: 'rhythm', staff: 'treble' },
        title: 'Treble rhythm',
      },
      {
        accessibilityLabel: 'Bass rhythm',
        key: 'rhythm-bass',
        tab: { kind: 'rhythm', staff: 'bass' },
        title: 'Bass rhythm',
      },
    ],
    [bar.chordDisplays],
  );
  const selectedTabIndex = routes.findIndex((route) => isSameDetailTab(route.tab, selectedTab));
  const navigationState = {
    index: Math.max(selectedTabIndex, 0),
    routes,
  };
  const tabOptions = useMemo<Record<string, TabDescriptor<BarDetailRoute>>>(
    () =>
      Object.fromEntries(
        routes.map((route) => [
          route.key,
          {
            accessibilityLabel: route.accessibilityLabel,
            label: ({ focused }) => <BarDetailTabLabel focused={focused} route={route} />,
          },
        ]),
      ),
    [routes],
  );

  return (
    <FlashCard
      accessibilityLabel="Bar details"
      padded={false}
      shadowColor={selectedTab.kind === 'chord' ? museBuddyColors.sky : museBuddyColors.leaf}
      sideA={
        <View style={styles.content}>
          <TabView
            animationEnabled
            keyboardDismissMode="none"
            navigationState={navigationState}
            onIndexChange={(index) => {
              const route = routes[index];
              if (route) onTabChange(route.tab);
            }}
            options={tabOptions}
            renderScene={({ route }) =>
              route.tab.kind === 'chord' ? (
                <ChordDetail chord={bar.chordDisplays[route.tab.chordIndex]} liveKeys={liveKeys} />
              ) : (
                <RhythmDetail
                  bar={bar}
                  currentStepIndex={currentStepIndex}
                  staff={route.tab.staff}
                />
              )
            }
            renderTabBar={(props) => (
              <TabBar
                {...props}
                activeColor={museBuddyColors.wildflower}
                gap={2}
                inactiveColor={museBuddyColors.pine}
                pressOpacity={0.72}
                renderIndicator={(indicatorProps) => <BarDetailTabIndicator {...indicatorProps} />}
                scrollEnabled={false}
                style={styles.tabBar}
                tabStyle={styles.tab}
              />
            )}
            style={styles.tabView}
          />
        </View>
      }
      style={styles.card}
    />
  );
}

function BarDetailTabLabel({ focused, route }: { focused: boolean; route: BarDetailRoute }) {
  const rhythmClef = route.tab.kind === 'rhythm' ? route.tab.staff : null;

  return (
    <View style={styles.tabContent}>
      <Octicons
        color={focused ? museBuddyColors.wildflower : museBuddyColors.pine}
        name={focused ? 'dot-fill' : 'dot'}
        size={16}
      />
      {rhythmClef ? (
        <MaterialDesignIcons
          color={museBuddyColors.pine}
          name={rhythmClef === 'treble' ? 'music-clef-treble' : 'music-clef-bass'}
          size={25}
        />
      ) : (
        <Text style={[styles.tabText, focused ? styles.selectedTabText : null]}>{route.title}</Text>
      )}
    </View>
  );
}

function BarDetailTabIndicator({
  gap = 0,
  getTabWidth,
  navigationState,
  position,
}: TabBarIndicatorProps<BarDetailRoute>) {
  const inputRange = navigationState.routes.map((_, index) => index);
  const tabCenterX = position.interpolate({
    inputRange,
    outputRange: navigationState.routes.map((_, tabIndex) => {
      const previousTabsWidth = navigationState.routes
        .slice(0, tabIndex)
        .reduce((width, _, index) => width + getTabWidth(index) + gap, 0);

      return previousTabsWidth + getTabWidth(tabIndex) / 2;
    }),
    extrapolate: 'clamp',
  });
  const strokeScaleX = position.interpolate({
    inputRange,
    outputRange: navigationState.routes.map(
      (_, tabIndex) => (getTabWidth(tabIndex) * TAB_STROKE_SCALE) / TAB_STROKE_BASE_WIDTH,
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

function ChordDetail({
  chord,
  liveKeys,
}: {
  chord: PreparedTrainingBar['chordDisplays'][number] | undefined;
  liveKeys?: Partial<Record<PianoPitchClass, PianoKeyboardLiveKeyState>>;
}) {
  if (!chord) return null;
  return (
    <View style={styles.chordContent}>
      <View style={styles.chordHeading}>
        <ChordName display={chord} />
        <Text style={styles.friendlyName}>{chord.friendlyName}</Text>
      </View>
      <MusicViewFlip
        keyboard={<ChordKeyboardCard display={chord} displayMode="keyboard" liveKeys={liveKeys} />}
        notation={<ChordKeyboardCard display={chord} displayMode="notation" />}
        style={styles.chordStudy}
      />
      <ChordToneLegend />
    </View>
  );
}

function RhythmDetail({
  bar,
  currentStepIndex,
  staff,
}: {
  bar: PreparedTrainingBar;
  currentStepIndex: number | null;
  staff: 'bass' | 'treble';
}) {
  return (
    <View style={styles.rhythmContent}>
      <RhythmViewer
        clef={staff}
        currentStepIndex={currentStepIndex}
        pattern={bar.rhythms[staff].pattern}
        showLegend={false}
      />
    </View>
  );
}

function isSameDetailTab(first: TrainingDetailTab, second: TrainingDetailTab) {
  if (first.kind === 'chord' && second.kind === 'chord') {
    return first.chordIndex === second.chordIndex;
  }

  if (first.kind === 'rhythm' && second.kind === 'rhythm') {
    return first.staff === second.staff;
  }

  return false;
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 0 },
  chordContent: {
    flex: 1,
    gap: CHORD_GROUP_GAP,
    minHeight: 0,
    paddingTop: CHORD_CONTENT_TOP_INSET,
  },
  chordHeading: { alignItems: 'center' },
  chordStudy: { flex: 1, marginBottom: CHORD_STUDY_BOTTOM_LEDGE, minHeight: 200 },
  content: {
    flex: 1,
    minHeight: 0,
    paddingBottom: CARD_CONTENT_BOTTOM_INSET,
    paddingHorizontal: CARD_CONTENT_HORIZONTAL_INSET,
    paddingTop: CARD_CONTENT_TOP_INSET,
  },
  friendlyName: { color: museBuddyColors.pine, fontSize: 14, fontWeight: '800' },
  rhythmContent: { flex: 1, minHeight: 0, paddingTop: 8 },
  selectedTabText: { fontWeight: '900' },
  strokeImage: { height: '100%', tintColor: museBuddyColors.wildflower, width: '100%' },
  tab: { height: 36, minHeight: 36, paddingHorizontal: 3, paddingVertical: 0, width: 'auto' },
  tabBar: {
    backgroundColor: 'transparent',
    elevation: 0,
    marginBottom: 5,
    shadowOpacity: 0,
  },
  tabContent: { alignItems: 'center', flexDirection: 'row', gap: 2, minHeight: 25 },
  tabStrokeAnchor: {
    bottom: 3,
    height: 11,
    left: 0,
    position: 'absolute',
    width: TAB_STROKE_BASE_WIDTH,
  },
  tabText: { color: museBuddyColors.pine, fontSize: 15, fontWeight: '700' },
  tabView: { flex: 1, minHeight: 0 },
});
