import { FontAwesome5 } from '@react-native-vector-icons/fontawesome5';
import { Lucide } from '@react-native-vector-icons/lucide';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { TrainingStageIcon, type TrainingStageIconId } from '@/ui';

const prepareTrainingSessionHref = '/prepare-training-session-splash' as Href;

const wordmarkSource = require('@assets/images/brand/musebuddy-wordmark.png');
const buddySource = require('@assets/images/brand/musebuddy-buddy.png');

type PracticePathStep = {
  description: string;
  icon: TrainingStageIconId;
  id: string;
  label: string;
};

type ParticleMotion = 'drift-left' | 'drift-right' | 'rise' | 'sway-left' | 'sway-right';

const particleMotionTargets: Record<ParticleMotion, { rotation: number; x: number; y: number }> = {
  'drift-left': { rotation: -9, x: -0.6, y: -0.7 },
  'drift-right': { rotation: 9, x: 0.6, y: -0.7 },
  rise: { rotation: 0, x: 0, y: -1 },
  'sway-left': { rotation: -14, x: -0.9, y: -0.35 },
  'sway-right': { rotation: 14, x: 0.9, y: -0.35 },
};

const practicePathSteps: readonly PracticePathStep[] = [
  {
    description: "Hear and explore today's musical idea.",
    icon: 'goal',
    id: 'preview',
    label: 'Preview',
  },
  {
    description: 'Learn the chord colours that shape it.',
    icon: 'chord',
    id: 'chords',
    label: 'Chords',
  },
  {
    description: 'Build the rhythm in your right hand.',
    icon: 'rhythm-treble',
    id: 'right-rhythm',
    label: 'Right rhythm',
  },
  {
    description: 'Add a steady left-hand foundation.',
    icon: 'rhythm-bass',
    id: 'left-rhythm',
    label: 'Left rhythm',
  },
  {
    description: 'Put it all together and make it your own.',
    icon: 'freestyle',
    id: 'improvise',
    label: 'Improvise',
  },
];

export function WelcomePage() {
  const router = useRouter();
  const [selectedStepId, setSelectedStepId] = useState(practicePathSteps[0].id);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.hero}>
          <Image
            accessibilityLabel="MuseBuddy"
            contentFit="contain"
            source={wordmarkSource}
            style={styles.wordmark}
          />
          <FloatingParticle delay={0} motion="drift-right" style={styles.musicNote}>
            <Lucide color={museBuddyColors.wildflower} name="music-2" size={28} />
          </FloatingParticle>
          <FloatingParticle delay={480} motion="sway-left" style={styles.ring}>
            <View style={styles.ringShape} />
          </FloatingParticle>
          <FloatingParticle delay={880} motion="drift-left" style={styles.sparkle}>
            <Lucide color={museBuddyColors.leaf} name="sparkles" size={32} />
          </FloatingParticle>
          <FloatingParticle delay={1180} motion="sway-right" style={styles.smallMusicNote}>
            <Lucide color={museBuddyColors.sun} name="music-2" size={21} />
          </FloatingParticle>
          <FloatingParticle delay={680} motion="drift-left" style={styles.pinkDot}>
            <View style={styles.pinkDotShape} />
          </FloatingParticle>
          <FloatingParticle delay={1420} motion="sway-right" style={styles.skyDot}>
            <View style={styles.skyDotShape} />
          </FloatingParticle>
          <FloatingParticle delay={360} motion="drift-right" style={styles.yellowTriangle}>
            <View style={styles.yellowTriangleShape} />
          </FloatingParticle>
          <FloatingParticle delay={1040} motion="sway-left" style={styles.cobaltRectangle}>
            <View style={styles.cobaltRectangleShape} />
          </FloatingParticle>
          <FloatingParticle delay={1560} motion="drift-left" style={styles.blueLightDiamond}>
            <View style={styles.blueLightDiamondShape} />
          </FloatingParticle>
          <FloatingParticle delay={1980} motion="sway-right" style={styles.yellowStar}>
            <Lucide color={museBuddyColors.yellow} name="star" size={23} />
          </FloatingParticle>
          <FloatingParticle delay={820} motion="drift-right" style={styles.titleStar}>
            <Lucide color={museBuddyColors.cobalt} name="sparkles" size={20} />
          </FloatingParticle>
          <FloatingParticle delay={1280} motion="sway-left" style={styles.titlePill}>
            <View style={styles.titlePillShape} />
          </FloatingParticle>

          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Daily improvisation</Text>
            <Text style={styles.title}>{'Listen.\nTap.\nGo.'}</Text>
          </View>
          <FloatingParticle delay={260} distance={7} motion="rise" style={styles.buddyFloat}>
            <View style={styles.buddyShadow}>
              <Image
                accessibilityLabel="Buddy, the MuseBuddy companion"
                contentFit="contain"
                source={buddySource}
                style={styles.buddy}
              />
            </View>
          </FloatingParticle>
        </View>

        <PracticePath selectedStepId={selectedStepId} onSelectStep={setSelectedStepId} />
      </ScrollView>

      <View style={styles.actionDock}>
        <Pressable
          accessibilityLabel="Go Improvise"
          accessibilityRole="button"
          onPress={() => {
            router.push(prepareTrainingSessionHref);
          }}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <FontAwesome5
            color={museBuddyColors.mist}
            iconStyle="solid"
            name="caret-right"
            size={27}
          />
          <Text style={styles.primaryButtonLabel}>Go Improvise</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function PracticePath({
  onSelectStep,
  selectedStepId,
}: {
  onSelectStep: (id: string) => void;
  selectedStepId: string;
}) {
  const selectedStep =
    practicePathSteps.find((step) => step.id === selectedStepId) ?? practicePathSteps[0];
  const selectedStepIndex = practicePathSteps.findIndex((step) => step.id === selectedStep.id);

  return (
    <View style={styles.pathCard}>
      <Text style={styles.pathTitle}>Practice path</Text>
      <View accessibilityRole="tablist" style={styles.pathSteps}>
        {practicePathSteps.map((step, index) => {
          const isSelected = step.id === selectedStep.id;

          return (
            <View key={step.id} style={styles.pathStepWrap}>
              <Pressable
                accessibilityHint="Shows a short explanation of this practice stage"
                accessibilityLabel={step.label}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                hitSlop={4}
                onPress={() => onSelectStep(step.id)}
                style={({ pressed }) => [
                  styles.pathStep,
                  isSelected && styles.pathStepSelected,
                  pressed && styles.pathStepPressed,
                ]}
              >
                <View style={[styles.stepIcon, isSelected && styles.stepIconSelected]}>
                  <TrainingStageIcon
                    color={isSelected ? museBuddyColors.mist : museBuddyColors.pine}
                    id={step.icon}
                    size={25}
                  />
                </View>
                <Text
                  numberOfLines={2}
                  style={[styles.stepLabel, isSelected && styles.stepLabelSelected]}
                >
                  {step.label}
                </Text>
              </Pressable>
              {index < practicePathSteps.length - 1 ? <View style={styles.pathConnector} /> : null}
            </View>
          );
        })}
      </View>
      <View accessibilityLiveRegion="polite" style={styles.tooltip}>
        <View
          style={[
            styles.tooltipPointer,
            { left: `${((selectedStepIndex + 0.5) / practicePathSteps.length) * 100}%` },
          ]}
        />
        <Text style={styles.tooltipTitle}>{selectedStep.label}</Text>
        <Text style={styles.tooltipBody}>{selectedStep.description}</Text>
      </View>
    </View>
  );
}

function FloatingParticle({
  children,
  delay,
  distance = 14,
  motion = 'rise',
  style,
}: {
  children: ReactNode;
  delay: number;
  distance?: number;
  motion?: ParticleMotion;
  style: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useReducedMotion();
  const horizontalTravel = useSharedValue(0);
  const rotation = useSharedValue(0);
  const verticalTravel = useSharedValue(0);
  const target = particleMotionTargets[motion];

  useEffect(() => {
    if (reducedMotion) {
      horizontalTravel.value = 0;
      rotation.value = 0;
      verticalTravel.value = 0;
      return;
    }

    horizontalTravel.value = withDelay(
      delay,
      withRepeat(withTiming(target.x * distance, { duration: 3600 }), -1, true),
    );
    verticalTravel.value = withDelay(
      delay,
      withRepeat(withTiming(target.y * distance, { duration: 3600 }), -1, true),
    );
    rotation.value = withDelay(
      delay,
      withRepeat(withTiming(target.rotation, { duration: 3600 }), -1, true),
    );
  }, [delay, distance, horizontalTravel, reducedMotion, rotation, target, verticalTravel]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: horizontalTravel.value },
      { translateY: verticalTravel.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return <Animated.View style={[styles.particle, style, animatedStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  actionDock: {
    backgroundColor: museBuddyColors.sun,
    paddingBottom: 34,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  content: {
    gap: 18,
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  eyebrow: {
    color: museBuddyColors.wildflower,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  hero: {
    minHeight: 350,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCopy: {
    gap: 10,
    left: 0,
    maxWidth: '55%',
    position: 'absolute',
    top: 88,
    zIndex: 1,
  },
  musicNote: {
    opacity: 0.9,
    right: 44,
    top: 15,
  },
  particle: {
    position: 'absolute',
  },
  pathCard: {
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.large,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `6px 7px 0 ${museBuddyColors.sky}`,
    gap: 18,
    padding: 18,
  },
  pathConnector: {
    backgroundColor: museBuddyColors.frame,
    height: 3,
    left: '67%',
    position: 'absolute',
    right: '-33%',
    top: 26,
    zIndex: 0,
  },
  pathStep: {
    alignItems: 'center',
    gap: 7,
    minHeight: 83,
    zIndex: 1,
  },
  pathStepPressed: {
    transform: [{ translateY: 2 }],
  },
  pathStepSelected: {
    transform: [{ translateY: -2 }],
  },
  pathStepWrap: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },
  pathSteps: {
    flexDirection: 'row',
  },
  pathTitle: {
    color: museBuddyColors.pine,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 29,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.wildflower,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.round,
    borderWidth: museBuddyBorders.standard,
    boxShadow: `6px 7px 0 ${museBuddyColors.frame}`,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    minHeight: 64,
    paddingHorizontal: 24,
  },
  primaryButtonLabel: {
    color: museBuddyColors.mist,
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 28,
  },
  primaryButtonPressed: {
    boxShadow: `2px 2px 0 ${museBuddyColors.frame}`,
    transform: [{ translateX: 4 }, { translateY: 5 }],
  },
  ring: {
    opacity: 0.7,
    right: 10,
    top: 120,
  },
  ringShape: {
    borderColor: museBuddyColors.wildflower,
    borderRadius: museBuddyRadii.round,
    borderWidth: 4,
    height: 19,
    width: 19,
  },
  buddy: {
    height: 112,
    width: 112,
  },
  buddyFloat: {
    right: 8,
    top: 168,
  },
  buddyShadow: {
    borderRadius: museBuddyRadii.large,
    boxShadow: `6px 7px 0 ${museBuddyColors.sky}`,
    overflow: 'hidden',
  },
  safeArea: {
    backgroundColor: museBuddyColors.sun,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  sparkle: {
    opacity: 0.78,
    right: 70,
    top: 292,
  },
  smallMusicNote: {
    left: 8,
    opacity: 0.66,
    top: 170,
  },
  pinkDot: {
    left: 82,
    opacity: 0.82,
    top: 294,
  },
  pinkDotShape: {
    backgroundColor: museBuddyColors.wildflower,
    borderRadius: museBuddyRadii.round,
    height: 9,
    width: 9,
  },
  skyDot: {
    opacity: 0.62,
    right: 10,
    top: 250,
  },
  skyDotShape: {
    backgroundColor: museBuddyColors.sky,
    borderRadius: museBuddyRadii.round,
    height: 11,
    width: 11,
  },
  yellowTriangle: {
    opacity: 0.86,
    right: 148,
    top: 252,
  },
  yellowTriangleShape: {
    borderBottomColor: museBuddyColors.yellow,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderLeftWidth: 10,
    borderRightColor: 'transparent',
    borderRightWidth: 10,
    height: 0,
    width: 0,
  },
  cobaltRectangle: {
    left: 18,
    opacity: 0.72,
    top: 258,
  },
  cobaltRectangleShape: {
    backgroundColor: museBuddyColors.cobaltWash,
    borderColor: museBuddyColors.cobalt,
    borderRadius: museBuddyRadii.small,
    borderWidth: 2,
    height: 16,
    transform: [{ rotate: '-12deg' }],
    width: 30,
  },
  blueLightDiamond: {
    opacity: 0.68,
    right: 24,
    top: 74,
  },
  blueLightDiamondShape: {
    backgroundColor: museBuddyColors.blueLight,
    borderColor: museBuddyColors.pine,
    borderRadius: 3,
    borderWidth: 2,
    height: 15,
    transform: [{ rotate: '45deg' }],
    width: 15,
  },
  yellowStar: {
    left: 106,
    opacity: 0.8,
    top: 278,
  },
  stepIcon: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.leaf,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.round,
    borderWidth: 2,
    height: 53,
    justifyContent: 'center',
    width: 53,
  },
  stepIconSelected: {
    backgroundColor: museBuddyColors.wildflower,
    boxShadow: `3px 3px 0 ${museBuddyColors.frame}`,
  },
  stepLabel: {
    color: museBuddyColors.pine,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
  },
  stepLabelSelected: {
    color: museBuddyColors.wildflower,
  },
  title: {
    color: museBuddyColors.pine,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  titlePill: {
    left: '53%',
    opacity: 0.72,
    top: 214,
  },
  titlePillShape: {
    backgroundColor: museBuddyColors.petal,
    borderColor: museBuddyColors.wildflower,
    borderRadius: museBuddyRadii.round,
    borderWidth: 2,
    height: 9,
    width: 20,
  },
  titleStar: {
    left: '55%',
    opacity: 0.82,
    top: 142,
  },
  tooltip: {
    backgroundColor: museBuddyColors.sunWash,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: 2,
    gap: 3,
    minHeight: 73,
    paddingHorizontal: 14,
    paddingVertical: 11,
    position: 'relative',
  },
  tooltipBody: {
    color: museBuddyColors.pine,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  tooltipPointer: {
    backgroundColor: museBuddyColors.sunWash,
    borderLeftColor: museBuddyColors.frame,
    borderTopColor: museBuddyColors.frame,
    borderWidth: 2,
    height: 12,
    position: 'absolute',
    top: -7,
    transform: [{ rotate: '45deg' }],
    width: 12,
  },
  tooltipTitle: {
    color: museBuddyColors.pine,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 19,
  },
  wordmark: {
    height: 54,
    width: 220,
  },
});
