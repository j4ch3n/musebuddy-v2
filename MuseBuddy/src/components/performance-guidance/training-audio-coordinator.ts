import {
  cancelRecognition,
  startRecognition,
  type RecognitionOptions,
  type RecognitionStartResult,
} from '@modules/basic-pitch';
import {
  playGroove,
  playPiano,
  stop,
  type SoundFontPlaybackConfiguration,
  type SoundFontPlaybackOptions,
  type SoundFontPlaybackStartResult,
} from '@modules/sound-font-player';

export type ActiveAudio =
  | { kind: 'idle' }
  | { kind: 'playback'; ownerId: number; playbackId: number }
  | { kind: 'recognition'; ownerId: number; recognitionId: number };

type TrainingAudioApi = {
  cancelRecognition(recognitionId: number): Promise<void>;
  playGroove(
    configuration: SoundFontPlaybackConfiguration,
    options: SoundFontPlaybackOptions,
  ): Promise<SoundFontPlaybackStartResult>;
  playPiano(
    configuration: SoundFontPlaybackConfiguration,
    options: SoundFontPlaybackOptions,
  ): Promise<SoundFontPlaybackStartResult>;
  startRecognition(options: RecognitionOptions): Promise<RecognitionStartResult>;
  stop(playbackId: number): Promise<void>;
};

export class TrainingAudioCoordinator {
  private active: ActiveAudio = { kind: 'idle' };
  private latestOwnerId = 0;
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly api: TrainingAudioApi) {}

  play(
    ownerId: number,
    kind: 'groove' | 'piano',
    configuration: SoundFontPlaybackConfiguration,
    options: SoundFontPlaybackOptions,
  ): Promise<SoundFontPlaybackStartResult> {
    return this.enqueue(async () => {
      this.assertCurrentOwner(ownerId);
      await this.releaseActive();
      const result =
        kind === 'piano'
          ? await this.api.playPiano(configuration, options)
          : await this.api.playGroove(configuration, options);
      this.active = { kind: 'playback', ownerId, playbackId: result.playbackId };
      return result;
    });
  }

  startRecognition(ownerId: number, options: RecognitionOptions): Promise<RecognitionStartResult> {
    return this.enqueue(async () => {
      this.assertCurrentOwner(ownerId);
      await this.releaseActive();
      const result = await this.api.startRecognition(options);
      this.active = { kind: 'recognition', ownerId, recognitionId: result.recognitionId };
      return result;
    });
  }

  finishPlayback(ownerId: number, playbackId: number): Promise<void> {
    return this.enqueue(async () => {
      if (
        this.active.kind === 'playback' &&
        this.active.ownerId === ownerId &&
        this.active.playbackId === playbackId
      ) {
        this.active = { kind: 'idle' };
      }
    });
  }

  releasePlayback(ownerId: number, playbackId: number): Promise<void> {
    return this.enqueue(async () => {
      if (
        this.active.kind !== 'playback' ||
        this.active.ownerId !== ownerId ||
        this.active.playbackId !== playbackId
      ) {
        return;
      }
      await this.api.stop(playbackId);
      this.active = { kind: 'idle' };
    });
  }

  releaseRecognition(ownerId: number, recognitionId: number): Promise<void> {
    return this.enqueue(async () => {
      if (
        this.active.kind !== 'recognition' ||
        this.active.ownerId !== ownerId ||
        this.active.recognitionId !== recognitionId
      ) {
        return;
      }
      await this.api.cancelRecognition(recognitionId);
      this.active = { kind: 'idle' };
    });
  }

  release(ownerId: number): Promise<void> {
    return this.enqueue(async () => {
      if (this.active.kind === 'idle' || this.active.ownerId !== ownerId) {
        return;
      }
      await this.releaseActive();
    });
  }

  getActiveAudio(): ActiveAudio {
    return this.active;
  }

  private assertCurrentOwner(ownerId: number) {
    if (ownerId < this.latestOwnerId) {
      throw new Error('This training audio owner has been superseded.');
    }
    this.latestOwnerId = ownerId;
  }

  private async releaseActive() {
    if (this.active.kind === 'playback') {
      await this.api.stop(this.active.playbackId);
    } else if (this.active.kind === 'recognition') {
      await this.api.cancelRecognition(this.active.recognitionId);
    }
    this.active = { kind: 'idle' };
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation, operation);
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}

export const trainingAudioCoordinator = new TrainingAudioCoordinator({
  cancelRecognition,
  playGroove,
  playPiano,
  startRecognition,
  stop,
});
