import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
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

import { DailyPostcard } from '@/components/daily-postcard';
import { StreakView } from '@/components/streak-view';
import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

const wordmarkSource = require('@assets/images/brand/musebuddy-wordmark.png');

export function WelcomePage() {
  const router = useRouter();
  const [isStreakExpanded, setIsStreakExpanded] = useState(false);

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
        <DailyPostcard compact={isStreakExpanded} />
        <StreakView
          expanded={isStreakExpanded}
          onToggle={() => setIsStreakExpanded((value) => !value)}
        />
      </ScrollView>
      <View style={styles.actionDock}>
        <Pressable
          accessibilityLabel="Start Practice"
          accessibilityRole="button"
          onPress={() => router.push('/training-session')}
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

const styles = StyleSheet.create({
  actionDock: {
    backgroundColor: museBuddyColors.sun,
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  brandHeader: { height: 68, position: 'relative' },
  content: { gap: 22, paddingBottom: 18, paddingHorizontal: 20, paddingTop: 12 },
  musicAccent: { position: 'absolute' },
  musicAccentOne: { right: 46, top: 2 },
  musicAccentTwo: { right: 10, top: 29 },
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
  scroll: { flex: 1 },
  wordmark: { height: 54, marginTop: 4, width: 220 },
});
