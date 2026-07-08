from __future__ import annotations

import csv
import hashlib
import logging
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, TypeAlias

import mir_eval.chord
import music21.pitch
import pretty_midi

COURSES_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = COURSES_DIR.parent
DEFAULT_DATASET_ROOT = COURSES_DIR / "companion" / "data" / "POP909-Dataset" / "POP909"
RUN_LOG_PATH = COURSES_DIR / "companion" / "run.log"

if str(COURSES_DIR) not in sys.path:
    sys.path.insert(0, str(COURSES_DIR))

import course_environment
from chord_dictionary import generate

JsonValue: TypeAlias = dict[str, Any] | list[Any] | str | int | float | bool | None
Slot: TypeAlias = list[int | None]
Arrangement: TypeAlias = list[Slot]

TABLE_BEAT_MARKER = 1.0
DOWNBEAT_MARKER = 1.0
TABLE_BEATS_PER_BAR = 2
STEPS_PER_TABLE_BEAT = 32
HOLD_VALUE = -50
TIME_SIGNATURE = "4/4"
EPSILON = 1e-6


@dataclass(frozen=True)
class SongMetadata:
    dataset_song_id: str
    song_id: str
    name: str
    artist: str
    time_signature: str


@dataclass(frozen=True)
class BeatBoundary:
    time: float
    is_downbeat: bool


@dataclass(frozen=True)
class BeatWindow:
    logical_index: int
    bar_index: int
    beat_index: int
    start: float
    end: float


@dataclass(frozen=True)
class ChordSpan:
    start: float
    end: float
    label: str


@dataclass(frozen=True)
class BeatRow:
    id: str
    song_id: str
    bar_index: int
    beat_index: int
    arrangement: Arrangement
    velocity: Arrangement
    chord: str


@dataclass(frozen=True)
class ProcessedSong:
    metadata: SongMetadata
    rows: list[BeatRow]
    skipped_note_count: int
    audio_key_summary: str | None


def load_environment(remote_db: course_environment.RemoteDb | None = None) -> None:
    course_environment.load_environment(remote_db)


def database_url(
    option_value: str | None,
    remote_db: course_environment.RemoteDb | None = None,
) -> str | None:
    return course_environment.database_url(option_value, remote_db)


def configure_logging() -> None:
    RUN_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        filename=RUN_LOG_PATH,
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        force=True,
    )


def read_index(dataset_root: Path, song_limit: int | None = None) -> list[SongMetadata]:
    index_path = dataset_root / "index.csv"
    rows: list[SongMetadata] = []
    with index_path.open(newline="", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        for row in reader:
            dataset_song_id = require_field(row, "song_id")
            beats_per_measure = int(require_field(row, "num_beats_per_measure"))
            quavers_per_beat = int(require_field(row, "num_quavers_per_beat"))
            if beats_per_measure != 2 or quavers_per_beat != 2:
                logging.info(
                    "Skipping POP909/%s because meter fields are %s/%s",
                    dataset_song_id,
                    beats_per_measure,
                    quavers_per_beat,
                )
                continue
            rows.append(
                SongMetadata(
                    dataset_song_id=dataset_song_id,
                    song_id=f"POP909/{dataset_song_id}",
                    name=require_field(row, "name"),
                    artist=require_field(row, "artist"),
                    time_signature=TIME_SIGNATURE,
                )
            )
            if song_limit is not None and len(rows) >= song_limit:
                break
    return rows


def filter_songs_by_id(
    songs: list[SongMetadata], song_ids: tuple[str, ...]
) -> list[SongMetadata]:
    if not song_ids:
        return songs

    normalized_ids = {song_id.removeprefix("POP909/") for song_id in song_ids}
    selected = [song for song in songs if song.dataset_song_id in normalized_ids]
    found_ids = {song.dataset_song_id for song in selected}
    missing_ids = sorted(normalized_ids - found_ids)
    if missing_ids:
        raise ValueError(
            f"Song id(s) not found in supported POP909 index rows: {', '.join(missing_ids)}"
        )
    return selected


def require_field(row: dict[str, str], key: str) -> str:
    value = row.get(key)
    if value is None or value == "":
        raise ValueError(f"index.csv row is missing {key}")
    return value


def song_dir(dataset_root: Path, metadata: SongMetadata) -> Path:
    return dataset_root / metadata.dataset_song_id


def parse_beat_midi(path: Path) -> list[BeatBoundary]:
    boundaries: list[BeatBoundary] = []
    for line_number, line in enumerate(
        path.read_text(encoding="utf-8").splitlines(), start=1
    ):
        if not line.strip():
            continue
        parts = line.split()
        if len(parts) < 3:
            raise ValueError(f"{path}:{line_number} expected at least 3 columns")
        marker = float(parts[1])
        if marker == TABLE_BEAT_MARKER:
            boundaries.append(
                BeatBoundary(
                    time=float(parts[0]), is_downbeat=float(parts[2]) == DOWNBEAT_MARKER
                )
            )
    if len(boundaries) < 2:
        raise ValueError(f"{path} does not contain enough table beat boundaries")
    return boundaries


def beat_windows(boundaries: list[BeatBoundary]) -> list[BeatWindow]:
    start_index = 0
    for index, boundary in enumerate(boundaries):
        if boundary.is_downbeat:
            start_index = index
            if index:
                logging.info(
                    "Skipping %s pickup table beat(s) before first complete bar", index
                )
            break

    windows: list[BeatWindow] = []
    logical_index = 0
    for index in range(start_index, len(boundaries) - 1):
        windows.append(
            BeatWindow(
                logical_index=logical_index,
                bar_index=logical_index // TABLE_BEATS_PER_BAR,
                beat_index=logical_index % TABLE_BEATS_PER_BAR,
                start=boundaries[index].time,
                end=boundaries[index + 1].time,
            )
        )
        logical_index += 1
    return windows


def parse_chord_midi(path: Path) -> list[ChordSpan]:
    spans: list[ChordSpan] = []
    for line_number, line in enumerate(
        path.read_text(encoding="utf-8").splitlines(), start=1
    ):
        if not line.strip():
            continue
        parts = line.split()
        if len(parts) < 3:
            raise ValueError(f"{path}:{line_number} expected at least 3 columns")
        label = parts[2]
        mir_eval.chord.encode(label)
        spans.append(ChordSpan(start=float(parts[0]), end=float(parts[1]), label=label))
    return spans


def chord_for_window(window: BeatWindow, spans: list[ChordSpan]) -> str:
    midpoint = window.start + ((window.end - window.start) / 2)
    for span in spans:
        if span.start - EPSILON <= midpoint < span.end - EPSILON:
            return span.label
    for span in spans:
        if span.start - EPSILON <= window.start < span.end - EPSILON:
            return span.label
    return "N"


def generated_chord_lookup() -> dict[tuple[int, tuple[int, ...], int], str]:
    lookup: dict[tuple[int, tuple[int, ...], int], str] = {}
    for root in generate.ROOTS:
        for spec in generate.chord_specs():
            profile = generate.build_profile(root, spec)
            midi = profile["midi"]
            if not isinstance(midi, dict):
                raise TypeError("Generated chord profile midi field must be an object")
            root_pc = int(midi["rootPitchClass"])
            pitch_classes = midi["pitchClasses"]
            if not isinstance(pitch_classes, list):
                raise TypeError("Generated chord profile pitch classes must be a list")
            relative = tuple(sorted((int(pc) - root_pc) % 12 for pc in pitch_classes))
            bass_pc = midi["bassPitchClass"]
            bass_interval = 0 if bass_pc is None else (int(bass_pc) - root_pc) % 12
            profile_id = profile["id"]
            if not isinstance(profile_id, str):
                raise TypeError("Generated chord profile id must be a string")
            lookup[(root_pc, relative, bass_interval)] = profile_id
    return lookup


def chord_profile_id(
    label: str, lookup: dict[tuple[int, tuple[int, ...], int], str]
) -> str | None:
    if label == "N":
        return None
    root_number, chroma, bass_number = mir_eval.chord.encode(label)
    if root_number < 0:
        return None
    relative = tuple(
        index for index, value in enumerate(chroma.tolist()) if int(value) == 1
    )
    exact_key = (int(root_number), relative, int(bass_number))
    exact_match = lookup.get(exact_key)
    if exact_match is not None:
        return exact_match

    base_match = lookup.get((int(root_number), relative, 0))
    if base_match is not None:
        logging.info(
            "Mapped POP909 chord %s to base chord profile %s", label, base_match
        )
        return base_match

    root, quality, extensions, _bass = mir_eval.chord.split(label)
    if quality == "sus4" and extensions == {"b7"}:
        sus4_chroma = tuple(index for index in relative if index != 10)
        sus4_match = lookup.get((int(root_number), sus4_chroma, 0))
        if sus4_match is not None:
            logging.info(
                "Mapped POP909 chord %s to suspended-fourth profile %s",
                label,
                sus4_match,
            )
            return sus4_match

    return None


def piano_instrument(
    midi: pretty_midi.PrettyMIDI, midi_path: Path
) -> pretty_midi.Instrument:
    matches = [
        instrument
        for instrument in midi.instruments
        if instrument.name.strip().upper() == "PIANO" and not instrument.is_drum
    ]
    if not matches:
        raise ValueError(
            f"{midi_path} does not contain a non-drum instrument named PIANO"
        )
    if len(matches) > 1:
        logging.info(
            "%s contains %s PIANO instruments; using the first", midi_path, len(matches)
        )
    return matches[0]


@dataclass
class ActiveNote:
    pitch: int
    end: float


@dataclass(frozen=True)
class QuantizedNote:
    pitch: int
    velocity: int
    start: float
    end: float
    slot_index: int


def quantize_window(
    notes: list[pretty_midi.Note],
    window: BeatWindow,
) -> tuple[Arrangement, Arrangement, int]:
    step_duration = (window.end - window.start) / STEPS_PER_TABLE_BEAT
    attacks_by_slot: list[list[QuantizedNote]] = [
        [] for _ in range(STEPS_PER_TABLE_BEAT)
    ]
    skipped = 0
    for note in notes:
        if not (window.start - EPSILON <= note.start < window.end - EPSILON):
            continue
        slot_index = round((note.start - window.start) / step_duration)
        if slot_index < 0 or slot_index >= STEPS_PER_TABLE_BEAT:
            skipped += 1
            continue
        attacks_by_slot[slot_index].append(
            QuantizedNote(
                pitch=music21.pitch.Pitch(midi=note.pitch).midi,
                velocity=note.velocity,
                start=note.start,
                end=note.end,
                slot_index=slot_index,
            )
        )

    active_lanes: list[ActiveNote | None] = []
    arrangement: Arrangement = []
    velocity: Arrangement = []

    for slot_index, attacks in enumerate(attacks_by_slot):
        slot_start = window.start + (step_duration * slot_index)
        for lane_index, active in enumerate(active_lanes):
            if active is not None and active.end <= slot_start + EPSILON:
                active_lanes[lane_index] = None
        if all(active is None for active in active_lanes):
            active_lanes = []

        pitch_slot: Slot = [
            HOLD_VALUE if active is not None else None for active in active_lanes
        ]
        velocity_slot: Slot = [None for _ in active_lanes]

        for attack in sorted(attacks, key=lambda value: value.pitch):
            lane_index = next(
                (index for index, active in enumerate(active_lanes) if active is None),
                len(active_lanes),
            )
            if lane_index == len(active_lanes):
                active_lanes.append(None)
                pitch_slot.append(None)
                velocity_slot.append(None)
            active_lanes[lane_index] = ActiveNote(pitch=attack.pitch, end=attack.end)
            pitch_slot[lane_index] = attack.pitch
            velocity_slot[lane_index] = attack.velocity

        if not pitch_slot:
            pitch_slot = [None]
            velocity_slot = [None]

        arrangement.append(pitch_slot)
        velocity.append(velocity_slot)

    return arrangement, velocity, skipped


def row_id(song_id: str, bar_index: int, beat_index: int) -> str:
    return hashlib.sha256(
        f"{song_id}:{bar_index}:{beat_index}".encode("utf-8")
    ).hexdigest()


def load_audio_key_summary(directory: Path) -> str | None:
    beat_audio_path = directory / "beat_audio.txt"
    key_audio_path = directory / "key_audio.txt"
    if not beat_audio_path.exists() or not key_audio_path.exists():
        return None
    beat_lines = [
        line
        for line in beat_audio_path.read_text(encoding="utf-8").splitlines()
        if line
    ]
    key_lines = [
        line for line in key_audio_path.read_text(encoding="utf-8").splitlines() if line
    ]
    if not beat_lines or not key_lines:
        return None
    return f"{len(beat_lines)} audio beat markers; key span: {key_lines[0]}"


def process_song(
    dataset_root: Path,
    metadata: SongMetadata,
    chord_lookup: dict[tuple[int, tuple[int, ...], int], str] | None = None,
) -> ProcessedSong:
    chord_lookup = chord_lookup or generated_chord_lookup()
    directory = song_dir(dataset_root, metadata)
    midi_path = directory / f"{metadata.dataset_song_id}.mid"
    windows = beat_windows(parse_beat_midi(directory / "beat_midi.txt"))
    chord_spans = parse_chord_midi(directory / "chord_midi.txt")
    midi = pretty_midi.PrettyMIDI(str(midi_path))
    piano = piano_instrument(midi, midi_path)
    notes = sorted(piano.notes, key=lambda note: (note.start, note.pitch, note.end))

    first_start = windows[0].start if windows else 0
    pickup_notes = sum(1 for note in notes if note.start < first_start - EPSILON)
    if pickup_notes:
        logging.info(
            "Skipping %s pickup PIANO note(s) for %s", pickup_notes, metadata.song_id
        )

    rows: list[BeatRow] = []
    skipped_note_count = pickup_notes
    for window in windows:
        label = chord_for_window(window, chord_spans)
        profile_id = chord_profile_id(label, chord_lookup)
        if label != "N" and profile_id is None:
            raise ValueError(
                f"{metadata.song_id} chord {label!r} cannot be linked to chord_profiles"
            )
        if profile_id is None:
            continue
        arrangement, velocity, skipped = quantize_window(notes, window)
        skipped_note_count += skipped
        rows.append(
            BeatRow(
                id=row_id(metadata.song_id, window.bar_index, window.beat_index),
                song_id=metadata.song_id,
                bar_index=window.bar_index,
                beat_index=window.beat_index,
                arrangement=arrangement,
                velocity=velocity,
                chord=profile_id,
            )
        )

    return ProcessedSong(
        metadata=metadata,
        rows=rows,
        skipped_note_count=skipped_note_count,
        audio_key_summary=load_audio_key_summary(directory),
    )


def beat_row_to_dict(row: BeatRow) -> dict[str, Any]:
    return {
        "id": row.id,
        "song_id": row.song_id,
        "bar_index": row.bar_index,
        "beat_index": row.beat_index,
        "arrangement": row.arrangement,
        "velocity": row.velocity,
        "chord": row.chord,
    }


def song_to_dict(metadata: SongMetadata) -> dict[str, str]:
    return {
        "id": metadata.song_id,
        "name": metadata.name,
        "artist": metadata.artist,
        "time_signature": metadata.time_signature,
    }


def count_positive_attacks(arrangement: Arrangement) -> int:
    return sum(
        1
        for slot in arrangement
        for value in slot
        if isinstance(value, int) and value > 0
    )


def validate_arrangement_shape(
    arrangement: JsonValue, velocity: JsonValue
) -> list[str]:
    errors: list[str] = []
    if not isinstance(arrangement, list) or not isinstance(velocity, list):
        return ["arrangement and velocity must be lists"]
    if len(arrangement) != STEPS_PER_TABLE_BEAT:
        errors.append(f"arrangement has {len(arrangement)} slots")
    if len(velocity) != STEPS_PER_TABLE_BEAT:
        errors.append(f"velocity has {len(velocity)} slots")
    for index, (arrangement_slot, velocity_slot) in enumerate(
        zip(arrangement, velocity)
    ):
        if not isinstance(arrangement_slot, list) or not isinstance(
            velocity_slot, list
        ):
            errors.append(f"slot {index} is not a nested list")
            continue
        if len(arrangement_slot) != len(velocity_slot):
            errors.append(f"slot {index} arrangement/velocity lane lengths differ")
    return errors
