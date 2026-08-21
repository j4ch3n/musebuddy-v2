import { museBuddyPalette } from './design-palette.generated';

export const museBuddyColors = {
  ...museBuddyPalette,
  frame: museBuddyPalette.pineDeep,
  secondaryFace: museBuddyPalette.skyWash,
  successFace: museBuddyPalette.leafWash,
  dangerFace: museBuddyPalette.cobaltWash,
  rhythmStrong: museBuddyPalette.pink,
  rhythmWeak: museBuddyPalette.yellow,
  rhythmHold: museBuddyPalette.cyan,
  rhythmRest: museBuddyPalette.blue,
  rhythmCurrent: museBuddyPalette.wildflower,
  rhythmCorrect: museBuddyPalette.yellow,
  chordRootText: museBuddyPalette.blue,
  chordRootAccent: museBuddyPalette.blue,
  chordQualityText: museBuddyPalette.pink,
  chordQualityAccent: museBuddyPalette.pink,
  chordExtensionText: museBuddyPalette.yellow,
  chordExtensionAccent: museBuddyPalette.yellow,
  chordAlterationText: museBuddyPalette.cyan,
  chordAlterationAccent: museBuddyPalette.cyan,
  chordAdditionText: museBuddyPalette.yellow,
  chordAdditionAccent: museBuddyPalette.yellow,
  chordBassText: museBuddyPalette.cyan,
  chordBassAccent: museBuddyPalette.cyan,
} as const;

export const museBuddyRadii = {
  small: 8,
  medium: 12,
  large: 20,
  round: 999,
} as const;

export const museBuddyBorders = {
  standard: 3,
  bold: 4,
  extraBold: 5,
} as const;

export const museBuddyShadows = {
  dropSmall: {
    x: 0,
    y: 4,
    blur: 0,
    color: museBuddyColors.frame,
  },
  dropMedium: {
    x: 0,
    y: 6,
    blur: 0,
    color: museBuddyColors.frame,
  },
} as const;

export const museBuddyTypography = {
  body: 'system-ui',
  rounded: 'ui-rounded',
  mono: 'ui-monospace',
} as const;
