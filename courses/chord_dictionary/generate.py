from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Literal


ChordDisplayTokenType = Literal[
    "root",
    "quality",
    "extension",
    "alteration",
    "addition",
    "omission",
    "bass",
    "separator",
]

ChordFamily = Literal[
    "triad",
    "seventh",
    "extended",
    "added-tone",
    "altered",
    "omitted-tone",
    "suspended",
    "slash",
]

ComponentKind = Literal["extensions", "additions", "alterations", "omissions"]
ChordTeachingRole = Literal["anchor", "quality", "guide", "color", "voicing"]
PianoHand = Literal["left", "right"]


@dataclass(frozen=True)
class ChordComponent:
    value: str
    degree: str
    raw_degree: str | None = None


@dataclass(frozen=True)
class ChordTone:
    degree: str
    pitch: str
    pitch_class: int
    semitones_from_root: int
    teaching_role: ChordTeachingRole
    voicing_role: str
    is_bass: bool
    hand: PianoHand | None = None
    finger: int | None = None

    def to_json(self) -> dict[str, object]:
        return {
            "degree": self.degree,
            "pitch": self.pitch,
            "pitchClass": self.pitch_class,
            "teachingRole": self.teaching_role,
            "voicingRole": self.voicing_role,
            "isBass": self.is_bass,
            "hand": self.hand,
            "finger": self.finger,
        }


@dataclass(frozen=True)
class ChordSpec:
    slug: str
    quality_symbol: str | None
    quality_name: str | None
    base_formula: tuple[str, ...]
    sounding_degrees: tuple[str, ...]
    family: tuple[ChordFamily, ...]
    components: dict[ComponentKind, tuple[ChordComponent, ...]] = field(
        default_factory=dict
    )
    omitted_degrees: tuple[str, ...] = ()
    suffix: str = ""
    parenthetical_values: tuple[tuple[ChordDisplayTokenType, str], ...] = ()
    slash_degree: str | None = None


ROOTS = (
    "C",
    "C#",
    "Db",
    "D",
    "D#",
    "Eb",
    "E",
    "F",
    "F#",
    "Gb",
    "G",
    "G#",
    "Ab",
    "A",
    "A#",
    "Bb",
    "B",
)
LETTER_TO_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
LETTER_ORDER = ("C", "D", "E", "F", "G", "A", "B")
MAJOR_DEGREE_SEMITONES = {
    1: 0,
    2: 2,
    3: 4,
    4: 5,
    5: 7,
    6: 9,
    7: 11,
    8: 12,
    9: 14,
    10: 16,
    11: 17,
    12: 19,
    13: 21,
}
DEGREE_NAMES = {
    "1": "root",
    "b2": "flat second",
    "2": "second",
    "#2": "sharp second",
    "b3": "minor third",
    "3": "major third",
    "4": "fourth",
    "#4": "sharp fourth",
    "b5": "diminished fifth",
    "5": "perfect fifth",
    "#5": "augmented fifth",
    "b6": "flat sixth",
    "6": "sixth",
    "bb7": "diminished seventh",
    "b7": "minor seventh",
    "7": "major seventh",
    "b9": "flat ninth",
    "9": "ninth",
    "#9": "sharp ninth",
    "11": "eleventh",
    "#11": "sharp eleventh",
    "b13": "flat thirteenth",
    "13": "thirteenth",
}
FLAT_SLUGS = {
    "Db": "d-flat",
    "Eb": "e-flat",
    "Gb": "g-flat",
    "Ab": "a-flat",
    "Bb": "b-flat",
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate MuseBuddy chord dictionary JSON files."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parent / "output",
        help="Directory where chord JSON files will be written.",
    )
    args = parser.parse_args()

    profiles = [build_profile(root, spec) for root in ROOTS for spec in chord_specs()]
    write_profiles(profiles, args.output)
    print(f"Wrote {len(profiles)} chord profiles to {args.output}")


def chord_specs() -> tuple[ChordSpec, ...]:
    return (
        ChordSpec(
            slug="major",
            quality_symbol=None,
            quality_name="major",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5"),
            family=("triad",),
        ),
        ChordSpec(
            slug="minor",
            quality_symbol="m",
            quality_name="minor",
            base_formula=("1", "b3", "5"),
            sounding_degrees=("1", "b3", "5"),
            family=("triad",),
            suffix="m",
        ),
        ChordSpec(
            slug="diminished",
            quality_symbol="dim",
            quality_name="diminished",
            base_formula=("1", "b3", "b5"),
            sounding_degrees=("1", "b3", "b5"),
            family=("triad",),
            suffix="dim",
        ),
        ChordSpec(
            slug="augmented",
            quality_symbol="aug",
            quality_name="augmented",
            base_formula=("1", "3", "#5"),
            sounding_degrees=("1", "3", "#5"),
            family=("triad", "altered"),
            suffix="aug",
            components={"alterations": (ChordComponent("aug", "#5"),)},
        ),
        ChordSpec(
            slug="suspended-second",
            quality_symbol="sus2",
            quality_name="suspended",
            base_formula=("1", "2", "5"),
            sounding_degrees=("1", "2", "5"),
            family=("triad", "suspended"),
            suffix="sus2",
        ),
        ChordSpec(
            slug="suspended-fourth",
            quality_symbol="sus4",
            quality_name="suspended",
            base_formula=("1", "4", "5"),
            sounding_degrees=("1", "4", "5"),
            family=("triad", "suspended"),
            suffix="sus4",
        ),
        ChordSpec(
            slug="sixth",
            quality_symbol=None,
            quality_name="major",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "6"),
            family=("added-tone",),
            suffix="6",
            components={"additions": (ChordComponent("6", "6"),)},
        ),
        ChordSpec(
            slug="minor-sixth",
            quality_symbol="m",
            quality_name="minor",
            base_formula=("1", "b3", "5"),
            sounding_degrees=("1", "b3", "5", "6"),
            family=("added-tone",),
            suffix="m6",
            components={"additions": (ChordComponent("6", "6"),)},
        ),
        ChordSpec(
            slug="dominant-seventh",
            quality_symbol=None,
            quality_name="dominant",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "b7"),
            family=("seventh",),
            suffix="7",
            components={"extensions": (ChordComponent("7", "b7"),)},
        ),
        ChordSpec(
            slug="major-seventh",
            quality_symbol=None,
            quality_name="major",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "7"),
            family=("seventh",),
            suffix="maj7",
            components={"extensions": (ChordComponent("maj7", "7"),)},
        ),
        ChordSpec(
            slug="minor-seventh",
            quality_symbol="m",
            quality_name="minor",
            base_formula=("1", "b3", "5"),
            sounding_degrees=("1", "b3", "5", "b7"),
            family=("seventh",),
            suffix="m7",
            components={"extensions": (ChordComponent("7", "b7"),)},
        ),
        ChordSpec(
            slug="minor-major-seventh",
            quality_symbol="m",
            quality_name="minor",
            base_formula=("1", "b3", "5"),
            sounding_degrees=("1", "b3", "5", "7"),
            family=("seventh",),
            suffix="mMaj7",
            components={"extensions": (ChordComponent("Maj7", "7"),)},
        ),
        ChordSpec(
            slug="half-diminished-seventh",
            quality_symbol="m7b5",
            quality_name="half-diminished",
            base_formula=("1", "b3", "b5"),
            sounding_degrees=("1", "b3", "b5", "b7"),
            family=("seventh", "altered"),
            suffix="m7b5",
            components={
                "extensions": (ChordComponent("7", "b7"),),
                "alterations": (ChordComponent("b5", "b5"),),
            },
        ),
        ChordSpec(
            slug="diminished-seventh",
            quality_symbol="dim",
            quality_name="diminished",
            base_formula=("1", "b3", "b5"),
            sounding_degrees=("1", "b3", "b5", "bb7"),
            family=("seventh", "altered"),
            suffix="dim7",
            components={"extensions": (ChordComponent("dim7", "bb7"),)},
        ),
        ChordSpec(
            slug="dominant-ninth",
            quality_symbol=None,
            quality_name="dominant",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "b7", "9"),
            family=("seventh", "extended"),
            suffix="9",
            components={"extensions": (ChordComponent("9", "9", "2"),)},
        ),
        ChordSpec(
            slug="major-ninth",
            quality_symbol=None,
            quality_name="major",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "7", "9"),
            family=("seventh", "extended"),
            suffix="maj9",
            components={"extensions": (ChordComponent("maj9", "9", "2"),)},
        ),
        ChordSpec(
            slug="minor-ninth",
            quality_symbol="m",
            quality_name="minor",
            base_formula=("1", "b3", "5"),
            sounding_degrees=("1", "b3", "5", "b7", "9"),
            family=("seventh", "extended"),
            suffix="m9",
            components={"extensions": (ChordComponent("9", "9", "2"),)},
        ),
        ChordSpec(
            slug="dominant-thirteenth",
            quality_symbol=None,
            quality_name="dominant",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "b7", "9", "13"),
            family=("seventh", "extended"),
            suffix="13",
            components={"extensions": (ChordComponent("13", "13", "6"),)},
        ),
        ChordSpec(
            slug="major-thirteenth",
            quality_symbol=None,
            quality_name="major",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "7", "9", "13"),
            family=("seventh", "extended"),
            suffix="maj13",
            components={"extensions": (ChordComponent("maj13", "13", "6"),)},
        ),
        ChordSpec(
            slug="minor-thirteenth",
            quality_symbol="m",
            quality_name="minor",
            base_formula=("1", "b3", "5"),
            sounding_degrees=("1", "b3", "5", "b7", "9", "11", "13"),
            family=("seventh", "extended"),
            suffix="m13",
            components={"extensions": (ChordComponent("13", "13", "6"),)},
        ),
        ChordSpec(
            slug="minor-eleventh",
            quality_symbol="m",
            quality_name="minor",
            base_formula=("1", "b3", "5"),
            sounding_degrees=("1", "b3", "5", "b7", "9", "11"),
            family=("seventh", "extended"),
            suffix="m11",
            components={"extensions": (ChordComponent("11", "11", "4"),)},
        ),
        ChordSpec(
            slug="dominant-seventh-suspended-fourth",
            quality_symbol="sus4",
            quality_name="suspended",
            base_formula=("1", "4", "5"),
            sounding_degrees=("1", "4", "5", "b7"),
            family=("seventh", "suspended"),
            suffix="7sus4",
            components={"extensions": (ChordComponent("7", "b7"),)},
        ),
        ChordSpec(
            slug="dominant-ninth-suspended-fourth",
            quality_symbol="sus4",
            quality_name="suspended",
            base_formula=("1", "4", "5"),
            sounding_degrees=("1", "4", "5", "b7", "9"),
            family=("seventh", "extended", "suspended"),
            suffix="9sus4",
            components={"extensions": (ChordComponent("9", "9", "2"),)},
        ),
        ChordSpec(
            slug="major-seventh-sharp-eleventh",
            quality_symbol=None,
            quality_name="major",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "7", "#11"),
            family=("seventh", "extended", "altered"),
            suffix="maj7",
            parenthetical_values=(("alteration", "#11"),),
            components={
                "extensions": (ChordComponent("maj7", "7"),),
                "alterations": (ChordComponent("#11", "#11", "#4"),),
            },
        ),
        ChordSpec(
            slug="dominant-seventh-flat-fifth",
            quality_symbol=None,
            quality_name="dominant",
            base_formula=("1", "3", "b5"),
            sounding_degrees=("1", "3", "b5", "b7"),
            family=("seventh", "altered"),
            suffix="7",
            parenthetical_values=(("alteration", "b5"),),
            components={
                "extensions": (ChordComponent("7", "b7"),),
                "alterations": (ChordComponent("b5", "b5"),),
            },
        ),
        ChordSpec(
            slug="dominant-seventh-sharp-fifth",
            quality_symbol=None,
            quality_name="dominant",
            base_formula=("1", "3", "#5"),
            sounding_degrees=("1", "3", "#5", "b7"),
            family=("seventh", "altered"),
            suffix="7",
            parenthetical_values=(("alteration", "#5"),),
            components={
                "extensions": (ChordComponent("7", "b7"),),
                "alterations": (ChordComponent("#5", "#5"),),
            },
        ),
        ChordSpec(
            slug="dominant-seventh-flat-thirteenth",
            quality_symbol=None,
            quality_name="dominant",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "b7", "b13"),
            family=("seventh", "altered"),
            suffix="7",
            parenthetical_values=(("alteration", "b13"),),
            components={
                "extensions": (ChordComponent("7", "b7"),),
                "alterations": (ChordComponent("b13", "b13", "b6"),),
            },
        ),
        ChordSpec(
            slug="add-ninth",
            quality_symbol=None,
            quality_name="major",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "9"),
            family=("triad", "added-tone"),
            suffix="add9",
            components={"additions": (ChordComponent("add9", "9", "2"),)},
        ),
        ChordSpec(
            slug="minor-add-ninth",
            quality_symbol="m",
            quality_name="minor",
            base_formula=("1", "b3", "5"),
            sounding_degrees=("1", "b3", "5", "9"),
            family=("triad", "added-tone"),
            suffix="madd9",
            components={"additions": (ChordComponent("add9", "9", "2"),)},
        ),
        ChordSpec(
            slug="sixth-add-ninth",
            quality_symbol=None,
            quality_name="major",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "6", "9"),
            family=("added-tone",),
            suffix="6add9",
            components={
                "additions": (
                    ChordComponent("6", "6"),
                    ChordComponent("add9", "9", "2"),
                )
            },
        ),
        ChordSpec(
            slug="dominant-seventh-flat-ninth",
            quality_symbol=None,
            quality_name="dominant",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "b7", "b9"),
            family=("seventh", "altered"),
            suffix="7",
            parenthetical_values=(("alteration", "b9"),),
            components={
                "extensions": (ChordComponent("7", "b7"),),
                "alterations": (ChordComponent("b9", "b9", "b2"),),
            },
        ),
        ChordSpec(
            slug="dominant-seventh-sharp-ninth",
            quality_symbol=None,
            quality_name="dominant",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "b7", "#9"),
            family=("seventh", "altered"),
            suffix="7",
            parenthetical_values=(("alteration", "#9"),),
            components={
                "extensions": (ChordComponent("7", "b7"),),
                "alterations": (ChordComponent("#9", "#9", "#2"),),
            },
        ),
        ChordSpec(
            slug="dominant-seventh-sharp-eleventh",
            quality_symbol=None,
            quality_name="dominant",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "b7", "#11"),
            family=("seventh", "altered"),
            suffix="7",
            parenthetical_values=(("alteration", "#11"),),
            components={
                "extensions": (ChordComponent("7", "b7"),),
                "alterations": (ChordComponent("#11", "#11", "#4"),),
            },
        ),
        ChordSpec(
            slug="major-no-fifth",
            quality_symbol=None,
            quality_name="major",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3"),
            family=("triad", "omitted-tone"),
            parenthetical_values=(("omission", "no5"),),
            omitted_degrees=("5",),
            components={"omissions": (ChordComponent("no5", "5"),)},
        ),
        ChordSpec(
            slug="minor-no-fifth",
            quality_symbol="m",
            quality_name="minor",
            base_formula=("1", "b3", "5"),
            sounding_degrees=("1", "b3"),
            family=("triad", "omitted-tone"),
            suffix="m",
            parenthetical_values=(("omission", "no5"),),
            omitted_degrees=("5",),
            components={"omissions": (ChordComponent("no5", "5"),)},
        ),
        ChordSpec(
            slug="major-first-inversion",
            quality_symbol=None,
            quality_name="major",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5"),
            family=("triad", "slash"),
            slash_degree="3",
        ),
        ChordSpec(
            slug="major-second-inversion",
            quality_symbol=None,
            quality_name="major",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5"),
            family=("triad", "slash"),
            slash_degree="5",
        ),
        ChordSpec(
            slug="minor-first-inversion",
            quality_symbol="m",
            quality_name="minor",
            base_formula=("1", "b3", "5"),
            sounding_degrees=("1", "b3", "5"),
            family=("triad", "slash"),
            suffix="m",
            slash_degree="b3",
        ),
        ChordSpec(
            slug="dominant-seventh-third-in-bass",
            quality_symbol=None,
            quality_name="dominant",
            base_formula=("1", "3", "5"),
            sounding_degrees=("1", "3", "5", "b7"),
            family=("seventh", "slash"),
            suffix="7",
            components={"extensions": (ChordComponent("7", "b7"),)},
            slash_degree="3",
        ),
    )


def build_profile(root: str, spec: ChordSpec) -> dict[str, object]:
    bass = (
        pitch_for_degree(root, spec.slash_degree).pitch if spec.slash_degree else None
    )
    normalized_symbol = (
        f"{root}{spec.suffix}{format_parenthetical(spec.parenthetical_values)}"
    )
    if bass is not None:
        normalized_symbol = f"{normalized_symbol}/{bass}"

    sounding_tones = assign_fingering(
        [
            build_tone(root, degree, spec, bass=bass, omitted=False)
            for degree in spec.sounding_degrees
        ]
    )
    omitted_tones = [
        build_tone(root, degree, spec, bass=bass, omitted=True)
        for degree in spec.omitted_degrees
    ]
    tones = sorted(
        [*sounding_tones, *omitted_tones], key=lambda tone: tone.semitones_from_root
    )

    return {
        "id": profile_id(root, spec),
        "normalizedSymbol": normalized_symbol,
        "root": root,
        "bass": bass,
        "displayTokens": display_tokens(root, spec, bass),
        "tones": [tone.to_json() for tone in tones],
    }


def assign_fingering(tones: list[ChordTone]) -> list[ChordTone]:
    """Assign stable, teachable two-hand fingering patterns to sounding tones."""
    ordered = sorted(tones, key=lambda tone: tone.semitones_from_root)
    bass_index = next(index for index, tone in enumerate(ordered) if tone.is_bass)
    bass_position = ordered[bass_index:] + ordered[:bass_index]
    grouped: dict[PianoHand, list[ChordTone]] = {"left": [], "right": []}
    for tone in bass_position:
        hand: PianoHand = (
            "left"
            if tone.is_bass or tone.degree == "1" or tone.teaching_role == "voicing"
            else "right"
        )
        grouped[hand].append(tone)

    patterns: dict[PianoHand, dict[int, tuple[int, ...]]] = {
        "left": {
            1: (5,),
            2: (5, 1),
            3: (5, 3, 1),
            4: (5, 3, 2, 1),
            5: (5, 4, 3, 2, 1),
        },
        "right": {
            1: (3,),
            2: (1, 5),
            3: (1, 3, 5),
            4: (1, 2, 4, 5),
            5: (1, 2, 3, 4, 5),
        },
    }
    assignments: dict[str, tuple[PianoHand, int]] = {}
    for hand, hand_tones in grouped.items():
        if not hand_tones:
            continue
        pattern = patterns[hand].get(len(hand_tones))
        if pattern is None:
            raise ValueError(
                f"{hand} hand has too many tones for a five-finger voicing"
            )
        assignments.update(
            {tone.degree: (hand, finger) for tone, finger in zip(hand_tones, pattern)}
        )
    return [
        replace(
            tone, hand=assignments[tone.degree][0], finger=assignments[tone.degree][1]
        )
        for tone in tones
    ]


def build_tone(
    root: str,
    degree: str,
    spec: ChordSpec,
    *,
    bass: str | None,
    omitted: bool,
) -> ChordTone:
    pitch = pitch_for_degree(root, degree)

    return ChordTone(
        degree=degree,
        pitch=pitch.pitch,
        pitch_class=pitch.pitch_class,
        semitones_from_root=pitch.semitones_from_root,
        teaching_role=teaching_role(degree, spec),
        voicing_role=voicing_role(degree, spec, omitted),
        is_bass=pitch.pitch == (bass or root),
    )


@dataclass(frozen=True)
class DegreePitch:
    pitch: str
    pitch_class: int
    semitones_from_root: int


def pitch_for_degree(root: str, degree: str | None) -> DegreePitch:
    if degree is None:
        raise ValueError("degree is required")

    accidental, number = split_degree(degree)
    root_letter = root[0]
    root_pc = pitch_class(root)
    root_letter_index = LETTER_ORDER.index(root_letter)
    target_letter = LETTER_ORDER[(root_letter_index + ((number - 1) % 7)) % 7]
    semitones = MAJOR_DEGREE_SEMITONES[number] + accidental
    target_pc = (root_pc + semitones) % 12
    pitch = spell_pitch(target_letter, target_pc)
    return DegreePitch(
        pitch=pitch, pitch_class=target_pc, semitones_from_root=semitones
    )


def pitch_class(pitch: str) -> int:
    pc = LETTER_TO_PC[pitch[0]]
    for accidental in pitch[1:]:
        if accidental == "#":
            pc += 1
        elif accidental == "b":
            pc -= 1
        else:
            raise ValueError(f"Unsupported pitch accidental in {pitch}")
    return pc % 12


def split_degree(degree: str) -> tuple[int, int]:
    accidental = 0
    index = 0
    while index < len(degree) and degree[index] in ("b", "#"):
        accidental += -1 if degree[index] == "b" else 1
        index += 1
    return accidental, int(degree[index:])


def spell_pitch(letter: str, target_pc: int) -> str:
    letter_pc = LETTER_TO_PC[letter]
    delta = (target_pc - letter_pc) % 12
    if delta > 6:
        delta -= 12
    if delta == 0:
        return letter
    if delta > 0:
        return f"{letter}{'#' * delta}"
    return f"{letter}{'b' * abs(delta)}"


def teaching_role(degree: str, spec: ChordSpec) -> ChordTeachingRole:
    if degree == "1":
        return "anchor"
    if degree in ("3", "b3", "2", "4"):
        return "quality"
    if degree in ("b5", "#5") and spec.quality_name in ("augmented", "diminished"):
        return "quality"
    if degree in ("7", "b7", "bb7"):
        return "guide"
    if degree == "5":
        return "voicing"
    return "color"


def voicing_role(degree: str, spec: ChordSpec, omitted: bool) -> str:
    if omitted:
        return "omitted"
    if degree == "5" and any(
        family in spec.family for family in ("extended", "altered")
    ):
        return "optional"
    return "required"


def display_tokens(
    root: str, spec: ChordSpec, bass: str | None
) -> list[dict[str, str | None]]:
    tokens: list[dict[str, str | None]] = [
        {"type": "root", "value": root, "teachingRole": "anchor"}
    ]
    suffix_tokens = suffix_display_tokens(spec.suffix)
    tokens.extend(suffix_tokens)
    if spec.parenthetical_values:
        tokens.append({"type": "separator", "value": "(", "teachingRole": None})
        for index, (token_type, value) in enumerate(spec.parenthetical_values):
            if index > 0:
                tokens.append({"type": "separator", "value": ",", "teachingRole": None})
            tokens.append(
                {
                    "type": token_type,
                    "value": value,
                    "teachingRole": token_teaching_role(token_type, value),
                }
            )
        tokens.append({"type": "separator", "value": ")", "teachingRole": None})
    if bass is not None:
        tokens.append({"type": "separator", "value": "/", "teachingRole": None})
        tokens.append({"type": "bass", "value": bass, "teachingRole": "anchor"})
    return tokens


def suffix_display_tokens(suffix: str) -> list[dict[str, str | None]]:
    if not suffix:
        return []
    if suffix == "7sus4":
        return [
            {"type": "extension", "value": "7", "teachingRole": "guide"},
            {"type": "quality", "value": "sus4", "teachingRole": "quality"},
        ]
    if suffix == "9sus4":
        return [
            {"type": "extension", "value": "9", "teachingRole": "color"},
            {"type": "quality", "value": "sus4", "teachingRole": "quality"},
        ]
    if suffix.startswith("m") and suffix not in ("maj7", "maj9", "maj13"):
        remainder = suffix[1:]
        tokens: list[dict[str, str | None]] = [
            {"type": "quality", "value": "m", "teachingRole": "quality"}
        ]
        if remainder:
            if remainder == "7b5":
                return [
                    *tokens,
                    {"type": "extension", "value": "7", "teachingRole": "guide"},
                    {"type": "alteration", "value": "b5", "teachingRole": "color"},
                ]
            token_type = (
                "addition" if remainder.startswith(("6", "add")) else "extension"
            )
            tokens.append(
                {
                    "type": token_type,
                    "value": remainder,
                    "teachingRole": token_teaching_role(token_type, remainder),
                }
            )
        return tokens
    if suffix.startswith("maj"):
        return [
            {
                "type": "extension",
                "value": suffix,
                "teachingRole": token_teaching_role("extension", suffix),
            }
        ]
    if suffix in ("dim", "aug", "sus2", "sus4"):
        return [{"type": "quality", "value": suffix, "teachingRole": "quality"}]
    if suffix in ("6", "6add9"):
        return [{"type": "addition", "value": suffix, "teachingRole": "color"}]
    if suffix.startswith("add") or "add" in suffix:
        return [{"type": "addition", "value": suffix, "teachingRole": "color"}]
    return [
        {
            "type": "extension",
            "value": suffix,
            "teachingRole": token_teaching_role("extension", suffix),
        }
    ]


def token_teaching_role(
    token_type: ChordDisplayTokenType, value: str
) -> ChordTeachingRole | None:
    if token_type == "omission":
        return None
    if token_type in ("addition", "alteration"):
        return "color"
    if token_type == "quality":
        return "quality"
    if token_type in ("root", "bass"):
        return "anchor"
    if token_type == "extension" and value in ("7", "maj7", "Maj7", "dim7"):
        return "guide"
    if token_type == "extension":
        return "color"
    return None


def format_parenthetical(values: tuple[tuple[ChordDisplayTokenType, str], ...]) -> str:
    if not values:
        return ""
    return f"({','.join(value for _, value in values)})"


def profile_id(root: str, spec: ChordSpec) -> str:
    value = f"{pitch_slug(root)}-{spec.slug}"
    if spec.slash_degree is not None:
        bass = pitch_for_degree(root, spec.slash_degree).pitch
        value = f"{value}-over-{pitch_slug(bass)}"
    return value


def pitch_slug(pitch: str) -> str:
    if pitch in FLAT_SLUGS:
        return FLAT_SLUGS[pitch]
    return pitch.replace("#", "-sharp").replace("b", "-flat").lower()


def write_profiles(profiles: list[dict[str, object]], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for existing_file in output_dir.glob("*.json"):
        existing_file.unlink()

    for profile in profiles:
        profile_id_value = profile["id"]
        if not isinstance(profile_id_value, str):
            raise TypeError("Profile id must be a string")
        path = output_dir / f"{profile_id_value}.json"
        path.write_text(
            json.dumps(profile, indent=2, ensure_ascii=True) + "\n", encoding="utf-8"
        )


if __name__ == "__main__":
    main()
