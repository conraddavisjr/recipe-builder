"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createElement } from "react";
import { ArrowLeft, ChevronDown, Heart, LoaderCircle, MessageCircle, Minus, Plus, Sparkles, Timer, Users, ChefHat } from "lucide-react";
import type { IngredientArt, Recipe, RecipeCard as RecipeCardData } from "@/lib/types";
import { api } from "@/lib/client/api";
import { findCatalogItem } from "@/lib/catalog";
import { equipmentIcon } from "@/lib/icons";
import { useShell } from "@/components/shell/ShellProvider";
import { IngredientRow } from "./IngredientRow";
import { Segment, SegmentLegend } from "./Segment";
import { SimilarModal } from "./SimilarModal";
import { RecipeCard } from "./RecipeCard";

type Similar = RecipeCardData & { score: number };

interface Payload {
  recipe: Recipe;
  ingredient_art: Record<string, IngredientArt>;
  similar: Similar[];
}

export function RecipeDetail({ id }: { id: string }) {
  const { openDrawer } = useShell();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [showWhy, setShowWhy] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(false);
  const [similarRun, setSimilarRun] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);

  const load = useCallback(async () => {
    try {
      const payload = await api<Payload>(`/api/recipes/${id}`);
      setData(payload);
      setFeedbackDraft((d) => d || payload.recipe.feedback || "");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  // Initial load is inlined (not via load()) so the effect only subscribes;
  // load() is reused by the poller below.
  useEffect(() => {
    let cancelled = false;
    api<Payload>(`/api/recipes/${id}`)
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setFeedbackDraft((d) => d || payload.recipe.feedback || "");
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Poll while imagery for this recipe, or a similar-run, is still cooking.
  const pendingImages = data?.recipe.images.some((i) => i.status === "pending") ?? false;
  const pendingArt = Object.values(data?.ingredient_art ?? {}).some((a) => a.status === "pending");
  useEffect(() => {
    if (!pendingImages && !pendingArt && !similarRun) return;
    const t = setInterval(async () => {
      await load();
      if (similarRun) {
        const { run } = await api<{ run: { status: string } }>(`/api/runs/${similarRun}`).catch(() => ({ run: { status: "failed" } }));
        if (run.status === "done" || run.status === "failed") setSimilarRun(null);
      }
    }, 4000);
    return () => clearInterval(t);
  }, [pendingImages, pendingArt, similarRun, load]);

  async function patch(partial: { favorite?: boolean; rating?: number | null; feedback?: string | null }) {
    if (!data) return;
    const { recipe } = await api<{ recipe: Recipe }>(`/api/recipes/${id}`, { method: "PATCH", json: partial });
    setData({ ...data, recipe });
  }

  const recipe = data?.recipe;
  const images = useMemo(() => recipe?.images.filter((i) => i.status !== "failed") ?? [], [recipe]);
  const [activeImage, setActiveImage] = useState(0);

  if (error) return <p className="text-sm" style={{ color: "var(--accent)" }}>{error}</p>;
  if (!recipe) return <div className="shimmer h-[60vh] rounded-[var(--radius)]" />;

  const health = findCatalogItem("health", recipe.health_profile)?.label ?? recipe.health_profile;
  const presentation = findCatalogItem("presentation", recipe.presentation)?.label ?? recipe.presentation;
  const servings = Math.max(1, Math.round(recipe.servings * scale));
  const hero = images[activeImage] ?? images[0];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <article className="min-w-0">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={14} /> All recipes</Link>

        {/* Gallery */}
        <div className="overflow-hidden rounded-[var(--radius)] bg-surface-2" style={{ boxShadow: "var(--shadow)" }}>
          <div className="relative aspect-[3/2] w-full">
            {hero?.url && hero.status === "done" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.url} alt={recipe.title} className="h-full w-full object-cover" />
            ) : (
              <div className={`grid h-full w-full place-items-center ${hero?.status === "pending" ? "shimmer" : ""}`}>
                <span className="text-xs text-muted">{hero?.status === "pending" ? "Photographing..." : "No image"}</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-2">
              {images.map((img, i) => (
                <button key={img.id} type="button" onClick={() => setActiveImage(i)} aria-label={`View ${img.kind} image`} className="relative h-16 w-24 overflow-hidden rounded-lg border-2 transition" style={{ borderColor: i === activeImage ? "var(--accent)" : "transparent" }}>
                  {img.url && img.status === "done" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="shimmer block h-full w-full" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title block */}
        <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              <span className="badge">{recipe.cuisine}</span>
              <span className="badge">{recipe.dish_type}</span>
              <span className="badge" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{health}</span>
              <span className="badge">{presentation}</span>
              <span className="badge">{recipe.difficulty}</span>
            </div>
            <h1 className="display mt-2 text-3xl sm:text-4xl">{recipe.title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed">{recipe.summary_poetic}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
              <span className="inline-flex items-center gap-1"><Timer size={15} /> {recipe.active_minutes} min active · {recipe.total_minutes} min total</span>
              <span className="inline-flex items-center gap-1"><Users size={15} /> {recipe.servings} servings</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-icon" aria-pressed={recipe.favorite} aria-label="Favorite" onClick={() => patch({ favorite: !recipe.favorite })}>
              <Heart size={18} fill={recipe.favorite ? "var(--accent)" : "none"} style={{ color: recipe.favorite ? "var(--accent)" : undefined }} />
            </button>
            <button type="button" className="btn" onClick={() => openDrawer({ recipeId: recipe.id, recipeTitle: recipe.title })}>
              <MessageCircle size={16} /> Tell the agent
            </button>
          </div>
        </div>

        {/* Why this recipe */}
        <div className="mt-5 rounded-xl border border-line bg-surface">
          <button type="button" className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold" onClick={() => setShowWhy((s) => !s)} aria-expanded={showWhy}>
            <span className="inline-flex items-center gap-2"><Sparkles size={15} style={{ color: "var(--accent)" }} /> Why the agent chose this for you</span>
            <ChevronDown size={16} className="transition" style={{ transform: showWhy ? "rotate(180deg)" : undefined }} />
          </button>
          {showWhy && <p className="border-t border-line px-4 py-3 text-sm leading-relaxed text-muted">{recipe.rationale}</p>}
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[280px_1fr]">
          {/* Ingredients + equipment */}
          <aside className="space-y-8">
            <section>
              <div className="flex items-center justify-between">
                <h2 className="display text-xl">Ingredients</h2>
                <div className="flex items-center gap-1 text-sm">
                  <button type="button" className="btn btn-ghost btn-icon" aria-label="Fewer servings" onClick={() => setScale((s) => Math.max(0.25, s - 0.5 / recipe.servings * 1))}><Minus size={14} /></button>
                  <span className="min-w-[4.5rem] text-center tabular-nums">{servings} serv.</span>
                  <button type="button" className="btn btn-ghost btn-icon" aria-label="More servings" onClick={() => setScale((s) => s + 0.5 / recipe.servings * 1)}><Plus size={14} /></button>
                </div>
              </div>
              <ul className="mt-2 divide-y divide-line">
                {recipe.ingredients.map((ing, i) => (
                  <IngredientRow key={`${ing.ingredient_key}-${i}`} ingredient={ing} art={data?.ingredient_art[ing.ingredient_key]} scale={scale} />
                ))}
              </ul>
            </section>
            <section>
              <h2 className="display text-xl">Equipment</h2>
              <ul className="mt-2 space-y-1.5">
                {recipe.equipment.map((eq) => (
                  <li key={eq.key} className="flex items-center gap-2 text-sm">
                    <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--seg-equipment-bg)", color: "var(--seg-equipment)" }}>
                      {createElement(equipmentIcon(eq.key), { size: 16 })}
                    </span>
                    <span>{eq.name}</span>
                    {!eq.essential && <span className="text-xs text-muted">optional</span>}
                  </li>
                ))}
              </ul>
            </section>
          </aside>

          {/* Steps */}
          <section className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="display text-xl inline-flex items-center gap-2"><ChefHat size={18} /> Method</h2>
              <SegmentLegend />
            </div>
            <ol className="mt-4 space-y-5">
              {recipe.steps.map((step) => (
                <li key={step.number} className="flex gap-4">
                  <span className="display grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm" style={{ background: "var(--ink)", color: "var(--bg)" }}>{step.number}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 leading-[1.9]">
                      {step.segments.map((seg, i) => <Segment key={i} segment={seg} />)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Feedback */}
        <section className="mt-10 rounded-[var(--radius)] border border-line bg-surface p-5">
          <h2 className="display text-xl">How was it?</h2>
          <p className="mt-1 text-sm text-muted">Rate it and say why. The agent reads every word before the next batch.</p>
          <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={recipe.rating === n} aria-label={`${n} stars`} className="text-2xl transition hover:scale-110" style={{ color: recipe.rating && n <= recipe.rating ? "var(--gold)" : "var(--line)" }} onClick={() => patch({ rating: recipe.rating === n ? null : n })}>
                ★
              </button>
            ))}
          </div>
          <textarea className="textarea mt-3" placeholder="What worked, what did not, what you would change..." value={feedbackDraft} onChange={(e) => setFeedbackDraft(e.target.value)} />
          <div className="mt-2 flex justify-end">
            <button type="button" className="btn btn-primary" disabled={savingFeedback || feedbackDraft === (recipe.feedback ?? "")} onClick={async () => { setSavingFeedback(true); try { await patch({ feedback: feedbackDraft.trim() || null }); } finally { setSavingFeedback(false); } }}>
              {savingFeedback ? <LoaderCircle size={16} className="animate-spin" /> : null} Save feedback
            </button>
          </div>
        </section>
      </article>

      {/* See more like this: right column on wide screens, below on narrow */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <h2 className="display text-xl">See more like this</h2>
        {similarRun && (
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted"><LoaderCircle size={14} className="animate-spin" /> Generating similar recipes...</p>
        )}
        {data && data.similar.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {data.similar.map((s) => <RecipeCard key={s.id} recipe={s} />)}
            <button type="button" className="btn w-full" onClick={() => setSimilarOpen(true)}><Sparkles size={16} /> Generate more like this</button>
          </div>
        ) : (
          <div className="card mt-3 grid place-items-center gap-2 p-6 text-center">
            <p className="text-sm text-muted">There are no other similar recipes. Generate some here.</p>
            <button type="button" className="btn btn-primary" onClick={() => setSimilarOpen(true)} disabled={Boolean(similarRun)}><Sparkles size={16} /> Generate similar</button>
          </div>
        )}
      </aside>

      <SimilarModal open={similarOpen} onClose={() => setSimilarOpen(false)} recipeId={recipe.id} recipeTitle={recipe.title} onStarted={setSimilarRun} />
    </div>
  );
}
