"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export function GoogleButton() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const denied = params.get("denied") === "1";
  const failed = params.get("error");

  async function signIn() {
    setBusy(true);
    setError(null);
    const next = params.get("next") || "/";
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await getBrowserSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback, queryParams: { prompt: "select_account" } },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <button type="button" className="btn btn-primary w-full" onClick={signIn} disabled={busy}>
        {busy ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.6 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.4-5.1l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C40.9 35.6 44 30.2 44 24c0-1.2-.1-2.4-.4-3.5z"/></svg>
        )}
        Sign in with Google
      </button>
      {denied && <p className="text-sm" style={{ color: "var(--accent)" }}>That Google account is not on the approved list yet.</p>}
      {failed && <p className="text-sm" style={{ color: "var(--accent)" }}>Sign-in did not complete. Please try again.</p>}
      {error && <p className="text-sm" style={{ color: "var(--accent)" }}>{error}</p>}
    </div>
  );
}
