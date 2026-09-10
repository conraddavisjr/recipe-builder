"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, Sparkles } from "lucide-react";
import type { RecipeCard as RecipeCardData, Run } from "@/lib/types";
import { api } from "@/lib/client/api";
import { RecipeCard } from "@/components/recipes/RecipeCard";

/**
 * Describe a craving, get drafts, keep the ones you like. Drafts live as
 * status=candidate and only the kept ones join the library.
 */
export function Generator() {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(3);
  const [run, setRun] = useState<Run | null>(null);
  const [candidates, setCandidates] = useState<RecipeCardData[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kept, setKept] = useState<number | null>(null);

  // Generation takes minutes; if the person navigated away and came back,
  // pick up the latest generator run that still has undecided drafts.
  useEffect(() => {
    let active = true;
    api<{ runs: Run[] }>("/api/runs")
      .then(async ({ runs }) => {
        const latest = runs.find((r) => r.trigger === "generator" && r.status !== "failed");
        if (!latest || !active) return;
        const data = await api<{ run: Run; recipes: RecipeCardData[] }>(`/api/runs/${latest.id}`);
        if (!active) return;
        const live = data.run.status === "queued" || data.run.status === "generating" || data.run.status === "rendering";
        if (data.recipes.length > 0 || live) {
          setRun(data.run);
          setCandidates(data.recipes);
          setPrompt((p) => p || data.run.prompt || "");
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setKept(null);
    setCandidates([]);
    setSelected(new Set());
    try {
      const { run } = await api<{ run: Run }>("/api/runs", { method: "POST", json: { trigger: "generator", prompt: prompt.trim(), count } });
      setRun(run);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Poll the run until it settles; candidates appear as soon as text exists.
  const live = run && (run.status === "queued" || run.status === "generating" || run.status === "rendering");
  useEffect(() => {
    if (!run || !live) return;
    const t = setInterval(async () => {
      try {
        const data = await api<{ run: Run; recipes: RecipeCardData[] }>(`/api/runs/${run.id}`);
        setRun(data.run);
        setCandidates(data.recipes);
      } catch (err) {
        setError((err as Error).message);
      }
    }, 3000);
    return () => clearInterval(t);
  }, [run, live]);

  async function keep() {
    if (!run) return;
    setBusy(true);
    try {
      const { kept } = await api<{ kept: string[] }>(`/api/runs/${run.id}/keep`, { method: "POST", json: { keep_ids: [...selected] } });
      setKept(kept.length);
      setCandidates([]);
      setRun(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={start} className="card p-7">
        <label htmlFor="craving" className="label">What are you in the mood for?</label>
        <textarea
          id="craving"
          className="textarea textarea-journal mt-1"
          placeholder="e.g. Something brothy and warming with a lot of ginger, under 45 minutes, that would look good in a deep bowl."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={2000}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="label">Drafts</span>
            <select className="select w-auto" value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy || prompt.trim().length < 3 || Boolean(live)}>
            {busy || live ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />} Generate drafts
          </button>
        </div>
        {error && <p className="mt-3 text-sm" style={{ color: "var(--accent)" }}>{error}</p>}
      </form>

      {run && (
        <div className="flex items-center gap-3 text-sm text-muted">
          {live && <LoaderCircle size={16} className="animate-spin" style={{ color: "var(--accent)" }} />}
          <span>
            {run.status === "queued" && "Waiting for the kitchen..."}
            {run.status === "generating" && "Composing drafts from your prompt and profile..."}
            {run.status === "rendering" && `Drafts ready. Photographing (${run.progress.done}/${run.progress.total})...`}
            {run.status === "done" && "Drafts ready. Pick the ones worth keeping."}
            {run.status === "failed" && `Run failed: ${run.error ?? "unknown error"}`}
          </span>
        </div>
      )}

      {candidates.length > 0 && (
        <div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((c) => {
              const on = selected.has(c.id);
              return (
                <div key={c.id} className="relative">
                  <RecipeCard recipe={c} />
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSelected((s) => { const n = new Set(s); if (on) n.delete(c.id); else n.add(c.id); return n; })}
                    className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow transition"
                    style={{ background: on ? "var(--accent)" : "var(--surface)", color: on ? "var(--accent-ink)" : "var(--ink)" }}
                  >
                    <Check size={13} strokeWidth={3} /> {on ? "Keeping" : "Keep"}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-sm text-muted">{selected.size} of {candidates.length} selected. Unselected drafts are deleted{run?.status === "rendering" ? "; photos keep rendering for the ones you keep" : ""}.</p>
            <button type="button" className="btn btn-primary" onClick={keep} disabled={busy}>
              {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />} Keep {selected.size || ""} in library
            </button>
          </div>
        </div>
      )}

      {kept !== null && (
        <p className="text-sm">
          Saved {kept} recipe{kept === 1 ? "" : "s"} to your library. <Link href="/" className="font-semibold" style={{ color: "var(--accent)" }}>See them</Link>
        </p>
      )}
    </div>
  );
}
