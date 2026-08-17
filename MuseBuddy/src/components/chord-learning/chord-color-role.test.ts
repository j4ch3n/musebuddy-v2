import { describe, expect, it } from 'vitest';

import { chordSyntaxRoleByTokenType, chordToneRoleByImportance } from './chord-color-role';

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
});
