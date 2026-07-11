# Sound Font Player

`MuseBuddy/modules/sound-font-player/` is a local iOS-only Expo module that plays bundled
SoundFont files through `AVAudioEngine`, `AVAudioUnitSampler`, and `AVAudioSequencer`.
Use it for lightweight practice playback and rhythm/chord preview sounds.

## Public TypeScript API

The stable JS entrypoint is `MuseBuddy/modules/sound-font-player/src/sound-font-player.ts`.

- `prepareSoundFonts()`: attaches and loads all bundled band and groove SoundFonts without
  starting sequencer playback or emitting timing events.
- `playBand(configuration)`: validates against the band instrument set and starts native
  playback. If playback is already active, the native service stops the active sequence
  before starting the new one.
- `playGroove(configuration)`: validates against the groove instrument set and starts
  native playback with the same configuration schema.
- `stop()`: stops the sequencer, cancels timing events, and sends
  all-notes-off/all-sound-off.
- `isPlaying()`: reads native playback state.
- `addLeadInFinishListener(listener)`: subscribes to the one-shot lead-in completion event.
- `addStepListener(listener)`: subscribes to loop-relative sixteenth-note step events after
  the lead-in.
- `addTickListener(listener)`: subscribes to beat/bar timing events.

The module is iOS-only. `getNativeModule()` throws `ERR_UNSUPPORTED_PLATFORM` outside iOS.

## Playback Configuration

`SoundFontPlaybackConfiguration<TInstrument>` contains:

- `bpm`: finite positive tempo.
- `tracks`: zero or more `SoundFontPlaybackTrack<TInstrument>` values.

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
      instrument: "piano",
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

Native validation ignores empty track lists, tracks with empty `parts`, and all-rest
tracks. Unsupported instruments, malformed non-empty part lengths, invalid MIDI values,
and invalid rest/hold velocity data are still rejected.

## Instruments

Instrument definitions live in `SoundFontPlayerService.swift`. The native service has two
instrument sets:

- `band`: public practice instruments such as `piano`, `bass`, `guitar`, and `percussion`.
  Band `percussion` uses `drum-kit.sf2`.
- `groove`: rhythm/accompaniment instruments. Groove `percussion` uses
  `jazz-percussion.sf2`.

Band and groove playback use the same payload shape. The entrypoint determines which
instrument set resolves a given instrument name, so `percussion` can exist in both sets
with different SoundFont resources.

The lead-in sound uses `jazz-percussion.sf2`, has its own sampler and MIDI channel, and is
always prepared with the rest of the SoundFont resources.

When adding or changing instruments:

- update the Swift band or groove instrument table;
- update `BandSoundFontInstrument` or `GrooveSoundFontInstrument` in TypeScript;
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
- `onStep`
- `onTick`

`onLeadInFinish` is standalone and fires once at the end of the four-beat lead-in for the
active playback id:

```ts
type SoundFontLeadInFinishEvent = {
  playbackId: number;
  bpm: number;
};
```

`onStep` starts after the four-beat lead-in, at the same time user playback starts. It
fires every sixteenth-note step in the active loop:

```ts
type SoundFontStepEvent = {
  playbackId: number;
  bpm: number;
  stepIndex: number;
  barIndex: number;
  stepIndexInBar: number;
};
```

`stepIndex` is loop-relative and wraps at the active loop length. `barIndex` and
`stepIndexInBar` are derived from the module's 16-step bar model.

`onTick` always starts at playback start, including during the lead-in. It emits a
discriminated union:

```ts
type SoundFontTickEvent =
  | { playbackId: number; bpm: number; event: "beat"; beatIndex: number }
  | { playbackId: number; bpm: number; event: "bar"; barIndex: number };
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
