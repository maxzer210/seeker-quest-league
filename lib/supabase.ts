import { createClient } from '@supabase/supabase-js';

// ⚠️  Replace these after creating your Supabase project
export const SUPABASE_URL  = 'https://qxejdpvjggqjqoydujjd.supabase.co';
export const SUPABASE_ANON = 'sb_publishable_7uDgdB9y8X3n0eSaSefw1w_X_9H3Fjj';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false },
});

export type PlayerRow = {
  device_id:  string;
  username:   string;
  orb:        number;
  level:      number;
  streak:     number;
  season_orb: number;
};
