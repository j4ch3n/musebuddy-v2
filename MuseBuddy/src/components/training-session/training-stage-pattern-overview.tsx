import { Lucide } from '@react-native-vector-icons/lucide';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors } from '@/constants/design-tokens';
import type { PreparedTrainingSession } from '@/music-theory';
import { FlashCard, PlayButton } from '@/ui';

import { createDegreeWatermarkSlots } from './degree-watermark-layout';

const keyContextStrokeSource = require('@assets/images/stroke.png');

export type TrainingPatternHand = 'left' | 'right' | 'together';
export type TrainingStagePatternOverviewDetail = 'rhythm' | 'voicing';

type TrainingStagePatternOverviewBaseConfig = {
  degrees: readonly string[];
  hand: TrainingPatternHand;
  keySignatureLabel: string;
};

export type TrainingStagePatternOverviewConfig =
  | (TrainingStagePatternOverviewBaseConfig & { detail: 'rhythm' })
  | (TrainingStagePatternOverviewBaseConfig & { detail: 'voicing' });

export type TrainingStagePatternOverviewProps = {
  config: TrainingStagePatternOverviewConfig;
  onPlayPress?: () => void;
};

/** Builds a pattern-overview configuration from the prepared training-session payload. */
export function createTrainingStagePatternOverviewConfig(
  session: PreparedTrainingSession,
  hand: TrainingPatternHand,
  detail: TrainingStagePatternOverviewDetail,
): TrainingStagePatternOverviewConfig {
  return {
    degrees: session.pattern.progression_in_major_scale.display,
    detail,
    hand,
    keySignatureLabel: session.pattern.key_signature_display,
  };
}

export function TrainingStagePatternOverview({
  config,
  onPlayPress = noop,
}: TrainingStagePatternOverviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const handLabel =
    config.hand === 'left' ? 'Left hand' : config.hand === 'right' ? 'Right hand' : 'Together';
  const handlePlayPress = () => {
    setIsPlaying((current) => !current);
    onPlayPress();
  };

  return (
    <View style={styles.container}>
      <PatternOverviewHeader
        isPlaying={isPlaying}
        keySignatureLabel={config.keySignatureLabel}
        onPlayPress={handlePlayPress}
      />
      <FlashCard
        accessibilityLabel={`${config.detail} ${handLabel.toLowerCase()} pattern overview. Degrees ${config.degrees.join(', ')}`}
        heightMode="fill"
        shadowColor={museBuddyColors.leaf}
        sideA={
          <View style={styles.cardContent}>
            <DegreeWatermarks key={config.degrees.join('|')} degrees={config.degrees} />
            <DetailWatermark detail={config.detail} hand={config.hand} />
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              pointerEvents="none"
              style={styles.clefIllustration}
            >
              <ClefIllustration hand={config.hand} />
            </View>
            <Text style={styles.handLabel}>{handLabel}</Text>
          </View>
        }
        style={styles.card}
      />
    </View>
  );
}

function PatternOverviewHeader({
  isPlaying,
  keySignatureLabel,
  onPlayPress,
}: {
  isPlaying: boolean;
  keySignatureLabel: string;
  onPlayPress: () => void;
}) {
  return (
    <View style={styles.heading}>
      <View style={styles.keyContextAnchor}>
        <Text style={styles.keyContext}>{keySignatureLabel}</Text>
        <Image
          accessible={false}
          contentFit="fill"
          source={keyContextStrokeSource}
          style={styles.keyContextStroke}
        />
      </View>
      <PlayButton isPlaying={isPlaying} onPress={onPlayPress} />
    </View>
  );
}

function DegreeWatermarks({ degrees }: { degrees: readonly string[] }) {
  const [degreeSlots] = useState(() => createDegreeWatermarkSlots(degrees.length));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.degreeLayer}
    >
      {degrees.slice(0, degreeSlots.length).map((degree, index) => {
        const slot = degreeSlots[index];
        return (
          <Text
            key={`${degree}-${index}`}
            style={[
              styles.degree,
              {
                left: slot.left,
                opacity: slot.opacity,
                top: slot.top,
                transform: [{ rotate: slot.rotation }],
              },
            ]}
          >
            {degree}
          </Text>
        );
      })}
    </View>
  );
}

function DetailWatermark({
  detail,
  hand,
}: {
  detail: TrainingStagePatternOverviewDetail;
  hand: TrainingPatternHand;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.detailWatermark,
        hand === 'together' ? undefined : styles.individualHandDetailWatermark,
      ]}
    >
      <Lucide
        color={museBuddyColors.pine}
        name={detail === 'rhythm' ? 'audio-waveform' : 'keyboard-music'}
        size={144}
      />
    </View>
  );
}

function ClefIllustration({ hand }: { hand: TrainingPatternHand }) {
  if (hand === 'together') {
    return (
      <View style={styles.togetherClefs}>
        <MaterialDesignIcons color={museBuddyColors.coral} name="music-clef-treble" size={108} />
        <Text style={styles.plus}>+</Text>
        <MaterialDesignIcons color={museBuddyColors.cyan} name="music-clef-bass" size={96} />
      </View>
    );
  }

  return (
    <MaterialDesignIcons
      color={hand === 'right' ? museBuddyColors.coral : museBuddyColors.cyan}
      name={hand === 'right' ? 'music-clef-treble' : 'music-clef-bass'}
      size={148}
    />
  );
}

function noop() {}

const styles = StyleSheet.create({
  card: { marginBottom: 8, marginTop: 18 },
  cardContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
    position: 'relative',
  },
  clefIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  container: {
    backgroundColor: museBuddyColors.mist,
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  degree: {
    color: museBuddyColors.pine,
    fontSize: 46,
    fontWeight: '900',
    lineHeight: 52,
    position: 'absolute',
  },
  degreeLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  detailWatermark: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    opacity: 0.1,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  handLabel: {
    color: museBuddyColors.pine,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 27,
    marginTop: 12,
    zIndex: 1,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  individualHandDetailWatermark: {
    transform: [{ translateY: 10 }],
  },
  keyContext: {
    color: museBuddyColors.pine,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    lineHeight: 26,
    zIndex: 1,
  },
  keyContextAnchor: {
    position: 'relative',
  },
  keyContextStroke: {
    bottom: -2,
    height: 14,
    left: 0,
    position: 'absolute',
    right: 0,
    tintColor: museBuddyColors.wildflower,
  },
  plus: {
    color: museBuddyColors.cobaltInk,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 26,
    marginVertical: 4,
    zIndex: 1,
  },
  togetherClefs: {
    alignItems: 'center',
  },
});
