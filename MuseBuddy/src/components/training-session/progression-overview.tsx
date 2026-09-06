import { StyleSheet, Text, View } from 'react-native';

import { ChordName } from '@/components/chord-learning';
import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import type { PreparedTrainingBar } from '@/music-theory';

import { PlayButton } from './play-button';
import type { TrainingFocus } from './training-focus';

type ProgressionOverviewProps = {
  bars: readonly PreparedTrainingBar[];
  focus: TrainingFocus;
  isPlaying?: boolean;
  keyLabel: string;
  onPlayPress: () => void;
};

export function ProgressionOverview({
  bars,
  focus,
  isPlaying = false,
  keyLabel,
  onPlayPress,
}: ProgressionOverviewProps) {
  return (
    <View accessibilityLabel={`${keyLabel} chord progression`} style={styles.content}>
      <View style={styles.heading}>
        <View>
          <Text style={styles.eyebrow}>CHORD PROGRESSION</Text>
          <Text style={styles.keyLabel}>{keyLabel}</Text>
        </View>
        <PlayButton isPlaying={isPlaying} onPress={onPlayPress} />
      </View>
      <View style={styles.bars}>
        {bars.slice(0, 4).map((bar, index) => (
          <View
            accessibilityLabel={`Bar ${index + 1}: ${bar.chordDisplays.map((chord) => chord.symbol).join(', ')}`}
            key={bar.index}
            style={styles.bar}
          >
            <Text style={styles.barNumber}>{index + 1}</Text>
            <View style={styles.chords}>
              {bar.chordDisplays.map((chord) => (
                <View key={chord.idName} style={styles.chordSlot}>
                  <ChordName colorized={false} display={chord} size="compact" />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
      <FocusLedge focus={focus} />
    </View>
  );
}

function FocusLedge({ focus }: { focus: TrainingFocus }) {
  return (
    <View accessibilityLabel={`Current training focus: ${focus}`} style={styles.ledge}>
      {(['chords', 'rhythm', 'voicing'] as const).map((item) => (
        <Text key={item} style={[styles.ledgeLabel, focus === item && styles.ledgeLabelActive]}>
          {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    borderBottomColor: museBuddyColors.skyWash,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 55,
  },
  barNumber: { color: museBuddyColors.pine, fontSize: 13, fontWeight: '900', width: 24 },
  bars: { flex: 1, justifyContent: 'center' },
  chordSlot: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  chords: { flex: 1, flexDirection: 'row' },
  content: { flex: 1, gap: 14, minHeight: 0 },
  eyebrow: { color: museBuddyColors.pine, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  keyLabel: { color: museBuddyColors.wildflower, fontSize: 25, fontWeight: '900' },
  ledge: {
    backgroundColor: museBuddyColors.leafWash,
    borderColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
  },
  ledgeLabel: {
    color: museBuddyColors.pine,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  ledgeLabelActive: { color: museBuddyColors.wildflower, textDecorationLine: 'underline' },
});
