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
          color={chordSyntaxRoleColors[role].accent}
          key={role}
          label={chordSyntaxRoleLabels[role]}
          outlined={role === 'omission'}
        />
      ))}
    </View>
  );
}

type ChordToneLegendProps = {
  roles: readonly ChordToneColorRole[];
};

export function ChordToneLegend({ roles }: ChordToneLegendProps) {
  const uniqueRoles = [...new Set(roles)];

  return (
    <View accessibilityLabel="Chord tone color key" style={styles.legend}>
      {uniqueRoles.map((role) => (
        <LegendItem
          color={chordToneRoleColors[role].accent}
          key={role}
          label={chordToneRoleLabels[role]}
        />
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  legendLabel: {
    color: museBuddyColors.pine,
    fontSize: 11,
    fontWeight: '800',
  },
  swatch: {
    borderRadius: museBuddyRadii.small,
    height: 10,
    width: 18,
  },
  swatchOutlined: {
    borderColor: museBuddyColors.frame,
    borderWidth: 2,
  },
});
