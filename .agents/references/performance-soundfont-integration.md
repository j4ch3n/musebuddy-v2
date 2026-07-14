# Performance Guidance And SoundFont Integration

This reference explains how the React performance guidance components and the native
SoundFont player work together. Keep native module details in `sound-font-player.md` and
React component/page details in `performance-guidance.md`.

## Responsibility Split

- SoundFont player owns low-level playback: optional lead-in audio, finite cycle playback,
  infinite repeat playback, stop, native `onPlaybackBar` timing anchors, and the finite
  `onPlaybackFinish` event.
- Performance guidance owns UI state, labels, progress animations, finish messages,
  lead-in countdown display, rhythm highlighting from audio-clocked native bar anchors,
  listening delay, demo/listen round progression, and navigation callbacks.
- JavaScript starts one native sequence for session goal, or one one-cycle native demo per
  chord/rhythm listening round. It stores the returned `playbackId` and ignores stale
  finish events.
- JavaScript may call `stop()` for cancellation and cleanup: main-button reset, skip,
  unmount, route change, explicit finish requests, or playback failure.

## Start Contract

`PerformanceGuidanceProvider` passes playback options separately from the page-provided
SoundFont configuration when calling `playBand()` or `playGroove()`:

- `leadIn`: true for the first demo in a page flow, false for later demos.
- `cycles`: `2` for session goal, `1` for each chord/rhythm demo.

This keeps page builders focused on musical content. Pages should not pre-bake guidance
cycle policy into music-theory playback builders.

## Event Contract

The guidance provider subscribes to `onPlaybackBar` and `onPlaybackFinish` and ignores
stale playback ids. JS timers still drive the prepare countdown, but rhythm
`currentStepIndex` is derived from native bar events and the Expo Audio clock while native
SoundFont audio plays.

- `onPlaybackBar` supplies the native bar boundary, sequence `playbackPositionMs`, and
  native `absoluteTimeMs`. JS uses the absolute timestamp to compensate for bridge/event
  latency.
- An `expo-audio` silent clock player supplies the JS-side elapsed audio time between
  native bar anchors.

- Session goal: native finish moves directly to `finish`.
- Chord/rhythm learning: native finish enters `listening`; after the 3-second listening
  delay, JS increments `completedCycles` and either starts the next one-cycle demo or
  enters `finish`.

## Page Defaults

- Session goal: `listeningEnabled={false}`, `cycleCount={2}`, band playback.
- Chord learning: `listeningEnabled={true}`, `demoListenCycleCount={3}`, band playback.
- Rhythm training: `listeningEnabled={true}`, `demoListenCycleCount={3}`, groove playback.

Skip routing is page-owned. Finishing can either advance an in-page unit, such as the
next chord slide, or route to the next training page.

## Change Guidelines

- If changing event payloads, update all three references: native details, React behavior,
  and this integration contract.
- If changing button visuals only, update `performance-guidance.md`; do not edit the
  SoundFont reference.
- If changing native scheduling only, update `sound-font-player.md`; update this file only
  when the JS/native handshake changes.
- Keep the JS listening delay hardcoded at 3 seconds unless product requirements change.
