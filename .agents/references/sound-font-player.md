# Sound Font Player

`MuseBuddy/modules/sound-font-player/` is a local iOS-only Expo module that plays bundled
SoundFont files through `AVAudioEngine`, `AVAudioUnitSampler`, and `AVAudioSequencer`.
Use it for lightweight practice playback and rhythm/chord preview sounds.

## Public TypeScript API

The stable JS entrypoint is `MuseBuddy/modules/sound-font-player/src/sound-font-player.ts`.

- `play(configuration)`: validates and starts native playback. If playback is already
  active, the native service stops the active sequence before starting the new one.
- `stop()`: stops the sequencer, cancels timing events, and sends all-notes-off/all-sound-off.
- `isPlaying()`: reads native playback state.
- `addLeadInFinishListener(listener)`: subscribes to the one-shot lead-in completion event.
- `addTickListener(listener)`: subscribes to beat/bar timing events.

The module is iOS-only. `getNativeModule()` throws `ERR_UNSUPPORTED_PLATFORM` outside iOS.

## Playback Configuration

`SoundFontPlaybackConfiguration` contains:

- `bpm`: finite positive tempo.
- `tracks`: one or more `SoundFontPlaybackTrack` values.

Each track contains an `instrument` and `parts`. Each part must contain exactly 16 steps,
and each step contains one or more lanes. Cells use:

- `midi: null`: rest, with `velocity` also `null`.
- `midi: -50`: hold marker, with `velocity` also `null`.
- `midi: 1...127`: note, with `velocity: 0...127`.

Each lane is decoded independently. A note starts when a lane contains a positive MIDI
value. The note ends at the next non-hold cell in the same lane, or at the end of the
track if no later non-hold cell appears. Hold cells extend the active note but do not
start their own notes. Rest cells close any active note in that lane.

One part is one 16-step bar at the native step duration of `0.25` beats. Multiple parts
are flattened into one looping track, so two parts become a 32-step, 8-beat loop.

Example one-bar piano configuration:

```ts
const rest = { midi: null, velocity: null };
const hold = { midi: -50, velocity: null };

const configuration = {
  bpm: 100,
  tracks: [
    {
      instrument: 'piano',
      parts: [
        [
          [{ midi: 60, velocity: 96 }], // C4 starts at beat 0.00
          [hold], // C4 extends through beat 0.25
          [hold], // C4 extends through beat 0.50
          [rest], // C4 ends at beat 0.75
          [{ midi: 64, velocity: 92 }], // E4 starts at beat 1.00
          [hold],
          [rest],
          [rest],
          [{ midi: 67, velocity: 92 }], // G4 starts at beat 2.00
          [hold],
          [hold],
          [hold],
          [rest],
          [rest],
          [rest],
          [rest],
        ],
      ],
    },
  ],
};
```

For polyphony, put multiple cells in a step. Each array index is a lane, so the same lane
index should carry the start/hold/rest progression for one voice across steps.

Native validation rejects empty configs, unsupported instruments, malformed part lengths,
invalid MIDI values, and invalid rest/hold velocity data.

## Instruments

Instrument definitions live in `SoundFontPlayerService.swift`. Each definition maps a
public instrument name to a bundled `.sf2` resource, sampler bank, program, and bound MIDI
channel. Public instrument names are mirrored by the `SoundFontInstrument` TypeScript
union.

The lead-in instrument is internal and is always loaded with the requested playback tracks.
It uses its own sampler and MIDI channel. Do not expose it as a public
`SoundFontInstrument` unless the product intentionally supports user-selectable lead-in
sounds.

When adding or changing instruments:

- update the Swift `instruments` table;
- update `SoundFontInstrument` in TypeScript if the instrument is public;
- bundle the `.sf2` under the module resources;
- keep each instrument on a distinct MIDI channel unless sharing is deliberate;
- rebuild the iOS development client.

## Sequencer Behavior

Playback uses one `AVAudioSequencer` attached to the shared `AVAudioEngine`.

- A four-beat lead-in track is appended first.
- User playback tracks start at beat `4.0`, after the lead-in.
- User playback tracks loop from beat `4.0` for their own loop length.
- The lead-in track is one-shot and should not have explicit loop settings.

Avoid Core Audio or AVFoundation work on the main thread. The service uses its own
`workQueue` for playback setup, stop, and timer callbacks.

## Events

Native events declared by `SoundFontPlayerModule.swift`:

- `onLeadInFinish`
- `onTick`

`onLeadInFinish` is standalone and fires once at the end of the four-beat lead-in for the
active playback id:

```ts
type SoundFontLeadInFinishEvent = {
  playbackId: number;
  bpm: number;
};
```

`onTick` always starts at playback start, including during the lead-in. It emits a
discriminated union:

```ts
type SoundFontTickEvent =
  | { playbackId: number; bpm: number; event: 'beat'; beatIndex: number }
  | { playbackId: number; bpm: number; event: 'bar'; barIndex: number };
```

Beat ticks fire every beat starting with `beatIndex: 0`. Bar ticks fire every four beats
starting with `barIndex: 0`. Timing callbacks guard against stale playback ids so canceled
or superseded playback does not emit old events.

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
