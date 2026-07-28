import type { Meta, StoryObj } from '@storybook/react-native';

import { RhythmBarViewer } from './rhythm-bar-viewer';

const sampleSteps = [
  's',
  'h',
  'h',
  null,
  'w',
  'h',
  null,
  null,
  's',
  null,
  'w',
  'h',
  null,
  null,
  'w',
  null,
  's',
  'h',
  null,
  null,
  'w',
  null,
  'w',
  'h',
  's',
  null,
  null,
  'w',
  'h',
  null,
  'w',
  null,
] as const;

const meta = {
  title: 'Components/RhythmTrainer/RhythmBarViewer',
  component: RhythmBarViewer,
  args: {
    currentStepIndex: null,
    steps: sampleSteps,
  },
} satisfies Meta<typeof RhythmBarViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Idle: Story = {};

export const PlayingCurrentStep: Story = {
  args: {
    currentStepIndex: 8,
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
      'w',
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

export const DetectedHits: Story = {
  args: {
    attackDots: [
      { attackOffsetMs: 0, id: 1, matched: true },
      { attackOffsetMs: 845, id: 2, matched: true },
      { attackOffsetMs: 1_325, id: 3, matched: false },
    ],
    currentStepIndex: 13,
    stepDurationMs: 100,
  },
};
