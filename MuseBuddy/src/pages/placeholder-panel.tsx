import { StyleSheet } from 'react-native';
import { Text, View, YStack } from 'tamagui';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { FlashCard } from '@/ui';

type PlaceholderPanelProps = {
  accent?: 'leaf' | 'sky' | 'wildflower';
  body: string;
  title: string;
};

export function PlaceholderPanel({ accent = 'sky', body, title }: PlaceholderPanelProps) {
  return (
    <FlashCard
      sideA={
        <YStack gap={12}>
          <View style={[styles.accentMark, accentStyles[accent]]} />
          <Text color={museBuddyColors.pine} fontSize={24} fontWeight="900" lineHeight={30}>
            {title}
          </Text>
          <Text color={museBuddyColors.pine} fontSize={17} fontWeight="600" lineHeight={25}>
            {body}
          </Text>
        </YStack>
      }
      surface="supporting"
      tone={accent}
    />
  );
}

const accentStyles = StyleSheet.create({
  leaf: {
    backgroundColor: museBuddyColors.leaf,
  },
  sky: {
    backgroundColor: museBuddyColors.sky,
  },
  wildflower: {
    backgroundColor: museBuddyColors.wildflower,
  },
});

const styles = StyleSheet.create({
  accentMark: {
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.small,
    borderWidth: museBuddyBorders.bold,
    height: 22,
    width: 92,
  },
});
