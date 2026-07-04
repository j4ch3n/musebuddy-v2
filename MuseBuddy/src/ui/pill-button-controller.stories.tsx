import type { Meta, StoryObj } from '@storybook/react-native';

import { PillButtonController } from './pill-button-controller';

const noop = () => {};

const speedOptions = [
  {
    accessibilityLabel: 'Slow, 60 BPM',
    description: '60 BPM',
    id: 'slow',
    label: 'Slow',
    value: 60,
  },
  {
    accessibilityLabel: 'Medium, 80 BPM',
    description: '80 BPM',
    id: 'medium',
    label: 'Medium',
    value: 80,
  },
  {
    accessibilityLabel: 'Fast, 110 BPM',
    description: '110 BPM',
    id: 'fast',
    label: 'Fast',
    value: 110,
  },
];

const meta = {
  title: 'UI/PillButtonController',
  component: PillButtonController,
  args: {
    accessibilityLabel: 'Rhythm playback speed',
    label: 'Speed',
    onChange: noop,
    options: speedOptions,
    value: 80,
  },
} satisfies Meta<typeof PillButtonController<number>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Slowest: Story = {
  args: {
    value: 60,
  },
};
