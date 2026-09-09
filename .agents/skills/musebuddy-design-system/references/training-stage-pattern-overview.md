# Training Stage Pattern Overview

`TrainingStagePatternOverview` is the shared learning card for rhythm and voicing preparation.
It uses one stable card composition so the learner recognizes the activity before the detail mode
changes.

## Structure

- The key label and play control sit above the FlashCard.
- The card centers the hand-specific clef and its hand label; these are the primary learning
  content.
- Major-scale degrees form a low-emphasis scattered backdrop that conveys the progression without
  competing with the clef.

## Detail watermark

The centered Lucide watermark distinguishes the mode while remaining decorative and inaccessible:

| Detail | Icon | Placement |
| --- | --- | --- |
| `rhythm` | `audio-waveform` | Behind the clef; 10pt lower for individual hands. |
| `voicing` | `keyboard-music` | Behind the clef; 10pt lower for individual hands. |

Use `pine` at 0.1 opacity and a 144pt icon size. Keep it centered for the together-hand layout.
Do not use the watermark as an action, status signal, or substitute for the clef and hand label.

## Component contract

The component accepts a discriminated `detail: 'rhythm' | 'voicing'` configuration plus the
degrees, key-signature label, and `left`/`right`/`together` hand. Keep Storybook’s Rhythm and
Voicing stories separate, while exposing the same clef and progression controls in both.
