from __future__ import annotations

from pathlib import Path

import click
from sqlalchemy import Column, ForeignKey, Integer, Text, create_engine, delete
from sqlalchemy.dialects.postgresql import JSONB, ENUM, insert
from sqlalchemy.orm import DeclarativeBase, Session
from tqdm import tqdm

from companion import pop909_common as pop909
from course_environment import RemoteDb


class Base(DeclarativeBase):
    pass


def enum_type(name: str, values: tuple[str, ...]) -> ENUM:
    return ENUM(*values, name=name, schema="public", create_type=False)


class CompaninonArrangementSong(Base):
    __tablename__ = "companinon_arrangements_songs"
    __table_args__ = {"schema": "public"}

    id = Column(Text, primary_key=True)
    name = Column(Text, nullable=False)
    artist = Column(Text, nullable=False)
    time_signature = Column(
        enum_type("companinon_arrangements_time_signature", ("4/4", "6/8")),
        nullable=False,
    )


class CompaninonArrangementKey(Base):
    __tablename__ = "companinon_arrangements_keys"
    __table_args__ = {"schema": "public"}

    id = Column(Text, primary_key=True)
    song_id = Column(
        Text,
        ForeignKey("public.companinon_arrangements_songs.id", ondelete="CASCADE"),
        nullable=False,
    )
    bar_index = Column(Integer, nullable=False)
    beat_index = Column(Integer, nullable=False)
    arrangement = Column(JSONB, nullable=False)
    velocity = Column(JSONB, nullable=False)
    chord = Column(Text, ForeignKey("public.chord_profiles.id"), nullable=False)


class ChordProfile(Base):
    __tablename__ = "chord_profiles"
    __table_args__ = {"schema": "public"}

    id = Column(Text, primary_key=True)


def persist_song(database_url: str, processed_song: pop909.ProcessedSong) -> None:
    engine = create_engine(database_url)
    song_table = CompaninonArrangementSong.__table__
    key_table = CompaninonArrangementKey.__table__
    song_values = pop909.song_to_dict(processed_song.metadata)
    key_values = [pop909.beat_row_to_dict(row) for row in processed_song.rows]

    statement = insert(song_table).values(song_values)
    statement = statement.on_conflict_do_update(
        index_elements=[song_table.c.id],
        set_={
            "name": statement.excluded.name,
            "artist": statement.excluded.artist,
            "time_signature": statement.excluded.time_signature,
        },
    )

    with Session(engine) as session:
        with session.begin():
            session.execute(statement)
            session.execute(
                delete(key_table).where(
                    key_table.c.song_id == processed_song.metadata.song_id
                )
            )
            if key_values:
                session.execute(insert(key_table).values(key_values))


def existing_chord_ids(database_url: str) -> set[str]:
    engine = create_engine(database_url)
    with Session(engine) as session:
        return set(
            session.scalars(
                ChordProfile.__table__.select().with_only_columns(ChordProfile.id)
            )
        )


def verify_chord_profiles(database_url: str, rows: list[pop909.BeatRow]) -> None:
    required = {row.chord for row in rows}
    existing = existing_chord_ids(database_url)
    missing = sorted(required - existing)
    if missing:
        preview = ", ".join(missing[:10])
        raise click.ClickException(f"Missing chord_profiles rows: {preview}")


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
    help="Process input files and print a summary without opening a database connection.",
)
@click.option(
    "--song-limit",
    type=int,
    default=None,
    help="Maximum number of supported POP909 songs to process.",
)
@click.option(
    "--song-id",
    multiple=True,
    help="Process one POP909 dataset song id. May be passed multiple times.",
)
def main(
    dataset_root: Path,
    database_url: str | None,
    remote_db: RemoteDb,
    dry_run: bool,
    song_limit: int | None,
    song_id: tuple[str, ...],
) -> None:
    pop909.configure_logging()
    database_url = pop909.database_url(database_url, remote_db)
    try:
        songs = pop909.filter_songs_by_id(
            pop909.read_index(dataset_root, song_limit=song_limit),
            song_id,
        )
    except ValueError as error:
        raise click.ClickException(str(error)) from error
    chord_lookup = pop909.generated_chord_lookup()
    processed_count = 0
    row_count = 0

    if not dry_run and not database_url:
        raise click.ClickException(
            "SUPABASE_DATABASE_URL is required. Set it in the selected --remote-db env file "
            "or pass --database-url."
        )

    pop909.logging.info("Starting POP909 processing for %s song(s)", len(songs))
    for metadata in tqdm(songs, desc="Processing POP909"):
        try:
            processed_song = pop909.process_song(dataset_root, metadata, chord_lookup)
            if processed_song.audio_key_summary:
                pop909.logging.info(
                    "%s audio key summary: %s",
                    metadata.song_id,
                    processed_song.audio_key_summary,
                )
            if dry_run:
                click.echo(f"{metadata.song_id}: {len(processed_song.rows)} beat rows")
            else:
                verify_chord_profiles(database_url, processed_song.rows)
                persist_song(database_url, processed_song)
            processed_count += 1
            row_count += len(processed_song.rows)
            pop909.logging.info(
                "Processed %s with %s rows and %s skipped note(s)",
                metadata.song_id,
                len(processed_song.rows),
                processed_song.skipped_note_count,
            )
        except Exception as error:
            pop909.logging.exception("Failed processing %s", metadata.song_id)
            raise click.ClickException(str(error)) from error

    summary = f"Processed {processed_count} song(s), generated {row_count} beat row(s)"
    pop909.logging.info(summary)
    click.echo(summary)


if __name__ == "__main__":
    main()
