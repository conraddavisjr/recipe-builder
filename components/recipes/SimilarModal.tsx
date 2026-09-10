"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, Sparkles, X } from "lucide-react";
import type { SimilarityAxis } from "@/lib/types";
import { api } from "@/lib/client/api";

const AXES: Array<{ key: SimilarityAxis; label: string; hint: string }> = [
  { key: "ingredients", label: "Ingredients", hint: "Same core ingredients, different dish" },
  { key: "taste", label: "Taste profile", hint: "Same flavor balance and intensity" },
  { key: "presentation", label: "Presentation", hint: "Looks and plates the same way" },
  { key: "cuisine", label: "Cuisine", hint: "From the same kitchen tradition" },
  { key: "dish_type", label: "Dish type", hint: "Soup stays soup, pie stays pie" },
];

export function SimilarModal({ open, onClose, recipeId, recipeTitle, onStarted }: { open: boolean; onClose: () => void; recipeId: string; recipeTitle: string; onStarted: (runId: string) => void }) {
  const [axes, setAxes] = useState<SimilarityAxis[]>(["taste", "cuisine"]);
  const [count, setCount] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const { run } = await api<{ run: { id: string } }>("/api/runs", { method: "POST", json: { trigger: "similar", similar_to_id: recipeId, axes, count } });
      onStarted(run.id);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="card w-full max-w-lg p-6" initial={{ y: 16, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 16, scale: 0.98 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Generate similar recipes">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">More like this</p>
                <h2 className="display text-2xl">Similar to “{recipeTitle}”</h2>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Close" onClick={onClose}><X size={18} /></button>
            </div>
            <p className="mt-2 text-sm text-muted">Pick what “similar” should mean. The agent keeps those dimensions close and changes everything else.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {AXES.map((a) => {
                const active = axes.includes(a.key);
                return (
                  <button key={a.key} type="button" data-active={active} aria-pressed={active} onClick={() => setAxes((cur) => (active ? cur.filter((k) => k !== a.key) : [...cur, a.key]))} className="rounded-xl border px-3 py-2 text-left transition data-[active=true]:bg-accent-soft" style={{ borderColor: active ? "var(--accent)" : "var(--line)" }}>
                    <span className="block text-sm font-semibold">{a.label}</span>
                    <span className="block text-xs text-muted">{a.hint}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                <span className="label">How many</span>
                <select className="select w-auto" value={count} onChange={(e) => setCount(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <button type="button" className="btn btn-primary" onClick={start} disabled={busy || axes.length === 0}>
                {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />} Generate
              </button>
            </div>
            {error && <p className="mt-3 text-sm" style={{ color: "var(--accent)" }}>{error}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
