import { createClient } from '@supabase/supabase-js';

import { createLogger } from '@/utils/logger';
import { trainingSessionSchema, type TrainingSession } from './training-session-schema';

class TrainingSessionApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TrainingSessionApiError';
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const logger = createLogger('TrainingSessionApi');

function getSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new TrainingSessionApiError('Supabase environment variables are missing');
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
    },
  });
}

export async function fetchDailyTrainingSession(): Promise<TrainingSession> {
  const supabase = getSupabaseClient();

  logger.info('Daily training edge function request started.', {
    functionName: 'daily-training-session',
    supabaseUrl,
  });

  const { data, error } = await supabase.functions.invoke('daily-training-session');

  if (error) {
    logger.error('Daily training edge function request failed.', {
      message: error.message,
      name: error.name,
    });
    throw new TrainingSessionApiError(error.message);
  }

  const session = trainingSessionSchema.parse(data);

  logger.info('Daily training edge function request completed.');

  return session;
}
