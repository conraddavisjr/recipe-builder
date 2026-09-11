import type { Ingredient } from "@/lib/types";

/**
 * Consolidate the ingredients of several recipes into one shopping list.
 * Lines merge when the ingredient key and unit match (quantities add up);
 * the same ingredient in different units stays as separate lines so
 * nothing is silently converted. Every line remembers which recipes need it.
 */

export interface ConsolidatedLine {
  ingredient_key: string;
  name: string;
  unit: string;
  quantity: number | null;
  optional: boolean;
  /** Titles of the recipes that use this line. */
  recipes: string[];
  /** Original preparations, deduplicated, for the cook's reference. */
  preparations: string[];
}

const normUnit = (u: string) => u.trim().toLowerCase().replace(/\.$/, "").replace(/s$/, "");

export function consolidateIngredients(recipes: Array<{ title: string; ingredients: Ingredient[] }>): ConsolidatedLine[] {
  const lines = new Map<string, ConsolidatedLine>();
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const unit = normUnit(ing.unit);
      const key = `${ing.ingredient_key.toLowerCase()}|${unit}`;
      const existing = lines.get(key);
      if (existing) {
        if (existing.quantity !== null && ing.quantity !== null) existing.quantity += ing.quantity;
        else if (ing.quantity === null) existing.quantity = existing.quantity; // "to taste" adds nothing
        existing.optional = existing.optional && ing.optional;
        if (!existing.recipes.includes(recipe.title)) existing.recipes.push(recipe.title);
        if (ing.preparation && !existing.preparations.includes(ing.preparation)) existing.preparations.push(ing.preparation);
      } else {
        lines.set(key, {
          ingredient_key: ing.ingredient_key,
          name: ing.name,
          unit: ing.unit,
          quantity: ing.quantity,
          optional: ing.optional,
          recipes: [recipe.title],
          preparations: ing.preparation ? [ing.preparation] : [],
        });
      }
    }
  }
  return [...lines.values()].sort((a, b) => b.recipes.length - a.recipes.length || a.name.localeCompare(b.name));
}
