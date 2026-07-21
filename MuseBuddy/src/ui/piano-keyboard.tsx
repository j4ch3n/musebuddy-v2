import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';

import { museBuddyBorders, museBuddyColors, museBuddyRadii } from '@/constants/design-tokens';
import type { PianoPitchClass } from '@schema/music-theory-schema';

import { getPianoKeyboardMarkers } from './piano-keyboard-utils';

export type { PianoKeyboardMarker } from './piano-keyboard-utils';
export { getPianoKeyboardMarkers } from './piano-keyboard-utils';

export type PianoKeyboardProps = {
  root: PianoPitchClass;
  keys?: readonly PianoPitchClass[];
  width?: number;
  rootColor?: string;
  keyColor?: string;
  markerLabels?: Partial<Record<PianoPitchClass, string>>;
  accessibilityLabel?: string;
};

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
      r: 12,
    };
  }

  return {
    cx: blackKeyPositions[pitchClass as keyof typeof blackKeyPositions],
    cy: 72,
    r: 10,
  };
}

export function PianoKeyboard({
  accessibilityLabel,
  keyColor = museBuddyColors.accentBlue,
  keys = [],
  markerLabels,
  root,
  rootColor = museBuddyColors.accentRed,
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
      <Svg height="100%" viewBox="0 0 320 170" width="100%">
        <G>
          {whiteKeyPitchClasses.map((pitchClass) => (
            <Rect
              fill={museBuddyColors.ink}
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
              fill={museBuddyColors.ink}
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
              fill={museBuddyColors.surface}
              height={122}
              key={pitchClass}
              rx={museBuddyRadii.small}
              stroke={museBuddyColors.ink}
              strokeLinejoin="round"
              strokeWidth={museBuddyBorders.extraBold}
              width={40}
              x={whiteKeyPositions[pitchClass]}
              y={20}
            />
          ))}
        </G>

        <Rect
          fill={museBuddyColors.surfaceMuted}
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
          stroke={museBuddyColors.ink}
          strokeWidth={museBuddyBorders.extraBold}
          width={280}
          x={10}
          y={20}
        />

        <G>
          {blackKeyPitchClasses.map((pitchClass) => (
            <Rect
              fill={museBuddyColors.ink}
              height={76}
              key={pitchClass}
              rx={museBuddyRadii.small}
              stroke={museBuddyColors.ink}
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

            return (
              <G key={`marker-${pitchClass}-${root}`}>
                <Circle
                  cx={cx}
                  cy={cy}
                  fill={isRoot ? rootColor : keyColor}
                  r={r}
                  stroke={museBuddyColors.ink}
                  strokeWidth={museBuddyBorders.bold}
                />
                {label ? (
                  <SvgText
                    fill={museBuddyColors.white}
                    fontSize={label.length > 1 ? 9 : 11}
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
    aspectRatio: 320 / 170,
    maxWidth: '100%',
    width: '100%',
  },
});
