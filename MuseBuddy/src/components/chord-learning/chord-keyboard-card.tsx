import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors, museBuddyTypography } from '@/constants/design-tokens';
import type { ChordDisplay } from '@/music-theory';
import { PianoKeyboard, type PianoKeyboardLiveKeyState, type PianoKeyboardMarkerTone } from '@/ui';
import type { PianoPitchClass } from '@schema/music-theory-schema';

import ChordSheet from './chord-sheet.dom';
import { chordToneRoleByImportance, chordToneMarkerAppearances } from './chord-color-role';
import { ChordToneLegend } from './chord-role-legend';

type ChordKeyboardCardProps = {
  display: ChordDisplay;
  displayMode?: 'full' | 'keyboard' | 'notation';
  errorMessage?: string;
  liveKeys?: Partial<Record<PianoPitchClass, PianoKeyboardLiveKeyState>>;
  showKeyHighlightDots?: boolean;
  showSheetNotation?: boolean;
};

export function ChordKeyboardCard({
  display,
  displayMode = 'full',
  errorMessage,
  liveKeys = {},
  showKeyHighlightDots = true,
  showSheetNotation = true,
}: ChordKeyboardCardProps) {
  const rootNote = display.notes.find((note) => note.isRoot) ?? display.notes[0];
  const selectedKeys = display.notes
    .filter((note) => note.pitchClass !== rootNote.pitchClass)
    .map((note) => note.pitchClass);
  const noteNames = display.notes.map((note) => note.text).join(' - ');
  const markerLabels = display.notes.reduce<Partial<Record<PianoPitchClass, string>>>(
    (labels, note) => {
      labels[note.pitchClass] = note.text;
      return labels;
    },
    {},
  );
  const markerTones = display.notes.reduce<
    Partial<Record<PianoPitchClass, PianoKeyboardMarkerTone>>
  >((tones, note) => {
    tones[note.pitchClass] = note.isRoot ? 'root' : chordToneRoleByImportance[note.importance];
    return tones;
  }, {});
  if (displayMode === 'notation') {
    return (
      <View
        accessibilityLabel={`Sheet notes: ${display.notes.map((note) => note.text).join(', ')}`}
        style={styles.compactSheetFrame}
      >
        <ChordSheet
          dom={{ scrollEnabled: false, style: styles.notationSheet }}
          height={160}
          notes={display.notes}
        />
      </View>
    );
  }

  if (displayMode === 'keyboard') {
    return (
      <View style={styles.previewKeyboardFrame}>
        <PianoKeyboard
          accessibilityLabel={`Piano keyboard highlighting ${noteNames}`}
          keys={selectedKeys}
          markerAppearances={chordToneMarkerAppearances}
          markerLabels={markerLabels}
          markerTones={markerTones}
          liveKeys={liveKeys}
          root={rootNote.pitchClass}
          showMarkers={showKeyHighlightDots}
        />
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <View style={styles.keyboardFrame}>
        <PianoKeyboard
          accessibilityLabel={`Piano keyboard highlighting ${noteNames}`}
          keys={selectedKeys}
          markerAppearances={chordToneMarkerAppearances}
          markerLabels={markerLabels}
          markerTones={markerTones}
          liveKeys={liveKeys}
          root={rootNote.pitchClass}
          showMarkers={showKeyHighlightDots}
        />
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <View
        accessibilityLabel={
          showSheetNotation
            ? `Sheet notes: ${display.notes.map((note) => note.text).join(', ')}`
            : undefined
        }
        style={styles.sheetFrame}
      >
        <ChordSheet
          dom={{
            scrollEnabled: false,
            style: styles.sheet,
          }}
          notes={display.notes}
        />
        {!showSheetNotation ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            style={styles.sheetCover}
          />
        ) : null}
      </View>
      <ChordToneLegend />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  errorText: {
    color: museBuddyColors.pine,
    fontFamily: museBuddyTypography.rounded,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  keyboardFrame: {
    alignSelf: 'center',
    transform: [{ translateX: 8 }],
    width: '100%',
  },
  previewKeyboardFrame: {
    alignSelf: 'center',
    maxWidth: 268,
    width: '84%',
  },
  sheet: {
    backgroundColor: museBuddyColors.mist,
    height: 120,
    width: '100%',
  },
  compactSheetFrame: {
    backgroundColor: museBuddyColors.paper,
    height: 160,
    overflow: 'hidden',
    width: '100%',
  },
  notationSheet: { backgroundColor: museBuddyColors.paper, height: 160, width: '100%' },
  sheetFrame: {
    backgroundColor: museBuddyColors.mist,
    height: 120,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  sheetCover: {
    backgroundColor: museBuddyColors.mist,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
