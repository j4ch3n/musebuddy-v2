import { useCallback, useMemo, useState } from 'react';

import { ChordLearning } from '@/components/chord-learning';
import {
  PerformanceGuidanceButton,
  PerformanceGuidanceProvider,
  usePerformanceGuidance,
} from '@/components/performance-guidance';
import { getTrainingSectionScreenIds } from '@/contexts/training-session-flow';
import { useTrainingSession } from '@/contexts/training-session-context';
import { useTrainingSessionTransition } from '@/hooks/use-training-session-transition';
import { buildChordPreviewSoundFontPlaybackConfiguration, type ChordDisplay } from '@/music-theory';
import { Carousel, type CarouselProps } from '@/ui';

import { PlaceholderPanel } from './placeholder-panel';
import { TrainingScreenShell } from './training-screen-shell';

type ChordLearningSlide = {
  chordIndex: number;
  display: ChordDisplay;
};

export function ChordLearningPage() {
  const { learningConfig, session, training } = useTrainingSession();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slides = useMemo<readonly ChordLearningSlide[]>(() => {
    if (!session) {
      return [];
    }

    return session.chordDisplays.map((display, chordIndex) => ({ chordIndex, display }));
  }, [session]);
  const screenIds = useMemo(
    () => (session ? getTrainingSectionScreenIds({ sectionId: 'chords', session }) : []),
    [session],
  );
  const currentSlide = slides[Math.min(currentSlideIndex, Math.max(slides.length - 1, 0))];
  const currentScreenId = screenIds[currentSlideIndex] ?? 'chord:0';

  const handleScreenChange = useCallback(
    (nextScreenId: string) => {
      const nextScreenIndex = screenIds.indexOf(nextScreenId);
      if (nextScreenIndex !== -1) {
        setCurrentSlideIndex(nextScreenIndex);
      }
    },
    [screenIds],
  );
  const { advance, skipSection } = useTrainingSessionTransition({
    onScreenChange: handleScreenChange,
    screenId: currentScreenId,
    sectionId: 'chords',
  });

  const getChordKey = useCallback(
    (display: ChordDisplay, index: number) => `${display.idName}-${index}`,
    [],
  );

  const getSlideKey = useCallback(
    (slide: ChordLearningSlide) => getChordKey(slide.display, slide.chordIndex),
    [getChordKey],
  );

  const getSlideAccessibilityLabel = useCallback(
    (slide: ChordLearningSlide) => slide.display.friendlyName,
    [],
  );

  const renderSlide = useCallback(
    (slide: ChordLearningSlide, index: number) => (
      <ChordLearning display={slide.display} isActive={index === currentSlideIndex} />
    ),
    [currentSlideIndex],
  );

  const playbackConfiguration = useMemo(() => {
    if (!currentSlide) {
      return null;
    }

    return buildChordPreviewSoundFontPlaybackConfiguration(
      currentSlide.display,
      learningConfig.bpm,
    );
  }, [currentSlide, learningConfig.bpm]);
  const finishText = currentSlide ? `${currentSlide.display.friendlyName} is easy!` : '';

  const content = (
    <TrainingScreenShell
      currentStep="chord"
      footer={session ? <PerformanceGuidanceButton /> : null}
    >
      {session ? (
        <GuidedChordCarousel
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
          accent="wildflower"
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
      demoListenCycleCount={3}
      finishText={finishText}
      key={currentScreenId}
      onFinish={advance}
      onSkip={skipSection}
      playback={{
        configuration: playbackConfiguration,
        kind: 'piano',
      }}
      listeningMode={{ kind: 'basic-pitch' }}
      startPhase={training ? 'prepare' : 'pending'}
    >
      {content}
    </PerformanceGuidanceProvider>
  );
}

function GuidedChordCarousel(props: CarouselProps<ChordLearningSlide>) {
  const { phase } = usePerformanceGuidance();

  return <Carousel {...props} swipeEnabled={phase === 'pending'} />;
}
