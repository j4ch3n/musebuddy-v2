import type { Meta, StoryObj } from '@storybook/react-native';
import { Text, YStack } from 'tamagui';

import { museBuddyColors } from '@/constants/design-tokens';

import { FlashCard } from './flash-card';

const noop = () => {};

const meta = {
  title: 'UI/FlashCard',
  component: FlashCard,
  args: {
    sideA: (
      <YStack gap={10}>
        <Text color={museBuddyColors.accentPurple} fontSize={12} fontWeight="900">
          DAILY CHORD
        </Text>
        <Text color={museBuddyColors.ink} fontSize={42} fontWeight="900">
          Cmaj7
        </Text>
        <Text color={museBuddyColors.ink} fontSize={17} fontWeight="700">
          A raised surface for focused practice content.
        </Text>
      </YStack>
    ),
    surface: 'white',
  },
} satisfies Meta<typeof FlashCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const White: Story = {};

export const Cream: Story = {
  args: {
    surface: 'cream',
  },
};

export const Pressable: Story = {
  args: {
    accessibilityLabel: 'Pressable flash card',
    onPress: noop,
  },
};

export const Flippable: Story = {
  args: {
    sideB: (
      <YStack gap={10}>
        <Text color={museBuddyColors.accentBlue} fontSize={12} fontWeight="900">
          CHORD NOTES
        </Text>
        <Text color={museBuddyColors.ink} fontSize={17} fontWeight="700">
          C is the root, E is the major third, and G is the perfect fifth.
        </Text>
      </YStack>
    ),
  },
};
