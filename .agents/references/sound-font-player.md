# Sound Font Player

`MuseBuddy/modules/sound-font-player/` is a local iOS-only Expo module that plays bundled
SoundFont files through `AVAudioEngine`, `AVAudioUnitSampler`, and `AVAudioSequencer`.
Use it as a low-level practice playback engine. Page/context code owns demo/listen flow,
round counts, BPM-change restart policy, and UI timing.

## Public TypeScript API

The stable JS entrypoint is `MuseBuddy/modules/sound-font-player/src/sound-font-player.ts`.

- `prepareSoundFonts()`: attaches and loads all bundled band and groove SoundFonts without
  starting sequencer playback.
- `playBand(configuration, options?)`: validates against the band instrument set and
  starts native playback, resolving with `{ playbackId: number }`. If playback is active,
  native stops the active sequence first.
- `playGroove(configuration, options?)`: groove equivalent of `playBand`.
- `restartBand(configuration, options)`: stops active playback and starts the supplied
  band configuration. `options.leadIn` is required at the TypeScript boundary.
- `restartGroove(configuration, options)`: groove equivalent of `restartBand`.
- `stop()`: stops the sequencer, cancels finish timing, and sends all-notes-off and
  all-sound-off.
- `isPlaying()`: reads native playback state.
- `addPlaybackFinishListener(listener)`: subscribes to finite playback completion.

The module is iOS-only. `getNativeModule()` throws `ERR_UNSUPPORTED_PLATFORM` outside iOS.

## Playback Configuration

`SoundFontPlaybackConfiguration<TInstrument>` contains only musical content:

- `bpm`: finite positive tempo.
- `tracks`: zero or more `SoundFontPlaybackTrack<TInstrument>` values.

Playback policy is passed separately as `SoundFontPlaybackOptions`:

- `leadIn?: boolean`: schedules the four-beat lead-in audio once before user tracks.
- `cycles?: number`: finite user-track cycle count. Omitted or non-positive means one
  cycle.
- `repeat?: boolean`: loops user tracks forever until JS calls `stop()` or `restart*`.
  Repeat mode ignores `cycles` and does not emit `onPlaybackFinish`.

Each track contains an `instrument` and `parts`. Each part must contain exactly 16 steps,
and each step contains one or more lanes. Cells use:

- `midi: null`: rest, with `velocity` also `null`.
- `midi: -50`: hold marker, with `velocity` also `null`.
- `midi: 1...127`: note, with `velocity: 0...127`.

Each lane is decoded independently. A note starts when a lane contains a positive MIDI
value. The note ends at the next non-hold cell in the same lane, or at the end of that
track if no later non-hold cell appears. Hold cells extend the active note but do not
start their own notes. Rest cells close any active note in that lane.

One part is one 16-step bar at the native step duration of `0.25` beats. Multiple parts
are flattened into one track. Native playback uses the longest playable track as the
cycle length; shorter instruments stop naturally until the next cycle.

Native validation ignores empty track lists, tracks with empty `parts`, and all-rest
tracks. Unsupported instruments, malformed non-empty part lengths, invalid MIDI values,
and invalid rest/hold velocity data are rejected.

## Instruments

Instrument definitions live in `SoundFontPlayerService.swift`. The native service has two
instrument sets:

- `band`: public practice instruments such as `piano`, `bass`, `guitar`, and
  `percussion`. Band `percussion` uses `drum-kit.sf2`.
- `groove`: rhythm/accompaniment instruments. Groove `percussion` uses
  `jazz-percussion.sf2`.

Band and groove playback use the same payload shape. The entrypoint determines which
instrument set resolves a given instrument name, so `percussion` can exist in both sets
with different SoundFont resources.

The lead-in sound uses `jazz-percussion.sf2`, has its own sampler and MIDI channel, and is
prepared with the rest of the SoundFont resources.

When adding or changing instruments:

- update the Swift band or groove instrument table;
- update `BandSoundFontInstrument` or `GrooveSoundFontInstrument` in TypeScript;
- bundle the `.sf2` under the module resources;
- keep each instrument on a distinct MIDI channel unless sharing is deliberate;
- rebuild the iOS development client.

## Native Playback Behavior

Playback uses one `AVAudioSequencer` attached to the shared `AVAudioEngine`.

- A four-beat lead-in track is appended only when `leadIn: true`.
- User playback tracks start at beat `4.0` after lead-in, or beat `0.0` without lead-in.
- The lead-in track is one-shot.
- Finite mode schedules user tracks for `cycles` cycles and emits `onPlaybackFinish` once
  after the final cycle, then stops playback.
- Repeat mode loops user tracks forever and never emits `onPlaybackFinish`.

Avoid Core Audio or AVFoundation work on the main thread. The service uses its own
`workQueue` for playback setup, stop, and finish callbacks.

## Events

Native events declared by `SoundFontPlayerModule.swift`:

- `onPlaybackFinish`

`onPlaybackFinish` fires once when finite playback completes:

```ts
type SoundFontPlaybackFinishEvent = {
  playbackId: number;
  bpm: number;
  completedCycles: number;
};
```

JS callers must guard against stale `playbackId` values because stopped or superseded
playback can race with local UI timers.

## Error Handling

Native errors are mapped to `SoundFontPlayerError` codes in the TypeScript wrapper:

- `ERR_SOUNDFONT_EMPTY_CONFIGURATION`
- `ERR_SOUNDFONT_ENGINE_START_FAILED`
- `ERR_SOUNDFONT_INVALID_CONFIGURATION`
- `ERR_SOUNDFONT_LOAD_FAILED`
- `ERR_SOUNDFONT_RESOURCE_MISSING`
- `ERR_UNSUPPORTED_PLATFORM`

Keep detailed native diagnostics out of the normal event surface. Add temporary diagnostics
only while debugging a specific native issue, and remove them before finishing the change.

## Native Rebuild Requirement

Changes to Swift, bundled `.sf2` resources, module configuration, podspecs, or app native
configuration require the developer to regenerate and build the iOS development client
from `MuseBuddy/` with `pnpm build`.
