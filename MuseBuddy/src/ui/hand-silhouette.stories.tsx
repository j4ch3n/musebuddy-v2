import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';

import { HandSilhouette } from './hand-silhouette';

const meta = {
  title: 'UI/HandSilhouette',
  component: HandSilhouette,
  args: {
    fill: museBuddyColors.skyWash,
    hand: 'right',
    height: 118,
    stroke: museBuddyColors.pine,
    width: 100,
  },
  decorators: [
    (Story) => (
      <View style={styles.canvas}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof HandSilhouette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RightHand: Story = {};

export const LeftHand: Story = {
  args: { hand: 'left' },
};

const styles = StyleSheet.create({
  canvas: { alignItems: 'center', padding: 24 },
});
