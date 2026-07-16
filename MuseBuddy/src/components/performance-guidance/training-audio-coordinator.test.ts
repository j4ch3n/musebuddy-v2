import { describe, expect, it, vi } from 'vitest';

import type { SoundFontPlaybackConfiguration } from '@modules/sound-font-player';
import { TrainingAudioCoordinator } from './training-audio-coordinator';

vi.mock('@modules/basic-pitch', () => ({
  cancelRecognition: vi.fn(),
  startRecognition: vi.fn(),
}));
vi.mock('@modules/sound-font-player', () => ({
  playGroove: vi.fn(),
  playPiano: vi.fn(),
  stop: vi.fn(),
}));

const configuration: SoundFontPlaybackConfiguration = {
  bpm: 100,
  parts: [Array.from({ length: 16 }, () => [{ midi: 60, velocity: 90 }])],
};

function createApi() {
  return {
    cancelRecognition: vi.fn(() => Promise.resolve()),
    playGroove: vi.fn(() => Promise.resolve({ playbackId: 2, startedAtMs: 200 })),
    playPiano: vi.fn(() => Promise.resolve({ playbackId: 1, startedAtMs: 100 })),
    startRecognition: vi.fn(() => Promise.resolve({ recognitionId: 3 })),
    stop: vi.fn(() => Promise.resolve()),
  };
}

describe('TrainingAudioCoordinator', () => {
  it('forwards the session-goal lead-in and two-repetition policy exactly', async () => {
    const api = createApi();
    const coordinator = new TrainingAudioCoordinator(api);

    await coordinator.play(1, 'piano', configuration, {
      leadIn: true,
      repetitions: 2,
    });

    expect(api.playPiano).toHaveBeenCalledWith(configuration, {
      leadIn: true,
      repetitions: 2,
    });
    expect(api.startRecognition).not.toHaveBeenCalled();
  });

  it('serializes playback-to-recognition ownership without overlap', async () => {
    const api = createApi();
    const coordinator = new TrainingAudioCoordinator(api);

    await expect(
      coordinator.play(1, 'piano', configuration, { leadIn: true, repetitions: 1 }),
    ).resolves.toEqual({ playbackId: 1, startedAtMs: 100 });
    await coordinator.startRecognition(1, {
      detectionIntervalMs: 200,
      rollingWindowMs: 2_000,
    });

    expect(api.stop).toHaveBeenCalledWith(1);
    expect(api.startRecognition).toHaveBeenCalledAfter(api.stop);
    expect(coordinator.getActiveAudio()).toEqual({
      kind: 'recognition',
      ownerId: 1,
      recognitionId: 3,
    });
  });

  it('does not let old-owner cleanup stop newer audio', async () => {
    const api = createApi();
    const coordinator = new TrainingAudioCoordinator(api);

    await coordinator.play(1, 'piano', configuration, {});
    await coordinator.play(2, 'groove', configuration, {});
    await coordinator.release(1);

    expect(api.stop).toHaveBeenCalledTimes(1);
    expect(coordinator.getActiveAudio()).toEqual({
      kind: 'playback',
      ownerId: 2,
      playbackId: 2,
    });
  });

  it('only releases the exact recognition id', async () => {
    const api = createApi();
    const coordinator = new TrainingAudioCoordinator(api);
    await coordinator.startRecognition(1, {});

    await coordinator.releaseRecognition(1, 999);
    expect(api.cancelRecognition).not.toHaveBeenCalled();
    await coordinator.releaseRecognition(1, 3);
    await coordinator.releaseRecognition(1, 3);
    expect(api.cancelRecognition).toHaveBeenCalledWith(3);
    expect(api.cancelRecognition).toHaveBeenCalledOnce();
  });
});
