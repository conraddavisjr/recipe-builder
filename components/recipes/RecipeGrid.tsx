"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, LoaderCircle, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import type { RecipeCard as RecipeCardData, Run } from "@/lib/types";
import { api } from "@/lib/client/api";
import { findCatalogItem } from "@/lib/catalog";
import { FILTER_GROUP_ICONS, filterOptionIcon } from "@/lib/icons";
import { createElement } from "react";
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
 * Library grid. One toolbar row: search, one dropdown per filter group (the
 * button shows the chosen value), sort, favorites, and Clear when needed.
 * Filter vocabularies are derived from the library so only real values are
 * offered. While a run is producing recipes or images the grid polls.
 */
export function RecipeGrid() {
  const { setSettingsOpen } = useShell();
  const [recipes, setRecipes] = useState<RecipeCardData[] | null>(null);
  const [activeRuns, setActiveRuns] = useState<Run[]>([]);
  const [drafts, setDrafts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Partial<Record<FilterKey, string>>>({});
  const [sort, setSort] = useState("newest");
  const [favorites, setFavorites] = useState(false);
  const [openGroup, setOpenGroup] = useState<FilterKey | null>(null);
  const [vocab, setVocab] = useState<Vocab>({ cuisine: [], dish_type: [], health_profile: [], presentation: [] });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolbar = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);
    if (favorites) params.set("favorites", "1");
    params.set("sort", sort);
    try {
      const data = await api<{ recipes: RecipeCardData[]; active_runs: Run[]; drafts: number }>(`/api/recipes?${params}`);
      setRecipes(data.recipes);
      setActiveRuns(data.active_runs);
      setDrafts(data.drafts);
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

  // Close an open dropdown on outside click or Escape.
  useEffect(() => {
    if (!openGroup) return;
    const onDown = (e: MouseEvent) => {
      if (toolbar.current && !toolbar.current.contains(e.target as Node)) setOpenGroup(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenGroup(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openGroup]);

  const cooking = useMemo(() => activeRuns[0], [activeRuns]);
  const hasAny = GROUPS.some((g) => filters[g.key]) || favorites || Boolean(q.trim());
  const availableGroups = GROUPS.filter((g) => vocab[g.key].length > 0);

  function clearAll() {
    setQ("");
    setFilters({});
    setFavorites(false);
  }

  return (
    <div>
      <div ref={toolbar} className="mb-6 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Find your next favorite..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search recipes" />
        </label>
        {/* One button per filter group; a single click shows that group's options. */}
        {availableGroups.map((g) => {
          const value = filters[g.key];
          const open = openGroup === g.key;
          return (
            <div key={g.key} className="relative">
              <button
                type="button"
                className="btn"
                data-active={Boolean(value)}
                aria-expanded={open}
                aria-haspopup="listbox"
                onClick={() => setOpenGroup(open ? null : g.key)}
              >
                {createElement(FILTER_GROUP_ICONS[g.key] ?? Search, { size: 14, className: value ? "opacity-90" : "text-muted" })}
                {value ? (g.labelFor ? g.labelFor(value) : value) : g.label}
                <ChevronDown size={14} className="opacity-70" />
              </button>
              {open && (
                <ul className="card absolute left-0 z-20 mt-2 max-h-72 w-max min-w-[12rem] max-w-[min(90vw,22rem)] overflow-y-auto p-1.5 shadow-[var(--shadow-dialog)]" role="listbox" aria-label={g.label}>
                  {vocab[g.key].map((v) => {
                    const selected = value === v;
                    return (
                      <li key={v}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          className="flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-tint"
                          style={selected ? { background: "var(--tint-active)", fontWeight: 500 } : undefined}
                          onClick={() => {
                            setFilters((f) => ({ ...f, [g.key]: selected ? "" : v }));
                            setOpenGroup(null);
                          }}
                        >
                          <span className="inline-flex items-center gap-2.5">
                            {createElement(filterOptionIcon(g.key, v), { size: 15, className: "shrink-0", style: { color: "var(--olive-deep)" } })}
                            {g.labelFor ? g.labelFor(v) : v}
                          </span>
                          {selected && <Check size={14} />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
        <select className="select w-auto" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A to Z</option>
          <option value="quickest">Quickest first</option>
        </select>
        <button type="button" className="chip" data-active={favorites} onClick={() => setFavorites((f) => !f)} aria-pressed={favorites}>
          ♥ Favorites
        </button>
        {hasAny && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

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

      {drafts > 0 && !cooking && (
        <p className="mb-4 text-sm text-muted">
          <Sparkles size={14} className="mr-1 inline" /> {drafts} draft{drafts === 1 ? "" : "s"} waiting in the{" "}
          <Link href="/generator" className="font-medium text-ink underline-offset-2 hover:underline">generator</Link>. Drafts join the library only when you keep them.
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
