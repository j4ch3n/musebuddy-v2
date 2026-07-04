import type { Meta, StoryObj } from '@storybook/react-native';

import { RhythmBarViewer } from './rhythm-bar-viewer';

const meta = {
  title: 'Components/RhythmTrainer/RhythmBarViewer',
  component: RhythmBarViewer,
  args: {
    currentStepIndex: null,
    isPlayingBar: false,
    steps: ['s', null, 'w', null, 's', null, null, 'w', 's', 'w', 'w', null, 's', null, 'w', null],
  },
} satisfies Meta<typeof RhythmBarViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const PlayingCurrentStep: Story = {
  args: {
    currentStepIndex: 8,
    isPlayingBar: true,
  },
};

export const RestHeavy: Story = {
  args: {
    steps: [
      's',
      null,
      null,
      null,
      's',
      null,
      null,
      null,
      'w',
      null,
      null,
      null,
      's',
      null,
      null,
      null,
    ],
  },
};
