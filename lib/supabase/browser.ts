"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * The only browser-side Supabase client, and it exists for one purpose:
 * starting Google sign-in. It uses the public anon key, which can do
 * nothing to your data because RLS-free tables are only reachable with the
 * service role key, which never leaves the server.
 */
export function getBrowserSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
