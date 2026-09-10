"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import type { RecipeCard as RecipeCardData, Run } from "@/lib/types";
import { api } from "@/lib/client/api";
import { findCatalogItem } from "@/lib/catalog";
import { RecipeCard } from "./RecipeCard";
import { useShell } from "@/components/shell/ShellProvider";

/**
 * Library grid with keyword search, filter chips derived from the library
 * itself (only values that exist are offered), and sorting. While a run is
 * producing recipes or images the grid polls so results stream in.
 */
export function RecipeGrid() {
  const { setSettingsOpen } = useShell();
  const [recipes, setRecipes] = useState<RecipeCardData[] | null>(null);
  const [activeRuns, setActiveRuns] = useState<Run[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState("newest");
  const [favorites, setFavorites] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);
    if (favorites) params.set("favorites", "1");
    params.set("sort", sort);
    try {
      const data = await api<{ recipes: RecipeCardData[]; active_runs: Run[] }>(`/api/recipes?${params}`);
      setRecipes(data.recipes);
      setActiveRuns(data.active_runs);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [q, filters, favorites, sort]);

  // Debounced reload on any input change.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  // Poll while something is cooking.
  useEffect(() => {
    if (activeRuns.length === 0) return;
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [activeRuns.length, load]);

  // Filter vocabularies come from the unfiltered library so chips never vanish mid-filter.
  const [vocab, setVocab] = useState<{ cuisine: string[]; dish_type: string[]; health_profile: string[]; presentation: string[] }>({ cuisine: [], dish_type: [], health_profile: [], presentation: [] });
  useEffect(() => {
    api<{ recipes: RecipeCardData[] }>("/api/recipes").then(({ recipes }) => {
      const uniq = (k: keyof RecipeCardData) => [...new Set(recipes.map((r) => String(r[k])).filter(Boolean))].sort();
      setVocab({ cuisine: uniq("cuisine"), dish_type: uniq("dish_type"), health_profile: uniq("health_profile"), presentation: uniq("presentation") });
    }).catch(() => undefined);
  }, [activeRuns.length]);

  const cooking = useMemo(() => activeRuns[0], [activeRuns]);
  const hasFilters = Object.values(filters).some(Boolean) || favorites || q.trim();

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex-1 min-w-[240px]">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input pl-9"
              placeholder="Search titles, cuisines, dish types..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search recipes"
            />
          </label>
          <select className="select w-auto" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A to Z</option>
            <option value="quickest">Quickest first</option>
          </select>
          <button type="button" className="chip" data-active={favorites} onClick={() => setFavorites((f) => !f)}>
            ♥ Favorites
          </button>
          {hasFilters && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setQ(""); setFilters({}); setFavorites(false); }}>
              <X size={14} /> Clear
            </button>
          )}
        </div>
        <FilterRow label="Cuisine" values={vocab.cuisine} current={filters.cuisine} onPick={(v) => setFilters((f) => ({ ...f, cuisine: v }))} />
        <FilterRow label="Dish" values={vocab.dish_type} current={filters.dish_type} onPick={(v) => setFilters((f) => ({ ...f, dish_type: v }))} />
        <FilterRow label="Health" values={vocab.health_profile} current={filters.health_profile} onPick={(v) => setFilters((f) => ({ ...f, health_profile: v }))} labelFor={(v) => findCatalogItem("health", v)?.label ?? v} />
        <FilterRow label="Look" values={vocab.presentation} current={filters.presentation} onPick={(v) => setFilters((f) => ({ ...f, presentation: v }))} labelFor={(v) => findCatalogItem("presentation", v)?.label ?? v} />
      </div>

      {cooking && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          <LoaderCircle size={16} className="animate-spin" style={{ color: "var(--accent)" }} />
          <span>
            {cooking.status === "queued" && "Waiting for the kitchen to open..."}
            {cooking.status === "generating" && "The agent is composing your recipes..."}
            {cooking.status === "rendering" && `Photographing dishes and illustrating ingredients (${cooking.progress.done}/${cooking.progress.total})...`}
          </span>
          <Link href="/history" className="ml-auto text-xs font-semibold" style={{ color: "var(--accent)" }}>Details</Link>
        </div>
      )}

      {error && <p className="mb-4 text-sm" style={{ color: "var(--accent)" }}>{error}</p>}

      {recipes === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="shimmer aspect-[4/5] rounded-[var(--radius)]" />)}
        </div>
      ) : recipes.length === 0 ? (
        <div className="card grid place-items-center gap-3 p-12 text-center">
          <Sparkles size={28} style={{ color: "var(--accent)" }} />
          <p className="display text-2xl">{hasFilters ? "Nothing matches those filters" : "Your library is empty"}</p>
          <p className="max-w-md text-sm text-muted">
            {hasFilters
              ? "Loosen the filters or clear the search to see everything."
              : "Fill in your taste profile, then ask the agent for a first batch. Autonomous runs will keep it growing."}
          </p>
          {!hasFilters && (
            <div className="flex gap-2">
              <Link href="/profile" className="btn">Build profile</Link>
              <button type="button" className="btn btn-primary" onClick={() => setSettingsOpen(true)}>Run now</button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, values, current, onPick, labelFor }: { label: string; values: string[]; current?: string; onPick: (v: string) => void; labelFor?: (v: string) => string }) {
  if (values.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-semibold text-muted">{label}</span>
      {values.map((v) => (
        <button key={v} type="button" className="chip" data-active={current === v} onClick={() => onPick(current === v ? "" : v)}>
          {labelFor ? labelFor(v) : v}
        </button>
      ))}
    </div>
  );
}
