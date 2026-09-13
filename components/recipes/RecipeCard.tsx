"use client";

import Link from "next/link";
import { Pic } from "@/components/ui/Pic";
import { Hand, Heart, MessageCircle, Star, Timer } from "lucide-react";
import type { RecipeCard as RecipeCardData } from "@/lib/types";
import { useShell } from "@/components/shell/ShellProvider";
import { addedLabel } from "@/lib/client/format";

/**
 * Library card. Image first, one quiet eyebrow (cuisine and dish type), a
 * serif title, two lines of summary and a meta row. Health profile and
 * presentation live in the filters and on the detail page, not here.
 * The chat icon sits in the meta row and reveals on hover, focus, or touch.
 */
export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  const { openDrawer } = useShell();
  const hero = recipe.images.find((i) => i.status === "done" && i.url) ?? null;
  const pending = recipe.images.some((i) => i.status === "pending");

  return (
    <article className="group card relative flex flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]">
      <Link href={`/recipes/${recipe.id}`} className="block" aria-label={`View ${recipe.title}`}>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
          {hero ? (
            <Pic src={hero.url ?? ""} sizes="card" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
          ) : (
            <div className={`h-full w-full ${pending ? "shimmer" : ""} grid place-items-center`}>
              {!pending && <span className="text-xs text-muted">No image</span>}
            </div>
          )}
          {recipe.favorite && (
            <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-surface/90 shadow" aria-label="Favorite">
              <Heart size={14} fill="currentColor" style={{ color: "var(--accent)" }} />
            </span>
          )}
          {recipe.status === "candidate" && <span className="badge absolute left-3 top-3 bg-surface/90">Draft</span>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="eyebrow">
          {recipe.cuisine} · {recipe.dish_type}
        </p>
        <Link href={`/recipes/${recipe.id}`} className="display text-xl leading-snug hover:underline">
          {recipe.title}
        </Link>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{recipe.summary_poetic}</p>
        <div className="mt-auto flex items-center gap-3 border-t border-line pt-3 text-xs text-muted">
          {/* Hands-on time first and in ink: it is the number that decides a weeknight. */}
          <span className="inline-flex items-center gap-1 font-medium text-ink" title={`${recipe.active_minutes} min of your time (hands-on)`}>
            <Hand size={13} /> {recipe.active_minutes} min
          </span>
          <span className="inline-flex items-center gap-1" title={`${recipe.total_minutes} min start to finish, including unattended time`}>
            <Timer size={13} /> {recipe.total_minutes} min
          </span>
          <span>{recipe.servings} serv.</span>
          {recipe.rating && <span className="inline-flex items-center gap-0.5"><Star size={12} fill="currentColor" style={{ color: "var(--gold)" }} /> {recipe.rating}</span>}
          <span className="ml-auto" title={`Added ${new Date(recipe.created_at).toLocaleString()}`}>{addedLabel(recipe.created_at)}</span>
          <button
            type="button"
            aria-label={`Tell the agent about ${recipe.title}`}
            title="Tell the agent about this recipe"
            onClick={() => openDrawer({ recipeId: recipe.id, recipeTitle: recipe.title })}
            className="card-chat grid h-8 w-8 place-items-center rounded-full text-ink opacity-0 transition hover:bg-surface-2 focus:opacity-100 group-hover:opacity-100"
          >
            <MessageCircle size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
