import { createClient } from "@supabase/supabase-js";

import {
  type DbArrangementRow,
  dbArrangementRowsSchema,
} from "@shared/daily-training-session-schema.ts";
import { deriveRhythmPattern } from "@shared/rhythm.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "apikey, authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();

  if (request.method === "OPTIONS") {
    logInfo(requestId, "cors_preflight", {
      method: request.method,
    });

    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  logInfo(requestId, "request_started", {
    method: request.method,
    userAgent: request.headers.get("user-agent") ?? "unknown",
  });

  if (request.method !== "POST") {
    logInfo(requestId, "request_rejected", {
      reason: "method_not_allowed",
      status: 405,
    });
    return json({ message: "Method not allowed." }, 405);
  }

  const publishableKey = getPublishableKey();
  const requestApiKey = request.headers.get("apikey");

  if (!publishableKey) {
    logError(requestId, "config_missing", {
      missing: "SUPABASE_PUBLISHABLE_KEYS.default",
    });
    return json(
      { message: "Edge function publishable key is not configured." },
      500,
    );
  }

  if (requestApiKey !== publishableKey) {
    logInfo(requestId, "request_rejected", {
      hasApiKey: requestApiKey !== null,
      reason: "invalid_publishable_key",
      status: 401,
    });
    return json({ message: "Unauthorized." }, 401);
  }

  logInfo(requestId, "request_authorized", {
    hasApiKey: true,
  });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const databaseKey = getSecretKey();

  if (!supabaseUrl || !databaseKey) {
    logError(requestId, "config_missing", {
      hasDatabaseKey: Boolean(databaseKey),
      hasSupabaseUrl: Boolean(supabaseUrl),
    });
    return json({
      message: "Edge function database credentials are not configured.",
    }, 500);
  }

  const supabase = createClient(supabaseUrl, databaseKey, {
    auth: {
      persistSession: false,
    },
  });

  const rpcStartedAt = performance.now();
  logInfo(requestId, "rpc_started", {
    name: "get_daily_training_session_candidate",
  });

  const { data, error } = await supabase.rpc(
    "get_daily_training_session_candidate",
  );

  if (error) {
    logError(requestId, "rpc_failed", {
      code: error.code,
      details: error.details,
      durationMs: elapsed(rpcStartedAt),
      hint: error.hint,
      message: error.message,
    });
    return json({ message: "Training material could not be loaded." }, 500);
  }

  logInfo(requestId, "rpc_completed", {
    durationMs: elapsed(rpcStartedAt),
    rowCount: Array.isArray(data) ? data.length : null,
  });

  let orderedRows: DbArrangementRow[];
  let rhythm: ReturnType<typeof deriveRhythmPattern>;

  try {
    const validationStartedAt = performance.now();
    const rows = dbArrangementRowsSchema.parse(data);
    orderedRows = [...rows].sort((left, right) =>
      left.beat_index - right.beat_index
    );
    rhythm = deriveRhythmPattern(orderedRows);
    logInfo(requestId, "payload_validated", {
      durationMs: elapsed(validationStartedAt),
      rowSummary: summarizeRows(orderedRows),
      rhythmSummary: summarizeRhythm(rhythm),
    });
  } catch (error) {
    logError(requestId, "payload_validation_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return json({ message: "Training material is not valid." }, 500);
  }

  const responseBody = toTrainingSession(orderedRows, rhythm);
  logInfo(requestId, "response_ready", {
    durationMs: elapsed(startedAt),
    status: 200,
    trainingSession: {
      barIndex: responseBody.arrangement.barIndex,
      chordRoot: responseBody.chord.root,
      displayTokenCount: responseBody.chord.displayTokens.length,
      formula: responseBody.chord.qualityBaseFormula,
      songId: responseBody.arrangement.songId,
    },
  });

  return json(responseBody, 200);
});

function toTrainingSession(
  rows: readonly DbArrangementRow[],
  rhythm: ReturnType<typeof deriveRhythmPattern>,
) {
  const firstRow = rows[0];

  return {
    arrangement: {
      barIndex: firstRow.bar_index,
      rows: rows.map((row) => ({
        arrangement: row.arrangement,
        beatIndex: row.beat_index,
        songId: row.song_id,
        velocity: row.velocity,
      })),
      songId: firstRow.song_id,
    },
    chord: {
      displayTokens: firstRow.chord_display_tokens,
      qualityBaseFormula: firstRow.chord_quality_base_formula,
      root: firstRow.chord_root,
    },
    rhythm,
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

function getPublishableKey() {
  const publishableKeys = getSupabaseKeyDictionary("SUPABASE_PUBLISHABLE_KEYS");

  return publishableKeys?.["default"];
}

function getSecretKey() {
  const secretKeys = getSupabaseKeyDictionary("SUPABASE_SECRET_KEYS");

  return secretKeys?.["default"];
}

function getSupabaseKeyDictionary(envName: string) {
  const rawValue = Deno.env.get(envName);

  if (!rawValue) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>;
    const entries = Object.entries(parsed).filter((entry): entry is [
      string,
      string,
    ] => typeof entry[1] === "string");

    return Object.fromEntries(entries);
  } catch {
    return undefined;
  }
}

function summarizeRows(rows: readonly DbArrangementRow[]) {
  return rows.map((row) => ({
    arrangementSlots: row.arrangement.length,
    barIndex: row.bar_index,
    beatIndex: row.beat_index,
    chord: row.chord,
    chordRoot: row.chord_root,
    songId: row.song_id,
    velocitySlots: row.velocity.length,
  }));
}

function summarizeRhythm(rhythm: ReturnType<typeof deriveRhythmPattern>) {
  return rhythm.pattern.reduce(
    (summary, step) => {
      if (step === "s") {
        summary.strong += 1;
      } else if (step === "w") {
        summary.weak += 1;
      } else if (step === "h") {
        summary.hold += 1;
      } else {
        summary.rest += 1;
      }

      return summary;
    },
    {
      averageAttackVelocity: rhythm.averageAttackVelocity,
      hold: 0,
      rest: 0,
      strong: 0,
      totalSteps: rhythm.pattern.length,
      weak: 0,
    },
  );
}

function elapsed(startedAt: number) {
  return Math.round(performance.now() - startedAt);
}

function logInfo(
  requestId: string,
  event: string,
  details: Record<string, unknown> = {},
) {
  console.info(
    JSON.stringify({
      details,
      event,
      requestId,
      source: "daily-training-session",
    }),
  );
}

function logError(
  requestId: string,
  event: string,
  details: Record<string, unknown> = {},
) {
  console.error(
    JSON.stringify({
      details,
      event,
      requestId,
      source: "daily-training-session",
    }),
  );
}
