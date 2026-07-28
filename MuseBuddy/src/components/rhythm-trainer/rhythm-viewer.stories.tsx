import type { Meta, StoryObj } from '@storybook/react-native';

import { RhythmViewer } from './rhythm-viewer';

const samplePattern = [
  's',
  null,
  'w',
  null,
  's',
  null,
  null,
  'w',
  's',
  'w',
  'w',
  null,
  's',
  null,
  'w',
  null,
  's',
  null,
  null,
  'w',
  's',
  null,
  'w',
  null,
  's',
  'w',
  null,
  null,
  's',
  null,
  'w',
  null,
] as const;

const meta = {
  title: 'Components/RhythmTrainer/RhythmViewer',
  component: RhythmViewer,
  args: {
    currentStepIndex: null,
    pattern: samplePattern,
  },
} satisfies Meta<typeof RhythmViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const ActiveThirdBeat: Story = {
  args: {
    currentStepIndex: 21,
  },
};

export const TwoBars: Story = {
  args: {
    currentStepIndex: 45,
    pattern: [...samplePattern, ...samplePattern],
  },
};
