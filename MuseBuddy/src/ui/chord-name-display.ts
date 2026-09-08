import type { ChordDisplayToken } from '@/music-theory';

export type ChordNameDisplayMode = 'full-chord' | 'root-only';

export function chordNameTokensForDisplay(
  tokens: readonly ChordDisplayToken[],
  displayMode: ChordNameDisplayMode,
): readonly ChordDisplayToken[] {
  if (displayMode === 'full-chord') return tokens;

  const rootTokens = tokens.filter((token) => token.type === 'root');
  const bassToken = tokens.find((token) => token.type === 'bass');

  return bassToken ? [...rootTokens, { text: '/', type: 'separator' }, bassToken] : rootTokens;
}

export function chordNameSymbolForDisplay(
  tokens: readonly ChordDisplayToken[],
  displayMode: ChordNameDisplayMode,
) {
  return chordNameTokensForDisplay(tokens, displayMode)
    .map((token) => token.text)
    .join('');
}
