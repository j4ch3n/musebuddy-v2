import { createClient } from "@supabase/supabase-js";

import {
  type DbArrangementRow,
  dbArrangementRowsSchema,
} from "@shared/daily-training-session-schema.ts";

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
    return json({ message: "Unauthorized." }, 401);
  }

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

  const { data, error } = await supabase.rpc(
    "get_daily_training_session_candidate",
  );

  if (error) {
    logError(requestId, "rpc_failed", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    });
    return json({ message: "Training material could not be loaded." }, 500);
  }

  let orderedRows: DbArrangementRow[];

  try {
    const rows = dbArrangementRowsSchema.parse(data);
    orderedRows = [...rows].sort((left, right) =>
      left.beat_index - right.beat_index
    );
    logInfo(requestId, "training_material_selected", {
      barIndex: orderedRows[0].bar_index,
      beatIndexes: orderedRows.map((row) => row.beat_index),
      chordName: orderedRows[0].chord,
      durationSteps: countArrangementSteps(orderedRows),
      songId: orderedRows[0].song_id,
    });
  } catch (error) {
    logError(requestId, "payload_validation_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return json({ message: "Training material is not valid." }, 500);
  }

  const responseBody = toTrainingSession(orderedRows);

  return json(responseBody, 200);
});

function toTrainingSession(rows: readonly DbArrangementRow[]) {
  const firstRow = rows[0];

  return {
    chord: {
      displayTokens: firstRow.chord_display_tokens,
      qualityBaseFormula: firstRow.chord_quality_base_formula,
      root: firstRow.chord_root,
    },
    keyArrangement: {
      rows: rows.map((row) => ({
        beatIndex: row.beat_index,
        slots: row.arrangement.map((slot, slotIndex) =>
          slot.map((midi, laneIndex) => ({
            midi,
            velocity: row.velocity[slotIndex][laneIndex],
          }))
        ),
      })),
    },
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

function countArrangementSteps(rows: readonly DbArrangementRow[]) {
  return rows.reduce((total, row) => total + row.arrangement.length, 0);
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
