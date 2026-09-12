import { NextResponse, type NextRequest } from "next/server";
import { createAuthClient, isAllowedEmail } from "@/lib/supabase/auth";

/**
 * GET /auth/callback?code=...&next=/
 * Google sends the browser back here via Supabase; exchange the code for a
 * session cookie, check the allowlist, and continue to the page the person
 * originally asked for.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next") || "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const response = NextResponse.redirect(new URL(safeNext, request.url));
  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", request.url));

  const supabase = createAuthClient(request, response);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=exchange", request.url));
  if (!isAllowedEmail(data.user?.email)) {
    await supabase.auth.signOut();
    const denied = NextResponse.redirect(new URL("/login?denied=1", request.url));
    for (const c of response.cookies.getAll()) denied.cookies.set(c);
    return denied;
  }
  return response;
}
