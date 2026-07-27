from __future__ import annotations

import hashlib
import json
import sys
from dataclasses import dataclass
from fractions import Fraction
from pathlib import Path
from typing import Any, Literal, TypeAlias

from music21 import chord, clef, converter, key, meter, note, stream

COURSES_DIR = Path(__file__).resolve().parents[1]
if str(COURSES_DIR) not in sys.path:
    sys.path.insert(0, str(COURSES_DIR))

from chord_dictionary import generate


StaffName = Literal["treble", "bass"]
JsonObject: TypeAlias = dict[str, Any]

PATTERN_ID_PREFIX = "piano-pattern"
TIME_SIGNATURE = "4/4"
HALF_BAR_QUARTER_LENGTH = Fraction(2)
STEPS_PER_HALF_BAR = 32
STEP_QUARTER_LENGTH = HALF_BAR_QUARTER_LENGTH / STEPS_PER_HALF_BAR
HOLD_VALUE = -50
OUTPUT_DIR = Path(__file__).resolve().parent / "output"


class ConversionError(ValueError):
    """Raised when a MusicXML pattern cannot be converted safely."""


@dataclass(frozen=True)
class NoteEvent:
    staff: StaffName
    start: Fraction
    end: Fraction
    midi: int
    pitch_class: int
    pitch_name: str
    velocity: int


@dataclass(frozen=True)
class ChordCandidate:
    profile_id: str
    symbol: str
    root_name: str
    root_pitch_class: int
    bass_name: str
    bass_pitch_class: int
    pitch_classes: frozenset[int]
    essential_pitch_classes: frozenset[int]
    tone_names: dict[int, frozenset[str]]
    omission_count: int
    alteration_count: int


@dataclass(frozen=True)
class RankedChord:
    candidate: ChordCandidate
    score: tuple[int, int, int, int, int, int, int]


@dataclass(frozen=True)
class MeasureWindow:
    source_number: int
    bar_index: int
    start: Fraction
    end: Fraction


@dataclass(frozen=True)
class QuantizedStaff:
    arrangement: list[list[int | None]]
    velocity: list[list[int | None]]


@dataclass
class ActiveLane:
    end_slot: int


def convert_musicxml_to_notes(input_path: Path) -> Path:
    document = build_pattern_document(input_path)
    output_path = notes_output_path_for(input_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(document, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    return output_path


def build_pattern_document(input_path: Path) -> JsonObject:
    input_path = input_path.resolve()
    if input_path.suffix.lower() != ".mxl":
        raise ConversionError(f"{input_path} must be an .mxl file")
    if not input_path.is_file():
        raise ConversionError(f"{input_path} does not exist")

    try:
        parsed = converter.parse(input_path)
    except Exception as error:
        raise ConversionError(f"Could not parse {input_path}: {error}") from error
    if not isinstance(parsed, stream.Score):
        raise ConversionError(f"{input_path} did not parse as a score")

    parts = identify_staves(parsed)
    validate_meter(parts)
    fifths = read_key_signature(parts)
    validate_rhythm_grid(parts)

    tied_parts = {
        staff_name: strip_part_ties(part) for staff_name, part in parts.items()
    }
    events = [
        event
        for staff_name, part in tied_parts.items()
        for event in note_events(part, staff_name)
    ]
    measures = musical_measure_windows(parts["treble"], events)
    candidates = chord_candidates()
    beat_chords = [
        chord_ids_for_measure(measure, events, candidates) for measure in measures
    ]

    total_slots = len(measures) * 2 * STEPS_PER_HALF_BAR
    quantized = {
        staff_name: quantize_staff(
            [event for event in events if event.staff == staff_name],
            total_slots,
        )
        for staff_name in ("treble", "bass")
    }

    pattern_id = pattern_id_for(input_path)
    beats: list[JsonObject] = []
    for measure, chords_for_measure in zip(measures, beat_chords, strict=True):
        for beat_index, chord_id in enumerate(chords_for_measure):
            row_index = (measure.bar_index * 2) + beat_index
            slot_start = row_index * STEPS_PER_HALF_BAR
            slot_end = slot_start + STEPS_PER_HALF_BAR
            beats.append(
                {
                    "id": beat_id(pattern_id, measure.bar_index, beat_index),
                    "pattern_id": pattern_id,
                    "bar_index": measure.bar_index,
                    "beat_index": beat_index,
                    "chord": chord_id,
                    "staves": {
                        staff_name: {
                            "arrangement": quantized[staff_name].arrangement[
                                slot_start:slot_end
                            ],
                            "velocity": quantized[staff_name].velocity[
                                slot_start:slot_end
                            ],
                        }
                        for staff_name in ("treble", "bass")
                    },
                }
            )

    major_scale = key.KeySignature(fifths).asKey("major")
    relative_minor = major_scale.relative
    return {
        "pattern": {
            "id": pattern_id,
            "time_signature": TIME_SIGNATURE,
            "key_signature": {
                "fifths": fifths,
                "major_scale": key_name(major_scale),
                "relative_minor_scale": key_name(relative_minor),
            },
        },
        "beats": beats,
    }


def notes_output_path_for(input_path: Path) -> Path:
    return OUTPUT_DIR / f"{input_path.stem}.notes.json"


def pattern_id_for(input_path: Path) -> str:
    return f"{PATTERN_ID_PREFIX}/{input_path.stem}"


def identify_staves(score: stream.Score) -> dict[StaffName, stream.Part]:
    if len(score.parts) != 2:
        raise ConversionError(
            f"Expected exactly two piano staves, found {len(score.parts)}"
        )

    identified: dict[StaffName, stream.Part] = {}
    for part in score.parts:
        part_clefs = list(part.recurse().getElementsByClass(clef.Clef))
        if not part_clefs:
            raise ConversionError(f"Part {part.id!r} does not declare a clef")
        first_clef = part_clefs[0]
        if isinstance(first_clef, clef.TrebleClef):
            staff_name: StaffName = "treble"
        elif isinstance(first_clef, clef.BassClef):
            staff_name = "bass"
        else:
            raise ConversionError(
                f"Part {part.id!r} uses unsupported clef {type(first_clef).__name__}"
            )
        if staff_name in identified:
            raise ConversionError(f"Found more than one {staff_name} stave")
        identified[staff_name] = part

    if set(identified) != {"treble", "bass"}:
        raise ConversionError("Expected one treble stave and one bass stave")
    return identified


def validate_meter(parts: dict[StaffName, stream.Part]) -> None:
    measure_layouts: list[list[tuple[Fraction, Fraction]]] = []
    for staff_name, part in parts.items():
        signatures = list(part.recurse().getElementsByClass(meter.TimeSignature))
        if not signatures:
            raise ConversionError(f"The {staff_name} stave has no time signature")
        unsupported = sorted(
            {signature.ratioString for signature in signatures} - {TIME_SIGNATURE}
        )
        if unsupported:
            raise ConversionError(
                f"Only {TIME_SIGNATURE} is supported; found {', '.join(unsupported)}"
            )

        measures = list(part.getElementsByClass(stream.Measure))
        if not measures:
            raise ConversionError(f"The {staff_name} stave has no measures")
        layout: list[tuple[Fraction, Fraction]] = []
        for measure in measures:
            offset = to_fraction(measure.offset)
            duration = to_fraction(measure.barDuration.quarterLength)
            if duration != 4:
                raise ConversionError(
                    f"Measure {measure.number} on the {staff_name} stave "
                    f"has bar duration {duration}, expected 4"
                )
            layout.append((offset, duration))
        measure_layouts.append(layout)

    if measure_layouts[0] != measure_layouts[1]:
        raise ConversionError("Treble and bass measure boundaries do not match")


def read_key_signature(parts: dict[StaffName, stream.Part]) -> int:
    signatures_by_staff: dict[StaffName, set[int]] = {}
    for staff_name, part in parts.items():
        signatures = {
            signature.sharps
            for signature in part.recurse().getElementsByClass(key.KeySignature)
        }
        if not signatures:
            raise ConversionError(f"The {staff_name} stave has no key signature")
        if len(signatures) != 1:
            raise ConversionError(
                f"Key-signature changes are not supported on the {staff_name} stave"
            )
        signatures_by_staff[staff_name] = signatures

    treble_fifths = next(iter(signatures_by_staff["treble"]))
    bass_fifths = next(iter(signatures_by_staff["bass"]))
    if treble_fifths != bass_fifths:
        raise ConversionError("Treble and bass key signatures do not match")
    return treble_fifths


def validate_rhythm_grid(parts: dict[StaffName, stream.Part]) -> None:
    for staff_name, part in parts.items():
        for element in part.recurse().notesAndRests:
            if element.duration.tuplets:
                measure = element.getContextByClass(stream.Measure)
                measure_number = measure.number if measure is not None else "unknown"
                raise ConversionError(
                    f"Tuplets are not supported: {staff_name} measure {measure_number}"
                )
            start = to_fraction(element.getOffsetInHierarchy(part))
            duration = to_fraction(element.quarterLength)
            require_grid_alignment(start, f"{staff_name} note/rest start")
            require_grid_alignment(duration, f"{staff_name} note/rest duration")


def strip_part_ties(part: stream.Part) -> stream.Part:
    stripped = part.stripTies(inPlace=False)
    if not isinstance(stripped, stream.Part):
        raise ConversionError(
            "music21 could not preserve the stave while stripping ties"
        )
    return stripped


def note_events(part: stream.Part, staff_name: StaffName) -> list[NoteEvent]:
    events: list[NoteEvent] = []
    for element in part.recurse().notes:
        start = to_fraction(element.getOffsetInHierarchy(part))
        end = start + to_fraction(element.quarterLength)
        notes = element.notes if isinstance(element, chord.Chord) else (element,)
        for source_note in notes:
            if not isinstance(source_note, note.Note):
                continue
            realized_velocity = round(source_note.volume.realized * 127)
            velocity = max(0, min(127, realized_velocity))
            events.append(
                NoteEvent(
                    staff=staff_name,
                    start=start,
                    end=end,
                    midi=source_note.pitch.midi,
                    pitch_class=source_note.pitch.pitchClass,
                    pitch_name=normalize_pitch_name(source_note.pitch.name),
                    velocity=velocity,
                )
            )
    return sorted(events, key=lambda event: (event.start, event.midi, event.end))


def musical_measure_windows(
    treble: stream.Part,
    events: list[NoteEvent],
) -> list[MeasureWindow]:
    source_measures = list(treble.getElementsByClass(stream.Measure))
    active_indexes = [
        index
        for index, measure in enumerate(source_measures)
        if events_overlap(
            events,
            to_fraction(measure.offset),
            to_fraction(measure.offset) + 4,
        )
    ]
    if not active_indexes:
        raise ConversionError("The score does not contain any pitched notes")

    last_active_index = active_indexes[-1]
    for index in range(last_active_index + 1):
        measure = source_measures[index]
        start = to_fraction(measure.offset)
        if not events_overlap(events, start, start + 4):
            raise ConversionError(
                f"Internal empty measure {measure.number} is not supported"
            )

    return [
        MeasureWindow(
            source_number=int(measure.number),
            bar_index=bar_index,
            start=to_fraction(measure.offset),
            end=to_fraction(measure.offset) + 4,
        )
        for bar_index, measure in enumerate(source_measures[: last_active_index + 1])
    ]


def chord_candidates() -> list[ChordCandidate]:
    candidates: list[ChordCandidate] = []
    for root in generate.ROOTS:
        for spec in generate.chord_specs():
            profile = generate.build_profile(root, spec)
            midi = require_dict(profile, "midi")
            tones = require_list(profile, "tones")
            components = require_dict(profile, "components")
            omissions = components.get("omissions")
            alterations = components.get("alterations")
            if not isinstance(omissions, list):
                raise TypeError("Chord profile omissions must be a list")
            if not isinstance(alterations, list):
                raise TypeError("Chord profile alterations must be a list")

            root_name = require_string(profile, "root")
            bass_value = profile.get("bass")
            if bass_value is not None and not isinstance(bass_value, str):
                raise TypeError("Chord profile bass must be a string or null")
            root_pitch_class = require_int(midi, "rootPitchClass")
            bass_pitch_class_value = midi.get("bassPitchClass")
            if bass_pitch_class_value is not None and not isinstance(
                bass_pitch_class_value, int
            ):
                raise TypeError("Chord profile bass pitch class must be an integer")
            bass_pitch_class = (
                root_pitch_class
                if bass_pitch_class_value is None
                else bass_pitch_class_value
            )

            pitch_classes: set[int] = set()
            essential_pitch_classes: set[int] = set()
            tone_names: dict[int, set[str]] = {}
            for tone in tones:
                if not isinstance(tone, dict):
                    raise TypeError("Chord profile tone must be an object")
                pitch_class = require_int(tone, "pitchClass")
                pitch_classes.add(pitch_class)
                tone_names.setdefault(pitch_class, set()).add(
                    require_string(tone, "pitch")
                )
                if tone.get("importance") == "essential":
                    essential_pitch_classes.add(pitch_class)

            candidates.append(
                ChordCandidate(
                    profile_id=require_string(profile, "id"),
                    symbol=require_string(profile, "normalizedSymbol"),
                    root_name=root_name,
                    root_pitch_class=root_pitch_class,
                    bass_name=bass_value or root_name,
                    bass_pitch_class=bass_pitch_class,
                    pitch_classes=frozenset(pitch_classes),
                    essential_pitch_classes=frozenset(essential_pitch_classes),
                    tone_names={
                        pitch_class: frozenset(names)
                        for pitch_class, names in tone_names.items()
                    },
                    omission_count=len(omissions),
                    alteration_count=len(alterations),
                )
            )
    return candidates


def chord_ids_for_measure(
    measure: MeasureWindow,
    events: list[NoteEvent],
    candidates: list[ChordCandidate],
) -> tuple[str, str]:
    midpoint = measure.start + HALF_BAR_QUARTER_LENGTH
    if not has_midpoint_harmonic_attack(events, midpoint):
        whole = infer_chord(
            events,
            measure.start,
            measure.end,
            candidates,
            f"bar {measure.bar_index}",
        )
        return whole.profile_id, whole.profile_id

    first = infer_chord(
        events,
        measure.start,
        midpoint,
        candidates,
        f"bar {measure.bar_index} beat 0",
    )
    second = infer_chord(
        events,
        midpoint,
        measure.end,
        candidates,
        f"bar {measure.bar_index} beat 1",
    )
    return first.profile_id, second.profile_id


def infer_chord(
    events: list[NoteEvent],
    start: Fraction,
    end: Fraction,
    candidates: list[ChordCandidate],
    location: str,
) -> ChordCandidate:
    sounding = [event for event in events if event.start < end and event.end > start]
    if not sounding:
        raise ConversionError(f"{location} does not contain notes for chord analysis")
    observed_pitch_classes = frozenset(event.pitch_class for event in sounding)
    observed_names: dict[int, set[str]] = {}
    for event in sounding:
        observed_names.setdefault(event.pitch_class, set()).add(event.pitch_name)

    bass_events = [event for event in sounding if event.staff == "bass"]
    bass_event = min(bass_events or sounding, key=lambda event: event.midi)
    ranked: list[RankedChord] = []
    for candidate in candidates:
        missing_essential = candidate.essential_pitch_classes - observed_pitch_classes
        if missing_essential:
            continue
        foreign = observed_pitch_classes - candidate.pitch_classes
        missing = candidate.pitch_classes - observed_pitch_classes
        spelling_mismatches = sum(
            1
            for pitch_class in observed_pitch_classes & candidate.pitch_classes
            if not (
                observed_names.get(pitch_class, set())
                & candidate.tone_names.get(pitch_class, frozenset())
            )
        )
        score = (
            int(candidate.bass_pitch_class != bass_event.pitch_class),
            len(foreign),
            candidate.omission_count,
            candidate.alteration_count,
            len(missing),
            int(candidate.bass_name != bass_event.pitch_name) + spelling_mismatches,
            len(candidate.pitch_classes),
        )
        ranked.append(RankedChord(candidate=candidate, score=score))

    if not ranked:
        pitches = ", ".join(sorted({event.pitch_name for event in sounding}))
        raise ConversionError(
            f"{location} cannot be matched to a chord profile; observed {pitches}"
        )

    ranked.sort(key=lambda result: (result.score, result.candidate.profile_id))
    best = ranked[0]
    tied = [result for result in ranked if result.score == best.score]
    distinct_symbols = {result.candidate.symbol for result in tied}
    if len(distinct_symbols) > 1:
        pitches = ", ".join(sorted({event.pitch_name for event in sounding}))
        symbols = ", ".join(sorted(distinct_symbols))
        raise ConversionError(
            f"{location} has ambiguous chord analysis for {pitches}: {symbols}"
        )
    return best.candidate


def has_midpoint_harmonic_attack(
    events: list[NoteEvent],
    midpoint: Fraction,
) -> bool:
    attacks = [event for event in events if event.start == midpoint]
    if any(event.staff == "bass" for event in attacks):
        return True
    return len({event.pitch_class for event in attacks}) >= 2


def quantize_staff(events: list[NoteEvent], total_slots: int) -> QuantizedStaff:
    attacks_by_slot: list[list[tuple[NoteEvent, int]]] = [
        [] for _ in range(total_slots)
    ]
    for event in events:
        start_slot = slot_index(event.start, "note attack")
        end_slot = slot_index(event.end, "note end")
        if start_slot >= total_slots:
            continue
        end_slot = min(end_slot, total_slots)
        if end_slot <= start_slot:
            raise ConversionError(
                f"MIDI {event.midi} has no quantized duration at {event.start}"
            )
        attacks_by_slot[start_slot].append((event, end_slot))

    active_lanes: list[ActiveLane | None] = []
    arrangement: list[list[int | None]] = []
    velocity: list[list[int | None]] = []
    for current_slot, attacks in enumerate(attacks_by_slot):
        for lane_index, active in enumerate(active_lanes):
            if active is not None and active.end_slot <= current_slot:
                active_lanes[lane_index] = None
        if all(active is None for active in active_lanes):
            active_lanes = []

        pitch_slot: list[int | None] = [
            HOLD_VALUE if active is not None else None for active in active_lanes
        ]
        velocity_slot: list[int | None] = [None for _ in active_lanes]
        for event, end_slot in sorted(
            attacks,
            key=lambda value: (value[0].midi, value[1]),
        ):
            lane_index = next(
                (index for index, active in enumerate(active_lanes) if active is None),
                len(active_lanes),
            )
            if lane_index == len(active_lanes):
                active_lanes.append(None)
                pitch_slot.append(None)
                velocity_slot.append(None)
            active_lanes[lane_index] = ActiveLane(end_slot=end_slot)
            pitch_slot[lane_index] = event.midi
            velocity_slot[lane_index] = event.velocity

        if not pitch_slot:
            pitch_slot = [None]
            velocity_slot = [None]
        arrangement.append(pitch_slot)
        velocity.append(velocity_slot)

    return QuantizedStaff(arrangement=arrangement, velocity=velocity)


def events_overlap(
    events: list[NoteEvent],
    start: Fraction,
    end: Fraction,
) -> bool:
    return any(event.start < end and event.end > start for event in events)


def beat_id(pattern_id: str, bar_index: int, beat_index: int) -> str:
    return hashlib.sha256(f"{pattern_id}:{bar_index}:{beat_index}".encode()).hexdigest()


def slot_index(value: Fraction, label: str) -> int:
    require_grid_alignment(value, label)
    return int(value / STEP_QUARTER_LENGTH)


def require_grid_alignment(value: Fraction, label: str) -> None:
    if value % STEP_QUARTER_LENGTH != 0:
        raise ConversionError(
            f"{label} {value} is not aligned to the {STEP_QUARTER_LENGTH} grid"
        )


def to_fraction(value: Any) -> Fraction:
    if isinstance(value, Fraction):
        return value
    return Fraction(value)


def normalize_pitch_name(value: str) -> str:
    return value.replace("-", "b")


def key_name(value: key.Key) -> str:
    return f"{normalize_pitch_name(value.tonic.name)} {value.mode}"


def require_dict(value: JsonObject, field: str) -> JsonObject:
    result = value.get(field)
    if not isinstance(result, dict):
        raise TypeError(f"Chord profile {field} must be an object")
    return result


def require_list(value: JsonObject, field: str) -> list[Any]:
    result = value.get(field)
    if not isinstance(result, list):
        raise TypeError(f"Chord profile {field} must be a list")
    return result


def require_string(value: JsonObject, field: str) -> str:
    result = value.get(field)
    if not isinstance(result, str):
        raise TypeError(f"Chord profile {field} must be a string")
    return result


def require_int(value: JsonObject, field: str) -> int:
    result = value.get(field)
    if not isinstance(result, int):
        raise TypeError(f"Chord profile {field} must be an integer")
    return result
