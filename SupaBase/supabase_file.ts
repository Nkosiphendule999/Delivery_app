import{createClient} from '@supabase/supabase-js';

const supabase_URL = process.env.EXPO_PUBLIC_supabase_url as string | undefined;
const supabase_API_key = process.env.EXPO_PUBLIC_supabase_API_key as string | undefined;

if (!supabase_URL || !supabase_API_key) {
  throw new Error('Supabase URL and API key must be defined in .env');
}

export const supabase = createClient(supabase_URL, supabase_API_key);
