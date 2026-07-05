import { createClient } from '@supabase/supabase-js';

import { trainingSessionSchema, type TrainingSession } from './training-session-schema';

class TrainingSessionApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TrainingSessionApiError';
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function getSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new TrainingSessionApiError(
      'Supabase environment variables are missing. Check MuseBuddy/.env.',
    );
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
    },
  });
}

export async function fetchDailyTrainingSession(): Promise<TrainingSession> {
  const supabase = getSupabaseClient();
  const startedAt = performance.now();

  console.info('Daily training edge function request started.', {
    functionName: 'daily-training-session',
    supabaseUrl,
  });

  const { data, error } = await supabase.functions.invoke('daily-training-session');

  if (error) {
    console.error('Daily training edge function request failed.', {
      durationMs: Math.round(performance.now() - startedAt),
      message: error.message,
      name: error.name,
    });
    throw new TrainingSessionApiError(error.message);
  }

  const session = trainingSessionSchema.parse(data);

  console.info('Daily training edge function request completed.', {
    chordRoot: session.chord.root,
    durationMs: Math.round(performance.now() - startedAt),
    keyArrangementRows: session.keyArrangement.rows.length,
  });

  return session;
}
