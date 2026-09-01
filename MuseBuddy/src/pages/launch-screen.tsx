import { Image } from 'expo-image';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';

const wordmarkSource = require('@assets/images/brand/musebuddy-wordmark.png');

type LaunchScreenProps = {
  isRetryPending: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
};

export function LaunchScreen({ isRetryPending, onLayout }: LaunchScreenProps) {
  return (
    <View onLayout={onLayout} style={styles.screen}>
      <Image
        accessibilityLabel="MuseBuddy"
        contentFit="contain"
        source={wordmarkSource}
        style={styles.wordmark}
      />
      {isRetryPending ? (
        <View accessibilityLiveRegion="polite" style={styles.retryIndicator}>
          <Text style={styles.retryLabel}>Retrying soon…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  retryIndicator: {
    bottom: 28,
    position: 'absolute',
    right: 20,
  },
  retryLabel: {
    color: museBuddyColors.pine,
    fontSize: 13,
    fontWeight: '800',
  },
  screen: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.sky,
    flex: 1,
    justifyContent: 'center',
  },
  wordmark: { height: 62, width: 260 },
});
