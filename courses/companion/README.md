# POP909 Companion Arrangements

`courses/companion/` processes the POP909 dataset into beat-level piano arrangement rows
for Supabase. The output is designed for compact accompaniment playback and chord-aware
course material, not for preserving every original MIDI event verbatim.

## Beat And Bar Mapping

The processor uses `beat_midi.txt` as the timing source for MIDI quantization. Audio beat
files can begin away from beat 1 and can have less regular spacing, so they are used only
for audio key summaries.

The MIDI beat mapping is:

```text
supported boundary = row where beat_midi column 2 == 1.0
first complete bar = first supported boundary where beat_midi column 3 == 1.0
logical_index = supported boundary index after the first complete bar
bar_index = floor(logical_index / 2)
beat_index = logical_index % 2
```

Rows before the first complete downbeat are treated as pickup material. Pickup table
beats and pickup piano notes are skipped and logged.

Each row covers one POP909 table beat, which is half a `4/4` bar in this storage model.
That is why each bar has two rows: `beat_index = 0` and `beat_index = 1`.

## Arrangement Shape

`arrangement` is a nested JSON array with exactly `32` outer slots:

```json
[
  [64],
  [-50],
  [-50],
  [-50],
  [null],
  [67, 72]
]
```

The real stored value always has 32 outer entries. Each outer entry is one quantized
sixteenth-step slot within the table beat:

```text
step_duration_seconds = (window_end_seconds - window_start_seconds) / 32
slot_index = round((note_start_seconds - window_start_seconds) / step_duration_seconds)
```

Slot values:

- positive MIDI number: note attack at this slot.
- `-50`: hold marker for a note that was already active in the same lane.
- `null`: rest in that lane.

The array is nested because piano can have overlapping notes. Each slot contains one or
more lanes. Lanes are allocated only as needed for simultaneous or sustained notes. A
silent slot is represented as `[null]` so every outer slot has a list shape.

Current quantization stores attacks whose MIDI start time falls inside the row window.
Notes that begin before the first complete bar are counted as skipped pickup notes.

## Velocity Shape

`velocity` has the same outer length and the same per-slot lane counts as `arrangement`.
It records MIDI attack velocity only:

```json
[
  [91],
  [null],
  [null],
  [null],
  [null],
  [72, 84]
]
```

Velocity values:

- `0` through `127`: MIDI velocity for a note attack.
- `null`: rest or hold. Holds do not repeat the original attack velocity.

Validation must reject rows where:

- `arrangement` is not a list.
- `velocity` is not a list.
- either array has an outer length other than `32`.
- any slot has different lane counts between `arrangement` and `velocity`.
