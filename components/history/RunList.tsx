"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, LoaderCircle } from "lucide-react";
import type { Run } from "@/lib/types";
import { api } from "@/lib/client/api";

const TRIGGER_LABEL: Record<Run["trigger"], string> = {
  scheduled: "Autonomous run",
  manual: "Run now",
  generator: "Recipe generator",
  similar: "More like this",
  inspiration: "From an inspiration",
};

const STATUS_COLOR: Record<Run["status"], string> = {
  queued: "var(--muted)",
  generating: "var(--gold)",
  rendering: "var(--gold)",
  done: "var(--sage)",
  failed: "var(--accent)",
};

interface Snapshot {
  prompt?: string;
  review?: { issues: string[]; repaired: boolean };
  usage?: { input_tokens: number; output_tokens: number; cache_read_input_tokens: number };
  model?: string;
  recipes?: Array<{ id: string; title: string }>;
}

export function RunList() {
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      api<{ runs: Run[] }>("/api/runs")
        .then(({ runs }) => active && setRuns(runs))
        .catch((e: Error) => active && setError(e.message));
    const t = setTimeout(load, 0);
    const poll = setInterval(load, 5000);
    return () => {
      active = false;
      clearTimeout(t);
      clearInterval(poll);
    };
  }, []);

  if (error) return <p className="text-sm" style={{ color: "var(--accent)" }}>{error}</p>;
  if (!runs) return <div className="shimmer h-40 rounded-xl" />;
  if (runs.length === 0) return <p className="text-sm text-muted">No runs yet. Open Settings and press “Run now”, or enable autonomous runs.</p>;

  return (
    <ul className="space-y-3">
      {runs.map((run) => <RunRow key={run.id} run={run} />)}
    </ul>
  );
}

function RunRow({ run }: { run: Run }) {
  const [open, setOpen] = useState(false);
  const snapshot = (run.context_snapshot ?? null) as Snapshot | null;
  const live = run.status === "queued" || run.status === "generating" || run.status === "rendering";
  return (
    <li className="card overflow-hidden">
      <button type="button" className="flex w-full items-center gap-4 px-4 py-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[run.status] }} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-sm">
            {TRIGGER_LABEL[run.trigger]} · {run.requested_count} recipe{run.requested_count === 1 ? "" : "s"}
            {run.prompt && <span className="font-normal text-muted"> · “{run.prompt.length > 60 ? `${run.prompt.slice(0, 60)}…` : run.prompt}”</span>}
          </span>
          <span className="block text-xs text-muted">
            {new Date(run.created_at).toLocaleString()} · {run.status}
            {run.progress.total > 0 && ` · ${run.progress.done}/${run.progress.total} tasks${run.progress.failed ? `, ${run.progress.failed} failed` : ""}`}
          </span>
        </span>
        {live && <LoaderCircle size={16} className="animate-spin text-muted" />}
        <ChevronDown size={16} className="text-muted transition" style={{ transform: open ? "rotate(180deg)" : undefined }} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-line px-4 py-4 text-sm">
          {run.error && (
            <p className="rounded-lg px-3 py-2" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{run.error}</p>
          )}
          {snapshot?.recipes && snapshot.recipes.length > 0 && (
            <div>
              <p className="label mb-1">Produced</p>
              <ul className="flex flex-wrap gap-2">
                {snapshot.recipes.map((r) => (
                  <li key={r.id}><Link href={`/recipes/${r.id}`} className="chip">{r.title}</Link></li>
                ))}
              </ul>
            </div>
          )}
          {snapshot?.review && (
            <p className="text-xs text-muted">
              Review: {snapshot.review.issues.length === 0 ? "no constraint issues" : `${snapshot.review.issues.length} issue(s) found${snapshot.review.repaired ? ", batch repaired" : ""}`}
              {snapshot.usage && ` · ${snapshot.usage.input_tokens.toLocaleString()} in / ${snapshot.usage.output_tokens.toLocaleString()} out tokens (${snapshot.usage.cache_read_input_tokens.toLocaleString()} cached) · ${snapshot.model}`}
            </p>
          )}
          {snapshot?.review && snapshot.review.issues.length > 0 && (
            <ul className="list-disc pl-5 text-xs text-muted">
              {snapshot.review.issues.map((i, n) => <li key={n}>{i}</li>)}
            </ul>
          )}
          {snapshot?.prompt && (
            <details>
              <summary className="cursor-pointer text-xs font-semibold text-muted">What the agent was shown</summary>
              <pre className="scroll-quiet mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-xs leading-relaxed">{snapshot.prompt}</pre>
            </details>
          )}
        </div>
      )}
    </li>
  );
}
