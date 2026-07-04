import type { Meta, StoryObj } from '@storybook/react-native';

import { DEFAULT_BPM } from './constants';
import { RhythmSpeedControl } from './rhythm-speed-control';

const noop = () => {};

const meta = {
  title: 'Components/RhythmTrainer/RhythmSpeedControl',
  component: RhythmSpeedControl,
  args: {
    onChange: noop,
    value: DEFAULT_BPM,
  },
} satisfies Meta<typeof RhythmSpeedControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const Slowest: Story = {
  args: {
    value: 40,
  },
};
