import { NextResponse, type NextRequest } from "next/server";
import { createAuthClient } from "@/lib/supabase/auth";

/** POST /api/auth/logout -> ends the Supabase session and clears its cookies. */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const supabase = createAuthClient(request, response);
  await supabase.auth.signOut();
  return response;
}
