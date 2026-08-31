/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated by layout handlers and worklets. */
import { Octicons } from '@react-native-vector-icons/octicons';
import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { museBuddyColors } from '@/constants/design-tokens';

type TabGroupItem = {
  accessibilityLabel?: string;
  id: string;
  label: ReactNode;
};

type TabGroupProps = {
  onSelect: (id: string) => void;
  selectedId: string;
  tabs: TabGroupItem[];
};

type TabLayout = { width: number; x: number };

const activeTabStrokeSource = require('@assets/images/stroke.png');

export function TabGroup({ onSelect, selectedId, tabs }: TabGroupProps) {
  const tabLayouts = useRef(new Map<string, TabLayout>());
  const hasPositionedStroke = useRef(false);
  const strokeWidth = useSharedValue(0);
  const strokeX = useSharedValue(0);

  const moveStroke = useCallback(
    ({ width, x }: TabLayout) => {
      const targetWidth = width * 1.12;
      const targetX = x - width * 0.06 + 5;

      if (hasPositionedStroke.current) {
        strokeWidth.value = withTiming(targetWidth, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.Never,
        });
        strokeX.value = withTiming(targetX, {
          duration: 220,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.Never,
        });
        return;
      }

      hasPositionedStroke.current = true;
      strokeWidth.value = targetWidth;
      strokeX.value = targetX;
    },
    [strokeWidth, strokeX],
  );

  useEffect(() => {
    const selectedLayout = tabLayouts.current.get(selectedId);
    if (selectedLayout) moveStroke(selectedLayout);
  }, [moveStroke, selectedId]);

  const strokeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: strokeX.value }],
    width: strokeWidth.value,
  }));

  function handleTabLayout(id: string, event: LayoutChangeEvent) {
    const { width, x } = event.nativeEvent.layout;
    const layout = { width, x };
    tabLayouts.current.set(id, layout);
    if (id === selectedId) moveStroke(layout);
  }

  return (
    <View accessibilityRole="tablist" style={styles.tabs}>
      <Animated.View pointerEvents="none" style={[styles.activeStroke, strokeStyle]}>
        <Image resizeMode="stretch" source={activeTabStrokeSource} style={styles.strokeImage} />
      </Animated.View>
      {tabs.map((tab) => {
        const isSelected = tab.id === selectedId;
        return (
          <Pressable
            accessibilityLabel={tab.accessibilityLabel}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            key={tab.id}
            onLayout={(event) => handleTabLayout(tab.id, event)}
            onPress={() => onSelect(tab.id)}
            style={({ pressed }) => [styles.tab, pressed ? styles.tabPressed : null]}
          >
            <View style={styles.tabContent}>
              <Octicons
                color={isSelected ? museBuddyColors.wildflower : museBuddyColors.pine}
                name={isSelected ? 'dot-fill' : 'dot'}
                size={16}
              />
              {typeof tab.label === 'string' ? (
                <Text style={[styles.tabText, isSelected ? styles.selectedTabText : null]}>
                  {tab.label}
                </Text>
              ) : (
                tab.label
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  activeStroke: {
    bottom: 3,
    height: 11,
    left: 0,
    position: 'absolute',
    zIndex: 0,
  },
  selectedTabText: { fontWeight: '900' },
  strokeImage: { height: '100%', tintColor: museBuddyColors.wildflower, width: '100%' },
  tab: {
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 1,
  },
  tabContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    minHeight: 25,
  },
  tabPressed: { opacity: 0.72 },
  tabText: { color: museBuddyColors.pine, fontSize: 15, fontWeight: '700' },
  tabs: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 2,
    marginBottom: 5,
    marginLeft: -10,
    position: 'relative',
  },
});
