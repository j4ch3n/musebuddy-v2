import type { Href } from 'expo-router';

import type { PreparedTrainingSession } from '@/music-theory';

export type TrainingSectionId = 'goal' | 'chords' | 'rhythm-treble' | 'rhythm-bass' | 'improvise';

export type TrainingScreenId = string;

export type TrainingSessionFlowSection<SectionId extends string = string> = {
  getScreenIds: (session: PreparedTrainingSession) => readonly TrainingScreenId[];
  id: SectionId;
  href: Href;
};

export type TrainingSessionFlow<SectionId extends string = string> = {
  finalHref: Href;
  sections: readonly TrainingSessionFlowSection<SectionId>[];
};

export type TrainingSessionTransition =
  | { kind: 'screen'; screenId: TrainingScreenId }
  | { href: Href; kind: 'section' };

export function createTrainingSessionFlow<SectionId extends string>({
  finalHref,
  sections,
}: TrainingSessionFlow<SectionId>): TrainingSessionFlow<SectionId> {
  if (sections.length === 0) {
    throw new Error('A training session flow must contain at least one section.');
  }

  return { finalHref, sections };
}

export const trainingSessionFlow = createTrainingSessionFlow<TrainingSectionId>({
  finalHref: '/congrats',
  sections: [
    {
      getScreenIds: () => ['goal'],
      href: '/session-goal',
      id: 'goal',
    },
    {
      getScreenIds: (session) => session.chordDisplays.map((_, index) => `chord:${index}`),
      href: '/chord-learning',
      id: 'chords',
    },
    {
      getScreenIds: () => ['rhythm-treble'],
      href: '/rhythm-training-treble',
      id: 'rhythm-treble',
    },
    {
      getScreenIds: () => ['rhythm-bass'],
      href: '/rhythm-training-bass',
      id: 'rhythm-bass',
    },
    {
      getScreenIds: () => ['improvise'],
      href: '/improvise',
      id: 'improvise',
    },
  ],
});

export function getTrainingSectionScreenIds({
  flow = trainingSessionFlow,
  sectionId,
  session,
}: {
  flow?: TrainingSessionFlow;
  sectionId: string;
  session: PreparedTrainingSession;
}): readonly TrainingScreenId[] {
  return getSection(flow, sectionId).getScreenIds(session);
}

export function getNextTrainingSessionTransition({
  flow = trainingSessionFlow,
  screenId,
  sectionId,
  session,
}: {
  flow?: TrainingSessionFlow;
  screenId: TrainingScreenId;
  sectionId: string;
  session: PreparedTrainingSession;
}): TrainingSessionTransition {
  const sectionIndex = getSectionIndex(flow, sectionId);
  const screenIds = flow.sections[sectionIndex]!.getScreenIds(session);
  const screenIndex = screenIds.indexOf(screenId);

  if (screenIndex === -1) {
    throw new Error(`Screen \"${screenId}\" is not registered for section \"${sectionId}\".`);
  }

  const nextScreenId = screenIds[screenIndex + 1];
  if (nextScreenId) {
    return { kind: 'screen', screenId: nextScreenId };
  }

  return getNextSectionTransition(flow, sectionIndex);
}

export function getSkipTrainingSectionTransition({
  flow = trainingSessionFlow,
  sectionId,
}: {
  flow?: TrainingSessionFlow;
  sectionId: string;
}): TrainingSessionTransition {
  return getNextSectionTransition(flow, getSectionIndex(flow, sectionId));
}

function getNextSectionTransition(
  flow: TrainingSessionFlow,
  sectionIndex: number,
): TrainingSessionTransition {
  const nextSection = flow.sections[sectionIndex + 1];
  return nextSection
    ? { href: nextSection.href, kind: 'section' }
    : { href: flow.finalHref, kind: 'section' };
}

function getSection(flow: TrainingSessionFlow, sectionId: string): TrainingSessionFlowSection {
  return flow.sections[getSectionIndex(flow, sectionId)]!;
}

function getSectionIndex(flow: TrainingSessionFlow, sectionId: string): number {
  const index = flow.sections.findIndex((section) => section.id === sectionId);
  if (index === -1) {
    throw new Error(`Training section \"${sectionId}\" is not registered.`);
  }

  return index;
}
