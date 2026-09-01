import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { paginateScore, PianoPatternScore } from '@/components/piano-pattern-score';
import {
  museBuddyBorders,
  museBuddyColors,
  museBuddyRadii,
  museBuddyTypography,
} from '@/constants/design-tokens';
import { useTrainingSession } from '@/contexts/training-session-context';
import type { PreparedTrainingSession } from '@/music-theory';

const buddySource = require('@assets/images/brand/musebuddy-buddy.png');

export function DailyPostcard({ compact }: { compact: boolean }) {
  const { session } = useTrainingSession();
  const [previewStepIndex] = useState(selectPreviewStepIndex);
  const score = useMemo(() => {
    if (!session) return null;

    return paginateScore(session.score, 1)[0] ?? session.score;
  }, [session]);

  if (!session || !score) return null;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <ScoreWatermarks hidden={compact} score={score} />
      <MajorScaleProgressWatermarks
        degrees={session.pattern.progression_in_major_scale.display}
        hidden={compact}
      />
      <View pointerEvents="none" style={[styles.scorePreview, compact && styles.hidden]}>
        <PianoPatternScore
          chordChanges={[]}
          currentStepIndex={previewStepIndex}
          measuresPerPage={1}
          notationColor={museBuddyColors.pine}
          renderHeight={224}
          score={score}
          surfaceColor="transparent"
          swipeEnabled={false}
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>DAILY POSTCARD</Text>
        <Text style={styles.title}>{session.pattern.title ?? "Today's Piece"}</Text>
        <Text style={styles.keyLabel}>{session.pattern.key_signature_display}</Text>
      </View>
      <View style={[styles.buddyTile, compact && styles.buddyTileCompact]}>
        <Image
          accessibilityLabel="Buddy, the MuseBuddy companion"
          contentFit="cover"
          source={buddySource}
          style={styles.buddy}
        />
      </View>
    </View>
  );
}

function ScoreWatermarks({
  hidden,
  score,
}: {
  hidden: boolean;
  score: PreparedTrainingSession['score'];
}) {
  return (
    <>
      <View pointerEvents="none" style={[styles.watermarkClef, hidden && styles.hidden]}>
        <MaterialDesignIcons
          color={museBuddyColors.cobaltWash}
          name="music-clef-treble"
          size={250}
        />
      </View>
      <View
        pointerEvents="none"
        style={[styles.watermarkScore, styles.watermarkScoreLower, hidden && styles.hidden]}
      >
        <PianoPatternScore
          chordChanges={[]}
          currentStepIndex={null}
          measuresPerPage={1}
          notationColor={museBuddyColors.pine}
          renderHeight={112}
          score={score}
          surfaceColor="transparent"
          swipeEnabled={false}
        />
      </View>
    </>
  );
}

function MajorScaleProgressWatermarks({
  degrees,
  hidden,
}: {
  degrees: readonly string[];
  hidden: boolean;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.majorScaleProgressWatermarks, hidden && styles.hidden]}
    >
      <Text style={styles.majorScaleProgressText}>{degrees.join(' – ')}</Text>
    </View>
  );
}

function selectPreviewStepIndex() {
  return Math.floor(Math.random() * 4) * 16;
}

const styles = StyleSheet.create({
  buddy: { height: '100%', width: '100%' },
  buddyTile: {
    backgroundColor: museBuddyColors.pine,
    borderRadius: museBuddyRadii.medium,
    bottom: -10,
    height: 88,
    overflow: 'hidden',
    position: 'absolute',
    right: 14,
    transform: [{ rotate: '-8deg' }],
    width: 88,
    zIndex: 2,
  },
  buddyTileCompact: { bottom: -12, height: 72, right: 12, width: 72 },
  card: {
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.pine,
    borderRadius: 34,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `7px 8px 0 ${museBuddyColors.sky}`,
    minHeight: 410,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingTop: 28,
    position: 'relative',
  },
  cardCompact: { marginBottom: 8, minHeight: 170, paddingTop: 27 },
  copy: { gap: 8, maxWidth: '80%', zIndex: 2 },
  eyebrow: {
    color: museBuddyColors.wildflower,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  hidden: { opacity: 0 },
  keyLabel: { color: museBuddyColors.pine, fontSize: 21, fontWeight: '700', lineHeight: 27 },
  majorScaleProgressText: {
    color: museBuddyColors.pine,
    fontFamily: museBuddyTypography.serif,
    fontSize: 102,
    fontStyle: 'italic',
    fontWeight: '800',
    letterSpacing: -4,
    lineHeight: 112,
  },
  majorScaleProgressWatermarks: {
    left: 60,
    opacity: 0.08,
    position: 'absolute',
    top: 88,
    transform: [{ rotate: '4deg' }],
    width: 800,
    zIndex: 0,
  },
  scorePreview: {
    height: 232,
    left: 18,
    position: 'absolute',
    right: -4,
    top: 128,
    transform: [{ rotate: '-8deg' }],
    zIndex: 1,
  },
  title: {
    color: museBuddyColors.pine,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  watermarkClef: {
    left: -50,
    opacity: 0.38,
    position: 'absolute',
    top: 134,
    transform: [{ rotate: '10deg' }],
    zIndex: 0,
  },
  watermarkScore: {
    opacity: 0.12,
    position: 'absolute',
    transform: [{ rotate: '-8deg' }],
    width: 330,
    zIndex: 0,
  },
  watermarkScoreLower: { bottom: 16, right: -92 },
});
