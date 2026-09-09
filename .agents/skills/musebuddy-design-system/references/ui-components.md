# Shared UI Components

This inventory lists the reusable UI surface under `MuseBuddy/src/ui/`. Import components through
the `@/ui` entrypoint where they are exported. Read the implementation and its stories for the
full prop contract and meaningful states.

## Components

| Component | Source | Use it for |
| --- | --- | --- |
| `BpmControl` | `bpm-control.tsx` | Showing the current tempo and choosing from the shared BPM options in an animated menu. |
| `Button` | `button.tsx` | General-purpose tactile action buttons with configurable surface, frame, shadow, icon, label, disabled, and long-press states. |
| `Carousel` | `carousel.tsx` | Swipeable, accessible paging through a typed collection of rendered items. |
| `ChordName` | `chord-name.tsx` | Rendering chord symbols with shared full-chord/root-only display modes, compact/large sizing, and optional teaching-role colorization. |
| `FlashCard` | `flash-card.tsx` | Hero or supporting learning cards with an optional flip between two faces or carousel pages. |
| `HandSilhouette` | `hand-silhouette.tsx` | Rendering a right- or left-hand SVG silhouette for instructional cues and decorative watermarks. |
| `MusicViewFlip` | `music-view-flip.tsx` | Switching a learning surface between keyboard and notation views. |
| `PianoKeyboard` | `piano-keyboard.tsx` | Displaying piano keys, note markers, emphasized keys, and live detection feedback. |
| `PillButtonController` | `pill-button-controller.tsx` | Selecting one value from a compact labelled group of pill-style options. |
| `PlayButton` | `play-button.tsx` | Playing or stopping a progression preview with animated volume feedback. |
| `TactileControlAction` | `tactile-control.tsx` | The lower-level press/long-press control primitive used by tactile actions, menus, and hold-progress feedback. |
| `TrainingStageIcon` | `training-stage-icon.tsx` | Rendering the shared icon for a training stage (`goal` or `bars`). |

## Public supporting exports

The `@/ui` entrypoint also exposes shared values and helpers that belong with these components:

- `BPM_OPTIONS` and `DEFAULT_BPM` for tempo controls.
- `chordNameSymbolForDisplay` and the `ChordName` display/size prop types.
- `getBoundedCarouselIndex`, `getCarouselSwipeDirection`, and `shouldCommitCarouselSwipe` for
  carousel behavior and tests.
- `getPianoKeyboardMarkers` and the piano keyboard marker/live-key types.

Keep component-specific helpers private unless they are needed by more than one feature. When a
new reusable component is added, export it from `MuseBuddy/src/ui/index.ts`, add deterministic
co-located Storybook states when applicable, and update this inventory.
