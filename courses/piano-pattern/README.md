# Piano Pattern Conversion

`piano-pattern/` converts constrained grand-staff MusicXML patterns into
beat-level JSON. It does not connect to the companion tables or any database.

## Command

Run the CLI from `courses/` and provide the `.mxl` input:

```sh
uv run python piano-pattern/main.py piano-pattern/data/no4.mxl --mode notes
```

The pattern ID and output path are always derived from the input stem:

```text
input:  piano-pattern/data/no4.mxl
id:     piano-pattern/no4
output: piano-pattern/output/no4.notes.json
```

Use `--mode scores` to write an engraving-only representation:

```sh
uv run python piano-pattern/main.py piano-pattern/data/no4.mxl --mode scores
```

This writes `piano-pattern/output/no4.scores.json`. The score JSON contains
only notation data: grand-staff measures, voices, notes and rests, beams, and
ties. Rest keys use a generic center-staff position; the renderer enables
VexFlow's official `alignRests` formatter option to align them with nearby
notes.

## VexFlow Demo

The standalone browser demo serves generated files directly from `output/`:

```sh
cd piano-pattern/demo
pnpm install
pnpm dev
```

Choose `no4` or `no15` in the page to render the corresponding
`*.scores.json` file.

## Database Upload

The uploader recursively finds paired `*.notes.json` and `*.scores.json`
files. It validates every pair before opening a database connection:

```sh
uv run python piano-pattern/upload.py --dry-run
uv run python piano-pattern/upload.py --remote-db local
```

Use `--remote-db prod` for the environment in `courses/.env.prod`, or pass
`--database-url` explicitly. Re-uploading replaces the logical note rows for
each scanned pattern and upserts its metadata and score in one transaction.

## Supported MusicXML

JSON conversion intentionally supports a narrow input shape:

- one treble stave and one bass stave;
- `4/4` throughout;
- one unchanged key signature shared by both staves;
- two logical half-bar beats per bar;
- 32 quantized slots per logical beat;
- no tuplets; and
- note and rest positions aligned to the 32-slot grid.

Trailing multimeasure rests are removed. Internal empty measures, key changes,
unsupported clefs, ambiguous chords, and off-grid rhythms cause conversion to
fail with a location-specific message.

## Chord Analysis

Chord analysis combines notes from both staves and matches their pitch classes
against the generated chord dictionary. Added tones, suspensions, extensions,
inversions, and written enharmonic spellings are retained. Explicit omitted-tone
profiles are not selected merely because a normal voicing leaves out a
supporting tone such as the fifth.

Ties are collapsed before attack analysis. A bar without a distinct midpoint
harmonic attack uses one full-bar chord for both output beats. An untied bass
attack or a multi-note attack at the midpoint triggers separate analysis of the
two halves. This allows changes such as `Dsus4` to `D` while preventing tied
notes from creating false changes.

If equally ranked chord profiles remain, conversion stops instead of writing a
potentially incorrect label.

## JSON Shape

The top-level pattern metadata records the major and relative-minor readings
of the notated key signature. It does not assert a single tonal centre:

```json
{
  "pattern": {
    "id": "piano-pattern/no4",
    "time_signature": "4/4",
  "key_signature_display": "G major / E minor",
  "progression_in_major_scale": {
    "mode": "major",
    "tonic": "G",
    "tonic_circle_of_fifths_index": 1,
    "display": ["I", "vi", "IV", "V"],
    "active_circle_of_fifths_indices": [1, 4, 0, 2]
  },
  "progression_in_minor_scale": {
    "mode": "minor",
    "tonic": "E",
    "tonic_circle_of_fifths_index": 4,
    "display": ["III", "i", "VI", "VII"],
    "active_circle_of_fifths_indices": [1, 4, 0, 2]
  }
  },
  "beats": [
    {
      "id": "deterministic sha256",
      "pattern_id": "piano-pattern/no4",
      "bar_index": 0,
      "beat_index": 0,
      "chord": "g-add-ninth",
      "staves": {
        "treble": {
          "arrangement": ["32 nested slots"],
          "velocity": ["32 matching slots"]
        },
        "bass": {
          "arrangement": ["32 nested slots"],
          "velocity": ["32 matching slots"]
        }
      }
    }
  ]
}
```

Each stave retains the companion arrangement cell conventions:

- positive MIDI value: note attack;
- `-50`: hold for a note already active in that lane; and
- `null`: rest.

Velocity has the same lane shape. Attacks contain MIDI velocity and rest/hold
cells contain `null`. MusicXML velocity is used when available; otherwise the
realized music21 velocity is stored.
