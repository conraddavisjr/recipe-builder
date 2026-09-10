"use client";

import { useEffect, useMemo, useState } from "react";
import type { Instruction } from "@/lib/types";
import { api } from "@/lib/client/api";
import { InstructionComposer } from "./InstructionComposer";
import { InstructionList } from "./InstructionList";

export function InstructionsPage() {
  const [instructions, setInstructions] = useState<Instruction[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ instructions: Instruction[] }>("/api/instructions?all=1")
      .then(({ instructions }) => setInstructions(instructions))
      .catch((e: Error) => setError(e.message));
  }, []);

  const truths = useMemo(() => (instructions ?? []).filter((i) => i.tier === "truth"), [instructions]);
  const preferences = useMemo(() => (instructions ?? []).filter((i) => i.tier === "preference"), [instructions]);

  if (error) return <p className="text-sm" style={{ color: "var(--accent)" }}>{error}</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div className="card h-fit p-5 lg:sticky lg:top-20">
        <p className="eyebrow">New instruction</p>
        <h2 className="display mb-4 text-xl">Point the agent</h2>
        <InstructionComposer onSaved={(ins) => setInstructions((list) => [ins, ...(list ?? [])])} />
      </div>
      <div className="space-y-8">
        <section>
          <h2 className="display text-xl">Absolute truths</h2>
          <p className="mb-3 text-sm text-muted">Always applied. Nothing the agent learns later can override these.</p>
          {instructions ? (
            <InstructionList
              instructions={truths}
              onChange={(next) => setInstructions([...next, ...preferences])}
            />
          ) : (
            <div className="shimmer h-20 rounded-xl" />
          )}
        </section>
        <section>
          <h2 className="display text-xl">Preferences</h2>
          <p className="mb-3 text-sm text-muted">Newest first. When two disagree, the newer one wins; mute or delete the old one if you want to be explicit.</p>
          {instructions ? (
            <InstructionList
              instructions={preferences}
              onChange={(next) => setInstructions([...truths, ...next])}
            />
          ) : (
            <div className="shimmer h-20 rounded-xl" />
          )}
        </section>
      </div>
    </div>
  );
}
