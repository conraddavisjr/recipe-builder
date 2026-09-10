"use client";

import { useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import type { Instruction, InstructionTier } from "@/lib/types";
import { api } from "@/lib/client/api";

/**
 * The two-tier instruction input.
 *  truth      - absolute; the agent never overrides it
 *  preference - cascading; newer preferences win over older ones
 * Used inside the drawer (with optional recipe context) and on /instructions.
 */
export function InstructionComposer({
  recipeId,
  recipeTitle,
  onSaved,
  autoFocus,
}: {
  recipeId?: string;
  recipeTitle?: string;
  onSaved?: (instruction: Instruction) => void;
  autoFocus?: boolean;
}) {
  const [tier, setTier] = useState<InstructionTier>("preference");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const { instruction } = await api<{ instruction: Instruction }>("/api/instructions", {
        method: "POST",
        json: { tier, body: body.trim(), recipe_id: recipeId ?? null },
      });
      setBody("");
      onSaved?.(instruction);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Instruction tier">
        <TierOption
          active={tier === "preference"}
          onClick={() => setTier("preference")}
          title="Preference"
          hint="Can change over time. Newer beats older."
        />
        <TierOption
          active={tier === "truth"}
          onClick={() => setTier("truth")}
          title="Absolute truth"
          hint="Never overridden. Allergies, hard rules."
        />
      </div>
      <textarea
        className="textarea"
        autoFocus={autoFocus}
        placeholder={
          recipeTitle
            ? `Something about “${recipeTitle}” the agent should know, e.g. “less chili than this, but keep the smoke.”`
            : tier === "truth"
              ? "e.g. “I am allergic to walnuts.” or “Weeknight dinners must be under 40 minutes.”"
              : "e.g. “Lately I want more brothy, soupy dishes and fewer heavy sauces.”"
        }
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={4000}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(e);
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{error ? <span style={{ color: "var(--accent)" }}>{error}</span> : "Cmd+Enter to send"}</p>
        <button type="submit" className="btn btn-primary" disabled={busy || !body.trim()}>
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
          Tell the agent
        </button>
      </div>
    </form>
  );
}

function TierOption({ active, onClick, title, hint }: { active: boolean; onClick: () => void; title: string; hint: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      data-active={active}
      className="rounded-xl border px-3 py-2 text-left transition data-[active=true]:border-accent data-[active=true]:bg-accent-soft"
      style={{ borderColor: active ? "var(--accent)" : "var(--line)" }}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="block text-xs text-muted">{hint}</span>
    </button>
  );
}
