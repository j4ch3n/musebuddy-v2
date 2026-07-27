from __future__ import annotations

import json
from dataclasses import dataclass
from fractions import Fraction
from pathlib import Path
from typing import Any, Literal, TypeAlias

from music21 import chord, converter, key, note, stream

from musicxml_to_json import (
    ConversionError,
    OUTPUT_DIR,
    StaffName,
    identify_staves,
    normalize_pitch_name,
    read_key_signature,
    to_fraction,
    validate_meter,
    validate_rhythm_grid,
)


JsonObject: TypeAlias = dict[str, Any]
TieType = Literal["start", "stop", "continue"]

TIME_SIGNATURE = "4/4"
FORMAT_VERSION = 1
DURATION_CODES = {
    "whole": "w",
    "half": "h",
    "quarter": "q",
    "eighth": "8",
    "16th": "16",
    "32nd": "32",
    "64th": "64",
}
REST_KEYS: dict[StaffName, str] = {
    "treble": "b/4",
    "bass": "d/3",
}
ACCIDENTAL_CODES = {
    "sharp": "#",
    "flat": "b",
    "natural": "n",
    "double-sharp": "##",
    "double-flat": "bb",
}


@dataclass(frozen=True)
class EventRef:
    event_id: str
    key_index: int


@dataclass(frozen=True)
class SerializedEvent:
    value: JsonObject
    beam_type: str | None
    ties: tuple[tuple[str, TieType | None, int], ...]


def convert_musicxml_to_scores(input_path: Path) -> Path:
    document = build_vexflow_document(input_path)
    output_path = scores_output_path_for(input_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(document, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )
    return output_path


def build_vexflow_document(input_path: Path) -> JsonObject:
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
    validate_rhythm_grid(parts)
    fifths = read_key_signature(parts)
    measure_count = musical_measure_count(parts)
    pending_ties: dict[tuple[StaffName, str, str], EventRef] = {}
    ties: list[JsonObject] = []
    measures: list[JsonObject] = []

    staff_measures = {
        staff_name: list(part.getElementsByClass(stream.Measure))[:measure_count]
        for staff_name, part in parts.items()
    }
    for measure_index in range(measure_count):
        beams: list[JsonObject] = []
        serialized_staves: JsonObject = {}
        for staff_name in ("treble", "bass"):
            measure = staff_measures[staff_name][measure_index]
            voices = serialize_measure_voices(
                measure=measure,
                measure_index=measure_index,
                staff_name=staff_name,
                pending_ties=pending_ties,
                ties=ties,
                beams=beams,
            )
            serialized_staves[staff_name] = {
                "clef": staff_name,
                "voices": voices,
            }
        measures.append(
            {
                "index": measure_index,
                "staves": serialized_staves,
                "beams": beams,
            }
        )

    if pending_ties:
        descriptions = ", ".join(
            f"{staff} voice {voice} {pitch}"
            for staff, voice, pitch in sorted(pending_ties)
        )
        raise ConversionError(f"Unresolved tie start(s): {descriptions}")

    major_key = key.KeySignature(fifths).asKey("major")
    return {
        "format": "vexflow",
        "format_version": FORMAT_VERSION,
        "time_signature": TIME_SIGNATURE,
        "key_signature": normalize_pitch_name(major_key.tonic.name),
        "measures": measures,
        "ties": ties,
    }


def scores_output_path_for(input_path: Path) -> Path:
    return OUTPUT_DIR / f"{input_path.stem}.scores.json"


def musical_measure_count(parts: dict[StaffName, stream.Part]) -> int:
    measures_by_staff = {
        staff_name: list(part.getElementsByClass(stream.Measure))
        for staff_name, part in parts.items()
    }
    last_active_index = -1
    for index, (treble, bass) in enumerate(
        zip(
            measures_by_staff["treble"],
            measures_by_staff["bass"],
            strict=True,
        )
    ):
        if treble.recurse().notes or bass.recurse().notes:
            last_active_index = index
    if last_active_index < 0:
        raise ConversionError("The score does not contain any pitched notes")

    for index in range(last_active_index + 1):
        treble = measures_by_staff["treble"][index]
        bass = measures_by_staff["bass"][index]
        if not treble.recurse().notes and not bass.recurse().notes:
            raise ConversionError(
                f"Internal empty measure {treble.number} is not supported"
            )
    return last_active_index + 1


def serialize_measure_voices(
    *,
    measure: stream.Measure,
    measure_index: int,
    staff_name: StaffName,
    pending_ties: dict[tuple[StaffName, str, str], EventRef],
    ties: list[JsonObject],
    beams: list[JsonObject],
) -> list[JsonObject]:
    source_voices = list(measure.getElementsByClass(stream.Voice))
    voice_containers: list[tuple[str, stream.Stream]]
    if source_voices:
        voice_containers = [
            (str(source_voice.id), source_voice) for source_voice in source_voices
        ]
    else:
        voice_containers = [("1", measure)]

    serialized_voices: list[JsonObject] = []
    for voice_id, container in voice_containers:
        elements = list(container.notesAndRests)
        duration = sum(
            (to_fraction(element.quarterLength) for element in elements),
            start=Fraction(0),
        )
        if duration != 4:
            raise ConversionError(
                f"Measure {measure.number} {staff_name} voice {voice_id} "
                f"has duration {duration}, expected 4"
            )

        serialized_events: list[SerializedEvent] = []
        for event_index, element in enumerate(elements):
            event_id = f"m{measure_index}-{staff_name}-v{voice_id}-e{event_index}"
            serialized = serialize_event(element, event_id, staff_name)
            serialized_events.append(serialized)
            connect_event_ties(
                serialized,
                staff_name,
                voice_id,
                pending_ties,
                ties,
            )

        beams.extend(
            serialize_beams(
                serialized_events,
                staff_name=staff_name,
                voice_id=voice_id,
                measure_number=measure.number,
            )
        )
        serialized_voices.append(
            {
                "id": voice_id,
                "events": [event.value for event in serialized_events],
            }
        )
    return serialized_voices


def serialize_event(
    element: note.GeneralNote,
    event_id: str,
    staff_name: StaffName,
) -> SerializedEvent:
    duration_type = element.duration.type
    duration = DURATION_CODES.get(duration_type)
    if duration is None:
        raise ConversionError(
            f"Event {event_id} uses unsupported duration {duration_type!r}"
        )
    dots = element.duration.dots
    if dots not in (0, 1, 2, 3):
        raise ConversionError(f"Event {event_id} has unsupported dot count {dots}")

    if isinstance(element, note.Rest):
        keys = [REST_KEYS[staff_name]]
        accidentals: list[str | None] = [None]
        event_type = "rest"
        ties: tuple[tuple[str, TieType | None, int], ...] = ()
    else:
        source_notes = (
            tuple(element.notes) if isinstance(element, chord.Chord) else (element,)
        )
        keys = [vexflow_key(source_note.pitch) for source_note in source_notes]
        accidentals = [
            displayed_accidental(source_note.pitch.accidental)
            for source_note in source_notes
        ]
        event_type = "note"
        ties = tuple(
            (
                key_value,
                tie_type_for(source_note, element),
                key_index,
            )
            for key_index, (key_value, source_note) in enumerate(
                zip(keys, source_notes, strict=True)
            )
        )

    stem_direction = getattr(element, "stemDirection", None)
    if stem_direction not in ("up", "down"):
        stem_direction = None
    return SerializedEvent(
        value={
            "id": event_id,
            "type": event_type,
            "keys": keys,
            "duration": duration,
            "dots": dots,
            "accidentals": accidentals,
            "stem_direction": stem_direction,
        },
        beam_type=primary_beam_type(element),
        ties=ties,
    )


def connect_event_ties(
    event: SerializedEvent,
    staff_name: StaffName,
    voice_id: str,
    pending_ties: dict[tuple[StaffName, str, str], EventRef],
    ties: list[JsonObject],
) -> None:
    event_id = event.value["id"]
    if not isinstance(event_id, str):
        raise TypeError("Serialized event id must be a string")
    for pitch_key, tie_type, key_index in event.ties:
        tie_key = (staff_name, voice_id, pitch_key)
        current = EventRef(event_id=event_id, key_index=key_index)
        if tie_type in ("stop", "continue"):
            previous = pending_ties.pop(tie_key, None)
            if previous is None:
                raise ConversionError(
                    f"Tie stop without start at {event_id} pitch {pitch_key}"
                )
            ties.append(
                {
                    "from": {
                        "event_id": previous.event_id,
                        "key_index": previous.key_index,
                    },
                    "to": {
                        "event_id": current.event_id,
                        "key_index": current.key_index,
                    },
                }
            )
        if tie_type in ("start", "continue"):
            if tie_key in pending_ties:
                raise ConversionError(
                    f"Duplicate tie start at {event_id} pitch {pitch_key}"
                )
            pending_ties[tie_key] = current


def serialize_beams(
    events: list[SerializedEvent],
    *,
    staff_name: StaffName,
    voice_id: str,
    measure_number: int | str,
) -> list[JsonObject]:
    beams: list[JsonObject] = []
    current: list[str] = []
    for event in events:
        event_id = event.value["id"]
        if not isinstance(event_id, str):
            raise TypeError("Serialized event id must be a string")
        if event.beam_type == "start":
            if current:
                raise ConversionError(
                    f"Nested beam start in measure {measure_number} "
                    f"{staff_name} voice {voice_id}"
                )
            current = [event_id]
        elif event.beam_type == "continue":
            if not current:
                raise ConversionError(f"Beam continuation without start at {event_id}")
            current.append(event_id)
        elif event.beam_type == "stop":
            if not current:
                raise ConversionError(f"Beam stop without start at {event_id}")
            current.append(event_id)
            beams.append(
                {
                    "staff": staff_name,
                    "voice_id": voice_id,
                    "event_ids": current,
                }
            )
            current = []
    if current:
        raise ConversionError(
            f"Unresolved beam in measure {measure_number} {staff_name} voice {voice_id}"
        )
    return beams


def vexflow_key(value: Any) -> str:
    name = normalize_pitch_name(value.name).lower()
    return f"{name}/{value.octave}"


def displayed_accidental(value: Any) -> str | None:
    if value is None or value.displayStatus is not True:
        return None
    code = ACCIDENTAL_CODES.get(value.name)
    if code is None:
        raise ConversionError(f"Unsupported accidental {value.name!r}")
    return code


def tie_type_for(
    source_note: note.Note,
    element: note.GeneralNote,
) -> TieType | None:
    tie = source_note.tie or element.tie
    if tie is None:
        return None
    if tie.type not in ("start", "stop", "continue"):
        raise ConversionError(f"Unsupported tie type {tie.type!r}")
    return tie.type


def primary_beam_type(element: note.GeneralNote) -> str | None:
    beams = getattr(element, "beams", None)
    if beams is None:
        return None
    try:
        beam = beams.getByNumber(1)
    except IndexError:
        return None
    if beam is None or beam.type == "partial":
        return None
    return beam.type
