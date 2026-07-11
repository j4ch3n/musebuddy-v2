import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';

import { ChordLearning, ChordSessionSummary } from '@/components/chord-learning';
import { useTrainingSession } from '@/contexts/training-session-context';
import type { ChordDisplay } from '@/music-theory';
import { Button, Carousel } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

type ChordLearningSlide =
  | {
      chordIndex: number;
      display: ChordDisplay;
      type: 'chord';
    }
  | {
      displays: readonly ChordDisplay[];
      type: 'summary';
    };

export function ChordLearningPage() {
  const router = useRouter();
  const { session } = useTrainingSession();
  const [flippedChordIds, setFlippedChordIds] = useState<ReadonlySet<string>>(() => new Set());
  const slides = useMemo<readonly ChordLearningSlide[]>(() => {
    if (!session) {
      return [];
    }

    return [
      ...session.chordDisplays.map((display, chordIndex) => ({
        chordIndex,
        display,
        type: 'chord' as const,
      })),
      {
        displays: session.chordDisplays,
        type: 'summary' as const,
      },
    ];
  }, [session]);

  const getChordKey = useCallback(
    (display: ChordDisplay, index: number) => `${display.idName}-${index}`,
    [],
  );

  const getSlideKey = useCallback(
    (slide: ChordLearningSlide) => {
      if (slide.type === 'summary') {
        return 'chord-session-summary';
      }

      return getChordKey(slide.display, slide.chordIndex);
    },
    [getChordKey],
  );

  const getSlideAccessibilityLabel = useCallback((slide: ChordLearningSlide) => {
    if (slide.type === 'summary') {
      return 'All chords';
    }

    return slide.display.friendlyName;
  }, []);

  const renderSlide = useCallback(
    (slide: ChordLearningSlide) => {
      if (slide.type === 'summary') {
        return <ChordSessionSummary displays={slide.displays} />;
      }

      const chordKey = getChordKey(slide.display, slide.chordIndex);

      return (
        <ChordLearning
          display={slide.display}
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
          getItemAccessibilityLabel={getSlideAccessibilityLabel}
          items={slides}
          key={session.chordDisplays.map((display) => display.idName).join('|')}
          keyExtractor={getSlideKey}
          renderItem={renderSlide}
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
