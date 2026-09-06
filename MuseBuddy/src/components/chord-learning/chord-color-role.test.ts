import { describe, expect, it } from 'vitest';

import { museBuddyColors } from '@/constants/design-tokens';

import {
  chordSyntaxRoleByTokenType,
  chordSyntaxRoleColors,
  chordToneRoleByImportance,
  chordToneRoleColors,
} from './chord-color-role';

describe('chord color roles', () => {
  it('assigns a stable syntax role to every token type', () => {
    expect(chordSyntaxRoleByTokenType).toEqual({
      addition: 'addition',
      alteration: 'alteration',
      bass: 'bass',
      extension: 'extension',
      omission: 'omission',
      quality: 'quality',
      root: 'root',
      separator: 'separator',
    });
  });

  it('maps legacy importance to canonical teaching roles', () => {
    expect(chordToneRoleByImportance).toEqual({
      color: 'color',
      essential: 'quality',
      optional: 'voicing',
      supporting: 'guide',
    });
  });

  it('uses one display color for sheet, keyboard, and legend harmonic notes', () => {
    expect(chordToneRoleColors).toMatchObject({
      color: { color: museBuddyColors.chordColorTone },
      anchor: { color: museBuddyColors.wildflower },
      quality: { color: museBuddyColors.chordEssential },
      guide: { color: museBuddyColors.chordSupporting },
      voicing: { color: museBuddyColors.chordOptional },
    });
  });

  it('uses one display color for chord-name syntax and its legend', () => {
    expect(chordSyntaxRoleColors).toMatchObject({
      addition: { color: museBuddyColors.chordColorTone },
      alteration: { color: museBuddyColors.chordColorTone },
      bass: { color: museBuddyColors.wildflower },
      extension: { color: museBuddyColors.chordColorTone },
      quality: { color: museBuddyColors.chordEssential },
      root: { color: museBuddyColors.wildflower },
    });
  });
});
