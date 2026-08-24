import type { Meta, StoryObj } from '@storybook/react-native';

import { museBuddyColors } from '@/constants/design-tokens';

import { Button } from './button';

const noop = () => {};

const meta = {
  title: 'UI/Button',
  component: Button,
  args: {
    backgroundColor: museBuddyColors.wildflower,
    frameColor: museBuddyColors.pine,
    label: 'Continue',
    onPress: noop,
    shadowColor: museBuddyColors.pine,
    surfaceColor: museBuddyColors.mist,
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Magenta: Story = {};

export const IceWhite: Story = {
  args: {
    label: 'Random',
    backgroundColor: museBuddyColors.mist,
    frameColor: museBuddyColors.pine,
    shadowColor: museBuddyColors.sky,
    surfaceColor: museBuddyColors.pine,
  },
};

export const Pistachio: Story = {
  args: {
    label: 'Back to home',
    backgroundColor: museBuddyColors.leafWash,
    frameColor: museBuddyColors.pine,
    shadowColor: museBuddyColors.sky,
    surfaceColor: museBuddyColors.pine,
  },
};

export const LongPress: Story = {
  args: {
    label: 'Hold to continue',
    longPressSeconds: 0.8,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Random',
    backgroundColor: museBuddyColors.mist,
    frameColor: museBuddyColors.pine,
    shadowColor: museBuddyColors.sky,
    surfaceColor: museBuddyColors.pine,
  },
};
