import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  ChordLearning,
  ChordLearningPlayButton,
  ChordSessionSummary,
} from '@/components/chord-learning';
import { useTrainingSession } from '@/contexts/training-session-context';
import {
  buildChordPreviewSoundFontPlaybackConfiguration,
  buildChordSummarySoundFontPlaybackConfiguration,
  type ChordDisplay,
} from '@/music-theory';
import { Button, Carousel } from '@/ui';
import { stop as stopSoundFontPlayback } from '@modules/sound-font-player';

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
  const [playbackResetCount, setPlaybackResetCount] = useState(0);
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
  const playbackKey = currentSlide
    ? `${getSlideKey(currentSlide)}-${learningConfig.bpm}-${playbackResetCount}`
    : 'no-chord-slide';
  const playLabel = currentSlide?.type === 'summary' ? 'Play all' : 'Play chord';

  return (
    <TrainingScreenShell
      currentStep="chord"
      footer={
        <View style={styles.footer}>
          <ChordLearningPlayButton
            configuration={playbackConfiguration}
            key={playbackKey}
            playLabel={playLabel}
          />
          <Button
            label="Continue"
            onPress={() => {
              setPlaybackResetCount((count) => count + 1);
              void stopSoundFontPlayback();
              router.push('/rhythm-training');
            }}
          />
        </View>
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

const styles = StyleSheet.create({
  footer: {
    gap: 14,
  },
});
