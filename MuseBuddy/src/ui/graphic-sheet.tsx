import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { museBuddyBorders, museBuddyColors } from '@/constants/design-tokens';

export type GraphicSheetTone = 'leaf' | 'mist' | 'sky' | 'sun' | 'violet' | 'wildflower';

type GraphicSheetProps = {
  children: ReactNode;
  tone?: GraphicSheetTone;
};

/** A clean square stage surface used for the learning object's main content. */
export function GraphicSheet({ children, tone = 'mist' }: GraphicSheetProps) {
  return (
    <View style={styles.frame}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.shadow}
      />
      <View style={[styles.sheet, toneStyles[tone]]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { paddingBottom: 8, paddingRight: 7, position: 'relative' },
  shadow: {
    backgroundColor: museBuddyColors.frame,
    bottom: 0,
    left: 7,
    position: 'absolute',
    right: 0,
    top: 8,
  },
  sheet: {
    borderColor: museBuddyColors.frame,
    borderWidth: museBuddyBorders.standard,
    minHeight: 72,
    overflow: 'hidden',
    padding: 16,
  },
});

const toneStyles = StyleSheet.create({
  leaf: { backgroundColor: museBuddyColors.leafWash },
  mist: { backgroundColor: museBuddyColors.mist },
  sky: { backgroundColor: museBuddyColors.skyWash },
  sun: { backgroundColor: museBuddyColors.sunWash },
  violet: { backgroundColor: museBuddyColors.violetWash },
  wildflower: { backgroundColor: museBuddyColors.petal },
});
