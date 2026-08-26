import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Lucide } from '@react-native-vector-icons/lucide';
import { type Href, useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';

export type TrainingSessionRoute = 'full-play' | 'phrase' | 'preview';

const ROUTE_ORDER: readonly TrainingSessionRoute[] = ['preview', 'phrase', 'full-play'];

export function TrainingSessionNavigator({ activeRoute }: { activeRoute: TrainingSessionRoute }) {
  const router = useRouter();
  const { selectedPhraseIndex, session, setSelectedPhraseIndex } = useTrainingSession();
  const phraseCount = session?.bars.length ?? 0;
  const phraseIndex = Math.min(selectedPhraseIndex, Math.max(phraseCount - 1, 0));
  const canMoveBack = activeRoute === 'phrase' && phraseIndex > 0;
  const canMoveForward = activeRoute === 'phrase' && phraseIndex < phraseCount - 1;

  function openRoute(route: TrainingSessionRoute) {
    router.replace(`/${route}` as Href);
  }

  return (
    <View
      accessibilityLabel="Training session navigation"
      accessibilityRole="tablist"
      style={styles.row}
    >
      <NavigatorButton
        accessibilityLabel="Preview"
        activeRoute={activeRoute}
        onPress={() => openRoute('preview')}
        route="preview"
      >
        <Lucide color={getIconColor('preview', activeRoute)} name="book-open" size={20} />
      </NavigatorButton>

      <View
        style={[
          styles.phraseGroup,
          getRouteStyle('phrase', activeRoute),
          { boxShadow: `4px 4px 0 ${getRouteShadowColor('phrase')}` },
        ]}
      >
        <Pressable
          accessibilityLabel="Previous phrase"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canMoveBack }}
          disabled={!canMoveBack}
          hitSlop={6}
          onPress={() => setSelectedPhraseIndex(phraseIndex - 1)}
          style={({ pressed }) => [styles.phraseArrow, pressed && styles.phrasePressed]}
        >
          <FontAwesome5
            color={getIconColor('phrase', activeRoute)}
            iconStyle="solid"
            name="angle-left"
            size={21}
          />
        </Pressable>
        <Pressable
          accessibilityLabel={`Phrase ${phraseIndex + 1} of ${phraseCount || 1}`}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeRoute === 'phrase' }}
          hitSlop={6}
          onPress={() => openRoute('phrase')}
          style={({ pressed }) => [styles.phraseIndicator, pressed && styles.phrasePressed]}
        >
          <Lucide color={getIconColor('phrase', activeRoute)} name="music" size={18} />
          <Text style={[styles.phraseCurrent, { color: getIconColor('phrase', activeRoute) }]}>
            {phraseIndex + 1} /
          </Text>
          <Text style={[styles.phraseTotal, { color: getIconColor('phrase', activeRoute) }]}>
            {phraseCount || 1}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Next phrase"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canMoveForward }}
          disabled={!canMoveForward}
          hitSlop={6}
          onPress={() => setSelectedPhraseIndex(phraseIndex + 1)}
          style={({ pressed }) => [styles.phraseArrow, pressed && styles.phrasePressed]}
        >
          <FontAwesome5
            color={getIconColor('phrase', activeRoute)}
            iconStyle="solid"
            name="angle-right"
            size={21}
          />
        </Pressable>
      </View>

      <NavigatorButton
        accessibilityLabel="Full play"
        activeRoute={activeRoute}
        onPress={() => openRoute('full-play')}
        route="full-play"
      >
        <Ionicons color={getIconColor('full-play', activeRoute)} name="trophy-outline" size={21} />
      </NavigatorButton>
    </View>
  );
}

function NavigatorButton({
  accessibilityLabel,
  activeRoute,
  children,
  onPress,
  route,
}: {
  accessibilityLabel: string;
  activeRoute: TrainingSessionRoute;
  children: ReactNode;
  onPress: () => void;
  route: TrainingSessionRoute;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="tab"
      accessibilityState={{ selected: activeRoute === route }}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.routeButton,
        getRouteStyle(route, activeRoute),
        { boxShadow: `4px 4px 0 ${getRouteShadowColor(route)}` },
        pressed && getPressedRouteStyle(route),
      ]}
    >
      {children}
    </Pressable>
  );
}

function getRouteStyle(route: TrainingSessionRoute, activeRoute: TrainingSessionRoute) {
  const routeIndex = ROUTE_ORDER.indexOf(route);
  const activeIndex = ROUTE_ORDER.indexOf(activeRoute);
  return {
    backgroundColor:
      routeIndex < activeIndex
        ? museBuddyColors.leaf
        : routeIndex === activeIndex
          ? museBuddyColors.wildflower
          : museBuddyColors.mist,
  };
}

function getIconColor(route: TrainingSessionRoute, activeRoute: TrainingSessionRoute) {
  return route === activeRoute ? museBuddyColors.mist : museBuddyColors.pine;
}

function getRouteShadowColor(route: TrainingSessionRoute) {
  switch (route) {
    case 'preview':
      return museBuddyColors.sky;
    case 'phrase':
      return museBuddyColors.leaf;
    case 'full-play':
      return museBuddyColors.sun;
  }
}

function getPressedRouteStyle(route: TrainingSessionRoute) {
  return {
    boxShadow: `1px 1px 0 ${getRouteShadowColor(route)}`,
    opacity: 0.72,
    transform: [{ translateX: 3 }, { translateY: 3 }],
  };
}

const styles = StyleSheet.create({
  phraseArrow: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 30,
  },
  phraseCurrent: { fontSize: 16, fontWeight: '900', lineHeight: 19 },
  phraseGroup: {
    alignItems: 'center',
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    flexDirection: 'row',
    height: 42,
  },
  phraseIndicator: { alignItems: 'center', flexDirection: 'row', gap: 3, height: 38 },
  phraseTotal: { fontSize: 12, fontWeight: '800', lineHeight: 15 },
  phrasePressed: { opacity: 0.72 },
  routeButton: {
    alignItems: 'center',
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: 5 },
});
