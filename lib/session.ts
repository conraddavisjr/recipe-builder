import { config } from "@/lib/config";

/**
 * Minimal signed-cookie session for the single-owner password gate.
 *
 * Uses Web Crypto so the same code runs in proxy.ts and in route handlers.
 * The cookie value is "<expiresMs>.<hmac>" and is only valid while the
 * SESSION_SECRET stays the same, so rotating the secret logs everyone out.
 */

export const SESSION_COOKIE = "palate_session";
const SESSION_DAYS = 30;

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(config.sessionSecret || "dev-only-insecure-secret"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSessionValue(): Promise<{ value: string; expires: Date }> {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const stamp = String(expires.getTime());
  return { value: `${stamp}.${await hmac(stamp)}`, expires };
}

export async function isValidSessionValue(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [stamp, sig] = value.split(".");
  if (!stamp || !sig) return false;
  if (Number(stamp) < Date.now()) return false;
  const expected = await hmac(stamp);
  // Constant-time compare; both are fixed-length hex.
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

/** Timing-safe equality for the password itself. */
export function passwordMatches(candidate: string): boolean {
  const expected = config.appPassword;
  if (!expected) return true;
  if (candidate.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ candidate.charCodeAt(i);
  return diff === 0;
}
