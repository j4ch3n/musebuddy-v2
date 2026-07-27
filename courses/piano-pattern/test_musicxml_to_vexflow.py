from __future__ import annotations

import unittest
from pathlib import Path

from click.testing import CliRunner

from main import main
from musicxml_to_vexflow import (
    build_vexflow_document,
    scores_output_path_for,
)
from musicxml_to_json import OUTPUT_DIR


DATA_DIR = Path(__file__).resolve().parent / "data"


class MusicXmlToVexFlowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.no4 = build_vexflow_document(DATA_DIR / "no4.mxl")
        cls.no15 = build_vexflow_document(DATA_DIR / "no15.mxl")

    def test_output_contains_only_vexflow_score_data(self) -> None:
        self.assertEqual(
            set(self.no4),
            {
                "format",
                "format_version",
                "time_signature",
                "key_signature",
                "measures",
                "ties",
            },
        )
        self.assertEqual(self.no4["format"], "vexflow")
        self.assertEqual(self.no4["format_version"], 1)
        self.assertEqual(self.no4["time_signature"], "4/4")
        self.assertEqual(self.no4["key_signature"], "G")
        self.assertEqual(self.no15["key_signature"], "F")

    def test_trailing_multimeasure_rests_are_trimmed(self) -> None:
        self.assertEqual(len(self.no4["measures"]), 4)
        self.assertEqual(len(self.no15["measures"]), 4)

    def test_no15_preserves_two_bass_voices(self) -> None:
        for measure in self.no15["measures"]:
            bass_voices = measure["staves"]["bass"]["voices"]
            self.assertEqual([voice["id"] for voice in bass_voices], ["5", "6"])
            self.assertEqual(
                bass_voices[0]["events"][0]["duration"],
                "w",
            )

    def test_rests_use_generic_stave_positions(self) -> None:
        rest_keys = [
            measure["staves"]["bass"]["voices"][1]["events"][0]["keys"][0]
            for measure in self.no15["measures"]
        ]
        self.assertEqual(rest_keys, ["d/3"] * 4)

    def test_every_voice_fills_a_four_four_measure(self) -> None:
        duration_steps = {
            "w": 64,
            "h": 32,
            "q": 16,
            "8": 8,
            "16": 4,
            "32": 2,
            "64": 1,
        }
        for document in (self.no4, self.no15):
            for measure in document["measures"]:
                for staff in measure["staves"].values():
                    for voice in staff["voices"]:
                        total = 0
                        for event in voice["events"]:
                            base = duration_steps[event["duration"]]
                            dots = event["dots"]
                            total += sum(
                                base // (2**dot_index) for dot_index in range(dots + 1)
                            )
                        self.assertEqual(total, 64)

    def test_event_references_are_unique_and_resolved(self) -> None:
        for document in (self.no4, self.no15):
            event_ids = {
                event["id"]
                for measure in document["measures"]
                for staff in measure["staves"].values()
                for voice in staff["voices"]
                for event in voice["events"]
            }
            event_count = sum(
                1
                for measure in document["measures"]
                for staff in measure["staves"].values()
                for voice in staff["voices"]
                for _event in voice["events"]
            )
            self.assertEqual(len(event_ids), event_count)
            for measure in document["measures"]:
                for beam in measure["beams"]:
                    self.assertTrue(set(beam["event_ids"]) <= event_ids)
            for tie in document["ties"]:
                self.assertIn(tie["from"]["event_id"], event_ids)
                self.assertIn(tie["to"]["event_id"], event_ids)

    def test_dots_beams_and_ties_are_preserved(self) -> None:
        no15_events = [
            event
            for measure in self.no15["measures"]
            for staff in measure["staves"].values()
            for voice in staff["voices"]
            for event in voice["events"]
        ]
        self.assertTrue(any(event["dots"] == 1 for event in no15_events))
        self.assertTrue(any(measure["beams"] for measure in self.no15["measures"]))
        self.assertTrue(self.no4["ties"])
        self.assertTrue(self.no15["ties"])

    def test_cli_writes_fixed_scores_output_path(self) -> None:
        runner = CliRunner()
        result = runner.invoke(
            main,
            [str(DATA_DIR / "no4.mxl"), "--mode", "scores"],
        )
        self.assertEqual(result.exit_code, 0, result.output)
        expected_path = OUTPUT_DIR / "no4.scores.json"
        self.assertEqual(
            scores_output_path_for(DATA_DIR / "no4.mxl"),
            expected_path,
        )
        self.assertTrue(expected_path.is_file())
        self.assertIn(str(expected_path), result.output)


if __name__ == "__main__":
    unittest.main()
