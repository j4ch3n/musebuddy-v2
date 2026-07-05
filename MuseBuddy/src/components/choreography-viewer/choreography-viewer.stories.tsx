import type { Meta, StoryObj } from '@storybook/react-native';

import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';

import { ChoreographyViewer } from './choreography-viewer';

type SourceSlot = TrainingSessionKeyArrangement['rows'][number]['slots'][number];

const rest = () => [{ midi: null, velocity: null }];

function slots(overrides: Record<number, SourceSlot>) {
  const sourceSlots: SourceSlot[] = Array.from({ length: 32 }, rest);

  Object.entries(overrides).forEach(([index, slot]) => {
    sourceSlots[Number(index)] = slot;
  });

  return sourceSlots;
}

const sampleArrangement: TrainingSessionKeyArrangement = {
  rows: [
    {
      beatIndex: 0,
      slots: slots({
        0: [
          { midi: 60, velocity: 96 },
          { midi: 67, velocity: 88 },
        ],
        1: [
          { midi: -50, velocity: null },
          { midi: -50, velocity: null },
        ],
        2: [
          { midi: -50, velocity: null },
          { midi: -50, velocity: null },
        ],
        6: [{ midi: 64, velocity: 72 }],
        10: [
          { midi: 67, velocity: 104 },
          { midi: 72, velocity: 118 },
        ],
        11: [
          { midi: -50, velocity: null },
          { midi: -50, velocity: null },
        ],
        18: [{ midi: 65, velocity: 52 }],
        24: [
          { midi: 69, velocity: 80 },
          { midi: 69, velocity: 70 },
        ],
      }),
    },
    {
      beatIndex: 1,
      slots: slots({
        0: [{ midi: 72, velocity: 110 }],
        1: [{ midi: -50, velocity: null }],
        8: [{ midi: 76, velocity: 124 }],
        12: [{ midi: 71, velocity: 66 }],
        20: [
          { midi: 64, velocity: 60 },
          { midi: 72, velocity: 88 },
          { midi: 79, velocity: 112 },
        ],
      }),
    },
  ],
};

const meta = {
  title: 'Components/ChoreographyViewer/ChoreographyViewer',
  component: ChoreographyViewer,
  args: {
    keyArrangement: sampleArrangement,
  },
} satisfies Meta<typeof ChoreographyViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Preview: Story = {};

export const SinglePitch: Story = {
  args: {
    keyArrangement: {
      rows: [
        {
          beatIndex: 0,
          slots: slots({
            0: [{ midi: 60, velocity: 64 }],
            8: [{ midi: 60, velocity: 88 }],
            16: [{ midi: 60, velocity: 112 }],
          }),
        },
        {
          beatIndex: 1,
          slots: slots({
            4: [{ midi: 60, velocity: 72 }],
            20: [{ midi: 60, velocity: 100 }],
          }),
        },
      ],
    },
  },
};
