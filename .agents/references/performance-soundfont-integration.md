# Performance Guidance And SoundFont Integration

This reference defines the JS/native handshake between performance guidance, the
SoundFont module, and Basic Pitch. Native details live in `sound-font-player.md`; UI/page
details live in `performance-guidance.md`.

## Responsibility Split

- Native SoundFont playback creates, loads, runs, and fully disposes one fresh audio graph
  per request. It owns the audible lead-in and finite repetitions.
- Native Basic Pitch owns microphone capture and tags each detection with a recognition
  ID.
- The provider owns flow generations, UI phase/progress, timing from `startedAtMs`, event
  filtering, demo/listen progression, and navigation timers.
- The shared coordinator serializes native playback and recognition so they never overlap,
  and protects newer owners from stale cleanup.

## Playback Requests

Session goal calls:

```ts
playPiano(configuration, { leadIn: true, repetitions: 2 });
```

Chord learning calls `playPiano`; rhythm training calls `playGroove`. Their first round and
BPM restarts use `{ leadIn: true, repetitions: 1 }`. Rounds two and three use
`{ leadIn: false, repetitions: 1 }`.

While a play promise is pending, the UI remains in `prepare` at `4`. The promise resolves
only after native has created the graph, loaded the requested SoundFont plus optional
lead-in SoundFont, confirmed output rendering, and started sequencing. The returned
`startedAtMs` anchors countdown, demo labels, and rhythm highlighting.

## Playback Finish And Recognition Handoff

Native natural finish first stops sequencing, silences and releases samplers, stops the
engine, and deactivates its audio session. It then emits `onPlaybackFinish({ playbackId })`.
The provider ignores nonmatching IDs, acknowledges the matching playback as idle in the
coordinator, and only then starts recognition:

```ts
startRecognition({ detectionIntervalMs: 200, rollingWindowMs: 2000 });
```

The UI enters `listening` after this promise returns `{ recognitionId }`. Detection events
must match that ID. A completed listening round awaits
`cancelRecognition(recognitionId)` before any next SoundFont request.

Session goal skips this handoff and enters `finish` directly.

## Cancellation And Restarts

SoundFont cancellation always carries the exact playback ID. Recognition cancellation
always carries the exact recognition ID. BPM changes, reset, skip, navigation, and unmount
invalidate the flow generation before awaiting cleanup. Results and events from older
generations are ignored. Provider owner IDs ensure cleanup from an old route cannot stop
audio already owned by a newer route.

There are no prepare, resume, restart, repeat, is-playing, or playback-bar APIs. Every demo
uses a fresh native graph, including rounds without a lead-in.
