# Sound Font Player

`MuseBuddy/modules/sound-font-player/` is a local iOS-only Expo module. It provides two
intention-level playback APIs while keeping instrument selection private to Swift.

## Public TypeScript API

```ts
type SoundFontPlaybackConfiguration = {
  bpm: number;
  parts: SoundFontPlaybackStep[][];
};

type SoundFontPlaybackOptions = {
  leadIn?: boolean;
  repetitions?: number;
};

type SoundFontPlaybackStartResult = {
  playbackId: number;
  startedAtMs: number;
};

playPiano(configuration, options?): Promise<SoundFontPlaybackStartResult>;
playGroove(configuration, options?): Promise<SoundFontPlaybackStartResult>;
stop(playbackId: number): Promise<void>;
addPlaybackFinishListener(listener): EventSubscription;
```

The module is iOS-only. The wrapper maps native errors to `SoundFontPlayerError` and throws
`ERR_UNSUPPORTED_PLATFORM` elsewhere.

There are no public instrument IDs. `playPiano` selects `piano-white-grand.sf2` and
`playGroove` selects `jazz-percussion.sf2` through private Swift roles. When `leadIn` is
true, a separate private sampler also loads `jazz-percussion.sf2` for four audible beats.

Removed APIs must not be reintroduced: `playBand`, SoundFont preparation, `resume`, restart
methods, `isPlaying`, repeat mode, and playback-bar events.

## Playback Data

Each part contains exactly 16 steps at `0.25` beats per step. A step contains one or more
lanes:

- `midi: null`, `velocity: null`: rest;
- `midi: -50`, `velocity: null`: hold;
- `midi: 1...127`, `velocity: 0...127`: note.

Each lane is decoded independently. A positive MIDI value starts a note. Holds extend it.
A rest or new note closes it. Playback length is the flattened part length. Empty/all-rest
content, malformed parts, invalid MIDI data, and invalid BPM are rejected.

## Fresh Graph Lifecycle

Every play request performs all of these steps on the service work queue:

1. Dispose any previous graph and deactivate its audio session.
2. Create a new `AVAudioEngine` and `AVAudioSequencer`.
3. Attach and load only the requested primary sampler and optional lead-in sampler.
4. Activate the playback audio session, prepare/start the engine, and confirm output is
   rendering.
5. Schedule the optional four-beat lead-in once and the requested finite repetitions.
6. Start sequencing and return `{ playbackId, startedAtMs }`.

The first user note starts at beat `4` with a lead-in and beat `0` otherwise. `startedAtMs`
is an absolute native wall-clock millisecond timestamp for the sequencing start.

Natural finish fully disposes the sequencer, samplers, engine, and audio session before
emitting:

```ts
{ playbackId: number }
```

`stop(playbackId)` performs the same disposal only when the ID matches the active request.
A stale stop resolves without affecting newer playback.

## Errors And Rebuilds

Stable errors cover empty/invalid configuration, SoundFont resource/load failures, engine
startup failure, and unsupported platforms. AVFoundation work must stay off the main
thread.

Swift, bundled SoundFont, podspec, module configuration, or app native configuration
changes require the developer to regenerate and build the iOS development client from
`MuseBuddy/` with `pnpm build`.
