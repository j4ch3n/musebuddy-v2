import { StyleSheet } from 'react-native';
import { Text, View, YStack } from 'tamagui';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { FlashCard } from '@/ui';

type PlaceholderPanelProps = {
  accent?: 'blue' | 'green' | 'purple';
  body: string;
  title: string;
};

export function PlaceholderPanel({ accent = 'blue', body, title }: PlaceholderPanelProps) {
  return (
    <FlashCard
      sideA={
        <YStack gap={12}>
          <View style={[styles.accentMark, accentStyles[accent]]} />
          <Text color={museBuddyColors.ink} fontSize={24} fontWeight="900" lineHeight={30}>
            {title}
          </Text>
          <Text color={museBuddyColors.ink} fontSize={17} fontWeight="600" lineHeight={25}>
            {body}
          </Text>
        </YStack>
      }
      surface="cream"
    />
  );
}

const accentStyles = StyleSheet.create({
  blue: {
    backgroundColor: museBuddyColors.accentBlue,
  },
  green: {
    backgroundColor: museBuddyColors.accentGreen,
  },
  purple: {
    backgroundColor: museBuddyColors.accentPurple,
  },
});

const styles = StyleSheet.create({
  accentMark: {
    borderColor: museBuddyColors.ink,
    borderRadius: museBuddyRadii.small,
    borderWidth: museBuddyBorders.bold,
    height: 22,
    width: 92,
  },
});
