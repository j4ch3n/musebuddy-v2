from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from click.testing import CliRunner

from upload import (
    NOTES_SUFFIX,
    SCORES_SUFFIX,
    UploadRows,
    load_upload_rows,
    main,
    paired_paths,
    upload_rows,
)


OUTPUT_DIR = Path(__file__).resolve().parent / "output"


class PianoPatternUploadTests(unittest.TestCase):
    def test_loads_generated_notes_and_scores(self) -> None:
        rows = load_upload_rows(OUTPUT_DIR)

        self.assertEqual(
            [row["id"] for row in rows.patterns],
            ["piano-pattern/no15", "piano-pattern/no4"],
        )
        self.assertEqual(len(rows.notes), 16)
        self.assertEqual(len(rows.scores), 2)
        self.assertEqual(
            {row["pattern_id"]: len(row["measures"]) for row in rows.scores},
            {
                "piano-pattern/no15": 4,
                "piano-pattern/no4": 4,
            },
        )
        first_note = rows.notes[0]
        self.assertEqual(len(first_note["treble_arrangement"]), 32)
        self.assertEqual(len(first_note["bass_arrangement"]), 32)

    def test_scan_is_recursive_and_uses_exact_suffixes(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            nested = root / "nested"
            nested.mkdir()
            shutil.copy(
                OUTPUT_DIR / f"no4{NOTES_SUFFIX}",
                nested / f"no4{NOTES_SUFFIX}",
            )
            shutil.copy(
                OUTPUT_DIR / f"no4{SCORES_SUFFIX}",
                nested / f"no4{SCORES_SUFFIX}",
            )
            (nested / "ignored.json").write_text("{}", encoding="utf-8")
            (nested / "ignored.vexflow.json").write_text("{}", encoding="utf-8")

            pairs = paired_paths(root)

        self.assertEqual(len(pairs), 1)
        self.assertEqual(pairs[0][0].name, f"no4{NOTES_SUFFIX}")
        self.assertEqual(pairs[0][1].name, f"no4{SCORES_SUFFIX}")

    def test_missing_pair_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            shutil.copy(
                OUTPUT_DIR / f"no4{NOTES_SUFFIX}",
                root / f"no4{NOTES_SUFFIX}",
            )

            with self.assertRaisesRegex(ValueError, "missing scores for: no4"):
                paired_paths(root)

    def test_invalid_slot_count_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            notes_path = root / f"no4{NOTES_SUFFIX}"
            scores_path = root / f"no4{SCORES_SUFFIX}"
            notes = json.loads(
                (OUTPUT_DIR / f"no4{NOTES_SUFFIX}").read_text(encoding="utf-8")
            )
            notes["beats"][0]["staves"]["treble"]["arrangement"].pop()
            notes_path.write_text(json.dumps(notes), encoding="utf-8")
            shutil.copy(OUTPUT_DIR / f"no4{SCORES_SUFFIX}", scores_path)

            with self.assertRaisesRegex(ValueError, "exactly 32 slots"):
                load_upload_rows(root)

    def test_dry_run_reports_counts_without_database_connection(self) -> None:
        runner = CliRunner()

        result = runner.invoke(
            main,
            ["--output-dir", str(OUTPUT_DIR), "--dry-run"],
        )

        self.assertEqual(result.exit_code, 0, result.output)
        self.assertIn("2 patterns, 16 notes, and 2 scores", result.output)

    def test_upload_replaces_notes_for_scanned_patterns(self) -> None:
        rows = UploadRows(
            patterns=[
                {
                    "id": "piano-pattern/test",
                    "time_signature": "4/4",
                    "key_signature_fifths": 0,
                    "key_signature_major_scale": "C major",
                    "key_signature_relative_minor_scale": "A minor",
                }
            ],
            notes=[
                {
                    "id": "note-id",
                    "pattern_id": "piano-pattern/test",
                    "bar_index": 0,
                    "beat_index": 0,
                    "chord": "c-major",
                    "treble_arrangement": [],
                    "treble_velocity": [],
                    "bass_arrangement": [],
                    "bass_velocity": [],
                }
            ],
            scores=[
                {
                    "pattern_id": "piano-pattern/test",
                    "format": "vexflow",
                    "format_version": 1,
                    "time_signature": "4/4",
                    "key_signature": "C",
                    "measures": [],
                    "ties": [],
                }
            ],
        )
        executed_statements = []

        class FakeConnection:
            def execute(self, statement: object) -> None:
                executed_statements.append(statement)

        class FakeTransaction:
            def __enter__(self) -> FakeConnection:
                return FakeConnection()

            def __exit__(self, *_args: object) -> None:
                return None

        class FakeEngine:
            def begin(self) -> FakeTransaction:
                return FakeTransaction()

        with patch("upload.create_engine", return_value=FakeEngine()):
            upload_rows("postgresql+psycopg://unused", rows)

        self.assertEqual(len(executed_statements), 4)
        self.assertIn(
            "DELETE FROM public.piano_pattern_notes", str(executed_statements[1])
        )


if __name__ == "__main__":
    unittest.main()
