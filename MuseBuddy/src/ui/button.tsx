import { type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type AccessibilityState,
  type ColorValue,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { museBuddyBorders, museBuddyRadii } from '@/constants/design-tokens';

import { TactileControlAction } from './tactile-control';

type ButtonProps = {
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  backgroundColor: string;
  children?: ReactNode;
  disabled?: boolean;
  fontWeight?: TextStyle['fontWeight'];
  frameColor: string;
  icon?: ReactNode;
  label?: string;
  longPressSeconds?: number | null;
  onPress: () => void;
  progressColor?: ColorValue;
  shadowColor: string;
  shadowEnabled?: boolean;
  style?: StyleProp<ViewStyle>;
  surfaceColor: string;
};

export function Button({
  accessibilityLabel,
  accessibilityState,
  backgroundColor,
  children,
  disabled = false,
  fontWeight = '900',
  frameColor,
  icon,
  label,
  longPressSeconds = null,
  onPress,
  progressColor,
  shadowColor,
  shadowEnabled = true,
  style,
  surfaceColor,
}: ButtonProps) {
  return (
    <TactileControlAction
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={disabled}
      disabledStyle={styles.disabledButton}
      longPressSeconds={longPressSeconds}
      onPress={onPress}
      pressedStyle={
        shadowEnabled
          ? {
              boxShadow: `2px 2px 0 ${shadowColor}`,
              transform: [{ translateX: 4 }, { translateY: 4 }],
            }
          : styles.flatPressed
      }
      progressColor={progressColor ?? surfaceColor}
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor: frameColor,
          boxShadow: shadowEnabled ? `6px 6px 0 ${shadowColor}` : 'none',
        },
        style,
      ]}
    >
      {children ?? (
        <View style={styles.content}>
          {icon}
          {label ? (
            <Text style={{ color: surfaceColor, fontSize: 18, fontWeight }} numberOfLines={1}>
              {label}
            </Text>
          ) : null}
        </View>
      )}
    </TactileControlAction>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.standard,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  content: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center' },
  disabledButton: { boxShadow: 'none' },
  flatPressed: { opacity: 0.72 },
});
