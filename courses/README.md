# MuseBuddy Courses

`courses/` is a Python workspace for generating MuseBuddy course materials. It is
separate from the Expo app and should stay focused on offline data generation.

Planned dictionaries:

- `chord_dictionary/`
- `rhythm_dictionary/`
- `progression_dictionary/`
- `pattern_dictionary/`

The current focus is `chord_dictionary/`.

## Chord Dictionary

Generate popular chord profiles with:

```sh
python chord_dictionary/generate.py
```

The generator writes one JSON file per chord to:

```text
courses/chord_dictionary/output/
```

Each chord JSON contains only the canonical visual data persisted in
`chord_profiles`: stable `id`, `normalizedSymbol`, `displayTokens`,
`root`, nullable `bass`, and an ordered `tones` list.
Every tone provides its spelled `pitch`, pedagogical `degree`, `pitchClass`,
`teachingRole`, `voicingRole`, `isBass`, and a curated `hand` and `finger` cue.
Teaching roles are `anchor`,
`quality`, `guide`, `color`, and `voicing`; the app derives captions and visual
layers from them rather than storing duplicate copy.

Output should stay deterministic, camelCase, and free of extra fields.
