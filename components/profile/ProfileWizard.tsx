"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import {
  CATALOG,
  COOKWARE,
  CUISINES,
  DIET_ABSOLUTES,
  FLAVORS,
  HEALTH_PROFILES,
  PRESENTATIONS,
  flavorsForCuisines,
  type CatalogItem,
} from "@/lib/catalog";
import type { ProfileCategory, ProfileSelection } from "@/lib/types";
import { api } from "@/lib/client/api";
import { Tile } from "@/components/ui/Tile";

/**
 * Seven-step taste profile. The same component is the first-run wizard and
 * the "revisit and revise" view: every step is reachable from the stepper and
 * every tile toggles immediately (optimistic, persisted per click), so there
 * is no separate edit mode to maintain.
 */

interface StepDef {
  category: ProfileCategory;
  eyebrow: string;
  title: string;
  description: string;
  /** Items to show; flavors depend on loved cuisines so it is a function. */
  items: (state: SelectionState) => CatalogItem[];
  emptyHint?: string;
}

type SelectionState = Record<ProfileCategory, Set<string>>;

const STEPS: StepDef[] = [
  {
    category: "cuisine_love",
    eyebrow: "Step 1",
    title: "Cuisines you love",
    description: "Pick everything that makes you happy. The more honest the list, the sharper the recommendations.",
    items: () => CUISINES,
  },
  {
    category: "cuisine_avoid",
    eyebrow: "Step 2",
    title: "Cuisines to stay away from",
    description: "Anything here is off the table entirely. Leave it empty if you are open to everything.",
    items: () => CUISINES,
  },
  {
    category: "flavor",
    eyebrow: "Step 3",
    title: "The flavors underneath",
    description: "These are the taste profiles typical of the cuisines you love. Emphasize the ones you truly crave; the agent maps recipes to these, not just to cuisine names.",
    items: (s) => {
      const derived = flavorsForCuisines([...s.cuisine_love]);
      return derived.length ? derived : FLAVORS;
    },
    emptyHint: "Pick a few cuisines in step 1 and their signature flavors appear here.",
  },
  {
    category: "presentation",
    eyebrow: "Step 4",
    title: "How you like food to look",
    description: "Refined and composed, rustic and generous, comforting and gooey. Choose as many as fit.",
    items: () => PRESENTATIONS,
  },
  {
    category: "health",
    eyebrow: "Step 5",
    title: "Health profiles to cover",
    description: "Pick a range. The agent will spread each batch across what you choose, so a decadent plate and a raw bowl can arrive on the same day.",
    items: () => HEALTH_PROFILES,
  },
  {
    category: "diet_absolute",
    eyebrow: "Step 6",
    title: "Hard rules",
    description: "Absolute constraints the agent must never break, no matter what else it learns about you.",
    items: () => DIET_ABSOLUTES,
  },
  {
    category: "cookware",
    eyebrow: "Step 7",
    title: "What is in your kitchen",
    description: "Recipes are chosen to suit the equipment you actually have. A pizza oven or a smoker opens whole categories.",
    items: () => COOKWARE,
  },
];

function emptyState(): SelectionState {
  return {
    cuisine_love: new Set(),
    cuisine_avoid: new Set(),
    flavor: new Set(),
    presentation: new Set(),
    health: new Set(),
    diet_absolute: new Set(),
    cookware: new Set(),
  };
}

export function ProfileWizard() {
  const [state, setState] = useState<SelectionState>(emptyState);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [pending, setPending] = useState<Set<string>>(new Set());

  useEffect(() => {
    api<{ selections: ProfileSelection[] }>("/api/profile")
      .then(({ selections }) => {
        const next = emptyState();
        for (const s of selections) if (s.active) next[s.category].add(s.key);
        setState(next);
        setLoaded(true);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const toggle = useCallback(
    async (category: ProfileCategory, key: string) => {
      const active = !state[category].has(key);
      const token = `${category}:${key}`;
      setState((prev) => {
        const next = { ...prev, [category]: new Set(prev[category]) };
        if (active) next[category].add(key);
        else next[category].delete(key);
        return next;
      });
      setPending((p) => new Set(p).add(token));
      try {
        await api("/api/profile", { method: "PUT", json: { category, key, active } });
      } catch (e) {
        // Roll back on failure so the UI never lies about what is saved.
        setState((prev) => {
          const next = { ...prev, [category]: new Set(prev[category]) };
          if (active) next[category].delete(key);
          else next[category].add(key);
          return next;
        });
        setError((e as Error).message);
      } finally {
        setPending((p) => {
          const n = new Set(p);
          n.delete(token);
          return n;
        });
      }
    },
    [state],
  );

  const current = STEPS[step];
  const items = useMemo(() => current.items(state), [current, state]);
  const selectedCount = (category: ProfileCategory) => state[category].size;
  const totalSelected = (Object.keys(CATALOG) as ProfileCategory[]).reduce((n, c) => n + state[c].size, 0);

  function go(delta: number) {
    setDirection(delta);
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)));
  }

  if (error && !loaded) {
    return (
      <div className="card p-6">
        <p className="font-semibold">Could not load your profile.</p>
        <p className="mt-1 text-sm text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      {/* Stepper: every step is clickable so revisiting is a single tap. */}
      <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1" aria-label="Profile steps">
        {STEPS.map((s, i) => {
          const count = selectedCount(s.category);
          const active = i === step;
          return (
            <li key={s.category} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDirection(i > step ? 1 : -1);
                  setStep(i);
                }}
                data-active={active}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-surface-2 data-[active=true]:bg-surface data-[active=true]:shadow-[var(--shadow)]"
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold"
                  style={{
                    background: count ? "var(--accent)" : "var(--surface-2)",
                    color: count ? "var(--accent-ink)" : "var(--muted)",
                  }}
                >
                  {count ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span className="hidden flex-col leading-tight lg:flex">
                  <span className="text-sm font-semibold">{s.title}</span>
                  <span className="text-xs text-muted">{count ? `${count} selected` : "Nothing yet"}</span>
                </span>
                <span className="text-sm font-semibold lg:hidden">{i + 1}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="min-w-0">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.section
            key={current.category}
            custom={direction}
            initial={{ opacity: 0, x: 24 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 * direction }}
            transition={{ duration: 0.18 }}
            aria-labelledby={`step-${current.category}`}
          >
            <p className="eyebrow">{current.eyebrow} of {STEPS.length}</p>
            <h2 id={`step-${current.category}`} className="display mt-1 text-2xl sm:text-3xl">
              {current.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">{current.description}</p>

            {!loaded ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="shimmer h-36 rounded-[var(--radius)]" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="mt-6 text-sm text-muted">{current.emptyHint}</p>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <Tile
                    key={item.key}
                    item={item}
                    cue={"cue" in item ? (item as { cue: string }).cue : undefined}
                    active={state[current.category].has(item.key)}
                    busy={pending.has(`${current.category}:${item.key}`)}
                    onToggle={() => toggle(current.category, item.key)}
                  />
                ))}
              </div>
            )}
          </motion.section>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-4">
          <button type="button" className="btn" onClick={() => go(-1)} disabled={step === 0}>
            <ArrowLeft size={16} /> Back
          </button>
          <p className="text-xs text-muted">
            {pending.size > 0 ? (
              <span className="inline-flex items-center gap-1"><LoaderCircle size={12} className="animate-spin" /> Saving</span>
            ) : (
              `${totalSelected} preferences saved. Every click is saved instantly.`
            )}
          </p>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={() => go(1)}>
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <Link href="/" className="btn btn-primary">
              Done <Check size={16} />
            </Link>
          )}
        </div>
        {error && loaded && <p className="mt-3 text-sm" style={{ color: "var(--accent)" }}>{error}</p>}
      </div>
    </div>
  );
}
