from __future__ import annotations

from pathlib import Path

import click

from musicxml_to_vexflow import convert_musicxml_to_scores
from musicxml_to_json import ConversionError, convert_musicxml_to_notes


@click.command()
@click.argument(
    "input_path",
    type=click.Path(
        path_type=Path,
        exists=True,
        dir_okay=False,
        readable=True,
    ),
)
@click.option(
    "--mode",
    type=click.Choice(("notes", "scores"), case_sensitive=False),
    required=True,
    help="Output mode.",
)
def main(input_path: Path, mode: str) -> None:
    try:
        if mode.lower() == "scores":
            output_path = convert_musicxml_to_scores(input_path)
        else:
            output_path = convert_musicxml_to_notes(input_path)
    except ConversionError as error:
        raise click.ClickException(str(error)) from error
    click.echo(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
