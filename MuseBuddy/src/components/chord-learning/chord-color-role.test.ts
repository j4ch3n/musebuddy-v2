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

  it('assigns stable harmonic roles by importance', () => {
    expect(chordToneRoleByImportance).toEqual({
      color: 'color',
      essential: 'essential',
      optional: 'optional',
      supporting: 'supporting',
    });
  });

  it('uses one display color for sheet, keyboard, and legend harmonic notes', () => {
    expect(chordToneRoleColors).toMatchObject({
      color: { color: museBuddyColors.chordColorTone },
      essential: { color: museBuddyColors.chordEssential },
      optional: { color: museBuddyColors.chordOptional },
      root: { color: museBuddyColors.chordRoot },
      supporting: { color: museBuddyColors.chordSupporting },
    });
  });

  it('uses one display color for chord-name syntax and its legend', () => {
    expect(chordSyntaxRoleColors).toMatchObject({
      addition: { color: museBuddyColors.chordColorTone },
      alteration: { color: museBuddyColors.chordOptional },
      bass: { color: museBuddyColors.chordOptional },
      extension: { color: museBuddyColors.chordColorTone },
      quality: { color: museBuddyColors.chordEssential },
      root: { color: museBuddyColors.chordRoot },
    });
  });
});
