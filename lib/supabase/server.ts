import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the service role key.
 *
 * There is deliberately no browser client: the key would leak. The browser
 * talks to route handlers, route handlers talk to lib/db.ts, and lib/db.ts is
 * the only module that imports this.
 */
export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (see .env.example).",
    );
  }
  cached = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
