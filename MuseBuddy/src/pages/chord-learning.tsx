import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';

import { ChordLearning } from '@/components/chord-learning';
import { useTrainingSession } from '@/contexts/training-session-context';
import type { ChordDisplay } from '@/music-theory';
import { Button, Carousel } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

export function ChordLearningPage() {
  const router = useRouter();
  const { session } = useTrainingSession();
  const [flippedChordIds, setFlippedChordIds] = useState<ReadonlySet<string>>(() => new Set());

  const getChordKey = useCallback(
    (display: ChordDisplay, index: number) => `${display.idName}-${index}`,
    [],
  );

  const renderChord = useCallback(
    (display: ChordDisplay, index: number) => {
      const chordKey = getChordKey(display, index);

      return (
        <ChordLearning
          display={display}
          isKeyboardCardFlipped={flippedChordIds.has(chordKey)}
          onKeyboardCardFlipChange={(isFlipped) => {
            setFlippedChordIds((current) => {
              const next = new Set(current);

              if (isFlipped) {
                next.add(chordKey);
              } else {
                next.delete(chordKey);
              }

              return next;
            });
          }}
        />
      );
    },
    [flippedChordIds, getChordKey],
  );

  return (
    <TrainingScreenShell
      currentStep="chord"
      footer={
        <Button
          label="Continue"
          onPress={() => {
            router.push('/rhythm-training');
          }}
        />
      }
    >
      {session ? (
        <Carousel
          accessibilityLabel="Chords"
          getItemAccessibilityLabel={(display) => display.friendlyName}
          items={session.chordDisplays}
          key={session.chordDisplays.map((display) => display.idName).join('|')}
          keyExtractor={getChordKey}
          renderItem={renderChord}
        />
      ) : (
        <PlaceholderPanel
          accent="blue"
          body="Training material is not loaded yet."
          title="Prepare session"
        />
      )}
    </TrainingScreenShell>
  );
}
