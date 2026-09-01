# MuseBuddy Foundations

## Design character

MuseBuddy should feel like a polished casual music game: playful, tactile, encouraging, and easy to understand at a glance. Its personality comes from confident color, rounded geometry, solid offset shadows, musical illustrations, and responsive state changes.

Keep the interface visually light. Give each screen one dominant learning activity, one small illustrative idea, and limited supporting controls. Empty space is part of the design.

Core principles:

* Learning content always receives the most space.
* Color communicates meaning and state, not decoration alone.
* Navigation, content, and controls occupy clearly separated regions.
* Illustrations support the activity without competing with it.
* Every training screen fits within one viewport.
* No horizontal or vertical scrolling is required for the primary task.
* Repetition creates familiarity; state changes create excitement.

## Palette

The CSS palette is intentionally organized into two groups. Keep the existing token names; the
group identifies where a color belongs, rather than creating a new naming convention.

| Group | Token name | Value | Functional role |
| --- | --- | --- | --- |
| UX framework | `mist` | `#F2FAFC` | Default application canvas and quiet neutral surface. |
| UX framework | `paper` | `#FFFFFF` | Plain, neutral content surface; use where content needs maximum visual neutrality. |
| UX framework | `pine` | `#286467` | Primary interface ink, structural frame, outline, divider, and solid offset-shadow color. |
| UX framework | `wildflower` | `#DA438C` | Primary action and current focal-state color. |
| UX framework | `sky` | `#65C1D5` | Active, in-progress, and secondary accent color. |
| UX framework | `leaf` | `#C8DB9E` | Selected, supportive, and completion-adjacent surface color. |
| UX framework | `sun` | `#F8F19E` | Warm brand-atmosphere and low-emphasis background color. |
| UX framework | `petal` | `#F2B6D2` | Soft decorative or low-emphasis highlight color. |
| UX framework | `skyWash` | `#B7E3ED` | Subtle cool-tinted surface for secondary content or controls. |
| UX framework | `leafWash` | `#DCE9B9` | Subtle positive-state surface. |
| UX framework | `sunWash` | `#FCF6BB` | Subtle warm-tinted surface. |
| UX framework | `cobalt` | `#4F6DF5` | Reserved high-emphasis cool accent. |
| UX framework | `cobaltWash` | `#E5E9FF` | Subtle surface paired with the cobalt accent. |
| UX framework | `error` | `#C1121F` | Error and destructive-state signal. |
| UX framework | `success` | `#A7C957` | Explicit success-state signal. |
| Teaching materials | `notation` | `#0D1321` | Primary notation ink and high-precision musical mark color. |
| Teaching materials | `notationGray` | `#415A77` | Secondary or muted notation ink. |
| Teaching materials | `blue` | `#0F8B8D` | Teaching-material category: rhythm rest; supporting chord tone. |
| Teaching materials | `pink` | `#F038FF` | Teaching-material category: strong rhythm beat; chord root. |
| Teaching materials | `yellow` | `#FFBD00` | Teaching-material category: weak rhythm beat, correct rhythm response, or chord color tone. |
| Teaching materials | `cyan` | `#5FA8D3` | Teaching-material category: held rhythm note; essential chord tone. |
| Teaching materials | `coral` | `#E56B6F` | Teaching-material category: optional chord tone. |
| Teaching materials | `cobaltInk` | `#293C9A` | Reserved dark-blue teaching-material ink or category color. |

Use UX-framework colors for shared interface chrome: surfaces, controls, frames, navigation,
shadows, and feedback. Reserve teaching-material colors for musical information. In particular,
do not use teaching-material category colors as general UI accents, status colors, or decorative
chrome. The role column defines each token's intended semantic function; it does not prescribe a
specific component. Do not rename tokens or add prefixes or suffixes to express these groups.

`wildflower` may be the primary action or current app-level focal state, but it is not the chord
root color; `pink` is. `sky` may indicate active UI progress, but it is not a held note or
essential chord tone; `cyan` is. `leaf` can support a selected or completion-adjacent UI state,
while `success` is the explicit success feedback token. These distinctions preserve the boundary
between interface state and teaching-material meaning.

## Contrast rules

| Background | Preferred text | Usage |
| --- | --- | --- |
| `mist` | `pine` | All text sizes |
| `paper` | `pine` | All text sizes |
| `sun` | `pine` | All text sizes |
| `leaf` | `pine` | All text sizes |
| `pine` | `mist` | All text sizes |
| `wildflower` | `mist` | Large, bold text only |
| `sky` | `pine` | Large, bold text only |

Do not place small labels or body text directly on `wildflower` or `sky`. Music notation uses
`notation`; use `notationGray` only for secondary or muted notation.
