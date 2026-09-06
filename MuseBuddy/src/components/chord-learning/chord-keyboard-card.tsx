import { StyleSheet, Text, View } from 'react-native';

import { museBuddyColors, museBuddyTypography } from '@/constants/design-tokens';
import type { ChordDisplay, ChordDisplayNote } from '@/music-theory';
import { PianoKeyboard, type PianoKeyboardLiveKeyState, type PianoKeyboardMarkerTone } from '@/ui';
import type { PianoPitchClass } from '@schema/music-theory-schema';

import ChordSheet from './chord-sheet.dom';
import { chordToneMarkerAppearances } from './chord-color-role';
import { ChordToneLegend } from './chord-role-legend';

const PREVIEW_KEYBOARD_SIDE_BLEED = -13;
const PREVIEW_KEYBOARD_RIGHT_SHIFT = 10;
const PREVIEW_KEYBOARD_WIDTH = 320;

type ChordKeyboardCardProps = {
  display: ChordDisplay;
  displayMode?: 'full' | 'keyboard' | 'notation';
  emphasizedKeys?: readonly PianoPitchClass[];
  errorMessage?: string;
  fitKeyboardToContainer?: boolean;
  liveKeys?: Partial<Record<PianoPitchClass, PianoKeyboardLiveKeyState>>;
  showKeyHighlightDots?: boolean;
  showKeyHighlightLabels?: boolean;
  showSheetNotation?: boolean;
  visibleNotes?: readonly ChordDisplayNote[];
};

export function ChordKeyboardCard({
  display,
  displayMode = 'full',
  emphasizedKeys,
  errorMessage,
  fitKeyboardToContainer = false,
  liveKeys,
  showKeyHighlightDots = true,
  showKeyHighlightLabels = true,
  showSheetNotation = true,
  visibleNotes,
}: ChordKeyboardCardProps) {
  const notes = visibleNotes ?? display.notes;
  const rootNote =
    notes.find((note) => note.isRoot) ??
    (visibleNotes === undefined ? display.notes.find((note) => note.isRoot) : undefined);
  const selectedKeys = notes.filter((note) => !note.isRoot).map((note) => note.pitchClass);
  const noteNames = notes.map((note) => note.text).join(' - ');
  const markerLabels = showKeyHighlightLabels
    ? notes.reduce<Partial<Record<PianoPitchClass, string>>>((labels, note) => {
        labels[note.pitchClass] = note.text;
        return labels;
      }, {})
    : {};
  const markerTones = display.notes.reduce<
    Partial<Record<PianoPitchClass, PianoKeyboardMarkerTone>>
  >((tones, note) => {
    tones[note.pitchClass] = note.isRoot ? 'anchor' : (note.teachingRole ?? 'voicing');
    return tones;
  }, {});
  if (displayMode === 'notation') {
    return (
      <View
        accessibilityLabel={`Sheet notes: ${notes.map((note) => note.text).join(', ')}`}
        style={styles.compactSheetFrame}
      >
        <ChordSheet
          dom={{ scrollEnabled: false, style: styles.notationSheet }}
          height={160}
          notes={notes}
        />
      </View>
    );
  }

  if (displayMode === 'keyboard') {
    return (
      <View
        style={[
          styles.previewKeyboardFrame,
          fitKeyboardToContainer
            ? styles.containedPreviewKeyboardFrame
            : styles.fixedPreviewKeyboardFrame,
        ]}
      >
        <PianoKeyboard
          accessibilityLabel={`Piano keyboard highlighting ${noteNames}`}
          emphasizedKeys={emphasizedKeys}
          keys={selectedKeys}
          markerAppearances={chordToneMarkerAppearances}
          markerLabels={markerLabels}
          markerTones={markerTones}
          liveKeys={liveKeys}
          root={rootNote?.pitchClass}
          showMarkers={showKeyHighlightDots}
          width={fitKeyboardToContainer ? undefined : PREVIEW_KEYBOARD_WIDTH}
        />
      </View>
    );
  }

  return (
    <View style={styles.content}>
      <View style={styles.keyboardFrame}>
        <PianoKeyboard
          accessibilityLabel={`Piano keyboard highlighting ${noteNames}`}
          emphasizedKeys={emphasizedKeys}
          keys={selectedKeys}
          markerAppearances={chordToneMarkerAppearances}
          markerLabels={markerLabels}
          markerTones={markerTones}
          liveKeys={liveKeys}
          root={rootNote?.pitchClass}
          showMarkers={showKeyHighlightDots}
        />
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      <View
        accessibilityLabel={
          showSheetNotation
            ? `Sheet notes: ${notes.map((note) => note.text).join(', ')}`
            : undefined
        }
        style={styles.sheetFrame}
      >
        <ChordSheet
          dom={{
            scrollEnabled: false,
            style: styles.sheet,
          }}
          notes={notes}
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
    justifyContent: 'flex-start',
  },
  containedPreviewKeyboardFrame: {
    alignSelf: 'stretch',
    marginHorizontal: 0,
    transform: [],
    width: '100%',
  },
  fixedPreviewKeyboardFrame: {
    height: 180,
    // With the card's 18 pt inset and the SVG's internal key bounds, this balances visible sides.
    marginHorizontal: PREVIEW_KEYBOARD_SIDE_BLEED,
    transform: [{ translateX: PREVIEW_KEYBOARD_RIGHT_SHIFT }],
    width: PREVIEW_KEYBOARD_WIDTH,
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
