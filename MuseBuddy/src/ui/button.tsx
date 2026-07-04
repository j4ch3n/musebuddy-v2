import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Text, YStack } from 'tamagui';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';

type ButtonTone = 'default' | 'success' | 'danger';

type ButtonProps = {
  children?: ReactNode;
  disabled?: boolean;
  label?: string;
  onPress: () => void;
  primary?: boolean;
  tone?: ButtonTone;
};

export function Button({
  children,
  disabled = false,
  label,
  onPress,
  primary = true,
  tone = 'default',
}: ButtonProps) {
  return (
    <YStack
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      pressStyle={disabled ? undefined : styles.buttonPressed}
      style={[
        styles.button,
        !primary && styles.secondaryButton,
        tone === 'success' && styles.successButton,
        tone === 'danger' && styles.dangerButton,
        disabled && styles.disabledButton,
      ]}
    >
      {children ?? (
        <Text
          color={disabled ? 'rgba(32, 27, 34, 0.62)' : museBuddyColors.ink}
          fontSize={18}
          fontWeight="900"
          style={styles.buttonLabel}
        >
          {label}
        </Text>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.primary,
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 6px 0 ${museBuddyColors.ink}`,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButton: {
    backgroundColor: museBuddyColors.secondary,
  },
  successButton: {
    backgroundColor: museBuddyColors.accentGreen,
  },
  dangerButton: {
    backgroundColor: museBuddyColors.accentRed,
  },
  disabledButton: {
    backgroundColor: museBuddyColors.surfaceMuted,
    opacity: 0.72,
  },
  buttonPressed: {
    boxShadow: `0 2px 0 ${museBuddyColors.ink}`,
    transform: [{ translateY: 4 }],
  },
  buttonLabel: {
    textAlign: 'center',
  },
});
