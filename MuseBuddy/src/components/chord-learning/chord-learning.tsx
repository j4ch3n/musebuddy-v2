import { StyleSheet, View } from 'react-native';

import { museBuddyBorders, museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';

import { ChordKeyboardCard } from './chord-keyboard-card';
import { ChordNameCard } from './chord-name-card';

type ChordLearningProps = {
  display: ChordDisplay;
  isKeyboardCardFlipped?: boolean;
  onKeyboardCardFlipChange?: (isFlipped: boolean) => void;
};

export function ChordLearning({
  display,
  isKeyboardCardFlipped,
  onKeyboardCardFlipChange,
}: ChordLearningProps) {
  return (
    <View style={styles.container}>
      <ChordNameCard display={display} />
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.link}
      />
      <ChordKeyboardCard
        display={display}
        isFlipped={isKeyboardCardFlipped}
        onFlipChange={onKeyboardCardFlipChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  link: {
    alignSelf: 'center',
    backgroundColor: museBuddyColors.ink,
    borderRadius: museBuddyBorders.bold,
    height: 24,
    width: museBuddyBorders.bold,
  },
});
