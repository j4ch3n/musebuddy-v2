from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import click
import pretty_midi
from sqlalchemy import Column, Integer, Text, create_engine, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Session

from companion import pop909_common as pop909


DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "output"
BEATS_PER_TABLE_BEAT = 2
PIANO_PROGRAM = 0


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


@dataclass(frozen=True)
class ArrangementRow:
    bar_index: int
    beat_index: int
    arrangement: pop909.Arrangement
    velocity: pop909.Arrangement


@dataclass(frozen=True)
class ActiveNote:
    pitch: int
    velocity: int
    start: float


def fetch_rows(database_url: str, song_id: str) -> list[ArrangementRow]:
    engine = create_engine(database_url)
    table = CompaninonArrangementKey.__table__
    statement = (
        select(
            table.c.bar_index,
            table.c.beat_index,
            table.c.arrangement,
            table.c.velocity,
        )
        .where(table.c.song_id == song_id)
        .order_by(table.c.bar_index, table.c.beat_index)
    )

    with Session(engine) as session:
        return [
            ArrangementRow(
                bar_index=row.bar_index,
                beat_index=row.beat_index,
                arrangement=row.arrangement,
                velocity=row.velocity,
            )
            for row in session.execute(statement)
        ]


def validate_rows(rows: list[ArrangementRow]) -> None:
    messages: list[str] = []
    for row in rows:
        location = f"{row.bar_index}:{row.beat_index}"
        messages.extend(
            f"{location} {message}"
            for message in pop909.validate_arrangement_shape(
                row.arrangement, row.velocity
            )
        )
        messages.extend(validate_row_values(row))
    if messages:
        raise click.ClickException("; ".join(messages))


def validate_row_values(row: ArrangementRow) -> list[str]:
    messages: list[str] = []
    location = f"{row.bar_index}:{row.beat_index}"
    for slot_index, (arrangement_slot, velocity_slot) in enumerate(
        zip(row.arrangement, row.velocity, strict=False)
    ):
        if not isinstance(arrangement_slot, list) or not isinstance(
            velocity_slot, list
        ):
            continue
        for lane_index, pitch in enumerate(arrangement_slot):
            velocity = (
                velocity_slot[lane_index] if lane_index < len(velocity_slot) else None
            )
            path = f"{location} slot {slot_index} lane {lane_index}"
            if pitch is None or pitch == pop909.HOLD_VALUE:
                if velocity is not None:
                    messages.append(f"{path} velocity must be null for rest or hold")
                continue
            if type(pitch) is not int or not 1 <= pitch <= 127:
                messages.append(
                    f"{path} pitch must be a positive MIDI integer from 1 to 127"
                )
                continue
            if type(velocity) is not int or not 0 <= velocity <= 127:
                messages.append(
                    f"{path} attack velocity must be a MIDI integer from 0 to 127"
                )
    return messages


def rows_to_midi(rows: list[ArrangementRow], bpm: float) -> pretty_midi.PrettyMIDI:
    seconds_per_beat = 60 / bpm
    slot_duration = (
        seconds_per_beat * BEATS_PER_TABLE_BEAT / pop909.STEPS_PER_TABLE_BEAT
    )
    midi = pretty_midi.PrettyMIDI(initial_tempo=bpm)
    piano = pretty_midi.Instrument(program=PIANO_PROGRAM, is_drum=False, name="Piano")
    active_notes: dict[int, ActiveNote] = {}
    current_time = 0.0

    for row in rows:
        for arrangement_slot, velocity_slot in zip(
            row.arrangement, row.velocity, strict=True
        ):
            max_lane_index = max(
                [len(arrangement_slot) - 1, *active_notes.keys()], default=-1
            )
            lane_count = max_lane_index + 1
            for lane_index in range(lane_count):
                pitch = (
                    arrangement_slot[lane_index]
                    if lane_index < len(arrangement_slot)
                    else None
                )
                velocity = (
                    velocity_slot[lane_index]
                    if lane_index < len(velocity_slot)
                    else None
                )
                active = active_notes.get(lane_index)

                if pitch is None:
                    if active is not None:
                        append_note(piano, active, current_time)
                        del active_notes[lane_index]
                    continue

                if pitch == pop909.HOLD_VALUE:
                    if active is None:
                        raise click.ClickException(
                            f"{row.bar_index}:{row.beat_index} hold without active note "
                            f"at time {current_time:.6f}s lane {lane_index}"
                        )
                    continue

                if active is not None:
                    append_note(piano, active, current_time)
                active_notes[lane_index] = ActiveNote(
                    pitch=pitch,
                    velocity=velocity,
                    start=current_time,
                )

            current_time += slot_duration

    for active in active_notes.values():
        append_note(piano, active, current_time)

    piano.notes.sort(key=lambda note: (note.start, note.pitch, note.end))
    midi.instruments.append(piano)
    return midi


def append_note(
    instrument: pretty_midi.Instrument, active: ActiveNote, end: float
) -> None:
    if end <= active.start:
        return
    instrument.notes.append(
        pretty_midi.Note(
            velocity=active.velocity,
            pitch=active.pitch,
            start=active.start,
            end=end,
        )
    )


def output_path(output_dir: Path, song_id: str) -> Path:
    filename = f"{song_id.replace('/', '_')}.midi"
    return output_dir / filename


@click.command()
@click.argument("song_id")
@click.option(
    "--database-url",
    envvar="SUPABASE_DATABASE_URL",
    help="Supabase Postgres SQLAlchemy URL. Defaults to SUPABASE_DATABASE_URL.",
)
@click.option(
    "--bpm",
    type=click.FloatRange(min=1, min_open=True),
    default=120.0,
    show_default=True,
    help="Synthetic tempo used to map arrangement slots to MIDI time.",
)
@click.option(
    "--output-dir",
    type=click.Path(path_type=Path, file_okay=False, dir_okay=True),
    default=DEFAULT_OUTPUT_DIR,
    show_default=True,
    help="Directory where the generated MIDI file will be written.",
)
def main(song_id: str, database_url: str | None, bpm: float, output_dir: Path) -> None:
    database_url = pop909.database_url(database_url)
    if not database_url:
        raise click.ClickException(
            "SUPABASE_DATABASE_URL is required. Set it in courses/.env or pass --database-url."
        )

    rows = fetch_rows(database_url, song_id)
    if not rows:
        raise click.ClickException(
            f"No companion arrangement rows found for song_id {song_id!r}."
        )

    validate_rows(rows)
    midi = rows_to_midi(rows, bpm)
    path = output_path(output_dir, song_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    midi.write(str(path))
    click.echo(f"Wrote {path}")


if __name__ == "__main__":
    main()
