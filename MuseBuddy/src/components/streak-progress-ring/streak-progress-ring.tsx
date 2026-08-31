import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { StyleSheet, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';

import {
  isStreakProgressComplete,
  streakProgressSegmentColors,
  streakProgressSegments,
  type StreakProgressSegment,
} from './streak-progress-ring-model';

export { type StreakProgressSegment } from './streak-progress-ring-model';

export type StreakProgressRingProps = {
  accessibilityLabel: string;
  completedSegments: Readonly<Partial<Record<StreakProgressSegment, boolean>>>;
  showCenterIcon?: boolean;
  size?: number;
};

export function StreakProgressRing({
  accessibilityLabel,
  completedSegments,
  showCenterIcon = true,
  size = 34,
}: StreakProgressRingProps) {
  const segmentSize = size * 0.42;
  const segmentInset = (size - segmentSize) / 2;
  const centerSize = size * 0.56;
  const centerInset = (size - centerSize) / 2;
  const isComplete = isStreakProgressComplete(completedSegments);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.ring, { height: size, width: size }]}
    >
      {streakProgressSegments.map((segment, index) => (
        <View
          key={segment}
          style={[
            styles.segment,
            {
              backgroundColor: completedSegments[segment]
                ? streakProgressSegmentColors[segment]
                : museBuddyColors.mist,
              height: segmentSize,
              width: segmentSize,
            },
            index === 0 && { left: segmentInset, top: 0 },
            index === 1 && { right: 0, top: segmentInset },
            index === 2 && { bottom: 0, left: segmentInset },
            index === 3 && { left: 0, top: segmentInset },
          ]}
        />
      ))}
      <View
        style={[
          styles.center,
          {
            borderRadius: centerSize / 2,
            height: centerSize,
            left: centerInset,
            top: centerInset,
            width: centerSize,
          },
        ]}
      >
        {showCenterIcon ? (
          <FontAwesome5
            color={museBuddyColors.pine}
            iconStyle="solid"
            name={isComplete ? 'star' : 'star-half-alt'}
            size={Math.max(11, size * 0.38)}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.sun,
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 2,
  },
  ring: { position: 'relative' },
  segment: { borderRadius: 999, position: 'absolute' },
});
