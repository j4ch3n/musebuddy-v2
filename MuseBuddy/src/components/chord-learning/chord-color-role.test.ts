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

  it('uses the shared display palette for harmonic note colors', () => {
    expect(chordToneRoleColors).toMatchObject({
      color: { accent: museBuddyColors.yellow, fill: museBuddyColors.cyan },
      essential: { accent: museBuddyColors.cyan, fill: museBuddyColors.pink },
      optional: { accent: museBuddyColors.cyan, fill: museBuddyColors.pink },
      root: { accent: museBuddyColors.pink, fill: museBuddyColors.blue },
      supporting: { accent: museBuddyColors.blue, fill: museBuddyColors.yellow },
    });
  });

  it('uses the same display colors for chord-name syntax', () => {
    expect(chordSyntaxRoleColors).toMatchObject({
      addition: { accent: museBuddyColors.yellow, text: museBuddyColors.yellow },
      alteration: { accent: museBuddyColors.cyan, text: museBuddyColors.cyan },
      bass: { accent: museBuddyColors.cyan, text: museBuddyColors.cyan },
      extension: { accent: museBuddyColors.yellow, text: museBuddyColors.yellow },
      quality: { accent: museBuddyColors.pink, text: museBuddyColors.pink },
      root: { accent: museBuddyColors.blue, text: museBuddyColors.blue },
    });
  });
});
