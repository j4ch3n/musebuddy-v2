from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, TypeAlias

import click
from sqlalchemy import Column, Text, create_engine
from sqlalchemy.dialects.postgresql import JSONB, insert
from sqlalchemy.orm import DeclarativeBase, Session

COURSES_DIR = Path(__file__).resolve().parents[1]
if str(COURSES_DIR) not in sys.path:
    sys.path.insert(0, str(COURSES_DIR))

import course_environment


DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "output"

JsonObject: TypeAlias = dict[str, Any]


class Base(DeclarativeBase):
    pass


DISPLAY_TOKEN_TYPES = {
    "root",
    "quality",
    "extension",
    "alteration",
    "addition",
    "omission",
    "bass",
    "separator",
}
TEACHING_ROLES = {"anchor", "quality", "guide", "color", "voicing"}
VOICING_ROLES = {"required", "optional", "omitted"}
PIANO_HANDS = {"left", "right"}


class ChordProfile(Base):
    __tablename__ = "chord_profiles"
    __table_args__ = {"schema": "public"}

    id = Column(Text, primary_key=True)
    normalizedSymbol = Column("normalizedSymbol", Text, nullable=False)
    root = Column(Text, nullable=False)
    bass = Column(Text, nullable=True)
    displayTokens = Column("displayTokens", JSONB, nullable=False)
    tones = Column(JSONB, nullable=False)


def expect_object(value: Any, context: str) -> JsonObject:
    if not isinstance(value, dict):
        raise ValueError(f"{context} must be an object")
    return value


def expect_list(value: Any, context: str) -> list[Any]:
    if not isinstance(value, list):
        raise ValueError(f"{context} must be a list")
    return value


def expect_str(value: Any, context: str) -> str:
    if not isinstance(value, str):
        raise ValueError(f"{context} must be a string")
    return value


def expect_int(value: Any, context: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{context} must be an integer")
    return value


def validate_enum(value: str, allowed_values: set[str], context: str) -> None:
    if value not in allowed_values:
        expected = ", ".join(sorted(allowed_values))
        raise ValueError(
            f"{context} has unsupported value {value!r}; expected one of: {expected}"
        )


def validate_pitch_class(value: int, context: str) -> None:
    if not 0 <= value <= 11:
        raise ValueError(f"{context} must be between 0 and 11")


def validate_display_tokens(tokens: list[Any]) -> None:
    for index, item in enumerate(tokens):
        token = expect_object(item, f"displayTokens[{index}]")
        validate_enum(
            expect_str(token.get("type"), f"displayTokens[{index}].type"),
            DISPLAY_TOKEN_TYPES,
            f"displayTokens[{index}].type",
        )
        expect_str(token.get("value"), f"displayTokens[{index}].value")
        teaching_role = token.get("teachingRole")
        if teaching_role is not None:
            validate_enum(
                expect_str(teaching_role, f"displayTokens[{index}].teachingRole"),
                TEACHING_ROLES,
                f"displayTokens[{index}].teachingRole",
            )


def validate_tones(tones: list[Any], context: str) -> None:
    if not tones:
        raise ValueError(f"{context} must not be empty")
    bass_count = 0
    fingers_by_hand: dict[str, set[int]] = {"left": set(), "right": set()}
    for index, item in enumerate(tones):
        tone = expect_object(item, f"{context}[{index}]")
        if set(tone) != {
            "degree",
            "pitch",
            "pitchClass",
            "teachingRole",
            "voicingRole",
            "isBass",
            "hand",
            "finger",
        }:
            raise ValueError(
                f"{context}[{index}] must contain only canonical tone fields"
            )
        expect_str(tone.get("degree"), f"{context}[{index}].degree")
        expect_str(tone.get("pitch"), f"{context}[{index}].pitch")
        validate_pitch_class(
            expect_int(tone.get("pitchClass"), f"{context}[{index}].pitchClass"),
            f"{context}[{index}].pitchClass",
        )
        validate_enum(
            expect_str(tone.get("teachingRole"), f"{context}[{index}].teachingRole"),
            TEACHING_ROLES,
            f"{context}[{index}].teachingRole",
        )
        validate_enum(
            expect_str(tone.get("voicingRole"), f"{context}[{index}].voicingRole"),
            VOICING_ROLES,
            f"{context}[{index}].voicingRole",
        )
        is_bass = tone.get("isBass")
        if not isinstance(is_bass, bool):
            raise ValueError(f"{context}[{index}].isBass must be a boolean")
        bass_count += int(is_bass)
        hand = tone.get("hand")
        finger = tone.get("finger")
        if tone.get("voicingRole") == "omitted":
            if hand is not None or finger is not None:
                raise ValueError(
                    f"{context}[{index}] omitted tones must not have a fingering"
                )
        else:
            validate_enum(
                expect_str(hand, f"{context}[{index}].hand"),
                PIANO_HANDS,
                f"{context}[{index}].hand",
            )
            if finger not in {1, 2, 3, 4, 5}:
                raise ValueError(f"{context}[{index}].finger must be between 1 and 5")
            if finger in fingers_by_hand[hand]:
                raise ValueError(
                    f"{context}[{index}].finger duplicates another {hand} hand tone"
                )
            fingers_by_hand[hand].add(finger)
            expected_hand = (
                "left"
                if is_bass
                or tone.get("degree") == "1"
                or tone.get("teachingRole") == "voicing"
                else "right"
            )
            if hand != expected_hand:
                raise ValueError(
                    f"{context}[{index}].hand must be {expected_hand} for this teaching role"
                )
    if bass_count != 1:
        raise ValueError(f"{context} must contain exactly one bass tone")


def load_profile(path: Path) -> dict[str, Any]:
    try:
        profile = expect_object(json.loads(path.read_text(encoding="utf-8")), str(path))
        profile_id = expect_str(profile.get("id"), f"{path}.id")
        if profile_id != path.stem:
            raise ValueError(f"{path}.id must match file name stem {path.stem!r}")

        normalized_symbol = expect_str(
            profile.get("normalizedSymbol"), f"{path}.normalizedSymbol"
        )
        root = expect_str(profile.get("root"), f"{path}.root")
        bass_value = profile.get("bass")
        if bass_value is not None:
            expect_str(bass_value, f"{path}.bass")
        display_tokens = expect_list(
            profile.get("displayTokens"), f"{path}.displayTokens"
        )
        validate_display_tokens(display_tokens)

        tones = expect_list(profile.get("tones"), f"{path}.tones")
        validate_tones(tones, f"{path}.tones")

        return {
            "id": path.stem,
            "normalizedSymbol": normalized_symbol,
            "root": root,
            "bass": bass_value,
            "displayTokens": display_tokens,
            "tones": tones,
        }
    except json.JSONDecodeError as error:
        raise ValueError(f"{path} is not valid JSON: {error}") from error


def load_profiles(output_dir: Path) -> list[dict[str, Any]]:
    paths = sorted(output_dir.glob("*.json"))
    if not paths:
        raise click.ClickException(f"No JSON files found in {output_dir}")
    return [load_profile(path) for path in paths]


def upsert_profiles(database_url: str, rows: list[dict[str, Any]]) -> None:
    engine = create_engine(database_url)
    table = ChordProfile.__table__
    statement = insert(table).values(rows)
    update_values = {
        column.name: statement.excluded[column.name]
        for column in table.columns
        if column.name != "id"
    }
    statement = statement.on_conflict_do_update(
        index_elements=[table.c.id],
        set_=update_values,
    )
    with Session(engine) as session:
        session.execute(statement)
        session.commit()


@click.command()
@click.option(
    "--output-dir",
    type=click.Path(path_type=Path, file_okay=False, dir_okay=True, exists=True),
    default=DEFAULT_OUTPUT_DIR,
    show_default=True,
    help="Directory containing generated chord profile JSON files.",
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
        rows = load_profiles(output_dir)
    except ValueError as error:
        raise click.ClickException(str(error)) from error

    if dry_run:
        click.echo(f"Validated {len(rows)} chord profiles from {output_dir}")
        return

    if not database_url:
        raise click.ClickException(
            "SUPABASE_DATABASE_URL is required. Set it in the selected --remote-db env file "
            "or pass --database-url."
        )

    upsert_profiles(database_url, rows)
    click.echo(f"Upserted {len(rows)} chord profiles from {output_dir}")


if __name__ == "__main__":
    main()
