import { NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionValue, passwordMatches } from "@/lib/session";

/** POST /api/auth/login { password } -> sets the session cookie. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { password?: string };
  if (!passwordMatches(body.password ?? "")) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const { value, expires } = await createSessionValue();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  });
  return res;
}
