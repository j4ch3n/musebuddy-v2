import { StyleSheet, View } from 'react-native';

import type { ChordDisplay } from '@/music-theory';
import { FlashCard } from '@/ui';

import { ChordName } from './chord-name';

type ChordSessionSummaryProps = {
  displays: readonly ChordDisplay[];
};

export function ChordSessionSummary({ displays }: ChordSessionSummaryProps) {
  return (
    <FlashCard
      accessibilityLabel="All chords in this session"
      sideA={
        <View style={styles.container}>
          {displays.map((display, index) => (
            <ChordName
              display={display}
              key={`${display.idName}-${index}`}
              size="large"
              style={styles.chordName}
            />
          ))}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  chordName: {
    textAlign: 'center',
  },
  container: {
    alignItems: 'center',
    gap: 18,
    justifyContent: 'center',
    minHeight: 320,
    paddingVertical: 24,
  },
});
