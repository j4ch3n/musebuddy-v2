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

type ChordToneMarkerAppearance = {
  fill: string;
  label: string;
};

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

export const chordToneRoleColors: Record<ChordToneColorRole, { color: string; label: string }> = {
  color: {
    color: museBuddyColors.chordColorTone,
    label: museBuddyColors.mist,
  },
  essential: {
    color: museBuddyColors.chordEssential,
    label: museBuddyColors.mist,
  },
  optional: {
    color: museBuddyColors.chordOptional,
    label: museBuddyColors.mist,
  },
  root: {
    color: museBuddyColors.chordRoot,
    label: museBuddyColors.mist,
  },
  supporting: {
    color: museBuddyColors.chordSupporting,
    label: museBuddyColors.mist,
  },
};

const chordToneRoleBySyntaxRole: Record<ChordSyntaxColorRole, ChordToneColorRole> = {
  addition: 'color',
  alteration: 'optional',
  bass: 'optional',
  extension: 'color',
  omission: 'supporting',
  quality: 'essential',
  root: 'root',
  separator: 'supporting',
};

export const chordSyntaxRoleColors: Record<ChordSyntaxColorRole, { color: string }> =
  Object.fromEntries(
    Object.entries(chordToneRoleBySyntaxRole).map(([role, toneRole]) => [
      role,
      { color: chordToneRoleColors[toneRole].color },
    ]),
  ) as Record<ChordSyntaxColorRole, { color: string }>;

export const chordToneMarkerAppearances: Record<ChordToneColorRole, ChordToneMarkerAppearance> =
  Object.fromEntries(
    Object.entries(chordToneRoleColors).map(([role, { color, label }]) => [
      role,
      { fill: color, label },
    ]),
  ) as Record<ChordToneColorRole, ChordToneMarkerAppearance>;
