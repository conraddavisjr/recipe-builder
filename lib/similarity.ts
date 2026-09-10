import type { Ingredient, SimilarityAxis } from "@/lib/types";

/**
 * Structured similarity between recipes. No embeddings: for a personal
 * library of hundreds of recipes, overlap on cuisine, dish type, flavor
 * tags, ingredients and presentation is both cheaper and more explainable.
 */

export interface SimilarityInput {
  id: string;
  cuisine: string;
  dish_type: string;
  presentation: string;
  health_profile: string;
  flavor_tags: string[];
  tags: string[];
  ingredients: Pick<Ingredient, "ingredient_key">[];
}

const WEIGHTS: Record<SimilarityAxis, number> = {
  cuisine: 3,
  dish_type: 3,
  taste: 4,
  ingredients: 4,
  presentation: 1,
};

function jaccard(a: Iterable<string>, b: Iterable<string>): number {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter++;
  return inter / (sa.size + sb.size - inter);
}

const norm = (s: string) => s.trim().toLowerCase();

/** Score in [0, 1]. `axes` restricts which dimensions count (all by default). */
export function similarity(a: SimilarityInput, b: SimilarityInput, axes: SimilarityAxis[] = ["cuisine", "dish_type", "taste", "ingredients", "presentation"]): number {
  let total = 0;
  let score = 0;
  for (const axis of axes) {
    const w = WEIGHTS[axis];
    total += w;
    switch (axis) {
      case "cuisine": score += w * (norm(a.cuisine) === norm(b.cuisine) ? 1 : 0); break;
      case "dish_type": score += w * (norm(a.dish_type) === norm(b.dish_type) ? 1 : 0); break;
      case "presentation": score += w * (norm(a.presentation) === norm(b.presentation) ? 1 : 0); break;
      case "taste": score += w * jaccard(a.flavor_tags.map(norm), b.flavor_tags.map(norm)); break;
      case "ingredients":
        score += w * jaccard(a.ingredients.map((i) => norm(i.ingredient_key)), b.ingredients.map((i) => norm(i.ingredient_key)));
        break;
    }
  }
  return total === 0 ? 0 : score / total;
}

/** Ranked neighbors of `target` from `library`, excluding itself, above `minScore`. */
export function findSimilar<T extends SimilarityInput>(target: SimilarityInput, library: T[], opts: { limit?: number; minScore?: number } = {}): Array<{ recipe: T; score: number }> {
  const limit = opts.limit ?? 6;
  const minScore = opts.minScore ?? 0.25;
  return library
    .filter((r) => r.id !== target.id)
    .map((recipe) => ({ recipe, score: similarity(target, recipe) }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
