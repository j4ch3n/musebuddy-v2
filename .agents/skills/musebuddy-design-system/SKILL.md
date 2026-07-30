---
name: musebuddy-design-system
description: Design, review, or document MuseBuddy UI styling, theme tokens, Tamagui configuration, component visuals, interaction states, and visual hierarchy. Use for any MuseBuddy interface change that needs the botanical, designer-led, game-like color system, tactile component language, accessibility rules, or visual quality review.
---

# MuseBuddy Design System

Use this skill with `AGENTS.md`: this skill owns design direction, while `AGENTS.md` owns
engineering constraints and command policy.

## Direction

Create a playful music-learning game shaped by a designer, not a generic gamified
dashboard. Combine tactile game pieces with calm, nature-led art direction:

- **Game-like:** controls feel physical, progress feels rewarding, and musical objects have
  clear silhouettes.
- **Designer-led:** every screen has one focal idea, deliberate negative space, consistent
  geometry, and restrained color.
- **Nature-focused:** evoke a bright garden after rain through sky, leaf, sun, wildflower,
  and deep evergreen colors. Use abstract organic shapes sparingly; do not add literal
  woodland illustrations by default.
- **Focused:** recording, practice, transcription, and music data remain more important than
  decoration.

Use `src/components/piano-keyboard/piano-keyboard.tsx` as the tactile reference for strong
outlines and physical controls, but apply the color and hierarchy rules in this skill
instead of inheriting its old palette.

Avoid enterprise dashboards, glass effects, gray-on-gray interfaces, rainbow gamification,
decorative gradients, excessive pills, nested cards, and decoration that competes with the
exercise.

## Color System

The six core colors establish the product identity. Supporting washes, darker annotation
inks, Coral, and Violet may extend them only for tactile material or information-rich music
visuals. Never invent a color inside a component.

| Priority | Token role | Hex | Single semantic job |
| --- | --- | --- | --- |
| Foundation | Mist background | `#F2FAFC` | App canvas and breathing space |
| Functional primary | Pine ink | `#286467` | Readable content, structure, and committed action |
| Brand accent | Wildflower | `#DA438C` | Current focus, musical emphasis, and brand moments |
| Interactive secondary | Sky | `#65C1D5` | Optional or exploratory interaction |
| Progress support | Leaf | `#C8DB9E` | Growth, completion, and learned material |
| Reward highlight | Sun | `#F8F19E` | Achievement, discovery, and brief celebration |

The core roles are exclusive:

- Do not use Wildflower for errors, Sky for progress, Leaf for ordinary decoration, or Sun
  for selection.
- Do not assign multiple accent colors to the same interaction state.
- Do not repeat the same emphasis role across neighboring controls. One control leads; the
  others recede.
- Use color on a minority of screen chrome. Mist and Pine carry the interface; one contextual
  accent carries the moment. Music data may use several stable role colors when a legend,
  label, or different geometry makes every role understandable without color.

### Extended material and music palette

All color values are authored as `--mb-color-*` variables in `src/global.css`. Native
TypeScript colors are generated from that file; components, stories, DOM surfaces, SVG,
and Tamagui configuration must never contain raw color literals.

- Pale washes create hierarchy between canvas, supporting cards, and hero surfaces without
  competing with content.
- Deep Pine is the common frame and bottom-shadow color; it gives Pine controls a visible edge.
- Dark annotation inks provide accessible chord-token text on Mist.
- Coral is reserved for altered musical information and explicit off-time/error geometry.
- Violet is reserved for harmonic color/bass information, not generic decoration.

### Color hierarchy

Aim for approximately 60% Mist, 25% pale contextual surfaces, 10% Pine structure, and no
more than 5% saturated Wildflower emphasis. Treat this as a visual-weight guide, not a
pixel quota.

Choose one contextual color family per screen:

- Practice or exploration: Sky.
- Progress or completion: Leaf.
- Reward or discovery: Sun.
- Active musical focus: Wildflower.

Do not show all contextual colors at equal weight in screen chrome. A component may use
Mist, Pine, and one contextual color unless its product job is to compare musical roles.
Multi-hue music components must use the same role mapping everywhere.

### Contrast

Use Pine text on Mist, Leaf, or Sun. Use Mist text on Pine. These are the standard readable
pairings.

Do not place body text directly on Wildflower or Sky, and do not place Pine text on
Wildflower or Sky; these pairings do not meet normal-text contrast. Use Wildflower and Sky
for non-text fills, outlines, markers, or large shapes with an adjacent Pine label.

Never communicate status by color alone. Pair it with concise text, an icon, shape, or
position. Reserve product-level error and destructive meaning for explicit wording and
symbols rather than reassigning Wildflower.

Read [references/visual-guidance.md](references/visual-guidance.md) when choosing a palette
for a screen, composing components, or reviewing color-role collisions.

## Hierarchy and Composition

Give every screen a strict priority order:

1. The exercise, detected music, or current task.
2. The single next action.
3. Progress or supporting context.
4. Navigation and metadata.
5. Decorative atmosphere.

Only one element may carry primary-action weight in a view. Secondary actions use quieter
outlines or Sky support; tertiary actions are Pine text controls. Do not repeat a title,
exercise label, status, or action in multiple containers.

Use an 8-point spacing rhythm. Keep space inside a group tighter than space between groups.
Favor one strong composition over repeated equal cards. Asymmetry is welcome when the
reading order stays obvious: an offset progress sprout, a clipped organic field, or one
oversized musical object can create character.

## Type, Shape, and Material

- Use rounded system typography unless custom font assets are explicitly requested.
- Keep headings bold, compact, and sentence case. Use tabular numerals for timing, duration,
  confidence, counts, and tempo.
- Use one radius family per screen: 8px for compact objects, 12px for standard controls and
  cards, and 20px only for a dominant game surface. Use capsules only for true pills.
- Use 3px Pine borders for standard controls and 4-5px for piano keys or hero game pieces.
- Use crisp, Deep Pine, bottom-only shadows: zero horizontal offset and positive vertical
  offset.
- On press, move the surface down and reduce the shadow. Keep motion springy, brief, and
  interruptible.
- Use one coherent line-icon family in Pine. Do not use emoji as interface icons.

Good shadow direction:

```tsx
boxShadow: '0 6px 0 #286467'
```

Avoid diagonal shadows, soft floating-card shadows, and multiple shadow languages.

## Component Guidance

- **Primary button:** Pine fill, Mist label, Deep Pine frame/shadow, and a narrow semantic
  color rail. Use once per view.
- **Secondary button:** contextual wash, Pine label, Deep Pine outline, saturated rail, and
  shallower shadow. Do not let it rival the primary action.
- **Selection:** Wildflower marker or outline plus an adjacent Pine label or selection icon.
- **Cards:** use only for real grouping. Prefer Mist with a Pine outline or one pale
  contextual surface; do not nest cards.
- **Progress:** use Leaf with a Pine label, check, or progress geometry.
- **Reward:** use Sun briefly around a result or milestone; it is not a permanent page
  background.
- **Music visuals:** make notes, keys, meters, and timing rows feel like pieces in one game.
  Use stable color roles plus position and shape. Provide a compact legend when more than
  one semantic hue is present.
- **States:** provide purposeful loading, empty, permission-denied, recording, processing,
  failure, disabled, and success states. Keep structure visible when disabled.

## Workflow

Before implementing or reviewing UI:

1. Inspect nearby components and the active workflow.
2. State the screen's priority order and choose its single contextual accent.
3. Check the proposed composition against the role-collision rules in the visual reference.
4. Map styling to generated semantic tokens; do not hardcode color values in components.
5. Verify text fit on small iPhones, touch targets, contrast, states, pressed behavior, and
   bottom-only shadows.
6. Review for coherence: one accent, one radius family, one shadow direction, one icon
   family, and one obvious next action.

Do not migrate unrelated components during a narrow task.

## Review Gate

Do not call UI work complete unless:

- the exercise or musical result wins the hierarchy;
- the screen uses one contextual accent and no color changes semantic role;
- adjacent controls do not compete or repeat the same priority;
- normal text uses an approved contrast pairing;
- nature appears through palette, rhythm, and restrained organic form rather than clutter;
- interaction feels tactile and game-like without becoming childish;
- loading, empty, error, disabled, and success states remain explicit;
- the work respects MuseBuddy's iOS-only Expo development-client constraints.
