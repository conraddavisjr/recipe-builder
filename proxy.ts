import { NextResponse, type NextRequest } from "next/server";
import { isGateDisabled } from "@/lib/config";
import { createAuthClient, isAllowedEmail } from "@/lib/supabase/auth";

/**
 * Sign-in gate. Every page and API (except the login flow and the machine
 * endpoints, which carry bearer secrets) requires a Supabase Auth session
 * whose email is on the allowlist. A signed-in but unapproved account is
 * signed out and shown a "not on the list" message.
 */
export async function proxy(request: NextRequest) {
  if (isGateDisabled) return NextResponse.next();

  const response = NextResponse.next({ request });
  const supabase = createAuthClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();

  if (user && isAllowedEmail(user.email)) return response;

  const isApi = request.nextUrl.pathname.startsWith("/api/");
  if (user) {
    // Authenticated with Google, but not on the list.
    await supabase.auth.signOut();
    if (isApi) return NextResponse.json({ error: "This account is not approved" }, { status: 403 });
    const denied = NextResponse.redirect(new URL("/login?denied=1", request.url));
    for (const c of response.cookies.getAll()) denied.cookies.set(c);
    return denied;
  }
  if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    // Skip: login flow and OAuth callback, machine endpoints, Next internals, static files.
    "/((?!login|auth/callback|api/auth|api/worker|api/cron|api/runs/import|_next/static|_next/image|favicon.ico|icon|apple-icon|illustrations|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml)).*)",
  ],
};
