# Performance Guidance Components

`MuseBuddy/src/components/performance-guidance/` owns the shared training-page guidance
control. It replaces page-specific play/continue controls with a single stateful
performance button, a hold-to-skip control, and context values that pages can use for
visual synchronization such as rhythm highlighting.

Consult this file before changing the performance guidance provider, button visuals,
or training page integration. Consult `performance-soundfont-integration.md` when
changing how this component coordinates with SoundFont playback.

## Public Surface

Use the package entrypoint:

```ts
import {
  PerformanceGuidanceButton,
  PerformanceGuidanceProvider,
  usePerformanceGuidance,
} from '@/components/performance-guidance';
```

`PerformanceGuidanceProvider` wraps a training screen when that screen has playable
material. It accepts:

- `playback`: `{ kind: 'band' | 'groove', configuration }`, where `configuration` is a
  SoundFont playback configuration or `null`.
- `cycleCount`: optional repeat count, defaulting to `3`.
- `listeningEnabled`: whether the guidance flow includes a listening phase, defaulting to
  `true`.
- `finishText`: the message displayed during the finish state.
- `onFinish`: navigation or page advancement after the finish progress completes.
- `onSkip`: navigation after the 3-second hold-to-skip completes.

`PerformanceGuidanceButton` must be rendered inside the provider, normally in the
`TrainingScreenShell` footer.

`usePerformanceGuidance()` exposes:

- `phase`: `pending`, `prepare`, `demo`, `listening`, or `finish`.
- `completedCycles` and `cycleCount`.
- `countdownValue`.
- `currentStepIndex`, used by rhythm training during audible demo only.
- `errorMessage`, `finishText`, `isDisabled`, and `listeningEnabled`.
- `start()`, `requestFinish(message?)`, and `requestSkip()`.

## State Model

The guidance state is UI-level state. Playback timing and cycle boundaries are external
inputs supplied by SoundFont integration code.

- `pending`: waits for the human to press Start.
- `prepare`: the button shows `4`, `3`, `2`, `1` and uses a subtle scale animation.
- `demo`: configured sounds are playing; the button shows `Demo N/total`.
- `listening`: the listening interval is active; the button shows `Your turn`.
- `finish`: the button shows the configured finish message and fills for 3 seconds before
  `onFinish`.

## Page Integration

Each training page should keep route files thin and supply only page-specific playback
configuration, copy, and navigation.

- Build the SoundFont configuration outside route files, usually through music-theory
  helpers.
- Wrap the active screen content and footer in `PerformanceGuidanceProvider` only when
  playable material exists.
- Render `PerformanceGuidanceButton` in the `TrainingScreenShell` footer.
- Keep finish and skip behavior page-owned through `onFinish` and `onSkip`.
- Read `currentStepIndex` from `usePerformanceGuidance()` only for components that need
  playback-synchronized highlighting.

When the playable source changes, remount the provider with a stable `key` based on the
exercise identity and BPM. This resets guidance state and stops old native playback on
provider cleanup.

## Visual Design

The button follows the MuseBuddy game-like, tactile design language:

- chunky ink border;
- vivid filled state colors;
- bottom-only ink shadow;
- bold rounded/system typography;
- tabular numerals for countdown and cycle labels;
- large primary touch target for the main state button;
- smaller always-visible hold-to-skip control.

Current state colors:

- `pending` / `prepare`: primary purple fill.
- `demo`: vivid blue fill.
- `listening`: vivid purple fill.
- `finish`: cream surface with green progress fill.
- disabled: muted cream with reduced opacity.
- skip fill: vivid red.

The main button is pressable only in `pending`. Other phases are informational because
native playback owns timing. The finish state displays a 3-second fill animation before
navigation. The skip control fills over 3 seconds while pressed; releasing early resets
the fill.

Keep visible text short enough for small iPhone widths. Do not add explanatory copy inside
the training screens; the control should communicate state directly through label, color,
and progress.

## Error And Cleanup Behavior

Playback errors are displayed under the controls. `SoundFontPlayerError` messages are
mapped through the module wrapper, with native detail included only in development.

Provider cleanup must:

- clear pending finish timers;
- stop any active playback through the integration layer;
- remove external event subscriptions.

The component should ignore stale playback events.
