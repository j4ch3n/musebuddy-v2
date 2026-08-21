import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import {
  rhythmStepRoleColors,
  rhythmStepRoleLabels,
  type RhythmStepColorRole,
} from './rhythm-color-role';

const roles: readonly RhythmStepColorRole[] = ['strong', 'weak', 'hold', 'rest'];

export function RhythmLegend() {
  return (
    <View accessibilityLabel="Rhythm color key" style={styles.legend}>
      {roles.map((role) => (
        <View
          accessibilityLabel={rhythmStepRoleLabels[role]}
          accessible
          key={role}
          style={styles.item}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.swatch, { backgroundColor: rhythmStepRoleColors[role] }]}
          />
          <Text style={styles.label}>{rhythmStepRoleLabels[role]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  label: {
    color: museBuddyColors.pine,
    fontSize: 11,
    fontWeight: '800',
  },
  legend: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatch: {
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.small,
    borderWidth: 2,
    height: 10,
    width: 20,
  },
});
