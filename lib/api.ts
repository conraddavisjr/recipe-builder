import { NextResponse } from "next/server";
import type { ZodType } from "zod";

/**
 * Shared route-handler plumbing so every endpoint reports errors the same way.
 */

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

/** Parse a JSON body against a schema; returns a 400 response on failure. */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<{ data: T } | { response: NextResponse }> {
  const raw = await request.json().catch(() => null);
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { response: apiError(`Invalid input: ${issue?.path.join(".") || "body"} ${issue?.message ?? ""}`.trim(), 400) };
  }
  return { data: result.data };
}

/** Wrap a handler body so thrown errors become 500 JSON instead of HTML. */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(message);
    return apiError(message);
  }
}

/** Constant-time bearer check for machine endpoints (worker, cron). */
export function bearerMatches(request: Request, secret: string): boolean {
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}
