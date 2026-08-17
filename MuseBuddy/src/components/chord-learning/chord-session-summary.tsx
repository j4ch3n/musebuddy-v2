import Lucide from '@react-native-vector-icons/lucide';
import { StyleSheet, Text, View } from 'react-native';

import {
  museBuddyBorders,
  museBuddyColors,
  museBuddyRadii,
  museBuddyTypography,
} from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';
import { FlashCard } from '@/ui';

import { ChordName } from './chord-name';
import { useChordListenRecognition } from './use-chord-listen-recognition';

type ChordSessionSummaryProps = {
  displays: readonly ChordDisplay[];
  isActive: boolean;
};

export function ChordSessionSummary({ displays, isActive }: ChordSessionSummaryProps) {
  const { completedChordIndexes, errorMessage } = useChordListenRecognition({
    displays,
    enabled: isActive,
  });

  return (
    <View style={styles.root}>
      <FlashCard
        accessibilityLabel="All chords in this session"
        sideA={
          <View style={styles.container}>
            {displays.map((display, index) => {
              const isComplete = completedChordIndexes.has(index);

              return (
                <View
                  accessibilityLabel={`${display.friendlyName}, ${isComplete ? 'complete' : 'not complete'}`}
                  accessible
                  key={`${display.idName}-${index}`}
                  style={styles.chordRow}
                >
                  <View accessibilityElementsHidden style={styles.checkSpacer} />
                  <ChordName
                    colorized={false}
                    display={display}
                    size="large"
                    style={styles.chordName}
                  />
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={[styles.checkSlot, isComplete ? styles.checkSlotComplete : null]}
                  >
                    {isComplete ? (
                      <Lucide color={museBuddyColors.pine} name="check" size={24} />
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        }
        tone="leaf"
      />
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  checkSlot: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.bold,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  checkSlotComplete: {
    backgroundColor: museBuddyColors.leaf,
  },
  checkSpacer: {
    width: 40,
  },
  chordName: {
    flex: 1,
    textAlign: 'center',
  },
  chordRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  container: {
    gap: 12,
    justifyContent: 'center',
    minHeight: 320,
    paddingVertical: 24,
  },
  errorText: {
    color: museBuddyColors.pine,
    fontFamily: museBuddyTypography.rounded,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  root: {
    gap: 12,
  },
});
