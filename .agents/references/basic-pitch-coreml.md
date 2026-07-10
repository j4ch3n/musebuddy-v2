# Basic Pitch Core ML Integration

MuseBuddy keeps Spotify's Basic Pitch source model as
`MuseBuddy/modules/basic-pitch/ios/Resources/nmp.mlpackage`. The iOS app bundles the
compiled Core ML artifact
`MuseBuddy/modules/basic-pitch/ios/Resources/nmp.mlmodelc`; `BasicPitch.podspec` copies
that compiled artifact, not the source `.mlpackage`.

Run `pnpm compile:basic-pitch-model` from `MuseBuddy/` before CocoaPods installs or
copies resources. The podspec also has a `prepare_command` that compiles `nmp.mlpackage`
to `nmp.mlmodelc` during pod installation. The local `BasicPitch` Expo module owns model
loading, audio conversion, inference, and decoding. Expo Audio owns microphone capture.

## Model capability

- Input: mono, normalized Float32 PCM at 22,050 Hz.
- Window shape: `[1, 43844, 1]` under the Core ML feature name `input_2`.
- Outputs:
  - `Identity`: `[1, 172, 264]`
  - `Identity_1`: `[1, 172, 88]` note activation tensor
  - `Identity_2`: `[1, 172, 88]` onset activation tensor
- The decoder returns MIDI pitch, start/end/duration in milliseconds, confidence, and
  velocity.

## Invocation

Import the typed bridge from `MuseBuddy/modules/basic-pitch`:

```ts
await initialize();
const result = await predict(encodedRecordingBytes);
```

`predict()` accepts the encoded bytes of a completed recording as a `Uint8Array`. It
returns the converted audio duration, processing duration, and time-sorted attack/release
events. An attack and release for the same note share an ID.

Call `initialize()` before prediction. Core ML loading, audio conversion, inference, and
decoding remain off the main thread. Converted audio must contain at least three seconds
at 22,050 Hz. Native errors cross the bridge with stable `BasicPitchErrorCode` values and
retain their native diagnostic message for console logging.

## Native rebuild requirement

Changes to Swift, the model package, compiled model, podspec, module configuration, or
app native configuration require the developer to regenerate and build the iOS
development client from `MuseBuddy/` with `pnpm build`.
