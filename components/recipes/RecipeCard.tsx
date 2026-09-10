"use client";

import Link from "next/link";
import { Heart, MessageCircle, Timer } from "lucide-react";
import type { RecipeCard as RecipeCardData } from "@/lib/types";
import { findCatalogItem } from "@/lib/catalog";
import { useShell } from "@/components/shell/ShellProvider";

/**
 * Grid card: image-first, with badges that answer "what kind of food is
 * this" at a glance. The chat icon appears on hover and opens the
 * instruction drawer scoped to this recipe.
 */
export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  const { openDrawer } = useShell();
  const hero = recipe.images.find((i) => i.status === "done" && i.url) ?? null;
  const pending = recipe.images.some((i) => i.status === "pending");
  const health = findCatalogItem("health", recipe.health_profile)?.label ?? recipe.health_profile;
  const presentation = findCatalogItem("presentation", recipe.presentation)?.label ?? recipe.presentation;

  return (
    <article className="group card relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
      <Link href={`/recipes/${recipe.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.url ?? undefined} alt={recipe.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
          ) : (
            <div className={`h-full w-full ${pending ? "shimmer" : ""} grid place-items-center`}>
              {!pending && <span className="text-xs text-muted">No image</span>}
            </div>
          )}
          {recipe.favorite && (
            <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-surface/90 shadow" aria-label="Favorite">
              <Heart size={15} fill="var(--accent)" style={{ color: "var(--accent)" }} />
            </span>
          )}
          {recipe.status === "candidate" && <span className="badge absolute right-3 top-3 bg-surface/90">Draft</span>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="badge">{recipe.cuisine}</span>
          <span className="badge">{recipe.dish_type}</span>
          <span className="badge" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{health}</span>
          <span className="badge">{presentation}</span>
        </div>
        <Link href={`/recipes/${recipe.id}`} className="display text-lg leading-snug hover:underline">
          {recipe.title}
        </Link>
        <p className="line-clamp-2 text-sm text-muted">{recipe.summary_poetic}</p>
        <div className="mt-auto flex items-center justify-between pt-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><Timer size={13} /> {recipe.total_minutes} min · {recipe.servings} servings</span>
          {recipe.rating && <span>{"★".repeat(recipe.rating)}</span>}
        </div>
      </div>
      <button
        type="button"
        aria-label={`Tell the agent about ${recipe.title}`}
        title="Tell the agent about this recipe"
        onClick={() => openDrawer({ recipeId: recipe.id, recipeTitle: recipe.title })}
        className="absolute bottom-4 right-3 grid h-9 w-9 place-items-center rounded-full bg-surface text-ink opacity-0 shadow transition hover:bg-accent hover:text-accent-ink focus:opacity-100 group-hover:opacity-100"
      >
        <MessageCircle size={16} />
      </button>
    </article>
  );
}
