import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  type ChordProfileRow,
  chordProfileRowSchema,
  type PianoPatternNoteRow,
  pianoPatternNoteRowSchema,
  pianoPatternRowSchema,
  pianoPatternScoreRowSchema,
} from "../_shared/daily-piano-pattern-schema.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "apikey, authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  if (request.method !== "POST") {
    return json({ message: "Method not allowed." }, 405);
  }

  const publishableKey = getKey(
    "SUPABASE_PUBLISHABLE_KEYS",
    "SUPABASE_ANON_KEY",
  );
  if (!publishableKey) {
    logError(requestId, "config_missing", {
      missing: "SUPABASE_PUBLISHABLE_KEYS.default",
    });
    return json(
      { message: "Edge function publishable key is not configured." },
      500,
    );
  }

  if (request.headers.get("apikey") !== publishableKey) {
    return json({ message: "Unauthorized." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const databaseKey = getKey(
    "SUPABASE_SECRET_KEYS",
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  if (!supabaseUrl || !databaseKey) {
    logError(requestId, "config_missing", {
      hasDatabaseKey: Boolean(databaseKey),
      hasSupabaseUrl: Boolean(supabaseUrl),
    });
    return json(
      { message: "Edge function database credentials are not configured." },
      500,
    );
  }

  const supabase = createClient(supabaseUrl, databaseKey, {
    auth: { persistSession: false },
  });
  const { data: candidate, error: candidateError } = await supabase.rpc(
    "get_daily_piano_pattern_candidate",
  );

  if (candidateError) {
    logDatabaseError(requestId, "candidate_failed", candidateError);
    return json({ message: "Training material could not be loaded." }, 500);
  }

  if (typeof candidate !== "string" || candidate.length === 0) {
    return json({ message: "No daily piano pattern is available." }, 404);
  }

  const [patternResult, notesResult, scoreResult] = await Promise.all([
    supabase.from("piano_patterns").select("*").eq("id", candidate).single(),
    supabase
      .from("piano_pattern_notes")
      .select("*")
      .eq("pattern_id", candidate)
      .order("bar_index")
      .order("beat_index"),
    supabase
      .from("piano_pattern_scores")
      .select("*")
      .eq("pattern_id", candidate)
      .single(),
  ]);

  for (
    const [event, result] of [
      ["pattern_failed", patternResult],
      ["notes_failed", notesResult],
      ["score_failed", scoreResult],
    ] as const
  ) {
    if (result.error) {
      logDatabaseError(requestId, event, result.error);
      return json({ message: "Training material could not be loaded." }, 500);
    }
  }

  try {
    const pattern = pianoPatternRowSchema.parse(patternResult.data);
    const notes = z.array(pianoPatternNoteRowSchema).min(1).parse(
      notesResult.data,
    );
    const score = pianoPatternScoreRowSchema.parse(scoreResult.data);
    validatePattern(pattern.id, notes, score.pattern_id, score.measures.length);

    const chordIds = uniqueChordIds(notes);
    const { data: profileData, error: profileError } = await supabase
      .from("chord_profiles")
      .select("id,displayTokens,normalizedSymbol,root,tones")
      .in("id", chordIds);

    if (profileError) {
      logDatabaseError(requestId, "chord_profiles_failed", profileError);
      return json({ message: "Training material could not be loaded." }, 500);
    }

    const profiles = z.array(chordProfileRowSchema).parse(profileData);
    const profilesById = new Map(
      profiles.map((profile) => [profile.id, profile]),
    );
    const orderedProfiles = chordIds.map((chordId) => {
      const profile = profilesById.get(chordId);
      if (!profile) {
        throw new Error(`Chord profile ${chordId} is missing.`);
      }
      return profile;
    });
    const responseBody = {
      chords: orderedProfiles.map(toTrainingChord),
      notes: {
        beats: notes.map(toBeat),
        pattern: {
          id: pattern.id,
          key_signature_display: pattern.key_signature_display,
          progression_in_major_scale: pattern.progression_in_major_scale,
          progression_in_minor_scale: pattern.progression_in_minor_scale,
          time_signature: pattern.time_signature,
          title: pattern.name,
        },
      },
      score: {
        format: score.format,
        format_version: score.format_version,
        key_signature: score.key_signature,
        measures: score.measures,
        ties: score.ties,
        time_signature: score.time_signature,
      },
      version: 1,
    };

    logInfo(requestId, "piano_pattern_selected", {
      chordIds,
      measureCount: score.measures.length,
      noteRowCount: notes.length,
      patternId: pattern.id,
    });
    return json(responseBody, 200);
  } catch (error) {
    logError(requestId, "payload_validation_failed", {
      error: error instanceof Error ? error.message : String(error),
      patternId: candidate,
    });
    return json({ message: "Training material is not valid." }, 500);
  }
});

function validatePattern(
  patternId: string,
  notes: readonly PianoPatternNoteRow[],
  scorePatternId: string,
  measureCount: number,
) {
  if (scorePatternId !== patternId || notes.length !== measureCount * 2) {
    throw new Error(
      "Pattern, notes, and score do not describe the same material.",
    );
  }

  notes.forEach((note, index) => {
    const expectedBarIndex = Math.floor(index / 2);
    const expectedBeatIndex = index % 2;
    if (
      note.pattern_id !== patternId ||
      note.bar_index !== expectedBarIndex ||
      note.beat_index !== expectedBeatIndex
    ) {
      throw new Error(`Note row ${index} is not in contiguous score order.`);
    }

    validateStave(
      note.treble_arrangement,
      note.treble_velocity,
      `note ${note.id} treble`,
    );
    validateStave(
      note.bass_arrangement,
      note.bass_velocity,
      `note ${note.id} bass`,
    );
  });
}

function validateStave(
  arrangement: readonly (readonly (number | null)[])[],
  velocity: readonly (readonly (number | null)[])[],
  label: string,
) {
  arrangement.forEach((slot, slotIndex) => {
    const velocitySlot = velocity[slotIndex];
    if (!velocitySlot || velocitySlot.length !== slot.length) {
      throw new Error(`${label} slot ${slotIndex} has mismatched lanes.`);
    }

    slot.forEach((midi, laneIndex) => {
      const cellVelocity = velocitySlot[laneIndex];
      if (midi === null || midi === -50) {
        if (cellVelocity !== null) {
          throw new Error(`${label} rest or hold has velocity.`);
        }
      } else if (
        midi <= 0 ||
        midi > 127 ||
        cellVelocity === null ||
        cellVelocity === undefined
      ) {
        throw new Error(`${label} attack is invalid.`);
      }
    });
  });
}

function uniqueChordIds(notes: readonly PianoPatternNoteRow[]) {
  return [...new Set(notes.map((note) => note.chord))];
}

function toBeat(note: PianoPatternNoteRow) {
  return {
    bar_index: note.bar_index,
    beat_index: note.beat_index,
    chord: note.chord,
    id: note.id,
    pattern_id: note.pattern_id,
    staves: {
      bass: {
        arrangement: note.bass_arrangement,
        velocity: note.bass_velocity,
      },
      treble: {
        arrangement: note.treble_arrangement,
        velocity: note.treble_velocity,
      },
    },
  };
}

function toTrainingChord(profile: ChordProfileRow) {
  return {
    displayTokens: profile.displayTokens,
    idName: profile.id,
    normalizedSymbol: profile.normalizedSymbol,
    root: profile.root,
    tones: profile.tones,
  };
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
}

function getKey(environmentName: string, fallbackEnvironmentName: string) {
  const rawValue = Deno.env.get(environmentName);
  if (!rawValue) {
    return Deno.env.get(fallbackEnvironmentName);
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>;
    const value = parsed.default;
    return typeof value === "string"
      ? value
      : Deno.env.get(fallbackEnvironmentName);
  } catch {
    return Deno.env.get(fallbackEnvironmentName);
  }
}

function logDatabaseError(
  requestId: string,
  event: string,
  error: {
    code?: string;
    details?: string;
    hint?: string;
    message: string;
  },
) {
  logError(requestId, event, {
    code: error.code,
    details: error.details,
    hint: error.hint,
    message: error.message,
  });
}

function logInfo(
  requestId: string,
  event: string,
  details: Record<string, unknown> = {},
) {
  console.info(JSON.stringify({
    details,
    event,
    requestId,
    source: "daily-piano-pattern",
  }));
}

function logError(
  requestId: string,
  event: string,
  details: Record<string, unknown> = {},
) {
  console.error(JSON.stringify({
    details,
    event,
    requestId,
    source: "daily-piano-pattern",
  }));
}
