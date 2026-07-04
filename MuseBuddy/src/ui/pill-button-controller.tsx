import { StyleSheet } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

export type PillButtonOption<TValue extends number | string> = {
  accessibilityLabel?: string;
  description?: string;
  id: string;
  label: string;
  value: TValue;
};

type PillButtonControllerProps<TValue extends number | string> = {
  accessibilityLabel: string;
  label?: string;
  onChange: (value: TValue) => void;
  options: PillButtonOption<TValue>[];
  value: TValue;
};

export function PillButtonController<TValue extends number | string>({
  accessibilityLabel,
  label,
  onChange,
  options,
  value,
}: PillButtonControllerProps<TValue>) {
  return (
    <YStack gap="$2">
      {label ? (
        <Text color={museBuddyColors.ink} fontSize={13} fontWeight="900" textTransform="uppercase">
          {label}
        </Text>
      ) : null}
      <XStack
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="tablist"
        gap="$1.5"
        style={styles.group}
      >
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <YStack
              accessibilityLabel={option.accessibilityLabel ?? option.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              flex={1}
              key={option.id}
              onPress={() => {
                onChange(option.value);
              }}
              pressStyle={{
                background: isSelected ? museBuddyColors.active : museBuddyColors.surfaceMuted,
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
              {option.description ? (
                <Text
                  color={museBuddyColors.ink}
                  fontSize={11}
                  fontWeight="800"
                  numberOfLines={1}
                  opacity={0.78}
                  style={styles.description}
                >
                  {option.description}
                </Text>
              ) : null}
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
    backgroundColor: museBuddyColors.active,
  },
  optionLabel: {
    textAlign: 'center',
  },
  description: {
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});
