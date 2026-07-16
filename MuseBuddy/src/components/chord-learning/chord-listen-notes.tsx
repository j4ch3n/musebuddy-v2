import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  museBuddyBorders,
  museBuddyColors,
  museBuddyRadii,
  museBuddyTypography,
} from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';

import { useChordListenRecognition } from './use-chord-listen-recognition';

type ChordListenNotesProps = {
  display: ChordDisplay;
};

export function ChordListenNotes({ display }: ChordListenNotesProps) {
  const displays = useMemo(() => [display], [display]);
  const { errorMessage, isListening, noteLabels } = useChordListenRecognition({ displays });

  if (!isListening) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Notes</Text>
        <Text numberOfLines={1} style={styles.notes}>
          {noteLabels.length > 0 ? noteLabels.join(', ') : 'Play the chord'}
        </Text>
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: museBuddyColors.surface,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.bold,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: museBuddyColors.accentRed,
    fontFamily: museBuddyTypography.rounded,
    fontSize: 13,
    fontWeight: '800',
  },
  label: {
    color: museBuddyColors.ink,
    fontFamily: museBuddyTypography.rounded,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    width: 48,
  },
  notes: {
    color: museBuddyColors.ink,
    flex: 1,
    fontFamily: museBuddyTypography.rounded,
    fontSize: 16,
    fontWeight: '900',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 24,
  },
});
