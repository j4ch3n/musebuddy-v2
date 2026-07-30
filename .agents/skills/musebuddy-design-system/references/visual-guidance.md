# MuseBuddy Visual Guidance

Use this reference when translating the core design system into a screen or component. It
defines composition choices and prevents the palette from becoming decorative or
ambiguous.

## Palette at a Glance

| Color | Hex | Visual character | Use | Never use |
| --- | --- | --- | --- | --- |
| Mist | `#F2FAFC` | Open air | Canvas and negative space | Selected or success state |
| Pine | `#286467` | Evergreen structure | Text, outlines, icons, primary control | Passive decoration |
| Wildflower | `#DA438C` | Musical spark | Current focus and brand signature | Error, secondary action, body-text ground |
| Sky | `#65C1D5` | Curiosity and motion | Optional interaction and exploration | Completion or selected state |
| Leaf | `#C8DB9E` | Growth | Progress and learned material | Generic card tint |
| Sun | `#F8F19E` | Discovery | Reward and temporary celebration | Warning or persistent background |

Supporting washes and accessible annotation inks are defined in `src/global.css`. Use
Deep Pine for frames and physical shadows; use Petal, Sky Wash, Leaf Wash, Sun Wash, Coral
Wash, and Violet Wash for contextual surfaces. Berry, Ocean, Moss, Coral Ink, Ochre, and
Violet Ink are readable music-annotation colors on Mist.

Alpha values supplied as eight-digit hex are fully opaque (`FF`); store and document the
six-digit equivalents unless an API specifically requires alpha.

## Priority Model

Compose each screen from five levels:

| Level | Purpose | Typical treatment |
| --- | --- | --- |
| 1 | Exercise or result | Largest visual object; Pine structure; contextual accent only if needed |
| 2 | Next action | One Pine/Mist tactile control |
| 3 | Progress/context | Smaller Leaf, Sky, or Sun region chosen by screen purpose |
| 4 | Navigation/metadata | Quiet Pine text or icons on Mist |
| 5 | Atmosphere | One cropped organic shape or subtle field; never required |

If two elements appear equally important, remove fill, shadow, size, or saturation from the
lower-priority element. Do not solve hierarchy by introducing another color.

## Screen Recipes

### Record or perform

- Keep the instrument, meter, or recording target at level 1.
- Use a Pine primary action with a Mist label.
- Use Wildflower only for the active musical locus: playhead, target note, or recording
  pulse. Pick one.
- Keep permission, input, and timing details in Pine on Mist.

### Explore or learn

- Use Sky as the sole contextual accent for hints, optional paths, or reveal controls.
- Keep the next committed action Pine.
- Move completed material to Leaf only after completion; do not show Sky and Leaf as equal
  competing panels.

### Complete or review

- Use Leaf for completed steps, mastery, or progress geometry.
- Use Sun for one short reward moment, not as a second permanent status color.
- Keep mistakes or failures explicit with Pine copy and an icon; do not turn Wildflower
  into a red error surrogate.

### Inspect transcription data

- Let timing, notes, duration, pitch, and confidence lead through scale, alignment, and
  tabular numerals.
- Use Wildflower for the currently inspected note only.
- Use Pine for all other values and outlines. Use tint or geometry, not a rainbow, to
  distinguish rows.

## Component Role-Collision Test

Before approving a component, ask:

1. What is the single primary action or focal state?
2. Which one contextual color does this component need?
3. Is that color doing only its assigned job?
4. Does a neighboring element repeat the same visual priority?
5. Can hierarchy be clarified by size, spacing, shape, or position instead of another hue?
6. Is every colored status also named or symbolized?

Reject the composition if one color carries two meanings, two colors carry the same
meaning, or multiple controls look primary. Multi-color music notation is allowed only
when each hue has a stable role and an adjacent legend or non-color cue.

## Stable Music Role Maps

- Rhythm: Strong = Sun/tall block; Weak = Sky/medium block; Hold = Leaf/low wide block;
  Rest = Petal/hollow dash; Current = Wildflower outline; Correct = Leaf/check; Off-time =
  Coral/cross.
- Chord syntax: Root = Berry/Wildflower; Quality = Ocean/Sky; Extension = Moss/Leaf;
  Alteration = Coral Ink/Coral; Addition = Ochre/Sun; Omission = Pine/hollow; Bass =
  Violet Ink/Violet.
- Chord tones: Root = Berry/Wildflower; Essential = Ocean/Sky; Supporting = Moss/Leaf;
  Color = Violet; Optional = Ochre/Sun.

## Nature Without Illustration Clutter

Express nature through design behavior:

- use open Mist space like air around a plant;
- grow progress upward or along a gentle path;
- use rounded leaf-like asymmetry in one supporting shape;
- reveal Sun only at moments of discovery;
- use Pine lines as the stable stem or frame;
- use Wildflower as a rare bloom at the current musical focus.

Avoid defaulting to leaf icons, mascots, scenic backgrounds, or decorative foliage.
Literal nature imagery should support a specific product moment and never reduce music-data
clarity.

## Accessibility Pairings

Approved normal-text pairings:

- Pine on Mist: `6.39:1`
- Mist on Pine: `6.39:1`
- Pine on Sun: `5.81:1`
- Pine on Leaf: `4.53:1`

Wildflower and Sky are not normal-text backgrounds with this palette. When either is used
as a fill, place the readable label outside the fill or use it as a non-text marker with a
Pine label nearby.

Check the final rendered interface as well as token-level ratios. Font weight, size,
opacity, overlays, and disabled treatment can reduce effective contrast.

## Designer-Led Review

The interface should look composed, not assembled:

- one focal object rather than a grid of equal cards;
- one accent rather than a color per category;
- one radius family and one shadow direction;
- space between groups greater than space within groups;
- sentence-case, action-specific copy;
- a visible next step for loading, empty, permission, and failure states;
- motion that reinforces press, progress, or reward and never delays the task.

The game quality comes from feedback and physicality. The designer quality comes from
restraint, hierarchy, and intentional negative space.
