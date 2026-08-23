import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Rect, Text as SvgText } from 'react-native-svg';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import { pianoPitchClasses, type PianoPitchClass } from '@schema/music-theory-schema';

import { getPianoKeyboardMarkers } from './piano-keyboard-utils';

export type { PianoKeyboardMarker } from './piano-keyboard-utils';
export { getPianoKeyboardMarkers } from './piano-keyboard-utils';

export type PianoKeyboardMarkerTone = 'color' | 'essential' | 'optional' | 'root' | 'supporting';

export type PianoKeyboardMarkerAppearance = {
  fill: string;
  label: string;
};

export type PianoKeyboardLiveKeyState = {
  isUnexpectedActive: boolean;
  isSuccess: boolean;
  labels: readonly string[];
  rippleId: number;
};

export type PianoKeyboardProps = {
  root: PianoPitchClass;
  keys?: readonly PianoPitchClass[];
  width?: number;
  markerAppearances?: Partial<Record<PianoKeyboardMarkerTone, PianoKeyboardMarkerAppearance>>;
  markerLabels?: Partial<Record<PianoPitchClass, string>>;
  markerTones?: Partial<Record<PianoPitchClass, PianoKeyboardMarkerTone>>;
  liveKeys?: Partial<Record<PianoPitchClass, PianoKeyboardLiveKeyState>>;
  showMarkers?: boolean;
  accessibilityLabel?: string;
};

const KEYBOARD_HEIGHT = 180;
const KEY_FACE_Y = 20;
const KEY_SHADOW_OFFSET_X = 0;
const KEY_SHADOW_OFFSET_Y = 9;
const KEY_SHADOW_Y = KEY_FACE_Y + KEY_SHADOW_OFFSET_Y;
const KEY_SHADOW_WIDTH_EXPANSION = 6;
const KEY_SHADOW_HORIZONTAL_INSET = KEY_SHADOW_WIDTH_EXPANSION / 2;
const KEY_SHADOW_RADIUS = museBuddyRadii.medium;
const LIVE_KEYBOARD_HEIGHT = 230;
const LIVE_KEY_SHADOW_EXTENSION = 54;
const LIVE_RIPPLE_DURATION_MS = 180;
const WHITE_KEY_HEIGHT = 132;
const BLACK_KEY_HEIGHT = 86;
const WHITE_MARKER_Y = 127;
const BLACK_MARKER_Y = 85;
const MARKER_CORE_RADIUS_OFFSET = 4;
const MARKER_HALO_RADIUS_OFFSET = 0;
const MARKER_HALO_OPACITY = 0.32;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const whiteKeyPositions = {
  0: 10,
  2: 50,
  4: 90,
  5: 130,
  7: 170,
  9: 210,
  11: 250,
} as const;

const blackKeyPositions = {
  1: 54,
  3: 94,
  6: 174,
  8: 214,
  10: 254,
} as const;

const blackKeyRectPositions = {
  1: 42,
  3: 82,
  6: 162,
  8: 202,
  10: 242,
} as const;

const whiteKeyPitchClasses = Object.keys(whiteKeyPositions).map(
  Number,
) as (keyof typeof whiteKeyPositions)[];
const blackKeyPitchClasses = Object.keys(blackKeyPositions).map(
  Number,
) as (keyof typeof blackKeyPositions)[];

function getMarkerPosition(pitchClass: PianoPitchClass) {
  if (pitchClass in whiteKeyPositions) {
    return {
      cx: whiteKeyPositions[pitchClass as keyof typeof whiteKeyPositions] + 20,
      cy: WHITE_MARKER_Y,
      r: 14,
    };
  }

  return {
    cx: blackKeyPositions[pitchClass as keyof typeof blackKeyPositions],
    cy: BLACK_MARKER_Y,
    r: 12,
  };
}

export function PianoKeyboard({
  accessibilityLabel,
  keys = [],
  markerAppearances,
  markerLabels,
  markerTones,
  liveKeys,
  root,
  showMarkers = true,
  width,
}: PianoKeyboardProps) {
  const markers = getPianoKeyboardMarkers(root, keys);
  const isLiveKeyboard = liveKeys !== undefined;
  const markerLabel = markers
    .map(
      ({ isRoot, pitchClass }) =>
        `${markerLabels?.[pitchClass] ?? `pitch class ${pitchClass}`}${isRoot ? ' root' : ''}`,
    )
    .join(', ');

  return (
    <View
      accessibilityLabel={
        accessibilityLabel ?? `One octave piano keyboard with selected keys: ${markerLabel}`
      }
      accessibilityRole="image"
      style={[
        styles.container,
        { aspectRatio: 320 / (isLiveKeyboard ? LIVE_KEYBOARD_HEIGHT : KEYBOARD_HEIGHT) },
        width === undefined ? null : { width },
      ]}
    >
      <Svg
        height="100%"
        viewBox={`0 0 320 ${isLiveKeyboard ? LIVE_KEYBOARD_HEIGHT : KEYBOARD_HEIGHT}`}
        width="100%"
      >
        {isLiveKeyboard ? <KeyboardClipPaths /> : null}
        <G>
          {whiteKeyPitchClasses.map((pitchClass) => (
            <KeyboardKeyShadow
              appearance={getKeyAppearance(pitchClass, markerAppearances, markerTones)}
              isBlack={false}
              key={`white-shadow-${pitchClass}`}
              liveState={liveKeys?.[pitchClass]}
              pitchClass={pitchClass}
            />
          ))}
        </G>

        <G>
          {whiteKeyPitchClasses.map((pitchClass) => (
            <Rect
              fill={museBuddyColors.mist}
              height={WHITE_KEY_HEIGHT}
              key={pitchClass}
              rx={museBuddyRadii.small}
              stroke={museBuddyColors.notation}
              strokeLinejoin="round"
              strokeWidth={museBuddyBorders.extraBold}
              width={40}
              x={whiteKeyPositions[pitchClass]}
              y={KEY_FACE_Y}
            />
          ))}
        </G>

        <Rect
          fill={museBuddyColors.mist}
          height={12}
          rx={museBuddyRadii.small}
          width={280}
          x={10}
          y={KEY_FACE_Y}
        />
        <Rect
          fill="none"
          height={WHITE_KEY_HEIGHT}
          rx={museBuddyRadii.small}
          stroke={museBuddyColors.notation}
          strokeWidth={museBuddyBorders.extraBold}
          width={280}
          x={10}
          y={KEY_FACE_Y}
        />

        <G>
          {blackKeyPitchClasses.map((pitchClass) => (
            <KeyboardKeyShadow
              appearance={getKeyAppearance(pitchClass, markerAppearances, markerTones)}
              isBlack
              key={pitchClass}
              liveState={liveKeys?.[pitchClass]}
              pitchClass={pitchClass}
            />
          ))}
        </G>

        <G>
          {blackKeyPitchClasses.map((pitchClass) => (
            <Rect
              fill={museBuddyColors.notation}
              height={BLACK_KEY_HEIGHT}
              key={`black-face-${pitchClass}`}
              rx={museBuddyRadii.small}
              stroke={museBuddyColors.notation}
              strokeLinejoin="round"
              strokeWidth={museBuddyBorders.extraBold}
              width={24}
              x={blackKeyRectPositions[pitchClass]}
              y={KEY_FACE_Y}
            />
          ))}
        </G>

        {isLiveKeyboard ? (
          <G>
            {pianoPitchClasses.map((pitchClass) => {
              const liveState = liveKeys[pitchClass];
              if (!liveState || liveState.isUnexpectedActive || liveState.rippleId === 0) {
                return null;
              }

              return (
                <LiveKeyRipple
                  appearance={getKeyAppearance(pitchClass, markerAppearances, markerTones)}
                  key={`ripple-${pitchClass}`}
                  pitchClass={pitchClass}
                  rippleId={liveState.rippleId}
                />
              );
            })}
          </G>
        ) : null}

        {showMarkers ? (
          <G>
            {markers.map(({ isRoot, pitchClass }) => {
              const { cx, cy, r } = getMarkerPosition(pitchClass);
              const label = markerLabels?.[pitchClass];
              const tone = isRoot ? 'root' : (markerTones?.[pitchClass] ?? 'supporting');
              const appearance = markerAppearances?.[tone] ?? markerToneAppearances[tone];

              return (
                <G key={`marker-${pitchClass}-${root}`}>
                  <Circle
                    cx={cx}
                    cy={cy}
                    fill="none"
                    r={r + MARKER_HALO_RADIUS_OFFSET}
                    stroke={appearance.fill}
                    strokeOpacity={MARKER_HALO_OPACITY}
                    strokeWidth={2}
                  />
                  <Circle
                    cx={cx}
                    cy={cy}
                    fill={appearance.fill}
                    r={r - MARKER_CORE_RADIUS_OFFSET}
                  />
                  {label ? (
                    <SvgText
                      fill={appearance.label}
                      fontSize={label.length > 1 ? 10 : 13}
                      fontWeight="900"
                      textAnchor="middle"
                      x={cx}
                      y={cy + 3}
                    >
                      {label}
                    </SvgText>
                  ) : null}
                </G>
              );
            })}
          </G>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: '100%',
    width: '100%',
  },
});

function KeyboardClipPaths() {
  return (
    <Defs>
      {whiteKeyPitchClasses.map((pitchClass) => (
        <ClipPath id={`live-key-${pitchClass}`} key={pitchClass}>
          <Rect
            height={WHITE_KEY_HEIGHT}
            width={40}
            x={whiteKeyPositions[pitchClass]}
            y={KEY_FACE_Y}
          />
        </ClipPath>
      ))}
      {blackKeyPitchClasses.map((pitchClass) => (
        <ClipPath id={`live-key-${pitchClass}`} key={pitchClass}>
          <Rect
            height={BLACK_KEY_HEIGHT}
            width={24}
            x={blackKeyRectPositions[pitchClass]}
            y={KEY_FACE_Y}
          />
        </ClipPath>
      ))}
    </Defs>
  );
}

function getKeyAppearance(
  pitchClass: PianoPitchClass,
  markerAppearances: PianoKeyboardProps['markerAppearances'],
  markerTones: PianoKeyboardProps['markerTones'],
) {
  const tone = markerTones?.[pitchClass] ?? 'supporting';
  return markerAppearances?.[tone] ?? markerToneAppearances[tone];
}

function KeyboardKeyShadow({
  appearance,
  isBlack,
  liveState,
  pitchClass,
}: {
  appearance: PianoKeyboardMarkerAppearance;
  isBlack: boolean;
  liveState?: PianoKeyboardLiveKeyState;
  pitchClass: PianoPitchClass;
}) {
  const baseHeight = isBlack ? BLACK_KEY_HEIGHT : WHITE_KEY_HEIGHT;
  const baseX = isBlack
    ? blackKeyRectPositions[pitchClass as keyof typeof blackKeyRectPositions]
    : whiteKeyPositions[pitchClass as keyof typeof whiteKeyPositions] +
      KEY_SHADOW_OFFSET_X -
      KEY_SHADOW_HORIZONTAL_INSET;
  const baseWidth = isBlack ? 24 : 40 + KEY_SHADOW_WIDTH_EXPANSION;
  const labels = liveState?.labels ?? [];
  const hasExpectedHit = labels.length > 0;
  const isExtended = hasExpectedHit || liveState?.isUnexpectedActive === true;
  const [extension] = useState(
    () => new Animated.Value(isExtended ? LIVE_KEY_SHADOW_EXTENSION : 0),
  );
  const previousExtensionState = useRef(isExtended);

  useEffect(() => {
    if (previousExtensionState.current === isExtended) {
      return;
    }
    previousExtensionState.current = isExtended;
    Animated.timing(extension, {
      duration: LIVE_RIPPLE_DURATION_MS,
      toValue: isExtended ? LIVE_KEY_SHADOW_EXTENSION : 0,
      useNativeDriver: false,
    }).start();
  }, [extension, isExtended]);

  const fill = liveState?.isSuccess
    ? museBuddyColors.success
    : hasExpectedHit
      ? appearance.fill
      : liveState?.isUnexpectedActive
        ? museBuddyColors.error
        : museBuddyColors.notation;
  const labelY = (isBlack ? KEY_FACE_Y + BLACK_KEY_HEIGHT - 2 : KEY_SHADOW_Y + baseHeight) + 15;

  if (isBlack) {
    if (!isExtended) {
      return null;
    }

    const dropdownY = KEY_FACE_Y + BLACK_KEY_HEIGHT - 2;

    return (
      <G>
        <AnimatedRect
          fill={fill}
          height={Animated.add(extension, KEY_SHADOW_OFFSET_Y + 2)}
          rx={KEY_SHADOW_RADIUS}
          width={baseWidth}
          x={baseX}
          y={dropdownY}
        />
        <Rect fill={fill} height={KEY_SHADOW_RADIUS} width={baseWidth} x={baseX} y={dropdownY} />
        {hasExpectedHit
          ? labels.map((label, index) => (
              <SvgText
                fill={museBuddyColors.mist}
                fontSize={10}
                fontWeight="900"
                key={`${pitchClass}-${label}-${index}`}
                textAnchor="middle"
                x={baseX + baseWidth / 2}
                y={labelY + index * 14}
              >
                {label}
              </SvgText>
            ))
          : null}
      </G>
    );
  }

  return (
    <G>
      <AnimatedRect
        fill={fill}
        height={Animated.add(extension, baseHeight)}
        rx={KEY_SHADOW_RADIUS}
        width={baseWidth}
        x={baseX}
        y={KEY_SHADOW_Y}
      />
      {hasExpectedHit
        ? labels.map((label, index) => (
            <SvgText
              fill={museBuddyColors.mist}
              fontSize={10}
              fontWeight="900"
              key={`${pitchClass}-${label}-${index}`}
              textAnchor="middle"
              x={baseX + baseWidth / 2}
              y={labelY + index * 14}
            >
              {label}
            </SvgText>
          ))
        : null}
    </G>
  );
}

function LiveKeyRipple({
  appearance,
  pitchClass,
  rippleId,
}: {
  appearance: PianoKeyboardMarkerAppearance;
  pitchClass: PianoPitchClass;
  rippleId: number;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const previousRippleId = useRef(0);
  const { cx, cy, r } = getMarkerPosition(pitchClass);

  useEffect(() => {
    if (rippleId === previousRippleId.current) {
      return;
    }
    previousRippleId.current = rippleId;
    progress.setValue(0);
    Animated.timing(progress, {
      duration: LIVE_RIPPLE_DURATION_MS,
      toValue: 1,
      useNativeDriver: false,
    }).start();
  }, [progress, rippleId]);

  return (
    <AnimatedCircle
      clipPath={`url(#live-key-${pitchClass})`}
      cx={cx}
      cy={cy}
      fill="none"
      opacity={progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.72, 0.42, 0] })}
      r={progress.interpolate({ inputRange: [0, 1], outputRange: [r, r + 26] })}
      stroke={appearance.fill}
      strokeWidth={4}
    />
  );
}

const markerToneAppearances: Record<PianoKeyboardMarkerTone, PianoKeyboardMarkerAppearance> = {
  color: {
    fill: museBuddyColors.cyan,
    label: museBuddyColors.mist,
  },
  essential: {
    fill: museBuddyColors.pink,
    label: museBuddyColors.mist,
  },
  optional: {
    fill: museBuddyColors.pink,
    label: museBuddyColors.mist,
  },
  root: {
    fill: museBuddyColors.blue,
    label: museBuddyColors.mist,
  },
  supporting: {
    fill: museBuddyColors.yellow,
    label: museBuddyColors.mist,
  },
};
