import { defaultConfig } from '@tamagui/config/v5';
import { createTamagui } from 'tamagui';

import {
  museBuddyBorders,
  museBuddyColors,
  museBuddyRadii,
  museBuddyShadows,
} from './src/constants/design-tokens';

const museBuddyTokens = {
  ...defaultConfig.tokens,
  radius: {
    ...defaultConfig.tokens.radius,
    small: museBuddyRadii.small,
    medium: museBuddyRadii.medium,
    large: museBuddyRadii.large,
    round: museBuddyRadii.round,
  },
  space: {
    ...defaultConfig.tokens.space,
    shadowSmall: museBuddyShadows.dropSmall.y,
    shadowMedium: museBuddyShadows.dropMedium.y,
    borderBold: museBuddyBorders.bold,
    borderExtraBold: museBuddyBorders.extraBold,
  },
} as const;

const lightTheme = {
  ...defaultConfig.themes.light,
  background: museBuddyColors.mist,
  backgroundHover: museBuddyColors.mist,
  backgroundPress: museBuddyColors.mist,
  backgroundFocus: museBuddyColors.mist,
  color: museBuddyColors.pine,
  colorHover: museBuddyColors.pine,
  colorPress: museBuddyColors.pine,
  colorFocus: museBuddyColors.pine,
  borderColor: museBuddyColors.pine,
  borderColorHover: museBuddyColors.pine,
  borderColorPress: museBuddyColors.pine,
  borderColorFocus: museBuddyColors.pine,
  placeholderColor: museBuddyColors.pine,
  shadowColor: museBuddyColors.frame,
  mist: museBuddyColors.mist,
  paper: museBuddyColors.paper,
  pine: museBuddyColors.pine,
  wildflower: museBuddyColors.wildflower,
  sky: museBuddyColors.sky,
  leaf: museBuddyColors.leaf,
  sun: museBuddyColors.sun,
  petal: museBuddyColors.petal,
  skyWash: museBuddyColors.skyWash,
  leafWash: museBuddyColors.leafWash,
  sunWash: museBuddyColors.sunWash,
  cobalt: museBuddyColors.cobalt,
  cobaltWash: museBuddyColors.cobaltWash,
  blue: museBuddyColors.blue,
  pink: museBuddyColors.pink,
  yellow: museBuddyColors.yellow,
  cyan: museBuddyColors.cyan,
} as const;

const tamaguiConfig = createTamagui({
  ...defaultConfig,
  tokens: museBuddyTokens,
  themes: {
    ...defaultConfig.themes,
    light: lightTheme,
  },
});

export type MuseBuddyTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends MuseBuddyTamaguiConfig {}
}

export {
  museBuddyBorders,
  museBuddyColors,
  museBuddyRadii,
  museBuddyShadows,
} from './src/constants/design-tokens';

export default tamaguiConfig;
