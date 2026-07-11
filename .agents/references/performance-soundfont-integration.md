# Performance Guidance And SoundFont Integration

This reference explains how the React performance guidance components and the native
SoundFont player work together. Keep native module details in `sound-font-player.md` and
React component/page details in `performance-guidance.md`.

## Responsibility Split

- SoundFont player owns playback timing: lead-in, audible demo length, optional silent
  period, cycle repeats, and native stop after the final cycle.
- Performance guidance owns UI state, labels, progress animations, finish messages,
  rhythm highlighting state, and navigation callbacks.
- JavaScript starts SoundFont playback once for a guidance run. It must not stop/restart
  playback for normal demo, listening, or repeat transitions.
- JavaScript may call `stop()` for cancellation and cleanup: skip, unmount, route change,
  explicit finish requests, or playback failure.

## Start Contract

`PerformanceGuidanceProvider` injects cycle options into the page-provided SoundFont
configuration before calling `playBand()` or `playGroove()`:

- `cycleCount`: the provider's repeat count, currently `3` for the training pages.
- `includesSilentPeriod`: mirrors `listeningEnabled`.

This keeps page builders focused on musical content. Pages should not pre-bake guidance
cycle policy into music-theory playback builders.

## Event Contract

The guidance provider subscribes to SoundFont events and ignores stale playback ids.

- `onLeadInFinish`: move `prepare -> demo`.
- `onTick`: update the prepare countdown from beat ticks.
- `onStep`: update `currentStepIndex` for rhythm highlighting only while phase is `demo`.
- `onDemoFinish`: clear `currentStepIndex`; move `demo -> listening` only when
  `includesSilentPeriod` is true.
- `onCycleRepeat`: update `completedCycles`; move to `demo` when `willRepeat` is true, or
  to `finish` when `willRepeat` is false.

The final `onCycleRepeat` event has `willRepeat: false`. The provider starts its 3-second
finish UI timer after that event, not from a locally calculated playback duration.

## Page Defaults

- Session goal: `listeningEnabled={false}`, `cycleCount={3}`, band playback.
- Chord learning: `listeningEnabled={true}`, `cycleCount={3}`, band playback.
- Rhythm training: `listeningEnabled={true}`, `cycleCount={3}`, groove playback.

Skip routing is page-owned. Finishing can either advance an in-page unit, such as the
next chord slide, or route to the next training page.

## Change Guidelines

- If changing event payloads, update all three references: native details, React behavior,
  and this integration contract.
- If changing button visuals only, update `performance-guidance.md`; do not edit the
  SoundFont reference.
- If changing native scheduling only, update `sound-font-player.md`; update this file only
  when the JS/native handshake changes.
- Do not reintroduce a JS-side silent clock or JS-side cycle length calculation for normal
  playback progression.
