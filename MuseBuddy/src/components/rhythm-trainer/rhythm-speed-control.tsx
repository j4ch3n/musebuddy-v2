import { StyleSheet } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

import { RHYTHM_SPEED_OPTIONS } from './constants';

type RhythmSpeedControlProps = {
  onChange: (bpm: number) => void;
  value: number;
};

export function RhythmSpeedControl({ onChange, value }: RhythmSpeedControlProps) {
  return (
    <YStack gap="$2">
      <Text color={museBuddyColors.ink} fontSize={13} fontWeight="900" textTransform="uppercase">
        Speed
      </Text>
      <XStack
        accessibilityLabel="Rhythm playback speed"
        accessibilityRole="tablist"
        gap="$1.5"
        style={styles.group}
      >
        {RHYTHM_SPEED_OPTIONS.map((option) => {
          const isSelected = option.bpm === value;

          return (
            <YStack
              key={option.id}
              accessibilityLabel={`${option.label}, ${option.bpm} BPM`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              flex={1}
              onPress={() => {
                onChange(option.bpm);
              }}
              pressStyle={{
                background: isSelected ? museBuddyColors.primary : museBuddyColors.surfaceMuted,
                transform: [{ translateY: 2 }],
              }}
              style={[styles.option, isSelected && styles.optionSelected]}
            >
              <Text
                color={museBuddyColors.ink}
                fontSize={13}
                fontWeight="900"
                numberOfLines={1}
                style={styles.optionLabel}
              >
                {option.label}
              </Text>
              <Text
                color={museBuddyColors.ink}
                fontSize={11}
                fontWeight="800"
                numberOfLines={1}
                opacity={0.78}
                style={{ fontVariant: ['tabular-nums'], textAlign: 'center' }}
              >
                {option.bpm} BPM
              </Text>
            </YStack>
          );
        })}
      </XStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: museBuddyColors.surfaceMuted,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.round,
    borderWidth: museBuddyBorders.bold,
    padding: 6,
  },
  option: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.surface,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.round,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  optionSelected: {
    backgroundColor: museBuddyColors.primary,
  },
  optionLabel: {
    textAlign: 'center',
  },
});
