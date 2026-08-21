import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplayTokenType } from '@/music-theory';
import type { ChordToneImportance } from '@/contexts/training-session-schema';

export type ChordSyntaxColorRole =
  | 'addition'
  | 'alteration'
  | 'bass'
  | 'extension'
  | 'omission'
  | 'quality'
  | 'root'
  | 'separator';

export type ChordToneColorRole = 'color' | 'essential' | 'optional' | 'root' | 'supporting';

export const chordSyntaxRoleByTokenType: Record<ChordDisplayTokenType, ChordSyntaxColorRole> = {
  addition: 'addition',
  alteration: 'alteration',
  bass: 'bass',
  extension: 'extension',
  omission: 'omission',
  quality: 'quality',
  root: 'root',
  separator: 'separator',
};

export const chordToneRoleByImportance: Record<ChordToneImportance, ChordToneColorRole> = {
  color: 'color',
  essential: 'essential',
  optional: 'optional',
  supporting: 'supporting',
};

export const chordSyntaxRoleLabels: Record<ChordSyntaxColorRole, string> = {
  addition: 'Added tone',
  alteration: 'Altered tone',
  bass: 'Bass note',
  extension: 'Extension',
  omission: 'Omitted tone',
  quality: 'Chord quality',
  root: 'Root',
  separator: 'Separator',
};

export const chordToneRoleLabels: Record<ChordToneColorRole, string> = {
  color: 'Color tone',
  essential: 'Essential',
  optional: 'Optional',
  root: 'Root',
  supporting: 'Supporting',
};

export const chordSyntaxRoleColors: Record<ChordSyntaxColorRole, { accent: string; text: string }> =
  {
    addition: {
      accent: museBuddyColors.chordAdditionAccent,
      text: museBuddyColors.chordAdditionText,
    },
    alteration: {
      accent: museBuddyColors.chordAlterationAccent,
      text: museBuddyColors.chordAlterationText,
    },
    bass: { accent: museBuddyColors.chordBassAccent, text: museBuddyColors.chordBassText },
    extension: {
      accent: museBuddyColors.chordExtensionAccent,
      text: museBuddyColors.chordExtensionText,
    },
    omission: { accent: museBuddyColors.mist, text: museBuddyColors.pine },
    quality: {
      accent: museBuddyColors.chordQualityAccent,
      text: museBuddyColors.chordQualityText,
    },
    root: { accent: museBuddyColors.chordRootAccent, text: museBuddyColors.chordRootText },
    separator: { accent: museBuddyColors.mist, text: museBuddyColors.pine },
  };

export const chordToneRoleColors: Record<
  ChordToneColorRole,
  { accent: string; fill: string; label: string; ring: string }
> = {
  color: {
    accent: museBuddyColors.rhythmWeak,
    fill: museBuddyColors.cyan,
    label: museBuddyColors.mist,
    ring: museBuddyColors.cyanLight,
  },
  essential: {
    accent: museBuddyColors.rhythmHold,
    fill: museBuddyColors.pink,
    label: museBuddyColors.mist,
    ring: museBuddyColors.pinkLight,
  },
  optional: {
    accent: museBuddyColors.rhythmHold,
    fill: museBuddyColors.pink,
    label: museBuddyColors.mist,
    ring: museBuddyColors.pinkLight,
  },
  root: {
    accent: museBuddyColors.rhythmStrong,
    fill: museBuddyColors.blue,
    label: museBuddyColors.mist,
    ring: museBuddyColors.blueLight,
  },
  supporting: {
    accent: museBuddyColors.rhythmRest,
    fill: museBuddyColors.yellow,
    label: museBuddyColors.mist,
    ring: museBuddyColors.yellowLight,
  },
};
