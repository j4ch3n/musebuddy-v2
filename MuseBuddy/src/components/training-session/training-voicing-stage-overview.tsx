import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';

export function TrainingVoicingStageOverview() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Voicing</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  label: { color: museBuddyColors.pine, fontSize: 22, fontWeight: '900' },
});
