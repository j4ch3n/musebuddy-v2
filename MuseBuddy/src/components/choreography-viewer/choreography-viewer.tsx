import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { museBuddyColors } from '@/constants/design-tokens';
import type { TrainingSessionKeyArrangement } from '@/contexts/training-session-schema';
import { FlashCard } from '@/ui';

import { buildChoreographyLayout } from './choreography-layout';

type ChoreographyViewerProps = {
  keyArrangement: TrainingSessionKeyArrangement;
};

const VIEWBOX_WIDTH = 160;
const VIEWBOX_HEIGHT = 90;

export function ChoreographyViewer({ keyArrangement }: ChoreographyViewerProps) {
  const layout = useMemo(() => buildChoreographyLayout(keyArrangement), [keyArrangement]);

  return (
    <FlashCard
      accessibilityLabel="Pattern shape preview showing note timing from left to right and pitch from low to high"
      padded={false}
      sideA={
        <View accessibilityRole="image" style={styles.stage}>
          <Svg height="100%" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} width="100%">
            <Line
              opacity={0.14}
              stroke={museBuddyColors.ink}
              strokeLinecap="round"
              strokeWidth={1}
              x1={0}
              x2={VIEWBOX_WIDTH}
              y1={toViewBoxY(24)}
              y2={toViewBoxY(24)}
            />
            <Line
              opacity={0.14}
              stroke={museBuddyColors.ink}
              strokeLinecap="round"
              strokeWidth={1}
              x1={0}
              x2={VIEWBOX_WIDTH}
              y1={toViewBoxY(50)}
              y2={toViewBoxY(50)}
            />
            <Line
              opacity={0.14}
              stroke={museBuddyColors.ink}
              strokeLinecap="round"
              strokeWidth={1}
              x1={0}
              x2={VIEWBOX_WIDTH}
              y1={toViewBoxY(76)}
              y2={toViewBoxY(76)}
            />
            {layout.stepGroups.map((group) => (
              <Line
                key={group.id}
                opacity={0.42}
                stroke={museBuddyColors.accentBlue}
                strokeLinecap="round"
                strokeWidth={1.8}
                x1={toViewBoxX(group.xPercent)}
                x2={toViewBoxX(group.xPercent)}
                y1={toViewBoxY(group.yStartPercent)}
                y2={toViewBoxY(group.yEndPercent)}
              />
            ))}
            {layout.attacks.map((attack) => (
              <Circle
                cx={toViewBoxX(attack.xPercent)}
                cy={toViewBoxY(attack.yPercent)}
                fill={attack.isRoot ? museBuddyColors.accentRed : noteColor(attack.midi)}
                key={attack.id}
                r={attack.size / 2}
                stroke={museBuddyColors.ink}
                strokeWidth={attack.isRoot ? 2.5 : 1.8}
              />
            ))}
          </Svg>
          {layout.attacks.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No notes loaded</Text>
            </View>
          )}
        </View>
      }
      surface="cream"
    />
  );
}

function toViewBoxX(percent: number) {
  return (percent / 100) * VIEWBOX_WIDTH;
}

function toViewBoxY(percent: number) {
  return (percent / 100) * VIEWBOX_HEIGHT;
}

function noteColor(midi: number) {
  const palette = [
    museBuddyColors.accentBlue,
    museBuddyColors.accentGreen,
    museBuddyColors.accentPurple,
    museBuddyColors.secondary,
  ];

  return palette[midi % palette.length] ?? museBuddyColors.accentBlue;
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  emptyText: {
    color: museBuddyColors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  stage: {
    aspectRatio: 16 / 9,
    backgroundColor: museBuddyColors.surface,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
});
