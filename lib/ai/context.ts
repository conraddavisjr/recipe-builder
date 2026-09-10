import { CATALOG, findCatalogItem } from "@/lib/catalog";
import type {
  Inspiration,
  Instruction,
  ProfileCategory,
  ProfileSelection,
  Recipe,
  Settings,
  SimilarityAxis,
} from "@/lib/types";

/**
 * The recommendation context: everything the model is shown about the
 * person, assembled from plain rows so it is unit-testable without a
 * database, and rendered deterministically so identical state produces
 * identical prompts.
 */

export type GenerationMode =
  | { kind: "autonomous" }
  | { kind: "manual" }
  | { kind: "generator"; prompt: string }
  | { kind: "similar"; recipe: Recipe; axes: SimilarityAxis[] }
  | { kind: "inspiration"; inspiration: Inspiration };

export interface RecommendationContext {
  settings: Pick<Settings, "suggestion_count" | "servings" | "max_cook_minutes" | "images_per_recipe">;
  profile: Record<ProfileCategory, Array<{ key: string; label: string; description: string }>>;
  truths: Array<{ body: string; created_at: string }>;
  /** Newest first. */
  preferences: Array<{ body: string; created_at: string; recipe_title?: string | null }>;
  inspirations: Array<{
    dish_name: string;
    restaurant_name: string;
    city: string;
    notes: string;
    cuisine?: string;
    flavor_notes?: string[];
    techniques?: string[];
    researched_ingredients: Array<{ name: string; provenance: string; note?: string }>;
    user_corrections: Array<{ name: string; note: string }>;
  }>;
  feedback: Array<{
    title: string;
    cuisine: string;
    dish_type: string;
    favorite: boolean;
    rating: number | null;
    feedback: string | null;
    flavor_tags: string[];
  }>;
  recent_titles: string[];
}

export interface ContextRows {
  settings: Settings;
  selections: ProfileSelection[];
  instructions: Instruction[];
  inspirations: Inspiration[];
  feedback: RecommendationContext["feedback"];
  recentTitles: string[];
  /** Titles for instructions attached to a recipe, keyed by recipe id. */
  recipeTitles?: Map<string, string>;
}

export function buildContext(rows: ContextRows): RecommendationContext {
  const profile = Object.fromEntries(
    (Object.keys(CATALOG) as ProfileCategory[]).map((category) => [
      category,
      rows.selections
        .filter((s) => s.category === category && s.active)
        .map((s) => {
          const item = findCatalogItem(category, s.key);
          return { key: s.key, label: item?.label ?? s.key, description: item?.description ?? "" };
        })
        .sort((a, b) => a.key.localeCompare(b.key)),
    ]),
  ) as RecommendationContext["profile"];

  const active = rows.instructions.filter((i) => i.active);
  const byNewest = (a: Instruction, b: Instruction) => b.created_at.localeCompare(a.created_at);

  return {
    settings: {
      suggestion_count: rows.settings.suggestion_count,
      servings: rows.settings.servings,
      max_cook_minutes: rows.settings.max_cook_minutes,
      images_per_recipe: rows.settings.images_per_recipe,
    },
    profile,
    truths: active
      .filter((i) => i.tier === "truth")
      .sort(byNewest)
      .map((i) => ({ body: i.body, created_at: i.created_at })),
    preferences: active
      .filter((i) => i.tier === "preference")
      .sort(byNewest)
      .map((i) => ({
        body: i.body,
        created_at: i.created_at,
        recipe_title: i.recipe_id ? rows.recipeTitles?.get(i.recipe_id) ?? null : null,
      })),
    inspirations: rows.inspirations.map((ins) => ({
      dish_name: ins.dish_name,
      restaurant_name: ins.restaurant_name,
      city: ins.city,
      notes: ins.notes,
      cuisine: ins.analysis?.cuisine,
      flavor_notes: ins.analysis?.flavor_notes,
      techniques: ins.analysis?.techniques,
      researched_ingredients: (ins.analysis?.ingredients ?? []).map((i) => ({
        name: i.name,
        provenance: i.provenance,
        note: i.note || undefined,
      })),
      // Corrections are included unconditionally: they are ground truth even
      // when the inspiration has never been rated or discussed.
      user_corrections: ins.user_ingredients,
    })),
    feedback: rows.feedback,
    recent_titles: rows.recentTitles,
  };
}

function section(title: string, body: string): string {
  return `## ${title}\n${body.trim() || "(none)"}\n`;
}

function list(items: string[]): string {
  return items.map((i) => `- ${i}`).join("\n");
}

/** Deterministic markdown rendering of the context for the user message. */
export function renderContext(ctx: RecommendationContext): string {
  const p = ctx.profile;
  const fmt = (items: Array<{ label: string; description: string }>) =>
    list(items.map((i) => `${i.label}: ${i.description}`));

  const parts = [
    section("Settings", list([
      `Servings per recipe: ${ctx.settings.servings}`,
      `Maximum total cooking time: ${ctx.settings.max_cook_minutes} minutes`,
    ])),
    section("Cuisines loved", fmt(p.cuisine_love)),
    section("Cuisines to avoid entirely", fmt(p.cuisine_avoid)),
    section("Flavor profiles to emphasize", fmt(p.flavor)),
    section("Presentation preferences", fmt(p.presentation)),
    section("Health profiles to cover across the batch", fmt(p.health)),
    section("Dietary absolutes (hard constraints)", fmt(p.diet_absolute)),
    section("Cookware available", fmt(p.cookware)),
    section("Absolute truths (never override)", list(ctx.truths.map((t) => t.body))),
    section(
      "Preferences (newest first; newer overrides older when they conflict)",
      list(ctx.preferences.map((pr) => `${pr.created_at.slice(0, 10)}${pr.recipe_title ? ` (about "${pr.recipe_title}")` : ""}: ${pr.body}`)),
    ),
    section(
      "Restaurant inspirations",
      ctx.inspirations
        .map((ins) => {
          const head = `${ins.dish_name}${ins.restaurant_name ? ` at ${ins.restaurant_name}` : ""}${ins.city ? `, ${ins.city}` : ""}`;
          const lines = [
            ins.notes ? `  Notes: ${ins.notes}` : "",
            ins.cuisine ? `  Cuisine: ${ins.cuisine}` : "",
            ins.flavor_notes?.length ? `  Flavor: ${ins.flavor_notes.join(", ")}` : "",
            ins.techniques?.length ? `  Techniques: ${ins.techniques.join(", ")}` : "",
            ins.researched_ingredients.length
              ? `  Researched ingredients: ${ins.researched_ingredients.map((i) => `${i.name} [${i.provenance}]`).join(", ")}`
              : "",
            ins.user_corrections.length
              ? `  User-corrected ingredients (ground truth): ${ins.user_corrections.map((c) => (c.note ? `${c.name} (${c.note})` : c.name)).join(", ")}`
              : "",
          ].filter(Boolean);
          return `- ${head}\n${lines.join("\n")}`;
        })
        .join("\n"),
    ),
    section(
      "Feedback on earlier recipes",
      list(
        ctx.feedback.map((f) => {
          const marks = [f.favorite ? "favorite" : "", f.rating ? `${f.rating}/5` : ""].filter(Boolean).join(", ");
          return `${f.title} (${f.cuisine}, ${f.dish_type}${marks ? `; ${marks}` : ""})${f.feedback ? `: "${f.feedback}"` : ""}`;
        }),
      ),
    ),
    section("Recent recipe titles (do not repeat)", list(ctx.recent_titles)),
  ];
  return parts.join("\n");
}

/** The request paragraph appended after the context, per generation mode. */
export function renderRequest(mode: GenerationMode, count: number, imagesPerRecipe: number): string {
  const base = `Produce exactly ${count} recipe${count === 1 ? "" : "s"} with ${imagesPerRecipe} image prompt${imagesPerRecipe === 1 ? "" : "s"} each.`;
  switch (mode.kind) {
    case "autonomous":
      return `${base} This is a scheduled batch: cover the range of the person's health profiles and emphasized flavors, and respond to their most recent feedback and preferences.`;
    case "manual":
      return `${base} This batch was requested by the person just now; treat it like a scheduled batch with the freshest possible reading of their preferences.`;
    case "generator":
      return `${base} The person typed this request; honor it above the general profile while still respecting every hard constraint:\n\n"""${mode.prompt}"""`;
    case "similar": {
      const r = mode.recipe;
      const axes = mode.axes.map((a) => ({ ingredients: "the core ingredients", taste: "the flavor profile and balance", presentation: "the presentation and plating style", cuisine: "the cuisine", dish_type: `the dish type (${r.dish_type})` })[a]).join("; ");
      return `${base} Each must be clearly similar to the recipe below in ${axes}, while being a genuinely different dish (not a variation).\n\nReference recipe: ${r.title}\nCuisine: ${r.cuisine}. Dish type: ${r.dish_type}. Presentation: ${r.presentation}. Flavor tags: ${r.flavor_tags.join(", ")}.\nSummary: ${r.summary_poetic}\nIngredients: ${r.ingredients.map((i) => i.name).join(", ")}`;
    }
    case "inspiration": {
      const ins = mode.inspiration;
      const corrections = ins.user_ingredients.map((c) => (c.note ? `${c.name} (${c.note})` : c.name)).join(", ");
      return `${base} Recreate, at home and with the person's cookware, the dish "${ins.dish_name}"${ins.restaurant_name ? ` from ${ins.restaurant_name}` : ""}${ins.city ? ` in ${ins.city}` : ""}. ${count > 1 ? "The first recipe should be the faithful recreation; the others should be close relatives that keep its spirit." : ""}${ins.analysis ? `\n\nResearch: ${ins.analysis.restaurant_summary} ${ins.analysis.menu_description} Photo observations: ${ins.analysis.photo_observations}. Ingredients: ${ins.analysis.ingredients.map((i) => `${i.name} [${i.provenance}]`).join(", ")}. Techniques: ${ins.analysis.techniques.join(", ")}.` : ""}${corrections ? `\n\nUser-corrected ingredients (ground truth): ${corrections}` : ""}`;
    }
  }
}
