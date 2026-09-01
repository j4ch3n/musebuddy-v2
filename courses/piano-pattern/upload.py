from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, TypeAlias

import click
from sqlalchemy import Column, ForeignKey, Integer, Text, create_engine
from sqlalchemy.dialects.postgresql import JSONB, insert
from sqlalchemy.orm import DeclarativeBase

COURSES_DIR = Path(__file__).resolve().parents[1]
if str(COURSES_DIR) not in sys.path:
    sys.path.insert(0, str(COURSES_DIR))

import course_environment


DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "output"
NOTES_SUFFIX = ".notes.json"
SCORES_SUFFIX = ".scores.json"

JsonObject: TypeAlias = dict[str, Any]


class Base(DeclarativeBase):
    pass


class PianoPattern(Base):
    __tablename__ = "piano_patterns"
    __table_args__ = {"schema": "public"}

    id = Column(Text, primary_key=True)
    name = Column(Text, nullable=True, default=None)
    time_signature = Column(Text, nullable=False)
    key_signature_display = Column(Text, nullable=False)
    progression_in_major_scale = Column(JSONB, nullable=False)
    progression_in_minor_scale = Column(JSONB, nullable=False)


class PianoPatternNote(Base):
    __tablename__ = "piano_pattern_notes"
    __table_args__ = {"schema": "public"}

    id = Column(Text, primary_key=True)
    pattern_id = Column(
        Text,
        ForeignKey("public.piano_patterns.id", ondelete="CASCADE"),
        nullable=False,
    )
    bar_index = Column(Integer, nullable=False)
    beat_index = Column(Integer, nullable=False)
    chord = Column(
        Text,
        ForeignKey("public.chord_profiles.id"),
        nullable=False,
    )
    treble_arrangement = Column(JSONB, nullable=False)
    treble_velocity = Column(JSONB, nullable=False)
    bass_arrangement = Column(JSONB, nullable=False)
    bass_velocity = Column(JSONB, nullable=False)


class PianoPatternScore(Base):
    __tablename__ = "piano_pattern_scores"
    __table_args__ = {"schema": "public"}

    pattern_id = Column(
        Text,
        ForeignKey("public.piano_patterns.id", ondelete="CASCADE"),
        primary_key=True,
    )
    format = Column(Text, nullable=False)
    format_version = Column(Integer, nullable=False)
    time_signature = Column(Text, nullable=False)
    key_signature = Column(Text, nullable=False)
    measures = Column(JSONB, nullable=False)
    ties = Column(JSONB, nullable=False)


@dataclass(frozen=True)
class UploadRows:
    patterns: list[JsonObject]
    notes: list[JsonObject]
    scores: list[JsonObject]


def expect_object(value: Any, context: str) -> JsonObject:
    if not isinstance(value, dict):
        raise ValueError(f"{context} must be an object")
    return value


def expect_list(value: Any, context: str) -> list[Any]:
    if not isinstance(value, list):
        raise ValueError(f"{context} must be an array")
    return value


def expect_str(value: Any, context: str) -> str:
    if not isinstance(value, str) or not value:
        raise ValueError(f"{context} must be a non-empty string")
    return value


def expect_int(value: Any, context: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{context} must be an integer")
    return value


def load_json(path: Path) -> JsonObject:
    try:
        return expect_object(json.loads(path.read_text(encoding="utf-8")), str(path))
    except json.JSONDecodeError as error:
        raise ValueError(f"{path} is not valid JSON: {error}") from error


def paths_by_stem(
    output_dir: Path,
    suffix: str,
) -> dict[str, Path]:
    paths: dict[str, Path] = {}
    for path in sorted(output_dir.rglob(f"*{suffix}")):
        relative_path = path.relative_to(output_dir).as_posix()
        stem = relative_path.removesuffix(suffix)
        if stem in paths:
            raise ValueError(
                f"More than one {suffix} file resolves to pattern stem {stem!r}"
            )
        paths[stem] = path
    return paths


def paired_paths(output_dir: Path) -> list[tuple[Path, Path]]:
    notes_paths = paths_by_stem(output_dir, NOTES_SUFFIX)
    scores_paths = paths_by_stem(output_dir, SCORES_SUFFIX)
    if not notes_paths and not scores_paths:
        raise ValueError(
            f"No {NOTES_SUFFIX} or {SCORES_SUFFIX} files found in {output_dir}"
        )

    missing_scores = sorted(set(notes_paths) - set(scores_paths))
    missing_notes = sorted(set(scores_paths) - set(notes_paths))
    if missing_scores or missing_notes:
        messages = []
        if missing_scores:
            messages.append(f"missing scores for: {', '.join(missing_scores)}")
        if missing_notes:
            messages.append(f"missing notes for: {', '.join(missing_notes)}")
        raise ValueError("; ".join(messages))

    return [(notes_paths[stem], scores_paths[stem]) for stem in sorted(notes_paths)]


def validate_slots(value: Any, context: str) -> list[Any]:
    slots = expect_list(value, context)
    if len(slots) != 32:
        raise ValueError(f"{context} must contain exactly 32 slots")
    for index, slot in enumerate(slots):
        expect_list(slot, f"{context}[{index}]")
    return slots


def note_rows(
    document: JsonObject,
    path: Path,
) -> tuple[JsonObject, list[JsonObject]]:
    pattern = expect_object(document.get("pattern"), f"{path}.pattern")
    pattern_id = expect_str(pattern.get("id"), f"{path}.pattern.id")
    time_signature = expect_str(
        pattern.get("time_signature"),
        f"{path}.pattern.time_signature",
    )
    if time_signature != "4/4":
        raise ValueError(f"{path}.pattern.time_signature must be '4/4'")
    key_signature_display = expect_str(
        pattern.get("key_signature_display"),
        f"{path}.pattern.key_signature_display",
    )

    pattern_row = {
        "id": pattern_id,
        "time_signature": time_signature,
        "key_signature_display": key_signature_display,
        "progression_in_major_scale": progression_value(
            pattern.get("progression_in_major_scale"),
            "major",
            f"{path}.pattern.progression_in_major_scale",
        ),
        "progression_in_minor_scale": progression_value(
            pattern.get("progression_in_minor_scale"),
            "minor",
            f"{path}.pattern.progression_in_minor_scale",
        ),
    }

    beats = expect_list(document.get("beats"), f"{path}.beats")
    if not beats:
        raise ValueError(f"{path}.beats must not be empty")
    rows: list[JsonObject] = []
    seen_positions: set[tuple[int, int]] = set()
    seen_ids: set[str] = set()
    for index, value in enumerate(beats):
        context = f"{path}.beats[{index}]"
        beat = expect_object(value, context)
        beat_id = expect_str(beat.get("id"), f"{context}.id")
        beat_pattern_id = expect_str(
            beat.get("pattern_id"),
            f"{context}.pattern_id",
        )
        if beat_pattern_id != pattern_id:
            raise ValueError(f"{context}.pattern_id does not match {pattern_id!r}")
        bar_index = expect_int(beat.get("bar_index"), f"{context}.bar_index")
        beat_index = expect_int(beat.get("beat_index"), f"{context}.beat_index")
        if bar_index < 0 or beat_index not in (0, 1):
            raise ValueError(f"{context} has an invalid bar or beat index")
        position = (bar_index, beat_index)
        if position in seen_positions:
            raise ValueError(f"{context} duplicates beat position {position}")
        if beat_id in seen_ids:
            raise ValueError(f"{context} duplicates note id {beat_id!r}")
        seen_positions.add(position)
        seen_ids.add(beat_id)

        staves = expect_object(beat.get("staves"), f"{context}.staves")
        if set(staves) != {"treble", "bass"}:
            raise ValueError(f"{context}.staves must contain treble and bass")
        stave_values: dict[str, tuple[list[Any], list[Any]]] = {}
        for stave_name in ("treble", "bass"):
            stave = expect_object(
                staves[stave_name],
                f"{context}.staves.{stave_name}",
            )
            arrangement = validate_slots(
                stave.get("arrangement"),
                f"{context}.staves.{stave_name}.arrangement",
            )
            velocity = validate_slots(
                stave.get("velocity"),
                f"{context}.staves.{stave_name}.velocity",
            )
            for slot_index, (notes, velocities) in enumerate(
                zip(arrangement, velocity, strict=True)
            ):
                if len(notes) != len(velocities):
                    raise ValueError(
                        f"{context}.staves.{stave_name} slot {slot_index} "
                        "has mismatched arrangement and velocity lanes"
                    )
            stave_values[stave_name] = (arrangement, velocity)

        rows.append(
            {
                "id": beat_id,
                "pattern_id": pattern_id,
                "bar_index": bar_index,
                "beat_index": beat_index,
                "chord": expect_str(beat.get("chord"), f"{context}.chord"),
                "treble_arrangement": stave_values["treble"][0],
                "treble_velocity": stave_values["treble"][1],
                "bass_arrangement": stave_values["bass"][0],
                "bass_velocity": stave_values["bass"][1],
            }
        )

    expected_positions = [
        (bar_index, beat_index)
        for bar_index in range((max(bar for bar, _beat in seen_positions) + 1))
        for beat_index in range(2)
    ]
    if sorted(seen_positions) != expected_positions:
        raise ValueError(f"{path}.beats must contain two consecutive beats per bar")
    return pattern_row, rows


def progression_value(value: Any, mode: str, context: str) -> JsonObject:
    progression = expect_object(value, context)
    if progression.get("mode") != mode:
        raise ValueError(f"{context}.mode must be {mode!r}")
    expect_str(progression.get("tonic"), f"{context}.tonic")
    index = expect_int(
        progression.get("tonic_circle_of_fifths_index"),
        f"{context}.tonic_circle_of_fifths_index",
    )
    if not 0 <= index <= 11:
        raise ValueError(f"{context}.tonic_circle_of_fifths_index must be 0 to 11")
    display = expect_list(progression.get("display"), f"{context}.display")
    if not display or any(not isinstance(item, str) or not item for item in display):
        raise ValueError(f"{context}.display must contain non-empty strings")
    active_indexes = expect_list(
        progression.get("active_circle_of_fifths_indices"),
        f"{context}.active_circle_of_fifths_indices",
    )
    if any(
        not isinstance(index, int) or isinstance(index, bool) or not 0 <= index <= 11
        for index in active_indexes
    ):
        raise ValueError(
            f"{context}.active_circle_of_fifths_indices must contain integers from 0 to 11"
        )
    if len(active_indexes) != len(set(active_indexes)):
        raise ValueError(f"{context}.active_circle_of_fifths_indices must be unique")
    return progression


def score_row(
    document: JsonObject,
    pattern: JsonObject,
    note_count: int,
    path: Path,
) -> JsonObject:
    format_name = expect_str(document.get("format"), f"{path}.format")
    if format_name != "vexflow":
        raise ValueError(f"{path}.format must be 'vexflow'")
    format_version = expect_int(
        document.get("format_version"),
        f"{path}.format_version",
    )
    if format_version <= 0:
        raise ValueError(f"{path}.format_version must be positive")
    time_signature = expect_str(
        document.get("time_signature"),
        f"{path}.time_signature",
    )
    if time_signature != pattern["time_signature"]:
        raise ValueError(f"{path}.time_signature does not match its notes file")
    key_signature = expect_str(
        document.get("key_signature"),
        f"{path}.key_signature",
    )
    major_progression = expect_object(
        pattern["progression_in_major_scale"],
        f"{path}.pattern.progression_in_major_scale",
    )
    expected_key = expect_str(
        major_progression.get("tonic"),
        f"{path}.pattern.progression_in_major_scale.tonic",
    )
    if key_signature != expected_key:
        raise ValueError(f"{path}.key_signature does not match its notes file")
    measures = expect_list(document.get("measures"), f"{path}.measures")
    ties = expect_list(document.get("ties"), f"{path}.ties")
    if len(measures) != note_count // 2:
        raise ValueError(f"{path}.measures does not match its notes file")
    for index, value in enumerate(measures):
        measure = expect_object(value, f"{path}.measures[{index}]")
        if expect_int(measure.get("index"), f"{path}.measures[{index}].index") != index:
            raise ValueError(f"{path}.measures indexes must be consecutive")

    return {
        "pattern_id": pattern["id"],
        "format": format_name,
        "format_version": format_version,
        "time_signature": time_signature,
        "key_signature": key_signature,
        "measures": measures,
        "ties": ties,
    }


def load_upload_rows(output_dir: Path) -> UploadRows:
    patterns: list[JsonObject] = []
    notes: list[JsonObject] = []
    scores: list[JsonObject] = []
    pattern_ids: set[str] = set()
    for notes_path, scores_path in paired_paths(output_dir):
        pattern, pattern_notes = note_rows(load_json(notes_path), notes_path)
        pattern_id = str(pattern["id"])
        if pattern_id in pattern_ids:
            raise ValueError(f"More than one file pair defines {pattern_id!r}")
        pattern_ids.add(pattern_id)
        patterns.append(pattern)
        notes.extend(pattern_notes)
        scores.append(
            score_row(
                load_json(scores_path),
                pattern,
                len(pattern_notes),
                scores_path,
            )
        )
    return UploadRows(patterns=patterns, notes=notes, scores=scores)


def upsert_statement(
    table: Any,
    rows: list[JsonObject],
    key: str,
    *,
    preserve_columns: frozenset[str] = frozenset(),
) -> Any:
    statement = insert(table).values(rows)
    update_values = {
        column.name: statement.excluded[column.name]
        for column in table.columns
        if column.name != key and column.name not in preserve_columns
    }
    return statement.on_conflict_do_update(
        index_elements=[table.c[key]],
        set_=update_values,
    )


def upload_rows(database_url: str, rows: UploadRows) -> None:
    engine = create_engine(database_url)
    pattern_ids = [row["id"] for row in rows.patterns]
    with engine.begin() as connection:
        connection.execute(
            upsert_statement(
                PianoPattern.__table__,
                rows.patterns,
                "id",
                preserve_columns=frozenset({"name"}),
            )
        )
        connection.execute(
            PianoPatternNote.__table__.delete().where(
                PianoPatternNote.__table__.c.pattern_id.in_(pattern_ids)
            )
        )
        connection.execute(insert(PianoPatternNote.__table__).values(rows.notes))
        connection.execute(
            upsert_statement(
                PianoPatternScore.__table__,
                rows.scores,
                "pattern_id",
            )
        )


@click.command()
@click.option(
    "--output-dir",
    type=click.Path(path_type=Path, file_okay=False, dir_okay=True, exists=True),
    default=DEFAULT_OUTPUT_DIR,
    show_default=True,
    help="Directory recursively scanned for paired notes and scores JSON files.",
)
@click.option(
    "--database-url",
    help="Supabase Postgres SQLAlchemy URL. Overrides the selected --remote-db env file.",
)
@click.option(
    "--remote-db",
    type=click.Choice(("local", "prod")),
    default="local",
    show_default=True,
    help="Named database environment file to load from courses/.env.local or courses/.env.prod.",
)
@click.option(
    "--dry-run",
    is_flag=True,
    help="Validate input files and print a summary without opening a database connection.",
)
def main(
    output_dir: Path,
    database_url: str | None,
    remote_db: course_environment.RemoteDb,
    dry_run: bool,
) -> None:
    database_url = course_environment.database_url(database_url, remote_db)
    try:
        rows = load_upload_rows(output_dir)
    except ValueError as error:
        raise click.ClickException(str(error)) from error

    if dry_run:
        click.echo(
            f"Validated {len(rows.patterns)} patterns, {len(rows.notes)} notes, "
            f"and {len(rows.scores)} scores from {output_dir}"
        )
        return

    if not database_url:
        raise click.ClickException(
            "SUPABASE_DATABASE_URL is required. Set it in the selected --remote-db "
            "env file or pass --database-url."
        )

    upload_rows(database_url, rows)
    click.echo(
        f"Upserted {len(rows.patterns)} patterns, {len(rows.notes)} notes, "
        f"and {len(rows.scores)} scores from {output_dir}"
    )


if __name__ == "__main__":
    main()
