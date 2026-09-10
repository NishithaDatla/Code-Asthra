import { createClient } from '@supabase/supabase-js';
import env from './env.js';

if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
  console.warn('[WARNING] Supabase URL or Service Role Key is missing from environment configuration.');
}

// Server-side Supabase client using Service Role Key
export const supabase = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/**
 * Read-only internal connectivity verification for Supabase.
 * Checks client readiness and network/auth initialization without creating tables or modifying schema.
 */
export async function verifySupabaseConnection() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return {
      success: false,
      message: 'Supabase URL or Service Role Key is missing in environment.'
    };
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error) {
      return {
        success: true,
        message: 'Supabase client initialized and connected successfully.'
      };
    } else {
      return {
        success: false,
        message: `Supabase auth connection check returned error: ${error.message}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to Supabase project: ${error.message}`
    };
  }
}

export default supabase;
