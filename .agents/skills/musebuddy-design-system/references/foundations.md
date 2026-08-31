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

| Group | Token name | Value |
| --- | --- | --- |
| UX framework | `mist` | `#F2FAFC` |
| UX framework | `paper` | `#FFFFFF` |
| UX framework | `pine` | `#286467` |
| UX framework | `wildflower` | `#DA438C` |
| UX framework | `sky` | `#65C1D5` |
| UX framework | `leaf` | `#C8DB9E` |
| UX framework | `sun` | `#F8F19E` |
| UX framework | `petal` | `#F2B6D2` |
| UX framework | `skyWash` | `#B7E3ED` |
| UX framework | `leafWash` | `#DCE9B9` |
| UX framework | `sunWash` | `#FCF6BB` |
| UX framework | `cobalt` | `#4F6DF5` |
| UX framework | `cobaltWash` | `#E5E9FF` |
| UX framework | `error` | `#C1121F` |
| UX framework | `success` | `#A7C957` |
| Teaching materials | `notation` | `#0D1321` |
| Teaching materials | `notationGray` | `#415A77` |
| Teaching materials | `blue` | `#0F8B8D` |
| Teaching materials | `pink` | `#F038FF` |
| Teaching materials | `yellow` | `#FFBD00` |
| Teaching materials | `cyan` | `#5FA8D3` |
| Teaching materials | `coral` | `#E56B6F` |
| Teaching materials | `cobaltInk` | `#293C9A` |

Use UX-framework colors for buttons, cards, surfaces, shadows, navigation, and feedback. Reserve
teaching-material colors for visualizing musical content: notation, chord names and roles,
keyboard highlights, and rhythm-trainer states. Do not rename tokens or add prefixes or suffixes
to express these groups.

### Cyan — `#65C1D5`

Cyan represents active playback, movement, timing, and musical energy. Use it for active playheads and beat markers, playback and Pause controls, strong beats, safe-note highlighting, animated progress accents, secondary solid shadows, and positive in-progress feedback. Do not use it as a general page background. Restrict deep-teal text on cyan to large, bold labels.

### Magenta — `#DA438C`

Magenta represents the current objective, primary action, root note, and strongest point of attention. Use it for the current training stage, Start and Continue actions, current chord/root notes, active checkpoints, current bars, small rewards, and destructive hold progress. Use it selectively: normally one dominant magenta region per screen. Use ice-white text on magenta only for large, bold labels or headings.

### Lemon — `#F8F19E`

Lemon is the brand atmosphere and primary environmental background. Use it for home-screen backgrounds, soft training framing, warm highlights, and low-priority game elements. Main content surfaces should normally remain ice white. Use deep teal for text.

### Pistachio — `#C8DB9E`

Pistachio represents completion, safety, support, and learned material. Use it for completed training stages, check states, learned chords, supporting chord tones, held notes, selected secondary controls, and safe choices. Use deep teal text. Do not let it compete with magenta.

### Deep teal — `#286467`

Deep teal is the structural color. Use it for primary text, icons, thin outlines, notation, solid offset shadows, keyboard structure, dividers, connecting paths, and secondary labels. It replaces black throughout most of the interface. Use ice-white text on deep teal surfaces.

### Ice white — `#F2FAFC`

Ice white is the principal content surface. Use it for notation, training arenas, cards, piano keys, secondary buttons, upcoming states, and modals. Deep teal is the default text and icon color.

### Paper — `#FFFFFF`

Paper is the neutral session and notation background. Use it for the plain training-session canvas and VexFlow score surfaces when the score must read as unframed material rather than a card. Deep teal is the default text and icon color.

## Contrast rules

| Background | Preferred text | Usage |
| --- | --- | --- |
| Ice white | Deep teal | All text sizes |
| Lemon | Deep teal | All text sizes |
| Pistachio | Deep teal | All text sizes |
| Deep teal | Ice white | All text sizes |
| Magenta | Ice white | Large, bold text only |
| Cyan | Deep teal | Large, bold text only |

Do not place small labels or body text directly on magenta or cyan. Music notation may use deep teal or near-black when additional precision is needed.
