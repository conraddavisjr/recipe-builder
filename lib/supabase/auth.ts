import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";

/**
 * Supabase Auth on the server: reads the session cookies from a request and
 * writes refreshed ones onto the response. Used by proxy.ts (the gate), the
 * OAuth callback and sign-out. Separate from the service-role client in
 * server.ts, which is for data and never carries a user session.
 */
export function createAuthClient(request: NextRequest, response: NextResponse) {
  return createServerClient(config.supabasePublicUrl, config.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) response.cookies.set(name, value, options);
      },
    },
  });
}

/** Allowlist check. Manually pre-approved emails only, for now. */
export function isAllowedEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return config.allowedEmails.includes(email.trim().toLowerCase());
}
