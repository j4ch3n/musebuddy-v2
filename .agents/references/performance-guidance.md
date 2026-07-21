# Performance Guidance Components

`MuseBuddy/src/components/performance-guidance/` owns shared training-page guidance state,
the training-audio coordinator, the performance button, and playback/recognition event
filtering. Consult this file before changing the provider, button behavior, or page
integration. Consult `performance-soundfont-integration.md` for the JS/native handshake.

## Public Surface

Import the provider, button, and hook from `@/components/performance-guidance`.

Every provider supplies a `playback` value and a required listening mode:

```ts
type PerformanceGuidanceListeningMode =
  | { kind: 'none' }
  | { kind: 'basic-pitch' }
  | { kind: 'piano-attack'; allowedOffsetMs: number };
```

Session goal uses `none` and two playback cycles. Chords use `basic-pitch`. Rhythm uses
`piano-attack` and three demo/listen cycles. Provider keys identify the exercise only; BPM
must not be part of a provider key.

`usePerformanceGuidance()` exposes phase/progress state, the current demo step, Basic Pitch's
latest ID-filtered detection, rhythm's absolute `listeningStartedAtMs`, and `flowId` for
resetting input state on fresh starts, failures, explicit resets, and BPM restarts. It also
exposes `start()`, idempotent `completeListening()`, `reset()`, `requestFinish()`, and
`requestSkip()`. For rhythm, `listeningStartedAtMs` is published during `demo` as the scheduled
future boundary; `phase` remains authoritative for what the UI displays.

## State And Timing

`prepare` initially displays `4` while native creates the fresh audio graph and loads the
requested SoundFont. Once playback resolves with `startedAtMs`, the provider refreshes the
four-beat countdown, demo repetition label, and demo step every 30 ms from wall time. There
is no silent `expo-audio` clock or playback-bar event.

Session goal starts only after Start, plays two piano repetitions in one native request, and
enters `finish`. Chords play one demo, then start Basic Pitch only after SoundFont finishes;
the UI enters `listening` only after Basic Pitch returns a recognition ID.

Rhythm starts the piano attack detector once before its first SoundFont request. SoundFont
events anchor listening start at `startedAtMs + leadInDurationMs + demoDurationMs`. The
detector remains active across all three demo/listen cycles. Its input-tap clock supplies
absolute onset times that remain continuous across audio-session interruptions.
`use-rhythm-listen-progress.ts` owns attack subscriptions and 30 ms listening updates derived
from `Date.now()`.

## Page Integration

- Session goal supplies `{ kind: 'none' }`.
- Individual chords and the chord summary supply `{ kind: 'basic-pitch' }` and keep their
  existing matching/completion behavior.
- Rhythm derives a sixteenth-note step from BPM, uses half a step as its allowed offset, and
  listens for `pattern.length * stepDurationMs`.
- Rhythm's pure progress helper creates expected hits only for `s` and `w`, derives one-to-one
  nearest matches from raw absolute attacks, and recomputes misses and combo transitions so
  bridge delivery delay cannot change the result.
- Finish and skip navigation remain page-owned.

Changing BPM while active invalidates the flow, releases the exact active SoundFont or Basic
Pitch ID, clears progress/input/errors, and automatically restarts round one with a lead-in.
Rhythm retains its already running detector but resets combo/matching state. Stale generations
and stale native IDs are ignored.

## Audio Ownership And Cleanup

The shared training-audio coordinator serializes SoundFont playback and Basic Pitch
recognition. Commands carry a monotonically assigned provider owner ID so old cleanup cannot
stop newer audio.

Rhythm separately owns piano attack detection so input can overlap SoundFont output. Reset
stops the current SoundFont graph but leaves the detector active for another start. Skip,
unmount, and final completion stop SoundFont first, then stop the detector, which deactivates
the shared session.

Playback or microphone failures return to `pending`, preserve no progress, and show the
mapped error. Permission denial never advances a round.
