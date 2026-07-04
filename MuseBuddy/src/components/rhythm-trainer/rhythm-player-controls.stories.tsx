import type { Meta, StoryObj } from '@storybook/react-native';

import { RhythmPlayerControls } from './rhythm-player-controls';

const noop = () => {};

const meta = {
  title: 'Components/RhythmTrainer/RhythmPlayerControls',
  component: RhythmPlayerControls,
  args: {
    isPlaying: false,
    onRandomPattern: noop,
    onTogglePlayback: noop,
  },
} satisfies Meta<typeof RhythmPlayerControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const Playing: Story = {
  args: {
    isPlaying: true,
  },
};
