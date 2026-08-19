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
        !primary && tone === 'success' && styles.successButton,
        !primary && tone === 'danger' && styles.dangerButton,
        disabled && styles.disabledButton,
      ]}
    >
      {children ?? (
        <Text
          color={primary && !disabled ? museBuddyColors.mist : museBuddyColors.pine}
          fontSize={18}
          fontWeight="900"
          numberOfLines={1}
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
    backgroundColor: museBuddyColors.wildflower,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `6px 6px 0 ${museBuddyColors.frame}`,
    justifyContent: 'center',
    minHeight: 58,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButton: {
    backgroundColor: museBuddyColors.secondaryFace,
    boxShadow: `4px 4px 0 ${museBuddyColors.sky}`,
  },
  successButton: {
    backgroundColor: museBuddyColors.successFace,
  },
  dangerButton: {
    backgroundColor: museBuddyColors.dangerFace,
  },
  disabledButton: {
    backgroundColor: museBuddyColors.mist,
    boxShadow: 'none',
    opacity: 0.62,
  },
  buttonPressed: {
    boxShadow: `2px 2px 0 ${museBuddyColors.frame}`,
    transform: [{ translateX: 4 }, { translateY: 4 }],
  },
  buttonLabel: {
    textAlign: 'center',
    zIndex: 1,
  },
});
