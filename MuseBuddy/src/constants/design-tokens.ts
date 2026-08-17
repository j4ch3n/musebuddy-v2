import { museBuddyPalette } from './design-palette.generated';

export const museBuddyColors = {
  ...museBuddyPalette,
  canvas: museBuddyPalette.mist,
  text: museBuddyPalette.pine,
  frame: museBuddyPalette.pineDeep,
  primaryFace: museBuddyPalette.wildflower,
  primaryLabel: museBuddyPalette.pine,
  primaryRail: museBuddyPalette.pineDeep,
  secondaryFace: museBuddyPalette.skyWash,
  secondaryRail: museBuddyPalette.sky,
  successFace: museBuddyPalette.leafWash,
  successRail: museBuddyPalette.leaf,
  dangerFace: museBuddyPalette.coralWash,
  dangerRail: museBuddyPalette.coral,
  rhythmStrong: museBuddyPalette.sun,
  rhythmWeak: museBuddyPalette.sky,
  rhythmHold: museBuddyPalette.leaf,
  rhythmRest: museBuddyPalette.petal,
  rhythmCurrent: museBuddyPalette.wildflower,
  rhythmCorrect: museBuddyPalette.leaf,
  rhythmOffTime: museBuddyPalette.coral,
  chordRootText: museBuddyPalette.berryInk,
  chordRootAccent: museBuddyPalette.wildflower,
  chordQualityText: museBuddyPalette.oceanInk,
  chordQualityAccent: museBuddyPalette.sky,
  chordExtensionText: museBuddyPalette.mossInk,
  chordExtensionAccent: museBuddyPalette.leaf,
  chordAlterationText: museBuddyPalette.coralInk,
  chordAlterationAccent: museBuddyPalette.coral,
  chordAdditionText: museBuddyPalette.ochreInk,
  chordAdditionAccent: museBuddyPalette.sun,
  chordBassText: museBuddyPalette.violetInk,
  chordBassAccent: museBuddyPalette.violet,
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
