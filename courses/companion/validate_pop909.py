from __future__ import annotations

from pathlib import Path
from typing import Any

import click
from sqlalchemy import Column, Integer, Text, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Session
from tqdm import tqdm

from companion import pop909_common as pop909


class Base(DeclarativeBase):
    pass


class CompaninonArrangementKey(Base):
    __tablename__ = "companinon_arrangements_keys"
    __table_args__ = {"schema": "public"}

    id = Column(Text, primary_key=True)
    song_id = Column(Text, nullable=False)
    bar_index = Column(Integer, nullable=False)
    beat_index = Column(Integer, nullable=False)
    arrangement = Column(JSONB, nullable=False)
    velocity = Column(JSONB, nullable=False)
    chord = Column(Text, nullable=False)


class ChordProfile(Base):
    __tablename__ = "chord_profiles"
    __table_args__ = {"schema": "public"}

    id = Column(Text, primary_key=True)


def fetch_db_rows(database_url: str, song_id: str) -> list[dict[str, Any]]:
    engine = create_engine(database_url)
    table = CompaninonArrangementKey.__table__
    statement = (
        select(
            table.c.id,
            table.c.song_id,
            table.c.bar_index,
            table.c.beat_index,
            table.c.arrangement,
            table.c.velocity,
            table.c.chord,
        )
        .where(table.c.song_id == song_id)
        .order_by(table.c.bar_index, table.c.beat_index)
    )
    with Session(engine) as session:
        return [dict(row._mapping) for row in session.execute(statement)]


def fetch_chord_ids(database_url: str) -> set[str]:
    engine = create_engine(database_url)
    with Session(engine) as session:
        return set(session.scalars(select(ChordProfile.id)))


def attack_count_for_rows(rows: list[dict[str, Any]]) -> int:
    return sum(pop909.count_positive_attacks(row["arrangement"]) for row in rows)


def validate_song(
    dataset_root: Path,
    metadata: pop909.SongMetadata,
    database_url: str,
    chord_lookup: dict[tuple[int, tuple[int, ...], int], str],
    chord_ids: set[str],
) -> list[str]:
    errors: list[str] = []
    expected = pop909.process_song(dataset_root, metadata, chord_lookup).rows
    actual = fetch_db_rows(database_url, metadata.song_id)

    expected_keys = {(row.bar_index, row.beat_index): row for row in expected}
    actual_keys = {(row["bar_index"], row["beat_index"]): row for row in actual}

    if len(expected) != len(actual):
        errors.append(f"expected {len(expected)} rows, found {len(actual)} rows")

    missing = sorted(set(expected_keys) - set(actual_keys))
    extra = sorted(set(actual_keys) - set(expected_keys))
    if missing:
        errors.append(f"missing beat rows: {missing[:10]}")
    if extra:
        errors.append(f"unexpected beat rows: {extra[:10]}")

    expected_bars = {row.bar_index for row in expected}
    actual_bars = {row["bar_index"] for row in actual}
    if expected_bars != actual_bars:
        errors.append(
            f"bar coverage differs: expected {sorted(expected_bars)}, found {sorted(actual_bars)}"
        )

    expected_attack_count = sum(pop909.count_positive_attacks(row.arrangement) for row in expected)
    actual_attack_count = attack_count_for_rows(actual)
    if expected_attack_count != actual_attack_count:
        errors.append(f"expected {expected_attack_count} attacks, found {actual_attack_count}")

    for key, expected_row in expected_keys.items():
        actual_row = actual_keys.get(key)
        if actual_row is None:
            continue
        if expected_row.chord != actual_row["chord"]:
            errors.append(f"{key} expected chord {expected_row.chord}, found {actual_row['chord']}")
        if expected_row.id != actual_row["id"]:
            errors.append(f"{key} expected id {expected_row.id}, found {actual_row['id']}")

    for row in actual:
        if row["chord"] not in chord_ids:
            errors.append(f"{row['bar_index']}:{row['beat_index']} missing chord {row['chord']}")
        errors.extend(
            f"{row['bar_index']}:{row['beat_index']} {message}"
            for message in pop909.validate_arrangement_shape(row["arrangement"], row["velocity"])
        )

    return errors


@click.command()
@click.option(
    "--dataset-root",
    type=click.Path(path_type=Path, file_okay=False, dir_okay=True, exists=True),
    default=pop909.DEFAULT_DATASET_ROOT,
    show_default=True,
    help="Path to the extracted POP909 dataset root.",
)
@click.option(
    "--database-url",
    envvar="SUPABASE_DATABASE_URL",
    help="Supabase Postgres SQLAlchemy URL. Defaults to SUPABASE_DATABASE_URL.",
)
@click.option(
    "--song-limit",
    type=int,
    default=None,
    help="Maximum number of supported POP909 songs to validate.",
)
@click.option(
    "--song-id",
    multiple=True,
    help="Validate one POP909 dataset song id, for example 001 or POP909/001. May be passed multiple times.",
)
def main(
    dataset_root: Path,
    database_url: str | None,
    song_limit: int | None,
    song_id: tuple[str, ...],
) -> None:
    pop909.configure_logging()
    database_url = pop909.database_url(database_url)
    if not database_url:
        raise click.ClickException(
            "SUPABASE_DATABASE_URL is required. Set it in courses/.env or pass --database-url."
        )

    try:
        songs = pop909.filter_songs_by_id(
            pop909.read_index(dataset_root, song_limit=song_limit),
            song_id,
        )
    except ValueError as error:
        raise click.ClickException(str(error)) from error

    chord_lookup = pop909.generated_chord_lookup()
    chord_ids = fetch_chord_ids(database_url)
    passed = 0
    failed = 0

    pop909.logging.info("Starting POP909 validation for %s song(s)", len(songs))
    for metadata in tqdm(songs, desc="Validating POP909"):
        try:
            errors = validate_song(dataset_root, metadata, database_url, chord_lookup, chord_ids)
        except Exception as error:
            errors = [str(error)]

        if errors:
            failed += 1
            pop909.logging.error("%s failed validation: %s", metadata.song_id, "; ".join(errors))
            click.echo(f"{metadata.song_id}: FAIL ({len(errors)} issue(s))")
        else:
            passed += 1
            pop909.logging.info("%s passed validation", metadata.song_id)

    summary = f"Validation complete: {passed} passed, {failed} failed"
    pop909.logging.info(summary)
    click.echo(summary)
    if failed:
        raise click.ClickException(f"{failed} song(s) failed validation; see {pop909.RUN_LOG_PATH}")


if __name__ == "__main__":
    main()
