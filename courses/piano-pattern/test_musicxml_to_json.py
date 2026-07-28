from __future__ import annotations

import unittest
from pathlib import Path

from click.testing import CliRunner

from main import main
from musicxml_to_json import (
    OUTPUT_DIR,
    build_pattern_document,
    notes_output_path_for,
    pattern_id_for,
)


DATA_DIR = Path(__file__).resolve().parent / "data"


class MusicXmlToJsonTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.no4 = build_pattern_document(DATA_DIR / "no4.mxl")
        cls.no15 = build_pattern_document(DATA_DIR / "no15.mxl")

    def test_no4_metadata_and_chords(self) -> None:
        self.assertEqual(
            self.no4["pattern"],
            {
                "id": "piano-pattern/no4",
                "time_signature": "4/4",
                "key_signature": {
                    "fifths": 1,
                    "major_scale": "G major",
                    "relative_minor_scale": "E minor",
                },
            },
        )
        self.assertEqual(
            [beat["chord"] for beat in self.no4["beats"]],
            [
                "g-add-ninth",
                "g-add-ninth",
                "e-minor-add-ninth",
                "e-minor-add-ninth",
                "c-add-ninth",
                "c-add-ninth",
                "d-suspended-fourth",
                "d-major",
            ],
        )

    def test_no15_metadata_and_chords(self) -> None:
        self.assertEqual(
            self.no15["pattern"]["key_signature"],
            {
                "fifths": -1,
                "major_scale": "F major",
                "relative_minor_scale": "D minor",
            },
        )
        self.assertEqual(
            [beat["chord"] for beat in self.no15["beats"]],
            [
                "d-minor-add-ninth",
                "d-minor-add-ninth",
                "b-flat-add-ninth",
                "b-flat-add-ninth",
                "f-major",
                "f-add-ninth",
                "c-add-ninth",
                "c-add-ninth",
            ],
        )

    def test_trailing_multimeasure_rests_are_trimmed(self) -> None:
        self.assertEqual(len(self.no4["beats"]), 8)
        self.assertEqual(len(self.no15["beats"]), 8)
        self.assertEqual(
            [(beat["bar_index"], beat["beat_index"]) for beat in self.no4["beats"]],
            [
                (bar_index, beat_index)
                for bar_index in range(4)
                for beat_index in range(2)
            ],
        )

    def test_staves_have_independent_aligned_slot_grids(self) -> None:
        for beat in self.no4["beats"]:
            self.assertEqual(set(beat["staves"]), {"treble", "bass"})
            for staff in beat["staves"].values():
                self.assertEqual(len(staff["arrangement"]), 32)
                self.assertEqual(len(staff["velocity"]), 32)
                for arrangement_slot, velocity_slot in zip(
                    staff["arrangement"],
                    staff["velocity"],
                    strict=True,
                ):
                    self.assertEqual(len(arrangement_slot), len(velocity_slot))

        first_beat = self.no4["beats"][0]
        self.assertEqual(
            first_beat["staves"]["treble"]["arrangement"][0],
            [None],
        )
        self.assertEqual(
            first_beat["staves"]["bass"]["arrangement"][0],
            [55],
        )

    def test_ties_become_holds_without_false_midpoint_attacks(self) -> None:
        second_half = self.no4["beats"][1]
        self.assertEqual(
            second_half["staves"]["treble"]["arrangement"][0],
            [-50],
        )
        self.assertEqual(
            second_half["staves"]["bass"]["arrangement"][0],
            [-50],
        )
        self.assertEqual(second_half["chord"], "g-add-ninth")

    def test_pattern_id_and_output_path_are_fixed_from_stem(self) -> None:
        input_path = DATA_DIR / "no4.mxl"
        self.assertEqual(pattern_id_for(input_path), "piano-pattern/no4")
        self.assertEqual(
            notes_output_path_for(input_path),
            OUTPUT_DIR / "no4.notes.json",
        )

    def test_cli_writes_fixed_notes_output_path(self) -> None:
        runner = CliRunner()
        result = runner.invoke(
            main,
            [str(DATA_DIR / "no4.mxl"), "--mode", "notes"],
        )
        self.assertEqual(result.exit_code, 0, result.output)
        expected_path = OUTPUT_DIR / "no4.notes.json"
        self.assertTrue(expected_path.is_file())
        self.assertIn(str(expected_path), result.output)


if __name__ == "__main__":
    unittest.main()
