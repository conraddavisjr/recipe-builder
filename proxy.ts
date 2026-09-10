import { NextResponse, type NextRequest } from "next/server";
import { isGateDisabled } from "@/lib/config";
import { SESSION_COOKIE, isValidSessionValue } from "@/lib/session";

/**
 * Single-owner password gate.
 *
 * Everything except the login flow and the machine endpoints (worker and
 * cron, which carry their own bearer secrets) requires a valid session
 * cookie. With no APP_PASSWORD configured (local dev) the gate is off.
 */
export async function proxy(request: NextRequest) {
  if (isGateDisabled) return NextResponse.next();

  const ok = await isValidSessionValue(request.cookies.get(SESSION_COOKIE)?.value);
  if (ok) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    // Skip: login flow, machine endpoints, Next internals and static files.
    "/((?!login|api/auth|api/worker|api/cron|_next/static|_next/image|favicon.ico|icon|apple-icon|illustrations|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml)).*)",
  ],
};
