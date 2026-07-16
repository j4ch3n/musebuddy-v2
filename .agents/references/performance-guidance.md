# Performance Guidance Components

`MuseBuddy/src/components/performance-guidance/` owns the shared training-page guidance
state, the training-audio coordinator, the performance button, and playback/recognition
event filtering. Consult this file before changing the provider, button behavior, or page
integration. Consult `performance-soundfont-integration.md` for the JS/native handshake.

## Public Surface

Import the provider, button, and hook from `@/components/performance-guidance`.

The provider accepts a `playback` value with `kind: 'piano' | 'groove'` and a public
SoundFont configuration. Session goal uses `listeningEnabled={false}` and `cycleCount={2}`.
Chord and rhythm exercises use three input-driven rounds, start in `prepare`, and use one
native repetition per demo. Provider keys identify the exercise only; BPM must not be part
of a provider key.

`usePerformanceGuidance()` exposes:

- `phase`: `pending`, `prepare`, `demo`, `listening`, or `finish`;
- `completedCycles`, `cycleCount`, `countdownValue`, and `currentStepIndex`;
- `latestDetection`, filtered to the active Basic Pitch recognition ID;
- `errorMessage`, `finishText`, `isDisabled`, and `listeningEnabled`;
- `start()`, idempotent `completeListening()`, `reset()`, `requestFinish()`, and
  `requestSkip()`.

## State And Timing

The provider owns this rendering state through a reducer:

```ts
type GuidanceState = {
  phase: 'pending' | 'prepare' | 'demo' | 'listening' | 'finish';
  completedCycles: number;
  countdownValue: number;
  currentStepIndex: number | null;
  latestDetection: DetectionResult | null;
  errorMessage: string;
};
```

Lifecycle IDs, completion locks, timers, and the flow generation stay outside rendering
state. `prepare` initially displays `4` and holds there while native creates the fresh
audio graph and loads the requested SoundFont. Once playback resolves with
`startedAtMs`, the provider refreshes the four-beat countdown, demo repetition label, and
rhythm step index every 30 ms from the JS wall clock, that native timestamp, and BPM. There
is no silent `expo-audio` clock and no playback-bar event.

Session goal starts only after Start, plays two piano repetitions in one native request,
does not start recognition, then enters `finish`. Chord and rhythm pages automatically
start a one-repetition demo with a lead-in, start Basic Pitch after native playback has
fully finished, and enter `listening` only after recognition resolves. Later rounds use
fresh playback graphs without a lead-in.

The provider subscribes once to playback-finish and Basic Pitch detection events. Events
must match the active playback or recognition ID. `completeListening()` cancels the exact
recognition ID, increments progress once, and either starts the next demo or enters
`finish` after round three.

## Page Integration

- Session goal supplies piano content and no recognition behavior.
- Individual chord UI reads `latestDetection`, shows recent notes, and completes only on
  the configured chord.
- Chord summary accumulates one check per displayed chord within the current listening
  round. Checks reset for the next round.
- Rhythm training reads `currentStepIndex` during demo and completes listening on the
  first current-session detection containing a note. Empty detections do nothing.
- Finish and skip navigation remain page-owned.

Changing BPM while pending only changes the next configuration. Changing BPM during
prepare, demo, or listening invalidates the flow, releases the exact active audio ID,
clears progress/input/errors, and automatically starts round one with a fresh lead-in.
Rapid changes are safe because stale generations and stale IDs are ignored.

## Audio Ownership And Cleanup

The shared training-audio coordinator serializes playback and microphone ownership. Every
command carries a monotonically assigned provider owner ID. Cleanup can release only audio
owned by that provider, and ID-specific cleanup cannot stop a newer playback or recognition
session.

Reset, skip, unmount, BPM restart, and navigation release the provider's current owner.
Playback or microphone failures return to `pending`, preserve no completed progress, and
show the mapped error. Permission denial never advances a round.

## Visual Behavior

Keep the existing tactile MuseBuddy button treatment: thick ink border, bottom-only ink
shadow, bold short labels, tabular countdown/cycle numerals, vivid state fills, cream/green
finish progress, and red hold progress. The main button starts in `pending`; holding it in
an active phase resets. Finish fills for three seconds before navigation. Skip remains a
three-second hold. Do not add explanatory screen copy.
