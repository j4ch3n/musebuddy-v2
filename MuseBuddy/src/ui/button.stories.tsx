import type { Meta, StoryObj } from '@storybook/react-native';

import { Button } from './button';

const noop = () => {};

const meta = {
  title: 'UI/Button',
  component: Button,
  args: {
    label: 'Continue',
    onPress: noop,
    primary: true,
    tone: 'default',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    label: 'Random',
    primary: false,
  },
};

export const Success: Story = {
  args: {
    label: 'Back to home',
    tone: 'success',
  },
};

export const Danger: Story = {
  args: {
    label: 'Stop rhythm',
    tone: 'danger',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Random',
    primary: false,
  },
};
