import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import type { PianoPitchClass } from '@schema/music-theory-schema';

import { getPianoKeyboardMarkers } from './piano-keyboard-utils';

export type { PianoKeyboardMarker } from './piano-keyboard-utils';
export { getPianoKeyboardMarkers } from './piano-keyboard-utils';

export type PianoKeyboardMarkerTone = 'color' | 'essential' | 'optional' | 'root' | 'supporting';

export type PianoKeyboardMarkerAppearance = {
  fill: string;
  label: string;
  ring: string;
};

export type PianoKeyboardProps = {
  root: PianoPitchClass;
  keys?: readonly PianoPitchClass[];
  width?: number;
  markerAppearances?: Partial<Record<PianoKeyboardMarkerTone, PianoKeyboardMarkerAppearance>>;
  markerLabels?: Partial<Record<PianoPitchClass, string>>;
  markerTones?: Partial<Record<PianoPitchClass, PianoKeyboardMarkerTone>>;
  accessibilityLabel?: string;
};

const KEYBOARD_HEIGHT = 170;

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
      cy: 114,
      r: 14,
    };
  }

  return {
    cx: blackKeyPositions[pitchClass as keyof typeof blackKeyPositions],
    cy: 72,
    r: 12,
  };
}

export function PianoKeyboard({
  accessibilityLabel,
  keys = [],
  markerAppearances,
  markerLabels,
  markerTones,
  root,
  width,
}: PianoKeyboardProps) {
  const markers = getPianoKeyboardMarkers(root, keys);
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
      style={[styles.container, width === undefined ? null : { width }]}
    >
      <Svg height="100%" viewBox={`0 0 320 ${KEYBOARD_HEIGHT}`} width="100%">
        <G>
          {whiteKeyPitchClasses.map((pitchClass) => (
            <Rect
              fill={museBuddyColors.notation}
              height={122}
              key={`white-shadow-${pitchClass}`}
              rx={museBuddyRadii.small}
              width={40}
              x={whiteKeyPositions[pitchClass]}
              y={29}
            />
          ))}
          {blackKeyPitchClasses.map((pitchClass) => (
            <Rect
              fill={museBuddyColors.notation}
              height={76}
              key={`black-shadow-${pitchClass}`}
              rx={museBuddyRadii.small}
              width={24}
              x={blackKeyRectPositions[pitchClass]}
              y={29}
            />
          ))}
        </G>

        <G>
          {whiteKeyPitchClasses.map((pitchClass) => (
            <Rect
              fill={museBuddyColors.mist}
              height={122}
              key={pitchClass}
              rx={museBuddyRadii.small}
              stroke={museBuddyColors.notation}
              strokeLinejoin="round"
              strokeWidth={museBuddyBorders.extraBold}
              width={40}
              x={whiteKeyPositions[pitchClass]}
              y={20}
            />
          ))}
        </G>

        <Rect
          fill={museBuddyColors.mist}
          height={12}
          rx={museBuddyRadii.small}
          width={280}
          x={10}
          y={20}
        />
        <Rect
          fill="none"
          height={122}
          rx={museBuddyRadii.small}
          stroke={museBuddyColors.notation}
          strokeWidth={museBuddyBorders.extraBold}
          width={280}
          x={10}
          y={20}
        />

        <G>
          {blackKeyPitchClasses.map((pitchClass) => (
            <Rect
              fill={museBuddyColors.notation}
              height={76}
              key={pitchClass}
              rx={museBuddyRadii.small}
              stroke={museBuddyColors.notation}
              strokeLinejoin="round"
              strokeWidth={museBuddyBorders.extraBold}
              width={24}
              x={blackKeyRectPositions[pitchClass]}
              y={20}
            />
          ))}
        </G>

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
                  fill={appearance.fill}
                  r={r}
                  stroke={appearance.ring}
                  strokeWidth={museBuddyBorders.extraBold}
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
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 320 / KEYBOARD_HEIGHT,
    maxWidth: '100%',
    width: '100%',
  },
});

const markerToneAppearances: Record<PianoKeyboardMarkerTone, PianoKeyboardMarkerAppearance> = {
  color: {
    fill: museBuddyColors.cyan,
    label: museBuddyColors.mist,
    ring: museBuddyColors.cyanLight,
  },
  essential: {
    fill: museBuddyColors.pink,
    label: museBuddyColors.mist,
    ring: museBuddyColors.pinkLight,
  },
  optional: {
    fill: museBuddyColors.pink,
    label: museBuddyColors.mist,
    ring: museBuddyColors.pinkLight,
  },
  root: {
    fill: museBuddyColors.blue,
    label: museBuddyColors.mist,
    ring: museBuddyColors.blueLight,
  },
  supporting: {
    fill: museBuddyColors.yellow,
    label: museBuddyColors.mist,
    ring: museBuddyColors.yellowLight,
  },
};
