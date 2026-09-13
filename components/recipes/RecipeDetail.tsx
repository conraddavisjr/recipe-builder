"use client";

import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ChevronDown, Heart, LoaderCircle, Minus, Plus, Sparkles, Trash } from "lucide-react";
import type { IngredientArt, Recipe, RecipeCard as RecipeCardData, StepMedia, StepMediaKind } from "@/lib/types";
import { api } from "@/lib/client/api";
import { findCatalogItem } from "@/lib/catalog";
import { equipmentIcon } from "@/lib/icons";
import { useShell } from "@/components/shell/ShellProvider";
import { IngredientRow } from "./IngredientRow";
import { SegmentLegend, StepFacts, StepProse, type SegmentMode } from "./Segment";
import { SimilarModal } from "./SimilarModal";
import { StepMediaControls, StepMediaFigure, pickStepMedia } from "./StepMedia";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pic } from "@/components/ui/Pic";
import { AddToGroup } from "@/components/groups/AddToGroup";
import { AddToCartButton } from "@/components/shopping/AddToCartButton";
import { useChecklist } from "@/components/ui/Checklist";
import { addedLabel } from "@/lib/client/format";

type Similar = RecipeCardData & { score: number };

interface Payload {
  recipe: Recipe;
  ingredient_art: Record<string, IngredientArt>;
  similar: Similar[];
  group_ids: string[];
  step_media: StepMedia[];
  cart: { id: string; in_cart: boolean; count: number };
}

const TAGS_KEY = "palate.stepTags";

export function RecipeDetail({ id }: { id: string }) {
  const { openDrawer, setContextRecipe } = useShell();
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [showWhy, setShowWhy] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(false);
  const [similarRun, setSimilarRun] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [mode, setMode] = useState<SegmentMode>("calm");
  const checklist = useChecklist(`palate.recipe.${id}`);
  const [activeImage, setActiveImage] = useState(0);
  const [illustrating, setIllustrating] = useState(false);

  // "Show tags" preference is per browser and survives reloads.
  useEffect(() => {
    // Deferred so the server-rendered calm mode never mismatches on hydration.
    const t = setTimeout(() => {
      try {
        if (localStorage.getItem(TAGS_KEY) === "tagged") setMode("tagged");
      } catch {
        /* storage unavailable */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);
  function toggleMode() {
    setMode((m) => {
      const next = m === "calm" ? "tagged" : "calm";
      try {
        localStorage.setItem(TAGS_KEY, next);
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }

  const load = useCallback(async () => {
    try {
      const payload = await api<Payload>(`/api/recipes/${id}`);
      setData(payload);
      setFeedbackDraft((d) => d || payload.recipe.feedback || "");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

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

  // The nav chat bubble opens the drawer about this recipe while it is on screen.
  const contextTitle = data?.recipe.title;
  useEffect(() => {
    if (!contextTitle) return;
    setContextRecipe({ recipeId: id, recipeTitle: contextTitle });
    return () => setContextRecipe(null);
  }, [id, contextTitle, setContextRecipe]);

  const pendingImages = data?.recipe.images.some((i) => i.status === "pending") ?? false;
  const pendingArt = Object.values(data?.ingredient_art ?? {}).some((a) => a.status === "pending");
  const pendingStepMedia = data?.step_media.some((m) => m.status === "pending") ?? false;
  useEffect(() => {
    if (!pendingImages && !pendingArt && !pendingStepMedia && !similarRun) return;
    const t = setInterval(async () => {
      await load();
      if (similarRun) {
        const { run } = await api<{ run: { status: string } }>(`/api/runs/${similarRun}`).catch(() => ({ run: { status: "failed" } }));
        if (run.status === "done" || run.status === "failed") setSimilarRun(null);
      }
    }, 4000);
    return () => clearInterval(t);
  }, [pendingImages, pendingArt, pendingStepMedia, similarRun, load]);

  async function illustrate(kind: StepMediaKind) {
    if (!data) return;
    setIllustrating(true);
    try {
      const { step_media } = await api<{ step_media: StepMedia[] }>(`/api/recipes/${id}/step-media`, { method: "POST", json: { kind } });
      // Replace rows of this kind; the other kind's rows stay as they were.
      setData({ ...data, step_media: [...data.step_media.filter((m) => m.kind !== kind), ...step_media] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIllustrating(false);
    }
  }

  async function patch(partial: { favorite?: boolean; rating?: number | null; feedback?: string | null }) {
    if (!data) return;
    const { recipe } = await api<{ recipe: Recipe }>(`/api/recipes/${id}`, { method: "PATCH", json: partial });
    setData({ ...data, recipe });
  }

  async function remove() {
    setDeleting(true);
    try {
      await api(`/api/recipes/${id}`, { method: "DELETE" });
      router.push("/");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const recipe = data?.recipe;
  const images = useMemo(() => recipe?.images.filter((i) => i.status !== "failed") ?? [], [recipe]);

  if (error) return <p className="text-sm" style={{ color: "var(--accent)" }}>{error}</p>;
  if (!recipe) return <div className="shimmer h-[60vh] rounded-[var(--radius)]" />;

  const health = findCatalogItem("health", recipe.health_profile)?.label ?? recipe.health_profile;
  const presentation = findCatalogItem("presentation", recipe.presentation)?.label ?? recipe.presentation;
  const servings = Math.max(1, Math.round(recipe.servings * scale));
  const hero = images[activeImage] ?? images[0];

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
      <article className="min-w-0">
        {/* Sticky action row under the main nav: back on the left, actions on
            the right, so the title below gets the full width on a phone. */}
        <div className="sticky top-[4.5rem] z-20 -mx-1 mb-6 flex items-center justify-between gap-2 border-b border-line bg-bg/90 px-1 py-2 backdrop-blur">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={14} /> Back to recipes</Link>
          <div className="flex items-center gap-1.5">
            {data?.cart && <AddToCartButton recipeId={recipe.id} cartId={data.cart.id} initialInCart={data.cart.in_cart} />}
            <AddToGroup recipeId={recipe.id} initialGroupIds={data?.group_ids ?? []} />
            <button type="button" className="btn btn-icon" aria-pressed={recipe.favorite} aria-label={recipe.favorite ? "Remove from favorites" : "Add to favorites"} title={recipe.favorite ? "Favorited" : "Favorite"} onClick={() => patch({ favorite: !recipe.favorite })}>
              <Heart size={17} fill={recipe.favorite ? "currentColor" : "none"} style={{ color: recipe.favorite ? "var(--accent)" : undefined }} />
            </button>
          </div>
        </div>

        {/* 1. Title block: eyebrow, title, summary */}
        <header>
          <p className="eyebrow">{recipe.cuisine} / {recipe.dish_type}</p>
          <h1 className="display mt-3 text-[2rem] leading-[1.08] sm:text-4xl lg:text-5xl">{recipe.title}</h1>
          <p className="intro mt-5 max-w-2xl">{recipe.summary_poetic}</p>
        </header>

        {/* 2. Photo */}
        <div className="mt-8 overflow-hidden rounded-[var(--radius)] bg-surface-2">
          <div className="relative aspect-[3/2] w-full">
            {hero?.url && hero.status === "done" ? (
              <Pic src={hero.url} sizes="hero" alt={recipe.title} loading="eager" className="h-full w-full object-cover" />
            ) : (
              <div className={`grid h-full w-full place-items-center ${hero?.status === "pending" ? "shimmer" : ""}`}>
                <span className="text-xs text-muted">{hero?.status === "pending" ? "Photographing..." : "No image"}</span>
              </div>
            )}
          </div>
        </div>
        {images.length > 1 && (
          <div className="mt-2 flex gap-2">
            {images.map((img, i) => (
              <button key={img.id} type="button" onClick={() => setActiveImage(i)} aria-label={`View ${img.kind} image`} aria-pressed={i === activeImage} className="h-16 w-24 overflow-hidden rounded-lg border-2 transition" style={{ borderColor: i === activeImage ? "var(--ink)" : "transparent" }}>
                {img.url && img.status === "done" ? (
                  <Pic src={img.url} sizes="thumb" className="h-full w-full object-cover" />
                ) : (
                  <span className="shimmer block h-full w-full" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* 3. Stats strip: every taxonomy value as text, no pills */}
        <dl className="stats mt-8">
          <Stat label="Hands-on" value={`${recipe.active_minutes} min`} />
          <Stat label="Total" value={`${recipe.total_minutes} min`} />
          <Stat label="Serves" value={String(recipe.servings)} />
          <Stat label="Effort" value={recipe.difficulty} />
          <Stat label="Profile" value={health} />
          <Stat label="Look" value={presentation} />
          <Stat label="Added" value={addedLabel(recipe.created_at)} />
        </dl>

        {/* 4. Why this recipe */}
        <div className="why mt-8">
          <button type="button" className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium" onClick={() => setShowWhy((s) => !s)} aria-expanded={showWhy}>
            <span className="inline-flex items-center gap-2"><Sparkles size={15} className="text-muted" /> Why this recipe?</span>
            <ChevronDown size={16} className="text-muted transition" style={{ transform: showWhy ? "rotate(180deg)" : undefined }} />
          </button>
          {showWhy && <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{recipe.rationale}</p>}
        </div>

        {/* 5. Ingredients, with equipment in the footer */}
        <section className="section-card mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="display text-2xl">Ingredients</h2>
            <div className="flex items-center gap-3 text-sm">
              {checklist.checked.size > 0 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={checklist.clear}>Reset checklist</button>
              )}
              <span className="text-muted">Servings</span>
              <button type="button" className="btn btn-icon btn-sm" aria-label="Fewer servings" onClick={() => setScale((s) => Math.max(0.25, s - 0.5 / recipe.servings))}><Minus size={13} /></button>
              <span className="min-w-[1.5rem] text-center font-semibold tabular-nums">{servings}</span>
              <button type="button" className="btn btn-icon btn-sm" aria-label="More servings" onClick={() => setScale((s) => s + 0.5 / recipe.servings)}><Plus size={13} /></button>
            </div>
          </div>
          <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
            {recipe.ingredients.map((ing, i) => (
              <IngredientRow
                key={`${ing.ingredient_key}-${i}`}
                ingredient={ing}
                art={data?.ingredient_art[ing.ingredient_key]}
                scale={scale}
                checked={checklist.checked.has(`${ing.ingredient_key}-${i}`)}
                onToggle={() => checklist.toggle(`${ing.ingredient_key}-${i}`)}
              />
            ))}
          </ul>
          {recipe.equipment.length > 0 && (
            <div className="mt-6 border-t border-line pt-4">
              <p className="label mb-2">Your tools</p>
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {recipe.equipment.map((eq) => (
                  <li key={eq.key} className="inline-flex items-center gap-1.5" style={{ color: eq.essential ? "var(--ink)" : "var(--muted)" }} title={eq.essential ? "Essential" : "Optional"}>
                    {createElement(equipmentIcon(eq.key), { size: 14, className: "text-muted" })}
                    {eq.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* 6. Method */}
        <section className="section-card mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="display text-2xl">Method</h2>
            <div className="flex items-center gap-2">
              <StepMediaControls media={data.step_media} busy={illustrating} onIllustrate={illustrate} />
              <button type="button" className="chip" data-active={mode === "tagged"} aria-pressed={mode === "tagged"} onClick={toggleMode} title="Highlight every ingredient, tool, temperature, time and technique inside the steps">
                Show tags
              </button>
            </div>
          </div>
          {mode === "tagged" && <div className="mt-3"><SegmentLegend /></div>}
          <ol className="mt-6 divide-y divide-line">
            {recipe.steps.map((step) => (
              <li key={step.number} className="flex gap-5 py-6 first:pt-0 last:pb-0">
                <span className="display step-number">{String(step.number).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="display text-xl">{step.title}</h3>
                  {mode === "calm" && <StepFacts step={step} />}
                  <p className={`mt-3 text-[15px] ${mode === "tagged" ? "leading-[1.9]" : "leading-[1.7]"}`}>
                    <StepProse segments={step.segments} mode={mode} />
                  </p>
                  {(() => {
                    const media = pickStepMedia(data.step_media, step.number);
                    return media ? <StepMediaFigure media={media} title={step.title} /> : null;
                  })()}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* 7. Feedback, last */}
        <section className="section-card mt-8">
          <h2 className="display text-2xl">How did it taste?</h2>
          <p className="mt-1 text-sm text-muted">Your honest notes make the next recommendation better.</p>
          <div className="mt-4 flex items-center gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={recipe.rating === n} aria-label={`${n} stars`} className="text-xl transition hover:scale-110" style={{ color: recipe.rating && n <= recipe.rating ? "var(--gold)" : "var(--line)" }} onClick={() => patch({ rating: recipe.rating === n ? null : n })}>
                ★
              </button>
            ))}
          </div>
          <textarea className="textarea mt-4" placeholder="What worked, what did not, what you would change..." value={feedbackDraft} onChange={(e) => setFeedbackDraft(e.target.value)} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="btn btn-primary" disabled={savingFeedback || feedbackDraft === (recipe.feedback ?? "")} onClick={async () => { setSavingFeedback(true); try { await patch({ feedback: feedbackDraft.trim() || null }); } finally { setSavingFeedback(false); } }}>
              {savingFeedback ? <LoaderCircle size={15} className="animate-spin" /> : null} Save cooking notes
            </button>
            <button type="button" className="btn btn-text text-muted" onClick={() => setConfirmDelete(true)}>
              <Trash size={14} /> Delete this recipe
            </button>
          </div>
        </section>
      </article>

      {/* Similar column: right on wide screens, below on narrow */}
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div>
          <p className="eyebrow">Follow your appetite</p>
          <h2 className="display mt-2 text-2xl">A little more like this</h2>
          {similarRun && (
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted"><LoaderCircle size={14} className="animate-spin" /> Generating similar recipes...</p>
          )}
          {data && data.similar.length > 0 ? (
            <ul className="mt-4 divide-y divide-line">
              {data.similar.map((s) => {
                const thumb = s.images.find((i) => i.status === "done" && i.url);
                return (
                  <li key={s.id}>
                    <Link href={`/recipes/${s.id}`} className="group flex items-center gap-3 py-3">
                      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                        {thumb ? (
                          <Pic src={thumb.url ?? ""} sizes="thumb" className="h-full w-full object-cover" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="display block text-base leading-snug group-hover:underline">{s.title}</span>
                        <span className="mt-0.5 block text-xs text-muted" title={`${s.active_minutes} min hands-on, ${s.total_minutes} min total`}>
                          {s.cuisine} · {s.active_minutes} min hands-on · {s.total_minutes} total
                        </span>
                      </span>
                      <ArrowUpRight size={14} className="shrink-0 text-muted" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">There are no other similar recipes. Generate some here.</p>
          )}
          <button type="button" className="btn mt-4 w-full" onClick={() => setSimilarOpen(true)} disabled={Boolean(similarRun)}>
            <Sparkles size={15} /> Generate similar recipes
          </button>
        </div>
        <div className="aside-note">
          <p className="display text-xl">Your taste keeps evolving.</p>
          <p className="mt-2 text-sm text-muted">Tell the agent what you love, and what you would change. Every little detail helps.</p>
          <button type="button" className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline" onClick={() => openDrawer({ recipeId: recipe.id, recipeTitle: recipe.title })}>
            Leave a note <ArrowUpRight size={14} />
          </button>
        </div>
      </aside>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this recipe?"
        body={`“${recipe.title}” and its photos will be removed from your library. The agent will no longer see your rating or notes for it. This cannot be undone.`}
        confirmLabel="Delete recipe"
        busy={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={remove}
      />
      <SimilarModal open={similarOpen} onClose={() => setSimilarOpen(false)} recipeId={recipe.id} recipeTitle={recipe.title} onStarted={setSimilarRun} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium capitalize">{value}</dd>
    </div>
  );
}
