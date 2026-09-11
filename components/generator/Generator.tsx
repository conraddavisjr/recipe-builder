"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, Sparkles, Trash } from "lucide-react";
import type { RecipeCard as RecipeCardData, Run } from "@/lib/types";
import { api } from "@/lib/client/api";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/**
 * Describe a craving, get drafts, keep the ones you like.
 *
 * Every "Keep" click is written to the database immediately (status=saved),
 * so a refresh, another tab, or closing the laptop never loses a choice.
 * Unkept drafts stay as drafts until you explicitly discard them, and
 * discarding always asks first.
 */
export function Generator() {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(3);
  const [run, setRun] = useState<Run | null>(null);
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const live = run && (run.status === "queued" || run.status === "generating" || run.status === "rendering");
  const drafts = recipes.filter((r) => r.status === "candidate");
  const kept = recipes.filter((r) => r.status === "saved");

  // Resume the latest generator run that still has anything to show.
  useEffect(() => {
    let active = true;
    api<{ runs: Run[] }>("/api/runs")
      .then(async ({ runs }) => {
        const latest = runs.find((r) => r.trigger === "generator" && r.status !== "failed");
        if (!latest || !active) return;
        const data = await api<{ run: Run; recipes: RecipeCardData[] }>(`/api/runs/${latest.id}`);
        if (!active) return;
        const isLive = data.run.status === "queued" || data.run.status === "generating" || data.run.status === "rendering";
        if (data.recipes.length > 0 || isLive) {
          setRun(data.run);
          setRecipes(data.recipes);
          setPrompt((p) => p || data.run.prompt || "");
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Poll while the run is producing.
  useEffect(() => {
    if (!run || !live) return;
    const t = setInterval(async () => {
      try {
        const data = await api<{ run: Run; recipes: RecipeCardData[] }>(`/api/runs/${run.id}`);
        setRun(data.run);
        setRecipes(data.recipes);
      } catch (err) {
        setError((err as Error).message);
      }
    }, 3000);
    return () => clearInterval(t);
  }, [run, live]);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy("start");
    setError(null);
    setRecipes([]);
    try {
      const { run } = await api<{ run: Run }>("/api/runs", { method: "POST", json: { trigger: "generator", prompt: prompt.trim(), count } });
      setRun(run);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function keep(recipe: RecipeCardData, keep: boolean) {
    setBusy(recipe.id);
    setError(null);
    try {
      const { recipe: updated } = await api<{ recipe: RecipeCardData }>(`/api/recipes/${recipe.id}/keep`, { method: "POST", json: { keep } });
      setRecipes((list) => list.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function discardDrafts() {
    if (!run || drafts.length === 0) return;
    setBusy("discard");
    try {
      await api(`/api/runs/${run.id}/discard`, { method: "POST", json: { recipe_ids: drafts.map((d) => d.id) } });
      setRecipes((list) => list.filter((r) => r.status === "saved"));
      setConfirmDiscard(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={start} className="card p-7">
        <label htmlFor="craving" className="label">What are you in the mood for?</label>
        <textarea id="craving" className="textarea textarea-journal mt-1" placeholder="e.g. Something brothy and warming with a lot of ginger, under 45 minutes, that would look good in a deep bowl." value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={2000} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="label">Drafts</span>
            <select className="select w-auto" value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy === "start" || prompt.trim().length < 3 || Boolean(live)}>
            {busy === "start" || live ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />} Generate drafts
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">Generation runs in the background. You can leave this page; come back and the drafts will be here.</p>
        {error && <p className="mt-3 text-sm" style={{ color: "var(--accent)" }}>{error}</p>}
      </form>

      {run && (
        <div className="flex items-center gap-3 text-sm text-muted">
          {live && <LoaderCircle size={16} className="animate-spin" style={{ color: "var(--accent)" }} />}
          <span>
            {run.status === "queued" && "Waiting for the kitchen..."}
            {run.status === "generating" && "Composing drafts from your prompt and profile..."}
            {run.status === "rendering" && `Drafts ready. Photographing (${run.progress.done}/${run.progress.total})...`}
            {run.status === "done" && (drafts.length > 0 ? "Drafts ready. Keep the ones worth cooking; each Keep is saved instantly." : kept.length > 0 ? "All decided." : "Drafts ready.")}
            {run.status === "failed" && `Run failed: ${run.error ?? "unknown error"}`}
          </span>
        </div>
      )}

      {recipes.length > 0 && (
        <div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((c) => {
              const on = c.status === "saved";
              return (
                <div key={c.id} className="relative">
                  <RecipeCard recipe={c} />
                  <button
                    type="button"
                    aria-pressed={on}
                    disabled={busy !== null}
                    onClick={() => keep(c, !on)}
                    className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium shadow transition"
                    style={{ background: on ? "var(--ink)" : "rgb(249 248 243 / 0.94)", color: on ? "var(--accent-ink)" : "var(--ink)" }}
                    title={on ? "In your library. Click to return it to a draft." : "Save to your library"}
                  >
                    {busy === c.id ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} strokeWidth={3} />} {on ? "Kept" : "Keep"}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-sm text-muted">
              {kept.length} kept{kept.length > 0 && <> (<Link href="/" className="font-medium text-ink underline-offset-2 hover:underline">in your library</Link>)</>}, {drafts.length} still draft{drafts.length === 1 ? "" : "s"}.
            </p>
            {drafts.length > 0 && (
              <button type="button" className="btn btn-text text-muted" disabled={busy !== null || Boolean(live)} onClick={() => setConfirmDiscard(true)}>
                <Trash size={14} /> Discard the {drafts.length} unkept draft{drafts.length === 1 ? "" : "s"}
              </button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDiscard}
        title={`Discard ${drafts.length} draft${drafts.length === 1 ? "" : "s"}?`}
        body={`${drafts.map((d) => d.title).join("; ")}. Kept recipes are not affected. This cannot be undone.`}
        confirmLabel="Discard drafts"
        busy={busy === "discard"}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={discardDrafts}
      />
    </div>
  );
}
