import { describe, expect, it } from 'vitest';

import type { ChordDisplayToken } from '@/music-theory';

import { chordNameSymbolForDisplay, chordNameTokensForDisplay } from './chord-name-display';

const tokens = [
  { text: 'C', type: 'root' },
  { text: 'maj', type: 'quality' },
  { text: '7', type: 'extension' },
  { text: '(', type: 'separator' },
  { text: '#11', type: 'alteration' },
  { text: ')', type: 'separator' },
  { text: '/', type: 'separator' },
  { text: 'G', type: 'bass' },
] satisfies readonly ChordDisplayToken[];

describe('ChordName display modes', () => {
  it('retains every token in full-chord mode', () => {
    expect(chordNameTokensForDisplay(tokens, 'full-chord')).toBe(tokens);
    expect(chordNameSymbolForDisplay(tokens, 'full-chord')).toBe('Cmaj7(#11)/G');
  });

  it('displays the root and slash bass in root-only mode', () => {
    expect(chordNameSymbolForDisplay(tokens, 'root-only')).toBe('C/G');
  });

  it('displays only the root when the chord has no slash bass', () => {
    expect(chordNameSymbolForDisplay(tokens.slice(0, 6), 'root-only')).toBe('C');
  });
});
