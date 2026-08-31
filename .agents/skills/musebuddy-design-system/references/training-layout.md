# MuseBuddy Training Session Layout

## Current session shell

`/preview`, `/phrase`, and `/full-play` share `TrainingSessionShell`: a compact safe-area header
above a flexible learning arena. The header holds session navigation, BPM control, and exit. The
arena takes the remaining viewport height, with 12-point outer padding and 18 points of bottom
breathing room. There is no bottom control dock in the current product.

Do not add a second progress bar, duplicate navigation, floating controls, or a bottom action
dock unless a feature supplies its behavior. The screen must remain usable without scrolling.

## Routes and progression

The routes are fixed in this order:

| Route | Purpose | Navigator behavior |
| --- | --- | --- |
| `/preview` | Read the full score before practice. | Opens the full-score arena. |
| `/phrase` | Compare and practice a single bar. | Provides previous/next bar controls and `current / total`. |
| `/full-play` | Return to the full score for the final run. | Opens the full-score arena. |

The navigator is the session-level progression UI. Do not repeat its meaning with another step
indicator. Phrase arrows disable at the first and final bars while the Phrase route remains
available.

## Learning arenas

Preview and Full Play use one full-height FlashCard containing the paginated `PianoPatternScore`.
The score is the dominant activity: do not nest it in additional cards, overlay controls on it,
or make the overall screen scroll.

Phrase uses a fixed comparison stack above a flexible stage:

1. Previous-bar score slot — 180 points high, muted notation.
2. Current-bar score slot — 180 points high, standard notation.
3. Phrase learning FlashCard — fills the remaining arena height.

Keep the score slots separated by a minimal 4-point gap. For the first bar, use an equally sized
placeholder reading “First bar” and “No previous sheet”; it is an intentional empty state, not a
loading or error state. Do not reduce the score-slot height to enlarge the lower stage.

## Button customization

Header route controls remain compact, icon-led, and consistently sized. The Phrase control keeps
its two arrows and compact counter together as one route group. The BPM control remains a compact
trigger that reveals its options without reflowing the session. Exit stays a dedicated icon action
that asks for confirmation before leaving.

When customizing a button, preserve its role, touch target, accessibility label/state, and pressed
feedback. Add labels only when an icon alone is ambiguous; avoid creating a second primary action
in the header or learning arena.

## Drop-shadow customization

Tactile controls and FlashCards use one solid, offset drop shadow; do not use blurred elevation.
Keep shadow size proportional to hierarchy: compact header controls use a small offset, while a
large FlashCard may use a stronger offset. The shadow should compress and the element should move
toward it when pressed, then return on release.

When changing a component’s surface or state, customize its shadow through the component’s
existing `shadowColor` or style contract. Choose the shadow color to support that component’s
semantic role or state; it does not need to match the pine frame or use a single global shadow
color. Do not add multiple shadows, detach the shadow direction from the pressed translation, or
use shadows as decorative background effects.

## Content grouping

Use one dominant learning activity per route. Group related material through proximity, the primary
arena, and restrained spacing rather than repeated nested cards, explanatory labels, or competing
focal points. Keep navigation, content, and session controls visibly separate.
