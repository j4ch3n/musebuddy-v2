import type { Meta, StoryObj } from '@storybook/react-native';
import { Text, YStack } from 'tamagui';

import { museBuddyColors } from '@/constants/design-tokens';

import { FlashCard } from './flash-card';

const meta = {
  title: 'UI/FlashCard',
  component: FlashCard,
  args: {
    sideA: (
      <YStack gap={10}>
        <Text color={museBuddyColors.pine} fontSize={12} fontWeight="900">
          DAILY CHORD
        </Text>
        <Text color={museBuddyColors.pine} fontSize={42} fontWeight="900">
          Cmaj7
        </Text>
        <Text color={museBuddyColors.pine} fontSize={17} fontWeight="700">
          A raised surface for focused practice content.
        </Text>
      </YStack>
    ),
    shadowColor: museBuddyColors.sky,
    surface: 'hero',
  },
} satisfies Meta<typeof FlashCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Hero: Story = {};

export const Supporting: Story = {
  args: {
    surface: 'supporting',
  },
};

export const Flippable: Story = {
  args: {
    sideB: (
      <YStack gap={10}>
        <Text color={museBuddyColors.pine} fontSize={12} fontWeight="900">
          CHORD NOTES
        </Text>
        <Text color={museBuddyColors.pine} fontSize={17} fontWeight="700">
          C is the root, E is the major third, and G is the perfect fifth.
        </Text>
      </YStack>
    ),
  },
};
