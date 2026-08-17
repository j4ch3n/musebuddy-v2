import Lucide from '@react-native-vector-icons/lucide';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  museBuddyBorders,
  museBuddyColors,
  museBuddyRadii,
  museBuddyTypography,
} from '@/constants/design-tokens';
import { Button } from '@/ui';

import { formatMilliseconds, groupDetectionNotesByMidi, type MidiNoteGroup } from './event-log';
import { useTranscription } from './use-transcription';

function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function TranscriptionScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<MidiNoteGroup>>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const {
    downloadRecording,
    elapsedMs,
    end,
    hasRecording,
    loadModel,
    notes,
    phase,
    result,
    start,
    statusMessage,
  } = useTranscription();
  const noteGroups = useMemo(() => groupDetectionNotesByMidi(notes), [notes]);
  const isBusy = ['loadingModel', 'starting', 'predicting'].includes(phase);
  const startEnabled = ['ready', 'permissionDenied', 'failure'].includes(phase);
  const endEnabled = phase === 'recording' && elapsedMs >= 2_000;
  const downloadEnabled = hasRecording && !isBusy && phase !== 'recording';

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        ref={listRef}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        data={noteGroups}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyLog}>
            <Text selectable style={styles.emptyText}>
              Press Start and play the piano. Detected MIDI pitches will appear as Basic Pitch
              finishes each detection.
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Button
              label="Back"
              onPress={() => {
                router.back();
              }}
              primary={false}
            />

            <View style={styles.header}>
              <Text style={styles.eyebrow}>BASIC PITCH DEBUG</Text>
              <Text style={styles.title}>Rolling transcription</Text>
              <Text style={styles.subtitle}>
                Native iOS recording runs Basic Pitch on the recording so far every second, then
                sends the full recording again on Stop.
              </Text>
            </View>

            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                {isBusy && <ActivityIndicator color={museBuddyColors.sky} />}
                <Text selectable style={styles.statusText}>
                  {statusText(phase)}
                </Text>
              </View>

              <Text selectable style={styles.timer}>
                {formatElapsed(elapsedMs)}
              </Text>

              {result !== null && (
                <Text selectable style={styles.processingText}>
                  Latest processing {Math.round(result.processingDurationMs)} ms
                </Text>
              )}

              {phase === 'recording' && elapsedMs < 2_000 && (
                <Text style={styles.minimumText}>
                  Stop unlocks in {Math.ceil((2_000 - elapsedMs) / 1_000)}s
                </Text>
              )}

              {result !== null && (
                <Text selectable style={styles.summaryText}>
                  {notes.length} notes · {result.type} · window {Math.round(result.windowStartMs)}-
                  {Math.round(result.windowEndMs)} ms
                </Text>
              )}

              {statusMessage !== '' && (
                <Text selectable style={styles.errorText}>
                  {statusMessage}
                </Text>
              )}
            </View>

            <View style={styles.controls}>
              <Button disabled={!startEnabled} label="Start" onPress={start} tone="success" />
              <Button disabled={!endEnabled} label="Stop" onPress={end} tone="danger" />
              <Button
                disabled={!downloadEnabled}
                label="Download recording"
                onPress={() => {
                  void downloadRecording();
                }}
                primary={false}
              />
              {phase === 'modelError' && <Button label="Retry model loading" onPress={loadModel} />}
            </View>

            <Text style={styles.logHeading}>
              Detected pitches · {noteGroups.length} · {notes.length} events
            </Text>
          </View>
        }
        onContentSizeChange={() => {
          if (noteGroups.length > 0) {
            listRef.current?.scrollToEnd({ animated: true });
          }
        }}
        renderItem={({ item }) => (
          <MidiGroupRow
            expanded={expandedGroups[item.id] ?? false}
            group={item}
            onToggle={() => {
              setExpandedGroups((current) => ({
                ...current,
                [item.id]: !(current[item.id] ?? false),
              }));
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}

type MidiGroupRowProps = {
  expanded: boolean;
  group: MidiNoteGroup;
  onToggle: () => void;
};

function MidiGroupRow({ expanded, group, onToggle }: MidiGroupRowProps) {
  return (
    <View style={styles.pitchCard}>
      <Pressable
        accessibilityLabel={`MIDI ${group.midiPitch}, ${group.count} events`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.pitchHeader, pressed && styles.pitchHeaderPressed]}
      >
        <View style={styles.pitchIdentity}>
          <View style={styles.pitchBadge}>
            <Text selectable style={styles.pitchBadgeText}>
              {group.midiPitch}
            </Text>
          </View>
          <View style={styles.pitchSummary}>
            <Text selectable style={styles.pitchTitle}>
              MIDI {group.midiPitch}
            </Text>
            <Text selectable style={styles.pitchMeta}>
              {group.count} {group.count === 1 ? 'event' : 'events'} ·{' '}
              {formatMilliseconds(group.firstAttackMs)}-{formatMilliseconds(group.lastReleaseMs)}
            </Text>
          </View>
        </View>

        <View style={styles.pitchStats}>
          <Text selectable style={styles.pitchStatText}>
            avg {Math.round(group.averageConfidence * 100)}%
          </Text>
          <Text selectable style={styles.pitchStatText}>
            vel {group.peakVelocity}
          </Text>
          <Lucide
            color={museBuddyColors.pine}
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.eventList}>
          {group.events.map((event) => (
            <View
              key={`${event.id}-${event.startTimeMs}-${event.endTimeMs}`}
              style={styles.eventRow}
            >
              <Text selectable style={styles.eventTime}>
                {formatMilliseconds(event.startTimeMs)}-{formatMilliseconds(event.endTimeMs)}
              </Text>
              <Text selectable style={styles.eventDetail}>
                attack {Math.round(event.startTimeMs)} ms · release {Math.round(event.endTimeMs)} ms
              </Text>
              <Text selectable style={styles.eventDetail}>
                confidence {Math.round(event.confidence * 100)}% · velocity {event.velocity}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function statusText(phase: ReturnType<typeof useTranscription>['phase']): string {
  switch (phase) {
    case 'loadingModel':
      return 'Loading model…';
    case 'modelError':
      return 'Model unavailable';
    case 'ready':
      return 'Ready';
    case 'permissionDenied':
      return 'Microphone access denied';
    case 'starting':
      return 'Starting recording…';
    case 'recording':
      return 'Recording';
    case 'predicting':
      return 'Predicting notes…';
    case 'failure':
      return 'Could not complete transcription';
  }
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: museBuddyColors.mist,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 10,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerContent: {
    gap: 18,
    paddingBottom: 8,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    color: museBuddyColors.wildflower,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  title: {
    color: museBuddyColors.pine,
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
  },
  subtitle: {
    color: museBuddyColors.pine,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.large,
    borderWidth: museBuddyBorders.bold,
    boxShadow: `0 6px 0 ${museBuddyColors.frame}`,
    gap: 14,
    padding: 18,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  statusText: {
    color: museBuddyColors.pine,
    fontSize: 19,
    fontWeight: '900',
  },
  timer: {
    color: museBuddyColors.pine,
    fontSize: 46,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  minimumText: {
    color: museBuddyColors.wildflower,
    fontSize: 14,
    fontWeight: '900',
  },
  processingText: {
    color: museBuddyColors.sky,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  summaryText: {
    color: museBuddyColors.pine,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  controls: {
    gap: 12,
  },
  errorText: {
    color: museBuddyColors.pine,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center',
  },
  logHeading: {
    color: museBuddyColors.pine,
    fontSize: 20,
    fontWeight: '900',
    paddingTop: 4,
  },
  emptyLog: {
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.medium,
    borderWidth: museBuddyBorders.bold,
    padding: 18,
  },
  emptyText: {
    color: museBuddyColors.pine,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  pitchCard: {
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderLeftColor: museBuddyColors.sky,
    borderLeftWidth: 8,
    borderRadius: museBuddyRadii.medium,
    borderWidth: 3,
    boxShadow: `0 4px 0 ${museBuddyColors.frame}`,
    overflow: 'hidden',
  },
  pitchHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 74,
    padding: 12,
  },
  pitchHeaderPressed: {
    backgroundColor: museBuddyColors.mist,
  },
  pitchIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    minWidth: 0,
  },
  pitchBadge: {
    alignItems: 'center',
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.small,
    borderWidth: 3,
    height: 46,
    justifyContent: 'center',
    width: 56,
  },
  pitchBadgeText: {
    color: museBuddyColors.pine,
    fontSize: 20,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  pitchSummary: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  pitchTitle: {
    color: museBuddyColors.pine,
    fontSize: 18,
    fontWeight: '900',
  },
  pitchMeta: {
    color: museBuddyColors.pine,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    lineHeight: 17,
  },
  pitchStats: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: 8,
  },
  pitchStatText: {
    color: museBuddyColors.pine,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  eventList: {
    backgroundColor: museBuddyColors.mist,
    borderTopColor: museBuddyColors.frame,
    borderTopWidth: 3,
    gap: 8,
    padding: 12,
  },
  eventRow: {
    backgroundColor: museBuddyColors.mist,
    borderColor: museBuddyColors.frame,
    borderRadius: museBuddyRadii.small,
    borderWidth: 2,
    gap: 3,
    padding: 10,
  },
  eventTime: {
    color: museBuddyColors.pine,
    fontFamily: museBuddyTypography.mono,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    lineHeight: 18,
  },
  eventDetail: {
    color: museBuddyColors.pine,
    fontFamily: museBuddyTypography.mono,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    lineHeight: 17,
  },
});
