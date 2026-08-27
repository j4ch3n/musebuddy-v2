import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import type { ChordDisplayToken } from '@/music-theory';

import {
  chordSyntaxRoleByTokenType,
  chordSyntaxRoleColors,
  chordSyntaxRoleLabels,
  chordToneRoleColors,
  chordToneRoleLabels,
  type ChordToneColorRole,
} from './chord-color-role';

type ChordSyntaxLegendProps = {
  tokens: readonly ChordDisplayToken[];
};

export function ChordSyntaxLegend({ tokens }: ChordSyntaxLegendProps) {
  const roles = [
    ...new Set(
      tokens
        .map((token) => chordSyntaxRoleByTokenType[token.type])
        .filter((role) => role !== 'separator'),
    ),
  ];

  return (
    <View accessibilityLabel="Chord symbol color key" style={styles.legend}>
      {roles.map((role) => (
        <LegendItem
          color={chordSyntaxRoleColors[role].color}
          key={role}
          label={chordSyntaxRoleLabels[role]}
          outlined={role === 'omission'}
        />
      ))}
    </View>
  );
}

const chordToneLegendRows = [
  ['root', 'essential', 'supporting'],
  ['color', 'optional'],
] as const satisfies readonly (readonly ChordToneColorRole[])[];

export function ChordToneLegend() {
  return (
    <View accessibilityLabel="Chord tone color key" style={styles.legend}>
      {chordToneLegendRows.map((roles, rowIndex) => (
        <View key={rowIndex} style={styles.legendRow}>
          {roles.map((role) => (
            <LegendItem
              color={chordToneRoleColors[role].color}
              key={role}
              label={chordToneRoleLabels[role]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function LegendItem({
  color,
  label,
  outlined = false,
}: {
  color: string;
  label: string;
  outlined?: boolean;
}) {
  return (
    <View accessibilityLabel={label} accessible style={styles.legendItem}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.swatch, { backgroundColor: color }, outlined ? styles.swatchOutlined : null]}
      />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    alignItems: 'center',
    gap: 2,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  legendLabel: {
    color: museBuddyColors.pine,
    fontSize: 12,
    fontWeight: '800',
  },
  swatch: {
    borderRadius: museBuddyRadii.round,
    height: 7,
    width: 7,
  },
  swatchOutlined: {
    borderColor: museBuddyColors.frame,
    borderWidth: 1,
  },
});
