import { consolidateIngredients, type ConsolidatedLine } from "@/lib/groups";
import type { Ingredient } from "@/lib/types";

/**
 * Shopping lists for the gather cart. Builds on the group consolidation and
 * adds two things: pantry staples are separated (the person said to skip
 * them), and each line carries the fields the fulfilling agent reports back.
 */

/** Ingredient keys most kitchens already have. Matched as whole words on the key. */
const STAPLE_PATTERNS: RegExp[] = [
  /^(sea_salt|salt|kosher_salt|flaky_salt|black_pepper|pepper|white_pepper)$/,
  /(olive_oil|neutral_oil|vegetable_oil|canola_oil|sesame_oil|oil)$/,
  /vinegar$/,
  /^(sugar|brown_sugar|honey|maple_syrup)$/,
  /^(water|ice)$/,
  /^(flour|cornstarch|baking_powder|baking_soda|vanilla_extract)$/,
  /^(cumin|smoked_paprika|paprika|oregano|cinnamon|cardamom|turmeric|chili_flakes|cayenne|coriander_seed|garlic_powder|onion_powder|bay_leaf|espresso_powder|nutmeg|cloves)$/,
  /^(soy_sauce|fish_sauce|cooking_stock|chicken_stock|vegetable_stock|stock)$/,
];

export function isStaple(ingredientKey: string): boolean {
  const key = ingredientKey.toLowerCase();
  return STAPLE_PATTERNS.some((p) => p.test(key));
}

export type ShoppingItemStatus = "pending" | "added" | "skipped" | "not_found" | "have_it";

export interface ShoppingItem extends ConsolidatedLine {
  staple: boolean;
  status: ShoppingItemStatus;
  /** What the agent actually put in the cart, if anything. */
  product?: string;
  note?: string;
}

export function buildShoppingItems(recipes: Array<{ title: string; ingredients: Ingredient[] }>, skipStaples: boolean): ShoppingItem[] {
  return consolidateIngredients(recipes).map((line) => {
    const staple = isStaple(line.ingredient_key);
    return { ...line, staple, status: staple && skipStaples ? "have_it" : "pending" };
  });
}

/** "Harissa chicken + 2 more · Sep 13": the placeholder name for a run. */
export function autoRunName(titles: string[], date = new Date()): string {
  const when = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (titles.length === 0) return `Shopping · ${when}`;
  const first = titles[0].split(/ with | and /i)[0].split(":")[0].trim();
  const short = first.length > 32 ? `${first.slice(0, 30).trim()}…` : first;
  return titles.length === 1 ? `${short} · ${when}` : `${short} + ${titles.length - 1} more · ${when}`;
}

export function summarize(items: ShoppingItem[]): { added: number; skipped: number; not_found: number; have_it: number; pending: number } {
  const s = { added: 0, skipped: 0, not_found: 0, have_it: 0, pending: 0 };
  for (const i of items) s[i.status]++;
  return s;
}
