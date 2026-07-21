# Performance Guidance And SoundFont Integration

This reference defines the JS/native handshake between performance guidance, SoundFont,
Basic Pitch, and piano attack detection. Native details live in `sound-font-player.md`.

## Responsibility Split

- SoundFont creates and fully disposes one fresh output graph per request. It owns the audible
  lead-in and finite repetitions.
- Basic Pitch owns chord microphone capture and recognition IDs.
- Piano attack detection owns rhythm's continuous input engine and absolute attack times.
- The provider owns flow generations, UI phase/progress, SoundFont-clock timing, event
  filtering, and navigation timers.
- The training-audio coordinator serializes SoundFont and Basic Pitch. Rhythm intentionally
  overlaps its separately owned attack detector with SoundFont output.

## Playback Requests

All callers explicitly pass one repetition policy and a session-lifetime flag:

```ts
// Session goal
{ keepAudioSessionActive: false, leadIn: true, repetitions: 2 }

// Chord demo
{ keepAudioSessionActive: false, leadIn, repetitions: 1 }

// Rhythm demo
{ keepAudioSessionActive: true, leadIn, repetitions: 1 }
```

First rounds and BPM restarts use a lead-in; rounds two and three do not. A play promise
resolves only after native creates the graph, loads SoundFonts, confirms output rendering,
starts sequencing, and returns absolute `startedAtMs`.

## Finish Handoffs

Natural SoundFont finish stops sequencing, silences samplers, stops/resets the output engine,
and releases its graph. It deactivates the process-wide session only when the exact request
stored `keepAudioSessionActive: false`, then emits its playback ID.

Chord guidance acknowledges the matching finish in the coordinator and only then starts
Basic Pitch. Listening begins after Basic Pitch returns its recognition ID, and completion
cancels that exact ID before the next demo.

Rhythm starts its detector before SoundFont. Once playback starts, the provider publishes the
future absolute listening boundary while keeping the UI in `demo`. JS retains raw detector
attacks whose capture times can belong to that listening window; demo attacks outside the
first hit's allowance are ignored. On finish, SoundFont releases only its output graph and its
matching native event authoritatively changes the UI to `listening`. Matching uses capture
time rather than event receipt time, so attacks delivered around the handoff are not lost.
The detector continues uninterrupted.

Session goal skips any recognition handoff and enters finish directly.

## Cancellation And Restarts

SoundFont stop and Basic Pitch cancel always carry exact IDs. BPM changes, reset, skip,
navigation, and unmount invalidate the flow before cleanup. Rhythm reset releases only
SoundFont output; skip/unmount/final completion release SoundFont before the detector. Results
and events from stale generations are ignored.

There are no prepare, resume, restart, repeat, is-playing, or playback-bar APIs. Every demo
uses a fresh native output graph.
