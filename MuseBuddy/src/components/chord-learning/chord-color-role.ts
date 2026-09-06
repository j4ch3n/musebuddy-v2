import { museBuddyColors } from '@/constants/design-tokens';
import type { ChordDisplayTokenType } from '@/music-theory';
import type { ChordTeachingRole } from '@/contexts/training-session-schema';

export type ChordSyntaxColorRole =
  | 'addition'
  | 'alteration'
  | 'bass'
  | 'extension'
  | 'omission'
  | 'quality'
  | 'root'
  | 'separator';

export type ChordToneColorRole = ChordTeachingRole;

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

export const chordToneRoleByTeachingRole: Record<ChordTeachingRole, ChordToneColorRole> = {
  anchor: 'anchor',
  color: 'color',
  guide: 'guide',
  quality: 'quality',
  voicing: 'voicing',
};

/** @deprecated Existing fixtures may still use the pre-canonical vocabulary. */
export const chordToneRoleByImportance = {
  color: 'color',
  essential: 'quality',
  optional: 'voicing',
  supporting: 'guide',
} as const;

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
  anchor: 'Anchor',
  color: 'Color tone',
  guide: 'Guide tone',
  quality: 'Quality',
  voicing: 'Voicing tone',
};

export const chordToneRoleColors: Record<ChordToneColorRole, { color: string; label: string }> = {
  anchor: { color: museBuddyColors.wildflower, label: museBuddyColors.mist },
  color: {
    color: museBuddyColors.chordColorTone,
    label: museBuddyColors.mist,
  },
  guide: {
    color: museBuddyColors.chordSupporting,
    label: museBuddyColors.mist,
  },
  quality: {
    color: museBuddyColors.chordEssential,
    label: museBuddyColors.mist,
  },
  voicing: {
    color: museBuddyColors.chordOptional,
    label: museBuddyColors.mist,
  },
};

const chordToneRoleBySyntaxRole: Record<ChordSyntaxColorRole, ChordToneColorRole> = {
  addition: 'color',
  alteration: 'color',
  bass: 'anchor',
  extension: 'color',
  omission: 'voicing',
  quality: 'quality',
  root: 'anchor',
  separator: 'voicing',
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
