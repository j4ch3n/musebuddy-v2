---
name: musebuddy-design-system
description: Design, review, or document MuseBuddy UI styling, theme tokens, Tamagui configuration, component visuals, interaction states, and visual hierarchy. Use for any MuseBuddy interface change that needs the polished casual music-game system, tactile component language, accessibility rules, or visual quality review.
---

# MuseBuddy Design System

Use this skill with `AGENTS.md`: this skill owns design direction, while `AGENTS.md` owns engineering constraints and command policy.

## Reference routing

Read [references/foundations.md](references/foundations.md) for every UI task. It contains the
design character, palette, and contrast rules. Its palette inventory divides colors into the
**UX framework** (shared surfaces, controls, cards, shadows, and feedback) and **teaching
materials** (notation, chord roles, keyboard highlights, and rhythm states). Keep those uses
separate; do not repurpose teaching-material colors for general UI chrome.

Then read only the reference that matches the work:

- [references/training-layout.md](references/training-layout.md): the Preview, Phrase, and Full
  Play session shell, route navigator, score layouts, progression, and content grouping.
- [references/controls-and-feedback.md](references/controls-and-feedback.md): buttons,
  press-and-hold feedback, solid shadows, and typography.
- [references/illustration-and-viewport.md](references/illustration-and-viewport.md):
  illustrations, small-viewport adaptation, and final visual balance.

For a broad screen redesign or final UI review, read all three routed references. These files are
the authoritative design guidance.

## Workflow

Before implementing or reviewing UI:

1. Inspect nearby components and the active workflow.
2. State the screen's dominant learning activity, primary color focal point, and one small illustrative idea.
3. Apply the current training-session shell where relevant: compact header navigator and
   controls, then a flexible learning arena. Add a bottom control dock only when a product task
   explicitly introduces actions for it.
4. Map styling to the semantic design tokens; do not hardcode color values in components.
5. Verify text contrast, small-iPhone fit, touch targets, pressed behavior, loading/empty/error/success states, and that no primary task requires scrolling.
6. Review for coherence: one obvious next action, separated navigation/content/controls, a consistent shadow direction, and no competing focal points.

Do not migrate unrelated components during a narrow task.

## Review Gate

Do not call UI work complete unless:

- the learning activity receives the most space and fits in the viewport;
- color retains its assigned meaning, with one dominant magenta region at most;
- normal text uses an approved contrast pairing;
- the session screen retains its compact header navigator and one large learning arena; any new
  control dock is explicitly designed as a new product pattern;
- controls are tactile through solid offset shadows and responsive state changes, without blurred elevation;
- loading, empty, error, disabled, and success states remain explicit;
- the work respects MuseBuddy's iOS-only Expo development-client constraints.
