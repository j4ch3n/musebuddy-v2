import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';

import { MusicViewFlip } from './music-view-flip';

type MusicViewFlipStoryArgs = {
  sizeToContent: boolean;
};

const meta = {
  title: 'UI/MusicViewFlip',
  args: { sizeToContent: false },
  argTypes: { sizeToContent: { control: 'boolean' } },
  render: ({ sizeToContent }: MusicViewFlipStoryArgs) => (
    <View style={styles.storyFrame}>
      <MusicViewFlip
        keyboard={<Panel label="Keyboard view" />}
        notation={<Panel label="Notation view" />}
        sizeToContent={sizeToContent}
      />
    </View>
  ),
} satisfies Meta<MusicViewFlipStoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FillAvailableSpace: Story = {};
export const SizeToContent: Story = { args: { sizeToContent: true } };

function Panel({ label }: { label: string }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: museBuddyColors.pine, fontSize: 14, fontWeight: '800' },
  panel: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.paper,
    height: 180,
    justifyContent: 'center',
  },
  storyFrame: { height: 300, padding: 18 },
});
