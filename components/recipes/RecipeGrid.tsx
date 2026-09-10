"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import Link from "next/link";
import type { RecipeCard as RecipeCardData, Run } from "@/lib/types";
import { api } from "@/lib/client/api";
import { findCatalogItem } from "@/lib/catalog";
import { RecipeCard } from "./RecipeCard";
import { useShell } from "@/components/shell/ShellProvider";

type Vocab = { cuisine: string[]; dish_type: string[]; health_profile: string[]; presentation: string[] };
type FilterKey = keyof Vocab;

const GROUPS: Array<{ key: FilterKey; label: string; labelFor?: (v: string) => string }> = [
  { key: "cuisine", label: "Cuisine" },
  { key: "dish_type", label: "Dish" },
  { key: "health_profile", label: "Health", labelFor: (v) => findCatalogItem("health", v)?.label ?? v },
  { key: "presentation", label: "Look", labelFor: (v) => findCatalogItem("presentation", v)?.label ?? v },
];

/**
 * Library grid. One toolbar row (search, Filters popover, sort, favorites),
 * an active-filter row only when something is set, and a three-column grid.
 * Filter vocabularies are derived from the library so only real values are
 * offered. While a run is producing recipes or images the grid polls.
 */
export function RecipeGrid() {
  const { setSettingsOpen } = useShell();
  const [recipes, setRecipes] = useState<RecipeCardData[] | null>(null);
  const [activeRuns, setActiveRuns] = useState<Run[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Partial<Record<FilterKey, string>>>({});
  const [sort, setSort] = useState("newest");
  const [favorites, setFavorites] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [vocab, setVocab] = useState<Vocab>({ cuisine: [], dish_type: [], health_profile: [], presentation: [] });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popover = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(load, 200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  useEffect(() => {
    if (activeRuns.length === 0) return;
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [activeRuns.length, load]);

  useEffect(() => {
    api<{ recipes: RecipeCardData[] }>("/api/recipes")
      .then(({ recipes }) => {
        const uniq = (k: keyof RecipeCardData) => [...new Set(recipes.map((r) => String(r[k])).filter(Boolean))].sort();
        setVocab({ cuisine: uniq("cuisine"), dish_type: uniq("dish_type"), health_profile: uniq("health_profile"), presentation: uniq("presentation") });
      })
      .catch(() => undefined);
  }, [activeRuns.length]);

  // Close the popover on outside click or Escape.
  useEffect(() => {
    if (!filtersOpen) return;
    const onDown = (e: MouseEvent) => {
      if (popover.current && !popover.current.contains(e.target as Node)) setFiltersOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFiltersOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  const cooking = useMemo(() => activeRuns[0], [activeRuns]);
  const activeFilters = GROUPS.filter((g) => filters[g.key]);
  const hasAny = activeFilters.length > 0 || favorites || Boolean(q.trim());
  const availableGroups = GROUPS.filter((g) => vocab[g.key].length > 0);

  function clearAll() {
    setQ("");
    setFilters({});
    setFavorites(false);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Find your next favorite..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search recipes" />
        </label>
        {availableGroups.length > 0 && (
          <div className="relative" ref={popover}>
            <button type="button" className="btn" aria-expanded={filtersOpen} aria-haspopup="dialog" onClick={() => setFiltersOpen((o) => !o)}>
              <SlidersHorizontal size={15} /> Filters{activeFilters.length > 0 && <span className="badge ml-0.5">{activeFilters.length}</span>}
            </button>
            {filtersOpen && (
              <div className="card absolute left-0 z-20 mt-2 w-[min(92vw,520px)] space-y-4 p-4" role="dialog" aria-label="Filters">
                {availableGroups.map((g) => (
                  <div key={g.key}>
                    <p className="label mb-1.5">{g.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {vocab[g.key].map((v) => (
                        <button key={v} type="button" className="chip" data-active={filters[g.key] === v} onClick={() => setFilters((f) => ({ ...f, [g.key]: f[g.key] === v ? "" : v }))}>
                          {g.labelFor ? g.labelFor(v) : v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <select className="select w-auto" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A to Z</option>
          <option value="quickest">Quickest first</option>
        </select>
        <button type="button" className="chip" data-active={favorites} onClick={() => setFavorites((f) => !f)} aria-pressed={favorites}>
          ♥ Favorites
        </button>
      </div>

      {hasAny && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
          {activeFilters.map((g) => (
            <button key={g.key} type="button" className="chip" data-active onClick={() => setFilters((f) => ({ ...f, [g.key]: "" }))} aria-label={`Remove ${g.label} filter`}>
              {g.labelFor ? g.labelFor(filters[g.key]!) : filters[g.key]} <X size={12} />
            </button>
          ))}
          {favorites && <button type="button" className="chip" data-active onClick={() => setFavorites(false)}>Favorites <X size={12} /></button>}
          {q.trim() && <button type="button" className="chip" data-active onClick={() => setQ("")}>“{q.trim()}” <X size={12} /></button>}
          <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>Clear</button>
        </div>
      )}

      {cooking && (
        <p className="mb-4 flex items-center gap-2 text-sm text-muted">
          <LoaderCircle size={14} className="animate-spin" />
          <span>
            {cooking.status === "queued" && "Waiting for the kitchen to open..."}
            {cooking.status === "generating" && "The agent is composing your recipes..."}
            {cooking.status === "rendering" && `Photographing dishes and illustrating ingredients (${cooking.progress.done}/${cooking.progress.total})...`}
          </span>
          <Link href="/history" className="ml-1 font-semibold text-ink underline-offset-2 hover:underline">Details</Link>
        </p>
      )}

      {error && <p className="mb-4 text-sm" style={{ color: "var(--accent)" }}>{error}</p>}

      {recipes === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer aspect-[4/5] rounded-[var(--radius)]" />)}
        </div>
      ) : recipes.length === 0 ? (
        <div className="card grid place-items-center gap-3 p-12 text-center">
          <Sparkles size={26} className="text-muted" />
          <p className="display text-2xl">{hasAny ? "Nothing matches" : cooking ? "Your first batch is on its way" : "Your library is empty"}</p>
          <p className="max-w-md text-sm text-muted">
            {hasAny
              ? "Loosen the filters or clear the search to see everything."
              : cooking
                ? "Recipes appear here the moment the agent finishes writing them; photos fill in after."
                : "Fill in your taste profile, then ask the agent for a first batch. Autonomous runs will keep it growing."}
          </p>
          {!hasAny && !cooking && (
            <div className="flex gap-2">
              <Link href="/profile" className="btn">Build profile</Link>
              <button type="button" className="btn btn-primary" onClick={() => setSettingsOpen(true)}>Run now</button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  );
}
