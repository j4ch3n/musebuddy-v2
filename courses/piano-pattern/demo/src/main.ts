import {
  Accidental,
  Dot,
  Factory,
  Stem,
  type StaveNote,
} from "vexflow";

import "./style.css";

type StemDirection = "up" | "down" | null;

interface VexFlowEvent {
  id: string;
  type: "note" | "rest";
  keys: string[];
  duration: string;
  dots: number;
  accidentals: Array<string | null>;
  stem_direction: StemDirection;
}

interface VexFlowVoice {
  id: string;
  events: VexFlowEvent[];
}

interface VexFlowStave {
  clef: "treble" | "bass";
  voices: VexFlowVoice[];
}

interface VexFlowBeam {
  stave: "treble" | "bass";
  voice: string;
  event_ids: string[];
}

interface VexFlowMeasure {
  index: number;
  staves: {
    treble: VexFlowStave;
    bass: VexFlowStave;
  };
  beams: VexFlowBeam[];
}

interface VexFlowTieEndpoint {
  event_id: string;
  key_indices: number[];
}

interface VexFlowTie {
  from: VexFlowTieEndpoint;
  to: VexFlowTieEndpoint;
}

interface VexFlowScore {
  format: "vexflow";
  format_version: 1;
  time_signature: "4/4";
  key_signature: string;
  measures: VexFlowMeasure[];
  ties: VexFlowTie[];
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Demo page is missing ${selector}.`);
  }
  return element;
}

const scoreElement = requireElement<HTMLDivElement>("#score");
const statusElement = requireElement<HTMLParagraphElement>("#status");
const patternSelect = requireElement<HTMLSelectElement>("#pattern");

function createNote(
  factory: Factory,
  event: VexFlowEvent,
  clef: VexFlowStave["clef"],
): StaveNote {
  const duration = `${event.duration}${"d".repeat(event.dots)}${event.type === "rest" ? "r" : ""}`;
  const note = factory.StaveNote({
    keys: event.keys,
    duration,
    clef,
    stemDirection:
      event.stem_direction === "up"
        ? Stem.UP
        : event.stem_direction === "down"
          ? Stem.DOWN
          : undefined,
  });

  for (let dotIndex = 0; dotIndex < event.dots; dotIndex += 1) {
    Dot.buildAndAttach([note], { all: true });
  }

  event.accidentals.forEach((accidental, keyIndex) => {
    if (accidental) {
      note.addModifier(new Accidental(accidental), keyIndex);
    }
  });

  return note;
}

function renderScore(data: VexFlowScore): void {
  scoreElement.replaceChildren();

  const firstMeasureWidth = 330;
  const measureWidth = 280;
  const margin = 24;
  const scoreWidth =
    margin * 2 +
    firstMeasureWidth +
    Math.max(0, data.measures.length - 1) * measureWidth;
  const scoreHeight = 340;
  const factory = new Factory({
    renderer: {
      elementId: scoreElement.id,
      width: scoreWidth,
      height: scoreHeight,
    },
  });
  const notesById = new Map<string, StaveNote>();

  data.measures.forEach((measure, measureIndex) => {
    const width = measureIndex === 0 ? firstMeasureWidth : measureWidth;
    const x =
      margin +
      (measureIndex === 0
        ? 0
        : firstMeasureWidth + (measureIndex - 1) * measureWidth);
    const system = factory.System({
      x,
      y: 55,
      width,
      // VexFlow expresses this value in stave spaces, not CSS pixels.
      spaceBetweenStaves: 10,
      // Move rests toward their surrounding voice so they do not sit on notes
      // from a simultaneous voice.
      formatOptions: { alignRests: true },
    });

    for (const staveName of ["treble", "bass"] as const) {
      const staveData = measure.staves[staveName];
      const voices = staveData.voices.map((voiceData) => {
        const notes = voiceData.events.map((event) => {
          const note = createNote(factory, event, staveData.clef);
          notesById.set(event.id, note);
          return note;
        });

        return factory
          .Voice({ time: data.time_signature })
          .addTickables(notes);
      });
      const stave = system.addStave({ voices });

      if (measureIndex === 0) {
        stave
          .addClef(staveData.clef)
          .addKeySignature(data.key_signature)
          .addTimeSignature(data.time_signature);
      }
    }

    if (measureIndex === 0) {
      system.addConnector("brace");
      system.addConnector("singleLeft");
    }

    for (const beam of measure.beams) {
      const notes = beam.event_ids.map((eventId) => {
        const note = notesById.get(eventId);
        if (!note) {
          throw new Error(`Beam references unknown event ${eventId}.`);
        }
        return note;
      });
      factory.Beam({ notes });
    }
  });

  for (const tie of data.ties) {
    const from = notesById.get(tie.from.event_id);
    const to = notesById.get(tie.to.event_id);
    if (!from || !to) {
      throw new Error("Tie references an unknown event.");
    }
    factory.StaveTie({
      from,
      to,
      firstIndexes: tie.from.key_indices,
      lastIndexes: tie.to.key_indices,
    });
  }

  factory.draw();
}

function isVexFlowScore(value: unknown): value is VexFlowScore {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<VexFlowScore>;
  return (
    candidate.format === "vexflow" &&
    candidate.format_version === 1 &&
    candidate.time_signature === "4/4" &&
    typeof candidate.key_signature === "string" &&
    Array.isArray(candidate.measures) &&
    Array.isArray(candidate.ties)
  );
}

async function loadPattern(stem: string): Promise<void> {
  statusElement.dataset.error = "false";
  statusElement.textContent = `Loading ${stem}…`;

  try {
    const response = await fetch(`/${stem}.scores.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data: unknown = await response.json();
    if (!isVexFlowScore(data)) {
      throw new Error("The file is not VexFlow format version 1.");
    }

    renderScore(data);
    statusElement.textContent = `${stem} · ${data.measures.length} measures · ${data.key_signature} major key signature`;
  } catch (error) {
    scoreElement.replaceChildren();
    statusElement.dataset.error = "true";
    statusElement.textContent =
      error instanceof Error ? `Unable to render: ${error.message}` : "Unable to render.";
  }
}

patternSelect.addEventListener("change", () => {
  void loadPattern(patternSelect.value);
});

void loadPattern(patternSelect.value);
