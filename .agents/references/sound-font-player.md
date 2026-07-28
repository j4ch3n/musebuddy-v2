# Sound Font Player

`MuseBuddy/modules/sound-font-player/` is a local iOS-only Expo module. It provides piano and
groove playback while keeping instrument selection private to Swift.

## Public TypeScript API

```ts
type SoundFontPlaybackOptions = {
  leadIn?: boolean;
  repetitions?: number;
  keepAudioSessionActive?: boolean;
};

playPiano(configuration, options?): Promise<{ playbackId: number; startedAtMs: number }>;
playGroove(configuration, options?): Promise<{ playbackId: number; startedAtMs: number }>;
stop(playbackId: number): Promise<void>;
```

`keepAudioSessionActive` defaults to `false` for direct callers. The module is iOS-only and
maps stable native errors to `SoundFontPlayerError`.

There are no public instrument IDs. Piano uses `piano-white-grand.sf2`; groove and the
optional four-beat lead-in use private jazz-percussion samplers. Each supplied staff has its
own sampler. Removed preparation,
resume/restart, repeat-mode, is-playing, and playback-bar APIs must not be reintroduced.

## Playback Data

Configurations contain required, non-empty `tracks.treble` and optional `tracks.bass`. Each
track contains 1–8 parts with exactly 32 steps per part at 0.125 beats per step. Supplied bass
must be non-empty and have the same part count as treble. A lane is a rest (`null` MIDI and
velocity), hold (`-50` MIDI and null velocity), or note (`1...127` MIDI and `0...127`
velocity). Staffs and lanes decode independently; an omitted lane ends its active note.
Empty/all-rest content, malformed parts, invalid MIDI, and invalid BPM are rejected.

Both staffs start at the same beat and repetition boundary. Duration is calculated only from
the required treble timeline, so simultaneous bass does not extend playback.

## Shared Audio Session

SoundFont configures the process-wide session for simultaneous playback and capture while
preserving the system's default output dynamics:

```swift
try session.setCategory(
  .playAndRecord,
  mode: .default,
  options: [.defaultToSpeaker, .allowBluetoothHFP, .mixWithOthers]
)
try session.setActive(true)
```

SoundFont remains output-only: it installs no input tap and requests no microphone permission.
Basic Pitch and piano attack detection configure the same process-wide session with
`.measurement` when they start capture. When rhythm detection overlaps SoundFont playback,
SoundFont's later configuration changes the shared mode to `.default` without disabling the
detector's input graph.

## Fresh Graph And Lifetime

Each request first disposes any previous graph according to that previous graph's stored
lifetime flag, then creates a new engine/sequencer, attaches one sampler per supplied staff, applies
the common session configuration, starts rendering, schedules finite content, and returns an
exact playback ID plus absolute `startedAtMs`.

The active graph stores:

```swift
struct ActivePlayback {
  let keepAudioSessionActive: Bool
  let playbackId: Int
}
```

Natural finish and exact-ID stop always stop the sequencer, silence samplers, stop/reset the
engine, and release the graph. They deactivate the session only when the stored flag is
false. Setup error cleanup uses the current request's flag. A stale ID is a no-op and cannot
affect a newer graph.

Swift or bundled-resource changes require the developer to regenerate and build the iOS
development client from `MuseBuddy/` with `pnpm build`.
