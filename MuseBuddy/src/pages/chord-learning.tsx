import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ChordLearning, ChordSessionSummary } from '@/components/chord-learning';
import {
  PerformanceGuidanceButton,
  PerformanceGuidanceProvider,
} from '@/components/performance-guidance';
import { useTrainingSession } from '@/contexts/training-session-context';
import {
  buildChordPreviewSoundFontPlaybackConfiguration,
  buildChordSummarySoundFontPlaybackConfiguration,
  type ChordDisplay,
} from '@/music-theory';
import { Carousel } from '@/ui';

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
  const { learningConfig, session } = useTrainingSession();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
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
  const currentSlide = slides[Math.min(currentSlideIndex, Math.max(slides.length - 1, 0))];

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

  const playbackConfiguration = useMemo(() => {
    if (!currentSlide) {
      return null;
    }

    if (currentSlide.type === 'summary') {
      return buildChordSummarySoundFontPlaybackConfiguration(
        currentSlide.displays,
        learningConfig.bpm,
      );
    }

    return buildChordPreviewSoundFontPlaybackConfiguration(
      currentSlide.display,
      learningConfig.bpm,
    );
  }, [currentSlide, learningConfig.bpm]);
  const finishText =
    currentSlide?.type === 'chord'
      ? `${currentSlide.display.friendlyName} is easy!`
      : 'These chords are easy!';

  const content = (
    <TrainingScreenShell
      currentStep="chord"
      footer={
        session ? (
          <View style={styles.footer}>
            <PerformanceGuidanceButton />
          </View>
        ) : null
      }
    >
      {session ? (
        <Carousel
          accessibilityLabel="Chords"
          getItemAccessibilityLabel={getSlideAccessibilityLabel}
          items={slides}
          key={session.chordDisplays.map((display) => display.idName).join('|')}
          keyExtractor={getSlideKey}
          onCurrentIndexChange={setCurrentSlideIndex}
          renderItem={renderSlide}
          selectedIndex={currentSlideIndex}
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

  if (!session || !currentSlide) {
    return content;
  }

  return (
    <PerformanceGuidanceProvider
      finishText={finishText}
      key={`${getSlideKey(currentSlide)}-${learningConfig.bpm}`}
      onFinish={() => {
        if (currentSlide.type === 'summary') {
          router.push('/rhythm-training');
          return;
        }

        setCurrentSlideIndex((index) => Math.min(index + 1, slides.length - 1));
      }}
      onSkip={() => {
        router.push('/rhythm-training');
      }}
      playback={{
        configuration: playbackConfiguration,
        kind: 'band',
      }}
    >
      {content}
    </PerformanceGuidanceProvider>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 14,
  },
});
